#!/usr/bin/env python3
"""
统计每个测试文件的错误次数
"""

import subprocess
import re
import os

def count_errors_per_file():
    """统计每个测试文件的错误次数"""
    try:
        # 运行测试并获取输出
        result = subprocess.run([
            'npm', 'run', 'test:unit', 'tools/tests/unit/frontend/components'
        ], cwd='/Users/pengcheng/Documents/papa/packages/frontend-main', 
        capture_output=True, text=True, timeout=60)
        
        output = result.stdout + result.stderr
        
        # 解析输出，统计每个文件的错误
        file_errors = {}
        current_file = None
        
        lines = output.split('\n')
        for line in lines:
            # 匹配文件失败行: FAIL  ../../tools/tests/unit/frontend/components/XXX.test.ts
            file_match = re.search(r'FAIL\s+.*?/([^/]+\.test\.ts)', line)
            if file_match:
                current_file = file_match.group(1)
                file_errors[current_file] = 0
            
            # 匹配具体错误行: × ComponentName > Test Description
            error_match = re.search(r'×\s+.*?>\s+.*?>', line)
            if error_match and current_file:
                file_errors[current_file] = file_errors.get(current_file, 0) + 1
        
        return file_errors
        
    except subprocess.TimeoutExpired:
        print("测试运行超时")
        return {}
    except Exception as e:
        print(f"运行测试时出错: {e}")
        return {}

def main():
    """主函数"""
    print("=== 测试文件错误次数统计 ===")
    print("正在运行测试...")
    
    file_errors = count_errors_per_file()
    
    if not file_errors:
        print("无法获取错误统计")
        return
    
    # 按错误次数排序
    sorted_files = sorted(file_errors.items(), key=lambda x: x[1], reverse=True)
    
    print(f"\n找到 {len(sorted_files)} 个测试文件")
    print("\n错误次数统计 (从多到少):")
    print("-" * 50)
    
    total_errors = 0
    for filename, error_count in sorted_files:
        if error_count > 0:
            print(f"{filename:<40} {error_count:>3} 个错误")
            total_errors += error_count
        else:
            print(f"{filename:<40} {error_count:>3} 个错误 (可能通过)")
    
    print("-" * 50)
    print(f"总计: {total_errors} 个错误")
    
    # 推荐修复优先级
    print("\n=== 修复优先级建议 ===")
    high_priority = [f for f, c in sorted_files if c >= 10]
    medium_priority = [f for f, c in sorted_files if 5 <= c < 10]
    low_priority = [f for f, c in sorted_files if 1 <= c < 5]
    
    if high_priority:
        print(f"\n🔥 高优先级 (≥10个错误): {len(high_priority)} 个文件")
        for f in high_priority[:5]:  # 只显示前5个
            print(f"  - {f}")
    
    if medium_priority:
        print(f"\n⚠️  中优先级 (5-9个错误): {len(medium_priority)} 个文件")
        for f in medium_priority[:5]:
            print(f"  - {f}")
    
    if low_priority:
        print(f"\n✅ 低优先级 (1-4个错误): {len(low_priority)} 个文件")
        for f in low_priority[:5]:
            print(f"  - {f}")

if __name__ == "__main__":
    main()



