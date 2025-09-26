"""
元认知引擎集成测试
测试元认知引擎与主工作流的集成
"""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.schemas.arbitration import AnalysisResult
from src.services.meta_cognition_engine import MetaCognitionEngine, MetaCognitionResult


class TestMetaCognitionIntegration:
    """元认知引擎集成测试类"""

    @pytest.fixture
    def mock_llm_service(self):
        """创建模拟LLM服务"""
        service = MagicMock()
        service.analyze_fact = AsyncMock()
        return service

    @pytest.fixture
    def meta_engine(self, mock_llm_service):
        """创建元认知引擎实例"""
        return MetaCognitionEngine(mock_llm_service)

    @pytest.fixture
    def sample_qwen_report(self):
        """创建Qwen报告"""
        return AnalysisResult(
            analysis="该公司2024年营业收入预计达到100亿元,同比增长15%,净利润率保持在12%以上。基于强劲的财务表现和良好的市场前景,我们看好该股票。",
            confidence=0.85,
            reasoning="基于财务数据分析,公司业绩表现优秀,增长趋势明确,建议买入。"
        )

    @pytest.fixture
    def sample_doubao_report(self):
        """创建豆包报告"""
        return AnalysisResult(
            analysis="该公司2024年营业收入预计达到95亿元,同比增长12%,净利润率保持在11%以上。基于稳健的财务表现和谨慎的市场评估,我们对该股票持中性态度。",
            confidence=0.75,
            reasoning="基于财务数据分析,公司业绩表现良好,但增长预期相对保守,建议持有。"
        )

    @pytest.fixture
    def conflicting_qwen_report(self):
        """创建冲突的Qwen报告"""
        return AnalysisResult(
            analysis="该公司2024年营业收入预计达到150亿元,同比增长30%,净利润率保持在15%以上。基于超预期的财务表现和巨大的市场机会,我们强烈看好该股票。",
            confidence=0.95,
            reasoning="基于乐观的财务预测和市场分析,公司具有巨大的增长潜力,强烈建议买入。"
        )

    @pytest.fixture
    def conflicting_doubao_report(self):
        """创建冲突的豆包报告"""
        return AnalysisResult(
            analysis="该公司2024年营业收入预计达到80亿元,同比增长5%,净利润率保持在8%左右。基于保守的财务预期和谨慎的市场评估,我们对该股票持谨慎态度。",
            confidence=0.60,
            reasoning="基于保守的财务预测和风险分析,公司增长前景有限,建议观望。"
        )

    @pytest.mark.asyncio
    async def test_meta_cognition_with_consistent_reports(self, meta_engine, mock_llm_service, sample_qwen_report, sample_doubao_report):
        """测试:元认知仲裁一致报告"""
        # 模拟LLM响应 - 观点一致
        mock_response = AnalysisResult(
            analysis="""
            {
                "requires_human_review": false,
                "final_conclusion": {
                    "summary": "两家分析机构观点基本一致,建议买入",
                    "consensus_points": ["财务表现良好", "增长趋势明确", "市场前景乐观"],
                    "key_conflicts": [],
                    "reasoning": "基于财务数据的一致性分析,两家机构都看好公司前景"
                },
                "confidence": 0.85,
                "reasoning": "元认知分析显示观点高度一致,可以自动仲裁"
            }
            """,
            confidence=0.9,
            reasoning="元认知仲裁"
        )
        mock_llm_service.analyze_fact.return_value = mock_response

        # 执行元认知仲裁
        result = await meta_engine.arbitrate_and_summarize(sample_qwen_report, sample_doubao_report)

        # 验证结果
        assert isinstance(result, MetaCognitionResult)
        assert not result.requires_human_review
        assert result.confidence == 0.85
        assert "观点基本一致" in result.final_conclusion["summary"]
        assert len(result.final_conclusion["consensus_points"]) == 3
        assert len(result.final_conclusion["key_conflicts"]) == 0
        assert "元认知分析" in result.reasoning

        # 验证LLM被正确调用
        mock_llm_service.analyze_fact.assert_called_once()
        call_args = mock_llm_service.analyze_fact.call_args[0][0]
        assert "Qwen基本面分析师报告" in call_args["news_content"]
        assert "豆包舆情分析师报告" in call_args["news_content"]
        assert "元认知仲裁" in call_args["news_content"]

    @pytest.mark.asyncio
    async def test_meta_cognition_with_conflicting_reports(self, meta_engine, mock_llm_service, conflicting_qwen_report, conflicting_doubao_report):
        """测试:元认知仲裁冲突报告"""
        # 模拟LLM响应 - 观点冲突
        mock_response = AnalysisResult(
            analysis="""
            {
                "requires_human_review": true,
                "final_conclusion": {
                    "summary": "两家分析机构观点存在重大分歧,需要人工审查",
                    "consensus_points": ["都认为公司有增长潜力"],
                    "key_conflicts": ["增长幅度预期差异巨大", "风险评估完全不同", "投资建议截然相反"],
                    "reasoning": "存在根本性分歧,需要专家判断"
                },
                "confidence": 0.3,
                "reasoning": "分歧过大,无法自动仲裁"
            }
            """,
            confidence=0.8,
            reasoning="元认知仲裁"
        )
        mock_llm_service.analyze_fact.return_value = mock_response

        # 执行元认知仲裁
        result = await meta_engine.arbitrate_and_summarize(conflicting_qwen_report, conflicting_doubao_report)

        # 验证结果
        assert result.requires_human_review
        assert result.confidence == 0.3
        assert "重大分歧" in result.final_conclusion["summary"]
        assert len(result.final_conclusion["consensus_points"]) == 1
        assert len(result.final_conclusion["key_conflicts"]) == 3
        assert "分歧过大" in result.reasoning

    @pytest.mark.asyncio
    async def test_meta_cognition_with_llm_error(self, meta_engine, mock_llm_service, sample_qwen_report, sample_doubao_report):
        """测试:LLM服务出错时的处理"""
        # 模拟LLM服务抛出异常
        mock_llm_service.analyze_fact.side_effect = Exception("LLM服务连接失败")

        # 执行元认知仲裁
        result = await meta_engine.arbitrate_and_summarize(sample_qwen_report, sample_doubao_report)

        # 验证错误处理
        assert result.requires_human_review
        assert result.confidence == 0.0
        assert "LLM服务连接失败" in result.reasoning
        assert "元认知仲裁过程发生错误" in result.final_conclusion["summary"]

    @pytest.mark.asyncio
    async def test_meta_cognition_with_malformed_response(self, meta_engine, mock_llm_service, sample_qwen_report, sample_doubao_report):
        """测试:LLM返回格式错误的响应"""
        # 模拟LLM返回格式错误的响应
        mock_response = AnalysisResult(
            analysis="这不是一个有效的JSON响应",
            confidence=0.8,
            reasoning="元认知仲裁"
        )
        mock_llm_service.analyze_fact.return_value = mock_response

        # 执行元认知仲裁
        result = await meta_engine.arbitrate_and_summarize(sample_qwen_report, sample_doubao_report)

        # 验证错误处理
        assert result.requires_human_review
        assert result.confidence == 0.0
        assert "LLM响应解析失败" in result.reasoning
        assert "元认知仲裁过程发生错误" in result.final_conclusion["summary"]

    @pytest.mark.asyncio
    async def test_meta_cognition_workflow_integration(self, meta_engine, mock_llm_service, sample_qwen_report, sample_doubao_report):
        """测试:完整的元认知仲裁工作流集成"""
        # 模拟LLM响应
        mock_response = AnalysisResult(
            analysis="""
            {
                "requires_human_review": false,
                "final_conclusion": {
                    "summary": "综合两家分析机构的观点,建议买入",
                    "consensus_points": ["财务表现良好", "增长趋势明确", "市场前景乐观", "风险可控"],
                    "key_conflicts": ["增长幅度预期略有差异"],
                    "reasoning": "基于综合分析的最终判断,两家机构观点基本一致"
                },
                "confidence": 0.8,
                "reasoning": "元认知分析完成,观点基本一致,可以自动仲裁"
            }
            """,
            confidence=0.9,
            reasoning="元认知仲裁"
        )
        mock_llm_service.analyze_fact.return_value = mock_response

        # 执行元认知仲裁
        result = await meta_engine.arbitrate_and_summarize(sample_qwen_report, sample_doubao_report)

        # 验证完整工作流
        assert isinstance(result, MetaCognitionResult)
        assert not result.requires_human_review
        assert result.confidence == 0.8
        assert "综合两家分析机构" in result.final_conclusion["summary"]
        assert len(result.final_conclusion["consensus_points"]) == 4
        assert len(result.final_conclusion["key_conflicts"]) == 1
        assert isinstance(result.created_at, datetime)

        # 验证LLM调用
        mock_llm_service.analyze_fact.assert_called_once()
        call_args = mock_llm_service.analyze_fact.call_args[0][0]
        assert "元认知仲裁" in call_args["news_content"]
        assert "Qwen基本面分析师报告" in call_args["news_content"]
        assert "豆包舆情分析师报告" in call_args["news_content"]

    @pytest.mark.asyncio
    async def test_meta_cognition_prompt_quality(self, meta_engine, mock_llm_service, sample_qwen_report, sample_doubao_report):
        """测试:元认知提示词质量"""
        # 模拟LLM响应
        mock_response = AnalysisResult(
            analysis='{"requires_human_review": false, "final_conclusion": {"summary": "测试", "consensus_points": [], "key_conflicts": [], "reasoning": "测试"}, "confidence": 0.8, "reasoning": "测试"}',
            confidence=0.9,
            reasoning="元认知仲裁"
        )
        mock_llm_service.analyze_fact.return_value = mock_response

        # 执行元认知仲裁
        await meta_engine.arbitrate_and_summarize(sample_qwen_report, sample_doubao_report)

        # 验证提示词质量
        call_args = mock_llm_service.analyze_fact.call_args[0][0]
        prompt = call_args["news_content"]

        # 验证提示词包含关键元素
        assert "角色" in prompt
        assert "任务" in prompt
        assert "元认知仲裁" in prompt
        assert "Qwen基本面分析师报告" in prompt
        assert "豆包舆情分析师报告" in prompt
        assert "requires_human_review" in prompt
        assert "final_conclusion" in prompt
        assert "consensus_points" in prompt
        assert "key_conflicts" in prompt
        assert "confidence" in prompt
        assert "reasoning" in prompt

        # 验证提示词包含报告内容
        assert sample_qwen_report.analysis in prompt
        assert sample_doubao_report.analysis in prompt
        assert str(sample_qwen_report.confidence) in prompt
        assert str(sample_doubao_report.confidence) in prompt
