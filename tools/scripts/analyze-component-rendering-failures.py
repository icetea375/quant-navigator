#!/usr/bin/env python3
"""
分析组件渲染失败问题，找出可以应用ArbitrationDashboard解决方法的情况
"""

import re
import os
from pathlib import Path

def find_component_files():
    """查找所有Vue组件文件"""
    component_files = []
    src_dir = Path("/Users/pengcheng/Documents/papa/packages/frontend-main/src")
    
    for vue_file in src_dir.rglob("*.vue"):
        component_files.append(vue_file)
    
    return component_files

def analyze_conditional_rendering(vue_file):
    """分析Vue文件中的条件渲染"""
    try:
        with open(vue_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 查找v-if条件
        v_if_patterns = re.findall(r'v-if="([^"]+)"', content)
        
        # 查找ref变量定义
        ref_patterns = re.findall(r'const\s+(\w+)\s*=\s*ref\(', content)
        
        # 查找computed属性
        computed_patterns = re.findall(r'const\s+(\w+)\s*=\s*computed\(', content)
        
        return {
            'v_if_conditions': v_if_patterns,
            'ref_variables': ref_patterns,
            'computed_properties': computed_patterns,
            'has_conditional_rendering': len(v_if_patterns) > 0
        }
    except Exception as e:
        print(f"Error analyzing {vue_file}: {e}")
        return None

def main():
    print("=== 组件渲染失败问题分析 ===\n")
    
    component_files = find_component_files()
    print(f"找到 {len(component_files)} 个Vue组件文件\n")
    
    conditional_components = []
    
    for vue_file in component_files:
        analysis = analyze_conditional_rendering(vue_file)
        if analysis and analysis['has_conditional_rendering']:
            conditional_components.append({
                'file': vue_file,
                'analysis': analysis
            })
    
    print(f"有条件渲染的组件: {len(conditional_components)} 个\n")
    
    # 按条件渲染复杂度排序
    conditional_components.sort(key=lambda x: len(x['analysis']['v_if_conditions']), reverse=True)
    
    for i, comp in enumerate(conditional_components[:10], 1):  # 显示前10个
        rel_path = comp['file'].relative_to(Path("/Users/pengcheng/Documents/papa"))
        print(f"{i}. {rel_path}")
        print(f"   v-if条件数量: {len(comp['analysis']['v_if_conditions'])}")
        print(f"   ref变量数量: {len(comp['analysis']['ref_variables'])}")
        print(f"   computed属性数量: {len(comp['analysis']['computed_properties'])}")
        print(f"   v-if条件: {comp['analysis']['v_if_conditions'][:3]}...")  # 显示前3个
        print()
    
    # 分析可能的解决方案
    print("=== 可能的解决方案分析 ===\n")
    
    # 查找有loading状态的组件
    loading_components = []
    for comp in conditional_components:
        conditions = comp['analysis']['v_if_conditions']
        if any('loading' in cond for cond in conditions):
            loading_components.append(comp)
    
    print(f"有loading条件渲染的组件: {len(loading_components)} 个")
    
    # 查找有数据依赖的组件
    data_components = []
    for comp in conditional_components:
        conditions = comp['analysis']['v_if_conditions']
        if any(any(keyword in cond for keyword in ['length', 'data', 'list', 'items']) for cond in conditions):
            data_components.append(comp)
    
    print(f"有数据依赖条件渲染的组件: {len(data_components)} 个")
    
    # 查找有状态切换的组件
    state_components = []
    for comp in conditional_components:
        conditions = comp['analysis']['v_if_conditions']
        if any(any(keyword in cond for keyword in ['show', 'visible', 'open', 'active', 'selected']) for cond in conditions):
            state_components.append(comp)
    
    print(f"有状态切换条件渲染的组件: {len(state_components)} 个")
    
    print(f"\n总计可能有条件渲染问题的组件: {len(conditional_components)} 个")
    print(f"其中 {len(loading_components)} 个可能有loading状态问题")
    print(f"其中 {len(data_components)} 个可能有数据依赖问题") 
    print(f"其中 {len(state_components)} 个可能有状态切换问题")

if __name__ == "__main__":
    main()



