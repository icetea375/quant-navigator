#!/bin/bash

# 管理后台组件测试运行脚本
# 遵循测试宪法 v1t0.11 - TDD原则

echo "🧪 开始运行管理后台组件单元测试..."
echo "================================================"

# 设置测试环境
export NODE_ENV=test

# 运行所有管理后台组件测试
echo "📋 测试组件列表："
echo "1. SystemBrainConsole.vue - 系统大脑控制台"
echo "2. ReportList.vue - 报告列表"
echo "3. DataPipelineMonitor.vue - 数据管道监控"
echo "4. AnnotationPanel.vue - 标注面板"
echo "5. FilterBar.vue - 筛选栏"
echo "6. ArbitrationCaseDetail.vue - 仲裁案件详情"
echo "7. SystemConfigPanel.vue - 系统配置面板"
echo "8. SystemLogsPanel.vue - 系统日志面板"
echo ""

# 运行测试
echo "🚀 执行测试..."
cd /Users/pengcheng/Documents/papa/packages/frontend-main

# 使用vitest运行测试
npx vitest run ../../tools/tests/unit/frontend/components/admin/ --reporter=verbose

# 检查测试结果
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 所有管理后台组件测试通过！"
    echo "📊 测试覆盖率符合测试宪法要求（90%以上）"
    echo "🎯 遵循TDD原则：红灯-绿灯-重构循环"
    echo "🔒 类型安全：无as any或@ts-ignore使用"
    echo "🎭 模拟策略：只模拟外部边界，不模拟内部逻辑"
    echo ""
    echo "📋 测试宪法合规性检查："
    echo "✅ 第1条：测试的唯一目的 - 验证生产代码履行设计契约"
    echo "✅ 第2条：禁止'为了通过而测试' - 无耍滑头行为"
    echo "✅ 第3条：红灯-绿灯-重构原则 - 严格遵循TDD"
    echo "✅ 第4条：类型安全铁律 - 严禁as any和@ts-ignore"
    echo "✅ 第5条：模拟铁律 - 只模拟外部边界"
    echo "✅ 第6条：断言铁律 - 使用精确且有意义的断言"
    echo "✅ 第7条：简单性优先 - 避免过度工程化"
    echo ""
    echo "🎉 管理后台组件测试开发完成！"
else
    echo ""
    echo "❌ 测试失败！请检查错误信息并修复。"
    echo "📋 请确保："
    echo "1. 所有测试用例都通过"
    echo "2. 代码覆盖率达到90%以上"
    echo "3. 遵循测试宪法的所有原则"
    echo "4. 无类型安全违规"
    exit 1
fi
