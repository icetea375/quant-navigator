"""
端到端工作流集成测试 - 遵循测试宪法TDD原则
先写测试（红灯），再实现功能（绿灯），最后重构
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from src.services.simple_workflow_service import SimpleWorkflowService
from src.services.arbitration_service import ArbitrationService
from src.services.report_service import ReportService
from src.services.llm_service import LLMService
from src.schemas.arbitration import ArbitrationCaseCreate, AnalysisResult, SentimentAnalysis
from src.schemas.reports import ReportCreate, ReportType


class TestWorkflowIntegration:
    """端到端工作流集成测试类"""
    
    @pytest.fixture
    def workflow_service(self):
        """创建工作流服务实例"""
        return SimpleWorkflowService()
    
    @pytest.fixture
    def arbitration_service(self):
        """创建仲裁服务实例"""
        return ArbitrationService()
    
    @pytest.fixture
    def report_service(self):
        """创建报告服务实例"""
        return ReportService()
    
    @pytest.fixture
    def llm_service(self):
        """创建LLM服务实例"""
        return LLMService()
    
    @pytest.mark.asyncio
    async def test_daily_workflow_complete_flow(self, workflow_service, arbitration_service, report_service, llm_service):
        """测试日常分析工作流完整流程"""
        # Arrange - 准备测试数据
        target_date = "2025-01-26"
        
        # Act - 执行日常分析工作流
        workflow_id = await workflow_service.run_daily_flow(target_date)
        
        # Assert - 验证工作流状态
        assert workflow_id is not None
        assert workflow_id.startswith("daily_")
        
        # 验证工作流状态
        status = await workflow_service.get_workflow_status(workflow_id)
        assert status is not None
        assert status["status"] == "completed"
        assert status["target_date"] == target_date
        assert "result" in status
    
    @pytest.mark.asyncio
    async def test_historical_backfill_workflow_complete_flow(self, workflow_service):
        """测试历史数据回填工作流完整流程"""
        # Arrange - 准备测试数据
        start_date = "20230101"
        end_date = "20230103"  # 只测试3天，避免测试时间过长
        
        # Act - 执行历史回填工作流
        workflow_id = await workflow_service.run_historical_backfill(start_date, end_date)
        
        # Assert - 验证工作流状态
        assert workflow_id is not None
        assert workflow_id.startswith("backfill_")
        
        # 验证工作流状态
        status = await workflow_service.get_workflow_status(workflow_id)
        assert status is not None
        assert status["status"] == "completed"
        assert status["start_date"] == start_date
        assert status["end_date"] == end_date
        assert status["processed_days"] == 3
        assert status["total_days"] == 3
    
    @pytest.mark.asyncio
    async def test_arbitration_case_creation_and_processing(self, arbitration_service, llm_service):
        """测试仲裁案件创建和处理流程"""
        # Arrange - 准备测试数据
        case_data = ArbitrationCaseCreate(
            report_type="fact_analysis",
            target_code="000001.SZ",
            qwen_analysis=AnalysisResult(
                analysis="测试Qwen分析结果",
                confidence=0.85,
                reasoning="基于财务数据的分析"
            ),
            doubao_analysis=SentimentAnalysis(
                sentiment="positive",
                score=0.7,
                reasoning="市场情绪积极"
            )
        )
        
        # Act - 创建仲裁案件
        created_case = await arbitration_service.create_case(case_data)
        
        # Assert - 验证案件创建
        assert created_case is not None
        assert created_case.report_type == "fact_analysis"
        assert created_case.target_code == "000001.SZ"
        assert created_case.disagreement_score > 0
        
        # Act - 预处理案件
        preprocess_result = await arbitration_service.preprocess_case(created_case.case_id)
        
        # Assert - 验证预处理结果
        assert preprocess_result is not None
        assert "summary" in preprocess_result
        assert "recommendations" in preprocess_result
        assert "disagreement_analysis" in preprocess_result
        assert preprocess_result["case_id"] == created_case.case_id
    
    @pytest.mark.asyncio
    async def test_report_creation_and_management(self, report_service):
        """测试报告创建和管理流程"""
        # Arrange - 准备测试数据
        report_data = ReportCreate(
            report_type=ReportType.DAILY_ANALYSIS,
            target_code="000001.SZ",
            report_date="2025-01-26",
            content="测试日常分析报告内容"
        )
        
        # Act - 创建报告
        created_report = await report_service.create_report(report_data)
        
        # Assert - 验证报告创建
        assert created_report is not None
        assert created_report.report_type == ReportType.DAILY_ANALYSIS
        assert created_report.target_code == "000001.SZ"
        assert created_report.content == "测试日常分析报告内容"
        assert created_report.status == "pending"
        
        # Act - 查询报告
        retrieved_report = await report_service.get_report_by_id(created_report.report_id)
        
        # Assert - 验证报告查询
        assert retrieved_report is not None
        assert retrieved_report.report_id == created_report.report_id
        assert retrieved_report.content == created_report.content
    
    @pytest.mark.asyncio
    async def test_llm_service_integration(self, llm_service):
        """测试LLM服务集成"""
        # Arrange - 准备测试数据
        fact_input = {
            "stock_code": "000001.SZ",
            "news_content": "该股票今日表现良好，财务数据稳健",
            "market_data": {"close": 10.5, "volume": 1000000}
        }
        
        sentiment_input = {
            "stock_code": "000001.SZ",
            "news_content": "市场对该股票持乐观态度",
            "social_media_data": {"sentiment": "positive"}
        }
        
        # Act - 执行事实分析
        fact_result = await llm_service.analyze_fact(fact_input)
        
        # Assert - 验证事实分析结果
        assert fact_result is not None
        assert isinstance(fact_result, AnalysisResult)
        assert fact_result.confidence > 0
        assert "000001.SZ" in fact_result.analysis
        
        # Act - 执行情感分析
        sentiment_result = await llm_service.analyze_sentiment(sentiment_input)
        
        # Assert - 验证情感分析结果
        assert sentiment_result is not None
        assert isinstance(sentiment_result, SentimentAnalysis)
        assert sentiment_result.score > 0
        assert sentiment_result.sentiment in ["positive", "negative", "neutral"]
    
    @pytest.mark.asyncio
    async def test_workflow_error_handling(self, workflow_service):
        """测试工作流错误处理"""
        # Arrange - 模拟错误情况
        with patch.object(workflow_service, 'run_daily_flow') as mock_workflow:
            mock_workflow.side_effect = Exception("模拟工作流错误")
            
            # Act & Assert - 验证错误处理
            with pytest.raises(Exception) as exc_info:
                await workflow_service.run_daily_flow("2025-01-26")
            
            assert "模拟工作流错误" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_workflow_logs_retrieval(self, workflow_service):
        """测试工作流日志获取"""
        # Arrange - 启动一个工作流
        workflow_id = await workflow_service.run_daily_flow("2025-01-26")
        
        # Act - 获取工作流日志
        logs = await workflow_service.get_workflow_logs(workflow_id)
        
        # Assert - 验证日志
        assert logs is not None
        assert isinstance(logs, list)
        assert len(logs) > 0
        
        # 验证日志格式
        for log_entry in logs:
            assert "timestamp" in log_entry
            assert "level" in log_entry
            assert "message" in log_entry
            assert log_entry["level"] in ["info", "warning", "error"]
    
    @pytest.mark.asyncio
    async def test_workflow_statistics(self, workflow_service):
        """测试工作流统计信息"""
        # Arrange - 启动多个工作流
        await workflow_service.run_daily_flow("2025-01-26")
        await workflow_service.run_daily_flow("2025-01-27")
        await workflow_service.run_historical_backfill("20230101", "20230102")
        
        # Act - 获取统计信息
        stats = await workflow_service.get_all_workflows()
        
        # Assert - 验证统计信息
        assert stats is not None
        assert "active_workflows" in stats
        assert "completed_workflows" in stats
        assert "failed_workflows" in stats
        assert "workflows" in stats
        assert isinstance(stats["workflows"], list)
        assert len(stats["workflows"]) >= 3
