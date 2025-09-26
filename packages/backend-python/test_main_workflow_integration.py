#!/usr/bin/env python3
"""
测试main_workflow.py的集成功能
验证ArbitrationService和ReportService的集成
"""

import asyncio
import json
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.append(str(project_root))

from src.main_workflow import MainWorkflow


async def test_main_workflow_integration():
    """测试main_workflow集成功能"""
    print("🧪 开始测试main_workflow集成功能...")
    
    # 创建测试配置
    config = {
        "concurrency": {
            "max_db_connections": 5,
            "max_llm_requests": 3,
            "max_stock_processing": 10
        },
        "llm_service": {
            "qwen": {
                "api_key": "test_qwen_key"
            },
            "doubao": {
                "api_key": "test_doubao_key"
            }
        }
    }
    
    try:
        # 初始化主工作流
        print("📋 初始化MainWorkflow...")
        workflow = MainWorkflow(config)
        print("✅ MainWorkflow初始化成功")
        
        # 测试服务是否已正确初始化
        print("🔍 检查服务初始化状态...")
        assert hasattr(workflow, 'arbitration_service'), "ArbitrationService未初始化"
        assert hasattr(workflow, 'report_service'), "ReportService未初始化"
        print("✅ 所有服务已正确初始化")
        
        # 测试报告保存功能
        print("📊 测试报告保存功能...")
        test_report = {
            "stock_code": "000001.SZ",
            "analysis": "测试分析内容",
            "confidence": 0.85,
            "reasoning": "测试推理过程"
        }
        
        saved_result = await workflow._save_report_to_db_async(test_report, "qwen_fact_based")
        assert "report_id" in saved_result, "报告保存失败"
        print(f"✅ 报告保存成功: {saved_result['report_id']}")
        
        # 测试仲裁案件创建功能
        print("⚖️ 测试仲裁案件创建功能...")
        qwen_report = {
            "analysis": "Qwen分析：该股票基本面良好",
            "confidence": 0.8,
            "reasoning": "基于财务数据的分析"
        }
        doubao_report = {
            "sentiment": "positive",
            "score": 0.7,
            "reasoning": "市场情绪积极"
        }
        
        case_result = await workflow._create_arbitration_case_async(
            "000001.SZ", "20240101", qwen_report, doubao_report
        )
        assert "case_id" in case_result, "仲裁案件创建失败"
        print(f"✅ 仲裁案件创建成功: {case_result['case_id']}")
        
        # 验证案件是否真的被创建
        print("🔍 验证仲裁案件是否被创建...")
        created_case = await workflow.arbitration_service.get_case_by_id(case_result['case_id'])
        assert created_case is not None, "仲裁案件未找到"
        assert created_case.target_code == "000001.SZ", "股票代码不匹配"
        print("✅ 仲裁案件验证成功")
        
        # 验证报告是否真的被创建
        print("🔍 验证报告是否被创建...")
        reports = await workflow.report_service.get_reports()
        assert reports["total"] > 0, "没有找到报告"
        print(f"✅ 找到 {reports['total']} 个报告")
        
        print("\n🎉 所有集成测试通过！")
        print("📋 集成功能总结:")
        print(f"   - ArbitrationService: ✅ 已集成并测试")
        print(f"   - ReportService: ✅ 已集成并测试")
        print(f"   - 报告保存: ✅ 正常工作")
        print(f"   - 仲裁案件创建: ✅ 正常工作")
        print(f"   - 数据验证: ✅ 数据一致性正确")
        
        return True
        
    except Exception as e:
        print(f"❌ 集成测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """主函数"""
    print("🚀 开始main_workflow集成测试")
    print("=" * 50)
    
    success = await test_main_workflow_integration()
    
    print("=" * 50)
    if success:
        print("🎉 集成测试完成 - 所有功能正常！")
        sys.exit(0)
    else:
        print("❌ 集成测试失败 - 需要修复问题")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
