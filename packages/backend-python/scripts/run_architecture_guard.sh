#!/bin/bash
# ==============================================================================
# "量化导航仪" v13.8 统一测试运行脚本 (极简主义版)
# 遵循YAGNI平衡法则：一个Linter，一个Tester，足矣
# ==============================================================================
set -e

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 开始运行智能分析系统质量保证套件 (v13.8)...${NC}"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}📁 项目根目录: $PROJECT_ROOT${NC}"

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到Python3${NC}"
    exit 1
fi

# 激活虚拟环境（如果存在）
if [ -f "$PROJECT_ROOT/venv/bin/activate" ]; then
    echo -e "${YELLOW}🐍 激活Python虚拟环境...${NC}"
    source "$PROJECT_ROOT/venv/bin/activate"
fi

cd "$PROJECT_ROOT"

# --- 1. 静态代码分析与格式化 (The Linter) ---
echo -e "${BLUE}📋 STEP 1: 运行静态代码分析与格式化检查...${NC}"

# 检查是否安装了Ruff
if ! command -v ruff &> /dev/null; then
    echo -e "${YELLOW}⚠️  Ruff未安装，尝试使用poetry运行...${NC}"
    if command -v poetry &> /dev/null; then
        RUFF_CMD="poetry run ruff"
    else
        echo -e "${RED}❌ 错误: 未找到Ruff，请安装: pip install ruff${NC}"
        exit 1
    fi
else
    RUFF_CMD="ruff"
fi

# Ruff 一个工具，完成了 flake8, black, isort 等多个工具的工作
echo -e "${YELLOW}🔍 运行Ruff代码检查...${NC}"
$RUFF_CMD check .
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 代码检查失败！${NC}"
    exit 1
fi

echo -e "${YELLOW}🎨 检查代码格式...${NC}"
$RUFF_CMD format --check .
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 代码格式检查失败！请运行 'ruff format .' 格式化代码${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 静态代码分析通过！${NC}"

# --- 2. 动态代码测试 (The Tester) ---
echo -e "${BLUE}📋 STEP 2: 运行所有自动化测试...${NC}"

# 检查是否安装了pytest
if ! command -v pytest &> /dev/null; then
    echo -e "${YELLOW}⚠️  pytest未安装，尝试使用poetry运行...${NC}"
    if command -v poetry &> /dev/null; then
        PYTEST_CMD="poetry run pytest"
    else
        echo -e "${RED}❌ 错误: 未找到pytest，请安装: pip install pytest pytest-cov${NC}"
        exit 1
    fi
else
    PYTEST_CMD="pytest"
fi

# Pytest 一个工具，完成了单元测试、集成测试、契约测试、架构测试
echo -e "${YELLOW}🧪 运行所有测试（包括契约测试和架构测试）...${NC}"
$PYTEST_CMD --cov --cov-fail-under=85
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 测试失败！${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 所有测试通过！${NC}"

# 总结
echo -e "${GREEN}🎉 质量保证检查全部通过！${NC}"

# 显示极简主义质量保证状态
echo -e "${BLUE}🛡️  极简主义质量保证状态:${NC}"
echo -e "  🔍 Ruff静态分析: ✅ 通过"
echo -e "  🧪 Pytest动态测试: ✅ 通过"
echo -e "  📊 代码覆盖率: ✅ 通过"
echo -e "  🏗️  架构测试: ✅ 通过"
echo -e "  📋 契约测试: ✅ 通过"

echo -e "${GREEN}🚀 代码可以安全提交！${NC}"
echo -e "${YELLOW}💡 极简主义原则: 一个Linter (Ruff) + 一个Tester (Pytest) = 完美质量保证${NC}"
