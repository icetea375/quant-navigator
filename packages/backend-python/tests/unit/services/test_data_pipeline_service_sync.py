"""
DataPipelineService 同步单元测试
实施测试金字塔原则 - 大量快速单元测试
"""

import pytest

from src.services.data_pipeline_service import DataPipelineService


class TestDataPipelineServiceSync:
    """DataPipelineService 同步单元测试类"""

    @pytest.fixture
    def service(self):
        """创建服务实例"""
        config = {
            "tushare": {"token": "test_token"},
            "data_pipeline": {"batch_size": 100},
        }
        return DataPipelineService(config)

    def test_should_calculate_value_score_correctly_for_excellent_pe(self, service):
        """测试:应该为优秀的PE比率计算正确的价值评分"""
        # PE < 10 应该得到25分, PB < 1 得到25分, PS < 2 得到25分, 股息率 >= 5% 得到25分
        score = service._calculate_value_score(8.0, 0.8, 1.5, 6.0)
        assert score == 100.0  # 25 + 25 + 25 + 25

    def test_should_calculate_value_score_correctly_for_poor_pe(self, service):
        """测试:应该为糟糕的PE比率计算正确的价值评分"""
        # PE >= 50 得到5分, PB >= 5 得到5分, PS >= 20 得到5分, 股息率 < 0% 得到5分
        score = service._calculate_value_score(60.0, 6.0, 25.0, -1.0)
        assert score == 20.0  # 5 + 5 + 5 + 5

    def test_should_calculate_value_score_correctly_for_medium_pe(self, service):
        """测试:应该为中等PE比率计算正确的价值评分"""
        # PE in [10,20) 得到20分, PB in [1,2) 得到20分, PS in [5,10) 得到15分, 股息率 in [1%,3%) 得到15分
        score = service._calculate_value_score(18.0, 1.5, 8.0, 2.0)
        assert score == 70.0  # 20 + 20 + 15 + 15

    def test_should_calculate_value_score_correctly_for_excellent_pb(self, service):
        """测试:应该为优秀的PB比率计算正确的价值评分"""
        # PE in [10,20) 得到20分, PB < 1 得到25分, PS in [2,5) 得到20分, 股息率 in [1%,3%) 得到15分
        score = service._calculate_value_score(15.0, 0.8, 3.0, 2.0)
        assert score == 80.0  # 20 + 25 + 20 + 15

    def test_should_calculate_value_score_correctly_for_excellent_ps(self, service):
        """测试:应该为优秀的PS比率计算正确的价值评分"""
        # PE in [10,20) 得到20分, PB in [1,2) 得到20分, PS < 2 得到25分, 股息率 in [1%,3%) 得到15分
        score = service._calculate_value_score(15.0, 1.5, 1.5, 2.0)
        assert score == 80.0  # 20 + 20 + 25 + 15

    def test_should_calculate_value_score_correctly_for_excellent_dividend_yield(
        self, service
    ):
        """测试:应该为优秀的股息率计算正确的价值评分"""
        # PE in [10,20) 得到20分, PB in [1,2) 得到20分, PS in [2,5) 得到20分, 股息率 >= 5% 得到25分
        score = service._calculate_value_score(15.0, 1.5, 3.0, 6.0)
        assert score == 85.0  # 20 + 20 + 20 + 25

    def test_should_cap_value_score_at_100(self, service):
        """测试:价值评分应该被限制在100分以内"""
        # 即使所有指标都优秀,总分也不应超过100
        score = service._calculate_value_score(5.0, 0.5, 1.0, 8.0)
        assert score == 100.0

    def test_should_handle_zero_values_in_value_score_calculation(self, service):
        """测试:应该正确处理价值评分计算中的零值"""
        # PE=0 在 [0,10) 得到25分, PB=0 在 [0,1) 得到25分, PS=0 在 [0,2) 得到25分, 股息率=0 在 [0,1%) 得到10分
        score = service._calculate_value_score(0.0, 0.0, 0.0, 0.0)
        assert score == 85.0  # 25 + 25 + 25 + 10

    def test_should_handle_negative_values_in_value_score_calculation(self, service):
        """测试:应该正确处理价值评分计算中的负值"""
        score = service._calculate_value_score(-5.0, -0.5, -1.0, -2.0)
        assert score == 20.0  # 5 + 5 + 5 + 5

    def test_should_calculate_growth_score_returns_default_value(self, service):
        """测试:成长性评分计算应该返回默认值"""
        factors = {"test": "data"}
        score = service._calculate_growth_score(factors)
        assert score == 50.0

    def test_should_calculate_profitability_score_returns_default_value(self, service):
        """测试:盈利能力评分计算应该返回默认值"""
        factors = {"test": "data"}
        score = service._calculate_profitability_score(factors)
        assert score == 50.0

    def test_should_calculate_financial_health_score_returns_default_value(
        self, service
    ):
        """测试:财务健康度评分计算应该返回默认值"""
        factors = {"test": "data"}
        score = service._calculate_financial_health_score(factors)
        assert score == 50.0

    @pytest.mark.asyncio
    async def test_should_calculate_super_financial_factors_correctly(self, service):
        """测试:应该正确计算超级财务因子"""
        financial_factors = {
            "pe_ratio": 8.0,
            "pb_ratio": 0.8,
            "ps_ratio": 1.5,
            "dividend_yield": 4.0,
        }

        result = await service.calculate_super_financial_factors(financial_factors)

        assert "value_score" in result
        assert "growth_score" in result
        assert "profitability_score" in result
        assert "financial_health_score" in result
        assert "overall_score" in result
        assert "calculated_at" in result

        # 验证评分范围
        assert 0 <= result["value_score"] <= 100
        assert 0 <= result["growth_score"] <= 100
        assert 0 <= result["profitability_score"] <= 100
        assert 0 <= result["financial_health_score"] <= 100
        assert 0 <= result["overall_score"] <= 100

    @pytest.mark.asyncio
    async def test_should_preserve_original_factors_in_super_factors(self, service):
        """测试:超级财务因子应该保留原始因子"""
        financial_factors = {
            "pe_ratio": 8.0,
            "pb_ratio": 0.8,
            "ps_ratio": 1.5,
            "dividend_yield": 4.0,
            "custom_field": "test_value",
        }

        result = await service.calculate_super_financial_factors(financial_factors)

        # 验证原始字段被保留
        assert result["pe_ratio"] == 8.0
        assert result["pb_ratio"] == 0.8
        assert result["ps_ratio"] == 1.5
        assert result["dividend_yield"] == 4.0
        assert result["custom_field"] == "test_value"

    @pytest.mark.asyncio
    async def test_should_handle_empty_financial_factors_gracefully(self, service):
        """测试:应该优雅地处理空的财务因子"""
        result = await service.calculate_super_financial_factors({})

        assert "value_score" in result
        assert "overall_score" in result
        # 空字典时,pe_ratio=0.0得到25分,pb_ratio=0.0得到25分,ps_ratio=0.0得到25分,dividend_yield=0.0得到10分
        # value_score = 25+25+25+10 = 85,其他评分都是50,平均值 = (85+50+50+50)/4 = 58.75
        assert result["overall_score"] == 58.75

    @pytest.mark.asyncio
    async def test_should_handle_missing_required_fields_in_financial_factors(
        self, service
    ):
        """测试:应该优雅地处理缺少必需字段的财务因子"""
        financial_factors = {"pe_ratio": 8.0}  # 缺少其他字段

        result = await service.calculate_super_financial_factors(financial_factors)

        assert "value_score" in result
        assert "overall_score" in result
        # 原始字段被保留,缺失字段不会被添加
        assert result["pe_ratio"] == 8.0
        # 缺失的字段不会出现在结果中,因为原始字典中没有
