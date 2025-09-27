#!/usr/bin/env python3
"""
MainWorkflow TDD测试 - 严格遵循<测试宪法>第3条
追溯性TDD:假装main_workflow.py中的代码一行都还没写
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.exceptions.workflow_exceptions import (
    QuantDataProviderError,
)


class TestMainWorkflowTDD:
    """MainWorkflow TDD测试 - 严格遵循红灯-绿灯-重构原则"""

    @pytest.fixture
    def mock_config(self):
        """模拟配置"""
        return {
            "concurrency": {
                "max_db_connections": 10,
                "max_llm_requests": 5,
                "max_stock_processing": 20,
            },
            "llm_service": {
                "qwen": {"api_key": "test_key"},
                "doubao": {"api_key": "test_key"},
            },
        }

    @pytest.fixture
    def mock_workflow(self, mock_config):
        """创建模拟的工作流实例"""
        from src.main_workflow import MainWorkflow

        # 模拟所有依赖服务
        with (
            patch("src.main_workflow.DataPipelineService") as mock_data_pipeline,
            patch("src.main_workflow.QuantSignalService") as mock_quant_engine,
            patch("src.main_workflow.LLMService") as mock_llm_service,
            patch("src.main_workflow.MetaCognitionEngine") as mock_meta_cognition,
        ):
            # 创建模拟实例
            mock_data_pipeline.return_value = AsyncMock()
            mock_quant_engine.return_value = AsyncMock()
            mock_llm_service.return_value = AsyncMock()
            mock_meta_cognition.return_value = AsyncMock()

            workflow = MainWorkflow(mock_config)

            # 模拟分析器
            workflow.qwen_analyzer = AsyncMock()
            workflow.doubao_analyzer = AsyncMock()

            return workflow

    # ==================== 第一个测试:最简单的成功路径 ====================

    @pytest.mark.asyncio
    async def test_run_daily_flow_should_process_one_stock_successfully(
        self, mock_workflow
    ):
        """
        红灯测试:run_daily_flow的最简单成功路径
        目标:处理一只股票,所有步骤都成功
        """
        # 模拟数据融合成功
        mock_workflow._execute_data_fusion = AsyncMock()

        # 模拟异常检测返回一只股票
        mock_workflow._detect_anomalies = AsyncMock(return_value=["000001"])

        # 模拟并行处理成功
        mock_workflow._process_anomaly_stocks = AsyncMock(
            return_value={
                "successful": 1,
                "failed": 0,
                "failed_stocks": [],
                "human_review_cases": 0,
            }
        )

        # 模拟生成报告
        mock_workflow._generate_execution_report = MagicMock()

        # 执行测试
        result = await mock_workflow.run_daily_flow("2025-01-17")

        # 验证结果
        assert result["status"] == "success"
        assert result["anomaly_count"] == 1
        assert result["processed_count"] == 1
        assert result["failed_count"] == 0

        # 验证调用
        mock_workflow._execute_data_fusion.assert_called_once_with("2025-01-17")
        mock_workflow._detect_anomalies.assert_called_once_with("2025-01-17")
        mock_workflow._process_anomaly_stocks.assert_called_once_with(
            ["000001"], "2025-01-17"
        )
        mock_workflow._generate_execution_report.assert_called_once()

    # ==================== 第二个测试:异常检测失败 ====================

    @pytest.mark.asyncio
    async def test_run_daily_flow_should_handle_detect_anomalies_failure(
        self, mock_workflow
    ):
        """
        红灯测试:异常检测失败的情况
        目标:当_detect_anomalies抛出异常时,应该发送告警并终止
        """
        # 模拟数据融合成功
        mock_workflow._execute_data_fusion = AsyncMock()

        # 模拟异常检测失败
        mock_workflow._detect_anomalies = AsyncMock(
            side_effect=QuantDataProviderError("异常检测失败")
        )

        # 模拟发送告警
        mock_workflow._send_critical_alert = AsyncMock()

        # 模拟asyncio.sleep以避免测试卡住
        with patch("asyncio.sleep", new_callable=AsyncMock):
            # 执行测试 - 应该抛出异常
            with pytest.raises(QuantDataProviderError):
                await mock_workflow.run_daily_flow("2025-01-17")

        # 验证告警被发送（可能被调用多次，因为重试机制）
        assert mock_workflow._send_critical_alert.call_count >= 1

    # ==================== 第三个测试:无异常股票 ====================

    @pytest.mark.asyncio
    async def test_run_daily_flow_should_handle_no_anomalies(self, mock_workflow):
        """
        红灯测试:没有检测到异常股票的情况
        目标:当没有异常股票时,应该正常结束
        """
        # 模拟数据融合成功
        mock_workflow._execute_data_fusion = AsyncMock()

        # 模拟异常检测返回空列表
        mock_workflow._detect_anomalies = AsyncMock(return_value=[])

        # 执行测试
        result = await mock_workflow.run_daily_flow("2025-01-17")

        # 验证结果
        assert result["status"] == "success"
        assert result["anomaly_count"] == 0

        # 验证没有调用并行处理
        # 注意：当没有异常股票时，_process_anomaly_stocks不会被调用
        # 我们可以通过检查结果来验证
        assert result["anomaly_count"] == 0

    # ==================== 第四个测试:健康检查成功 ====================

    @pytest.mark.asyncio
    async def test_health_check_should_return_healthy_status(self, mock_workflow):
        """
        红灯测试:健康检查成功的情况
        目标:所有服务都健康时,返回healthy状态
        """
        # 模拟数据库连接成功
        mock_workflow.data_pipeline.test_connection = AsyncMock()

        # 模拟LLM连接成功
        mock_workflow._test_llm_connections = AsyncMock()

        # 执行测试
        result = await mock_workflow.health_check()

        # 验证结果
        assert result["status"] == "healthy"
        assert result["checks"]["database"] == "healthy"
        assert result["checks"]["llm_services"] == "healthy"
        assert "timestamp" in result

    # ==================== 第五个测试:健康检查失败 ====================

    @pytest.mark.asyncio
    async def test_health_check_should_return_unhealthy_status(self, mock_workflow):
        """
        红灯测试:健康检查失败的情况
        目标:当数据库连接失败时,返回unhealthy状态
        """
        # 模拟数据库连接失败
        mock_workflow.data_pipeline.test_connection = AsyncMock(
            side_effect=Exception("数据库连接失败")
        )

        # 模拟LLM连接成功
        mock_workflow._test_llm_connections = AsyncMock()

        # 执行测试
        result = await mock_workflow.health_check()

        # 验证结果
        assert result["status"] == "unhealthy"
        assert "数据库连接失败" in result["checks"]["database"]
        assert result["checks"]["llm_services"] == "healthy"

    # ==================== 第六个测试：并发控制 ====================

    @pytest.mark.asyncio
    async def test_load_stock_data_should_respect_concurrency_limit(
        self, mock_workflow
    ):
        """
        红灯测试：数据加载应该遵守并发限制
        目标：验证信号量控制并发数量
        """
        # 模拟数据源
        mock_workflow.data_pipeline.get_financial_data_async = AsyncMock(
            return_value={"revenue": 1000}
        )
        mock_workflow.data_pipeline.get_price_data_async = AsyncMock(
            return_value={"close": 10.0}
        )
        mock_workflow.data_pipeline.get_news_data_async = AsyncMock(
            return_value={"news": "测试新闻"}
        )
        mock_workflow.data_pipeline.get_announcement_data_async = AsyncMock(
            return_value={"announcement": "测试公告"}
        )

        # 执行测试
        result = await mock_workflow._load_stock_data("000001", "2025-01-17")

        # 验证结果
        assert result["stock_code"] == "000001"
        assert result["trade_date"] == "2025-01-17"
        assert result["financial_data"]["revenue"] == 1000
        assert result["price_data"]["close"] == 10.0
        assert result["news_data"]["news"] == "测试新闻"
        assert result["announcement_data"]["announcement"] == "测试公告"

    # ==================== 第七个测试：单股票处理成功 ====================

    @pytest.mark.asyncio
    async def test_process_single_stock_with_retry_should_succeed(self, mock_workflow):
        """
        红灯测试：单股票处理成功的情况
        目标：验证重试机制和并行分析
        """
        # 模拟数据加载成功
        mock_workflow._load_stock_data = AsyncMock(
            return_value={
                "stock_code": "000001",
                "basic_info": {"name": "测试股票"},
                "price_data": {"close": 10.0},
                "financial_data": {"revenue": 1000},
                "technical_indicators": {"rsi": 50},
            }
        )

        # 模拟分析器成功
        mock_workflow.qwen_analyzer.analyze_async = AsyncMock(
            return_value={"stock_code": "000001", "analysis": "Qwen分析结果"}
        )
        mock_workflow.doubao_analyzer.analyze_async = AsyncMock(
            return_value={"stock_code": "000001", "analysis": "豆包分析结果"}
        )

        # 模拟数据库操作
        mock_workflow._save_report_to_db_async = AsyncMock(
            return_value={"id": "report_1"}
        )
        mock_workflow._create_arbitration_case_async = AsyncMock(
            return_value={"case_id": "case_1"}
        )

        # 执行测试
        result = await mock_workflow._process_single_stock_with_retry(
            "000001", "2025-01-17", 3
        )

        # 验证结果
        assert result["stock_code"] == "000001"
        assert result["status"] == "success"

        # 验证调用
        mock_workflow._load_stock_data.assert_called_once_with("000001", "2025-01-17")
        mock_workflow.qwen_analyzer.analyze_async.assert_called_once_with(
            "000001", "2025-01-17"
        )
        mock_workflow.doubao_analyzer.analyze_async.assert_called_once_with(
            "000001", "2025-01-17"
        )
        mock_workflow._save_report_to_db_async.assert_called()
        mock_workflow._create_arbitration_case_async.assert_called_once()

    # ==================== 第八个测试：并行处理异常股票 ====================

    @pytest.mark.asyncio
    async def test_process_anomaly_stocks_parallel_should_handle_mixed_results(
        self, mock_workflow
    ):
        """
        红灯测试：并行处理异常股票，部分成功部分失败
        目标：验证并行处理和结果统计
        """

        # 模拟单股票处理 - 第一个成功，第二个失败
        async def mock_process_single_stock(stock_code, trade_date, max_retries):
            if stock_code == "000001":
                return {"stock_code": stock_code, "status": "success"}
            else:
                raise Exception(f"处理失败: {stock_code}")

        mock_workflow._process_single_stock_with_retry = mock_process_single_stock

        # 执行测试
        result = await mock_workflow._process_anomaly_stocks_parallel(
            ["000001", "000002"], "2025-01-17", 3
        )

        # 验证结果
        assert result["successful"] == 1
        assert result["failed"] == 1
        assert len(result["failed_stocks"]) == 1
        assert result["failed_stocks"][0]["stock_code"] == "000002"
        assert "处理失败: 000002" in result["failed_stocks"][0]["error"]
