"""
量化导航仪数据服务 - FastAPI应用
提供数据处理、计算和AI任务的核心服务
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger.info("启动数据服务...")
    # 启动时初始化
    yield
    # 关闭时清理
    logger.info("关闭数据服务...")

# 创建FastAPI应用
app = FastAPI(
    title="量化导航仪数据服务",
    description="提供数据处理、计算和AI任务的核心服务",
    version="1.0.0",
    lifespan=lifespan
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """根路径健康检查"""
    return {"message": "量化导航仪数据服务运行中", "status": "healthy"}

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy", "service": "data-services"}

# 导入API路由
from .api import data_router, calculation_router, ai_router

# 注册路由
app.include_router(data_router, prefix="/api/v1/data", tags=["数据服务"])
app.include_router(calculation_router, prefix="/api/v1/calculation", tags=["计算服务"])
app.include_router(ai_router, prefix="/api/v1/ai", tags=["AI服务"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
