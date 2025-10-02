"""
QuantSignalService 优化单元测试
严格遵循测试宪法:只测试公共接口，使用值断言
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../packages/backend-python')))

from datetime import datetime, timedelta

import pytest
from quant_navigator_shared_types.events import AnomalyEvent, AnomalyType, SeverityLevel
from quant_navigator_shared_types.quant_signals import (
    QuantSignal,
    SignalStatus,
    SignalType,
)

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../packages/backend-python')))

from src.exceptions import QuantValidationError
from src.services.quant_signal_service import QuantSignalService


class TestQuantSignalServiceOptimized:
    """QuantSignalService 优化单元测试类 - 严格遵循测试宪法"""

    @pytest.fixture
    def service(self):
        """创建服务实例"""
        config = {
            "quant_engine": {
                "z_score_threshold": 2.0,
                "lookback_days": 30,
                "min_data_points": 20,
                "price_anomaly_threshold": 10.0,
                "volume_anomaly_threshold": 3.0,
                "volatility_anomaly_threshold": 8.0,
                "high_price_anomaly_threshold": 15.0,
                "high_volume_anomaly_threshold": 5.0,
                "high_volatility_anomaly_threshold": 12.0,
                "rsi_period": 14,
                "macd_fast": 12,
                "macd_slow": 26,
                "macd_signal": 9,
                "bollinger_period": 20,
                "bollinger_std": 2.0,
                "return_weight": 0.3,
                "volume_weight": 0.2,
                "momentum_weight": 0.3,
                "volatility_weight": 0.2,
                "base_confidence": 0.5,
                "financial_factors_bonus": 0.2,
                "price_data_bonus": 0.3,
                "min_financial_factors": 5,
            },
            "database": {"url": "sqlite:///:memory:", "echo": False},
        }
        return QuantSignalService(config)

    @pytest.fixture
    def valid_financial_factors(self):
        """有效的财务因子数据"""
        return {
            "pe_ratio": 15.0,
            "pb_ratio": 2.0,
            "ps_ratio": 3.0,
            "dividend_yield": 2.0,
            "roe": 0.15,
            "roa": 0.08,
        }

    @pytest.fixture
    def valid_price_data(self):
        """有效的价格数据"""
        return [
            {"pct_chg": 2.5, "vol": 150000000},
            {"pct_chg": 1.0, "vol": 120000000},
            {"pct_chg": 3.0, "vol": 180000000},
        ]

    @pytest.fixture
    def valid_basic_data(self):
        """有效的基本面数据"""
        return [{"volume_ratio": 1.5, "market_cap": 1000000000}]

    @pytest.fixture
    def valid_trade_date(self):
        """有效的交易日期"""
        return datetime(2024, 1, 17)

    # ==================== 初始化测试 ====================

    def test_should_initialize_with_valid_config(self, service):
        """测试:应该使用有效配置正确初始化"""
        # 值断言 - 检查具体配置值
        assert service.quant_config.z_score_threshold == 2.0
        assert service.quant_config.lookback_days == 30
        assert service.quant_config.min_data_points == 20
        assert service.quant_config.price_anomaly_threshold == 10.0
        assert service.quant_config.volume_anomaly_threshold == 3.0
        assert service.quant_config.volatility_anomaly_threshold == 8.0

    def test_should_initialize_with_default_config(self):
        """测试:应该使用默认配置初始化"""
        config = {"database": {"url": "sqlite:///:memory:", "echo": False}}
        service = QuantSignalService(config)
        
        # 值断言 - 检查默认值
        assert service.quant_config.z_score_threshold == 2.0
        assert service.quant_config.lookback_days == 30
        assert service.quant_config.min_data_points == 20

    # ==================== 量化信号计算测试 ====================

    @pytest.mark.asyncio
    async def test_should_calculate_quant_signal_with_valid_data(
        self, service, valid_financial_factors, valid_price_data, valid_trade_date
    ):
        """测试:应该使用有效数据正确计算量化信号"""
        signal = await service.calculate_quant_signal(
            "000001.SZ", valid_trade_date, valid_financial_factors, valid_price_data
        )

        # 值断言 - 检查信号的具体属性
        assert signal.target_code == "000001.SZ"
        assert signal.signal_date == valid_trade_date
        assert signal.signal_type == SignalType.INDIVIDUAL
        assert signal.status == SignalStatus.ACTIVE
        assert signal.model_version == "v1.0.0"
        assert signal.validity_days == 30
        assert signal.source == "quant_signal_service"
        
        # 值断言 - 检查技术指标
        assert isinstance(signal.return_z_score, float)
        assert isinstance(signal.volume_z_score, float)
        assert isinstance(signal.momentum_z_score, float)
        assert isinstance(signal.volatility_z_score, float)
        assert isinstance(signal.rsi, float)
        assert 0 <= signal.rsi <= 100
        assert isinstance(signal.macd_signal, float)
        assert isinstance(signal.bollinger_position, float)
        assert 0 <= signal.bollinger_position <= 1
        assert isinstance(signal.ma_signal, float)
        
        # 值断言 - 检查综合指标
        assert isinstance(signal.overall_signal_strength, float)
        assert -1.0 <= signal.overall_signal_strength <= 1.0
        assert isinstance(signal.signal_confidence, float)
        assert 0.0 <= signal.signal_confidence <= 1.0

    @pytest.mark.asyncio
    async def test_should_calculate_quant_signal_with_minimal_data(
        self, service, valid_trade_date
    ):
        """测试:应该使用最小数据集计算量化信号"""
        minimal_financial_factors = {"pe_ratio": 15.0}
        minimal_price_data = [{"pct_chg": 2.5, "vol": 150000000}]

        signal = await service.calculate_quant_signal(
            "000001.SZ", valid_trade_date, minimal_financial_factors, minimal_price_data
        )

        # 值断言 - 检查信号生成成功
        assert signal.target_code == "000001.SZ"
        assert signal.signal_type == SignalType.INDIVIDUAL
        assert signal.status == SignalStatus.ACTIVE

    @pytest.mark.asyncio
    async def test_should_generate_unique_signal_ids(
        self, service, valid_financial_factors, valid_price_data, valid_trade_date
    ):
        """测试:应该生成唯一的信号ID"""
        signal1 = await service.calculate_quant_signal(
            "000001.SZ", valid_trade_date, valid_financial_factors, valid_price_data
        )
        signal2 = await service.calculate_quant_signal(
            "000002.SZ", valid_trade_date, valid_financial_factors, valid_price_data
        )

        # 值断言 - 检查ID唯一性
        assert signal1.signal_id != signal2.signal_id
        assert signal1.signal_id.startswith("sig_")
        assert signal2.signal_id.startswith("sig_")
        assert "000001.SZ" in signal1.signal_id
        assert "000002.SZ" in signal2.signal_id

    # ==================== 数据验证测试 ====================

    @pytest.mark.asyncio
    async def test_should_reject_invalid_stock_code(
        self, service, valid_financial_factors, valid_price_data, valid_trade_date
    ):
        """测试:应该拒绝无效的股票代码"""
        with pytest.raises(QuantValidationError) as exc_info:
            await service.calculate_quant_signal(
                "INVALID", valid_trade_date, valid_financial_factors, valid_price_data
            )
        
        # 值断言 - 检查错误信息
        assert "stock_code must be a string" in str(exc_info.value) or "stock_code must contain valid exchange suffix" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_should_reject_future_trade_date(
        self, service, valid_financial_factors, valid_price_data
    ):
        """测试:应该拒绝未来的交易日期"""
        future_date = datetime.now() + timedelta(days=1)
        
        with pytest.raises(QuantValidationError) as exc_info:
            await service.calculate_quant_signal(
                "000001.SZ", future_date, valid_financial_factors, valid_price_data
            )
        
        # 值断言 - 检查错误信息
        assert "trade_date cannot be in the future" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_should_reject_empty_financial_factors(
        self, service, valid_price_data, valid_trade_date
    ):
        """测试:应该拒绝空的财务因子"""
        with pytest.raises(QuantValidationError) as exc_info:
            await service.calculate_quant_signal(
                "000001.SZ", valid_trade_date, {}, valid_price_data
            )
        
        # 值断言 - 检查错误信息
        assert "financial_factors cannot be empty" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_should_reject_empty_price_data(
        self, service, valid_financial_factors, valid_trade_date
    ):
        """测试:应该拒绝空的价格数据"""
        with pytest.raises(QuantValidationError) as exc_info:
            await service.calculate_quant_signal(
                "000001.SZ", valid_trade_date, valid_financial_factors, []
            )
        
        # 值断言 - 检查错误信息
        assert "price_data cannot be empty" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_should_reject_invalid_financial_factors_type(
        self, service, valid_price_data, valid_trade_date
    ):
        """测试:应该拒绝无效类型的财务因子"""
        with pytest.raises(QuantValidationError) as exc_info:
            await service.calculate_quant_signal(
                "000001.SZ", valid_trade_date, "invalid", valid_price_data
            )
        
        # 值断言 - 检查错误信息
        assert "financial_factors must be a dictionary" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_should_reject_invalid_price_data_type(
        self, service, valid_financial_factors, valid_trade_date
    ):
        """测试:应该拒绝无效类型的价格数据"""
        with pytest.raises(QuantValidationError) as exc_info:
            await service.calculate_quant_signal(
                "000001.SZ", valid_trade_date, valid_financial_factors, "invalid"
            )
        
        # 值断言 - 检查错误信息
        assert "price_data must be a list" in str(exc_info.value)

    # ==================== 异常检测测试 ====================

    @pytest.mark.asyncio
    async def test_should_detect_price_anomaly_when_threshold_exceeded(
        self, service, valid_trade_date, valid_basic_data
    ):
        """测试:应该在价格超过阈值时检测到异常"""
        high_volatility_price_data = [{"pct_chg": 12.0, "vol": 150000000}]
        
        anomalies = await service.detect_anomalies(
            "000001.SZ", valid_trade_date, high_volatility_price_data, valid_basic_data
        )

        # 值断言 - 检查异常检测结果
        assert len(anomalies) >= 1
        price_anomaly = next((a for a in anomalies if a.anomaly_type == AnomalyType.PRICE), None)
        assert price_anomaly is not None
        assert price_anomaly.stock_code == "000001.SZ"
        assert price_anomaly.current_value == 12.0
        assert price_anomaly.severity in [SeverityLevel.MEDIUM, SeverityLevel.HIGH]

    @pytest.mark.asyncio
    async def test_should_detect_volume_anomaly_when_threshold_exceeded(
        self, service, valid_trade_date
    ):
        """测试:应该在成交量超过阈值时检测到异常"""
        normal_price_data = [{"pct_chg": 2.0, "vol": 150000000}]
        high_volume_basic_data = [{"volume_ratio": 4.0, "market_cap": 1000000000}]
        
        anomalies = await service.detect_anomalies(
            "000001.SZ", valid_trade_date, normal_price_data, high_volume_basic_data
        )

        # 值断言 - 检查异常检测结果
        assert len(anomalies) >= 1
        volume_anomaly = next((a for a in anomalies if a.anomaly_type == AnomalyType.VOLUME), None)
        assert volume_anomaly is not None
        assert volume_anomaly.stock_code == "000001.SZ"
        assert volume_anomaly.current_value == 4.0
        assert volume_anomaly.severity in [SeverityLevel.MEDIUM, SeverityLevel.HIGH]

    @pytest.mark.asyncio
    async def test_should_detect_volatility_anomaly_when_threshold_exceeded(
        self, service, valid_trade_date, valid_basic_data
    ):
        """测试:应该在波动率超过阈值时检测到异常"""
        high_volatility_price_data = [{"pct_chg": 10.0, "vol": 150000000}]
        
        anomalies = await service.detect_anomalies(
            "000001.SZ", valid_trade_date, high_volatility_price_data, valid_basic_data
        )

        # 值断言 - 检查异常检测结果
        assert len(anomalies) >= 1
        volatility_anomaly = next((a for a in anomalies if a.anomaly_type == AnomalyType.VOLATILITY), None)
        assert volatility_anomaly is not None
        assert volatility_anomaly.stock_code == "000001.SZ"
        assert volatility_anomaly.current_value == 10.0
        assert volatility_anomaly.severity in [SeverityLevel.MEDIUM, SeverityLevel.HIGH]

    @pytest.mark.asyncio
    async def test_should_not_detect_anomaly_when_within_thresholds(
        self, service, valid_trade_date, valid_basic_data
    ):
        """测试:应该在阈值内时不检测异常"""
        normal_price_data = [{"pct_chg": 5.0, "vol": 150000000}]
        normal_basic_data = [{"volume_ratio": 2.0, "market_cap": 1000000000}]
        
        anomalies = await service.detect_anomalies(
            "000001.SZ", valid_trade_date, normal_price_data, normal_basic_data
        )

        # 值断言 - 检查无异常
        assert len(anomalies) == 0

    @pytest.mark.asyncio
    async def test_should_detect_multiple_anomalies(
        self, service, valid_trade_date
    ):
        """测试:应该检测多种异常"""
        high_volatility_price_data = [{"pct_chg": 12.0, "vol": 150000000}]
        high_volume_basic_data = [{"volume_ratio": 4.0, "market_cap": 1000000000}]
        
        anomalies = await service.detect_anomalies(
            "000001.SZ", valid_trade_date, high_volatility_price_data, high_volume_basic_data
        )

        # 值断言 - 检查多种异常
        assert len(anomalies) >= 2
        anomaly_types = [a.anomaly_type for a in anomalies]
        assert AnomalyType.PRICE in anomaly_types
        assert AnomalyType.VOLUME in anomaly_types

    # ==================== 边界条件测试 ====================

    @pytest.mark.asyncio
    async def test_should_handle_nan_values_in_financial_factors(
        self, service, valid_price_data, valid_trade_date
    ):
        """测试:应该处理财务因子中的NaN值"""
        import math
        financial_factors_with_nan = {"pe_ratio": 15.0, "pb_ratio": math.nan}
        
        with pytest.raises(QuantValidationError) as exc_info:
            await service.calculate_quant_signal(
                "000001.SZ", valid_trade_date, financial_factors_with_nan, valid_price_data
            )
        
        # 值断言 - 检查错误信息
        assert "contains NaN value" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_should_handle_infinite_values_in_financial_factors(
        self, service, valid_price_data, valid_trade_date
    ):
        """测试:应该处理财务因子中的无穷值"""
        import math
        financial_factors_with_inf = {"pe_ratio": 15.0, "pb_ratio": math.inf}
        
        with pytest.raises(QuantValidationError) as exc_info:
            await service.calculate_quant_signal(
                "000001.SZ", valid_trade_date, financial_factors_with_inf, valid_price_data
            )
        
        # 值断言 - 检查错误信息
        assert "contains infinite value" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_should_handle_missing_required_fields_in_price_data(
        self, service, valid_financial_factors, valid_trade_date
    ):
        """测试:应该处理价格数据中缺失的必需字段"""
        incomplete_price_data = [{"pct_chg": 2.5}]  # 缺少vol字段
        
        with pytest.raises(QuantValidationError) as exc_info:
            await service.calculate_quant_signal(
                "000001.SZ", valid_trade_date, valid_financial_factors, incomplete_price_data
            )
        
        # 值断言 - 检查错误信息
        assert "Missing required field" in str(exc_info.value)

    # ==================== 性能测试 ====================

    @pytest.mark.asyncio
    async def test_should_calculate_signal_within_reasonable_time(
        self, service, valid_financial_factors, valid_price_data, valid_trade_date
    ):
        """测试:应该在合理时间内计算信号"""
        import time
        
        start_time = time.time()
        signal = await service.calculate_quant_signal(
            "000001.SZ", valid_trade_date, valid_financial_factors, valid_price_data
        )
        end_time = time.time()
        
        # 值断言 - 检查计算时间
        assert (end_time - start_time) < 1.0  # 应该在1秒内完成
        assert signal.target_code == "000001.SZ"  # 确保结果正确

    # ==================== 配置测试 ====================

    def test_should_use_custom_thresholds_in_anomaly_detection(
        self, service, valid_trade_date, valid_basic_data
    ):
        """测试:应该使用自定义阈值进行异常检测"""
        # 使用接近阈值的值测试
        near_threshold_price_data = [{"pct_chg": 9.5, "vol": 150000000}]  # 接近10%阈值
        
        # 这应该不触发异常，因为9.5 < 10.0
        anomalies = service.detect_anomalies(
            "000001.SZ", valid_trade_date, near_threshold_price_data, valid_basic_data
        )
        
        # 值断言 - 检查阈值行为
        assert len(anomalies) == 0  # 应该不检测到异常

    def test_should_validate_configuration_parameters(self):
        """测试:应该验证配置参数"""
        invalid_config = {
            "quant_engine": {
                "z_score_threshold": -1.0,  # 无效值
                "lookback_days": 30,
                "min_data_points": 20,
            },
            "database": {"url": "sqlite:///:memory:", "echo": False},
        }
        
        with pytest.raises(ValueError) as exc_info:
            QuantSignalService(invalid_config)
        
        # 值断言 - 检查错误信息
        assert "z_score_threshold must be positive" in str(exc_info.value)
