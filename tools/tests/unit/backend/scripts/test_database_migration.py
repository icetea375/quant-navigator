#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库迁移测试脚本 - v11.9架构升级
测试仲裁预处理模块的数据库Schema变更

作者: AI Assistant
创建时间: 2025-01-17
版本: v11.9
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../packages/backend-python')))

import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from support_modules.database_utils import DatabaseManager
from support_modules.utils import load_config, setup_logging


class DatabaseMigrationTester:
    """数据库迁移测试器"""

    def __init__(self, config: dict):
        """
        初始化测试器

        Args:
            config: 配置参数
        """
        self.config = config
        self.logger = setup_logging("db_migration_tester")
        self.db_manager = DatabaseManager(config["database"])

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_arbitration_cases_table(self) -> bool:
        pass
        """
        测试arbitration_cases表结构

        Returns:
            测试是否通过
        """
        try:
            self.logger.info("测试arbitration_cases表结构...")

            # 检查表是否存在
            with self.db_manager.get_session() as session:
                result = session.execute("""
                    SELECT COUNT(*) as table_exists
                    FROM information_schema.tables
                    WHERE table_schema = DATABASE()
                    AND table_name = 'arbitration_cases'
                """)
                table_exists = result.fetchone()[0]

                if table_exists == 0:
                    self.logger.error("arbitration_cases表不存在")
                    return False

                # 检查表结构
                result = session.execute("""
                    SELECT column_name, data_type, is_nullable, column_default, column_comment
                    FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                    AND table_name = 'arbitration_cases'
                    ORDER BY ordinal_position
                """)
                columns = result.fetchall()

                # 验证必需字段
                required_columns = {
                    "id",
                    "case_id",
                    "stock_code",
                    "trade_date",
                    "qwen_report_id",
                    "doubao_report_id",
                    "divergence_score",
                    "sentiment_diff",
                    "keyword_overlap",
                    "entity_diff",
                    "consensus_summary",
                    "conflict_summary",
                    "priority_score",
                    "company_importance",
                    "event_importance",
                    "status",
                    "created_at",
                    "updated_at",
                }

                actual_columns = {col[0] for col in columns}
                missing_columns = required_columns - actual_columns

                if missing_columns:
                    self.logger.error(f"缺少必需字段: {missing_columns}")
                    return False

                # 检查索引
                result = session.execute("""
                    SELECT index_name, column_name
                    FROM information_schema.statistics
                    WHERE table_schema = DATABASE()
                    AND table_name = 'arbitration_cases'
                    ORDER BY index_name, seq_in_index
                """)
                indexes = result.fetchall()

                # 验证必需索引
                required_indexes = {
                    "idx_case_id",
                    "idx_stock_date",
                    "idx_status",
                    "idx_priority_score",
                }
                actual_indexes = {idx[0] for idx in indexes}
                missing_indexes = required_indexes - actual_indexes

                if missing_indexes:
                    self.logger.error(f"缺少必需索引: {missing_indexes}")
                    return False

                self.logger.info("arbitration_cases表结构验证通过")
                return True

        except Exception as e:
            self.logger.error(f"测试arbitration_cases表失败: {e}", exc_info=True)
            return False

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_generated_reports_modifications(self) -> bool:
        pass
        """
        测试generated_reports表修改

        Returns:
            测试是否通过
        """
        try:
            self.logger.info("测试generated_reports表修改...")

            with self.db_manager.get_session() as session:
                # 检查表是否存在
                result = session.execute("""
                    SELECT COUNT(*) as table_exists
                    FROM information_schema.tables
                    WHERE table_schema = DATABASE()
                    AND table_name = 'generated_reports'
                """)
                table_exists = result.fetchone()[0]

                if table_exists == 0:
                    self.logger.error("generated_reports表不存在")
                    return False

                # 检查必需字段
                result = session.execute("""
                    SELECT column_name, data_type, is_nullable, column_comment
                    FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                    AND table_name = 'generated_reports'
                    AND column_name IN ('source', 'sentiment_score', 'keywords', 'entities', 'summary')
                """)
                columns = result.fetchall()

                required_columns = {
                    "source",
                    "sentiment_score",
                    "keywords",
                    "entities",
                    "summary",
                }
                actual_columns = {col[0] for col in columns}
                missing_columns = required_columns - actual_columns

                if missing_columns:
                    self.logger.error(f"缺少必需字段: {missing_columns}")
                    return False

                # 检查source字段约束
                result = session.execute("""
                    SELECT constraint_name, check_clause
                    FROM information_schema.check_constraints
                    WHERE table_schema = DATABASE()
                    AND table_name = 'generated_reports'
                    AND constraint_name LIKE '%source%'
                """)
                constraints = result.fetchall()

                if not constraints:
                    self.logger.warning("source字段约束未找到")

                self.logger.info("generated_reports表修改验证通过")
                return True

        except Exception as e:
            self.logger.error(f"测试generated_reports表修改失败: {e}", exc_info=True)
            return False

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_arbitration_analysis_stats_table(self) -> bool:
        pass
        """
        测试arbitration_analysis_stats表

        Returns:
            测试是否通过
        """
        try:
            self.logger.info("测试arbitration_analysis_stats表...")

            with self.db_manager.get_session() as session:
                # 检查表是否存在
                result = session.execute("""
                    SELECT COUNT(*) as table_exists
                    FROM information_schema.tables
                    WHERE table_schema = DATABASE()
                    AND table_name = 'arbitration_analysis_stats'
                """)
                table_exists = result.fetchone()[0]

                if table_exists == 0:
                    self.logger.error("arbitration_analysis_stats表不存在")
                    return False

                # 检查表结构
                result = session.execute("""
                    SELECT column_name, data_type, is_nullable, column_comment
                    FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                    AND table_name = 'arbitration_analysis_stats'
                    ORDER BY ordinal_position
                """)
                columns = result.fetchall()

                required_columns = {
                    "id",
                    "trade_date",
                    "total_cases",
                    "pending_cases",
                    "completed_cases",
                    "ignored_cases",
                    "avg_divergence_score",
                    "avg_priority_score",
                    "high_priority_cases",
                    "medium_priority_cases",
                    "low_priority_cases",
                }

                actual_columns = {col[0] for col in columns}
                missing_columns = required_columns - actual_columns

                if missing_columns:
                    self.logger.error(f"缺少必需字段: {missing_columns}")
                    return False

                self.logger.info("arbitration_analysis_stats表验证通过")
                return True

        except Exception as e:
            self.logger.error(
                f"测试arbitration_analysis_stats表失败: {e}", exc_info=True
            )
            return False

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_views(self) -> bool:
        pass
        """
        测试视图创建

        Returns:
            测试是否通过
        """
        try:
            self.logger.info("测试视图创建...")

            with self.db_manager.get_session() as session:
                # 检查视图是否存在
                views_to_check = [
                    "v_high_priority_cases",
                    "v_arbitration_cases_overview",
                ]

                for view_name in views_to_check:
                    result = session.execute(
                        """
                        SELECT COUNT(*) as view_exists
                        FROM information_schema.views
                        WHERE table_schema = DATABASE()
                        AND table_name = %s
                    """,
                        (view_name,),
                    )
                    view_exists = result.fetchone()[0]

                    if view_exists == 0:
                        self.logger.error(f"视图{view_name}不存在")
                        return False

                self.logger.info("视图验证通过")
                return True

        except Exception as e:
            self.logger.error(f"测试视图失败: {e}", exc_info=True)
            return False

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_stored_procedures(self) -> bool:
        pass
        """
        测试存储过程创建

        Returns:
            测试是否通过
        """
        try:
            self.logger.info("测试存储过程创建...")

            with self.db_manager.get_session() as session:
                # 检查存储过程是否存在
                result = session.execute("""
                    SELECT COUNT(*) as proc_exists
                    FROM information_schema.routines
                    WHERE routine_schema = DATABASE()
                    AND routine_name = 'UpdateArbitrationDailyStats'
                    AND routine_type = 'PROCEDURE'
                """)
                proc_exists = result.fetchone()[0]

                if proc_exists == 0:
                    self.logger.error("存储过程UpdateArbitrationDailyStats不存在")
                    return False

                self.logger.info("存储过程验证通过")
                return True

        except Exception as e:
            self.logger.error(f"测试存储过程失败: {e}", exc_info=True)
            return False

    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
    def test_sample_data_insertion(self) -> bool:
        pass
        """
        测试示例数据插入

        Returns:
            测试是否通过
        """
        try:
            self.logger.info("测试示例数据插入...")

            with self.db_manager.get_session() as session:
                # 检查示例数据是否存在
                result = session.execute("""
                    SELECT COUNT(*) as sample_count
                    FROM arbitration_cases
                    WHERE case_id = 'ARB_000001_20250117'
                """)
                sample_count = result.fetchone()[0]

                if sample_count == 0:
                    self.logger.warning("示例数据未找到,但这不是错误")
                else:
                    self.logger.info("示例数据验证通过")

                return True

        except Exception as e:
            self.logger.error(f"测试示例数据失败: {e}", exc_info=True)
            return False

    def run_all_tests(self) -> bool:
        """
        运行所有测试

        Returns:
            所有测试是否通过
        """
        self.logger.info("=== 开始数据库迁移测试 ===")

        tests = [
            ("arbitration_cases表结构", self.test_arbitration_cases_table),
            ("generated_reports表修改", self.test_generated_reports_modifications),
            (
                "arbitration_analysis_stats表",
                self.test_arbitration_analysis_stats_table,
            ),
            ("视图创建", self.test_views),
            ("存储过程创建", self.test_stored_procedures),
            ("示例数据插入", self.test_sample_data_insertion),
        ]

        passed = 0
        total = len(tests)

        for test_name, test_func in tests:
            self.logger.info(f"运行测试: {test_name}")
            if test_func():
                self.logger.info(f"✅ {test_name} - 通过")
                passed += 1
            else:
                self.logger.error(f"❌ {test_name} - 失败")

        self.logger.info(f"=== 测试完成: {passed}/{total} 通过 ===")
        return passed == total


def main():
    """
    主函数
    """
    try:
        # 加载配置
        config = load_config("config/main_config.json")

        # 创建测试器
        tester = DatabaseMigrationTester(config)

        # 运行测试
        success = tester.run_all_tests()

        if success:
            print("✅ 所有数据库迁移测试通过")
            sys.exit(0)
        else:
            print("❌ 部分数据库迁移测试失败")
            sys.exit(1)

    except Exception as e:
        print(f"❌ 数据库迁移测试执行失败: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
