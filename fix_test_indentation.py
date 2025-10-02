#!/usr/bin/env python3
"""
批量修复测试文件中的缩进问题
"""

import os
import re
import glob

def fix_indentation_errors(file_path):
    """修复文件中的缩进错误"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    fixed_lines = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # 检查是否有函数定义后缺少缩进的问题
        if re.match(r'^\s*async def test_placeholder\(self\):\s*$', line):
            # 检查下一行是否是另一个函数定义
            if i + 1 < len(lines) and re.match(r'^\s*def test_', lines[i + 1]):
                # 在placeholder函数后添加pass
                fixed_lines.append(line)
                fixed_lines.append('        pass')
                fixed_lines.append('')
                i += 1
                continue
        
        # 检查是否有函数定义后直接跟另一个函数定义
        if re.match(r'^\s*def test_.*\(.*\):\s*$', line):
            # 检查下一行是否是另一个函数定义
            if i + 1 < len(lines) and re.match(r'^\s*def test_', lines[i + 1]):
                # 在函数后添加pass
                fixed_lines.append(line)
                fixed_lines.append('        pass')
                i += 1
                continue
        
        # 检查是否有async def后直接跟def
        if re.match(r'^\s*async def test_.*\(.*\):\s*$', line):
            # 检查下一行是否是另一个函数定义
            if i + 1 < len(lines) and re.match(r'^\s*def test_', lines[i + 1]):
                # 在async函数后添加pass
                fixed_lines.append(line)
                fixed_lines.append('        pass')
                fixed_lines.append('')
                i += 1
                continue
        
        fixed_lines.append(line)
        i += 1
    
    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(fixed_lines))
    
    print(f"修复了文件: {file_path}")

def main():
    """主函数"""
    # 查找所有测试文件
    test_files = glob.glob('tools/tests/**/*.py', recursive=True)
    
    for file_path in test_files:
        try:
            # 尝试编译文件检查语法
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            compile(content, file_path, 'exec')
            print(f"文件语法正确: {file_path}")
        except SyntaxError as e:
            print(f"发现语法错误: {file_path} - {e}")
            fix_indentation_errors(file_path)

if __name__ == '__main__':
    main()

