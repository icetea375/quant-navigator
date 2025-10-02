#!/bin/bash
# ==============================================================================
# "量化导航仪" v11.1 统一测试运行脚本 (Monorepo版)
# 遵循"测试宪法" v11.1 - Monorepo架构
# ==============================================================================

# --- 【宪法第11.3条】快速失败机制 ---
# 任何命令失败，脚本将立即终止
set -e

# --- 【宪法第10条】所有操作都在项目根目录执行 ---
# (脚本本身就在根目录，无需cd)

echo "🚀 开始运行智能分析系统测试套件 (v11.1 - FastAPI + Vue3 版)..."

# --- 1. 环境准备 (Setup) ---
echo " STEP 1: 准备一个干净、一致的测试环境..."

# 1.1 设置环境变量 (如果.env.test文件不存在，则创建一个)
if [ ! -f ".env.test" ]; then
  echo "创建测试环境变量文件 .env.test..."
  cp env.example .env.test
  # 可以进一步用sed命令修改.env.test中的默认值
fi

# 1.2 启动/重启测试基础设施 (Docker Compose)
echo "启动测试数据库和Redis (使用Docker Compose)..."
# --force-recreate: 确保每次都是全新的容器
# --volumes: 移除并重建数据卷，确保数据100%干净
docker-compose -f docker-compose.test.yml down --volumes
docker-compose -f docker-compose.test.yml up -d --force-recreate

# 1.3 等待数据库就绪
echo "等待PostgreSQL就绪..."
# (这是一个简单的等待，生产级脚本会用更健壮的工具如 wait-for-it.sh)
sleep 10

# 1.4 运行数据库迁移和播种
echo "运行数据库迁移和播种..."
# 使用Monorepo统一的命令
pnpm run db:migrate:test
pnpm run db:seed:test

echo "✅ 环境准备就绪！"

# --- 2. 依赖安装 (Monorepo统一管理) ---
echo " STEP 2: 安装所有工作区依赖..."
# 永远只在根目录执行一次，PNPM会自动处理所有子模块
pnpm install

echo "✅ 依赖安装完成！"

# --- 3. 运行测试 (Monorepo统一命令) ---
echo " STEP 3: 开始执行测试..."
TEST_SCOPE=${1:-"all"}

case "$TEST_SCOPE" in
    "unit")
        echo "运行单元测试..."
        echo "运行 Python 单元测试..."
        cd tools/tests
        python -m pytest unit/backend/ -v --tb=short
        cd ../..
        echo "运行前端单元测试..."
        pnpm run test:unit
        ;;
    "integration")
        echo "运行集成测试..."
        echo "运行 Python 集成测试..."
        cd tools/tests
        python -m pytest integration/backend/ -v --tb=short
        cd ../..
        echo "运行前端集成测试..."
        pnpm run test:integration
        ;;
    "e2e")
        echo "运行端到端测试..."
        echo "安装Playwright浏览器..."
        pnpm --filter papa-test-suite run e2e:install
        echo "运行E2E测试..."
        pnpm --filter papa-test-suite run test:e2e
        ;;
    "backend")
        echo "运行所有后端模块的测试..."
        echo "启动 FastAPI 后端服务..."
        cd packages/backend-python
        python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload &
        FASTAPI_PID=$!
        cd ../..
        
        # 等待 FastAPI 服务启动
        echo "等待 FastAPI 服务启动..."
        sleep 5
        
        # 运行后端测试
        echo "运行 Python 后端测试..."
        cd tools/tests
        python -m pytest unit/backend/ integration/backend/ -v --tb=short
        cd ../..
        
        # 停止 FastAPI 服务
        kill $FASTAPI_PID 2>/dev/null || true
        ;;
    "coverage")
        echo "运行测试并生成覆盖率报告（含门禁检查）..."
        echo "遵循测试宪法第4条：行覆盖率≥85%，分支覆盖率≥80%"
        # 运行Python FastAPI测试并检查覆盖率门禁
        cd tools/tests
        python -m pytest --cov=../../packages/backend-python/src --cov-fail-under=85 --cov-branch --cov-report=term-missing --cov-report=html:htmlcov unit/backend/ integration/backend/
        cd ../..
        # 运行其他模块的覆盖率测试
        pnpm run test:coverage
        ;;
    "all")
        echo "运行所有模块的所有测试..."
        echo "运行 Python 测试..."
        cd tools/tests
        python -m pytest unit/backend/ integration/backend/ -v --tb=short
        cd ../..
        echo "运行前端测试..."
        pnpm run test
        ;;
    *)
        echo "用法: $0 [unit|integration|e2e|backend|coverage|all]"
        echo ""
        echo "测试范围说明:"
        echo "  unit        - 运行单元测试"
        echo "  integration - 运行集成测试"
        echo "  e2e         - 运行端到端测试"
        echo "  backend     - 运行所有后端模块测试"
        echo "  coverage    - 运行测试并生成覆盖率报告"
        echo "  all         - 运行所有测试 (默认)"
        exit 1
        ;;
esac

# --- 4. 环境清理 ---
echo " STEP 4: 清理测试环境..."
docker-compose -f docker-compose.test.yml down --volumes

echo "🎉 所有测试成功完成！"
echo ""
echo "📊 Monorepo架构优势:"
echo "  ✅ 统一依赖管理 - 避免版本冲突"
echo "  ✅ 统一命令入口 - 简化操作流程"
echo "  ✅ 符号链接优化 - 节省磁盘空间"
echo "  ✅ 工作区隔离 - 保持模块独立性"
