#!/usr/bin/env python3
"""
修复Vue Router语法错误脚本
解决重复导入createMemoryHistory的问题
"""

import os
import re
import glob
from pathlib import Path

def fix_vue_router_syntax_in_file(file_path):
    """修复单个测试文件中的Vue Router语法错误"""
    print(f"正在修复语法错误: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 修复重复的createMemoryHistory导入
    content = re.sub(
        r'import\s*{\s*createRouter,\s*createMemoryHistory\s*},\s*createMemoryHistory(?:,\s*createMemoryHistory)*\s*from\s*[\'"]vue-router[\'"]',
        'import { createRouter, createMemoryHistory } from \'vue-router\'',
        content
    )
    
    # 如果内容有变化，写回文件
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ 已修复语法错误: {file_path}")
        return True
    else:
        print(f"⏭️  无需修复语法错误: {file_path}")
        return False

def main():
    """主函数"""
    print("🔧 修复Vue Router语法错误...")
    
    # 查找所有前端测试文件
    test_files = glob.glob("tools/tests/unit/frontend/**/*.test.ts", recursive=True)
    test_files.extend(glob.glob("tools/tests/integration/frontend/**/*.test.ts", recursive=True))
    
    fixed_count = 0
    total_count = len(test_files)
    
    for file_path in test_files:
        if fix_vue_router_syntax_in_file(file_path):
            fixed_count += 1
    
    print(f"\n🎉 语法错误修复完成！")
    print(f"总文件数: {total_count}")
    print(f"已修复: {fixed_count}")
    print(f"无需修复: {total_count - fixed_count}")

if __name__ == "__main__":
    main()



