/**
 * AttributionEngine 单元测试
 * 基于全流程测试计划v1.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AttributionEngine } from '@/engines/AttributionEngine';
import { TestHelpers } from '../../utils/test-helpers';

describe('AttributionEngine', () => {
  let engine: AttributionEngine;
  let mockDatabase: any;
  let mockLogger: any;

  // Mock数据
  const mockAnomalyEvent = {
    id: 1,
    symbol: '000001.SZ',
    timestamp: '2024-01-01T09:30:00Z',
    type: 'price_anomaly',
    severity: 'high',
    data: {
      price_change: 0.15,
      volume_spike: 2.5,
      news_sentiment: -0.8
    }
  };

  const mockAttributionResult = {
    success: true,
    attribution: {
      primaryReason: 'news_driven',
      confidence: 0.85,
      causalChain: [
        { factor: 'earnings_announcement', impact: 0.6 },
        { factor: 'market_sentiment', impact: 0.4 }
      ],
      supportingEvidence: [
        { source: 'news', content: '公司发布业绩预警' },
        { source: 'price', content: '股价大幅下跌' }
      ]
    },
    processingTime: 150
  };

  beforeEach(async () => {
    // 创建Mock对象
    mockDatabase = TestHelpers.createMockDatabase();
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttributionEngine,
        {
          provide: 'Database',
          useValue: mockDatabase,
        },
        {
          provide: 'Logger',
          useValue: mockLogger,
        },
      ],
    }).compile();

    engine = module.get<AttributionEngine>(AttributionEngine);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('analyze', () => {
    it('should analyze anomaly event successfully', async () => {
      // Arrange
      jest.spyOn(engine as any, 'performAttributionAnalysis').mockResolvedValue(mockAttributionResult);

      // Act
      const result = await engine.analyze(mockAnomalyEvent);

      // Assert
      expect(result.success).toBe(true);
      expect(result.attribution).toBeDefined();
      expect(result.attribution.primaryReason).toBe('news_driven');
      expect(result.attribution.confidence).toBeGreaterThan(0);
      expect(result.attribution.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle different event types', async () => {
      // Arrange
      const eventTypes = ['price_anomaly', 'volume_anomaly', 'news_driven', 'earnings_driven'];
      
      for (const eventType of eventTypes) {
        const event = { ...mockAnomalyEvent, type: eventType };
        jest.spyOn(engine as any, 'performAttributionAnalysis').mockResolvedValue({
          ...mockAttributionResult,
          attribution: { ...mockAttributionResult.attribution, primaryReason: eventType }
        });

        // Act
        const result = await engine.analyze(event);

        // Assert
        expect(result.success).toBe(true);
        expect(result.attribution.primaryReason).toBe(eventType);
      }
    });

    it('should handle analysis errors gracefully', async () => {
      // Arrange
      const error = new Error('Analysis failed');
      jest.spyOn(engine as any, 'performAttributionAnalysis').mockRejectedValue(error);

      // Act
      const result = await engine.analyze(mockAnomalyEvent);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Analysis failed');
      expect(mockLogger.error).toHaveBeenCalledWith('归因分析失败', error);
    });

    it('should validate input event data', async () => {
      // Arrange
      const invalidEvent = { ...mockAnomalyEvent, symbol: null };

      // Act
      const result = await engine.analyze(invalidEvent);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid event data');
    });
  });

  describe('performAttributionAnalysis', () => {
    it('should perform news-driven attribution', async () => {
      // Arrange
      const newsEvent = { ...mockAnomalyEvent, type: 'news_driven' };
      mockDatabase.query.mockResolvedValue({
        rows: [
          { sentiment: -0.8, relevance: 0.9, source: 'financial_news' }
        ]
      });

      // Act
      const result = await (engine as any).performAttributionAnalysis(newsEvent);

      // Assert
      expect(result.attribution.primaryReason).toBe('news_driven');
      expect(result.attribution.confidence).toBeGreaterThan(0.7);
    });

    it('should perform earnings-driven attribution', async () => {
      // Arrange
      const earningsEvent = { ...mockAnomalyEvent, type: 'earnings_driven' };
      mockDatabase.query.mockResolvedValue({
        rows: [
          { announcement_type: 'earnings_warning', impact_score: 0.8 }
        ]
      });

      // Act
      const result = await (engine as any).performAttributionAnalysis(earningsEvent);

      // Assert
      expect(result.attribution.primaryReason).toBe('earnings_driven');
      expect(result.attribution.confidence).toBeGreaterThan(0.7);
    });

    it('should perform technical attribution', async () => {
      // Arrange
      const technicalEvent = { ...mockAnomalyEvent, type: 'price_anomaly' };
      mockDatabase.query.mockResolvedValue({
        rows: [
          { technical_indicator: 'rsi', value: 85, signal: 'overbought' }
        ]
      });

      // Act
      const result = await (engine as any).performAttributionAnalysis(technicalEvent);

      // Assert
      expect(result.attribution.primaryReason).toBe('technical');
      expect(result.attribution.confidence).toBeGreaterThan(0.6);
    });
  });

  describe('calculateConfidence', () => {
    it('should calculate high confidence for strong evidence', () => {
      // Arrange
      const evidence = [
        { source: 'news', strength: 0.9 },
        { source: 'price', strength: 0.8 },
        { source: 'volume', strength: 0.7 }
      ];

      // Act
      const confidence = (engine as any).calculateConfidence(evidence);

      // Assert
      expect(confidence).toBeGreaterThan(0.8);
    });

    it('should calculate low confidence for weak evidence', () => {
      // Arrange
      const evidence = [
        { source: 'news', strength: 0.3 },
        { source: 'price', strength: 0.2 }
      ];

      // Act
      const confidence = (engine as any).calculateConfidence(evidence);

      // Assert
      expect(confidence).toBeLessThan(0.5);
    });
  });

  describe('buildCausalChain', () => {
    it('should build causal chain from evidence', () => {
      // Arrange
      const evidence = [
        { factor: 'earnings_announcement', impact: 0.6, timestamp: '2024-01-01T08:00:00Z' },
        { factor: 'market_sentiment', impact: 0.4, timestamp: '2024-01-01T09:00:00Z' }
      ];

      // Act
      const causalChain = (engine as any).buildCausalChain(evidence);

      // Assert
      expect(causalChain).toHaveLength(2);
      expect(causalChain[0].factor).toBe('earnings_announcement');
      expect(causalChain[0].impact).toBe(0.6);
    });

    it('should sort causal chain by impact', () => {
      // Arrange
      const evidence = [
        { factor: 'minor_factor', impact: 0.2 },
        { factor: 'major_factor', impact: 0.8 }
      ];

      // Act
      const causalChain = (engine as any).buildCausalChain(evidence);

      // Assert
      expect(causalChain[0].impact).toBeGreaterThan(causalChain[1].impact);
    });
  });

  describe('getSupportingEvidence', () => {
    it('should retrieve supporting evidence from database', async () => {
      // Arrange
      const symbol = '000001.SZ';
      const timestamp = '2024-01-01T09:30:00Z';
      const mockEvidence = [
        { source: 'news', content: '公司发布业绩预警', relevance: 0.9 },
        { source: 'price', content: '股价大幅下跌', relevance: 0.8 }
      ];
      mockDatabase.query.mockResolvedValue({ rows: mockEvidence });

      // Act
      const evidence = await (engine as any).getSupportingEvidence(symbol, timestamp);

      // Assert
      expect(evidence).toEqual(mockEvidence);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [symbol, timestamp]
      );
    });
  });

  describe('performance', () => {
    it('should complete analysis within time limit', async () => {
      // Arrange
      const startTime = Date.now();
      jest.spyOn(engine as any, 'performAttributionAnalysis').mockResolvedValue(mockAttributionResult);

      // Act
      const result = await engine.analyze(mockAnomalyEvent);
      const duration = Date.now() - startTime;

      // Assert
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // 5秒内完成
    });

    it('should handle concurrent analysis requests', async () => {
      // Arrange
      const events = Array(10).fill(null).map((_, i) => ({
        ...mockAnomalyEvent,
        id: i + 1,
        symbol: `00000${i + 1}.SZ`
      }));
      
      jest.spyOn(engine as any, 'performAttributionAnalysis').mockResolvedValue(mockAttributionResult);

      // Act
      const results = await Promise.all(events.map(event => engine.analyze(event)));

      // Assert
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      mockDatabase.query.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await engine.analyze(mockAnomalyEvent);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });

    it('should handle invalid event data', async () => {
      // Arrange
      const invalidEvent = { symbol: null, type: 'invalid' };

      // Act
      const result = await engine.analyze(invalidEvent);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid event data');
    });
  });
});

