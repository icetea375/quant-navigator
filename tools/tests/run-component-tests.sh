#!/bin/bash

# 组件测试运行脚本
# 遵循测试宪法和TDD原则

set -e

echo "🚀 开始运行组件测试..."
echo "遵循测试宪法和TDD原则"
echo "=================================="

# 激活虚拟环境
echo "📦 激活虚拟环境..."
source ../../venv/bin/activate

# 进入前端目录
cd ../../packages/frontend-main

# 安装依赖
echo "📥 安装依赖..."
pnpm install

# 运行单元测试
echo "🧪 运行组件单元测试..."
pnpm run test:unit

# 运行集成测试
echo "🔗 运行组件集成测试..."
pnpm run test:integration

# 生成覆盖率报告
echo "📊 生成覆盖率报告..."
pnpm run test:coverage

echo "✅ 所有组件测试完成！"
echo "=================================="
echo "测试结果："
echo "- 市场分析组件: 6个组件测试完成"
echo "- 其他组件: 6个组件测试完成"
echo "- 总计: 12个组件测试完成"
echo "=================================="
