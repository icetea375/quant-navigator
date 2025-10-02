#!/usr/bin/env python3
"""
配置验证脚本 - 保障核心工作流
遵循《测试宪法》第2.3条：配置必须100%可预测
"""

import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from config.settings import settings, validate_critical_config


def main():
    """验证配置完整性"""
    print("🔍 配置验证开始...")
    print("=" * 50)

    # 显示当前配置
    print("📋 应用信息:")
    print(f"  名称: {settings.APP_NAME}")
    print(f"  版本: {settings.APP_VERSION}")
    print(f"  调试模式: {settings.DEBUG}")
    print(f"  日志级别: {settings.LOG_LEVEL}")

    print("\n🗄️ 数据库配置:")
    print(f"  连接URL: {settings.DATABASE_URL}")
    print(f"  Redis URL: {settings.REDIS_URL}")

    print("\n🤖 LLM配置:")
    print(f"  Qwen API: {'✅ 已设置' if settings.QWEN_API_KEY else '❌ 未设置'}")
    print(f"  豆包 API: {'✅ 已设置' if settings.DOUBAO_API_KEY else '❌ 未设置'}")
    print(f"  OpenAI API: {'✅ 已设置' if settings.OPENAI_API_KEY else '❌ 未设置'}")

    print("\n📊 数据源配置:")
    print(f"  Tushare Token: {'✅ 已设置' if settings.TUSHARE_TOKEN else '❌ 未设置'}")

    print("\n⚙️ 量化引擎配置:")
    print(f"  Z-Score阈值: {settings.Z_SCORE_THRESHOLD}")
    print(f"  滚动窗口: {settings.ROLLING_WINDOW_SIZE}")
    print(
        f"  宏观风险计算: {'启用' if settings.MACRO_RISK_CALCULATION_ENABLED else '禁用'}"
    )

    print("\n" + "=" * 50)

    # 验证关键配置
    if validate_critical_config():
        print("🎉 配置验证通过！系统可以正常运行。")
        return 0
    else:
        print("❌ 配置验证失败！请检查缺失的配置项。")
        return 1


if __name__ == "__main__":
    sys.exit(main())
