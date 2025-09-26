"""
DataPipelineService数据存储集成测试
测试DataPipelineService的数据存储逻辑，确保数据能正确保存到数据库

遵循测试宪法：
- 只模拟外部边界（数据库），不模拟内部逻辑
- 使用精确且有意义的断言
- 测试成功路径、失败路径和数据验证
"""

from unittest.mock import patch

import pytest

from src.services.data_pipeline_service import DataPipelineService


class TestDataPipelineStorageIntegration:
    """DataPipelineService数据存储集成测试类"""

    @pytest.fixture
    def mock_config(self):
        """创建模拟配置"""
        return {
            "tushare": {
                "token": "test_token",
                "timeout": 30
            },
            "database": {
                "url": "postgresql://test:test@localhost/test"
            }
        }

    @pytest.fixture
    def data_pipeline_service(self, mock_config):
        """创建DataPipeline服务实例"""
        return DataPipelineService(mock_config)

    @pytest.fixture
    def sample_financial_factors(self):
        """创建示例财务因子数据"""
        return {
            "stock_code": "000001.SZ",
            "trade_date": "20240101",
            "pe_ratio": 15.0,
            "pb_ratio": 2.0,
            "ps_ratio": 3.0,
            "dividend_yield": 2.5,
            "market_cap": 1000000000.0,
            "turnover_rate": 0.05,
            "volume_ratio": 1.2,
            "float_market_cap": 800000000.0,
            "total_shares": 1000000000,
            "float_shares": 800000000,
            "free_shares": 600000000,
            "open_price": 10.0,
            "high_price": 10.5,
            "low_price": 9.5,
            "close_price": 10.2,
            "pre_close": 10.0,
            "price_change": 0.2,
            "price_change_pct": 2.0,
            "volume": 1000000,
            "amount": 10000000
        }

    @pytest.fixture
    def sample_super_financial_factors(self):
        """创建示例超级财务因子数据"""
        return {
            "stock_code": "000001.SZ",
            "trade_date": "20240101",
            "pe_ratio": 15.0,
            "pb_ratio": 2.0,
            "ps_ratio": 3.0,
            "dividend_yield": 2.5,
            "market_cap": 1000000000.0,
            "turnover_rate": 0.05,
            "volume_ratio": 1.2,
            "float_market_cap": 800000000.0,
            "total_shares": 1000000000,
            "float_shares": 800000000,
            "free_shares": 600000000,
            "open_price": 10.0,
            "high_price": 10.5,
            "low_price": 9.5,
            "close_price": 10.2,
            "pre_close": 10.0,
            "price_change": 0.2,
            "price_change_pct": 2.0,
            "volume": 1000000,
            "amount": 10000000,
            "value_score": 20.0,
            "growth_score": 50.0,
            "profitability_score": 50.0,
            "financial_health_score": 50.0,
            "overall_score": 42.5,
            "calculated_at": "2024-01-01T10:00:00"
        }

    # ==================== 财务因子存储测试 ====================

    @pytest.mark.asyncio
    async def test_save_financial_factors_success(self, data_pipeline_service, sample_financial_factors):
        """测试成功保存财务因子"""
        result = await data_pipeline_service.save_financial_factors(sample_financial_factors)

        assert result is True
        assert isinstance(result, bool)

    @pytest.mark.asyncio
    async def test_save_financial_factors_missing_required_field(self, data_pipeline_service):
        """测试保存财务因子时缺少必要字段"""
        incomplete_data = {
            "stock_code": "000001.SZ",
            "trade_date": "20240101",
            "pe_ratio": 15.0
            # 缺少 pb_ratio 字段
        }

        with pytest.raises(Exception) as exc_info:
            await data_pipeline_service.save_financial_factors(incomplete_data)

        assert "财务因子保存失败" in str(exc_info.value)
        assert "缺少必要字段" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_save_financial_factors_empty_data(self, data_pipeline_service):
        """测试保存空财务因子数据"""
        empty_data = {}

        with pytest.raises(Exception) as exc_info:
            await data_pipeline_service.save_financial_factors(empty_data)

        assert "财务因子保存失败" in str(exc_info.value)
        assert "缺少必要字段" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_save_financial_factors_database_error(self, data_pipeline_service, sample_financial_factors):
        """测试保存财务因子时数据库错误"""
        with patch.object(data_pipeline_service, "_persist_financial_factors", side_effect=Exception("数据库连接失败")):
            with pytest.raises(Exception) as exc_info:
                await data_pipeline_service.save_financial_factors(sample_financial_factors)

            assert "财务因子保存失败" in str(exc_info.value)
            assert "数据库连接失败" in str(exc_info.value)

    # ==================== 超级财务因子存储测试 ====================

    @pytest.mark.asyncio
    async def test_save_super_financial_factors_success(self, data_pipeline_service, sample_super_financial_factors):
        """测试成功保存超级财务因子"""
        result = await data_pipeline_service.save_super_financial_factors(sample_super_financial_factors)

        assert result is True
        assert isinstance(result, bool)

    @pytest.mark.asyncio
    async def test_save_super_financial_factors_missing_required_field(self, data_pipeline_service):
        """测试保存超级财务因子时缺少必要字段"""
        incomplete_data = {
            "stock_code": "000001.SZ",
            "trade_date": "20240101",
            "pe_ratio": 15.0
            # 缺少 overall_score 和 value_score 字段
        }

        with pytest.raises(Exception) as exc_info:
            await data_pipeline_service.save_super_financial_factors(incomplete_data)

        assert "超级财务因子保存失败" in str(exc_info.value)
        assert "缺少必要字段" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_save_super_financial_factors_empty_data(self, data_pipeline_service):
        """测试保存空超级财务因子数据"""
        empty_data = {}

        with pytest.raises(Exception) as exc_info:
            await data_pipeline_service.save_super_financial_factors(empty_data)

        assert "超级财务因子保存失败" in str(exc_info.value)
        assert "缺少必要字段" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_save_super_financial_factors_database_error(self, data_pipeline_service, sample_super_financial_factors):
        """测试保存超级财务因子时数据库错误"""
        with patch.object(data_pipeline_service, "_persist_super_financial_factors", side_effect=Exception("数据库连接失败")):
            with pytest.raises(Exception) as exc_info:
                await data_pipeline_service.save_super_financial_factors(sample_super_financial_factors)

            assert "超级财务因子保存失败" in str(exc_info.value)
            assert "数据库连接失败" in str(exc_info.value)

    # ==================== 数据验证测试 ====================

    @pytest.mark.asyncio
    async def test_persist_financial_factors_validation(self, data_pipeline_service):
        """测试财务因子数据验证逻辑"""
        # 测试所有必要字段都存在
        valid_data = {
            "stock_code": "000001.SZ",
            "trade_date": "20240101",
            "pe_ratio": 15.0,
            "pb_ratio": 2.0
        }

        # 应该不抛出异常
        await data_pipeline_service._persist_financial_factors(valid_data)

    @pytest.mark.asyncio
    async def test_persist_super_financial_factors_validation(self, data_pipeline_service):
        """测试超级财务因子数据验证逻辑"""
        # 测试所有必要字段都存在
        valid_data = {
            "stock_code": "000001.SZ",
            "trade_date": "20240101",
            "overall_score": 42.5,
            "value_score": 20.0
        }

        # 应该不抛出异常
        await data_pipeline_service._persist_super_financial_factors(valid_data)

    # ==================== 边界条件测试 ====================

    @pytest.mark.asyncio
    async def test_save_financial_factors_with_zero_values(self, data_pipeline_service):
        """测试保存包含零值的财务因子"""
        data_with_zeros = {
            "stock_code": "000001.SZ",
            "trade_date": "20240101",
            "pe_ratio": 0.0,
            "pb_ratio": 0.0,
            "ps_ratio": 0.0,
            "dividend_yield": 0.0
        }

        result = await data_pipeline_service.save_financial_factors(data_with_zeros)
        assert result is True

    @pytest.mark.asyncio
    async def test_save_financial_factors_with_negative_values(self, data_pipeline_service):
        """测试保存包含负值的财务因子"""
        data_with_negatives = {
            "stock_code": "000001.SZ",
            "trade_date": "20240101",
            "pe_ratio": -5.0,
            "pb_ratio": -1.0,
            "ps_ratio": -2.0,
            "dividend_yield": -1.0
        }

        result = await data_pipeline_service.save_financial_factors(data_with_negatives)
        assert result is True

    @pytest.mark.asyncio
    async def test_save_super_financial_factors_with_edge_scores(self, data_pipeline_service):
        """测试保存边界评分的超级财务因子"""
        data_with_edge_scores = {
            "stock_code": "000001.SZ",
            "trade_date": "20240101",
            "pe_ratio": 15.0,
            "pb_ratio": 2.0,
            "ps_ratio": 3.0,
            "dividend_yield": 2.5,
            "value_score": 0.0,  # 最低分
            "growth_score": 100.0,  # 最高分
            "profitability_score": 50.0,
            "financial_health_score": 50.0,
            "overall_score": 50.0,
            "calculated_at": "2024-01-01T10:00:00"
        }

        result = await data_pipeline_service.save_super_financial_factors(data_with_edge_scores)
        assert result is True

    # ==================== 性能测试 ====================

    @pytest.mark.asyncio
    async def test_save_financial_factors_performance(self, data_pipeline_service, sample_financial_factors):
        """测试财务因子保存性能"""
        import time

        start_time = time.time()
        result = await data_pipeline_service.save_financial_factors(sample_financial_factors)
        end_time = time.time()

        assert result is True
        # 确保保存操作在合理时间内完成（小于1秒）
        assert (end_time - start_time) < 1.0

    @pytest.mark.asyncio
    async def test_save_super_financial_factors_performance(self, data_pipeline_service, sample_super_financial_factors):
        """测试超级财务因子保存性能"""
        import time

        start_time = time.time()
        result = await data_pipeline_service.save_super_financial_factors(sample_super_financial_factors)
        end_time = time.time()

        assert result is True
        # 确保保存操作在合理时间内完成（小于1秒）
        assert (end_time - start_time) < 1.0

