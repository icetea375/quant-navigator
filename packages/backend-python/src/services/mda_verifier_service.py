"""
MD&A Verifier服务 - 管理层讨论与分析验证器
遵循TDD原则:先写测试,后写实现
"""

import logging
from dataclasses import dataclass
from typing import Any

from src.core.interfaces import LlmProviderInterface


@dataclass
class Commitment:
    """承诺数据类"""
    id: str
    content: str
    category: str  # 财务承诺,战略承诺,风险承诺等
    confidence: float  # 0-1之间的置信度
    source_text: str  # 原始文本
    position: tuple[int, int]  # 在文档中的位置(开始,结束)


@dataclass
class VerificationResult:
    """验证结果数据类"""
    commitment_id: str
    is_fulfilled: bool
    fulfillment_rate: float  # 0-1之间的履行率
    evidence: list[str]  # 支持证据
    confidence: float  # 验证置信度
    reasoning: str  # 验证推理过程


@dataclass
class InformationDensity:
    """信息密度数据类"""
    total_commitments: int
    fulfilled_commitments: int
    fulfillment_rate: float
    information_richness: float  # 0-1之间的信息丰富度
    clarity_score: float  # 0-1之间的清晰度分数


class MDAVerifierService:
    """MD&A Verifier服务类 - 负责承诺提取,验证和信息密度计算"""

    def __init__(self, llm_provider: LlmProviderInterface):
        """
        初始化MD&A Verifier服务

        Args:
            llm_provider: LLM提供商实例
        """
        self.llm_provider = llm_provider
        self.logger = logging.getLogger(__name__)

        # 承诺类别关键词
        self.commitment_keywords = {
            "财务承诺": ["预计", "计划", "目标", "承诺", "预期", "将实现", "力争"],
            "战略承诺": ["战略", "规划", "发展方向", "重点", "核心", "布局"],
            "风险承诺": ["风险", "挑战", "应对", "措施", "防范", "控制"],
            "运营承诺": ["运营", "管理", "提升", "优化", "改进", "加强"]
        }

    async def extract_commitments(self, mda_text: str) -> list[Commitment]:
        """
        从MD&A文本中提取承诺

        Args:
            mda_text: MD&A文本内容

        Returns:
            承诺列表
        """
        self.logger.info("开始提取MD&A承诺")

        try:
            # 使用LLM进行承诺提取
            prompt = self._build_commitment_extraction_prompt(mda_text)

            response = await self.llm_provider.generate_text(
                prompt=prompt,
                model="qwen-plus",
                max_tokens=2000,
                temperature=0.1
            )

            # 解析LLM响应
            commitments = self._parse_commitment_response(response, mda_text)

            self.logger.info(f"成功提取 {len(commitments)} 个承诺")
            return commitments

        except Exception as e:
            self.logger.error(f"承诺提取失败: {e}")
            return []

    async def verify_commitments(
        self,
        commitments: list[Commitment],
        current_data: dict[str, Any]
    ) -> list[VerificationResult]:
        """
        验证承诺履行情况

        Args:
            commitments: 承诺列表
            current_data: 当前财务和市场数据

        Returns:
            验证结果列表
        """
        self.logger.info(f"开始验证 {len(commitments)} 个承诺")

        verification_results = []

        for commitment in commitments:
            try:
                # 使用LLM进行承诺验证
                prompt = self._build_verification_prompt(commitment, current_data)

                response = await self.llm_provider.generate_text(
                    prompt=prompt,
                    model="qwen-plus",
                    max_tokens=1000,
                    temperature=0.1
                )

                # 解析验证结果
                result = self._parse_verification_response(response, commitment)
                verification_results.append(result)

            except Exception as e:
                self.logger.error(f"验证承诺 {commitment.id} 失败: {e}")
                # 创建默认的失败结果
                verification_results.append(VerificationResult(
                    commitment_id=commitment.id,
                    is_fulfilled=False,
                    fulfillment_rate=0.0,
                    evidence=[],
                    confidence=0.0,
                    reasoning="验证过程中发生错误"
                ))

        self.logger.info(f"完成验证,成功验证 {len(verification_results)} 个承诺")
        return verification_results

    async def calculate_information_density(
        self,
        commitments: list[Commitment],
        verification_results: list[VerificationResult]
    ) -> InformationDensity:
        """
        计算信息密度

        Args:
            commitments: 承诺列表
            verification_results: 验证结果列表

        Returns:
            信息密度对象
        """
        self.logger.info("开始计算信息密度")

        try:
            total_commitments = len(commitments)
            fulfilled_commitments = sum(1 for result in verification_results if result.is_fulfilled)
            fulfillment_rate = fulfilled_commitments / max(total_commitments, 1)

            # 计算信息丰富度(基于承诺数量和类别多样性)
            category_diversity = len({commitment.category for commitment in commitments})
            information_richness = min(category_diversity / 4.0, 1.0)  # 最多4个类别

            # 计算清晰度分数(基于承诺内容的平均置信度)
            avg_confidence = sum(commitment.confidence for commitment in commitments) / max(total_commitments, 1)
            clarity_score = avg_confidence

            density = InformationDensity(
                total_commitments=total_commitments,
                fulfilled_commitments=fulfilled_commitments,
                fulfillment_rate=fulfillment_rate,
                information_richness=information_richness,
                clarity_score=clarity_score
            )

            self.logger.info(f"信息密度计算完成: 履行率={fulfillment_rate:.2f}, 丰富度={information_richness:.2f}")
            return density

        except Exception as e:
            self.logger.error(f"信息密度计算失败: {e}")
            return InformationDensity(
                total_commitments=0,
                fulfilled_commitments=0,
                fulfillment_rate=0.0,
                information_richness=0.0,
                clarity_score=0.0
            )

    def _build_commitment_extraction_prompt(self, mda_text: str) -> str:
        """构建承诺提取提示词"""
        return f"""
请从以下MD&A文本中提取管理层承诺,并按JSON格式返回结果。

MD&A文本:
{mda_text[:2000]}...

请提取以下类型的承诺:
1. 财务承诺:关于收入,利润,成本等财务目标的承诺
2. 战略承诺:关于业务发展,市场拓展等战略方向的承诺
3. 风险承诺:关于风险管理和控制的承诺
4. 运营承诺:关于运营效率,管理提升等运营方面的承诺

返回格式:
{{
    "commitments": [
        {{
            "id": "commitment_1",
            "content": "承诺内容",
            "category": "财务承诺",
            "confidence": 0.9,
            "source_text": "原始文本片段",
            "position": [100, 200]
        }}
    ]
}}
"""

    def _build_verification_prompt(self, commitment: Commitment, current_data: dict[str, Any]) -> str:
        """构建承诺验证提示词"""
        return f"""
请验证以下管理层承诺的履行情况,基于提供的当前数据。

承诺内容:{commitment.content}
承诺类别:{commitment.category}
原始文本:{commitment.source_text}

当前数据:
{current_data}

请分析该承诺是否已经履行,并返回JSON格式结果:
{{
    "is_fulfilled": true/false,
    "fulfillment_rate": 0.8,
    "evidence": ["支持证据1", "支持证据2"],
    "confidence": 0.9,
    "reasoning": "验证推理过程"
}}
"""

    def _parse_commitment_response(self, response: str, mda_text: str) -> list[Commitment]:
        """解析承诺提取响应"""
        try:
            import json
            data = json.loads(response)
            commitments = []

            for item in data.get("commitments", []):
                commitment = Commitment(
                    id=item.get("id", f"commitment_{len(commitments) + 1}"),
                    content=item.get("content", ""),
                    category=item.get("category", "未知"),
                    confidence=float(item.get("confidence", 0.5)),
                    source_text=item.get("source_text", ""),
                    position=tuple(item.get("position", [0, 0]))
                )
                commitments.append(commitment)

            return commitments

        except Exception as e:
            self.logger.error(f"解析承诺响应失败: {e}")
            return []

    def _parse_verification_response(self, response: str, commitment: Commitment) -> VerificationResult:
        """解析验证响应"""
        try:
            import json
            data = json.loads(response)

            return VerificationResult(
                commitment_id=commitment.id,
                is_fulfilled=bool(data.get("is_fulfilled", False)),
                fulfillment_rate=float(data.get("fulfillment_rate", 0.0)),
                evidence=data.get("evidence", []),
                confidence=float(data.get("confidence", 0.0)),
                reasoning=data.get("reasoning", "")
            )

        except Exception as e:
            self.logger.error(f"解析验证响应失败: {e}")
            return VerificationResult(
                commitment_id=commitment.id,
                is_fulfilled=False,
                fulfillment_rate=0.0,
                evidence=[],
                confidence=0.0,
                reasoning="解析响应时发生错误"
            )
