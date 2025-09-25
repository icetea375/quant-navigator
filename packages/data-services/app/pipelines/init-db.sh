#!/bin/bash

echo "🗄️  初始化 NewsNow 数据库..."

# 设置环境变量
export NODE_ENV=development
export ENABLE_CACHE=true
export INIT_TABLE=true
export DISABLE_LOGIN=true

# 创建数据库目录
mkdir -p data

# 检查数据库文件
if [ -f "data/newsnow.db" ]; then
    echo "📁 数据库文件已存在: data/newsnow.db"
else
    echo "📁 创建数据库文件: data/newsnow.db"
    touch data/newsnow.db
fi

echo "✅ 数据库初始化完成！"
echo "💡 现在可以启动项目了"

