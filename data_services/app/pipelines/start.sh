#!/bin/bash

echo "🚀 启动 NewsNow 项目..."

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    pnpm install
fi

# 启动开发服务器
echo "🔥 启动开发服务器..."
pnpm dev

