#!/usr/bin/env python3
"""
修复ArbitrationCaseList.test.ts的重复global配置问题
"""

import re

def fix_duplicate_global_configs(file_path):
    """修复重复的global配置"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 修复重复的global配置模式
    # 匹配: props: { ... }, global: { ... }
    pattern = r'props:\s*\{[^}]*\}\s*,\s*global:\s*\{[^}]*\}'
    
    def fix_global_config(match):
        # 提取props和global内容
        full_match = match.group(0)
        
        # 查找props内容
        props_match = re.search(r'props:\s*\{([^}]*)\}', full_match)
        global_match = re.search(r'global:\s*\{([^}]*)\}', full_match)
        
        if props_match and global_match:
            props_content = props_match.group(1).strip()
            global_content = global_match.group(1).strip()
            
            # 确保global包含plugins: [pinia]
            if 'plugins: [pinia]' not in global_content:
                global_content = f'plugins: [pinia],\n          {global_content}'
            
            return f'''props: {{
          {props_content}
        }},
        global: {{
          {global_content}
        }}'''
        
        return full_match
    
    # 替换所有匹配的模式
    content = re.sub(pattern, fix_global_config, content, flags=re.DOTALL)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"修复完成: {file_path}")

if __name__ == "__main__":
    fix_duplicate_global_configs('tools/tests/unit/frontend/components/ArbitrationCaseList.test.ts')



