#!/usr/bin/env python3
"""
批量应用ArbitrationDashboard的解决方法到其他可直接修复的文件
"""

import re
import os
from pathlib import Path

def fix_personal_precedent_viewer():
    """修复PersonalPrecedentViewer.test.ts"""
    file_path = "/Users/pengcheng/Documents/papa/tools/tests/unit/frontend/components/PersonalPrecedentViewer.test.ts"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. 修复重复的global配置
    # 匹配模式：global: { ... }, props: { ... }, global: { ... }
    pattern = r'global:\s*\{\s*plugins:\s*\[pinia\]\s*\},\s*props:\s*\{[^}]*\},\s*global:\s*\{[^}]*\}'
    
    def replace_global(match):
        # 提取props内容
        props_match = re.search(r'props:\s*\{([^}]*)\}', match.group())
        props_content = props_match.group(1) if props_match else ''
        
        # 提取第二个global中的components
        components_match = re.search(r'global:\s*\{\s*components:\s*\{([^}]*)\}\s*\}', match.group())
        components_content = components_match.group(1) if components_match else ''
        
        # 构建新的配置
        new_config = f"""global: {{
          plugins: [pinia],
          components: {{
            {components_content}
          }}
        }},
        props: {{
          {props_content},
          userId: 'test-user',
          userRole: 'admin',
          precedentType: 'arbitration'
        }}"""
        
        return new_config
    
    # 替换所有匹配的模式
    new_content = re.sub(pattern, replace_global, content, flags=re.DOTALL)
    
    # 2. 添加数据设置到每个测试用例
    # 查找所有it('...', () => { ... })模式
    it_pattern = r"(it\('[^']+',\s*\(\)\s*=>\s*\{[^}]*mount\(PersonalPrecedentViewer[^}]*\}\)[^}]*expect\()"
    
    def add_data_setup(match):
        return match.group(1) + "\n      // 设置组件数据以确保内容正确渲染\n      wrapper.vm.precedents = [\n        { id: 1, title: '先例1', content: '内容1', type: 'arbitration' },\n        { id: 2, title: '先例2', content: '内容2', type: 'mediation' }\n      ]\n      wrapper.vm.loading = false\n      wrapper.vm.selectedPrecedent = wrapper.vm.precedents[0]\n      \n      expect("
    
    new_content = re.sub(it_pattern, add_data_setup, new_content, flags=re.DOTALL)
    
    # 3. 修复CSS选择器
    new_content = new_content.replace('.precedent-viewer', '.personal-precedent-viewer')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("PersonalPrecedentViewer.test.ts 修复完成！")

def fix_quant_signal_dashboard():
    """修复QuantSignalDashboard.test.ts"""
    file_path = "/Users/pengcheng/Documents/papa/tools/tests/unit/frontend/components/QuantSignalDashboard.test.ts"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. 修复重复的global配置
    pattern = r'global:\s*\{\s*plugins:\s*\[pinia\]\s*\},\s*props:\s*\{[^}]*\},\s*global:\s*\{[^}]*\}'
    
    def replace_global(match):
        props_match = re.search(r'props:\s*\{([^}]*)\}', match.group())
        props_content = props_match.group(1) if props_match else ''
        
        components_match = re.search(r'global:\s*\{\s*components:\s*\{([^}]*)\}\s*\}', match.group())
        components_content = components_match.group(1) if components_match else ''
        
        new_config = f"""global: {{
          plugins: [pinia],
          components: {{
            {components_content}
          }}
        }},
        props: {{
          {props_content},
          loading: false,
          error: null
        }}"""
        
        return new_config
    
    new_content = re.sub(pattern, replace_global, content, flags=re.DOTALL)
    
    # 2. 添加状态设置到每个测试用例
    it_pattern = r"(it\('[^']+',\s*\(\)\s*=>\s*\{[^}]*mount\(QuantSignalDashboard[^}]*\}\)[^}]*expect\()"
    
    def add_state_setup(match):
        return match.group(1) + "\n      // 确保loading状态为false，这样组件才会正确渲染\n      wrapper.vm.loading = false\n      wrapper.vm.error = null\n      \n      expect("
    
    new_content = re.sub(it_pattern, add_state_setup, new_content, flags=re.DOTALL)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("QuantSignalDashboard.test.ts 修复完成！")

def fix_financial_snapshot():
    """修复FinancialSnapshot.test.ts"""
    file_path = "/Users/pengcheng/Documents/papa/tools/tests/unit/frontend/components/FinancialSnapshot.test.ts"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. 修复重复的global配置
    pattern = r'global:\s*\{\s*plugins:\s*\[pinia\]\s*\},\s*props:\s*\{[^}]*\},\s*global:\s*\{[^}]*\}'
    
    def replace_global(match):
        props_match = re.search(r'props:\s*\{([^}]*)\}', match.group())
        props_content = props_match.group(1) if props_match else ''
        
        components_match = re.search(r'global:\s*\{\s*components:\s*\{([^}]*)\}\s*\}', match.group())
        components_content = components_match.group(1) if components_match else ''
        
        new_config = f"""global: {{
          plugins: [pinia],
          components: {{
            {components_content}
          }}
        }},
        props: {{
          {props_content},
          loading: false,
          error: null
        }}"""
        
        return new_config
    
    new_content = re.sub(pattern, replace_global, content, flags=re.DOTALL)
    
    # 2. 添加状态设置到每个测试用例
    it_pattern = r"(it\('[^']+',\s*\(\)\s*=>\s*\{[^}]*mount\(FinancialSnapshot[^}]*\}\)[^}]*expect\()"
    
    def add_state_setup(match):
        return match.group(1) + "\n      // 确保loading状态为false，这样组件才会正确渲染\n      wrapper.vm.loading = false\n      wrapper.vm.error = null\n      \n      expect("
    
    new_content = re.sub(it_pattern, add_state_setup, new_content, flags=re.DOTALL)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("FinancialSnapshot.test.ts 修复完成！")

def main():
    print("=== 批量应用ArbitrationDashboard解决方法 ===\n")
    
    try:
        print("1. 修复PersonalPrecedentViewer.test.ts...")
        fix_personal_precedent_viewer()
        
        print("2. 修复QuantSignalDashboard.test.ts...")
        fix_quant_signal_dashboard()
        
        print("3. 修复FinancialSnapshot.test.ts...")
        fix_financial_snapshot()
        
        print("\n=== 批量修复完成！ ===")
        print("已修复的文件：")
        print("- PersonalPrecedentViewer.test.ts")
        print("- QuantSignalDashboard.test.ts") 
        print("- FinancialSnapshot.test.ts")
        print("\n建议运行测试验证修复效果。")
        
    except Exception as e:
        print(f"修复过程中出现错误: {e}")

if __name__ == "__main__":
    main()



