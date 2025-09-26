/**
 * StockUniverseManager - 动态双层股票宇宙管理器
 *
 * 功能：
 * 1. 管理核心宇宙(Core Universe)和观察宇宙(Observation Universe)
 * 2. 实现动态升降级机制
 * 3. 提供股票分类查询接口
 * 4. 支持用户自定义股票池
 */

import { Database } from '../database/unified-connection';
import { Logger } from '../utils/logger';

export interface StockUniverseMapping {
  stock_code: string;
  universe_type: 'core' | 'observation';
  update_date: string;
  promotion_reason?: string;
  demotion_reason?: string;
  user_added?: boolean;
  market_cap_rank?: number;
  liquidity_score?: number;
  attention_score?: number;
}

export interface UniverseStats {
  core_count: number;
  observation_count: number;
  total_count: number;
  last_updated: string;
  promotion_count_today: number;
  demotion_count_today: number;
}

export interface PromotionCriteria {
  daily_turnover_threshold: number; // 10亿元
  extreme_z_score_threshold: number; // 3.5
  concept_ranking_threshold: number; // 前100名
  user_watchlist: boolean; // 用户自选股
}

export class StockUniverseManager {
  private db: Database;
  private logger: Logger;
  private promotionCriteria: PromotionCriteria;

  constructor(db: Database, logger: Logger) {
    this.db = db;
    this.logger = logger;
    this.promotionCriteria = {
      daily_turnover_threshold: 1000000000, // 10亿元
      extreme_z_score_threshold: 3.5,
      concept_ranking_threshold: 100,
      user_watchlist: true
    };
  }

