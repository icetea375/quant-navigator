#!/bin/bash

echo "=== 批量修复测试文件导入路径 ==="

# 进入测试目录
cd tests

echo "1. 修复组件导入路径..."

# 修复所有组件导入路径
find . -name "*.ts" -exec sed -i '' \
  -e 's|../ArbitrationDashboard.vue|../src/components/admin/ArbitrationDashboard.vue|g' \
  -e 's|../ArbitrationCaseList.vue|../src/components/admin/ArbitrationCaseList.vue|g' \
  -e 's|../ArbitrationDecisionDialog.vue|../src/components/admin/ArbitrationDecisionDialog.vue|g' \
  -e 's|../ArbitrationToolbar.vue|../src/components/admin/ArbitrationToolbar.vue|g' \
  -e 's|../FinancialSnapshot.vue|../src/components/admin/FinancialSnapshot.vue|g' \
  -e 's|../DataPanelContainer.vue|../src/components/admin/DataPanelContainer.vue|g' \
  -e 's|../QuantSignalDashboard.vue|../src/components/admin/QuantSignalDashboard.vue|g' \
  -e 's|../FlowAndChipsViewer.vue|../src/components/admin/FlowAndChipsViewer.vue|g' \
  -e 's|../PersonalPrecedentViewer.vue|../src/components/admin/PersonalPrecedentViewer.vue|g' \
  -e 's|../RawTextExplorer.vue|../src/components/admin/RawTextExplorer.vue|g' \
  {} \;

echo "2. 修复视图组件导入路径..."

# 修复视图组件路径
find . -name "*.ts" -exec sed -i '' \
  -e 's|../Home.vue|../src/views/Home.vue|g' \
  -e 's|../Login.vue|../src/views/auth/Login.vue|g' \
  -e 's|../Register.vue|../src/views/auth/Register.vue|g' \
  -e 's|../MarketRadar.vue|../src/views/MarketRadar.vue|g' \
  -e 's|../MyAssistant.vue|../src/views/private/MyAssistant.vue|g' \
  -e 's|../StockPoolManager.vue|../src/views/private/StockPoolManager.vue|g' \
  -e 's|../SystemBrainConsole.vue|../src/views/admin/SystemBrainConsole.vue|g' \
  -e 's|../Layout.vue|../src/views/private/Layout.vue|g' \
  {} \;

echo "3. 修复工具文件导入路径..."

# 修复工具文件路径
find . -name "*.ts" -exec sed -i '' \
  -e 's|../../../../utils/test-pinia.ts|../src/utils/test-pinia.ts|g' \
  -e 's|../../../utils/test-pinia.ts|../src/utils/test-pinia.ts|g' \
  -e 's|../../../../utils/test-helpers.ts|../src/utils/test-helpers.ts|g' \
  -e 's|../../../utils/test-helpers.ts|../src/utils/test-helpers.ts|g' \
  {} \;

echo "4. 修复其他导入路径..."

# 修复其他常见路径
find . -name "*.ts" -exec sed -i '' \
  -e 's|../SimpleComponent.vue|../src/components/SimpleComponent.vue|g' \
  -e 's|../TestSurgeryRoom.vue|../src/components/TestSurgeryRoom.vue|g' \
  -e 's|../Coverage.vue|../src/views/Coverage.vue|g' \
  {} \;

echo "✅ 批量修复完成！"

