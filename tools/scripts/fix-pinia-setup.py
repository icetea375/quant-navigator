#!/usr/bin/env python3
"""
修复缺失Pinia插件的测试文件
第二战役：完善Element Plus组件Mock"骨骼系统"
"""

import os
import re
import glob
from pathlib import Path

def fix_missing_pinia_in_file(file_path):
    """修复单个测试文件中缺失的Pinia插件"""
    print(f"正在修复Pinia插件: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 1. 检查是否已经有Pinia导入
    has_pinia_import = 'createPinia' in content and 'setActivePinia' in content
    
    # 2. 检查是否已经有Pinia变量声明
    has_pinia_variable = 'let pinia: ReturnType<typeof createPinia>' in content
    
    # 3. 检查是否已经有beforeEach设置
    has_before_each = 'beforeEach' in content
    
    # 4. 检查mount调用是否已经有plugins配置
    has_plugins_config = 'plugins: [' in content and 'pinia' in content
    
    # 如果已经有完整的Pinia配置，跳过
    if has_pinia_import and has_pinia_variable and has_before_each and has_plugins_config:
        print(f"⏭️  已有完整Pinia配置: {file_path}")
        return False
    
    # 5. 添加Pinia导入
    if not has_pinia_import:
        # 在vitest导入后添加Pinia导入
        vitest_import_pattern = r"(import\s*{\s*[^}]*}\s*from\s*['\"]vitest['\"])"
        if re.search(vitest_import_pattern, content):
            content = re.sub(
                vitest_import_pattern,
                r"\1\nimport { createPinia, setActivePinia } from 'pinia'",
                content
            )
        else:
            # 如果没有找到vitest导入，在文件开头添加
            content = "import { createPinia, setActivePinia } from 'pinia'\n" + content
    
    # 6. 添加Pinia变量声明和beforeEach
    if not has_pinia_variable or not has_before_each:
        # 查找describe块
        describe_pattern = r"(describe\([^)]+\)\s*\{)"
        if re.search(describe_pattern, content):
            # 在describe块内添加Pinia设置
            content = re.sub(
                describe_pattern,
                r"\1\n  let pinia: ReturnType<typeof createPinia>\n\n  beforeEach(() => {\n    // 设置Pinia\n    pinia = createPinia()\n    setActivePinia(pinia)\n  })",
                content
            )
    
    # 7. 修复mount调用，添加plugins配置
    mount_pattern = r"(mount\([^,]+,\s*\{[^}]*\})"
    def add_pinia_to_mount(match):
        mount_call = match.group(1)
        # 检查是否已经有plugins配置
        if 'plugins:' in mount_call:
            # 如果已经有plugins，添加pinia
            if 'pinia' not in mount_call:
                mount_call = re.sub(
                    r'(plugins:\s*\[)([^\]]*)\]',
                    r'\1pinia, \2]',
                    mount_call
                )
        else:
            # 如果没有plugins配置，添加完整的global配置
            if 'global:' in mount_call:
                # 如果已经有global，添加plugins
                mount_call = re.sub(
                    r'(global:\s*\{)([^}]*)\}',
                    r'\1\n          plugins: [pinia],\2\n        }',
                    mount_call
                )
            else:
                # 如果没有global，添加完整的global配置
                mount_call = re.sub(
                    r'(\{)([^}]*)\}',
                    r'\1\n        global: {\n          plugins: [pinia]\n        },\2\n      }',
                    mount_call
                )
        return mount_call
    
    content = re.sub(mount_pattern, add_pinia_to_mount, content)
    
    # 如果内容有变化，写回文件
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ 已修复Pinia插件: {file_path}")
        return True
    else:
        print(f"⏭️  无需修复Pinia插件: {file_path}")
        return False

def main():
    """主函数"""
    print("🔧 第二战役：修复缺失Pinia插件的测试文件...")
    
    # 查找所有前端测试文件
    test_files = glob.glob("tools/tests/unit/frontend/**/*.test.ts", recursive=True)
    test_files.extend(glob.glob("tools/tests/integration/frontend/**/*.test.ts", recursive=True))
    
    fixed_count = 0
    total_count = len(test_files)
    
    for file_path in test_files:
        if fix_missing_pinia_in_file(file_path):
            fixed_count += 1
    
    print(f"\n🎉 Pinia插件修复完成！")
    print(f"总文件数: {total_count}")
    print(f"已修复: {fixed_count}")
    print(f"无需修复: {total_count - fixed_count}")

if __name__ == "__main__":
    main()



