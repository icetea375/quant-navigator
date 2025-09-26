import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ArbitrationCaseEntity } from './entities/arbitration-case.entity';
import {
  ArbitrationCase,
  ArbitrationCaseListQuery,
  ArbitrationCaseListResponse,
  ArbitrationCaseDetail,
  HumanArbitrationDecision,
  ArbitrationStatusUpdate
} from './interfaces/arbitration.interface';

@Injectable()
export class ArbitrationService {
  constructor(
    @InjectRepository(ArbitrationCaseEntity)
    private readonly arbitrationCaseRepository: Repository<ArbitrationCaseEntity>,
  ) {}

  /**
   * 获取仲裁案件列表（分页、排序、筛选）
   */
  async getArbitrationCases(query: ArbitrationCaseListQuery): Promise<ArbitrationCaseListResponse> {
    const {
      page = 1,
      limit = 20,
      status,
      stockCode,
      startDate,
      endDate,
      sortBy = 'priority_score',
      sortOrder = 'DESC'
    } = query;

    const queryBuilder = this.arbitrationCaseRepository.createQueryBuilder('case');

    // 应用筛选条件
    if (status) {
      queryBuilder.andWhere('case.status = :status', { status });
    }

    if (stockCode) {
      queryBuilder.andWhere('case.stockCode = :stockCode', { stockCode });
    }

    if (startDate) {
      queryBuilder.andWhere('case.reportDate >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('case.reportDate <= :endDate', { endDate });
    }

    // 应用排序
    queryBuilder.orderBy(`case.${sortBy}`, sortOrder);

    // 应用分页
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // 执行查询
    const [cases, total] = await queryBuilder.getManyAndCount();

    return {
      cases: cases.map(case => this.mapEntityToCase(case)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * 获取单个仲裁案件详情（包含双脑报告）
   */
  async getArbitrationCaseDetail(caseId: string): Promise<ArbitrationCaseDetail> {
    const caseEntity = await this.arbitrationCaseRepository.findOne({
      where: { caseId }
    });

    if (!caseEntity) {
      throw new NotFoundException(`仲裁案件 ${caseId} 不存在`);
    }

    // 这里需要查询双脑报告，暂时返回模拟数据
    // 在实际实现中，需要调用相应的报告服务
    const qwenReport = await this.getQwenReport(caseEntity.qwenReportId);
    const doubaoReport = await this.getDoubaoReport(caseEntity.doubaoReportId);

    return {
      ...this.mapEntityToCase(caseEntity),
      qwenReport,
      doubaoReport
    };
  }

  /**
   * 更新仲裁案件状态
   */
  async updateArbitrationCaseStatus(
    caseId: string,
    statusUpdate: ArbitrationStatusUpdate
  ): Promise<ArbitrationCase> {
    const caseEntity = await this.arbitrationCaseRepository.findOne({
      where: { caseId }
    });

    if (!caseEntity) {
      throw new NotFoundException(`仲裁案件 ${caseId} 不存在`);
    }

    caseEntity.status = statusUpdate.status;
    caseEntity.updatedAt = new Date();

    if (statusUpdate.reason) {
      caseEntity.analysisMetadata = {
        ...caseEntity.analysisMetadata,
        statusUpdateReason: statusUpdate.reason
      };
    }

    const updatedCase = await this.arbitrationCaseRepository.save(caseEntity);
    return this.mapEntityToCase(updatedCase);
  }

  /**
   * 提交人类仲裁决策
   */
  async submitHumanArbitrationDecision(
    caseId: string,
    decision: HumanArbitrationDecision
  ): Promise<ArbitrationCase> {
    const caseEntity = await this.arbitrationCaseRepository.findOne({
      where: { caseId }
    });

    if (!caseEntity) {
      throw new NotFoundException(`仲裁案件 ${caseId} 不存在`);
    }

    if (caseEntity.status !== 'PENDING_HUMAN') {
      throw new BadRequestException(`案件 ${caseId} 状态不是待仲裁，无法提交决策`);
    }

    // 验证决策数据
    if (!decision.finalRecommendation || !['BUY', 'HOLD', 'SELL'].includes(decision.finalRecommendation)) {
      throw new BadRequestException('最终投资建议必须是 BUY、HOLD 或 SELL');
    }

    if (decision.confidenceLevel < 0 || decision.confidenceLevel > 100) {
      throw new BadRequestException('置信度必须在 0-100 之间');
    }

    if (!decision.reasoning || decision.reasoning.trim().length === 0) {
      throw new BadRequestException('仲裁理由不能为空');
    }

    // 更新案件
    caseEntity.status = 'ARBITRATED';
    caseEntity.humanDecision = {
      finalRecommendation: decision.finalRecommendation,
      confidenceLevel: decision.confidenceLevel,
      reasoning: decision.reasoning.trim(),
      keyDisagreements: decision.keyDisagreements?.trim() || '',
      arbitratorId: decision.arbitratorId
    };
    caseEntity.updatedAt = new Date();

    const updatedCase = await this.arbitrationCaseRepository.save(caseEntity);
    return this.mapEntityToCase(updatedCase);
  }

  /**
   * 获取仲裁案件统计信息
   */
  async getArbitrationStatistics(): Promise<{
    totalCases: number;
    pendingCases: number;
    arbitratedCases: number;
    ignoredCases: number;
    averageProcessingTime: number;
  }> {
    const totalCases = await this.arbitrationCaseRepository.count();

    const [pendingCases, arbitratedCases, ignoredCases] = await Promise.all([
      this.arbitrationCaseRepository.count({ where: { status: 'PENDING_HUMAN' } }),
      this.arbitrationCaseRepository.count({ where: { status: 'ARBITRATED' } }),
      this.arbitrationCaseRepository.count({ where: { status: 'IGNORED' } })
    ]);

    // 计算平均处理时间（已仲裁的案件）
    const arbitratedCasesWithTime = await this.arbitrationCaseRepository
      .createQueryBuilder('case')
      .select('AVG(EXTRACT(EPOCH FROM (case.updatedAt - case.createdAt))/3600)', 'avgHours')
      .where('case.status = :status', { status: 'ARBITRATED' })
      .getRawOne();

    const averageProcessingTime = arbitratedCasesWithTime?.avgHours || 0;

    return {
      totalCases,
      pendingCases,
      arbitratedCases,
      ignoredCases,
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100
    };
  }

  /**
   * 将实体映射为接口对象
   */
  private mapEntityToCase(entity: ArbitrationCaseEntity): ArbitrationCase {
    return {
      id: entity.id,
      caseId: entity.caseId,
      reportDate: entity.reportDate,
      stockCode: entity.stockCode,
      qwenReportId: entity.qwenReportId,
      doubaoReportId: entity.doubaoReportId,
      divergenceScore: Number(entity.divergenceScore),
      consensusSummary: entity.consensusSummary,
      conflictSummary: entity.conflictSummary,
      priorityScore: Number(entity.priorityScore),
      status: entity.status,
      analysisMetadata: entity.analysisMetadata || {},
      humanDecision: entity.humanDecision,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * 获取Qwen报告（模拟实现）
   */
  private async getQwenReport(reportId: string): Promise<any> {
    // 这里应该调用实际的报告服务
    // 暂时返回模拟数据
    return {
      id: reportId,
      content: 'Qwen事实归因报告内容...',
      summary: '基于基本面分析，该股票具有稳定的财务表现...',
      sentimentScore: 0.75,
      keywords: ['基本面', '财务表现', '行业地位'],
      entities: ['公司A', '行业B'],
      confidenceScore: 0.85,
      investmentRecommendation: 'BUY',
      mdaScores: {
        completenessScore: 85,
        consistencyScore: 78
      }
    };
  }

  /**
   * 获取豆包报告（模拟实现）
   */
  private async getDoubaoReport(reportId: string): Promise<any> {
    // 这里应该调用实际的报告服务
    // 暂时返回模拟数据
    return {
      id: reportId,
      content: '豆包舆情感知报告内容...',
      summary: '市场情绪偏向乐观，但存在短期波动风险...',
      sentimentScore: 0.65,
      keywords: ['市场情绪', '波动风险', '投资者信心'],
      entities: ['市场', '投资者'],
      confidenceScore: 0.72,
      investmentRecommendation: 'HOLD',
      sentimentAnalysis: {
        sentimentScore: 65,
        confidenceLevel: 0.72,
        riskFactors: ['政策风险', '市场波动'],
        marketConsensus: '市场普遍看好该股票',
        contrarianView: '部分分析师认为估值过高',
        realTimeEvents: ['重大公告发布', '行业政策变化']
      }
    };
  }
}
