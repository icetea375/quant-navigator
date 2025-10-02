#!/usr/bin/env python3
"""
专门修复PersonalPrecedentViewer.test.ts的脚本
"""

import re

def fix_personal_precedent_viewer():
    file_path = "/Users/pengcheng/Documents/papa/tools/tests/unit/frontend/components/PersonalPrecedentViewer.test.ts"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 在每个测试用例中添加数据设置
    # 查找所有it('...', () => { ... })模式，并在expect之前添加数据设置
    it_pattern = r"(it\('[^']+',\s*\(\)\s*=>\s*\{[^}]*mount\(PersonalPrecedentViewer[^}]*\}\)[^}]*expect\()"
    
    def add_data_setup(match):
        return match.group(1) + "\n      // 设置组件数据以确保内容正确渲染\n      wrapper.vm.precedents = [\n        { id: 1, title: '先例1', content: '内容1', type: 'arbitration' },\n        { id: 2, title: '先例2', content: '内容2', type: 'mediation' }\n      ]\n      wrapper.vm.loading = false\n      wrapper.vm.selectedPrecedent = wrapper.vm.precedents[0]\n      \n      expect("
    
    new_content = re.sub(it_pattern, add_data_setup, content, flags=re.DOTALL)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("PersonalPrecedentViewer.test.ts 修复完成！")

if __name__ == "__main__":
    fix_personal_precedent_viewer()



