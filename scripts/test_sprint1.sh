#!/bin/bash

# Sprint 1 测试启动脚本
# 测试核心价值闭环(MVP)功能

echo "🚀 启动 Sprint 1 测试..."
echo "=================================="

# 检查数据库是否运行
echo "📊 检查数据库连接..."
if ! pg_isready -h localhost -p 5432 -U postgres > /dev/null 2>&1; then
    echo "❌ 数据库未运行，请先启动数据库"
    echo "💡 运行: docker-compose up -d postgres redis"
    exit 1
fi
echo "✅ 数据库连接正常"

# 检查后端服务是否运行
echo "🔧 检查后端服务..."
if ! curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "❌ 后端服务未运行，请先启动后端服务"
    echo "💡 运行: cd packages/backend && python -m uvicorn src.main:app --host 0.0.0.0 --port 8000"
    exit 1
fi
echo "✅ 后端服务运行正常"

# 创建测试数据
echo "📝 创建测试数据..."
cd tools/scripts
python create_sprint1_test_data.py
if [ $? -eq 0 ]; then
    echo "✅ 测试数据创建成功"
else
    echo "❌ 测试数据创建失败"
    exit 1
fi
cd ../..

# 运行E2E测试
echo "🧪 运行E2E测试..."
cd tools/tests
npm test e2e/sprint1_arbitration_workflow.test.ts
if [ $? -eq 0 ]; then
    echo "✅ E2E测试通过"
else
    echo "❌ E2E测试失败"
    exit 1
fi
cd ../..

echo ""
echo "🎉 Sprint 1 测试完成！"
echo "=================================="
echo "📋 测试结果总结："
echo "  ✅ 数据库连接正常"
echo "  ✅ 后端服务运行正常"
echo "  ✅ 测试数据创建成功"
echo "  ✅ E2E测试通过"
echo ""
echo "🔗 可以访问以下功能："
echo "  📊 案件列表: http://localhost:3000/admin/arbitration"
echo "  ⚖️ 案件详情: http://localhost:3000/admin/arbitration/ARB_000001_$(date +%Y%m%d)"
echo "  🔧 API文档: http://localhost:8000/docs"
echo ""
echo "🎯 Sprint 1 核心价值闭环(MVP)已就绪！"
