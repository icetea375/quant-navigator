#!/bin/bash

# 修复测试文件中的路径问题
# 将错误的路径格式替换为正确的别名格式

echo "开始修复测试文件路径..."

# 修复 components 目录下的测试文件
echo "修复 components 目录..."
find tools/tests/unit/frontend/components/ -name "*.test.ts" -exec sed -i '' 's|../../../@/|@/|g' {} \;

# 修复 views 目录下的测试文件
echo "修复 views 目录..."
find tools/tests/unit/frontend/views/ -name "*.test.ts" -exec sed -i '' 's|../@/|@/|g' {} \;

# 修复 services 目录下的测试文件
echo "修复 services 目录..."
find tools/tests/unit/frontend/services/ -name "*.test.ts" -exec sed -i '' 's|../@/|@/|g' {} \;

# 修复 integration 目录下的测试文件
echo "修复 integration 目录..."
find tools/tests/integration/frontend/ -name "*.test.ts" -exec sed -i '' 's|../@/|@/|g' {} \;

echo "路径修复完成！"
echo "修复的路径格式："
echo "  ../../../@/ -> @/"
echo "  ../@/ -> @/"
