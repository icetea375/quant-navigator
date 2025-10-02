#!/bin/bash

echo "🔧 验证后端和前端测试修复效果"
echo "=================================="

# 检查Python环境
echo "📋 检查Python环境..."
cd /Users/pengcheng/Documents/papa
source venv/bin/activate
python --version

# 运行Python后端测试
echo "🐍 运行Python后端测试..."
cd tools/tests
python -m pytest unit/backend/entities/test_anomaly_event_entity.py -v --tb=short

# 检查前端环境
echo "📋 检查前端环境..."
cd /Users/pengcheng/Documents/papa
pnpm --version

# 运行前端测试
echo "🎨 运行前端测试..."
pnpm run test:frontend:unit 2>&1 | head -30

echo "✅ 修复验证完成！"

