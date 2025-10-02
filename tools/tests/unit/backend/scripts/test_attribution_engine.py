#!/usr/bin/env python3
"""
AttributionEngine测试脚本
测试归因引擎的核心功能,包括规则引擎、归因分析、性能监控等
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../packages/backend-python')))

import sys
import os
import logging
from datetime import datetime
from typing import List
import psycopg2
from psycopg2.extras import RealDictCursor

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src")
)

# from src.attribution.rule_engine import AttributionRuleEngine
# from src.monitoring.attribution_monitor import AttributionMonitor, AttributionMetrics

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AttributionEngineTester:
    """AttributionEngine测试器"""

    def __init__(self):
        self.db_conn = None
        self.rule_engine = None
        self.attribution_monitor = None
        self.test_results = {
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "test_details": [],
        }

    def setup(self):
        """初始化测试环境"""
        try:
            logger.info("🔧 初始化AttributionEngine测试环境...")

            # 初始化数据库连接
            self.db_conn = psycopg2.connect(
                host="localhost",
                database="news_analysis",
                user="news_user",
                password="news_password",
                port=5432,
            )

            # 初始化规则引擎
            rules_config_path = "config/attribution_rules.json"
            if os.path.exists(rules_config_path):
                self.rule_engine = AttributionRuleEngine(rules_config_path)
            else:
                logger.warning(f"规则配置文件不存在: {rules_config_path}")
                self.rule_engine = None

            # 初始化归因监控器
            self.attribution_monitor = AttributionMonitor()

            logger.info("✅ AttributionEngine测试环境初始化完成")
            return True

        except Exception as e:
            logger.error(f"❌ AttributionEngine测试环境初始化失败: {e}")
            return False

    def cleanup(self):
        """清理测试环境"""
        try:
            if self.db_conn:
                self.db_conn.close()

            logger.info("🧹 AttributionEngine测试环境清理完成")

        except Exception as e:
            logger.error(f"❌ 清理测试环境失败: {e}")

    def log_test_result(self, test_name: str, passed: bool, details: str = ""):
        """记录测试结果"""
        self.test_results["total_tests"] += 1
        if passed:
            self.test_results["passed_tests"] += 1
            logger.info(f"✅ {test_name}: 通过")
        else:
            self.test_results["failed_tests"] += 1
            logger.error(f"❌ {test_name}: 失败 - {details}")

        self.test_results["test_details"].append(
            {
                "test_name": test_name,
                "passed": passed,
                "details": details,
                "timestamp": datetime.now().isoformat(),
            }
        )

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_green_phase_engine_initialization(self):
        pass
        """测试引擎初始化"""
        try:
            logger.info("🧪 测试AttributionEngine初始化...")

            # 检查数据库连接
            assert self.db_conn is not None, "数据库连接未初始化"

            # 检查规则引擎
            if self.rule_engine is not None:
                assert hasattr(self.rule_engine, 'rules_config')  # TODO: 替换为具体的值断言, "规则引擎应包含配置"
                assert hasattr(self.rule_engine, 'stats')  # TODO: 替换为具体的值断言, "规则引擎应包含统计信息"

            # 检查归因监控器
            assert self.attribution_monitor is not None, "归因监控器未初始化"

            self.log_test_result("引擎初始化", True, "所有组件正常初始化")
            return True

        except Exception as e:
            self.log_test_result("引擎初始化", False, str(e))
            return False

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_rule_engine(self):
        pass
        """测试规则引擎功能"""
        try:
            logger.info("🧪 测试规则引擎功能...")

            if self.rule_engine is None:
                self.log_test_result("规则引擎", False, "规则引擎未初始化")
                return False

            # 创建测试事件数据
            test_event_data = {
                "code": "000001.SZ",
                "price_change": 0.15,
                "volume_ratio": 2.5,
                "market_cap": 1000000000,
                "sector": "银行",
                "event_type": "earnings_announcement",
            }

            # 执行规则检查
            attribution_result = self.rule_engine.execute_attribution_rules(
                test_event_data
            )

            # 验证结果
            if attribution_result is not None:
                assert "attribution_label" in attribution_result, "结果应包含归因标签"
                assert "rule_id" in attribution_result, "结果应包含规则ID"
                assert "confidence" in attribution_result, "结果应包含置信度"
                assert "priority" in attribution_result, "结果应包含优先级"
                assert "cost_tier" in attribution_result, "结果应包含成本层级"

            # 检查统计信息
            stats = self.rule_engine.stats
            assert "total_processed" in stats, "统计应包含总处理数"
            assert "rules_matched" in stats, "统计应包含规则匹配数"
            assert "auto_attributed" in stats, "统计应包含自动归因数"

            self.log_test_result(
                "规则引擎", True, f"处理了{stats['total_processed']}个事件"
            )
            return True

        except Exception as e:
            self.log_test_result("规则引擎", False, str(e))
            return False

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_attribution_monitor(self):
        pass
        """测试归因监控功能"""
        try:
            logger.info("🧪 测试归因监控功能...")

            # 创建测试指标
            test_metrics = AttributionMetrics(
                date=datetime.now().strftime("%Y-%m-%d"),
                total_anomalies=10,
                stage1_auto_attributed=8,
                stage2_llm_processed=2,
                stage3_expert_consulted=0,
                stage1_cost=0.5,
                stage2_cost=2.0,
                stage3_cost=0.0,
                manual_sample_checked=5,
                manual_sample_correct=4,
                processing_time_ms=1500.0,
            )

            # 测试指标记录
            self.attribution_monitor.record_daily_metrics(test_metrics)

            # 测试指标查询
            recent_metrics = self.attribution_monitor.get_metrics_summary(days=7)
            assert recent_metrics is not None  # TODO: 替换为具体的值断言, "应能获取最近指标"

            # 测试性能仪表盘
            performance_dashboard = self.attribution_monitor.get_performance_dashboard(
                days=7
            )
            assert performance_dashboard is not None  # TODO: 替换为具体的值断言, "应能获取性能仪表盘"

            self.log_test_result("归因监控", True, "监控功能正常")
            return True

        except Exception as e:
            self.log_test_result("归因监控", False, str(e))
            return False

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_database_integration(self):
        pass
        """测试数据库集成"""
        try:
            logger.info("🧪 测试数据库集成...")

            # 测试数据库连接
            cursor = self.db_conn.cursor(cursor_factory=RealDictCursor)

            # 查询测试数据
            cursor.execute("SELECT COUNT(*) as count FROM daily_prices LIMIT 1")
            result = cursor.fetchone()
            assert result is not None  # TODO: 替换为具体的值断言, "应能查询数据库"

            # 查询归因相关表
            cursor.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name LIKE '%attribution%' OR table_name LIKE '%anomaly%'
            """)
            tables = cursor.fetchall()

            cursor.close()

            self.log_test_result("数据库集成", True, f"找到{len(tables)}个相关表")
            return True

        except Exception as e:
            self.log_test_result("数据库集成", False, str(e))
            return False

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_attribution_analysis(self):
        pass
        """测试归因分析功能"""
        try:
            logger.info("🧪 测试归因分析功能...")

            # 获取测试股票数据
            cursor = self.db_conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("""
                SELECT ts_code, trade_date, close, pct_chg, vol, amount
                FROM daily_prices
                WHERE trade_date >= '2024-01-01'
                AND pct_chg > 5.0
                LIMIT 5
            """)
            test_stocks = cursor.fetchall()
            cursor.close()

            if not test_stocks:
                self.log_test_result("归因分析", False, "无测试股票数据")
                return False

            # 模拟归因分析
            for stock in test_stocks:
                # 创建事件数据
                event_data = {
                    "code": stock["ts_code"],
                    "date": stock["trade_date"],
                    "price_change": stock["pct_chg"],
                    "volume": stock["vol"],
                    "amount": stock["amount"],
                    "event_type": "price_movement",
                }

                # 执行规则引擎分析
                if self.rule_engine:
                    attribution_result = self.rule_engine.execute_attribution_rules(
                        event_data
                    )
                    if attribution_result:
                        logger.info(
                            f"股票 {stock['ts_code']} 归因结果: {attribution_result['attribution_label']}"
                        )

            self.log_test_result(
                "归因分析", True, f"分析了{len(test_stocks)}个股票事件"
            )
            return True

        except Exception as e:
            self.log_test_result("归因分析", False, str(e))
            return False

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_performance_metrics(self):
        pass
        """测试性能指标"""
        try:
            logger.info("🧪 测试性能指标...")

            # 测试规则引擎统计
            if self.rule_engine:
                stats = self.rule_engine.stats
                assert "total_processed" in stats, "应包含总处理数"
                assert "rules_matched" in stats, "应包含规则匹配数"
                assert "auto_attributed" in stats, "应包含自动归因数"
                assert "processing_times" in stats, "应包含处理时间列表"

                # 计算平均处理时间
                if stats["processing_times"]:
                    avg_time = sum(stats["processing_times"]) / len(
                        stats["processing_times"]
                    )
                    logger.info(f"平均处理时间: {avg_time:.2f}ms")

            # 测试归因监控统计
            monitor_stats = self.attribution_monitor.get_metrics_summary(days=7)
            assert monitor_stats is not None  # TODO: 替换为具体的值断言, "应能获取监控统计"

            self.log_test_result("性能指标", True, "性能指标正常")
            return True

        except Exception as e:
            self.log_test_result("性能指标", False, str(e))
            return False

    def get_test_stocks(self) -> List[str]:
        """获取测试股票列表"""
        try:
            cursor = self.db_conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("""
                SELECT DISTINCT ts_code
                FROM daily_prices
                WHERE trade_date >= '2024-01-01'
                LIMIT 5
            """)
            result = cursor.fetchall()
            cursor.close()
            return [row["ts_code"] for row in result] if result else []

        except Exception as e:
            logger.error(f"获取测试股票失败: {e}")
            return []

    def run_all_tests(self):
        """运行所有测试"""
        logger.info("🚀 开始AttributionEngine全面测试...")

        # 初始化测试环境
        if not self.setup():
            logger.error("❌ 测试环境初始化失败,退出测试")
            return False

        try:
            # 运行各项测试
            self.test_engine_initialization()
            self.test_rule_engine()
            self.test_attribution_monitor()
            self.test_database_integration()
            self.test_attribution_analysis()
            self.test_performance_metrics()

            # 输出测试结果
            self.print_test_summary()

            return self.test_results["failed_tests"] == 0

        finally:
            self.cleanup()

    def print_test_summary(self):
        """打印测试总结"""
        logger.info("\n" + "=" * 60)
        logger.info("📊 AttributionEngine测试结果总结")
        logger.info("=" * 60)

        total = self.test_results["total_tests"]
        passed = self.test_results["passed_tests"]
        failed = self.test_results["failed_tests"]

        logger.info(f"总测试数: {total}")
        logger.info(f"通过测试: {passed} ✅")
        logger.info(f"失败测试: {failed} ❌")
        logger.info(f"成功率: {(passed/total*100):.1f}%" if total > 0 else "成功率: 0%")

        if failed > 0:
            logger.info("\n❌ 失败的测试:")
            for test in self.test_results["test_details"]:
                if not test["passed"]:
                    logger.info(f"  - {test['test_name']}: {test['details']}")

        logger.info("=" * 60)


def main():
    """主函数"""
    tester = AttributionEngineTester()
    success = tester.run_all_tests()

    if success:
        logger.info("🎉 AttributionEngine测试全部通过！")
        sys.exit(0)
    else:
        logger.error("💥 AttributionEngine测试存在失败项！")
        sys.exit(1)


if __name__ == "__main__":
    main()
