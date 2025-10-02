#!/usr/bin/env python3
"""
批量修复测试文件中的缩进问题
遵循测试宪法：真正解决问题而不是简化
"""

import os
import re
import ast
from pathlib import Path

def fix_indentation_issues(file_path):
    """修复单个文件的缩进问题"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 先尝试解析，如果没有语法错误就直接返回
        try:
            ast.parse(content)
            return True, "文件语法正确"
        except SyntaxError as e:
            print(f"发现语法错误: {file_path}:{e.lineno} - {e.msg}")
        
        lines = content.split('\n')
        fixed_lines = []
        indent_stack = [0]  # 缩进栈
        
        for i, line in enumerate(lines):
            line_num = i + 1
            stripped = line.strip()
            
            # 跳过空行
            if not stripped:
                fixed_lines.append(line)
                continue
            
            # 计算当前行的缩进级别
            current_indent = len(line) - len(line.lstrip())
            
            # 处理函数定义
            if re.match(r'^\s*def\s+\w+.*:\s*$', line):
                # 函数定义应该与类定义或模块级别对齐
                if len(indent_stack) > 1:
                    expected_indent = indent_stack[-2] + 4
                else:
                    expected_indent = 0
                
                if current_indent != expected_indent:
                    fixed_line = ' ' * expected_indent + stripped
                    fixed_lines.append(fixed_line)
                    indent_stack.append(expected_indent)
                else:
                    fixed_lines.append(line)
                    indent_stack.append(current_indent)
                continue
            
            # 处理类定义
            if re.match(r'^\s*class\s+\w+.*:\s*$', line):
                expected_indent = 0
                if current_indent != expected_indent:
                    fixed_line = ' ' * expected_indent + stripped
                    fixed_lines.append(fixed_line)
                    indent_stack = [expected_indent]
                else:
                    fixed_lines.append(line)
                    indent_stack = [current_indent]
                continue
            
            # 处理装饰器
            if stripped.startswith('@'):
                # 装饰器应该与下一个函数/类定义对齐
                if i + 1 < len(lines):
                    next_line = lines[i + 1]
                    if re.match(r'^\s*(def|class)\s+', next_line):
                        # 找到下一个函数/类的缩进
                        next_indent = len(next_line) - len(next_line.lstrip())
                        expected_indent = next_indent
                        if current_indent != expected_indent:
                            fixed_line = ' ' * expected_indent + stripped
                            fixed_lines.append(fixed_line)
                            continue
                
                fixed_lines.append(line)
                continue
            
            # 处理其他语句
            # 如果当前行以冒号结尾，增加缩进级别
            if stripped.endswith(':'):
                expected_indent = indent_stack[-1] + 4
                if current_indent != expected_indent:
                    fixed_line = ' ' * expected_indent + stripped
                    fixed_lines.append(fixed_line)
                    indent_stack.append(expected_indent)
                else:
                    fixed_lines.append(line)
                    indent_stack.append(current_indent)
            else:
                # 普通语句，应该与最近的缩进级别对齐
                expected_indent = indent_stack[-1]
                if current_indent != expected_indent:
                    fixed_line = ' ' * expected_indent + stripped
                    fixed_lines.append(fixed_line)
                else:
                    fixed_lines.append(line)
        
        # 写回文件
        fixed_content = '\n'.join(fixed_lines)
        
        # 验证修复后的语法
        try:
            ast.parse(fixed_content)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            return True, "缩进问题已修复"
        except SyntaxError as e:
            return False, f"修复后仍有语法错误: {e.lineno} - {e.msg}"
            
    except Exception as e:
        return False, f"处理文件时出错: {str(e)}"

def main():
    """主函数"""
    test_dir = Path("tools/tests")
    
    # 需要修复的文件列表（从错误信息中提取）
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
    
    print(f"开始修复 {total_count} 个测试文件的缩进问题...")
    
    for file_path in files_to_fix:
        full_path = test_dir / file_path
        if full_path.exists():
            print(f"\n处理: {file_path}")
            success, message = fix_indentation_issues(full_path)
            if success:
                print(f"✅ {message}")
                success_count += 1
            else:
                print(f"❌ {message}")
        else:
            print(f"⚠️  文件不存在: {file_path}")
    
    print(f"\n修复完成: {success_count}/{total_count} 个文件成功修复")
    
    if success_count == total_count:
        print("🎉 所有文件的缩进问题都已修复！")
    else:
        print("⚠️  部分文件仍有问题，需要手动检查")

if __name__ == "__main__":
    main()