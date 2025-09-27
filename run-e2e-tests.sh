#!/bin/bash
# ==============================================================================
# 真实世界E2E测试运行脚本
# 遵循"有限真实性+人工仲裁"策略
# ==============================================================================

set -e

echo "🚀 开始真实世界E2E测试..."
echo "=================================="

# 检查环境变量
if [ -z "$TUSHARE_TOKEN" ]; then
    echo "⚠️  警告: TUSHARE_TOKEN环境变量未设置"
    echo "   将使用测试token，可能无法获取真实数据"
    echo "   建议设置: export TUSHARE_TOKEN=your_real_token"
    echo ""
fi

# 激活虚拟环境
echo "🔧 激活虚拟环境..."
source venv/bin/activate

# 运行E2E测试（非阻塞模式）
echo "🧪 运行真实世界E2E测试..."
echo "   注意：这些测试会调用真实的Tushare API"
echo "   如果失败，请人工判断是外部问题还是代码问题"
echo ""

# 运行E2E测试，即使失败也不退出
set +e
python -m pytest packages/backend-python/tests/e2e/test_real_world_e2e.py -v -m e2e --tb=short
E2E_EXIT_CODE=$?
set -e

echo ""
echo "=================================="

# 根据测试结果给出建议
if [ $E2E_EXIT_CODE -eq 0 ]; then
    echo "🎉 E2E测试全部通过！"
    echo "✅ 系统在真实环境中工作正常"
    echo "✅ 可以安全地部署到生产环境"
else
    echo "⚠️  E2E测试失败（退出码: $E2E_EXIT_CODE）"
    echo ""
    echo "🔍 请人工判断失败原因："
    echo "   1. 网络连接问题？"
    echo "   2. Tushare API问题？"
    echo "   3. 我们的代码问题？"
    echo "   4. 数据格式变化？"
    echo ""
    echo "📋 建议操作："
    echo "   - 如果是外部问题：可以忽略此失败，继续开发"
    echo "   - 如果是代码问题：立即创建bug并修复"
    echo "   - 如果不确定：查看详细日志，或重新运行测试"
    echo ""
    echo "💡 记住：E2E测试失败不会阻止代码合并"
    echo "   但请确保在部署前解决所有代码问题"
fi

echo ""
echo "📊 E2E测试策略说明："
echo "   ✅ 使用真实API，获得真实信心"
echo "   ✅ 严格控制测试范围，避免过度复杂"
echo "   ✅ 接受偶尔失败，由人类专家仲裁"
echo "   ✅ 非阻塞模式，不阻止正常开发流程"
echo ""
echo "🎯 这就是'一个人的军队'的E2E测试哲学！"
