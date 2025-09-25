#!/bin/bash
# 测试运行脚本
# 基于全流程测试计划v1.0

echo "🚀 开始运行智能分析系统测试套件..."

# 设置环境变量
export NODE_ENV=test
export DATABASE_URL=${DATABASE_URL:-"postgresql://test:test@localhost:5432/quant_navigator_test"}
export REDIS_URL=${REDIS_URL:-"redis://localhost:6379/1"}

# 检查依赖
echo "📦 检查测试依赖..."
if [ ! -d "node_modules" ]; then
    echo "安装测试依赖..."
    npm install
fi

# 创建必要的目录
echo "📁 创建测试目录..."
mkdir -p data/fixtures data/mocks data/datasets reports/coverage reports/performance temp

# 运行测试
echo "🧪 运行测试..."

case "$1" in
    "unit")
        echo "运行单元测试..."
        npm run test:unit
        ;;
    "integration")
        echo "运行集成测试..."
        npm run test:integration
        ;;
    "e2e")
        echo "运行端到端测试..."
        npm run test:e2e
        ;;
    "backend")
        echo "运行后端测试..."
        npm run test:backend
        ;;
    "coverage")
        echo "运行测试并生成覆盖率报告..."
        npm run test:coverage
        ;;
    "all"|"")
        echo "运行所有测试..."
        npm test
        ;;
    *)
        echo "用法: $0 [unit|integration|e2e|backend|coverage|all]"
        exit 1
        ;;
esac

# 检查测试结果
if [ $? -eq 0 ]; then
    echo "✅ 测试完成！"
else
    echo "❌ 测试失败！"
    exit 1
fi

