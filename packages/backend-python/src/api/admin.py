"""
管理后台API路由
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from src.schemas.arbitration import (
    ArbitrationCaseListResponse,
    ArbitrationCaseResponse,
    ArbitrationCaseUpdate,
)
from src.services.arbitration_service import ArbitrationService

admin_router = APIRouter()


@admin_router.get("/arbitration-cases", response_model=ArbitrationCaseListResponse)
async def get_arbitration_cases(
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页数量"),
    status: Optional[str] = Query(None, description="状态筛选"),
    target_code: Optional[str] = Query(None, description="目标代码筛选"),
):
    """获取仲裁案件列表"""
    try:
        service = ArbitrationService()
        result = await service.get_cases(
            page=page, size=size, status=status, target_code=target_code
        )
        return ArbitrationCaseListResponse(
            success=True,
            message="获取仲裁案件列表成功",
            data=result["data"],
            total=result["total"],
            page=page,
            size=size,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取仲裁案件列表失败: {e!s}")


@admin_router.get(
    "/arbitration-cases/{case_id}", response_model=ArbitrationCaseResponse
)
async def get_arbitration_case(case_id: str):
    """获取单个仲裁案件详情"""
    try:
        service = ArbitrationService()
        case = await service.get_case_by_id(case_id)
        if not case:
            raise HTTPException(status_code=404, detail="仲裁案件不存在")

        return ArbitrationCaseResponse(
            success=True, message="获取仲裁案件详情成功", data=case
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取仲裁案件详情失败: {e!s}")


@admin_router.put(
    "/arbitration-cases/{case_id}", response_model=ArbitrationCaseResponse
)
async def update_arbitration_case(case_id: str, update_data: ArbitrationCaseUpdate):
    """更新仲裁案件"""
    try:
        service = ArbitrationService()
        case = await service.update_case(case_id, update_data)
        if not case:
            raise HTTPException(status_code=404, detail="仲裁案件不存在")

        return ArbitrationCaseResponse(
            success=True, message="更新仲裁案件成功", data=case
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新仲裁案件失败: {e!s}")


@admin_router.get("/arbitration-cases/{case_id}/preprocess")
async def preprocess_arbitration_case(case_id: str):
    """预处理仲裁案件 - 为人类仲裁官提供案情摘要"""
    try:
        service = ArbitrationService()
        result = await service.preprocess_case(case_id)
        return {"success": True, "message": "仲裁案件预处理完成", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"预处理仲裁案件失败: {e!s}")


@admin_router.get("/statistics")
async def get_admin_statistics():
    """获取管理后台统计信息"""
    try:
        service = ArbitrationService()
        stats = await service.get_statistics()
        return {"success": True, "message": "获取统计信息成功", "data": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {e!s}")
