/**
 * DataPipelineV15Manager - DataPipeline v1.5 统一管理器
 * "骨架+神经"双重分析体系的核心调度器
 */

import { SimpleTushareDataSource, defaultTushareConfig } from './SimpleTushareDataSource';
import { IndustryFetcher, defaultIndustryConfig, IndustryConfig } from '../fetchers/IndustryFetcher';
import { ConceptFetcher, defaultConceptConfig, ConceptConfig } from '../fetchers/ConceptFetcher';
import { TextualFetcher, defaultTextualConfig, TextualConfig } from '../fetchers/TextualFetcher';
import { MoneyFlowFetcher, defaultMoneyFlowConfig, MoneyFlowConfig } from '../fetchers/MoneyFlowFetcher';
import { MarketStructureFetcher, defaultMarketStructureConfig, MarketStructureConfig } from '../fetchers/MarketStructureFetcher';
import { 
  QuantSignalEngineDataSourceAdapter,
  HotspotIntelligenceEngineDataSourceAdapter,
  AttributionCoreDataSourceAdapter
} from '../engines/DataPipelineV15EngineInterfaces';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';

export interface DataPipelineV15Config {
  enabled: boolean;
  
  // 骨架系统配置
  skeleton: {
    enabled: boolean;
    industry: IndustryConfig;
  };
  
  // 神经系统配置
  nervous: {
    enabled: boolean;
    concept: ConceptConfig;
  };
  
  // 深度文本配置
  textual: {
    enabled: boolean;
    textual: TextualConfig;
  };
  
  // 博弈数据配置
  game: {
    enabled: boolean;
    moneyFlow: MoneyFlowConfig;
    marketStructure: MarketStructureConfig;
  };
  
  // 调度配置
  schedule: {
    // 骨架更新 (低频)
    skeletonUpdate: {
      enabled: boolean;
      frequency: 'monthly' | 'quarterly';
      day: number; // 1-31
      time: string; // "02:00"
    };
    
    // 神经更新 (高频)
    nervousUpdate: {
      enabled: boolean;
      time: string; // "16:30"
    };
    
    // 文本更新
    textualUpdate: {
      enabled: boolean;
      time: string; // "18:00"
    };
    
    // 博弈数据更新
    gameUpdate: {
      enabled: boolean;
      time: string; // "16:30"
    };
  };
}

export interface DataPipelineV15Report {
  timestamp: string;
  
  // 骨架系统报告
  skeleton: {
    success: boolean;
    industryClassification: number;
    industryMembers: number;
    error?: string;
  };
  
  // 神经系统报告
  nervous: {
    success: boolean;
    concepts: number;
    conceptMembers: number;
    error?: string;
  };
  
  // 文本系统报告
  textual: {
    success: boolean;
    longFormNews: number;
    newsBroadcast: number;
    eInteraction: number;
    error?: string;
  };
  
  // 博弈系统报告
  game: {
    success: boolean;
    moneyFlow: number;
    marketStructure: number;
    error?: string;
  };
  
  // 智能引擎数据源状态
  engineDataSources: {
    quantSignal: boolean;
    hotspotIntelligence: boolean;
    attributionCore: boolean;
  };
  
