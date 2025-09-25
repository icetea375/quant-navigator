"""
量化导航仪后端服务 - FastAPI主应用
版本: v13.1 Python全栈架构
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from src.core.config import settings
from src.core.logging_config import setup_logging
from src.api.admin import admin_router
from src.api.reports import reports_router
from src.api.workflow import workflow_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    setup_logging()
    logging.info("量化导航仪后端服务启动 - v13.1")
    
    # 初始化所有服务
    from src.core.service_manager import service_manager
    await service_manager.initialize_all_services()
    
    yield
    
    # 关闭时执行
    await service_manager.shutdown_all_services()
    logging.info("量化导航仪后端服务关闭")


# 创建FastAPI应用
app = FastAPI(
    title="量化导航仪后端服务",
    description="AI驱动的量化分析平台后端API",
    version="13.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 添加中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# 健康检查端点
@app.get("/health")
async def health_check():
    """健康检查端点，用于CI/CD流水线"""
    return {"status": "healthy", "version": "13.1.0"}

# 服务监控端点
@app.get("/services/health")
async def services_health():
    """所有服务的健康检查状态"""
    from src.core.service_manager import get_health_status
    return await get_health_status()

@app.get("/services/metrics")
async def services_metrics():
    """所有服务的运行指标"""
    from src.core.service_manager import get_metrics
    return await get_metrics()

# 注册路由
app.include_router(admin_router, prefix="/api/v1/admin", tags=["管理后台"])
app.include_router(reports_router, prefix="/api/v1/reports", tags=["报告管理"])
app.include_router(workflow_router, prefix="/api/v1/workflow", tags=["工作流"])


@app.get("/")
async def root():
    """根路径健康检查"""
    return {
        "message": "量化导航仪后端服务运行中",
        "version": "13.1.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "timestamp": "2025-01-26T10:00:00Z"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
