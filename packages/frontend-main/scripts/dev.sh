#!/bin/bash

# 量化导航仪前端开发启动脚本

echo "🚀 启动量化导航仪前端开发环境..."

# 检查Node.js版本
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
    echo "❌ 错误: 需要Node.js 18.0或更高版本"
    echo "当前版本: $(node -v)"
    exit 1
fi

# 检查npm版本
npm_version=$(npm -v | cut -d'.' -f1)
if [ "$npm_version" -lt 8 ]; then
    echo "❌ 错误: 需要npm 8.0或更高版本"
    echo "当前版本: $(npm -v)"
    exit 1
fi

# 检查是否存在node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

# 检查端口是否被占用
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  警告: 端口3000已被占用"
    echo "正在尝试终止占用进程..."
    lsof -ti:3000 | xargs kill -9
    sleep 2
fi

# 启动开发服务器
echo "🎯 启动开发服务器..."
echo "📍 访问地址: http://localhost:3000"
echo "🛑 按 Ctrl+C 停止服务器"
echo ""

npm run dev

