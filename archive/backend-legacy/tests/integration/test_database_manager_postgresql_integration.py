#!/usr/bin/env python3
"""
DatabaseManager PostgreSQL 真实集成测试 - 遵循测试宪法
第3条："红灯-绿灯-重构"原则 - 真正的集成测试
"""

import pytest
from sqlalchemy import create_engine, text, Column, Integer, String, Date, DateTime, JSON, DECIMAL
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, date
from typing import Dict, Any
import logging
import os

# 导入要测试的类
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from support_modules.database_utils import DatabaseManager

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 定义基类
Base = declarative_base()

# 定义 GeneratedReportEntity 模拟真实的 generated_reports 表结构
class GeneratedReportEntity(Base):
    __tablename__ = "generated_reports"
    id = Column(Integer, primary_key=True, autoincrement=True)
    stock_code = Column(String(20), nullable=False)
    trade_date = Column(Date, nullable=False)
    analyzer_type = Column(String(50))
    source = Column(String(50))
    analysis_text = Column(String)
    confidence_score = Column(DECIMAL(5, 4))
    sentiment_score = Column(DECIMAL(5, 4))
    keywords = Column(JSON)
    entities = Column(JSON)
    summary = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

@pytest.fixture(scope="module")
def test_db_config():
    """为集成测试提供一个PostgreSQL测试数据库配置"""
    return {
        "database_url": "postgresql://postgres:password@localhost:5432/quant_navigator_test"
    }

@pytest.fixture(scope="function")
def db_manager(test_db_config):
    """为每个测试函数提供一个DatabaseManager实例，并确保表被创建和删除"""
    manager = DatabaseManager(test_db_config)
    
    # 在每个测试开始前创建表
    try:
        Base.metadata.create_all(manager.db_engine)
        logger.info("PostgreSQL测试表创建成功")
    except Exception as e:
        logger.error(f"创建PostgreSQL测试表失败: {e}")
        raise
    
    yield manager
    
    # 在每个测试结束后删除表
    try:
        Base.metadata.drop_all(manager.db_engine)
        logger.info("PostgreSQL测试表删除成功")
    except Exception as e:
        logger.error(f"删除PostgreSQL测试表失败: {e}")
    finally:
        manager.close_connections()

class TestDatabaseManagerPostgreSQLIntegration:

    def test_get_mda_data_should_create_table_and_insert_data(self, db_manager):
        """
        测试 get_mda_data 能够创建表并插入数据，然后正确查询
        业务契约：当数据库中存在某股票的MD&A数据时，必须能正确地将其查询出来
        """
        stock_code = "000001"
        trade_date = date(2025, 1, 17)
        
        # 准备阶段 (Arrange): 插入测试数据
        with db_manager.get_session() as session:
            # 插入旧数据
            old_record = GeneratedReportEntity(
                stock_code=stock_code,
                trade_date=date(2025, 1, 15),
                analyzer_type="qwen_fact_analyzer",
                source="qwen_fact_based",
                analysis_text="旧的分析数据",
                confidence_score=0.7,
                summary="旧摘要",
                created_at=datetime(2025, 1, 15, 10, 0, 0)
            )
            session.add(old_record)
            
            # 插入最新数据
            latest_record = GeneratedReportEntity(
                stock_code=stock_code,
                trade_date=trade_date,
                analyzer_type="qwen_fact_analyzer",
                source="qwen_fact_based",
                analysis_text="最新的分析数据",
                confidence_score=0.85,
                summary="最新摘要",
                created_at=datetime(2025, 1, 17, 10, 0, 0)
            )
            session.add(latest_record)
            session.commit()
            
            logger.info(f"插入了2条测试数据，最新记录的ID: {latest_record.id}")

        # 执行阶段 (Act): 调用我们正在测试的方法
        result = db_manager.get_mda_data(stock_code, trade_date.strftime("%Y-%m-%d"))

        # 断言阶段 (Assert): 检查是否返回了最新的数据
        assert result is not None, "应该返回数据"
        assert result["analysis_text"] == "最新的分析数据", "应该返回最新的分析文本"
        assert result["trade_date"] == trade_date, "应该返回最新的交易日期"
        assert result["confidence_score"] == 0.85, "应该返回正确的置信度"
        assert result["summary"] == "最新摘要", "应该返回正确的摘要"
        
        logger.info("✅ 业务契约测试通过：get_mda_data 正确返回了最新数据")

    def test_get_mda_data_should_return_default_when_no_data(self, db_manager):
        """
        测试 get_mda_data 当没有数据时返回默认值
        业务契约：当数据库中不存在数据时，返回包含默认值的字典，避免调用方出错
        """
        stock_code = "999999"  # 不存在的股票代码
        trade_date = "2025-01-17"
        
        # 执行阶段 (Act): 调用我们正在测试的方法
        result = db_manager.get_mda_data(stock_code, trade_date)

        # 断言阶段 (Assert): 检查是否返回了默认值
        assert result is not None, "应该返回默认数据"
        assert result["stock_code"] == stock_code, "应该返回请求的股票代码"
        assert result["analysis_text"] == "暂无MD&A数据", "应该返回默认的分析文本"
        assert result["summary"] == "暂无数据", "应该返回默认的摘要"
        assert result["confidence_score"] == 0.0, "应该返回默认的置信度"
        
        logger.info("✅ 业务契约测试通过：get_mda_data 正确处理了无数据情况")

    def test_get_mda_data_should_handle_database_errors_gracefully(self, db_manager):
        """
        测试 get_mda_data 处理数据库错误的业务契约
        业务契约：当数据库查询失败时，优雅地处理错误，返回错误信息而不是崩溃
        """
        # 准备阶段 (Arrange): 使用无效的数据库配置
        invalid_config = {
            "database_url": "postgresql://invalid_user:invalid_pass@localhost:5432/nonexistent_db"
        }
        
        invalid_db_manager = DatabaseManager(invalid_config)
        
        # 执行阶段 (Act): 调用我们正在测试的方法
        result = invalid_db_manager.get_mda_data("000001", "2025-01-17")
        
        # 断言阶段 (Assert): 检查它是否优雅地处理了错误
        assert result is not None, "应该返回错误结构，而不是None"
        assert result["stock_code"] == "000001", "股票代码应该匹配"
        assert result["trade_date"] == "2025-01-17", "交易日期应该匹配"
        assert "error" in result, "应该包含错误信息字段"
        assert "数据库" in result["error"] or "连接" in result["error"], "应该包含数据库相关错误信息"
        
        logger.info("✅ 业务契约测试通过：get_mda_data 优雅处理了数据库错误")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
