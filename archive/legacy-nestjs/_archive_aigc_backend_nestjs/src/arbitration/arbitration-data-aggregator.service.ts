import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

// 导入数据实体
import { ProcessedEvents } from '../entities/processed-events.entity';
import { GeneratedReports } from '../entities/generated-reports.entity';
import { FinancialReports } from '../entities/financial-reports.entity';
import { QuantSignals } from '../entities/quant-signals.entity';
import { MoneyFlow } from '../entities/money-flow.entity';
import { TopList } from '../entities/top-list.entity';
import { ChipDistribution } from '../entities/chip-distribution.entity';
import { HumanFeedbackLoop } from '../entities/human-feedback-loop.entity';

// 导入接口定义
import {
  ArbitrationCaseData,
  RawTextData,
  FinancialSnapshot,
  QuantSignals as QuantSignalsData,
  FlowAndChipsData,
  HistoricalArbitrations
} from '../interfaces/arbitration.interface';

@Injectable()
export class ArbitrationDataAggregatorService {
  private readonly logger = new Logger(ArbitrationDataAggregatorService.name);

  constructor(
    @InjectRepository(ProcessedEvents)
    private eventsRepository: Repository<ProcessedEvents>,
    @InjectRepository(GeneratedReports)
    private reportsRepository: Repository<GeneratedReports>,
    @InjectRepository(FinancialReports)
    private financialRepository: Repository<FinancialReports>,
    @InjectRepository(QuantSignals)
    private quantRepository: Repository<QuantSignals>,
    @InjectRepository(MoneyFlow)
    private flowRepository: Repository<MoneyFlow>,
    @InjectRepository(TopList)
    private topListRepository: Repository<TopList>,
    @InjectRepository(ChipDistribution)
    private chipRepository: Repository<ChipDistribution>,
    @InjectRepository(HumanFeedbackLoop)
    private feedbackRepository: Repository<HumanFeedbackLoop>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  /**
   * 获取仲裁案例完整数据
   * 并行聚合五大核心数据面板的所有信息
   */
  async getArbitrationCaseData(
    caseId: string,
    includePanels?: string[]
  ): Promise<ArbitrationCaseData> {
    this.logger.log(`开始聚合仲裁案例数据: ${caseId}`);

    const [stockCode, date] = caseId.split('_');
    if (!stockCode || !date) {
      throw new NotFoundException('无效的案例ID格式');
    }

    // 检查缓存
    const cacheKey = `arbitration_case_${caseId}`;
    const cachedData = await this.cacheManager.get<ArbitrationCaseData>(cacheKey);
    if (cachedData) {
      this.logger.log(`从缓存获取数据: ${caseId}`);
      return cachedData;
    }

    // 默认包含所有面板
    const panels = includePanels || [
      'raw_text',
      'financial_snapshot',
      'quant_signals',
      'flow_and_chips',
      'historical_arbitrations'
    ];

    try {
      // 并行获取所有面板数据
      const panelPromises = [];

      if (panels.includes('raw_text')) {
        panelPromises.push(this.getRawTextData(caseId));
      }
      if (panels.includes('financial_snapshot')) {
        panelPromises.push(this.getFinancialSnapshot(stockCode));
      }
      if (panels.includes('quant_signals')) {
        panelPromises.push(this.getQuantSignals(stockCode, date));
      }
      if (panels.includes('flow_and_chips')) {
        panelPromises.push(this.getFlowAndChipsData(stockCode, date));
      }
      if (panels.includes('historical_arbitrations')) {
        panelPromises.push(this.getHistoricalArbitrations(stockCode, await this.getIndustry(stockCode)));
      }

      const panelResults = await Promise.all(panelPromises);

      const result: ArbitrationCaseData = {
        case_id: caseId,
        stock_code: stockCode,
        date: date,
        panels: this.organizePanelData(panels, panelResults),
        metadata: {
          generated_at: new Date().toISOString(),
          data_freshness: await this.getDataFreshness(caseId),
          panel_count: panels.length,
          processing_time_ms: 0 // 实际实现中需要计算处理时间
        }
      };

      // 缓存结果（5分钟）
      await this.cacheManager.set(cacheKey, result, 300000);

      this.logger.log(`仲裁案例数据聚合完成: ${caseId}`);
      return result;

    } catch (error) {
      this.logger.error(`聚合仲裁案例数据失败: ${caseId}`, error);
      throw error;
    }
  }

  /**
   * 获取原始文本数据
   */
  async getRawTextData(caseId: string): Promise<RawTextData> {
    const [stockCode, date] = caseId.split('_');

    const [events, reports] = await Promise.all([
      this.eventsRepository.find({
        where: {
          stock_code: stockCode,
          event_date: new Date(date)
        },
        order: { created_at: 'DESC' },
        take: 20
      }),
      this.reportsRepository.find({
        where: {
          stock_code: stockCode,
          report_date: new Date(date)
        },
        order: { created_at: 'DESC' }
      })
    ]);

    return {
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        content: event.content,
        source: event.source,
        timestamp: event.created_at,
        highlighted_sentences: this.highlightKeywords(event.content, reports)
      })),
      reports: reports.map(report => ({
        id: report.id,
        conclusion: report.conclusion,
        confidence: report.confidence,
        reasoning: report.reasoning
      }))
    };
  }

  /**
   * 获取财务数据快照
   */
  async getFinancialSnapshot(stockCode: string): Promise<FinancialSnapshot> {
    const financialData = await this.financialRepository.find({
      where: { stock_code: stockCode },
      order: { report_date: 'DESC' },
      take: 8
    });

    return {
      stock_code: stockCode,
      quarters: financialData.map(quarter => ({
        quarter: quarter.quarter,
        revenue: quarter.revenue,
        revenue_growth: quarter.revenue_growth,
        net_profit: quarter.net_profit,
        net_profit_growth: quarter.net_profit_growth,
        gross_margin: quarter.gross_margin,
        net_margin: quarter.net_margin,
        operating_cash_flow: quarter.operating_cash_flow,
        r_d_ratio: quarter.r_d_ratio,
        contract_liabilities: quarter.contract_liabilities
      }))
    };
  }

  /**
   * 获取量化信号数据
   */
  async getQuantSignals(stockCode: string, date: string): Promise<QuantSignalsData> {
    const [stockSignals, marketSignals, mdaFactors] = await Promise.all([
      this.quantRepository.find({
        where: {
          stock_code: stockCode,
          signal_date: new Date(date),
          signal_type: 'stock'
        }
      }),
      this.quantRepository.find({
        where: {
          signal_date: new Date(date),
          signal_type: 'market'
        }
      }),
      this.quantRepository.find({
        where: {
          stock_code: stockCode,
          signal_date: new Date(date),
          signal_type: 'mda'
        }
      })
    ]);

    return {
      stock_signals: {
        return_z_score: stockSignals[0]?.return_z_score || 0,
        volume_z_score: stockSignals[0]?.volume_z_score || 0,
        mda_credibility_score: mdaFactors[0]?.mda_credibility_score || 0,
        mda_consistency_score: mdaFactors[0]?.mda_consistency_score || 0
      },
      market_signals: {
        macro_risk_z: marketSignals[0]?.macro_risk_z || 0,
        dominant_style: marketSignals[0]?.dominant_style || 'unknown',
        industry_performance: marketSignals[0]?.industry_performance || 0,
        concept_performance: marketSignals[0]?.concept_performance || {}
      }
    };
  }

  /**
   * 获取资金流向与筹码分布数据
   */
  async getFlowAndChipsData(stockCode: string, date: string): Promise<FlowAndChipsData> {
    const [moneyFlow, topList, chipDist] = await Promise.all([
      this.flowRepository.find({
        where: {
          stock_code: stockCode,
          flow_date: new Date(date)
        },
        order: { flow_date: 'DESC' },
        take: 5
      }),
      this.topListRepository.findOne({
        where: {
          stock_code: stockCode,
          list_date: new Date(date)
        }
      }),
      this.chipRepository.findOne({
        where: {
          stock_code: stockCode,
          dist_date: new Date(date)
        }
      })
    ]);

    return {
      money_flow: {
        daily_flows: moneyFlow.map(day => ({
          date: day.flow_date,
          main_net_inflow: day.main_net_inflow,
          super_large_net_inflow: day.super_large_net_inflow
        }))
      },
      top_list: topList ? {
        date: topList.list_date,
        reason: topList.reason,
        buy_seats: topList.buy_seats,
        sell_seats: topList.sell_seats
      } : null,
      chip_distribution: chipDist ? {
        current_price: chipDist.current_price,
        cost_peaks: chipDist.cost_peaks,
        cost_range_90: chipDist.cost_range_90,
        avg_cost: chipDist.avg_cost,
        profit_ratio: chipDist.profit_ratio
      } : null
    };
  }

  /**
   * 获取历史仲裁记录
   */
  async getHistoricalArbitrations(stockCode: string, industry: string): Promise<HistoricalArbitrations> {
    const [sameCompany, sameIndustry] = await Promise.all([
      this.feedbackRepository.find({
        where: {
          stock_code: stockCode,
          created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 过去一年
        },
        order: { created_at: 'DESC' },
        take: 10
      }),
      this.feedbackRepository.find({
        where: {
          industry: industry,
          created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        },
        order: { created_at: 'DESC' },
        take: 10
      })
    ]);

    return {
      same_company: sameCompany.map(arb => ({
        id: arb.id,
        date: arb.created_at,
        decision: arb.feedback_type,
        reasoning: arb.feedback_comment,
        confidence: arb.feedback_score
      })),
      same_industry: sameIndustry.map(arb => ({
        id: arb.id,
        stock_code: arb.stock_code,
        date: arb.created_at,
        decision: arb.feedback_type,
        reasoning: arb.feedback_comment
      }))
    };
  }

  /**
   * 高亮关键词
   */
  private highlightKeywords(content: string, reports: any[]): string[] {
    // 简单的关键词高亮实现
    const keywords = ['增长', '下降', '超预期', '不及预期', '利好', '利空'];
    const highlighted = [];

    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        highlighted.push(keyword);
      }
    }

    return highlighted;
  }

  /**
   * 获取行业信息
   */
  private async getIndustry(stockCode: string): Promise<string> {
    // 这里应该从数据库或外部API获取行业信息
    // 简化实现，返回默认值
    return 'unknown';
  }

  /**
   * 获取数据新鲜度
   */
  private async getDataFreshness(caseId: string): Promise<string> {
    // 返回数据的最新更新时间
    return new Date().toISOString();
  }

  /**
   * 组织面板数据
   */
  private organizePanelData(panels: string[], results: any[]): any {
    const organizedData = {};
    let resultIndex = 0;

    for (const panel of panels) {
      if (resultIndex < results.length) {
        organizedData[panel] = results[resultIndex];
        resultIndex++;
      }
    }

    return organizedData;
  }
}
