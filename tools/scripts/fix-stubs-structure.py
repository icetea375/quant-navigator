#!/usr/bin/env python3
"""
修复stubs配置结构问题
"""

import os
import re

def fix_stubs_structure(file_path):
    """修复stubs配置结构问题"""
    print(f"正在修复: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        fixes_applied = []
        
        # 修复stubs配置结构
        # 查找有问题的stubs配置模式
        stubs_pattern = r"stubs:\s*\{([^}]*)\}\s*,\s*\)"
        
        def fix_stubs_content(match):
            stubs_content = match.group(1)
            
            # 清理重复的el-empty配置
            if "'el-empty':" in stubs_content and stubs_content.count("'el-empty':") > 1:
                # 保留第一个el-empty配置
                lines = stubs_content.split('\n')
                new_lines = []
                el_empty_count = 0
                for line in lines:
                    if "'el-empty':" in line:
                        el_empty_count += 1
                        if el_empty_count == 1:
                            new_lines.append(line)
                    elif el_empty_count > 1 and ('template:' in line or 'props:' in line or '}' in line):
                        continue
                    else:
                        new_lines.append(line)
                stubs_content = '\n'.join(new_lines)
                fixes_applied.append("清理重复的el-empty配置")
            
            # 确保正确的结构
            if '...mockElementPlusComponents()' in stubs_content:
                # 重新组织stubs配置
                components = []
                
                # 提取el-empty配置
                el_empty_match = re.search(r"'el-empty':\s*\{[^}]*\}", stubs_content)
                if el_empty_match:
                    components.append(el_empty_match.group(0))
                
                # 提取v-chart配置
                v_chart_match = re.search(r"'v-chart':\s*\{[^}]*\}", stubs_content)
                if v_chart_match:
                    components.append(v_chart_match.group(0))
                
                # 重新构建stubs配置
                new_stubs = "stubs: {\n"
                for component in components:
                    new_stubs += f"          {component},\n"
                new_stubs += "          ...mockElementPlusComponents()\n        }"
                
                return new_stubs
            else:
                return f"stubs: {{{stubs_content}}}"
        
        if re.search(stubs_pattern, content):
            content = re.sub(stubs_pattern, fix_stubs_content, content)
            fixes_applied.append("修复stubs配置结构")
        
        # 修复多余的逗号
        content = re.sub(r",\s*\)\s*\)", "})", content)
        content = re.sub(r",\s*\}\s*\)", "})", content)
        
        if content != original_content:
            fixes_applied.append("修复多余逗号")
        
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
    print("🔧 开始修复stubs配置结构...")
    
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
            if fix_stubs_structure(file_path):
                fixed_count += 1
        else:
            print(f"  ⚠️  文件不存在: {file_path}")
    
    print(f"\n🎉 stubs配置结构修复完成！")
    print(f"   - 处理文件: {len(files_to_fix)} 个")
    print(f"   - 修复文件: {fixed_count} 个")

if __name__ == "__main__":
    main()

