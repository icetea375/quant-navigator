#!/usr/bin/env python3
"""
测试修复脚本的效果
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../packages/backend-python')))

import subprocess
import sys
from pathlib import Path

def run_ruff_check():
    """运行Ruff检查并返回错误数量"""
    try:
        result = subprocess.run(["ruff", "check", "."], capture_output=True, text=True)
        if result.returncode == 0:
            return 0, "无错误"
        else:
            error_lines = result.stdout.count('\\n')
            return error_lines, result.stdout
    except Exception as e:
        return -1, f"运行Ruff检查失败: {e}"

def main():
    """主函数"""
    print("🧪 测试Ruff修复脚本效果")
    print("="*50)
    
    # 检查是否在正确的目录
    if not Path("src").exists():
        print("❌ 错误: 请在packages/backend-python目录下运行此脚本")
        sys.exit(1)
    
    # 修复前的检查
    print("\\n📊 修复前检查...")
    error_count_before, output_before = run_ruff_check()
    
    if error_count_before == -1:
        print(f"❌ 无法运行Ruff检查: {output_before}")
        return
    
    print(f"修复前错误数量: {error_count_before}")
    
    if error_count_before == 0:
        print("✅ 没有Ruff错误,无需修复")
        return
    
    # 运行修复脚本
    print("\\n🔧 运行修复脚本...")
    
    # 修复全角字符
    print("1. 修复全角字符...")
    result1 = subprocess.run([sys.executable, "scripts/fix_fullwidth_chars.py"], 
                           capture_output=True, text=True)
    print(result1.stdout)
    if result1.stderr:
        print("错误:", result1.stderr)
    
    # 修复类型注解
    print("\\n2. 修复类型注解...")
    result2 = subprocess.run([sys.executable, "scripts/fix_type_annotations.py"], 
                           capture_output=True, text=True)
    print(result2.stdout)
    if result2.stderr:
        print("错误:", result2.stderr)
    
    # 运行Ruff自动修复
    print("\\n3. 运行Ruff自动修复...")
    result3 = subprocess.run(["ruff", "check", "--fix", "."], 
                           capture_output=True, text=True)
    if result3.stdout:
        print("Ruff修复输出:", result3.stdout)
    if result3.stderr:
        print("Ruff修复错误:", result3.stderr)
    
    # 运行Ruff格式化
    print("\\n4. 运行Ruff格式化...")
    result4 = subprocess.run(["ruff", "format", "."], 
                           capture_output=True, text=True)
    if result4.stdout:
        print("Ruff格式化输出:", result4.stdout)
    if result4.stderr:
        print("Ruff格式化错误:", result4.stderr)
    
    # 修复后的检查
    print("\\n📊 修复后检查...")
    error_count_after, output_after = run_ruff_check()
    
    print(f"修复后错误数量: {error_count_after}")
    
    # 显示修复效果
    print("\\n" + "="*50)
    print("修复效果统计")
    print("="*50)
    print(f"修复前错误数: {error_count_before}")
    print(f"修复后错误数: {error_count_after}")
    
    if error_count_after < error_count_before:
        fixed_count = error_count_before - error_count_after
        print(f"✅ 成功修复 {fixed_count} 个错误")
        improvement = (fixed_count / error_count_before) * 100
        print(f"📈 修复率: {improvement:.1f}%")
    elif error_count_after == error_count_before:
        print("⚠️  错误数量没有变化")
    else:
        print("❌ 错误数量增加了")
    
    if error_count_after > 0:
        print("\\n🔍 剩余错误:")
        print(output_after)
        print("\\n💡 建议手动检查剩余问题")
    else:
        print("\\n🎉 所有Ruff错误已修复！")

if __name__ == "__main__":
    main()
