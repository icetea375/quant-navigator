"""
DataPipelineService真实数据库集成测试
使用真实的测试数据库验证数据存储逻辑

遵循测试金字塔第二层要求：
- 模拟外部API（Tushare）
- 使用真实的测试数据库
- 验证模块间交互的真实性
"""

import os
import sqlite3
import tempfile

import pytest

from src.services.data_pipeline_service import DataPipelineService


class TestDataPipelineRealDatabaseIntegration:
    """DataPipelineService真实数据库集成测试类"""

    @pytest.fixture
    def temp_db_path(self):
        """创建临时数据库文件"""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
            return tmp.name

    @pytest.fixture
    def test_db_connection(self, temp_db_path):
        """创建测试数据库连接"""
        conn = sqlite3.connect(temp_db_path)
        yield conn
        conn.close()
        os.unlink(temp_db_path)

    @pytest.fixture
    def setup_test_tables(self, test_db_connection):
        """创建测试表"""
        cursor = test_db_connection.cursor()

        # 创建财务因子表
        cursor.execute("""
            CREATE TABLE financial_factors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                stock_code VARCHAR(20) NOT NULL,
                trade_date VARCHAR(8) NOT NULL,
                pe_ratio DECIMAL(10,4),
                pb_ratio DECIMAL(10,4),
                ps_ratio DECIMAL(10,4),
                dividend_yield DECIMAL(10,4),
                market_cap DECIMAL(20,2),
                turnover_rate DECIMAL(10,4),
                volume_ratio DECIMAL(10,4),
                float_market_cap DECIMAL(20,2),
                total_shares BIGINT,
                float_shares BIGINT,
                free_shares BIGINT,
                open_price DECIMAL(10,4),
                high_price DECIMAL(10,4),
                low_price DECIMAL(10,4),
                close_price DECIMAL(10,4),
                pre_close DECIMAL(10,4),
                price_change DECIMAL(10,4),
                price_change_pct DECIMAL(10,4),
                volume BIGINT,
                amount DECIMAL(20,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(stock_code, trade_date)
            )
        """)

        # 创建超级财务因子表
        cursor.execute("""
            CREATE TABLE super_financial_factors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                stock_code VARCHAR(20) NOT NULL,
                trade_date VARCHAR(8) NOT NULL,
                pe_ratio DECIMAL(10,4),
                pb_ratio DECIMAL(10,4),
                ps_ratio DECIMAL(10,4),
                dividend_yield DECIMAL(10,4),
                market_cap DECIMAL(20,2),
                turnover_rate DECIMAL(10,4),
                volume_ratio DECIMAL(10,4),
                float_market_cap DECIMAL(20,2),
                total_shares BIGINT,
                float_shares BIGINT,
                free_shares BIGINT,
                open_price DECIMAL(10,4),
                high_price DECIMAL(10,4),
                low_price DECIMAL(10,4),
                close_price DECIMAL(10,4),
                pre_close DECIMAL(10,4),
                price_change DECIMAL(10,4),
                price_change_pct DECIMAL(10,4),
                volume BIGINT,
                amount DECIMAL(20,2),
                value_score DECIMAL(5,2),
                growth_score DECIMAL(5,2),
                profitability_score DECIMAL(5,2),
                financial_health_score DECIMAL(5,2),
                overall_score DECIMAL(5,2),
                calculated_at VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(stock_code, trade_date)
            )
        """)

        test_db_connection.commit()

    @pytest.fixture
    def mock_config(self, temp_db_path):
        """创建模拟配置"""
        return {
            "tushare": {
                "token": "test_token",
                "timeout": 30
            },
            "database": {
                "url": f"sqlite:///{temp_db_path}"
            }
        }

    @pytest.fixture
    def data_pipeline_service(self, mock_config):
        """创建DataPipelineService实例"""
        service = DataPipelineService(mock_config)
        # 注入真实的数据库连接
        service.db_path = mock_config["database"]["url"].replace("sqlite:///", "")
        return service

    @pytest.fixture
    def sample_financial_factors(self):
        """创建示例财务因子数据"""
        return {
            "stock_code": "000001.SZ",
            "trade_date": "20240101",
            "pe_ratio": 15.0,
            "pb_ratio": 2.0,
            "ps_ratio": 3.0,
            "dividend_yield": 2.5,
            "market_cap": 1000000000.0,
            "turnover_rate": 0.05,
            "volume_ratio": 1.2,
            "float_market_cap": 800000000.0,
            "total_shares": 1000000000,
            "float_shares": 800000000,
            "free_shares": 600000000,
            "open_price": 10.0,
            "high_price": 10.5,
            "low_price": 9.5,
            "close_price": 10.2,
            "pre_close": 10.0,
            "price_change": 0.2,
            "price_change_pct": 2.0,
            "volume": 1000000,
            "amount": 10000000
        }

    @pytest.fixture
    def sample_super_financial_factors(self):
        """创建示例超级财务因子数据"""
        return {
            "stock_code": "000001.SZ",
            "trade_date": "20240101",
            "pe_ratio": 15.0,
            "pb_ratio": 2.0,
            "ps_ratio": 3.0,
            "dividend_yield": 2.5,
            "market_cap": 1000000000.0,
            "turnover_rate": 0.05,
            "volume_ratio": 1.2,
            "float_market_cap": 800000000.0,
            "total_shares": 1000000000,
            "float_shares": 800000000,
            "free_shares": 600000000,
            "open_price": 10.0,
            "high_price": 10.5,
            "low_price": 9.5,
            "close_price": 10.2,
            "pre_close": 10.0,
            "price_change": 0.2,
            "price_change_pct": 2.0,
            "volume": 1000000,
            "amount": 10000000,
            "value_score": 20.0,
            "growth_score": 50.0,
            "profitability_score": 50.0,
            "financial_health_score": 50.0,
            "overall_score": 42.5,
            "calculated_at": "2024-01-01T10:00:00"
        }

    def _save_financial_factors_to_db(self, db_path: str, financial_factors: dict):
        """真实保存财务因子到数据库"""
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT OR REPLACE INTO financial_factors
            (stock_code, trade_date, pe_ratio, pb_ratio, ps_ratio, dividend_yield,
             market_cap, turnover_rate, volume_ratio, float_market_cap, total_shares,
             float_shares, free_shares, open_price, high_price, low_price, close_price,
             pre_close, price_change, price_change_pct, volume, amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            financial_factors["stock_code"],
            financial_factors["trade_date"],
            financial_factors["pe_ratio"],
            financial_factors["pb_ratio"],
            financial_factors["ps_ratio"],
            financial_factors["dividend_yield"],
            financial_factors["market_cap"],
            financial_factors["turnover_rate"],
            financial_factors["volume_ratio"],
            financial_factors["float_market_cap"],
            financial_factors["total_shares"],
            financial_factors["float_shares"],
            financial_factors["free_shares"],
            financial_factors["open_price"],
            financial_factors["high_price"],
            financial_factors["low_price"],
            financial_factors["close_price"],
            financial_factors["pre_close"],
            financial_factors["price_change"],
            financial_factors["price_change_pct"],
            financial_factors["volume"],
            financial_factors["amount"]
        ))

        conn.commit()
        conn.close()

    def _save_super_financial_factors_to_db(self, db_path: str, super_factors: dict):
        """真实保存超级财务因子到数据库"""
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT OR REPLACE INTO super_financial_factors
            (stock_code, trade_date, pe_ratio, pb_ratio, ps_ratio, dividend_yield,
             market_cap, turnover_rate, volume_ratio, float_market_cap, total_shares,
             float_shares, free_shares, open_price, high_price, low_price, close_price,
             pre_close, price_change, price_change_pct, volume, amount,
             value_score, growth_score, profitability_score, financial_health_score,
             overall_score, calculated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            super_factors["stock_code"],
            super_factors["trade_date"],
            super_factors["pe_ratio"],
            super_factors["pb_ratio"],
            super_factors["ps_ratio"],
            super_factors["dividend_yield"],
            super_factors["market_cap"],
            super_factors["turnover_rate"],
            super_factors["volume_ratio"],
            super_factors["float_market_cap"],
            super_factors["total_shares"],
            super_factors["float_shares"],
            super_factors["free_shares"],
            super_factors["open_price"],
            super_factors["high_price"],
            super_factors["low_price"],
            super_factors["close_price"],
            super_factors["pre_close"],
            super_factors["price_change"],
            super_factors["price_change_pct"],
            super_factors["volume"],
            super_factors["amount"],
            super_factors["value_score"],
            super_factors["growth_score"],
            super_factors["profitability_score"],
            super_factors["financial_health_score"],
            super_factors["overall_score"],
            super_factors["calculated_at"]
        ))

        conn.commit()
        conn.close()

    def _verify_financial_factors_in_db(self, db_path: str, expected_data: dict):
        """验证财务因子是否正确保存到数据库"""
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT stock_code, trade_date, pe_ratio, pb_ratio, ps_ratio, dividend_yield,
                   market_cap, turnover_rate, volume_ratio, float_market_cap, total_shares,
                   float_shares, free_shares, open_price, high_price, low_price, close_price,
                   pre_close, price_change, price_change_pct, volume, amount
            FROM financial_factors
            WHERE stock_code = ? AND trade_date = ?
        """, (expected_data["stock_code"], expected_data["trade_date"]))

        result = cursor.fetchone()
        conn.close()

        assert result is not None, "财务因子数据未找到"

        # 验证数据一致性
        assert result[0] == expected_data["stock_code"]
        assert result[1] == expected_data["trade_date"]
        assert result[2] == expected_data["pe_ratio"]
        assert result[3] == expected_data["pb_ratio"]
        assert result[4] == expected_data["ps_ratio"]
        assert result[5] == expected_data["dividend_yield"]
        assert result[6] == expected_data["market_cap"]
        assert result[7] == expected_data["turnover_rate"]
        assert result[8] == expected_data["volume_ratio"]
        assert result[9] == expected_data["float_market_cap"]
        assert result[10] == expected_data["total_shares"]
        assert result[11] == expected_data["float_shares"]
        assert result[12] == expected_data["free_shares"]
        assert result[13] == expected_data["open_price"]
        assert result[14] == expected_data["high_price"]
        assert result[15] == expected_data["low_price"]
        assert result[16] == expected_data["close_price"]
        assert result[17] == expected_data["pre_close"]
        assert result[18] == expected_data["price_change"]
        assert result[19] == expected_data["price_change_pct"]
        assert result[20] == expected_data["volume"]
        assert result[21] == expected_data["amount"]

    def _verify_super_financial_factors_in_db(self, db_path: str, expected_data: dict):
        """验证超级财务因子是否正确保存到数据库"""
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT stock_code, trade_date, pe_ratio, pb_ratio, ps_ratio, dividend_yield,
                   market_cap, turnover_rate, volume_ratio, float_market_cap, total_shares,
                   float_shares, free_shares, open_price, high_price, low_price, close_price,
                   pre_close, price_change, price_change_pct, volume, amount,
                   value_score, growth_score, profitability_score, financial_health_score,
                   overall_score, calculated_at
            FROM super_financial_factors
            WHERE stock_code = ? AND trade_date = ?
        """, (expected_data["stock_code"], expected_data["trade_date"]))

        result = cursor.fetchone()
        conn.close()

        assert result is not None, "超级财务因子数据未找到"

        # 验证基础数据一致性
        assert result[0] == expected_data["stock_code"]
        assert result[1] == expected_data["trade_date"]
        assert result[2] == expected_data["pe_ratio"]
        assert result[3] == expected_data["pb_ratio"]

        # 验证评分数据一致性
        assert result[22] == expected_data["value_score"]
        assert result[23] == expected_data["growth_score"]
        assert result[24] == expected_data["profitability_score"]
        assert result[25] == expected_data["financial_health_score"]
        assert result[26] == expected_data["overall_score"]
        assert result[27] == expected_data["calculated_at"]

    # ==================== 真实数据库集成测试 ====================

    def test_save_financial_factors_to_real_database(self, data_pipeline_service, sample_financial_factors, setup_test_tables):
        """测试将财务因子保存到真实数据库"""
        # 使用真实数据库保存
        self._save_financial_factors_to_db(data_pipeline_service.db_path, sample_financial_factors)

        # 验证数据是否正确保存
        self._verify_financial_factors_in_db(data_pipeline_service.db_path, sample_financial_factors)

    def test_save_super_financial_factors_to_real_database(self, data_pipeline_service, sample_super_financial_factors, setup_test_tables):
        """测试将超级财务因子保存到真实数据库"""
        # 使用真实数据库保存
        self._save_super_financial_factors_to_db(data_pipeline_service.db_path, sample_super_financial_factors)

        # 验证数据是否正确保存
        self._verify_super_financial_factors_in_db(data_pipeline_service.db_path, sample_super_financial_factors)

    def test_database_constraints_and_uniqueness(self, data_pipeline_service, sample_financial_factors, setup_test_tables):
        """测试数据库约束和唯一性"""
        # 第一次保存
        self._save_financial_factors_to_db(data_pipeline_service.db_path, sample_financial_factors)

        # 修改数据后再次保存（应该更新而不是插入）
        modified_data = sample_financial_factors.copy()
        modified_data["pe_ratio"] = 20.0
        modified_data["pb_ratio"] = 3.0

        self._save_financial_factors_to_db(data_pipeline_service.db_path, modified_data)

        # 验证数据已更新
        self._verify_financial_factors_in_db(data_pipeline_service.db_path, modified_data)

        # 验证只有一条记录
        conn = sqlite3.connect(data_pipeline_service.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM financial_factors WHERE stock_code = ? AND trade_date = ?",
                      (sample_financial_factors["stock_code"], sample_financial_factors["trade_date"]))
        count = cursor.fetchone()[0]
        conn.close()

        assert count == 1, "应该只有一条记录，因为使用了UNIQUE约束"

    def test_database_transaction_rollback(self, data_pipeline_service, sample_financial_factors, setup_test_tables):
        """测试数据库事务回滚"""
        conn = sqlite3.connect(data_pipeline_service.db_path)
        cursor = conn.cursor()

        try:
            # 开始事务
            cursor.execute("BEGIN TRANSACTION")

            # 插入数据
            cursor.execute("""
                INSERT INTO financial_factors
                (stock_code, trade_date, pe_ratio, pb_ratio)
                VALUES (?, ?, ?, ?)
            """, (sample_financial_factors["stock_code"], sample_financial_factors["trade_date"],
                  sample_financial_factors["pe_ratio"], sample_financial_factors["pb_ratio"]))

            # 故意引发错误
            cursor.execute("INSERT INTO non_existent_table VALUES (1)")

        except sqlite3.OperationalError:
            # 回滚事务
            cursor.execute("ROLLBACK")
            conn.close()

            # 验证数据未保存
            conn = sqlite3.connect(data_pipeline_service.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM financial_factors WHERE stock_code = ? AND trade_date = ?",
                          (sample_financial_factors["stock_code"], sample_financial_factors["trade_date"]))
            count = cursor.fetchone()[0]
            conn.close()

            assert count == 0, "事务回滚后数据应该未保存"

    def test_database_performance_with_multiple_records(self, data_pipeline_service, setup_test_tables):
        """测试数据库性能（多条记录）"""
        import time

        start_time = time.time()

        # 插入100条记录
        for i in range(100):
            data = {
                "stock_code": f"00000{i:03d}.SZ",
                "trade_date": "20240101",
                "pe_ratio": 15.0 + i,
                "pb_ratio": 2.0 + i * 0.01,
                "ps_ratio": 3.0 + i * 0.02,
                "dividend_yield": 2.5 + i * 0.01,
                "market_cap": 1000000000.0 + i * 1000000,
                "turnover_rate": 0.05,
                "volume_ratio": 1.2,
                "float_market_cap": 800000000.0 + i * 800000,
                "total_shares": 1000000000,
                "float_shares": 800000000,
                "free_shares": 600000000,
                "open_price": 10.0 + i * 0.1,
                "high_price": 10.5 + i * 0.1,
                "low_price": 9.5 + i * 0.1,
                "close_price": 10.2 + i * 0.1,
                "pre_close": 10.0 + i * 0.1,
                "price_change": 0.2,
                "price_change_pct": 2.0,
                "volume": 1000000 + i * 10000,
                "amount": 10000000 + i * 100000
            }
            self._save_financial_factors_to_db(data_pipeline_service.db_path, data)

        end_time = time.time()

        # 验证性能（100条记录应该在合理时间内完成）
        assert (end_time - start_time) < 5.0, f"插入100条记录耗时过长: {end_time - start_time:.3f}秒"

        # 验证数据完整性
        conn = sqlite3.connect(data_pipeline_service.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM financial_factors")
        count = cursor.fetchone()[0]
        conn.close()

        assert count == 100, f"应该插入100条记录，实际插入{count}条"

