#!/usr/bin/env python3
"""
文档质量检查工具

根据《测试宪法》第八章"文档即基石"的要求，检查项目文档的质量和一致性。

功能：
1. 检查docstring覆盖率
2. 验证文档链接有效性
3. 检查文档格式一致性
4. 验证ADR文档完整性
5. 检查文档与代码的同步性

作者: AI Assistant
版本: v1.0
日期: 2025年1月17日
"""

import os
import re
import ast
import sys
from pathlib import Path
from typing import List, Dict, Tuple, Set
import argparse
import subprocess
import requests
from urllib.parse import urlparse


class DocsQualityChecker:
    """文档质量检查器"""
    
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.docs_dir = self.project_root / "docs"
        self.src_dir = self.project_root / "packages" / "backend-python" / "src"
        self.issues: List[Dict] = []
        self.stats = {
            "total_files": 0,
            "files_with_docstrings": 0,
            "total_functions": 0,
            "functions_with_docstrings": 0,
            "broken_links": 0,
            "missing_adrs": 0
        }
    
    def check_docstring_coverage(self) -> None:
        """检查Python代码的docstring覆盖率"""
        print("🔍 检查docstring覆盖率...")
        
        python_files = list(self.src_dir.rglob("*.py"))
        self.stats["total_files"] = len(python_files)
        
        for file_path in python_files:
            if self._should_skip_file(file_path):
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                tree = ast.parse(content)
                file_has_docstrings = False
                
                for node in ast.walk(tree):
                    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                        self.stats["total_functions"] += 1
                        
                        if self._is_public_api(node):
                            if self._has_docstring(node):
                                self.stats["functions_with_docstrings"] += 1
                                file_has_docstrings = True
                            else:
                                self.issues.append({
                                    "type": "missing_docstring",
                                    "file": str(file_path.relative_to(self.project_root)),
                                    "line": node.lineno,
                                    "name": node.name,
                                    "severity": "error"
                                })
                
                if file_has_docstrings:
                    self.stats["files_with_docstrings"] += 1
                    
            except Exception as e:
                self.issues.append({
                    "type": "parse_error",
                    "file": str(file_path.relative_to(self.project_root)),
                    "error": str(e),
                    "severity": "warning"
                })
    
    def check_documentation_links(self) -> None:
        """检查文档中的链接有效性"""
        print("🔗 检查文档链接有效性...")
        
        markdown_files = list(self.docs_dir.rglob("*.md"))
        
        for file_path in markdown_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 提取链接
                links = self._extract_links(content)
                
                for link in links:
                    if self._is_external_link(link):
                        if not self._check_external_link(link):
                            self.stats["broken_links"] += 1
                            self.issues.append({
                                "type": "broken_link",
                                "file": str(file_path.relative_to(self.project_root)),
                                "link": link,
                                "severity": "warning"
                            })
                    else:
                        if not self._check_internal_link(link, file_path):
                            self.issues.append({
                                "type": "broken_internal_link",
                                "file": str(file_path.relative_to(self.project_root)),
                                "link": link,
                                "severity": "error"
                            })
                            
            except Exception as e:
                self.issues.append({
                    "type": "file_read_error",
                    "file": str(file_path.relative_to(self.project_root)),
                    "error": str(e),
                    "severity": "warning"
                })
    
    def check_adr_completeness(self) -> None:
        """检查ADR文档的完整性"""
        print("📋 检查ADR文档完整性...")
        
        adr_file = self.docs_dir / "ADR.md"
        if not adr_file.exists():
            self.issues.append({
                "type": "missing_adr_file",
                "file": "docs/ADR.md",
                "severity": "error"
            })
            return
        
        try:
            with open(adr_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 检查ADR格式
            adr_pattern = r'## ADR-\d+:\s*(.+)'
            adrs = re.findall(adr_pattern, content)
            
            if len(adrs) < 3:  # 至少应该有3个ADR
                self.issues.append({
                    "type": "insufficient_adrs",
                    "file": "docs/ADR.md",
                    "count": len(adrs),
                    "severity": "warning"
                })
            
            # 检查ADR状态
            status_pattern = r'\*\*状态\*\*:\s*(.+)'
            statuses = re.findall(status_pattern, content)
            
            for i, status in enumerate(statuses):
                if status.strip() not in ["已接受", "提议中", "已拒绝", "已废弃"]:
                    self.issues.append({
                        "type": "invalid_adr_status",
                        "file": "docs/ADR.md",
                        "adr": f"ADR-{i+1}",
                        "status": status.strip(),
                        "severity": "warning"
                    })
                    
        except Exception as e:
            self.issues.append({
                "type": "adr_read_error",
                "file": "docs/ADR.md",
                "error": str(e),
                "severity": "error"
            })
    
    def check_documentation_consistency(self) -> None:
        """检查文档格式一致性"""
        print("📝 检查文档格式一致性...")
        
        markdown_files = list(self.docs_dir.rglob("*.md"))
        
        for file_path in markdown_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 检查标题格式
                self._check_heading_format(content, file_path)
                
                # 检查代码块格式
                self._check_code_block_format(content, file_path)
                
                # 检查链接格式
                self._check_link_format(content, file_path)
                
            except Exception as e:
                self.issues.append({
                    "type": "format_check_error",
                    "file": str(file_path.relative_to(self.project_root)),
                    "error": str(e),
                    "severity": "warning"
                })
    
    def _should_skip_file(self, file_path: Path) -> bool:
        """判断是否应该跳过某个文件"""
        skip_patterns = [
            "__pycache__",
            ".git",
            "test_",
            "_test.py",
            "conftest.py"
        ]
        
        return any(pattern in str(file_path) for pattern in skip_patterns)
    
    def _is_public_api(self, node) -> bool:
        """判断是否为公共API"""
        if isinstance(node, ast.ClassDef):
            return not node.name.startswith('_')
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            return not node.name.startswith('_')
        return False
    
    def _has_docstring(self, node) -> bool:
        """检查节点是否有docstring"""
        if isinstance(node, ast.ClassDef):
            return (node.body and 
                   isinstance(node.body[0], ast.Expr) and 
                   isinstance(node.body[0].value, ast.Constant) and
                   isinstance(node.body[0].value.value, str) and
                   len(node.body[0].value.value.strip()) > 0)
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            return (node.body and 
                   isinstance(node.body[0], ast.Expr) and 
                   isinstance(node.body[0].value, ast.Constant) and
                   isinstance(node.body[0].value.value, str) and
                   len(node.body[0].value.value.strip()) > 0)
        return False
    
    def _extract_links(self, content: str) -> List[str]:
        """从Markdown内容中提取链接"""
        # 提取 [text](url) 格式的链接
        link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
        links = re.findall(link_pattern, content)
        return [link[1] for link in links]
    
    def _is_external_link(self, link: str) -> bool:
        """判断是否为外部链接"""
        return link.startswith(('http://', 'https://'))
    
    def _check_external_link(self, link: str) -> bool:
        """检查外部链接是否有效"""
        try:
            response = requests.head(link, timeout=5, allow_redirects=True)
            return response.status_code < 400
        except:
            return False
    
    def _check_internal_link(self, link: str, current_file: Path) -> bool:
        """检查内部链接是否有效"""
        if link.startswith('#'):
            # 锚点链接，检查目标文件是否有对应标题
            return self._check_anchor_link(link, current_file)
        else:
            # 文件链接，检查文件是否存在
            target_file = current_file.parent / link
            return target_file.exists()
    
    def _check_anchor_link(self, anchor: str, current_file: Path) -> bool:
        """检查锚点链接"""
        try:
            with open(current_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 提取标题
            heading_pattern = r'^#+\s+(.+)$'
            headings = re.findall(heading_pattern, content, re.MULTILINE)
            
            # 将标题转换为锚点格式
            anchor_text = anchor[1:].lower().replace(' ', '-')
            for heading in headings:
                heading_anchor = heading.lower().replace(' ', '-')
                if heading_anchor == anchor_text:
                    return True
            return False
        except:
            return False
    
    def _check_heading_format(self, content: str, file_path: Path) -> None:
        """检查标题格式"""
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            if line.startswith('#'):
                # 检查标题前后是否有空行
                if i > 1 and lines[i-2].strip() != '':
                    self.issues.append({
                        "type": "heading_format",
                        "file": str(file_path.relative_to(self.project_root)),
                        "line": i,
                        "issue": "标题前缺少空行",
                        "severity": "warning"
                    })
    
    def _check_code_block_format(self, content: str, file_path: Path) -> None:
        """检查代码块格式"""
        # 检查代码块是否使用正确的语言标识符
        code_block_pattern = r'```(\w+)?'
        matches = re.finditer(code_block_pattern, content)
        
        for match in matches:
            language = match.group(1)
            if language and language not in ['python', 'bash', 'json', 'yaml', 'markdown', 'sql']:
                self.issues.append({
                    "type": "code_block_format",
                    "file": str(file_path.relative_to(self.project_root)),
                    "issue": f"未知的代码块语言标识符: {language}",
                    "severity": "warning"
                })
    
    def _check_link_format(self, content: str, file_path: Path) -> None:
        """检查链接格式"""
        # 检查是否有裸露的URL
        url_pattern = r'(?<!\]\()https?://[^\s\)]+'
        urls = re.findall(url_pattern, content)
        
        for url in urls:
            self.issues.append({
                "type": "naked_url",
                "file": str(file_path.relative_to(self.project_root)),
                "url": url,
                "severity": "info"
            })
    
    def generate_report(self) -> str:
        """生成检查报告"""
        report = []
        report.append("# 文档质量检查报告")
        report.append(f"**检查时间**: {self._get_current_time()}")
        report.append(f"**项目根目录**: {self.project_root}")
        report.append("")
        
        # 统计信息
        report.append("## 📊 统计信息")
        report.append(f"- 检查文件数: {self.stats['total_files']}")
        report.append(f"- 有docstring的文件数: {self.stats['files_with_docstrings']}")
        report.append(f"- 总函数数: {self.stats['total_functions']}")
        report.append(f"- 有docstring的函数数: {self.stats['functions_with_docstrings']}")
        report.append(f"- 损坏链接数: {self.stats['broken_links']}")
        report.append("")
        
        # 计算覆盖率
        if self.stats['total_functions'] > 0:
            docstring_coverage = (self.stats['functions_with_docstrings'] / self.stats['total_functions']) * 100
            report.append(f"## 📈 Docstring覆盖率: {docstring_coverage:.1f}%")
            report.append("")
        
        # 问题列表
        if self.issues:
            report.append("## ⚠️ 发现的问题")
            
            # 按严重程度分组
            error_issues = [issue for issue in self.issues if issue['severity'] == 'error']
            warning_issues = [issue for issue in self.issues if issue['severity'] == 'warning']
            info_issues = [issue for issue in self.issues if issue['severity'] == 'info']
            
            if error_issues:
                report.append("### 🔴 错误")
                for issue in error_issues:
                    report.append(f"- **{issue['file']}**: {issue.get('issue', issue.get('type', '未知问题'))}")
                    if 'line' in issue:
                        report.append(f"  - 行号: {issue['line']}")
                    if 'name' in issue:
                        report.append(f"  - 函数/类: {issue['name']}")
                report.append("")
            
            if warning_issues:
                report.append("### 🟡 警告")
                for issue in warning_issues:
                    report.append(f"- **{issue['file']}**: {issue.get('issue', issue.get('type', '未知问题'))}")
                    if 'line' in issue:
                        report.append(f"  - 行号: {issue['line']}")
                report.append("")
            
            if info_issues:
                report.append("### 🔵 信息")
                for issue in info_issues:
                    report.append(f"- **{issue['file']}**: {issue.get('issue', issue.get('type', '未知问题'))}")
                report.append("")
        else:
            report.append("## ✅ 未发现问题")
            report.append("所有检查都通过了！")
        
        return "\n".join(report)
    
    def _get_current_time(self) -> str:
        """获取当前时间"""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    def run_all_checks(self) -> None:
        """运行所有检查"""
        print("🚀 开始文档质量检查...")
        print("=" * 50)
        
        self.check_docstring_coverage()
        self.check_documentation_links()
        self.check_adr_completeness()
        self.check_documentation_consistency()
        
        print("=" * 50)
        print("✅ 检查完成！")
        
        # 生成报告
        report = self.generate_report()
        print("\n" + report)
        
        # 保存报告
        report_file = self.project_root / "docs" / "文档质量检查报告.md"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"\n📄 详细报告已保存到: {report_file}")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="文档质量检查工具")
    parser.add_argument("--project-root", default=".", help="项目根目录路径")
    parser.add_argument("--output", help="输出报告文件路径")
    
    args = parser.parse_args()
    
    # 创建检查器
    checker = DocsQualityChecker(args.project_root)
    
    # 运行检查
    checker.run_all_checks()
    
    # 根据问题数量设置退出码
    error_count = len([issue for issue in checker.issues if issue['severity'] == 'error'])
    if error_count > 0:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
