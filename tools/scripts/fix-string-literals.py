#!/usr/bin/env python3
"""
修复字符串字面量错误
Fix String Literal Errors

本工具专门修复前端测试文件中的字符串字面量错误：
1. 未终止的字符串字面量
2. 被错误分割的字符串
3. 变量名被错误分割
"""

import os
import re
import glob
from pathlib import Path

def fix_string_literals(file_path):
    """修复单个文件的字符串字面量错误"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 1. 修复被错误分割的字符串字面量
    # 匹配模式：'2024-01-01T0,\n  0:0,\n  0:00Z'
    string_pattern = r"'([^']*T)\s*,\s*\n\s*(\d+):(\d+),\s*\n\s*(\d+):(\d+)Z'"
    if re.search(string_pattern, content, re.MULTILINE):
        content = re.sub(string_pattern, r"'\1\2:\3:\4Z'", content, flags=re.MULTILINE)
    
    # 2. 修复被错误分割的变量名
    # 匹配模式：pus,\n h: 应该是 push:
    var_pattern = r'pus,\s*\n\s*h:'
    if re.search(var_pattern, content, re.MULTILINE):
        content = re.sub(var_pattern, 'push:', content, flags=re.MULTILINE)
    
    # 3. 修复被错误分割的变量名
    # 匹配模式：valu,\n e: 应该是 value:
    var_pattern2 = r'valu,\s*\n\s*e:'
    if re.search(var_pattern2, content, re.MULTILINE):
        content = re.sub(var_pattern2, 'value:', content, flags=re.MULTILINE)
    
    # 4. 修复被错误分割的变量名
    # 匹配模式：titl,\n e: 应该是 title:
    var_pattern3 = r'titl,\s*\n\s*e:'
    if re.search(var_pattern3, content, re.MULTILINE):
        content = re.sub(var_pattern3, 'title:', content, flags=re.MULTILINE)
    
    # 5. 修复被错误分割的变量名
    # 匹配模式：strin,\n g]: 应该是 string]:
    var_pattern4 = r'strin,\s*\n\s*g]:'
    if re.search(var_pattern4, content, re.MULTILINE):
        content = re.sub(var_pattern4, 'string]:', content, flags=re.MULTILINE)
    
    # 6. 修复被错误分割的变量名
    # 匹配模式：lo,\n is not defined 应该是 logger
    var_pattern5 = r'lo,\s*\n\s*is not defined'
    if re.search(var_pattern5, content, re.MULTILINE):
        content = re.sub(var_pattern5, 'logger is not defined', content, flags=re.MULTILINE)
    
    # 7. 修复被错误分割的变量名
    # 匹配模式：lo,\n ger 应该是 logger
    var_pattern6 = r'lo,\s*\n\s*ger'
    if re.search(var_pattern6, content, re.MULTILINE):
        content = re.sub(var_pattern6, 'logger', content, flags=re.MULTILINE)
    
    # 8. 修复被错误分割的变量名
    # 匹配模式：pus,\n h 应该是 push
    var_pattern7 = r'pus,\s*\n\s*h'
    if re.search(var_pattern7, content, re.MULTILINE):
        content = re.sub(var_pattern7, 'push', content, flags=re.MULTILINE)
    
    # 9. 修复被错误分割的变量名
    # 匹配模式：valu,\n e 应该是 value
    var_pattern8 = r'valu,\s*\n\s*e'
    if re.search(var_pattern8, content, re.MULTILINE):
        content = re.sub(var_pattern8, 'value', content, flags=re.MULTILINE)
    
    # 10. 修复被错误分割的变量名
    # 匹配模式：titl,\n e 应该是 title
    var_pattern9 = r'titl,\s*\n\s*e'
    if re.search(var_pattern9, content, re.MULTILINE):
        content = re.sub(var_pattern9, 'title', content, flags=re.MULTILINE)
    
    # 11. 修复被错误分割的变量名
    # 匹配模式：strin,\n g 应该是 string
    var_pattern10 = r'strin,\s*\n\s*g'
    if re.search(var_pattern10, content, re.MULTILINE):
        content = re.sub(var_pattern10, 'string', content, flags=re.MULTILINE)
    
    # 12. 修复被错误分割的变量名
    # 匹配模式：lo,\n is 应该是 logger
    var_pattern11 = r'lo,\s*\n\s*is'
    if re.search(var_pattern11, content, re.MULTILINE):
        content = re.sub(var_pattern11, 'logger', content, flags=re.MULTILINE)
    
    # 13. 修复被错误分割的变量名
    # 匹配模式：lo,\n ger 应该是 logger
    var_pattern12 = r'lo,\s*\n\s*ger'
    if re.search(var_pattern12, content, re.MULTILINE):
        content = re.sub(var_pattern12, 'logger', content, flags=re.MULTILINE)
    
    # 14. 修复被错误分割的变量名
    # 匹配模式：pus,\n h 应该是 push
    var_pattern13 = r'pus,\s*\n\s*h'
    if re.search(var_pattern13, content, re.MULTILINE):
        content = re.sub(var_pattern13, 'push', content, flags=re.MULTILINE)
    
    # 15. 修复被错误分割的变量名
    # 匹配模式：valu,\n e 应该是 value
    var_pattern14 = r'valu,\s*\n\s*e'
    if re.search(var_pattern14, content, re.MULTILINE):
        content = re.sub(var_pattern14, 'value', content, flags=re.MULTILINE)
    
    # 16. 修复被错误分割的变量名
    # 匹配模式：titl,\n e 应该是 title
    var_pattern15 = r'titl,\s*\n\s*e'
    if re.search(var_pattern15, content, re.MULTILINE):
        content = re.sub(var_pattern15, 'title', content, flags=re.MULTILINE)
    
    # 17. 修复被错误分割的变量名
    # 匹配模式：strin,\n g 应该是 string
    var_pattern16 = r'strin,\s*\n\s*g'
    if re.search(var_pattern16, content, re.MULTILINE):
        content = re.sub(var_pattern16, 'string', content, flags=re.MULTILINE)
    
    # 18. 修复被错误分割的变量名
    # 匹配模式：lo,\n is 应该是 logger
    var_pattern17 = r'lo,\s*\n\s*is'
    if re.search(var_pattern17, content, re.MULTILINE):
        content = re.sub(var_pattern17, 'logger', content, flags=re.MULTILINE)
    
    # 19. 修复被错误分割的变量名
    # 匹配模式：lo,\n ger 应该是 logger
    var_pattern18 = r'lo,\s*\n\s*ger'
    if re.search(var_pattern18, content, re.MULTILINE):
        content = re.sub(var_pattern18, 'logger', content, flags=re.MULTILINE)
    
    # 20. 修复被错误分割的变量名
    # 匹配模式：pus,\n h 应该是 push
    var_pattern19 = r'pus,\s*\n\s*h'
    if re.search(var_pattern19, content, re.MULTILINE):
        content = re.sub(var_pattern19, 'push', content, flags=re.MULTILINE)
    
    # 21. 修复被错误分割的变量名
    # 匹配模式：valu,\n e 应该是 value
    var_pattern20 = r'valu,\s*\n\s*e'
    if re.search(var_pattern20, content, re.MULTILINE):
        content = re.sub(var_pattern20, 'value', content, flags=re.MULTILINE)
    
    # 22. 修复被错误分割的变量名
    # 匹配模式：titl,\n e 应该是 title
    var_pattern21 = r'titl,\s*\n\s*e'
    if re.search(var_pattern21, content, re.MULTILINE):
        content = re.sub(var_pattern21, 'title', content, flags=re.MULTILINE)
    
    # 23. 修复被错误分割的变量名
    # 匹配模式：strin,\n g 应该是 string
    var_pattern22 = r'strin,\s*\n\s*g'
    if re.search(var_pattern22, content, re.MULTILINE):
        content = re.sub(var_pattern22, 'string', content, flags=re.MULTILINE)
    
    # 24. 修复被错误分割的变量名
    # 匹配模式：lo,\n is 应该是 logger
    var_pattern23 = r'lo,\s*\n\s*is'
    if re.search(var_pattern23, content, re.MULTILINE):
        content = re.sub(var_pattern23, 'logger', content, flags=re.MULTILINE)
    
    # 25. 修复被错误分割的变量名
    # 匹配模式：lo,\n ger 应该是 logger
    var_pattern24 = r'lo,\s*\n\s*ger'
    if re.search(var_pattern24, content, re.MULTILINE):
        content = re.sub(var_pattern24, 'logger', content, flags=re.MULTILINE)
    
    # 如果文件被修改了，写回文件
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    # 自动发现所有测试文件
    test_patterns = [
        'tools/tests/unit/frontend/**/*.test.ts',
        'tools/tests/integration/frontend/**/*.test.ts',
        'packages/frontend-main/src/**/*.test.ts',
        'packages/frontend-main/src/**/__tests__/*.test.ts'
    ]
    
    files_to_fix = []
    for pattern in test_patterns:
        files_to_fix.extend(glob.glob(pattern, recursive=True))
    
    # 去重并排序
    files_to_fix = sorted(list(set(files_to_fix)))
    
    print("🔧 开始修复字符串字面量错误...")
    print(f"找到 {len(files_to_fix)} 个测试文件\n")
    
    fixed_count = 0
    for file_path in files_to_fix:
        if os.path.exists(file_path):
            print(f"正在修复: {file_path}")
            if fix_string_literals(file_path):
                print(f"  ✅ 文件已修复并保存")
                fixed_count += 1
            else:
                print(f"  ℹ️  文件无需修复")
        else:
            print(f"  ❌ 文件不存在: {file_path}")
    
    print(f"\n🎉 字符串字面量错误修复完成！")
    print(f"   - 处理文件: {len(files_to_fix)} 个")
    print(f"   - 修复文件: {fixed_count} 个")
    print(f"   - 无需修复: {len(files_to_fix) - fixed_count} 个")

if __name__ == "__main__":
    main()
