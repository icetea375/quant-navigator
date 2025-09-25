"""
第四阶段用户验收测试：生产环境验证
测试目标：在真实的生产环境中，亲自使用这个系统，并确认它是否真正地、在实际工作中，为您带来了价值
测试环境：生产环境云服务器
测试框架：pytest
"""

import pytest
import asyncio
import json
import os
import sys
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import time

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), '../../backend/src'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../../support_modules'))

from database.connection import DatabaseConnection
from services.DataPipelineV15Manager import DataPipelineV15Manager
from services.QuantSignalEngine import QuantSignalEngine
from services.WorkflowOrchestrator import WorkflowOrchestrator
from llm.LLM_Gateway import LLM_Gateway


class TestProductionEnvironmentValidation:
    """生产环境验证用户验收测试类"""
    
    @pytest.fixture(scope="class")
    async def production_database(self):
        """生产环境数据库连接"""
        # 生产环境配置
        db_config = {
            'host': os.getenv('PROD_DB_HOST', 'localhost'),
            'port': int(os.getenv('PROD_DB_PORT', '5432')),
            'database': os.getenv('PROD_DB_NAME', 'quant_navigator_prod'),
            'user': os.getenv('PROD_DB_USER', 'postgres'),
            'password': os.getenv('PROD_DB_PASSWORD', '')
        }
        
        db = DatabaseConnection(db_config)
        await db.connect()
        yield db
        await db.disconnect()
    
    @pytest.fixture(scope="class")
    async def production_redis(self):
        """生产环境Redis连接"""
        from redis import Redis
        redis = Redis(
            host=os.getenv('PROD_REDIS_HOST', 'localhost'),
            port=int(os.getenv('PROD_REDIS_PORT', '6379')),
            db=int(os.getenv('PROD_REDIS_DB', '0')),
            decode_responses=True
        )
        yield redis
        redis.close()
    
    @pytest.mark.production
    @pytest.mark.asyncio
    async def test_production_deployment_verification(self, production_database):
        """测试生产环境部署验证"""
        print("🚀 开始生产环境部署验证...")
        
        # 1. 验证数据库连接
        health_check_query = "SELECT 1 as health_check"
        result = await production_database.query(health_check_query)
        assert len(result) == 1, "数据库连接应该正常"
        assert result[0]['health_check'] == 1, "数据库健康检查应该通过"
        
        # 2. 验证表结构
        table_structure_query = """
        SELECT table_name, column_name, data_type
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name IN ('stock_basic', 'daily_basic', 'quant_signals', 'daily_predictions', 'generated_reports')
        ORDER BY table_name, ordinal_position
        """
        
        tables_result = await production_database.query(table_structure_query)
        table_names = set(row['table_name'] for row in tables_result)
        
        expected_tables = {'stock_basic', 'daily_basic', 'quant_signals', 'daily_predictions', 'generated_reports'}
        assert table_names.issuperset(expected_tables), f"应该包含所有必需的表：{table_names}"
        
        # 3. 验证数据完整性
        data_integrity_query = """
        SELECT 
            (SELECT COUNT(*) FROM stock_basic) as stock_count,
            (SELECT COUNT(*) FROM daily_basic) as daily_count,
            (SELECT COUNT(*) FROM quant_signals) as signal_count,
            (SELECT COUNT(*) FROM daily_predictions) as prediction_count,
            (SELECT COUNT(*) FROM generated_reports) as report_count
        """
        
        integrity_result = await production_database.query(data_integrity_query)
        integrity_data = integrity_result[0]
        
        assert integrity_data['stock_count'] > 0, "应该有股票数据"
        assert integrity_data['daily_count'] > 0, "应该有日度数据"
        
        print(f"✅ 生产环境部署验证完成 - 股票: {integrity_data['stock_count']}, 日度数据: {integrity_data['daily_count']}")
    
    @pytest.mark.production
    @pytest.mark.asyncio
    async def test_three_year_historical_data_injection(self, production_database):
        """测试3年历史数据注入与首次模型训练"""
        print("📊 开始3年历史数据注入测试...")
        
        # 1. 检查历史数据范围
        data_range_query = """
        SELECT 
            MIN(trade_date) as earliest_date,
            MAX(trade_date) as latest_date,
            COUNT(DISTINCT trade_date) as total_days,
            COUNT(DISTINCT ts_code) as total_stocks
        FROM daily_basic
        """
        
        range_result = await production_database.query(data_range_query)
        range_data = range_result[0]
        
        # 验证数据范围（至少3年）
        earliest_date = datetime.strptime(range_data['earliest_date'], '%Y%m%d')
        latest_date = datetime.strptime(range_data['latest_date'], '%Y%m%d')
        data_span_years = (latest_date - earliest_date).days / 365.25
        
        assert data_span_years >= 3.0, f"历史数据应该至少覆盖3年：{data_span_years:.1f}年"
        assert range_data['total_days'] >= 750, f"应该有至少750个交易日：{range_data['total_days']}天"
        assert range_data['total_stocks'] >= 100, f"应该有至少100只股票：{range_data['total_stocks']}只"
        
        # 2. 验证数据质量
        data_quality_query = """
        SELECT 
            COUNT(CASE WHEN close > 0 AND close < 10000 THEN 1 END) as valid_prices,
            COUNT(CASE WHEN vol > 0 THEN 1 END) as valid_volumes,
            COUNT(CASE WHEN amount > 0 THEN 1 END) as valid_amounts,
            COUNT(*) as total_records
        FROM daily_basic
        """
        
        quality_result = await production_database.query(data_quality_query)
        quality_data = quality_result[0]
        
        price_quality = quality_data['valid_prices'] / quality_data['total_records']
        volume_quality = quality_data['valid_volumes'] / quality_data['total_records']
        amount_quality = quality_data['valid_amounts'] / quality_data['total_records']
        
        assert price_quality > 0.95, f"价格数据质量应该>95%：{price_quality:.2%}"
        assert volume_quality > 0.95, f"成交量数据质量应该>95%：{volume_quality:.2%}"
        assert amount_quality > 0.95, f"成交额数据质量应该>95%：{amount_quality:.2%}"
        
        print(f"✅ 3年历史数据注入验证完成 - 跨度: {data_span_years:.1f}年, 股票: {range_data['total_stocks']}只, 交易日: {range_data['total_days']}天")
    
    @pytest.mark.production
    @pytest.mark.asyncio
    async def test_daily_workflow_execution(self, production_database, production_redis):
        """测试日常使用与仲裁 - 每日真正依赖系统进行投资思考"""
        print("📈 开始日常使用测试...")
        
        # 1. 创建生产环境工作流编排器
        workflow_config = {
            'enabled': True,
            'coreUniverse': {
                'enabled': True,
                'maxStocks': 50
            },
            'observationUniverse': {
                'enabled': True,
                'maxStocks': 200
            },
            'processing': {
                'batchSize': 10,
                'maxConcurrency': 5
            }
        }
        
        workflow_orchestrator = WorkflowOrchestrator(production_database, production_redis, workflow_config)
        
        # 2. 执行日常分析
        today = datetime.now().strftime('%Y%m%d')
        daily_result = await workflow_orchestrator.executeDailyAnalysis(today)
        
        # 验证日常分析结果
        assert daily_result['success'] == True, "日常分析应该成功"
        assert daily_result['core_stocks_processed'] > 0, "应该处理核心宇宙股票"
        assert daily_result['observation_stocks_processed'] > 0, "应该处理观察宇宙股票"
        
        # 3. 验证生成的投资建议
        investment_advice_query = """
        SELECT 
            COUNT(*) as total_predictions,
            COUNT(CASE WHEN prediction_direction = 'up' THEN 1 END) as bullish_predictions,
            COUNT(CASE WHEN prediction_direction = 'down' THEN 1 END) as bearish_predictions,
            AVG(confidence_score) as avg_confidence
        FROM daily_predictions 
        WHERE trade_date = $1
        """
        
        advice_result = await production_database.query(investment_advice_query, today)
        advice_data = advice_result[0]
        
        assert advice_data['total_predictions'] > 0, "应该生成投资预测"
        assert advice_data['avg_confidence'] > 0.5, f"平均置信度应该>0.5：{advice_data['avg_confidence']:.2f}"
        
        print(f"✅ 日常使用测试完成 - 预测数: {advice_data['total_predictions']}, 平均置信度: {advice_data['avg_confidence']:.2f}")
    
    @pytest.mark.production
    @pytest.mark.asyncio
    async def test_ai_governance_center_functionality(self, production_database):
        """测试AI治理中心功能 - 对系统过去一周的表现进行复盘"""
        print("🎯 开始AI治理中心功能测试...")
        
        # 1. 获取过去一周的数据
        week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y%m%d')
        today = datetime.now().strftime('%Y%m%d')
        
        # 2. 查询过去一周的预测准确性
        accuracy_query = """
        SELECT 
            COUNT(*) as total_predictions,
            COUNT(CASE WHEN actual_direction = prediction_direction THEN 1 END) as correct_predictions,
            AVG(confidence_score) as avg_confidence,
            AVG(ABS(actual_return - predicted_return)) as avg_error
        FROM daily_predictions 
        WHERE trade_date BETWEEN $1 AND $2
        AND actual_direction IS NOT NULL
        """
        
        accuracy_result = await production_database.query(accuracy_query, week_ago, today)
        accuracy_data = accuracy_result[0]
        
        if accuracy_data['total_predictions'] > 0:
            accuracy_rate = accuracy_data['correct_predictions'] / accuracy_data['total_predictions']
            assert accuracy_rate > 0.4, f"预测准确率应该>40%：{accuracy_rate:.2%}"
        
        # 3. 查询系统性能指标
        performance_query = """
        SELECT 
            COUNT(*) as total_signals,
            COUNT(CASE WHEN signal_value > 2 THEN 1 END) as strong_signals,
            COUNT(CASE WHEN signal_value < -2 THEN 1 END) as weak_signals,
            AVG(ABS(signal_value)) as avg_signal_strength
        FROM quant_signals 
        WHERE calculated_at >= $1
        """
        
        week_ago_timestamp = int((datetime.now() - timedelta(days=7)).timestamp() * 1000)
        performance_result = await production_database.query(performance_query, week_ago_timestamp)
        performance_data = performance_result[0]
        
        assert performance_data['total_signals'] > 0, "应该有量化信号"
        assert performance_data['avg_signal_strength'] > 0, "信号强度应该>0"
        
        print(f"✅ AI治理中心功能测试完成 - 准确率: {accuracy_rate:.2%}, 信号数: {performance_data['total_signals']}")
    
    @pytest.mark.production
    @pytest.mark.asyncio
    async def test_arbitration_and_annotation_system(self, production_database):
        """测试仲裁和标注系统 - 对发现的"坏样本"和"疑难杂症"进行仲裁和标注"""
        print("⚖️ 开始仲裁和标注系统测试...")
        
        # 1. 创建仲裁记录
        arbitration_data = {
            'prediction_id': 'test_arbitration_001',
            'stock_code': '600519.SH',
            'trade_date': datetime.now().strftime('%Y%m%d'),
            'original_prediction': 'up',
            'actual_outcome': 'down',
            'arbitration_result': 'false_positive',
            'arbitration_reason': '模型过度乐观，未考虑市场风险',
            'confidence_adjustment': -0.2,
            'arbitrated_by': 'user',
            'arbitrated_at': datetime.now()
        }
        
        # 2. 插入仲裁记录
        await production_database.execute("""
            INSERT INTO prediction_arbitrations (
                prediction_id, stock_code, trade_date, original_prediction, 
                actual_outcome, arbitration_result, arbitration_reason, 
                confidence_adjustment, arbitrated_by, arbitrated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """, 
        arbitration_data['prediction_id'],
        arbitration_data['stock_code'],
        arbitration_data['trade_date'],
        arbitration_data['original_prediction'],
        arbitration_data['actual_outcome'],
        arbitration_data['arbitration_result'],
        arbitration_data['arbitration_reason'],
        arbitration_data['confidence_adjustment'],
        arbitration_data['arbitrated_by'],
        arbitration_data['arbitrated_at']
        )
        
        # 3. 验证仲裁记录
        arbitration_query = """
        SELECT * FROM prediction_arbitrations 
        WHERE prediction_id = $1
        """
        
        arbitration_result = await production_database.query(arbitration_query, arbitration_data['prediction_id'])
        assert len(arbitration_result) == 1, "应该插入仲裁记录"
        assert arbitration_result[0]['arbitration_result'] == 'false_positive', "仲裁结果应该正确"
        
        print("✅ 仲裁和标注系统测试完成")
    
    @pytest.mark.production
    @pytest.mark.asyncio
    async def test_continuous_feedback_system(self, production_database):
        """测试持续反馈系统 - 维护产品待办清单"""
        print("📝 开始持续反馈系统测试...")
        
        # 1. 创建反馈记录
        feedback_data = {
            'feedback_id': 'test_feedback_001',
            'feedback_type': 'bug_report',
            'title': '预测准确率在特定市场条件下下降',
            'description': '在市场波动较大时，模型预测准确率明显下降',
            'priority': 'high',
            'status': 'open',
            'reported_by': 'user',
            'reported_at': datetime.now(),
            'tags': ['prediction', 'accuracy', 'market_volatility']
        }
        
        # 2. 插入反馈记录
        await production_database.execute("""
            INSERT INTO user_feedback (
                feedback_id, feedback_type, title, description, 
                priority, status, reported_by, reported_at, tags
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        """,
        feedback_data['feedback_id'],
        feedback_data['feedback_type'],
        feedback_data['title'],
        feedback_data['description'],
        feedback_data['priority'],
        feedback_data['status'],
        feedback_data['reported_by'],
        feedback_data['reported_at'],
        json.dumps(feedback_data['tags'])
        )
        
        # 3. 验证反馈记录
        feedback_query = """
        SELECT * FROM user_feedback 
        WHERE feedback_id = $1
        """
        
        feedback_result = await production_database.query(feedback_query, feedback_data['feedback_id'])
        assert len(feedback_result) == 1, "应该插入反馈记录"
        assert feedback_result[0]['priority'] == 'high', "优先级应该正确"
        
        print("✅ 持续反馈系统测试完成")
    
    @pytest.mark.production
    @pytest.mark.asyncio
    async def test_system_reliability_and_uptime(self, production_database, production_redis):
        """测试系统可靠性和正常运行时间"""
        print("🛡️ 开始系统可靠性测试...")
        
        # 1. 测试系统健康检查
        health_checks = []
        
        # 数据库健康检查
        try:
            db_result = await production_database.query("SELECT 1 as health_check")
            health_checks.append(('database', db_result[0]['health_check'] == 1))
        except Exception as e:
            health_checks.append(('database', False))
        
        # Redis健康检查
        try:
            redis_result = production_redis.ping()
            health_checks.append(('redis', redis_result == True))
        except Exception as e:
            health_checks.append(('redis', False))
        
        # 验证所有健康检查
        for service, status in health_checks:
            assert status == True, f"{service}服务应该健康"
        
        # 2. 测试系统负载能力
        start_time = time.time()
        
        # 并发执行多个查询
        tasks = []
        for i in range(10):
            task = production_database.query("SELECT COUNT(*) as count FROM daily_basic LIMIT 1")
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.time()
        
        # 验证并发处理能力
        success_count = sum(1 for result in results if not isinstance(result, Exception))
        assert success_count >= 8, f"至少8个并发查询应该成功：{success_count}/10"
        
        execution_time = end_time - start_time
        assert execution_time < 5.0, f"并发查询应该在5秒内完成：{execution_time:.2f}秒"
        
        print(f"✅ 系统可靠性测试完成 - 健康检查: {len(health_checks)}/2, 并发查询: {success_count}/10")
    
    @pytest.mark.production
    @pytest.mark.asyncio
    async def test_business_value_validation(self, production_database):
        """测试业务价值验证 - 确认系统是否真正带来价值"""
        print("💎 开始业务价值验证...")
        
        # 1. 分析预测价值
        value_analysis_query = """
        SELECT 
            COUNT(*) as total_predictions,
            COUNT(CASE WHEN prediction_direction = 'up' AND actual_direction = 'up' THEN 1 END) as correct_bullish,
            COUNT(CASE WHEN prediction_direction = 'down' AND actual_direction = 'down' THEN 1 END) as correct_bearish,
            AVG(CASE WHEN prediction_direction = actual_direction THEN ABS(actual_return) ELSE 0 END) as avg_correct_return,
            AVG(CASE WHEN prediction_direction != actual_direction THEN ABS(actual_return) ELSE 0 END) as avg_incorrect_return
        FROM daily_predictions 
        WHERE actual_direction IS NOT NULL
        AND trade_date >= $1
        """
        
        month_ago = (datetime.now() - timedelta(days=30)).strftime('%Y%m%d')
        value_result = await production_database.query(value_analysis_query, month_ago)
        value_data = value_result[0]
        
        if value_data['total_predictions'] > 0:
            # 计算价值指标
            total_correct = value_data['correct_bullish'] + value_data['correct_bearish']
            accuracy_rate = total_correct / value_data['total_predictions']
            
            # 计算平均收益差异
            if value_data['avg_correct_return'] > 0 and value_data['avg_incorrect_return'] > 0:
                return_difference = value_data['avg_correct_return'] - value_data['avg_incorrect_return']
            else:
                return_difference = 0
            
            # 验证业务价值
            assert accuracy_rate > 0.45, f"预测准确率应该>45%：{accuracy_rate:.2%}"
            assert return_difference > 0, f"正确预测的平均收益应该更高：{return_difference:.4f}"
        
        # 2. 分析系统使用情况
        usage_query = """
        SELECT 
            COUNT(DISTINCT DATE(created_at)) as active_days,
            COUNT(*) as total_operations,
            AVG(confidence_score) as avg_confidence
        FROM daily_predictions 
        WHERE created_at >= $1
        """
        
        week_ago_timestamp = datetime.now() - timedelta(days=7)
        usage_result = await production_database.query(usage_query, week_ago_timestamp)
        usage_data = usage_result[0]
        
        assert usage_data['active_days'] >= 5, f"系统应该至少活跃5天：{usage_data['active_days']}天"
        assert usage_data['total_operations'] > 0, "应该有系统操作记录"
        assert usage_data['avg_confidence'] > 0.5, f"平均置信度应该>0.5：{usage_data['avg_confidence']:.2f}"
        
        print(f"✅ 业务价值验证完成 - 准确率: {accuracy_rate:.2%}, 活跃天数: {usage_data['active_days']}")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-m', 'production'])
