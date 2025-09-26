"""
报告管理API路由
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from src.schemas.reports import (
    ReportCreate,
    ReportListResponse,
    ReportResponse,
    ReportUpdate,
)
from src.services.report_service import ReportService

reports_router = APIRouter()


@reports_router.get("/", response_model=ReportListResponse)
async def get_reports(
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页数量"),
    report_type: Optional[str] = Query(None, description="报告类型筛选"),
    target_code: Optional[str] = Query(None, description="目标代码筛选"),
):
    """获取报告列表"""
    try:
        service = ReportService()
        result = await service.get_reports(
            page=page, size=size, report_type=report_type, target_code=target_code
        )
        return ReportListResponse(
            success=True,
            message="获取报告列表成功",
            data=result["data"],
            total=result["total"],
            page=page,
            size=size,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取报告列表失败: {e!s}")


@reports_router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: int):
    """获取单个报告详情"""
    try:
        service = ReportService()
        report = await service.get_report_by_id(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="报告不存在")

        return ReportResponse(success=True, message="获取报告详情成功", data=report)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取报告详情失败: {e!s}")


@reports_router.post("/", response_model=ReportResponse)
async def create_report(report_data: ReportCreate):
    """创建新报告"""
    try:
        service = ReportService()
        report = await service.create_report(report_data)
        return ReportResponse(success=True, message="创建报告成功", data=report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建报告失败: {e!s}")


@reports_router.put("/{report_id}", response_model=ReportResponse)
async def update_report(report_id: int, update_data: ReportUpdate):
    """更新报告"""
    try:
        service = ReportService()
        report = await service.update_report(report_id, update_data)
        if not report:
            raise HTTPException(status_code=404, detail="报告不存在")

        return ReportResponse(success=True, message="更新报告成功", data=report)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新报告失败: {e!s}")


@reports_router.delete("/{report_id}")
async def delete_report(report_id: int):
    """删除报告"""
    try:
        service = ReportService()
        success = await service.delete_report(report_id)
        if not success:
            raise HTTPException(status_code=404, detail="报告不存在")

        return {"success": True, "message": "删除报告成功"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除报告失败: {e!s}")
