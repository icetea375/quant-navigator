/**
 * 双脑分析API接口
 * 提供Qwen事实归因和豆包舆情感知的REST API
 */

import { Router, Request, Response } from 'express';
import { QwenFactAnalyzer } from '../../qwen_analyzer';
import { DoubaoSentimentAnalyzer } from '../../doubao_analyzer';
import { DatabaseManager } from '../../support_modules/database_utils';

const router = Router();

// 初始化分析器
const qwenAnalyzer = new QwenFactAnalyzer(require('../../../config/main_config.json'));
const doubaoAnalyzer = new DoubaoSentimentAnalyzer(require('../../../config/main_config.json'));
const dbManager = new DatabaseManager(require('../../../config/main_config.json').database);

/**
 * 启动双脑并行分析
 * POST /api/dual-brain/analyze
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { stock_code, trade_date } = req.body;

    if (!stock_code || !trade_date) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数: stock_code, trade_date'
      });
    }

    console.log(`🚀 启动双脑并行分析: ${stock_code} - ${trade_date}`);

    // 并行执行两个分析器
    const [qwenResult, doubaoResult] = await Promise.allSettled([
      qwenAnalyzer.analyze(stock_code, trade_date),
      doubaoAnalyzer.analyze(stock_code, trade_date)
    ]);

    // 处理Qwen分析结果
    let qwenReport = null;
    if (qwenResult.status === 'fulfilled') {
      qwenReport = qwenResult.value;
      qwenReport.source = 'qwen_fact_based';
      await dbManager.save_generated_report(qwenReport);
    } else {
      console.error('Qwen分析失败:', qwenResult.reason);
    }

    // 处理豆包分析结果
    let doubaoReport = null;
    if (doubaoResult.status === 'fulfilled') {
      doubaoReport = doubaoResult.value;
      doubaoReport.source = 'doubao_sentiment_based';
      await dbManager.save_generated_report(doubaoReport);
    } else {
      console.error('豆包分析失败:', doubaoResult.reason);
    }

    // 如果两个分析都成功，创建仲裁案件
    if (qwenReport && doubaoReport) {
      const arbitrationCase = {
        stock_code,
        trade_date,
        qwen_report_id: qwenReport.id,
        doubao_report_id: doubaoReport.id,
        status: 'pending_arbitration',
        created_at: new Date().toISOString()
      };

      await dbManager.create_arbitration_case(arbitrationCase);
      console.log(`✅ 已创建仲裁案件: ${stock_code}`);
    }

    res.json({
      success: true,
      data: {
        stock_code,
        trade_date,
        qwen_report: qwenReport,
        doubao_report: doubaoReport,
        arbitration_created: !!(qwenReport && doubaoReport)
      }
    });

  } catch (error) {
    console.error('双脑分析API错误:', error);
    res.status(500).json({
      success: false,
      error: '双脑分析失败',
      details: error.message
    });
  }
});

/**
 * 获取待仲裁案件列表
 * GET /api/dual-brain/pending-cases
 */
router.get('/pending-cases', async (req: Request, res: Response) => {
  try {
    const cases = await dbManager.get_pending_arbitration_cases();

    res.json({
      success: true,
      data: cases
    });
  } catch (error) {
    console.error('获取待仲裁案件失败:', error);
    res.status(500).json({
      success: false,
      error: '获取待仲裁案件失败',
      details: error.message
    });
  }
});

/**
 * 获取特定案件的双报告
 * GET /api/dual-brain/case/:caseId/reports
 */
router.get('/case/:caseId/reports', async (req: Request, res: Response) => {
  try {
    const { caseId } = req.params;
    const caseData = await dbManager.get_arbitration_case(caseId);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        error: '案件不存在'
      });
    }

    // 获取两个报告
    const [qwenReport, doubaoReport] = await Promise.all([
      dbManager.get_report_by_id(caseData.qwen_report_id),
      dbManager.get_report_by_id(caseData.doubao_report_id)
    ]);

    res.json({
      success: true,
      data: {
        case: caseData,
        qwen_report: qwenReport,
        doubao_report: doubaoReport
      }
    });
  } catch (error) {
    console.error('获取案件报告失败:', error);
    res.status(500).json({
      success: false,
      error: '获取案件报告失败',
      details: error.message
    });
  }
});

/**
 * 提交仲裁决策
 * POST /api/dual-brain/case/:caseId/arbitrate
 */
router.post('/case/:caseId/arbitrate', async (req: Request, res: Response) => {
  try {
    const { caseId } = req.params;
    const {
      final_recommendation,
      confidence_level,
      reasoning,
      key_disagreements
    } = req.body;

    if (!final_recommendation || !reasoning) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数: final_recommendation, reasoning'
      });
    }

    // 更新仲裁案件
    const arbitrationDecision = {
      final_recommendation,
      confidence_level: confidence_level || 75,
      reasoning,
      key_disagreements: key_disagreements || '',
      status: 'completed',
      completed_at: new Date().toISOString()
    };

    await dbManager.update_arbitration_case(caseId, arbitrationDecision);

    // 创建人类仲裁报告
    const humanReport = {
      id: `human_${Date.now()}`,
      stock_code: req.body.stock_code,
      trade_date: req.body.trade_date,
      source: 'human_arbitrated',
      analyzer_type: 'human_arbitrator',
      final_recommendation,
      confidence_score: confidence_level / 100,
      reasoning,
      key_disagreements,
      created_at: new Date().toISOString()
    };

    await dbManager.save_generated_report(humanReport);

    res.json({
      success: true,
      data: {
        case_id: caseId,
        human_report: humanReport,
        message: '仲裁决策已提交'
      }
    });

  } catch (error) {
    console.error('提交仲裁决策失败:', error);
    res.status(500).json({
      success: false,
      error: '提交仲裁决策失败',
      details: error.message
    });
  }
});

/**
 * 获取分析器性能统计
 * GET /api/dual-brain/performance
 */
router.get('/performance', async (req: Request, res: Response) => {
  try {
    const stats = await dbManager.get_analyzer_performance_stats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取性能统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取性能统计失败',
      details: error.message
    });
  }
});

export default router;
