#!/usr/bin/env python3
"""
修复any类型工具
将TypeScript代码中的any类型替换为更具体的类型，提高类型安全性

功能：
1. 检测并替换常见的any类型模式
2. 根据上下文推断更合适的类型
3. 提供类型安全的替代方案
4. 生成类型定义建议
"""

import os
import re
import glob
from pathlib import Path

def detect_any_types(content):
    """检测代码中的any类型使用"""
    any_patterns = [
        # 变量声明中的any
        r'(\w+):\s*any\b',
        # 函数参数中的any
        r'\(([^)]*any[^)]*)\)',
        # 函数返回类型中的any
        r':\s*any\s*[=;]',
        # 数组类型中的any
        r'any\[\]|Array<any>',
        # 对象类型中的any
        r'\{[^}]*any[^}]*\}',
        # 泛型中的any
        r'<[^>]*any[^>]*>',
    ]
    
    detected = []
    for pattern in any_patterns:
        matches = re.finditer(pattern, content)
        for match in matches:
            detected.append({
                'pattern': pattern,
                'match': match.group(0),
                'start': match.start(),
                'end': match.end(),
                'line': content[:match.start()].count('\n') + 1
            })
    
    return detected

def suggest_type_replacement(any_usage, context):
    """根据上下文建议类型替换"""
    suggestions = {
        # 常见的any类型替换
        'router': 'Router',
        'wrapper': 'VueWrapper<any>',
        'element': 'HTMLElement',
        'event': 'Event',
        'response': 'Response',
        'data': 'unknown',
        'result': 'unknown',
        'config': 'Record<string, unknown>',
        'options': 'Record<string, unknown>',
        'params': 'Record<string, string>',
        'query': 'Record<string, string>',
        'props': 'Record<string, unknown>',
        'state': 'Record<string, unknown>',
        'store': 'Store',
        'api': 'ApiResponse',
        'user': 'User',
        'item': 'unknown',
        'item': 'unknown',
        'list': 'unknown[]',
        'items': 'unknown[]',
        'array': 'unknown[]',
        'object': 'Record<string, unknown>',
        'obj': 'Record<string, unknown>',
        'value': 'unknown',
        'val': 'unknown',
        'key': 'string',
        'id': 'string | number',
        'name': 'string',
        'title': 'string',
        'description': 'string',
        'message': 'string',
        'text': 'string',
        'content': 'string',
        'url': 'string',
        'path': 'string',
        'type': 'string',
        'status': 'string | number',
        'count': 'number',
        'size': 'number',
        'length': 'number',
        'index': 'number',
        'page': 'number',
        'limit': 'number',
        'offset': 'number',
        'timestamp': 'number',
        'date': 'Date | string',
        'time': 'Date | string',
        'created': 'Date | string',
        'updated': 'Date | string',
        'deleted': 'boolean',
        'enabled': 'boolean',
        'visible': 'boolean',
        'active': 'boolean',
        'loading': 'boolean',
        'disabled': 'boolean',
        'required': 'boolean',
        'optional': 'boolean',
    }
    
    # 根据变量名建议类型
    for var_name, suggested_type in suggestions.items():
        if var_name in any_usage.lower():
            return suggested_type
    
    # 根据上下文建议类型
    if 'router' in context.lower():
        return 'Router'
    elif 'store' in context.lower():
        return 'Store'
    elif 'api' in context.lower():
        return 'ApiResponse'
    elif '[]' in any_usage or 'Array' in any_usage:
        return 'unknown[]'
    elif '{' in any_usage and '}' in any_usage:
        return 'Record<string, unknown>'
    elif 'function' in context.lower() or '()' in any_usage:
        return '() => void'
    else:
        return 'unknown'

