/**
 * QuantSignalEngine - 量化信号引擎
 * 系统的"数据炼金术士"，负责计算衍生信号和量化分析
 * 重构自SimpleFourLevelMonitor，提升为系统核心引擎
 */

import { DatabaseConnection } from '../database/connection';
import { Redis } from 'ioredis';
import { BaseEngine, BaseEngineConfig } from '../core/BaseEngine';
import { logger } from '../utils/logger';

export interface QuantSignalConfig extends BaseEngineConfig {
  signalTypes: {
    macroRisk: {
      enabled: boolean;
      updateInterval: number;
      thresholds: {
        high: number;
        medium: number;
        low: number;
      };
    };
    marketStyle: {
      enabled: boolean;
      updateInterval: number;
      factors: string[];
    };
    quantFingerprint: {
      enabled: boolean;
      updateInterval: number;
      features: string[];
    };
  };
  universe: {
    broadIndex: string[];
    primaryIndex: string[];
    secondaryIndex: string[];
    leadingStocks: string[];
  };
  alerting: {
    enabled: boolean;
    thresholds: {
      priceChange: number;
      volumeChange: number;
      volatility: number;
    };
  };
}

export interface SignalData {
  id: string;
  signalType: 'macro_risk' | 'market_style' | 'quant_fingerprint';
  targetCode: string;
  targetName: string;
  targetLevel: 'broad' | 'primary' | 'secondary' | 'leading';
  signalValue: number;
  zScore: number;
  isAnomaly: boolean;
  confidence: number;
  factors: { [key: string]: number };
  metadata: any;
  calculatedAt: number;
}

export interface IndexData {
  code: string;
  name: string;
  level: 'broad' | 'primary' | 'secondary';
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  volumeChange: number;
  marketCap: number;
  pe: number;
  pb: number;
  volatility: number;
  timestamp: number;
}

export interface StockData {
  code: string;
  name: string;
  sector: string;
  industry: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  volumeChange: number;
  marketCap: number;
  pe: number;
  pb: number;
  volatility: number;
  zScore: number;
  isAnomaly: boolean;
  anomalyReason?: string;
  timestamp: number;
}

export class QuantSignalEngine extends BaseEngine {
  private config: QuantSignalConfig;
  private signalCache: Map<string, SignalData[]> = new Map();
  private lastUpdate: number = 0;

  constructor(
    db: DatabaseConnection,
    redis: Redis,
    config: QuantSignalConfig
  ) {
    super(db, redis, config);
    this.config = config;
  }

  /**
   * 计算宏观风险信号
   */
  public async calculateMacroRiskSignals(): Promise<SignalData[]> {
    return await this.processTask('macro_risk_calculation', async () => {
      const signals: SignalData[] = [];
      
      // 获取宽基指数数据
      const broadIndexData = await this.getIndexData('broad');
      
      for (const index of broadIndexData) {
        const riskScore = await this.calculateRiskScore(index);
        const zScore = await this.calculateZScore(riskScore, 'macro_risk');
        
        const signal: SignalData = {
          id: `macro_risk_${index.code}_${Date.now()}`,
          signalType: 'macro_risk',
          targetCode: index.code,
          targetName: index.name,
          targetLevel: 'broad',
          signalValue: riskScore,
          zScore,
          isAnomaly: Math.abs(zScore) > this.config.signalTypes.macroRisk.thresholds.high,
          confidence: this.calculateConfidence(zScore),
          factors: {
            volatility: index.volatility,
            priceChange: index.priceChangePercent,
            volumeChange: index.volumeChange
          },
          metadata: {
            marketCap: index.marketCap,
            pe: index.pe,
            pb: index.pb
          },
          calculatedAt: Date.now()
        };
        
        signals.push(signal);
      }
      
      // 缓存信号
      this.signalCache.set('macro_risk', signals);
      
      // 保存到数据库
      await this.saveSignalsToDatabase(signals);
      
      logger.info(`Calculated ${signals.length} macro risk signals`);
      return signals;
    });
  }

