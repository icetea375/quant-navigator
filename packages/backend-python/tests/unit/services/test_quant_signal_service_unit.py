"""
QuantSignalService 单元测试
实施测试金字塔原则 - 大量快速单元测试
"""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime
from typing import Dict, Any, List

from src.services.quant_signal_service import QuantSignalService
from src.exceptions import (
    QuantSignalError,
    QuantDatabaseError,
    QuantAnomalyDetectionError
)
from quant_navigator_shared_types.quant_signals import QuantSignal, SignalType, SignalStatus


class TestQuantSignalServiceUnit:
    """QuantSignalService 单元测试类"""
    
    @pytest.fixture
    def service(self):
        """创建服务实例"""
        config = {
            "quant_signal": {
                "z_score_threshold": 2.0,
                "anomaly_threshold": 0.8,
                "model_version": "v1.0"
            }
        }
        return QuantSignalService(config)
    
    def test_should_initialize_with_config(self, service):
        """测试：应该使用配置正确初始化"""
        assert service.config["quant_signal"]["z_score_threshold"] == 2.0
        assert service.config["quant_signal"]["anomaly_threshold"] == 0.8
        assert service.config["quant_signal"]["model_version"] == "v1.0"
    
    @pytest.mark.asyncio
    async def test_should_calculate_quant_signal_basic(self, service):
        """测试：应该正确计算基本量化信号"""
        financial_factors = {
            "pe_ratio": 15.0,
            "pb_ratio": 2.0,
            "ps_ratio": 3.0,
            "dividend_yield": 2.0
        }
        price_data = [{"pct_chg": 2.5, "vol": 150000000}]
        trade_date = datetime(2024, 1, 17)
        
        signal = await service.calculate_quant_signal("000001.SZ", trade_date, financial_factors, price_data)
        
        assert isinstance(signal, QuantSignal)
        assert signal.target_code == "000001.SZ"
        assert signal.signal_type == SignalType.INDIVIDUAL
        assert signal.status == SignalStatus.ACTIVE
        assert signal.model_version == "v1.0.0"
    
    def test_should_calculate_return_z_score_correctly(self, service):
        """测试：应该正确计算收益率Z分数"""
        price_data = [{"pct_chg": 2.5}]
        z_score = service._calculate_return_z_score(price_data)
        
        assert z_score == 0.25  # pct_chg / 10.0
    
    def test_should_calculate_volume_z_score_correctly(self, service):
        """测试：应该正确计算成交量Z分数"""
        price_data = [{"vol": 150000000}]
        z_score = service._calculate_volume_z_score(price_data)
        
        assert z_score == 1.0  # (150000000 - 100000000) / 50000000
    
    def test_should_calculate_momentum_z_score_correctly(self, service):
        """测试：应该正确计算动量Z分数"""
        price_data = [{"pct_chg": 2.5}]
        z_score = service._calculate_momentum_z_score(price_data)
        
        assert z_score == 0.5  # 2.5 / 5.0
    
    def test_should_calculate_volatility_z_score_correctly(self, service):
        """测试：应该正确计算波动率Z分数"""
        price_data = [{"pct_chg": 2.5}]
        z_score = service._calculate_volatility_z_score(price_data)
        
        assert z_score == 0.8333333333333334  # abs(2.5) / 3.0
    
    def test_should_calculate_macro_risk_z_score_correctly(self, service):
        """测试：应该正确计算宏观风险Z分数"""
        financial_factors = {}
        z_score = service._calculate_macro_risk_z_score(financial_factors)
        
        assert z_score == 0.0  # 默认值
    
    def test_should_calculate_market_style_z_score_correctly(self, service):
        """测试：应该正确计算市场风格Z分数"""
        financial_factors = {}
        z_score = service._calculate_market_style_z_score(financial_factors)
        
        assert z_score == 0.0  # 默认值
    
    def test_should_calculate_industry_rotation_z_score_correctly(self, service):
        """测试：应该正确计算行业轮动Z分数"""
        financial_factors = {}
        z_score = service._calculate_industry_rotation_z_score(financial_factors)
        
        assert z_score == 0.0  # 默认值
    
    def test_should_calculate_concept_z_score_correctly(self, service):
        """测试：应该正确计算概念Z分数"""
        financial_factors = {}
        z_score = service._calculate_concept_z_score(financial_factors)
        
        assert z_score == 0.0  # 默认值
    
    def test_should_calculate_mda_fulfillment_rate_correctly(self, service):
        """测试：应该正确计算MDA履行率"""
        financial_factors = {}
        rate = service._calculate_mda_fulfillment_rate(financial_factors)
        
        assert rate == 0.8  # 默认值
    
    def test_should_calculate_management_credibility_score_correctly(self, service):
        """测试：应该正确计算管理层可信度分数"""
        financial_factors = {}
        score = service._calculate_management_credibility_score(financial_factors)
        
        assert score == 0.7  # 默认值
    
    def test_should_calculate_disclosure_quality_score_correctly(self, service):
        """测试：应该正确计算披露质量分数"""
        financial_factors = {}
        score = service._calculate_disclosure_quality_score(financial_factors)
        
        assert score == 0.75  # 默认值
    
    def test_should_calculate_financial_transparency_score_correctly(self, service):
        """测试：应该正确计算财务透明度分数"""
        financial_factors = {}
        score = service._calculate_financial_transparency_score(financial_factors)
        
        assert score == 0.8  # 默认值
    
    def test_should_calculate_rsi_correctly(self, service):
        """测试：应该正确计算RSI指标"""
        price_data = [{"pct_chg": 2.5}]
        rsi = service._calculate_rsi(price_data)
        
        assert rsi == 55.0  # 50 + 2.5 * 2
    
    def test_should_calculate_macd_signal_correctly(self, service):
        """测试：应该正确计算MACD信号"""
        price_data = [{"pct_chg": 2.5}]
        macd = service._calculate_macd_signal(price_data)
        
        assert macd == 0.25  # 2.5 / 10.0
    
    def test_should_calculate_bollinger_position_correctly(self, service):
        """测试：应该正确计算布林带位置"""
        price_data = [{"pct_chg": 2.5}]
        position = service._calculate_bollinger_position(price_data)
        
        assert position == 0.525  # 0.5 + 2.5 / 100
    
    def test_should_calculate_ma_signal_correctly(self, service):
        """测试：应该正确计算移动平均信号"""
        price_data = [{"pct_chg": 2.5}]
        ma_signal = service._calculate_ma_signal(price_data)
        
        assert ma_signal == 0.5  # 2.5 / 5.0
    
    def test_should_calculate_overall_signal_strength_correctly(self, service):
        """测试：应该正确计算整体信号强度"""
        strength = service._calculate_overall_signal_strength(0.5, 0.3, 0.2, 0.1)
        
        # 加权平均: 0.3*0.5 + 0.2*0.3 + 0.3*0.2 + 0.2*0.1 = 0.29
        # 归一化: 0.29 / 2.0 = 0.145
        assert abs(strength - 0.145) < 0.001
    
    def test_should_calculate_signal_confidence_correctly(self, service):
        """测试：应该正确计算信号置信度"""
        financial_factors = {}
        price_data = [{"pct_chg": 2.5}]
        confidence = service._calculate_signal_confidence(financial_factors, price_data)
        
        # 基于Z分数的标准差计算置信度
        assert 0.0 <= confidence <= 1.0
    
    def test_should_detect_price_anomaly_correctly(self, service):
        """测试：应该正确检测价格异常"""
        stock_code = "000001.SZ"
        trade_date = datetime(2024, 1, 17)
        price_info = {"pct_chg": 12.5}  # 超过10%阈值
        anomaly = service._detect_price_anomaly(stock_code, trade_date, price_info)
        
        assert anomaly is not None  # 2.5 > 2.0
    
    def test_should_detect_volume_anomaly_correctly(self, service):
        """测试：应该正确检测成交量异常"""
        stock_code = "000001.SZ"
        trade_date = datetime(2024, 1, 17)
        price_info = {"pct_chg": 2.5}
        basic_info = {"volume_ratio": 4.0}  # 超过3倍阈值
        anomaly = service._detect_volume_anomaly(stock_code, trade_date, price_info, basic_info)
        
        assert anomaly is not None  # 1.5 < 2.0
    
    def test_should_detect_volatility_anomaly_correctly(self, service):
        """测试：应该正确检测波动率异常"""
        stock_code = "000001.SZ"
        trade_date = datetime(2024, 1, 17)
        price_info = {"pct_chg": 9.5}  # 超过8%阈值
        anomaly = service._detect_volatility_anomaly(stock_code, trade_date, price_info)
        
        assert anomaly is not None  # 3.0 > 2.0
    
    @pytest.mark.asyncio
    async def test_should_handle_empty_financial_factors(self, service):
        """测试：应该优雅地处理空的财务因子"""
        financial_factors = {}
        price_data = [{"pct_chg": 2.5, "vol": 150000000}]
        trade_date = datetime(2024, 1, 17)
        
        signal = await service.calculate_quant_signal("000001.SZ", trade_date, financial_factors, price_data)
        
        assert isinstance(signal, QuantSignal)
        assert signal.signal_type == SignalType.INDIVIDUAL
        assert signal.status == SignalStatus.ACTIVE
    
    @pytest.mark.asyncio
    async def test_should_handle_missing_fields_in_financial_factors(self, service):
        """测试：应该优雅地处理缺少字段的财务因子"""
        financial_factors = {"ts_code": "000001.SZ"}
        price_data = [{"pct_chg": 2.5, "vol": 150000000}]
        trade_date = datetime(2024, 1, 17)
        
        signal = await service.calculate_quant_signal("000001.SZ", trade_date, financial_factors, price_data)
        
        assert isinstance(signal, QuantSignal)
        assert signal.signal_type == SignalType.INDIVIDUAL
        assert signal.status == SignalStatus.ACTIVE
    
    @pytest.mark.asyncio
    async def test_should_generate_unique_signal_id(self, service):
        """测试：应该生成唯一的信号ID"""
        financial_factors1 = {"ts_code": "000001.SZ"}
        financial_factors2 = {"ts_code": "000002.SZ"}
        price_data = [{"pct_chg": 2.5, "vol": 150000000}]
        trade_date = datetime(2024, 1, 17)
        
        signal1 = await service.calculate_quant_signal("000001.SZ", trade_date, financial_factors1, price_data)
        signal2 = await service.calculate_quant_signal("000002.SZ", trade_date, financial_factors2, price_data)
        
        assert signal1.signal_id != signal2.signal_id
        assert "sig_" in signal1.signal_id
        assert "sig_" in signal2.signal_id
    
    @pytest.mark.asyncio
    async def test_should_set_correct_validity_days(self, service):
        """测试：应该设置正确的有效期天数"""
        financial_factors = {"ts_code": "000001.SZ"}
        price_data = [{"pct_chg": 2.5, "vol": 150000000}]
        trade_date = datetime(2024, 1, 17)
        
        signal = await service.calculate_quant_signal("000001.SZ", trade_date, financial_factors, price_data)
        
        assert signal.validity_days == 30  # 默认值
    
    @pytest.mark.asyncio
    async def test_should_set_correct_source(self, service):
        """测试：应该设置正确的数据源"""
        financial_factors = {"ts_code": "000001.SZ"}
        price_data = [{"pct_chg": 2.5, "vol": 150000000}]
        trade_date = datetime(2024, 1, 17)
        
        signal = await service.calculate_quant_signal("000001.SZ", trade_date, financial_factors, price_data)
        
        assert signal.source == "quant_signal_service"
    
    @pytest.mark.asyncio
    async def test_should_include_metadata(self, service):
        """测试：应该包含元数据"""
        financial_factors = {"ts_code": "000001.SZ"}
        price_data = [{"pct_chg": 2.5, "vol": 150000000}]
        trade_date = datetime(2024, 1, 17)
        
        signal = await service.calculate_quant_signal("000001.SZ", trade_date, financial_factors, price_data)
        
        assert signal.metadata is not None
        assert "calculated_at" in signal.metadata
        assert "financial_factors" in signal.metadata
    
    # ===== P0 优先级测试：异常处理块 =====
    
    @pytest.mark.asyncio
    async def test_should_handle_calculate_quant_signal_exception(self, service):
        """测试：应该正确处理calculate_quant_signal的异常"""
        # 使用patch来模拟内部方法抛出异常
        with patch.object(service, '_calculate_return_z_score', side_effect=Exception("模拟计算异常")):
            trade_date = datetime(2024, 1, 17)
            financial_factors = {"pe_ratio": 15.0}
            price_data = [{"pct_chg": 2.5}]
            
            with pytest.raises(QuantSignalError) as exc_info:
                await service.calculate_quant_signal("000001.SZ", trade_date, financial_factors, price_data)
            
            # 验证异常信息
            assert "量化信号计算失败" in str(exc_info.value)
            assert exc_info.value.signal_id == "sig_000001.SZ_20240117"
            assert exc_info.value.signal_type == "quantitative"
            assert exc_info.value.context["stock_code"] == "000001.SZ"
    
    @pytest.mark.asyncio
    async def test_should_handle_detect_anomalies_exception(self, service):
        """测试：应该正确处理detect_anomalies的异常"""
        # 使用patch来模拟内部方法抛出异常
        with patch.object(service, '_detect_price_anomaly', side_effect=Exception("模拟异常检测错误")):
            trade_date = datetime(2024, 1, 17)
            price_data = [{"pct_chg": 2.5}]
            basic_data = [{"volume_ratio": 1.5}]
            
            with pytest.raises(QuantAnomalyDetectionError) as exc_info:
                await service.detect_anomalies("000001.SZ", trade_date, price_data, basic_data)
            
            # 验证异常信息
            assert "异常检测失败" in str(exc_info.value)
            assert exc_info.value.stock_code == "000001.SZ"
            assert exc_info.value.anomaly_type == "multi_type"
            assert exc_info.value.context["stock_code"] == "000001.SZ"
    
    @pytest.mark.asyncio
    async def test_should_save_quant_signal_successfully(self, service):
        """测试：应该成功保存量化信号到数据库"""
        # 使用patch来模拟数据库操作成功
        with patch.object(service, 'Session') as mock_session:
            mock_session_instance = mock_session.return_value.__enter__.return_value
            mock_session_instance.add = Mock()
            mock_session_instance.commit = Mock()
            mock_session_instance.refresh = Mock()
            
            # 创建一个有效的QuantSignal对象
            from quant_navigator_shared_types.quant_signals import QuantSignal, SignalType, SignalStatus
            valid_signal = QuantSignal(
                signal_id="test_signal_123",
                target_code="000001.SZ",
                signal_date=datetime(2024, 1, 17),
                signal_type=SignalType.INDIVIDUAL,
                status=SignalStatus.ACTIVE,
                return_z_score=0.5,
                volume_z_score=0.3,
                momentum_z_score=0.2,
                volatility_z_score=0.1,
                macro_risk_z_score=0.0,
                market_style_z_score=0.0,
                industry_rotation_z_score=0.0,
                concept_z_score=0.0,
                mda_fulfillment_rate=0.8,
                management_credibility_score=0.7,
                disclosure_quality_score=0.75,
                financial_transparency_score=0.8,
                rsi=55.0,
                macd_signal=0.25,
                bollinger_position=0.525,
                ma_signal=0.5,
                overall_signal_strength=0.3,
                signal_confidence=0.8,
                validity_days=30,
                model_version="v1.0.0",
                calculation_params={"z_score_threshold": 2.0, "lookback_days": 30},
                source="test",
                metadata={"test": "data"}
            )
            
            # 模拟QuantSignalEntity.from_quant_signal返回一个实体对象
            mock_entity = Mock()
            mock_entity.signal_id = "test_signal_123"
            with patch('src.services.quant_signal_service.QuantSignalEntity') as mock_entity_class:
                mock_entity_class.from_quant_signal.return_value = mock_entity
                
                # 执行保存操作
                result = await service.save_quant_signal(valid_signal)
                
                # 验证结果
                assert result == mock_entity
                mock_session_instance.add.assert_called_once_with(mock_entity)
                mock_session_instance.commit.assert_called_once()
                mock_session_instance.refresh.assert_called_once_with(mock_entity)
    
    @pytest.mark.asyncio
    async def test_should_handle_save_quant_signal_exception(self, service):
        """测试：应该正确处理save_quant_signal的异常"""
        # 使用patch来模拟数据库操作抛出异常
        with patch.object(service, 'Session') as mock_session:
            mock_session.return_value.__enter__.return_value.add.side_effect = Exception("模拟数据库错误")
            
            # 创建一个有效的QuantSignal对象
            from quant_navigator_shared_types.quant_signals import QuantSignal, SignalType, SignalStatus
            valid_signal = QuantSignal(
                signal_id="test_signal_123",
                target_code="000001.SZ",
                signal_date=datetime(2024, 1, 17),
                signal_type=SignalType.INDIVIDUAL,
                status=SignalStatus.ACTIVE,
                return_z_score=0.5,
                volume_z_score=0.3,
                momentum_z_score=0.2,
                volatility_z_score=0.1,
                macro_risk_z_score=0.0,
                market_style_z_score=0.0,
                industry_rotation_z_score=0.0,
                concept_z_score=0.0,
                mda_fulfillment_rate=0.8,
                management_credibility_score=0.7,
                disclosure_quality_score=0.75,
                financial_transparency_score=0.8,
                rsi=55.0,
                macd_signal=0.25,
                bollinger_position=0.525,
                ma_signal=0.5,
                overall_signal_strength=0.3,
                signal_confidence=0.8,
                validity_days=30,
                model_version="v1.0.0",
                calculation_params={"z_score_threshold": 2.0, "lookback_days": 30},
                source="test",
                metadata={"test": "data"}
            )
            
            with pytest.raises(QuantDatabaseError) as exc_info:
                await service.save_quant_signal(valid_signal)
            
            # 验证异常信息
            assert "保存量化信号失败" in str(exc_info.value)
            assert exc_info.value.operation == "save"
            assert exc_info.value.entity == "QuantSignal"
            assert exc_info.value.context["signal_id"] == "test_signal_123"
    
    @pytest.mark.asyncio
    async def test_should_handle_get_quant_signal_by_id_exception(self, service):
        """测试：应该正确处理get_quant_signal_by_id的异常"""
        # 使用patch来模拟数据库查询抛出异常
        with patch.object(service, 'Session') as mock_session:
            mock_session.return_value.__enter__.return_value.query.return_value.filter.return_value.first.side_effect = Exception("模拟数据库查询错误")
            
            signal_id = "test_signal_123"
            
            with pytest.raises(QuantDatabaseError) as exc_info:
                await service.get_quant_signal_by_id(signal_id)
            
            # 验证异常信息
            assert "获取量化信号失败" in str(exc_info.value)
            assert exc_info.value.operation == "query"
            assert exc_info.value.entity == "QuantSignal"
            assert exc_info.value.context["signal_id"] == signal_id
            assert exc_info.value.context["query_type"] == "by_id"
    
    # ===== P1 优先级测试：边界条件处理 =====
    
    def test_should_handle_empty_price_data_in_return_z_score(self, service):
        """测试：应该正确处理空价格数据的收益率Z分数计算"""
        empty_price_data = []
        z_score = service._calculate_return_z_score(empty_price_data)
        assert z_score == 0.0
    
    def test_should_handle_empty_price_data_in_volume_z_score(self, service):
        """测试：应该正确处理空价格数据的成交量Z分数计算"""
        empty_price_data = []
        z_score = service._calculate_volume_z_score(empty_price_data)
        assert z_score == 0.0
    
    def test_should_handle_empty_price_data_in_momentum_z_score(self, service):
        """测试：应该正确处理空价格数据的动量Z分数计算"""
        empty_price_data = []
        z_score = service._calculate_momentum_z_score(empty_price_data)
        assert z_score == 0.0
    
    def test_should_handle_empty_price_data_in_volatility_z_score(self, service):
        """测试：应该正确处理空价格数据的波动率Z分数计算"""
        empty_price_data = []
        z_score = service._calculate_volatility_z_score(empty_price_data)
        assert z_score == 0.0
    
    def test_should_handle_empty_price_data_in_rsi(self, service):
        """测试：应该正确处理空价格数据的RSI计算"""
        empty_price_data = []
        rsi = service._calculate_rsi(empty_price_data)
        assert rsi == 50.0
    
    def test_should_handle_empty_price_data_in_macd(self, service):
        """测试：应该正确处理空价格数据的MACD计算"""
        empty_price_data = []
        macd = service._calculate_macd_signal(empty_price_data)
        assert macd == 0.0
    
    def test_should_handle_empty_price_data_in_bollinger(self, service):
        """测试：应该正确处理空价格数据的布林带计算"""
        empty_price_data = []
        position = service._calculate_bollinger_position(empty_price_data)
        assert position == 0.5
    
    def test_should_handle_empty_price_data_in_ma_signal(self, service):
        """测试：应该正确处理空价格数据的移动平均计算"""
        empty_price_data = []
        ma_signal = service._calculate_ma_signal(empty_price_data)
        assert ma_signal == 0.0
    
    def test_should_calculate_signal_confidence_with_rich_financial_factors(self, service):
        """测试：应该正确计算丰富财务因子的信号置信度"""
        rich_financial_factors = {
            "pe_ratio": 15.0,
            "pb_ratio": 2.0,
            "ps_ratio": 3.0,
            "dividend_yield": 2.0,
            "roe": 0.15,
            "roa": 0.08,
            "debt_ratio": 0.3
        }
        price_data = [{"pct_chg": 2.5}]
        confidence = service._calculate_signal_confidence(rich_financial_factors, price_data)
        assert confidence == 1.0  # 0.5 + 0.2 + 0.3 = 1.0
    
    # ===== P2 优先级测试：异常检测方法边界条件 =====
    
    def test_should_not_detect_price_anomaly_when_within_threshold(self, service):
        """测试：应该在价格波动在阈值内时不检测异常"""
        stock_code = "000001.SZ"
        trade_date = datetime(2024, 1, 17)
        price_info = {"pct_chg": 5.0}  # 在10%阈值内
        
        anomaly = service._detect_price_anomaly(stock_code, trade_date, price_info)
        assert anomaly is None
    
    def test_should_not_detect_volume_anomaly_when_within_threshold(self, service):
        """测试：应该在成交量比率在阈值内时不检测异常"""
        stock_code = "000001.SZ"
        trade_date = datetime(2024, 1, 17)
        price_info = {"pct_chg": 2.5}
        basic_info = {"volume_ratio": 2.0}  # 在3倍阈值内
        
        anomaly = service._detect_volume_anomaly(stock_code, trade_date, price_info, basic_info)
        assert anomaly is None
    
    def test_should_not_detect_volatility_anomaly_when_within_threshold(self, service):
        """测试：应该在波动率在阈值内时不检测异常"""
        stock_code = "000001.SZ"
        trade_date = datetime(2024, 1, 17)
        price_info = {"pct_chg": 5.0}  # 在8%阈值内
        
        anomaly = service._detect_volatility_anomaly(stock_code, trade_date, price_info)
        assert anomaly is None
    
    @pytest.mark.asyncio
    async def test_should_handle_detect_anomalies_with_empty_data(self, service):
        """测试：应该正确处理空数据的异常检测"""
        stock_code = "000001.SZ"
        trade_date = datetime(2024, 1, 17)
        empty_price_data = []
        empty_basic_data = []
        
        anomalies = await service.detect_anomalies(stock_code, trade_date, empty_price_data, empty_basic_data)
        assert anomalies == []
    
    @pytest.mark.asyncio
    async def test_should_detect_multiple_anomalies(self, service):
        """测试：应该能够检测多种异常"""
        stock_code = "000001.SZ"
        trade_date = datetime(2024, 1, 17)
        price_data = [{"pct_chg": 12.5}]  # 超过价格阈值
        basic_data = [{"volume_ratio": 4.0}]  # 超过成交量阈值
        
        anomalies = await service.detect_anomalies(stock_code, trade_date, price_data, basic_data)
        assert len(anomalies) >= 2  # 至少检测到价格和成交量异常