def fix_any_types(file_path):
    """修复单个文件中的any类型"""
    print(f"正在修复any类型: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        fixes_applied = []
        
        # 检测any类型使用
        any_usages = detect_any_types(content)
        
        if not any_usages:
            print(f"  ℹ️  未发现any类型使用")
            return False
        
        print(f"  发现 {len(any_usages)} 个any类型使用")
        
        # 按行号排序，从后往前替换避免位置偏移
        any_usages.sort(key=lambda x: x['start'], reverse=True)
        
        for usage in any_usages:
            any_match = usage['match']
            line_num = usage['line']
            
            # 获取上下文
            lines = content.split('\n')
            if line_num <= len(lines):
                context = lines[line_num - 1] if line_num > 0 else ''
            else:
                context = ''
            
            # 建议替换类型
            suggested_type = suggest_type_replacement(any_match, context)
            
            # 执行替换
            if suggested_type != 'unknown' or 'any' in any_match:
                # 替换变量声明中的any
                if re.match(r'\w+:\s*any\b', any_match):
                    new_match = re.sub(r'any\b', suggested_type, any_match)
                    content = content[:usage['start']] + new_match + content[usage['end']:]
                    fixes_applied.append(f"行{line_num}: {any_match} -> {new_match}")
                
                # 替换函数参数中的any
                elif 'any' in any_match and '(' in any_match:
                    new_match = re.sub(r'\bany\b', suggested_type, any_match)
                    content = content[:usage['start']] + new_match + content[usage['end']:]
                    fixes_applied.append(f"行{line_num}: {any_match} -> {new_match}")
                
                # 替换其他any使用
                else:
                    new_match = re.sub(r'\bany\b', suggested_type, any_match)
                    content = content[:usage['start']] + new_match + content[usage['end']:]
                    fixes_applied.append(f"行{line_num}: {any_match} -> {new_match}")
        
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

def generate_type_definitions(file_path):
    """为文件生成类型定义建议"""
    print(f"正在生成类型定义建议: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检测需要类型定义的接口
        interface_patterns = [
            r'interface\s+(\w+)\s*\{[^}]*\}',
            r'type\s+(\w+)\s*=\s*[^;]+',
            r'class\s+(\w+)\s*[^{]*\{',
        ]
        
        existing_types = set()
        for pattern in interface_patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            existing_types.update(matches)
        
        # 检测可能需要类型定义的变量
        var_patterns = [
            r'const\s+(\w+)\s*=\s*\{[^}]*\}',
            r'let\s+(\w+)\s*=\s*\{[^}]*\}',
            r'var\s+(\w+)\s*=\s*\{[^}]*\}',
        ]
        
        potential_types = []
        for pattern in var_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                var_name = match.group(1)
                if var_name not in existing_types and var_name[0].isupper():
                    potential_types.append(var_name)
        
        if potential_types:
            print(f"  建议为以下变量定义类型: {', '.join(potential_types)}")
            return potential_types
        else:
            print(f"  ℹ️  未发现需要类型定义的变量")
            return []
            
    except Exception as e:
        print(f"  ❌ 生成类型定义失败: {e}")
        return []

def main():
    """主函数"""
    print("🔧 开始修复any类型...")
    print("将any类型替换为更具体的类型，提高类型安全性")
    
    # 查找TypeScript文件
    ts_patterns = [
        'tools/tests/unit/frontend/**/*.test.ts',
        'tools/tests/integration/frontend/**/*.test.ts',
        'packages/frontend-main/src/**/*.ts',
        'packages/frontend-main/src/**/*.vue',
    ]
    
    files_to_fix = []
    for pattern in ts_patterns:
        files_to_fix.extend(glob.glob(pattern, recursive=True))
    
    # 去重并排序
    files_to_fix = sorted(list(set(files_to_fix)))
    
    print(f"找到 {len(files_to_fix)} 个TypeScript文件\n")
    
    fixed_count = 0
    type_suggestions = []
    
    for file_path in files_to_fix:
        if os.path.exists(file_path):
            if fix_any_types(file_path):
                fixed_count += 1
            
            # 生成类型定义建议
            suggestions = generate_type_definitions(file_path)
            if suggestions:
                type_suggestions.extend(suggestions)
        else:
            print(f"  ❌ 文件不存在: {file_path}")
    
    print(f"\n🎉 any类型修复完成！")
    print(f"   - 处理文件: {len(files_to_fix)} 个")
    print(f"   - 修复文件: {fixed_count} 个")
    print(f"   - 无需修复: {len(files_to_fix) - fixed_count} 个")
    
    if type_suggestions:
        print(f"\n💡 类型定义建议:")
        unique_suggestions = list(set(type_suggestions))
        for suggestion in unique_suggestions[:10]:  # 只显示前10个
            print(f"   - 考虑为 '{suggestion}' 定义具体类型")

if __name__ == "__main__":
    main()
