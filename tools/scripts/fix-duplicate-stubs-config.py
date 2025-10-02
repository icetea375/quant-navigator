#!/usr/bin/env python3
"""
修复重复stubs配置工具
删除Vue测试中重复的stubs配置，特别是el-empty组件配置
"""

import os
import re

def fix_duplicate_stubs(file_path):
    """修复重复的stubs配置"""
    print(f"正在修复: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        fixes_applied = []
        
        # 修复重复的el-empty配置
        if "'el-empty':" in content and content.count("'el-empty':") > 1:
            # 找到第一个el-empty配置
            first_el_empty = re.search(r"'el-empty':\s*\{[^}]*\}", content)
            if first_el_empty:
                # 删除所有重复的el-empty配置
                content = re.sub(r"'el-empty':\s*\{[^}]*\},\s*", "", content, flags=re.MULTILINE)
                # 重新添加一个el-empty配置
                content = re.sub(
                    r"(stubs:\s*\{)",
                    r"\1\n          'el-empty': { \n            template: '<div class=\"el-empty\">暂无数据</div>',\n            props: ['description']\n          }",
                    content
                )
                fixes_applied.append("修复重复的el-empty配置")
        
        # 修复多余的逗号
        content = re.sub(r",\s*\)\s*\)", "})", content)
        content = re.sub(r",\s*\}\s*\)", "})", content)
        content = re.sub(r",\s*\}\s*\)\s*\)", "})", content)
        
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
    print("🔧 开始修复重复stubs配置...")
    
    files_to_fix = [
        'packages/frontend-main/src/components/admin/__tests__/FinancialSnapshot.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/QuantSignalDashboard.test.ts',
    ]
    
    fixed_count = 0
    for file_path in files_to_fix:
        if os.path.exists(file_path):
            if fix_duplicate_stubs(file_path):
                fixed_count += 1
        else:
            print(f"  ⚠️  文件不存在: {file_path}")
    
    print(f"\n🎉 重复stubs修复完成！")
    print(f"   - 处理文件: {len(files_to_fix)} 个")
    print(f"   - 修复文件: {fixed_count} 个")

if __name__ == "__main__":
    main()

