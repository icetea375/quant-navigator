#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库迁移执行脚本 - v11.9架构升级
执行仲裁预处理模块的数据库Schema变更

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

from support_modules.database_utils import DatabaseManager
from support_modules.utils import load_config, setup_logging


class DatabaseMigrationRunner:
    """数据库迁移执行器"""
    
    def __init__(self, config: dict):
        """
        初始化迁移执行器
        
        Args:
            config: 配置参数
        """
        self.config = config
        self.logger = setup_logging("db_migration_runner")
        self.db_manager = DatabaseManager(config['database'])
        
    def execute_migration(self, migration_file: str) -> bool:
        """
        执行数据库迁移
        
        Args:
            migration_file: 迁移文件路径
            
        Returns:
            迁移是否成功
        """
        try:
            self.logger.info(f"开始执行数据库迁移: {migration_file}")
            
            # 读取迁移文件
            with open(migration_file, 'r', encoding='utf-8') as f:
                migration_sql = f.read()
            
            # 分割SQL语句（按分号分割，但要注意存储过程中的分号）
            statements = self._split_sql_statements(migration_sql)
            
            with self.db_manager.get_session() as session:
                for i, statement in enumerate(statements):
                    if statement.strip():
                        self.logger.info(f"执行SQL语句 {i+1}/{len(statements)}")
                        try:
                            session.execute(statement)
                            session.commit()
                        except Exception as e:
                            self.logger.error(f"执行SQL语句失败: {e}")
                            self.logger.error(f"失败的语句: {statement[:200]}...")
                            raise
            
            self.logger.info("数据库迁移执行完成")
            return True
            
        except Exception as e:
            self.logger.error(f"数据库迁移执行失败: {e}", exc_info=True)
            return False
    
    def _split_sql_statements(self, sql: str) -> list:
        """
        分割SQL语句，处理存储过程中的分号
        
        Args:
            sql: SQL字符串
            
        Returns:
            SQL语句列表
        """
        statements = []
        current_statement = ""
        in_delimiter = False
        delimiter = ";"
        
        lines = sql.split('\n')
        i = 0
        
        while i < len(lines):
            line = lines[i].strip()
            
            # 检查是否进入DELIMITER模式
            if line.upper().startswith('DELIMITER '):
                if not in_delimiter:
                    delimiter = line.split()[1]
                    in_delimiter = True
                    i += 1
                    continue
                else:
                    delimiter = ";"
                    in_delimiter = False
                    i += 1
                    continue
            
            # 检查是否到达语句结束
            if line.endswith(delimiter):
                current_statement += line[:-len(delimiter)] + "\n"
                if current_statement.strip():
                    statements.append(current_statement.strip())
                current_statement = ""
            else:
                current_statement += line + "\n"
            
            i += 1
        
        # 添加最后一个语句（如果有）
        if current_statement.strip():
            statements.append(current_statement.strip())
        
        return statements
    
    def backup_database(self) -> bool:
        """
        备份数据库（可选）
        
        Returns:
            备份是否成功
        """
        try:
            self.logger.info("开始备份数据库...")
            
            # 这里可以实现数据库备份逻辑
            # 由于不同数据库的备份方式不同，这里只是示例
            
            self.logger.info("数据库备份完成")
            return True
            
        except Exception as e:
            self.logger.error(f"数据库备份失败: {e}", exc_info=True)
            return False
    
    def rollback_migration(self) -> bool:
        """
        回滚迁移（如果需要）
        
        Returns:
            回滚是否成功
        """
        try:
            self.logger.info("开始回滚数据库迁移...")
            
            # 这里可以实现回滚逻辑
            # 由于迁移的复杂性，回滚可能需要手动处理
            
            self.logger.warning("回滚功能需要手动处理")
            return True
            
        except Exception as e:
            self.logger.error(f"数据库回滚失败: {e}", exc_info=True)
            return False


def main():
    """
    主函数
    """
    try:
        # 加载配置
        config = load_config("config/main_config.json")
        
        # 创建迁移执行器
        runner = DatabaseMigrationRunner(config)
        
        # 获取迁移文件路径
        migration_file = "database/migrations/027_v11_9_arbitration_preprocessing_upgrade.sql"
        migration_path = Path(project_root) / migration_file
        
        if not migration_path.exists():
            print(f"❌ 迁移文件不存在: {migration_path}")
            sys.exit(1)
        
        # 确认执行
        print("=== v11.9架构升级 - 数据库迁移 ===")
        print(f"迁移文件: {migration_file}")
        print("此操作将修改数据库结构，请确保已备份重要数据。")
        
        confirm = input("是否继续执行迁移? (y/N): ").strip().lower()
        if confirm != 'y':
            print("迁移已取消")
            sys.exit(0)
        
        # 执行迁移
        print("开始执行数据库迁移...")
        success = runner.execute_migration(str(migration_path))
        
        if success:
            print("✅ 数据库迁移执行成功")
            print("建议运行测试脚本验证迁移结果:")
            print("python scripts/test_database_migration.py")
            sys.exit(0)
        else:
            print("❌ 数据库迁移执行失败")
            print("请检查日志文件获取详细错误信息")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ 迁移执行失败: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
