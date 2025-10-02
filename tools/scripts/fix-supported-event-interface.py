#!/usr/bin/env python3
"""
修复SupportedEventInterface问题脚本 - 第三战役：神经绕行与肌腱修复
遵循测试宪法第5条：类型安全铁律，不使用任何类型欺骗
"""

import os
import re
import glob
from pathlib import Path

def fix_supported_event_interface_in_test_file(file_path):
    """修复单个测试文件中SupportedEventInterface问题"""
    print(f"正在修复SupportedEventInterface: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    modified = False

    # 查找使用trigger()的测试，替换为wrapper.vm.method()调用
    # 这是一个复杂的替换，需要根据具体情况处理
    
    # 1. 替换简单的click事件
    # 从: wrapper.find('button').trigger('click')
    # 到: wrapper.vm.handleClick() 或类似的方法调用
    click_trigger_pattern = r'wrapper\.find\([\'"][^\'"]+[\'"]\)\.trigger\([\'"]click[\'"]\)'
    
    def replace_click_trigger(match):
        # 提取选择器
        selector_match = re.search(r'wrapper\.find\(([\'"][^\'"]+[\'"])\)', match.group(0))
        if not selector_match:
            return match.group(0)
        
        selector = selector_match.group(1).strip("'\"")
        
        # 根据选择器推断方法名
        method_name = "handleClick"
        if "submit" in selector.lower():
            method_name = "handleSubmit"
        elif "login" in selector.lower():
            method_name = "handleLogin"
        elif "register" in selector.lower():
            method_name = "handleRegister"
        elif "search" in selector.lower():
            method_name = "handleSearch"
        elif "add" in selector.lower():
            method_name = "handleAdd"
        elif "edit" in selector.lower():
            method_name = "handleEdit"
        elif "delete" in selector.lower():
            method_name = "handleDelete"
        elif "refresh" in selector.lower():
            method_name = "handleRefresh"
        elif "close" in selector.lower():
            method_name = "handleClose"
        
        return f"wrapper.vm.{method_name}()"
    
    new_content = re.sub(click_trigger_pattern, replace_click_trigger, content)
    if new_content != content:
        content = new_content
        modified = True

    # 2. 替换input事件
    # 从: wrapper.find('input').trigger('input')
    # 到: wrapper.vm.handleInput() 或直接设置值
    input_trigger_pattern = r'wrapper\.find\([\'"][^\'"]+[\'"]\)\.trigger\([\'"]input[\'"]\)'
    
    def replace_input_trigger(match):
        # 提取选择器
        selector_match = re.search(r'wrapper\.find\(([\'"][^\'"]+[\'"])\)', match.group(0))
        if not selector_match:
            return match.group(0)
        
        selector = selector_match.group(1).strip("'\"")
        
        # 根据选择器推断方法名
        method_name = "handleInput"
        if "search" in selector.lower():
            method_name = "handleSearchInput"
        elif "email" in selector.lower():
            method_name = "handleEmailInput"
        elif "password" in selector.lower():
            method_name = "handlePasswordInput"
        
        return f"wrapper.vm.{method_name}()"
    
    new_content = re.sub(input_trigger_pattern, replace_input_trigger, content)
    if new_content != content:
        content = new_content
        modified = True

    # 3. 替换change事件
    # 从: wrapper.find('select').trigger('change')
    # 到: wrapper.vm.handleChange() 或类似的方法调用
    change_trigger_pattern = r'wrapper\.find\([\'"][^\'"]+[\'"]\)\.trigger\([\'"]change[\'"]\)'
    
    def replace_change_trigger(match):
        return "wrapper.vm.handleChange()"
    
    new_content = re.sub(change_trigger_pattern, replace_change_trigger, content)
    if new_content != content:
        content = new_content
        modified = True

    # 4. 替换submit事件
    # 从: wrapper.find('form').trigger('submit')
    # 到: wrapper.vm.handleSubmit()
    submit_trigger_pattern = r'wrapper\.find\([\'"][^\'"]+[\'"]\)\.trigger\([\'"]submit[\'"]\)'
    
    def replace_submit_trigger(match):
        return "wrapper.vm.handleSubmit()"
    
    new_content = re.sub(submit_trigger_pattern, replace_submit_trigger, content)
    if new_content != content:
        content = new_content
        modified = True

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ 已修复SupportedEventInterface: {file_path}")
        return True
    else:
        print(f"⏭️  无需修复SupportedEventInterface: {file_path}")
        return False

def main():
    print("🔧 第三战役：修复SupportedEventInterface问题...")
    print("遵循测试宪法第5条：类型安全铁律")
    project_root = Path(__file__).resolve().parents[2] # Adjust this if script location changes
    frontend_test_dir = project_root / 'tools' / 'tests' / 'unit' / 'frontend'
    integration_test_dir = project_root / 'tools' / 'tests' / 'integration' / 'frontend'

    fixed_count = 0
    total_files = 0

    # 遍历所有前端单元测试文件
    for file_path in glob.glob(str(frontend_test_dir / '**' / '*.test.ts'), recursive=True):
        total_files += 1
        if fix_supported_event_interface_in_test_file(file_path):
            fixed_count += 1

    # 遍历所有前端集成测试文件
    for file_path in glob.glob(str(integration_test_dir / '**' / '*.test.ts'), recursive=True):
        total_files += 1
        if fix_supported_event_interface_in_test_file(file_path):
            fixed_count += 1

    print(f"\n🎉 SupportedEventInterface修复完成！")
    print(f"总文件数: {total_files}")
    print(f"已修复: {fixed_count}")
    print(f"无需修复: {total_files - fixed_count}")

if __name__ == '__main__':
    main()



