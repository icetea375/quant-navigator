#!/usr/bin/env python3
"""
保守的语法错误修复策略
一次只修复一种类型的错误，避免引入新问题
"""

import os
import re

def fix_missing_commas(file_path):
    """修复缺少逗号的语法错误"""
    print(f"正在修复缺少逗号: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        fixes_applied = []
        
        # 1. 修复 "})\n  )" 这种缺少逗号的问题
        missing_comma_pattern = r"\)\s*\n\s*\)\s*$"
        if re.search(missing_comma_pattern, content, re.MULTILINE):
            content = re.sub(missing_comma_pattern, "})\n      })", content, flags=re.MULTILINE)
            fixes_applied.append("修复缺少逗号")
        
        # 2. 修复 "stubs: {\n          ...defaultStubs,\n        }" 这种缺少内容的问题
        empty_stubs_pattern = r"stubs:\s*\{\s*\.\.\.defaultStubs,\s*\}"
        if re.search(empty_stubs_pattern, content):
            content = re.sub(
                empty_stubs_pattern,
                """stubs: {
          ...defaultStubs,
          'el-empty': { 
            template: '<div class="el-empty">暂无数据</div>',
            props: ['description']
          }
        }""",
                content
            )
            fixes_applied.append("修复空的stubs配置")
        
        # 如果文件被修改了，写回文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"  ✅ 修复成功，应用了 {len(fixes_applied)} 个修复")
            for fix in fixes_applied:
                print(f"    - {fix}")
            return True
        else:
            print(f"  ℹ️  文件无需修复")
            return False
            
    except Exception as e:
        print(f"  ❌ 修复失败: {e}")
        return False

def fix_bracket_matching(file_path):
    """修复括号匹配问题"""
    print(f"正在修复括号匹配: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        fixes_applied = []
        
        # 1. 修复缺少右括号的问题
        missing_brace_pattern = r"template:\s*'<div class=\"v-chart-mock\"></div>'\s*$"
        if re.search(missing_brace_pattern, content, re.MULTILINE):
            content = re.sub(missing_brace_pattern, "template: '<div class=\"v-chart-mock\"></div>' }", content, flags=re.MULTILINE)
            fixes_applied.append("修复缺少右括号")
        
        # 2. 修复复杂的stubs配置结构
        complex_stubs_pattern = r"stubs:\s*\{\s*\.\.\.defaultStubs,\s*'el-empty':\s*\{[^}]*\}\s*\},\s*\)"
        if re.search(complex_stubs_pattern, content, re.DOTALL):
            content = re.sub(
                complex_stubs_pattern,
                """stubs: {
          ...defaultStubs,
          'el-empty': { 
            template: '<div class="el-empty">暂无数据</div>',
            props: ['description']
          }
        })""",
                content,
                flags=re.DOTALL
            )
            fixes_applied.append("修复复杂的stubs配置")
        
        # 如果文件被修改了，写回文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"  ✅ 修复成功，应用了 {len(fixes_applied)} 个修复")
            for fix in fixes_applied:
                print(f"    - {fix}")
            return True
        else:
            print(f"  ℹ️  文件无需修复")
            return False
            
    except Exception as e:
        print(f"  ❌ 修复失败: {e}")
        return False

def fix_import_syntax(file_path):
    """修复导入语法错误"""
    print(f"正在修复导入语法: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        fixes_applied = []
        
        # 1. 修复错误的导入路径
        wrong_import_pattern = r"import\s*{\s*createTestWrapper,\s*mockElementPlusComponents\s*}\s*from\s*'@/utils/test-stubs'"
        if re.search(wrong_import_pattern, content):
            content = re.sub(
                wrong_import_pattern,
                "import { createTestWrapper, mockElementPlusComponents } from '@/utils/test-utils'",
                content
            )
            fixes_applied.append("修复错误的导入路径")
        
        # 2. 修复重复的导入语句
        lines = content.split('\n')
        import_lines = []
        seen_imports = set()
        
        for line in lines:
            if line.strip().startswith('import '):
                if line.strip() not in seen_imports:
                    import_lines.append(line)
                    seen_imports.add(line.strip())
                else:
                    fixes_applied.append("删除重复的导入语句")
            else:
                import_lines.append(line)
        
        content = '\n'.join(import_lines)
        
        # 如果文件被修改了，写回文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"  ✅ 修复成功，应用了 {len(fixes_applied)} 个修复")
            for fix in fixes_applied:
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
    print("🔧 开始保守的语法错误修复...")
    print("策略：一次只修复一种类型的错误")
    
    # 重点修复的文件（按错误数量排序）
    files_to_fix = [
        'packages/frontend-main/src/test/api.test.ts',  # 8个错误
        'packages/frontend-main/src/components/admin/__tests__/QuantSignalDashboard.test.ts',  # 8个错误
        'packages/frontend-main/src/components/admin/__tests__/FinancialSnapshot.test.ts',  # 8个错误
        'packages/frontend-main/src/test/integration/arbitration-flow.test.ts',  # 4个错误
        'packages/frontend-main/src/components/admin/__tests__/RawTextExplorer.test.ts',  # 2个错误
        'packages/frontend-main/src/components/admin/__tests__/PersonalPrecedentViewer.test.ts',  # 2个错误
        'packages/frontend-main/src/components/admin/__tests__/FlowAndChipsViewer.test.ts',  # 2个错误
        'packages/frontend-main/src/components/admin/__tests__/DataPanelContainer.test.ts',  # 1个错误
        'packages/frontend-main/src/components/admin/__tests__/ArbitrationToolbar.test.ts',  # 1个错误
        'packages/frontend-main/src/components/admin/__tests__/ArbitrationDecisionDialog.test.ts',  # 1个错误
        'packages/frontend-main/src/components/admin/__tests__/ArbitrationDashboard.integration.test.ts',  # 1个错误
        'packages/frontend-main/src/components/admin/__tests__/ArbitrationCaseList.test.ts',  # 1个错误
        'packages/frontend-main/src/components/admin/__tests__/ChartComponents.unit.test.ts',  # 5个错误
    ]
    
    # 阶段1：修复缺少逗号
    print("\n=== 阶段1：修复缺少逗号 ===")
    fixed_count = 0
    for file_path in files_to_fix:
        if os.path.exists(file_path):
            if fix_missing_commas(file_path):
                fixed_count += 1
        else:
            print(f"  ⚠️  文件不存在: {file_path}")
    
    print(f"阶段1完成：修复了 {fixed_count} 个文件")
    
    # 验证阶段1的效果
    print("\n=== 验证阶段1效果 ===")
    os.system("cd /Users/pengcheng/Documents/papa && npx tsc --noEmit -p packages/frontend-main/tsconfig.json 2>&1 | grep 'error TS' | wc -l")
    
    # 阶段2：修复括号匹配
    print("\n=== 阶段2：修复括号匹配 ===")
    fixed_count = 0
    for file_path in files_to_fix:
        if os.path.exists(file_path):
            if fix_bracket_matching(file_path):
                fixed_count += 1
        else:
            print(f"  ⚠️  文件不存在: {file_path}")
    
    print(f"阶段2完成：修复了 {fixed_count} 个文件")
    
    # 验证阶段2的效果
    print("\n=== 验证阶段2效果 ===")
    os.system("cd /Users/pengcheng/Documents/papa && npx tsc --noEmit -p packages/frontend-main/tsconfig.json 2>&1 | grep 'error TS' | wc -l")
    
    # 阶段3：修复导入语法
    print("\n=== 阶段3：修复导入语法 ===")
    fixed_count = 0
    for file_path in files_to_fix:
        if os.path.exists(file_path):
            if fix_import_syntax(file_path):
                fixed_count += 1
        else:
            print(f"  ⚠️  文件不存在: {file_path}")
    
    print(f"阶段3完成：修复了 {fixed_count} 个文件")
    
    # 最终验证
    print("\n=== 最终验证 ===")
    os.system("cd /Users/pengcheng/Documents/papa && npx tsc --noEmit -p packages/frontend-main/tsconfig.json 2>&1 | grep 'error TS' | wc -l")
    
    print(f"\n🎉 保守语法错误修复完成！")

if __name__ == "__main__":
    main()

