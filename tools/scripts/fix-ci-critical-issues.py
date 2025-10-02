#!/usr/bin/env python3
"""
CI关键问题修复工具
专门修复CI检查中发现的关键问题：
1. 未终止的字符串字面量
2. 括号匹配问题
3. TypeScript语法错误
4. 测试文件语法问题

使用方法: python3 fix-ci-critical-issues.py
"""

import os
import re
import glob
from pathlib import Path

def fix_unterminated_string_literals(content):
    """修复未终止的字符串字面量"""
    fixes_applied = []
    
    # 查找未终止的字符串字面量模式
    patterns = [
        # 模式1: template: '<div class="el-empty">暂无数据</div>\',
        (r"template:\s*'<div class=\"el-empty\">暂无数据</div>\\',", 
         "template: '<div class=\"el-empty\">暂无数据</div>',"),
        
        # 模式2: props: [\'description\']
        (r"props:\s*\[\\'description\\'\]", 
         "props: ['description']"),
        
        # 模式3: 其他常见的未终止字符串
        (r"'([^']*)\\\',", r"'\1',"),
        (r'"([^"]*)\\\",', r'"\1",'),
    ]
    
    for pattern, replacement in patterns:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            fixes_applied.append(f"修复未终止字符串: {pattern}")
    
    return content, fixes_applied

def fix_bracket_mismatch(content):
    """修复括号匹配问题"""
    fixes_applied = []
    
    # 查找常见的括号不匹配模式
    patterns = [
        # 模式1: Expected ")" but found "}"
        (r'stubs:\s*\{\s*\.\.\.mockElementPlusComponents\(\)\s*\n\s*\n\s*\}\s*\n\s*\}\s*\n\s*\}', 
         'stubs: {\n            ...mockElementPlusComponents()\n          }\n        }'),
        
        # 模式2: props: defaultProps 后缺少闭合
        (r'props:\s*defaultProps\s*\n\s*\n\s*\}', 
         'props: defaultProps\n      }'),
        
        # 模式3: global配置括号问题
        (r'global:\s*\{\s*plugins:\s*\[pinia,\s*router\]\s*\}\s*\n\s*\}\s*\)', 
         'global: {\n        plugins: [pinia, router]\n      }\n    })'),
        
        # 模式4: 重复的闭合括号
        (r'\}\s*\n\s*\}\s*\n\s*\}\s*\n\s*\}', 
         '}\n        }'),
    ]
    
    for pattern, replacement in patterns:
        if re.search(pattern, content, re.MULTILINE):
            content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
            fixes_applied.append(f"修复括号匹配: {pattern[:50]}...")
    
    return content, fixes_applied

def fix_typescript_syntax_errors(content):
    """修复TypeScript语法错误"""
    fixes_applied = []
    
    # 修复事件名称错误
    event_fixes = [
        (r'mouseenter', 'onmouseenter'),
        (r'change', 'onchange'),
    ]
    
    for old_event, new_event in event_fixes:
        if re.search(old_event, content):
            content = re.sub(old_event, new_event, content)
            fixes_applied.append(f"修复事件名称: {old_event} -> {new_event}")
    
    # 修复类型赋值错误
    type_fixes = [
        (r'Type \'null\' is not assignable to type \'[^\']+\| undefined\'', 
         '// 修复类型赋值错误'),
        (r'Cannot find name \'mouseenter\'', 
         '// 修复事件名称错误'),
    ]
    
    for pattern, replacement in type_fixes:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            fixes_applied.append(f"修复类型错误: {pattern[:50]}...")
    
    return content, fixes_applied

def fix_test_file_syntax(file_path):
    """修复单个测试文件的语法问题"""
    print(f"正在修复: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        all_fixes = []
        
        # 应用所有修复
        content, string_fixes = fix_unterminated_string_literals(content)
        all_fixes.extend(string_fixes)
        
        content, bracket_fixes = fix_bracket_mismatch(content)
        all_fixes.extend(bracket_fixes)
        
        content, ts_fixes = fix_typescript_syntax_errors(content)
        all_fixes.extend(ts_fixes)
        
        # 如果文件被修改了，写回文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"  ✅ 修复成功，应用了 {len(all_fixes)} 个修复")
            for fix in all_fixes:
                print(f"    - {fix}")
            return True
        else:
            print(f"  ℹ️  文件无需修复")
            return False
            
    except Exception as e:
        print(f"  ❌ 修复失败: {e}")
        return False

def main():
    """主函数"""
    print("🔧 开始修复CI关键问题...")
    print("修复范围: 未终止字符串、括号匹配、TypeScript语法错误")
    
    # 需要修复的文件列表（基于CI检查结果）
    files_to_fix = [
        # 高优先级文件（有语法错误）
        'packages/frontend-main/src/components/admin/__tests__/FlowAndChipsViewer.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/QuantSignalDashboard.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/FinancialSnapshot.test.ts',
        
        # 测试失败的文件
        'tools/tests/unit/frontend/components/ComponentRenderDebug.test.ts',
        'tools/tests/unit/frontend/components/DataPanelContainer.test.ts',
        'tools/tests/unit/frontend/components/FinancialSnapshot.fixed.test.ts',
        'tools/tests/unit/frontend/components/FinancialSnapshot.test.ts',
        'tools/tests/unit/frontend/components/QuantSignalDashboard.test.ts',
        'tools/tests/unit/frontend/views/Home.test.ts',
        'tools/tests/unit/frontend/views/MarketRadar.test.ts',
        'tools/tests/unit/frontend/views/admin/SystemBrainConsole.test.ts',
        'tools/tests/unit/frontend/views/auth/Login.test.ts',
        'tools/tests/unit/frontend/views/auth/Register.test.ts',
        'tools/tests/unit/frontend/views/private/Layout.test.ts',
        'tools/tests/unit/frontend/views/private/MyAssistant.test.ts',
        'tools/tests/unit/frontend/views/private/StockPoolManager.test.ts',
    ]
    
    # 自动发现更多测试文件
    test_patterns = [
        'tools/tests/unit/frontend/**/*.test.ts',
        'packages/frontend-main/src/**/*.test.ts',
        'packages/frontend-main/src/**/__tests__/*.test.ts'
    ]
    
    for pattern in test_patterns:
        files_to_fix.extend(glob.glob(pattern, recursive=True))
    
    # 去重并排序
    files_to_fix = sorted(list(set(files_to_fix)))
    
    print(f"找到 {len(files_to_fix)} 个需要检查的文件\n")
    
    fixed_count = 0
    for file_path in files_to_fix:
        if os.path.exists(file_path):
            if fix_test_file_syntax(file_path):
                fixed_count += 1
        else:
            print(f"  ⚠️  文件不存在: {file_path}")
    
    print(f"\n🎉 CI关键问题修复完成！")
    print(f"   - 处理文件: {len(files_to_fix)} 个")
    print(f"   - 修复文件: {fixed_count} 个")
    print(f"   - 无需修复: {len(files_to_fix) - fixed_count} 个")
    
    if fixed_count > 0:
        print(f"\n建议下一步:")
        print(f"1. 运行 'npm test' 验证修复效果")
        print(f"2. 运行 'npx tsc --noEmit' 检查类型错误")
        print(f"3. 运行 'npm run lint' 检查linter错误")

if __name__ == "__main__":
    main()

