#!/usr/bin/env python3
"""
修复 Python 导入路径脚本
将 src. 导入路径修复为正确的模块路径
"""

import os
import re
import glob
from pathlib import Path

def fix_imports_in_file(file_path):
    """修复单个文件中的导入路径"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 修复 from src. 导入
        content = re.sub(
            r'from src\.([a-zA-Z_][a-zA-Z0-9_.]*)',
            r'from \1',
            content
        )
        
        # 修复 import src. 导入
        content = re.sub(
            r'import src\.([a-zA-Z_][a-zA-Z0-9_.]*)',
            r'import \1',
            content
        )
        
        # 如果内容有变化，写回文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ 修复导入路径: {file_path}")
            return True
        else:
            print(f"⏭️  无需修复: {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ 修复失败 {file_path}: {e}")
        return False

def main():
    """主函数"""
    # 测试目录
    test_dir = Path(__file__).parent.parent / "tests"
    
    # 查找所有 Python 测试文件
    python_files = []
    for pattern in ["**/*.py", "**/*.pyi"]:
        python_files.extend(test_dir.glob(pattern))
    
    print(f"🔍 找到 {len(python_files)} 个 Python 文件")
    
    fixed_count = 0
    for file_path in python_files:
        if fix_imports_in_file(file_path):
            fixed_count += 1
    
    print(f"🎉 完成！修复了 {fixed_count} 个文件的导入路径")

if __name__ == "__main__":
    main()
