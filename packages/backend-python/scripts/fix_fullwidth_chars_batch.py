#!/usr/bin/env python3
"""
批量修复Ruff代码质量问题
处理RUF001、RUF002、RUF003、B904、F821、E402等错误
"""

import re
from pathlib import Path

# 全角字符到半角字符的映射
FULLWIDTH_TO_HALFWIDTH = {
    "，": ",",
    "。": ".",
    "；": ";",
    "：": ":",
    """: '"',
    """: '"',
    "'": "'",
    "（": "(",
    "）": ")",
    "【": "[",
    "】": "]",
    "《": "<",
    "》": ">",
    "！": "!",
    "？": "?",
    "、": ",",
    "—": "-",
    "－": "-",
    "　": " ",  # 全角空格
}

def fix_fullwidth_in_strings(content: str) -> str:
    """修复字符串中的全角字符 (RUF001)"""
    # 匹配字符串字面量(单引号、双引号、三引号)
    def replace_in_string(match):
        string_content = match.group(1)
        for fullwidth, halfwidth in FULLWIDTH_TO_HALFWIDTH.items():
            string_content = string_content.replace(fullwidth, halfwidth)
        return match.group(0).replace(match.group(1), string_content)

    # 处理单引号字符串
    content = re.sub(r"'([^']*)'", replace_in_string, content)
    # 处理双引号字符串
    content = re.sub(r'"([^"]*)"', replace_in_string, content)
    # 处理三引号字符串
    content = re.sub(r'"""([^"]*(?:"[^"]*)*)"""', replace_in_string, content)
    content = re.sub(r"'''([^']*(?:'[^']*)*)'''", replace_in_string, content)

    return content

def fix_fullwidth_in_docstrings(content: str) -> str:
    """修复文档字符串中的全角字符 (RUF002)"""
    # 匹配文档字符串
    def replace_in_docstring(match):
        docstring_content = match.group(1)
        for fullwidth, halfwidth in FULLWIDTH_TO_HALFWIDTH.items():
            docstring_content = docstring_content.replace(fullwidth, halfwidth)
        return match.group(0).replace(match.group(1), docstring_content)

    # 处理三引号文档字符串
    content = re.sub(r'"""([^"]*(?:"[^"]*)*)"""', replace_in_docstring, content)
    content = re.sub(r"'''([^']*(?:'[^']*)*)'''", replace_in_docstring, content)

    return content

def fix_fullwidth_in_comments(content: str) -> str:
    """修复注释中的全角字符 (RUF003)"""
    lines = content.split("\n")
    fixed_lines = []

    for line in lines:
        # 检查是否是注释行
        if line.strip().startswith("#"):
            # 修复注释中的全角字符
            for fullwidth, halfwidth in FULLWIDTH_TO_HALFWIDTH.items():
                line = line.replace(fullwidth, halfwidth)
        fixed_lines.append(line)

    return "\n".join(fixed_lines)

def fix_imports(content: str) -> str:
    """修复导入问题 (E402, F401)"""
    lines = content.split("\n")
    imports = []
    other_lines = []
    in_imports = True

    for line in lines:
        stripped = line.strip()
        if in_imports and (stripped.startswith("import ") or stripped.startswith("from ")):
            imports.append(line)
        elif stripped == "" or stripped.startswith("#"):
            if in_imports:
                imports.append(line)
            else:
                other_lines.append(line)
        else:
            in_imports = False
            other_lines.append(line)

    # 移除未使用的导入
    used_names = set()
    for line in other_lines:
        if line.strip() and not line.strip().startswith("#"):
            # 简单的名称提取
            words = re.findall(r"\b[a-zA-Z_][a-zA-Z0-9_]*\b", line)
            used_names.update(words)

    # 过滤掉未使用的导入
    filtered_imports = []
    for line in imports:
        if line.strip().startswith("import ") or line.strip().startswith("from "):
            # 检查是否被使用
            import_name = line.split()[1].split(".")[0] if "import" in line else line.split()[1]
            if import_name in used_names or "from" in line:
                filtered_imports.append(line)
        else:
            filtered_imports.append(line)

    return "\n".join(filtered_imports + other_lines)

def fix_exception_handling(content: str) -> str:
    """修复异常处理问题 (B904)"""
    # 修复 raise ... from e 模式
    content = re.sub(
        r"raise\s+(\w+Exception\([^)]*\))\s*$",
        r"raise \1 from e",
        content,
        flags=re.MULTILINE
    )

    # 修复在except块中的raise语句
    lines = content.split("\n")
    fixed_lines = []
    in_except = False

    for _i, line in enumerate(lines):
        if "except" in line and ":" in line:
            in_except = True
        elif line.strip() and not line.startswith(" ") and not line.startswith("\t"):
            in_except = False

        if in_except and "raise" in line and "from" not in line and "Exception" in line:
            # 添加 from e 或 from None
            if "err" in line or "e" in line:
                line = line.rstrip() + " from e"
            else:
                line = line.rstrip() + " from None"

        fixed_lines.append(line)

    return "\n".join(fixed_lines)

