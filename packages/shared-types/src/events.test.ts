/**
 * 事件类型契约测试
 * 这是对"数据契约宪法"的验证测试
 * 严格按照测试宪法第4、5、6条执行
 */

import { describe, it, expect } from '@jest/globals';
import { AnomalyEvent, AttributionResult, ProcessedEvent } from './events';

describe('事件类型契约验证', () => {
  describe('AnomalyEvent接口', () => {
    it('必须包含所有必需字段', () => {
      // 按照宪法第6条：使用精确的值断言
      const event: AnomalyEvent = {
        id: 'test-id-123',
        stock_code: '000001.SZ',
        timestamp: 1640995200000,
        anomaly_type: 'price',
        severity: 'high',
        description: '价格异常波动',
        z_score: 2.5,
        current_value: 100.0,
        expected_value: 95.0,
        deviation: 5.0,
        confidence: 0.85,
        context: {
          market_state: 'open',
          sector_performance: 0.02,
          news_count: 5,
          volume_ratio: 1.5
        },
        metadata: { source: 'test' }
      };

      // 精确断言：验证每个字段的类型和值
      expect(event.id).toBe('test-id-123');
      expect(event.stock_code).toBe('000001.SZ');
      expect(event.timestamp).toBe(1640995200000);
      expect(event.anomaly_type).toBe('price');
      expect(event.severity).toBe('high');
      expect(event.z_score).toBe(2.5);
      expect(event.confidence).toBe(0.85);
      expect(event.context.market_state).toBe('open');
    });

    it('必须严格限制anomaly_type枚举值', () => {
      // 按照宪法第4条：禁止类型欺骗，必须使用正确的类型
      const validTypes: Array<AnomalyEvent['anomaly_type']> = ['price', 'volume', 'volatility', 'correlation'];
      
      validTypes.forEach(type => {
        const event: AnomalyEvent = {
          id: 'test',
          stock_code: '000001.SZ',
          timestamp: 1640995200000,
          anomaly_type: type, // 必须是枚举值之一
          severity: 'low',
          description: 'test',
          z_score: 1.0,
          current_value: 100.0,
          expected_value: 100.0,
          deviation: 0.0,
          confidence: 0.5,
          context: {
            market_state: 'open',
            sector_performance: 0.0,
            news_count: 0,
            volume_ratio: 1.0
          },
          metadata: {}
        };
        
        expect(event.anomaly_type).toBe(type);
      });
    });

    it('必须严格限制severity枚举值', () => {
      const validSeverities: Array<AnomalyEvent['severity']> = ['low', 'medium', 'high', 'critical'];
      
      validSeverities.forEach(severity => {
        const event: AnomalyEvent = {
          id: 'test',
          stock_code: '000001.SZ',
          timestamp: 1640995200000,
          anomaly_type: 'price',
          severity: severity, // 必须是枚举值之一
          description: 'test',
          z_score: 1.0,
          current_value: 100.0,
          expected_value: 100.0,
          deviation: 0.0,
          confidence: 0.5,
          context: {
            market_state: 'open',
            sector_performance: 0.0,
            news_count: 0,
            volume_ratio: 1.0
          },
          metadata: {}
        };
        
        expect(event.severity).toBe(severity);
      });
    });
  });

  describe('AttributionResult接口', () => {
    it('必须包含所有必需字段', () => {
      const result: AttributionResult = {
        event_id: 'event-123',
        stock_code: '000001.SZ',
        timestamp: 1640995200000,
        attribution: {
          primary_factors: ['market_volatility', 'news_sentiment'],
          secondary_factors: ['sector_rotation'],
          confidence_score: 0.8,
          explanation: '主要受市场波动和新闻情绪影响'
        },
        confidence: 0.8,
        evidence: [
          {
            type: 'news',
            content: '重大利好消息发布',
            relevance_score: 0.9,
            source: '财经新闻'
          }
        ],
        narrative: '该股票价格异常主要由市场波动和正面新闻推动',
        metadata: { model_version: 'v1.0' }
      };

      // 精确断言：验证关键字段
      expect(result.event_id).toBe('event-123');
      expect(result.stock_code).toBe('000001.SZ');
      expect(result.attribution.primary_factors).toEqual(['market_volatility', 'news_sentiment']);
      expect(result.attribution.confidence_score).toBe(0.8);
      expect(result.evidence).toHaveLength(1);
      expect(result.evidence[0].type).toBe('news');
    });
  });

  describe('ProcessedEvent接口', () => {
    it('必须包含所有必需字段', () => {
      const event: ProcessedEvent = {
        event_id: 'processed-123',
        event_type: 'news',
        title: '重要公告',
        content: '公司发布重要公告内容',
        published_at: '2024-01-01T10:00:00Z',
        related_stocks: ['000001.SZ', '000002.SZ'],
        keywords: ['公告', '重要', '公司'],
        sentiment_score: 0.7,
        importance_score: 0.8,
        status: 'completed',
        processing_result: {
          extracted_entities: ['公司A', '公告'],
          sentiment_analysis: { positive: 0.7, negative: 0.3 },
          relevance_score: 0.9
        },
        metadata: { source: 'news_api' }
      };

      // 精确断言：验证关键字段
      expect(event.event_id).toBe('processed-123');
      expect(event.event_type).toBe('news');
      expect(event.status).toBe('completed');
      expect(event.sentiment_score).toBe(0.7);
      expect(event.related_stocks).toEqual(['000001.SZ', '000002.SZ']);
      expect(event.processing_result?.relevance_score).toBe(0.9);
    });
  });
});
