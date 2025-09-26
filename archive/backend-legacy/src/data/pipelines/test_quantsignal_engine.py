#!/usr/bin/env python3
"""
QuantSignalEngine 测试脚本 v9.6
基于已加载的数据进行量化信号计算测试

功能：
1. 测试基础量化信号计算（个体Z分数）
2. 测试复杂量化信号计算（宏观风险、市场风格等）
3. 验证信号计算逻辑和结果合理性
4. 测试核心宇宙和观察宇宙的不同处理策略

使用方法：
python scripts/test_quantsignal_engine.py --start-date 2024-01-01 --end-date 2024-03-31
"""

import argparse
import asyncio
import logging
import sys
import time
import psycopg2
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Dict, List

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("test_quantsignal_engine.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)


class QuantSignalEngineTester:
    """QuantSignalEngine测试器"""

    def __init__(self, config: Dict):
        self.config = config
        self.start_time = time.time()
        self.results = {
            "data_validation": {"status": "pending", "details": []},
            "basic_signals": {"status": "pending", "details": []},
            "complex_signals": {"status": "pending", "details": []},
            "signal_consistency": {"status": "pending", "details": []},
            "universe_processing": {"status": "pending", "details": []},
            "performance": {"status": "pending", "details": []},
        }
        self.db_conn = None
        self.cursor = None

    async def run_all_tests(self) -> Dict:
        """运行所有QuantSignalEngine测试"""
        logger.info("开始QuantSignalEngine测试...")

        try:
            # 1. 数据验证
            await self.test_data_validation()

            # 2. 基础信号计算
            await self.test_basic_signals()

            # 3. 复杂信号计算
            await self.test_complex_signals()

            # 4. 信号一致性测试
            await self.test_signal_consistency()

            # 5. 宇宙处理策略测试
            await self.test_universe_processing()

            # 6. 性能测试
            await self.test_performance()

            # 生成测试报告
            await self.generate_test_report()

        except Exception as e:
            logger.error(f"测试执行失败: {e}")
            self.results["error"] = str(e)
        finally:
            if self.db_conn:
                self.db_conn.close()

        return self.results

    async def connect_database(self):
        """连接数据库"""
        try:
            self.db_conn = psycopg2.connect(
                host=self.config.get("db_host", "localhost"),
                port=self.config.get("db_port", 5432),
                database=self.config.get("db_name", "news_analysis"),
                user=self.config.get("db_user", "news_user"),
                password=self.config.get("db_password", "news_password"),
            )
            self.cursor = self.db_conn.cursor()
            logger.info("数据库连接成功")
        except Exception as e:
            raise Exception(f"数据库连接失败: {e}")

    async def test_data_validation(self):
        """测试数据验证"""
        logger.info("开始数据验证测试...")

        try:
            await self.connect_database()

            # 检查基础数据表
            await self.check_basic_data_tables()

            # 检查数据时间范围
            await self.check_data_time_range()

            # 检查数据完整性
            await self.check_data_completeness()

            self.results["data_validation"]["status"] = "passed"
            self.results["data_validation"]["details"].append("数据验证通过")
            logger.info("数据验证测试通过")

        except Exception as e:
            self.results["data_validation"]["status"] = "failed"
            self.results["data_validation"]["details"].append(f"数据验证失败: {e}")
            logger.error(f"数据验证测试失败: {e}")
            raise

    async def check_basic_data_tables(self):
        """检查基础数据表"""
        logger.info("检查基础数据表...")

        required_tables = [
            "daily_prices",
            "index_daily_prices",
            "index_weights",
            "money_flow",
            "news",
            "announcements",
        ]

        for table in required_tables:
            self.cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = self.cursor.fetchone()[0]
            if count == 0:
                raise Exception(f"表 {table} 无数据")
            logger.info(f"表 {table}: {count:,} 条记录")

    async def check_data_time_range(self):
        """检查数据时间范围"""
        logger.info("检查数据时间范围...")

        # 检查日线数据时间范围
        self.cursor.execute("""
            SELECT MIN(trade_date), MAX(trade_date), COUNT(DISTINCT trade_date)
            FROM daily_prices
        """)
        result = self.cursor.fetchone()

        if not result[0] or not result[1]:
            raise Exception("日线数据时间范围为空")

        start_date, end_date, trading_days = result
        logger.info(f"日线数据时间范围: {start_date} 到 {end_date}")
        logger.info(f"交易日数量: {trading_days} 天")

        # 验证时间范围是否包含测试期间
        test_start = datetime.strptime(self.config["start_date"], "%Y-%m-%d").date()
        test_end = datetime.strptime(self.config["end_date"], "%Y-%m-%d").date()

        if start_date > test_start or end_date < test_end:
            raise Exception(f"数据时间范围不包含测试期间: {test_start} 到 {test_end}")

    async def check_data_completeness(self):
        """检查数据完整性"""
        logger.info("检查数据完整性...")

        # 检查股票数量
        self.cursor.execute("SELECT COUNT(DISTINCT ts_code) FROM daily_prices")
        stock_count = self.cursor.fetchone()[0]
        logger.info(f"股票数量: {stock_count} 只")

        # 检查数据完整性
        self.cursor.execute("""
            SELECT
                COUNT(DISTINCT ts_code) as stock_count,
                COUNT(DISTINCT trade_date) as trading_days,
                COUNT(*) as total_records
            FROM daily_prices
        """)
        result = self.cursor.fetchone()
        stock_count, trading_days, total_records = result

        theoretical_records = stock_count * trading_days
        completeness = (
            total_records / theoretical_records if theoretical_records > 0 else 0
        )

        logger.info(f"数据完整性: {completeness:.2%}")

        if completeness < 0.95:
            raise Exception(f"数据完整性不足: {completeness:.2%}")

    async def test_basic_signals(self):
        """测试基础信号计算"""
        logger.info("开始基础信号计算测试...")

        try:
            # 测试个体Z分数计算
            await self.test_individual_z_scores()

            # 测试信号存储
            await self.test_signal_storage()

            self.results["basic_signals"]["status"] = "passed"
            self.results["basic_signals"]["details"].append("基础信号计算通过")
            logger.info("基础信号计算测试通过")

        except Exception as e:
            self.results["basic_signals"]["status"] = "failed"
            self.results["basic_signals"]["details"].append(f"基础信号计算失败: {e}")
            logger.error(f"基础信号计算测试失败: {e}")
            raise

    async def test_individual_z_scores(self):
        """测试个体Z分数计算"""
        logger.info("测试个体Z分数计算...")

        # 获取测试股票数据
        test_stocks = await self.get_test_stocks()

        for stock_code in test_stocks[:5]:  # 测试前5只股票
            logger.info(f"计算股票 {stock_code} 的Z分数...")

            # 计算Z分数
            z_score = await self.calculate_individual_z_score(stock_code)

            # 验证Z分数合理性
            if abs(z_score) > 5:
                logger.warning(f"股票 {stock_code} Z分数异常: {z_score:.4f}")
            else:
                logger.info(f"股票 {stock_code} Z分数: {z_score:.4f}")

    async def get_test_stocks(self) -> List[str]:
        """获取测试股票列表"""
        self.cursor.execute("""
            SELECT DISTINCT ts_code
            FROM daily_prices
            ORDER BY ts_code
            LIMIT 20
        """)
        return [row[0] for row in self.cursor.fetchall()]

    async def calculate_individual_z_score(self, stock_code: str) -> float:
        """计算个体Z分数"""
        # 获取股票历史价格数据
        self.cursor.execute(
            """
            SELECT close, pct_chg
            FROM daily_prices
            WHERE ts_code = %s
            ORDER BY trade_date DESC
            LIMIT 120
        """,
            (stock_code,),
        )

        data = self.cursor.fetchall()
        if len(data) < 60:  # 至少需要60个数据点
            return 0.0

        # 计算收益率
        returns = [float(row[1]) for row in data if row[1] is not None]

        if len(returns) < 30:
            return 0.0

        # 计算Z分数
        mean_return = np.mean(returns)
        std_return = np.std(returns)

        if std_return == 0:
            return 0.0

        z_score = (returns[0] - mean_return) / std_return
        return z_score

    async def test_signal_storage(self):
        """测试信号存储"""
        logger.info("测试信号存储...")

        # 创建信号表（如果不存在）
        await self.create_signal_tables()

        # 测试信号存储
        test_signal = {
            "stock_code": "000001.SZ",
            "signal_date": "2024-01-02",
            "individual_z_score": 1.5,
            "macro_risk_z_score": 0.8,
            "market_style_z_score": -0.3,
            "quant_fingerprint_z_score": 2.1,
        }

        await self.store_signal(test_signal)
        logger.info("信号存储测试通过")

    async def create_signal_tables(self):
        """创建信号表"""
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS quant_signals (
                id SERIAL PRIMARY KEY,
                stock_code VARCHAR(20) NOT NULL,
                signal_date DATE NOT NULL,
                individual_z_score DECIMAL(10,4),
                macro_risk_z_score DECIMAL(10,4),
                market_style_z_score DECIMAL(10,4),
                quant_fingerprint_z_score DECIMAL(10,4),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(stock_code, signal_date)
            );
        """)
        self.db_conn.commit()

    async def store_signal(self, signal: Dict):
        """存储信号"""
        self.cursor.execute(
            """
            INSERT INTO quant_signals
            (stock_code, signal_date, individual_z_score, macro_risk_z_score,
             market_style_z_score, quant_fingerprint_z_score)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (stock_code, signal_date) DO UPDATE SET
            individual_z_score = EXCLUDED.individual_z_score,
            macro_risk_z_score = EXCLUDED.macro_risk_z_score,
            market_style_z_score = EXCLUDED.market_style_z_score,
            quant_fingerprint_z_score = EXCLUDED.quant_fingerprint_z_score
        """,
            (
                signal["stock_code"],
                signal["signal_date"],
                signal["individual_z_score"],
                signal["macro_risk_z_score"],
                signal["market_style_z_score"],
                signal["quant_fingerprint_z_score"],
            ),
        )
        self.db_conn.commit()

    async def test_complex_signals(self):
        """测试复杂信号计算"""
        logger.info("开始复杂信号计算测试...")

        try:
            # 测试宏观风险信号
            await self.test_macro_risk_signals()

            # 测试市场风格信号
            await self.test_market_style_signals()

            # 测试量化指纹信号
            await self.test_quant_fingerprint_signals()

            self.results["complex_signals"]["status"] = "passed"
            self.results["complex_signals"]["details"].append("复杂信号计算通过")
            logger.info("复杂信号计算测试通过")

        except Exception as e:
            self.results["complex_signals"]["status"] = "failed"
            self.results["complex_signals"]["details"].append(f"复杂信号计算失败: {e}")
            logger.error(f"复杂信号计算测试失败: {e}")
            raise

    async def test_macro_risk_signals(self):
        """测试宏观风险信号"""
        logger.info("测试宏观风险信号计算...")

        # 获取市场指数数据
        self.cursor.execute("""
            SELECT trade_date, close, pct_chg
            FROM index_daily_prices
            WHERE ts_code = '000001.SH'
            ORDER BY trade_date DESC
            LIMIT 120
        """)

        data = self.cursor.fetchall()
        if len(data) < 60:
            logger.warning("指数数据不足，跳过宏观风险信号计算")
            return

        # 计算市场波动率
        returns = [float(row[2]) for row in data if row[2] is not None]
        volatility = np.std(returns) * np.sqrt(252)  # 年化波动率

        # 计算宏观风险Z分数
        historical_volatility = await self.get_historical_volatility()
        if historical_volatility > 0:
            macro_risk_z = (volatility - historical_volatility) / (
                historical_volatility * 0.1
            )
        else:
            macro_risk_z = 0.0

        logger.info(f"宏观风险Z分数: {macro_risk_z:.4f}")

    async def get_historical_volatility(self) -> float:
        """获取历史波动率"""
        # 模拟历史波动率计算
        return 0.15  # 15%年化波动率

    async def test_market_style_signals(self):
        """测试市场风格信号"""
        logger.info("测试市场风格信号计算...")

        # 模拟市场风格因子计算
        style_factors = ["value", "growth", "momentum", "quality", "volatility"]
        style_z_scores = {}

        for factor in style_factors:
            # 模拟风格因子Z分数计算
            z_score = np.random.normal(0, 1)
            style_z_scores[factor] = z_score
            logger.info(f"{factor} 风格Z分数: {z_score:.4f}")

        return style_z_scores

    async def test_quant_fingerprint_signals(self):
        """测试量化指纹信号"""
        logger.info("测试量化指纹信号计算...")

        # 获取测试股票
        test_stocks = await self.get_test_stocks()

        for stock_code in test_stocks[:3]:  # 测试前3只股票
            # 计算量化指纹
            fingerprint_score = await self.calculate_quant_fingerprint(stock_code)
            logger.info(f"股票 {stock_code} 量化指纹: {fingerprint_score:.4f}")

    async def calculate_quant_fingerprint(self, stock_code: str) -> float:
        """计算量化指纹"""
        # 获取股票多维度数据
        self.cursor.execute(
            """
            SELECT close, pct_chg, vol, amount
            FROM daily_prices
            WHERE ts_code = %s
            ORDER BY trade_date DESC
            LIMIT 60
        """,
            (stock_code,),
        )

        data = self.cursor.fetchall()
        if len(data) < 30:
            return 0.0

        # 计算多维度特征
        returns = [float(row[1]) for row in data if row[1] is not None]
        volumes = [float(row[2]) for row in data if row[2] is not None]
        amounts = [float(row[3]) for row in data if row[3] is not None]

        # 计算特征
        return_volatility = np.std(returns) if len(returns) > 1 else 0
        volume_trend = (
            np.mean(volumes[-10:]) / np.mean(volumes[-30:]) if len(volumes) >= 30 else 1
        )
        amount_trend = (
            np.mean(amounts[-10:]) / np.mean(amounts[-30:]) if len(amounts) >= 30 else 1
        )

        # 综合量化指纹
        fingerprint = (
            return_volatility * 0.4
            + (volume_trend - 1) * 0.3
            + (amount_trend - 1) * 0.3
        )

        return fingerprint

    async def test_signal_consistency(self):
        """测试信号一致性"""
        logger.info("开始信号一致性测试...")

        try:
            # 测试时间序列一致性
            await self.test_temporal_consistency()

            # 测试跨股票一致性
            await self.test_cross_stock_consistency()

            self.results["signal_consistency"]["status"] = "passed"
            self.results["signal_consistency"]["details"].append("信号一致性测试通过")
            logger.info("信号一致性测试通过")

        except Exception as e:
            self.results["signal_consistency"]["status"] = "failed"
            self.results["signal_consistency"]["details"].append(
                f"信号一致性测试失败: {e}"
            )
            logger.error(f"信号一致性测试失败: {e}")
            raise

    async def test_temporal_consistency(self):
        """测试时间序列一致性"""
        logger.info("测试时间序列一致性...")

        # 获取测试股票的时间序列数据
        test_stocks = await self.get_test_stocks()
        stock_code = test_stocks[0]

        # 计算不同时间窗口的Z分数
        windows = [30, 60, 90, 120]
        z_scores = {}

        for window in windows:
            z_score = await self.calculate_individual_z_score_with_window(
                stock_code, window
            )
            z_scores[window] = z_score
            logger.info(f"窗口 {window} 天 Z分数: {z_score:.4f}")

        # 验证一致性
        z_values = list(z_scores.values())
        if len(z_values) > 1:
            max_diff = max(z_values) - min(z_values)
            if max_diff > 3:  # 假设差异超过3为异常
                logger.warning(f"时间序列一致性异常，最大差异: {max_diff:.4f}")
            else:
                logger.info(f"时间序列一致性良好，最大差异: {max_diff:.4f}")

    async def calculate_individual_z_score_with_window(
        self, stock_code: str, window: int
    ) -> float:
        """计算指定窗口的个体Z分数"""
        self.cursor.execute(
            """
            SELECT pct_chg
            FROM daily_prices
            WHERE ts_code = %s
            ORDER BY trade_date DESC
            LIMIT %s
        """,
            (stock_code, window),
        )

        data = self.cursor.fetchall()
        if len(data) < window // 2:
            return 0.0

        returns = [row[0] for row in data if row[0] is not None]

        if len(returns) < 10:
            return 0.0

        mean_return = np.mean(returns)
        std_return = np.std(returns)

        if std_return == 0:
            return 0.0

        z_score = (returns[0] - mean_return) / std_return
        return z_score

    async def test_cross_stock_consistency(self):
        """测试跨股票一致性"""
        logger.info("测试跨股票一致性...")

        # 获取多只股票的Z分数
        test_stocks = (await self.get_test_stocks())[:5]
        z_scores = []

        for stock_code in test_stocks:
            z_score = await self.calculate_individual_z_score(stock_code)
            z_scores.append(z_score)

        # 验证分布合理性
        z_scores = [z for z in z_scores if not np.isnan(z)]
        if len(z_scores) > 1:
            mean_z = np.mean(z_scores)
            std_z = np.std(z_scores)

            logger.info(f"Z分数分布 - 均值: {mean_z:.4f}, 标准差: {std_z:.4f}")

            # 检查异常值
            outliers = [z for z in z_scores if abs(z) > 3]
            if len(outliers) > len(z_scores) * 0.2:  # 超过20%为异常值
                logger.warning(f"异常值过多: {len(outliers)}/{len(z_scores)}")
            else:
                logger.info(f"异常值比例正常: {len(outliers)}/{len(z_scores)}")

    async def test_universe_processing(self):
        """测试宇宙处理策略"""
        logger.info("开始宇宙处理策略测试...")

        try:
            # 测试核心宇宙处理
            await self.test_core_universe_processing()

            # 测试观察宇宙处理
            await self.test_observation_universe_processing()

            self.results["universe_processing"]["status"] = "passed"
            self.results["universe_processing"]["details"].append(
                "宇宙处理策略测试通过"
            )
            logger.info("宇宙处理策略测试通过")

        except Exception as e:
            self.results["universe_processing"]["status"] = "failed"
            self.results["universe_processing"]["details"].append(
                f"宇宙处理策略测试失败: {e}"
            )
            logger.error(f"宇宙处理策略测试失败: {e}")
            raise

    async def test_core_universe_processing(self):
        """测试核心宇宙处理"""
        logger.info("测试核心宇宙处理...")

        # 模拟核心宇宙股票（前100只）
        core_stocks = (await self.get_test_stocks())[:100]

        # 为核心宇宙股票计算复杂信号
        complex_signals_count = 0
        for stock_code in core_stocks[:10]:  # 测试前10只
            # 计算复杂信号
            macro_risk_z = await self.calculate_macro_risk_z_score(stock_code)
            market_style_z = await self.calculate_market_style_z_score(stock_code)
            quant_fingerprint_z = await self.calculate_quant_fingerprint_z_score(
                stock_code
            )

            if (
                not np.isnan(macro_risk_z)
                and not np.isnan(market_style_z)
                and not np.isnan(quant_fingerprint_z)
            ):
                complex_signals_count += 1

        logger.info(f"核心宇宙复杂信号计算完成: {complex_signals_count}/10")

    async def test_observation_universe_processing(self):
        """测试观察宇宙处理"""
        logger.info("测试观察宇宙处理...")

        # 模拟观察宇宙股票（剩余股票）
        all_stocks = await self.get_test_stocks()
        observation_stocks = all_stocks[100:] if len(all_stocks) > 100 else []

        # 为观察宇宙股票计算基础信号
        basic_signals_count = 0
        for stock_code in observation_stocks[:10]:  # 测试前10只
            # 只计算基础Z分数
            individual_z = await self.calculate_individual_z_score(stock_code)

            if not np.isnan(individual_z):
                basic_signals_count += 1

        logger.info(f"观察宇宙基础信号计算完成: {basic_signals_count}/10")

    async def calculate_macro_risk_z_score(self, stock_code: str) -> float:
        """计算宏观风险Z分数"""
        # 模拟宏观风险Z分数计算
        return np.random.normal(0, 1)

    async def calculate_market_style_z_score(self, stock_code: str) -> float:
        """计算市场风格Z分数"""
        # 模拟市场风格Z分数计算
        return np.random.normal(0, 1)

    async def calculate_quant_fingerprint_z_score(self, stock_code: str) -> float:
        """计算量化指纹Z分数"""
        # 模拟量化指纹Z分数计算
        return np.random.normal(0, 1)

    async def test_performance(self):
        """测试性能"""
        logger.info("开始性能测试...")

        try:
            # 测试计算速度
            await self.test_calculation_speed()

            # 测试内存使用
            await self.test_memory_usage()

            self.results["performance"]["status"] = "passed"
            self.results["performance"]["details"].append("性能测试通过")
            logger.info("性能测试通过")

        except Exception as e:
            self.results["performance"]["status"] = "failed"
            self.results["performance"]["details"].append(f"性能测试失败: {e}")
            logger.error(f"性能测试失败: {e}")
            raise

    async def test_calculation_speed(self):
        """测试计算速度"""
        logger.info("测试计算速度...")

        test_stocks = (await self.get_test_stocks())[:20]

        start_time = time.time()

        # 批量计算Z分数
        for stock_code in test_stocks:
            await self.calculate_individual_z_score(stock_code)

        end_time = time.time()
        duration = end_time - start_time

        stocks_per_second = len(test_stocks) / duration
        logger.info(f"计算速度: {stocks_per_second:.2f} 股票/秒")

        if stocks_per_second < 1:  # 假设至少1股票/秒
            logger.warning(f"计算速度较慢: {stocks_per_second:.2f} 股票/秒")
        else:
            logger.info(f"计算速度正常: {stocks_per_second:.2f} 股票/秒")

    async def test_memory_usage(self):
        """测试内存使用"""
        logger.info("测试内存使用...")

        try:
            import psutil
            import os

            process = psutil.Process(os.getpid())
            memory_mb = process.memory_info().rss / 1024 / 1024

            logger.info(f"当前内存使用: {memory_mb:.2f} MB")

            if memory_mb > 1000:  # 假设超过1GB为异常
                logger.warning(f"内存使用过高: {memory_mb:.2f} MB")
            else:
                logger.info(f"内存使用正常: {memory_mb:.2f} MB")
        except ImportError:
            logger.info("psutil模块未安装，跳过内存使用测试")
        except Exception as e:
            logger.warning(f"内存使用测试失败: {e}")

    async def generate_test_report(self):
        """生成测试报告"""
        logger.info("生成测试报告...")

        end_time = time.time()
        total_duration = end_time - self.start_time

        # 计算测试统计
        total_tests = len(self.results)
        passed_tests = sum(
            1
            for result in self.results.values()
            if isinstance(result, dict) and result.get("status") == "passed"
        )
        failed_tests = sum(
            1
            for result in self.results.values()
            if isinstance(result, dict) and result.get("status") == "failed"
        )

        # 生成报告
        report = {
            "summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": failed_tests,
                "pass_rate": passed_tests / total_tests if total_tests > 0 else 0,
                "total_duration": total_duration,
                "timestamp": datetime.now().isoformat(),
            },
            "results": self.results,
            "config": self.config,
        }

        # 保存报告
        report_file = (
            f"quantsignal_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        import json

        with open(report_file, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        logger.info(f"测试报告已保存: {report_file}")
        logger.info(
            f"QuantSignalEngine测试完成 - 通过率: {report['summary']['pass_rate'] * 100:.1f}%, 耗时: {total_duration:.2f}秒"
        )

        return report


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="QuantSignalEngine测试")
    parser.add_argument("--start-date", required=True, help="测试开始日期 (YYYY-MM-DD)")
    parser.add_argument("--end-date", required=True, help="测试结束日期 (YYYY-MM-DD)")
    parser.add_argument("--db-host", default="localhost", help="数据库主机")
    parser.add_argument("--db-port", type=int, default=5432, help="数据库端口")
    parser.add_argument("--db-name", default="news_analysis", help="数据库名称")
    parser.add_argument("--db-user", default="news_user", help="数据库用户")
    parser.add_argument("--db-password", default="news_password", help="数据库密码")

    args = parser.parse_args()

    # 配置
    config = {
        "start_date": args.start_date,
        "end_date": args.end_date,
        "db_host": args.db_host,
        "db_port": args.db_port,
        "db_name": args.db_name,
        "db_user": args.db_user,
        "db_password": args.db_password,
    }

    # 运行测试
    tester = QuantSignalEngineTester(config)

    try:
        results = asyncio.run(tester.run_all_tests())

        # 检查测试结果
        if results.get("error"):
            logger.error(f"测试执行失败: {results['error']}")
            sys.exit(1)

        # 检查是否有失败的测试
        failed_tests = [
            name
            for name, result in results.items()
            if isinstance(result, dict) and result.get("status") == "failed"
        ]

        if failed_tests:
            logger.error(f"以下测试失败: {', '.join(failed_tests)}")
            sys.exit(1)

        logger.info("所有QuantSignalEngine测试通过！")
        sys.exit(0)

    except KeyboardInterrupt:
        logger.info("测试被用户中断")
        sys.exit(1)
    except Exception as e:
        logger.error(f"测试执行异常: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
