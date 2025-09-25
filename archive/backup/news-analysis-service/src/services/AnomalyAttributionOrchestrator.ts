import { DatabaseConnection } from '../database/connection';
import { SimpleLogCollector } from './SimpleLogCollector';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { BaseConfigValidator } from '../utils/BaseConfigValidator';

/**
 * 异常归因编排器
 * 实现倒金字塔过滤逻辑，确定每日异常焦点
 */
export interface AnomalyFocus {
  focus_id: string;
  detection_date: string;
  priority: number;
  anomaly_level: string;
  target_code?: string;
  target_name: string;
  z_score_value: number;
  z_score_type: string;
  news_search_status: string;
  attribution_status: string;
  news_api_request_id?: string;
  attribution_result_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface OrchestratorConfig {
  z_score_threshold: number;
  percentile_threshold: number;
  search_strategy: string;
  deduplication_level: string;
  max_retry_attempts: number;
  retry_delay_ms: number;
}

export interface AnomalyData {
  level: string;
  code?: string;
  name: string;
  z_score: number;
  z_score_type: string;
  priority: number;
}

export class AnomalyAttributionOrchestrator {
  private db: DatabaseConnection;
  private logger: SimpleLogCollector;
  private config: OrchestratorConfig;

  constructor(db: DatabaseConnection, logger: SimpleLogCollector) {
    this.db = db;
    this.logger = logger;
    this.config = this.getDefaultConfig();
    this.initializeConfig();
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): OrchestratorConfig {
    return {
      z_score_threshold: 2.5,
      percentile_threshold: 95,
      search_strategy: 'parallel',
      deduplication_level: 'high',
      max_retry_attempts: 3,
      retry_delay_ms: 5000
    };
  }

