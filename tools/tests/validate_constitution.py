#!/usr/bin/env python3
"""
测试宪法验证工具
用于验证所有测试是否符合测试宪法要求
"""

import os
import sys
import re
import ast
import inspect
from pathlib import Path
from typing import List, Dict, Any, Tuple


class TestConstitutionValidator:
    """
    测试宪法验证器
    验证测试是否符合测试宪法的所有要求
    """
    
    def __init__(self):
        self.violations = []
        self.test_files = []
        self.load_test_files()
    
    def load_test_files(self):
        """加载所有测试文件"""
        test_dir = Path(__file__).parent
        for test_file in test_dir.rglob("*.py"):
            if test_file.name.startswith("test_") or test_file.name.endswith("_test.py"):
                self.test_files.append(test_file)
    
    def validate_all_tests(self) -> bool:
        """
        验证所有测试是否符合测试宪法
        返回True表示所有测试都符合要求
        """
        print("🔍 开始验证测试宪法符合性...")
        print("=" * 50)
        
        all_passed = True
        
        for test_file in self.test_files:
            print(f"📁 检查文件: {test_file}")
            
            # 验证第7条：断言铁律
            if not self.validate_assertions(test_file):
                all_passed = False
            
            # 验证第6条：模拟铁律
            if not self.validate_mocking(test_file):
                all_passed = False
            
            # 验证第3条：TDD流程
            if not self.validate_tdd_flow(test_file):
                all_passed = False
            
            # 验证第1条：测试目的
            if not self.validate_test_purpose(test_file):
                all_passed = False
            
            # 验证第4条：简单性优先
            if not self.validate_simplicity(test_file):
                all_passed = False
        
        print("=" * 50)
        if all_passed:
            print("✅ 所有测试都符合测试宪法要求")
        else:
            print("❌ 发现测试宪法违规,请修复后重新验证")
            self.print_violations()
        
        return all_passed
    
    def validate_assertions(self, test_file: Path) -> bool:
        """
        验证第7条：断言铁律
        禁止"存在性"断言,必须使用"值"断言
        """
        print("  🔍 验证断言铁律...")
        
        try:
            with open(test_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 禁止的"存在性"断言模式
            forbidden_patterns = [
                r'assert.*not.*toBeNull',
                r'assert.*toBeDefined',
                r'assert.*not.*toBeUndefined',
                r'assert.*in.*data',
                r'assert.*hasattr',
                r'assert.*is not None',
                r'assert.*is not None',
                r'assert.*exists',
                r'assert.*isinstance.*bool',  # 应该检查具体的True/False值
            ]
            
            violations = []
            for pattern in forbidden_patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                if matches:
                    violations.extend(matches)
            
            if violations:
                self.violations.append({
                    'file': str(test_file),
                    'rule': '第7条：断言铁律',
                    'violations': violations,
                    'message': '使用了禁止的"存在性"断言,应使用具体的值断言'
                })
                print(f"    ❌ 发现 {len(violations)} 个断言违规")
                return False
            
            print("    ✅ 断言铁律验证通过")
            return True
            
        except Exception as e:
            print(f"    ❌ 断言验证失败: {e}")
            return False
    
    def validate_mocking(self, test_file: Path) -> bool:
        """
        验证第6条：模拟铁律
        只模拟"外部边界",不模拟"内部逻辑"
        """
        print("  🔍 验证模拟铁律...")
        
        try:
            with open(test_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 禁止模拟内部逻辑的模式
            forbidden_patterns = [
                r'patch.*internal',
                r'patch.*private',
                r'patch.*_method',
                r'patch.*\._[a-zA-Z]',  # 模拟私有方法
                r'mock.*internal',
                r'mock.*private',
            ]
            
            violations = []
            for pattern in forbidden_patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                if matches:
                    violations.extend(matches)
            
            if violations:
                self.violations.append({
                    'file': str(test_file),
                    'rule': '第6条：模拟铁律',
                    'violations': violations,
                    'message': '模拟了内部逻辑,应只模拟外部边界'
                })
                print(f"    ❌ 发现 {len(violations)} 个模拟违规")
                return False
            
            print("    ✅ 模拟铁律验证通过")
            return True
            
        except Exception as e:
            print(f"    ❌ 模拟验证失败: {e}")
            return False
    
    def validate_tdd_flow(self, test_file: Path) -> bool:
        """
        验证第3条：TDD流程
        检查是否有红灯、绿灯、重构阶段的测试
        """
        print("  🔍 验证TDD流程...")
        
        try:
            with open(test_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 检查TDD阶段标识
            red_phase_tests = re.findall(r'def test.*red.*phase', content, re.IGNORECASE)
            green_phase_tests = re.findall(r'def test.*green.*phase', content, re.IGNORECASE)
            refactor_phase_tests = re.findall(r'def test.*refactor.*phase', content, re.IGNORECASE)
            
            # 检查是否有TDD相关的注释或文档
            tdd_comments = re.findall(r'红灯|绿灯|重构|red.*phase|green.*phase|refactor.*phase', content, re.IGNORECASE)
            
            if not red_phase_tests and not green_phase_tests and not refactor_phase_tests and not tdd_comments:
                self.violations.append({
                    'file': str(test_file),
                    'rule': '第3条：TDD流程',
                    'violations': ['缺少TDD阶段标识'],
                    'message': '测试应遵循红灯-绿灯-重构原则,需要明确标识TDD阶段'
                })
                print("    ❌ 缺少TDD阶段标识")
                return False
            
            print("    ✅ TDD流程验证通过")
            return True
            
        except Exception as e:
            print(f"    ❌ TDD流程验证失败: {e}")
            return False
    
    def validate_test_purpose(self, test_file: Path) -> bool:
        """
        验证第1条：测试目的
        测试的唯一目的是验证生产代码是否履行了设计契约
        """
        print("  🔍 验证测试目的...")
        
        try:
            with open(test_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 检查测试是否有明确的目的和验证内容
            test_methods = re.findall(r'def test_.*\(', content)
            
            if not test_methods:
                self.violations.append({
                    'file': str(test_file),
                    'rule': '第1条：测试目的',
                    'violations': ['没有找到测试方法'],
                    'message': '测试文件应包含测试方法'
                })
                print("    ❌ 没有找到测试方法")
                return False
            
            # 检查测试是否有具体的断言
            assertions = re.findall(r'assert\s+', content)
            if len(assertions) < len(test_methods):
                self.violations.append({
                    'file': str(test_file),
                    'rule': '第1条：测试目的',
                    'violations': ['测试方法缺少断言'],
                    'message': '每个测试方法都应包含具体的断言来验证功能'
                })
                print("    ❌ 测试方法缺少断言")
                return False
            
            print("    ✅ 测试目的验证通过")
            return True
            
        except Exception as e:
            print(f"    ❌ 测试目的验证失败: {e}")
            return False
    
    def validate_simplicity(self, test_file: Path) -> bool:
        """
        验证第4条：简单性优先
        测试方案应简单、直接、易于理解和维护
        """
        print("  🔍 验证简单性优先...")
        
        try:
            with open(test_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 检查是否有过度复杂的测试逻辑
            complex_patterns = [
                r'if.*if.*if',  # 嵌套的if语句
                r'for.*for.*for',  # 嵌套的for循环
                r'while.*while',  # 嵌套的while循环
                r'try.*except.*try',  # 嵌套的try-except
            ]
            
            violations = []
            for pattern in complex_patterns:
                matches = re.findall(pattern, content, re.DOTALL)
                if matches:
                    violations.extend(matches)
            
            if violations:
                self.violations.append({
                    'file': str(test_file),
                    'rule': '第4条：简单性优先',
                    'violations': violations,
                    'message': '测试逻辑过于复杂,应简化以提高可维护性'
                })
                print(f"    ❌ 发现 {len(violations)} 个复杂逻辑")
                return False
            
            print("    ✅ 简单性优先验证通过")
            return True
            
        except Exception as e:
            print(f"    ❌ 简单性验证失败: {e}")
            return False
    
    def print_violations(self):
        """打印所有违规信息"""
        print("\n📋 测试宪法违规详情:")
        print("=" * 50)
        
        for i, violation in enumerate(self.violations, 1):
            print(f"\n{i}. 文件: {violation['file']}")
            print(f"   规则: {violation['rule']}")
            print(f"   违规: {violation['violations']}")
            print(f"   说明: {violation['message']}")
    
    def generate_report(self) -> str:
        """生成验证报告"""
        report = []
        report.append("# 测试宪法验证报告")
        report.append("")
        report.append(f"## 验证结果")
        report.append(f"- 检查文件数: {len(self.test_files)}")
        report.append(f"- 违规数量: {len(self.violations)}")
        report.append("")
        
        if self.violations:
            report.append("## 违规详情")
            for i, violation in enumerate(self.violations, 1):
                report.append(f"### {i}. {violation['file']}")
                report.append(f"- **规则**: {violation['rule']}")
                report.append(f"- **违规**: {violation['violations']}")
                report.append(f"- **说明**: {violation['message']}")
                report.append("")
        else:
            report.append("## ✅ 所有测试都符合测试宪法要求")
        
        return "\n".join(report)


def main():
    """主函数"""
    validator = TestConstitutionValidator()
    
    # 验证所有测试
    success = validator.validate_all_tests()
    
    # 生成报告
    report = validator.generate_report()
    
    # 保存报告
    report_file = Path(__file__).parent / "constitution_validation_report.md"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\n📄 验证报告已保存: {report_file}")
    
    # 返回退出码
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
