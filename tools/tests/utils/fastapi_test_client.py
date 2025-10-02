"""
FastAPI TestClient 测试工具
为集成测试提供统一的 FastAPI TestClient 配置
"""

import os
import sys
from typing import Optional, Dict, Any
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# 添加后端Python包路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../../packages/backend-python/src'))

try:
    from src.main import app
except ImportError as e:
    print(f"Warning: Could not import FastAPI app: {e}")
    app = None


class FastAPITestClient:
    """FastAPI TestClient 封装类"""
    
    def __init__(self, app_instance=None):
        """
        初始化 FastAPI TestClient
        
        Args:
            app_instance: FastAPI 应用实例,如果为 None 则使用默认的 app
        """
        if app_instance is None:
            app_instance = app
        
        if app_instance is None:
            raise ImportError("FastAPI app not available. Please ensure the backend is properly configured.")
        
        self.client = TestClient(app_instance)
        self._setup_test_environment()
    
    def _setup_test_environment(self):
        """设置测试环境"""
        # 设置测试环境变量
        os.environ.setdefault('TESTING', 'true')
        os.environ.setdefault('DATABASE_URL', 'sqlite:///test.db')
        os.environ.setdefault('REDIS_URL', 'redis://localhost:6379/1')
        
        # 禁用一些中间件以提高测试性能
        self._disable_middleware_for_testing()
    
    def _disable_middleware_for_testing(self):
        """为测试禁用某些中间件"""
        # 这里可以添加禁用特定中间件的逻辑
        pass
    
    def get(self, url: str, headers: Optional[Dict[str, str]] = None, **kwargs) -> Any:
        """发送 GET 请求"""
        return self.client.get(url, headers=headers, **kwargs)
    
    def post(self, url: str, json: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None, **kwargs) -> Any:
        """发送 POST 请求"""
        return self.client.post(url, json=json, headers=headers, **kwargs)
    
    def put(self, url: str, json: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None, **kwargs) -> Any:
        """发送 PUT 请求"""
        return self.client.put(url, json=json, headers=headers, **kwargs)
    
    def delete(self, url: str, headers: Optional[Dict[str, str]] = None, **kwargs) -> Any:
        """发送 DELETE 请求"""
        return self.client.delete(url, headers=headers, **kwargs)
    
    def patch(self, url: str, json: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None, **kwargs) -> Any:
        """发送 PATCH 请求"""
        return self.client.patch(url, json=json, headers=headers, **kwargs)
    
    def options(self, url: str, headers: Optional[Dict[str, str]] = None, **kwargs) -> Any:
        """发送 OPTIONS 请求"""
        return self.client.options(url, headers=headers, **kwargs)