  /**
   * 计算市场风格信号
   */
  public async calculateMarketStyleSignals(): Promise<SignalData[]> {
    return await this.processTask('market_style_calculation', async () => {
      const signals: SignalData[] = [];
      
      // 获取一级指数数据
      const primaryIndexData = await this.getIndexData('primary');
      
      for (const index of primaryIndexData) {
        const styleScore = await this.calculateStyleScore(index);
        const zScore = await this.calculateZScore(styleScore, 'market_style');
        
        const signal: SignalData = {
          id: `market_style_${index.code}_${Date.now()}`,
          signalType: 'market_style',
          targetCode: index.code,
          targetName: index.name,
          targetLevel: 'primary',
          signalValue: styleScore,
          zScore,
          isAnomaly: Math.abs(zScore) > 2.0,
          confidence: this.calculateConfidence(zScore),
          factors: {
            growth: this.calculateGrowthFactor(index),
            value: this.calculateValueFactor(index),
            momentum: this.calculateMomentumFactor(index)
          },
          metadata: {
            sector: index.name,
            marketCap: index.marketCap
          },
          calculatedAt: Date.now()
        };
        
        signals.push(signal);
      }
      
      // 缓存信号
      this.signalCache.set('market_style', signals);
      
      // 保存到数据库
      await this.saveSignalsToDatabase(signals);
      
      logger.info(`Calculated ${signals.length} market style signals`);
      return signals;
    });
  }

  /**
   * 计算量化指纹信号
   */
  public async calculateQuantFingerprintSignals(): Promise<SignalData[]> {
    return await this.processTask('quant_fingerprint_calculation', async () => {
      const signals: SignalData[] = [];
      
      // 获取龙头股数据
      const leadingStocksData = await this.getStockData('leading');
      
      for (const stock of leadingStocksData) {
        const fingerprintScore = await this.calculateFingerprintScore(stock);
        const zScore = await this.calculateZScore(fingerprintScore, 'quant_fingerprint');
        
        const signal: SignalData = {
          id: `quant_fingerprint_${stock.code}_${Date.now()}`,
          signalType: 'quant_fingerprint',
          targetCode: stock.code,
          targetName: stock.name,
          targetLevel: 'leading',
          signalValue: fingerprintScore,
          zScore,
          isAnomaly: Math.abs(zScore) > 2.5,
          confidence: this.calculateConfidence(zScore),
          factors: {
            technical: this.calculateTechnicalFactor(stock),
            fundamental: this.calculateFundamentalFactor(stock),
            sentiment: this.calculateSentimentFactor(stock)
          },
          metadata: {
            sector: stock.sector,
            industry: stock.industry,
            marketCap: stock.marketCap
          },
          calculatedAt: Date.now()
        };
        
        signals.push(signal);
      }
      
      // 缓存信号
      this.signalCache.set('quant_fingerprint', signals);
      
      // 保存到数据库
      await this.saveSignalsToDatabase(signals);
      
      logger.info(`Calculated ${signals.length} quant fingerprint signals`);
      return signals;
    });
  }

  /**
   * 获取所有信号
   */
  public async getAllSignals(): Promise<SignalData[]> {
    const allSignals: SignalData[] = [];
    
    for (const signals of this.signalCache.values()) {
      allSignals.push(...signals);
    }
    
    return allSignals;
  }

  /**
   * 获取异常信号
   */
  public async getAnomalySignals(): Promise<SignalData[]> {
    const allSignals = await this.getAllSignals();
    return allSignals.filter(signal => signal.isAnomaly);
  }

