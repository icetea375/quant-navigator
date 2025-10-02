#!/usr/bin/env python3
"""
文档格式修复工具

修复文档中的格式问题：
1. 标题前缺少空行
2. 未知代码块语言标识符

作者: AI Assistant
版本: v1.0
日期: 2025年1月17日
"""

import re
import sys
from pathlib import Path
from typing import List, Dict


class DocFormatFixer:
    """文档格式修复器"""

    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.docs_dir = self.project_root / "docs"
        self.fixed_files = []
        self.issues_fixed = 0

    def fix_all_docs(self) -> None:
        """修复所有文档的格式问题"""
        print("🔧 开始修复文档格式问题...")
        
        # 修复标题前缺少空行的问题
        self._fix_missing_blank_lines()
        
        # 修复未知代码块语言标识符
        self._fix_unknown_code_blocks()
        
        print(f"✅ 修复完成！共修复 {self.issues_fixed} 个问题，涉及 {len(self.fixed_files)} 个文件")

    def _fix_missing_blank_lines(self) -> None:
        """修复标题前缺少空行的问题"""
        print("📝 修复标题前缺少空行...")
        
        # 查找所有markdown文件
        for md_file in self.docs_dir.rglob("*.md"):
            if self._fix_file_blank_lines(md_file):
                self.fixed_files.append(str(md_file))

    def _fix_file_blank_lines(self, file_path: Path) -> bool:
        """修复单个文件的标题前空行问题"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            lines = content.split('\n')
            new_lines = []
            
            for i, line in enumerate(lines):
                # 检查是否是标题行（以#开头）
                if re.match(r'^#+\s+', line):
                    # 检查前一行是否为空行
                    if i > 0 and lines[i-1].strip() != '':
                        # 在标题前添加空行
                        new_lines.append('')
                        self.issues_fixed += 1
                
                new_lines.append(line)
            
            # 如果内容有变化，写回文件
            new_content = '\n'.join(new_lines)
            if new_content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                return True
                
        except Exception as e:
            print(f"❌ 修复文件 {file_path} 时出错: {e}")
            
        return False

    def _fix_unknown_code_blocks(self) -> None:
        """修复未知代码块语言标识符"""
        print("🔤 修复未知代码块语言标识符...")
        
        # 定义语言标识符映射
        language_mapping = {
            'mermaid': 'mermaid',
            'typescript': 'typescript',
            'javascript': 'javascript',
            'dockerfile': 'dockerfile',
            'nginx': 'nginx',
            'text': 'text'
        }
        
        for md_file in self.docs_dir.rglob("*.md"):
            if self._fix_file_code_blocks(md_file, language_mapping):
                if str(md_file) not in self.fixed_files:
                    self.fixed_files.append(str(md_file))

    def _fix_file_code_blocks(self, file_path: Path, language_mapping: Dict[str, str]) -> bool:
        """修复单个文件的代码块语言标识符"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # 修复代码块语言标识符
            for old_lang, new_lang in language_mapping.items():
                # 匹配 ```old_lang 或 ```old_lang\n
                pattern = rf'```{re.escape(old_lang)}(\n|$)'
                replacement = f'```{new_lang}\\1'
                content = re.sub(pattern, replacement, content)
            
            # 如果内容有变化，写回文件
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                return True
                
        except Exception as e:
            print(f"❌ 修复文件 {file_path} 时出错: {e}")
            
        return False

    def generate_report(self) -> str:
        """生成修复报告"""
        report = []
        report.append("# 文档格式修复报告")
        report.append(f"**修复时间**: {self._get_current_time()}")
        report.append(f"**项目根目录**: {self.project_root}")
        report.append("")
        
        report.append("## 📊 修复统计")
        report.append(f"- 修复问题数: {self.issues_fixed}")
        report.append(f"- 涉及文件数: {len(self.fixed_files)}")
        report.append("")
        
        if self.fixed_files:
            report.append("## 📁 修复的文件")
            for file_path in self.fixed_files:
                report.append(f"- {file_path}")
        
        return '\n'.join(report)

    def _get_current_time(self) -> str:
        """获取当前时间"""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def main():
    """主函数"""
    if len(sys.argv) > 1:
        project_root = sys.argv[1]
    else:
        project_root = "."
    
    fixer = DocFormatFixer(project_root)
    fixer.fix_all_docs()
    
    # 生成报告
    report = fixer.generate_report()
    print("\n" + "="*50)
    print(report)
    
    # 保存报告
    report_file = Path(project_root) / "docs" / "文档格式修复报告.md"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    print(f"\n📄 详细报告已保存到: {report_file}")


if __name__ == "__main__":
    main()


