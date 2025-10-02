#!/usr/bin/env python3
"""
批量修复Python测试文件中的导入路径
"""
import os
import re
from pathlib import Path

def fix_imports_in_file(file_path):
    """修复单个文件中的导入路径"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 修复常见的导入模式
        patterns = [
            (r'^from api\.', 'from src.api.'),
            (r'^from schemas\.', 'from src.schemas.'),
            (r'^from services\.', 'from src.services.'),
            (r'^from entities\.', 'from src.entities.'),
            (r'^from core\.', 'from src.core.'),
            (r'^from utils\.', 'from src.utils.'),
            (r'^from config\.', 'from src.config.'),
            (r'^from database\.', 'from src.database.'),
        ]
        
        for pattern, replacement in patterns:
            content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
        
        # 如果内容有变化，写回文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed imports in: {file_path}")
            return True
        return False
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """主函数"""
    test_dir = Path("/Users/pengcheng/Documents/papa/tools/tests/unit/backend")
    
    if not test_dir.exists():
        print(f"Test directory not found: {test_dir}")
        return
    
    fixed_count = 0
    total_count = 0
    
    # 遍历所有Python测试文件
    for py_file in test_dir.rglob("test_*.py"):
        total_count += 1
        if fix_imports_in_file(py_file):
            fixed_count += 1
    
    print(f"\nFixed {fixed_count} out of {total_count} files")

if __name__ == "__main__":
    main()
