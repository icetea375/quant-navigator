"""
元认知引擎 - 用AI来仲裁AI
遵循v14.4架构:用"魔法"打败"魔法"
"""

import json
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from src.schemas.arbitration import AnalysisResult


@dataclass
class MetaCognitionResult:
    """元认知仲裁结果"""
    requires_human_review: bool
    final_conclusion: dict[str, Any]
    confidence: float
    reasoning: str
    created_at: datetime


class MetaCognitionEngine:
    """元认知引擎 - 用更高级的AI来仲裁双脑报告"""

    def __init__(self, llm_service):
        """
        初始化元认知引擎

        Args:
            llm_service: LLM服务实例
        """
        self.llm_service = llm_service
        self.logger = logging.getLogger(__name__)

        # 元认知仲裁提示词
        self.arbitration_prompt = self._load_arbitration_prompt()

    async def arbitrate_and_summarize(
        self,
        qwen_report: AnalysisResult,
        doubao_report: AnalysisResult
    ) -> MetaCognitionResult:
        """
        仲裁并总结双脑报告

        Args:
            qwen_report: Qwen分析报告
            doubao_report: 豆包分析报告

        Returns:
            元认知仲裁结果
        """
        self.logger.info("开始元认知仲裁")

        try:
            # 构建仲裁提示词
            prompt = self._build_arbitration_prompt(qwen_report, doubao_report)

            # 调用LLM进行元认知仲裁
            response = await self.llm_service.analyze_fact({
                "news_content": prompt,
                "context": "元认知仲裁分析"
            })

            # 解析LLM响应
            result = self._parse_arbitration_response(response.analysis)

            self.logger.info(f"元认知仲裁完成: 需要人工审查={result.requires_human_review}")
            return result

        except Exception as e:
            self.logger.error(f"元认知仲裁失败: {e}")
            return self._create_error_result(str(e))

    def _load_arbitration_prompt(self) -> str:
        """加载元认知仲裁提示词"""
        return """
[角色]
你是一位顶级的,极其富有智慧和经验的投资分析团队主管。你面前有两份由你的下属——一位是严谨的,基于历史数据的"基本面分析师(Qwen)",另一位是消息灵通的,关注市场情绪的"舆情分析师(豆包)"——提交的,关于同一事件的独立报告。

[你的任务]
1. 阅读并理解这两份报告。
2. 识别并总结他们观点中的"共识点"和"核心争议点"。
3. 进行最终的,更高维度的"元认知仲裁":
   - 如果两份报告观点一致且证据确凿,请综合他们的观点,形成一份最终的,统一的,更高质量的分析结论。
   - 如果两份报告观点存在显著矛盾,请评估这场争议的重要性。如果这只是一个微小的分歧,请基于"事实优先"或"逻辑更严谨"的原则,做出一个倾向性的判断。
   - [关键]如果这场争议是重大的,根本性的(例如,一方认为公司前途光明,另一方认为公司即将崩溃),并且你认为仅凭现有信息无法做出一个高置信度的判断,请明确指出"此案存在重大不确定性,需要人类专家进行最终审查"。

[输出格式]
严格按照以下JSON格式输出:
{
  "requires_human_review": <boolean>,
  "final_conclusion": {
    "summary": "<string, 你最终的,一句话的核心结论>",
    "consensus_points": ["<string>"],
    "key_conflicts": ["<string>"],
    "reasoning": "<string, 你做出此最终判断的完整逻辑>"
  },
  "confidence": <float, 0-1之间的置信度>,
  "reasoning": "<string, 元认知推理过程>"
}
"""

    def _build_arbitration_prompt(self, qwen_report: AnalysisResult, doubao_report: AnalysisResult) -> str:
        """构建仲裁提示词"""
        return f"""
{self.arbitration_prompt}

[Qwen基本面分析师报告]
分析内容: {qwen_report.analysis}
置信度: {qwen_report.confidence}
推理过程: {qwen_report.reasoning}

[豆包舆情分析师报告]
分析内容: {doubao_report.analysis}
置信度: {doubao_report.confidence}
推理过程: {doubao_report.reasoning}

请基于以上两份报告,进行元认知仲裁分析。
"""

    def _parse_arbitration_response(self, response_text: str) -> MetaCognitionResult:
        """解析LLM仲裁响应"""
        try:
            # 尝试解析JSON响应
            response_data = json.loads(response_text)

            return MetaCognitionResult(
                requires_human_review=response_data.get("requires_human_review", True),
                final_conclusion=response_data.get("final_conclusion", {}),
                confidence=response_data.get("confidence", 0.0),
                reasoning=response_data.get("reasoning", ""),
                created_at=datetime.now()
            )

        except json.JSONDecodeError as e:
            self.logger.error(f"解析元认知仲裁响应失败: {e}")
            return self._create_error_result(f"LLM响应解析失败: {e}")

    def _create_error_result(self, error_msg: str) -> MetaCognitionResult:
        """创建错误结果"""
        return MetaCognitionResult(
            requires_human_review=True,
            final_conclusion={
                "summary": "元认知仲裁过程发生错误",
                "consensus_points": [],
                "key_conflicts": [],
                "reasoning": error_msg
            },
            confidence=0.0,
            reasoning=f"错误: {error_msg}",
            created_at=datetime.now()
        )
