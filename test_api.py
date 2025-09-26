#!/usr/bin/env python3
"""
测试API服务
"""

import asyncio
import sys
import os

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'packages/backend/src'))

async def test_arbitration_service():
    """测试仲裁服务"""
    try:
        from services.arbitration_service import ArbitrationService
        
        service = ArbitrationService()
        print("🔧 仲裁服务初始化成功")
        
        # 测试获取案件列表
        print("📊 测试获取案件列表...")
        result = await service.get_cases(page=1, size=10)
        print(f"结果: {result}")
        
        # 测试获取特定案件
        print("\n🔍 测试获取特定案件...")
        case_id = "ARB_000001_20250925"
        case_detail = await service.get_case_by_id(case_id)
        print(f"案件详情: {case_detail}")
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_arbitration_service())
