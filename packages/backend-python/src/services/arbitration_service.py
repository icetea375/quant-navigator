"""
仲裁服务 - 处理仲裁案件相关业务逻辑
"""

from datetime import datetime
from typing import Any, Dict, Optional

from src.schemas.arbitration import (
    AnalysisResult,
    ArbitrationCase,
    ArbitrationCaseCreate,
    ArbitrationCaseUpdate,
    SentimentAnalysis,
)


class ArbitrationService:
    """仲裁服务类"""

    def __init__(self):
        """初始化仲裁服务"""
        self.cases: Dict[str, ArbitrationCase] = {}
        self._initialize_sample_data()

    def _initialize_sample_data(self):
        """初始化示例数据"""
        sample_case = ArbitrationCase(
            case_id="case_001",
            report_type="fact_analysis",
            target_code="000001.SZ",
            qwen_analysis=AnalysisResult(
                analysis="Qwen分析：该股票基本面良好，财务状况稳定",
                confidence=0.85,
                reasoning="基于财务数据和市场表现的综合分析",
            ),
            doubao_analysis=SentimentAnalysis(
                sentiment="positive",
                score=0.7,
                reasoning="市场情绪积极，投资者信心较强",
            ),
            disagreement_score=0.3,
            status="pending",
            created_at=datetime.now(),
        )
        self.cases[sample_case.case_id] = sample_case

    async def get_cases(
        self,
        page: int = 1,
        size: int = 10,
        status: Optional[str] = None,
        target_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """获取仲裁案件列表"""
        # 过滤条件
        filtered_cases = list(self.cases.values())

        if status:
            filtered_cases = [case for case in filtered_cases if case.status == status]

        if target_code:
            filtered_cases = [
                case for case in filtered_cases if case.target_code == target_code
            ]

        # 分页
        total = len(filtered_cases)
        start = (page - 1) * size
        end = start + size
        paginated_cases = filtered_cases[start:end]

        return {
            "data": paginated_cases,
            "total": total,
        }

    async def get_case_by_id(self, case_id: str) -> Optional[ArbitrationCase]:
        """根据ID获取仲裁案件"""
        return self.cases.get(case_id)

    async def create_case(self, case_data: ArbitrationCaseCreate) -> ArbitrationCase:
        """创建新的仲裁案件"""
        case_id = f"case_{len(self.cases) + 1:03d}"
        case = ArbitrationCase(
            case_id=case_id,
            report_type=case_data.report_type,
            target_code=case_data.target_code,
            qwen_analysis=case_data.qwen_analysis,
            doubao_analysis=case_data.doubao_analysis,
            disagreement_score=case_data.disagreement_score,
            status="pending",
            created_at=datetime.now(),
        )
        self.cases[case_id] = case
        return case

    async def update_case(
        self, case_id: str, update_data: ArbitrationCaseUpdate
    ) -> Optional[ArbitrationCase]:
        """更新仲裁案件"""
        if case_id not in self.cases:
            return None

        case = self.cases[case_id]
        if update_data.status:
            case.status = update_data.status
        if update_data.human_decision:
            case.human_decision = update_data.human_decision
        if update_data.human_reasoning:
            case.human_reasoning = update_data.human_reasoning

        case.updated_at = datetime.now()
        return case

    async def delete_case(self, case_id: str) -> bool:
        """删除仲裁案件"""
        if case_id in self.cases:
            del self.cases[case_id]
            return True
        return False

    async def preprocess_case(self, case_id: str) -> Dict[str, Any]:
        """预处理仲裁案件 - 为人类仲裁官提供案情摘要"""
        case = await self.get_case_by_id(case_id)
        if not case:
            raise ValueError("仲裁案件不存在")

        # 生成案情摘要
        summary = {
            "case_id": case.case_id,
            "target_code": case.target_code,
            "report_type": case.report_type,
            "disagreement_score": case.disagreement_score,
            "qwen_summary": case.qwen_analysis.analysis[:100] + "...",
            "doubao_summary": case.doubao_analysis.reasoning[:100] + "...",
            "key_points": [
                f"Qwen置信度: {case.qwen_analysis.confidence:.2f}",
                f"豆包情感得分: {case.doubao_analysis.score:.2f}",
                f"分歧程度: {case.disagreement_score:.2f}",
            ],
            "recommendation": "建议人工仲裁" if case.disagreement_score > 0.5 else "可自动处理",
        }

        return summary

    async def get_statistics(self) -> Dict[str, Any]:
        """获取统计信息"""
        total_cases = len(self.cases)
        pending_cases = len([case for case in self.cases.values() if case.status == "pending"])
        completed_cases = len([case for case in self.cases.values() if case.status == "completed"])
        high_disagreement = len([case for case in self.cases.values() if case.disagreement_score > 0.7])

        return {
            "total_cases": total_cases,
            "pending_cases": pending_cases,
            "completed_cases": completed_cases,
            "high_disagreement_cases": high_disagreement,
            "completion_rate": completed_cases / total_cases if total_cases > 0 else 0,
        }
