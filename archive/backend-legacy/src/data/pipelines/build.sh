#!/bin/bash

echo "🔨 构建 NewsNow 项目..."

# 构建前端
echo "📱 构建前端应用..."
pnpm build

# 构建后端
if [ -d "news-analysis-service" ]; then
    echo "⚙️  构建后端服务..."
    cd news-analysis-service && pnpm build && cd ..
fi

echo "✅ 构建完成！"
