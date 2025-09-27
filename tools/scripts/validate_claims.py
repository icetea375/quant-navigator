#!/usr/bin/env python3
"""
声明验证工具

验证文档中所有量化声明是否有数据支撑。

作者: AI Assistant
版本: v1.0
日期: 2025年1月17日
"""

import re
import sqlite3
from pathlib import Path
from typing import Dict, List


class ClaimsValidator:
    """声明验证器"""

    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.performance_db = (
            self.project_root / "data" / "performance" / "performance.db"
        )

        # 需要验证的声明模式
        self.claim_patterns = [
            r"(\d+)\s*分钟",
            r"(\d+)\s*%",
            r"\$(\d+(?:,\d{3})*(?:\.\d{2})?)",
            r"(\d+(?:,\d{3})*(?:\.\d{2})?)\s*美元",
            r"节省\s*(\d+(?:,\d{3})*(?:\.\d{2})?)",
            r"减少\s*(\d+(?:,\d{3})*(?:\.\d{2})?)",
            r"提升\s*(\d+(?:,\d{3})*(?:\.\d{2})?)",
        ]

    def scan_documents_for_claims(self) -> List[Dict]:
        """扫描文档中的量化声明"""
        claims = []

        # 扫描docs目录
        docs_dir = self.project_root / "docs"
        for md_file in docs_dir.rglob("*.md"):
            file_claims = self._scan_file_for_claims(md_file)
            claims.extend(file_claims)

        # 扫描代码文件
        src_dir = self.project_root / "packages" / "backend-python" / "src"
        for py_file in src_dir.rglob("*.py"):
            file_claims = self._scan_file_for_claims(py_file)
            claims.extend(file_claims)

        return claims

    def _scan_file_for_claims(self, file_path: Path) -> List[Dict]:
        """扫描单个文件中的声明"""
        claims = []

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception:
            return claims

        lines = content.split("\n")

        for line_num, line in enumerate(lines, 1):
            for pattern in self.claim_patterns:
                matches = re.finditer(pattern, line)
                for match in matches:
                    claims.append(
                        {
                            "file": str(file_path.relative_to(self.project_root)),
                            "line": line_num,
                            "content": line.strip(),
                            "claim": match.group(0),
                            "value": match.group(1),
                            "pattern": pattern,
                        }
                    )

        return claims

    def validate_claims_with_data(self, claims: List[Dict]) -> List[Dict]:
        """验证声明是否有数据支撑"""
        validated_claims = []

        for claim in claims:
            validation_result = self._validate_single_claim(claim)
            validated_claims.append(
                {
                    **claim,
                    "has_data_support": validation_result["has_support"],
                    "data_source": validation_result["data_source"],
                    "validation_status": validation_result["status"],
                }
            )

        return validated_claims

    def _validate_single_claim(self, claim: Dict) -> Dict:
        """验证单个声明"""
        # 检查性能数据库
        if self.performance_db.exists():
            try:
                conn = sqlite3.connect(self.performance_db)
                cursor = conn.cursor()

                # 检查是否有相关数据
                cursor.execute("SELECT COUNT(*) FROM arbitration_times")
                arb_count = cursor.fetchone()[0]

                cursor.execute("SELECT COUNT(*) FROM api_calls")
                api_count = cursor.fetchone()[0]

                cursor.execute("SELECT COUNT(*) FROM error_costs")
                error_count = cursor.fetchone()[0]

                conn.close()

                if arb_count > 0 or api_count > 0 or error_count > 0:
                    return {
                        "has_support": True,
                        "data_source": str(self.performance_db),
                        "status": "有数据支撑",
                    }
                else:
                    return {
                        "has_support": False,
                        "data_source": str(self.performance_db),
                        "status": "数据库为空，无数据支撑",
                    }
            except Exception as e:
                return {
                    "has_support": False,
                    "data_source": str(self.performance_db),
                    "status": f"数据库访问错误: {e}",
                }
        else:
            return {
                "has_support": False,
                "data_source": "无",
                "status": "性能数据库不存在",
            }

    def generate_validation_report(self, validated_claims: List[Dict]) -> str:
        """生成验证报告"""
        report = []
        report.append("# 声明验证报告")
        report.append(f"**验证时间**: {self._get_current_time()}")
        report.append("")

        # 统计信息
        total_claims = len(validated_claims)
        supported_claims = len([c for c in validated_claims if c["has_data_support"]])
        unsupported_claims = total_claims - supported_claims

        report.append("## 📊 验证统计")
        report.append(f"- 总声明数: {total_claims}")
        report.append(f"- 有数据支撑: {supported_claims}")
        report.append(f"- 无数据支撑: {unsupported_claims}")
        report.append(
            f"- 支撑率: {supported_claims/total_claims*100:.1f}%"
            if total_claims > 0
            else "- 支撑率: 0%"
        )
        report.append("")

        # 无数据支撑的声明
        unsupported = [c for c in validated_claims if not c["has_data_support"]]
        if unsupported:
            report.append("## ❌ 无数据支撑的声明")
            for claim in unsupported:
                report.append(f"### {claim['file']}:{claim['line']}")
                report.append(f"- **声明**: {claim['claim']}")
                report.append(f"- **内容**: {claim['content']}")
                report.append(f"- **状态**: {claim['validation_status']}")
                report.append("")

        # 有数据支撑的声明
        supported = [c for c in validated_claims if c["has_data_support"]]
        if supported:
            report.append("## ✅ 有数据支撑的声明")
            for claim in supported:
                report.append(f"### {claim['file']}:{claim['line']}")
                report.append(f"- **声明**: {claim['claim']}")
                report.append(f"- **内容**: {claim['content']}")
                report.append(f"- **数据源**: {claim['data_source']}")
                report.append("")

        # 建议
        report.append("## 💡 建议")
        if unsupported_claims > 0:
            report.append("1. **移除无数据支撑的声明**: 删除所有没有数据支撑的量化指标")
            report.append("2. **建立数据收集机制**: 开始收集真实的性能数据")
            report.append("3. **验证现有声明**: 用真实数据验证所有量化指标")
        else:
            report.append("1. **保持数据更新**: 定期更新性能数据")
            report.append("2. **持续验证**: 定期验证声明的准确性")

        return "\n".join(report)

    def _get_current_time(self):
        """获取当前时间"""
        from datetime import datetime

        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description="声明验证工具")
    parser.add_argument("--project-root", default=".", help="项目根目录")
    parser.add_argument("--output", help="输出报告文件")

    args = parser.parse_args()

    # 创建验证器
    validator = ClaimsValidator(args.project_root)

    print("🔍 扫描文档中的量化声明...")
    claims = validator.scan_documents_for_claims()
    print(f"📊 发现 {len(claims)} 个量化声明")

    print("🔍 验证声明是否有数据支撑...")
    validated_claims = validator.validate_claims_with_data(claims)

    # 生成报告
    report = validator.generate_validation_report(validated_claims)

    # 输出报告
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(report)
        print(f"📄 报告已保存到: {args.output}")
    else:
        print(report)


if __name__ == "__main__":
    main()
