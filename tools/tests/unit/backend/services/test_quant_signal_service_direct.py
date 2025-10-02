"""
QuantSignalService 直接测试
绕过导入问题，直接测试核心功能
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../packages/backend-python')))

from datetime import datetime
import pytest

# 直接导入，避免__init__.py问题
from services.quant_signal_service import QuantSignalService


class TestQuantSignalServiceDirect:
    """QuantSignalService 直接测试类"""

    @pytest.fixture
    def service(self):
        """创建服务实例"""
        config = {
            "quant_engine": {
                "z_score_threshold": 2.0,
                "lookback_days": 30,
                "min_data_points": 20,
            },
            "database": {"url": "sqlite:///:memory:", "echo": False},
        }
        return QuantSignalService(config)

    def test_should_initialize_with_config(self, service):
        """测试:应该使用配置正确初始化"""
        # 值断言 - 检查具体配置值
        assert service.quant_config.z_score_threshold == 2.0
        assert service.quant_config.lookback_days == 30
        assert service.quant_config.min_data_points == 20

    @pytest.mark.asyncio
    async def test_should_calculate_quant_signal_with_valid_data(self, service):
        """测试:应该使用有效数据正确计算量化信号"""
        financial_factors = {
            "pe_ratio": 15.0,
            "pb_ratio": 2.0,
            "ps_ratio": 3.0,
            "dividend_yield": 2.0,
        }
        price_data = [{"pct_chg": 2.5, "vol": 150000000}]
        trade_date = datetime(2024, 1, 17)

        signal = await service.calculate_quant_signal(
            "000001.SZ", trade_date, financial_factors, price_data
        )

        # 值断言 - 检查信号的具体属性
        assert signal.target_code == "000001.SZ"
        assert signal.signal_date == trade_date
        assert signal.signal_type.value == "individual"
        assert signal.status.value == "active"
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
    async def test_should_generate_unique_signal_ids(self, service):
        """测试:应该生成唯一的信号ID"""
        financial_factors = {"pe_ratio": 15.0}
        price_data = [{"pct_chg": 2.5, "vol": 150000000}]
        trade_date = datetime(2024, 1, 17)

        signal1 = await service.calculate_quant_signal(
            "000001.SZ", trade_date, financial_factors, price_data
        )
        signal2 = await service.calculate_quant_signal(
            "000002.SZ", trade_date, financial_factors, price_data
        )

        # 值断言 - 检查ID唯一性
        assert signal1.signal_id != signal2.signal_id
        assert signal1.signal_id.startswith("sig_")
        assert signal2.signal_id.startswith("sig_")
        assert "000001.SZ" in signal1.signal_id
        assert "000002.SZ" in signal2.signal_id

    @pytest.mark.asyncio
    async def test_should_detect_anomalies_with_high_volatility(self, service):
        """测试:应该检测高波动率异常"""
        price_data = [{"pct_chg": 12.0, "vol": 150000000}]
        basic_data = [{"volume_ratio": 1.5, "market_cap": 1000000000}]
        trade_date = datetime(2024, 1, 17)
        
        anomalies = await service.detect_anomalies(
            "000001.SZ", trade_date, price_data, basic_data
        )

        # 值断言 - 检查异常检测结果
        assert len(anomalies) >= 1
        # 检查是否有价格异常
        price_anomalies = [a for a in anomalies if a.anomaly_type.value == "price"]
        assert len(price_anomalies) >= 1
        assert price_anomalies[0].stock_code == "000001.SZ"
        assert price_anomalies[0].current_value == 12.0

    @pytest.mark.asyncio
    async def test_should_not_detect_anomalies_with_normal_volatility(self, service):
        """测试:应该在正常波动率时不检测异常"""
        price_data = [{"pct_chg": 5.0, "vol": 150000000}]
        basic_data = [{"volume_ratio": 2.0, "market_cap": 1000000000}]
        trade_date = datetime(2024, 1, 17)
        
        anomalies = await service.detect_anomalies(
            "000001.SZ", trade_date, price_data, basic_data
        )

        # 值断言 - 检查无异常
        assert len(anomalies) == 0
