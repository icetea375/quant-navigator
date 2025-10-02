#!/usr/bin/env python3
"""
文档索引自动更新脚本
用于自动更新docs/README.md中的文档信息
"""

import os
import re
from datetime import datetime
from pathlib import Path


def get_doc_info(doc_path):
    """获取文档信息"""
    try:
        with open(doc_path, "r", encoding="utf-8") as f:
            content = f.read()

        # 提取标题
        title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        title = title_match.group(1) if title_match else Path(doc_path).stem

        # 提取版本信息
        version_match = re.search(r"v(\d+\.\d+(?:\.\d+)?)", content)
        version = version_match.group(0) if version_match else "未知版本"

        # 提取最后更新时间
        update_match = re.search(r"最后更新[：:]\s*(\d{4}-\d{2}-\d{2})", content)
        last_update = (
            update_match.group(1)
            if update_match
            else datetime.now().strftime("%Y-%m-%d")
        )

        # 获取文件修改时间
        mtime = os.path.getmtime(doc_path)
        file_time = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d")

        return {
            "title": title,
            "version": version,
            "last_update": last_update,
            "file_time": file_time,
            "size": os.path.getsize(doc_path),
        }
    except Exception as e:
        print(f"读取文档 {doc_path} 时出错: {e}")
        return None


def scan_docs_directory(docs_dir):
    """扫描文档目录"""
    docs = []

    # 核心开发文档
    core_docs = [
        "开发文档第0章-开发流程准则.md",
        "开发文档第1章-系统概述.md",
        "开发文档第2章-核心功能模块-上.md",
        "开发文档第2章-核心功能模块-下.md",
        "开发文档第3章-数据库设计.md",
        "开发文档第4章-技术架构.md",
        "开发文档第5章-部署运维.md",
        "开发文档第6章-项目目录结构说明.md",
        "开发文档第7章-API接口设计.md",
        "开发文档第8章-前端开发.md",
        "开发文档第9章-开发实施计划.md",
    ]

    # 架构设计文档
    arch_docs = ["架构设计-模块化单体.md"]

    # 项目管理文档
    project_docs = [
        "ADR.md",
        "API_CHANGELOG.md",
        "LINTING_PHILOSOPHY.md",
        "测试宪法.md",
    ]

    # 完成报告
    report_docs = []
    for file in os.listdir(docs_dir):
        if file.startswith("v") and file.endswith("_完成报告.md"):
            report_docs.append(file)

    # 扫描所有文档
    all_docs = {
        "core": core_docs,
        "arch": arch_docs,
        "project": project_docs,
        "reports": sorted(report_docs),
    }

    for category, files in all_docs.items():
        for file in files:
            doc_path = os.path.join(docs_dir, file)
            if os.path.exists(doc_path):
                info = get_doc_info(doc_path)
                if info:
                    info["category"] = category
                    info["filename"] = file
                    docs.append(info)

    return docs


def generate_index_content(docs):
    """生成索引内容"""
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    content = f"""# 量化导航仪系统 - 开发文档索引

## 📚 文档概览

欢迎来到量化导航仪系统的开发文档中心！本文档索引将帮助您快速找到所需的信息。

**当前版本**: v13.8 极简主义最终版
**最后更新**: {current_time}
**维护状态**: 活跃维护中
**文档总数**: {len(docs)} 个文档

---

## 🗂️ 核心开发文档

"""

    # 核心开发文档
    core_docs = [d for d in docs if d["category"] == "core"]
    for doc in core_docs:
        content += f"""### {doc['title']}
**文件**: [`{doc['filename']}`](./{doc['filename']})
**版本**: {doc['version']}
**最后更新**: {doc['last_update']}
**文件大小**: {doc['size']} 字节

"""

    content += """---

## 🏗️ 架构设计文档

"""

    # 架构设计文档
    arch_docs = [d for d in docs if d["category"] == "arch"]
    for doc in arch_docs:
        content += f"""### {doc['title']}
**文件**: [`{doc['filename']}`](./{doc['filename']})
**版本**: {doc['version']}
**最后更新**: {doc['last_update']}
**文件大小**: {doc['size']} 字节

"""

    content += """---

## 📋 项目管理文档

"""

    # 项目管理文档
    project_docs = [d for d in docs if d["category"] == "project"]
    for doc in project_docs:
        content += f"""### {doc['title']}
**文件**: [`{doc['filename']}`](./{doc['filename']})
**版本**: {doc['version']}
**最后更新**: {doc['last_update']}
**文件大小**: {doc['size']} 字节

"""

    content += """---

## 📊 完成报告

"""

    # 完成报告
    report_docs = [d for d in docs if d["category"] == "reports"]
    for doc in report_docs:
        content += f"""### {doc['title']}
**文件**: [`{doc['filename']}`](./{doc['filename']})
**版本**: {doc['version']}
**最后更新**: {doc['last_update']}
**文件大小**: {doc['size']} 字节

"""

    content += f"""---

## 🔄 文档维护

### 自动更新状态
- **索引更新**: 自动更新 (通过脚本)
- **文档内容**: 手动维护
- **交叉引用**: 手动维护
- **版本同步**: 手动维护

### 更新频率
- **索引文件**: 每次运行脚本时更新
- **核心文档**: 随代码变更同步更新
- **架构文档**: 重大架构变更时更新
- **完成报告**: 项目里程碑时更新

### 贡献指南
1. 修改文档时，请同时更新相关交叉引用
2. 新增文档时，请运行此脚本更新索引
3. 重大变更请记录在 ADR.md 中

---

## 📞 联系方式

如有文档问题或建议，请联系：
- **技术负责人**: AI Assistant
- **文档维护**: 开发团队
- **最后更新**: {current_time}

---

**文档索引版本**: v13.8
**自动更新**: 是 (通过脚本)
**维护状态**: 活跃维护中
"""

    return content


def main():
    """主函数"""
    # 获取项目根目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    docs_dir = os.path.join(project_root, "docs")

    print("🔍 扫描文档目录...")
    docs = scan_docs_directory(docs_dir)
    print(f"📚 找到 {len(docs)} 个文档")

    print("📝 生成索引内容...")
    content = generate_index_content(docs)

    # 写入索引文件
    index_path = os.path.join(docs_dir, "README.md")
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✅ 索引文件已更新: {index_path}")
    print("📊 文档统计:")
    print(f"   - 核心开发文档: {len([d for d in docs if d['category'] == 'core'])} 个")
    print(f"   - 架构设计文档: {len([d for d in docs if d['category'] == 'arch'])} 个")
    print(
        f"   - 项目管理文档: {len([d for d in docs if d['category'] == 'project'])} 个"
    )
    print(f"   - 完成报告: {len([d for d in docs if d['category'] == 'reports'])} 个")


if __name__ == "__main__":
    main()
