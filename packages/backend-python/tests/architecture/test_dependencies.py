"""
架构依赖测试 - 将架构扫描整合到pytest测试流程中
遵循YAGNI平衡法则：这是"必要的架构守护"，不是"不必要的复杂功能"
"""

import pytest
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Any


class TestArchitectureDependencies:
    """架构依赖测试类 - 将架构扫描整合到pytest中"""
    
    def test_no_direct_imports_from_concrete_implementations(self):
        """
        测试业务逻辑层没有直接导入具体实现
        
        这个测试确保所有业务逻辑都通过抽象接口访问外部依赖
        """
        # 定义禁止的导入模式
        forbidden_patterns = [
            "from src.services.data_sources.",
            "from src.services.llm_providers.",
            "import.*tushare_fetcher",
            "import.*qwen_provider"
        ]
        
        # 扫描业务逻辑层文件
        business_logic_dirs = ["src/services", "src/analysis", "src/workflow"]
        violations = []
        
        for dir_name in business_logic_dirs:
            dir_path = Path(dir_name)
            if dir_path.exists():
                for py_file in dir_path.rglob("*.py"):
                    if py_file.name == "__init__.py":
                        continue
                    
                    violations.extend(self._scan_file_for_violations(py_file, forbidden_patterns))
        
        # 断言没有违规
        assert len(violations) == 0, f"发现直接导入具体实现的违规行为: {violations}"
    
    def test_no_imports_from_archived_proposals(self):
        """
        测试没有从已归档预研方案导入代码
        
        这个测试确保没有代码依赖已删除的预研方案
        """
        # 检查是否还有对infra_proposals的引用
        archived_patterns = [
            "src/core/infra_proposals",
            "ServiceBase",
            "ServiceManager",
            "ServiceRegistry"
        ]
        
        violations = []
        
        # 扫描所有Python文件
        for py_file in Path("src").rglob("*.py"):
            if py_file.name == "__init__.py":
                continue
            
            violations.extend(self._scan_file_for_violations(py_file, archived_patterns))
        
        # 断言没有违规
        assert len(violations) == 0, f"发现对已归档预研方案的引用: {violations}"
    
    def test_interface_usage_in_business_logic(self):
        """
        测试业务逻辑层正确使用抽象接口
        
        这个测试确保业务逻辑层通过抽象接口访问外部依赖
        """
        # 定义应该使用的接口模式
        required_patterns = [
            "DataSourceInterface",
            "LlmProviderInterface"
        ]
        
        # 扫描业务逻辑层文件
        business_logic_dirs = ["src/services", "src/analysis", "src/workflow"]
        found_interfaces = set()
        
        for dir_name in business_logic_dirs:
            dir_path = Path(dir_name)
            if dir_path.exists():
                for py_file in dir_path.rglob("*.py"):
                    if py_file.name == "__init__.py":
                        continue
                    
                    content = py_file.read_text(encoding='utf-8')
                    for pattern in required_patterns:
                        if pattern in content:
                            found_interfaces.add(pattern)
        
        # 断言至少使用了一个抽象接口
        assert len(found_interfaces) > 0, "业务逻辑层应该使用抽象接口"
    
    def test_no_circular_dependencies(self):
        """
        测试没有循环依赖
        
        这个测试确保模块间没有循环依赖关系
        """
        # 构建导入图
        import_graph = {}
        
        for py_file in Path("src").rglob("*.py"):
            if py_file.name == "__init__.py":
                continue
            
            module_name = self._get_module_name(py_file)
            imports = self._extract_imports(py_file)
            import_graph[module_name] = imports
        
        # 检测循环依赖
        cycles = self._detect_cycles(import_graph)
        
        # 断言没有循环依赖
        assert len(cycles) == 0, f"检测到循环依赖: {cycles}"
    
    def test_contract_tests_exist(self):
        """
        测试契约测试存在
        
        这个测试确保为所有抽象接口实现了契约测试
        """
        # 检查契约测试文件是否存在
        contract_test_files = [
            "tests/contracts/test_tushare_fetcher_contract.py",
            "tests/contracts/test_qwen_provider_contract.py"
        ]
        
        for test_file in contract_test_files:
            assert Path(test_file).exists(), f"缺少契约测试文件: {test_file}"
    
    def _scan_file_for_violations(self, file_path: Path, patterns: List[str]) -> List[Dict[str, Any]]:
        """
        扫描单个文件的违规行为
        
        Args:
            file_path: 文件路径
            patterns: 违规模式列表
            
        Returns:
            违规列表
        """
        violations = []
        
        try:
            content = file_path.read_text(encoding='utf-8')
            lines = content.split('\n')
            
            for line_num, line in enumerate(lines, 1):
                for pattern in patterns:
                    if pattern in line:
                        violations.append({
                            "file": str(file_path),
                            "line": line_num,
                            "content": line.strip(),
                            "pattern": pattern
                        })
        
        except Exception as e:
            violations.append({
                "file": str(file_path),
                "line": 0,
                "content": f"文件读取失败: {str(e)}",
                "pattern": "file_read_error"
            })
        
        return violations
    
    def _get_module_name(self, file_path: Path) -> str:
        """获取模块名称"""
        relative_path = file_path.relative_to(Path("."))
        module_name = str(relative_path).replace("/", ".").replace("\\", ".")
        if module_name.endswith(".py"):
            module_name = module_name[:-3]
        return module_name
    
    def _extract_imports(self, file_path: Path) -> List[str]:
        """提取文件中的导入语句"""
        imports = []
        
        try:
            content = file_path.read_text(encoding='utf-8')
            
            # 使用简单的正则表达式提取导入
            import re
            import_patterns = [
                r"from\s+([^\s]+)\s+import",
                r"import\s+([^\s]+)"
            ]
            
            for pattern in import_patterns:
                matches = re.findall(pattern, content)
                imports.extend(matches)
        
        except Exception:
            pass
        
        return imports
    
    def _detect_cycles(self, graph: Dict[str, List[str]]) -> List[List[str]]:
        """检测循环依赖"""
        cycles = []
        visited = set()
        rec_stack = set()
        
        def dfs(node, path):
            if node in rec_stack:
                # 找到循环
                cycle_start = path.index(node)
                cycle = path[cycle_start:] + [node]
                cycles.append(cycle)
                return
            
            if node in visited:
                return
            
            visited.add(node)
            rec_stack.add(node)
            
            for neighbor in graph.get(node, []):
                if neighbor.startswith("src."):
                    dfs(neighbor, path + [node])
            
            rec_stack.remove(node)
        
        for node in graph:
            if node not in visited:
                dfs(node, [])
        
        return cycles


