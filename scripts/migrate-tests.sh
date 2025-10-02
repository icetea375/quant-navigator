#!/bin/bash

# 测试文件迁移脚本 - 方案一：按测试类型分层
# 执行命名规范统一和文件迁移

set -e

echo "🚀 开始执行测试文件迁移 - 方案一：按测试类型分层"
echo "=================================================="

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="/Users/pengcheng/Documents/papa"
FRONTEND_DIR="$PROJECT_ROOT/packages/frontend-main"

echo -e "${BLUE}📁 项目根目录: $PROJECT_ROOT${NC}"
echo -e "${BLUE}📁 前端目录: $FRONTEND_DIR${NC}"

# 进入前端目录
cd "$FRONTEND_DIR"

echo -e "\n${YELLOW}步骤1: 检查现有测试文件${NC}"
echo "=================================================="

# 统计现有测试文件
echo "现有测试文件统计:"
echo "单元测试文件:"
find src -name "*.test.ts" -not -name "*.integration.test.ts" -not -name "*.e2e.spec.ts" | wc -l
echo "集成测试文件:"
find src -name "*.integration.test.ts" | wc -l
echo "E2E测试文件:"
find src -name "*.e2e.spec.ts" | wc -l

echo -e "\n${YELLOW}步骤2: 重命名不符合规范的测试文件${NC}"
echo "=================================================="

# 重命名组件测试文件
echo "重命名组件测试文件..."
cd src/components/admin/__tests__/

# 重命名缺少类型标识的文件
for file in *.test.ts; do
    if [[ ! "$file" =~ \.(unit|integration|e2e)\.test\.ts$ ]]; then
        new_name="${file%.test.ts}.unit.test.ts"
        if [[ -f "$file" ]]; then
            mv "$file" "$new_name"
            echo -e "${GREEN}✅ 重命名: $file -> $new_name${NC}"
        fi
    fi
done

# 删除临时文件
if [[ -f "ArbitrationDashboard.fixed.test.ts" ]]; then
    rm "ArbitrationDashboard.fixed.test.ts"
    echo -e "${GREEN}✅ 删除临时文件: ArbitrationDashboard.fixed.test.ts${NC}"
fi

if [[ -f "ArbitrationDashboard.test.ts" ]]; then
    rm "ArbitrationDashboard.test.ts"
    echo -e "${GREEN}✅ 删除重复文件: ArbitrationDashboard.test.ts${NC}"
fi

cd "$FRONTEND_DIR"

echo -e "\n${YELLOW}步骤3: 移动测试文件到新目录结构${NC}"
echo "=================================================="

# 移动单元测试文件
echo "移动单元测试文件..."

# 移动组件单元测试
if [[ -d "src/components/admin/__tests__" ]]; then
    find src/components/admin/__tests__ -name "*.unit.test.ts" -exec mv {} tests/unit/components/ \;
    echo -e "${GREEN}✅ 移动组件单元测试到 tests/unit/components/${NC}"
fi

# 移动服务单元测试
if [[ -d "src/services/__tests__" ]]; then
    find src/services/__tests__ -name "*.test.ts" -exec mv {} tests/unit/services/ \;
    echo -e "${GREEN}✅ 移动服务单元测试到 tests/unit/services/${NC}"
fi

# 移动其他单元测试
find src/test -name "*.test.ts" -not -name "*.integration.test.ts" -not -name "*.e2e.spec.ts" -exec mv {} tests/unit/ \;
echo -e "${GREEN}✅ 移动其他单元测试到 tests/unit/${NC}"

# 移动集成测试文件
echo "移动集成测试文件..."

# 移动组件集成测试
find src -name "*.integration.test.ts" -exec mv {} tests/integration/arbitration/ \;
echo -e "${GREEN}✅ 移动集成测试到 tests/integration/arbitration/${NC}"

# 移动E2E测试文件
echo "移动E2E测试文件..."
find src -name "*.e2e.spec.ts" -exec mv {} tests/e2e/workflows/ \;
echo -e "${GREEN}✅ 移动E2E测试到 tests/e2e/workflows/${NC}"

echo -e "\n${YELLOW}步骤4: 清理空目录${NC}"
echo "=================================================="

# 清理空的测试目录
find src -type d -name "__tests__" -empty -delete
find src -type d -name "test" -empty -delete
echo -e "${GREEN}✅ 清理了空的测试目录${NC}"

echo -e "\n${YELLOW}步骤5: 验证迁移结果${NC}"
echo "=================================================="

# 统计迁移后的文件
echo "迁移后的测试文件统计:"
echo "单元测试文件:"
find tests/unit -name "*.test.ts" | wc -l
echo "集成测试文件:"
find tests/integration -name "*.test.ts" | wc -l
echo "E2E测试文件:"
find tests/e2e -name "*.spec.ts" | wc -l

echo -e "\n${GREEN}🎉 测试文件迁移完成！${NC}"
echo "=================================================="
echo "新的目录结构:"
echo "tests/"
echo "├── unit/                    # 单元测试"
echo "│   ├── components/         # 组件单元测试"
echo "│   ├── services/           # 服务单元测试"
echo "│   ├── stores/             # 状态管理单元测试"
echo "│   └── utils/              # 工具函数单元测试"
echo "├── integration/            # 集成测试"
echo "│   ├── arbitration/        # 仲裁功能集成测试"
echo "│   ├── market/             # 市场功能集成测试"
echo "│   ├── auth/               # 认证功能集成测试"
echo "│   └── workflows/          # 工作流集成测试"
echo "├── e2e/                    # 端到端测试"
echo "│   ├── user-journeys/      # 用户旅程测试"
echo "│   └── workflows/          # 工作流E2E测试"
echo "└── fixtures/               # 测试数据"
echo "    ├── arbitration/        # 仲裁测试数据"
echo "    └── market/             # 市场测试数据"
