#!/usr/bin/env python3
"""
生成测试错误统计摘要
"""

import subprocess
import re
from collections import defaultdict

def get_error_summary():
    """获取错误统计摘要"""
    try:
        result = subprocess.run([
            'npm', 'run', 'test:unit', 'tools/tests/unit/frontend/components'
        ], cwd='/Users/pengcheng/Documents/papa/packages/frontend-main', 
        capture_output=True, text=True, timeout=120)
        
        output = result.stdout + result.stderr
        
        # 统计总错误数
        total_match = re.search(r'Tests\s+(\d+)\s+failed\s+\|\s+(\d+)\s+passed', output)
        file_match = re.search(r'Test Files\s+(\d+)\s+failed\s+\|\s+(\d+)\s+passed', output)
        
        if total_match and file_match:
            failed_tests = int(total_match.group(1))
            passed_tests = int(total_match.group(2))
            failed_files = int(file_match.group(1))
            passed_files = int(file_match.group(2))
            
            print("=== 测试错误统计摘要 ===")
            print(f"总测试数: {failed_tests + passed_tests}")
            print(f"通过测试: {passed_tests}")
            print(f"失败测试: {failed_tests}")
            print(f"成功率: {passed_tests/(failed_tests + passed_tests)*100:.1f}%")
            print()
            print(f"总文件数: {failed_files + passed_files}")
            print(f"通过文件: {passed_files}")
            print(f"失败文件: {failed_files}")
            print(f"文件成功率: {passed_files/(failed_files + passed_files)*100:.1f}%")
            print()
        
        # 按文件统计错误
        file_errors = defaultdict(int)
        current_file = None
        
        for line in output.split('\n'):
            # 匹配文件失败行
            file_match = re.search(r'FAIL\s+.*?/([^/]+\.test\.ts)', line)
            if file_match:
                current_file = file_match.group(1)
            
            # 匹配具体错误行
            if '×' in line and '>' in line and current_file:
                file_errors[current_file] += 1
        
        # 按错误数量排序
        sorted_files = sorted(file_errors.items(), key=lambda x: x[1], reverse=True)
        
        print("=== 按文件错误数量排序 ===")
        print(f"{'文件名':<50} {'错误数':<8} {'状态'}")
        print("-" * 70)
        
        for filename, error_count in sorted_files:
            if error_count >= 15:
                status = "🔥 高优先级"
            elif error_count >= 5:
                status = "⚠️  中优先级"
            else:
                status = "✅ 低优先级"
            
            print(f"{filename:<50} {error_count:<8} {status}")
        
        # 推荐修复顺序
        print("\n=== 推荐修复顺序 ===")
        high_priority = [f for f, c in sorted_files if c >= 15]
        medium_priority = [f for f, c in sorted_files if 5 <= c < 15]
        low_priority = [f for f, c in sorted_files if 1 <= c < 5]
        
        if high_priority:
            print(f"\n🔥 高优先级文件 ({len(high_priority)} 个):")
            for i, filename in enumerate(high_priority[:5], 1):
                print(f"  {i}. {filename} ({file_errors[filename]} 个错误)")
        
        if medium_priority:
            print(f"\n⚠️  中优先级文件 ({len(medium_priority)} 个):")
            for i, filename in enumerate(medium_priority[:5], 1):
                print(f"  {i}. {filename} ({file_errors[filename]} 个错误)")
        
        if low_priority:
            print(f"\n✅ 低优先级文件 ({len(low_priority)} 个):")
            for i, filename in enumerate(low_priority[:5], 1):
                print(f"  {i}. {filename} ({file_errors[filename]} 个错误)")
        
        return sorted_files
        
    except subprocess.TimeoutExpired:
        print("测试运行超时")
        return []
    except Exception as e:
        print(f"运行出错: {e}")
        return []

if __name__ == "__main__":
    get_error_summary()



