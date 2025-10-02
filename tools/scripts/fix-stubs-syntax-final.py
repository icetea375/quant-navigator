#!/usr/bin/env python3
"""
最终修复stubs语法问题
"""

import os
import re

def fix_stubs_syntax(file_path):
    """修复stubs语法问题"""
    print(f"正在修复: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        fixes_applied = []
        
        # 修复模式1: stubs: defaultStubs, 后面跟对象的问题
        pattern1 = r"stubs:\s*defaultStubs,\s*'el-empty':\s*\{[^}]*\}\s*\},\)"
        if re.search(pattern1, content):
            content = re.sub(
                pattern1,
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
            fixes_applied.append("修复stubs配置语法")
        
        # 修复模式2: 类似的stubs配置问题
        pattern2 = r"stubs:\s*defaultStubs,\s*'v-chart':\s*\{[^}]*\}\s*\},\)"
        if re.search(pattern2, content):
            content = re.sub(
                pattern2,
                """stubs: {
          ...defaultStubs,
          'v-chart': { template: '<div class="v-chart-mock"></div>' }
        })""",
                content,
                flags=re.DOTALL
            )
            fixes_applied.append("修复v-chart stubs配置")
        
        # 修复模式3: 修复其他stubs配置问题
        pattern3 = r"stubs:\s*\{[^}]*\}\s*,\s*\)"
        if re.search(pattern3, content):
            content = re.sub(pattern3, "stubs: {\n          ...mockElementPlusComponents()\n        })", content)
            fixes_applied.append("修复通用stubs配置")
        
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
    print("🔧 最终修复stubs语法问题...")
    
    files_to_fix = [
        'packages/frontend-main/src/components/admin/__tests__/FinancialSnapshot.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/QuantSignalDashboard.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/FlowAndChipsViewer.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/ArbitrationDashboard.integration.test.ts',
        'packages/frontend-main/src/test/integration/arbitration-flow.test.ts',
    ]
    
    fixed_count = 0
    for file_path in files_to_fix:
        if os.path.exists(file_path):
            if fix_stubs_syntax(file_path):
                fixed_count += 1
        else:
            print(f"  ⚠️  文件不存在: {file_path}")
    
    print(f"\n🎉 stubs语法修复完成！")
    print(f"   - 处理文件: {len(files_to_fix)} 个")
    print(f"   - 修复文件: {fixed_count} 个")

if __name__ == "__main__":
    main()

