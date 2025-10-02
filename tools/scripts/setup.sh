#!/bin/bash

# 量化导航仪环境一键安装脚本

echo "🚀 开始安装量化导航仪环境..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 创建环境变量文件
echo "📝 创建环境变量文件..."
cat > .env << EOF
# 数据库配置
POSTGRES_DB=quant_navigator
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# Redis配置
REDIS_PASSWORD=

# 服务端口
FRONTEND_PORT=3000
BACKEND_PORT=3001
DATA_SERVICES_PORT=8000

# AI配置
OPENAI_API_KEY=your_openai_api_key_here
TUSHARE_TOKEN=your_tushare_token_here
EOF

echo "✅ 环境变量文件创建完成"

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker-compose up --build -d

echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

echo "✅ 安装完成！"
echo ""
echo "🌐 访问地址："
echo "  前端: http://localhost:3000"
echo "  后端API: http://localhost:3001"
echo "  数据服务: http://localhost:8000"
echo ""
echo "📚 查看日志："
echo "  docker-compose logs -f"
echo ""
echo "🛑 停止服务："
echo "  docker-compose down"
