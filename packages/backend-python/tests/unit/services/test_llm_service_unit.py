"""
LLM服务单元测试
测试LLM服务的核心功能，目标覆盖率95%+
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import json
import asyncio

from src.services.llm_service import LLMService
from src.schemas.arbitration import AnalysisResult, SentimentAnalysis


class TestLLMServiceUnit:
    """LLM服务单元测试类"""
    
    @pytest.fixture
    def mock_llm_provider(self):
        """创建模拟LLM提供商"""
        provider = MagicMock()
        provider.generate_text = AsyncMock()
        return provider
    
    @pytest.fixture
    def llm_service(self, mock_llm_provider):
        """创建LLM服务实例"""
        return LLMService(llm_provider=mock_llm_provider)
    
    @pytest.fixture
    def sample_input_data(self):
        """创建示例输入数据"""
        return {
            "stock_code": "000001",
            "news_content": "该公司发布2024年第一季度财报，营收同比增长15%",
            "context": "基本面分析"
        }
    
    def test_should_initialize_with_custom_provider(self, mock_llm_provider):
        """测试：应该使用自定义提供商初始化"""
        service = LLMService(llm_provider=mock_llm_provider)
        assert service.llm_provider == mock_llm_provider
        assert service._call_count == 0
        assert service._error_count == 0
    
    def test_should_initialize_with_default_provider(self):
        """测试：应该使用默认提供商初始化"""
        with patch('src.services.llm_providers.QwenProvider') as mock_qwen:
            mock_qwen.return_value = MagicMock()
            service = LLMService()
            assert service.llm_provider is not None
            mock_qwen.assert_called_once()
    
    def test_should_get_health_status(self, llm_service):
        """测试：应该返回健康状态"""
        status = llm_service.get_health_status()
        
        assert status["status"] == "healthy"
        assert status["call_count"] == 0
        assert status["error_count"] == 0
        assert status["error_rate"] == 0.0
    
    def test_should_calculate_error_rate_correctly(self, llm_service):
        """测试：应该正确计算错误率"""
        llm_service._call_count = 10
        llm_service._error_count = 2
        
        status = llm_service.get_health_status()
        assert status["error_rate"] == 0.2
    
    @pytest.mark.asyncio
    async def test_analyze_fact_with_valid_response(self, llm_service, mock_llm_provider, sample_input_data):
        """测试：应该使用有效响应进行事实分析"""
        # 模拟LLM响应
        mock_response = {
            "analysis": "该公司2024年Q1营收增长15%，表现良好",
            "confidence": 0.85,
            "reasoning": "基于财报数据的分析"
        }
        mock_llm_provider.generate_text.return_value = json.dumps(mock_response)
        
        result = await llm_service.analyze_fact(sample_input_data)
        
        # 验证结果
        assert isinstance(result, AnalysisResult)
        assert result.analysis == mock_response["analysis"]
        assert result.confidence == 0.85
        assert result.reasoning == mock_response["reasoning"]
        
        # 验证调用计数
        assert llm_service._call_count == 1
        assert llm_service._error_count == 0
        
        # 验证LLM提供商被正确调用
        mock_llm_provider.generate_text.assert_called_once()
        call_args = mock_llm_provider.generate_text.call_args
        assert "000001" in call_args[1]["prompt"]
        assert "营收同比增长15%" in call_args[1]["prompt"]
        assert call_args[1]["model"] == "qwen-plus"
        assert call_args[1]["max_tokens"] == 1000
        assert call_args[1]["temperature"] == 0.3
    
    @pytest.mark.asyncio
    async def test_analyze_fact_with_invalid_json_response(self, llm_service, mock_llm_provider, sample_input_data):
        """测试：应该处理无效JSON响应"""
        # 模拟无效JSON响应
        mock_llm_provider.generate_text.return_value = "这不是有效的JSON"
        
        result = await llm_service.analyze_fact(sample_input_data)
        
        # 验证默认结果
        assert isinstance(result, AnalysisResult)
        assert "基于000001的基本面分析" in result.analysis
        assert result.confidence == 0.6
        assert "无法解析模型响应" in result.reasoning
    
    @pytest.mark.asyncio
    async def test_analyze_fact_with_missing_fields(self, llm_service, mock_llm_provider, sample_input_data):
        """测试：应该处理缺少字段的响应"""
        # 模拟缺少字段的响应
        mock_response = {"analysis": "部分分析结果"}
        mock_llm_provider.generate_text.return_value = json.dumps(mock_response)
        
        result = await llm_service.analyze_fact(sample_input_data)
        
        # 验证默认值
        assert result.analysis == "部分分析结果"
        assert result.confidence == 0.5  # 默认值
        assert result.reasoning == "无法获取推理过程"  # 默认值
    
    @pytest.mark.asyncio
    async def test_analyze_fact_with_provider_exception(self, llm_service, mock_llm_provider, sample_input_data):
        """测试：应该处理提供商异常"""
        # 模拟提供商抛出异常
        mock_llm_provider.generate_text.side_effect = Exception("API调用失败")
        
        with pytest.raises(Exception) as exc_info:
            await llm_service.analyze_fact(sample_input_data)
        
        assert "事实分析失败" in str(exc_info.value)
        assert llm_service._call_count == 1
        assert llm_service._error_count == 1
    
    @pytest.mark.asyncio
    async def test_analyze_fact_with_context(self, llm_service, mock_llm_provider):
        """测试：应该包含上下文信息"""
        input_data = {
            "stock_code": "000002",
            "news_content": "测试内容",
            "context": "特殊上下文"
        }
        
        mock_response = {"analysis": "分析结果", "confidence": 0.8, "reasoning": "推理"}
        mock_llm_provider.generate_text.return_value = json.dumps(mock_response)
        
        await llm_service.analyze_fact(input_data)
        
        # 验证上下文被包含在提示词中
        call_args = mock_llm_provider.generate_text.call_args
        assert "特殊上下文" in call_args[1]["prompt"]
    
    @pytest.mark.asyncio
    async def test_analyze_sentiment_with_valid_response(self, llm_service, mock_llm_provider, sample_input_data):
        """测试：应该使用有效响应进行情感分析"""
        # 模拟LLM响应
        mock_response = {
            "sentiment": "positive",
            "score": 0.8,
            "reasoning": "基于积极财报的情感分析"
        }
        mock_llm_provider.generate_text.return_value = json.dumps(mock_response)
        
        result = await llm_service.analyze_sentiment(sample_input_data)
        
        # 验证结果
        assert isinstance(result, SentimentAnalysis)
        assert result.sentiment == "positive"
        assert result.score == 0.8
        assert result.reasoning == mock_response["reasoning"]
        
        # 验证调用计数
        assert llm_service._call_count == 1
        assert llm_service._error_count == 0
    
    @pytest.mark.asyncio
    async def test_analyze_sentiment_with_invalid_json_response(self, llm_service, mock_llm_provider, sample_input_data):
        """测试：应该处理无效JSON响应，使用关键词分析"""
        # 模拟无效JSON响应
        mock_llm_provider.generate_text.return_value = "这不是有效的JSON"
        
        # 使用包含积极词汇的内容
        sample_input_data["news_content"] = "该公司营收上涨，盈利增长，突破新高"
        
        result = await llm_service.analyze_sentiment(sample_input_data)
        
        # 验证关键词分析结果
        assert isinstance(result, SentimentAnalysis)
        assert result.sentiment == "positive"
        assert result.score > 0.5
        assert "基于关键词的情感分析" in result.reasoning
    
    @pytest.mark.asyncio
    async def test_analyze_sentiment_with_negative_keywords(self, llm_service, mock_llm_provider):
        """测试：应该识别消极关键词"""
        input_data = {
            "stock_code": "000001",
            "news_content": "该公司股价下跌，面临亏损风险，市场危机"
        }
        
        mock_llm_provider.generate_text.return_value = "无效JSON"
        
        result = await llm_service.analyze_sentiment(input_data)
        
        assert result.sentiment == "negative"
        assert result.score < 0.5
    
    @pytest.mark.asyncio
    async def test_analyze_sentiment_with_neutral_keywords(self, llm_service, mock_llm_provider):
        """测试：应该识别中性关键词"""
        input_data = {
            "stock_code": "000001",
            "news_content": "该公司发布公告，市场表现平稳"
        }
        
        mock_llm_provider.generate_text.return_value = "无效JSON"
        
        result = await llm_service.analyze_sentiment(input_data)
        
        assert result.sentiment == "neutral"
        assert result.score == 0.5
    
    @pytest.mark.asyncio
    async def test_analyze_sentiment_with_provider_exception(self, llm_service, mock_llm_provider, sample_input_data):
        """测试：应该处理提供商异常"""
        mock_llm_provider.generate_text.side_effect = Exception("API调用失败")
        
        with pytest.raises(Exception) as exc_info:
            await llm_service.analyze_sentiment(sample_input_data)
        
        assert "情感分析失败" in str(exc_info.value)
        assert llm_service._call_count == 1
        assert llm_service._error_count == 1
    
    @pytest.mark.asyncio
    async def test_analyze_with_retry_success_on_first_attempt(self, llm_service, mock_llm_provider, sample_input_data):
        """测试：重试机制 - 第一次尝试成功"""
        mock_response = {"analysis": "成功分析", "confidence": 0.9, "reasoning": "成功"}
        mock_llm_provider.generate_text.return_value = json.dumps(mock_response)
        
        result = await llm_service.analyze_with_retry(
            llm_service.analyze_fact, 
            sample_input_data, 
            max_retries=3
        )
        
        assert isinstance(result, AnalysisResult)
        assert result.analysis == "成功分析"
        assert llm_service._call_count == 1
        assert llm_service._error_count == 0
    
    @pytest.mark.asyncio
    async def test_analyze_with_retry_success_on_second_attempt(self, llm_service, mock_llm_provider, sample_input_data):
        """测试：重试机制 - 第二次尝试成功"""
        # 第一次失败，第二次成功
        mock_llm_provider.generate_text.side_effect = [
            Exception("第一次失败"),
            json.dumps({"analysis": "重试成功", "confidence": 0.8, "reasoning": "重试"})
        ]
        
        result = await llm_service.analyze_with_retry(
            llm_service.analyze_fact, 
            sample_input_data, 
            max_retries=3
        )
        
        assert isinstance(result, AnalysisResult)
        assert result.analysis == "重试成功"
        assert llm_service._call_count == 2
        assert llm_service._error_count == 1
    
    @pytest.mark.asyncio
    async def test_analyze_with_retry_exhaustion(self, llm_service, mock_llm_provider, sample_input_data):
        """测试：重试机制 - 重试次数耗尽"""
        mock_llm_provider.generate_text.side_effect = Exception("持续失败")
        
        with pytest.raises(Exception) as exc_info:
            await llm_service.analyze_with_retry(
                llm_service.analyze_fact, 
                sample_input_data, 
                max_retries=2
            )
        
        assert "持续失败" in str(exc_info.value)
        assert llm_service._call_count == 2
        assert llm_service._error_count == 2
    
    @pytest.mark.asyncio
    async def test_batch_analyze_facts_success(self, llm_service, mock_llm_provider):
        """测试：批量事实分析成功"""
        batch_data = [
            {"stock_code": "000001", "news_content": "内容1"},
            {"stock_code": "000002", "news_content": "内容2"}
        ]
        
        mock_response = {"analysis": "批量分析", "confidence": 0.8, "reasoning": "批量"}
        mock_llm_provider.generate_text.return_value = json.dumps(mock_response)
        
        results = await llm_service.batch_analyze_facts(batch_data)
        
        assert len(results) == 2
        assert all(isinstance(r, AnalysisResult) for r in results)
        assert llm_service._call_count == 2
    
    @pytest.mark.asyncio
    async def test_batch_analyze_facts_with_exceptions(self, llm_service, mock_llm_provider):
        """测试：批量事实分析包含异常"""
        batch_data = [
            {"stock_code": "000001", "news_content": "内容1"},
            {"stock_code": "000002", "news_content": "内容2"}
        ]
        
        # 第一个成功，第二个失败
        mock_llm_provider.generate_text.side_effect = [
            json.dumps({"analysis": "成功", "confidence": 0.8, "reasoning": "成功"}),
            Exception("失败")
        ]
        
        results = await llm_service.batch_analyze_facts(batch_data)
        
        assert len(results) == 2
        assert isinstance(results[0], AnalysisResult)
        assert isinstance(results[1], Exception)
        assert llm_service._call_count == 2
        assert llm_service._error_count == 1
    
    @pytest.mark.asyncio
    async def test_batch_analyze_sentiments_success(self, llm_service, mock_llm_provider):
        """测试：批量情感分析成功"""
        batch_data = [
            {"stock_code": "000001", "news_content": "积极内容"},
            {"stock_code": "000002", "news_content": "消极内容"}
        ]
        
        mock_response = {"sentiment": "positive", "score": 0.8, "reasoning": "分析"}
        mock_llm_provider.generate_text.return_value = json.dumps(mock_response)
        
        results = await llm_service.batch_analyze_sentiments(batch_data)
        
        assert len(results) == 2
        assert all(isinstance(r, SentimentAnalysis) for r in results)
        assert llm_service._call_count == 2
    
    @pytest.mark.asyncio
    async def test_batch_analyze_sentiments_with_exceptions(self, llm_service, mock_llm_provider):
        """测试：批量情感分析包含异常"""
        batch_data = [
            {"stock_code": "000001", "news_content": "内容1"},
            {"stock_code": "000002", "news_content": "内容2"}
        ]
        
        # 第一个成功，第二个失败
        mock_llm_provider.generate_text.side_effect = [
            json.dumps({"sentiment": "positive", "score": 0.8, "reasoning": "成功"}),
            Exception("失败")
        ]
        
        results = await llm_service.batch_analyze_sentiments(batch_data)
        
        assert len(results) == 2
        assert isinstance(results[0], SentimentAnalysis)
        assert isinstance(results[1], Exception)
        assert llm_service._call_count == 2
        assert llm_service._error_count == 1
    
    def test_should_handle_empty_input_data(self, llm_service, mock_llm_provider):
        """测试：应该处理空输入数据"""
        empty_data = {}
        
        # 验证不会抛出异常
        assert llm_service.get_health_status()["status"] == "healthy"
    
    @pytest.mark.asyncio
    async def test_should_handle_missing_stock_code(self, llm_service, mock_llm_provider):
        """测试：应该处理缺少股票代码的情况"""
        input_data = {"news_content": "测试内容"}
        mock_response = {"analysis": "分析", "confidence": 0.8, "reasoning": "推理"}
        mock_llm_provider.generate_text.return_value = json.dumps(mock_response)
        
        result = await llm_service.analyze_fact(input_data)
        
        assert isinstance(result, AnalysisResult)
        # 验证提示词中包含"未知"
        call_args = mock_llm_provider.generate_text.call_args
        assert "股票代码：未知" in call_args[1]["prompt"]
    
    @pytest.mark.asyncio
    async def test_should_handle_missing_news_content(self, llm_service, mock_llm_provider):
        """测试：应该处理缺少新闻内容的情况"""
        input_data = {"stock_code": "000001"}
        mock_response = {"analysis": "分析", "confidence": 0.8, "reasoning": "推理"}
        mock_llm_provider.generate_text.return_value = json.dumps(mock_response)
        
        result = await llm_service.analyze_fact(input_data)
        
        assert isinstance(result, AnalysisResult)
        # 验证提示词中包含空内容
        call_args = mock_llm_provider.generate_text.call_args
        assert "新闻内容：" in call_args[1]["prompt"]
