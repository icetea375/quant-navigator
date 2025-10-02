#!/usr/bin/env python3
"""
修复特定的语法错误模式
基于实际观察到的错误模式
"""

import os
import re

def fix_specific_patterns(file_path):
    """修复特定的语法错误模式"""
    print(f"正在修复特定模式: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        fixes_applied = []
        
        # 1. 修复 "vi.fn: ()" 这种错误
        vi_fn_pattern = r"vi\.fn:\s*\(\)"
        if re.search(vi_fn_pattern, content):
            content = re.sub(vi_fn_pattern, "vi.fn()", content)
            fixes_applied.append("修复vi.fn语法")
        
        # 2. 修复 "vi.clearAllMocks: ()" 这种错误
        clear_mocks_pattern = r"vi\.clearAllMocks:\s*\(\)"
        if re.search(clear_mocks_pattern, content):
            content = re.sub(clear_mocks_pattern, "vi.clearAllMocks()", content)
            fixes_applied.append("修复vi.clearAllMocks语法")
        
        # 3. 修复 "mockApiResponse({})}" 这种缺少右括号的问题
        missing_paren_pattern = r"mockApiResponse\(\{\}\)\}"
        if re.search(missing_paren_pattern, content):
            content = re.sub(missing_paren_pattern, "mockApiResponse({}))", content)
            fixes_applied.append("修复缺少右括号")
        
        # 4. 修复 "expect.any(Object)" 这种错误
        expect_any_pattern = r"expect\.any\(Object\)"
        if re.search(expect_any_pattern, content):
            content = re.sub(expect_any_pattern, "expect.any(Object)", content)
            fixes_applied.append("修复expect.any语法")
        
        # 5. 修复 "expect.stringContaining" 这种错误
        string_containing_pattern = r"expect\.stringContaining"
        if re.search(string_containing_pattern, content):
            content = re.sub(string_containing_pattern, "expect.stringContaining", content)
            fixes_applied.append("修复expect.stringContaining语法")
        
        # 6. 修复 "expect.objectContaining" 这种错误
        object_containing_pattern = r"expect\.objectContaining"
        if re.search(object_containing_pattern, content):
            content = re.sub(object_containing_pattern, "expect.objectContaining", content)
            fixes_applied.append("修复expect.objectContaining语法")
        
        # 7. 修复缺少逗号的问题
        missing_comma_pattern = r"\)\s*\n\s*\)\s*$"
        if re.search(missing_comma_pattern, content, re.MULTILINE):
            content = re.sub(missing_comma_pattern, "})\n      })", content, flags=re.MULTILINE)
            fixes_applied.append("修复缺少逗号")
        
        # 8. 修复stubs配置中的语法错误
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

def main():
    """主函数"""
    print("🔧 开始修复特定语法错误模式...")
    
    # 重点修复的文件
    files_to_fix = [
        'packages/frontend-main/src/test/api.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/QuantSignalDashboard.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/FinancialSnapshot.test.ts',
        'packages/frontend-main/src/test/integration/arbitration-flow.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/RawTextExplorer.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/PersonalPrecedentViewer.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/FlowAndChipsViewer.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/DataPanelContainer.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/ArbitrationToolbar.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/ArbitrationDecisionDialog.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/ArbitrationDashboard.integration.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/ArbitrationCaseList.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/ChartComponents.unit.test.ts',
    ]
    
    fixed_count = 0
    for file_path in files_to_fix:
        if os.path.exists(file_path):
            if fix_specific_patterns(file_path):
                fixed_count += 1
        else:
            print(f"  ⚠️  文件不存在: {file_path}")
    
    print(f"\n🎉 特定语法错误模式修复完成！")
    print(f"   - 处理文件: {len(files_to_fix)} 个")
    print(f"   - 修复文件: {fixed_count} 个")
    print(f"   - 无需修复: {len(files_to_fix) - fixed_count} 个")

if __name__ == "__main__":
    main()

