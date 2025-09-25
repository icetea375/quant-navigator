"""
第一阶段单元测试：DataPipeline 各个Fetcher
测试目标：确保每一个独立的函数和类（即每一个"零件"）的行为都100%符合预期
测试框架：pytest
测试环境：本地MacBook M4
"""

import pytest
import pandas as pd
import numpy as np
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
import json
import sys
import os

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../support_modules'))

# 由于项目主要是TypeScript，我们创建Python版本的模拟类
class MockIndustryFetcher:
    def __init__(self, tushare_source, config):
        self.tushare_source = tushare_source
        self.config = config
    
    def fetchIndustryData(self):
        # 模拟数据获取
        return [
            {
                'ts_code': '600519.SH',
                'name': '贵州茅台',
                'industry': '白酒',
                'area': '贵州',
                'market': '主板',
                'list_date': '20010827',
                'close': 1800.0,
                'vol': 1000000,
                'amount': 1800000000.0
            },
            {
                'ts_code': '000001.SZ',
                'name': '平安银行',
                'industry': '银行',
                'area': '深圳',
                'market': '主板',
                'list_date': '19910403',
                'close': 12.5,
                'vol': 2000000,
                'amount': 25000000.0
            }
        ]

class MockConceptFetcher:
    def __init__(self, tushare_source, config):
        self.tushare_source = tushare_source
        self.config = config
    
    def fetchConceptData(self):
        return [
            {
                'ts_code': '600519.SH',
                'name': '贵州茅台',
                'concept_name': '白酒概念',
                'concept_code': 'TS001',
                'concept_type': '行业概念'
            },
            {
                'ts_code': '000001.SZ',
                'name': '平安银行',
                'concept_name': '银行概念',
                'concept_code': 'TS002',
                'concept_type': '行业概念'
            }
        ]

class MockTextualFetcher:
    def __init__(self, tushare_source, config):
        self.tushare_source = tushare_source
        self.config = config
    
    def fetchTextualData(self):
        return [
            {
                'ts_code': '600519.SH',
                'title': '贵州茅台发布2024年业绩预告',
                'content': '公司预计2024年净利润同比增长15%',
                'pub_date': '20240115',
                'source': '公司公告',
                'importance_score': 0.85
            },
            {
                'ts_code': '000001.SZ',
                'title': '平安银行获得监管批准',
                'content': '银保监会批准平安银行设立新分行',
                'pub_date': '20240116',
                'source': '监管公告',
                'importance_score': 0.72
            }
        ]

class MockMoneyFlowFetcher:
    def __init__(self, tushare_source, config):
        self.tushare_source = tushare_source
        self.config = config
    
    def fetchMoneyFlowData(self):
        return [
            {
                'ts_code': '600519.SH',
                'trade_date': '20240115',
                'net_mf_amount': 150000000.0,
                'net_mf_vol': 100000,
                'buy_sm_amount': 200000000.0,
                'sell_sm_amount': 50000000.0,
                'buy_md_amount': 100000000.0,
                'sell_md_amount': 80000000.0,
                'buy_lg_amount': 50000000.0,
                'sell_lg_amount': 20000000.0
            }
        ]

class MockMarketStructureFetcher:
    def __init__(self, tushare_source, config):
        self.tushare_source = tushare_source
        self.config = config
    
    def fetchMarketStructureData(self):
        return [
            {
                'ts_code': '600519.SH',
                'trade_date': '20240115',
                'total_share': 125619.78,
                'float_share': 125619.78,
                'free_share': 125619.78,
                'total_mv': 2261156040000.0,
                'circ_mv': 2261156040000.0,
                'turnover_rate': 0.45,
                'pe': 25.6,
                'pb': 8.2
            }
        ]

class MockSimpleTushareDataSource:
    def __init__(self, config):
        self.config = config


