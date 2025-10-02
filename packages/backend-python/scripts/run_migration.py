#!/usr/bin/env python3
"""
数据库迁移脚本
用于执行数据库表结构迁移
"""

import os
import sys
from pathlib import Path
from typing import List

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from support_modules.database_utils import DatabaseManager


class MigrationManager:
    """数据库迁移管理器"""

    def __init__(self, config: dict):
        """
        初始化迁移管理器
        
        Args:
            config: 数据库配置
        """
        self.config = config
        self.db_manager = DatabaseManager(config)
        self.migrations_dir = Path(__file__).parent.parent / "migrations"

    def create_migrations_table(self):
        """创建迁移记录表"""
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        with self.db_manager.get_session() as session:
            session.execute(create_table_sql)
            session.commit()

    def get_applied_migrations(self) -> List[str]:
        """获取已应用的迁移版本"""
        try:
            with self.db_manager.get_session() as session:
                result = session.execute("SELECT version FROM schema_migrations ORDER BY version")
                return [row[0] for row in result.fetchall()]
        except Exception:
            return []

    def get_pending_migrations(self) -> List[str]:
        """获取待执行的迁移文件"""
        if not self.migrations_dir.exists():
            return []
        
        migration_files = sorted([
            f.name for f in self.migrations_dir.glob("*.sql")
            if f.name.endswith('.sql')
        ])
        
        applied_migrations = self.get_applied_migrations()
        return [f for f in migration_files if f not in applied_migrations]

    def run_migration(self, migration_file: str) -> bool:
        """
        执行单个迁移文件
        
        Args:
            migration_file: 迁移文件名
            
        Returns:
            是否执行成功
        """
        try:
            migration_path = self.migrations_dir / migration_file
            if not migration_path.exists():
                print(f"❌ 迁移文件不存在: {migration_file}")
                return False
            
            print(f"🔄 执行迁移: {migration_file}")
            
            with open(migration_path, 'r', encoding='utf-8') as f:
                migration_sql = f.read()
            
            with self.db_manager.get_session() as session:
                session.execute(migration_sql)
                session.commit()
            
            print(f"✅ 迁移完成: {migration_file}")
            return True
            
        except Exception as e:
            print(f"❌ 迁移失败: {migration_file}, 错误: {e}")
            return False

    def run_all_migrations(self) -> bool:
        """执行所有待执行的迁移"""
        print("🚀 开始执行数据库迁移...")
        
        # 创建迁移记录表
        self.create_migrations_table()
        
        # 获取待执行的迁移
        pending_migrations = self.get_pending_migrations()
        
        if not pending_migrations:
            print("✅ 没有待执行的迁移")
            return True
        
        print(f"📋 发现 {len(pending_migrations)} 个待执行的迁移:")
        for migration in pending_migrations:
            print(f"  - {migration}")
        
        # 执行迁移
        success_count = 0
        for migration in pending_migrations:
            if self.run_migration(migration):
                success_count += 1
            else:
                print(f"❌ 迁移失败，停止执行")
                return False
        
        print(f"🎉 迁移完成！成功执行 {success_count} 个迁移")
        return True

    def rollback_migration(self, migration_file: str) -> bool:
        """
        回滚迁移（简单实现，实际项目中需要更复杂的回滚逻辑）
        
        Args:
            migration_file: 要回滚的迁移文件名
            
        Returns:
            是否回滚成功
        """
        try:
            print(f"🔄 回滚迁移: {migration_file}")
            
            with self.db_manager.get_session() as session:
                # 从迁移记录表中删除记录
                session.execute(
                    "DELETE FROM schema_migrations WHERE version = %s",
                    (migration_file,)
                )
                session.commit()
            
            print(f"✅ 回滚完成: {migration_file}")
            return True
            
        except Exception as e:
            print(f"❌ 回滚失败: {migration_file}, 错误: {e}")
            return False


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="数据库迁移工具")
    parser.add_argument("--action", choices=["migrate", "rollback"], default="migrate", help="操作类型")
    parser.add_argument("--file", help="指定迁移文件（用于回滚）")
    
    args = parser.parse_args()
    
    # 从环境变量或配置文件获取数据库配置
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/quant_navigator")
    
    config = {
        "database_url": database_url,
        "redis_url": os.getenv("REDIS_URL", "redis://localhost:6379")
    }
    
    migration_manager = MigrationManager(config)
    
    if args.action == "migrate":
        success = migration_manager.run_all_migrations()
        sys.exit(0 if success else 1)
    elif args.action == "rollback":
        if not args.file:
            print("❌ 回滚操作需要指定 --file 参数")
            sys.exit(1)
        success = migration_manager.rollback_migration(args.file)
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
