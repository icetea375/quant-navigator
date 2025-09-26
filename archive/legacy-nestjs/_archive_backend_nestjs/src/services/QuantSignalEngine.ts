/**
 * QuantSignalEngine - 量化信号引擎
 *
 * 功能：
 * 1. 计算基础量化信号（个体Z分数）
 * 2. 计算复杂量化信号（宏观风险、市场风格等）
 * 3. 支持核心宇宙和观察宇宙的不同处理策略
 */

import { Database } from '../database/unified-connection';
import { Logger } from '../utils/logger';

export interface QuantSignal {
  stock_code: string;
  signal_date: string;
  individual_z_score: number;
  macro_risk_z_score?: number;
  market_style_z_score?: number;
  quant_fingerprint_z_score?: number;
  created_at: string;
}

export interface SignalCalculationConfig {
  lookbackPeriod: number; // 回看期
  minDataPoints: number; // 最小数据点数
  enableComplexSignals: boolean; // 是否启用复杂信号计算
}

export class QuantSignalEngine {
  private db: Database;
  private logger: Logger;
  private config: SignalCalculationConfig;

  constructor(db: Database, logger: Logger, config?: Partial<SignalCalculationConfig>) {
    this.db = db;
    this.logger = logger;
    this.config = {
      lookbackPeriod: 120, // 120个交易日
      minDataPoints: 60, // 最少60个数据点
      enableComplexSignals: true,
      ...config
    };
  }