  /**
   * 获取信号统计
   */
  public getSignalStats(): any {
    const stats = {
      totalSignals: 0,
      anomalySignals: 0,
      signalTypes: {
        macro_risk: 0,
        market_style: 0,
        quant_fingerprint: 0
      },
      lastUpdate: this.lastUpdate
    };
    
    for (const [type, signals] of this.signalCache.entries()) {
      stats.totalSignals += signals.length;
      stats.anomalySignals += signals.filter(s => s.isAnomaly).length;
      stats.signalTypes[type as keyof typeof stats.signalTypes] = signals.length;
    }
    
    return stats;
  }

  /**
   * 计算风险评分
   */
  private async calculateRiskScore(index: IndexData): Promise<number> {
    // 基于波动率、价格变化、成交量变化计算风险评分
    const volatilityWeight = 0.4;
    const priceChangeWeight = 0.3;
    const volumeChangeWeight = 0.3;
    
    const riskScore = 
      (Math.abs(index.volatility) * volatilityWeight) +
      (Math.abs(index.priceChangePercent) * priceChangeWeight) +
      (Math.abs(index.volumeChange) * volumeChangeWeight);
    
    return riskScore;
  }

  /**
   * 计算风格评分
   */
  private async calculateStyleScore(index: IndexData): Promise<number> {
    // 基于成长、价值、动量因子计算风格评分
    const growthFactor = this.calculateGrowthFactor(index);
    const valueFactor = this.calculateValueFactor(index);
    const momentumFactor = this.calculateMomentumFactor(index);
    
    return (growthFactor + valueFactor + momentumFactor) / 3;
  }

  /**
   * 计算指纹评分
   */
  private async calculateFingerprintScore(stock: StockData): Promise<number> {
    // 基于技术、基本面、情感因子计算指纹评分
    const technicalFactor = this.calculateTechnicalFactor(stock);
    const fundamentalFactor = this.calculateFundamentalFactor(stock);
    const sentimentFactor = this.calculateSentimentFactor(stock);
    
    return (technicalFactor + fundamentalFactor + sentimentFactor) / 3;
  }

  /**
   * 计算Z分数
   */
  private async calculateZScore(value: number, signalType: string): Promise<number> {
    // 从数据库获取历史数据计算Z分数
    const historicalData = await this.getHistoricalSignalData(signalType);
    
    if (historicalData.length < 2) {
      return 0;
    }
    
    const mean = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length;
    const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) {
      return 0;
    }
    
    return (value - mean) / stdDev;
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(zScore: number): number {
    // 基于Z分数的绝对值计算置信度
    const absZScore = Math.abs(zScore);
    
    if (absZScore >= 3) return 0.95;
    if (absZScore >= 2) return 0.85;
    if (absZScore >= 1) return 0.70;
    return 0.50;
  }

  /**
   * 计算成长因子
   */
  private calculateGrowthFactor(index: IndexData): number {
    // 基于PE比率和价格变化计算成长因子
    const peFactor = index.pe > 0 ? Math.min(index.pe / 20, 1) : 0;
    const priceChangeFactor = Math.max(0, index.priceChangePercent / 10);
    
    return (peFactor + priceChangeFactor) / 2;
  }

  /**
   * 计算价值因子
   */
  private calculateValueFactor(index: IndexData): number {
    // 基于PB比率计算价值因子
    return index.pb > 0 ? Math.max(0, 1 - index.pb / 3) : 0;
  }

  /**
   * 计算动量因子
   */
  private calculateMomentumFactor(index: IndexData): number {
    // 基于价格变化和成交量变化计算动量因子
    const priceMomentum = Math.tanh(index.priceChangePercent / 5);
    const volumeMomentum = Math.tanh(index.volumeChange / 50);
    
    return (priceMomentum + volumeMomentum) / 2;
  }

  /**
   * 计算技术因子
   */
  private calculateTechnicalFactor(stock: StockData): number {
    // 基于技术指标计算技术因子
    const volatilityFactor = Math.tanh(stock.volatility / 2);
    const priceChangeFactor = Math.tanh(stock.priceChangePercent / 10);
    
    return (volatilityFactor + priceChangeFactor) / 2;
  }

