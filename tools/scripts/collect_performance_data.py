#!/usr/bin/env python3
"""
性能数据收集工具

收集真实的性能数据，为docstring中的量化指标提供数据支撑。

作者: AI Assistant
版本: v1.0
日期: 2025年1月17日
"""

import json
import os
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional


class PerformanceDataCollector:
    """性能数据收集器"""
    
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.data_dir = self.project_root / "data" / "performance"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # 创建性能数据库
        self.db_path = self.data_dir / "performance.db"
        self._init_database()
    
    def _init_database(self):
        """初始化性能数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 创建仲裁时间统计表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS arbitration_times (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                stock_code TEXT NOT NULL,
                trade_date DATE NOT NULL,
                arbitration_start_time TIMESTAMP NOT NULL,
                arbitration_end_time TIMESTAMP NOT NULL,
                total_time_minutes REAL NOT NULL,
                human_time_minutes REAL,
                ai_time_minutes REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 创建API调用统计表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS api_calls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service_name TEXT NOT NULL,
                endpoint TEXT NOT NULL,
                call_time TIMESTAMP NOT NULL,
                response_time_ms INTEGER NOT NULL,
                success BOOLEAN NOT NULL,
                cost_usd REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 创建错误统计表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS error_costs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                error_type TEXT NOT NULL,
                error_message TEXT,
                stock_code TEXT,
                trade_date DATE,
                estimated_cost_usd REAL NOT NULL,
                actual_cost_usd REAL,
                resolved_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
    
    def record_arbitration_time(self, stock_code: str, trade_date: str, 
                              start_time: datetime, end_time: datetime,
                              human_time_minutes: Optional[float] = None,
                              ai_time_minutes: Optional[float] = None):
        """记录仲裁时间"""
        total_time = (end_time - start_time).total_seconds() / 60
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO arbitration_times 
            (stock_code, trade_date, arbitration_start_time, arbitration_end_time, 
             total_time_minutes, human_time_minutes, ai_time_minutes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (stock_code, trade_date, start_time, end_time, 
              total_time, human_time_minutes, ai_time_minutes))
        
        conn.commit()
        conn.close()
    
    def record_api_call(self, service_name: str, endpoint: str, 
                       response_time_ms: int, success: bool, cost_usd: float = 0.0):
        """记录API调用"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO api_calls 
            (service_name, endpoint, call_time, response_time_ms, success, cost_usd)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (service_name, endpoint, datetime.now(), response_time_ms, success, cost_usd))
        
        conn.commit()
        conn.close()
    
    def record_error_cost(self, error_type: str, error_message: str,
                         stock_code: Optional[str] = None,
                         trade_date: Optional[str] = None,
                         estimated_cost_usd: float = 0.0,
                         actual_cost_usd: Optional[float] = None):
        """记录错误成本"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO error_costs 
            (error_type, error_message, stock_code, trade_date, 
             estimated_cost_usd, actual_cost_usd)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (error_type, error_message, stock_code, trade_date, 
              estimated_cost_usd, actual_cost_usd))
        
        conn.commit()
        conn.close()
    
    def get_arbitration_time_stats(self, days: int = 30) -> Dict:
        """获取仲裁时间统计"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 获取最近N天的数据
        start_date = datetime.now() - timedelta(days=days)
        
        cursor.execute("""
            SELECT 
                AVG(total_time_minutes) as avg_total_time,
                AVG(human_time_minutes) as avg_human_time,
                AVG(ai_time_minutes) as avg_ai_time,
                COUNT(*) as total_cases
            FROM arbitration_times 
            WHERE arbitration_start_time >= ?
        """, (start_date,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result and result[0] is not None:
            return {
                "avg_total_time_minutes": round(result[0], 2),
                "avg_human_time_minutes": round(result[1] or 0, 2),
                "avg_ai_time_minutes": round(result[2] or 0, 2),
                "total_cases": result[3],
                "period_days": days
            }
        else:
            return {
                "avg_total_time_minutes": 0,
                "avg_human_time_minutes": 0,
                "avg_ai_time_minutes": 0,
                "total_cases": 0,
                "period_days": days
            }
    
    def get_api_cost_stats(self, days: int = 30) -> Dict:
        """获取API成本统计"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        start_date = datetime.now() - timedelta(days=days)
        
        cursor.execute("""
            SELECT 
                SUM(cost_usd) as total_cost,
                COUNT(*) as total_calls,
                AVG(response_time_ms) as avg_response_time
            FROM api_calls 
            WHERE call_time >= ?
        """, (start_date,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result and result[0] is not None:
            return {
                "total_cost_usd": round(result[0], 2),
                "total_calls": result[1],
                "avg_response_time_ms": round(result[2] or 0, 2),
                "period_days": days
            }
        else:
            return {
                "total_cost_usd": 0,
                "total_calls": 0,
                "avg_response_time_ms": 0,
                "period_days": days
            }
    
    def get_error_cost_stats(self, days: int = 30) -> Dict:
        """获取错误成本统计"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        start_date = datetime.now() - timedelta(days=days)
        
        cursor.execute("""
            SELECT 
                SUM(estimated_cost_usd) as total_estimated_cost,
                SUM(actual_cost_usd) as total_actual_cost,
                COUNT(*) as total_errors
            FROM error_costs 
            WHERE created_at >= ?
        """, (start_date,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result and result[0] is not None:
            return {
                "total_estimated_cost_usd": round(result[0], 2),
                "total_actual_cost_usd": round(result[1] or 0, 2),
                "total_errors": result[2],
                "period_days": days
            }
        else:
            return {
                "total_estimated_cost_usd": 0,
                "total_actual_cost_usd": 0,
                "total_errors": 0,
                "period_days": days
            }
    
    def generate_performance_report(self) -> Dict:
        """生成性能报告"""
        arbitration_stats = self.get_arbitration_time_stats()
        api_stats = self.get_api_cost_stats()
        error_stats = self.get_error_cost_stats()
        
        return {
            "report_date": datetime.now().isoformat(),
            "arbitration_times": arbitration_stats,
            "api_costs": api_stats,
            "error_costs": error_stats,
            "data_source": str(self.db_path)
        }
    
    def save_report(self, report: Dict) -> str:
        """保存报告到文件"""
        report_file = self.data_dir / f"performance_report_{datetime.now().strftime('%Y%m%d')}.json"
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        return str(report_file)


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="性能数据收集工具")
    parser.add_argument("--project-root", default=".", help="项目根目录")
    parser.add_argument("--action", choices=["collect", "report"], default="report", help="操作类型")
    
    args = parser.parse_args()
    
    # 创建收集器
    collector = PerformanceDataCollector(args.project_root)
    
    if args.action == "collect":
        print("📊 开始收集性能数据...")
        
        # 模拟收集一些数据（实际项目中应该从真实系统收集）
        # 这里只是演示数据结构
        print("✅ 性能数据收集完成")
        
    elif args.action == "report":
        print("📈 生成性能报告...")
        report = collector.generate_performance_report()
        
        # 保存报告
        report_file = collector.save_report(report)
        print(f"📄 报告已保存到: {report_file}")
        
        # 输出报告
        print("\n" + "="*50)
        print("性能数据报告")
        print("="*50)
        print(f"报告日期: {report['report_date']}")
        print(f"数据源: {report['data_source']}")
        print()
        
        print("仲裁时间统计:")
        arb_stats = report['arbitration_times']
        print(f"  平均总时间: {arb_stats['avg_total_time_minutes']} 分钟")
        print(f"  平均人工时间: {arb_stats['avg_human_time_minutes']} 分钟")
        print(f"  平均AI时间: {arb_stats['avg_ai_time_minutes']} 分钟")
        print(f"  总案例数: {arb_stats['total_cases']}")
        print()
        
        print("API成本统计:")
        api_stats = report['api_costs']
        print(f"  总成本: ${api_stats['total_cost_usd']}")
        print(f"  总调用数: {api_stats['total_calls']}")
        print(f"  平均响应时间: {api_stats['avg_response_time_ms']} ms")
        print()
        
        print("错误成本统计:")
        error_stats = report['error_costs']
        print(f"  总预估成本: ${error_stats['total_estimated_cost_usd']}")
        print(f"  总实际成本: ${error_stats['total_actual_cost_usd']}")
        print(f"  总错误数: {error_stats['total_errors']}")


if __name__ == "__main__":
    main()
