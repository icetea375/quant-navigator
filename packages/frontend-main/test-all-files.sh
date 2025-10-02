#!/bin/bash

# 批量测试所有测试文件脚本
echo "=== 前端测试套件批量扫描 ==="
echo "开始时间: $(date)"
echo ""

# 创建结果文件
RESULT_FILE="test-results-$(date +%Y%m%d-%H%M%S).log"
echo "结果文件: $RESULT_FILE"
echo ""

# 已测试的文件 (跳过)
TESTED_FILES=(
    "tests/DataPanelContainer.spec.ts"
    "tests/SimpleComponent.test.ts"
    "tests/FlowAndChipsViewer.spec.ts"
    "tests/ArbitrationDashboard.integration.spec.ts"
    "tests/StockPoolManager.test.ts"
    "tests/useFinancialSnapshot.test.ts"
)

# 获取所有测试文件
ALL_FILES=$(find tests -name "*.spec.ts" -o -name "*.test.ts" | sort)

echo "=== 测试文件统计 ==="
echo "总文件数: $(echo "$ALL_FILES" | wc -l)"
echo "已测试文件数: ${#TESTED_FILES[@]}"
echo "待测试文件数: $(($(echo "$ALL_FILES" | wc -l) - ${#TESTED_FILES[@]}))"
echo ""

# 初始化计数器
TOTAL_COUNT=0
PASSED_COUNT=0
FAILED_COUNT=0
SKIPPED_COUNT=0

echo "=== 开始批量测试 ==="
echo ""

for file in $ALL_FILES; do
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    
    # 检查是否已测试
    if [[ " ${TESTED_FILES[@]} " =~ " ${file} " ]]; then
        echo "[$TOTAL_COUNT] ⏭️  跳过: $file (已测试)"
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        continue
    fi
    
    echo "[$TOTAL_COUNT] 🧪 测试: $file"
    
    # 运行测试并捕获结果
    if npm test -- "$file" --run --reporter=basic > /tmp/test-output.log 2>&1; then
        echo "    ✅ 通过"
        PASSED_COUNT=$((PASSED_COUNT + 1))
    else
        echo "    ❌ 失败"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        
        # 记录失败信息到结果文件
        echo "=== 失败文件: $file ===" >> "$RESULT_FILE"
        echo "失败时间: $(date)" >> "$RESULT_FILE"
        cat /tmp/test-output.log >> "$RESULT_FILE"
        echo "" >> "$RESULT_FILE"
    fi
    
    # 避免浏览器资源耗尽，短暂休息
    sleep 1
done

echo ""
echo "=== 测试完成统计 ==="
echo "总文件数: $TOTAL_COUNT"
echo "通过文件: $PASSED_COUNT"
echo "失败文件: $FAILED_COUNT"
echo "跳过文件: $SKIPPED_COUNT"
echo "成功率: $((PASSED_COUNT * 100 / (PASSED_COUNT + FAILED_COUNT)))%"
echo ""
echo "结束时间: $(date)"
echo "结果文件: $RESULT_FILE"

