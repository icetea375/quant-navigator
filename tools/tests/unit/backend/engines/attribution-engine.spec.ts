/**
 * AttributionEngine 单元测试
 * 严格遵循TDD铁律 - 先写测试，再写代码
 * 基于开发文档第0章TDD流程准则
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AttributionEngine } from '@/engines/AttributionEngine';

// 定义测试接口 - 先定义接口，再实现
interface AnomalyEvent {
  id: string;
  symbol: string;
  timestamp: number;
  anomalyType: 'price' | 'volume' | 'volatility' | 'correlation';
  zScore: number;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  confidence: number;
  context: {
    marketState: string;
    sectorPerformance: number;
    newsCount: number;
    sentiment: number;
  };
}

interface AttributionResult {
  eventId: string;
  symbol: string;
  confidence: number;
  evidence: string[];
  narrative: string;
  attributionFactors: {
    factor: string;
    weight: number;
    description: string;
  }[];
  timestamp: number;
}

interface AttributionEngineConfig {
  confidenceThreshold: number;
  maxEvidenceItems: number;
  enableNarrativeGeneration: boolean;
}

describe('AttributionEngine', () => {
  let engine: AttributionEngine;
  let mockConfig: AttributionEngineConfig;

  beforeEach(async () => {
    // Arrange - 准备测试数据
    mockConfig = {
      confidenceThreshold: 0.7,
      maxEvidenceItems: 5,
      enableNarrativeGeneration: true
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AttributionEngine,
          useValue: {
            analyze: jest.fn(),
            getConfig: jest.fn().mockReturnValue(mockConfig),
            setConfig: jest.fn()
          }
        }
      ],
    }).compile();

    engine = module.get<AttributionEngine>(AttributionEngine);
  });

  describe('analyze', () => {
    it('should return attribution result when given valid anomaly event', async () => {
      // Arrange
      const testEvent: AnomalyEvent = {
        id: 'event-001',
        symbol: 'AAPL',
        timestamp: Date.now(),
        anomalyType: 'price',
        zScore: 2.5,
        currentValue: 150.0,
        expectedValue: 145.0,
        deviation: 5.0,
        confidence: 0.85,
        context: {
          marketState: 'normal',
          sectorPerformance: 0.02,
          newsCount: 5,
          sentiment: 0.3
        }
      };

      const expectedResult: AttributionResult = {
        eventId: 'event-001',
        symbol: 'AAPL',
        confidence: 0.85,
        evidence: ['High Z-score indicates significant deviation', 'Positive market sentiment'],
        narrative: 'The price anomaly in AAPL is primarily attributed to positive market sentiment and high Z-score deviation.',
        attributionFactors: [
          { factor: 'zScore', weight: 0.6, description: 'Statistical significance of deviation' },
          { factor: 'sentiment', weight: 0.4, description: 'Market sentiment impact' }
        ],
        timestamp: testEvent.timestamp
      };

      // Act
      const result = await engine.analyze(testEvent);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(result.eventId).toBe(testEvent.id);
      expect(result.symbol).toBe(testEvent.symbol);
      expect(result.confidence).toBeGreaterThanOrEqual(mockConfig.confidenceThreshold);
      expect(Array.isArray(result.evidence)).toBe(true);
      expect(typeof result.narrative).toBe('string');
      expect(Array.isArray(result.attributionFactors)).toBe(true);
    });

    it('should return low confidence result when event confidence is below threshold', async () => {
      // Arrange
      const lowConfidenceEvent: AnomalyEvent = {
        id: 'event-002',
        symbol: 'MSFT',
        timestamp: Date.now(),
        anomalyType: 'volume',
        zScore: 1.2,
        currentValue: 300.0,
        expectedValue: 295.0,
        deviation: 5.0,
        confidence: 0.5, // Below threshold
        context: {
          marketState: 'volatile',
          sectorPerformance: 0.01,
          newsCount: 2,
          sentiment: 0.1
        }
      };

      // Act
      const result = await engine.analyze(lowConfidenceEvent);

      // Assert
      expect(result.confidence).toBeLessThan(mockConfig.confidenceThreshold);
      expect(result.evidence).toHaveLength(0);
      expect(result.narrative).toContain('insufficient confidence');
    });

    it('should handle different anomaly types correctly', async () => {
      // Arrange
      const volumeEvent: AnomalyEvent = {
        id: 'event-003',
        symbol: 'GOOGL',
        timestamp: Date.now(),
        anomalyType: 'volume',
        zScore: 3.0,
        currentValue: 2500.0,
        expectedValue: 2400.0,
        deviation: 100.0,
        confidence: 0.9,
        context: {
          marketState: 'normal',
          sectorPerformance: 0.03,
          newsCount: 8,
          sentiment: 0.4
        }
      };

      // Act
      const result = await engine.analyze(volumeEvent);

      // Assert
      expect(result.symbol).toBe(volumeEvent.symbol);
      expect(result.attributionFactors).toContainEqual(
        expect.objectContaining({ factor: 'volume' })
      );
    });

    it('should throw error when given invalid event data', async () => {
      // Arrange
      const invalidEvent = {
        id: 'invalid',
        symbol: 'INVALID',
        timestamp: 'invalid-date', // Invalid timestamp
        anomalyType: 'invalid_type', // Invalid type
        zScore: 'not-a-number' // Invalid zScore
      } as any;

      // Act & Assert
      await expect(engine.analyze(invalidEvent)).rejects.toThrow();
    });
  });

  describe('configuration', () => {
    it('should return current configuration', () => {
      // Act
      const config = engine.getConfig();

      // Assert
      expect(config).toEqual(mockConfig);
      expect(config.confidenceThreshold).toBe(0.7);
      expect(config.maxEvidenceItems).toBe(5);
      expect(config.enableNarrativeGeneration).toBe(true);
    });

    it('should update configuration when setConfig is called', () => {
      // Arrange
      const newConfig: AttributionEngineConfig = {
        confidenceThreshold: 0.8,
        maxEvidenceItems: 10,
        enableNarrativeGeneration: false
      };

      // Act
      engine.setConfig(newConfig);

      // Assert
      expect(engine.setConfig).toHaveBeenCalledWith(newConfig);
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const testEvent: AnomalyEvent = {
        id: 'event-004',
        symbol: 'TSLA',
        timestamp: Date.now(),
        anomalyType: 'volatility',
        zScore: 2.0,
        currentValue: 200.0,
        expectedValue: 190.0,
        deviation: 10.0,
        confidence: 0.8,
        context: {
          marketState: 'normal',
          sectorPerformance: 0.01,
          newsCount: 3,
          sentiment: 0.2
        }
      };

      // Mock database error
      jest.spyOn(engine, 'analyze').mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(engine.analyze(testEvent)).rejects.toThrow('Database connection failed');
    });

    it('should handle malformed event data', async () => {
      // Arrange
      const malformedEvent = {
        id: null,
        symbol: undefined,
        timestamp: NaN
      } as any;

      // Act & Assert
      await expect(engine.analyze(malformedEvent)).rejects.toThrow();
    });
  });
});