  /**
   * 初始化配置
   */
  private async initializeConfig(): Promise<void> {
    try {
      const configs = await this.getConfigFromDatabase();
      this.config = { ...this.config, ...configs };
      this.logger.info('Orchestrator config initialized', { config: this.config });
    } catch (error) {
      this.logger.warn('Failed to load config from database, using defaults', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * 从数据库获取配置
   */
  private async getConfigFromDatabase(): Promise<Partial<OrchestratorConfig>> {
    const query = `
      SELECT config_name, config_value, config_type 
      FROM orchestrator_config 
      WHERE is_active = true
    `;
    
      const rows = await this.db.query(query);
    const config: Partial<OrchestratorConfig> = {};
    
    for (const row of rows) {
      const { config_name, config_value, config_type } = row;
      
      switch (config_name) {
        case 'z_score_threshold':
          config.z_score_threshold = parseFloat(config_value);
          break;
        case 'percentile_threshold':
          config.percentile_threshold = parseInt(config_value);
          break;
        case 'search_strategy':
          config.search_strategy = config_value;
          break;
        case 'deduplication_level':
          config.deduplication_level = config_value;
          break;
        case 'max_retry_attempts':
          config.max_retry_attempts = parseInt(config_value);
          break;
        case 'retry_delay_ms':
          config.retry_delay_ms = parseInt(config_value);
          break;
      }
    }
    
    return config;
  }

  /**
   * 触发每日异常分析
   */
  async triggerDailyAnalysis(date?: string): Promise<{ task_id: string; message: string }> {
    const analysisDate = date || new Date().toISOString().split('T')[0];
    const taskId = `attribution_task_${Date.now()}`;
    
    try {
      this.logger.info('Starting daily anomaly analysis', { taskId, analysisDate });
      
      // 检查是否已存在当天的焦点
      const existingFocus = await this.getFocusOfTheDay(analysisDate);
      if (existingFocus && 'focus_id' in existingFocus && existingFocus.focus_id) {
        this.logger.info('Focus already exists for date', { analysisDate, focusId: existingFocus.focus_id });
        return {
          task_id: taskId,
          message: `Analysis already completed for ${analysisDate}`
        };
      }

      // 执行倒金字塔过滤逻辑
      const focus = await this.executeInvertedPyramidFilter(analysisDate);
      
      if (focus) {
        // 保存焦点到数据库
        await this.saveFocusToDatabase(focus);
        this.logger.info('Daily anomaly focus saved', { focusId: focus.focus_id, analysisDate });
      } else {
        this.logger.info('No significant anomaly found', { analysisDate });
      }

      return {
        task_id: taskId,
        message: 'Daily anomaly attribution analysis has been triggered.'
      };
    } catch (error) {
      BaseErrorHandler.handle(error, 'AnomalyAttributionOrchestrator');
      throw error;
    }
  }

  /**
   * 执行倒金字塔过滤逻辑
   */
  private async executeInvertedPyramidFilter(analysisDate: string): Promise<AnomalyFocus | null> {
    try {
      // 第1步: 检查宏观层
      const macroAnomaly = await this.checkMacroLevel(analysisDate);
      if (macroAnomaly && Math.abs(macroAnomaly.z_score) > this.config.z_score_threshold) {
        return this.createFocusFromAnomaly(macroAnomaly, analysisDate, 1);
      }

      // 第2步: 检查风格与行业层
      const styleIndustryAnomaly = await this.checkStyleIndustryLevel(analysisDate);
      if (styleIndustryAnomaly && Math.abs(styleIndustryAnomaly.z_score) > this.config.z_score_threshold) {
        return this.createFocusFromAnomaly(styleIndustryAnomaly, analysisDate, 2);
      }

      // 第3步: 检查细分赛道层
      const sectorAnomaly = await this.checkSectorLevel(analysisDate);
      if (sectorAnomaly && Math.abs(sectorAnomaly.z_score) > this.config.z_score_threshold) {
        return this.createFocusFromAnomaly(sectorAnomaly, analysisDate, 3);
      }

      // 第4步: 检查个股层
      const stockAnomaly = await this.checkStockLevel(analysisDate);
      if (stockAnomaly && Math.abs(stockAnomaly.z_score) > this.config.z_score_threshold) {
        return this.createFocusFromAnomaly(stockAnomaly, analysisDate, 4);
      }

      return null; // 无显著异常
    } catch (error) {
      this.logger.error('Failed to execute inverted pyramid filter', { error: error instanceof Error ? error.message : String(error), analysisDate });
      throw error;
    }
  }

  /**
   * 检查宏观层异常
   */
  private async checkMacroLevel(analysisDate: string): Promise<AnomalyData | null> {
    const query = `
      SELECT z_score, z_score_type
      FROM broad_market_anomaly_results
      WHERE detection_date = ? AND anomaly_type = 'MacroRisk'
      ORDER BY ABS(z_score) DESC
      LIMIT 1
    `;
    
    const rows = await this.db.query(query, [analysisDate]);
    const row = rows[0];
    if (row) {
      return {
        level: 'Macro',
        name: '宏观经济',
        z_score: row.z_score,
        z_score_type: row.z_score_type,
        priority: 1
      };
    }
    return null;
  }

  /**
   * 检查风格与行业层异常
   */
  private async checkStyleIndustryLevel(analysisDate: string): Promise<AnomalyData | null> {
    const query = `
      SELECT anomaly_level, target_code, target_name, z_score, z_score_type
      FROM four_layer_anomaly_results
      WHERE detection_date = ? AND anomaly_level IN ('Style', 'L1_Index')
      ORDER BY ABS(z_score) DESC
      LIMIT 1
    `;
    
    const rows = await this.db.query(query, [analysisDate]);
    const row = rows[0];
    if (row) {
      return {
        level: row.anomaly_level,
        code: row.target_code,
        name: row.target_name,
        z_score: row.z_score,
        z_score_type: row.z_score_type,
        priority: 2
      };
    }
    return null;
  }

  /**
   * 检查细分赛道层异常
   */
  private async checkSectorLevel(analysisDate: string): Promise<AnomalyData | null> {
    const query = `
      SELECT anomaly_level, target_code, target_name, z_score, z_score_type
      FROM four_layer_anomaly_results
      WHERE detection_date = ? AND anomaly_level = 'L2_ETF'
      ORDER BY ABS(z_score) DESC
      LIMIT 1
    `;
    
    const rows = await this.db.query(query, [analysisDate]);
    const row = rows[0];
    if (row) {
      return {
        level: row.anomaly_level,
        code: row.target_code,
        name: row.target_name,
        z_score: row.z_score,
        z_score_type: row.z_score_type,
        priority: 3
      };
    }
    return null;
  }

  /**
   * 检查个股层异常
   */
  private async checkStockLevel(analysisDate: string): Promise<AnomalyData | null> {
    const query = `
      SELECT anomaly_level, target_code, target_name, z_score, z_score_type
      FROM four_layer_anomaly_results
      WHERE detection_date = ? AND anomaly_level = 'L3_Stock'
      ORDER BY ABS(z_score) DESC
      LIMIT 1
    `;
    
    const rows = await this.db.query(query, [analysisDate]);
    const row = rows[0];
    if (row) {
      return {
        level: row.anomaly_level,
        code: row.target_code,
        name: row.target_name,
        z_score: row.z_score,
        z_score_type: row.z_score_type,
        priority: 4
      };
    }
    return null;
  }

  /**
   * 从异常数据创建焦点
   */
  private createFocusFromAnomaly(anomaly: AnomalyData, analysisDate: string, priority: number): AnomalyFocus {
    const focusId = `focus_${analysisDate.replace(/-/g, '')}`;
    
    return {
      focus_id: focusId,
      detection_date: analysisDate,
      priority: priority,
      anomaly_level: anomaly.level,
      target_code: anomaly.code,
      target_name: anomaly.name,
      z_score_value: anomaly.z_score,
      z_score_type: anomaly.z_score_type,
      news_search_status: 'PENDING',
      attribution_status: 'PENDING',
      created_at: new Date().toISOString()
    };
  }

  /**
   * 保存焦点到数据库
   */
  private async saveFocusToDatabase(focus: AnomalyFocus): Promise<void> {
    const query = `
      INSERT OR REPLACE INTO daily_anomaly_focus
      (focus_id, detection_date, priority, anomaly_level, target_code, target_name,
       z_score_value, z_score_type, news_search_status, attribution_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.db.execute(query, [
      focus.focus_id,
      focus.detection_date,
      focus.priority,
      focus.anomaly_level,
      focus.target_code,
      focus.target_name,
      focus.z_score_value,
      focus.z_score_type,
      focus.news_search_status,
      focus.attribution_status,
      focus.created_at
    ]);
  }

  /**
   * 获取指定日期的异常焦点
   */
  async getFocusOfTheDay(date: string): Promise<AnomalyFocus | { detection_date: string; message: string }> {
    try {
      const query = `
        SELECT * FROM daily_anomaly_focus
        WHERE detection_date = ?
      `;
      
      const rows = await this.db.query(query, [date]);
      const row = rows[0];
      
      if (row) {
        return {
          focus_id: row.focus_id,
          detection_date: row.detection_date,
          priority: row.priority,
          anomaly_level: row.anomaly_level,
          target_code: row.target_code,
          target_name: row.target_name,
          z_score_value: row.z_score_value,
          z_score_type: row.z_score_type,
          news_search_status: row.news_search_status,
          attribution_status: row.attribution_status,
          news_api_request_id: row.news_api_request_id,
          attribution_result_id: row.attribution_result_id,
          created_at: row.created_at,
          updated_at: row.updated_at
        };
      } else {
        return {
          detection_date: date,
          message: 'Market was calm. No significant anomaly focus identified.'
        };
      }
    } catch (error) {
      BaseErrorHandler.handle(error, 'AnomalyAttributionOrchestrator');
      throw error;
    }
  }

  /**
   * 更新焦点状态
   */
  async updateFocusStatus(focusId: string, updates: Partial<AnomalyFocus>): Promise<AnomalyFocus> {
    try {
      const setClause = [];
      const values = [];
      
      if (updates.news_search_status) {
        setClause.push('news_search_status = ?');
        values.push(updates.news_search_status);
      }
      
      if (updates.attribution_status) {
        setClause.push('attribution_status = ?');
        values.push(updates.attribution_status);
      }
      
      if (updates.news_api_request_id) {
        setClause.push('news_api_request_id = ?');
        values.push(updates.news_api_request_id);
      }
      
      if (updates.attribution_result_id) {
        setClause.push('attribution_result_id = ?');
        values.push(updates.attribution_result_id);
      }
      
      setClause.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(focusId);
      
      const query = `
        UPDATE daily_anomaly_focus
        SET ${setClause.join(', ')}
        WHERE focus_id = ?
      `;
      
      await this.db.execute(query, values);
      
      // 返回更新后的焦点
      const updatedFocus = await this.getFocusById(focusId);
      this.logger.info('Focus status updated', { focusId, updates });
      
      return updatedFocus;
    } catch (error) {
      BaseErrorHandler.handle(error, 'AnomalyAttributionOrchestrator');
      throw error;
    }
  }

  /**
   * 根据ID获取焦点
   */
  private async getFocusById(focusId: string): Promise<AnomalyFocus> {
    const query = `
      SELECT * FROM daily_anomaly_focus
      WHERE focus_id = ?
    `;
    
    const rows = await this.db.query(query, [focusId]);
    const row = rows[0];
    if (!row) {
      throw new Error(`Focus not found: ${focusId}`);
    }
    
    return {
      focus_id: row.focus_id,
      detection_date: row.detection_date,
      priority: row.priority,
      anomaly_level: row.anomaly_level,
      target_code: row.target_code,
      target_name: row.target_name,
      z_score_value: row.z_score_value,
      z_score_type: row.z_score_type,
      news_search_status: row.news_search_status,
      attribution_status: row.attribution_status,
      news_api_request_id: row.news_api_request_id,
      attribution_result_id: row.attribution_result_id,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * 获取配置
   */
  async getConfig(): Promise<OrchestratorConfig> {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  async updateConfig(newConfig: Partial<OrchestratorConfig>): Promise<void> {
    try {
      BaseConfigValidator.validate({ enabled: true, ...newConfig }, Object.keys(newConfig));
      
      // 更新内存配置
      this.config = { ...this.config, ...newConfig };
      
      // 更新数据库配置
      for (const [key, value] of Object.entries(newConfig)) {
        const query = `
          UPDATE orchestrator_config
          SET config_value = ?
          WHERE config_name = ?
        `;
        await this.db.execute(query, [String(value), key]);
      }
      
      this.logger.info('Orchestrator config updated', { newConfig });
    } catch (error) {
      BaseErrorHandler.handle(error, 'AnomalyAttributionOrchestrator');
      throw error;
    }
  }
}
