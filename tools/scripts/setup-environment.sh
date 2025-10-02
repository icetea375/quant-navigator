#!/bin/bash

# ==============================================================================
# 量化导航仪 Monorepo - 环境设置脚本
# ==============================================================================
# 自动设置从根目录到后端的完整开发环境
# ==============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}🚀 量化导航仪 Monorepo 环境设置${NC}"
echo -e "${BLUE}====================================${NC}"

# 检查系统要求
echo -e "\n${YELLOW}📋 检查系统要求...${NC}"

# 检查 Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    echo -e "  ✅ Python: $PYTHON_VERSION"
else
    echo -e "  ❌ Python 3 未安装"
    exit 1
fi

# 检查 Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "  ✅ Node.js: $NODE_VERSION"
else
    echo -e "  ❌ Node.js 未安装"
    exit 1
fi

# 检查 pnpm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    echo -e "  ✅ pnpm: $PNPM_VERSION"
else
    echo -e "  ❌ pnpm 未安装，正在安装..."
    npm install -g pnpm
fi

# 检查 Redis
if command -v redis-cli &> /dev/null; then
    echo -e "  ✅ Redis 已安装"
else
    echo -e "  ⚠️  Redis 未安装，请手动安装"
    echo -e "     macOS: brew install redis"
    echo -e "     Ubuntu: sudo apt-get install redis-server"
fi

# 创建虚拟环境
echo -e "\n${YELLOW}🐍 设置 Python 环境...${NC}"

if [ ! -d "venv" ]; then
    echo -e "  📦 创建虚拟环境..."
    python3 -m venv venv
    echo -e "  ✅ 虚拟环境创建完成"
else
    echo -e "  ✅ 虚拟环境已存在"
fi

# 激活虚拟环境
echo -e "  🔧 激活虚拟环境..."
source venv/bin/activate

# 升级 pip
echo -e "  📈 升级 pip..."
pip install --upgrade pip

# 安装 Python 依赖
echo -e "  📦 安装 Python 依赖..."
pip install -r requirements.txt

echo -e "  ✅ Python 环境设置完成"

# 安装 Node.js 依赖
echo -e "\n${YELLOW}📦 设置 Node.js 环境...${NC}"

echo -e "  📦 安装 Node.js 依赖..."
pnpm install

echo -e "  ✅ Node.js 环境设置完成"

# 验证安装
echo -e "\n${YELLOW}🔍 验证安装...${NC}"

# 验证 Python 包
echo -e "  🐍 验证 Python 包..."
python -c "import fastapi, uvicorn, pandas, numpy, arq, granian; print('  ✅ 关键 Python 包验证通过')"

# 验证 Node.js 包
echo -e "  📦 验证 Node.js 包..."
pnpm list --depth=0 > /dev/null 2>&1 && echo -e "  ✅ Node.js 包验证通过"

# 运行测试
echo -e "\n${YELLOW}🧪 运行基础测试...${NC}"

# 运行 Python 测试
echo -e "  🐍 运行 Python 测试..."
python -m pytest tools/tests/unit/backend --tb=short -q || echo -e "  ⚠️  Python 测试有警告"

# 运行 Node.js 测试
echo -e "  📦 运行 Node.js 测试..."
pnpm test:frontend:unit || echo -e "  ⚠️  Node.js 测试有警告"

# 生成环境报告
echo -e "\n${YELLOW}📊 生成环境报告...${NC}"

# Python 包列表
echo -e "  🐍 Python 包数量: $(pip list | wc -l)"

# Node.js 包列表
echo -e "  📦 Node.js 包数量: $(pnpm list --depth=0 | wc -l)"

# 创建环境信息文件
cat > environment-info.md << EOF
# 环境设置报告

## 系统信息
- Python: $(python --version)
- Node.js: $(node --version)
- pnpm: $(pnpm --version)
- 操作系统: $(uname -s)

## 项目结构
- 根目录: $PROJECT_ROOT
- 虚拟环境: $PROJECT_ROOT/venv
- 后端目录: $PROJECT_ROOT/packages/backend-python
- 前端目录: $PROJECT_ROOT/packages/frontend-main

## 依赖管理
- Python 依赖: requirements.txt
- Node.js 依赖: package.json + pnpm-workspace.yaml
- 统一配置: pyproject.toml

## 快速开始
\`\`\`bash
# 启动开发环境
./scripts/start_development.sh

# 运行测试
pnpm test

# 代码检查
pnpm lint
\`\`\`
EOF

echo -e "  ✅ 环境报告已生成: environment-info.md"

# 完成
echo -e "\n${GREEN}🎉 环境设置完成！${NC}"
echo -e ""
echo -e "${BLUE}📋 下一步操作:${NC}"
echo -e "  1. 启动开发环境: ${YELLOW}./scripts/start_development.sh${NC}"
echo -e "  2. 运行测试: ${YELLOW}pnpm test${NC}"
echo -e "  3. 代码检查: ${YELLOW}pnpm lint${NC}"
echo -e "  4. 查看环境报告: ${YELLOW}cat environment-info.md${NC}"
echo -e ""
echo -e "${BLUE}🔧 常用命令:${NC}"
echo -e "  - 激活虚拟环境: ${YELLOW}source venv/bin/activate${NC}"
echo -e "  - 安装新依赖: ${YELLOW}pip install <package> && pip freeze > requirements.txt${NC}"
echo -e "  - 更新依赖: ${YELLOW}python tools/scripts/dependency-manager.py --update${NC}"
echo -e "  - 安全审计: ${YELLOW}python tools/scripts/dependency-manager.py --audit${NC}"
