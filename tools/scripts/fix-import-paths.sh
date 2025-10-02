#!/bin/bash

# 批量修复测试文件中的导入路径问题

echo "🔧 开始修复测试文件中的导入路径问题..."

# 查找所有包含错误导入路径的文件
find tools/tests -name "*.ts" -type f -exec grep -l "../../../../packages/frontend-main/src/../../../../../../../../packages/frontend-main/src" {} \; | while read file; do
    echo "修复文件: $file"
    
    # 修复组件导入路径
    sed -i '' 's|../../../../packages/frontend-main/src/../../../../../../../../packages/frontend-main/src/../../../../../../../../packages/frontend-main/src/components/admin/|../../../../packages/frontend-main/src/components/admin/|g' "$file"
    
    # 修复工具类导入路径
    sed -i '' 's|../../../../packages/frontend-main/src/../../../../../../../../packages/frontend-main/src/../../../../../../../../packages/frontend-main/src/utils/test-utils|../../../../packages/frontend-main/src/utils/test-utils|g' "$file"
    
    # 修复类型导入路径
    sed -i '' 's|../../../../packages/frontend-main/src/../../../../../../../../packages/frontend-main/src/../../../../../../../../packages/frontend-main/src/types/|../../../../packages/frontend-main/src/types/|g' "$file"
    
    # 修复store导入路径
    sed -i '' 's|../../../../packages/frontend-main/src/../../../../../../../../packages/frontend-main/src/../../../../../../../../packages/frontend-main/src/stores/|../../../../packages/frontend-main/src/stores/|g' "$file"
    
    # 修复API导入路径
    sed -i '' 's|../../../../packages/frontend-main/src/../../../../../../../../packages/frontend-main/src/../../../../../../../../packages/frontend-main/src/api/|../../../../packages/frontend-main/src/api/|g' "$file"
    
    # 修复服务导入路径
    sed -i '' 's|../../../../packages/frontend-main/src/../../../../../../../../packages/frontend-main/src/../../../../../../../../packages/frontend-main/src/services/|../../../../packages/frontend-main/src/services/|g' "$file"
done

echo "✅ 导入路径修复完成！"
