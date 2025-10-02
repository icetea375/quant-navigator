"""
元认知引擎单元测试
测试用AI来仲裁AI的核心逻辑
"""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.schemas.arbitration import AnalysisResult
from src.services.meta_cognition_engine import MetaCognitionEngine, MetaCognitionResult


class TestMetaCognitionEngineUnit:
    """元认知引擎单元测试类"""

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
            reasoning="基于财务数据分析,公司业绩表现优秀,增长趋势明确,建议买入。",
        )

    @pytest.fixture
    def sample_doubao_report(self):
        """创建豆包报告"""
        return AnalysisResult(
            analysis="该公司2024年营业收入预计达到95亿元,同比增长12%,净利润率保持在11%以上。基于稳健的财务表现和谨慎的市场评估,我们对该股票持中性态度。",
            confidence=0.75,
            reasoning="基于财务数据分析,公司业绩表现良好,但增长预期相对保守,建议持有。",
        )

    @pytest.fixture
    def conflicting_qwen_report(self):
        """创建冲突的Qwen报告"""
        return AnalysisResult(
            analysis="该公司2024年营业收入预计达到150亿元,同比增长30%,净利润率保持在15%以上。基于超预期的财务表现和巨大的市场机会,我们强烈看好该股票。",
            confidence=0.95,
            reasoning="基于乐观的财务预测和市场分析,公司具有巨大的增长潜力,强烈建议买入。",
        )

    @pytest.fixture
    def conflicting_doubao_report(self):
        """创建冲突的豆包报告"""
        return AnalysisResult(
            analysis="该公司2024年营业收入预计达到80亿元,同比增长5%,净利润率保持在8%左右。基于保守的财务预期和谨慎的市场评估,我们对该股票持谨慎态度。",
            confidence=0.60,
            reasoning="基于保守的财务预测和风险分析,公司增长前景有限,建议观望。",
        )

    def test_should_initialize_with_llm_service(self, meta_engine, mock_llm_service):
        """测试:应该使用LLM服务正确初始化"""
        assert meta_engine.llm_service == mock_llm_service
        assert meta_engine.logger is not None
        assert meta_engine.arbitration_prompt is not None
        assert "元认知仲裁" in meta_engine.arbitration_prompt

    def test_should_load_arbitration_prompt(self, meta_engine):
        """测试:应该加载仲裁提示词"""
        prompt = meta_engine.arbitration_prompt
        assert "角色" in prompt
        assert "任务" in prompt
        assert "输出格式" in prompt
        assert "requires_human_review" in prompt
        assert "final_conclusion" in prompt

    def test_should_build_arbitration_prompt(
        self, meta_engine, sample_qwen_report, sample_doubao_report
    ):
        """测试:应该构建仲裁提示词"""
        prompt = meta_engine._build_arbitration_prompt(
            sample_qwen_report, sample_doubao_report
        )

        # 验证提示词包含关键信息
        assert "Qwen基本面分析师报告" in prompt
        assert "豆包舆情分析师报告" in prompt
        assert sample_qwen_report.analysis in prompt
        assert sample_doubao_report.analysis in prompt
        assert str(sample_qwen_report.confidence) in prompt
        assert str(sample_doubao_report.confidence) in prompt

    def test_should_parse_valid_arbitration_response(self, meta_engine):
        """测试:应该解析有效的仲裁响应"""
        response_text = """
        {
            "requires_human_review": false,
            "final_conclusion": {
                "summary": "两家分析机构观点基本一致,建议买入",
                "consensus_points": ["财务表现良好", "增长趋势明确"],
                "key_conflicts": [],
                "reasoning": "基于财务数据的一致性分析"
            },
            "confidence": 0.85,
            "reasoning": "元认知分析显示观点高度一致"
        }
        """

        result = meta_engine._parse_arbitration_response(response_text)

        assert isinstance(result, MetaCognitionResult)
        assert not result.requires_human_review
        assert result.confidence == 0.85
        assert "元认知分析" in result.reasoning
        assert result.final_conclusion["summary"] == "两家分析机构观点基本一致,建议买入"
        assert len(result.final_conclusion["consensus_points"]) == 2
        assert len(result.final_conclusion["key_conflicts"]) == 0

    def test_should_parse_arbitration_response_with_human_review(self, meta_engine):
        """测试:应该解析需要人工审查的仲裁响应"""
        response_text = """
        {
            "requires_human_review": true,
            "final_conclusion": {
                "summary": "两家分析机构观点存在重大分歧,需要人工审查",
                "consensus_points": ["都认为公司有增长潜力"],
                "key_conflicts": ["增长幅度预期差异巨大", "风险评估完全不同"],
                "reasoning": "存在根本性分歧,需要专家判断"
            },
            "confidence": 0.3,
            "reasoning": "分歧过大,无法自动仲裁"
        }
        """

        result = meta_engine._parse_arbitration_response(response_text)

        assert result.requires_human_review
        assert result.confidence == 0.3
        assert "分歧过大" in result.reasoning
        assert len(result.final_conclusion["key_conflicts"]) == 2

    def test_should_handle_invalid_json_response(self, meta_engine):
        """测试:应该处理无效的JSON响应"""
        response_text = "这不是一个有效的JSON响应"

        result = meta_engine._parse_arbitration_response(response_text)

        assert result.requires_human_review
        assert result.confidence == 0.0
        assert "LLM响应解析失败" in result.reasoning
        assert "元认知仲裁过程发生错误" in result.final_conclusion["summary"]

    def test_should_create_error_result(self, meta_engine):
        """测试:应该创建错误结果"""
        error_msg = "测试错误"
        result = meta_engine._create_error_result(error_msg)

        assert result.requires_human_review
        assert result.confidence == 0.0
        assert error_msg in result.reasoning
        assert "元认知仲裁过程发生错误" in result.final_conclusion["summary"]
        assert isinstance(result.created_at, datetime)

    @pytest.mark.asyncio
    async def test_arbitrate_and_summarize_with_consistent_reports(
        self, meta_engine, mock_llm_service, sample_qwen_report, sample_doubao_report
    ):
        """测试:仲裁一致报告"""
        # 模拟LLM响应
        mock_response = AnalysisResult(
            analysis="""
            {
                "requires_human_review": false,
                "final_conclusion": {
                    "summary": "两家分析机构观点基本一致,建议买入",
                    "consensus_points": ["财务表现良好", "增长趋势明确"],
                    "key_conflicts": [],
                    "reasoning": "基于财务数据的一致性分析"
                },
                "confidence": 0.85,
                "reasoning": "元认知分析显示观点高度一致"
            }
            """,
            confidence=0.9,
            reasoning="元认知仲裁",
        )
        mock_llm_service.analyze_fact.return_value = mock_response

        result = await meta_engine.arbitrate_and_summarize(
            sample_qwen_report, sample_doubao_report
        )

        # 验证结果
        assert isinstance(result, MetaCognitionResult)
        assert not result.requires_human_review
        assert result.confidence == 0.85
        assert "观点基本一致" in result.final_conclusion["summary"]

        # 验证LLM被正确调用
        mock_llm_service.analyze_fact.assert_called_once()
        call_args = mock_llm_service.analyze_fact.call_args[0][0]
        assert "Qwen基本面分析师报告" in call_args["news_content"]
        assert "豆包舆情分析师报告" in call_args["news_content"]

    @pytest.mark.asyncio
    async def test_arbitrate_and_summarize_with_conflicting_reports(
        self,
        meta_engine,
        mock_llm_service,
        conflicting_qwen_report,
        conflicting_doubao_report,
    ):
        """测试:仲裁冲突报告"""
        # 模拟LLM响应
        mock_response = AnalysisResult(
            analysis="""
            {
                "requires_human_review": true,
                "final_conclusion": {
                    "summary": "两家分析机构观点存在重大分歧,需要人工审查",
                    "consensus_points": ["都认为公司有增长潜力"],
                    "key_conflicts": ["增长幅度预期差异巨大", "风险评估完全不同"],
                    "reasoning": "存在根本性分歧,需要专家判断"
                },
                "confidence": 0.3,
                "reasoning": "分歧过大,无法自动仲裁"
            }
            """,
            confidence=0.8,
            reasoning="元认知仲裁",
        )
        mock_llm_service.analyze_fact.return_value = mock_response

        result = await meta_engine.arbitrate_and_summarize(
            conflicting_qwen_report, conflicting_doubao_report
        )

        # 验证结果
        assert result.requires_human_review
        assert result.confidence == 0.3
        assert "重大分歧" in result.final_conclusion["summary"]
        assert len(result.final_conclusion["key_conflicts"]) == 2

    @pytest.mark.asyncio
    async def test_arbitrate_and_summarize_with_llm_error(
        self, meta_engine, mock_llm_service, sample_qwen_report, sample_doubao_report
    ):
        """测试:LLM服务出错时的处理"""
        # 模拟LLM服务抛出异常
        mock_llm_service.analyze_fact.side_effect = Exception("LLM服务错误")

        result = await meta_engine.arbitrate_and_summarize(
            sample_qwen_report, sample_doubao_report
        )

        # 验证错误处理
        assert result.requires_human_review
        assert result.confidence == 0.0
        assert "LLM服务错误" in result.reasoning
        assert "元认知仲裁过程发生错误" in result.final_conclusion["summary"]

    @pytest.mark.asyncio
    async def test_integration_workflow(
        self, meta_engine, mock_llm_service, sample_qwen_report, sample_doubao_report
    ):
        """测试:完整的元认知仲裁工作流"""
        # 模拟LLM响应
        mock_response = AnalysisResult(
            analysis="""
            {
                "requires_human_review": false,
                "final_conclusion": {
                    "summary": "综合两家分析机构的观点,建议买入",
                    "consensus_points": ["财务表现良好", "增长趋势明确", "市场前景乐观"],
                    "key_conflicts": ["增长幅度预期略有差异"],
                    "reasoning": "基于综合分析的最终判断"
                },
                "confidence": 0.8,
                "reasoning": "元认知分析完成,观点基本一致"
            }
            """,
            confidence=0.9,
            reasoning="元认知仲裁",
        )
        mock_llm_service.analyze_fact.return_value = mock_response

        # 执行仲裁
        result = await meta_engine.arbitrate_and_summarize(
            sample_qwen_report, sample_doubao_report
        )

        # 验证完整工作流
        assert isinstance(result, MetaCognitionResult)
        assert not result.requires_human_review
        assert result.confidence == 0.8
        assert "综合两家分析机构" in result.final_conclusion["summary"]
        assert len(result.final_conclusion["consensus_points"]) == 3
        assert len(result.final_conclusion["key_conflicts"]) == 1
        assert isinstance(result.created_at, datetime)

        # 验证LLM调用
        mock_llm_service.analyze_fact.assert_called_once()
