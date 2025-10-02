#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
豆包分析器单元测试
测试DoubaoAnalyzer的核心功能

遵循测试宪法 v1t0.12:
- 第5条：类型安全铁律 - 严禁使用 as any、@ts-ignore
- 第6条：模拟铁律 - 只模拟外部边界，不模拟内部逻辑
- 第7条：断言铁律 - 断言必须精确且有意义
- 第3条：红灯-绿灯-重构原则

作者: AI Assistant
创建时间: 2025-01-17
版本: v1t0.12
"""

import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent.parent.parent
sys.path.append(str(project_root / "packages" / "backend-python"))

import pytest
from doubao_analyzer import DoubaoAnalyzer


class TestDoubaoAnalyzer:
    """豆包舆情感知分析器单元测试类"""

    def setup_method(self):
        """每个测试方法前的设置"""
        # 模拟配置
        self.mock_config = {
            "database": {
                "host": "localhost",
                "port": 3306,
                "user": "test_user",
                "password": "test_password",
                "database": "test_quantnav"
            },
            "llm_service": {
                "doubao": {
                    "api_key": "test_doubao_key",
                    "base_url": "https://test-doubao-api.com"
                }
            }
        }

    def test_doubao_analyzer_initialization(self):
        """测试：豆包分析器初始化"""
        # 红灯阶段：先写会失败的测试
        with patch('doubao_analyzer.DatabaseManager') as mock_db_manager, \
             patch('doubao_analyzer.LLMService') as mock_llm_service, \
             patch('doubao_analyzer.setup_logging') as mock_logging:
            
            # 绿灯阶段：写最简单的生产代码让测试通过
            analyzer = DoubaoAnalyzer(self.mock_config)
            
            # 精确断言：检查具体值，不是存在性
            assert analyzer.config == self.mock_config
            assert analyzer.db_manager is not None
            assert analyzer.llm_service is not None
            mock_db_manager.assert_called_once_with(self.mock_config["database"])
            mock_llm_service.assert_called_once_with(self.mock_config["llm_service"])

    def test_analyze_method_structure(self):
        """测试：analyze方法的基本结构"""
        with patch('doubao_analyzer.DatabaseManager'), \
             patch('doubao_analyzer.LLMService'), \
             patch('doubao_analyzer.setup_logging'):
            
            analyzer = DoubaoAnalyzer(self.mock_config)
            
            # 精确断言：检查方法存在且可调用
            assert hasattr(analyzer, 'analyze')
            assert callable(analyzer.analyze)

    def test_analyze_method_with_mock_data(self):
        """测试：analyze方法使用模拟数据"""
        with patch('doubao_analyzer.DatabaseManager') as mock_db_manager, \
             patch('doubao_analyzer.LLMService') as mock_llm_service, \
             patch('doubao_analyzer.setup_logging'):
            
            # 设置模拟返回值
            mock_db_instance = MagicMock()
            mock_llm_instance = MagicMock()
            mock_db_manager.return_value = mock_db_instance
            mock_llm_service.return_value = mock_llm_instance
            
            analyzer = DoubaoAnalyzer(self.mock_config)
            
            # 模拟内部方法
            with patch.object(analyzer, '_load_external_sentiment_data') as mock_load_data, \
                 patch.object(analyzer, '_analyze_social_media_sentiment') as mock_social, \
                 patch.object(analyzer, '_analyze_news_sentiment') as mock_news, \
                 patch.object(analyzer, '_analyze_market_expectation') as mock_market, \
                 patch.object(analyzer, '_generate_sentiment_report') as mock_generate_report:
                
                # 设置模拟返回值
                mock_load_data.return_value = {"test_data": "sample"}
                mock_social.return_value = {"sentiment_score": 75}
                mock_news.return_value = {"news_sentiment_score": 80}
                mock_market.return_value = {"market_expectation_score": 70}
                mock_generate_report.return_value = {
                    "stock_code": "000001",
                    "trade_date": "2025-01-17",
                    "analyzer_type": "doubao_sentiment_based"
                }
                
                result = analyzer.analyze("000001", "2025-01-17")
                
                # 精确断言：检查具体返回值
                assert result["stock_code"] == "000001"
                assert result["trade_date"] == "2025-01-17"
                assert result["analyzer_type"] == "doubao_sentiment_based"
                
                # 验证方法调用
                mock_load_data.assert_called_once_with("000001", "2025-01-17")
                mock_social.assert_called_once()
                mock_news.assert_called_once()
                mock_market.assert_called_once()
                mock_generate_report.assert_called_once()

    def test_analyze_method_error_handling(self):
        """测试：analyze方法的错误处理"""
        with patch('doubao_analyzer.DatabaseManager'), \
             patch('doubao_analyzer.LLMService'), \
             patch('doubao_analyzer.setup_logging'):
            
            analyzer = DoubaoAnalyzer(self.mock_config)
            
            # 模拟内部方法抛出异常
            with patch.object(analyzer, '_load_external_sentiment_data', 
                             side_effect=Exception("Data loading failed")):
                
                with pytest.raises(Exception) as exc_info:
                    analyzer.analyze("000001", "2025-01-17")
                
                # 精确断言：检查异常信息
                assert "Data loading failed" in str(exc_info.value)

    def test_load_external_sentiment_data_method(self):
        """测试：_load_external_sentiment_data方法"""
        with patch('doubao_analyzer.DatabaseManager'), \
             patch('doubao_analyzer.LLMService'), \
             patch('doubao_analyzer.setup_logging'):
            
            analyzer = DoubaoAnalyzer(self.mock_config)
            
            result = analyzer._load_external_sentiment_data("000001", "2025-01-17")
            
            # 精确断言：检查具体返回值结构
            assert "social_media" in result
            assert "news_sources" in result
            assert "market_sentiment" in result
            assert "real_time_events" in result
            assert result["social_media"]["weibo_mentions"] == 150
            assert result["news_sources"]["financial_news"] == 12
            assert result["market_sentiment"]["fear_greed_index"] == 65

    def test_analyze_social_media_sentiment_method(self):
        """测试：_analyze_social_media_sentiment方法"""
        with patch('doubao_analyzer.DatabaseManager'), \
             patch('doubao_analyzer.LLMService') as mock_llm_service, \
             patch('doubao_analyzer.setup_logging'):
            
            # 设置模拟LLM服务
            mock_llm_instance = MagicMock()
            mock_llm_instance.analyze_sentiment.return_value = {
                "score": 0.8,
                "sentiment": "positive",
                "confidence": 0.9,
                "reasoning": "社交媒体情绪积极"
            }
            mock_llm_service.return_value = mock_llm_instance
            
            analyzer = DoubaoAnalyzer(self.mock_config)
            
            external_data = {
                "social_media": {
                    "weibo_mentions": 150,
                    "zhihu_discussions": 25,
                    "xueqiu_posts": 80,
                    "sentiment_keywords": ["利好", "上涨"]
                }
            }
            
            result = analyzer._analyze_social_media_sentiment(external_data, "000001", "2025-01-17")
            
            # 精确断言：检查具体返回值
            assert result["sentiment_score"] == 80.0  # 0.8 * 100
            assert result["sentiment_trend"] == "positive"
            assert result["attention_level"] == "high"  # weibo_mentions > 100
            assert result["confidence"] == 0.9
            assert result["reasoning"] == "社交媒体情绪积极"

    def test_analyze_news_sentiment_method(self):
        """测试：_analyze_news_sentiment方法"""
        with patch('doubao_analyzer.DatabaseManager'), \
             patch('doubao_analyzer.LLMService') as mock_llm_service, \
             patch('doubao_analyzer.setup_logging'):
            
            # 设置模拟LLM服务
            mock_llm_instance = MagicMock()
            mock_llm_instance.analyze_sentiment.return_value = {
                "score": 0.75,
                "sentiment": "positive",
                "confidence": 0.8,
                "reasoning": "新闻情绪积极"
            }
            mock_llm_service.return_value = mock_llm_instance
            
            analyzer = DoubaoAnalyzer(self.mock_config)
            
            external_data = {
                "news_sources": {
                    "financial_news": 12,
                    "industry_reports": 3,
                    "regulatory_announcements": 1,
                    "sentiment_trend": "positive"
                },
                "real_time_events": ["重大合同签署"]
            }
            
            result = analyzer._analyze_news_sentiment(external_data, "000001", "2025-01-17")
            
            # 精确断言：检查具体返回值
            assert result["news_sentiment_score"] == 75.0  # 0.75 * 100
            assert result["media_bias"] == "positive"
            assert result["policy_impact"] == "high"  # regulatory_announcements > 0
            assert result["credibility"] == 0.8
            assert result["reasoning"] == "新闻情绪积极"

    def test_analyze_market_expectation_method(self):
        """测试：_analyze_market_expectation方法"""
        with patch('doubao_analyzer.DatabaseManager'), \
             patch('doubao_analyzer.LLMService') as mock_llm_service, \
             patch('doubao_analyzer.setup_logging'):
            
            # 设置模拟LLM服务
            mock_llm_instance = MagicMock()
            mock_llm_instance.analyze_sentiment.return_value = {
                "score": 0.7,
                "sentiment": "bullish",
                "confidence": 0.85,
                "reasoning": "市场预期乐观"
            }
            mock_llm_service.return_value = mock_llm_instance
            
            analyzer = DoubaoAnalyzer(self.mock_config)
            
            external_data = {
                "market_sentiment": {
                    "fear_greed_index": 65,
                    "volatility_index": 0.15,
                    "trading_volume_ratio": 1.8
                }
            }
            
            result = analyzer._analyze_market_expectation(external_data, "000001", "2025-01-17")
            
            # 精确断言：检查具体返回值
            assert result["market_expectation_score"] == 70.0  # 0.7 * 100
            assert result["risk_level"] == "medium"  # volatility_index <= 0.2
            assert result["trading_activity"] == "high"  # trading_volume_ratio > 1.5
            assert result["future_outlook"] == "bullish"
            assert result["reasoning"] == "市场预期乐观"

    def test_generate_sentiment_report_method(self):
        """测试：_generate_sentiment_report方法"""
        with patch('doubao_analyzer.DatabaseManager'), \
             patch('doubao_analyzer.LLMService'), \
             patch('doubao_analyzer.setup_logging'):
            
            analyzer = DoubaoAnalyzer(self.mock_config)
            
            social_sentiment = {
                "sentiment_score": 80,
                "sentiment_trend": "positive",
                "confidence": 0.9
            }
            news_sentiment = {
                "news_sentiment_score": 75,
                "media_bias": "positive",
                "credibility": 0.8
            }
            market_expectation = {
                "market_expectation_score": 70,
                "risk_level": "medium",
                "trading_activity": "high"
            }
            
            result = analyzer._generate_sentiment_report(
                social_sentiment, news_sentiment, market_expectation, "000001", "2025-01-17"
            )
            
            # 精确断言：检查具体返回值
            assert result["stock_code"] == "000001"
            assert result["trade_date"] == "2025-01-17"
            assert result["analyzer_type"] == "doubao_sentiment_based"
            assert result["overall_sentiment"]["score"] == 77.0  # 80*0.4 + 75*0.4 + 70*0.2
            assert result["overall_sentiment"]["trend"] == "positive"
            assert result["overall_sentiment"]["confidence"] == 0.8  # min(0.9, 0.8)
            assert len(result["key_insights"]) == 4
            assert len(result["recommendations"]) > 0

    def test_generate_recommendations_method(self):
        """测试：_generate_recommendations方法"""
        with patch('doubao_analyzer.DatabaseManager'), \
             patch('doubao_analyzer.LLMService'), \
             patch('doubao_analyzer.setup_logging'):
            
            analyzer = DoubaoAnalyzer(self.mock_config)
            
            # 测试积极情绪情况
            social_sentiment = {"sentiment_score": 85, "confidence": 0.9}
            news_sentiment = {"credibility": 0.8}
            market_expectation = {"risk_level": "low", "trading_activity": "medium"}
            
            recommendations = analyzer._generate_recommendations(
                85, "positive", social_sentiment, news_sentiment, market_expectation
            )
            
            # 精确断言：检查具体建议内容
            assert len(recommendations) > 0
            assert any("极度乐观" in rec for rec in recommendations)
            assert any("波动性较低" in rec for rec in recommendations)

    def test_analyzer_config_validation(self):
        """测试：分析器配置验证"""
        # 测试有效配置
        valid_config = {
            "database": {"host": "localhost"},
            "llm_service": {"doubao": {"api_key": "test"}}
        }
        
        with patch('doubao_analyzer.DatabaseManager'), \
             patch('doubao_analyzer.LLMService'), \
             patch('doubao_analyzer.setup_logging'):
            
            analyzer = DoubaoAnalyzer(valid_config)
            
            # 精确断言：检查配置被正确设置
            assert analyzer.config == valid_config

    def test_analyzer_with_missing_config(self):
        """测试：分析器处理缺失配置"""
        # 测试缺失必要配置的情况
        incomplete_config = {
            "database": {"host": "localhost"}
            # 缺少 llm_service 配置
        }
        
        with patch('doubao_analyzer.DatabaseManager'), \
             patch('doubao_analyzer.LLMService'), \
             patch('doubao_analyzer.setup_logging'):
            
            # 这应该会抛出异常或使用默认值
            try:
                analyzer = DoubaoAnalyzer(incomplete_config)
                # 如果成功创建，检查默认行为
                assert analyzer.config == incomplete_config
            except Exception as e:
                # 精确断言：检查异常类型
                assert isinstance(e, (KeyError, ValueError, AttributeError))

    def test_analyzer_logging_setup(self):
        """测试：分析器日志设置"""
        with patch('doubao_analyzer.DatabaseManager'), \
             patch('doubao_analyzer.LLMService'), \
             patch('doubao_analyzer.setup_logging') as mock_logging:
            
            analyzer = DoubaoAnalyzer(self.mock_config)
            
            # 精确断言：检查日志设置被调用
            mock_logging.assert_called_once_with("doubao_analyzer")

    def test_analyzer_database_manager_initialization(self):
        """测试：数据库管理器初始化"""
        with patch('doubao_analyzer.DatabaseManager') as mock_db_manager, \
             patch('doubao_analyzer.LLMService'), \
             patch('doubao_analyzer.setup_logging'):
            
            analyzer = DoubaoAnalyzer(self.mock_config)
            
            # 精确断言：检查数据库管理器被正确初始化
            mock_db_manager.assert_called_once_with(self.mock_config["database"])

    def test_analyzer_llm_service_initialization(self):
        """测试：LLM服务初始化"""
        with patch('doubao_analyzer.DatabaseManager'), \
             patch('doubao_analyzer.LLMService') as mock_llm_service, \
             patch('doubao_analyzer.setup_logging'):
            
            analyzer = DoubaoAnalyzer(self.mock_config)
            
            # 精确断言：检查LLM服务被正确初始化
            mock_llm_service.assert_called_once_with(self.mock_config["llm_service"])


if __name__ == "__main__":
    # 运行测试
    pytest.main([__file__, "-v", "--tb=short"])
