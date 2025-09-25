#!/usr/bin/env python3
"""
LLM统一化快速设置脚本
一键设置LLM统一化环境
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path
from datetime import datetime

def main():
    print("🚀 LLM统一化快速设置")
    print("=" * 50)
    
    # 检查系统环境
    check_system_requirements()
    
    # 创建必要的目录
    create_directories()
    
    # 设置环境变量
    setup_environment_variables()
    
    # 运行验证
    run_validation()
    
    # 显示下一步操作
    show_next_steps()

def check_system_requirements():
    """检查系统要求"""
    print("\n📋 检查系统要求...")
    
    # 检查Python版本
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        print("❌ Python版本过低，需要Python 3.8+")
        sys.exit(1)
    else:
        print(f"✅ Python版本: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    # 检查必要的文件
    required_files = [
        "llm.env.example",
        "scripts/validate-llm-config.py",
        "scripts/test-unified-llm.py"
    ]
    
    for file_path in required_files:
        if Path(file_path).exists():
            print(f"✅ {file_path} 存在")
        else:
            print(f"❌ {file_path} 不存在")
            sys.exit(1)

def create_directories():
    """创建必要的目录"""
    print("\n📁 创建必要的目录...")
    
    directories = [
        "logs",
        "backup",
        "backup/env_vars",
        "shared/python",
        "shared/llm"
    ]
    
    for dir_path in directories:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
        print(f"✅ 创建目录: {dir_path}")

def setup_environment_variables():
    """设置环境变量"""
    print("\n🔧 设置环境变量...")
    
    # 检查是否已有.env.llm文件
    if Path(".env.llm").exists():
        print("ℹ️ .env.llm 文件已存在")
        response = input("是否要覆盖现有配置？(y/N): ").strip().lower()
        if response != 'y':
            print("跳过环境变量设置")
            return
    
    # 复制环境变量模板
    if Path("llm.env.example").exists():
        shutil.copy2("llm.env.example", ".env.llm")
        print("✅ 已创建 .env.llm 文件")
    else:
        print("❌ llm.env.example 文件不存在")
        return
    
    # 提示用户设置API密钥
    print("\n🔑 请设置API密钥...")
    print("至少需要设置以下API密钥之一：")
    print("1. 豆包 (ARK_API_KEY)")
    print("2. 腾讯混元 (TENCENT_API_KEY, TENCENT_SECRET_ID, TENCENT_SECRET_KEY)")
    print("3. Google Gemini (GOOGLE_API_KEY)")
    
    # 交互式设置API密钥
    setup_api_keys_interactively()

def setup_api_keys_interactively():
    """交互式设置API密钥"""
    print("\n🔑 交互式设置API密钥")
    print("按回车键跳过某个API密钥的设置")
    
    api_keys = {
        "ARK_API_KEY": "豆包API密钥",
        "TENCENT_API_KEY": "腾讯混元API密钥",
        "TENCENT_SECRET_ID": "腾讯混元Secret ID",
        "TENCENT_SECRET_KEY": "腾讯混元Secret Key",
        "GOOGLE_API_KEY": "Google Gemini API密钥",
        "OPENAI_API_KEY": "OpenAI API密钥",
        "ANTHROPIC_API_KEY": "Anthropic Claude API密钥",
        "DEEPSEEK_API_KEY": "DeepSeek API密钥"
    }
    
    env_vars = {}
    
    for key, description in api_keys.items():
        value = input(f"请输入 {description} ({key}): ").strip()
        if value:
            env_vars[key] = value
            print(f"✅ 已设置 {key}")
        else:
            print(f"⏭️ 跳过 {key}")
    
    # 更新.env.llm文件
    if env_vars:
        update_env_file(env_vars)
    
    # 设置环境变量
    for key, value in env_vars.items():
        os.environ[key] = value
        print(f"✅ 环境变量 {key} 已设置")

def update_env_file(env_vars):
    """更新.env.llm文件"""
    env_file = Path(".env.llm")
    if not env_file.exists():
        return
    
    # 读取现有内容
    with open(env_file, 'r') as f:
        content = f.read()
    
    # 更新环境变量值
    for key, value in env_vars.items():
        # 查找并替换对应的行
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if line.startswith(f"{key}="):
                lines[i] = f"{key}={value}"
                break
        else:
            # 如果没找到，添加新行
            lines.append(f"{key}={value}")
        
        content = '\n'.join(lines)
    
    # 写回文件
    with open(env_file, 'w') as f:
        f.write(content)
    
    print("✅ 已更新 .env.llm 文件")

def run_validation():
    """运行验证"""
    print("\n🧪 运行验证...")
    
    # 运行环境变量验证
    print("1. 验证环境变量配置...")
    try:
        result = subprocess.run([
            sys.executable, "scripts/validate-llm-config.py"
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ 环境变量验证通过")
        else:
            print("⚠️ 环境变量验证有警告")
            print(result.stdout)
    except subprocess.TimeoutExpired:
        print("⏰ 环境变量验证超时")
    except Exception as e:
        print(f"❌ 环境变量验证失败: {e}")
    
    # 运行统一化配置测试
    print("\n2. 测试统一化配置...")
    try:
        result = subprocess.run([
            sys.executable, "scripts/test-unified-llm.py"
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ 统一化配置测试通过")
        else:
            print("⚠️ 统一化配置测试有警告")
            print(result.stdout)
    except subprocess.TimeoutExpired:
        print("⏰ 统一化配置测试超时")
    except Exception as e:
        print(f"❌ 统一化配置测试失败: {e}")

def show_next_steps():
    """显示下一步操作"""
    print("\n🎉 快速设置完成！")
    print("=" * 50)
    
    print("\n📝 下一步操作：")
    print("1. 检查 .env.llm 文件，确保API密钥正确设置")
    print("2. 运行完整测试：python3 scripts/test-unified-llm.py")
    print("3. 启动服务：npm run dev 或 python3 -m server")
    print("4. 访问监控仪表板：http://localhost:3000/llm-dashboard.html")
    
    print("\n📚 相关文档：")
    print("- 环境变量设置指南：docs/reports/llm/环境变量设置指南.md")
    print("- 故障排除指南：docs/reports/troubleshooting/LLM故障排除指南.md")
    print("- API文档：docs/reports/api/LLM-API文档.md")
    
    print("\n🔧 常用命令：")
    print("- 验证配置：python3 scripts/validate-llm-config.py")
    print("- 测试配置：python3 scripts/test-unified-llm.py")
    print("- 迁移配置：python3 scripts/migrate-llm-config.py")
    print("- 健康检查：curl http://localhost:3000/api/llm/health")
    
    print("\n💡 提示：")
    print("- 如果遇到问题，请查看故障排除指南")
    print("- 建议至少设置2个LLM提供商以确保高可用性")
    print("- 定期运行健康检查以确保服务正常")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⏹️ 用户中断操作")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 设置过程中发生错误: {e}")
        sys.exit(1)
