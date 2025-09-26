#!/usr/bin/env python3
"""
DatabaseManager 真实集成测试 - 遵循测试宪法
第3条："红灯-绿灯-重构"原则 - 真正的集成测试
"""

import pytest
import asyncio
from datetime import datetime, date
from typing import Dict, Any
import tempfile
import os

# 导入要测试的类
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from support_modules.database_utils import DatabaseManager


class TestDatabaseManagerRealIntegration:
    """测试 DatabaseManager 的真实集成功能"""

    @pytest.fixture
    def test_db_config(self):
        """测试数据库配置 - 使用SQLite内存数据库"""
        return {
            "database_url": "sqlite:///:memory:",
            "redis_url": "redis://localhost:6379/1"
        }

    @pytest.fixture
    def db_manager(self, test_db_config):
        """创建 DatabaseManager 实例"""
        return DatabaseManager(test_db_config)

    @pytest.fixture
    def sample_stock_code(self):
        """示例股票代码"""
        return "000001"

    @pytest.fixture
    def sample_trade_date(self):
        """示例交易日期"""
        return "2025-01-17"

    def test_get_mda_data_should_create_table_and_insert_data(self, db_manager, sample_stock_code, sample_trade_date):
        """
        测试 get_mda_data 的真实业务契约
        
        业务契约：当数据库中存在某股票的MD&A数据时，必须能正确地将其查询出来
        
        这是真正的集成测试：
        1. 创建真实的数据库表
        2. 插入真实的测试数据
        3. 执行真实的查询
        4. 验证真实的业务逻辑
        """
        # 准备阶段 (Arrange): 创建真实的数据库表
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS generated_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stock_code VARCHAR(20) NOT NULL,
            trade_date DATE NOT NULL,
            analyzer_type VARCHAR(50) NOT NULL,
            source VARCHAR(50) NOT NULL DEFAULT 'legacy_analysis',
            analysis_text TEXT,
            confidence_score DECIMAL(5,4) DEFAULT 0.0,
            sentiment_score DECIMAL(5,4) DEFAULT NULL,
            keywords TEXT DEFAULT NULL,
            entities TEXT DEFAULT NULL,
            summary TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        
        # 执行建表语句
        db_manager.execute_query(create_table_sql)
        
        # 插入测试数据
        insert_sql = """
        INSERT INTO generated_reports 
        (stock_code, trade_date, analyzer_type, source, analysis_text, confidence_score, summary, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        # 插入第一条记录（较旧的）
        db_manager.execute_query(insert_sql, {
            "stock_code": sample_stock_code,
            "trade_date": "2025-01-15",
            "analyzer_type": "qwen_fact_analyzer",
            "source": "qwen_fact_based",
            "analysis_text": "旧的分析数据",
            "confidence_score": 0.75,
            "summary": "旧的摘要",
            "created_at": datetime(2025, 1, 15, 10, 0, 0)
        })
        
        # 插入第二条记录（较新的）
        db_manager.execute_query(insert_sql, {
            "stock_code": sample_stock_code,
            "trade_date": "2025-01-17",
            "analyzer_type": "qwen_fact_analyzer",
            "source": "qwen_fact_based",
            "analysis_text": "最新的分析数据",
            "confidence_score": 0.85,
            "summary": "最新的摘要",
            "created_at": datetime(2025, 1, 17, 10, 0, 0)
        })
        
        # 执行阶段 (Act): 调用我们正在测试的方法
        result = db_manager.get_mda_data(sample_stock_code, sample_trade_date)
        
        # 断言阶段 (Assert): 检查它是否履行了"业务契约"
        assert result is not None, "应该返回数据，而不是None"
        assert result["stock_code"] == sample_stock_code, f"股票代码应该匹配: {sample_stock_code}"
        assert result["trade_date"] == "2025-01-17", "应该返回最新的交易日期"
        assert result["analysis_text"] == "最新的分析数据", "应该返回最新的分析文本"
        assert result["confidence_score"] == 0.85, "应该返回最新的置信度"
        assert result["summary"] == "最新的摘要", "应该返回最新的摘要"

    def test_get_mda_data_should_return_none_when_no_data_exists(self, db_manager, sample_stock_code, sample_trade_date):
        """
        测试 get_mda_data 当没有数据时的业务契约
        
        业务契约：当数据库中不存在某股票的MD&A数据时，应该返回包含默认值的字典
        """
        # 准备阶段 (Arrange): 创建空的数据库表
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS generated_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stock_code VARCHAR(20) NOT NULL,
            trade_date DATE NOT NULL,
            analyzer_type VARCHAR(50) NOT NULL,
            source VARCHAR(50) NOT NULL DEFAULT 'legacy_analysis',
            analysis_text TEXT,
            confidence_score DECIMAL(5,4) DEFAULT 0.0,
            sentiment_score DECIMAL(5,4) DEFAULT NULL,
            keywords TEXT DEFAULT NULL,
            entities TEXT DEFAULT NULL,
            summary TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        
        db_manager.execute_query(create_table_sql)
        
        # 执行阶段 (Act): 调用我们正在测试的方法
        result = db_manager.get_mda_data(sample_stock_code, sample_trade_date)
        
        # 断言阶段 (Assert): 检查它是否履行了"业务契约"
        assert result is not None, "应该返回默认结构，而不是None"
        assert result["stock_code"] == sample_stock_code, "股票代码应该匹配"
        assert result["trade_date"] == sample_trade_date, "交易日期应该匹配"
        assert result["analysis_text"] == "暂无MD&A数据", "应该返回默认提示信息"
        assert result["confidence_score"] == 0.0, "应该返回默认置信度"

    def test_get_mda_data_should_handle_database_errors_gracefully(self, db_manager, sample_stock_code, sample_trade_date):
        """
        测试 get_mda_data 处理数据库错误的业务契约
        
        业务契约：当数据库查询失败时，应该优雅地处理错误，返回错误信息而不是崩溃
        """
        # 准备阶段 (Arrange): 使用无效的数据库配置
        invalid_config = {
            "database_url": "sqlite:///nonexistent/path/database.db",
            "redis_url": "redis://localhost:6379/1"
        }
        
        invalid_db_manager = DatabaseManager(invalid_config)
        
        # 执行阶段 (Act): 调用我们正在测试的方法
        result = invalid_db_manager.get_mda_data(sample_stock_code, sample_trade_date)
        
        # 断言阶段 (Assert): 检查它是否优雅地处理了错误
        assert result is not None, "应该返回错误结构，而不是None"
        assert result["stock_code"] == sample_stock_code, "股票代码应该匹配"
        assert result["trade_date"] == sample_trade_date, "交易日期应该匹配"
        assert "error" in result, "应该包含错误信息字段"
        assert "数据库" in result["error"] or "连接" in result["error"], "应该包含数据库相关错误信息"

    def test_get_mda_data_should_query_correct_table_and_columns(self, db_manager, sample_stock_code, sample_trade_date):
        """
        测试 get_mda_data 查询正确的表和列
        
        业务契约：应该查询 generated_reports 表，并包含所有必要的字段
        """
        # 准备阶段 (Arrange): 创建数据库表
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS generated_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stock_code VARCHAR(20) NOT NULL,
            trade_date DATE NOT NULL,
            analyzer_type VARCHAR(50) NOT NULL,
            source VARCHAR(50) NOT NULL DEFAULT 'legacy_analysis',
            analysis_text TEXT,
            confidence_score DECIMAL(5,4) DEFAULT 0.0,
            sentiment_score DECIMAL(5,4) DEFAULT NULL,
            keywords TEXT DEFAULT NULL,
            entities TEXT DEFAULT NULL,
            summary TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        
        db_manager.execute_query(create_table_sql)
        
        # 插入测试数据
        insert_sql = """
        INSERT INTO generated_reports 
        (stock_code, trade_date, analyzer_type, source, analysis_text, confidence_score, summary)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        
        db_manager.execute_query(insert_sql, {
            "stock_code": sample_stock_code,
            "trade_date": sample_trade_date,
            "analyzer_type": "qwen_fact_analyzer",
            "source": "qwen_fact_based",
            "analysis_text": "测试分析数据",
            "confidence_score": 0.85,
            "summary": "测试摘要"
        })
        
        # 执行阶段 (Act): 调用我们正在测试的方法
        result = db_manager.get_mda_data(sample_stock_code, sample_trade_date)
        
        # 断言阶段 (Assert): 检查返回的数据结构
        assert result is not None, "应该返回数据"
        assert "id" in result, "应该包含 id 字段"
        assert "stock_code" in result, "应该包含 stock_code 字段"
        assert "trade_date" in result, "应该包含 trade_date 字段"
        assert "analyzer_type" in result, "应该包含 analyzer_type 字段"
        assert "source" in result, "应该包含 source 字段"
        assert "analysis_text" in result, "应该包含 analysis_text 字段"
        assert "confidence_score" in result, "应该包含 confidence_score 字段"
        assert "summary" in result, "应该包含 summary 字段"
        assert "created_at" in result, "应该包含 created_at 字段"


if __name__ == "__main__":
    # 运行测试
    pytest.main([__file__, "-v"])
