#!/usr/bin/env python3
"""
损坏链接修复工具

修复文档中的损坏内部链接

作者: AI Assistant
版本: v1.0
日期: 2025年1月17日
"""

import re
import sys
from pathlib import Path
from typing import List, Dict, Set


class BrokenLinkFixer:
    """损坏链接修复器"""

    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.docs_dir = self.project_root / "docs"
        self.fixed_files = []
        self.issues_fixed = 0
        self.file_map = {}  # 文件名到实际路径的映射

    def fix_all_links(self) -> None:
        """修复所有损坏的内部链接"""
        print("🔗 开始修复损坏的内部链接...")
        
        # 建立文件映射
        self._build_file_map()
        
        # 修复链接
        self._fix_broken_links()
        
        print(f"✅ 修复完成！共修复 {self.issues_fixed} 个问题，涉及 {len(self.fixed_files)} 个文件")

    def _build_file_map(self) -> None:
        """建立文件名到实际路径的映射"""
        print("📁 建立文件映射...")
        
        for md_file in self.docs_dir.rglob("*.md"):
            # 文件名（不含扩展名）
            name_without_ext = md_file.stem
            # 相对路径（从docs目录开始）
            relative_path = md_file.relative_to(self.docs_dir)
            
            # 存储多种可能的键
            self.file_map[name_without_ext] = str(relative_path)
            self.file_map[str(relative_path)] = str(relative_path)
            self.file_map[str(relative_path).replace('.md', '')] = str(relative_path)

    def _fix_broken_links(self) -> None:
        """修复损坏的内部链接"""
        print("🔧 修复损坏的链接...")
        
        for md_file in self.docs_dir.rglob("*.md"):
            if self._fix_file_links(md_file):
                self.fixed_files.append(str(md_file))

    def _fix_file_links(self, file_path: Path) -> bool:
        """修复单个文件的链接"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # 修复markdown链接 [text](path)
            content = self._fix_markdown_links(content, file_path)
            
            # 修复相对路径链接
            content = self._fix_relative_links(content, file_path)
            
            # 如果内容有变化，写回文件
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                return True
                
        except Exception as e:
            print(f"❌ 修复文件 {file_path} 时出错: {e}")
            
        return False

    def _fix_markdown_links(self, content: str, file_path: Path) -> str:
        """修复markdown链接"""
        # 匹配 [text](path) 格式的链接
        link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
        
        def replace_link(match):
            text = match.group(1)
            path = match.group(2)
            
            # 如果是内部链接（以.md结尾或相对路径）
            if path.endswith('.md') or not path.startswith(('http', 'mailto:', '#')):
                # 尝试修复路径
                fixed_path = self._find_correct_path(path, file_path)
                if fixed_path and fixed_path != path:
                    self.issues_fixed += 1
                    return f'[{text}]({fixed_path})'
            
            return match.group(0)
        
        return re.sub(link_pattern, replace_link, content)

    def _fix_relative_links(self, content: str, file_path: Path) -> str:
        """修复相对路径链接"""
        # 匹配相对路径引用
        ref_pattern = r'\[([^\]]+)\]\(([^)]+\.md)\)'
        
        def replace_ref(match):
            text = match.group(1)
            path = match.group(2)
            
            # 尝试修复路径
            fixed_path = self._find_correct_path(path, file_path)
            if fixed_path and fixed_path != path:
                self.issues_fixed += 1
                return f'[{text}]({fixed_path})'
            
            return match.group(0)
        
        return re.sub(ref_pattern, replace_ref, content)

    def _find_correct_path(self, path: str, current_file: Path) -> str:
        """查找正确的文件路径"""
        # 移除可能的查询参数和锚点
        clean_path = path.split('#')[0].split('?')[0]
        
        # 如果路径已经存在，直接返回
        if (self.docs_dir / clean_path).exists():
            return path
        
        # 尝试不同的路径变体
        possible_paths = [
            clean_path,
            clean_path.replace('.md', ''),
            clean_path + '.md',
            clean_path.replace('_', '-'),
            clean_path.replace('-', '_'),
        ]
        
        for possible_path in possible_paths:
            # 检查文件是否存在
            if (self.docs_dir / possible_path).exists():
                return possible_path
            
            # 检查是否有相似的文件名
            for existing_file in self.docs_dir.rglob("*.md"):
                if existing_file.stem.lower() == possible_path.lower().replace('.md', ''):
                    return str(existing_file.relative_to(self.docs_dir))
        
        return None

    def generate_report(self) -> str:
        """生成修复报告"""
        report = []
        report.append("# 损坏链接修复报告")
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
    
    fixer = BrokenLinkFixer(project_root)
    fixer.fix_all_links()
    
    # 生成报告
    report = fixer.generate_report()
    print("\n" + "="*50)
    print(report)
    
    # 保存报告
    report_file = Path(project_root) / "docs" / "损坏链接修复报告.md"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    print(f"\n📄 详细报告已保存到: {report_file}")


if __name__ == "__main__":
    main()


