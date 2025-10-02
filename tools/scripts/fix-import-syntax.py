#!/usr/bin/env python3
"""
修复导入语法错误
"""

import os
import re
import glob

def fix_import_syntax(file_path):
    """修复导入语法错误"""
    print(f"正在修复导入语法: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        fixes_applied = []
        
        # 1. 修复重复的导入语句
        # 查找重复的import语句
        import_lines = []
        lines = content.split('\n')
        seen_imports = set()
        
        for line in lines:
            if line.strip().startswith('import '):
                # 检查是否是重复的导入
                if line.strip() not in seen_imports:
                    import_lines.append(line)
                    seen_imports.add(line.strip())
                else:
                    fixes_applied.append("删除重复的导入语句")
            else:
                import_lines.append(line)
        
        content = '\n'.join(import_lines)
        
        # 2. 修复错误的导入语法
        # 修复 "from '@/utils/test-stubs' from '@/utils/test-utils'" 这种错误
        wrong_import_pattern = r"import\s*{\s*createTestWrapper[^}]*}\s*from\s*'@/utils/test-stubs'\s*from\s*'@/utils/test-utils'"
        if re.search(wrong_import_pattern, content):
            content = re.sub(
                wrong_import_pattern,
                "import { createTestWrapper, mockElementPlusComponents } from '@/utils/test-utils'",
                content
            )
            fixes_applied.append("修复错误的导入语法")
        
        # 3. 修复不完整的导入语句
        # 修复 "import { createTestWrapper, mockElementPlusComponents }" 这种不完整的导入
        incomplete_import_pattern = r"import\s*{\s*createTestWrapper,\s*mockElementPlusComponents\s*}\s*$"
        if re.search(incomplete_import_pattern, content, re.MULTILINE):
            content = re.sub(
                incomplete_import_pattern,
                "import { createTestWrapper, mockElementPlusComponents } from '@/utils/test-utils'",
                content,
                flags=re.MULTILINE
            )
            fixes_applied.append("修复不完整的导入语句")
        
        # 4. 确保defaultStubs导入正确
        if 'defaultStubs' in content and "import { defaultStubs } from '@/utils/test-stubs'" not in content:
            # 查找现有的导入语句位置
            import_pattern = r"(import\s*{\s*createTestWrapper[^}]*from\s*'@/utils/test-utils'[^}]*\n)"
            if re.search(import_pattern, content):
                content = re.sub(
                    import_pattern,
                    r"\1import { defaultStubs } from '@/utils/test-stubs'\n",
                    content
                )
                fixes_applied.append("添加defaultStubs导入")
        
        # 5. 修复stubs配置语法
        # 修复 "stubs: {\n          ...defaultStubs,\n          ...defaultStubs," 这种重复
        duplicate_stubs_pattern = r"stubs:\s*\{\s*\.\.\.defaultStubs,\s*\.\.\.defaultStubs,"
        if re.search(duplicate_stubs_pattern, content):
            content = re.sub(duplicate_stubs_pattern, "stubs: {\n          ...defaultStubs,", content)
            fixes_applied.append("修复重复的defaultStubs")
        
        # 6. 修复缺少逗号的语法错误
        # 修复 "})\n  )" 这种缺少逗号的问题
        missing_comma_pattern = r"\)\s*\n\s*\)\s*$"
        if re.search(missing_comma_pattern, content, re.MULTILINE):
            content = re.sub(missing_comma_pattern, "})\n      })", content, flags=re.MULTILINE)
            fixes_applied.append("修复缺少逗号")
        
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
    print("🔧 开始修复导入语法错误...")
    
    # 查找有问题的文件
    files_to_fix = [
        'packages/frontend-main/src/components/admin/__tests__/FinancialSnapshot.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/QuantSignalDashboard.test.ts',
        'packages/frontend-main/src/components/admin/__tests__/ChartComponents.unit.test.ts',
        'packages/frontend-main/src/test/api.test.ts',
    ]
    
    fixed_count = 0
    for file_path in files_to_fix:
        if os.path.exists(file_path):
            if fix_import_syntax(file_path):
                fixed_count += 1
        else:
            print(f"  ⚠️  文件不存在: {file_path}")
    
    print(f"\n🎉 导入语法修复完成！")
    print(f"   - 处理文件: {len(files_to_fix)} 个")
    print(f"   - 修复文件: {fixed_count} 个")

if __name__ == "__main__":
    main()

