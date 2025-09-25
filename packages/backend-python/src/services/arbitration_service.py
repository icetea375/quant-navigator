"""
仲裁服务 - 处理仲裁案件相关业务逻辑
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from src.schemas.arbitration import (
    ArbitrationCase,
    ArbitrationCaseCreate,
    ArbitrationCaseUpdate,
    AnalysisResult,
    SentimentAnalysis
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
                reasoning="基于财务数据和市场表现的综合分析"
            ),
            doubao_analysis=SentimentAnalysis(
                sentiment="positive",
                score=0.7,
                reasoning="市场情绪积极，投资者信心较强"
            ),
            disagreement_score=0.3,
            status="pending",
            created_at=datetime.now()
        )
        self.cases[sample_case.case_id] = sample_case
    
    async def get_cases(
        self,
        page: int = 1,
        size: int = 10,
        status: Optional[str] = None,
        target_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """获取仲裁案件列表"""
        
        # 过滤条件
        filtered_cases = list(self.cases.values())
        
        if status:
            filtered_cases = [case for case in filtered_cases if case.status == status]
        
        if target_code:
            filtered_cases = [case for case in filtered_cases if case.target_code == target_code]
        
        # 分页
        total = len(filtered_cases)
        start = (page - 1) * size
        end = start + size
        paginated_cases = filtered_cases[start:end]
        
        return {
            "data": paginated_cases,
            "total": total
        }
    
    async def get_case_by_id(self, case_id: str) -> Optional[ArbitrationCase]:
        """根据ID获取仲裁案件"""
        return self.cases.get(case_id)
    
    async def create_case(self, case_data: ArbitrationCaseCreate) -> ArbitrationCase:
        """创建新的仲裁案件"""
        case_id = f"case_{len(self.cases) + 1:03d}"
        
        # 计算分歧度
        disagreement_score = self._calculate_disagreement_score(
            case_data.qwen_analysis,
            case_data.doubao_analysis
        )
        
        case = ArbitrationCase(
            case_id=case_id,
            report_type=case_data.report_type,
            target_code=case_data.target_code,
            qwen_analysis=case_data.qwen_analysis,
            doubao_analysis=case_data.doubao_analysis,
            disagreement_score=disagreement_score,
            status="pending",
            created_at=datetime.now()
        )
        
        self.cases[case_id] = case
        return case
    
    async def update_case(
        self,
        case_id: str,
        update_data: ArbitrationCaseUpdate
    ) -> Optional[ArbitrationCase]:
        """更新仲裁案件"""
        case = self.cases.get(case_id)
        if not case:
            return None
        
        # 更新字段
        if update_data.status is not None:
            case.status = update_data.status
        if update_data.human_decision is not None:
            case.human_decision = update_data.human_decision
        if update_data.human_reasoning is not None:
            case.human_reasoning = update_data.human_reasoning
        
        case.updated_at = datetime.now()
        return case
    
    async def preprocess_case(self, case_id: str) -> Dict[str, Any]:
        """预处理仲裁案件 - 为人类仲裁官提供案情摘要"""
        case = self.cases.get(case_id)
        if not case:
            raise ValueError(f"仲裁案件 {case_id} 不存在")
        
        # 生成案情摘要
        summary = self._generate_case_summary(case)
        
        # 生成建议
        recommendations = self._generate_recommendations(case)
        
        return {
            "case_id": case_id,
            "summary": summary,
            "recommendations": recommendations,
            "disagreement_analysis": {
                "score": case.disagreement_score,
                "level": self._get_disagreement_level(case.disagreement_score),
                "description": self._get_disagreement_description(case.disagreement_score)
            },
            "preprocessed_at": datetime.now().isoformat()
        }
    
    async def get_statistics(self) -> Dict[str, Any]:
        """获取统计信息"""
        total_cases = len(self.cases)
        pending_cases = len([case for case in self.cases.values() if case.status == "pending"])
        resolved_cases = len([case for case in self.cases.values() if case.status == "resolved"])
        
        # 计算平均分歧度
        disagreement_scores = [case.disagreement_score for case in self.cases.values()]
        avg_disagreement = sum(disagreement_scores) / len(disagreement_scores) if disagreement_scores else 0
        
        return {
            "total_cases": total_cases,
            "pending_cases": pending_cases,
            "resolved_cases": resolved_cases,
            "average_disagreement_score": round(avg_disagreement, 3),
            "high_disagreement_cases": len([score for score in disagreement_scores if score > 0.7])
        }
    
    def _calculate_disagreement_score(
        self,
        qwen_analysis: Optional[AnalysisResult],
        doubao_analysis: Optional[SentimentAnalysis]
    ) -> float:
        """计算分歧度分数"""
        if not qwen_analysis or not doubao_analysis:
            return 0.0
        
        # 基于置信度和情感得分的差异计算分歧度
        confidence_diff = abs(qwen_analysis.confidence - doubao_analysis.score)
        
        # 如果情感分析是负面的，而事实分析是正面的，增加分歧度
        sentiment_factor = 0.0
        if doubao_analysis.sentiment == "negative" and qwen_analysis.confidence > 0.7:
            sentiment_factor = 0.3
        elif doubao_analysis.sentiment == "positive" and qwen_analysis.confidence < 0.3:
            sentiment_factor = 0.3
        
        disagreement_score = min(confidence_diff + sentiment_factor, 1.0)
        return round(disagreement_score, 3)
    
    def _generate_case_summary(self, case: ArbitrationCase) -> str:
        """生成案情摘要"""
        summary_parts = [
            f"案件ID: {case.case_id}",
            f"报告类型: {case.report_type}",
            f"目标代码: {case.target_code or 'N/A'}",
            f"分歧度: {case.disagreement_score:.2f}",
            f"状态: {case.status}"
        ]
        
        if case.qwen_analysis:
            summary_parts.append(f"Qwen分析: {case.qwen_analysis.analysis[:100]}...")
        
        if case.doubao_analysis:
            summary_parts.append(f"豆包情感: {case.doubao_analysis.sentiment} (得分: {case.doubao_analysis.score:.2f})")
        
        return "\n".join(summary_parts)
    
    def _generate_recommendations(self, case: ArbitrationCase) -> List[str]:
        """生成建议"""
        recommendations = []
        
        if case.disagreement_score > 0.7:
            recommendations.append("高分歧度案件，建议优先处理")
            recommendations.append("建议详细审查两个AI的分析结果")
        
        if case.status == "pending" and case.disagreement_score > 0.5:
            recommendations.append("建议进行人工仲裁")
        
        if case.qwen_analysis and case.qwen_analysis.confidence < 0.5:
            recommendations.append("Qwen分析置信度较低，建议补充更多数据")
        
        if case.doubao_analysis and case.doubao_analysis.score < 0.3:
            recommendations.append("市场情绪较为负面，建议关注风险因素")
        
        return recommendations
    
    def _get_disagreement_level(self, score: float) -> str:
        """获取分歧度等级"""
        if score < 0.3:
            return "低"
        elif score < 0.7:
            return "中"
        else:
            return "高"
    
    def _get_disagreement_description(self, score: float) -> str:
        """获取分歧度描述"""
        if score < 0.3:
            return "两个AI的分析结果基本一致，分歧较小"
        elif score < 0.7:
            return "两个AI的分析结果存在一定分歧，需要关注"
        else:
            return "两个AI的分析结果存在显著分歧，需要人工仲裁"
