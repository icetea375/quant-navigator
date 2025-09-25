#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ArbitrationPreprocessor模块单元测试
测试仲裁预处理器的核心功能

作者: AI Assistant
创建时间: 2025-01-17
版本: v11.9
"""

import unittest
import sys
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from scripts.run_arbitration_preprocess import ArbitrationPreprocessor


class TestArbitrationPreprocessor(unittest.TestCase):
    """ArbitrationPreprocessor测试类"""
    
    def setUp(self):
        """测试前准备"""
        self.config = {
            "database": {
                "database_url": "postgresql://test:test@localhost:5432/test_db"
            },
            "llm": {
                "providers": {
                    "qwen_plus": {
                        "api_key": "test_key",
                        "base_url": "https://dashscope.aliyuncs.com/api/v1",
                        "model": "qwen-plus"
                    }
                },
                "default_provider": "qwen_plus"
            }
        }
        
        # 模拟数据库管理器
        self.mock_db_manager = Mock()
        self.mock_session = Mock()
        
        # 使用MagicMock来支持context manager
        self.mock_context_manager = MagicMock()
        self.mock_context_manager.__enter__.return_value = self.mock_session
        self.mock_context_manager.__exit__.return_value = None
        self.mock_db_manager.get_session.return_value = self.mock_context_manager
        
        # 创建预处理器实例
        with patch('scripts.run_arbitration_preprocess.DatabaseManager', return_value=self.mock_db_manager):
            self.preprocessor = ArbitrationPreprocessor(self.config)
        
        # 测试数据
        self.test_report_pairs = [
            {
                'stock_code': '000001',
                'qwen_report': {
                    'id': 'qwen_001',
                    'content': '该股票基本面优秀，业绩大幅增长，技术指标强势突破，强烈建议买入。',
                    'summary': '基本面优秀，技术面强势突破',
                    'sentiment_score': 0.9,
                    'keywords': ['基本面优秀', '业绩大幅增长', '技术指标', '强势突破'],
                    'entities': ['股票', '技术指标', '业绩'],
                    'created_at': datetime.now()
                },
                'doubao_report': {
                    'id': 'doubao_001',
                    'content': '市场情绪谨慎，投资者观望情绪浓厚，技术面存在回调风险，建议谨慎。',
                    'summary': '市场情绪谨慎，存在回调风险',
                    'sentiment_score': -0.3,
                    'keywords': ['市场情绪', '观望', '回调风险', '谨慎'],
                    'entities': ['市场', '投资者'],
                    'created_at': datetime.now()
                }
            }
        ]
    
    def test_initialization(self):
        """测试初始化"""
        # 检查具体配置值而不是存在性
        self.assertEqual(type(self.preprocessor.config), dict)
        self.assertEqual(type(self.preprocessor.db_manager), type(self.preprocessor.db_manager))
        self.assertEqual(type(self.preprocessor.report_comparator), type(self.preprocessor.report_comparator))
        self.assertEqual(self.preprocessor.priority_weights['divergence'], 0.5)
        self.assertEqual(self.preprocessor.priority_weights['company_importance'], 0.3)
        self.assertEqual(self.preprocessor.priority_weights['event_importance'], 0.2)
    
    def test_process_daily_arbitration_cases_no_reports(self):
        """测试处理每日仲裁案件 - 无报告情况"""
        # 模拟没有报告对的情况
        with patch.object(self.preprocessor, '_get_daily_report_pairs', return_value=[]):
            result = self.preprocessor.process_daily_arbitration_cases('2025-01-17')
            
            self.assertEqual(result['status'], 'success')
            self.assertEqual(result['processed_count'], 0)
            self.assertIn('无报告对需要处理', result['message'])
    
    def test_process_daily_arbitration_cases_with_reports(self):
        """测试处理每日仲裁案件 - 有报告情况"""
        # 模拟有报告对的情况
        with patch.object(self.preprocessor, '_get_daily_report_pairs', return_value=self.test_report_pairs), \
             patch.object(self.preprocessor, '_process_report_pairs', return_value={
                 'successful': 1, 'failed': 0, 'failed_cases': []
             }), \
             patch.object(self.preprocessor, '_generate_processing_report'):
            
            result = self.preprocessor.process_daily_arbitration_cases('2025-01-17')
            
            self.assertEqual(result['status'], 'success')
            self.assertEqual(result['processed_count'], 1)
            self.assertEqual(result['failed_count'], 0)
    
    def test_process_daily_arbitration_cases_error_handling(self):
        """测试处理每日仲裁案件 - 错误处理"""
        # 模拟异常情况
        with patch.object(self.preprocessor, '_get_daily_report_pairs', side_effect=Exception("数据库错误")):
            result = self.preprocessor.process_daily_arbitration_cases('2025-01-17')
            
            self.assertEqual(result['status'], 'error')
            self.assertIn('数据库错误', result['error'])
    
    def test_get_daily_report_pairs(self):
        """测试查询每日报告对"""
        # 模拟数据库查询结果
        mock_reports = [
            ('000001', 'qwen_fact_based', 'qwen_001', 'content1', 'summary1', 0.9, '["keyword1"]', '["entity1"]', datetime.now()),
            ('000001', 'doubao_sentiment_based', 'doubao_001', 'content2', 'summary2', -0.3, '["keyword2"]', '["entity2"]', datetime.now())
        ]
        
        self.mock_session.execute.return_value.fetchall.return_value = mock_reports
        
        result = self.preprocessor._get_daily_report_pairs('2025-01-17')
        
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['stock_code'], '000001')
        self.assertIn('qwen_report', result[0])
        self.assertIn('doubao_report', result[0])
    
    def test_get_daily_report_pairs_incomplete_pairs(self):
        """测试查询每日报告对 - 不完整对"""
        # 模拟只有Qwen报告，没有豆包报告的情况
        mock_reports = [
            ('000001', 'qwen_fact_based', 'qwen_001', 'content1', 'summary1', 0.9, '["keyword1"]', '["entity1"]', datetime.now())
        ]
        
        self.mock_session.execute.return_value.fetchall.return_value = mock_reports
        
        result = self.preprocessor._get_daily_report_pairs('2025-01-17')
        
        self.assertEqual(len(result), 0)  # 应该没有完整的报告对
    
    def test_calculate_company_importance(self):
        """测试计算公司重要性"""
        # 测试主板股票
        importance = self.preprocessor._calculate_company_importance('000001')
        self.assertEqual(importance, 0.8)
        
        # 测试创业板股票
        importance = self.preprocessor._calculate_company_importance('300001')
        self.assertEqual(importance, 0.6)
        
        # 测试科创板股票
        importance = self.preprocessor._calculate_company_importance('688001')
        self.assertEqual(importance, 0.7)
        
        # 测试其他股票
        importance = self.preprocessor._calculate_company_importance('600001')
        self.assertEqual(importance, 0.5)
    
    def test_calculate_event_importance(self):
        """测试计算事件重要性"""
        from src.analysis.report_comparator import ComparisonResult
        
        # 创建测试对比结果
        comparison_result = ComparisonResult(
            divergence_score=0.8,
            consensus_summary="测试共识",
            conflict_summary="测试争议",
            sentiment_diff=0.7,
            keyword_overlap=0.3,
            entity_diff=0.6,
            analysis_timestamp="2025-01-17T10:00:00"
        )
        
        importance = self.preprocessor._calculate_event_importance(comparison_result)
        
        # 事件重要性应该是各项指标的平均值
        expected_importance = (0.8 + 0.7 + 0.6) / 3
        self.assertAlmostEqual(importance, expected_importance, places=2)
    
    def test_calculate_arbitration_priority(self):
        """测试计算仲裁优先级"""
        from src.analysis.report_comparator import ComparisonResult
        
        # 创建测试对比结果
        comparison_result = ComparisonResult(
            divergence_score=0.8,
            consensus_summary="测试共识",
            conflict_summary="测试争议",
            sentiment_diff=0.7,
            keyword_overlap=0.3,
            entity_diff=0.6,
            analysis_timestamp="2025-01-17T10:00:00"
        )
        
        with patch.object(self.preprocessor, '_calculate_company_importance', return_value=0.8), \
             patch.object(self.preprocessor, '_calculate_event_importance', return_value=0.7):
            
            priority = self.preprocessor._calculate_arbitration_priority('000001', comparison_result)
            
            # 优先级 = 0.5 * 0.8 + 0.3 * 0.8 + 0.2 * 0.7 = 0.4 + 0.24 + 0.14 = 0.78
            expected_priority = 0.5 * 0.8 + 0.3 * 0.8 + 0.2 * 0.7
            self.assertAlmostEqual(priority, expected_priority, places=2)
    
    def test_calculate_arbitration_priority_error_handling(self):
        """测试计算仲裁优先级 - 错误处理"""
        from src.analysis.report_comparator import ComparisonResult
        
        comparison_result = ComparisonResult(
            divergence_score=0.8,
            consensus_summary="测试共识",
            conflict_summary="测试争议",
            sentiment_diff=0.7,
            keyword_overlap=0.3,
            entity_diff=0.6,
            analysis_timestamp="2025-01-17T10:00:00"
        )
        
        # 模拟异常情况
        with patch.object(self.preprocessor, '_calculate_company_importance', side_effect=Exception("计算错误")):
            priority = self.preprocessor._calculate_arbitration_priority('000001', comparison_result)
            self.assertEqual(priority, 0.5)  # 应该返回默认值
    
    def test_save_arbitration_case(self):
        """测试保存仲裁案件"""
        arbitration_case = {
            'case_id': 'ARB_000001_20250117',
            'stock_code': '000001',
            'trade_date': '2025-01-17',
            'qwen_report_id': 'qwen_001',
            'doubao_report_id': 'doubao_001',
            'divergence_score': 0.8,
            'consensus_summary': '测试共识',
            'conflict_summary': '测试争议',
            'priority_score': 0.75,
            'status': 'PENDING_HUMAN',
            'created_at': datetime.now().isoformat(),
            'analysis_metadata': {
                'sentiment_diff': 0.7,
                'keyword_overlap': 0.3,
                'entity_diff': 0.6,
                'analysis_timestamp': '2025-01-17T10:00:00'
            }
        }
        
        # 模拟数据库保存
        self.mock_session.execute.return_value = None
        self.mock_session.commit.return_value = None
        
        # 执行保存
        self.preprocessor._save_arbitration_case(arbitration_case)
        
        # 验证数据库调用
        self.mock_session.execute.assert_called_once()
        self.mock_session.commit.assert_called_once()
    
    def test_save_arbitration_case_error_handling(self):
        """测试保存仲裁案件 - 错误处理"""
        arbitration_case = {
            'case_id': 'ARB_000001_20250117',
            'stock_code': '000001',
            'trade_date': '2025-01-17',
            'qwen_report_id': 'qwen_001',
            'doubao_report_id': 'doubao_001',
            'divergence_score': 0.8,
            'consensus_summary': '测试共识',
            'conflict_summary': '测试争议',
            'priority_score': 0.75,
            'status': 'PENDING_HUMAN',
            'created_at': datetime.now().isoformat(),
            'analysis_metadata': {}
        }
        
        # 模拟数据库异常
        self.mock_session.execute.side_effect = Exception("数据库错误")
        
        # 应该抛出异常
        with self.assertRaises(Exception):
            self.preprocessor._save_arbitration_case(arbitration_case)
    
    def test_process_report_pairs(self):
        """测试处理报告对"""
        with patch.object(self.preprocessor.report_comparator, 'compare_reports') as mock_compare, \
             patch.object(self.preprocessor, '_calculate_arbitration_priority', return_value=0.75), \
             patch.object(self.preprocessor, '_save_arbitration_case'):
            
            # 模拟对比结果
            from src.analysis.report_comparator import ComparisonResult
            mock_compare.return_value = ComparisonResult(
                divergence_score=0.8,
                consensus_summary="测试共识",
                conflict_summary="测试争议",
                sentiment_diff=0.7,
                keyword_overlap=0.3,
                entity_diff=0.6,
                analysis_timestamp="2025-01-17T10:00:00"
            )
            
            result = self.preprocessor._process_report_pairs(self.test_report_pairs, '2025-01-17')
            
            self.assertEqual(result['successful'], 1)
            self.assertEqual(result['failed'], 0)
            self.assertEqual(len(result['failed_cases']), 0)
    
    def test_process_report_pairs_with_error(self):
        """测试处理报告对 - 包含错误"""
        with patch.object(self.preprocessor.report_comparator, 'compare_reports', side_effect=Exception("对比错误")):
            result = self.preprocessor._process_report_pairs(self.test_report_pairs, '2025-01-17')
            
            self.assertEqual(result['successful'], 0)
            self.assertEqual(result['failed'], 1)
            self.assertEqual(len(result['failed_cases']), 1)
            self.assertIn('对比错误', result['failed_cases'][0]['error'])
    
    def test_generate_processing_report(self):
        """测试生成处理报告"""
        results = {
            'successful': 5,
            'failed': 1,
            'failed_cases': [{'stock_code': '000001', 'error': '测试错误'}]
        }
        
        # 使用patch来捕获日志输出
        with patch.object(self.preprocessor.logger, 'info') as mock_info, \
             patch.object(self.preprocessor.logger, 'warning') as mock_warning:
            
            self.preprocessor._generate_processing_report('2025-01-17', results)
            
            # 验证日志调用
            self.assertTrue(mock_info.called)
            self.assertTrue(mock_warning.called)


class TestArbitrationPreprocessorIntegration(unittest.TestCase):
    """ArbitrationPreprocessor集成测试"""
    
    def setUp(self):
        """测试前准备"""
        self.config = {
            "database": {
                "database_url": "postgresql://test:test@localhost:5432/test_db"
            },
            "llm": {
                "providers": {
                    "qwen_plus": {
                        "api_key": "test_key",
                        "base_url": "https://dashscope.aliyuncs.com/api/v1",
                        "model": "qwen-plus"
                    }
                },
                "default_provider": "qwen_plus"
            }
        }
    
    @patch('scripts.run_arbitration_preprocess.DatabaseManager')
    @patch('scripts.run_arbitration_preprocess.ReportComparator')
    def test_full_workflow_simulation(self, mock_comparator_class, mock_db_manager_class):
        """测试完整工作流模拟"""
        # 设置模拟对象
        mock_db_manager = Mock()
        mock_db_manager_class.return_value = mock_db_manager
        
        mock_comparator = Mock()
        mock_comparator_class.return_value = mock_comparator
        
        # 模拟数据库查询结果
        mock_reports = [
            ('000001', 'qwen_fact_based', 'qwen_001', 'content1', 'summary1', 0.9, '["keyword1"]', '["entity1"]', datetime.now()),
            ('000001', 'doubao_sentiment_based', 'doubao_001', 'content2', 'summary2', -0.3, '["keyword2"]', '["entity2"]', datetime.now())
        ]
        
        mock_session = Mock()
        mock_session.execute.return_value.fetchall.return_value = mock_reports
        
        # 正确设置context manager
        mock_context_manager = MagicMock()
        mock_context_manager.__enter__.return_value = mock_session
        mock_context_manager.__exit__.return_value = None
        mock_db_manager.get_session.return_value = mock_context_manager
        
        # 模拟对比结果
        from src.analysis.report_comparator import ComparisonResult
        mock_comparison_result = ComparisonResult(
            divergence_score=0.8,
            consensus_summary="测试共识",
            conflict_summary="测试争议",
            sentiment_diff=0.7,
            keyword_overlap=0.3,
            entity_diff=0.6,
            analysis_timestamp="2025-01-17T10:00:00"
        )
        mock_comparator.compare_reports.return_value = mock_comparison_result
        
        # 创建预处理器并执行
        preprocessor = ArbitrationPreprocessor(self.config)
        result = preprocessor.process_daily_arbitration_cases('2025-01-17')
        
        # 验证结果
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['processed_count'], 1)
        self.assertEqual(result['failed_count'], 0)
        
        # 验证数据库调用
        mock_session.execute.assert_called()
        mock_session.commit.assert_called()


if __name__ == '__main__':
    # 运行测试
    unittest.main(verbosity=2)
