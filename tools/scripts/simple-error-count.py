#!/usr/bin/env python3
"""
简单统计测试错误
"""

import subprocess
import re

def main():
    print("=== 运行测试并统计错误 ===")
    
    try:
        # 运行测试
        result = subprocess.run([
            'npm', 'run', 'test:unit', 'tools/tests/unit/frontend/components'
        ], cwd='/Users/pengcheng/Documents/papa/packages/frontend-main', 
        capture_output=True, text=True, timeout=120)
        
        output = result.stdout + result.stderr
        
        # 统计总错误数
        total_tests = re.search(r'Tests\s+(\d+)\s+failed\s+\|\s+(\d+)\s+passed', output)
        if total_tests:
            failed = int(total_tests.group(1))
            passed = int(total_tests.group(2))
            total = failed + passed
            print(f"总测试数: {total}")
            print(f"通过: {passed}")
            print(f"失败: {failed}")
            print(f"成功率: {passed/total*100:.1f}%")
        
        # 统计文件数
        total_files = re.search(r'Test Files\s+(\d+)\s+failed\s+\|\s+(\d+)\s+passed', output)
        if total_files:
            failed_files = int(total_files.group(1))
            passed_files = int(total_files.group(2))
            total_file_count = failed_files + passed_files
            print(f"\n总文件数: {total_file_count}")
            print(f"通过文件: {passed_files}")
            print(f"失败文件: {failed_files}")
            print(f"文件成功率: {passed_files/total_file_count*100:.1f}%")
        
        # 提取具体错误
        print("\n=== 具体错误示例 ===")
        error_lines = []
        for line in output.split('\n'):
            if '×' in line and '>' in line:
                error_lines.append(line.strip())
        
        print(f"找到 {len(error_lines)} 个具体错误")
        for i, error in enumerate(error_lines[:10]):  # 只显示前10个
            print(f"{i+1:2d}. {error}")
        
        if len(error_lines) > 10:
            print(f"... 还有 {len(error_lines) - 10} 个错误")
        
        # 按文件分组错误
        print("\n=== 按文件分组错误 ===")
        file_errors = {}
        current_file = None
        
        for line in output.split('\n'):
            # 匹配文件行
            file_match = re.search(r'FAIL\s+.*?/([^/]+\.test\.ts)', line)
            if file_match:
                current_file = file_match.group(1)
                file_errors[current_file] = []
            
            # 匹配错误行
            if '×' in line and '>' in line and current_file:
                file_errors[current_file].append(line.strip())
        
        # 按错误数量排序
        sorted_files = sorted(file_errors.items(), key=lambda x: len(x[1]), reverse=True)
        
        for filename, errors in sorted_files:
            if errors:
                print(f"\n{filename}: {len(errors)} 个错误")
                for error in errors[:3]:  # 只显示前3个错误
                    print(f"  - {error}")
                if len(errors) > 3:
                    print(f"  ... 还有 {len(errors) - 3} 个错误")
        
    except subprocess.TimeoutExpired:
        print("测试运行超时")
    except Exception as e:
        print(f"运行出错: {e}")

if __name__ == "__main__":
    main()



