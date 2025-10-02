#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
分析器集成单元测试
测试方案3集成后的分析器方法

遵循测试宪法 v1t0.12:
- 第5条：类型安全铁律 - 严禁使用 as any、@ts-ignore
- 第6条：模拟铁律 - 只模拟外部边界，不模拟内部逻辑
- 第7条：断言铁律 - 断言必须精确且有意义
- 第3条：红灯-绿灯-重构原则

作者: AI Assistant
创建时间: 2025-01-17
版本: v1t0.12
"""

import asyncio
import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent.parent.parent
sys.path.append(str(project_root / "packages" / "backend-python"))
sys.path.append(str(project_root / "packages" / "backend-python" / "src"))

import pytest
from main_workflow import MainWorkflow


class TestAnalyzerIntegration:
    """分析器集成单元测试类"""

    def setup_method(self):
        """每个测试方法前的设置"""
        # 模拟配置
        self.mock_config = {
            "concurrency": {
                "max_db_connections": 10,
                "max_llm_requests": 5,
                "max_stock_processing": 20
            },
            "llm_service": {
                "qwen": {"api_key": "test_qwen_key"},
                "doubao": {"api_key": "test_doubao_key"}
            },
            "database": {"url": "sqlite:///:memory:"},
            "tushare": {"token": "test_token"}
        }

    def test_initialize_analyzers_with_qwen_success(self):
        """测试：成功初始化Qwen分析器"""
        # 红灯阶段：先写会失败的测试
        with patch('main_workflow.QwenFactAnalyzer') as mock_qwen_class:
            mock_qwen_instance = MagicMock()
            mock_qwen_class.return_value = mock_qwen_instance
            
            with patch('main_workflow.DoubaoAnalyzer', side_effect=ImportError):
                # 绿灯阶段：写最简单的生产代码让测试通过
                workflow = MainWorkflow(self.mock_config)
                
                # 精确断言：检查具体值，不是存在性
                assert workflow.qwen_analyzer is not None
                assert workflow.qwen_analyzer == mock_qwen_instance
                assert workflow.doubao_analyzer is None
                mock_qwen_class.assert_called_once_with(self.mock_config)

    def test_initialize_analyzers_with_doubao_success(self):
        """测试：成功初始化豆包分析器"""
        with patch('main_workflow.QwenFactAnalyzer') as mock_qwen_class:
            mock_qwen_instance = MagicMock()
            mock_qwen_class.return_value = mock_qwen_instance
            
            with patch('main_workflow.DoubaoAnalyzer') as mock_doubao_class:
                mock_doubao_instance = MagicMock()
                mock_doubao_class.return_value = mock_doubao_instance
                
                workflow = MainWorkflow(self.mock_config)
                
                # 精确断言：检查具体值
                assert workflow.qwen_analyzer == mock_qwen_instance
                assert workflow.doubao_analyzer == mock_doubao_instance
                mock_qwen_class.assert_called_once_with(self.mock_config)
                mock_doubao_class.assert_called_once_with(self.mock_config)

    def test_initialize_analyzers_import_failure(self):
        """测试：分析器导入失败时的回退机制"""
        with patch('main_workflow.QwenFactAnalyzer', side_effect=ImportError):
            workflow = MainWorkflow(self.mock_config)
            
            # 精确断言：检查回退行为
            assert workflow.qwen_analyzer is None
            assert workflow.doubao_analyzer is None

    @pytest.mark.asyncio
    async def test_run_qwen_analysis_async_with_analyzer(self):
        """测试：使用Qwen分析器进行异步分析"""
        # 模拟Qwen分析器
        mock_qwen_analyzer = MagicMock()
        mock_qwen_analyzer.analyze.return_value = {
            "stock_code": "000001",
            "trade_date": "2025-01-17",
            "analysis_result": "test_result"
        }
        
        # 模拟事件循环
        with patch('asyncio.get_event_loop') as mock_loop:
            mock_loop.return_value.run_in_executor = AsyncMock(
                return_value={
                    "stock_code": "000001",
                    "trade_date": "2025-01-17",
                    "analysis_result": "test_result"
                }
            )
            
            workflow = MainWorkflow(self.mock_config)
            workflow.qwen_analyzer = mock_qwen_analyzer
            
            result = await workflow._run_qwen_analysis_async("000001", "2025-01-17")
            
            # 精确断言：检查具体返回值
            assert result["stock_code"] == "000001"
            assert result["trade_date"] == "2025-01-17"
            assert result["analysis_result"] == "test_result"

    @pytest.mark.asyncio
    async def test_run_qwen_analysis_async_fallback(self):
        """测试：Qwen分析器不可用时的回退机制"""
        workflow = MainWorkflow(self.mock_config)
        workflow.qwen_analyzer = None
        
        # 模拟回退方法
        with patch.object(workflow, '_analyze_with_qwen_fallback', 
                         new_callable=AsyncMock) as mock_fallback:
            mock_fallback.return_value = {
                "stock_code": "000001",
                "fallback_result": "test_fallback"
            }
            
            result = await workflow._run_qwen_analysis_async("000001", "2025-01-17")
            
            # 精确断言：检查回退调用
            assert result["fallback_result"] == "test_fallback"
            mock_fallback.assert_called_once_with("000001", "2025-01-17")

    @pytest.mark.asyncio
    async def test_run_doubao_analysis_async_with_analyzer(self):
        """测试：使用豆包分析器进行异步分析"""
        # 模拟豆包分析器
        mock_doubao_analyzer = MagicMock()
        mock_doubao_analyzer.analyze.return_value = {
            "stock_code": "000001",
            "sentiment_score": 0.8,
            "confidence": 0.9
        }
        
        # 模拟事件循环
        with patch('asyncio.get_event_loop') as mock_loop:
            mock_loop.return_value.run_in_executor = AsyncMock(
                return_value={
                    "stock_code": "000001",
                    "sentiment_score": 0.8,
                    "confidence": 0.9
                }
            )
            
            workflow = MainWorkflow(self.mock_config)
            workflow.doubao_analyzer = mock_doubao_analyzer
            
            result = await workflow._run_doubao_analysis_async("000001", "2025-01-17")
            
            # 精确断言：检查具体返回值
            assert result["stock_code"] == "000001"
            assert result["sentiment_score"] == 0.8
            assert result["confidence"] == 0.9

    @pytest.mark.asyncio
    async def test_run_doubao_analysis_async_fallback(self):
        """测试：豆包分析器不可用时的回退机制"""
        workflow = MainWorkflow(self.mock_config)
        workflow.doubao_analyzer = None
        
        # 模拟回退方法
        with patch.object(workflow, '_analyze_with_doubao_fallback', 
                         new_callable=AsyncMock) as mock_fallback:
            mock_fallback.return_value = {
                "stock_code": "000001",
                "fallback_sentiment": "positive"
            }
            
            result = await workflow._run_doubao_analysis_async("000001", "2025-01-17")
            
            # 精确断言：检查回退调用
            assert result["fallback_sentiment"] == "positive"
            mock_fallback.assert_called_once_with("000001", "2025-01-17")

    @pytest.mark.asyncio
    async def test_analyze_with_qwen_fallback(self):
        """测试：Qwen回退分析方法"""
        workflow = MainWorkflow(self.mock_config)
        
        # 模拟数据管道服务
        mock_data_pipeline = MagicMock()
        mock_data_pipeline.get_stock_data = AsyncMock(return_value={
            "pe_ratio": 15.5,
            "pb_ratio": 2.1,
            "revenue_growth": 0.12
        })
        workflow.data_pipeline = mock_data_pipeline
        
        # 模拟LLM服务
        mock_llm_service = MagicMock()
        mock_llm_service.analyze_fact = AsyncMock(return_value={
            "sentiment": "positive",
            "score": 0.8,
            "reasoning": "财务指标良好"
        })
        workflow.llm_service = mock_llm_service
        
        result = await workflow._analyze_with_qwen_fallback("000001", "2025-01-17")
        
        # 精确断言：检查具体返回值
        assert result["sentiment"] == "positive"
        assert result["score"] == 0.8
        assert result["reasoning"] == "财务指标良好"
        
        # 验证方法调用
        mock_data_pipeline.get_stock_data.assert_called_once_with("000001", "2025-01-17")
        mock_llm_service.analyze_fact.assert_called_once()

    @pytest.mark.asyncio
    async def test_analyze_with_doubao_fallback(self):
        """测试：豆包回退分析方法"""
        workflow = MainWorkflow(self.mock_config)
        
        # 模拟数据管道服务
        mock_data_pipeline = MagicMock()
        mock_data_pipeline.get_sentiment_data = AsyncMock(return_value={
            "news_sentiment": 0.7,
            "social_media_sentiment": 0.6,
            "market_sentiment": 0.8
        })
        workflow.data_pipeline = mock_data_pipeline
        
        # 模拟LLM服务
        mock_llm_service = MagicMock()
        mock_llm_service.analyze_sentiment = AsyncMock(return_value={
            "sentiment": "positive",
            "score": 0.75,
            "reasoning": "市场情绪积极"
        })
        workflow.llm_service = mock_llm_service
        
        result = await workflow._analyze_with_doubao_fallback("000001", "2025-01-17")
        
        # 精确断言：检查具体返回值
        assert result["sentiment"] == "positive"
        assert result["score"] == 0.75
        assert result["reasoning"] == "市场情绪积极"
        
        # 验证方法调用
        mock_data_pipeline.get_sentiment_data.assert_called_once_with("000001", "2025-01-17")
        mock_llm_service.analyze_sentiment.assert_called_once()

    @pytest.mark.asyncio
    async def test_process_single_stock_with_retry_uses_new_analyzers(self):
        """测试：单股票处理使用新的分析器方法"""
        workflow = MainWorkflow(self.mock_config)
        
        # 模拟所有依赖
        with patch.object(workflow, '_load_stock_data', new_callable=AsyncMock) as mock_load_data, \
             patch.object(workflow, '_run_qwen_analysis_async', new_callable=AsyncMock) as mock_qwen, \
             patch.object(workflow, '_run_doubao_analysis_async', new_callable=AsyncMock) as mock_doubao, \
             patch.object(workflow, '_save_report_to_db_async', new_callable=AsyncMock) as mock_save_qwen, \
             patch.object(workflow, '_save_report_to_db_async', new_callable=AsyncMock) as mock_save_doubao, \
             patch.object(workflow, '_create_arbitration_case_async', new_callable=AsyncMock) as mock_arbitration:
            
            # 设置模拟返回值
            mock_qwen.return_value = {"qwen_result": "test"}
            mock_doubao.return_value = {"doubao_result": "test"}
            
            result = await workflow._process_single_stock_with_retry("000001", "2025-01-17", 1)
            
            # 精确断言：检查方法调用
            assert result["stock_code"] == "000001"
            assert result["status"] == "success"
            
            # 验证新方法被调用
            mock_qwen.assert_called_once_with("000001", "2025-01-17")
            mock_doubao.assert_called_once_with("000001", "2025-01-17")

    def test_analyzer_initialization_error_handling(self):
        """测试：分析器初始化错误处理"""
        # 模拟导入错误
        with patch('main_workflow.QwenFactAnalyzer', side_effect=Exception("Import failed")):
            workflow = MainWorkflow(self.mock_config)
            
            # 精确断言：检查错误处理
            assert workflow.qwen_analyzer is None
            assert workflow.doubao_analyzer is None

    @pytest.mark.asyncio
    async def test_analysis_error_handling(self):
        """测试：分析过程中的错误处理"""
        workflow = MainWorkflow(self.mock_config)
        workflow.qwen_analyzer = None
        
        # 模拟回退方法抛出异常
        with patch.object(workflow, '_analyze_with_qwen_fallback', 
                         new_callable=AsyncMock, side_effect=Exception("Analysis failed")):
            
            with pytest.raises(Exception) as exc_info:
                await workflow._run_qwen_analysis_async("000001", "2025-01-17")
            
            # 精确断言：检查异常信息
            assert "Analysis failed" in str(exc_info.value)


if __name__ == "__main__":
    # 运行测试
    pytest.main([__file__, "-v", "--tb=short"])
