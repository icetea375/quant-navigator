"""
服务管理器 - 统一管理所有服务的生命周期
为微服务化做准备，当前作为单体应用的服务协调器
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from contextlib import asynccontextmanager

from src.core.service_base import ServiceBase, ServiceRegistry, service_registry
from src.services.llm_service import LLMService
from src.services.arbitration_service import ArbitrationService
from src.services.report_service import ReportService
from src.services.simple_workflow_service import SimpleWorkflowService


class ServiceManager:
    """
    服务管理器 - 负责所有服务的注册、初始化和生命周期管理
    
    在微服务化时，这个类可以替换为服务发现和配置中心
    """
    
    def __init__(self):
        self.logger = logging.getLogger("services.manager")
        self._services: Dict[str, ServiceBase] = {}
        self._is_initialized = False
    
    async def initialize_all_services(self) -> None:
        """初始化所有服务"""
        if self._is_initialized:
            return
        
        self.logger.info("开始初始化所有服务...")
        
        # 创建服务实例
        self._create_services()
        
        # 设置服务依赖关系
        self._setup_dependencies()
        
        # 注册到服务注册中心
        for service in self._services.values():
            service_registry.register(service)
        
        # 初始化所有服务
        await service_registry.initialize_all()
        
        self._is_initialized = True
        self.logger.info("所有服务初始化完成")
    
    async def shutdown_all_services(self) -> None:
        """关闭所有服务"""
        if not self._is_initialized:
            return
        
        self.logger.info("开始关闭所有服务...")
        await service_registry.shutdown_all()
        self._is_initialized = False
        self.logger.info("所有服务关闭完成")
    
    def _create_services(self) -> None:
        """创建所有服务实例"""
        # 核心服务 - 暂时只创建已重构的服务
        self._services["llm_service"] = LLMService()
        # TODO: 重构其他服务继承ServiceBase
        # self._services["arbitration_service"] = ArbitrationService()
        # self._services["report_service"] = ReportService()
        # self._services["workflow_service"] = SimpleWorkflowService()
        
        self.logger.info(f"创建了 {len(self._services)} 个服务实例")
    
    def _setup_dependencies(self) -> None:
        """设置服务依赖关系"""
        # 暂时没有其他服务，跳过依赖设置
        self.logger.info("服务依赖关系设置完成（暂时无依赖）")
    
    def get_service(self, name: str) -> Optional[ServiceBase]:
        """获取服务实例"""
        return self._services.get(name)
    
    async def get_all_health_checks(self) -> Dict[str, Any]:
        """获取所有服务的健康检查状态"""
        health_status = {}
        
        for name, service in self._services.items():
            try:
                health_status[name] = await service.health_check()
            except Exception as e:
                health_status[name] = {
                    "service_name": name,
                    "status": "unhealthy",
                    "error": str(e),
                    "timestamp": self._get_timestamp()
                }
        
        return health_status
    
    async def get_all_metrics(self) -> Dict[str, Any]:
        """获取所有服务的指标"""
        metrics = {}
        
        for name, service in self._services.items():
            try:
                metrics[name] = await service.get_metrics()
            except Exception as e:
                metrics[name] = {
                    "service_name": name,
                    "error": str(e),
                    "timestamp": self._get_timestamp()
                }
        
        return metrics
    
    @asynccontextmanager
    async def service_context(self):
        """服务上下文管理器"""
        await self.initialize_all_services()
        try:
            yield self
        finally:
            await self.shutdown_all_services()
    
    def _get_timestamp(self) -> str:
        """获取当前时间戳"""
        from datetime import datetime
        return datetime.now().isoformat()


# 全局服务管理器实例
service_manager = ServiceManager()


# 便捷函数
async def get_service(name: str) -> Optional[ServiceBase]:
    """获取服务的便捷函数"""
    return service_manager.get_service(name)


async def initialize_services() -> None:
    """初始化所有服务的便捷函数"""
    await service_manager.initialize_all_services()


async def shutdown_services() -> None:
    """关闭所有服务的便捷函数"""
    await service_manager.shutdown_all_services()


async def get_health_status() -> Dict[str, Any]:
    """获取健康状态的便捷函数"""
    return await service_manager.get_all_health_checks()


async def get_metrics() -> Dict[str, Any]:
    """获取指标的便捷函数"""
    return await service_manager.get_all_metrics()
