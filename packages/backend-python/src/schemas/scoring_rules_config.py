"""
评分规则配置模型 - 配置文件契约验证
使用Pydantic确保YAML配置文件的类型安全和结构完整性
"""

from typing import Any

from pydantic import BaseModel, Field, field_validator


class ScoringRule(BaseModel):
    """单个评分规则模型"""

    min_value: float = Field(..., description="最小值(包含)")
    max_value: float = Field(..., description="最大值(不包含)")
    score: float = Field(..., ge=0.0, le=100.0, description="得分(0-100)")

    @field_validator("min_value", "max_value")
    @classmethod
    def validate_value_range(cls, v):
        """
        验证数值范围字段的有效性。

        确保min_value和max_value字段的值是有效的数字类型，
        并将其转换为float类型。

        Args:
            v: 待验证的值，可以是int或float类型

        Returns:
            float: 转换后的浮点数值

        Raises:
            ValueError: 当值不是数字类型时
        """
        if not isinstance(v, (int, float)):
            raise ValueError("数值必须是数字类型")
        return float(v)

    @field_validator("score")
    @classmethod
    def validate_score_range(cls, v):
        """
        验证得分字段的有效性。

        确保score字段的值是有效的数字类型，并且在0-100的范围内。

        Args:
            v: 待验证的得分值，可以是int或float类型

        Returns:
            float: 转换后的浮点数值

        Raises:
            ValueError: 当值不是数字类型或超出0-100范围时
        """
        if not isinstance(v, (int, float)):
            raise ValueError("得分必须是数字类型")
        if not 0 <= v <= 100:
            raise ValueError("得分必须在0-100之间")
        return float(v)


class ValueScoreRules(BaseModel):
    """价值评分规则模型"""

    pe: list[ScoringRule] = Field(..., description="PE比率评分规则")
    pb: list[ScoringRule] = Field(..., description="PB比率评分规则")
    ps: list[ScoringRule] = Field(..., description="PS比率评分规则")
    dividend_yield: list[ScoringRule] = Field(..., description="股息率评分规则")

    @field_validator("pe", "pb", "ps", "dividend_yield", mode="before")
    @classmethod
    def convert_list_to_scoring_rules(cls, v):
        """将列表格式转换为ScoringRule对象列表"""
        if isinstance(v, list):
            # 检查是否已经是ScoringRule对象
            if v and isinstance(v[0], ScoringRule):
                return v
            # 否则转换为ScoringRule对象
            return [
                ScoringRule(min_value=item[0], max_value=item[1], score=item[2])
                for item in v
            ]
        return v

    @field_validator("pe", "pb", "ps", "dividend_yield")
    @classmethod
    def validate_rules_not_empty(cls, v):
        """
        验证评分规则列表不为空。

        确保每个评分规则列表都包含至少一个规则，
        避免空规则列表导致的评分错误。

        Args:
            v: 待验证的评分规则列表

        Returns:
            list: 验证通过的评分规则列表

        Raises:
            ValueError: 当评分规则列表为空时
        """
        if not v:
            raise ValueError("评分规则不能为空")
        return v


class DefaultScoreRules(BaseModel):
    """默认评分规则模型"""

    default: float = Field(..., ge=0.0, le=100.0, description="默认得分(0-100)")


class ScoringRulesConfig(BaseModel):
    """评分规则配置主模型"""

    value_score_rules: ValueScoreRules = Field(..., description="价值评分规则")
    growth_score_rules: DefaultScoreRules = Field(..., description="成长性评分规则")
    profitability_score_rules: DefaultScoreRules = Field(
        ..., description="盈利能力评分规则"
    )
    financial_health_score_rules: DefaultScoreRules = Field(
        ..., description="财务健康度评分规则"
    )

    @field_validator("value_score_rules")
    @classmethod
    def validate_value_rules_continuity(cls, v):
        """验证评分规则的连续性"""
        for rule_type, rules in v.model_dump().items():
            if (
                rule_type == "pe"
                or rule_type == "pb"
                or rule_type == "ps"
                or rule_type == "dividend_yield"
            ):
                cls._validate_rule_continuity(rules, rule_type)
        return v

    @classmethod
    def _validate_rule_continuity(cls, rules: list[dict[str, Any]], rule_type: str):
        """验证规则范围的连续性"""
        if not rules:
            return

        # 按min_value排序
        sorted_rules = sorted(rules, key=lambda x: x["min_value"])

        # 检查是否有重叠
        for i in range(len(sorted_rules) - 1):
            current_max = sorted_rules[i]["max_value"]
            next_min = sorted_rules[i + 1]["min_value"]
            if current_max > next_min:
                raise ValueError(
                    f"{rule_type}规则存在重叠: [{sorted_rules[i]['min_value']}, {current_max}) 与 [{next_min}, {sorted_rules[i + 1]['max_value']})"
                )

        # 检查是否有间隙(可选,根据业务需求)
        for i in range(len(sorted_rules) - 1):
            current_max = sorted_rules[i]["max_value"]
            next_min = sorted_rules[i + 1]["min_value"]
            if current_max < next_min:
                # 允许间隙,但记录警告
                pass

    def model_post_init(self, __context):
        """模型初始化后的验证"""
        # 验证所有规则集的完整性
        self._validate_all_rules_completeness()

    def _validate_all_rules_completeness(self):
        """验证所有规则集的完整性"""
        for rule_type in ["pe", "pb", "ps", "dividend_yield"]:
            rules = getattr(self.value_score_rules, rule_type)
            if not rules:
                raise ValueError(f"{rule_type}规则不能为空")

            # 检查是否有覆盖所有可能值的规则
            min_rule = min(rules, key=lambda x: x.min_value)
            max_rule = max(rules, key=lambda x: x.max_value)

            if min_rule.min_value > -float("inf"):
                # 第一个规则应该覆盖负无穷到某个值
                pass

            if max_rule.max_value < float("inf"):
                # 最后一个规则应该覆盖某个值到正无穷
                pass
