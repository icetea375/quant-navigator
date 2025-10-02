"""
测试数据管理器 - FastAPI 版本
基于全流程测试计划v1.0
"""

import os
import json
import csv
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta
import random
import logging

# 设置日志
logger = logging.getLogger(__name__)

# 测试数据类型定义
class TestDataItem:
    def __init__(self, data: Dict[str, Any]):
        self.data = data
    
    def to_dict(self) -> Dict[str, Any]:
        return self.data

class TestDataset:
    def __init__(self, id: str, name: str, data_type: str, 
                 data: List[TestDataItem], description: str = ""):
        self.id = id
        self.name = name
        self.type = data_type  # 'historical', 'mock', 'fixture'
        self.data = data
        self.metadata = {
            'created_at': datetime.now(),
            'size': len(data),
            'description': description
        }

class HistoricalDataConfig:
    def __init__(self, start_date: str, end_date: str, 
                 symbols: List[str], data_types: List[str]):
        self.start_date = start_date
        self.end_date = end_date
        self.symbols = symbols
        self.data_types = data_types

class TestDataManager:
    """测试数据管理器"""
    
    def __init__(self, base_path: str = "tools/tests/data"):
        self.base_path = Path(base_path)
        self.datasets: Dict[str, TestDataset] = {}
        self._ensure_directories()
    
    def _ensure_directories(self):
        """确保必要的目录存在"""
        directories = [
            self.base_path,
            self.base_path / "fixtures",
            self.base_path / "mocks", 
            self.base_path / "datasets",
            self.base_path / "historical"
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
    
    def create_dataset(self, id: str, name: str, data_type: str, 
                      data: List[Dict[str, Any]], description: str = "") -> TestDataset:
        """创建测试数据集"""
        test_data = [TestDataItem(item) for item in data]
        dataset = TestDataset(id, name, data_type, test_data, description)
        self.datasets[id] = dataset
        return dataset
    
    def load_dataset(self, id: str) -> Optional[TestDataset]:
        """加载测试数据集"""
        if id in self.datasets:
            return self.datasets[id]
        
        # 尝试从文件加载
        file_path = self.base_path / "datasets" / f"{id}.json"
        if file_path.exists():
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    dataset = self._deserialize_dataset(data)
                    self.datasets[id] = dataset
                    return dataset
            except Exception as e:
                logger.error(f"加载数据集失败 {id}: {e}")
                return None
        
        return None
    
    def save_dataset(self, dataset: TestDataset) -> bool:
        """保存测试数据集"""
        try:
            file_path = self.base_path / "datasets" / f"{dataset.id}.json"
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(self._serialize_dataset(dataset), f, 
                         ensure_ascii=False, indent=2, default=str)
            return True
        except Exception as e:
            logger.error(f"保存数据集失败 {dataset.id}: {e}")
            return False
    
    def generate_historical_data(self, config: HistoricalDataConfig) -> TestDataset:
        """生成历史数据"""
        data = []
        current_date = datetime.strptime(config.start_date, '%Y-%m-%d')
        end_date = datetime.strptime(config.end_date, '%Y-%m-%d')
        
        while current_date <= end_date:
            for symbol in config.symbols:
                for data_type in config.data_types:
                    if data_type == 'stock_prices':
                        item = self._generate_stock_price_item(symbol, current_date)
                    elif data_type == 'news':
                        item = self._generate_news_item(current_date)
                    else:
                        continue
                    
                    data.append(item)
            
            current_date += timedelta(days=1)
        
        dataset = self.create_dataset(
            f"historical_{config.start_date}_{config.end_date}",
            f"历史数据 {config.start_date} 到 {config.end_date}",
            "historical",
            data,
            f"包含 {len(config.symbols)} 个股票的历史数据"
        )
        
        return dataset
    
    def generate_mock_data(self, data_type: str, count: int = 100) -> TestDataset:
        """生成模拟数据"""
        data = []
        
        for i in range(count):
            if data_type == 'arbitration_cases':
                item = self._generate_arbitration_case(i)
            elif data_type == 'reports':
                item = self._generate_report(i)
            elif data_type == 'users':
                item = self._generate_user(i)
            else:
                item = {'id': i, 'type': data_type, 'data': f'mock_data_{i}'}
            
            data.append(item)
        
        dataset = self.create_dataset(
            f"mock_{data_type}_{count}",
            f"模拟数据 {data_type} ({count}条)",
            "mock",
            data,
            f"包含 {count} 条 {data_type} 类型的模拟数据"
        )
        
        return dataset
    
    def load_fixture(self, fixture_name: str) -> Optional[TestDataset]:
        """加载测试夹具"""
        file_path = self.base_path / "fixtures" / f"{fixture_name}.json"
        if not file_path.exists():
            return None
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                dataset = self._deserialize_dataset(data)
                self.datasets[dataset.id] = dataset
                return dataset
        except Exception as e:
            logger.error(f"加载夹具失败 {fixture_name}: {e}")
            return None
    
    def save_fixture(self, dataset: TestDataset, fixture_name: str) -> bool:
        """保存测试夹具"""
        try:
            file_path = self.base_path / "fixtures" / f"{fixture_name}.json"
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(self._serialize_dataset(dataset), f, 
                         ensure_ascii=False, indent=2, default=str)
            return True
        except Exception as e:
            logger.error(f"保存夹具失败 {fixture_name}: {e}")
            return False
    
    def cleanup_test_data(self, dataset_id: str) -> bool:
        """清理测试数据"""
        try:
            if dataset_id in self.datasets:
                del self.datasets[dataset_id]
            
            # 删除文件
            file_path = self.base_path / "datasets" / f"{dataset_id}.json"
            if file_path.exists():
                file_path.unlink()
            
            return True
        except Exception as e:
            logger.error(f"清理测试数据失败 {dataset_id}: {e}")
            return False
    
    def _generate_stock_price_item(self, symbol: str, date: datetime) -> Dict[str, Any]:
        """生成股票价格数据项"""
        base_price = 10 + random.random() * 90
        return {
            'ts_code': symbol,
            'trade_date': date.strftime('%Y%m%d'),
            'open': round(base_price, 2),
            'high': round(base_price * (1 + random.random() * 0.1), 2),
            'low': round(base_price * (1 - random.random() * 0.1), 2),
            'close': round(base_price * (1 + (random.random() - 0.5) * 0.2), 2),
            'vol': random.randint(1000, 1000000),
            'amount': random.randint(100000, 10000000)
        }
    
    def _generate_news_item(self, date: datetime) -> Dict[str, Any]:
        """生成新闻数据项"""
        titles = [
            '公司发布重大公告',
            '行业政策利好',
            '市场波动加剧',
            '技术突破创新',
            '合作项目签约'
        ]
        
        return {
            'id': random.randint(1, 10000),
            'title': random.choice(titles),
            'content': f'这是{date.strftime("%Y-%m-%d")}的测试新闻内容...',
            'publish_time': date.isoformat(),
            'source': '测试来源',
            'sentiment': random.choice(['positive', 'negative', 'neutral'])
        }
    
    def _generate_arbitration_case(self, index: int) -> Dict[str, Any]:
        """生成仲裁案件数据"""
        return {
            'id': f'ARB_{index:06d}_{datetime.now().strftime("%Y%m%d")}',
            'title': f'仲裁案件 {index}',
            'description': f'这是第 {index} 个仲裁案件的描述',
            'status': random.choice(['pending', 'in_progress', 'completed']),
            'priority': random.choice(['low', 'medium', 'high']),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
    
    def _generate_report(self, index: int) -> Dict[str, Any]:
        """生成报告数据"""
        return {
            'id': f'RPT_{index:06d}',
            'title': f'报告 {index}',
            'content': f'这是第 {index} 个报告的内容',
            'type': random.choice(['daily', 'weekly', 'monthly']),
            'status': random.choice(['draft', 'published', 'archived']),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
    
    def _generate_user(self, index: int) -> Dict[str, Any]:
        """生成用户数据"""
        return {
            'id': f'USER_{index:06d}',
            'username': f'user_{index}',
            'email': f'user_{index}@example.com',
            'full_name': f'用户 {index}',
            'role': random.choice(['admin', 'user', 'viewer']),
            'is_active': True,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
    
    def _serialize_dataset(self, dataset: TestDataset) -> Dict[str, Any]:
        """序列化数据集"""
        return {
            'id': dataset.id,
            'name': dataset.name,
            'type': dataset.type,
            'data': [item.to_dict() for item in dataset.data],
            'metadata': {
                'created_at': dataset.metadata['created_at'].isoformat(),
                'size': dataset.metadata['size'],
                'description': dataset.metadata['description']
            }
        }
    
    def _deserialize_dataset(self, data: Dict[str, Any]) -> TestDataset:
        """反序列化数据集"""
        test_data = [TestDataItem(item) for item in data['data']]
        dataset = TestDataset(
            data['id'],
            data['name'],
            data['type'],
            test_data,
            data['metadata']['description']
        )
        dataset.metadata['created_at'] = datetime.fromisoformat(
            data['metadata']['created_at'])
        return dataset

# 导出主要类
__all__ = ['TestDataManager', 'TestDataset', 'TestDataItem', 'HistoricalDataConfig']
