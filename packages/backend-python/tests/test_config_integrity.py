"""
配置健全性检查测试
对真实的配置文件进行数据完整性验证,确保业务逻辑的健全性
这不是对代码的单元测试,而是对配置数据的单元测试
"""

import os

import pytest
import yaml

from src.schemas.scoring_rules_config import ScoringRulesConfig


class TestConfigIntegrity:
    """配置健全性检查测试类"""

    @pytest.fixture
    def config_path(self):
        """获取配置文件路径"""
        return os.path.join(
            os.path.dirname(__file__), "..", "config", "scoring_rules.yml"
        )

    @pytest.fixture
    def config_data(self, config_path):
        """加载配置文件数据"""
        if not os.path.exists(config_path):
            pytest.skip(f"配置文件不存在: {config_path}")

        with open(config_path, encoding="utf-8") as file:
            return yaml.safe_load(file)

    def test_config_file_exists(self, config_path):
        """测试:配置文件存在"""
        assert os.path.exists(config_path), f"配置文件不存在: {config_path}"

    def test_config_yaml_valid(self, config_data):
        """测试:YAML文件格式有效"""
        assert isinstance(config_data, dict), "配置文件必须是字典格式"
        assert "value_score_rules" in config_data, "配置文件必须包含value_score_rules"

    def test_config_pydantic_validation(self, config_data):
        """测试:配置文件通过Pydantic验证"""
        # 这应该不会抛出异常
        config = ScoringRulesConfig.model_validate(config_data)
        assert isinstance(config, ScoringRulesConfig)

    def test_value_score_rules_structure(self, config_data):
        """测试:价值评分规则结构完整性"""
        value_rules = config_data["value_score_rules"]

        required_metrics = ["pe", "pb", "ps", "dividend_yield"]
        for metric in required_metrics:
            assert metric in value_rules, f"缺少{metric}评分规则"
            assert isinstance(value_rules[metric], list), f"{metric}规则必须是列表"
            assert len(value_rules[metric]) > 0, f"{metric}规则不能为空"

    def test_pe_rules_continuity(self, config_data):
        """测试:PE规则连续性"""
        pe_rules = config_data["value_score_rules"]["pe"]
        self._validate_rules_continuity(pe_rules, "PE")

    def test_pb_rules_continuity(self, config_data):
        """测试:PB规则连续性"""
        pb_rules = config_data["value_score_rules"]["pb"]
        self._validate_rules_continuity(pb_rules, "PB")

    def test_ps_rules_continuity(self, config_data):
        """测试:PS规则连续性"""
        ps_rules = config_data["value_score_rules"]["ps"]
        self._validate_rules_continuity(ps_rules, "PS")

    def test_dividend_yield_rules_continuity(self, config_data):
        """测试:股息率规则连续性"""
        dividend_rules = config_data["value_score_rules"]["dividend_yield"]
        self._validate_rules_continuity(dividend_rules, "股息率")

    def test_pe_rules_score_range(self, config_data):
        """测试:PE规则得分范围"""
        pe_rules = config_data["value_score_rules"]["pe"]
        self._validate_score_range(pe_rules, "PE")

    def test_pb_rules_score_range(self, config_data):
        """测试:PB规则得分范围"""
        pb_rules = config_data["value_score_rules"]["pb"]
        self._validate_score_range(pb_rules, "PB")

    def test_ps_rules_score_range(self, config_data):
        """测试:PS规则得分范围"""
        ps_rules = config_data["value_score_rules"]["ps"]
        self._validate_score_range(ps_rules, "PS")

    def test_dividend_yield_rules_score_range(self, config_data):
        """测试:股息率规则得分范围"""
        dividend_rules = config_data["value_score_rules"]["dividend_yield"]
        self._validate_score_range(dividend_rules, "股息率")

    def test_pe_rules_value_range(self, config_data):
        """测试:PE规则数值范围合理性"""
        pe_rules = config_data["value_score_rules"]["pe"]
        self._validate_value_range(pe_rules, "PE", expected_min=0, expected_max=1000)

    def test_pb_rules_value_range(self, config_data):
        """测试:PB规则数值范围合理性"""
        pb_rules = config_data["value_score_rules"]["pb"]
        self._validate_value_range(pb_rules, "PB", expected_min=0, expected_max=50)

    def test_ps_rules_value_range(self, config_data):
        """测试:PS规则数值范围合理性"""
        ps_rules = config_data["value_score_rules"]["ps"]
        self._validate_value_range(ps_rules, "PS", expected_min=0, expected_max=100)

    def test_dividend_yield_rules_value_range(self, config_data):
        """测试:股息率规则数值范围合理性"""
        dividend_rules = config_data["value_score_rules"]["dividend_yield"]
        self._validate_value_range(
            dividend_rules, "股息率", expected_min=-10, expected_max=50
        )

    def test_default_score_rules_structure(self, config_data):
        """测试:默认评分规则结构"""
        required_defaults = [
            "growth_score_rules",
            "profitability_score_rules",
            "financial_health_score_rules",
        ]

        for rule_name in required_defaults:
            assert rule_name in config_data, f"缺少{rule_name}"
            assert "default" in config_data[rule_name], f"{rule_name}缺少default字段"
            default_value = config_data[rule_name]["default"]
            assert isinstance(
                default_value, (int, float)
            ), f"{rule_name}.default必须是数字"
            assert 0 <= default_value <= 100, f"{rule_name}.default必须在0-100之间"

    def test_business_logic_consistency(self, config_data):
        """测试:业务逻辑一致性"""
        # 测试PE规则:低PE应该得高分
        pe_rules = config_data["value_score_rules"]["pe"]
        low_pe_score = self._get_score_for_value(pe_rules, 5.0)  # 低PE
        high_pe_score = self._get_score_for_value(pe_rules, 50.0)  # 高PE
        assert low_pe_score > high_pe_score, "低PE应该得高分"

        # 测试股息率规则:高股息率应该得高分
        dividend_rules = config_data["value_score_rules"]["dividend_yield"]
        high_dividend_score = self._get_score_for_value(dividend_rules, 6.0)  # 高股息率
        low_dividend_score = self._get_score_for_value(dividend_rules, 0.5)  # 低股息率
        assert high_dividend_score > low_dividend_score, "高股息率应该得高分"

    def _validate_rules_continuity(self, rules, rule_name):
        """验证规则连续性"""
        if not rules:
            pytest.fail(f"{rule_name}规则不能为空")

        # 按最小值排序
        sorted_rules = sorted(rules, key=lambda x: x[0])

        # 检查是否有重叠
        for i in range(len(sorted_rules) - 1):
            current_max = sorted_rules[i][1]
            next_min = sorted_rules[i + 1][0]
            if current_max > next_min:
                pytest.fail(
                    f"{rule_name}规则存在重叠: [{sorted_rules[i][0]}, {current_max}) 与 [{next_min}, {sorted_rules[i + 1][1]})"
                )

        # 检查是否有间隙(警告,但不失败)
        for i in range(len(sorted_rules) - 1):
            current_max = sorted_rules[i][1]
            next_min = sorted_rules[i + 1][0]
            if current_max < next_min:
                print(f"警告: {rule_name}规则存在间隙: [{current_max}, {next_min})")

    def _validate_score_range(self, rules, rule_name):
        """验证得分范围"""
        for i, rule in enumerate(rules):
            if len(rule) != 3:
                pytest.fail(f"{rule_name}规则{i}格式错误,应为[min, max, score]")

            _min_val, _max_val, score = rule
            assert isinstance(score, (int, float)), f"{rule_name}规则{i}得分必须是数字"
            assert 0 <= score <= 100, f"{rule_name}规则{i}得分必须在0-100之间"

    def _validate_value_range(self, rules, rule_name, expected_min, expected_max):
        """验证数值范围合理性"""
        for i, rule in enumerate(rules):
            min_val, max_val, _score = rule
            assert isinstance(
                min_val, (int, float)
            ), f"{rule_name}规则{i}最小值必须是数字"
            assert isinstance(
                max_val, (int, float)
            ), f"{rule_name}规则{i}最大值必须是数字"
            assert min_val < max_val, f"{rule_name}规则{i}最小值必须小于最大值"

            # 检查范围是否合理
            if min_val < expected_min or max_val > expected_max:
                print(
                    f"警告: {rule_name}规则{i}范围[{min_val}, {max_val})可能超出合理范围[{expected_min}, {expected_max})"
                )

    def _get_score_for_value(self, rules, value):
        """获取指定值的得分"""
        for rule in rules:
            min_val, max_val, score = rule
            if min_val <= value < max_val:
                return score
        return rules[-1][2] if rules else 0.0
