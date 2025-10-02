#!/usr/bin/env python3
"""
修复重复global配置工具
合并Vue测试中重复的global配置，避免配置冲突
"""

import os
import re
import glob
from pathlib import Path

def fix_duplicate_global_in_test_file(file_path):
    """修复单个测试文件中重复global配置的问题"""
    print(f"正在修复重复global配置: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    modified = False

    # 查找重复的global配置模式
    # 匹配 mount(Component, { global: {...}, props: {...}, global: {...} })
    pattern = r'mount\([^,]+,\s*{\s*global:\s*\{[^}]*\},\s*[^}]*,\s*global:\s*\{[^}]*\}\s*\}\)'
    
    def fix_duplicate_global(match):
        full_match = match.group(0)
        
        # 提取第一个global配置
        first_global_match = re.search(r'global:\s*\{[^}]*\}', full_match)
        if not first_global_match:
            return full_match
            
        first_global = first_global_match.group(0)
        
        # 提取第二个global配置
        second_global_match = re.search(r',\s*global:\s*\{[^}]*\}', full_match)
        if not second_global_match:
            return full_match
            
        second_global = second_global_match.group(0)[2:]  # 去掉开头的逗号和空格
        
        # 合并两个global配置
        # 提取第一个global的内容（去掉global:和花括号）
        first_content = first_global[7:-1].strip()
        
        # 提取第二个global的内容（去掉global:和花括号）
        second_content = second_global[7:-1].strip()
        
        # 合并内容
        if first_content and second_content:
            merged_content = f"{first_content},\n          {second_content}"
        elif first_content:
            merged_content = first_content
        elif second_content:
            merged_content = second_content
        else:
            merged_content = ""
        
        # 重构整个mount调用
        # 找到mount(Component, { 和最后的 })
        mount_start = full_match.find('mount(')
        mount_end = full_match.rfind('})')
        
        if mount_start == -1 or mount_end == -1:
            return full_match
            
        component_part = full_match[mount_start:full_match.find(', {') + 2]
        closing_part = full_match[mount_end:]
        
        # 重新构建
        result = f"{component_part}\n        global: {{\n          {merged_content}\n        }}\n      {closing_part}"
        
        return result

    # 应用修复
    new_content = re.sub(pattern, fix_duplicate_global, content, flags=re.DOTALL)
    
    if new_content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ 已修复重复global配置: {file_path}")
        return True
    else:
        print(f"⏭️  无需修复重复global配置: {file_path}")
        return False

def main():
    print("🔧 第三战役：修复重复global配置问题...")
    print("遵循测试宪法第5条：类型安全铁律")
    project_root = Path(__file__).resolve().parents[2] # Adjust this if script location changes
    frontend_test_dir = project_root / 'tools' / 'tests' / 'unit' / 'frontend'
    integration_test_dir = project_root / 'tools' / 'tests' / 'integration' / 'frontend'

    fixed_count = 0
    total_files = 0

    # 遍历所有前端单元测试文件
    for file_path in glob.glob(str(frontend_test_dir / '**' / '*.test.ts'), recursive=True):
        total_files += 1
        if fix_duplicate_global_in_test_file(file_path):
            fixed_count += 1

    # 遍历所有前端集成测试文件
    for file_path in glob.glob(str(integration_test_dir / '**' / '*.test.ts'), recursive=True):
        total_files += 1
        if fix_duplicate_global_in_test_file(file_path):
            fixed_count += 1

    print(f"\n🎉 重复global配置修复完成！")
    print(f"总文件数: {total_files}")
    print(f"已修复: {fixed_count}")
    print(f"无需修复: {total_files - fixed_count}")

if __name__ == '__main__':
    main()



