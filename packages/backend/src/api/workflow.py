"""
工作流API路由
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from datetime import date
from src.services.simple_workflow_service import SimpleWorkflowService as WorkflowService

workflow_router = APIRouter()


@workflow_router.post("/run-daily-flow")
async def run_daily_flow(
    background_tasks: BackgroundTasks,
    target_date: str = None
):
    """运行日常分析工作流"""
    try:
        service = WorkflowService()
        
        # 如果没有指定日期，使用今天
        if not target_date:
            target_date = date.today().isoformat()
        
        # 在后台运行工作流
        background_tasks.add_task(
            service.run_daily_flow,
            target_date
        )
        
        return {
            "success": True,
            "message": f"日常分析工作流已启动，目标日期: {target_date}",
            "target_date": target_date
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"启动日常分析工作流失败: {str(e)}")


@workflow_router.post("/run-historical-backfill")
async def run_historical_backfill(
    background_tasks: BackgroundTasks,
    start_date: str,
    end_date: str
):
    """运行历史数据回填工作流"""
    try:
        service = WorkflowService()
        
        # 在后台运行历史回填
        background_tasks.add_task(
            service.run_historical_backfill,
            start_date,
            end_date
        )
        
        return {
            "success": True,
            "message": f"历史数据回填工作流已启动，日期范围: {start_date} 到 {end_date}",
            "start_date": start_date,
            "end_date": end_date
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"启动历史数据回填工作流失败: {str(e)}")


@workflow_router.get("/status/{workflow_id}")
async def get_workflow_status(workflow_id: str):
    """获取工作流状态"""
    try:
        service = WorkflowService()
        status = await service.get_workflow_status(workflow_id)
        
        if not status:
            raise HTTPException(status_code=404, detail="工作流不存在")
        
        return {
            "success": True,
            "message": "获取工作流状态成功",
            "data": status
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取工作流状态失败: {str(e)}")


@workflow_router.get("/logs/{workflow_id}")
async def get_workflow_logs(workflow_id: str):
    """获取工作流日志"""
    try:
        service = WorkflowService()
        logs = await service.get_workflow_logs(workflow_id)
        
        return {
            "success": True,
            "message": "获取工作流日志成功",
            "data": logs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取工作流日志失败: {str(e)}")
