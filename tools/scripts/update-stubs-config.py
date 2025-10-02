#!/usr/bin/env python3
"""
统一更新所有测试文件的stubs配置
"""

import os
import re
import glob

def update_stubs_imports(file_path):
    """更新stubs导入"""
    print(f"正在更新导入: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        fixes_applied = []
        
        # 1. 添加defaultStubs导入
        if 'defaultStubs' in content and 'import.*defaultStubs' not in content:
            # 查找现有的导入语句
            import_pattern = r"(import\s*{\s*createTestWrapper[^}]*})"
            if re.search(import_pattern, content):
                content = re.sub(
                    import_pattern,
                    r"\1\nimport { defaultStubs } from '@/utils/test-stubs'",
                    content
                )
                fixes_applied.append("添加defaultStubs导入")
            else:
                # 如果没有找到createTestWrapper导入，在文件开头添加
                content = re.sub(
                    r"(import.*from.*test-utils.*\n)",
                    r"\1import { defaultStubs } from '@/utils/test-stubs'\n",
                    content
                )
                fixes_applied.append("添加defaultStubs导入")
        
        # 2. 修复stubs配置语法
        # 修复 stubs: defaultStubs, 的语法错误
        stubs_pattern1 = r"stubs:\s*defaultStubs,\s*'el-empty':\s*\{[^}]*\}\s*\},\)"
        if re.search(stubs_pattern1, content):
            content = re.sub(
                stubs_pattern1,
                """stubs: {
          ...defaultStubs,
          'el-empty': { 
            template: '<div class="el-empty">暂无数据</div>',
            props: ['description']
          }
        })""",
                content,
                flags=re.DOTALL
            )
            fixes_applied.append("修复stubs配置语法")
        
        # 3. 修复其他stubs配置问题
        stubs_pattern2 = r"stubs:\s*defaultStubs,\s*'v-chart':\s*\{[^}]*\}\s*\},\)"
        if re.search(stubs_pattern2, content):
            content = re.sub(
                stubs_pattern2,
                """stubs: {
          ...defaultStubs,
          'v-chart': { template: '<div class="v-chart-mock"></div>' }
        })""",
                content,
                flags=re.DOTALL
            )
            fixes_applied.append("修复v-chart stubs配置")
        
        # 4. 修复缺少逗号的语法错误
        # 修复 })\n  ) 的问题
        comma_pattern = r"\)\s*\n\s*\)\s*$"
        if re.search(comma_pattern, content, re.MULTILINE):
            content = re.sub(comma_pattern, "})\n      })", content, flags=re.MULTILINE)
            fixes_applied.append("修复缺少逗号")
        
        # 5. 修复stubs配置中的重复问题
        # 删除重复的el-empty配置
        if "'el-empty':" in content and content.count("'el-empty':") > 1:
            # 保留第一个el-empty配置，删除重复的
            lines = content.split('\n')
            new_lines = []
            el_empty_count = 0
            for line in lines:
                if "'el-empty':" in line:
                    el_empty_count += 1
                    if el_empty_count == 1:
                        new_lines.append(line)
                elif el_empty_count > 1 and ('template:' in line or 'props:' in line or '}' in line):
                    # 跳过重复配置的内容
                    continue
                else:
                    new_lines.append(line)
            content = '\n'.join(new_lines)
            fixes_applied.append("删除重复的el-empty配置")
        
        # 6. 统一stubs配置格式
        # 将所有的stubs配置统一为使用defaultStubs
        if 'stubs: {' in content and '...defaultStubs' not in content:
            # 查找stubs配置并替换
            stubs_config_pattern = r"stubs:\s*\{([^}]*)\}"
            if re.search(stubs_config_pattern, content):
                content = re.sub(
                    stubs_config_pattern,
                    r"stubs: {\n          ...defaultStubs,\n\1",
                    content
                )
                fixes_applied.append("统一stubs配置格式")
        
        # 如果文件被修改了，写回文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"  ✅ 更新成功，应用了 {len(fixes_applied)} 个修复")
            for fix in fixes_applied:
                print(f"    - {fix}")
            return True
        else:
            print(f"  ℹ️  文件无需更新")
            return False
            
    except Exception as e:
        print(f"  ❌ 更新失败: {e}")
        return False

def main():
    """主函数"""
    print("🔧 开始统一更新stubs配置...")
    
    # 查找所有测试文件
    test_patterns = [
        'packages/frontend-main/src/**/*.test.ts',
        'packages/frontend-main/src/**/__tests__/*.test.ts',
        'tools/tests/unit/frontend/**/*.test.ts',
        'tools/tests/integration/frontend/**/*.test.ts'
    ]
    
    files_to_update = []
    for pattern in test_patterns:
        files_to_update.extend(glob.glob(pattern, recursive=True))
    
    # 去重并排序
    files_to_update = sorted(list(set(files_to_update)))
    
    print(f"找到 {len(files_to_update)} 个测试文件\n")
    
    updated_count = 0
    for file_path in files_to_update:
        if os.path.exists(file_path):
            if update_stubs_imports(file_path):
                updated_count += 1
        else:
            print(f"  ⚠️  文件不存在: {file_path}")
    
    print(f"\n🎉 stubs配置统一更新完成！")
    print(f"   - 处理文件: {len(files_to_update)} 个")
    print(f"   - 更新文件: {updated_count} 个")
    print(f"   - 无需更新: {len(files_to_update) - updated_count} 个")
    
    if updated_count > 0:
        print(f"\n建议下一步:")
        print(f"1. 运行 'npx tsc --noEmit' 检查类型错误")
        print(f"2. 运行 'npm test' 验证测试")
        print(f"3. 检查是否有遗漏的文件需要手动修复")

if __name__ == "__main__":
    main()

