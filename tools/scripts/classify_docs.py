#!/usr/bin/env python3
"""
文档分类工具

根据《测试宪法》第八章的要求，对现有文档进行分类和甄别。

分类标准：
1. to_be_adr: 核心架构设计决策
2. to_be_guides: 面向开发者的操作指南
3. to_be_docstring_or_code_comment: 具体代码或业务逻辑解释
4. to_be_archived: 过时、重复或微不足道的内容

作者: AI Assistant
版本: v1.0
日期: 2025年1月17日
"""

import shutil
from pathlib import Path


class DocsClassifier:
    """文档分类器"""

    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.docs_dir = self.project_root / "docs"
        self.staging_dir = self.project_root / "docs_migration_staging"
        self.classification_rules = {
            "to_be_adr": [
                "架构设计",
                "技术选型",
                "设计决策",
                "ADR",
                "架构模式",
                "为什么选择",
                "技术方案",
                "系统设计",
                "模块化",
                "微服务",
            ],
            "to_be_guides": [
                "开发流程",
                "操作指南",
                "设置指南",
                "部署指南",
                "测试指南",
                "如何",
                "步骤",
                "流程",
                "规范",
                "标准",
                "配置指南",
            ],
            "to_be_docstring_or_code_comment": [
                "算法",
                "实现",
                "代码",
                "函数",
                "类",
                "方法",
                "业务逻辑",
                "计算",
                "处理",
                "分析",
                "检测",
                "生成",
            ],
            "to_be_archived": [
                "报告",
                "完成报告",
                "状态报告",
                "更新报告",
                "整理报告",
                "legacy",
                "历史",
                "归档",
                "旧版",
                "v13.8",
                "Sprint",
            ],
        }

    def classify_document(self, file_path: Path) -> str:
        """分类单个文档"""
        filename = file_path.name.lower()
        content = ""

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()[:1000]  # 只读取前1000个字符
        except:
            pass

        # 检查文件名和内容中的关键词
        text_to_check = f"{filename} {content}".lower()

        # 按优先级检查分类规则
        for category, keywords in self.classification_rules.items():
            for keyword in keywords:
                if keyword.lower() in text_to_check:
                    return category

        # 默认分类为指南
        return "to_be_guides"

    def classify_all_documents(self):
        """分类所有文档"""
        print("🔍 开始文档分类...")

        # 确保暂存目录存在
        for category in self.classification_rules.keys():
            (self.staging_dir / category).mkdir(parents=True, exist_ok=True)

        # 分类所有文档
        classified_count = {
            category: 0 for category in self.classification_rules.keys()
        }

        for file_path in self.docs_dir.glob("*.md"):
            if file_path.name in [
                "测试宪法.md",
                "ADR.md",
                "docstring规范.md",
                "知识传承框架.md",
                "文档质量门禁配置.md",
                "配置统一指南.md",
            ]:
                # 这些是新宪法的核心文档，跳过分类
                continue

            category = self.classify_document(file_path)
            target_dir = self.staging_dir / category
            target_file = target_dir / file_path.name

            # 复制文件到对应分类目录
            shutil.copy2(file_path, target_file)
            classified_count[category] += 1

            print(f"📄 {file_path.name} -> {category}")

        # 输出分类统计
        print("\n📊 分类统计:")
        for category, count in classified_count.items():
            print(f"  {category}: {count} 个文档")

        return classified_count

    def generate_classification_report(self, classified_count: dict):
        """生成分类报告"""
        report = []
        report.append("# 文档分类报告")
        report.append(f"**分类时间**: {self._get_current_time()}")
        report.append(f"**项目根目录**: {self.project_root}")
        report.append("")

        report.append("## 📊 分类统计")
        for category, count in classified_count.items():
            report.append(f"- **{category}**: {count} 个文档")
        report.append("")

        report.append("## 📋 分类说明")
        report.append("")
        report.append("### to_be_adr - 架构设计决策")
        report.append("包含核心的架构设计决策、技术选型决策等，需要转换为ADR格式。")
        report.append("")
        report.append("### to_be_guides - 操作指南")
        report.append("包含面向开发者的操作指南、开发流程、部署指南等。")
        report.append("")
        report.append("### to_be_docstring_or_code_comment - 代码文档")
        report.append("包含具体的算法、实现细节、业务逻辑解释，需要整合到代码中。")
        report.append("")
        report.append("### to_be_archived - 归档文档")
        report.append("包含项目报告、历史文档、过时内容等，需要归档保存。")
        report.append("")

        report.append("## 🎯 下一步行动")
        report.append("1. 审查分类结果，调整不正确的分类")
        report.append("2. 处理 to_be_adr 目录中的文档，转换为ADR格式")
        report.append("3. 整理 to_be_guides 目录中的文档，创建统一的指南")
        report.append("4. 将 to_be_docstring_or_code_comment 中的内容整合到代码中")
        report.append("5. 归档 to_be_archived 目录中的文档")

        return "\n".join(report)

    def _get_current_time(self):
        """获取当前时间"""
        from datetime import datetime

        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description="文档分类工具")
    parser.add_argument("--project-root", default=".", help="项目根目录路径")

    args = parser.parse_args()

    # 创建分类器
    classifier = DocsClassifier(args.project_root)

    # 执行分类
    classified_count = classifier.classify_all_documents()

    # 生成报告
    report = classifier.generate_classification_report(classified_count)

    # 保存报告
    report_file = classifier.project_root / "docs_migration_staging" / "分类报告.md"
    with open(report_file, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"\n📄 分类报告已保存到: {report_file}")
    print("\n✅ 文档分类完成！")


if __name__ == "__main__":
    main()