  summary: {
    totalSuccess: number;
    totalFailed: number;
    executionTime: number;
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export class DataPipelineV15Manager {
  private config: DataPipelineV15Config;
  private tushareSource: SimpleTushareDataSource;
  
  // 数据获取器
  private industryFetcher?: IndustryFetcher;
  private conceptFetcher?: ConceptFetcher;
  private textualFetcher?: TextualFetcher;
  private moneyFlowFetcher?: MoneyFlowFetcher;
  private marketStructureFetcher?: MarketStructureFetcher;
  
  // 智能引擎数据源适配器
  private quantSignalDataSource?: QuantSignalEngineDataSourceAdapter;
  private hotspotIntelligenceDataSource?: HotspotIntelligenceEngineDataSourceAdapter;
  private attributionCoreDataSource?: AttributionCoreDataSourceAdapter;

  constructor(config?: Partial<DataPipelineV15Config>) {
    this.config = this.mergeConfig(config);
    this.tushareSource = new SimpleTushareDataSource(defaultTushareConfig);
    
    this.initializeFetchers();
    this.initializeEngineDataSources();
  }

  /**
   * 初始化所有数据获取器
   */
  private initializeFetchers(): void {
    // 骨架系统
    if (this.config.skeleton.enabled) {
      this.industryFetcher = new IndustryFetcher(this.tushareSource, this.config.skeleton.industry);
    }

    // 神经系统
    if (this.config.nervous.enabled) {
      this.conceptFetcher = new ConceptFetcher(this.tushareSource, this.config.nervous.concept);
    }

    // 文本系统
    if (this.config.textual.enabled) {
      this.textualFetcher = new TextualFetcher(this.tushareSource, this.config.textual.textual);
    }

    // 博弈系统
    if (this.config.game.enabled) {
      this.moneyFlowFetcher = new MoneyFlowFetcher(this.tushareSource, this.config.game.moneyFlow);
      this.marketStructureFetcher = new MarketStructureFetcher(this.tushareSource, this.config.game.marketStructure);
    }
  }

  /**
   * 初始化智能引擎数据源
   */
  private initializeEngineDataSources(): void {
    if (this.industryFetcher && this.marketStructureFetcher) {
      this.quantSignalDataSource = new QuantSignalEngineDataSourceAdapter(
        this.industryFetcher,
        this.marketStructureFetcher
      );
    }

    if (this.conceptFetcher && this.moneyFlowFetcher) {
      this.hotspotIntelligenceDataSource = new HotspotIntelligenceEngineDataSourceAdapter(
        this.conceptFetcher,
        this.moneyFlowFetcher
      );
    }

    if (this.industryFetcher && this.conceptFetcher && this.textualFetcher && this.marketStructureFetcher) {
      this.attributionCoreDataSource = new AttributionCoreDataSourceAdapter(
        this.industryFetcher,
        this.conceptFetcher,
        this.textualFetcher,
        this.marketStructureFetcher
      );
    }
  }

  /**
   * 执行骨架系统更新 (低频)
   */
  public async runSkeletonUpdate(): Promise<DataPipelineV15Report> {
    const startTime = Date.now();
    const report: DataPipelineV15Report = this.initializeReport();

    try {
      console.log('🏗️ Starting skeleton system update (Industry Classification)...');

      if (this.config.skeleton.enabled && this.industryFetcher) {
        try {
          const skeletonData = await this.industryFetcher.periodicUpdate();
          
          report.skeleton.success = true;
          report.skeleton.industryClassification = 
            skeletonData.shenwan.classification.length + skeletonData.citic.classification.length;
          report.skeleton.industryMembers = 
            skeletonData.shenwan.members.length + skeletonData.citic.members.length;
          
          console.log(`✅ Skeleton data updated: ${report.skeleton.industryClassification} industries, ${report.skeleton.industryMembers} members`);
        } catch (error) {
          report.skeleton.success = false;
          report.skeleton.error = error instanceof Error ? error.message : String(error);
          console.error('❌ Failed to update skeleton data:', error);
        }
      }

      report.summary.executionTime = Date.now() - startTime;
      this.updateSummary(report);
      
      console.log('✅ Skeleton system update completed');
      return report;

    } catch (error) {
      BaseErrorHandler.handle(error, 'DataPipelineV15Manager.runSkeletonUpdate');
      report.summary.executionTime = Date.now() - startTime;
      this.updateSummary(report);
      throw error;
    }
  }

  /**
   * 执行神经系统更新 (高频)
   */
  public async runNervousUpdate(tradeDate?: string): Promise<DataPipelineV15Report> {
    const startTime = Date.now();
    const report: DataPipelineV15Report = this.initializeReport();

    try {
      console.log('🧠 Starting nervous system update (Concept Hotspots)...');

      if (this.config.nervous.enabled && this.conceptFetcher) {
        try {
          const nervousData = await this.conceptFetcher.dailyDataCollection(tradeDate);
          
          report.nervous.success = true;
          report.nervous.concepts = 
            nervousData.thsConcepts.length + nervousData.dcConcepts.length;
          report.nervous.conceptMembers = 
            nervousData.thsMembers.length + nervousData.dcMembers.length;
          
          console.log(`✅ Nervous data updated: ${report.nervous.concepts} concepts, ${report.nervous.conceptMembers} members`);
        } catch (error) {
          report.nervous.success = false;
          report.nervous.error = error instanceof Error ? error.message : String(error);
          console.error('❌ Failed to update nervous data:', error);
        }
      }

      report.summary.executionTime = Date.now() - startTime;
      this.updateSummary(report);
      
      console.log('✅ Nervous system update completed');
      return report;

    } catch (error) {
      BaseErrorHandler.handle(error, 'DataPipelineV15Manager.runNervousUpdate');
      report.summary.executionTime = Date.now() - startTime;
      this.updateSummary(report);
      throw error;
    }
  }

  /**
   * 执行文本系统更新
   */
  public async runTextualUpdate(tradeDate?: string): Promise<DataPipelineV15Report> {
    const startTime = Date.now();
    const report: DataPipelineV15Report = this.initializeReport();

    try {
      console.log('📰 Starting textual intelligence update...');

      if (this.config.textual.enabled && this.textualFetcher) {
        try {
          const textualData = await this.textualFetcher.dailyDataCollection(tradeDate);
          
          report.textual.success = true;
          report.textual.longFormNews = textualData.longFormNews.length;
          report.textual.newsBroadcast = textualData.newsBroadcast.length;
          report.textual.eInteraction = textualData.eInteraction.length;
          
          console.log(`✅ Textual data updated: ${report.textual.longFormNews} news, ${report.textual.newsBroadcast} broadcasts, ${report.textual.eInteraction} interactions`);
        } catch (error) {
          report.textual.success = false;
          report.textual.error = error instanceof Error ? error.message : String(error);
          console.error('❌ Failed to update textual data:', error);
        }
      }

      report.summary.executionTime = Date.now() - startTime;
      this.updateSummary(report);
      
      console.log('✅ Textual intelligence update completed');
      return report;

    } catch (error) {
      BaseErrorHandler.handle(error, 'DataPipelineV15Manager.runTextualUpdate');
      report.summary.executionTime = Date.now() - startTime;
      this.updateSummary(report);
      throw error;
    }
  }

  /**
   * 执行博弈系统更新
   */
  public async runGameUpdate(tradeDate?: string): Promise<DataPipelineV15Report> {
    const startTime = Date.now();
    const report: DataPipelineV15Report = this.initializeReport();

    try {
      console.log('🎯 Starting game theory data update...');

      if (this.config.game.enabled) {
        // 资金流向数据
        if (this.moneyFlowFetcher) {
          try {
            const moneyFlowData = await this.moneyFlowFetcher.dailyDataCollection(tradeDate);
            report.game.moneyFlow = moneyFlowData.stockFlows.length + moneyFlowData.sectorFlows.length;
            console.log(`✅ Money flow data updated: ${report.game.moneyFlow} records`);
          } catch (error) {
            console.error('❌ Failed to update money flow data:', error);
          }
        }

        // 市场结构数据
        if (this.marketStructureFetcher) {
          try {
            const [auctionData, chipData] = await Promise.all([
              this.marketStructureFetcher.preMarketDataCollection(tradeDate),
              this.marketStructureFetcher.postMarketDataCollection(tradeDate)
            ]);
            report.game.marketStructure = auctionData.length + chipData.length;
            console.log(`✅ Market structure data updated: ${report.game.marketStructure} records`);
          } catch (error) {
            console.error('❌ Failed to update market structure data:', error);
          }
        }

        report.game.success = true;
      }

      report.summary.executionTime = Date.now() - startTime;
      this.updateSummary(report);
      
      console.log('✅ Game theory data update completed');
      return report;

    } catch (error) {
      BaseErrorHandler.handle(error, 'DataPipelineV15Manager.runGameUpdate');
      report.summary.executionTime = Date.now() - startTime;
      this.updateSummary(report);
      throw error;
    }
  }

  /**
   * 执行完整的数据管道更新
   */
  public async runFullUpdate(tradeDate?: string): Promise<DataPipelineV15Report> {
    const startTime = Date.now();
    const report: DataPipelineV15Report = this.initializeReport();

    try {
      console.log('🚀 Starting DataPipeline v1.5 full update...');

      // 并行执行各系统更新
      const [skeletonReport, nervousReport, textualReport, gameReport] = await Promise.allSettled([
        this.runSkeletonUpdate(),
        this.runNervousUpdate(tradeDate),
        this.runTextualUpdate(tradeDate),
        this.runGameUpdate(tradeDate)
      ]);

      // 合并报告
      if (skeletonReport.status === 'fulfilled') {
        report.skeleton = skeletonReport.value.skeleton;
      }
      if (nervousReport.status === 'fulfilled') {
        report.nervous = nervousReport.value.nervous;
      }
      if (textualReport.status === 'fulfilled') {
        report.textual = textualReport.value.textual;
      }
      if (gameReport.status === 'fulfilled') {
        report.game = gameReport.value.game;
      }

      // 更新智能引擎数据源状态
      report.engineDataSources = {
        quantSignal: !!this.quantSignalDataSource,
        hotspotIntelligence: !!this.hotspotIntelligenceDataSource,
        attributionCore: !!this.attributionCoreDataSource
      };

      report.summary.executionTime = Date.now() - startTime;
      this.updateSummary(report);
      
      console.log('✅ DataPipeline v1.5 full update completed');
      return report;

    } catch (error) {
      BaseErrorHandler.handle(error, 'DataPipelineV15Manager.runFullUpdate');
      report.summary.executionTime = Date.now() - startTime;
      this.updateSummary(report);
      throw error;
    }
  }

  /**
   * 获取智能引擎数据源
   */
  public getEngineDataSources(): {
    quantSignal?: QuantSignalEngineDataSourceAdapter;
    hotspotIntelligence?: HotspotIntelligenceEngineDataSourceAdapter;
    attributionCore?: AttributionCoreDataSourceAdapter;
  } {
    return {
      quantSignal: this.quantSignalDataSource,
      hotspotIntelligence: this.hotspotIntelligenceDataSource,
      attributionCore: this.attributionCoreDataSource
    };
  }

  /**
   * 获取系统健康状态
   */
  public getSystemHealth(): {
    overall: 'healthy' | 'degraded' | 'critical';
    systems: {
      skeleton: { enabled: boolean; health: 'healthy' | 'degraded' | 'critical' };
      nervous: { enabled: boolean; health: 'healthy' | 'degraded' | 'critical' };
      textual: { enabled: boolean; health: 'healthy' | 'degraded' | 'critical' };
      game: { enabled: boolean; health: 'healthy' | 'degraded' | 'critical' };
    };
    engines: {
      quantSignal: boolean;
      hotspotIntelligence: boolean;
      attributionCore: boolean;
    };
  } {
    return {
      overall: 'healthy', // 简化实现
      systems: {
        skeleton: { enabled: this.config.skeleton.enabled, health: 'healthy' },
        nervous: { enabled: this.config.nervous.enabled, health: 'healthy' },
        textual: { enabled: this.config.textual.enabled, health: 'healthy' },
        game: { enabled: this.config.game.enabled, health: 'healthy' }
      },
      engines: {
        quantSignal: !!this.quantSignalDataSource,
        hotspotIntelligence: !!this.hotspotIntelligenceDataSource,
        attributionCore: !!this.attributionCoreDataSource
      }
    };
  }

  /**
   * 清理所有缓存
   */
  public clearAllCaches(): void {
    this.industryFetcher?.clearExpiredCache();
    this.conceptFetcher?.clearExpiredCache();
    this.textualFetcher?.clearExpiredCache();
    this.moneyFlowFetcher?.clearExpiredCache();
    this.marketStructureFetcher?.clearExpiredCache();
    this.tushareSource.clearExpiredCache();
  }

  /**
   * 初始化报告结构
   */
  private initializeReport(): DataPipelineV15Report {
    return {
      timestamp: new Date().toISOString(),
      skeleton: { success: false, industryClassification: 0, industryMembers: 0 },
      nervous: { success: false, concepts: 0, conceptMembers: 0 },
      textual: { success: false, longFormNews: 0, newsBroadcast: 0, eInteraction: 0 },
      game: { success: false, moneyFlow: 0, marketStructure: 0 },
      engineDataSources: {
        quantSignal: false,
        hotspotIntelligence: false,
        attributionCore: false
      },
      summary: {
        totalSuccess: 0,
        totalFailed: 0,
        executionTime: 0,
        dataQuality: 'fair'
      }
    };
  }

  /**
   * 更新报告摘要
   */
  private updateSummary(report: DataPipelineV15Report): void {
    const systems = [report.skeleton, report.nervous, report.textual, report.game];
    report.summary.totalSuccess = systems.filter(s => s.success).length;
    report.summary.totalFailed = systems.filter(s => !s.success).length;
    
    // 数据质量评估
    const successRate = report.summary.totalSuccess / systems.length;
    if (successRate >= 0.9) {
      report.summary.dataQuality = 'excellent';
    } else if (successRate >= 0.7) {
      report.summary.dataQuality = 'good';
    } else if (successRate >= 0.5) {
      report.summary.dataQuality = 'fair';
    } else {
      report.summary.dataQuality = 'poor';
    }
  }

  /**
   * 合并配置
   */
  private mergeConfig(config?: Partial<DataPipelineV15Config>): DataPipelineV15Config {
    const defaultConfig: DataPipelineV15Config = {
      enabled: true,
      skeleton: {
        enabled: true,
        industry: defaultIndustryConfig
      },
      nervous: {
        enabled: true,
        concept: defaultConceptConfig
      },
      textual: {
        enabled: true,
        textual: defaultTextualConfig
      },
      game: {
        enabled: true,
        moneyFlow: defaultMoneyFlowConfig,
        marketStructure: defaultMarketStructureConfig
      },
      schedule: {
        skeletonUpdate: {
          enabled: true,
          frequency: 'quarterly',
          day: 1,
          time: "02:00"
        },
        nervousUpdate: {
          enabled: true,
          time: "16:30"
        },
        textualUpdate: {
          enabled: true,
          time: "18:00"
        },
        gameUpdate: {
          enabled: true,
          time: "16:30"
        }
      }
    };

    return { ...defaultConfig, ...config };
  }

  /**
   * 获取配置信息
   */
  public getConfig(): DataPipelineV15Config {
    return { ...this.config };
  }
}

// 导出默认配置
export const defaultDataPipelineV15Config: DataPipelineV15Config = {
  enabled: true,
  skeleton: {
    enabled: true,
    industry: defaultIndustryConfig
  },
  nervous: {
    enabled: true,
    concept: defaultConceptConfig
  },
  textual: {
    enabled: true,
    textual: defaultTextualConfig
  },
  game: {
    enabled: true,
    moneyFlow: defaultMoneyFlowConfig,
    marketStructure: defaultMarketStructureConfig
  },
  schedule: {
    skeletonUpdate: {
      enabled: true,
      frequency: 'quarterly',
      day: 1,
      time: "02:00"
    },
    nervousUpdate: {
      enabled: true,
      time: "16:30"
    },
    textualUpdate: {
      enabled: true,
      time: "18:00"
    },
    gameUpdate: {
      enabled: true,
      time: "16:30"
    }
  }
};
