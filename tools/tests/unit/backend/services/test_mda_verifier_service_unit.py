"""
MD&A Verifier服务单元测试
实施测试金字塔原则 - 大量快速单元测试
完全模拟LLM_Gateway调用
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../packages/backend-python')))

from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.core.interfaces import LlmProviderInterface
from src.services.mda_verifier_service import (
    Commitment,
    MDAVerifierService,
    VerificationResult,
)


class TestMDAVerifierServiceUnit:
    """MD&A Verifier服务单元测试类"""

    @pytest.fixture
    def mock_llm_provider(self):
        """创建模拟LLM提供商"""
        provider = Mock(spec=LlmProviderInterface)
        provider.generate_text = AsyncMock()
        return provider

    @pytest.fixture
    def verifier_service(self, mock_llm_provider):
        """创建MD&A Verifier服务实例"""
        return MDAVerifierService(mock_llm_provider)

    @pytest.fixture
    def sample_mda_text(self):
        """创建标准MD&A文本"""
        return """
        管理层讨论与分析

        一,经营情况讨论与分析

        1. 财务表现
        公司预计2024年营业收入将达到100亿元,同比增长15%。
        我们承诺将净利润率保持在10%以上。

        2. 战略发展
        公司将继续推进数字化转型战略,计划在未来三年内投资50亿元。
        我们将重点布局人工智能和云计算领域。

        3. 风险管控
        公司将加强风险管控体系建设,确保合规经营。
        我们承诺将风险损失控制在营业收入的1%以内。

        4. 运营管理
        公司将提升运营效率,优化成本结构。
        我们力争将运营成本降低5%。
        """

    @pytest.fixture
    def sample_commitments(self):
        """创建标准承诺数据"""
        return [
            Commitment(
                id="commitment_1",
                content="预计2024年营业收入将达到100亿元,同比增长15%",
                category="财务承诺",
                confidence=0.9,
                source_text="公司预计2024年营业收入将达到100亿元,同比增长15%。",
                position=(100, 150),
            ),
            Commitment(
                id="commitment_2",
                content="承诺将净利润率保持在10%以上",
                category="财务承诺",
                confidence=0.85,
                source_text="我们承诺将净利润率保持在10%以上。",
                position=(200, 250),
            ),
            Commitment(
                id="commitment_3",
                content="计划在未来三年内投资50亿元",
                category="战略承诺",
                confidence=0.8,
                source_text="计划在未来三年内投资50亿元。",
                position=(300, 350),
            ),
        ]

    @pytest.fixture
    def sample_current_data(self):
        """创建标准当前数据"""
        return {
            "revenue_2024": 95.0,  # 亿元
            "revenue_growth": 0.12,  # 12%
            "net_profit_margin": 0.11,  # 11%
            "investment_plan": 45.0,  # 亿元
            "risk_loss_ratio": 0.008,  # 0.8%
        }

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_green_phase_should_initialize_with_llm_provider(self, mock_llm_provider):
        pass
        """测试:应该使用LLM提供商正确初始化"""
        service = MDAVerifierService(mock_llm_provider)

        assert service.llm_provider == mock_llm_provider
        assert service.logger is not None
        assert len(service.commitment_keywords) == 4
        assert "财务承诺" in service.commitment_keywords
        assert "战略承诺" in service.commitment_keywords
        assert "风险承诺" in service.commitment_keywords
        assert "运营承诺" in service.commitment_keywords

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_should_have_correct_commitment_keywords(self, verifier_service):
        pass
        """测试:应该包含正确的承诺关键词"""
        keywords = verifier_service.commitment_keywords

        # 财务承诺关键词
        financial_keywords = keywords["财务承诺"]
        assert "预计" in financial_keywords
        assert "目标" in financial_keywords
        assert "承诺" in financial_keywords

        # 战略承诺关键词
        strategic_keywords = keywords["战略承诺"]
        assert "战略" in strategic_keywords
        assert "规划" in strategic_keywords
        assert "发展方向" in strategic_keywords

        # 风险承诺关键词
        risk_keywords = keywords["风险承诺"]
        assert "风险" in risk_keywords
        assert "应对" in risk_keywords
        assert "防范" in risk_keywords

        # 运营承诺关键词
        operational_keywords = keywords["运营承诺"]
        assert "运营" in operational_keywords
        assert "提升" in operational_keywords
        assert "优化" in operational_keywords

    @pytest.mark.asyncio
    async def test_placeholder(self):
        pass

    @pytest.mark.asyncio
    async def test_extract_commitments_with_valid_response(
        self, verifier_service, sample_mda_text
    ):
        """测试:使用有效响应提取承诺"""
        # 模拟LLM响应
        mock_response = """
        {
            "commitments": [
                {
                    "id": "commitment_1",
                    "content": "预计2024年营业收入将达到100亿元,同比增长15%",
                    "category": "财务承诺",
                    "confidence": 0.9,
                    "source_text": "公司预计2024年营业收入将达到100亿元,同比增长15%。",
                    "position": [100, 150]
                },
                {
                    "id": "commitment_2",
                    "content": "承诺将净利润率保持在10%以上",
                    "category": "财务承诺",
                    "confidence": 0.85,
                    "source_text": "我们承诺将净利润率保持在10%以上。",
                    "position": [200, 250]
                }
            ]
        }
        """

        verifier_service.llm_provider.generate_text.return_value = mock_response

        commitments = await verifier_service.extract_commitments(sample_mda_text)

        # 验证结果
        assert len(commitments) == 2
        assert commitments[0].id == "commitment_1"
        assert commitments[0].content == "预计2024年营业收入将达到100亿元,同比增长15%"
        assert commitments[0].category == "财务承诺"
        assert commitments[0].confidence == 0.9
        assert commitments[1].id == "commitment_2"
        assert commitments[1].category == "财务承诺"
        assert commitments[1].confidence == 0.85

        # 验证LLM调用
        verifier_service.llm_provider.generate_text.assert_called_once()
        call_args = verifier_service.llm_provider.generate_text.call_args
        assert "qwen-plus" in call_args.kwargs["model"]
        assert call_args.kwargs["max_tokens"] == 2000
        assert call_args.kwargs["temperature"] == 0.1

    @pytest.mark.asyncio
    async def test_placeholder(self):
        pass

    @pytest.mark.asyncio
    async def test_extract_commitments_with_invalid_response(
        self, verifier_service, sample_mda_text
    ):
        """测试:使用无效响应提取承诺"""
        # 模拟无效LLM响应
        verifier_service.llm_provider.generate_text.return_value = (
            "invalid json response"
        )

        commitments = await verifier_service.extract_commitments(sample_mda_text)

        # 应该返回空列表
        assert len(commitments) == 0

    @pytest.mark.asyncio
    async def test_placeholder(self):
        pass

    @pytest.mark.asyncio
    async def test_extract_commitments_with_llm_error(
        self, verifier_service, sample_mda_text
    ):
        """测试:LLM调用失败时的承诺提取"""
        # 模拟LLM调用失败
        verifier_service.llm_provider.generate_text.side_effect = Exception(
            "LLM API error"
        )

        commitments = await verifier_service.extract_commitments(sample_mda_text)

        # 应该返回空列表
        assert len(commitments) == 0

    @pytest.mark.asyncio
    async def test_placeholder(self):
        pass

    @pytest.mark.asyncio
    async def test_verify_commitments_with_fulfilled_commitments(
        self, verifier_service, sample_commitments, sample_current_data
    ):
        """测试:验证已履行的承诺"""
        # 模拟LLM验证响应
        mock_responses = [
            # 收入承诺验证
            """
            {
                "is_fulfilled": true,
                "fulfillment_rate": 0.95,
                "evidence": ["当前收入95亿元,接近目标100亿元"],
                "confidence": 0.9,
                "reasoning": "收入增长12%,接近承诺的15%增长目标"
            }
            """,
            # 利润率承诺验证
            """
            {
                "is_fulfilled": true,
                "fulfillment_rate": 1.0,
                "evidence": ["当前净利润率11%,超过承诺的10%"],
                "confidence": 0.95,
                "reasoning": "净利润率11%完全满足承诺要求"
            }
            """,
            # 投资承诺验证
            """
            {
                "is_fulfilled": false,
                "fulfillment_rate": 0.9,
                "evidence": ["当前投资45亿元,接近计划50亿元"],
                "confidence": 0.8,
                "reasoning": "投资进度良好,但尚未完全达到目标"
            }
            """,
        ]

        verifier_service.llm_provider.generate_text.side_effect = mock_responses

        results = await verifier_service.verify_commitments(
            sample_commitments, sample_current_data
        )

        # 验证结果
        assert len(results) == 3
        assert results[0].is_fulfilled
        assert results[0].fulfillment_rate == 0.95
        assert results[0].confidence == 0.9
        assert "收入95亿元" in results[0].evidence[0]

        assert results[1].is_fulfilled
        assert results[1].fulfillment_rate == 1.0
        assert results[1].confidence == 0.95

        assert not results[2].is_fulfilled
        assert results[2].fulfillment_rate == 0.9
        assert results[2].confidence == 0.8

        # 验证LLM调用次数
        assert verifier_service.llm_provider.generate_text.call_count == 3

    @pytest.mark.asyncio
    async def test_placeholder(self):
        pass

    @pytest.mark.asyncio
    async def test_verify_commitments_with_verification_error(
        self, verifier_service, sample_commitments, sample_current_data
    ):
        """测试:验证过程中发生错误"""
        # 模拟第一个验证成功,第二个失败
        mock_responses = [
            """
            {
                "is_fulfilled": true,
                "fulfillment_rate": 0.95,
                "evidence": ["验证成功"],
                "confidence": 0.9,
                "reasoning": "验证通过"
            }
            """,
            Exception("验证失败"),
        ]

        verifier_service.llm_provider.generate_text.side_effect = mock_responses

        results = await verifier_service.verify_commitments(
            sample_commitments, sample_current_data
        )

        # 验证结果
        assert len(results) == 3
        assert results[0].is_fulfilled
        assert not results[1].is_fulfilled  # 验证失败
        assert results[1].fulfillment_rate == 0.0
        assert results[1].confidence == 0.0
        assert "验证过程中发生错误" in results[1].reasoning
        assert not results[2].is_fulfilled  # 没有响应

    @pytest.mark.asyncio
    async def test_placeholder(self):
        pass

    @pytest.mark.asyncio
    async def test_calculate_information_density_with_high_fulfillment(
        self, verifier_service, sample_commitments
    ):
        """测试:计算高履行率的信息密度"""
        # 创建高履行率的验证结果
        verification_results = [
            VerificationResult("commitment_1", True, 0.95, ["证据1"], 0.9, "推理1"),
            VerificationResult("commitment_2", True, 1.0, ["证据2"], 0.95, "推理2"),
            VerificationResult("commitment_3", True, 0.9, ["证据3"], 0.85, "推理3"),
        ]

        density = await verifier_service.calculate_information_density(
            sample_commitments, verification_results
        )

        # 验证结果
        assert density.total_commitments == 3
        assert density.fulfilled_commitments == 3
        assert density.fulfillment_rate == 1.0
        assert density.information_richness >= 0.5  # 有多个类别
        assert density.clarity_score > 0.8  # 高置信度

    @pytest.mark.asyncio
    async def test_placeholder(self):
        pass

    @pytest.mark.asyncio
    async def test_calculate_information_density_with_low_fulfillment(
        self, verifier_service, sample_commitments
    ):
        """测试:计算低履行率的信息密度"""
        # 创建低履行率的验证结果
        verification_results = [
            VerificationResult("commitment_1", False, 0.3, [], 0.4, "未履行"),
            VerificationResult("commitment_2", False, 0.2, [], 0.3, "未履行"),
            VerificationResult(
                "commitment_3", True, 0.6, ["部分证据"], 0.5, "部分履行"
            ),
        ]

        # 修改测试数据中的承诺置信度,使其反映低清晰度
        sample_commitments[0].confidence = 0.4
        sample_commitments[1].confidence = 0.3
        sample_commitments[2].confidence = 0.5

        density = await verifier_service.calculate_information_density(
            sample_commitments, verification_results
        )

        # 验证结果
        assert density.total_commitments == 3
        assert density.fulfilled_commitments == 1
        assert density.fulfillment_rate == 1 / 3
        assert density.information_richness >= 0.5  # 有多个类别
        assert density.clarity_score < 0.6  # 低置信度

    @pytest.mark.asyncio
    async def test_placeholder(self):
        pass

    @pytest.mark.asyncio
    async def test_calculate_information_density_with_empty_commitments(
        self, verifier_service
    ):
        """测试:计算空承诺列表的信息密度"""
        density = await verifier_service.calculate_information_density([], [])

        # 验证结果
        assert density.total_commitments == 0
        assert density.fulfilled_commitments == 0
        assert density.fulfillment_rate == 0.0
        assert density.information_richness == 0.0
        assert density.clarity_score == 0.0

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_build_commitment_extraction_prompt(
        self, verifier_service, sample_mda_text
    ):
        """测试:构建承诺提取提示词"""
        prompt = verifier_service._build_commitment_extraction_prompt(sample_mda_text)

        # 验证提示词内容
        assert "MD&A文本" in prompt
        assert "财务承诺" in prompt
        assert "战略承诺" in prompt
        assert "风险承诺" in prompt
        assert "运营承诺" in prompt
        assert "JSON格式" in prompt
        assert sample_mda_text[:100] in prompt  # 包含部分原文

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_build_verification_prompt(
        self, verifier_service, sample_commitments, sample_current_data
    ):
        """测试:构建承诺验证提示词"""
        commitment = sample_commitments[0]
        prompt = verifier_service._build_verification_prompt(
            commitment, sample_current_data
        )

        # 验证提示词内容
        assert commitment.content in prompt
        assert commitment.category in prompt
        assert commitment.source_text in prompt
        assert "当前数据" in prompt
        assert "JSON格式" in prompt
        assert str(sample_current_data["revenue_2024"]) in prompt

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_parse_commitment_response_with_valid_json(
        self, verifier_service, sample_mda_text
    ):
        """测试:解析有效的承诺响应"""
        response = """
        {
            "commitments": [
                {
                    "id": "commitment_1",
                    "content": "测试承诺1",
                    "category": "财务承诺",
                    "confidence": 0.9,
                    "source_text": "原始文本1",
                    "position": [100, 200]
                }
            ]
        }
        """

        commitments = verifier_service._parse_commitment_response(
            response, sample_mda_text
        )

        # 验证结果
        assert len(commitments) == 1
        assert commitments[0].id == "commitment_1"
        assert commitments[0].content == "测试承诺1"
        assert commitments[0].category == "财务承诺"
        assert commitments[0].confidence == 0.9
        assert commitments[0].position == (100, 200)

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_parse_commitment_response_with_invalid_json(
        self, verifier_service, sample_mda_text
    ):
        """测试:解析无效的承诺响应"""
        response = "invalid json"

        commitments = verifier_service._parse_commitment_response(
            response, sample_mda_text
        )

        # 应该返回空列表
        assert len(commitments) == 0

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_parse_verification_response_with_valid_json(
        self, verifier_service, sample_commitments
    ):
        """测试:解析有效的验证响应"""
        response = """
        {
            "is_fulfilled": true,
            "fulfillment_rate": 0.8,
            "evidence": ["证据1", "证据2"],
            "confidence": 0.9,
            "reasoning": "验证推理"
        }
        """

        commitment = sample_commitments[0]
        result = verifier_service._parse_verification_response(response, commitment)

        # 验证结果
        assert result.commitment_id == commitment.id
        assert result.is_fulfilled
        assert result.fulfillment_rate == 0.8
        assert len(result.evidence) == 2
        assert result.confidence == 0.9
        assert result.reasoning == "验证推理"

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_parse_verification_response_with_invalid_json(
        self, verifier_service, sample_commitments
    ):
        """测试:解析无效的验证响应"""
        response = "invalid json"

        commitment = sample_commitments[0]
        result = verifier_service._parse_verification_response(response, commitment)

        # 验证默认结果
        assert result.commitment_id == commitment.id
        assert not result.is_fulfilled
        assert result.fulfillment_rate == 0.0
        assert len(result.evidence) == 0
        assert result.confidence == 0.0
        assert "解析响应时发生错误" in result.reasoning

    @pytest.mark.asyncio
    async def test_placeholder(self):
        pass

    @pytest.mark.asyncio
    async def test_integration_workflow(
        self, verifier_service, sample_mda_text, sample_current_data
    ):
        """测试:完整的MD&A验证工作流"""
        # 模拟完整的LLM响应
        extraction_response = """
        {
            "commitments": [
                {
                    "id": "commitment_1",
                    "content": "预计2024年营业收入将达到100亿元",
                    "category": "财务承诺",
                    "confidence": 0.9,
                    "source_text": "公司预计2024年营业收入将达到100亿元",
                    "position": [100, 150]
                }
            ]
        }
        """

        verification_response = """
        {
            "is_fulfilled": true,
            "fulfillment_rate": 0.95,
            "evidence": ["当前收入95亿元,接近目标"],
            "confidence": 0.9,
            "reasoning": "收入接近目标,基本履行承诺"
        }
        """

        verifier_service.llm_provider.generate_text.side_effect = [
            extraction_response,
            verification_response,
        ]

        # 执行完整工作流
        commitments = await verifier_service.extract_commitments(sample_mda_text)
        verification_results = await verifier_service.verify_commitments(
            commitments, sample_current_data
        )
        density = await verifier_service.calculate_information_density(
            commitments, verification_results
        )

        # 验证结果
        assert len(commitments) == 1
        assert commitments[0].category == "财务承诺"

        assert len(verification_results) == 1
        assert verification_results[0].is_fulfilled
        assert verification_results[0].fulfillment_rate == 0.95

        assert density.total_commitments == 1
        assert density.fulfilled_commitments == 1
        assert density.fulfillment_rate == 1.0

    @pytest.mark.asyncio
    async def test_placeholder(self):
        pass

    @pytest.mark.asyncio
    async def test_calculate_information_density_with_exception(self, verifier_service):
        pass
        """测试:应该正确处理信息密度计算异常"""
        # 创建测试数据
        commitments = [
            Commitment(
                id="commit_1",
                content="收入增长20%",
                category="财务承诺",
                confidence=0.8,
                source_text="我们承诺在2024年实现收入增长20%",
                position=(100, 150),
            )
        ]

        verification_results = [
            VerificationResult(
                commitment_id="commit_1",
                is_fulfilled=True,
                fulfillment_rate=0.95,
                evidence=["Q1收入增长18%", "Q2收入增长22%"],
                confidence=0.9,
                reasoning="收入接近目标,基本履行承诺",
            )
        ]

        # 使用patch来模拟内部计算抛出异常
        with patch("builtins.len", side_effect=Exception("模拟计算异常")):
            density = await verifier_service.calculate_information_density(
                commitments, verification_results
            )

            # 验证异常处理结果
            assert density.total_commitments == 0
            assert density.fulfilled_commitments == 0
            assert density.fulfillment_rate == 0.0
            assert density.information_richness == 0.0
