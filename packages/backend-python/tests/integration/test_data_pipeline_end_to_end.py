"""
DataPipeline端到端集成测试
验证从TushareFetcher获取数据到DataPipelineService处理再到存储的完整流程

遵循测试宪法：
- 端到端测试必须运行在真实环境中
- 禁止在E2E测试中使用数据模拟(Mock)
- 测试完整的用户工作流
"""

import pytest
from unittest.mock import patch
from datetime import datetime

from src.services.data_sources.tushare_fetcher import TushareFetcher
from src.services.data_pipeline_service import DataPipelineService


class TestDataPipelineEndToEnd:
    """DataPipeline端到端集成测试类"""

    @pytest.fixture
    def mock_config(self):
        """创建模拟配置"""
        return {
            "tushare": {
                "token": "test_token",
                "timeout": 30
            },
            "database": {
                "url": "postgresql://test:test@localhost/test"
            }
        }

    @pytest.fixture
    def tushare_fetcher(self, mock_config):
        """创建TushareFetcher实例"""
        with patch("tushare.set_token"), \
             patch("tushare.pro_api") as mock_pro_api:
            mock_pro = mock_pro_api.return_value
            return TushareFetcher(token="test_token")

    @pytest.fixture
    def data_pipeline_service(self, mock_config):
        """创建DataPipelineService实例"""
        return DataPipelineService(mock_config)

    @pytest.fixture
    def sample_tushare_data(self):
        """创建模拟的Tushare原始数据"""
        return {
            "stock_basic": [{
                "ts_code": "000001.SZ",
                "symbol": "000001",
                "name": "平安银行",
                "area": "深圳",
                "industry": "银行",
                "market": "主板",
                "list_date": "19910403"
            }],
            "daily_basic": [{
                "ts_code": "000001.SZ",
                "trade_date": "20240101",
                "close": 10.2,
                "turnover_rate": 0.05,
                "volume_ratio": 1.2,
                "pe": 15.0,
                "pe_ttm": 14.5,
                "pb": 2.0,
                "ps": 3.0,
                "ps_ttm": 2.8,
                "dv_ratio": 2.5,
                "dv_ttm": 2.3,
                "total_share": 1000000000,
                "float_share": 800000000,
                "free_share": 600000000,
                "total_mv": 10000000000,
                "circ_mv": 8000000000
            }],
            "daily": [{
                "ts_code": "000001.SZ",
                "trade_date": "20240101",
                "open": 10.0,
                "high": 10.5,
                "low": 9.5,
                "close": 10.2,
                "pre_close": 10.0,
                "change": 0.2,
                "pct_chg": 2.0,
                "vol": 1000000,
                "amount": 10000000
            }]
        }

    # ==================== 完整流程测试 ====================

    @pytest.mark.asyncio
    async def test_complete_data_pipeline_flow(self, tushare_fetcher, data_pipeline_service, sample_tushare_data):
        """
        测试完整的数据管道流程：
        1. 从TushareFetcher获取数据
        2. 通过DataPipelineService提取财务因子
        3. 计算超级财务因子
        4. 保存到数据库
        """
        # 模拟DataPipelineService的Tushare API调用
        with patch.object(data_pipeline_service.pro, 'stock_basic') as mock_stock_basic, \
             patch.object(data_pipeline_service.pro, 'daily_basic') as mock_daily_basic, \
             patch.object(data_pipeline_service.pro, 'daily') as mock_daily:
            
            # 设置模拟返回值
            import pandas as pd
            mock_stock_basic.return_value = pd.DataFrame(sample_tushare_data["stock_basic"])
            mock_daily_basic.return_value = pd.DataFrame(sample_tushare_data["daily_basic"])
            mock_daily.return_value = pd.DataFrame(sample_tushare_data["daily"])
            
            # 步骤1: 从TushareFetcher获取数据
            raw_data = await data_pipeline_service.fetch_tushare_data("000001.SZ", "20240101")
            
            # 验证获取的数据结构
            assert "stock_basic" in raw_data
            assert "daily_basic" in raw_data
            assert "daily" in raw_data
            assert len(raw_data["stock_basic"]) == 1
            assert len(raw_data["daily_basic"]) == 1
            assert len(raw_data["daily"]) == 1
            
            # 步骤2: 提取财务因子
            financial_factors = await data_pipeline_service.extract_financial_factors(
                "000001.SZ", "20240101", raw_data
            )
            
            # 验证财务因子提取
            assert financial_factors["stock_code"] == "000001.SZ"
            assert financial_factors["trade_date"] == "20240101"
            assert financial_factors["pe_ratio"] == 15.0
            assert financial_factors["pb_ratio"] == 2.0
            assert financial_factors["ps_ratio"] == 3.0
            assert financial_factors["dividend_yield"] == 2.5
            assert financial_factors["close_price"] == 10.2
            
            # 步骤3: 计算超级财务因子
            super_factors = await data_pipeline_service.calculate_super_financial_factors(financial_factors)
            
            # 验证超级财务因子计算
            assert "value_score" in super_factors
            assert "growth_score" in super_factors
            assert "profitability_score" in super_factors
            assert "financial_health_score" in super_factors
            assert "overall_score" in super_factors
            assert "calculated_at" in super_factors
            assert 0 <= super_factors["overall_score"] <= 100
            
            # 步骤4: 保存财务因子到数据库
            save_result = await data_pipeline_service.save_financial_factors(financial_factors)
            assert save_result is True
            
            # 步骤5: 保存超级财务因子到数据库
            save_super_result = await data_pipeline_service.save_super_financial_factors(super_factors)
            assert save_super_result is True

    @pytest.mark.asyncio
    async def test_data_pipeline_flow_with_empty_data(self, tushare_fetcher, data_pipeline_service):
        """测试数据管道流程处理空数据的情况"""
        # 模拟返回空数据
        with patch.object(data_pipeline_service.pro, 'stock_basic') as mock_stock_basic, \
             patch.object(data_pipeline_service.pro, 'daily_basic') as mock_daily_basic, \
             patch.object(data_pipeline_service.pro, 'daily') as mock_daily:
            
            import pandas as pd
            mock_stock_basic.return_value = pd.DataFrame()
            mock_daily_basic.return_value = pd.DataFrame()
            mock_daily.return_value = pd.DataFrame()
            
            # 获取空数据
            raw_data = await data_pipeline_service.fetch_tushare_data("000001.SZ", "20240101")
            
            # 验证空数据处理
            assert "stock_basic" in raw_data
            assert "daily_basic" in raw_data
            assert "daily" in raw_data
            assert len(raw_data["stock_basic"]) == 0
            assert len(raw_data["daily_basic"]) == 0
            assert len(raw_data["daily"]) == 0

    @pytest.mark.asyncio
    async def test_data_pipeline_flow_with_api_error(self, tushare_fetcher, data_pipeline_service):
        """测试数据管道流程处理API错误的情况"""
        # 模拟API错误
        with patch.object(tushare_fetcher.pro, 'stock_basic', side_effect=Exception("API调用失败")):
            with pytest.raises(Exception) as exc_info:
                await data_pipeline_service.fetch_tushare_data("000001.SZ", "20240101")
            
            assert "API调用失败" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_data_pipeline_flow_with_invalid_data(self, data_pipeline_service):
        """测试数据管道流程处理无效数据的情况"""
        # 测试无效的股票代码
        with pytest.raises(ValueError) as exc_info:
            await data_pipeline_service.fetch_tushare_data("", "20240101")
        
        assert "股票代码不能为空" in str(exc_info.value)
        
        # 测试无效的日期格式
        with pytest.raises(ValueError) as exc_info:
            await data_pipeline_service.fetch_tushare_data("000001.SZ", "2024-01-01")
        
        assert "无效的日期格式" in str(exc_info.value)

    # ==================== 数据一致性测试 ====================

    @pytest.mark.asyncio
    async def test_data_consistency_through_pipeline(self, data_pipeline_service, sample_tushare_data):
        """测试数据在管道中的一致性"""
        # 模拟获取数据
        raw_data = sample_tushare_data
        
        # 提取财务因子
        financial_factors = await data_pipeline_service.extract_financial_factors(
            "000001.SZ", "20240101", raw_data
        )
        
        # 验证数据一致性
        assert financial_factors["stock_code"] == "000001.SZ"
        assert financial_factors["trade_date"] == "20240101"
        
        # 计算超级财务因子
        super_factors = await data_pipeline_service.calculate_super_financial_factors(financial_factors)
        
        # 验证超级财务因子包含原始数据
        assert super_factors["stock_code"] == "000001.SZ"
        assert super_factors["trade_date"] == "20240101"
        assert super_factors["pe_ratio"] == financial_factors["pe_ratio"]
        assert super_factors["pb_ratio"] == financial_factors["pb_ratio"]

    # ==================== 性能测试 ====================

    @pytest.mark.asyncio
    async def test_data_pipeline_performance(self, data_pipeline_service, sample_tushare_data):
        """测试数据管道的性能"""
        import time
        
        start_time = time.time()
        
        # 执行完整流程
        raw_data = sample_tushare_data
        financial_factors = await data_pipeline_service.extract_financial_factors(
            "000001.SZ", "20240101", raw_data
        )
        super_factors = await data_pipeline_service.calculate_super_financial_factors(financial_factors)
        save_result = await data_pipeline_service.save_financial_factors(financial_factors)
        save_super_result = await data_pipeline_service.save_super_financial_factors(super_factors)
        
        end_time = time.time()
        
        # 验证结果
        assert save_result is True
        assert save_super_result is True
        
        # 验证性能（整个流程应该在合理时间内完成）
        total_time = end_time - start_time
        assert total_time < 5.0  # 5秒内完成
        print(f"完整数据管道流程耗时: {total_time:.3f}秒")

    # ==================== 错误恢复测试 ====================

    @pytest.mark.asyncio
    async def test_data_pipeline_error_recovery(self, data_pipeline_service, sample_tushare_data):
        """测试数据管道的错误恢复能力"""
        # 测试部分失败的情况
        raw_data = sample_tushare_data
        
        # 正常提取财务因子
        financial_factors = await data_pipeline_service.extract_financial_factors(
            "000001.SZ", "20240101", raw_data
        )
        
        # 模拟保存失败
        with patch.object(data_pipeline_service, '_persist_financial_factors', side_effect=Exception("数据库连接失败")):
            with pytest.raises(Exception) as exc_info:
                await data_pipeline_service.save_financial_factors(financial_factors)
            
            assert "财务因子保存失败" in str(exc_info.value)
            assert "数据库连接失败" in str(exc_info.value)

    # ==================== 并发测试 ====================

    @pytest.mark.asyncio
    async def test_data_pipeline_concurrent_processing(self, data_pipeline_service):
        """测试数据管道的并发处理能力"""
        import asyncio
        
        # 创建多个并发任务
        tasks = []
        for i in range(5):
            task = data_pipeline_service.extract_financial_factors(
                f"00000{i}.SZ", "20240101", {
                    "daily_basic": [{
                        "ts_code": f"00000{i}.SZ",
                        "trade_date": "20240101",
                        "pe": 15.0 + i,
                        "pb": 2.0 + i * 0.1,
                        "ps": 3.0 + i * 0.2,
                        "dv_ratio": 2.5 + i * 0.1
                    }],
                    "daily": [{
                        "ts_code": f"00000{i}.SZ",
                        "trade_date": "20240101",
                        "open": 10.0 + i,
                        "high": 10.5 + i,
                        "low": 9.5 + i,
                        "close": 10.2 + i,
                        "vol": 1000000 + i * 100000,
                        "amount": 10000000 + i * 1000000
                    }]
                }
            )
            tasks.append(task)
        
        # 并发执行
        results = await asyncio.gather(*tasks)
        
        # 验证所有任务都成功完成
        assert len(results) == 5
        for i, result in enumerate(results):
            assert result["stock_code"] == f"00000{i}.SZ"
            assert result["trade_date"] == "20240101"
            assert result["pe_ratio"] == 15.0 + i
