#!/usr/bin/env python3
"""
手动统计测试错误
基于之前的测试输出
"""

def main():
    print("=== 测试文件错误次数统计 ===")
    print("基于之前的测试运行结果")
    print()
    
    # 基于之前看到的错误统计
    file_errors = {
        # 高优先级 (≥15个错误)
        "StockPoolManager.test.ts": 20,
        "MyAssistant.test.ts": 17,
        "ArbitrationDecisionDialog.test.ts": 15,
        "PersonalPrecedentViewer.test.ts": 14,
        
        # 中优先级 (5-14个错误)
        "ArbitrationCaseList.test.ts": 2,
        "RawTextExplorer.test.ts": 2,
        "FlowAndChipsViewer.test.ts": 2,
        "ArbitrationToolbar.test.ts": 1,
        
        # 低优先级 (1-4个错误)
        "Home.test.ts": 1,
        "MarketRadar.test.ts": 1,
        "Login.test.ts": 1,
        "Register.test.ts": 1,
        "Layout.test.ts": 1,
        "SystemBrainConsole.test.ts": 1,
        "MyAssistant.debug.test.ts": 1,
        "SimpleComponent.test.ts": 1,
        "SimpleIsolationTest.test.ts": 1,
        "QuantSignalDashboard.test.ts": 1,
        "FinancialSnapshot.test.ts": 1,
        "DataPanelContainer.test.ts": 1,
        "ComponentRenderDebug.test.ts": 1,
        "ArbitrationDashboard.test.ts": 1,
        "ArbitrationDashboardMinimal.test.ts": 1,
        "ArbitrationDashboard.minimal.test.ts": 1,
        "arbitration-flow.test.ts": 1,
        "pinia-heart-surgery.test.ts": 1,
        "components.test.ts": 2,
    }
    
    # 按错误数量排序
    sorted_files = sorted(file_errors.items(), key=lambda x: x[1], reverse=True)
    
    print(f"总文件数: {len(file_errors)}")
    print(f"总错误数: {sum(file_errors.values())}")
    print()
    
    print("=== 按文件错误数量排序 ===")
    print(f"{'文件名':<50} {'错误数':<8} {'状态'}")
    print("-" * 70)
    
    for filename, error_count in sorted_files:
        if error_count >= 15:
            status = "🔥 高优先级"
        elif error_count >= 5:
            status = "⚠️  中优先级"
        else:
            status = "✅ 低优先级"
        
        print(f"{filename:<50} {error_count:<8} {status}")
    
    # 推荐修复顺序
    print("\n=== 推荐修复顺序 ===")
    high_priority = [f for f, c in sorted_files if c >= 15]
    medium_priority = [f for f, c in sorted_files if 5 <= c < 15]
    low_priority = [f for f, c in sorted_files if 1 <= c < 5]
    
    if high_priority:
        print(f"\n🔥 高优先级文件 ({len(high_priority)} 个):")
        for i, filename in enumerate(high_priority, 1):
            print(f"  {i}. {filename} ({file_errors[filename]} 个错误)")
    
    if medium_priority:
        print(f"\n⚠️  中优先级文件 ({len(medium_priority)} 个):")
        for i, filename in enumerate(medium_priority, 1):
            print(f"  {i}. {filename} ({file_errors[filename]} 个错误)")
    
    if low_priority:
        print(f"\n✅ 低优先级文件 ({len(low_priority)} 个):")
        for i, filename in enumerate(low_priority, 1):
            print(f"  {i}. {filename} ({file_errors[filename]} 个错误)")
    
    print("\n=== 修复建议 ===")
    print("1. 优先修复高优先级文件 (≥15个错误)")
    print("2. 然后修复中优先级文件 (5-14个错误)")
    print("3. 最后修复低优先级文件 (1-4个错误)")
    print("4. 按照您的方法：找1-2个错误的文件，找到解决方法，复制到其他文件")

if __name__ == "__main__":
    main()



