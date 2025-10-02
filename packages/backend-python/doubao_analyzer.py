#!/usr/bin/env python3
"""
豆包舆情感知分析器 (v10.5 "双脑分治"架构)
专门负责基于外部实时网络信息的舆情感知分析

作者: AI Assistant
创建时间: 2025-01-17
版本: v10.5
"""

import json
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.append(str(project_root))

# 导入支持模块
from support_modules.database_utils import DatabaseManager
from support_modules.llm_service import LLMService
from support_modules.utils import setup_logging


class DoubaoSentimentAnalyzer:
    """
    豆包舆情感知分析器
    专门负责基于外部实时网络信息的舆情感知分析
    """

    def __init__(self, config: Dict[str, Any]):
        """
        初始化豆包舆情感知分析器

        Args:
            config: 配置字典
        """
        self.config = config
        self.logger = setup_logging("doubao_analyzer")

        # 初始化数据库管理器
        self.db_manager = DatabaseManager(config["database"])

        # 初始化LLM服务
        self.llm_service = LLMService(config["llm_service"])

        self.logger.info("豆包舆情感知分析器初始化完成")

    def analyze(self, stock_code: str, trade_date: str) -> Dict[str, Any]:
        """
        执行完整的舆情感知分析链

        Args:
            stock_code: 股票代码
            trade_date: 交易日期

        Returns:
            舆情感知分析报告
        """
        self.logger.info(f"开始豆包舆情感知分析: {stock_code} - {trade_date}")

        try:
            # 1. 准备红队挑战提示词
            prompt = self._build_red_team_prompt(stock_code, trade_date)

            # 2. 调用豆包进行舆情感知分析
            response = self._call_doubao_sentiment_analysis(
                prompt, stock_code, trade_date
            )

            # 3. 解析并结构化豆包的输出
            report = self._parse_doubao_response(response, stock_code, trade_date)

            self.logger.info(f"豆包舆情感知分析完成: {stock_code}")
            return report

        except Exception as e:
            self.logger.error(
                f"豆包舆情感知分析失败: {stock_code} - {e}", exc_info=True
            )
            raise

    def _build_red_team_prompt(self, stock_code: str, trade_date: str) -> str:
        """
        构建红队挑战提示词

        Args:
            stock_code: 股票代码
            trade_date: 交易日期

        Returns:
            红队挑战提示词
        """
        prompt = f"""
作为专业的投资红队分析师，请对以下股票进行全面的舆情感知和风险挑战分析：

股票代码: {stock_code}
分析日期: {trade_date}

请从以下角度进行深度分析：

1. **市场舆情监测**
   - 搜索并分析最新的市场讨论、新闻、社交媒体情绪
   - 识别可能影响股价的突发舆情事件
   - 评估市场情绪的变化趋势

2. **风险挑战视角**
   - 质疑当前市场共识，寻找被忽视的风险点
   - 分析可能的负面催化剂
   - 识别潜在的"黑天鹅"事件

3. **实时信息整合**
   - 整合最新的行业动态、政策变化、竞争态势
   - 分析外部环境对股票的影响
   - 评估市场预期与实际情况的差异

4. **情绪指标分析**
   - 恐惧贪婪指数
   - 市场恐慌程度
   - 投资者情绪极端化程度

5. **反向思考**
   - 如果市场观点完全错误会怎样？
   - 哪些信息被市场过度解读或忽视？
   - 是否存在认知偏差和群体思维？

请以JSON格式返回分析结果，包含：
- sentiment_score: 情绪评分(-100到100)
- risk_factors: 风险因素列表
- market_consensus: 市场共识分析
- contrarian_view: 反向观点
- real_time_events: 实时事件影响
- confidence_level: 置信度(0-1)

请确保分析具有挑战性和前瞻性，不要被表面信息所迷惑。
"""
        return prompt

    def _call_doubao_sentiment_analysis(
        self, prompt: str, stock_code: str, trade_date: str
    ) -> str:
        """
        调用豆包进行舆情感知分析

        Args:
            prompt: 分析提示词
            stock_code: 股票代码
            trade_date: 交易日期

        Returns:
            豆包分析响应
        """
        try:
            # 调用豆包进行舆情感知分析
            response = self.llm_service.call_llm(
                task_type="realtime_sentiment_analysis",
                prompt=prompt,
                provider_override="doubao-seed-1-6",  # 强制使用豆包
            )

            self.logger.info(f"豆包舆情感知分析调用完成: {stock_code}")
            return response

        except Exception as e:
            self.logger.error(
                f"豆包舆情感知分析调用失败: {stock_code} - {e}", exc_info=True
            )
            raise

    def _parse_doubao_response(
        self, response: str, stock_code: str, trade_date: str
    ) -> Dict[str, Any]:
        """
        解析豆包响应并生成结构化报告

        Args:
            response: 豆包响应
            stock_code: 股票代码
            trade_date: 交易日期

        Returns:
            结构化报告
        """
        try:
            # 尝试解析JSON响应
            if response.strip().startswith("{"):
                parsed_data = json.loads(response)
            else:
                # 如果不是JSON，创建默认结构
                parsed_data = self._create_default_sentiment_structure(response)

            # 构建最终报告
            report = {
                "id": str(uuid.uuid4()),
                "stock_code": stock_code,
                "trade_date": trade_date,
                "analyzer_type": "doubao_sentiment_based",
                "created_at": datetime.now().isoformat(),
                "sentiment_analysis": {
                    "sentiment_score": parsed_data.get("sentiment_score", 0),
                    "risk_factors": parsed_data.get("risk_factors", []),
                    "market_consensus": parsed_data.get("market_consensus", ""),
                    "contrarian_view": parsed_data.get("contrarian_view", ""),
                    "real_time_events": parsed_data.get("real_time_events", []),
                    "confidence_level": parsed_data.get("confidence_level", 0.5),
                },
                "red_team_analysis": {
                    "challenge_points": parsed_data.get("challenge_points", []),
                    "hidden_risks": parsed_data.get("hidden_risks", []),
                    "market_blind_spots": parsed_data.get("market_blind_spots", []),
                    "contrarian_insights": parsed_data.get("contrarian_insights", []),
                },
                "real_time_insights": {
                    "breaking_news_impact": parsed_data.get("breaking_news_impact", ""),
                    "social_sentiment": parsed_data.get("social_sentiment", ""),
                    "institutional_flow": parsed_data.get("institutional_flow", ""),
                    "retail_sentiment": parsed_data.get("retail_sentiment", ""),
                },
                "risk_assessment": {
                    "immediate_risks": parsed_data.get("immediate_risks", []),
                    "medium_term_risks": parsed_data.get("medium_term_risks", []),
                    "black_swan_probability": parsed_data.get(
                        "black_swan_probability", 0.1
                    ),
                    "volatility_forecast": parsed_data.get(
                        "volatility_forecast", "medium"
                    ),
                },
                "investment_implications": {
                    "position_recommendation": parsed_data.get(
                        "position_recommendation", "HOLD"
                    ),
                    "risk_adjustment": parsed_data.get("risk_adjustment", "neutral"),
                    "timing_considerations": parsed_data.get(
                        "timing_considerations", ""
                    ),
                    "hedge_strategies": parsed_data.get("hedge_strategies", []),
                },
                "raw_analysis": response,
            }

            self.logger.info(f"豆包响应解析完成: {stock_code}")
            return report

        except Exception as e:
            self.logger.error(f"豆包响应解析失败: {stock_code} - {e}", exc_info=True)
            # 返回默认报告结构
            return self._create_default_report(stock_code, trade_date, response)

    def _create_default_sentiment_structure(self, response: str) -> Dict[str, Any]:
        """
        创建默认的情绪分析结构
        """
        return {
            "sentiment_score": 0,
            "risk_factors": ["市场不确定性", "流动性风险"],
            "market_consensus": "市场观点相对中性",
            "contrarian_view": "需要更多信息进行判断",
            "real_time_events": [],
            "confidence_level": 0.5,
            "challenge_points": [],
            "hidden_risks": [],
            "market_blind_spots": [],
            "contrarian_insights": [],
            "breaking_news_impact": "暂无重大突发新闻",
            "social_sentiment": "中性",
            "institutional_flow": "平稳",
            "retail_sentiment": "观望",
            "immediate_risks": [],
            "medium_term_risks": [],
            "black_swan_probability": 0.1,
            "volatility_forecast": "medium",
            "position_recommendation": "HOLD",
            "risk_adjustment": "neutral",
            "timing_considerations": "建议持续观察",
            "hedge_strategies": [],
        }

    def _create_default_report(
        self, stock_code: str, trade_date: str, response: str
    ) -> Dict[str, Any]:
        """
        创建默认报告结构
        """
        return {
            "id": str(uuid.uuid4()),
            "stock_code": stock_code,
            "trade_date": trade_date,
            "analyzer_type": "doubao_sentiment_based",
            "created_at": datetime.now().isoformat(),
            "sentiment_analysis": {
                "sentiment_score": 0,
                "risk_factors": ["数据解析异常"],
                "market_consensus": "无法获取市场共识",
                "contrarian_view": "需要人工复核",
                "real_time_events": [],
                "confidence_level": 0.3,
            },
            "red_team_analysis": {
                "challenge_points": ["响应解析失败"],
                "hidden_risks": ["系统异常风险"],
                "market_blind_spots": ["数据获取盲点"],
                "contrarian_insights": ["需要重新分析"],
            },
            "real_time_insights": {
                "breaking_news_impact": "无法获取实时新闻",
                "social_sentiment": "数据异常",
                "institutional_flow": "无法获取",
                "retail_sentiment": "无法获取",
            },
            "risk_assessment": {
                "immediate_risks": ["系统解析风险"],
                "medium_term_risks": ["数据质量风险"],
                "black_swan_probability": 0.2,
                "volatility_forecast": "high",
            },
            "investment_implications": {
                "position_recommendation": "HOLD",
                "risk_adjustment": "cautious",
                "timing_considerations": "建议等待系统恢复",
                "hedge_strategies": ["保守策略"],
            },
            "raw_analysis": response,
            "error_note": "响应解析失败，已创建默认结构",
        }