def fix_undefined_names(content: str) -> str:
    """修复未定义名称问题 (F821)"""
    # 添加常用的缺失导入
    missing_imports = []

    if "Optional" in content and "from typing import" not in content:
        missing_imports.append("from typing import Optional")
    elif "Optional" in content and "Optional" not in content.split("from typing import")[1].split("\n")[0]:
        # 如果typing导入存在但没有Optional
        content = re.sub(
            r"from typing import ([^\\n]+)",
            lambda m: f"from typing import {m.group(1)}, Optional" if "Optional" not in m.group(1) else m.group(0),
            content
        )

    if "Dict" in content and "from typing import" not in content:
        missing_imports.append("from typing import Dict")
    elif "Dict" in content and "Dict" not in content.split("from typing import")[1].split("\n")[0]:
        content = re.sub(
            r"from typing import ([^\\n]+)",
            lambda m: f"from typing import {m.group(1)}, Dict" if "Dict" not in m.group(1) else m.group(0),
            content
        )

    if "List" in content and "from typing import" not in content:
        missing_imports.append("from typing import List")
    elif "List" in content and "List" not in content.split("from typing import")[1].split("\n")[0]:
        content = re.sub(
            r"from typing import ([^\\n]+)",
            lambda m: f"from typing import {m.group(1)}, List" if "List" not in m.group(1) else m.group(0),
            content
        )

    # 在文件开头添加缺失的导入
    if missing_imports:
        lines = content.split("\n")
        insert_index = 0
        for i, line in enumerate(lines):
            if line.strip().startswith("import ") or line.strip().startswith("from "):
                insert_index = i + 1
            elif line.strip() and not line.strip().startswith("#"):
                break

        for import_line in missing_imports:
            lines.insert(insert_index, import_line)
            insert_index += 1

        content = "\n".join(lines)

    return content

def fix_mutable_defaults(content: str) -> str:
    """修复可变默认参数问题 (RUF012)"""
    # 将可变默认参数改为None
    content = re.sub(
        r"def\s+(\w+)\([^)]*?(\w+)\s*=\s*\[\][^)]*\):",
        r"def \1(\2=None):",
        content
    )

    content = re.sub(
        r"def\s+(\w+)\([^)]*?(\w+)\s*=\s*\{\}[^)]*\):",
        r"def \1(\2=None):",
        content
    )

    return content

def fix_file(file_path: Path) -> tuple[bool, int]:
    """修复单个文件的所有Ruff问题"""
    try:
        with open(file_path, encoding="utf-8") as f:
            content = f.read()

        original_content = content
        fixes_count = 0

        # 1. 修复字符串中的全角字符 (RUF001)
        new_content = fix_fullwidth_in_strings(content)
        if new_content != content:
            fixes_count += 1
            content = new_content

        # 2. 修复文档字符串中的全角字符 (RUF002)
        new_content = fix_fullwidth_in_docstrings(content)
        if new_content != content:
            fixes_count += 1
            content = new_content

        # 3. 修复注释中的全角字符 (RUF003)
        new_content = fix_fullwidth_in_comments(content)
        if new_content != content:
            fixes_count += 1
            content = new_content

        # 4. 修复异常处理问题 (B904)
        new_content = fix_exception_handling(content)
        if new_content != content:
            fixes_count += 1
            content = new_content

        # 5. 修复未定义名称问题 (F821)
        new_content = fix_undefined_names(content)
        if new_content != content:
            fixes_count += 1
            content = new_content

        # 6. 修复导入问题 (E402, F401)
        new_content = fix_imports(content)
        if new_content != content:
            fixes_count += 1
            content = new_content

        # 7. 修复可变默认参数问题 (RUF012)
        new_content = fix_mutable_defaults(content)
        if new_content != content:
            fixes_count += 1
            content = new_content

        # 检查是否有修改
        if content != original_content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"✓ 修复文件: {file_path} (修复了 {fixes_count} 类问题)")
            return True, fixes_count
        else:
            print(f"- 无需修复: {file_path}")
            return False, 0

    except Exception as e:
        print(f"✗ 错误: {file_path} - {e}")
        return False, 0

def main():
    """主函数"""
    # 查找所有Python文件(包括src和support_modules目录)
    python_files = []

    # 添加src目录下的文件
    src_dir = Path("src")
    if src_dir.exists():
        python_files.extend(list(src_dir.rglob("*.py")))

    # 添加support_modules目录下的文件
    support_dir = Path("support_modules")
    if support_dir.exists():
        python_files.extend(list(support_dir.rglob("*.py")))

    # 添加根目录下的Python文件
    root_files = list(Path(".").glob("*.py"))
    python_files.extend(root_files)

    if not python_files:
        print("错误: 没有找到Python文件")
        return

    print(f"找到 {len(python_files)} 个Python文件")
    print("开始批量修复Ruff代码质量问题...\n")
    print("修复类型:")
    print("  - RUF001: 字符串中的全角字符")
    print("  - RUF002: 文档字符串中的全角字符")
    print("  - RUF003: 注释中的全角字符")
    print("  - B904: 异常处理不当")
    print("  - F821: 未定义的名称")
    print("  - E402: 模块导入位置问题")
    print("  - F401: 未使用的导入")
    print("  - RUF012: 可变默认参数问题")
    print()

    total_fixed = 0
    files_modified = 0

    for file_path in python_files:
        # 跳过脚本自身和虚拟环境文件
        if "scripts" in str(file_path) or "venv" in str(file_path):
            continue

        fixed, count = fix_file(file_path)
        if fixed:
            files_modified += 1
            total_fixed += count

    print("\n修复完成!")
    print(f"修改文件数: {files_modified}")
    print(f"修复问题数: {total_fixed}")
    print("建议运行 'ruff check .' 验证修复效果")

if __name__ == "__main__":
    main()
