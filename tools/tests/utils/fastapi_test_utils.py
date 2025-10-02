"""
FastAPI 测试工具函数 (Python版本)
为 FastAPI + Python 后端提供专用的测试辅助工具
"""

import os
import time
import json
import asyncio
from typing import Dict, Any, Optional, Union
from datetime import datetime
import requests
from fastapi.testclient import TestClient
from fastapi import FastAPI


class FastAPITestUtils:
    """FastAPI 测试工具类"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """初始化测试工具
        
        Args:
            config: 测试配置,包含 base_url, host, port 等
        """
        self.config = {
            'base_url': os.getenv('API_BASE_URL', 'http://localhost:8000'),
            'host': os.getenv('FASTAPI_HOST', 'localhost'),
            'port': int(os.getenv('FASTAPI_PORT', '8000')),
            'health_endpoint': '/health',
            'docs_endpoint': '/docs',
            'redoc_endpoint': '/redoc',
            **(config or {})
        }
        self.client: Optional[TestClient] = None
    
    def create_test_client(self, app: FastAPI) -> TestClient:
        """创建 FastAPI 测试客户端
        
        Args:
            app: FastAPI 应用实例
            
        Returns:
            TestClient: FastAPI 测试客户端
        """
        self.client = TestClient(app)
        return self.client
    
    async def wait_for_service(self, timeout: int = 30) -> bool:
        """等待 FastAPI 服务启动
        
        Args:
            timeout: 超时时间（秒）
            
        Returns:
            bool: 服务是否启动成功
            
        Raises:
            TimeoutError: 服务启动超时
        """
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                response = requests.get(f"{self.config['base_url']}{self.config['health_endpoint']}")
                if response.status_code == 200:
                    print("✅ FastAPI 服务已启动")
                    return True
            except requests.exceptions.RequestException:
                # 服务未启动,继续等待
                pass
            
            await asyncio.sleep(1)
        
        raise TimeoutError(f"FastAPI 服务启动超时 ({timeout}s)")
    
    def check_health(self) -> bool:
        """检查服务健康状态
        
        Returns:
            bool: 服务是否健康
        """
        try:
            response = requests.get(f"{self.config['base_url']}{self.config['health_endpoint']}")
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False
    
    def create_test_data(self, data_type: str, overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """创建测试数据
        
        Args:
            data_type: 数据类型 (user, stock, report, arbitration_case, auth)
            overrides: 覆盖默认值的字段
            
        Returns:
            Dict[str, Any]: 测试数据
        """
        overrides = overrides or {}
        now = datetime.now().isoformat()
        
        base_data = {
            # 用户数据
            'user': {
                'id': 'test-user-id',
                'username': 'testuser',
                'email': 'test@example.com',
                'name': 'Test User',
                'role': 'admin',
                'created_at': now,
                **overrides
            },
            
            # 股票数据
            'stock': {
                'code': '000001',
                'name': '平安银行',
                'market': 'SZ',
                'industry': '银行',
                'created_at': now,
                **overrides
            },
            
            # 报告数据
            'report': {
                'id': 'test-report-id',
                'stock_code': '000001.SZ',
                'date': '2025-01-17',
                'content': 'Test report content',
                'report_type': 'fact_analysis',
                'created_at': now,
                **overrides
            },
            
            # 仲裁案件数据
            'arbitration_case': {
                'case_id': 'ARB_000001_20250117',
                'report_type': 'fact_analysis',
                'target_code': '000001.SZ',
                'qwen_analysis': {
                    'analysis': '基于财务数据分析,该股票基本面表现稳定',
                    'confidence': 0.85,
                    'reasoning': '基本面稳定,建议持有'
                },
                'doubao_analysis': {
                    'sentiment': 'positive',
                    'score': 0.75,
                    'reasoning': '市场情绪谨慎,建议观望'
                },
                'disagreement_score': 0.65,
                'status': 'pending',
                'consensus_summary': '两家AI均认为公司有投资价值',
                'conflict_summary': 'Qwen侧重基本面,豆包侧重短期市场情绪',
                'priority_score': 0.72,
                'created_at': now,
                'updated_at': now,
                **overrides
            },
            
            # 认证数据
            'auth': {
                'username': 'testuser',
                'password': 'testpassword123',
                'email': 'test@example.com',
                **overrides
            }
        }
        
        return base_data.get(data_type, overrides)
    
    def create_test_user(self, user_data: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """创建测试用户
        
        Args:
            user_data: 用户数据覆盖
            
        Returns:
            Optional[Dict[str, Any]]: 创建的用户数据或 None
        """
        user = self.create_test_data('user', user_data)
        
        try:
            response = requests.post(
                f"{self.config['base_url']}/auth/register",
                json=user,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                # 如果用户已存在,尝试登录
                return self.login_test_user(user)
        except requests.exceptions.RequestException as e:
            print(f"创建测试用户失败: {e}")
            return user
    
    def login_test_user(self, user_data: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """登录测试用户
        
        Args:
            user_data: 用户数据覆盖
            
        Returns:
            Optional[Dict[str, Any]]: 登录结果或 None
        """
        auth = self.create_test_data('auth', user_data)
        
        try:
            response = requests.post(
                f"{self.config['base_url']}/auth/login",
                json=auth,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                return response.json()
        except requests.exceptions.RequestException as e:
            print(f"登录测试用户失败: {e}")
        
        return None
    
    def cleanup_test_data(self) -> None:
        """清理测试数据"""
        try:
            requests.delete(f"{self.config['base_url']}/test/cleanup")
        except requests.exceptions.RequestException as e:
            print(f"清理测试数据失败: {e}")
    
    def create_test_case(self, case_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """创建测试案件
        
        Args:
            case_data: 案件数据覆盖
            
        Returns:
            Dict[str, Any]: 创建的案件数据
        """
        case = self.create_test_data('arbitration_case', case_data)
        
        try:
            response = requests.post(
                f"{self.config['base_url']}/api/v1/admin/arbitration-cases",
                json=case,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                return response.json()
        except requests.exceptions.RequestException as e:
            print(f"创建测试案件失败: {e}")
        
        return case
    
    def get_test_cases(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """获取测试案件列表
        
        Args:
            params: 查询参数
            
        Returns:
            Dict[str, Any]: 案件列表
        """
        try:
            response = requests.get(
                f"{self.config['base_url']}/api/v1/admin/arbitration-cases",
                params=params or {}
            )
            
            if response.status_code == 200:
                return response.json()
        except requests.exceptions.RequestException as e:
            print(f"获取测试案件失败: {e}")
        
        return {'cases': [], 'total': 0}
    
    def generate_test_id(self, prefix: str = 'TEST') -> str:
        """生成随机测试ID
        
        Args:
            prefix: ID前缀
            
        Returns:
            str: 测试ID
        """
        return f"{prefix}_{int(time.time())}_{hash(str(time.time())) % 1000000:06d}"
    
    def validate_fastapi_response(self, response: Any) -> bool:
        """验证 FastAPI 响应格式
        
        Args:
            response: 响应数据
            
        Returns:
            bool: 是否为有效响应
        """
        return response is not None and isinstance(response, (dict, list))
    
    def get_config(self) -> Dict[str, Any]:
        """获取配置信息
        
        Returns:
            Dict[str, Any]: 配置信息
        """
        return self.config.copy()
    
    def close(self) -> None:
        """关闭测试客户端"""
        if self.client:
            self.client.close()
            self.client = None


# 创建默认实例
fastapi_test_utils = FastAPITestUtils()

# 便捷函数
def create_fastapi_test_utils(config: Optional[Dict[str, Any]] = None) -> FastAPITestUtils:
    """创建 FastAPI 测试工具实例"""
    return FastAPITestUtils(config)

def wait_for_fastapi_service(timeout: int = 30) -> bool:
    """等待 FastAPI 服务启动"""
    return asyncio.run(fastapi_test_utils.wait_for_service(timeout))

def create_test_data(data_type: str, overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """创建测试数据"""
    return fastapi_test_utils.create_test_data(data_type, overrides)

def create_test_user(user_data: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """创建测试用户"""
    return fastapi_test_utils.create_test_user(user_data)

def cleanup_test_data() -> None:
    """清理测试数据"""
    fastapi_test_utils.cleanup_test_data()
