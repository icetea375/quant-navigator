#!/usr/bin/env python3
"""
Docstring质量检查工具

检查docstring是否真正解释了"为什么"，而不是空洞的模板。

质量标准：
1. 必须解释函数的业务目的和存在理由
2. 必须解释为什么采用这种实现方式
3. 禁止空洞的模板（如"Process the data"）
4. 必须包含具体的业务背景

作者: AI Assistant
版本: v1.0
日期: 2025年1月17日
"""

import ast
import re
import sys
from pathlib import Path
from typing import List, Dict


class DocstringQualityChecker:
    """Docstring质量检查器"""

    def __init__(self):
        self.quality_issues = []
        self.empty_templates = [
            r"Process\s+the\s+data",
            r"Handle\s+the\s+request",
            r"Execute\s+the\s+function",
            r"Perform\s+the\s+operation",
            r"Process\s+the\s+input",
            r"Handle\s+the\s+input",
            r"Execute\s+the\s+logic",
            r"Perform\s+the\s+task",
            r"Process\s+the\s+request",
            r"Handle\s+the\s+data",
        ]

        self.required_keywords = [
            "为什么",
            "why",
            "原因",
            "目的",
            "业务",
            "需求",
            "问题",
            "解决",
        ]

    def check_file(self, file_path: Path) -> List[Dict]:
        """检查单个文件的docstring质量"""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            return [{"type": "error", "message": f"无法读取文件: {e}"}]

        try:
            tree = ast.parse(content)
        except SyntaxError as e:
            return [{"type": "error", "message": f"语法错误: {e}"}]

        issues = []

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                if node.name.startswith("_"):  # 跳过私有方法
                    continue

                docstring = ast.get_docstring(node)
                if docstring:
                    quality_issues = self._check_docstring_quality(
                        docstring, node.name, file_path
                    )
                    issues.extend(quality_issues)
                else:
                    issues.append(
                        {
                            "type": "missing_docstring",
                            "file": str(file_path),
                            "function": node.name,
                            "line": node.lineno,
                            "message": f"函数 {node.name} 缺少docstring",
                        }
                    )

        return issues

    def _check_docstring_quality(
        self, docstring: str, function_name: str, file_path: Path
    ) -> List[Dict]:
        """检查单个docstring的质量"""
        issues = []

        # 检查是否为空模板
        for pattern in self.empty_templates:
            if re.search(pattern, docstring, re.IGNORECASE):
                issues.append(
                    {
                        "type": "empty_template",
                        "file": str(file_path),
                        "function": function_name,
                        "message": f"docstring是空洞模板: {docstring.strip()[:50]}...",
                    }
                )

        # 检查是否包含"为什么"的解释
        has_why_explanation = any(
            keyword in docstring for keyword in self.required_keywords
        )
        if not has_why_explanation:
            issues.append(
                {
                    "type": "missing_why_explanation",
                    "file": str(file_path),
                    "function": function_name,
                    "message": "docstring缺少'为什么'的解释，需要说明函数存在的业务目的",
                }
            )

        # 检查docstring长度（太短可能不够详细）
        if len(docstring.strip()) < 50:
            issues.append(
                {
                    "type": "too_short",
                    "file": str(file_path),
                    "function": function_name,
                    "message": f"docstring太短，可能不够详细: {len(docstring.strip())}字符",
                }
            )

        # 检查是否只包含参数说明（缺少业务背景）
        if "Args:" in docstring and "Returns:" in docstring:
            # 检查是否有业务背景说明
            business_context = any(
                keyword in docstring
                for keyword in ["业务", "需求", "问题", "解决", "目的"]
            )
            if not business_context:
                issues.append(
                    {
                        "type": "missing_business_context",
                        "file": str(file_path),
                        "function": function_name,
                        "message": "docstring只有参数说明，缺少业务背景和存在目的",
                    }
                )

        return issues

    def check_directory(self, directory: Path) -> Dict:
        """检查目录中所有Python文件的docstring质量"""
        results = {
            "total_files": 0,
            "files_with_issues": 0,
            "total_issues": 0,
            "issues_by_type": {},
            "files": {},
        }

        for py_file in directory.rglob("*.py"):
            if py_file.name.startswith("__"):
                continue

            results["total_files"] += 1
            file_issues = self.check_file(py_file)

            if file_issues:
                results["files_with_issues"] += 1
                results["total_issues"] += len(file_issues)
                results["files"][str(py_file)] = file_issues

                # 统计问题类型
                for issue in file_issues:
                    issue_type = issue["type"]
                    if issue_type not in results["issues_by_type"]:
                        results["issues_by_type"][issue_type] = 0
                    results["issues_by_type"][issue_type] += 1

        return results

    def generate_report(self, results: Dict) -> str:
        """生成质量检查报告"""
        report = []
        report.append("# Docstring质量检查报告")
        report.append(f"**检查时间**: {self._get_current_time()}")
        report.append("")

        # 统计信息
        report.append("## 📊 统计信息")
        report.append(f"- 检查文件数: {results['total_files']}")
        report.append(f"- 有问题文件数: {results['files_with_issues']}")
        report.append(f"- 总问题数: {results['total_issues']}")
        report.append("")

        # 问题类型统计
        report.append("## 📈 问题类型统计")
        for issue_type, count in results["issues_by_type"].items():
            report.append(f"- **{issue_type}**: {count}个")
        report.append("")

        # 详细问题
        report.append("## 🔍 详细问题")
        for file_path, issues in results["files"].items():
            if issues:
                report.append(f"### {file_path}")
                for issue in issues:
                    report.append(f"- **{issue['type']}**: {issue['message']}")
                report.append("")

        # 质量建议
        report.append("## 💡 质量建议")
        report.append("1. **解释'为什么'**: 每个docstring都应该解释函数存在的业务目的")
        report.append("2. **避免空洞模板**: 不要使用'Process the data'这样的空洞描述")
        report.append("3. **提供业务背景**: 说明函数解决的具体业务问题")
        report.append("4. **详细说明**: docstring应该足够详细，至少50个字符")
        report.append("")

        return "\n".join(report)

    def _get_current_time(self):
        """获取当前时间"""
        from datetime import datetime

        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description="Docstring质量检查工具")
    parser.add_argument(
        "--path", default="packages/backend-python/src", help="检查路径"
    )
    parser.add_argument("--output", help="输出报告文件")

    args = parser.parse_args()

    # 创建检查器
    checker = DocstringQualityChecker()

    # 检查目录
    directory = Path(args.path)
    if not directory.exists():
        print(f"错误: 目录 {directory} 不存在")
        sys.exit(1)

    print(f"🔍 开始检查docstring质量: {directory}")
    results = checker.check_directory(directory)

    # 生成报告
    report = checker.generate_report(results)

    # 输出报告
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(report)
        print(f"📄 报告已保存到: {args.output}")
    else:
        print(report)

    # 返回退出码
    if results["total_issues"] > 0:
        print(f"\n❌ 发现 {results['total_issues']} 个质量问题")
        sys.exit(1)
    else:
        print("\n✅ 所有docstring质量检查通过")
        sys.exit(0)


if __name__ == "__main__":
    main()
