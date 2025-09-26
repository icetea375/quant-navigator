"""
DataPipeline & QuantSignalEngine 集成测试
遵循测试宪法：红灯-绿灯-重构原则，先写会失败的测试
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from typing import Dict, Any, List

# 导入被测试的模块（这些导入将会失败，因为服务还未实现）
from src.services.data_pipeline_service import DataPipelineService
from src.services.quant_signal_service import QuantSignalService
from src.entities.quant_signal import QuantSignalEntity
from src.entities.anomaly_event import AnomalyEventEntity
from quant_navigator_shared_types.quant_signals import QuantSignal, SignalType, SignalStatus
from quant_navigator_shared_types.events import AnomalyEvent, AnomalyType, SeverityLevel


class TestDataPipelineIntegration:
    """DataPipeline 集成测试类"""
    
    @pytest.fixture
    def mock_tushare_data(self):
        """模拟Tushare返回的原始数据"""
        return {
            "stock_basic": [
                {
                    "ts_code": "000001.SZ",
                    "symbol": "000001",
                    "name": "平安银行",
                    "area": "深圳",
                    "industry": "银行",
                    "market": "主板",
                    "list_date": "19910403"
                }
            ],
            "daily_basic": [
                {
                    "ts_code": "000001.SZ",
                    "trade_date": "20240117",
                    "close": 12.50,
                    "turnover_rate": 0.85,
                    "volume_ratio": 1.2,
                    "pe": 5.8,
                    "pe_ttm": 5.6,
                    "pb": 0.65,
                    "ps": 1.2,
                    "ps_ttm": 1.1,
                    "dv_ratio": 3.2,
                    "dv_ttm": 3.1,
                    "total_share": 19405918000,
                    "float_share": 19405918000,
                    "free_share": 19405918000,
                    "total_mv": 242573975000,
                    "circ_mv": 242573975000
                }
            ],
            "daily": [
                {
                    "ts_code": "000001.SZ",
                    "trade_date": "20240117",
                    "open": 12.30,
                    "high": 12.80,
                    "low": 12.20,
                    "close": 12.50,
                    "pre_close": 12.40,
                    "change": 0.10,
                    "pct_chg": 0.81,
                    "vol": 125000000,
                    "amount": 1562500000
                }
            ]
        }
    
    @pytest.fixture
    def test_config(self):
        """测试配置"""
        return {
            "tushare": {
                "token": "test_token",
                "timeout": 30
            },
            "database": {
                "url": "sqlite:///:memory:",
                "echo": False
            },
            "data_pipeline": {
                "batch_size": 100,
                "retry_attempts": 3,
                "retry_delay": 1
            },
            "quant_engine": {
                "z_score_threshold": 2.0,
                "lookback_days": 30,
                "min_data_points": 20
            }
        }
    
    @pytest.fixture
    def data_pipeline_service(self, test_config):
        """创建DataPipelineService实例"""
        return DataPipelineService(test_config)
    
    @pytest.fixture
    def quant_signal_service(self, test_config):
        """创建QuantSignalService实例"""
        return QuantSignalService(test_config)
    
    @pytest.mark.asyncio
    async def test_should_extract_financial_factors_from_tushare_data_when_valid_data_provided(
        self, 
        data_pipeline_service, 
        mock_tushare_data
    ):
        """
        测试：当提供有效的Tushare数据时，应该能提取出正确的财务因子
        
        遵循测试宪法第6条：使用精确且有意义的断言
        """
        # Arrange - 准备测试数据
        stock_code = "000001.SZ"
        trade_date = "20240117"
        
        # Act - 执行财务因子提取
        financial_factors = await data_pipeline_service.extract_financial_factors(
            stock_code=stock_code,
            trade_date=trade_date,
            raw_data=mock_tushare_data
        )
        
        # Assert - 验证提取的财务因子
        assert financial_factors["stock_code"] == stock_code, f"股票代码应为{stock_code}"
        assert financial_factors["trade_date"] == trade_date, f"交易日期应为{trade_date}"
        assert "pe_ratio" in financial_factors, "财务因子应包含PE比率"
        assert "pb_ratio" in financial_factors, "财务因子应包含PB比率"
        
        # 验证关键财务指标
        assert "pe_ratio" in financial_factors, "应包含PE比率"
        assert "pb_ratio" in financial_factors, "应包含PB比率"
        assert "ps_ratio" in financial_factors, "应包含PS比率"
        assert "dividend_yield" in financial_factors, "应包含股息率"
        assert "market_cap" in financial_factors, "应包含市值"
        
        # 验证数值的合理性
        assert financial_factors["pe_ratio"] == 5.8, f"PE比率应为5.8，实际为{financial_factors['pe_ratio']}"
        assert financial_factors["pb_ratio"] == 0.65, f"PB比率应为0.65，实际为{financial_factors['pb_ratio']}"
        assert financial_factors["ps_ratio"] == 1.2, f"PS比率应为1.2，实际为{financial_factors['ps_ratio']}"
        assert financial_factors["dividend_yield"] == 3.2, f"股息率应为3.2%，实际为{financial_factors['dividend_yield']}%"
        assert financial_factors["market_cap"] == 242573975000, f"市值应为242573975000，实际为{financial_factors['market_cap']}"
    
    @pytest.mark.asyncio
    async def test_should_calculate_quant_signals_when_financial_factors_provided(
        self,
        quant_signal_service,
        mock_tushare_data
    ):
        """
        测试：当提供财务因子时，应该能计算出正确的量化信号
        
        遵循测试宪法第6条：使用精确且有意义的断言
        """
        # Arrange - 准备测试数据
        stock_code = "000001.SZ"
        trade_date = datetime(2024, 1, 17)
        financial_factors = {
            "stock_code": stock_code,
            "trade_date": "20240117",
            "pe_ratio": 5.8,
            "pb_ratio": 0.65,
            "ps_ratio": 1.2,
            "dividend_yield": 3.2,
            "market_cap": 242573975000,
            "turnover_rate": 0.85,
            "volume_ratio": 1.2
        }
        
        # Act - 执行量化信号计算
        quant_signal = await quant_signal_service.calculate_quant_signal(
            stock_code=stock_code,
            trade_date=trade_date,
            financial_factors=financial_factors,
            price_data=mock_tushare_data["daily"]
        )
        
        # Assert - 验证量化信号计算结果
        assert isinstance(quant_signal, QuantSignal), "结果应为QuantSignal类型"
        assert quant_signal.target_code == stock_code, f"信号股票代码应为{stock_code}"
        assert quant_signal.signal_date == trade_date, f"信号日期应为{trade_date}"
        
        # 验证信号基本信息
        assert quant_signal.target_code == stock_code, f"目标股票代码应为{stock_code}"
        assert quant_signal.signal_date == trade_date, f"信号日期应为{trade_date}"
        assert quant_signal.signal_type == SignalType.INDIVIDUAL, "信号类型应为INDIVIDUAL"
        assert quant_signal.status == SignalStatus.ACTIVE, "信号状态应为ACTIVE"
        
        # 验证Z分数指标（这些值应该通过计算得出）
        assert -5.0 <= quant_signal.return_z_score <= 5.0, f"收益率Z分数应在[-5, 5]范围内，实际为{quant_signal.return_z_score}"
        assert -5.0 <= quant_signal.volume_z_score <= 5.0, f"成交量Z分数应在[-5, 5]范围内，实际为{quant_signal.volume_z_score}"
        assert -5.0 <= quant_signal.momentum_z_score <= 5.0, f"动量Z分数应在[-5, 5]范围内，实际为{quant_signal.momentum_z_score}"
        assert -5.0 <= quant_signal.volatility_z_score <= 5.0, f"波动率Z分数应在[-5, 5]范围内，实际为{quant_signal.volatility_z_score}"
        
        # 验证MDA相关指标
        assert 0.0 <= quant_signal.mda_fulfillment_rate <= 1.0, f"MDA履行率应在[0, 1]范围内，实际为{quant_signal.mda_fulfillment_rate}"
        assert 0.0 <= quant_signal.management_credibility_score <= 1.0, f"管理层可信度分数应在[0, 1]范围内，实际为{quant_signal.management_credibility_score}"
        assert 0.0 <= quant_signal.disclosure_quality_score <= 1.0, f"披露质量分数应在[0, 1]范围内，实际为{quant_signal.disclosure_quality_score}"
        assert 0.0 <= quant_signal.financial_transparency_score <= 1.0, f"财务透明度分数应在[0, 1]范围内，实际为{quant_signal.financial_transparency_score}"
        
        # 验证技术指标
        assert 0.0 <= quant_signal.rsi <= 100.0, f"RSI应在[0, 100]范围内，实际为{quant_signal.rsi}"
        assert 0.0 <= quant_signal.bollinger_position <= 1.0, f"布林带位置应在[0, 1]范围内，实际为{quant_signal.bollinger_position}"
        
        # 验证综合指标
        assert -1.0 <= quant_signal.overall_signal_strength <= 1.0, f"整体信号强度应在[-1, 1]范围内，实际为{quant_signal.overall_signal_strength}"
        assert 0.0 <= quant_signal.signal_confidence <= 1.0, f"信号置信度应在[0, 1]范围内，实际为{quant_signal.signal_confidence}"
        assert quant_signal.validity_days > 0, f"有效期天数应大于0，实际为{quant_signal.validity_days}"
    
    @pytest.mark.asyncio
    async def test_should_detect_anomalies_when_abnormal_data_provided(
        self,
        quant_signal_service,
        mock_tushare_data
    ):
        """
        测试：当提供异常数据时，应该能检测出异常事件
        
        遵循测试宪法第6条：使用精确且有意义的断言
        """
        # Arrange - 准备异常数据（高波动率、异常成交量等）
        abnormal_data = mock_tushare_data.copy()
        abnormal_data["daily"][0]["pct_chg"] = 15.5  # 异常涨幅
        abnormal_data["daily"][0]["vol"] = 500000000  # 异常成交量
        abnormal_data["daily_basic"][0]["turnover_rate"] = 5.2  # 异常换手率
        
        stock_code = "000001.SZ"
        trade_date = datetime(2024, 1, 17)
        
        # Act - 执行异常检测
        anomalies = await quant_signal_service.detect_anomalies(
            stock_code=stock_code,
            trade_date=trade_date,
            price_data=abnormal_data["daily"],
            basic_data=abnormal_data["daily_basic"]
        )
        
        # Assert - 验证异常检测结果
        assert len(anomalies) == 2, "应该检测到2个异常事件（价格和波动率）"
        assert anomalies[0].stock_code == stock_code, f"异常事件股票代码应为{stock_code}"
        assert anomalies[0].anomaly_type == "price", "异常类型应为价格异常"
        
        # 验证异常事件的结构
        anomaly = anomalies[0]
        assert isinstance(anomaly, AnomalyEvent), "异常事件应为AnomalyEvent类型"
        assert anomaly.stock_code == stock_code, f"异常股票代码应为{stock_code}"
        assert anomaly.anomaly_type in [AnomalyType.PRICE, AnomalyType.VOLUME, AnomalyType.VOLATILITY], "异常类型应为PRICE、VOLUME或VOLATILITY之一"
        assert anomaly.severity in [SeverityLevel.LOW, SeverityLevel.MEDIUM, SeverityLevel.HIGH, SeverityLevel.CRITICAL], "严重程度应为LOW、MEDIUM、HIGH或CRITICAL之一"
        assert anomaly.z_score > 2.0, f"异常Z分数应大于2.0，实际为{anomaly.z_score}"
        assert 0.0 <= anomaly.confidence <= 1.0, f"异常置信度应在[0, 1]范围内，实际为{anomaly.confidence}"
    
    @pytest.mark.asyncio
    async def test_should_persist_quant_signals_to_database_when_valid_signals_generated(
        self,
        quant_signal_service,
        mock_tushare_data
    ):
        """
        测试：当生成有效的量化信号时，应该能持久化到数据库
        
        遵循测试宪法第6条：使用精确且有意义的断言
        """
        # Arrange - 准备测试数据
        stock_code = "000001.SZ"
        trade_date = datetime(2024, 1, 17)
        financial_factors = {
            "stock_code": stock_code,
            "trade_date": "20240117",
            "pe_ratio": 5.8,
            "pb_ratio": 0.65,
            "ps_ratio": 1.2,
            "dividend_yield": 3.2,
            "market_cap": 242573975000
        }
        
        # Act - 生成并保存量化信号
        quant_signal = await quant_signal_service.calculate_quant_signal(
            stock_code=stock_code,
            trade_date=trade_date,
            financial_factors=financial_factors,
            price_data=mock_tushare_data["daily"]
        )
        
        saved_signal = await quant_signal_service.save_quant_signal(quant_signal)
        
        # Assert - 验证信号已保存到数据库
        assert saved_signal.signal_id.startswith("sig_"), f"信号ID应以sig_开头，实际为{saved_signal.signal_id}"
        assert saved_signal.target_code == stock_code, f"保存的信号股票代码应为{stock_code}"
        
        # 验证可以从数据库查询到信号
        retrieved_signal = await quant_signal_service.get_quant_signal_by_id(saved_signal.signal_id)
        assert retrieved_signal.target_code == stock_code, f"查询到的信号股票代码应为{stock_code}"
        assert retrieved_signal.signal_date == trade_date, f"查询到的信号日期应为{trade_date}"
        assert retrieved_signal.signal_type == SignalType.INDIVIDUAL, "查询到的信号类型应为INDIVIDUAL"
    
    @pytest.mark.asyncio
    async def test_should_handle_tushare_api_failure_gracefully_when_api_returns_error(
        self,
        data_pipeline_service
    ):
        """
        测试：当Tushare API返回错误时，应该优雅地处理失败
        
        遵循测试宪法第6条：使用精确且有意义的断言
        """
        # Arrange - 模拟Tushare API失败
        stock_code = "000001.SZ"
        trade_date = "20240117"
        
        with patch('tushare.pro_api') as mock_pro_api:
            mock_pro_api.return_value.stock_basic.side_effect = Exception("API调用失败")
            
            # Act & Assert - 验证异常处理
            with pytest.raises(Exception) as exc_info:
                await data_pipeline_service.fetch_tushare_data(
                    stock_code=stock_code,
                    trade_date=trade_date
                )
            
            assert "API调用失败" in str(exc_info.value), "应该抛出包含具体错误信息的异常"
    
    @pytest.mark.asyncio
    async def test_should_validate_input_data_when_invalid_parameters_provided(
        self,
        data_pipeline_service
    ):
        """
        测试：当提供无效参数时，应该进行数据验证
        
        遵循测试宪法第6条：使用精确且有意义的断言
        """
        # Arrange - 准备无效参数
        invalid_stock_code = ""  # 空股票代码
        invalid_trade_date = "invalid_date"  # 无效日期格式
        
        # Act & Assert - 验证参数验证
        with pytest.raises(ValueError) as exc_info:
            await data_pipeline_service.extract_financial_factors(
                stock_code=invalid_stock_code,
                trade_date=invalid_trade_date,
                raw_data={}
            )
        
        assert "股票代码不能为空" in str(exc_info.value) or "无效的日期格式" in str(exc_info.value), "应该抛出参数验证错误"