  /**
   * 计算基本面因子
   */
  private calculateFundamentalFactor(stock: StockData): number {
    // 基于PE、PB比率计算基本面因子
    const peFactor = stock.pe > 0 ? Math.min(stock.pe / 30, 1) : 0;
    const pbFactor = stock.pb > 0 ? Math.min(stock.pb / 5, 1) : 0;
    
    return (peFactor + pbFactor) / 2;
  }

  /**
   * 计算情感因子
   */
  private calculateSentimentFactor(stock: StockData): number {
    // 基于成交量变化和价格变化计算情感因子
    const volumeSentiment = Math.tanh(stock.volumeChange / 100);
    const priceSentiment = Math.tanh(stock.priceChangePercent / 15);
    
    return (volumeSentiment + priceSentiment) / 2;
  }

  /**
   * 获取指数数据
   */
  private async getIndexData(level: 'broad' | 'primary' | 'secondary'): Promise<IndexData[]> {
    // 这里应该从数据库或API获取数据
    // 暂时返回模拟数据
    return [];
  }

  /**
   * 获取股票数据
   */
  private async getStockData(level: 'leading'): Promise<StockData[]> {
    // 这里应该从数据库或API获取数据
    // 暂时返回模拟数据
    return [];
  }

  /**
   * 获取历史信号数据
   */
  private async getHistoricalSignalData(signalType: string): Promise<number[]> {
    // 从数据库获取历史信号数据
    const result = await this.db.query(
      'SELECT signal_value FROM quant_signals WHERE signal_type = $1 ORDER BY calculated_at DESC LIMIT 100',
      [signalType]
    );
    
    return result.rows.map(row => parseFloat(row.signal_value));
  }

  /**
   * 保存信号到数据库
   */
  private async saveSignalsToDatabase(signals: SignalData[]): Promise<void> {
    for (const signal of signals) {
      await this.db.query(`
        INSERT INTO quant_signals (
          signal_type, signal_name, signal_value, z_score, is_anomaly, 
          signal_data, calculated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (signal_type, signal_name, calculated_at) 
        DO UPDATE SET
          signal_value = EXCLUDED.signal_value,
          z_score = EXCLUDED.z_score,
          is_anomaly = EXCLUDED.is_anomaly,
          signal_data = EXCLUDED.signal_data
      `, [
        signal.signalType,
        signal.targetName,
        signal.signalValue,
        signal.zScore,
        signal.isAnomaly,
        JSON.stringify({
          factors: signal.factors,
          metadata: signal.metadata,
          confidence: signal.confidence
        }),
        new Date(signal.calculatedAt)
      ]);
    }
  }

  /**
   * 启动引擎
   */
  protected async onStart(): Promise<void> {
    logger.info('QuantSignalEngine started');
    
    // 启动定期计算任务
    if (this.config.signalTypes.macroRisk.enabled) {
      setInterval(() => {
        this.calculateMacroRiskSignals().catch(error => {
          logger.error('Failed to calculate macro risk signals:', error);
        });
      }, this.config.signalTypes.macroRisk.updateInterval * 60 * 1000);
    }
    
    if (this.config.signalTypes.marketStyle.enabled) {
      setInterval(() => {
        this.calculateMarketStyleSignals().catch(error => {
          logger.error('Failed to calculate market style signals:', error);
        });
      }, this.config.signalTypes.marketStyle.updateInterval * 60 * 1000);
    }
    
    if (this.config.signalTypes.quantFingerprint.enabled) {
      setInterval(() => {
        this.calculateQuantFingerprintSignals().catch(error => {
          logger.error('Failed to calculate quant fingerprint signals:', error);
        });
      }, this.config.signalTypes.quantFingerprint.updateInterval * 60 * 1000);
    }
  }

  /**
   * 停止引擎
   */
  protected async onStop(): Promise<void> {
    logger.info('QuantSignalEngine stopped');
    this.signalCache.clear();
  }
}

export default QuantSignalEngine;
