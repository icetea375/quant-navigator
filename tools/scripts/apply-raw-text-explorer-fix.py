#!/usr/bin/env python3
"""
将RawTextExplorer的解决方法复制到其他有同样问题的文件
"""

import re
import os
from pathlib import Path

def fix_duplicate_global_and_add_data_setup(file_path):
    """修复重复global配置并添加数据设置"""
    
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
          {props_content}
        }}"""
        
        return new_config
    
    # 替换所有匹配的模式
    new_content = re.sub(pattern, replace_global, content, flags=re.DOTALL)
    
    # 2. 添加数据设置到每个测试用例
    # 查找所有it('...', () => { ... })模式，并在expect之前添加数据设置
    it_pattern = r"(it\('[^']+',\s*\(\)\s*=>\s*\{[^}]*mount\([^}]*\}\)[^}]*expect\()"
    
    def add_data_setup(match):
        return match.group(1) + "\n      // 设置组件数据以确保内容正确渲染\n      wrapper.vm.data = mockData || []\n      wrapper.vm.loading = false\n      \n      expect("
    
    new_content = re.sub(it_pattern, add_data_setup, new_content, flags=re.DOTALL)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"修复完成: {file_path}")

def main():
    print("=== 应用RawTextExplorer解决方法到其他文件 ===\n")
    
    # 需要修复的文件列表
    files_to_fix = [
        "tools/tests/unit/frontend/components/FlowAndChipsViewer.test.ts",
        "tools/tests/unit/frontend/components/QuantSignalDashboard.test.ts", 
        "tools/tests/unit/frontend/components/FinancialSnapshot.test.ts",
        "tools/tests/unit/frontend/components/DataPanelContainer.test.ts",
        "tools/tests/unit/frontend/components/PersonalPrecedentViewer.test.ts"
    ]
    
    for file_path in files_to_fix:
        full_path = f"/Users/pengcheng/Documents/papa/{file_path}"
        if os.path.exists(full_path):
            try:
                fix_duplicate_global_and_add_data_setup(full_path)
            except Exception as e:
                print(f"修复失败 {file_path}: {e}")
        else:
            print(f"文件不存在: {file_path}")
    
    print("\n=== 批量修复完成！ ===")
    print("已应用RawTextExplorer的解决方法到以下文件：")
    for file_path in files_to_fix:
        print(f"- {file_path}")

if __name__ == "__main__":
    main()



