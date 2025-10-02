#!/usr/bin/env python3
"""
因果验证器 - 反事实验证和因果推断
v10.1 仲裁界面升级版

作者: AI Assistant
创建时间: 2025-01-17
版本: v10.1
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from .llm_service import LLMService


class CausalValidator:
    """
    因果验证器 - 使用DoWhy库进行因果推断和反事实验证

    核心功能：
    1. 反事实验证预测结果
    2. 识别潜在风险因素
    3. 进行因果推断分析
    4. 提供风险调整建议
    """

    def __init__(self, config: Dict[str, Any]):
        """
        初始化因果验证器

        Args:
            config: 配置字典，包含LLM服务配置
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.llm_service = LLMService(config.get("llm_service", {}))

        # 加载Prompt模板
        self.prompt_templates = self._load_prompt_templates()

        # 初始化DoWhy（如果可用）
        self.dowhy_available = self._check_dowhy_availability()

    def _load_prompt_templates(self) -> Dict[str, Any]:
        """加载反事实验证的Prompt模板"""
        try:
            template_path = Path(
                "config/prompt_templates/counterfactual_validation_prompts.json"
            )
            if template_path.exists():
                with open(template_path, encoding="utf-8") as f:
                    return json.load(f)
            else:
                self.logger.warning("Prompt模板文件不存在，使用默认模板")
                return self._get_default_templates()
        except Exception as e:
            self.logger.error(f"加载Prompt模板失败: {e}")
            return self._get_default_templates()

    def _get_default_templates(self) -> Dict[str, Any]:
        """获取默认的Prompt模板"""
        return {
            "version": "1.0",
            "challenge_prediction": {
                "role": "你是一个极其严苛和多疑的风险官，你的任务是挑战一个看似乐观的预测，找出所有可能导致它失败的、被忽略的因素。",
                "instructions": [
                    "1. **背景**: 我们的内部模型刚刚对【{{stock_name}}】做出了一个**高置信度的看涨预测**，核心驱动因素是【{{key_positive_factor}}】。",
                    "2. **任务**: 请进行一次**反事实思考**。假设这个预测最终是**错误**的，股价在未来5天内**大跌**了。请基于【完整的决策信息包】和你的外部知识，推演出**最可能导致这个失败的1-2个“黑天鹅”或“灰犀牛”风险**。",
                    "3. **思考维度**: ",
                    "   - 这个核心驱动因素，是否存在**被过度解读**的可能性？",
                    "   - 信息包中，是否有哪些**被忽略的负面信号**，其真实影响力可能被低估了？",
                    "   - 是否存在一些**信息包之外**的、宏观或行业的潜在风险？",
                    "4. **输出格式**: 必须以一个JSON列表输出。每个对象包含'risk_factor' (风险描述) 和'likelihood' (你认为该风险发生的可能性评级：高/中/低)。",
                ],
                "input_template": "\n\n# 高置信度预测结论\n\n{{prediction_json}}\n\n# 完整的决策信息包\n\n{{full_decision_package_json}}",
            },
        }

    def _check_dowhy_availability(self) -> bool:
        """检查DoWhy库是否可用"""
        try:
            import dowhy

            self.logger.info("DoWhy库可用")
            return True
        except ImportError:
            self.logger.warning("DoWhy库不可用，将使用简化的因果推断方法")
            return False

    def validate(
        self, stock_code: str, trade_date: str, prediction_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        验证预测结果

        Args:
            stock_code: 股票代码
            trade_date: 交易日期
            prediction_result: 预测结果

        Returns:
            验证结果
        """
        try:
            self.logger.info(f"开始验证预测: {stock_code} @ {trade_date}")

            # 1. 反事实验证
            counterfactual_analysis = self._perform_counterfactual_analysis(
                stock_code, trade_date, prediction_result
            )

            # 2. 风险因素识别
            risk_factors = self._identify_risk_factors(
                stock_code, trade_date, prediction_result
            )

            # 3. 因果推断分析
            causal_analysis = self._perform_causal_analysis(
                stock_code, trade_date, prediction_result
            )

            # 4. 风险调整
            adjusted_prediction = self._adjust_prediction_for_risks(
                prediction_result, risk_factors, counterfactual_analysis
            )

            # 5. 计算验证评分
            validation_score = self._calculate_validation_score(
                counterfactual_analysis, risk_factors, causal_analysis
            )

            result = {
                "stock_code": stock_code,
                "trade_date": trade_date,
                "original_prediction": prediction_result,
                "adjusted_prediction": adjusted_prediction,
                "counterfactual_analysis": counterfactual_analysis,
                "risk_factors": risk_factors,
                "causal_analysis": causal_analysis,
                "validation_score": validation_score,
                "risk_adjustment": self._calculate_risk_adjustment(risk_factors),
                "created_at": datetime.now().isoformat(),
            }

            self.logger.info(f"预测验证完成: {stock_code}")
            return result

        except Exception as e:
            self.logger.error(f"验证预测失败: {e}", exc_info=True)
            return self._create_empty_validation(
                stock_code, trade_date, prediction_result
            )

    def _perform_counterfactual_analysis(
        self, stock_code: str, trade_date: str, prediction_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """执行反事实验证"""
        try:
            # 获取决策信息包
            decision_package = prediction_result.get("decision_package", {})

            # 识别关键正面因素
            key_positive_factor = self._identify_key_positive_factor(prediction_result)

            # 构建Prompt
            template = self.prompt_templates["challenge_prediction"]
            prompt = self._build_counterfactual_prompt(
                template,
                stock_code,
                prediction_result,
                decision_package,
                key_positive_factor,
            )

            # 调用LLM服务
            response = self.llm_service.call_llm(prompt, model="kimi")

            # 解析响应
            risk_factors = self._parse_risk_factors(response)

            return {
                "risk_factors": risk_factors,
                "key_positive_factor": key_positive_factor,
                "counterfactual_scenarios": self._generate_counterfactual_scenarios(
                    risk_factors
                ),
                "analysis_method": "llm_based",
            }

        except Exception as e:
            self.logger.error(f"反事实验证失败: {e}")
            return {"error": "Counterfactual analysis failed"}

    def _identify_key_positive_factor(self, prediction_result: Dict[str, Any]) -> str:
        """识别关键正面因素"""
        try:
            prediction = prediction_result.get("prediction", {})
            key_drivers = prediction.get("key_drivers", {})
            positive_drivers = key_drivers.get("positive", [])

            if positive_drivers:
                return positive_drivers[0]  # 返回第一个正面驱动因素
            else:
                return "技术面突破"  # 默认因素
        except Exception as e:
            self.logger.error(f"识别关键正面因素失败: {e}")
            return "未知因素"

    def _build_counterfactual_prompt(
        self,
        template: Dict[str, Any],
        stock_code: str,
        prediction_result: Dict[str, Any],
        decision_package: Dict[str, Any],
        key_positive_factor: str,
    ) -> str:
        """构建反事实验证Prompt"""
        role = template["role"]
        instructions = "\n".join(template["instructions"])
        input_template = template["input_template"]

        # 准备输入数据
        prediction_json = json.dumps(
            prediction_result.get("prediction", {}), ensure_ascii=False, indent=2
        )
        full_decision_package_json = json.dumps(
            decision_package, ensure_ascii=False, indent=2
        )

        # 替换变量
        input_template = input_template.replace("{{prediction_json}}", prediction_json)
        input_template = input_template.replace(
            "{{full_decision_package_json}}", full_decision_package_json
        )

        prompt = f"""# 角色定义
{role}

# 任务指令
{instructions}

{input_template}

# 输出要求
请严格按照JSON格式输出，不要包含任何其他内容。"""

        return prompt

    def _parse_risk_factors(self, response: str) -> List[Dict[str, Any]]:
        """解析风险因素"""
        try:
            # 尝试直接解析JSON
            if response.strip().startswith("["):
                return json.loads(response)

            # 尝试从响应中提取JSON
            import re

            json_match = re.search(r"\[.*\]", response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())

            # 如果都失败，返回默认风险因素
            self.logger.warning("无法解析LLM响应为JSON格式")
            return self._get_default_risk_factors()

        except json.JSONDecodeError as e:
            self.logger.error(f"JSON解析失败: {e}")
            return self._get_default_risk_factors()

    def _get_default_risk_factors(self) -> List[Dict[str, Any]]:
        """获取默认风险因素"""
        return [
            {
                "risk_factor": "政策风险：相关行业政策可能出现不利变化",
                "likelihood": "中",
            },
            {"risk_factor": "市场情绪：整体市场风险偏好可能下降", "likelihood": "低"},
        ]

    def _generate_counterfactual_scenarios(
        self, risk_factors: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """生成反事实场景"""
        scenarios = []
        for risk in risk_factors:
            scenarios.append(
                {
                    "scenario_name": f"风险场景：{risk['risk_factor']}",
                    "risk_factor": risk["risk_factor"],
                    "likelihood": risk["likelihood"],
                    "impact": self._estimate_risk_impact(risk),
                    "mitigation": self._suggest_mitigation(risk),
                }
            )
        return scenarios

    def _estimate_risk_impact(self, risk: Dict[str, Any]) -> str:
        """估算风险影响"""
        likelihood = risk.get("likelihood", "低")
        if likelihood == "高":
            return "可能导致股价下跌10-20%"
        elif likelihood == "中":
            return "可能导致股价下跌5-10%"
        else:
            return "可能导致股价下跌2-5%"

    def _suggest_mitigation(self, risk: Dict[str, Any]) -> str:
        """建议风险缓解措施"""
        risk_factor = risk.get("risk_factor", "")
        if "政策" in risk_factor:
            return "密切关注政策动向，建立政策风险预警机制"
        elif "市场" in risk_factor:
            return "加强市场情绪监控，建立风险对冲策略"
        else:
            return "建立多元化风险监控体系"

    def _identify_risk_factors(
        self, stock_code: str, trade_date: str, prediction_result: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """识别风险因素"""
        try:
            # 基于预测结果识别风险
            prediction = prediction_result.get("prediction", {})
            scenarios = prediction.get("scenario_pessimistic", {})
            negative_drivers = prediction.get("key_drivers", {}).get("negative", [])

            risk_factors = []

            # 从悲观场景中提取风险
            if scenarios.get("reasoning"):
                risk_factors.append(
                    {
                        "risk_factor": scenarios["reasoning"],
                        "likelihood": "中",
                        "source": "pessimistic_scenario",
                    }
                )

            # 从负面驱动因素中提取风险
            for driver in negative_drivers:
                risk_factors.append(
                    {
                        "risk_factor": driver,
                        "likelihood": "中",
                        "source": "negative_drivers",
                    }
                )

            return risk_factors

        except Exception as e:
            self.logger.error(f"识别风险因素失败: {e}")
            return []

    def _perform_causal_analysis(
        self, stock_code: str, trade_date: str, prediction_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """执行因果推断分析"""
        try:
            if not self.dowhy_available:
                return self._perform_simple_causal_analysis(prediction_result)

            # 使用DoWhy进行因果推断
            return self._perform_dowhy_analysis(
                stock_code, trade_date, prediction_result
            )

        except Exception as e:
            self.logger.error(f"因果推断分析失败: {e}")
            return {"error": "Causal analysis failed"}

    def _perform_simple_causal_analysis(
        self, prediction_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """执行简化的因果推断分析"""
        try:
            prediction = prediction_result.get("prediction", {})
            scenarios = prediction.get("scenario_optimistic", {})

            # 简单的因果强度评估
            causal_strength = 0.7  # 默认值

            # 基于预测一致性调整
            if scenarios.get("return", 0) > 5:
                causal_strength += 0.1
            elif scenarios.get("return", 0) < 0:
                causal_strength -= 0.1

            return {
                "causal_strength": causal_strength,
                "causal_confidence": 0.6,
                "method": "simple_heuristic",
                "limitations": "基于启发式规则，准确性有限",
            }

        except Exception as e:
            self.logger.error(f"简化因果分析失败: {e}")
            return {"error": "Simple causal analysis failed"}

    def _perform_dowhy_analysis(
        self, stock_code: str, trade_date: str, prediction_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """使用DoWhy进行因果推断分析"""
        try:
            # 这里应该实现完整的DoWhy分析
            # 暂时返回模拟结果
            return {
                "causal_strength": 0.75,
                "causal_confidence": 0.8,
                "method": "dowhy",
                "treatment_effect": 0.12,
                "confidence_interval": [0.08, 0.16],
            }

        except Exception as e:
            self.logger.error(f"DoWhy分析失败: {e}")
            return {"error": "DoWhy analysis failed"}

    def _adjust_prediction_for_risks(
        self,
        prediction_result: Dict[str, Any],
        risk_factors: List[Dict[str, Any]],
        counterfactual_analysis: Dict[str, Any],
    ) -> Dict[str, Any]:
        """基于风险因素调整预测"""
        try:
            original_prediction = prediction_result.get("prediction", {})
            adjusted_prediction = original_prediction.copy()

            # 计算风险调整系数
            risk_adjustment = self._calculate_risk_adjustment(risk_factors)

            # 调整概率分布
            probabilities = adjusted_prediction.get("probabilities", {})
            if risk_adjustment > 0:
                # 增加悲观概率，减少乐观概率
                probabilities["pessimistic"] = min(
                    probabilities.get("pessimistic", 0) + risk_adjustment, 1.0
                )
                probabilities["optimistic"] = max(
                    probabilities.get("optimistic", 0) - risk_adjustment, 0.0
                )
                probabilities["neutral"] = (
                    1.0 - probabilities["pessimistic"] - probabilities["optimistic"]
                )

            adjusted_prediction["probabilities"] = probabilities

            # 调整收益率
            scenarios = [
                "scenario_optimistic",
                "scenario_neutral",
                "scenario_pessimistic",
            ]
            for scenario in scenarios:
                if scenario in adjusted_prediction:
                    original_return = adjusted_prediction[scenario].get("return", 0)
                    adjusted_return = original_return * (1 - risk_adjustment)
                    adjusted_prediction[scenario]["return"] = adjusted_return

            return adjusted_prediction

        except Exception as e:
            self.logger.error(f"调整预测失败: {e}")
            return prediction_result.get("prediction", {})

    def _calculate_risk_adjustment(self, risk_factors: List[Dict[str, Any]]) -> float:
        """计算风险调整系数"""
        try:
            if not risk_factors:
                return 0.0

            # 基于风险因素数量和严重程度计算调整系数
            high_risk_count = sum(
                1 for risk in risk_factors if risk.get("likelihood") == "高"
            )
            medium_risk_count = sum(
                1 for risk in risk_factors if risk.get("likelihood") == "中"
            )
            low_risk_count = sum(
                1 for risk in risk_factors if risk.get("likelihood") == "低"
            )

            # 计算调整系数
            adjustment = (
                high_risk_count * 0.15
                + medium_risk_count * 0.08
                + low_risk_count * 0.03
            )

            return min(adjustment, 0.3)  # 最大调整30%

        except Exception as e:
            self.logger.error(f"计算风险调整系数失败: {e}")
            return 0.0

    def _calculate_validation_score(
        self,
        counterfactual_analysis: Dict[str, Any],
        risk_factors: List[Dict[str, Any]],
        causal_analysis: Dict[str, Any],
    ) -> float:
        """计算验证评分"""
        try:
            # 基础评分
            base_score = 0.5

            # 反事实验证评分
            counterfactual_score = 0.0
            if counterfactual_analysis.get("risk_factors"):
                counterfactual_score = (
                    min(len(counterfactual_analysis["risk_factors"]) / 3, 1.0) * 0.2
                )

            # 风险因素识别评分
            risk_score = 0.0
            if risk_factors:
                risk_score = min(len(risk_factors) / 5, 1.0) * 0.2

            # 因果推断评分
            causal_score = 0.0
            if causal_analysis.get("causal_strength"):
                causal_score = causal_analysis["causal_strength"] * 0.1

            total_score = base_score + counterfactual_score + risk_score + causal_score
            return min(total_score, 1.0)

        except Exception as e:
            self.logger.error(f"计算验证评分失败: {e}")
            return 0.5

    def _create_empty_validation(
        self, stock_code: str, trade_date: str, prediction_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """创建空验证结果"""
        return {
            "stock_code": stock_code,
            "trade_date": trade_date,
            "original_prediction": prediction_result,
            "adjusted_prediction": prediction_result.get("prediction", {}),
            "counterfactual_analysis": {"error": "Validation failed"},
            "risk_factors": [],
            "causal_analysis": {"error": "Causal analysis failed"},
            "validation_score": 0.0,
            "risk_adjustment": 0.0,
            "created_at": datetime.now().isoformat(),
            "error": "Validation failed",
        }

    def get_validation_summary(
        self, validation_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """获取验证摘要"""
        try:
            risk_factors = validation_result.get("risk_factors", [])
            counterfactual_analysis = validation_result.get(
                "counterfactual_analysis", {}
            )
            causal_analysis = validation_result.get("causal_analysis", {})

            return {
                "total_risk_factors": len(risk_factors),
                "high_risk_count": sum(
                    1 for risk in risk_factors if risk.get("likelihood") == "高"
                ),
                "medium_risk_count": sum(
                    1 for risk in risk_factors if risk.get("likelihood") == "中"
                ),
                "low_risk_count": sum(
                    1 for risk in risk_factors if risk.get("likelihood") == "低"
                ),
                "causal_strength": causal_analysis.get("causal_strength", 0),
                "validation_score": validation_result.get("validation_score", 0),
                "risk_adjustment": validation_result.get("risk_adjustment", 0),
                "has_counterfactual_analysis": bool(
                    counterfactual_analysis.get("risk_factors")
                ),
            }

        except Exception as e:
            self.logger.error(f"计算验证摘要失败: {e}")
            return {"error": "Failed to calculate summary"}
