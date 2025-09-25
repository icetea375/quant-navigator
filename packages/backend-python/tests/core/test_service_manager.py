"""
服务管理器测试 - 验证微服务化准备
"""

import pytest
from unittest.mock import Mock, patch
from src.core.service_manager import ServiceManager, service_manager
from src.services.llm_service import LLMService


class TestServiceManager:
    """服务管理器测试类"""
    
    @pytest.fixture
    def manager(self):
        """创建服务管理器实例"""
        return ServiceManager()
    
    @pytest.mark.asyncio
    async def test_service_initialization(self, manager):
        """测试服务初始化"""
        # Act - 初始化所有服务
        await manager.initialize_all_services()
        
        # Assert - 验证服务已初始化
        assert manager._is_initialized is True
        assert len(manager._services) > 0
        
        # 验证核心服务存在（暂时只有LLM服务）
        assert "llm_service" in manager._services
        # TODO: 其他服务稍后添加
        # assert "arbitration_service" in manager._services
        # assert "report_service" in manager._services
        # assert "workflow_service" in manager._services
    
    @pytest.mark.asyncio
    async def test_service_shutdown(self, manager):
        """测试服务关闭"""
        # Arrange - 先初始化服务
        await manager.initialize_all_services()
        assert manager._is_initialized is True
        
        # Act - 关闭所有服务
        await manager.shutdown_all_services()
        
        # Assert - 验证服务已关闭
        assert manager._is_initialized is False
    
    @pytest.mark.asyncio
    async def test_get_service(self, manager):
        """测试获取服务"""
        # Arrange
        await manager.initialize_all_services()
        
        # Act
        llm_service = manager.get_service("llm_service")
        
        # Assert
        assert llm_service is not None
        assert isinstance(llm_service, LLMService)
        assert llm_service.service_name == "llm_service"
    
    @pytest.mark.asyncio
    async def test_get_nonexistent_service(self, manager):
        """测试获取不存在的服务"""
        # Arrange
        await manager.initialize_all_services()
        
        # Act
        service = manager.get_service("nonexistent_service")
        
        # Assert
        assert service is None
    
    @pytest.mark.asyncio
    async def test_health_checks(self, manager):
        """测试健康检查"""
        # Arrange
        await manager.initialize_all_services()
        
        # Act
        health_status = await manager.get_all_health_checks()
        
        # Assert
        assert isinstance(health_status, dict)
        assert "llm_service" in health_status
        assert health_status["llm_service"]["status"] == "healthy"
        assert "service_name" in health_status["llm_service"]
        assert "timestamp" in health_status["llm_service"]
    
    @pytest.mark.asyncio
    async def test_metrics(self, manager):
        """测试指标获取"""
        # Arrange
        await manager.initialize_all_services()
        
        # Act
        metrics = await manager.get_all_metrics()
        
        # Assert
        assert isinstance(metrics, dict)
        assert "llm_service" in metrics
        assert "service_name" in metrics["llm_service"]
        assert "is_initialized" in metrics["llm_service"]
        assert "timestamp" in metrics["llm_service"]
    
    @pytest.mark.asyncio
    async def test_service_dependencies(self, manager):
        """测试服务依赖关系"""
        # Arrange
        await manager.initialize_all_services()
        
        # Act
        llm_service = manager.get_service("llm_service")
        
        # Assert
        assert llm_service is not None
        assert llm_service.service_name == "llm_service"
        
        # TODO: 当其他服务重构完成后，测试依赖关系
    
    @pytest.mark.asyncio
    async def test_double_initialization(self, manager):
        """测试重复初始化"""
        # Arrange & Act
        await manager.initialize_all_services()
        await manager.initialize_all_services()  # 第二次初始化
        
        # Assert - 应该不会出错
        assert manager._is_initialized is True
    
    @pytest.mark.asyncio
    async def test_service_context_manager(self, manager):
        """测试服务上下文管理器"""
        # Act & Assert
        async with manager.service_context() as ctx:
            assert ctx._is_initialized is True
            assert len(ctx._services) > 0
        
        # 上下文退出后，服务应该被关闭
        assert manager._is_initialized is False
    
    @pytest.mark.asyncio
    async def test_global_service_manager(self):
        """测试全局服务管理器"""
        # Act
        await service_manager.initialize_all_services()
        
        # Assert
        assert service_manager._is_initialized is True
        
        # 清理
        await service_manager.shutdown_all_services()
        assert service_manager._is_initialized is False
