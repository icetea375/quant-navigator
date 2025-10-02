"""
测试辅助工具 - FastAPI 版本
基于全流程测试计划v1.0
"""

from fastapi.testclient import TestClient
from fastapi import FastAPI
from typing import Dict, List, Any, Optional
import pytest
import asyncio
import json
import random
from datetime import datetime, timedelta
import logging

# 设置日志
logger = logging.getLogger(__name__)

# 测试数据类型定义
class StockPriceData:
    def __init__(self, ts_code: str, trade_date: str, open_price: float, 
                 high: float, low: float, close: float, vol: int, amount: float):
        self.ts_code = ts_code
        self.trade_date = trade_date
        self.open = open_price
        self.high = high
        self.low = low
        self.close = close
        self.vol = vol
        self.amount = amount

class NewsData:
    def __init__(self, id: int, title: str, content: str, 
                 publish_time: str, source: str, sentiment: str):
        self.id = id
        self.title = title
        self.content = content
        self.publish_time = publish_time
        self.source = source
        self.sentiment = sentiment

class ConfigData:
    def __init__(self, id: int, config_type: str, config_key: str, 
                 config_value: str, description: str, is_active: bool):
        self.id = id
        self.config_type = config_type
        self.config_key = config_key
        self.config_value = config_value
        self.description = description
        self.is_active = is_active
        self.created_at = datetime.now()
        self.updated_at = datetime.now()

class TestHelpers:
    """测试辅助工具类"""
    
    @staticmethod
    def create_test_client(app: FastAPI) -> TestClient:
        """创建FastAPI测试客户端"""
        from httpx import ASGITransport
        transport = ASGITransport(app=app)
        return TestClient(transport=transport)
    
    @staticmethod
    async def wait(ms: int) -> None:
        """等待指定时间"""
        await asyncio.sleep(ms / 1000)
    
    @staticmethod
    def generate_test_data(data_type: str, count: int = 10) -> List[Any]:
        """生成测试数据"""
        if data_type == 'stock_prices':
            return TestHelpers._generate_stock_price_data(count)
        elif data_type == 'news':
            return TestHelpers._generate_news_data(count)
        elif data_type == 'configs':
            return TestHelpers._generate_config_data(count)
        else:
            return []
    
    @staticmethod
    def validate_api_response(response: Any, expected_fields: List[str]) -> bool:
        """验证API响应格式"""
        if not hasattr(response, 'json'):
            return False
        
        try:
            data = response.json()
            return all(field in data for field in expected_fields)
        except:
            return False
    
    @staticmethod
    def validate_error_response(response: Any) -> bool:
        """验证错误响应"""
        return (response.status_code >= 400 and 
                hasattr(response, 'json') and 
                ('error' in response.json() or 'message' in response.json()))
    
    @staticmethod
    def _generate_stock_price_data(count: int) -> List[StockPriceData]:
        """生成股票价格测试数据"""
        data = []
        symbols = ['000001.SZ', '000002.SZ', '600000.SH', '600036.SH']
        
        for i in range(count):
            symbol = symbols[i % len(symbols)]
            base_price = 10 + random.random() * 90
            
            data.append(StockPriceData(
                ts_code=symbol,
                trade_date=TestHelpers._generate_random_date(),
                open_price=base_price,
                high=base_price * (1 + random.random() * 0.1),
                low=base_price * (1 - random.random() * 0.1),
                close=base_price * (1 + (random.random() - 0.5) * 0.2),
                vol=random.randint(1000, 1000000),
                amount=random.randint(100000, 10000000)
            ))
        
        return data
    
    @staticmethod
    def _generate_news_data(count: int) -> List[NewsData]:
        """生成新闻测试数据"""
        data = []
        titles = [
            '公司发布重大公告',
            '行业政策利好',
            '市场波动加剧',
            '技术突破创新',
            '合作项目签约'
        ]
        
        for i in range(count):
            data.append(NewsData(
                id=i + 1,
                title=titles[i % len(titles)],
                content=f'这是第{i + 1}条测试新闻内容...',
                publish_time=datetime.now().isoformat(),
                source='测试来源',
                sentiment='positive' if random.random() > 0.5 else 'negative'
            ))
        
        return data
    
    @staticmethod
    def _generate_config_data(count: int) -> List[ConfigData]:
        """生成配置测试数据"""
        data = []
        types = ['database', 'api', 'cache', 'logging']
        keys = ['host', 'port', 'timeout', 'retry_count']
        
        for i in range(count):
            data.append(ConfigData(
                id=i + 1,
                config_type=types[i % len(types)],
                config_key=keys[i % len(keys)],
                config_value=f'test_value_{i + 1}',
                description=f'测试配置项 {i + 1}',
                is_active=True
            ))
        
        return data
    
    @staticmethod
    def _generate_random_date() -> str:
        """生成随机日期"""
        start = datetime(2024, 1, 1)
        end = datetime(2024, 12, 31)
        random_time = start + timedelta(
            seconds=random.randint(0, int((end - start).total_seconds()))
        )
        return random_time.strftime('%Y%m%d')
    
    @staticmethod
    def create_mock_database():
        """模拟数据库操作"""
        class MockDatabase:
            def query(self, sql):
                return []
            
            def transaction(self):
                return self
            
            def connect(self):
                pass
            
            def disconnect(self):
                pass
        
        return MockDatabase()
    
    @staticmethod
    def create_mock_redis():
        """模拟Redis操作"""
        class MockRedis:
            def __init__(self):
                self._data = {}
            
            def get(self, key):
                return self._data.get(key)
            
            def set(self, key, value):
                self._data[key] = value
            
            def delete(self, key):
                self._data.pop(key, None)
            
            def exists(self, key):
                return key in self._data
            
            def expire(self, key, seconds):
                pass
        
        return MockRedis()
    
    @staticmethod
    def create_mock_http_service():
        """模拟外部API调用"""
        class MockHttpService:
            def get(self, url, **kwargs):
                return {'status_code': 200, 'json': lambda: {}}
            
            def post(self, url, **kwargs):
                return {'status_code': 200, 'json': lambda: {}}
            
            def put(self, url, **kwargs):
                return {'status_code': 200, 'json': lambda: {}}
            
            def delete(self, url, **kwargs):
                return {'status_code': 200, 'json': lambda: {}}
        
        return MockHttpService()

# 导出主要类
__all__ = ['TestHelpers', 'StockPriceData', 'NewsData', 'ConfigData']
