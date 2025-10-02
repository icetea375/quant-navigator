#!/usr/bin/env python3
"""
修复组件定义语法错误
修复测试文件中组件定义的语法错误，如：
name: 'ComponentName'template: '...'props: [...] -> name: 'ComponentName', template: '...', props: [...]
"""

import os
import re
import glob

def fix_component_definition_syntax(file_path):
    """修复组件定义语法错误"""
    print(f"正在修复组件定义语法: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        fixes_applied = []
        
        # 修复 name: 'ComponentName'template: '...'props: [...] 这种语法错误
        # 匹配模式：name: 'ComponentName'template: '...'props: [...]
        component_def_pattern = r"name:\s*'([^']+)'template:\s*'([^']+)'props:\s*\[([^\]]+)\]"
        
        def fix_component_definition(match):
            name = match.group(1)
            template = match.group(2)
            props = match.group(3)
            
            # 修复props中的引号问题
            # 将 'prop1''prop2''prop3' 转换为 'prop1', 'prop2', 'prop3'
            props_fixed = re.sub(r"'([^']+)''([^']+)'", r"'\1', '\2'", props)
            # 处理多个连续的引号
            while re.search(r"'([^']+)''([^']+)'", props_fixed):
                props_fixed = re.sub(r"'([^']+)''([^']+)'", r"'\1', '\2'", props_fixed)
            
            return f"name: '{name}',\n  template: '{template}',\n  props: [{props_fixed}]"
        
        if re.search(component_def_pattern, content):
            content = re.sub(component_def_pattern, fix_component_definition, content)
            fixes_applied.append("修复组件定义语法")
        
        # 修复其他类似的语法错误模式
        # 修复 name: 'ComponentName'template: '...'emits: [...] 这种模式
        component_emits_pattern = r"name:\s*'([^']+)'template:\s*'([^']+)'emits:\s*\[([^\]]+)\]"
        
        def fix_component_emits(match):
            name = match.group(1)
            template = match.group(2)
            emits = match.group(3)
            
            # 修复emits中的引号问题
            emits_fixed = re.sub(r"'([^']+)''([^']+)'", r"'\1', '\2'", emits)
            while re.search(r"'([^']+)''([^']+)'", emits_fixed):
                emits_fixed = re.sub(r"'([^']+)''([^']+)'", r"'\1', '\2'", emits_fixed)
            
            return f"name: '{name}',\n  template: '{template}',\n  emits: [{emits_fixed}]"
        
        if re.search(component_emits_pattern, content):
            content = re.sub(component_emits_pattern, fix_component_emits, content)
            fixes_applied.append("修复组件emits语法")
        
        # 修复 name: 'ComponentName'template: '...'props: [...]emits: [...] 这种复合模式
        component_complex_pattern = r"name:\s*'([^']+)'template:\s*'([^']+)'props:\s*\[([^\]]+)\]emits:\s*\[([^\]]+)\]"
        
        def fix_component_complex(match):
            name = match.group(1)
            template = match.group(2)
            props = match.group(3)
            emits = match.group(4)
            
            # 修复props和emits中的引号问题
            props_fixed = re.sub(r"'([^']+)''([^']+)'", r"'\1', '\2'", props)
            while re.search(r"'([^']+)''([^']+)'", props_fixed):
                props_fixed = re.sub(r"'([^']+)''([^']+)'", r"'\1', '\2'", props_fixed)
            
            emits_fixed = re.sub(r"'([^']+)''([^']+)'", r"'\1', '\2'", emits)
            while re.search(r"'([^']+)''([^']+)'", emits_fixed):
                emits_fixed = re.sub(r"'([^']+)''([^']+)'", r"'\1', '\2'", emits_fixed)
            
            return f"name: '{name}',\n  template: '{template}',\n  props: [{props_fixed}],\n  emits: [{emits_fixed}]"
        
        if re.search(component_complex_pattern, content):
            content = re.sub(component_complex_pattern, fix_component_complex, content)
            fixes_applied.append("修复复合组件定义语法")
        
        # 如果文件被修改了，写回文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"  ✅ 修复成功，应用了 {len(fixes_applied)} 个修复")
            for fix in fixes_applied:
                print(f"    - {fix}")
            return True
        else:
            print(f"  ℹ️  无需修复")
            return False
            
    except Exception as e:
        print(f"  ❌ 修复失败: {e}")
        return False

def main():
    """主函数"""
    print("🔧 开始修复组件定义语法错误...")
    
    # 查找所有测试文件
    test_files = []
    
    # 查找tools/tests目录下的所有测试文件
    test_patterns = [
        "tools/tests/**/*.test.ts",
        "tools/tests/**/*.test.js",
        "packages/frontend-main/src/**/*.test.ts",
        "packages/frontend-main/src/**/*.test.js"
    ]
    
    for pattern in test_patterns:
        test_files.extend(glob.glob(pattern, recursive=True))
    
    # 去重
    test_files = list(set(test_files))
    
    print(f"📁 找到 {len(test_files)} 个测试文件")
    
    fixed_count = 0
    total_files = len(test_files)
    
    for file_path in test_files:
        if os.path.exists(file_path):
            if fix_component_definition_syntax(file_path):
                fixed_count += 1
        else:
            print(f"  ⚠️  文件不存在: {file_path}")
    
    print(f"\n📊 修复完成:")
    print(f"   - 总文件数: {total_files}")
    print(f"   - 修复文件: {fixed_count} 个")
    print(f"   - 无需修复: {total_files - fixed_count} 个")

if __name__ == "__main__":
    main()
