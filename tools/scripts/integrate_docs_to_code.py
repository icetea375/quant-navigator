#!/usr/bin/env python3
"""
文档整合到代码工具

将分类为"to_be_docstring_or_code_comment"的文档内容整合到相应的代码文件中。

功能：
1. 分析文档内容，提取关键信息
2. 找到对应的代码文件
3. 将信息整合到docstring或注释中
4. 生成整合报告

作者: AI Assistant
版本: v1.0
日期: 2025年1月17日
"""

import re
from pathlib import Path
from typing import Dict, List


class DocsToCodeIntegrator:
    """文档到代码整合器"""

    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.docs_dir = (
            self.project_root
            / "docs_migration_staging"
            / "to_be_docstring_or_code_comment"
        )
        self.src_dir = self.project_root / "packages" / "backend-python" / "src"
        self.integration_log = []

    def analyze_document(self, file_path: Path) -> Dict:
        """分析文档内容，提取关键信息"""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            return {"error": f"无法读取文件: {e}"}

        analysis = {
            "file": str(file_path),
            "title": self._extract_title(content),
            "sections": self._extract_sections(content),
            "code_references": self._extract_code_references(content),
            "database_info": self._extract_database_info(content),
            "api_info": self._extract_api_info(content),
        }

        return analysis

    def _extract_title(self, content: str) -> str:
        """提取文档标题"""
        lines = content.split("\n")
        for line in lines[:10]:  # 只检查前10行
            if line.startswith("# "):
                return line[2:].strip()
        return "未知标题"

    def _extract_sections(self, content: str) -> List[Dict]:
        """提取文档章节"""
        sections = []
        lines = content.split("\n")

        current_section = None
        for i, line in enumerate(lines):
            if line.startswith("## "):
                if current_section:
                    sections.append(current_section)
                current_section = {
                    "title": line[3:].strip(),
                    "content": [],
                    "line_start": i,
                }
            elif current_section and line.strip():
                current_section["content"].append(line)

        if current_section:
            sections.append(current_section)

        return sections

    def _extract_code_references(self, content: str) -> List[str]:
        """提取代码引用"""
        # 查找函数名、类名等代码引用
        patterns = [
            r"`(\w+)`",  # 反引号包围的代码
            r"def (\w+)",  # 函数定义
            r"class (\w+)",  # 类定义
            r"(\w+)\(",  # 函数调用
        ]

        references = []
        for pattern in patterns:
            matches = re.findall(pattern, content)
            references.extend(matches)

        return list(set(references))  # 去重

    def _extract_database_info(self, content: str) -> Dict:
        """提取数据库相关信息"""
        db_info = {"tables": [], "schemas": [], "relationships": []}

        # 查找表名
        table_pattern = r"`(\w+_table)`|表名[：:]\s*(\w+)"
        tables = re.findall(table_pattern, content)
        for table in tables:
            db_info["tables"].append(table[0] or table[1])

        # 查找字段信息
        field_pattern = r"`(\w+)`\s*[：:]\s*(\w+)"
        fields = re.findall(field_pattern, content)
        db_info["fields"] = fields

        return db_info

    def _extract_api_info(self, content: str) -> Dict:
        """提取API相关信息"""
        api_info = {"endpoints": [], "methods": [], "parameters": []}

        # 查找API端点
        endpoint_pattern = r"`(/\w+(?:/\w+)*)`"
        endpoints = re.findall(endpoint_pattern, content)
        api_info["endpoints"] = endpoints

        # 查找HTTP方法
        method_pattern = r"(GET|POST|PUT|DELETE|PATCH)"
        methods = re.findall(method_pattern, content)
        api_info["methods"] = list(set(methods))

        return api_info

    def find_target_files(self, analysis: Dict) -> List[Path]:
        """根据分析结果找到目标代码文件"""
        target_files = []

        # 根据代码引用查找文件
        for reference in analysis.get("code_references", []):
            # 在src目录中搜索包含该引用的文件
            for py_file in self.src_dir.rglob("*.py"):
                try:
                    with open(py_file, "r", encoding="utf-8") as f:
                        content = f.read()
                        if reference in content:
                            target_files.append(py_file)
                except:
                    continue

        # 根据文档类型查找相关文件
        if "数据库" in analysis.get("title", ""):
            # 查找数据库相关文件
            db_files = ["database_utils.py", "models.py", "schemas.py", "entities.py"]
            for db_file in db_files:
                for py_file in self.src_dir.rglob(db_file):
                    target_files.append(py_file)

        return list(set(target_files))  # 去重

    def generate_docstring_content(self, analysis: Dict, target_file: Path) -> str:
        """生成docstring内容"""
        docstring_parts = []

        # 添加模块级文档
        if analysis.get("title"):
            docstring_parts.append(f'"""{analysis["title"]}')
            docstring_parts.append("")

        # 添加数据库信息
        db_info = analysis.get("database_info", {})
        if db_info.get("tables"):
            docstring_parts.append("数据库表:")
            for table in db_info["tables"]:
                docstring_parts.append(f"  - {table}")
            docstring_parts.append("")

        # 添加API信息
        api_info = analysis.get("api_info", {})
        if api_info.get("endpoints"):
            docstring_parts.append("API端点:")
            for endpoint in api_info["endpoints"]:
                docstring_parts.append(f"  - {endpoint}")
            docstring_parts.append("")

        # 添加关键章节信息
        sections = analysis.get("sections", [])
        for section in sections[:3]:  # 只取前3个章节
            if section["title"] and len(section["content"]) > 0:
                docstring_parts.append(f"{section['title']}:")
                # 取章节内容的前几行
                content_lines = [
                    line.strip() for line in section["content"][:3] if line.strip()
                ]
                for line in content_lines:
                    docstring_parts.append(f"  {line}")
                docstring_parts.append("")

        docstring_parts.append('"""')

        return "\n".join(docstring_parts)

    def integrate_document(self, doc_file: Path) -> Dict:
        """整合单个文档到代码"""
        print(f"🔍 分析文档: {doc_file.name}")

        # 分析文档
        analysis = self.analyze_document(doc_file)
        if "error" in analysis:
            return {"status": "error", "message": analysis["error"]}

        # 查找目标文件
        target_files = self.find_target_files(analysis)
        if not target_files:
            return {"status": "warning", "message": "未找到对应的代码文件"}

        # 为每个目标文件生成整合内容
        integration_results = []
        for target_file in target_files:
            docstring_content = self.generate_docstring_content(analysis, target_file)

            # 这里只是生成内容，不直接修改文件
            # 实际整合需要人工审查和调整
            integration_results.append(
                {
                    "target_file": str(target_file.relative_to(self.project_root)),
                    "docstring_content": docstring_content,
                }
            )

        return {
            "status": "success",
            "analysis": analysis,
            "target_files": [
                str(f.relative_to(self.project_root)) for f in target_files
            ],
            "integration_results": integration_results,
        }

    def process_all_documents(self):
        """处理所有文档"""
        print("🚀 开始文档整合到代码...")

        doc_files = list(self.docs_dir.glob("*.md"))
        if not doc_files:
            print("❌ 没有找到需要整合的文档")
            return

        results = []
        for doc_file in doc_files:
            result = self.integrate_document(doc_file)
            results.append({"document": doc_file.name, "result": result})

            if result["status"] == "success":
                print(f"✅ {doc_file.name} -> {len(result['target_files'])} 个目标文件")
            elif result["status"] == "warning":
                print(f"⚠️  {doc_file.name} -> {result['message']}")
            else:
                print(f"❌ {doc_file.name} -> {result['message']}")

        # 生成整合报告
        self.generate_integration_report(results)

        return results

    def generate_integration_report(self, results: List[Dict]):
        """生成整合报告"""
        report = []
        report.append("# 文档整合到代码报告")
        report.append(f"**整合时间**: {self._get_current_time()}")
        report.append(f"**项目根目录**: {self.project_root}")
        report.append("")

        # 统计信息
        success_count = len([r for r in results if r["result"]["status"] == "success"])
        warning_count = len([r for r in results if r["result"]["status"] == "warning"])
        error_count = len([r for r in results if r["result"]["status"] == "error"])

        report.append("## 📊 整合统计")
        report.append(f"- 成功整合: {success_count} 个文档")
        report.append(f"- 警告: {warning_count} 个文档")
        report.append(f"- 错误: {error_count} 个文档")
        report.append("")

        # 详细结果
        report.append("## 📋 详细结果")
        for result in results:
            doc_name = result["document"]
            status = result["result"]["status"]

            report.append(f"### {doc_name}")
            report.append(f"**状态**: {status}")

            if status == "success":
                target_files = result["result"]["target_files"]
                report.append(f"**目标文件**: {len(target_files)} 个")
                for tf in target_files:
                    report.append(f"  - {tf}")
            else:
                report.append(f"**消息**: {result['result']['message']}")

            report.append("")

        # 下一步行动
        report.append("## 🎯 下一步行动")
        report.append("1. 审查生成的docstring内容")
        report.append("2. 将内容整合到对应的代码文件中")
        report.append("3. 验证整合后的代码质量")
        report.append("4. 更新相关文档")

        # 保存报告
        report_file = (
            self.project_root / "docs_migration_staging" / "文档整合到代码报告.md"
        )
        with open(report_file, "w", encoding="utf-8") as f:
            f.write("\n".join(report))

        print(f"\n📄 整合报告已保存到: {report_file}")

    def _get_current_time(self):
        """获取当前时间"""
        from datetime import datetime

        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description="文档整合到代码工具")
    parser.add_argument("--project-root", default=".", help="项目根目录路径")

    args = parser.parse_args()

    # 创建整合器
    integrator = DocsToCodeIntegrator(args.project_root)

    # 执行整合
    results = integrator.process_all_documents()

    print("\n✅ 文档整合到代码完成！")


if __name__ == "__main__":
    main()
