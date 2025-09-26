"""
DataPipelineService 同步单元测试
实施测试金字塔原则 - 大量快速单元测试
"""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime
from typing import Dict, Any

from src.services.data_pipeline_service import DataPipelineService


class TestDataPipelineServiceSync:
    """DataPipelineService 同步单元测试类"""
    
    @pytest.fixture
    def service(self):
        """创建服务实例"""
        config = {
            "tushare": {"token": "test_token"},
            "data_pipeline": {"batch_size": 100}
        }
        return DataPipelineService(config)
    
    def test_should_calculate_value_score_correctly_for_excellent_pe(self, service):
        """测试：应该为优秀的PE比率计算正确的价值评分"""
        # PE < 10 应该得到25分
        score = service._calculate_value_score(8.0, 0.8, 1.5, 4.0)
        assert score == 100.0  # 25 + 25 + 25 + 25
    
    def test_should_calculate_value_score_correctly_for_poor_pe(self, service):
        """测试：应该为糟糕的PE比率计算正确的价值评分"""
        # PE > 50 应该得到5分
        score = service._calculate_value_score(60.0, 5.0, 20.0, 0.0)
        assert score == 20.0  # 5 + 5 + 5 + 5
    
    def test_should_calculate_value_score_correctly_for_medium_pe(self, service):
        """测试：应该为中等PE比率计算正确的价值评分"""
        # PE 15-20 应该得到20分
        score = service._calculate_value_score(18.0, 2.5, 8.0, 2.0)
        assert score == 80.0  # 20 + 20 + 20 + 20
    
    def test_should_calculate_value_score_correctly_for_excellent_pb(self, service):
        """测试：应该为优秀的PB比率计算正确的价值评分"""
        # PB < 1 应该得到25分
        score = service._calculate_value_score(15.0, 0.8, 3.0, 2.0)
        assert score == 70.0  # 20 + 25 + 20 + 5
    
    def test_should_calculate_value_score_correctly_for_excellent_ps(self, service):
        """测试：应该为优秀的PS比率计算正确的价值评分"""
        # PS < 2 应该得到25分
        score = service._calculate_value_score(15.0, 2.0, 1.5, 2.0)
        assert score == 70.0  # 20 + 20 + 25 + 5
    
    def test_should_calculate_value_score_correctly_for_excellent_dividend_yield(self, service):
        """测试：应该为优秀的股息率计算正确的价值评分"""
        # 股息率 > 5% 应该得到25分
        score = service._calculate_value_score(15.0, 2.0, 3.0, 6.0)
        assert score == 70.0  # 20 + 20 + 20 + 25
    
    def test_should_cap_value_score_at_100(self, service):
        """测试：价值评分应该被限制在100分以内"""
        # 即使所有指标都优秀，总分也不应超过100
        score = service._calculate_value_score(5.0, 0.5, 1.0, 8.0)
        assert score == 100.0
    
    def test_should_handle_zero_values_in_value_score_calculation(self, service):
        """测试：应该正确处理价值评分计算中的零值"""
        score = service._calculate_value_score(0.0, 0.0, 0.0, 0.0)
        assert score == 20.0  # 5 + 5 + 5 + 5
    
    def test_should_handle_negative_values_in_value_score_calculation(self, service):
        """测试：应该正确处理价值评分计算中的负值"""
        score = service._calculate_value_score(-5.0, -0.5, -1.0, -2.0)
        assert score == 20.0  # 5 + 5 + 5 + 5
    
    def test_should_calculate_growth_score_returns_default_value(self, service):
        """测试：成长性评分计算应该返回默认值"""
        factors = {"test": "data"}
        score = service._calculate_growth_score(factors)
        assert score == 50.0
    
    def test_should_calculate_profitability_score_returns_default_value(self, service):
        """测试：盈利能力评分计算应该返回默认值"""
        factors = {"test": "data"}
        score = service._calculate_profitability_score(factors)
        assert score == 50.0
    
    def test_should_calculate_financial_health_score_returns_default_value(self, service):
        """测试：财务健康度评分计算应该返回默认值"""
        factors = {"test": "data"}
        score = service._calculate_financial_health_score(factors)
        assert score == 50.0
    
    def test_should_calculate_super_financial_factors_correctly(self, service):
        """测试：应该正确计算超级财务因子"""
        financial_factors = {
            "pe_ratio": 8.0,
            "pb_ratio": 0.8,
            "ps_ratio": 1.5,
            "dividend_yield": 4.0
        }
        
        result = service.calculate_super_financial_factors(financial_factors)
        
        assert "value_score" in result
        assert "growth_score" in result
        assert "profitability_score" in result
        assert "financial_health_score" in result
        assert "overall_score" in result
        assert "calculated_at" in result
        
        # 验证评分范围
        assert 0 <= result["value_score"] <= 100
        assert 0 <= result["growth_score"] <= 100
        assert 0 <= result["profitability_score"] <= 100
        assert 0 <= result["financial_health_score"] <= 100
        assert 0 <= result["overall_score"] <= 100
    
    def test_should_preserve_original_factors_in_super_factors(self, service):
        """测试：超级财务因子应该保留原始因子"""
        financial_factors = {
            "pe_ratio": 8.0,
            "pb_ratio": 0.8,
            "ps_ratio": 1.5,
            "dividend_yield": 4.0,
            "custom_field": "test_value"
        }
        
        result = service.calculate_super_financial_factors(financial_factors)
        
        # 验证原始字段被保留
        assert result["pe_ratio"] == 8.0
        assert result["pb_ratio"] == 0.8
        assert result["ps_ratio"] == 1.5
        assert result["dividend_yield"] == 4.0
        assert result["custom_field"] == "test_value"
    
    def test_should_handle_empty_financial_factors_gracefully(self, service):
        """测试：应该优雅地处理空的财务因子"""
        result = service.calculate_super_financial_factors({})
        
        assert "value_score" in result
        assert "overall_score" in result
        assert result["overall_score"] == 50.0  # 默认值
    
    def test_should_handle_missing_required_fields_in_financial_factors(self, service):
        """测试：应该优雅地处理缺少必需字段的财务因子"""
        financial_factors = {"pe_ratio": 8.0}  # 缺少其他字段
        
        result = service.calculate_super_financial_factors(financial_factors)
        
        assert "value_score" in result
        assert "overall_score" in result
        # 应该使用默认值0.0进行计算
        assert result["pb_ratio"] == 0.0
        assert result["ps_ratio"] == 0.0
        assert result["dividend_yield"] == 0.0
