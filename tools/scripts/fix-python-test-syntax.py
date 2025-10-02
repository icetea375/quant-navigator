#!/usr/bin/env python3
"""
Python测试语法修复工具
修复Python测试文件中的语法问题，包括类定义、函数定义、try-except等结构问题
"""

import os
import re
import ast
from pathlib import Path

def fix_file_properly(file_path):
    """真正修复单个文件的语法问题"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        lines = content.split('\n')
        fixed_lines = []
        
        i = 0
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()
            
            # 跳过空行
            if not stripped:
                fixed_lines.append(line)
                i += 1
                continue
            
            # 处理类定义
            if re.match(r'^\s*class\s+\w+.*:\s*$', line):
                fixed_lines.append(line)
                i += 1
                
                # 确保类定义后有内容
                if i < len(lines):
                    next_line = lines[i]
                    if next_line.strip() and not next_line.startswith('    '):
                        # 添加pass语句
                        indent = len(line) - len(line.lstrip())
                        fixed_lines.append(' ' * (indent + 4) + 'pass')
                continue
            
            # 处理函数定义
            if re.match(r'^\s*def\s+\w+.*:\s*$', line):
                fixed_lines.append(line)
                i += 1
                
                # 确保函数定义后有内容
                if i < len(lines):
                    next_line = lines[i]
                    if next_line.strip() and not next_line.startswith('    '):
                        # 添加pass语句
                        indent = len(line) - len(line.lstrip())
                        fixed_lines.append(' ' * (indent + 4) + 'pass')
                continue
            
            # 处理装饰器
            if stripped.startswith('@'):
                fixed_lines.append(line)
                i += 1
                continue
            
            # 处理try语句
            if stripped.startswith('try:') or stripped.startswith('try '):
                fixed_lines.append(line)
                i += 1
                
                # 确保try后有内容
                if i < len(lines):
                    next_line = lines[i]
                    if next_line.strip() and not next_line.startswith('    '):
                        # 添加pass语句
                        indent = len(line) - len(line.lstrip())
                        fixed_lines.append(' ' * (indent + 4) + 'pass')
                continue
            
            # 处理except语句
            if stripped.startswith('except') or stripped.startswith('finally'):
                fixed_lines.append(line)
                i += 1
                
                # 确保except/finally后有内容
                if i < len(lines):
                    next_line = lines[i]
                    if next_line.strip() and not next_line.startswith('    '):
                        # 添加pass语句
                        indent = len(line) - len(line.lstrip())
                        fixed_lines.append(' ' * (indent + 4) + 'pass')
                continue
            
            # 处理其他语句
            fixed_lines.append(line)
            i += 1
        
        # 写回文件
        fixed_content = '\n'.join(fixed_lines)
        
        # 验证修复后的语法
        try:
            ast.parse(fixed_content)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            return True, "语法问题已修复"
        except SyntaxError as e:
            return False, f"修复后仍有语法错误: {e.lineno} - {e.msg}"
            
    except Exception as e:
        return False, f"处理文件时出错: {str(e)}"

def main():
    """主函数"""
    test_dir = Path("tools/tests")
    
    # 需要修复的文件列表
    files_to_fix = [
        "unit/backend/test_concurrency_control.py",
        "unit/backend/test_health_check.py", 
        "unit/backend/test_process_single_stock_with_retry.py",
        "unit/backend/scripts/test_quantsignal_engine.py",
        "unit/backend/scripts/test_workflow_simple.py",
        "unit/backend/services/test_arbitration_service_unit.py",
        "unit/backend/services/test_data_pipeline_service_sync.py",
        "unit/backend/services/test_mda_verifier_service_unit.py",
        "unit/backend/services/test_quant_signal_engine_detailed.py",
        "unit/backend/services/test_report_service_unit.py",
        "unit/backend/services/test_tushare_fetcher.py",
        "unit/backend/services/test_workflow_adapter.py",
        "unit/backend/test_coverage_config.py",
        "unit/backend/test_main.py",
        "unit/backend/test_main_workflow_100_coverage.py",
        "unit/backend/test_process_anomaly_stocks_parallel.py",
        "unit/backend/test_report_service_async.py",
        "integration/backend/test_data_pipeline_end_to_end.py",
        "integration/backend/test_data_pipeline_real_database_integration.py",
        "integration/backend/test_llm_gateway_io.py"
    ]
    
    success_count = 0
    total_count = len(files_to_fix)
    
    print(f"开始真正修复 {total_count} 个测试文件的语法问题...")
    
    for file_path in files_to_fix:
        full_path = test_dir / file_path
        if full_path.exists():
            print(f"\n处理: {file_path}")
            success, message = fix_file_properly(full_path)
            if success:
                print(f"✅ {message}")
                success_count += 1
            else:
                print(f"❌ {message}")
        else:
            print(f"⚠️  文件不存在: {file_path}")
    
    print(f"\n修复完成: {success_count}/{total_count} 个文件成功修复")
    
    if success_count == total_count:
        print("🎉 所有文件的语法问题都已修复！")
    else:
        print("⚠️  部分文件仍有问题，需要手动检查")

if __name__ == "__main__":
    main()