class TestRuffIntegration:
    """Ruff集成测试 - 确保Ruff配置正确"""
    
    def test_ruff_config_exists(self):
        """测试Ruff配置存在"""
        pyproject_path = Path("pyproject.toml")
        assert pyproject_path.exists(), "pyproject.toml文件不存在"
        
        content = pyproject_path.read_text(encoding='utf-8')
        assert "[tool.ruff]" in content, "pyproject.toml中缺少Ruff配置"
    
    def test_ruff_can_run(self):
        """测试Ruff可以正常运行"""
        try:
            result = subprocess.run(
                ["python", "-m", "ruff", "check", "--version"],
                capture_output=True,
                text=True,
                timeout=10
            )
            assert result.returncode == 0, f"Ruff运行失败: {result.stderr}"
        except subprocess.TimeoutExpired:
            pytest.fail("Ruff运行超时")
        except FileNotFoundError:
            pytest.skip("Ruff未安装")
    
    def test_ruff_format_can_run(self):
        """测试Ruff格式化可以正常运行"""
        try:
            result = subprocess.run(
                ["python", "-m", "ruff", "format", "--version"],
                capture_output=True,
                text=True,
                timeout=10
            )
            assert result.returncode == 0, f"Ruff格式化运行失败: {result.stderr}"
        except subprocess.TimeoutExpired:
            pytest.fail("Ruff格式化运行超时")
        except FileNotFoundError:
            pytest.skip("Ruff未安装")
