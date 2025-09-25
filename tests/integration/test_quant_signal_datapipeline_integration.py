"""
第二阶段集成测试：QuantSignalEngine -> DataPipeline
测试目标：确保QuantSignalEngine与DataPipeline之间的"读-算-写"链路是通畅的
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
sys.path.append(os.path.join(os.path.dirname(__file__), '../../backend/src'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../../support_modules'))

from database.connection import DatabaseConnection
from services.QuantSignalEngine import QuantSignalEngine
from services.DataPipelineV15Manager import DataPipelineV15Manager
from engines.QuantSignalEngine import QuantSignalEngine as EngineQuantSignalEngine


class TestQuantSignalDataPipelineIntegration:
    """QuantSignalEngine与DataPipeline集成测试类"""
    
    @pytest.fixture(scope="class")
    async def test_database(self):
        """测试数据库连接"""
        db_config = {
            'host': 'localhost',
            'port': 5432,
            'database': 'quant_navigator_test',
            'user': 'postgres',
            'password': 'testpass'
        }
        
        db = DatabaseConnection(db_config)
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
    def sample_price_data(self):
        """准备样本价格数据"""
        # 生成90天的价格数据
        dates = pd.date_range('2024-01-01', periods=90, freq='D')
        base_price = 1800.0
        price_changes = np.random.normal(0, 0.02, 90)  # 2%的日波动率
        prices = [base_price]
        
        for change in price_changes[1:]:
            prices.append(prices[-1] * (1 + change))
        
        return pd.DataFrame({
            'ts_code': ['600519.SH'] * 90,
            'trade_date': [d.strftime('%Y%m%d') for d in dates],
            'close': prices,
            'vol': np.random.normal(1000000, 100000, 90),
            'amount': [p * v for p, v in zip(prices, np.random.normal(1000000, 100000, 90))],
            'pct_chg': price_changes * 100,
            'turnover_rate': np.random.normal(0.5, 0.1, 90)
        })
    
    @pytest.fixture
    def sample_index_data(self):
        """准备样本指数数据"""
        dates = pd.date_range('2024-01-01', periods=90, freq='D')
        base_index = 4000.0
        index_changes = np.random.normal(0, 0.015, 90)  # 1.5%的日波动率
        indices = [base_index]
        
        for change in index_changes[1:]:
            indices.append(indices[-1] * (1 + change))
        
        return pd.DataFrame({
            'ts_code': ['000300.SH'] * 90,
            'trade_date': [d.strftime('%Y%m%d') for d in dates],
            'close': indices,
            'pct_chg': index_changes * 100
        })
    
    @pytest.mark.asyncio
    async def test_data_pipeline_to_quant_signal_data_flow(self, test_database, sample_price_data, sample_index_data):
        """测试DataPipeline到QuantSignalEngine的数据流"""
        # 1. 先通过DataPipeline写入数据到数据库
        await self._setup_test_data(test_database, sample_price_data, sample_index_data)
        
        # 2. 创建QuantSignalEngine实例
        quant_config = {
            'enabled': True,
            'signalTypes': {
                'macroRisk': {'enabled': True, 'updateInterval': 3600},
                'marketStyle': {'enabled': True, 'updateInterval': 3600},
                'quantFingerprint': {'enabled': True, 'updateInterval': 3600}
            },
            'universe': {
                'broadIndex': ['000300.SH'],
                'primaryIndex': ['000001.SH'],
                'secondaryIndex': ['399001.SZ'],
                'leadingStocks': ['600519.SH']
            }
        }
        
        quant_engine = QuantSignalEngine(test_database, quant_config)
        
        # 3. 从数据库读取数据
        price_data = await quant_engine.getRecentPriceData('600519.SH')
        
        # 验证数据读取
        assert len(price_data) == 90, f"应该读取到90天的价格数据，实际读取到{len(price_data)}天"
        assert price_data[0]['ts_code'] == '600519.SH', "股票代码应该正确"
        assert 'close' in price_data[0], "应该包含收盘价字段"
        assert 'vol' in price_data[0], "应该包含成交量字段"
    
    @pytest.mark.asyncio
    async def test_quant_signal_calculation_and_storage(self, test_database, sample_price_data, sample_index_data):
        """测试量化信号计算和存储"""
        # 1. 准备数据
        await self._setup_test_data(test_database, sample_price_data, sample_index_data)
        
        # 2. 创建QuantSignalEngine
        quant_config = {
            'enabled': True,
            'signalTypes': {
                'macroRisk': {'enabled': True, 'updateInterval': 3600},
                'marketStyle': {'enabled': True, 'updateInterval': 3600},
                'quantFingerprint': {'enabled': True, 'updateInterval': 3600}
            },
            'universe': {
                'broadIndex': ['000300.SH'],
                'primaryIndex': ['000001.SH'],
                'secondaryIndex': ['399001.SZ'],
                'leadingStocks': ['600519.SH']
            }
        }
        
        quant_engine = QuantSignalEngine(test_database, quant_config)
        
        # 3. 计算基础信号
        await quant_engine.calculateBasicSignals('600519.SH')
        
        # 4. 验证信号计算和存储
        signals = await quant_engine.getSignalsByStock('600519.SH')
        
        assert len(signals) > 0, "应该计算出至少一个信号"
        
        # 验证信号数据结构
        for signal in signals:
            assert 'signal_type' in signal, "信号应该包含类型字段"
            assert 'signal_value' in signal, "信号应该包含数值字段"
            assert 'z_score' in signal, "信号应该包含Z分数字段"
            assert 'calculated_at' in signal, "信号应该包含计算时间字段"
    
    @pytest.mark.asyncio
    async def test_complex_signal_calculation_flow(self, test_database, sample_price_data, sample_index_data):
        """测试复杂信号计算流程"""
        # 1. 准备数据
        await self._setup_test_data(test_database, sample_price_data, sample_index_data)
        
        # 2. 创建QuantSignalEngine
        quant_config = {
            'enabled': True,
            'signalTypes': {
                'macroRisk': {'enabled': True, 'updateInterval': 3600},
                'marketStyle': {'enabled': True, 'updateInterval': 3600},
                'quantFingerprint': {'enabled': True, 'updateInterval': 3600}
            },
            'universe': {
                'broadIndex': ['000300.SH'],
                'primaryIndex': ['000001.SH'],
                'secondaryIndex': ['399001.SZ'],
                'leadingStocks': ['600519.SH']
            }
        }
        
        quant_engine = QuantSignalEngine(test_database, quant_config)
        
        # 3. 计算复杂信号
        await quant_engine.calculateComplexSignals('600519.SH')
        
        # 4. 验证复杂信号存储
        complex_signals = await quant_engine.getComplexSignalsByStock('600519.SH')
        
        assert len(complex_signals) > 0, "应该计算出复杂信号"
        
        # 验证复杂信号包含所有类型
        signal_types = [signal['signal_type'] for signal in complex_signals]
        expected_types = ['individual_z_score', 'macro_risk_z_score', 'market_style_z_score', 'quant_fingerprint_z_score']
        
        for expected_type in expected_types:
            assert expected_type in signal_types, f"应该包含{expected_type}信号"
    
    @pytest.mark.asyncio
    async def test_signal_consistency_across_calculations(self, test_database, sample_price_data, sample_index_data):
        """测试信号计算的一致性"""
        # 1. 准备数据
        await self._setup_test_data(test_database, sample_price_data, sample_index_data)
        
        # 2. 创建QuantSignalEngine
        quant_config = {
            'enabled': True,
            'signalTypes': {
                'macroRisk': {'enabled': True, 'updateInterval': 3600},
                'marketStyle': {'enabled': True, 'updateInterval': 3600},
                'quantFingerprint': {'enabled': True, 'updateInterval': 3600}
            },
            'universe': {
                'broadIndex': ['000300.SH'],
                'primaryIndex': ['000001.SH'],
                'secondaryIndex': ['399001.SZ'],
                'leadingStocks': ['600519.SH']
            }
        }
        
        quant_engine = QuantSignalEngine(test_database, quant_config)
        
        # 3. 多次计算相同信号
        await quant_engine.calculateBasicSignals('600519.SH')
        signals_1 = await quant_engine.getSignalsByStock('600519.SH')
        
        await quant_engine.calculateBasicSignals('600519.SH')
        signals_2 = await quant_engine.getSignalsByStock('600519.SH')
        
        # 4. 验证信号一致性
        assert len(signals_1) == len(signals_2), "两次计算的信号数量应该一致"
        
        # 验证信号值的一致性（允许小的浮点误差）
        for s1, s2 in zip(signals_1, signals_2):
            if s1['signal_type'] == s2['signal_type']:
                assert abs(s1['signal_value'] - s2['signal_value']) < 0.0001, \
                    f"信号值应该一致：{s1['signal_value']} vs {s2['signal_value']}"
    
    @pytest.mark.asyncio
    async def test_signal_calculation_performance(self, test_database, sample_price_data, sample_index_data):
        """测试信号计算性能"""
        import time
        
        # 1. 准备数据
        await self._setup_test_data(test_database, sample_price_data, sample_index_data)
        
        # 2. 创建QuantSignalEngine
        quant_config = {
            'enabled': True,
            'signalTypes': {
                'macroRisk': {'enabled': True, 'updateInterval': 3600},
                'marketStyle': {'enabled': True, 'updateInterval': 3600},
                'quantFingerprint': {'enabled': True, 'updateInterval': 3600}
            },
            'universe': {
                'broadIndex': ['000300.SH'],
                'primaryIndex': ['000001.SH'],
                'secondaryIndex': ['399001.SZ'],
                'leadingStocks': ['600519.SH']
            }
        }
        
        quant_engine = QuantSignalEngine(test_database, quant_config)
        
        # 3. 测量计算时间
        start_time = time.time()
        await quant_engine.calculateComplexSignals('600519.SH')
        end_time = time.time()
        
        execution_time = end_time - start_time
        
        # 验证性能要求（复杂信号计算<10秒）
        assert execution_time < 10.0, f"复杂信号计算时间过长：{execution_time:.2f}秒"
    
    @pytest.mark.asyncio
    async def test_signal_data_quality_validation(self, test_database, sample_price_data, sample_index_data):
        """测试信号数据质量验证"""
        # 1. 准备数据
        await self._setup_test_data(test_database, sample_price_data, sample_index_data)
        
        # 2. 创建QuantSignalEngine
        quant_config = {
            'enabled': True,
            'signalTypes': {
                'macroRisk': {'enabled': True, 'updateInterval': 3600},
                'marketStyle': {'enabled': True, 'updateInterval': 3600},
                'quantFingerprint': {'enabled': True, 'updateInterval': 3600}
            },
            'universe': {
                'broadIndex': ['000300.SH'],
                'primaryIndex': ['000001.SH'],
                'secondaryIndex': ['399001.SZ'],
                'leadingStocks': ['600519.SH']
            }
        }
        
        quant_engine = QuantSignalEngine(test_database, quant_config)
        
        # 3. 计算信号
        await quant_engine.calculateComplexSignals('600519.SH')
        
        # 4. 验证信号数据质量
        signals = await quant_engine.getComplexSignalsByStock('600519.SH')
        
        for signal in signals:
            # 验证信号值不是NaN或无穷大
            assert not np.isnan(signal['signal_value']), f"信号值不应该是NaN：{signal['signal_type']}"
            assert not np.isinf(signal['signal_value']), f"信号值不应该是无穷大：{signal['signal_type']}"
            
            # 验证Z分数在合理范围内
            assert -10 <= signal['z_score'] <= 10, f"Z分数应该在合理范围内：{signal['z_score']}"
            
            # 验证时间戳
            assert 'calculated_at' in signal, "信号应该包含计算时间"
            assert signal['calculated_at'] > 0, "计算时间应该大于0"
    
    @pytest.mark.asyncio
    async def test_error_handling_in_data_flow(self, test_database):
        """测试数据流中的错误处理"""
        # 1. 创建QuantSignalEngine（使用空数据库）
        quant_config = {
            'enabled': True,
            'signalTypes': {
                'macroRisk': {'enabled': True, 'updateInterval': 3600},
                'marketStyle': {'enabled': True, 'updateInterval': 3600},
                'quantFingerprint': {'enabled': True, 'updateInterval': 3600}
            },
            'universe': {
                'broadIndex': ['000300.SH'],
                'primaryIndex': ['000001.SH'],
                'secondaryIndex': ['399001.SZ'],
                'leadingStocks': ['600519.SH']
            }
        }
        
        quant_engine = QuantSignalEngine(test_database, quant_config)
        
        # 2. 测试数据不足的情况
        try:
            await quant_engine.calculateBasicSignals('600519.SH')
            # 如果没有抛出异常，检查是否有适当的处理
            signals = await quant_engine.getSignalsByStock('600519.SH')
            # 数据不足时应该返回空列表或适当的默认值
            assert isinstance(signals, list), "应该返回列表类型"
        except Exception as e:
            # 如果抛出异常，应该是预期的错误类型
            assert "数据不足" in str(e) or "insufficient data" in str(e).lower(), \
                f"应该抛出数据不足相关的异常：{e}"
    
    async def _setup_test_data(self, db, price_data, index_data):
        """设置测试数据"""
        # 创建股票基本信息
        stock_basic_data = [
            {
                'ts_code': '600519.SH',
                'name': '贵州茅台',
                'industry': '白酒',
                'area': '贵州',
                'market': '主板',
                'list_date': '20010827'
            },
            {
                'ts_code': '000300.SH',
                'name': '沪深300',
                'industry': '指数',
                'area': '全国',
                'market': '指数',
                'list_date': '20050408'
            }
        ]
        
        # 插入股票基本信息
        for stock in stock_basic_data:
            await db.execute("""
                INSERT INTO stock_basic (ts_code, name, industry, area, market, list_date, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (ts_code) DO UPDATE SET
                    name = EXCLUDED.name,
                    industry = EXCLUDED.industry,
                    area = EXCLUDED.area,
                    market = EXCLUDED.market,
                    list_date = EXCLUDED.list_date,
                    updated_at = EXCLUDED.updated_at
            """, stock['ts_code'], stock['name'], stock['industry'], stock['area'], 
                 stock['market'], stock['list_date'], datetime.now(), datetime.now())
        
        # 插入价格数据
        for _, row in price_data.iterrows():
            await db.execute("""
                INSERT INTO daily_basic (ts_code, trade_date, close, vol, amount, pct_chg, turnover_rate, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (ts_code, trade_date) DO UPDATE SET
                    close = EXCLUDED.close,
                    vol = EXCLUDED.vol,
                    amount = EXCLUDED.amount,
                    pct_chg = EXCLUDED.pct_chg,
                    turnover_rate = EXCLUDED.turnover_rate,
                    updated_at = EXCLUDED.updated_at
            """, row['ts_code'], row['trade_date'], row['close'], row['vol'], 
                 row['amount'], row['pct_chg'], row['turnover_rate'], datetime.now(), datetime.now())
        
        # 插入指数数据
        for _, row in index_data.iterrows():
            await db.execute("""
                INSERT INTO daily_basic (ts_code, trade_date, close, pct_chg, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (ts_code, trade_date) DO UPDATE SET
                    close = EXCLUDED.close,
                    pct_chg = EXCLUDED.pct_chg,
                    updated_at = EXCLUDED.updated_at
            """, row['ts_code'], row['trade_date'], row['close'], row['pct_chg'], datetime.now(), datetime.now())


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
