#!/usr/bin/env python3
"""
应用ArbitrationDashboard的解决方法到其他有组件渲染失败问题的测试文件
"""

import re
import os
from pathlib import Path

def find_failing_test_files():
    """查找有组件渲染失败问题的测试文件"""
    test_files = []
    test_dir = Path("/Users/pengcheng/Documents/papa/tools/tests/unit/frontend")
    
    # 已知有问题的测试文件
    known_failing_files = [
        "views/private/MyAssistant.test.ts",
        "views/private/StockPoolManager.test.ts", 
        "components/PersonalPrecedentViewer.test.ts",
        "components/ArbitrationDecisionDialog.test.ts",
        "components/DataPanelContainer.test.ts",
        "components/FlowAndChipsViewer.test.ts",
        "components/QuantSignalDashboard.test.ts",
        "components/RawTextExplorer.test.ts"
    ]
    
    for file_path in known_failing_files:
        full_path = test_dir / file_path
        if full_path.exists():
            test_files.append(full_path)
    
    return test_files

def analyze_test_file(test_file):
    """分析测试文件，找出需要修复的组件渲染问题"""
    try:
        with open(test_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 查找expect(wrapper.find(...).exists()).toBe(true)模式
        exists_pattern = r'expect\(wrapper\.find\([\'"]([^\'"]+)[\'"]\)\.exists\(\)\)\.toBe\(true\)'
        exists_matches = re.findall(exists_pattern, content)
        
        # 查找wrapper.vm.xxx = 模式（状态设置）
        vm_set_pattern = r'wrapper\.vm\.(\w+)\s*='
        vm_set_matches = re.findall(vm_set_pattern, content)
        
        # 查找beforeEach中的状态初始化
        beforeEach_pattern = r'beforeEach\(\(\)\s*=>\s*\{([^}]+)\}'
        beforeEach_matches = re.findall(beforeEach_pattern, content, re.DOTALL)
        
        return {
            'exists_assertions': exists_matches,
            'vm_set_statements': vm_set_matches,
            'beforeEach_blocks': beforeEach_matches,
            'has_rendering_issues': len(exists_matches) > 0
        }
    except Exception as e:
        print(f"Error analyzing {test_file}: {e}")
        return None

def suggest_fixes(test_file, analysis):
    """为测试文件建议修复方案"""
    suggestions = []
    
    if not analysis or not analysis['has_rendering_issues']:
        return suggestions
    
    # 基于ArbitrationDashboard的解决方法，建议设置状态变量
    common_state_vars = [
        'loading', 'isLoading', 'isVisible', 'show', 'visible', 'open',
        'isFullscreen', 'isExpanded', 'isActive', 'selected', 'current'
    ]
    
    # 检查是否有这些状态变量需要设置
    for var in common_state_vars:
        if any(var in assertion for assertion in analysis['exists_assertions']):
            suggestions.append({
                'type': 'set_state_variable',
                'variable': var,
                'value': 'false' if var in ['isFullscreen', 'loading', 'isLoading'] else 'true',
                'description': f'设置 {var} 状态以确保组件正确渲染'
            })
    
    # 检查是否需要设置数据
    if any('data' in assertion or 'list' in assertion or 'items' in assertion for assertion in analysis['exists_assertions']):
        suggestions.append({
            'type': 'set_data',
            'description': '设置组件数据以确保内容正确渲染'
        })
    
    return suggestions

def main():
    print("=== ArbitrationDashboard解决方法应用分析 ===\n")
    
    test_files = find_failing_test_files()
    print(f"找到 {len(test_files)} 个有问题的测试文件\n")
    
    total_suggestions = 0
    applicable_files = 0
    
    for test_file in test_files:
        print(f"分析文件: {test_file.name}")
        analysis = analyze_test_file(test_file)
        
        if analysis and analysis['has_rendering_issues']:
            suggestions = suggest_fixes(test_file, analysis)
            
            if suggestions:
                applicable_files += 1
                total_suggestions += len(suggestions)
                
                print(f"  渲染断言数量: {len(analysis['exists_assertions'])}")
                print(f"  建议修复数量: {len(suggestions)}")
                
                for i, suggestion in enumerate(suggestions, 1):
                    print(f"    {i}. {suggestion['description']}")
                    if suggestion['type'] == 'set_state_variable':
                        print(f"       设置: wrapper.vm.{suggestion['variable']} = {suggestion['value']}")
                
                print()
            else:
                print("  无适用修复建议\n")
        else:
            print("  无渲染问题\n")
    
    print(f"=== 总结 ===")
    print(f"可应用ArbitrationDashboard解决方法的文件: {applicable_files} 个")
    print(f"总建议修复数量: {total_suggestions} 个")
    print(f"平均每个文件建议修复: {total_suggestions/max(applicable_files, 1):.1f} 个")
    
    # 按优先级排序
    print(f"\n=== 修复优先级建议 ===")
    priority_files = [
        ("MyAssistant.test.ts", "有17个失败测试，包含大量组件渲染问题"),
        ("StockPoolManager.test.ts", "有20个失败测试，包含数据依赖渲染问题"),
        ("PersonalPrecedentViewer.test.ts", "有14个失败测试，包含条件渲染问题"),
        ("ArbitrationDecisionDialog.test.ts", "有15个失败测试，包含状态切换问题"),
        ("DataPanelContainer.test.ts", "有10个失败测试，包含数据传递问题")
    ]
    
    for i, (filename, reason) in enumerate(priority_files, 1):
        print(f"{i}. {filename} - {reason}")

if __name__ == "__main__":
    main()



