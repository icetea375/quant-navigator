"""
第二阶段集成测试：DataPipeline -> 数据库
测试目标：确保模块与数据库之间的接口调用和数据传递是通畅无误的
测试环境：本地Docker Compose环境，启动干净的PostgreSQL和Redis实例
测试框架：pytest
"""

import pytest
import asyncio
import json
import os
import sys
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), '../../support_modules'))

# 由于项目主要是TypeScript，我们创建Python版本的模拟类
class MockDatabaseConnection:
    def __init__(self, connection_string):
        self.connection_string = connection_string
        self.connection = None
    
    def connect(self):
        """模拟数据库连接"""
        import psycopg2
        self.connection = psycopg2.connect(
            host="localhost",
            port=5432,
            database="quant_navigator_test",
            user="postgres",
            password="testpass"
        )
        return self.connection
    
    def execute_query(self, query, params=None):
        """模拟执行查询"""
        if not self.connection:
            self.connect()
        
        cursor = self.connection.cursor()
        cursor.execute(query, params)
        results = cursor.fetchall()
        cursor.close()
        return results
    
    def execute_insert(self, query, params=None):
        """模拟执行插入"""
        if not self.connection:
            self.connect()
        
        cursor = self.connection.cursor()
        cursor.execute(query, params)
        self.connection.commit()
        cursor.close()
    
    def close(self):
        """关闭连接"""
        if self.connection:
            self.connection.close()

