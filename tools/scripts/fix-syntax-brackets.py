#!/usr/bin/env python3
"""
修复语法括号问题
专门修复TypeScript测试文件中的括号匹配问题
"""

import os
import re
import glob

def fix_bracket_syntax(file_path):
    """修复单个文件的括号语法问题"""
    print(f"正在修复: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        fixes_applied = []
        
        # 修复模式1: 缺少逗号的stubs配置
        # 从: 'el-empty': { template: '...', props: ['description'] } }
        # 到: 'el-empty': { template: '...', props: ['description'] }, }
        pattern1 = r"(\s*'el-empty':\s*\{\s*template:\s*'[^']*',\s*props:\s*\[[^\]]*\]\s*\}\s*\n\s*\})"
        if re.search(pattern1, content):
            content = re.sub(pattern1, r'\1,', content)
            fixes_applied.append("修复el-empty配置缺少逗号")
        
        # 修复模式2: 修复其他类似的stubs配置问题
        # 查找stubs配置中缺少逗号的情况
        stubs_pattern = r"(stubs:\s*\{[^}]*'[^']+':\s*\{[^}]*\}\s*\n\s*\})"
        if re.search(stubs_pattern, content):
            # 在最后一个组件配置后添加逗号
            content = re.sub(
                r"(\s*'[^']+':\s*\{[^}]*\}\s*\n\s*)(\})",
                r'\1,\n        \2',
                content
            )
            fixes_applied.append("修复stubs配置缺少逗号")
        
        # 修复模式3: 修复mount配置中的括号问题
        mount_pattern = r"(mount\([^)]*global:\s*\{[^}]*\}\s*\n\s*\}\s*\)\s*\n\s*\}\s*\)\s*\n\s*\})"
        if re.search(mount_pattern, content):
            content = re.sub(
                r"(global:\s*\{[^}]*\}\s*\n\s*)\}\s*\)\s*\n\s*\}\s*\)\s*\n\s*\}",
                r'\1}\n      })\n    })',
                content
            )
            fixes_applied.append("修复mount配置括号问题")
        
        # 修复模式4: 修复describe块中的括号问题
        describe_pattern = r"(describe\([^)]*\)\s*\{[^}]*it\([^)]*\)\s*\{[^}]*\}\s*\n\s*\}\s*\)\s*\n\s*\})"
        if re.search(describe_pattern, content):
            content = re.sub(
                r"(it\([^)]*\)\s*\{[^}]*\}\s*\n\s*)\}\s*\)\s*\n\s*\}",
                r'\1})\n})',
                content
            )
            fixes_applied.append("修复describe块括号问题")
        
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
    print("🔧 开始修复语法括号问题...")
    
    # 需要修复的文件列表（基于TypeScript错误）
    files_to_fix = [
        'packages/frontend-main/src/components/admin/__tests__/ArbitrationDashboard.integration.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/FinancialSnapshot.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/FlowAndChipsViewer.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/QuantSignalDashboard.test.ts',
        'packages/frontend-main/src/test/integration/arbitration-flow.test.ts',
    ]
    
    fixed_count = 0
    for file_path in files_to_fix:
        if os.path.exists(file_path):
            if fix_bracket_syntax(file_path):
                fixed_count += 1
        else:
            print(f"  ⚠️  文件不存在: {file_path}")
    
    print(f"\n🎉 语法括号修复完成！")
    print(f"   - 处理文件: {len(files_to_fix)} 个")
    print(f"   - 修复文件: {fixed_count} 个")

if __name__ == "__main__":
    main()

