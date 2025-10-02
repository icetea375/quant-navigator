#!/usr/bin/env python3
"""
Vue Router测试修复脚本
第一战役：修复Vue Router"神经系统"
遵循测试宪法第5条：类型安全铁律，不使用任何类型欺骗
"""

import os
import re
import glob
from pathlib import Path

def fix_vue_router_in_test_file(file_path):
    """修复单个测试文件中的Vue Router问题"""
    print(f"正在修复Vue Router: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 1. 替换createWebHistory为createMemoryHistory
    content = re.sub(
        r'createWebHistory\(\)',
        'createMemoryHistory()',
        content
    )
    
    # 2. 确保导入了createMemoryHistory
    if 'createMemoryHistory' in content and 'import.*createMemoryHistory' not in content:
        # 查找createRouter导入行
        router_import_pattern = r'(import\s*{\s*createRouter[^}]*})'
        if re.search(router_import_pattern, content):
            content = re.sub(
                router_import_pattern,
                r'\1, createMemoryHistory',
                content
            )
        else:
            # 如果没有找到createRouter导入，添加新的导入
            content = re.sub(
                r'(import\s*{\s*createRouter[^}]*})',
                r'\1, createMemoryHistory',
                content
            )
    
    # 3. 修复语法错误：移除多余的逗号和括号
    content = re.sub(
        r'import\s*{\s*createRouter,\s*createWebHistory\s*},\s*createMemoryHistory',
        'import { createRouter, createMemoryHistory }',
        content
    )
    
    # 3. 如果文件中有createWebHistory但没有createRouter导入，添加完整导入
    if 'createWebHistory' in content and 'createRouter' not in content:
        # 在文件开头添加导入
        import_line = "import { createRouter, createMemoryHistory } from 'vue-router'\n"
        content = import_line + content
    
    # 如果内容有变化，写回文件
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ 已修复Vue Router: {file_path}")
        return True
    else:
        print(f"⏭️  无需修复Vue Router: {file_path}")
        return False

def main():
    """主函数"""
    print("🔧 第一战役：修复Vue Router'神经系统'...")
    print("遵循测试宪法第5条：类型安全铁律")
    
    # 查找所有前端测试文件
    test_files = glob.glob("tools/tests/unit/frontend/**/*.test.ts", recursive=True)
    test_files.extend(glob.glob("tools/tests/integration/frontend/**/*.test.ts", recursive=True))
    
    fixed_count = 0
    total_count = len(test_files)
    
    for file_path in test_files:
        if fix_vue_router_in_test_file(file_path):
            fixed_count += 1
    
    print(f"\n🎉 第一战役完成！")
    print(f"总文件数: {total_count}")
    print(f"已修复: {fixed_count}")
    print(f"无需修复: {total_count - fixed_count}")

if __name__ == "__main__":
    main()
