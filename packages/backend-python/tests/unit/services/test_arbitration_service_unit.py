"""
ArbitrationService单元测试 - 遵循TDD原则
先写测试，后写实现
"""

import pytest
from datetime import datetime
from unittest.mock import patch, MagicMock

from src.services.arbitration_service import ArbitrationService
from src.schemas.arbitration import (
    AnalysisResult,
    ArbitrationCase,
    ArbitrationCaseCreate,
    ArbitrationCaseUpdate,
    ArbitrationStatus,
    SentimentAnalysis,
)


class TestArbitrationServiceUnit:
    """ArbitrationService单元测试类"""

    @pytest.fixture
    def arbitration_service(self):
        """创建ArbitrationService实例"""
        return ArbitrationService()

    @pytest.fixture
    def sample_case_data(self):
        """创建测试案件数据"""
        return ArbitrationCaseCreate(
            report_type="fact_analysis",
            target_code="000001.SZ",
            qwen_analysis=AnalysisResult(
                analysis="测试分析内容",
                confidence=0.8,
                reasoning="测试推理过程",
            ),
            doubao_analysis=SentimentAnalysis(
                sentiment="positive",
                score=0.7,
                reasoning="测试情感分析",
            ),
            disagreement_score=0.3,
        )

    @pytest.fixture
    def sample_update_data(self):
        """创建测试更新数据"""
        return ArbitrationCaseUpdate(
            status=ArbitrationStatus.RESOLVED,
            human_decision="agree_with_qwen",
            human_reasoning="人工仲裁决定",
        )

    @pytest.mark.asyncio
    async def test_should_initialize_with_sample_data(self, arbitration_service):
        """测试服务初始化时包含示例数据"""
        # Act
        cases = await arbitration_service.get_cases()
        
        # Assert
        assert cases["total"] == 1
        assert len(cases["data"]) == 1
        assert cases["data"][0].case_id == "case_001"
        assert cases["data"][0].target_code == "000001.SZ"

    @pytest.mark.asyncio
    async def test_should_get_cases_with_pagination(self, arbitration_service):
        """测试分页获取案件列表"""
        # Arrange - 创建多个测试案件
        for i in range(5):
            case_data = ArbitrationCaseCreate(
                report_type="fact_analysis",
                target_code=f"00000{i}.SZ",
                qwen_analysis=AnalysisResult(
                    analysis=f"测试分析{i}",
                    confidence=0.8,
                    reasoning="测试推理",
                ),
                doubao_analysis=SentimentAnalysis(
                    sentiment="positive",
                    score=0.7,
                    reasoning="测试情感",
                ),
                disagreement_score=0.3,
            )
            await arbitration_service.create_case(case_data)

        # Act
        page1 = await arbitration_service.get_cases(page=1, size=3)
        page2 = await arbitration_service.get_cases(page=2, size=3)

        # Assert
        assert page1["total"] == 6  # 1个示例 + 5个新创建
        assert len(page1["data"]) == 3
        assert page2["total"] == 6
        assert len(page2["data"]) == 3

    @pytest.mark.asyncio
    async def test_should_filter_cases_by_status(self, arbitration_service, sample_case_data):
        """测试按状态过滤案件"""
        # Arrange
        await arbitration_service.create_case(sample_case_data)
        
        # Act
        pending_cases = await arbitration_service.get_cases(status="pending")
        completed_cases = await arbitration_service.get_cases(status="resolved")

        # Assert
        assert pending_cases["total"] == 2  # 1个示例 + 1个新创建
        assert completed_cases["total"] == 0

    @pytest.mark.asyncio
    async def test_should_filter_cases_by_target_code(self, arbitration_service, sample_case_data):
        """测试按目标代码过滤案件"""
        # Arrange
        await arbitration_service.create_case(sample_case_data)
        
        # Act
        filtered_cases = await arbitration_service.get_cases(target_code="000001.SZ")

        # Assert
        assert filtered_cases["total"] == 2  # 1个示例 + 1个新创建
        for case in filtered_cases["data"]:
            assert case.target_code == "000001.SZ"

    @pytest.mark.asyncio
    async def test_should_get_case_by_id(self, arbitration_service):
        """测试根据ID获取案件"""
        # Act
        case = await arbitration_service.get_case_by_id("case_001")
        non_existent = await arbitration_service.get_case_by_id("non_existent")

        # Assert
        assert case is not None
        assert case.case_id == "case_001"
        assert case.target_code == "000001.SZ"
        assert non_existent is None

    @pytest.mark.asyncio
    async def test_should_create_case(self, arbitration_service, sample_case_data):
        """测试创建新案件"""
        # Act
        created_case = await arbitration_service.create_case(sample_case_data)

        # Assert
        assert created_case.case_id == "case_002"  # 第二个案件
        assert created_case.report_type == sample_case_data.report_type
        assert created_case.target_code == sample_case_data.target_code
        assert created_case.status == "pending"
        assert created_case.created_at is not None

    @pytest.mark.asyncio
    async def test_should_update_case(self, arbitration_service, sample_update_data):
        """测试更新案件"""
        # Arrange
        case_id = "case_001"
        
        # Act
        updated_case = await arbitration_service.update_case(case_id, sample_update_data)
        non_existent = await arbitration_service.update_case("non_existent", sample_update_data)

        # Assert
        assert updated_case is not None
        assert updated_case.status == ArbitrationStatus.RESOLVED
        assert updated_case.human_decision == "agree_with_qwen"
        assert updated_case.human_reasoning == "人工仲裁决定"
        assert updated_case.updated_at is not None
        assert non_existent is None

    @pytest.mark.asyncio
    async def test_should_delete_case(self, arbitration_service):
        """测试删除案件"""
        # Act
        success = await arbitration_service.delete_case("case_001")
        failed = await arbitration_service.delete_case("non_existent")

        # Assert
        assert success is True
        assert failed is False
        # 验证案件确实被删除
        deleted_case = await arbitration_service.get_case_by_id("case_001")
        assert deleted_case is None

    @pytest.mark.asyncio
    async def test_should_preprocess_case(self, arbitration_service):
        """测试预处理案件"""
        # Act
        summary = await arbitration_service.preprocess_case("case_001")

        # Assert
        assert summary["case_id"] == "case_001"
        assert summary["target_code"] == "000001.SZ"
        assert summary["report_type"] == "fact_analysis"
        assert summary["disagreement_score"] == 0.3
        assert "qwen_summary" in summary
        assert "doubao_summary" in summary
        assert "key_points" in summary
        assert "recommendation" in summary

    @pytest.mark.asyncio
    async def test_should_raise_error_for_preprocess_nonexistent_case(self, arbitration_service):
        """测试预处理不存在的案件时抛出错误"""
        # Act & Assert
        with pytest.raises(ValueError, match="仲裁案件不存在"):
            await arbitration_service.preprocess_case("non_existent")

    @pytest.mark.asyncio
    async def test_should_get_statistics(self, arbitration_service, sample_case_data):
        """测试获取统计信息"""
        # Arrange - 创建一些测试数据
        await arbitration_service.create_case(sample_case_data)
        
        # 更新一个案件为已完成
        await arbitration_service.update_case(
            "case_001", 
            ArbitrationCaseUpdate(status=ArbitrationStatus.RESOLVED)
        )

        # Act
        stats = await arbitration_service.get_statistics()

        # Assert
        assert stats["total_cases"] == 2
        assert stats["pending_cases"] == 1
        assert stats["completed_cases"] == 1
        assert stats["high_disagreement_cases"] == 0  # 分歧分数都小于0.7
        assert stats["completion_rate"] == 0.5

    @pytest.mark.asyncio
    async def test_should_handle_empty_cases_list(self):
        """测试空案件列表的处理"""
        # Arrange - 创建新的服务实例（没有示例数据）
        service = ArbitrationService()
        service.cases = {}  # 清空示例数据

        # Act
        stats = await service.get_statistics()

        # Assert
        assert stats["total_cases"] == 0
        assert stats["completion_rate"] == 0

    @pytest.mark.asyncio
    async def test_should_handle_partial_update(self, arbitration_service):
        """测试部分更新案件"""
        # Arrange
        partial_update = ArbitrationCaseUpdate(status=ArbitrationStatus.IN_REVIEW)

        # Act
        updated_case = await arbitration_service.update_case("case_001", partial_update)

        # Assert
        assert updated_case.status == ArbitrationStatus.IN_REVIEW
        assert updated_case.human_decision is None
        assert updated_case.human_reasoning is None

    @pytest.mark.asyncio
    async def test_should_handle_high_disagreement_cases(self, arbitration_service):
        """测试高分歧案件的处理"""
        # Arrange - 创建高分歧案件
        high_disagreement_data = ArbitrationCaseCreate(
            report_type="fact_analysis",
            target_code="000002.SZ",
            qwen_analysis=AnalysisResult(
                analysis="测试分析",
                confidence=0.8,
                reasoning="测试推理",
            ),
            doubao_analysis=SentimentAnalysis(
                sentiment="negative",
                score=0.3,
                reasoning="测试情感",
            ),
            disagreement_score=0.8,  # 高分歧
        )
        await arbitration_service.create_case(high_disagreement_data)

        # Act
        stats = await arbitration_service.get_statistics()

        # Assert
        assert stats["high_disagreement_cases"] == 1

    @pytest.mark.asyncio
    async def test_should_handle_edge_case_pagination(self, arbitration_service):
        """测试分页边界情况"""
        # Act
        empty_page = await arbitration_service.get_cases(page=999, size=10)
        zero_size = await arbitration_service.get_cases(page=1, size=0)

        # Assert
        assert empty_page["total"] == 1  # 只有示例数据
        assert len(empty_page["data"]) == 0
        assert zero_size["total"] == 1
        assert len(zero_size["data"]) == 0
