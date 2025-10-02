#!/usr/bin/env python3
"""
修复DataPanelContainer.test.ts中的重复global配置问题
"""

import re

def fix_duplicate_global():
    file_path = "/Users/pengcheng/Documents/papa/tools/tests/unit/frontend/components/DataPanelContainer.test.ts"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 修复重复的global配置
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
          loading: false,
          error: null
        }}"""
        
        return new_config
    
    # 替换所有匹配的模式
    new_content = re.sub(pattern, replace_global, content, flags=re.DOTALL)
    
    # 添加wrapper.vm.loading = false到每个测试用例
    # 查找所有it('...', () => { ... })模式
    it_pattern = r"(it\('[^']+',\s*\(\)\s*=>\s*\{[^}]*mount\(DataPanelContainer[^}]*\}\)[^}]*expect\()"
    
    def add_loading_fix(match):
        return match.group(1) + "\n      // 确保loading状态为false，这样组件才会正确渲染\n      wrapper.vm.loading = false\n      \n      expect("
    
    new_content = re.sub(it_pattern, add_loading_fix, new_content, flags=re.DOTALL)
    
    # 修复CSS选择器
    new_content = new_content.replace('.data-panel-container', '.panels-container')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("DataPanelContainer.test.ts 修复完成！")

if __name__ == "__main__":
    fix_duplicate_global()



