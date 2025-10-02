#!/usr/bin/env python3
"""
修复测试文件导入路径脚本
解决测试文件移动到tools/tests/后的导入问题
"""

import os
import re
import sys
from pathlib import Path

def fix_python_imports(file_path):
    """修复Python测试文件的导入路径"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 添加项目根目录到Python路径
    if 'sys.path.insert' not in content:
        # 在import语句前添加路径设置
        lines = content.split('\n')
        import_lines = []
        other_lines = []
        
        for line in lines:
            if line.strip().startswith(('import ', 'from ')) and 'sys.path' not in line:
                import_lines.append(line)
            else:
                other_lines.append(line)
        
        if import_lines:
            # 找到第一个import的位置
            first_import_idx = next(i for i, line in enumerate(lines) if line.strip().startswith(('import ', 'from ')))
            
            # 插入路径设置
            path_setup = [
                "import os",
                "import sys",
                "",
                "# 添加项目根目录到Python路径",
                "sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../packages/backend-python'))",
                ""
            ]
            
            lines[first_import_idx:first_import_idx] = path_setup
            content = '\n'.join(lines)
    
    # 修复相对导入
    content = re.sub(r'from src\.', 'from src.', content)
    content = re.sub(r'from tests\.', 'from tests.', content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def fix_typescript_imports(file_path):
    """修复TypeScript测试文件的导入路径"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 计算相对路径深度
    # tools/tests/unit/frontend/components/ -> ../../../../packages/frontend-main/src/
    path_parts = str(file_path).split('/')
    # 找到tools/tests的位置，然后计算到packages/frontend-main/src的深度
    if 'tools' in path_parts and 'tests' in path_parts:
        tools_idx = path_parts.index('tools')
        depth = len(path_parts) - tools_idx - 2  # 减去tools和tests
        relative_path = '../' * depth + 'packages/frontend-main/src/'
    else:
        relative_path = '../../../../packages/frontend-main/src/'
    
    # 替换@/别名导入
    content = re.sub(r"from '@/", f"from '{relative_path}", content)
    content = re.sub(r'from "@/', f"from '{relative_path}", content)
    
    # 替换相对导入
    content = re.sub(r"from '\.\./", f"from '{relative_path}", content)
    content = re.sub(r'from "\.\./', f'from "{relative_path}', content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    """主函数"""
    tools_tests_dir = Path(__file__).parent.parent / 'tests'
    
    if not tools_tests_dir.exists():
        print("❌ tools/tests/ 目录不存在")
        return
    
    print("🔧 开始修复测试文件导入路径...")
    
    # 修复Python文件
    python_files = list(tools_tests_dir.rglob('*.py'))
    python_fixed = 0
    
    for py_file in python_files:
        if fix_python_imports(py_file):
            python_fixed += 1
            print(f"✅ 修复Python文件: {py_file.relative_to(tools_tests_dir)}")
    
    # 修复TypeScript文件
    ts_files = list(tools_tests_dir.rglob('*.test.ts'))
    ts_fixed = 0
    
    for ts_file in ts_files:
        if fix_typescript_imports(ts_file):
            ts_fixed += 1
            print(f"✅ 修复TypeScript文件: {ts_file.relative_to(tools_tests_dir)}")
    
    print(f"\n🎉 修复完成!")
    print(f"Python文件: {python_fixed}个")
    print(f"TypeScript文件: {ts_fixed}个")
    print(f"总计: {python_fixed + ts_fixed}个文件")

if __name__ == '__main__':
    main()
