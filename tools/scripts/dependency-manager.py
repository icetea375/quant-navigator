#!/usr/bin/env python3
"""
量化导航仪 Monorepo - 统一依赖管理器
管理从根目录到各个子项目的依赖关系
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class DependencyManager:
    """统一依赖管理器"""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.python_version = "3.9.18"
        
    def check_python_version(self) -> bool:
        """检查 Python 版本"""
        try:
            result = subprocess.run(
                [sys.executable, "--version"], 
                capture_output=True, 
                text=True
            )
            version = result.stdout.strip()
            print(f"✅ 当前 Python 版本: {version}")
            return True
        except Exception as e:
            print(f"❌ Python 版本检查失败: {e}")
            return False
    
    def create_virtual_environment(self) -> bool:
        """创建虚拟环境"""
        venv_path = self.project_root / "venv"
        
        if venv_path.exists():
            print(f"✅ 虚拟环境已存在: {venv_path}")
            return True
            
        try:
            print("🔧 创建虚拟环境...")
            subprocess.run([
                sys.executable, "-m", "venv", 
                str(venv_path)
            ], check=True)
            print(f"✅ 虚拟环境创建成功: {venv_path}")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ 虚拟环境创建失败: {e}")
            return False
    
    def install_root_dependencies(self) -> bool:
        """安装根目录依赖"""
        try:
            print("📦 安装根目录 Python 依赖...")
            venv_python = self.project_root / "venv" / "bin" / "python"
            if not venv_python.exists():
                venv_python = self.project_root / "venv" / "Scripts" / "python.exe"
            
            # 升级 pip
            subprocess.run([
                str(venv_python), "-m", "pip", "install", "--upgrade", "pip"
            ], check=True)
            
            # 安装依赖
            subprocess.run([
                str(venv_python), "-m", "pip", "install", "-r", 
                str(self.project_root / "requirements.txt")
            ], check=True)
            
            print("✅ 根目录依赖安装完成")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ 根目录依赖安装失败: {e}")
            return False
    
    def install_node_dependencies(self) -> bool:
        """安装 Node.js 依赖"""
        try:
            print("📦 安装 Node.js 依赖...")
            subprocess.run([
                "pnpm", "install"
            ], cwd=self.project_root, check=True)
            print("✅ Node.js 依赖安装完成")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Node.js 依赖安装失败: {e}")
            return False
    
    def verify_installation(self) -> bool:
        """验证安装"""
        try:
            print("🔍 验证安装...")
            
            # 验证 Python 依赖
            venv_python = self.project_root / "venv" / "bin" / "python"
            if not venv_python.exists():
                venv_python = self.project_root / "venv" / "Scripts" / "python.exe"
            
            # 检查关键包
            key_packages = ["fastapi", "uvicorn", "pandas", "numpy", "arq", "granian"]
            for package in key_packages:
                result = subprocess.run([
                    str(venv_python), "-c", f"import {package}; print('{package} OK')"
                ], capture_output=True, text=True)
                if result.returncode == 0:
                    print(f"  ✅ {package}")
                else:
                    print(f"  ❌ {package}")
                    return False
            
            # 验证 Node.js 依赖
            result = subprocess.run([
                "pnpm", "list", "--depth=0"
            ], cwd=self.project_root, capture_output=True, text=True)
            if result.returncode == 0:
                print("  ✅ Node.js 依赖")
            else:
                print("  ❌ Node.js 依赖")
                return False
            
            print("✅ 所有依赖验证通过")
            return True
        except Exception as e:
            print(f"❌ 验证失败: {e}")
            return False
    
    def generate_dependency_report(self) -> Dict:
        """生成依赖报告"""
        report = {
            "python": {
                "version": sys.version,
                "packages": []
            },
            "node": {
                "packages": []
            },
            "status": "unknown"
        }
        
        try:
            # Python 包信息
            venv_python = self.project_root / "venv" / "bin" / "python"
            if not venv_python.exists():
                venv_python = self.project_root / "venv" / "Scripts" / "python.exe"
            
            result = subprocess.run([
                str(venv_python), "-m", "pip", "list", "--format=json"
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                report["python"]["packages"] = json.loads(result.stdout)
            
            # Node.js 包信息
            result = subprocess.run([
                "pnpm", "list", "--json"
            ], cwd=self.project_root, capture_output=True, text=True)
            
            if result.returncode == 0:
                node_data = json.loads(result.stdout)
                if "dependencies" in node_data:
                    report["node"]["packages"] = list(node_data["dependencies"].keys())
            
            report["status"] = "success"
        except Exception as e:
            report["status"] = f"error: {e}"
        
        return report
    
    def run_security_audit(self) -> bool:
        """运行安全审计"""
        try:
            print("🔒 运行安全审计...")
            
            # Python 安全审计
            venv_python = self.project_root / "venv" / "bin" / "python"
            if not venv_python.exists():
                venv_python = self.project_root / "venv" / "Scripts" / "python.exe"
            
            subprocess.run([
                str(venv_python), "-m", "safety", "check", 
                "--file", str(self.project_root / "requirements.txt")
            ], check=True)
            
            # Node.js 安全审计
            subprocess.run([
                "pnpm", "audit"
            ], cwd=self.project_root, check=True)
            
            print("✅ 安全审计通过")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ 安全审计失败: {e}")
            return False
    
    def install_all(self) -> bool:
        """安装所有依赖"""
        print("🚀 开始安装所有依赖...")
        
        steps = [
            ("检查 Python 版本", self.check_python_version),
            ("创建虚拟环境", self.create_virtual_environment),
            ("安装 Python 依赖", self.install_root_dependencies),
            ("安装 Node.js 依赖", self.install_node_dependencies),
            ("验证安装", self.verify_installation),
        ]
        
        for step_name, step_func in steps:
            print(f"\n📋 {step_name}...")
            if not step_func():
                print(f"❌ {step_name} 失败")
                return False
        
        print("\n🎉 所有依赖安装完成！")
        return True
    
    def update_dependencies(self) -> bool:
        """更新依赖"""
        print("🔄 更新依赖...")
        
        # 更新 Python 依赖
        venv_python = self.project_root / "venv" / "bin" / "python"
        if not venv_python.exists():
            venv_python = self.project_root / "venv" / "Scripts" / "python.exe"
        
        try:
            subprocess.run([
                str(venv_python), "-m", "pip", "install", "--upgrade", "-r",
                str(self.project_root / "requirements.txt")
            ], check=True)
            
            # 更新 Node.js 依赖
            subprocess.run([
                "pnpm", "update"
            ], cwd=self.project_root, check=True)
            
            print("✅ 依赖更新完成")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ 依赖更新失败: {e}")
            return False


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="量化导航仪依赖管理器")
    parser.add_argument("--install", action="store_true", help="安装所有依赖")
    parser.add_argument("--update", action="store_true", help="更新依赖")
    parser.add_argument("--audit", action="store_true", help="运行安全审计")
    parser.add_argument("--verify", action="store_true", help="验证安装")
    parser.add_argument("--report", action="store_true", help="生成依赖报告")
    
    args = parser.parse_args()
    
    # 获取项目根目录
    project_root = Path(__file__).parent.parent.parent
    manager = DependencyManager(project_root)
    
    if args.install:
        success = manager.install_all()
    elif args.update:
        success = manager.update_dependencies()
    elif args.audit:
        success = manager.run_security_audit()
    elif args.verify:
        success = manager.verify_installation()
    elif args.report:
        report = manager.generate_dependency_report()
        print(json.dumps(report, indent=2))
        success = True
    else:
        print("请指定操作: --install, --update, --audit, --verify, 或 --report")
        success = False
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()