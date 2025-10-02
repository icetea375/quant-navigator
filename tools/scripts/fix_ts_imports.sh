#!/bin/bash
# 修复TypeScript测试文件的导入路径

echo "🔧 修复TypeScript测试文件导入路径..."

# 查找所有TypeScript测试文件
find tools/tests -name "*.test.ts" -o -name "*.spec.ts" | while read file; do
    echo "处理文件: $file"
    
    # 计算相对路径深度
    # tools/tests/unit/frontend/components/ -> ../../../../packages/frontend-main/src/
    depth=$(echo "$file" | tr -cd '/' | wc -c)
    depth=$((depth - 2))  # 减去tools和tests
    
    # 生成相对路径
    relative_path=""
    for ((i=0; i<depth; i++)); do
        relative_path="../$relative_path"
    done
    relative_path="${relative_path}packages/frontend-main/src/"
    
    # 替换导入路径
    sed -i.bak "s|from '@/|from '${relative_path}|g" "$file"
    sed -i.bak "s|from \"@/|from \"${relative_path}|g" "$file"
    
    # 清理备份文件
    rm -f "$file.bak"
done

echo "✅ TypeScript导入路径修复完成"