  /**
   * 初始化股票宇宙映射表
   */
  async initializeUniverseMapping(): Promise<void> {
    try {
      // 创建股票宇宙映射表
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS stock_universe_mapping (
          stock_code VARCHAR(20) PRIMARY KEY,
          universe_type VARCHAR(20) NOT NULL CHECK (universe_type IN ('core', 'observation')),
          update_date DATE NOT NULL,
          promotion_reason TEXT,
          demotion_reason TEXT,
          user_added BOOLEAN DEFAULT FALSE,
          market_cap_rank INTEGER,
          liquidity_score DECIMAL(10,2),
          attention_score DECIMAL(10,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建索引
      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_universe_type ON stock_universe_mapping(universe_type)
      `);
      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_update_date ON stock_universe_mapping(update_date)
      `);

      this.logger.info('股票宇宙映射表初始化完成');
    } catch (error) {
      this.logger.error('初始化股票宇宙映射表失败:', error);
      throw error;
    }
  }

  /**
   * 构建初始股票宇宙
   */
  async buildInitialUniverse(): Promise<void> {
    try {
      this.logger.info('开始构建初始股票宇宙...');

      // 1. 获取沪深300、中证500、中证1000成分股
      const indexStocks = await this.getIndexConstituentStocks();
      this.logger.info(`获取到指数成分股: ${indexStocks.length}只`);

      // 2. 获取流动性筛选后的股票
      const liquidStocks = await this.filterByLiquidity(indexStocks);
      this.logger.info(`流动性筛选后: ${liquidStocks.length}只`);

      // 3. 获取关注度筛选后的股票
      const attentionStocks = await this.filterByAttention(liquidStocks);
      this.logger.info(`关注度筛选后: ${attentionStocks.length}只`);

      // 4. 获取用户自选股
      const userStocks = await this.getUserWatchlistStocks();
      this.logger.info(`用户自选股: ${userStocks.length}只`);

      // 5. 合并并去重
      const coreStocks = this.mergeAndDeduplicate(attentionStocks, userStocks);
      this.logger.info(`核心宇宙股票: ${coreStocks.length}只`);

      // 6. 获取所有股票，构建观察宇宙
      const allStocks = await this.getAllStocks();
      const observationStocks = allStocks.filter(stock =>
        !coreStocks.some(core => core.stock_code === stock.stock_code)
      );
      this.logger.info(`观察宇宙股票: ${observationStocks.length}只`);

      // 7. 保存到数据库
      await this.saveUniverseMapping(coreStocks, observationStocks);

      this.logger.info('初始股票宇宙构建完成');
    } catch (error) {
      this.logger.error('构建初始股票宇宙失败:', error);
      throw error;
    }
  }

  /**
   * 获取指数成分股
   */
  private async getIndexConstituentStocks(): Promise<string[]> {
    const indexCodes = ['000300.SH', '000905.SH', '000852.SH']; // 沪深300、中证500、中证1000
    const stocks: string[] = [];

    for (const indexCode of indexCodes) {
      try {
        const result = await this.db.query(`
          SELECT DISTINCT ts_code
          FROM index_weight
          WHERE index_code = $1
          AND trade_date = (
            SELECT MAX(trade_date)
            FROM index_weight
            WHERE index_code = $1
          )
        `, [indexCode]);

        const indexStocks = result.rows.map(row => row.ts_code);
        stocks.push(...indexStocks);
        this.logger.info(`获取${indexCode}成分股: ${indexStocks.length}只`);
      } catch (error) {
        this.logger.warn(`获取${indexCode}成分股失败:`, error);
      }
    }

    return [...new Set(stocks)]; // 去重
  }

  /**
   * 流动性筛选
   */
  private async filterByLiquidity(stocks: string[]): Promise<string[]> {
    const liquidStocks: string[] = [];
    const threshold = 500000000; // 5亿元

    for (const stock of stocks) {
      try {
        const result = await this.db.query(`
          SELECT AVG(amount) as avg_amount
          FROM daily_basic
          WHERE ts_code = $1
          AND trade_date >= CURRENT_DATE - INTERVAL '30 days'
        `, [stock]);

        if (result.rows.length > 0 && result.rows[0].avg_amount >= threshold) {
          liquidStocks.push(stock);
        }
      } catch (error) {
        this.logger.warn(`检查${stock}流动性失败:`, error);
      }
    }

    return liquidStocks;
  }

  /**
   * 关注度筛选
   */
  private async filterByAttention(stocks: string[]): Promise<string[]> {
    // 这里需要集成东财/同花顺的人气榜数据
    // 暂时返回所有股票，实际实现时需要调用相关API
    return stocks;
  }

  /**
   * 获取用户自选股
   */
  private async getUserWatchlistStocks(): Promise<string[]> {
    try {
      const result = await this.db.query(`
        SELECT DISTINCT stock_code
        FROM user_watchlist
        WHERE is_active = true
      `);
      return result.rows.map(row => row.stock_code);
    } catch (error) {
      this.logger.warn('获取用户自选股失败:', error);
      return [];
    }
  }

  /**
   * 获取所有股票
   */
  private async getAllStocks(): Promise<{stock_code: string}[]> {
    try {
      const result = await this.db.query(`
        SELECT DISTINCT ts_code as stock_code
        FROM stock_basic
        WHERE list_status = 'L'
      `);
      return result.rows;
    } catch (error) {
      this.logger.error('获取所有股票失败:', error);
      throw error;
    }
  }

  /**
   * 合并并去重
   */
  private mergeAndDeduplicate(attentionStocks: string[], userStocks: string[]): string[] {
    const allStocks = [...attentionStocks, ...userStocks];
    return [...new Set(allStocks)];
  }

  /**
   * 保存股票宇宙映射
   */
  private async saveUniverseMapping(coreStocks: string[], observationStocks: string[]): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    // 清空现有数据
    await this.db.query('DELETE FROM stock_universe_mapping');

    // 插入核心宇宙股票
    for (const stock of coreStocks) {
      await this.db.query(`
        INSERT INTO stock_universe_mapping
        (stock_code, universe_type, update_date, user_added)
        VALUES ($1, 'core', $2, $3)
      `, [stock, today, userStocks.includes(stock)]);
    }

    // 插入观察宇宙股票
    for (const stock of observationStocks) {
      await this.db.query(`
        INSERT INTO stock_universe_mapping
        (stock_code, universe_type, update_date)
        VALUES ($1, 'observation', $2)
      `, [stock, today]);
    }
  }

  /**
   * 获取核心宇宙股票列表
   */
  async getCoreUniverseStocks(): Promise<string[]> {
    try {
      const result = await this.db.query(`
        SELECT stock_code
        FROM stock_universe_mapping
        WHERE universe_type = 'core'
        ORDER BY stock_code
      `);
      return result.rows.map(row => row.stock_code);
    } catch (error) {
      this.logger.error('获取核心宇宙股票失败:', error);
      throw error;
    }
  }

  /**
   * 获取观察宇宙股票列表
   */
  async getObservationUniverseStocks(): Promise<string[]> {
    try {
      const result = await this.db.query(`
        SELECT stock_code
        FROM stock_universe_mapping
        WHERE universe_type = 'observation'
        ORDER BY stock_code
      `);
      return result.rows.map(row => row.stock_code);
    } catch (error) {
      this.logger.error('获取观察宇宙股票失败:', error);
      throw error;
    }
  }