  /**
   * 初始化量化信号引擎
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('初始化量化信号引擎...');

      // 创建量化信号表
      await this.createQuantSignalsTable();

      this.logger.info('量化信号引擎初始化完成');
    } catch (error) {
      this.logger.error('初始化量化信号引擎失败:', error);
      throw error;
    }
  }

  /**
   * 创建量化信号表
   */
  private async createQuantSignalsTable(): Promise<void> {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS quant_signals (
          id SERIAL PRIMARY KEY,
          stock_code VARCHAR(20) NOT NULL,
          signal_date DATE NOT NULL,
          individual_z_score DECIMAL(10,4) NOT NULL,
          macro_risk_z_score DECIMAL(10,4),
          market_style_z_score DECIMAL(10,4),
          quant_fingerprint_z_score DECIMAL(10,4),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(stock_code, signal_date)
        )
      `);

      // 创建索引
      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_quant_signals_stock_date
        ON quant_signals(stock_code, signal_date)
      `);
      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_quant_signals_date
        ON quant_signals(signal_date)
      `);

      this.logger.info('量化信号表创建完成');
    } catch (error) {
      this.logger.error('创建量化信号表失败:', error);
      throw error;
    }
  }

  /**
   * 计算基础信号（仅个体Z分数）
   * 用于观察宇宙股票
   */
  async calculateBasicSignals(stockCode: string): Promise<void> {
    try {
      this.logger.debug(`计算${stockCode}的基础信号...`);

      // 获取最近的数据
      const recentData = await this.getRecentPriceData(stockCode);
      if (recentData.length < this.config.minDataPoints) {
        this.logger.warn(`${stockCode}数据不足，跳过信号计算`);
        return;
      }

      // 计算个体Z分数
      const individualZScore = this.calculateIndividualZScore(recentData);

      // 保存基础信号
      await this.saveBasicSignal(stockCode, individualZScore);

      this.logger.debug(`${stockCode}基础信号计算完成`);
    } catch (error) {
      this.logger.error(`计算${stockCode}基础信号失败:`, error);
      throw error;
    }
  }

  /**
   * 计算复杂信号（包含所有信号类型）
   * 用于核心宇宙股票
   */
  async calculateComplexSignals(stockCode: string): Promise<void> {
    try {
      this.logger.debug(`计算${stockCode}的复杂信号...`);

      // 获取最近的数据
      const recentData = await this.getRecentPriceData(stockCode);
      if (recentData.length < this.config.minDataPoints) {
        this.logger.warn(`${stockCode}数据不足，跳过信号计算`);
        return;
      }

      // 计算个体Z分数
      const individualZScore = this.calculateIndividualZScore(recentData);

      // 计算宏观风险Z分数
      const macroRiskZScore = await this.calculateMacroRiskZScore(stockCode, recentData);

      // 计算市场风格Z分数
      const marketStyleZScore = await this.calculateMarketStyleZScore(stockCode, recentData);

      // 计算量化指纹Z分数
      const quantFingerprintZScore = await this.calculateQuantFingerprintZScore(stockCode, recentData);

      // 保存复杂信号
      await this.saveComplexSignal(stockCode, {
        individual_z_score: individualZScore,
        macro_risk_z_score: macroRiskZScore,
        market_style_z_score: marketStyleZScore,
        quant_fingerprint_z_score: quantFingerprintZScore
      });

      this.logger.debug(`${stockCode}复杂信号计算完成`);
    } catch (error) {
      this.logger.error(`计算${stockCode}复杂信号失败:`, error);
      throw error;
    }
  }

  /**
   * 获取最近的价格数据
   */
  private async getRecentPriceData(stockCode: string): Promise<any[]> {
    try {
      const result = await this.db.query(`
        SELECT trade_date, close, volume, amount, pct_chg
        FROM daily_basic
        WHERE ts_code = $1
        AND trade_date >= CURRENT_DATE - INTERVAL '${this.config.lookbackPeriod} days'
        ORDER BY trade_date ASC
      `, [stockCode]);

      return result.rows;
    } catch (error) {
      this.logger.error(`获取${stockCode}价格数据失败:`, error);
      throw error;
    }
  }

  /**
   * 计算个体Z分数
   */
  private calculateIndividualZScore(data: any[]): number {
    if (data.length < 2) return 0;

    // 计算收益率
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      const returnRate = (data[i].close - data[i-1].close) / data[i-1].close;
      returns.push(returnRate);
    }

    // 计算均值和标准差
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // 计算最新收益率的Z分数
    const latestReturn = returns[returns.length - 1];
    return (latestReturn - mean) / stdDev;
  }

  /**
   * 计算宏观风险Z分数
   */
  private async calculateMacroRiskZScore(stockCode: string, data: any[]): Promise<number> {
    try {
      // 获取市场指数数据（以沪深300为例）
      const marketData = await this.getMarketIndexData('000300.SH', data.length);
      if (marketData.length < this.config.minDataPoints) {
        return 0;
      }

      // 计算股票收益率
      const stockReturns = this.calculateReturns(data);
      // 计算市场收益率
      const marketReturns = this.calculateReturns(marketData);

      // 计算Beta
      const beta = this.calculateBeta(stockReturns, marketReturns);

      // 计算宏观风险Z分数
      const macroRisk = beta * this.calculateMarketVolatility(marketReturns);
      return this.normalizeToZScore(macroRisk, stockReturns);

    } catch (error) {
      this.logger.warn(`计算${stockCode}宏观风险Z分数失败:`, error);
      return 0;
    }
  }

  /**
   * 计算市场风格Z分数
   */
  private async calculateMarketStyleZScore(stockCode: string, data: any[]): Promise<number> {
    try {
      // 获取不同风格指数的数据
      const valueIndexData = await this.getMarketIndexData('000905.SH', data.length); // 中证500
      const growthIndexData = await this.getMarketIndexData('000852.SH', data.length); // 中证1000

      if (valueIndexData.length < this.config.minDataPoints || growthIndexData.length < this.config.minDataPoints) {
        return 0;
      }

      // 计算股票收益率
      const stockReturns = this.calculateReturns(data);
      // 计算价值风格收益率
      const valueReturns = this.calculateReturns(valueIndexData);
      // 计算成长风格收益率
      const growthReturns = this.calculateReturns(growthIndexData);

      // 计算与价值风格的相关性
      const valueCorrelation = this.calculateCorrelation(stockReturns, valueReturns);
      // 计算与成长风格的相关性
      const growthCorrelation = this.calculateCorrelation(stockReturns, growthReturns);

      // 计算风格Z分数
      const styleScore = valueCorrelation - growthCorrelation;
      return this.normalizeToZScore(styleScore, stockReturns);

    } catch (error) {
      this.logger.warn(`计算${stockCode}市场风格Z分数失败:`, error);
      return 0;
    }
  }

  /**
   * 计算量化指纹Z分数
   */
  private async calculateQuantFingerprintZScore(stockCode: string, data: any[]): Promise<number> {
    try {
      // 计算多个技术指标
      const rsi = this.calculateRSI(data);
      const macd = this.calculateMACD(data);
      const bollinger = this.calculateBollingerBands(data);
      const volume = this.calculateVolumeIndicator(data);

      // 组合成量化指纹
      const fingerprint = (rsi + macd + bollinger + volume) / 4;

      return this.normalizeToZScore(fingerprint, this.calculateReturns(data));

    } catch (error) {
      this.logger.warn(`计算${stockCode}量化指纹Z分数失败:`, error);
      return 0;
    }
  }

  /**
   * 获取市场指数数据
   */
  private async getMarketIndexData(indexCode: string, length: number): Promise<any[]> {
    try {
      const result = await this.db.query(`
        SELECT trade_date, close
        FROM daily_basic
        WHERE ts_code = $1
        AND trade_date >= CURRENT_DATE - INTERVAL '${this.config.lookbackPeriod} days'
        ORDER BY trade_date ASC
        LIMIT $2
      `, [indexCode, length]);

      return result.rows;
    } catch (error) {
      this.logger.warn(`获取${indexCode}数据失败:`, error);
      return [];
    }
  }

  /**
   * 计算收益率序列
   */
  private calculateReturns(data: any[]): number[] {
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      const returnRate = (data[i].close - data[i-1].close) / data[i-1].close;
      returns.push(returnRate);
    }
    return returns;
  }

  /**
   * 计算Beta
   */
  private calculateBeta(stockReturns: number[], marketReturns: number[]): number {
    if (stockReturns.length !== marketReturns.length || stockReturns.length < 2) {
      return 1;
    }

    const n = stockReturns.length;
    const stockMean = stockReturns.reduce((sum, r) => sum + r, 0) / n;
    const marketMean = marketReturns.reduce((sum, r) => sum + r, 0) / n;

    let covariance = 0;
    let marketVariance = 0;

    for (let i = 0; i < n; i++) {
      covariance += (stockReturns[i] - stockMean) * (marketReturns[i] - marketMean);
      marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
    }

    return marketVariance === 0 ? 1 : covariance / marketVariance;
  }

  /**
   * 计算市场波动率
   */
  private calculateMarketVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  /**
   * 计算相关性
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) return 0;

    const n = x.length;
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = y.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let xSumSq = 0;
    let ySumSq = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      numerator += xDiff * yDiff;
      xSumSq += xDiff * xDiff;
      ySumSq += yDiff * yDiff;
    }

    const denominator = Math.sqrt(xSumSq * ySumSq);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * 计算RSI
   */
  private calculateRSI(data: any[]): number {
    if (data.length < 14) return 50;

    const gains = [];
    const losses = [];

    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i-1].close;
      if (change > 0) {
        gains.push(change);
        losses.push(0);
      } else {
        gains.push(0);
        losses.push(-change);
      }
    }

    const avgGain = gains.slice(-14).reduce((sum, g) => sum + g, 0) / 14;
    const avgLoss = losses.slice(-14).reduce((sum, l) => sum + l, 0) / 14;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * 计算MACD
   */
  private calculateMACD(data: any[]): number {
    if (data.length < 26) return 0;

    const prices = data.map(d => d.close);
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);

    return ema12 - ema26;
  }

  /**
   * 计算EMA
   */
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];

    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  /**
   * 计算布林带
   */
  private calculateBollingerBands(data: any[]): number {
    if (data.length < 20) return 0;

    const prices = data.slice(-20).map(d => d.close);
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);

    const upperBand = mean + (2 * stdDev);
    const lowerBand = mean - (2 * stdDev);
    const currentPrice = prices[prices.length - 1];

    return (currentPrice - lowerBand) / (upperBand - lowerBand);
  }

  /**
   * 计算成交量指标
   */
  private calculateVolumeIndicator(data: any[]): number {
    if (data.length < 20) return 0;

    const volumes = data.slice(-20).map(d => d.volume);
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const currentVolume = volumes[volumes.length - 1];

    return currentVolume / avgVolume;
  }

  /**
   * 标准化为Z分数
   */
  private normalizeToZScore(value: number, data: number[]): number {
    if (data.length < 2) return 0;

    const mean = data.reduce((sum, d) => sum + d, 0) / data.length;
    const variance = data.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    return stdDev === 0 ? 0 : (value - mean) / stdDev;
  }

  /**
   * 保存基础信号
   */
  private async saveBasicSignal(stockCode: string, individualZScore: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      await this.db.query(`
        INSERT INTO quant_signals
        (stock_code, signal_date, individual_z_score)
        VALUES ($1, $2, $3)
        ON CONFLICT (stock_code, signal_date)
        DO UPDATE SET
          individual_z_score = EXCLUDED.individual_z_score,
          updated_at = CURRENT_TIMESTAMP
      `, [stockCode, today, individualZScore]);

    } catch (error) {
      this.logger.error(`保存${stockCode}基础信号失败:`, error);
      throw error;
    }
  }

  /**
   * 保存复杂信号
   */
  private async saveComplexSignal(stockCode: string, signals: {
    individual_z_score: number;
    macro_risk_z_score: number;
    market_style_z_score: number;
    quant_fingerprint_z_score: number;
  }): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      await this.db.query(`
        INSERT INTO quant_signals
        (stock_code, signal_date, individual_z_score, macro_risk_z_score, market_style_z_score, quant_fingerprint_z_score)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (stock_code, signal_date)
        DO UPDATE SET
          individual_z_score = EXCLUDED.individual_z_score,
          macro_risk_z_score = EXCLUDED.macro_risk_z_score,
          market_style_z_score = EXCLUDED.market_style_z_score,
          quant_fingerprint_z_score = EXCLUDED.quant_fingerprint_z_score,
          updated_at = CURRENT_TIMESTAMP
      `, [
        stockCode,
        today,
        signals.individual_z_score,
        signals.macro_risk_z_score,
        signals.market_style_z_score,
        signals.quant_fingerprint_z_score
      ]);

    } catch (error) {
      this.logger.error(`保存${stockCode}复杂信号失败:`, error);
      throw error;
    }
  }

  /**
   * 获取股票的最新信号
   */
  async getLatestSignals(stockCode: string): Promise<QuantSignal | null> {
    try {
      const result = await this.db.query(`
        SELECT * FROM quant_signals
        WHERE stock_code = $1
        ORDER BY signal_date DESC
        LIMIT 1
      `, [stockCode]);

      return result.rows[0] || null;
    } catch (error) {
      this.logger.error(`获取${stockCode}最新信号失败:`, error);
      return null;
    }
  }

  /**
   * 获取指定日期的所有信号
   */
  async getSignalsByDate(date: string): Promise<QuantSignal[]> {
    try {
      const result = await this.db.query(`
        SELECT * FROM quant_signals
        WHERE signal_date = $1
        ORDER BY stock_code
      `, [date]);

      return result.rows;
    } catch (error) {
      this.logger.error(`获取${date}信号失败:`, error);
      return [];
    }
  }

  /**
   * 更新配置
   */
  async updateConfig(newConfig: Partial<SignalCalculationConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...newConfig };
      this.logger.info('量化信号引擎配置已更新');
    } catch (error) {
      this.logger.error('更新量化信号引擎配置失败:', error);
      throw error;
    }
  }
}
