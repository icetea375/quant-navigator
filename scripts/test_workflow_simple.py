#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化的v11.9工作流测试脚本
测试仲裁预处理模块与主工作流的集成

作者: AI Assistant
创建时间: 2025-01-17
版本: v11.9
"""

import sys
import logging
from pathlib import Path
from datetime import datetime

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from support_modules.utils import load_config, setup_logging


def test_workflow_import():
    """测试工作流导入"""
    try:
        print("测试工作流导入...")
        
        # 测试导入main_workflow
        from main_workflow import MainWorkflow
        print("✅ main_workflow导入成功")
        
        # 测试导入ArbitrationPreprocessor
        from scripts.run_arbitration_preprocess import ArbitrationPreprocessor
        print("✅ ArbitrationPreprocessor导入成功")
        
        return True
        
    except Exception as e:
        print(f"❌ 导入测试失败: {e}")
        return False


def test_workflow_initialization():
    """测试工作流初始化"""
    try:
        print("测试工作流初始化...")
        
        # 模拟配置
        mock_config = {
            'database': {'database_url': 'test_url'},
            'data_pipeline': {'test': True},
            'quant_engine': {'test': True},
            'anomaly_thresholds': {'test': True}
        }
        
        # 模拟所有依赖
        import unittest.mock as mock
        
        with mock.patch('main_workflow.DatabaseManager'), \
             mock.patch('main_workflow.DataPipeline'), \
             mock.patch('main_workflow.QuantSignalEngine'), \
             mock.patch('main_workflow.QwenFactAnalyzer'), \
             mock.patch('main_workflow.DoubaoSentimentAnalyzer'), \
             mock.patch('main_workflow.ArbitrationPreprocessor'), \
             mock.patch('main_workflow.load_config', return_value=mock_config):
            
            from main_workflow import MainWorkflow
            
            # 创建工作流实例
            workflow = MainWorkflow()
            
            # 验证仲裁预处理器已初始化
            assert hasattr(workflow, 'arbitration_preprocessor'), "仲裁预处理器未初始化"
            
        print("✅ 工作流初始化测试通过")
        return True
        
    except Exception as e:
        print(f"❌ 工作流初始化测试失败: {e}")
        return False


def test_arbitration_preprocessing_method():
    """测试仲裁预处理方法"""
    try:
        print("测试仲裁预处理方法...")
        
        # 模拟配置
        mock_config = {
            'database': {'database_url': 'test_url'},
            'data_pipeline': {'test': True},
            'quant_engine': {'test': True},
            'anomaly_thresholds': {'test': True}
        }
        
        import unittest.mock as mock
        
        with mock.patch('main_workflow.DatabaseManager'), \
             mock.patch('main_workflow.DataPipeline'), \
             mock.patch('main_workflow.QuantSignalEngine'), \
             mock.patch('main_workflow.QwenFactAnalyzer'), \
             mock.patch('main_workflow.DoubaoSentimentAnalyzer'), \
             mock.patch('main_workflow.ArbitrationPreprocessor') as mock_arbitration, \
             mock.patch('main_workflow.load_config', return_value=mock_config):
            
            # 设置模拟返回值
            mock_arbitration.return_value.process_daily_arbitration_cases.return_value = {
                'status': 'success',
                'processed_count': 2,
                'failed_count': 0
            }
            
            from main_workflow import MainWorkflow
            
            workflow = MainWorkflow()
            
            # 测试仲裁预处理方法
            result = workflow._execute_arbitration_preprocessing('2025-01-17')
            
            # 验证结果
            assert result['status'] == 'success', f"期望success，得到{result['status']}"
            assert result['processed_count'] == 2, f"期望2，得到{result['processed_count']}"
            
        print("✅ 仲裁预处理方法测试通过")
        return True
        
    except Exception as e:
        print(f"❌ 仲裁预处理方法测试失败: {e}")
        return False


def test_report_saving_enhancement():
    """测试报告保存增强功能"""
    try:
        print("测试报告保存增强功能...")
        
        # 模拟配置
        mock_config = {
            'database': {'database_url': 'test_url'},
            'data_pipeline': {'test': True},
            'quant_engine': {'test': True},
            'anomaly_thresholds': {'test': True}
        }
        
        import unittest.mock as mock
        
        with mock.patch('main_workflow.DatabaseManager') as mock_db, \
             mock.patch('main_workflow.DataPipeline'), \
             mock.patch('main_workflow.QuantSignalEngine'), \
             mock.patch('main_workflow.QwenFactAnalyzer'), \
             mock.patch('main_workflow.DoubaoSentimentAnalyzer'), \
             mock.patch('main_workflow.ArbitrationPreprocessor'), \
             mock.patch('main_workflow.load_config', return_value=mock_config):
            
            from main_workflow import MainWorkflow
            
            workflow = MainWorkflow()
            
            # 测试报告保存
            test_report = {
                'id': 'test_001',
                'content': '测试报告内容',
                'stock_code': '000001'
            }
            
            workflow._save_report_to_db(test_report, 'qwen_fact_based')
            
            # 验证报告包含必要字段
            assert 'sentiment_score' in test_report, "缺少sentiment_score字段"
            assert 'keywords' in test_report, "缺少keywords字段"
            assert 'entities' in test_report, "缺少entities字段"
            assert 'summary' in test_report, "缺少summary字段"
            assert test_report['source'] == 'qwen_fact_based', f"期望qwen_fact_based，得到{test_report['source']}"
            
        print("✅ 报告保存增强功能测试通过")
        return True
        
    except Exception as e:
        print(f"❌ 报告保存增强功能测试失败: {e}")
        return False


def main():
    """主函数"""
    print("=== v11.9工作流集成测试 ===")
    
    tests = [
        ("工作流导入", test_workflow_import),
        ("工作流初始化", test_workflow_initialization),
        ("仲裁预处理方法", test_arbitration_preprocessing_method),
        ("报告保存增强功能", test_report_saving_enhancement)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        if test_func():
            passed += 1
        else:
            print(f"❌ {test_name} 失败")
    
    print(f"\n=== 测试完成: {passed}/{total} 通过 ===")
    
    if passed == total:
        print("✅ 所有测试通过")
        return 0
    else:
        print("❌ 部分测试失败")
        return 1


if __name__ == '__main__':
    sys.exit(main())
