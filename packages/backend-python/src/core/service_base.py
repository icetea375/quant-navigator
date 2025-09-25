"""
服务基类 - 为微服务化预留接口
所有业务服务都应该继承此基类，确保未来可以无缝拆分为微服务
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, TypeVar, Generic
from datetime import datetime
import logging
import asyncio
from contextlib import asynccontextmanager

T = TypeVar('T')

class ServiceBase(ABC, Generic[T]):
    """
    服务基类 - 定义所有服务的标准接口
    
    这个基类确保了：
    1. 所有服务都有统一的接口规范
    2. 服务之间通过标准化的方法通信
    3. 未来可以轻松拆分为独立的微服务
    4. 支持依赖注入和服务发现
    """
    
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.logger = logging.getLogger(f"services.{service_name}")
        self._dependencies: Dict[str, 'ServiceBase'] = {}
        self._is_initialized = False
    
    async def initialize(self) -> None:
        """初始化服务"""
        if self._is_initialized:
            return
        
        self.logger.info(f"初始化服务: {self.service_name}")
        await self._on_initialize()
        self._is_initialized = True
        self.logger.info(f"服务初始化完成: {self.service_name}")
    
    async def shutdown(self) -> None:
        """关闭服务"""
        if not self._is_initialized:
            return
        
        self.logger.info(f"关闭服务: {self.service_name}")
        await self._on_shutdown()
        self._is_initialized = False
        self.logger.info(f"服务关闭完成: {self.service_name}")
    
    def add_dependency(self, name: str, service: 'ServiceBase') -> None:
        """添加服务依赖"""
        self._dependencies[name] = service
        self.logger.debug(f"添加依赖: {name} -> {service.service_name}")
    
    def get_dependency(self, name: str) -> Optional['ServiceBase']:
        """获取服务依赖"""
        return self._dependencies.get(name)
    
    @asynccontextmanager
    async def service_context(self):
        """服务上下文管理器"""
        await self.initialize()
        try:
            yield self
        finally:
            await self.shutdown()
    
    # 抽象方法 - 子类必须实现
    @abstractmethod
    async def _on_initialize(self) -> None:
        """服务初始化时的自定义逻辑"""
        pass
    
    @abstractmethod
    async def _on_shutdown(self) -> None:
        """服务关闭时的自定义逻辑"""
        pass
    
    # 标准服务接口 - 所有服务都应该实现
    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """健康检查 - 用于服务发现和监控"""
        return {
            "service_name": self.service_name,
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "dependencies": list(self._dependencies.keys())
        }
    
    @abstractmethod
    async def get_metrics(self) -> Dict[str, Any]:
        """获取服务指标 - 用于监控和告警"""
        return {
            "service_name": self.service_name,
            "is_initialized": self._is_initialized,
            "dependency_count": len(self._dependencies),
            "timestamp": datetime.now().isoformat()
        }


class ServiceRegistry:
    """
    服务注册中心 - 管理所有服务的生命周期和依赖关系
    
    在微服务化时，这个类可以替换为服务发现机制（如Consul、Eureka等）
    """
    
    def __init__(self):
        self._services: Dict[str, ServiceBase] = {}
        self._logger = logging.getLogger("services.registry")
    
    def register(self, service: ServiceBase) -> None:
        """注册服务"""
        self._services[service.service_name] = service
        self._logger.info(f"注册服务: {service.service_name}")
    
    def get_service(self, name: str) -> Optional[ServiceBase]:
        """获取服务"""
        return self._services.get(name)
    
    async def initialize_all(self) -> None:
        """初始化所有服务"""
        self._logger.info("开始初始化所有服务...")
        
        # 按依赖关系排序初始化
        initialized = set()
        for service in self._services.values():
            await self._initialize_service_recursive(service, initialized)
        
        self._logger.info("所有服务初始化完成")
    
    async def shutdown_all(self) -> None:
        """关闭所有服务"""
        self._logger.info("开始关闭所有服务...")
        
        for service in reversed(list(self._services.values())):
            await service.shutdown()
        
        self._logger.info("所有服务关闭完成")
    
    async def _initialize_service_recursive(self, service: ServiceBase, initialized: set) -> None:
        """递归初始化服务及其依赖"""
        if service.service_name in initialized:
            return
        
        # 先初始化依赖
        for dep_name, dep_service in service._dependencies.items():
            await self._initialize_service_recursive(dep_service, initialized)
        
        # 再初始化当前服务
        await service.initialize()
        initialized.add(service.service_name)
    
    def get_all_services(self) -> Dict[str, ServiceBase]:
        """获取所有服务"""
        return self._services.copy()


# 全局服务注册中心
service_registry = ServiceRegistry()


def get_service(name: str) -> Optional[ServiceBase]:
    """获取服务的便捷函数"""
    return service_registry.get_service(name)


def register_service(service: ServiceBase) -> None:
    """注册服务的便捷函数"""
    service_registry.register(service)