class MockServiceProvider:
    """模拟服务提供者"""
    
    @staticmethod
    def mock_arbitration_service():
        """模拟仲裁服务"""
        mock_service = MagicMock()
        mock_service.get_cases.return_value = {
            "data": [],
            "total": 0,
            "page": 1,
            "size": 10,
            "pages": 0
        }
        mock_service.get_case_by_id.return_value = None
        mock_service.update_case.return_value = None
        mock_service.preprocess_case.return_value = {"summary": "测试摘要"}
        mock_service.get_statistics.return_value = {
            "total_cases": 0,
            "pending_cases": 0,
            "completed_cases": 0
        }
        return mock_service
    
    @staticmethod
    def mock_report_service():
        """模拟报告服务"""
        mock_service = MagicMock()
        mock_service.get_reports.return_value = {
            "data": [],
            "total": 0,
            "page": 1,
            "size": 10,
            "pages": 0
        }
        mock_service.get_report_by_id.return_value = None
        mock_service.create_report.return_value = {
            "id": "test_report_001",
            "title": "测试报告",
            "content": "测试内容",
            "created_at": "2024-01-01T00:00:00Z"
        }
        mock_service.update_report.return_value = None
        mock_service.delete_report.return_value = True
        mock_service.compare_reports.return_value = {"similarity": 0.85}
        mock_service.get_statistics.return_value = {
            "total_reports": 0,
            "reports_by_type": {}
        }
        return mock_service
    
    @staticmethod
    def mock_workflow_adapter():
        """模拟工作流适配器"""
        mock_service = MagicMock()
        mock_service.run_daily_flow.return_value = None
        mock_service.run_historical_backfill.return_value = None
        mock_service.get_workflow_status.return_value = {
            "id": "workflow_001",
            "status": "completed",
            "progress": 100
        }
        mock_service.get_workflow_logs.return_value = [
            {"level": "INFO", "message": "工作流开始", "timestamp": "2024-01-01T00:00:00Z"}
        ]
        return mock_service
    
    @staticmethod
    def mock_data_pipeline_service():
        """模拟数据管道服务"""
        mock_service = MagicMock()
        mock_service.fetch_market_data.return_value = {
            "stock_code": "000001.SZ",
            "trade_date": "2024-01-17",
            "price_data": [
                {"date": "2024-01-17", "open": 10.0, "high": 11.0, "low": 9.5, "close": 10.5, "volume": 1000000}
            ],
            "basic_data": [
                {"pe_ratio": 8.5, "pb_ratio": 1.2, "ps_ratio": 2.1, "dividend_yield": 0.03, "market_cap": 20000000000}
            ]
        }
        mock_service.extract_financial_factors.return_value = {
            "pe_ratio": 8.5,
            "pb_ratio": 1.2,
            "ps_ratio": 2.1,
            "dividend_yield": 0.03,
            "market_cap": 20000000000
        }
        mock_service.fetch_tushare_data.return_value = {"data": "mock_tushare_data"}
        mock_service.process_market_data.return_value = {
            "stock_code": "000001.SZ",
            "processed_data": "mock_processed_data"
        }
        return mock_service
    
    @staticmethod
    def mock_quant_signal_service():
        """模拟量化信号服务"""
        mock_service = MagicMock()
        mock_service.calculate_quant_signal.return_value = {
            "signal_id": "signal_001",
            "target_code": "000001.SZ",
            "signal_type": "INDIVIDUAL",
            "status": "ACTIVE",
            "signal_date": "2024-01-17T00:00:00Z",
            "confidence": 0.85,
            "direction": "BUY"
        }
        mock_service.save_quant_signal.return_value = {
            "signal_id": "signal_001",
            "target_code": "000001.SZ",
            "signal_type": "INDIVIDUAL",
            "status": "ACTIVE"
        }
        mock_service.delete_quant_signal.return_value = True
        mock_service.get_quant_signal_by_id.return_value = {
            "signal_id": "signal_001",
            "target_code": "000001.SZ",
            "signal_type": "INDIVIDUAL",
            "status": "ACTIVE"
        }
        return mock_service


def create_test_client(app_instance=None) -> FastAPITestClient:
    """
    创建 FastAPI TestClient 实例
    
    Args:
        app_instance: FastAPI 应用实例
        
    Returns:
        FastAPITestClient 实例
    """
    return FastAPITestClient(app_instance)


def with_mock_services(*service_names):
    """
    装饰器：为测试方法提供模拟服务
    
    Args:
        *service_names: 要模拟的服务名称列表
    """
    def decorator(test_func):
        def wrapper(self, *args, **kwargs):
            patches = []
            try:
                # 为每个服务创建模拟
                for service_name in service_names:
                    if service_name == 'arbitration_service':
                        patch_path = 'src.api.admin.ArbitrationService'
                        mock_service = MockServiceProvider.mock_arbitration_service()
                    elif service_name == 'report_service':
                        patch_path = 'src.api.reports.ReportService'
                        mock_service = MockServiceProvider.mock_report_service()
                    elif service_name == 'workflow_adapter':
                        patch_path = 'src.api.workflow.WorkflowAdapter'
                        mock_service = MockServiceProvider.mock_workflow_adapter()
                    elif service_name == 'data_pipeline_service':
                        patch_path = 'src.services.data_pipeline_service.DataPipelineService'
                        mock_service = MockServiceProvider.mock_data_pipeline_service()
                    elif service_name == 'quant_signal_service':
                        patch_path = 'src.services.quant_signal_service.QuantSignalService'
                        mock_service = MockServiceProvider.mock_quant_signal_service()
                    else:
                        continue
                    
                    patcher = patch(patch_path, return_value=mock_service)
                    patcher.start()
                    patches.append(patcher)
                
                # 执行测试
                return test_func(self, *args, **kwargs)
            finally:
                # 清理所有补丁
                for patcher in patches:
                    patcher.stop()
        
        return wrapper
    return decorator
