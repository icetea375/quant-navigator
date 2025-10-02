#!/bin/bash
# ==============================================================================
# pytest 测试运行脚本 - FastAPI 后端
# ==============================================================================

set -e

echo "🚀 开始运行 FastAPI 后端测试..."

# 进入测试目录
cd "$(dirname "$0")"

# 检查 Python 环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装"
    exit 1
fi

# 检查并激活虚拟环境
if [ -f "../../venv/bin/activate" ]; then
    echo "🐍 激活虚拟环境..."
    source ../../venv/bin/activate
elif [ -f "../../venv/Scripts/activate" ]; then
    echo "🐍 激活虚拟环境 (Windows)..."
    source ../../venv/Scripts/activate
else
    echo "⚠️  虚拟环境未找到，使用系统 Python"
fi

# 检查 pytest 是否安装
if ! python3 -m pytest --version &> /dev/null; then
    echo "📦 安装 pytest 和相关依赖..."
    if command -v pip3 &> /dev/null; then
        pip3 install pytest pytest-cov pytest-asyncio
    elif command -v pip &> /dev/null; then
        pip install pytest pytest-cov pytest-asyncio
    else
        echo "❌ pip 命令未找到，请检查 Python 环境"
        exit 1
    fi
fi

# 设置环境变量
export PYTHONPATH="$(pwd)/../../packages/backend-python:$PYTHONPATH"
export NODE_ENV=test
export DATABASE_URL="postgresql://postgres:testpass@localhost:5432/quant_navigator_test"
export REDIS_URL="redis://localhost:6379/1"
export FASTAPI_HOST="localhost"
export FASTAPI_PORT="8000"
export API_BASE_URL="http://localhost:8000"

# 测试类型
TEST_TYPE=${1:-"all"}

case "$TEST_TYPE" in
    "unit")
        echo "🧪 运行单元测试..."
        python3 -m pytest unit/backend/ -v --tb=short --cov=../../packages/backend-python/src --cov-report=term-missing
        ;;
    "integration")
        echo "🔗 运行集成测试..."
        python3 -m pytest integration/backend/ -v --tb=short --cov=../../packages/backend-python/src --cov-report=term-missing
        ;;
    "e2e")
        echo "🌐 运行端到端测试..."
        python3 -m pytest e2e/backend/ -v --tb=short
        ;;
    "coverage")
        echo "📊 运行测试并生成覆盖率报告..."
        echo "遵循测试宪法第4条：行覆盖率≥85%，分支覆盖率≥80%"
        python3 -m pytest unit/backend/ integration/backend/ -v --tb=short \
            --cov=../../packages/backend-python/src \
            --cov-fail-under=85 \
            --cov-branch \
            --cov-report=term-missing \
            --cov-report=html:htmlcov
        ;;
    "all")
        echo "🎯 运行所有测试..."
        python3 -m pytest unit/backend/ integration/backend/ e2e/backend/ -v --tb=short \
            --cov=../../packages/backend-python/src \
            --cov-report=term-missing
        ;;
    "fast")
        echo "⚡ 运行快速测试（跳过慢速测试）..."
        python3 -m pytest unit/backend/ -v --tb=short -m "not slow"
        ;;
    *)
        echo "用法: $0 [unit|integration|e2e|coverage|all|fast]"
        echo ""
        echo "测试类型说明:"
        echo "  unit        - 运行单元测试"
        echo "  integration - 运行集成测试"
        echo "  e2e         - 运行端到端测试"
        echo "  coverage    - 运行测试并生成覆盖率报告"
        echo "  all         - 运行所有测试"
        echo "  fast        - 运行快速测试（跳过慢速测试）"
        exit 1
        ;;
esac

echo "✅ 测试完成！"
