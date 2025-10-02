#!/bin/bash
# 测试环境启动脚本
# 遵循测试宪法第3.3条：E2E测试的"有限真实性"原则

set -e

echo "🚀 启动测试环境..."
echo "遵循测试宪法第3.3条：E2E测试的'有限真实性'原则"
echo ""

# 检查依赖
echo "🔍 检查依赖..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装"
    exit 1
fi

echo "✅ 依赖检查通过"
echo ""

# 安装依赖
echo "📦 安装依赖..."

# 检查并激活虚拟环境
if [ -f "venv/bin/activate" ]; then
    echo "🐍 激活虚拟环境..."
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    echo "🐍 激活虚拟环境 (Windows)..."
    source venv/Scripts/activate
else
    echo "⚠️  虚拟环境未找到，使用系统 Python"
fi

cd packages/frontend-main
npm install
cd ../backend-python

# 安装Python依赖
if command -v pip3 &> /dev/null; then
    pip3 install -r ../../requirements.txt
elif command -v pip &> /dev/null; then
    pip install -r ../../requirements.txt
else
    echo "❌ pip 命令未找到，请检查 Python 环境"
    exit 1
fi

cd ../..
echo "✅ 依赖安装完成"
echo ""

# 启动后端服务
echo "🔧 启动后端服务..."
cd packages/backend-python
python3 -m uvicorn src.main:app --host 0.0.0.0 --port 3001 --reload &
BACKEND_PID=$!
echo "后端服务PID: $BACKEND_PID"
cd ../..

# 等待后端服务启动
echo "⏳ 等待后端服务启动..."
sleep 10

# 检查后端服务状态
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# 启动前端服务
echo "🎨 启动前端服务..."
cd packages/frontend-main
npm run dev &
FRONTEND_PID=$!
echo "前端服务PID: $FRONTEND_PID"
cd ../..

# 等待前端服务启动
echo "⏳ 等待前端服务启动..."
sleep 15

# 检查前端服务状态
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 前端服务启动成功"
else
    echo "❌ 前端服务启动失败"
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🎉 测试环境启动完成！"
echo "前端服务: http://localhost:3000"
echo "后端服务: http://localhost:3001"
echo ""
echo "运行E2E测试:"
echo "  ./tools/scripts/run-e2e-tests.sh"
echo ""
echo "停止测试环境:"
echo "  kill $FRONTEND_PID $BACKEND_PID"
echo ""
echo "PID信息已保存到 .test-pids 文件"
echo "$FRONTEND_PID $BACKEND_PID" > .test-pids
