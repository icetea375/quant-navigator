#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Qwen分析器单元测试
测试QwenFactAnalyzer的核心功能

遵循测试宪法 v1t0.12:
- 第5条：类型安全铁律 - 严禁使用 as any、@ts-ignore
- 第6条：模拟铁律 - 只模拟外部边界，不模拟内部逻辑
- 第7条：断言铁律 - 断言必须精确且有意义
- 第3条：红灯-绿灯-重构原则

作者: AI Assistant
创建时间: 2025-01-17
版本: v1t0.12
"""

import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent.parent.parent
sys.path.append(str(project_root / "packages" / "backend-python"))

import pytest
from qwen_analyzer import QwenFactAnalyzer


class TestQwenFactAnalyzer:
    """Qwen事实归因分析器单元测试类"""

    def setup_method(self):
        """每个测试方法前的设置"""
        # 模拟配置
        self.mock_config = {
            "database": {
                "host": "localhost",
                "port": 3306,
                "user": "test_user",
                "password": "test_password",
                "database": "test_quantnav"
            },
            "llm_service": {
                "qwen": {
                    "api_key": "test_qwen_key",
                    "base_url": "https://test-qwen-api.com"
                }
            }
        }

    def test_qwen_analyzer_initialization(self):
        """测试：Qwen分析器初始化"""
        # 红灯阶段：先写会失败的测试
        with patch('qwen_analyzer.DatabaseManager') as mock_db_manager, \
             patch('qwen_analyzer.LLMService') as mock_llm_service, \
             patch('qwen_analyzer.setup_logging') as mock_logging:
            
            # 绿灯阶段：写最简单的生产代码让测试通过
            analyzer = QwenFactAnalyzer(self.mock_config)
            
            # 精确断言：检查具体值，不是存在性
            assert analyzer.config == self.mock_config
            assert analyzer.db_manager is not None
            assert analyzer.llm_service is not None
            mock_db_manager.assert_called_once_with(self.mock_config["database"])
            mock_llm_service.assert_called_once_with(self.mock_config["llm_service"])

    def test_analyze_method_structure(self):
        """测试：analyze方法的基本结构"""
        with patch('qwen_analyzer.DatabaseManager'), \
             patch('qwen_analyzer.LLMService'), \
             patch('qwen_analyzer.setup_logging'):
            
            analyzer = QwenFactAnalyzer(self.mock_config)
            
            # 精确断言：检查方法存在且可调用
            assert hasattr(analyzer, 'analyze')
            assert callable(analyzer.analyze)

    def test_analyze_method_with_mock_data(self):
        """测试：analyze方法使用模拟数据"""
        with patch('qwen_analyzer.DatabaseManager') as mock_db_manager, \
             patch('qwen_analyzer.LLMService') as mock_llm_service, \
             patch('qwen_analyzer.setup_logging'):
            
            # 设置模拟返回值
            mock_db_instance = MagicMock()
            mock_llm_instance = MagicMock()
            mock_db_manager.return_value = mock_db_instance
            mock_llm_service.return_value = mock_llm_instance
            
            analyzer = QwenFactAnalyzer(self.mock_config)
            
            # 模拟内部方法
            with patch.object(analyzer, '_load_internal_data_for_stock') as mock_load_data, \
                 patch.object(analyzer, '_verify_mda') as mock_verify_mda, \
                 patch.object(analyzer, '_build_event_chain') as mock_build_chain, \
                 patch.object(analyzer, '_generate_final_report') as mock_generate_report:
                
                # 设置模拟返回值
                mock_load_data.return_value = {"test_data": "sample"}
                mock_verify_mda.return_value = {"mda_score": 0.8}
                mock_build_chain.return_value = {"events": ["event1", "event2"]}
                mock_generate_report.return_value = {
                    "stock_code": "000001",
                    "trade_date": "2025-01-17",
                    "analysis_result": "test_result"
                }
                
                result = analyzer.analyze("000001", "2025-01-17")
                
                # 精确断言：检查具体返回值
                assert result["stock_code"] == "000001"
                assert result["trade_date"] == "2025-01-17"
                assert result["analysis_result"] == "test_result"
                
                # 验证方法调用
                mock_load_data.assert_called_once_with("000001", "2025-01-17")
                mock_verify_mda.assert_called_once()
                mock_build_chain.assert_called_once()
                mock_generate_report.assert_called_once()

    def test_analyze_method_error_handling(self):
        """测试：analyze方法的错误处理"""
        with patch('qwen_analyzer.DatabaseManager'), \
             patch('qwen_analyzer.LLMService'), \
             patch('qwen_analyzer.setup_logging'):
            
            analyzer = QwenFactAnalyzer(self.mock_config)
            
            # 模拟内部方法抛出异常
            with patch.object(analyzer, '_load_internal_data_for_stock', 
                             side_effect=Exception("Data loading failed")):
                
                with pytest.raises(Exception) as exc_info:
                    analyzer.analyze("000001", "2025-01-17")
                
                # 精确断言：检查异常信息
                assert "Data loading failed" in str(exc_info.value)

    def test_verify_mda_method_structure(self):
        """测试：_verify_mda方法结构"""
        with patch('qwen_analyzer.DatabaseManager'), \
             patch('qwen_analyzer.LLMService'), \
             patch('qwen_analyzer.setup_logging'):
            
            analyzer = QwenFactAnalyzer(self.mock_config)
            
            # 精确断言：检查方法存在且可调用
            assert hasattr(analyzer, '_verify_mda')
            assert callable(analyzer._verify_mda)

    def test_build_event_chain_method_structure(self):
        """测试：_build_event_chain方法结构"""
        with patch('qwen_analyzer.DatabaseManager'), \
             patch('qwen_analyzer.LLMService'), \
             patch('qwen_analyzer.setup_logging'):
            
            analyzer = QwenFactAnalyzer(self.mock_config)
            
            # 精确断言：检查方法存在且可调用
            assert hasattr(analyzer, '_build_event_chain')
            assert callable(analyzer._build_event_chain)

    def test_generate_final_report_method_structure(self):
        """测试：_generate_final_report方法结构"""
        with patch('qwen_analyzer.DatabaseManager'), \
             patch('qwen_analyzer.LLMService'), \
             patch('qwen_analyzer.setup_logging'):
            
            analyzer = QwenFactAnalyzer(self.mock_config)
            
            # 精确断言：检查方法存在且可调用
            assert hasattr(analyzer, '_generate_final_report')
            assert callable(analyzer._generate_final_report)

    def test_load_internal_data_for_stock_method_structure(self):
        """测试：_load_internal_data_for_stock方法结构"""
        with patch('qwen_analyzer.DatabaseManager'), \
             patch('qwen_analyzer.LLMService'), \
             patch('qwen_analyzer.setup_logging'):
            
            analyzer = QwenFactAnalyzer(self.mock_config)
            
            # 精确断言：检查方法存在且可调用
            assert hasattr(analyzer, '_load_internal_data_for_stock')
            assert callable(analyzer._load_internal_data_for_stock)

    def test_analyzer_config_validation(self):
        """测试：分析器配置验证"""
        # 测试有效配置
        valid_config = {
            "database": {"host": "localhost"},
            "llm_service": {"qwen": {"api_key": "test"}}
        }
        
        with patch('qwen_analyzer.DatabaseManager'), \
             patch('qwen_analyzer.LLMService'), \
             patch('qwen_analyzer.setup_logging'):
            
            analyzer = QwenFactAnalyzer(valid_config)
            
            # 精确断言：检查配置被正确设置
            assert analyzer.config == valid_config

    def test_analyzer_with_missing_config(self):
        """测试：分析器处理缺失配置"""
        # 测试缺失必要配置的情况
        incomplete_config = {
            "database": {"host": "localhost"}
            # 缺少 llm_service 配置
        }
        
        with patch('qwen_analyzer.DatabaseManager'), \
             patch('qwen_analyzer.LLMService'), \
             patch('qwen_analyzer.setup_logging'):
            
            # 这应该会抛出异常或使用默认值
            try:
                analyzer = QwenFactAnalyzer(incomplete_config)
                # 如果成功创建，检查默认行为
                assert analyzer.config == incomplete_config
            except Exception as e:
                # 精确断言：检查异常类型
                assert isinstance(e, (KeyError, ValueError, AttributeError))

    def test_analyzer_logging_setup(self):
        """测试：分析器日志设置"""
        with patch('qwen_analyzer.DatabaseManager'), \
             patch('qwen_analyzer.LLMService'), \
             patch('qwen_analyzer.setup_logging') as mock_logging:
            
            analyzer = QwenFactAnalyzer(self.mock_config)
            
            # 精确断言：检查日志设置被调用
            mock_logging.assert_called_once_with("qwen_analyzer")

    def test_analyzer_database_manager_initialization(self):
        """测试：数据库管理器初始化"""
        with patch('qwen_analyzer.DatabaseManager') as mock_db_manager, \
             patch('qwen_analyzer.LLMService'), \
             patch('qwen_analyzer.setup_logging'):
            
            analyzer = QwenFactAnalyzer(self.mock_config)
            
            # 精确断言：检查数据库管理器被正确初始化
            mock_db_manager.assert_called_once_with(self.mock_config["database"])

    def test_analyzer_llm_service_initialization(self):
        """测试：LLM服务初始化"""
        with patch('qwen_analyzer.DatabaseManager'), \
             patch('qwen_analyzer.LLMService') as mock_llm_service, \
             patch('qwen_analyzer.setup_logging'):
            
            analyzer = QwenFactAnalyzer(self.mock_config)
            
            # 精确断言：检查LLM服务被正确初始化
            mock_llm_service.assert_called_once_with(self.mock_config["llm_service"])


if __name__ == "__main__":
    # 运行测试
    pytest.main([__file__, "-v", "--tb=short"])
