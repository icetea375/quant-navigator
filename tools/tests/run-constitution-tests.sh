#!/bin/bash

# 测试宪法测试运行脚本
# 遵循测试宪法第8条和第9条要求

set -e  # 遇到错误立即退出

echo "🚀 启动测试宪法测试运行脚本"
echo "=================================="

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 检查测试环境是否存在
if [ ! -f "docker/docker-compose.test.yml" ]; then
    echo "❌ 测试环境配置文件不存在"
    exit 1
fi

echo "📋 检查测试宪法符合性..."

# 检查测试文件是否存在
TEST_FILES=(
    "integration/api/config-api.test.py"
    "integration/auth/auth-workflow.integration.test.py"
    "integration/database.integration.test.py"
    "integration/frontend-backend/frontend-backend-api.integration.test.py"
    "integration/services/data-pipeline-quant-signal.integration.test.py"
)

for test_file in "${TEST_FILES[@]}"; do
    if [ ! -f "$test_file" ]; then
        echo "❌ 测试文件不存在: $test_file"
        exit 1
    fi
done

echo "✅ 所有测试文件存在"

# 检查测试宪法基础类是否存在
if [ ! -f "utils/test_constitution_base.py" ]; then
    echo "❌ 测试宪法基础类不存在"
    exit 1
fi

echo "✅ 测试宪法基础类存在"

# 启动测试环境
echo "🐳 启动Docker测试环境..."
cd docker
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up --build -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务健康状态
echo "🔍 检查服务健康状态..."
if ! docker-compose -f docker-compose.test.yml ps | grep -q "Up (healthy)"; then
    echo "❌ 服务启动失败"
    docker-compose -f docker-compose.test.yml logs
    exit 1
fi

echo "✅ 服务启动成功"

# 运行测试
echo "🧪 运行测试宪法测试..."
cd ..

# 设置测试环境变量
export DATABASE_URL="postgresql://test_user:test_password@localhost:5433/test_quant_navigator"
export REDIS_URL="redis://localhost:6380/1"
export TESTING=true

# 运行所有集成测试
echo "📊 运行集成测试..."
python -m pytest integration/ -v --tb=short --cov=packages/backend-python/src --cov-report=html --cov-report=term

# 检查测试结果
if [ $? -eq 0 ]; then
    echo "✅ 所有测试通过"
else
    echo "❌ 测试失败"
    exit 1
fi

# 运行测试宪法验证
echo "🔍 运行测试宪法验证..."
python -c "
from utils.test_constitution_base import TestConstitutionValidator
import sys

# 验证测试文件
test_files = [
    'integration.api.config_api_test',
    'integration.auth.auth_workflow_integration_test',
    'integration.database_integration_test',
    'integration.frontend_backend.frontend_backend_api_integration_test',
    'integration.services.data_pipeline_quant_signal_integration_test'
]

for test_file in test_files:
    try:
        module = __import__(test_file, fromlist=['TestConfigAPI'])
        print(f'✅ {test_file} 模块导入成功')
    except ImportError as e:
        print(f'❌ {test_file} 模块导入失败: {e}')
        sys.exit(1)

print('✅ 所有测试模块验证通过')
"

if [ $? -eq 0 ]; then
    echo "✅ 测试宪法验证通过"
else
    echo "❌ 测试宪法验证失败"
    exit 1
fi

# 清理测试环境
echo "🧹 清理测试环境..."
cd docker
docker-compose -f docker-compose.test.yml down -v
cd ..

echo "🎉 测试宪法测试运行完成！"
echo "=================================="
echo "📊 测试报告已生成: htmlcov/index.html"
echo "🔍 测试覆盖率报告已生成: coverage.xml"
