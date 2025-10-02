#!/usr/bin/env python3
"""
修复Pinia测试路径脚本
解决导入路径问题

使用方法:
python tools/scripts/fix-pinia-paths.py
"""

import os
import re
import glob
from pathlib import Path

def calculate_relative_path(from_file, to_file):
    """计算两个文件之间的相对路径"""
    from_path = Path(from_file).parent
    to_path = Path(to_file)
    
    try:
        relative = os.path.relpath(to_path, from_path)
        return relative.replace('\\', '/')
    except ValueError:
        # 如果无法计算相对路径，使用绝对路径
        return str(to_path)

def fix_test_file_paths(file_path):
    """修复单个测试文件的导入路径"""
    print(f"正在修复路径: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 计算正确的相对路径
        utils_file = '/Users/pengcheng/Documents/papa/tools/tests/utils/test-pinia.ts'
        correct_path = calculate_relative_path(file_path, utils_file)
        
        # 修复导入路径
        content = re.sub(
            r'import\s*{\s*[^}]*}\s*from\s*[\'"][^\'"]*test-pinia[\'"]',
            f"import {{ createTestPinia, resetTestPinia, getTestPinia }} from '{correct_path}'",
            content
        )
        
        # 如果还有旧的路径，也修复它们
        content = re.sub(
            r'from\s*[\'"][^\'"]*\.\./utils/test-pinia[\'"]',
            f"from '{correct_path}'",
            content
        )
        
        # 只有当内容有变化时才写入文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ 已修复路径: {file_path}")
            return True
        else:
            print(f"⏭️  路径已正确: {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ 修复失败: {file_path} - {str(e)}")
        return False

def find_test_files():
    """查找所有需要修复的测试文件"""
    test_files = []
    
    # 查找所有测试文件
    patterns = [
        'tools/tests/unit/frontend/**/*.test.ts',
        'tools/tests/unit/frontend/**/*.spec.ts'
    ]
    
    for pattern in patterns:
        files = glob.glob(pattern, recursive=True)
        test_files.extend(files)
    
    return test_files

def main():
    """主函数"""
    print("🚀 开始修复Pinia测试路径...")
    
    # 查找所有测试文件
    test_files = find_test_files()
    
    if not test_files:
        print("❌ 未找到测试文件")
        return
    
    print(f"📁 找到 {len(test_files)} 个测试文件")
    
    # 统计修复结果
    fixed_count = 0
    total_count = len(test_files)
    
    # 修复每个文件
    for file_path in test_files:
        if fix_test_file_paths(file_path):
            fixed_count += 1
    
    print(f"\n📊 路径修复完成:")
    print(f"   总文件数: {total_count}")
    print(f"   已修复: {fixed_count}")
    print(f"   无需修复: {total_count - fixed_count}")
    
    if fixed_count > 0:
        print(f"\n✅ 成功修复 {fixed_count} 个测试文件的路径!")
        print("💡 建议运行测试验证修复效果:")
        print("   npm run test:frontend")
    else:
        print("\n⏭️  所有文件路径都正确")

if __name__ == "__main__":
    main()
