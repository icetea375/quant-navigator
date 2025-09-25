#!/bin/bash

# PostgreSQL数据库初始化脚本
# 创建数据库、用户和表结构

echo "🚀 初始化PostgreSQL数据库..."

# 设置默认值
DB_NAME=${DB_NAME:-news_analysis}
DB_USER=${DB_USER:-news_user}
DB_PASSWORD=${DB_PASSWORD:-news_password}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo "📋 数据库配置:"
echo "  主机: $DB_HOST:$DB_PORT"
echo "  数据库: $DB_NAME"
echo "  用户: $DB_USER"

# 检查PostgreSQL是否运行
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo "❌ PostgreSQL服务未运行，请先启动PostgreSQL"
    exit 1
fi

# 创建数据库和用户
echo "🔧 创建数据库和用户..."
sudo -u postgres psql << EOF
-- 创建数据库
CREATE DATABASE $DB_NAME;

-- 创建用户
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
GRANT ALL ON SCHEMA public TO $DB_USER;

-- 连接到数据库并授权
\c $DB_NAME
GRANT ALL ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO $DB_USER;

-- 设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO $DB_USER;
EOF

if [ $? -eq 0 ]; then
    echo "✅ 数据库和用户创建成功"
else
    echo "❌ 数据库和用户创建失败"
    exit 1
fi

# 创建表结构
echo "🏗️ 创建表结构..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f news-analysis-service/src/database/postgres-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ 表结构创建成功"
else
    echo "❌ 表结构创建失败"
    exit 1
fi

echo "🎉 PostgreSQL数据库初始化完成！"
echo ""
echo "📋 后续步骤:"
echo "1. 设置环境变量:"
echo "   export DB_TYPE=postgresql"
echo "   export DB_HOST=$DB_HOST"
echo "   export DB_PORT=$DB_PORT"
echo "   export DB_NAME=$DB_NAME"
echo "   export DB_USER=$DB_USER"
echo "   export DB_PASSWORD=$DB_PASSWORD"
echo ""
echo "2. 启动应用程序:"
echo "   npm run dev"
