#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
代码巡警 - 测试覆盖率监控
监控测试覆盖率，当覆盖率低于阈值时发出警告
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def run_coverage_analysis():
    """运行覆盖率分析"""
    print("🔍 代码巡警启动 - 监控测试覆盖率...")
    
    # 切换到backend-python目录
    backend_dir = Path(__file__).parent.parent.parent / "packages" / "backend-python"
    os.chdir(backend_dir)
    
    try:
        # 运行测试并生成覆盖率报告
        result = subprocess.run([
            "python", "-m", "pytest", 
            "--cov=src.services.data_sources.tushare_fetcher",
            "--cov=src.services.data_pipeline_service", 
            "--cov-report=json", 
            "--cov-report=term-missing",
            "tests/unit/services/test_tushare_fetcher.py",
            "tests/unit/services/test_data_pipeline_service_unit.py",
            "-v"
        ], capture_output=True, text=True, timeout=300)
        
        # 即使pytest因为覆盖率失败，我们也要继续分析
        if result.returncode != 0 and "Coverage failure" not in result.stdout:
            print(f"❌ 测试运行失败:")
            print(f"STDOUT: {result.stdout}")
            print(f"STDERR: {result.stderr}")
            return False
            
        # 读取覆盖率报告
        coverage_file = backend_dir / "coverage.json"
        if not coverage_file.exists():
            print("❌ 覆盖率报告文件不存在")
            return False
            
        with open(coverage_file, 'r') as f:
            coverage_data = json.load(f)
            
        # 只分析我们测试的模块
        target_modules = [
            'src/services/data_sources/tushare_fetcher.py',
            'src/services/data_pipeline_service.py'
        ]
        
        total_statements = 0
        total_missing = 0
        
        print("📊 代码巡警分析 - 目标模块覆盖率:")
        print("=" * 50)
        
        for module_path in target_modules:
            if module_path in coverage_data['files']:
                file_data = coverage_data['files'][module_path]
                statements = file_data['summary']['num_statements']
                missing = file_data['summary']['missing_lines']
                coverage = file_data['summary']['percent_covered']
                
                total_statements += statements
                total_missing += missing
                
                status = "✅" if coverage >= 85 else "⚠️"
                print(f"{status} {module_path}: {coverage:.1f}% ({statements - missing}/{statements})")
            else:
                print(f"❌ {module_path}: 未找到覆盖率数据")
        
        # 计算总体覆盖率
        if total_statements > 0:
            overall_coverage = ((total_statements - total_missing) / total_statements) * 100
            required_coverage = 85.0
            
            print("=" * 50)
            print(f"📊 目标模块总体覆盖率: {overall_coverage:.1f}%")
            print(f"🎯 目标覆盖率: {required_coverage}%")
            
            if overall_coverage < required_coverage:
                print(f"⚠️  覆盖率不足! 需要提升 {required_coverage - overall_coverage:.1f}%")
                
                # 提供具体建议
                print("\n💡 代码巡警建议:")
                print("   1. 检查TushareFetcher的测试覆盖是否完整")
                print("   2. 检查DataPipelineService的测试覆盖是否完整")
                print("   3. 为未覆盖的方法添加测试用例")
                print("   4. 确保所有边界情况都有测试")
                
                return False
            else:
                print("✅ 目标模块覆盖率达标!")
                return True
        else:
            print("❌ 无法计算覆盖率")
            return False
            
    except Exception as e:
        print(f"❌ 代码巡警运行失败: {e}")
        return False

def main():
    """主函数"""
    success = run_coverage_analysis()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
