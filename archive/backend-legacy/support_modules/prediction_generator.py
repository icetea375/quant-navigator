#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
预测生成器 - 多场景概率性预测生成
v10.1 仲裁界面升级版

作者: AI Assistant
创建时间: 2025-01-17
版本: v10.1
"""

import json
import logging
from datetime import datetime
from typing import List, Dict, Any
from pathlib import Path

from .llm_service import LLMService


class PredictionGenerator:
    """
    预测生成器 - 使用商业LLM API生成多场景概率性预测

    核心功能：
    1. 整合量化分析师和情报分析师的观点
    2. 生成多场景概率性预测
    3. 识别关键驱动因素
    4. 提供风险提示
    """

    def __init__(self, config: Dict[str, Any]):
        """
        初始化预测生成器

        Args:
            config: 配置字典，包含LLM服务配置
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.llm_service = LLMService(config.get("llm_service", {}))

        # 加载Prompt模板
        self.prompt_templates = self._load_prompt_templates()

    def _load_prompt_templates(self) -> Dict[str, Any]:
        """加载预测生成的Prompt模板"""
        try:
            template_path = Path(
                "config/prompt_templates/prediction_generation_prompts.json"
            )
            if template_path.exists():
                with open(template_path, "r", encoding="utf-8") as f:
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
            "generate_probabilistic_forecast": {
                "role": "你是一位经验丰富的A股首席投资官(CIO)，你深知市场充满不确定性，从不给出单一的确定性预测。你的决策建立在对多种可能性及其概率的审慎评估之上。",
                "instructions": [
                    "1. **任务**: 基于以下完整的【决策信息包】，对【{{stock_name}}】未来5个交易日的超额收益率，进行一次**多场景概率性预测**。",
                    "2. **决策流程**: ",
                    "   a. 首先，审视【量化分析师】和【情报分析师】的**矛盾与共识**。",
                    "   b. 其次，阅读【关键原始证据】，判断其对未来的**影响力**和**不确定性**。",
                    "   c. 最后，结合【管理层可信度】和【因果关系矩阵】，形成你的最终判断。",
                    "3. **【关键约束】**: **你的三个场景的概率之和必须严格等于1.0。** 你的`reasoning`必须简洁地解释**为什么会产生这几种不同的可能性**。",
                    "4. **输出格式**: 严格按照指定的JSON格式输出，不要有任何偏差。",
                ],
                "input_template": "\n\n# 决策信息包\n\n- **分析目标**: {{stock_name}} ({{stock_code}})\n- **交易日期**: {{trade_date}}\n\n### 分析师报告 ###\n\n1.  **量化分析师 (LightGBM)报告:**\n    - 核心预测: {{p1_tabular_prediction}}%\n    - 关键信号: {{quant_signals}}\n\n2.  **情报分析师 (Qwen3-4B)报告:**\n    - 情感得分: {{p2_sentiment_score}}\n    - 关键事件: {{p2_event_tags}}\n\n### 核心背景信息 ###\n\n- **管理层可信度评分:** {{mda_credibility_score}}\n- **核心因果链路 (来自DynCGN):**\n{{causal_matrix_json}}\n- **关键原始证据 (Top 3):**\n{{key_evidences_text}}",
                "output_format_definition": {
                    "scenario_optimistic": {
                        "return": "<float>",
                        "reasoning": "<string>",
                    },
                    "scenario_neutral": {"return": "<float>", "reasoning": "<string>"},
                    "scenario_pessimistic": {
                        "return": "<float>",
                        "reasoning": "<string>",
                    },
                    "probabilities": {
                        "optimistic": "<float>",
                        "neutral": "<float>",
                        "pessimistic": "<float>",
                    },
                    "key_drivers": {"positive": ["<string>"], "negative": ["<string>"]},
                },
            },
        }

    def predict(
        self,
        stock_code: str,
        trade_date: str,
        event_chain: List[Dict[str, Any]],
        mda_scores: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        生成多场景概率性预测

        Args:
            stock_code: 股票代码
            trade_date: 交易日期
            event_chain: 事件链数据
            mda_scores: MD&A验证评分

        Returns:
            预测结果
        """
        try:
            self.logger.info(f"开始生成预测: {stock_code} @ {trade_date}")

            # 1. 准备决策信息包
            decision_package = self._prepare_decision_package(
                stock_code, trade_date, event_chain, mda_scores
            )

            # 2. 生成预测
            prediction = self._generate_prediction(decision_package)

            # 3. 验证预测格式
            validated_prediction = self._validate_prediction(prediction)

            # 4. 计算综合评分
            overall_score = self._calculate_overall_score(validated_prediction)

            result = {
                "stock_code": stock_code,
                "trade_date": trade_date,
                "prediction": validated_prediction,
                "overall_score": overall_score,
                "decision_package": decision_package,
                "created_at": datetime.now().isoformat(),
            }

            self.logger.info(f"预测生成完成: {stock_code}")
            return result

        except Exception as e:
            self.logger.error(f"生成预测失败: {e}", exc_info=True)
            return self._create_empty_prediction(stock_code, trade_date)

    def _prepare_decision_package(
        self,
        stock_code: str,
        trade_date: str,
        event_chain: List[Dict[str, Any]],
        mda_scores: Dict[str, Any],
    ) -> Dict[str, Any]:
        """准备决策信息包"""
        # 获取量化信号
        quant_signals = self._get_quant_signals(stock_code, trade_date)

        # 获取情报分析
        sentiment_analysis = self._get_sentiment_analysis(stock_code, trade_date)

        # 获取关键证据
        key_evidences = self._get_key_evidences(stock_code, trade_date)

        # 构建因果矩阵
        causal_matrix = self._build_causal_matrix(event_chain)

        return {
            "stock_name": stock_code,
            "stock_code": stock_code,
            "trade_date": trade_date,
            "p1_tabular_prediction": quant_signals.get("prediction", 0),
            "quant_signals": quant_signals,
            "p2_sentiment_score": sentiment_analysis.get("sentiment_score", 0),
            "p2_event_tags": sentiment_analysis.get("event_tags", []),
            "mda_credibility_score": mda_scores.get("credibility_score", 0),
            "causal_matrix_json": json.dumps(causal_matrix, ensure_ascii=False),
            "key_evidences_text": key_evidences,
        }

    def _get_quant_signals(self, stock_code: str, trade_date: str) -> Dict[str, Any]:
        """获取量化信号"""
        # 这里应该从数据库查询量化信号
        # 暂时返回模拟数据
        return {
            "prediction": 5.2,
            "return_z_score": 2.1,
            "volume_z_score": 1.8,
            "momentum_z_score": 1.5,
            "volatility_z_score": 0.9,
            "macro_risk_z_score": -0.5,
            "market_style_z_score": 1.2,
            "overall_signal_strength": 0.75,
            "signal_confidence": 0.82,
        }

    def _get_sentiment_analysis(
        self, stock_code: str, trade_date: str
    ) -> Dict[str, Any]:
        """获取情感分析"""
        # 这里应该从数据库查询情感分析结果
        # 暂时返回模拟数据
        return {
            "sentiment_score": 0.68,
            "event_tags": ["财报利好", "合作签约", "技术突破"],
            "news_sentiment": 0.75,
            "social_sentiment": 0.60,
            "analyst_sentiment": 0.70,
        }

    def _get_key_evidences(self, stock_code: str, trade_date: str) -> str:
        """获取关键证据"""
        # 这里应该从数据库查询关键证据
        # 暂时返回模拟数据
        return """
1. 公司发布2024Q3财报，营收同比增长15.2%，净利润增长22.1%
2. 公司与特斯拉签署长期合作协议，将供应新能源电池组件
3. 公司研发投入同比增长30%，获得3项核心技术专利
        """.strip()

    def _build_causal_matrix(self, event_chain: List[Dict[str, Any]]) -> Dict[str, Any]:
        """构建因果矩阵"""
        if not event_chain:
            return {"causal_links": [], "strength": 0}

        causal_links = []
        for i, event in enumerate(event_chain):
            if i > 0:
                prev_event = event_chain[i - 1]
                causal_links.append(
                    {
                        "from": prev_event.get("event_description", ""),
                        "to": event.get("event_description", ""),
                        "strength": 0.7,
                        "type": "temporal",
                    }
                )

        return {
            "causal_links": causal_links,
            "strength": len(causal_links) / max(len(event_chain), 1),
            "total_events": len(event_chain),
        }

    def _generate_prediction(self, decision_package: Dict[str, Any]) -> Dict[str, Any]:
        """使用LLM生成预测"""
        try:
            # 获取Prompt模板
            template = self.prompt_templates["generate_probabilistic_forecast"]

            # 构建完整的Prompt
            prompt = self._build_prompt(template, decision_package)

            # 调用LLM服务
            response = self.llm_service.call_llm(prompt, model="kimi")

            # 解析响应
            prediction = self._parse_llm_response(response)

            return prediction

        except Exception as e:
            self.logger.error(f"LLM生成预测失败: {e}")
            return self._get_default_prediction()

    def _build_prompt(self, template: Dict[str, Any], variables: Dict[str, Any]) -> str:
        """构建完整的Prompt"""
        role = template["role"]
        instructions = "\n".join(template["instructions"])
        input_template = template["input_template"]

        # 替换变量
        for key, value in variables.items():
            input_template = input_template.replace(f"{{{{{key}}}}}", str(value))

        prompt = f"""# 角色定义
{role}

# 任务指令
{instructions}

{input_template}

# 输出格式定义
{json.dumps(template["output_format_definition"], ensure_ascii=False, indent=2)}

# 输出要求
请严格按照上述JSON格式输出，不要包含任何其他内容。"""

        return prompt

    def _parse_llm_response(self, response: str) -> Dict[str, Any]:
        """解析LLM响应"""
        try:
            # 尝试直接解析JSON
            if response.strip().startswith("{"):
                return json.loads(response)

            # 尝试从响应中提取JSON
            import re

            json_match = re.search(r"\{.*\}", response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())

            # 如果都失败，返回默认预测
            self.logger.warning("无法解析LLM响应为JSON格式")
            return self._get_default_prediction()

        except json.JSONDecodeError as e:
            self.logger.error(f"JSON解析失败: {e}")
            return self._get_default_prediction()

    def _get_default_prediction(self) -> Dict[str, Any]:
        """获取默认预测"""
        return {
            "scenario_optimistic": {
                "return": 8.5,
                "reasoning": "基于技术面突破和基本面改善，股价有望继续上涨",
            },
            "scenario_neutral": {
                "return": 2.0,
                "reasoning": "市场情绪平稳，股价维持震荡整理",
            },
            "scenario_pessimistic": {
                "return": -3.5,
                "reasoning": "面临政策风险和行业竞争加剧，股价可能回调",
            },
            "probabilities": {"optimistic": 0.4, "neutral": 0.4, "pessimistic": 0.2},
            "key_drivers": {
                "positive": ["技术面突破", "基本面改善", "政策支持"],
                "negative": ["政策风险", "行业竞争", "市场情绪"],
            },
        }

    def _validate_prediction(self, prediction: Dict[str, Any]) -> Dict[str, Any]:
        """验证预测格式"""
        try:
            # 验证概率和
            probabilities = prediction.get("probabilities", {})
            prob_sum = sum(probabilities.values())
            if abs(prob_sum - 1.0) > 0.01:
                self.logger.warning(f"概率和不为1.0: {prob_sum}")
                # 归一化概率
                for key in probabilities:
                    probabilities[key] = probabilities[key] / prob_sum

            # 验证必要字段
            required_fields = [
                "scenario_optimistic",
                "scenario_neutral",
                "scenario_pessimistic",
                "probabilities",
            ]
            for field in required_fields:
                if field not in prediction:
                    self.logger.warning(f"缺少必要字段: {field}")
                    prediction[field] = self._get_default_prediction()[field]

            return prediction

        except Exception as e:
            self.logger.error(f"验证预测格式失败: {e}")
            return self._get_default_prediction()

    def _calculate_overall_score(self, prediction: Dict[str, Any]) -> float:
        """计算综合评分"""
        try:
            # 基础评分
            base_score = 0.5

            # 概率分布合理性评分
            probabilities = prediction.get("probabilities", {})
            prob_entropy = -sum(
                p * (p if p > 0 else 0.001) for p in probabilities.values()
            )
            entropy_score = min(entropy_score / 1.1, 1.0) * 0.2  # 最大熵约为1.1

            # 场景多样性评分
            scenarios = [
                prediction.get("scenario_optimistic", {}),
                prediction.get("scenario_neutral", {}),
                prediction.get("scenario_pessimistic", {}),
            ]
            return_range = max(s.get("return", 0) for s in scenarios) - min(
                s.get("return", 0) for s in scenarios
            )
            diversity_score = min(return_range / 20, 1.0) * 0.2  # 20%的收益率差异为满分

            # 驱动因素完整性评分
            key_drivers = prediction.get("key_drivers", {})
            driver_count = len(key_drivers.get("positive", [])) + len(
                key_drivers.get("negative", [])
            )
            driver_score = min(driver_count / 6, 1.0) * 0.1  # 6个驱动因素为满分

            total_score = base_score + entropy_score + diversity_score + driver_score
            return min(total_score, 1.0)

        except Exception as e:
            self.logger.error(f"计算综合评分失败: {e}")
            return 0.5

    def _create_empty_prediction(
        self, stock_code: str, trade_date: str
    ) -> Dict[str, Any]:
        """创建空预测"""
        return {
            "stock_code": stock_code,
            "trade_date": trade_date,
            "prediction": self._get_default_prediction(),
            "overall_score": 0.0,
            "decision_package": {},
            "created_at": datetime.now().isoformat(),
            "error": "Prediction generation failed",
        }

    def get_prediction_summary(self, prediction: Dict[str, Any]) -> Dict[str, Any]:
        """获取预测摘要"""
        try:
            scenarios = prediction.get("prediction", {})
            probabilities = scenarios.get("probabilities", {})

            # 计算期望收益率
            expected_return = (
                scenarios.get("scenario_optimistic", {}).get("return", 0)
                * probabilities.get("optimistic", 0)
                + scenarios.get("scenario_neutral", {}).get("return", 0)
                * probabilities.get("neutral", 0)
                + scenarios.get("scenario_pessimistic", {}).get("return", 0)
                * probabilities.get("pessimistic", 0)
            )

            # 计算风险指标
            returns = [
                scenarios.get("scenario_optimistic", {}).get("return", 0),
                scenarios.get("scenario_neutral", {}).get("return", 0),
                scenarios.get("scenario_pessimistic", {}).get("return", 0),
            ]
            variance = sum(
                p * (r - expected_return) ** 2
                for r, p in zip(returns, probabilities.values())
            )
            volatility = variance**0.5

            return {
                "expected_return": expected_return,
                "volatility": volatility,
                "max_return": max(returns),
                "min_return": min(returns),
                "return_range": max(returns) - min(returns),
                "optimistic_prob": probabilities.get("optimistic", 0),
                "neutral_prob": probabilities.get("neutral", 0),
                "pessimistic_prob": probabilities.get("pessimistic", 0),
            }

        except Exception as e:
            self.logger.error(f"计算预测摘要失败: {e}")
            return {"error": "Failed to calculate summary"}
