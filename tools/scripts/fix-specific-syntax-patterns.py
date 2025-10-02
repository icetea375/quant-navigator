#!/usr/bin/env python3
"""
修复特定的语法错误模式
基于CI问题修复策略，针对具体的TS1005和TS1128错误
"""

import os
import re

def fix_specific_syntax_patterns(file_path):
    """修复特定的语法错误模式"""
    print(f"正在修复特定语法模式: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        fixes_applied = []
        
        # 1. 修复TS1005: ',' expected 错误
        # 修复 "})\n  )" 这种缺少逗号的问题
        missing_comma_pattern1 = r"\)\s*\n\s*\)\s*$"
        if re.search(missing_comma_pattern1, content, re.MULTILINE):
            content = re.sub(missing_comma_pattern1, "})\n      })", content, flags=re.MULTILINE)
            fixes_applied.append("修复缺少逗号模式1")
        
        # 2. 修复TS1005: ',' expected 错误
        # 修复 "stubs: {\n          ...defaultStubs,\n        }" 这种缺少内容的问题
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
        
        # 3. 修复TS1005: ':' expected 错误
        # 修复对象属性缺少冒号的问题
        missing_colon_pattern = r"(\w+)\s*\(\s*\)\s*$"
        if re.search(missing_colon_pattern, content, re.MULTILINE):
            content = re.sub(missing_colon_pattern, r"\1: ()", content, flags=re.MULTILINE)
            fixes_applied.append("修复缺少冒号")
        
        # 4. 修复TS1005: '}' expected 错误
        # 修复缺少右括号的问题
        missing_brace_pattern = r"stubs:\s*\{\s*\.\.\.defaultStubs,\s*'el-empty':\s*\{[^}]*\}\s*$"
        if re.search(missing_brace_pattern, content, re.MULTILINE):
            content = re.sub(
                missing_brace_pattern,
                """stubs: {
          ...defaultStubs,
          'el-empty': { 
            template: '<div class="el-empty">暂无数据</div>',
            props: ['description']
          }
        }""",
                content,
                flags=re.MULTILINE
            )
            fixes_applied.append("修复缺少右括号")
        
        # 5. 修复TS1128: Declaration or statement expected 错误
        # 修复语法结构问题
        declaration_error_pattern = r"\)\s*\)\s*$"
        if re.search(declaration_error_pattern, content, re.MULTILINE):
            content = re.sub(declaration_error_pattern, "})", content, flags=re.MULTILINE)
            fixes_applied.append("修复声明错误")
        
        # 6. 修复复杂的stubs配置结构
        # 修复多行stubs配置的语法问题
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
        
        # 7. 修复特定的语法错误模式
        # 修复 "stubs: {\n          ...defaultStubs,\n        },\n      }" 这种结构
        specific_pattern = r"stubs:\s*\{\s*\.\.\.defaultStubs,\s*\},\s*\}"
        if re.search(specific_pattern, content):
            content = re.sub(
                specific_pattern,
                """stubs: {
          ...defaultStubs,
          'el-empty': { 
            template: '<div class="el-empty">暂无数据</div>',
            props: ['description']
          }
        }""",
                content
            )
            fixes_applied.append("修复特定语法模式")
        
        # 8. 修复函数调用的语法错误
        # 修复 "createTestWrapper(Component, {\n      props: {\n        data: mockData\n      },\n      global: {\n        stubs: {\n          ...defaultStubs,\n        }\n      }\n  })" 这种缺少逗号的问题
        wrapper_call_pattern = r"createTestWrapper\([^)]*\{\s*props:[^}]*\},\s*global:\s*\{\s*stubs:[^}]*\}\s*\}\s*\)"
        if re.search(wrapper_call_pattern, content, re.DOTALL):
            content = re.sub(
                wrapper_call_pattern,
                lambda m: m.group(0).replace('}\n  })', '}\n      })'),
                content,
                flags=re.DOTALL
            )
            fixes_applied.append("修复函数调用语法")
        
        # 9. 修复特定的括号问题
        # 修复 "stubs: {\n          ...defaultStubs,\n        },\n      }" 这种结构
        bracket_pattern = r"stubs:\s*\{\s*\.\.\.defaultStubs,\s*\},\s*\}"
        if re.search(bracket_pattern, content):
            content = re.sub(
                bracket_pattern,
                """stubs: {
          ...defaultStubs,
          'el-empty': { 
            template: '<div class="el-empty">暂无数据</div>',
            props: ['description']
          }
        }""",
                content
            )
            fixes_applied.append("修复括号问题")
        
        # 10. 修复特定的语法错误模式
        # 修复 "stubs: {\n          ...defaultStubs,\n        },\n      }" 这种结构
        specific_pattern2 = r"stubs:\s*\{\s*\.\.\.defaultStubs,\s*\},\s*\}"
        if re.search(specific_pattern2, content):
            content = re.sub(
                specific_pattern2,
                """stubs: {
          ...defaultStubs,
          'el-empty': { 
            template: '<div class="el-empty">暂无数据</div>',
            props: ['description']
          }
        }""",
                content
            )
            fixes_applied.append("修复特定语法模式2")
        
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
    print("基于CI问题修复策略，针对TS1005和TS1128错误")
    
    # 查找有问题的文件（基于错误统计）
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
    
    fixed_count = 0
    for file_path in files_to_fix:
        if os.path.exists(file_path):
            if fix_specific_syntax_patterns(file_path):
                fixed_count += 1
        else:
            print(f"  ⚠️  文件不存在: {file_path}")
    
    print(f"\n🎉 特定语法错误模式修复完成！")
    print(f"   - 处理文件: {len(files_to_fix)} 个")
    print(f"   - 修复文件: {fixed_count} 个")
    print(f"   - 无需修复: {len(files_to_fix) - fixed_count} 个")
    
    if fixed_count > 0:
        print(f"\n建议下一步:")
        print(f"1. 运行 'npx tsc --noEmit' 检查类型错误")
        print(f"2. 运行 'npm test' 验证测试")
        print(f"3. 检查是否有遗漏的文件需要手动修复")

if __name__ == "__main__":
    main()