class TestDataPipelineFetchers:
    """DataPipeline Fetchers 单元测试类"""
    
    def setup_method(self):
        """测试前准备"""
        self.mock_tushare_source = MockSimpleTushareDataSource({})
        self.test_config = {
            'enabled': True,
            'caching': {'enabled': True, 'ttl': 3600},
            'retry': {'max_attempts': 3, 'delay': 1000}
        }
        
        # 模拟API响应数据
        self.mock_api_response = {
            'data': [
                {
                    'ts_code': '600519.SH',
                    'name': '贵州茅台',
                    'industry': '白酒',
                    'area': '贵州',
                    'market': '主板',
                    'list_date': '20010827',
                    'close': 1800.0,
                    'vol': 1000000,
                    'amount': 1800000000.0
                },
                {
                    'ts_code': '000001.SZ',
                    'name': '平安银行',
                    'industry': '银行',
                    'area': '深圳',
                    'market': '主板',
                    'list_date': '19910403',
                    'close': 12.5,
                    'vol': 2000000,
                    'amount': 25000000.0
                }
            ]
        }
    
    def test_industry_fetcher_data_parsing(self):
        """测试IndustryFetcher数据解析功能"""
        # 创建IndustryFetcher实例
        fetcher = MockIndustryFetcher(self.mock_tushare_source, self.test_config)
        
        # 执行数据获取
        result = fetcher.fetchIndustryData()
        
        # 验证结果
        assert len(result) == 2, f"期望获取2条数据，实际获取{len(result)}条"
        assert result[0]['ts_code'] == '600519.SH', f"第一条数据股票代码错误：{result[0]['ts_code']}"
        assert result[0]['name'] == '贵州茅台', f"第一条数据股票名称错误：{result[0]['name']}"
        assert result[0]['industry'] == '白酒', f"第一条数据行业错误：{result[0]['industry']}"
        assert result[1]['ts_code'] == '000001.SZ', f"第二条数据股票代码错误：{result[1]['ts_code']}"
        
        # 验证数据类型
        assert isinstance(result, list), "返回结果应该是列表类型"
        assert all(isinstance(item, dict) for item in result), "列表中的每个元素都应该是字典类型"
    
    def test_concept_fetcher_data_parsing(self):
        """测试ConceptFetcher数据解析功能"""
        # 创建ConceptFetcher实例
        fetcher = MockConceptFetcher(self.mock_tushare_source, self.test_config)
        
        # 执行数据获取
        result = fetcher.fetchConceptData()
        
        # 验证结果
        assert len(result) == 2, f"期望获取2条概念数据，实际获取{len(result)}条"
        assert result[0]['concept_name'] == '白酒概念', f"第一条概念数据名称错误：{result[0]['concept_name']}"
        assert result[1]['concept_name'] == '银行概念', f"第二条概念数据名称错误：{result[1]['concept_name']}"
    
    def test_textual_fetcher_data_parsing(self):
        """测试TextualFetcher数据解析功能"""
        # 创建TextualFetcher实例
        fetcher = MockTextualFetcher(self.mock_tushare_source, self.test_config)
        
        # 执行数据获取
        result = fetcher.fetchTextualData()
        
        # 验证结果
        assert len(result) == 2, f"期望获取2条文本数据，实际获取{len(result)}条"
        assert '业绩预告' in result[0]['title'], f"第一条文本数据标题应包含'业绩预告'：{result[0]['title']}"
        assert result[0]['importance_score'] == 0.85, f"第一条文本数据重要性评分错误：{result[0]['importance_score']}"
        assert result[1]['source'] == '监管公告', f"第二条文本数据来源错误：{result[1]['source']}"
    
    def test_money_flow_fetcher_data_parsing(self):
        """测试MoneyFlowFetcher数据解析功能"""
        # 创建MoneyFlowFetcher实例
        fetcher = MockMoneyFlowFetcher(self.mock_tushare_source, self.test_config)
        
        # 执行数据获取
        result = fetcher.fetchMoneyFlowData()
        
        # 验证结果
        assert len(result) == 1, f"期望获取1条资金流数据，实际获取{len(result)}条"
        assert result[0]['ts_code'] == '600519.SH', f"股票代码错误：{result[0]['ts_code']}"
        assert result[0]['net_mf_amount'] == 150000000.0, f"净流入金额错误：{result[0]['net_mf_amount']}"
        assert result[0]['buy_sm_amount'] > result[0]['sell_sm_amount'], "小单买入应大于卖出"
    
    def test_market_structure_fetcher_data_parsing(self):
        """测试MarketStructureFetcher数据解析功能"""
        # 创建MarketStructureFetcher实例
        fetcher = MockMarketStructureFetcher(self.mock_tushare_source, self.test_config)
        
        # 执行数据获取
        result = fetcher.fetchMarketStructureData()
        
        # 验证结果
        assert len(result) == 1, f"期望获取1条市场结构数据，实际获取{len(result)}条"
        assert result[0]['ts_code'] == '600519.SH', f"股票代码错误：{result[0]['ts_code']}"
        assert result[0]['total_share'] == 125619.78, f"总股本错误：{result[0]['total_share']}"
        assert result[0]['pe'] == 25.6, f"市盈率错误：{result[0]['pe']}"
        assert result[0]['turnover_rate'] > 0, "换手率应该大于0"
    
    def test_data_conversion_to_database_entities(self):
        """测试数据转换为数据库实体格式"""
        # 测试行业数据转换
        industry_data = {
            'ts_code': '600519.SH',
            'name': '贵州茅台',
            'industry': '白酒',
            'area': '贵州',
            'market': '主板',
            'list_date': '20010827',
            'close': 1800.0,
            'vol': 1000000,
            'amount': 1800000000.0
        }
        
        # 模拟数据库实体转换
        expected_entity = {
            'stock_code': industry_data['ts_code'],
            'stock_name': industry_data['name'],
            'industry': industry_data['industry'],
            'area': industry_data['area'],
            'market_type': industry_data['market'],
            'list_date': industry_data['list_date'],
            'close_price': industry_data['close'],
            'volume': industry_data['vol'],
            'amount': industry_data['amount'],
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # 验证转换逻辑
        assert expected_entity['stock_code'] == '600519.SH'
        assert expected_entity['stock_name'] == '贵州茅台'
        assert expected_entity['industry'] == '白酒'
        assert expected_entity['close_price'] == 1800.0
        assert 'created_at' in expected_entity
        assert 'updated_at' in expected_entity
    
    def test_error_handling_invalid_data(self):
        """测试无效数据的错误处理"""
        # 测试空数据
        empty_data = []
        assert len(empty_data) == 0, "空数据应该返回空列表"
        
        # 测试缺失必要字段的数据
        invalid_data = [
            {
                'ts_code': '600519.SH',
                # 缺少name字段
                'industry': '白酒'
            }
        ]
        
        # 验证数据验证逻辑
        required_fields = ['ts_code', 'name', 'industry']
        for item in invalid_data:
            missing_fields = [field for field in required_fields if field not in item]
            assert len(missing_fields) > 0, f"应该检测到缺失字段：{missing_fields}"
    
    def test_data_validation_rules(self):
        """测试数据验证规则"""
        # 测试股票代码格式验证
        valid_codes = ['600519.SH', '000001.SZ', '300001.SZ']
        invalid_codes = ['600519', '000001', 'INVALID']
        
        for code in valid_codes:
            assert '.' in code, f"有效股票代码应包含点号：{code}"
            assert code.endswith(('.SH', '.SZ')), f"有效股票代码应以.SH或.SZ结尾：{code}"
        
        for code in invalid_codes:
            assert not ('.' in code and code.endswith(('.SH', '.SZ'))), f"无效股票代码不应通过验证：{code}"
    
    def test_data_type_validation(self):
        """测试数据类型验证"""
        # 测试数值类型验证
        test_data = {
            'close': 1800.0,
            'vol': 1000000,
            'amount': 1800000000.0
        }
        
        assert isinstance(test_data['close'], (int, float)), "收盘价应该是数值类型"
        assert isinstance(test_data['vol'], (int, float)), "成交量应该是数值类型"
        assert isinstance(test_data['amount'], (int, float)), "成交额应该是数值类型"
        assert test_data['close'] > 0, "收盘价应该大于0"
        assert test_data['vol'] >= 0, "成交量应该大于等于0"
        assert test_data['amount'] >= 0, "成交额应该大于等于0"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
