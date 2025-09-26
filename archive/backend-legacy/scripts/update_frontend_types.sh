#!/bin/bash
# 更新前端类型定义的脚本
# 在CI/CD流水线中自动执行

set -e

echo "🚀 开始更新前端类型定义..."

# 检查FastAPI服务器是否运行
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "⚠️  FastAPI服务器未运行，正在启动..."
    cd "$(dirname "$0")/.."
    python main.py start-server &
    SERVER_PID=$!

    # 等待服务器启动
    echo "⏳ 等待服务器启动..."
    for i in {1..30}; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo "✅ 服务器启动成功"
            break
        fi
        sleep 1
    done

    if [ $i -eq 30 ]; then
        echo "❌ 服务器启动超时"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
fi

# 生成类型定义
echo "📡 生成TypeScript类型定义..."
python scripts/generate_types.py

# 停止临时服务器（如果启动了）
if [ ! -z "$SERVER_PID" ]; then
    echo "🛑 停止临时服务器..."
    kill $SERVER_PID 2>/dev/null || true
fi

echo "✅ 前端类型定义更新完成"
