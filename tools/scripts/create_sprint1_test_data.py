#!/usr/bin/env python3
"""
Sprint 1 测试数据生成脚本
创建用于测试仲裁工作流的示例数据
"""

import asyncio
import asyncpg
import json
from datetime import datetime, date
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.join(os.path.dirname(__file__), '../../packages/backend/src'))

async def create_test_data():
    """创建Sprint 1测试数据"""
    
    # 数据库连接配置
    DATABASE_URL = "postgresql://postgres:password@localhost:5432/quant_navigator"
    
    try:
        # 连接数据库
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ 数据库连接成功")
        
        # 1. 创建示例报告数据
        print("📝 创建示例报告数据...")
        
        # Qwen事实归因报告
        qwen_report_query = """
        INSERT INTO generated_reports (
            stock_code, trade_date, analyzer_type, source, analysis_text, 
            confidence_score, sentiment_score, keywords, entities, summary,
            created_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING id
        """
        
        qwen_report_id = await conn.fetchval(
            qwen_report_query,
            '000001',  # 股票代码
            date.today(),  # 交易日期
            'qwen_fact_analyzer',  # 分析器类型
            'qwen_fact_based',  # 报告来源
            '''基于财务数据分析，该股票基本面表现稳定：
1. 营收增长：同比增长15%，符合预期
2. 利润率：毛利率维持在35%以上，盈利能力良好
3. 现金流：经营现金流为正，资金状况健康
4. 行业地位：在细分领域保持领先地位
5. 风险因素：市场竞争加剧，需要关注成本控制

投资建议：HOLD - 基本面稳定但缺乏强劲增长动力''',  # 分析文本
            0.85,  # 置信度
            0.3,   # 情感分数
            json.dumps(['营收增长', '利润率', '现金流', '行业地位', '成本控制']),  # 关键词
            json.dumps(['财务数据', '市场地位', '竞争环境']),  # 实体
            '基本面稳定，建议持有',  # 摘要
            datetime.now()  # 创建时间
        )
        
        print(f"✅ Qwen报告创建成功，ID: {qwen_report_id}")
        
        # 豆包舆情感知报告
        doubao_report_id = await conn.fetchval(
            qwen_report_query,
            '000001',  # 股票代码
            date.today(),  # 交易日期
            'doubao_sentiment_analyzer',  # 分析器类型
            'doubao_sentiment_based',  # 报告来源
            '''基于市场情绪和舆情分析：
1. 市场情绪：投资者情绪偏向谨慎，观望态度明显
2. 舆情分析：媒体关注度中等，负面新闻较少
3. 技术面：股价在关键支撑位附近震荡
4. 资金流向：主力资金小幅流出，散户情绪稳定
5. 外部因素：宏观经济政策影响中性

投资建议：HOLD - 市场情绪谨慎，建议等待明确信号''',  # 分析文本
            0.75,  # 置信度
            -0.2,  # 情感分数（偏负面）
            json.dumps(['市场情绪', '舆情分析', '技术面', '资金流向', '政策影响']),  # 关键词
            json.dumps(['投资者', '媒体', '主力资金', '宏观经济']),  # 实体
            '市场情绪谨慎，建议观望',  # 摘要
            datetime.now()  # 创建时间
        )
        
        print(f"✅ 豆包报告创建成功，ID: {doubao_report_id}")
        
        # 2. 创建仲裁案件
        print("⚖️ 创建仲裁案件...")
        
        arbitration_case_query = """
        INSERT INTO arbitration_cases (
            case_id, stock_code, trade_date, qwen_report_id, doubao_report_id,
            divergence_score, sentiment_diff, keyword_overlap, entity_diff,
            consensus_summary, conflict_summary,
            priority_score, company_importance, event_importance,
            status, analysis_metadata, created_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        )
        """
        
        case_id = f"ARB_000001_{date.today().strftime('%Y%m%d')}"
        
        await conn.execute(
            arbitration_case_query,
            case_id,  # 案件ID
            '000001',  # 股票代码
            date.today(),  # 交易日期
            qwen_report_id,  # Qwen报告ID
            doubao_report_id,  # 豆包报告ID
            0.65,  # 分歧度分数
            0.5,   # 情感差异
            0.4,   # 关键词重合度
            0.3,   # 实体差异
            '两家AI都认为该股票基本面稳定，建议持有观望，但关注点不同：Qwen更关注财务数据，豆包更关注市场情绪。',  # 共识摘要
            '主要分歧在于风险评估角度：Qwen基于财务数据认为风险可控，豆包基于市场情绪认为存在不确定性。',  # 争议摘要
            0.72,  # 优先级分数
            0.8,   # 公司重要性
            0.6,   # 事件重要性
            'PENDING_HUMAN',  # 状态
            json.dumps({
                'sentiment_diff': 0.5,
                'keyword_overlap': 0.4,
                'entity_diff': 0.3,
                'analysis_timestamp': datetime.now().isoformat()
            }),  # 分析元数据
            datetime.now()  # 创建时间
        )
        
        print(f"✅ 仲裁案件创建成功，ID: {case_id}")
        
        # 3. 创建更多测试案件（可选）
        print("📊 创建更多测试案件...")
        
        test_cases = [
            {
                'stock_code': '000002',
                'divergence_score': 0.45,
                'priority_score': 0.55,
                'consensus_summary': '两家AI对该公司看法基本一致，都认为存在投资机会。',
                'conflict_summary': '在具体投资时机上存在分歧：Qwen建议立即买入，豆包建议等待回调。'
            },
            {
                'stock_code': '000003',
                'divergence_score': 0.85,
                'priority_score': 0.90,
                'consensus_summary': '两家AI都认为该公司存在重大风险，需要谨慎对待。',
                'conflict_summary': '在风险来源判断上存在分歧：Qwen认为是财务风险，豆包认为是市场风险。'
            }
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            # 创建对应的报告
            qwen_id = await conn.fetchval(
                qwen_report_query,
                test_case['stock_code'],
                date.today(),
                'qwen_fact_analyzer',
                'qwen_fact_based',
                f'Qwen对{test_case["stock_code"]}的分析报告...',
                0.8,
                0.2,
                json.dumps(['财务', '风险', '机会']),
                json.dumps(['公司', '市场']),
                f'Qwen分析摘要{i}',
                datetime.now()
            )
            
            doubao_id = await conn.fetchval(
                qwen_report_query,
                test_case['stock_code'],
                date.today(),
                'doubao_sentiment_analyzer',
                'doubao_sentiment_based',
                f'豆包对{test_case["stock_code"]}的情绪分析报告...',
                0.7,
                -0.1,
                json.dumps(['情绪', '风险', '机会']),
                json.dumps(['投资者', '市场']),
                f'豆包分析摘要{i}',
                datetime.now()
            )
            
            # 创建仲裁案件
            test_case_id = f"ARB_{test_case['stock_code']}_{date.today().strftime('%Y%m%d')}"
            await conn.execute(
                arbitration_case_query,
                test_case_id,
                test_case['stock_code'],
                date.today(),
                qwen_id,
                doubao_id,
                test_case['divergence_score'],
                0.4,
                0.5,
                0.4,
                test_case['consensus_summary'],
                test_case['conflict_summary'],
                test_case['priority_score'],
                0.7,
                0.5,
                'PENDING_HUMAN',
                json.dumps({
                    'sentiment_diff': 0.4,
                    'keyword_overlap': 0.5,
                    'entity_diff': 0.4,
                    'analysis_timestamp': datetime.now().isoformat()
                }),
                datetime.now()
            )
            
            print(f"✅ 测试案件 {i} 创建成功，ID: {test_case_id}")
        
        print("\n🎉 Sprint 1 测试数据创建完成！")
        print(f"📋 创建了 {len(test_cases) + 1} 个仲裁案件")
        print(f"📝 创建了 {(len(test_cases) + 1) * 2} 个分析报告")
        print("\n🔗 可以访问以下API进行测试：")
        print("  GET /api/v1/admin/arbitration-cases - 获取案件列表")
        print(f"  GET /api/v1/admin/arbitration-cases/{case_id} - 获取案件详情")
        print(f"  POST /api/v1/admin/arbitration-cases/{case_id}/feedback - 提交仲裁判决")
        
    except Exception as e:
        print(f"❌ 创建测试数据失败: {e}")
        raise
    finally:
        if 'conn' in locals():
            await conn.close()
            print("🔌 数据库连接已关闭")

if __name__ == "__main__":
    asyncio.run(create_test_data())
