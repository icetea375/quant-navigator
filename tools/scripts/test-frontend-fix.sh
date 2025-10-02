#!/bin/bash

echo "🔧 测试前端组件修复效果"
echo "=========================="

# 检查环境
echo "📋 检查环境..."
cd /Users/pengcheng/Documents/papa
pnpm --version

# 运行修复后的测试
echo "🧪 运行修复后的ArbitrationToolbar测试..."
pnpm --filter './packages/frontend-main' vitest run ../../tools/tests/unit/frontend/components/ArbitrationToolbar.fixed.test.ts

echo ""
echo "🧪 运行修复后的FinancialSnapshot测试..."
pnpm --filter './packages/frontend-main' vitest run ../../tools/tests/unit/frontend/components/FinancialSnapshot.fixed.test.ts

echo ""
echo "🧪 运行原始测试对比..."
pnpm --filter './packages/frontend-main' vitest run ../../tools/tests/unit/frontend/components/ArbitrationToolbar.test.ts --reporter=verbose

echo "✅ 前端测试修复验证完成！"
