"""
DataPipeline服务单元测试
测试数据管道的核心功能,目标覆盖率90%+
"""

from unittest.mock import MagicMock, patch

import pandas as pd
import pytest

from src.services.data_pipeline_service import DataPipelineService


class TestDataPipelineServiceUnit:
    """DataPipeline服务单元测试类"""

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
    def sample_stock_data(self):
        """创建示例股票数据"""
        return pd.DataFrame({
            "ts_code": ["000001.SZ", "000002.SZ"],
            "trade_date": ["20240101", "20240102"],
            "open": [10.0, 11.0],
            "high": [10.5, 11.5],
            "low": [9.5, 10.5],
            "close": [10.2, 11.2],
            "vol": [1000000, 1200000],
            "amount": [10000000, 12000000],
            "pct_chg": [2.0, 1.8]
        })

    def test_should_initialize_with_config(self, data_pipeline_service, mock_config):
        """测试:应该使用配置正确初始化"""
        assert data_pipeline_service.config == mock_config
        assert data_pipeline_service.logger is not None

    @pytest.mark.asyncio
    async def test_safe_get_with_valid_data(self, data_pipeline_service):
        """测试:safe_get应该返回有效数据"""
        # 测试内部safe_get函数的行为
        raw_data = {
            "daily_basic": [{"pe": 15.0, "pb": 2.0, "ps": 1.5, "dv_ratio": 0.03}],
            "daily": [{"open": 10.0, "high": 10.5, "low": 9.5, "close": 10.2, "vol": 1000000}]
        }

        result = await data_pipeline_service.extract_financial_factors("000001.SZ", "20240101", raw_data)

        assert result is not None
        assert result["pe_ratio"] == 15.0
        assert result["pb_ratio"] == 2.0

    @pytest.mark.asyncio
    async def test_safe_get_with_missing_key(self, data_pipeline_service):
        """测试:safe_get应该处理缺失键"""
        raw_data = {
            "daily_basic": [{"pe": 15.0}],  # 缺少pb字段
            "daily": [{"open": 10.0, "close": 10.2}]
        }

        result = await data_pipeline_service.extract_financial_factors("000001.SZ", "20240101", raw_data)

        assert result is not None
        assert result["pe_ratio"] == 15.0
        assert result["pb_ratio"] == 0.0  # 应该使用默认值

    @pytest.mark.asyncio
    async def test_safe_get_with_none_value(self, data_pipeline_service):
        """测试:safe_get应该处理None值"""
        raw_data = {
            "daily_basic": [{"pe": None, "pb": 2.0}],
            "daily": [{"open": 10.0, "close": 10.2}]
        }

        result = await data_pipeline_service.extract_financial_factors("000001.SZ", "20240101", raw_data)

        assert result is not None
        assert result["pe_ratio"] == 0.0  # 应该使用默认值
        assert result["pb_ratio"] == 2.0

    @pytest.mark.asyncio
    async def test_safe_get_with_nan_value(self, data_pipeline_service):
        """测试:safe_get应该处理NaN值"""
        import numpy as np
        raw_data = {
            "daily_basic": [{"pe": np.nan, "pb": 2.0}],
            "daily": [{"open": 10.0, "close": 10.2}]
        }

        result = await data_pipeline_service.extract_financial_factors("000001.SZ", "20240101", raw_data)

        assert result is not None
        assert result["pe_ratio"] == 0.0  # 应该使用默认值
        assert result["pb_ratio"] == 2.0

    @pytest.mark.asyncio
    async def test_fetch_tushare_data_success(self, data_pipeline_service):
        """测试:应该成功获取Tushare数据"""
        with patch.object(data_pipeline_service, "pro") as mock_pro:
            # 模拟Tushare API响应
            mock_stock_basic = MagicMock()
            mock_stock_basic.to_dict.return_value = [{"ts_code": "000001.SZ", "name": "测试股票"}]

            mock_daily_basic = MagicMock()
            mock_daily_basic.to_dict.return_value = [{"ts_code": "000001.SZ", "pe": 15.0, "pb": 2.0}]

            mock_daily = MagicMock()
            mock_daily.to_dict.return_value = [{"ts_code": "000001.SZ", "close": 10.0, "vol": 1000000}]

            mock_pro.stock_basic.return_value = mock_stock_basic
            mock_pro.daily_basic.return_value = mock_daily_basic
            mock_pro.daily.return_value = mock_daily

            result = await data_pipeline_service.fetch_tushare_data("000001.SZ", "20240101")

            assert result is not None
            assert "stock_basic" in result
            assert "daily_basic" in result
            assert "daily" in result

    @pytest.mark.asyncio
    async def test_fetch_tushare_data_failure(self, data_pipeline_service):
        """测试:应该处理Tushare数据获取失败"""
        with patch.object(data_pipeline_service, "pro") as mock_pro:
            mock_pro.stock_basic.side_effect = Exception("API调用失败")

            with pytest.raises(Exception) as exc_info:
                await data_pipeline_service.fetch_tushare_data("000001.SZ", "20240101")

            assert "API调用失败" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_extract_financial_factors_success(self, data_pipeline_service):
        """测试:应该成功提取财务因子"""
        raw_data = {
            "daily_basic": [{"pe": 15.0, "pb": 2.0, "ps": 1.5, "dv_ratio": 0.03}],
            "daily": [{"open": 10.0, "high": 10.5, "low": 9.5, "close": 10.2, "vol": 1000000}]
        }

        result = await data_pipeline_service.extract_financial_factors("000001.SZ", "20240101", raw_data)

        assert result is not None
        assert result["stock_code"] == "000001.SZ"
        assert result["trade_date"] == "20240101"
        assert result["pe_ratio"] == 15.0
        assert result["pb_ratio"] == 2.0

    @pytest.mark.asyncio
    async def test_extract_financial_factors_with_empty_data(self, data_pipeline_service):
        """测试:应该处理空数据"""
        empty_data = {}

        with pytest.raises(ValueError) as exc_info:
            await data_pipeline_service.extract_financial_factors("000001.SZ", "20240101", empty_data)

        assert "原始数据不能为空" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_extract_financial_factors_with_missing_daily_basic(self, data_pipeline_service):
        """测试:应该处理缺失daily_basic数据"""
        incomplete_data = {
            "daily": [{"open": 10.0, "close": 10.2}]
        }

        with pytest.raises(Exception) as exc_info:
            await data_pipeline_service.extract_financial_factors("000001.SZ", "20240101", incomplete_data)

        assert "财务因子提取失败" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_should_validate_stock_code(self, data_pipeline_service):
        """测试:应该验证股票代码"""
        with pytest.raises(ValueError) as exc_info:
            await data_pipeline_service.fetch_tushare_data("", "20240101")

        assert "股票代码不能为空" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_should_validate_trade_date_format(self, data_pipeline_service):
        """测试:应该验证交易日期格式"""
        with pytest.raises(ValueError) as exc_info:
            await data_pipeline_service.fetch_tushare_data("000001.SZ", "2024-01-01")

        assert "无效的日期格式" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_should_validate_trade_date_empty(self, data_pipeline_service):
        """测试:应该验证交易日期为空"""
        with pytest.raises(ValueError) as exc_info:
            await data_pipeline_service.extract_financial_factors("000001.SZ", "", {})

        assert "交易日期不能为空" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_should_validate_stock_code_empty(self, data_pipeline_service):
        """测试:应该验证股票代码为空"""
        with pytest.raises(ValueError) as exc_info:
            await data_pipeline_service.extract_financial_factors("", "20240101", {})

        assert "股票代码不能为空" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_should_validate_raw_data_empty(self, data_pipeline_service):
        """测试:应该验证原始数据为空"""
        with pytest.raises(ValueError) as exc_info:
            await data_pipeline_service.extract_financial_factors("000001.SZ", "20240101", {})

        assert "原始数据不能为空" in str(exc_info.value)

    # ==================== 重构后的方法测试 ====================

    @pytest.mark.asyncio
    async def test_calculate_super_financial_factors_success(self, data_pipeline_service):
        """测试:计算超级财务因子成功"""
        financial_factors = {
            "pe_ratio": 15.0,
            "pb_ratio": 2.0,
            "ps_ratio": 3.0,
            "dividend_yield": 2.5
        }

        result = await data_pipeline_service.calculate_super_financial_factors(financial_factors)

        assert "value_score" in result
        assert "growth_score" in result
        assert "profitability_score" in result
        assert "financial_health_score" in result
        assert "overall_score" in result
        assert "calculated_at" in result
        assert result["overall_score"] > 0
        assert result["overall_score"] <= 100

    @pytest.mark.asyncio
    async def test_calculate_super_financial_factors_exception(self, data_pipeline_service):
        """测试:计算超级财务因子异常处理"""
        # 模拟异常情况
        with patch.object(data_pipeline_service, "_calculate_all_scores", side_effect=Exception("测试异常")):
            with pytest.raises(Exception) as exc_info:
                await data_pipeline_service.calculate_super_financial_factors({})

            assert "超级财务因子计算失败" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_calculate_all_scores(self, data_pipeline_service):
        """测试:计算所有评分"""
        factors = {
            "pe_ratio": 15.0,
            "pb_ratio": 2.0,
            "ps_ratio": 3.0,
            "dividend_yield": 2.5
        }

        scores = await data_pipeline_service._calculate_all_scores(factors)

        assert "value_score" in scores
        assert "growth_score" in scores
        assert "profitability_score" in scores
        assert "financial_health_score" in scores
        assert all(isinstance(score, (int, float)) for score in scores.values())

    def test_build_super_factors_result(self, data_pipeline_service):
        """测试:构建超级财务因子结果"""
        factors = {"pe_ratio": 15.0, "pb_ratio": 2.0}
        scores = {
            "value_score": 20.0,
            "growth_score": 50.0,
            "profitability_score": 50.0,
            "financial_health_score": 50.0
        }

        result = data_pipeline_service._build_super_factors_result(factors, scores)

        assert result["pe_ratio"] == 15.0
        assert result["pb_ratio"] == 2.0
        assert result["value_score"] == 20.0
        assert result["overall_score"] == 42.5  # (20+50+50+50)/4
        assert "calculated_at" in result

    # ==================== 配置化评分规则测试 ====================

    def test_load_scoring_rules_success(self, data_pipeline_service):
        """测试:成功加载评分规则配置"""
        assert hasattr(data_pipeline_service.scoring_rules, "value_score_rules")
        assert hasattr(data_pipeline_service.scoring_rules.value_score_rules, "pe")
        assert hasattr(data_pipeline_service.scoring_rules.value_score_rules, "pb")
        assert hasattr(data_pipeline_service.scoring_rules.value_score_rules, "ps")
        assert hasattr(data_pipeline_service.scoring_rules.value_score_rules, "dividend_yield")

    def test_get_default_scoring_rules(self, data_pipeline_service):
        """测试:获取默认评分规则"""
        default_rules = data_pipeline_service._get_default_scoring_rules()

        assert hasattr(default_rules, "value_score_rules")
        assert hasattr(default_rules, "growth_score_rules")
        assert hasattr(default_rules, "profitability_score_rules")
        assert hasattr(default_rules, "financial_health_score_rules")

    def test_load_scoring_rules_file_not_exists(self, data_pipeline_service):
        """测试:配置文件不存在时使用默认规则"""
        with patch("os.path.exists", return_value=False):
            rules = data_pipeline_service._load_scoring_rules()
            assert hasattr(rules, "value_score_rules")
            assert hasattr(rules, "growth_score_rules")

    def test_load_scoring_rules_exception(self, data_pipeline_service):
        """测试:配置文件加载异常时使用默认规则"""
        with patch("os.path.exists", return_value=True), \
             patch("builtins.open", side_effect=Exception("文件读取错误")):
            rules = data_pipeline_service._load_scoring_rules()
            assert hasattr(rules, "value_score_rules")
            assert hasattr(rules, "growth_score_rules")

    # ==================== 价值评分测试 ====================

    def test_calculate_value_score_high_value(self, data_pipeline_service):
        """测试:高价值股票评分"""
        score = data_pipeline_service._calculate_value_score(pe=8.0, pb=0.8, ps=1.5, dividend_yield=4.0)
        assert score > 80  # 应该是高分

    def test_calculate_value_score_low_value(self, data_pipeline_service):
        """测试:低价值股票评分"""
        score = data_pipeline_service._calculate_value_score(pe=50.0, pb=5.0, ps=20.0, dividend_yield=0.5)
        assert score < 30  # 应该是低分

    def test_calculate_value_score_edge_cases(self, data_pipeline_service):
        """测试:边界情况"""
        # 测试零值
        score_zero = data_pipeline_service._calculate_value_score(pe=0.0, pb=0.0, ps=0.0, dividend_yield=0.0)
        assert 0 <= score_zero <= 100

        # 测试负值
        score_negative = data_pipeline_service._calculate_value_score(pe=-5.0, pb=-1.0, ps=-2.0, dividend_yield=-1.0)
        assert 0 <= score_negative <= 100

    # ==================== 各指标评分测试 ====================

    def test_score_pe_ratio_excellent(self, data_pipeline_service):
        """测试:PE比率优秀评分"""
        score = data_pipeline_service._score_pe_ratio(5.0)
        assert score == 25.0

    def test_score_pe_ratio_good(self, data_pipeline_service):
        """测试:PE比率良好评分"""
        score = data_pipeline_service._score_pe_ratio(15.0)
        assert score == 20.0

    def test_score_pe_ratio_poor(self, data_pipeline_service):
        """测试:PE比率较差评分"""
        score = data_pipeline_service._score_pe_ratio(60.0)
        assert score == 5.0

    def test_score_pb_ratio_excellent(self, data_pipeline_service):
        """测试:PB比率优秀评分"""
        score = data_pipeline_service._score_pb_ratio(0.8)
        assert score == 25.0

    def test_score_pb_ratio_good(self, data_pipeline_service):
        """测试:PB比率良好评分"""
        score = data_pipeline_service._score_pb_ratio(1.5)
        assert score == 20.0

    def test_score_pb_ratio_poor(self, data_pipeline_service):
        """测试:PB比率较差评分"""
        score = data_pipeline_service._score_pb_ratio(8.0)
        assert score == 5.0

    def test_score_ps_ratio_excellent(self, data_pipeline_service):
        """测试:PS比率优秀评分"""
        score = data_pipeline_service._score_ps_ratio(1.0)
        assert score == 25.0

    def test_score_ps_ratio_good(self, data_pipeline_service):
        """测试:PS比率良好评分"""
        score = data_pipeline_service._score_ps_ratio(3.0)
        assert score == 20.0

    def test_score_ps_ratio_poor(self, data_pipeline_service):
        """测试:PS比率较差评分"""
        score = data_pipeline_service._score_ps_ratio(25.0)
        assert score == 5.0

    def test_score_dividend_yield_excellent(self, data_pipeline_service):
        """测试:股息率优秀评分"""
        score = data_pipeline_service._score_dividend_yield(6.0)
        assert score == 25.0

    def test_score_dividend_yield_good(self, data_pipeline_service):
        """测试:股息率良好评分"""
        score = data_pipeline_service._score_dividend_yield(4.0)
        assert score == 20.0

    def test_score_dividend_yield_poor(self, data_pipeline_service):
        """测试:股息率较差评分"""
        score = data_pipeline_service._score_dividend_yield(0.5)
        assert score == 10.0

    def test_score_dividend_yield_negative(self, data_pipeline_service):
        """测试:股息率负值评分"""
        score = data_pipeline_service._score_dividend_yield(-1.0)
        assert score == 5.0

    # ==================== 通用评分方法测试 ====================

    def test_score_metric_normal_case(self, data_pipeline_service):
        """测试:通用评分方法正常情况"""
        from src.schemas.scoring_rules_config import ScoringRule
        rules = [
            ScoringRule(min_value=0, max_value=10, score=25.0),
            ScoringRule(min_value=10, max_value=20, score=20.0),
            ScoringRule(min_value=20, max_value=30, score=15.0)
        ]
        score = data_pipeline_service._score_metric(15.0, rules)
        assert score == 20.0

    def test_score_metric_edge_case(self, data_pipeline_service):
        """测试:通用评分方法边界情况"""
        from src.schemas.scoring_rules_config import ScoringRule
        rules = [
            ScoringRule(min_value=0, max_value=10, score=25.0),
            ScoringRule(min_value=10, max_value=20, score=20.0),
            ScoringRule(min_value=20, max_value=30, score=15.0)
        ]
        # 测试边界值
        score_10 = data_pipeline_service._score_metric(10.0, rules)
        assert score_10 == 20.0  # 应该匹配第二个规则

        score_20 = data_pipeline_service._score_metric(20.0, rules)
        assert score_20 == 15.0  # 应该匹配第三个规则

    def test_score_metric_fallback(self, data_pipeline_service):
        """测试:通用评分方法回退情况"""
        from src.schemas.scoring_rules_config import ScoringRule
        rules = [
            ScoringRule(min_value=0, max_value=10, score=25.0),
            ScoringRule(min_value=10, max_value=20, score=20.0)
        ]
        # 测试超出范围的值
        score = data_pipeline_service._score_metric(30.0, rules)
        assert score == 20.0  # 应该返回最后一个规则的值

    def test_score_metric_empty_rules(self, data_pipeline_service):
        """测试:通用评分方法空规则"""
        score = data_pipeline_service._score_metric(15.0, [])
        assert score == 0.0  # 空规则应该返回0
