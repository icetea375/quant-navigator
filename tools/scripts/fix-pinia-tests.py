#!/usr/bin/env python3
"""
批量修复Pinia测试脚本
解决测试中Pinia实例管理混乱的问题

使用方法:
python tools/scripts/fix-pinia-tests.py
"""

import os
import re
import glob
from pathlib import Path

def fix_test_file(file_path):
    """修复单个测试文件"""
    print(f"正在修复: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 1. 移除旧的Pinia导入
        content = re.sub(r'import\s*{\s*pinia\s*}\s*from\s*[\'"]\.\.\/\.\.\/\.\.\/\.\.\/setup\/frontend\/setup[\'"]\s*\n', '', content)
        content = re.sub(r'import\s*{\s*pinia\s*}\s*from\s*[\'"]\.\.\/\.\.\/\.\.\/setup\/frontend\/setup[\'"]\s*\n', '', content)
        content = re.sub(r'import\s*{\s*pinia\s*}\s*from\s*[\'"]\.\.\/\.\.\/setup\/frontend\/setup[\'"]\s*\n', '', content)
        content = re.sub(r'import\s*{\s*pinia\s*}\s*from\s*[\'"]\.\.\/setup\/frontend\/setup[\'"]\s*\n', '', content)
        content = re.sub(r'import\s*{\s*pinia\s*}\s*from\s*[\'"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/setup\/frontend\/setup[\'"]\s*\n', '', content)
        
        # 2. 移除setActivePinia导入（如果只用于pinia）
        content = re.sub(r'import\s*{\s*setActivePinia\s*}\s*from\s*[\'"]pinia[\'"]\s*\n', '', content)
        
        # 3. 移除createPinia导入（如果只用于pinia）
        content = re.sub(r'import\s*{\s*createPinia\s*,\s*setActivePinia\s*}\s*from\s*[\'"]pinia[\'"]\s*\n', '', content)
        
        # 4. 移除pinia相关变量声明和设置
        content = re.sub(r'let\s+pinia\s*:\s*any\s*\n', '', content)
        content = re.sub(r'let\s+pinia\s*:\s*ReturnType<typeof createPinia>\s*\n', '', content)
        content = re.sub(r'const\s+pinia\s*=\s*createPinia\(\)\s*\n', '', content)
        content = re.sub(r'setActivePinia\(pinia\)\s*\n', '', content)
        content = re.sub(r'setActivePinia\(createPinia\(\)\)\s*\n', '', content)
        
        # 5. 添加新的导入
        if 'createTestPinia' not in content and 'test-pinia' not in content:
            # 计算相对路径
            file_dir = os.path.dirname(file_path)
            utils_path = os.path.join(file_dir, '..', 'utils', 'test-pinia')
            relative_path = os.path.relpath(utils_path, file_dir).replace('\\', '/')
            
            # 在第一个import后添加
            import_match = re.search(r'import.*from.*[\'"]\n', content)
            if import_match:
                insert_pos = import_match.end()
                new_import = f"import {{ createTestPinia, resetTestPinia }} from '{relative_path}'\n"
                content = content[:insert_pos] + new_import + content[insert_pos:]
            else:
                # 如果没有找到import，在文件开头添加
                content = f"import {{ createTestPinia, resetTestPinia }} from '{relative_path}'\n" + content
        
        # 6. 修复beforeEach
        if 'beforeEach' in content:
            # 查找beforeEach并添加createTestPinia()
            beforeEach_pattern = r'beforeEach\(\(\)\s*=>\s*\{'
            if re.search(beforeEach_pattern, content):
                # 如果beforeEach中已经有createTestPinia，跳过
                if 'createTestPinia()' not in content:
                    content = re.sub(
                        beforeEach_pattern,
                        'beforeEach(() => {\n  createTestPinia()',
                        content
                    )
            else:
                # 如果没有beforeEach，添加一个
                describe_pattern = r'(describe\([^)]+\)\s*\{)'
                if re.search(describe_pattern, content):
                    content = re.sub(
                        describe_pattern,
                        r'\1\n  beforeEach(() => {\n    createTestPinia()\n  })\n',
                        content
                    )
        
        # 7. 添加afterEach
        if 'afterEach' not in content:
            describe_pattern = r'(describe\([^)]+\)\s*\{)'
            if re.search(describe_pattern, content):
                content = re.sub(
                    describe_pattern,
                    r'\1\n  afterEach(() => {\n    resetTestPinia()\n  })\n',
                    content
                )
        
        # 8. 修复mount调用中的plugins配置
        # 移除旧的pinia插件配置
        content = re.sub(r'plugins:\s*\[pinia[,\s]*([^\]]*)\]', r'plugins: [getTestPinia(), \1]', content)
        content = re.sub(r'plugins:\s*\[pinia\]', 'plugins: [getTestPinia()]', content)
        
        # 9. 添加getTestPinia导入（如果需要）
        if 'getTestPinia()' in content and 'getTestPinia' not in content.split('import')[0]:
            # 更新导入语句
            content = re.sub(
                r'import\s*{\s*createTestPinia,\s*resetTestPinia\s*}\s*from\s*[\'"][^\'"]+[\'"]',
                'import { createTestPinia, resetTestPinia, getTestPinia } from \'../utils/test-pinia\'',
                content
            )
        
        # 10. 清理多余的空行
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
        
        # 只有当内容有变化时才写入文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ 已修复: {file_path}")
            return True
        else:
            print(f"⏭️  无需修复: {file_path}")
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
    print("🚀 开始批量修复Pinia测试...")
    
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
        if fix_test_file(file_path):
            fixed_count += 1
    
    print(f"\n📊 修复完成:")
    print(f"   总文件数: {total_count}")
    print(f"   已修复: {fixed_count}")
    print(f"   无需修复: {total_count - fixed_count}")
    
    if fixed_count > 0:
        print(f"\n✅ 成功修复 {fixed_count} 个测试文件!")
        print("💡 建议运行测试验证修复效果:")
        print("   npm run test:frontend")
    else:
        print("\n⏭️  所有文件都无需修复")

if __name__ == "__main__":
    main()