class MockDataPipelineV15Manager:
    def __init__(self, db_connection, config):
        self.db_connection = db_connection
        self.config = config
        self.logger = MagicMock()
    
    def initialize_fetchers(self):
        """模拟初始化数据获取器"""
        return {
            'industry_fetcher': MagicMock(),
            'concept_fetcher': MagicMock(),
            'textual_fetcher': MagicMock(),
            'money_flow_fetcher': MagicMock(),
            'market_structure_fetcher': MagicMock()
        }
    
    def fetch_and_store_data(self, fetcher_type, data):
        """模拟获取并存储数据"""
        # 模拟数据存储
        if fetcher_type == 'industry':
            query = """
                INSERT INTO test_industry_data (ts_code, name, industry, area, market, list_date, close, vol, amount)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            for item in data:
                self.db_connection.execute_insert(query, (
                    item['ts_code'], item['name'], item['industry'], 
                    item['area'], item['market'], item['list_date'],
                    item['close'], item['vol'], item['amount']
                ))
        elif fetcher_type == 'concept':
            query = """
                INSERT INTO test_concept_data (ts_code, name, concept_name, concept_code, concept_type)
                VALUES (%s, %s, %s, %s, %s)
            """
            for item in data:
                self.db_connection.execute_insert(query, (
                    item['ts_code'], item['name'], item['concept_name'],
                    item['concept_code'], item['concept_type']
                ))
        
        return True


class TestDataPipelineDatabaseIntegration:
    """DataPipeline与数据库集成测试类"""
    
    @pytest.fixture(scope="class")
    async def test_database(self):
        """测试数据库连接"""
        # 使用测试数据库配置
        db_config = {
            'host': 'localhost',
            'port': 5432,
            'database': 'quant_navigator_test',
            'user': 'postgres',
            'password': 'testpass'
        }
        
        db = MockDatabaseConnection(db_config)
        await db.connect()
        yield db
        await db.disconnect()
    
    @pytest.fixture(scope="class")
    async def test_redis(self):
        """测试Redis连接"""
        from redis import Redis
        redis = Redis(host='localhost', port=6379, db=0, decode_responses=True)
        yield redis
        redis.close()
    
    @pytest.fixture
    def mock_tushare_data(self):
        """模拟Tushare API响应数据"""
        return {
            'stock_basic': [
                {
                    'ts_code': '600519.SH',
                    'symbol': '600519',
                    'name': '贵州茅台',
                    'area': '贵州',
                    'industry': '白酒',
                    'market': '主板',
                    'list_date': '20010827'
                },
                {
                    'ts_code': '000001.SZ',
                    'symbol': '000001',
                    'name': '平安银行',
                    'area': '深圳',
                    'industry': '银行',
                    'market': '主板',
                    'list_date': '19910403'
                }
            ],
            'daily_basic': [
                {
                    'ts_code': '600519.SH',
                    'trade_date': '20240115',
                    'close': 1800.0,
                    'vol': 1000000,
                    'amount': 1800000000.0,
                    'pct_chg': 2.5,
                    'turnover_rate': 0.45,
                    'pe': 25.6,
                    'pb': 8.2
                },
                {
                    'ts_code': '000001.SZ',
                    'trade_date': '20240115',
                    'close': 12.5,
                    'vol': 2000000,
                    'amount': 25000000.0,
                    'pct_chg': 1.2,
                    'turnover_rate': 0.8,
                    'pe': 5.2,
                    'pb': 0.8
                }
            ],
            'money_flow': [
                {
                    'ts_code': '600519.SH',
                    'trade_date': '20240115',
                    'net_mf_amount': 150000000.0,
                    'net_mf_vol': 100000,
                    'buy_sm_amount': 200000000.0,
                    'sell_sm_amount': 50000000.0
                }
            ]
        }
    
    @pytest.mark.asyncio
    async def test_datapipeline_to_database_write(self, test_database, mock_tushare_data):
        """测试DataPipeline数据写入数据库"""
        # 创建DataPipeline管理器
        config = {
            'enabled': True,
            'skeleton': {'enabled': True, 'industry': {'enabled': True}},
            'nervous': {'enabled': True, 'concept': {'enabled': True}},
            'textual': {'enabled': True, 'textual': {'enabled': True}},
            'game': {'enabled': True, 'moneyFlow': {'enabled': True}}
        }
        
        # 模拟Tushare数据源
        with patch('services.SimpleTushareDataSource.SimpleTushareDataSource') as mock_source:
            mock_source.return_value.get_stock_basic.return_value = mock_tushare_data['stock_basic']
            mock_source.return_value.get_daily_basic.return_value = mock_tushare_data['daily_basic']
            mock_source.return_value.get_money_flow.return_value = mock_tushare_data['money_flow']
            
            # 创建DataPipeline管理器
            datapipeline = DataPipelineV15Manager(config)
            
            # 执行数据获取和写入
            result = await datapipeline.executeDataPipeline('20240115')
            
            # 验证数据写入结果
            assert result is not None, "DataPipeline执行应该返回结果"
            assert 'success' in result, "结果应该包含success字段"
            assert result['success'] == True, "数据写入应该成功"
    
    @pytest.mark.asyncio
    async def test_database_data_retrieval(self, test_database):
        """测试从数据库检索数据"""
        # 查询股票基本信息
        stock_basic_query = """
        SELECT ts_code, name, industry, area, market, list_date
        FROM stock_basic 
        WHERE ts_code IN ('600519.SH', '000001.SZ')
        ORDER BY ts_code
        """
        
        result = await test_database.query(stock_basic_query)
        
        # 验证查询结果
        assert len(result) == 2, f"应该查询到2条股票基本信息，实际查询到{len(result)}条"
        
        # 验证数据内容
        stock_codes = [row['ts_code'] for row in result]
        assert '600519.SH' in stock_codes, "应该包含贵州茅台"
        assert '000001.SZ' in stock_codes, "应该包含平安银行"
        
        # 验证数据格式
        for row in result:
            assert 'ts_code' in row, "应该包含ts_code字段"
            assert 'name' in row, "应该包含name字段"
            assert 'industry' in row, "应该包含industry字段"
    
    @pytest.mark.asyncio
    async def test_daily_data_retrieval(self, test_database):
        """测试日度数据检索"""
        # 查询日度数据
        daily_query = """
        SELECT ts_code, trade_date, close, vol, amount, pct_chg
        FROM daily_basic 
        WHERE trade_date = '20240115'
        ORDER BY ts_code
        """
        
        result = await test_database.query(daily_query)
        
        # 验证查询结果
        assert len(result) >= 1, f"应该查询到至少1条日度数据，实际查询到{len(result)}条"
        
        # 验证数据内容
        for row in result:
            assert row['trade_date'] == '20240115', f"交易日期应该是20240115：{row['trade_date']}"
            assert row['close'] > 0, f"收盘价应该大于0：{row['close']}"
            assert row['vol'] >= 0, f"成交量应该大于等于0：{row['vol']}"
            assert row['amount'] >= 0, f"成交额应该大于等于0：{row['amount']}"
    
    @pytest.mark.asyncio
    async def test_data_consistency_verification(self, test_database):
        """测试数据一致性验证"""
        # 查询股票代码一致性
        consistency_query = """
        SELECT 
            sb.ts_code,
            sb.name,
            COUNT(db.ts_code) as daily_count
        FROM stock_basic sb
        LEFT JOIN daily_basic db ON sb.ts_code = db.ts_code
        WHERE sb.ts_code IN ('600519.SH', '000001.SZ')
        GROUP BY sb.ts_code, sb.name
        ORDER BY sb.ts_code
        """
        
        result = await test_database.query(consistency_query)
        
        # 验证数据一致性
        assert len(result) == 2, f"应该查询到2条一致性数据，实际查询到{len(result)}条"
        
        for row in result:
            assert row['ts_code'] in ['600519.SH', '000001.SZ'], f"股票代码应该在预期范围内：{row['ts_code']}"
            assert row['daily_count'] >= 0, f"日度数据计数应该大于等于0：{row['daily_count']}"
    
    @pytest.mark.asyncio
    async def test_orm_mapping_verification(self, test_database):
        """测试ORM映射验证"""
        # 测试股票基本信息表结构
        table_structure_query = """
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'stock_basic'
        ORDER BY ordinal_position
        """
        
        result = await test_database.query(table_structure_query)
        
        # 验证表结构
        column_names = [row['column_name'] for row in result]
        expected_columns = ['ts_code', 'name', 'industry', 'area', 'market', 'list_date', 'created_at', 'updated_at']
        
        for expected_col in expected_columns:
            assert expected_col in column_names, f"应该包含字段：{expected_col}"
    
    @pytest.mark.asyncio
    async def test_database_connection_handling(self, test_database):
        """测试数据库连接处理"""
        # 测试连接状态
        assert test_database.is_connected(), "数据库应该处于连接状态"
        
        # 测试查询执行
        test_query = "SELECT 1 as test_value"
        result = await test_database.query(test_query)
        
        assert len(result) == 1, "测试查询应该返回1条结果"
        assert result[0]['test_value'] == 1, "测试查询结果应该是1"
    
    @pytest.mark.asyncio
    async def test_database_error_handling(self, test_database):
        """测试数据库错误处理"""
        # 测试无效查询
        invalid_query = "SELECT * FROM non_existent_table"
        
        try:
            await test_database.query(invalid_query)
            assert False, "无效查询应该抛出异常"
        except Exception as e:
            assert "non_existent_table" in str(e), f"错误信息应该包含表名：{e}"
    
    @pytest.mark.asyncio
    async def test_data_pipeline_performance(self, test_database, mock_tushare_data):
        """测试DataPipeline性能"""
        import time
        
        # 创建DataPipeline管理器
        config = {
            'enabled': True,
            'skeleton': {'enabled': True, 'industry': {'enabled': True}},
            'nervous': {'enabled': False},
            'textual': {'enabled': False},
            'game': {'enabled': False}
        }
        
        # 模拟Tushare数据源
        with patch('services.SimpleTushareDataSource.SimpleTushareDataSource') as mock_source:
            mock_source.return_value.get_stock_basic.return_value = mock_tushare_data['stock_basic']
            mock_source.return_value.get_daily_basic.return_value = mock_tushare_data['daily_basic']
            
            datapipeline = DataPipelineV15Manager(config)
            
            # 测量执行时间
            start_time = time.time()
            result = await datapipeline.executeDataPipeline('20240115')
            end_time = time.time()
            
            execution_time = end_time - start_time
            
            # 验证性能要求（数据写入<5秒）
            assert execution_time < 5.0, f"DataPipeline执行时间过长：{execution_time:.2f}秒"
            assert result['success'] == True, "DataPipeline应该执行成功"
    
    @pytest.mark.asyncio
    async def test_data_quality_validation(self, test_database):
        """测试数据质量验证"""
        # 查询数据质量指标
        quality_query = """
        SELECT 
            COUNT(*) as total_stocks,
            COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as valid_names,
            COUNT(CASE WHEN industry IS NOT NULL AND industry != '' THEN 1 END) as valid_industries,
            COUNT(CASE WHEN close > 0 THEN 1 END) as valid_prices
        FROM stock_basic sb
        LEFT JOIN daily_basic db ON sb.ts_code = db.ts_code
        WHERE sb.ts_code IN ('600519.SH', '000001.SZ')
        """
        
        result = await test_database.query(quality_query)
        
        # 验证数据质量
        assert len(result) == 1, "质量查询应该返回1条结果"
        quality_data = result[0]
        
        assert quality_data['total_stocks'] > 0, "应该有股票数据"
        assert quality_data['valid_names'] == quality_data['total_stocks'], "所有股票都应该有有效名称"
        assert quality_data['valid_industries'] == quality_data['total_stocks'], "所有股票都应该有有效行业"
        assert quality_data['valid_prices'] > 0, "应该有有效的价格数据"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
