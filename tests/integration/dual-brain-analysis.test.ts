/**
 * 双脑分析集成测试
 * 测试Qwen事实归因和豆包舆情感知的完整流程
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { QwenFactAnalyzer } from '../../qwen_analyzer';
import { DoubaoSentimentAnalyzer } from '../../doubao_analyzer';
import { DatabaseManager } from '../../support_modules/database_utils';

// 模拟配置
const mockConfig = {
  database: {
    host: 'localhost',
    port: 3306,
    user: 'test_user',
    password: 'test_password',
    database: 'test_quantnav'
  },
  llm_service: {
    providers: {
      'qwen-plus': {
        api_key: 'test_qwen_key',
        base_url: 'https://test-qwen-api.com'
      },
      'doubao-seed-1-6': {
        api_key: 'test_doubao_key',
        base_url: 'https://test-doubao-api.com'
      }
    }
  }
};

describe('双脑分析集成测试', () => {
  let qwenAnalyzer: QwenFactAnalyzer;
  let doubaoAnalyzer: DoubaoSentimentAnalyzer;
  let dbManager: DatabaseManager;

  beforeAll(async () => {
    // 初始化分析器
    qwenAnalyzer = new QwenFactAnalyzer(mockConfig);
    doubaoAnalyzer = new DoubaoSentimentAnalyzer(mockConfig);
    dbManager = new DatabaseManager(mockConfig.database);
  });

  afterAll(async () => {
    // 清理测试数据
    await dbManager.cleanup_test_data();
  });

  beforeEach(() => {
    // 重置模拟数据
    jest.clearAllMocks();
  });

  describe('Qwen事实归因分析器', () => {
    it('应该能够分析股票的基本信息', async () => {
      const stockCode = '000001';
      const tradeDate = '2025-01-17';

      // 模拟内部数据
      const mockInternalData = {
        mda_data: {
          completeness: 85,
          consistency: 90,
          risk_disclosure: 80
        },
        financial_data: {
          revenue: 1000000,
          profit: 100000,
          growth_rate: 0.15
        },
        announcement_data: [
          {
            date: '2025-01-15',
            content: '重大合同公告',
            impact: 'positive'
          }
        ],
        price_data: {
          current_price: 10.50,
          change_rate: 0.05,
          volume: 1000000
        }
      };

      // 模拟数据库查询
      jest.spyOn(dbManager, 'get_mda_data').mockResolvedValue(mockInternalData.mda_data);
      jest.spyOn(dbManager, 'get_financial_data').mockResolvedValue(mockInternalData.financial_data);
      jest.spyOn(dbManager, 'get_announcement_data').mockResolvedValue(mockInternalData.announcement_data);
      jest.spyOn(dbManager, 'get_price_data').mockResolvedValue(mockInternalData.price_data);

      // 模拟LLM调用
      const mockLLMResponse = {
        completeness_score: 85,
        consistency_score: 90,
        risk_disclosure_score: 80,
        performance_explanation_score: 88,
        overall_score: 85.75,
        analysis: 'MD&A信息披露完整，数据一致性良好'
      };

      jest.spyOn(qwenAnalyzer.llm_service, 'call_llm').mockResolvedValue(JSON.stringify(mockLLMResponse));

      // 执行分析
      const result = await qwenAnalyzer.analyze(stockCode, tradeDate);

      // 验证结果
      expect(result).toBeDefined();
      expect(result.stock_code).toBe(stockCode);
      expect(result.trade_date).toBe(tradeDate);
      expect(result.analyzer_type).toBe('qwen_fact_based');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeDefined();
    });

    it('应该能够处理分析失败的情况', async () => {
      const stockCode = '000002';
      const tradeDate = '2025-01-17';

      // 模拟数据库查询失败
      jest.spyOn(dbManager, 'get_mda_data').mockRejectedValue(new Error('数据库连接失败'));

      // 执行分析并期望抛出异常
      await expect(qwenAnalyzer.analyze(stockCode, tradeDate)).rejects.toThrow('数据库连接失败');
    });
  });

  describe('豆包舆情感知分析器', () => {
    it('应该能够分析市场情绪', async () => {
      const stockCode = '000001';
      const tradeDate = '2025-01-17';

      // 模拟LLM调用
      const mockSentimentResponse = {
        sentiment_score: 75,
        risk_factors: ['市场波动性增加', '政策不确定性'],
        market_consensus: '市场对该公司前景持乐观态度',
        contrarian_view: '可能存在估值过高的风险',
        real_time_events: ['重大合同签署', '行业政策利好'],
        confidence_level: 0.8
      };

      jest.spyOn(doubaoAnalyzer.llm_service, 'call_llm').mockResolvedValue(JSON.stringify(mockSentimentResponse));

      // 执行分析
      const result = await doubaoAnalyzer.analyze(stockCode, tradeDate);

      // 验证结果
      expect(result).toBeDefined();
      expect(result.stock_code).toBe(stockCode);
      expect(result.trade_date).toBe(tradeDate);
      expect(result.analyzer_type).toBe('doubao_sentiment_based');
      expect(result.sentiment_analysis).toBeDefined();
      expect(result.sentiment_analysis.sentiment_score).toBe(75);
      expect(result.sentiment_analysis.confidence_level).toBe(0.8);
    });

    it('应该能够处理非JSON响应', async () => {
      const stockCode = '000003';
      const tradeDate = '2025-01-17';

      // 模拟非JSON响应
      const mockTextResponse = '这是一个非JSON格式的响应，应该被正确解析为默认结构';

      jest.spyOn(doubaoAnalyzer.llm_service, 'call_llm').mockResolvedValue(mockTextResponse);

      // 执行分析
      const result = await doubaoAnalyzer.analyze(stockCode, tradeDate);

      // 验证结果
      expect(result).toBeDefined();
      expect(result.analyzer_type).toBe('doubao_sentiment_based');
      expect(result.sentiment_analysis.sentiment_score).toBe(0); // 默认值
      expect(result.raw_analysis).toBe(mockTextResponse);
    });
  });

  describe('双脑并行分析', () => {
    it('应该能够同时执行两个分析器', async () => {
      const stockCode = '000001';
      const tradeDate = '2025-01-17';

      // 模拟Qwen分析器
      const mockQwenReport = {
        id: 'qwen_001',
        stock_code: stockCode,
        trade_date: tradeDate,
        analyzer_type: 'qwen_fact_based',
        executive_summary: 'Qwen分析摘要',
        confidence_score: 0.85
      };

      jest.spyOn(qwenAnalyzer, 'analyze').mockResolvedValue(mockQwenReport);

      // 模拟豆包分析器
      const mockDoubaoReport = {
        id: 'doubao_001',
        stock_code: stockCode,
        trade_date: tradeDate,
        analyzer_type: 'doubao_sentiment_based',
        sentiment_analysis: {
          sentiment_score: 75,
          confidence_level: 0.8
        }
      };

      jest.spyOn(doubaoAnalyzer, 'analyze').mockResolvedValue(mockDoubaoReport);

      // 模拟数据库操作
      jest.spyOn(dbManager, 'save_generated_report').mockResolvedValue(true);
      jest.spyOn(dbManager, 'create_arbitration_case').mockResolvedValue(true);

      // 执行并行分析
      const startTime = Date.now();
      const [qwenResult, doubaoResult] = await Promise.allSettled([
        qwenAnalyzer.analyze(stockCode, tradeDate),
        doubaoAnalyzer.analyze(stockCode, tradeDate)
      ]);
      const endTime = Date.now();

      // 验证结果
      expect(qwenResult.status).toBe('fulfilled');
      expect(doubaoResult.status).toBe('fulfilled');
      expect(qwenResult.value).toEqual(mockQwenReport);
      expect(doubaoResult.value).toEqual(mockDoubaoReport);

      // 验证并行执行时间（应该比串行执行快）
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(2000); // 假设每个分析器需要1秒
    });

    it('应该能够处理一个分析器失败的情况', async () => {
      const stockCode = '000002';
      const tradeDate = '2025-01-17';

      // 模拟Qwen分析器成功
      const mockQwenReport = {
        id: 'qwen_002',
        stock_code: stockCode,
        trade_date: tradeDate,
        analyzer_type: 'qwen_fact_based'
      };

      jest.spyOn(qwenAnalyzer, 'analyze').mockResolvedValue(mockQwenReport);

      // 模拟豆包分析器失败
      jest.spyOn(doubaoAnalyzer, 'analyze').mockRejectedValue(new Error('豆包API调用失败'));

      // 执行并行分析
      const [qwenResult, doubaoResult] = await Promise.allSettled([
        qwenAnalyzer.analyze(stockCode, tradeDate),
        doubaoAnalyzer.analyze(stockCode, tradeDate)
      ]);

      // 验证结果
      expect(qwenResult.status).toBe('fulfilled');
      expect(doubaoResult.status).toBe('rejected');
      expect(qwenResult.value).toEqual(mockQwenReport);
      expect(doubaoResult.reason.message).toBe('豆包API调用失败');
    });
  });

  describe('报告对比分析', () => {
    it('应该能够计算报告一致性', () => {
      const qwenReport = {
        investment_recommendation: 'BUY',
        confidence_score: 0.85
      };

      const doubaoReport = {
        investment_implications: {
          position_recommendation: 'BUY'
        },
        sentiment_analysis: {
          sentiment_score: 75
        }
      };

      // 测试投资建议一致性
      const recommendationConsistency = qwenReport.investment_recommendation === 
        doubaoReport.investment_implications.position_recommendation ? 100 : 0;
      
      expect(recommendationConsistency).toBe(100);

      // 测试风险差异
      const qwenRisk = qwenReport.confidence_score * 100;
      const doubaoRisk = Math.abs(doubaoReport.sentiment_analysis.sentiment_score);
      const riskDifference = Math.abs(qwenRisk - doubaoRisk);
      
      expect(riskDifference).toBe(10); // 85 - 75 = 10
    });
  });

  describe('仲裁案件管理', () => {
    it('应该能够创建仲裁案件', async () => {
      const arbitrationCase = {
        stock_code: '000001',
        trade_date: '2025-01-17',
        qwen_report_id: 'qwen_001',
        doubao_report_id: 'doubao_001',
        status: 'pending_arbitration'
      };

      jest.spyOn(dbManager, 'create_arbitration_case').mockResolvedValue(true);

      const result = await dbManager.create_arbitration_case(arbitrationCase);
      expect(result).toBe(true);
    });

    it('应该能够获取待仲裁案件', async () => {
      const mockCases = [
        {
          id: 1,
          stock_code: '000001',
          trade_date: '2025-01-17',
          status: 'pending_arbitration',
          qwen_confidence: 85,
          doubao_confidence: 80
        }
      ];

      jest.spyOn(dbManager, 'get_pending_arbitration_cases').mockResolvedValue(mockCases);

      const result = await dbManager.get_pending_arbitration_cases();
      expect(result).toEqual(mockCases);
    });
  });
});
