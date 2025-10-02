"""
量化导航仪后端服务 - FastAPI主应用
版本: v13.1 Python全栈架构
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from src.api.admin import admin_router
from src.api.ai_router import ai_router
from src.api.calculation_router import calculation_router
from src.api.data_router import data_router
from src.api.reports import reports_router
from src.api.workflow import workflow_router
from src.core.config import settings
from src.core.logging_config import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理 - 简化版本，遵循YAGNI原则"""
    # 启动时执行
    setup_logging()
    logging.info("量化导航仪后端服务启动 - v13.3")

    # 简单的服务初始化（按需时再添加复杂管理）
    logging.info("服务初始化完成")

    yield

    # 关闭时执行
    logging.info("量化导航仪后端服务关闭")


# 创建FastAPI应用
app = FastAPI(
    title="量化导航仪后端服务",
    description="AI驱动的量化分析平台后端API",
    version="13.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# 添加中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)


# 健康检查端点
@app.get("/health")
async def health_check():
    """健康检查端点，用于CI/CD流水线"""
    return {"status": "healthy", "version": "13.1.0"}


# 简化的服务监控端点（按需时再添加复杂监控）
@app.get("/services/health")
async def services_health():
    """简化的服务健康检查状态"""
    return {
        "status": "healthy",
        "services": ["llm_service"],
        "timestamp": "2025-01-26T10:00:00Z",
    }


@app.get("/services/metrics")
async def services_metrics():
    """简化的服务运行指标"""
    return {
        "total_services": 1,
        "healthy_services": 1,
        "timestamp": "2025-01-26T10:00:00Z",
    }


# 注册路由
app.include_router(admin_router, prefix="/api/v1/admin", tags=["管理后台"])
app.include_router(reports_router, prefix="/api/v1/reports", tags=["报告管理"])
app.include_router(workflow_router, prefix="/api/v1/workflow", tags=["工作流"])
app.include_router(ai_router, prefix="/api/v1/ai", tags=["AI服务"])
app.include_router(calculation_router, prefix="/api/v1/calculation", tags=["计算服务"])
app.include_router(data_router, prefix="/api/v1/data", tags=["数据服务"])


@app.get("/")
async def root():
    """根路径健康检查"""
    return {
        "message": "量化导航仪后端服务运行中",
        "version": "13.1.0",
        "status": "healthy",
    }


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy", "timestamp": "2025-01-26T10:00:00Z"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level="info",
    )
