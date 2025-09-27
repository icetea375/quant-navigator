#!/usr/bin/env python3
"""
简化的测试API - 直接返回数据
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/api/v1/admin/arbitration-cases")
async def get_cases():
    """简化的案件列表API"""
    global case_status, arbitration_result

    return {
        "success": True,
        "message": "获取仲裁案件列表成功",
        "data": [
            {
                "case_id": "ARB_000001_20250925",
                "report_type": "fact_analysis",
                "target_code": "000001.SZ",
                "qwen_analysis": {
                    "analysis": "基于财务数据分析，该股票基本面表现稳定：营收增长15%，利润率维持在35%以上，现金流为正。建议持有观望。",
                    "confidence": 0.85,
                    "reasoning": "基本面稳定，建议持有",
                },
                "doubao_analysis": {
                    "sentiment": "positive",
                    "score": 0.75,
                    "reasoning": "市场情绪谨慎，建议观望",
                },
                "disagreement_score": 0.65,
                "status": "pending" if case_status == "PENDING_HUMAN" else "resolved",
                "consensus_summary": "两家AI均认为公司有投资价值，但侧重点不同。",
                "conflict_summary": "Qwen侧重基本面，豆包侧重短期市场情绪。",
                "priority_score": 0.72,
                "created_at": "2025-09-25T15:43:43.848182",
                "updated_at": "2025-09-25T15:43:43.848182",
                "human_decision": arbitration_result.get("human_decision")
                if arbitration_result
                else None,
                "human_reasoning": arbitration_result.get("final_recommendation")
                if arbitration_result
                else None,
            }
        ],
        "total": 1,
        "page": 1,
        "size": 10,
    }


@app.get("/api/v1/admin/arbitration-cases/{case_id}")
async def get_case_detail(case_id: str):
    """简化的案件详情API"""
    global case_status, arbitration_result

    if case_id == "ARB_000001_20250925":
        return {
            "success": True,
            "message": "获取案件详情成功",
            "data": {
                "id": 1,
                "case_id": "ARB_000001_20250925",
                "stock_code": "000001",
                "trade_date": "2025-09-25",
                "qwen_report_id": 1,
                "doubao_report_id": 2,
                "divergence_score": 0.65,
                "consensus_summary": "两家AI均认为公司有投资价值，但侧重点不同。",
                "conflict_summary": "Qwen侧重基本面，豆包侧重短期市场情绪。",
                "priority_score": 0.72,
                "status": case_status,
                "analysis_metadata": {"source": "test_script"},
                "human_decision": arbitration_result.get("human_decision")
                if arbitration_result
                else None,
                "final_recommendation": arbitration_result.get("final_recommendation")
                if arbitration_result
                else None,
                "final_confidence": arbitration_result.get("final_confidence")
                if arbitration_result
                else None,
                "human_arbitrator_id": arbitration_result.get("arbitrator_id")
                if arbitration_result
                else None,
                "qwen_analysis": {
                    "analysis": "基于财务数据分析，该股票基本面表现稳定：营收增长15%，利润率维持在35%以上，现金流为正。建议持有观望。",
                    "confidence": 0.85,
                    "reasoning": "基本面稳定，建议持有",
                    "sentiment_score": 0.6,
                    "keywords": ["财务数据", "营收增长", "利润率"],
                    "entities": ["公司A", "投资者", "媒体"],
                    "investment_recommendation": "HOLD",
                },
                "doubao_analysis": {
                    "analysis": "基于市场情绪分析：投资者情绪偏向谨慎，媒体关注度中等，技术面在关键支撑位震荡。建议等待明确信号。",
                    "confidence": 0.75,
                    "reasoning": "市场情绪谨慎，建议观望",
                    "sentiment_score": 0.75,
                    "keywords": ["市场情绪", "投资者", "媒体"],
                    "entities": ["公司A", "投资者", "媒体"],
                    "investment_recommendation": "HOLD",
                },
                "created_at": "2025-09-25T15:43:43.848182",
                "updated_at": "2025-09-25T15:43:43.848182",
            },
        }
    else:
        return {"success": False, "message": "案件不存在", "data": None}


# 全局变量来跟踪案件状态
case_status = "PENDING_HUMAN"
arbitration_result = None


@app.post("/api/v1/admin/arbitration-cases/{case_id}/feedback")
async def submit_arbitration_feedback(case_id: str, feedback_data: dict):
    """简化的仲裁反馈提交API"""
    global case_status, arbitration_result

    if case_id == "ARB_000001_20250925":
        # 更新案件状态为已仲裁
        case_status = "ARBITRATED"
        arbitration_result = {
            "case_id": case_id,
            "arbitrator_id": feedback_data.get("arbitrator_id", "admin_001"),
            "final_recommendation": feedback_data.get("final_recommendation", "BUY"),
            "final_confidence": feedback_data.get("final_confidence", 0.9),
            "human_decision": feedback_data.get(
                "human_decision", "基于双脑分析，建议买入"
            ),
            "decision_factors": feedback_data.get("decision_factors", {}),
            "submitted_at": "2025-01-17T12:00:00Z",
        }

        return {
            "success": True,
            "message": "仲裁判决提交成功",
            "data": arbitration_result,
        }
    else:
        return {"success": False, "message": "案件不存在", "data": None}


@app.get("/api/v1/admin/arbitration-cases/statistics")
async def get_statistics():
    """简化的统计API"""
    return {
        "success": True,
        "message": "获取统计信息成功",
        "data": {
            "total_cases": 1,
            "pending_cases": 1,
            "completed_cases": 0,
            "ignored_cases": 0,
            "status_breakdown": {"PENDING_HUMAN": 1},
            "avg_divergence_score": 0.65,
            "avg_priority_score": 0.72,
        },
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