  /**
   * 检查股票是否在核心宇宙
   */
  async isInCoreUniverse(stockCode: string): Promise<boolean> {
    try {
      const result = await this.db.query(`
        SELECT 1
        FROM stock_universe_mapping
        WHERE stock_code = $1 AND universe_type = 'core'
      `, [stockCode]);
      return result.rows.length > 0;
    } catch (error) {
      this.logger.error(`检查${stockCode}是否在核心宇宙失败:`, error);
      return false;
    }
  }

  /**
   * 每日晋升检查
   */
  async checkDailyPromotions(): Promise<string[]> {
    try {
      this.logger.info('开始每日晋升检查...');
      const promotedStocks: string[] = [];

      // 1. 检查成交额激增
      const turnoverStocks = await this.checkTurnoverPromotion();
      promotedStocks.push(...turnoverStocks);

      // 2. 检查极端Z分数异动
      const zScoreStocks = await this.checkZScorePromotion();
      promotedStocks.push(...zScoreStocks);

      // 3. 检查概念板块热度
      const conceptStocks = await this.checkConceptPromotion();
      promotedStocks.push(...conceptStocks);

      // 4. 检查用户自选股
      const userStocks = await this.checkUserWatchlistPromotion();
      promotedStocks.push(...userStocks);

      // 去重并晋升
      const uniqueStocks = [...new Set(promotedStocks)];
      for (const stock of uniqueStocks) {
        await this.promoteToCore(stock, 'daily_promotion');
      }

      this.logger.info(`今日晋升股票: ${uniqueStocks.length}只`);
      return uniqueStocks;
    } catch (error) {
      this.logger.error('每日晋升检查失败:', error);
      throw error;
    }
  }

  /**
   * 检查成交额激增晋升
   */
  private async checkTurnoverPromotion(): Promise<string[]> {
    try {
      const result = await this.db.query(`
        SELECT ts_code, amount
        FROM daily_basic
        WHERE trade_date = CURRENT_DATE - INTERVAL '1 day'
        AND ts_code IN (
          SELECT stock_code
          FROM stock_universe_mapping
          WHERE universe_type = 'observation'
        )
        AND amount >= $1
      `, [this.promotionCriteria.daily_turnover_threshold]);

      return result.rows.map(row => row.ts_code);
    } catch (error) {
      this.logger.warn('检查成交额激增晋升失败:', error);
      return [];
    }
  }

  /**
   * 检查极端Z分数异动晋升
   */
  private async checkZScorePromotion(): Promise<string[]> {
    try {
      const result = await this.db.query(`
        SELECT stock_code
        FROM quant_signals
        WHERE signal_date = CURRENT_DATE - INTERVAL '1 day'
        AND ts_code IN (
          SELECT stock_code
          FROM stock_universe_mapping
          WHERE universe_type = 'observation'
        )
        AND (ABS(macro_risk_z_score) >= $1
             OR ABS(quant_fingerprint_z_score) >= $1)
      `, [this.promotionCriteria.extreme_z_score_threshold]);

      return result.rows.map(row => row.stock_code);
    } catch (error) {
      this.logger.warn('检查极端Z分数异动晋升失败:', error);
      return [];
    }
  }

  /**
   * 检查概念板块热度晋升
   */
  private async checkConceptPromotion(): Promise<string[]> {
    // 这里需要集成同花顺/东方财富的概念板块数据
    // 暂时返回空数组，实际实现时需要调用相关API
    return [];
  }

  /**
   * 检查用户自选股晋升
   */
  private async checkUserWatchlistPromotion(): Promise<string[]> {
    try {
      const result = await this.db.query(`
        SELECT DISTINCT uw.stock_code
        FROM user_watchlist uw
        WHERE uw.is_active = true
        AND uw.created_at >= CURRENT_DATE - INTERVAL '1 day'
        AND uw.stock_code IN (
          SELECT stock_code
          FROM stock_universe_mapping
          WHERE universe_type = 'observation'
        )
      `);

      return result.rows.map(row => row.stock_code);
    } catch (error) {
      this.logger.warn('检查用户自选股晋升失败:', error);
      return [];
    }
  }

  /**
   * 晋升股票到核心宇宙
   */
  private async promoteToCore(stockCode: string, reason: string): Promise<void> {
    try {
      await this.db.query(`
        UPDATE stock_universe_mapping
        SET universe_type = 'core',
            update_date = CURRENT_DATE,
            promotion_reason = $2
        WHERE stock_code = $1
      `, [stockCode, reason]);

      this.logger.info(`股票${stockCode}已晋升到核心宇宙，原因: ${reason}`);
    } catch (error) {
      this.logger.error(`晋升股票${stockCode}失败:`, error);
      throw error;
    }
  }

