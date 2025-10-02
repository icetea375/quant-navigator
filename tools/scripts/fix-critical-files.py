#!/usr/bin/env python3
"""
修复关键文件的语法问题
直接重写有问题的stubs配置
"""

import os
import re

def fix_financial_snapshot():
    """修复FinancialSnapshot.test.ts"""
    file_path = 'packages/frontend-main/src/components/admin/__tests__/FinancialSnapshot.test.ts'
    print(f"正在修复: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 修复第一个stubs配置
        content = re.sub(
            r"stubs:\s*\{\s*'el-empty':\s*\{[^}]*\}\s*\.\.\.mockElementPlusComponents\(\)[^}]*\}\s*,\s*\)",
            """stubs: {
          'el-empty': { 
            template: '<div class="el-empty">暂无数据</div>',
            props: ['description']
          },
          'v-chart': { template: '<div class="v-chart-mock"></div>' },
          ...mockElementPlusComponents()
        })""",
            content,
            flags=re.DOTALL
        )
        
        # 修复第二个stubs配置
        content = re.sub(
            r"stubs:\s*\{\s*'el-empty':\s*\{[^}]*\}\s*\.\.\.mockElementPlusComponents\(\)[^}]*\}\s*,\s*\)",
            """stubs: {
          'el-empty': { 
            template: '<div class="el-empty">暂无数据</div>',
            props: ['description']
          },
          'v-chart': { template: '<div class="v-chart-mock"></div>' },
          ...mockElementPlusComponents()
        })""",
            content,
            flags=re.DOTALL
        )
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("  ✅ FinancialSnapshot.test.ts 修复成功")
        return True
        
    except Exception as e:
        print(f"  ❌ 修复失败: {e}")
        return False

def fix_quant_signal_dashboard():
    """修复QuantSignalDashboard.test.ts"""
    file_path = 'packages/frontend-main/src/components/admin/__tests__/QuantSignalDashboard.test.ts'
    print(f"正在修复: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 修复stubs配置
        content = re.sub(
            r"stubs:\s*\{\s*'el-empty':\s*\{[^}]*\}\s*\.\.\.mockElementPlusComponents\(\)[^}]*\}\s*,\s*\)",
            """stubs: {
          'el-empty': { 
            template: '<div class="el-empty">暂无数据</div>',
            props: ['description']
          },
          'v-chart': { template: '<div class="v-chart-mock"></div>' },
          ...mockElementPlusComponents()
        })""",
            content,
            flags=re.DOTALL
        )
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("  ✅ QuantSignalDashboard.test.ts 修复成功")
        return True
        
    except Exception as e:
        print(f"  ❌ 修复失败: {e}")
        return False

def fix_flow_chips_viewer():
    """修复FlowAndChipsViewer.test.ts"""
    file_path = 'packages/frontend-main/src/components/admin/__tests__/FlowAndChipsViewer.test.ts'
    print(f"正在修复: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 修复stubs配置
        content = re.sub(
            r"stubs:\s*\{\s*\.\.\.mockElementPlusComponents\(\)[^}]*\}\s*,\s*\)",
            """stubs: {
          'v-chart': { template: '<div class="v-chart-mock"></div>' },
          ...mockElementPlusComponents()
        })""",
            content,
            flags=re.DOTALL
        )
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("  ✅ FlowAndChipsViewer.test.ts 修复成功")
        return True
        
    except Exception as e:
        print(f"  ❌ 修复失败: {e}")
        return False

def main():
    """主函数"""
    print("🔧 开始修复关键文件...")
    
    fixed_count = 0
    if fix_financial_snapshot():
        fixed_count += 1
    if fix_quant_signal_dashboard():
        fixed_count += 1
    if fix_flow_chips_viewer():
        fixed_count += 1
    
    print(f"\n🎉 关键文件修复完成！")
    print(f"   - 修复文件: {fixed_count} 个")

if __name__ == "__main__":
    main()