  /**
   * 降级股票到观察宇宙
   */
  private async demoteToObservation(stockCode: string, reason: string): Promise<void> {
    try {
      await this.db.query(`
        UPDATE stock_universe_mapping
        SET universe_type = 'observation',
            update_date = CURRENT_DATE,
            demotion_reason = $2
        WHERE stock_code = $1
      `, [stockCode, reason]);

      this.logger.info(`股票${stockCode}已降级到观察宇宙，原因: ${reason}`);
    } catch (error) {
      this.logger.error(`降级股票${stockCode}失败:`, error);
      throw error;
    }
  }

  /**
   * 月度降级检查
   */
  async checkMonthlyDemotions(): Promise<string[]> {
    try {
      this.logger.info('开始月度降级检查...');
      const demotedStocks: string[] = [];

      // 检查流动性不足的股票
      const lowLiquidityStocks = await this.checkLowLiquidityDemotion();
      demotedStocks.push(...lowLiquidityStocks);

      // 检查关注度下降的股票
      const lowAttentionStocks = await this.checkLowAttentionDemotion();
      demotedStocks.push(...lowAttentionStocks);

      // 去重并降级
      const uniqueStocks = [...new Set(demotedStocks)];
      for (const stock of uniqueStocks) {
        await this.demoteToObservation(stock, 'monthly_demotion');
      }

      this.logger.info(`本月降级股票: ${uniqueStocks.length}只`);
      return uniqueStocks;
    } catch (error) {
      this.logger.error('月度降级检查失败:', error);
      throw error;
    }
  }

  /**
   * 检查流动性不足降级
   */
  private async checkLowLiquidityDemotion(): Promise<string[]> {
    try {
      const threshold = 50000000; // 5000万元
      const result = await this.db.query(`
        SELECT ts_code
        FROM daily_basic
        WHERE trade_date >= CURRENT_DATE - INTERVAL '30 days'
        AND ts_code IN (
          SELECT stock_code
          FROM stock_universe_mapping
          WHERE universe_type = 'core'
        )
        GROUP BY ts_code
        HAVING AVG(amount) < $1
      `, [threshold]);

      return result.rows.map(row => row.ts_code);
    } catch (error) {
      this.logger.warn('检查流动性不足降级失败:', error);
      return [];
    }
  }

  /**
   * 检查关注度下降降级
   */
  private async checkLowAttentionDemotion(): Promise<string[]> {
    // 这里需要集成关注度数据
    // 暂时返回空数组，实际实现时需要调用相关API
    return [];
  }

  /**
   * 获取股票宇宙统计信息
   */
  async getUniverseStats(): Promise<UniverseStats> {
    try {
      const coreResult = await this.db.query(`
        SELECT COUNT(*) as count
        FROM stock_universe_mapping
        WHERE universe_type = 'core'
      `);
      const observationResult = await this.db.query(`
        SELECT COUNT(*) as count
        FROM stock_universe_mapping
        WHERE universe_type = 'observation'
      `);
      const promotionResult = await this.db.query(`
        SELECT COUNT(*) as count
        FROM stock_universe_mapping
        WHERE universe_type = 'core'
        AND update_date = CURRENT_DATE
        AND promotion_reason IS NOT NULL
      `);
      const demotionResult = await this.db.query(`
        SELECT COUNT(*) as count
        FROM stock_universe_mapping
        WHERE universe_type = 'observation'
        AND update_date = CURRENT_DATE
        AND demotion_reason IS NOT NULL
      `);

      return {
        core_count: parseInt(coreResult.rows[0].count),
        observation_count: parseInt(observationResult.rows[0].count),
        total_count: parseInt(coreResult.rows[0].count) + parseInt(observationResult.rows[0].count),
        last_updated: new Date().toISOString(),
        promotion_count_today: parseInt(promotionResult.rows[0].count),
        demotion_count_today: parseInt(demotionResult.rows[0].count)
      };
    } catch (error) {
      this.logger.error('获取股票宇宙统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 更新股票宇宙映射
   */
  async updateUniverseMapping(stockCode: string, universeType: 'core' | 'observation', reason?: string): Promise<void> {
    try {
      await this.db.query(`
        UPDATE stock_universe_mapping
        SET universe_type = $2,
            update_date = CURRENT_DATE,
            ${universeType === 'core' ? 'promotion_reason' : 'demotion_reason'} = $3
        WHERE stock_code = $1
      `, [stockCode, universeType, reason]);

      this.logger.info(`股票${stockCode}已更新到${universeType}宇宙，原因: ${reason}`);
    } catch (error) {
      this.logger.error(`更新股票${stockCode}宇宙映射失败:`, error);
      throw error;
    }
  }
}
