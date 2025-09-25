#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
仲裁预处理流水线脚本 - v11.9架构升级核心模块
实现双脑报告对比分析和优先级计算，为人类仲裁官提供案情摘要

作者: AI Assistant
创建时间: 2025-01-17
版本: v11.9
"""

import logging
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from support_modules.database_utils import DatabaseManager
from support_modules.utils import load_config, setup_logging
from src.analysis.report_comparator import ReportComparator, ComparisonResult


class ArbitrationPreprocessor:
    """
    仲裁预处理器 - 核心流水线引擎
    
    负责：
    1. 从数据库查询当日新生成的双脑报告对
    2. 调用ReportComparator进行对比分析
    3. 计算仲裁优先级
    4. 将分析结果写入arbitration_cases表
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        初始化仲裁预处理器
        
        Args:
            config: 配置参数
        """
        self.config = config
        self.logger = setup_logging("arbitration_preprocessor")
        
        # 初始化数据库管理器
        self.db_manager = DatabaseManager(config['database'])
        
        # 初始化报告对比器
        self.report_comparator = ReportComparator(config)
        
        # 优先级计算权重配置
        self.priority_weights = {
            'divergence': 0.5,      # 分歧度权重
            'company_importance': 0.3,  # 公司重要性权重
            'event_importance': 0.2     # 事件重要性权重
        }
        
        self.logger.info("仲裁预处理器初始化完成")
    
    def process_daily_arbitration_cases(self, trade_date: str = None) -> Dict[str, Any]:
        """
        处理每日仲裁案件 - 主入口方法
        
        Args:
            trade_date: 交易日期，格式为YYYY-MM-DD，默认为今天
            
        Returns:
            处理结果统计
        """
        if trade_date is None:
            trade_date = datetime.now().strftime('%Y-%m-%d')
        
        self.logger.info(f"=== 开始处理每日仲裁案件: {trade_date} ===")
        
        try:
            # 1. 查询当日新生成的双脑报告对
            report_pairs = self._get_daily_report_pairs(trade_date)
            
            if not report_pairs:
                self.logger.info(f"未找到{trade_date}的双脑报告对，无需处理")
                return {
                    "status": "success",
                    "trade_date": trade_date,
                    "processed_count": 0,
                    "message": "无报告对需要处理"
                }
            
            self.logger.info(f"找到{len(report_pairs)}对双脑报告需要处理")
            
            # 2. 处理每一对报告
            results = self._process_report_pairs(report_pairs, trade_date)
            
            # 3. 生成处理报告
            self._generate_processing_report(trade_date, results)
            
            return {
                "status": "success",
                "trade_date": trade_date,
                "processed_count": results["successful"],
                "failed_count": results["failed"],
                "failed_cases": results["failed_cases"]
            }
            
        except Exception as e:
            self.logger.critical(f"处理每日仲裁案件失败: {e}", exc_info=True)
            return {
                "status": "error",
                "trade_date": trade_date,
                "error": str(e)
            }
    
    def _get_daily_report_pairs(self, trade_date: str) -> List[Dict[str, Any]]:
        """
        查询当日新生成的双脑报告对
        
        Args:
            trade_date: 交易日期
            
        Returns:
            报告对列表
        """
        try:
            self.logger.info(f"查询{trade_date}的双脑报告对")
            
            # 查询当日生成的报告，按股票代码分组
            query = """
            SELECT 
                stock_code,
                source,
                id,
                content,
                summary,
                sentiment_score,
                keywords,
                entities,
                created_at
            FROM generated_reports 
            WHERE DATE(created_at) = %s 
            AND source IN ('qwen_fact_based', 'doubao_sentiment_based')
            ORDER BY stock_code, source
            """
            
            with self.db_manager.get_session() as session:
                result = session.execute(query, (trade_date,))
                reports = result.fetchall()
            
            # 按股票代码分组，确保每只股票都有Qwen和豆包两个报告
            stock_reports = {}
            for report in reports:
                stock_code = report[0]
                source = report[1]
                
                if stock_code not in stock_reports:
                    stock_reports[stock_code] = {}
                
                stock_reports[stock_code][source] = {
                    'id': report[2],
                    'content': report[3],
                    'summary': report[4],
                    'sentiment_score': report[5],
                    'keywords': json.loads(report[6]) if report[6] else [],
                    'entities': json.loads(report[7]) if report[7] else [],
                    'created_at': report[8]
                }
            
            # 构建报告对
            report_pairs = []
            for stock_code, reports in stock_reports.items():
                if 'qwen_fact_based' in reports and 'doubao_sentiment_based' in reports:
                    report_pairs.append({
                        'stock_code': stock_code,
                        'qwen_report': reports['qwen_fact_based'],
                        'doubao_report': reports['doubao_sentiment_based']
                    })
                else:
                    self.logger.warning(f"股票{stock_code}缺少完整的双脑报告")
            
            self.logger.info(f"成功构建{len(report_pairs)}对双脑报告")
            return report_pairs
            
        except Exception as e:
            self.logger.error(f"查询双脑报告对失败: {e}", exc_info=True)
            return []
    
    def _process_report_pairs(self, report_pairs: List[Dict[str, Any]], trade_date: str) -> Dict[str, Any]:
        """
        处理报告对列表
        
        Args:
            report_pairs: 报告对列表
            trade_date: 交易日期
            
        Returns:
            处理结果统计
        """
        successful = 0
        failed = 0
        failed_cases = []
        
        for pair in report_pairs:
            try:
                self.logger.info(f"处理股票{pair['stock_code']}的双脑报告对比")
                
                # 1. 进行报告对比分析
                comparison_result = self.report_comparator.compare_reports(
                    pair['qwen_report'], 
                    pair['doubao_report']
                )
                
                # 2. 计算仲裁优先级
                priority_score = self._calculate_arbitration_priority(
                    pair['stock_code'], 
                    comparison_result
                )
                
                # 3. 创建仲裁案件记录
                arbitration_case = {
                    'case_id': f"ARB_{pair['stock_code']}_{trade_date.replace('-', '')}",
                    'stock_code': pair['stock_code'],
                    'trade_date': trade_date,
                    'qwen_report_id': pair['qwen_report']['id'],
                    'doubao_report_id': pair['doubao_report']['id'],
                    'divergence_score': comparison_result.divergence_score,
                    'consensus_summary': comparison_result.consensus_summary,
                    'conflict_summary': comparison_result.conflict_summary,
                    'priority_score': priority_score,
                    'status': 'PENDING_HUMAN',
                    'created_at': datetime.now().isoformat(),
                    'analysis_metadata': {
                        'sentiment_diff': comparison_result.sentiment_diff,
                        'keyword_overlap': comparison_result.keyword_overlap,
                        'entity_diff': comparison_result.entity_diff,
                        'analysis_timestamp': comparison_result.analysis_timestamp
                    }
                }
                
                # 4. 保存到数据库
                self._save_arbitration_case(arbitration_case)
                
                self.logger.info(f"成功处理股票{pair['stock_code']}，优先级: {priority_score:.3f}")
                successful += 1
                
            except Exception as e:
                self.logger.error(f"处理股票{pair['stock_code']}失败: {e}", exc_info=True)
                failed_cases.append({
                    'stock_code': pair['stock_code'],
                    'error': str(e)
                })
                failed += 1
                continue
        
        return {
            "successful": successful,
            "failed": failed,
            "failed_cases": failed_cases
        }
    
    def _calculate_arbitration_priority(self, stock_code: str, comparison_result: ComparisonResult) -> float:
        """
        计算仲裁优先级
        
        Args:
            stock_code: 股票代码
            comparison_result: 报告对比结果
            
        Returns:
            优先级分数 (0-1)
        """
        try:
            # 1. 分歧度分数 (0-1)
            divergence_score = comparison_result.divergence_score
            
            # 2. 公司重要性分数 (0-1)
            company_importance = self._calculate_company_importance(stock_code)
            
            # 3. 事件重要性分数 (0-1)
            event_importance = self._calculate_event_importance(comparison_result)
            
            # 4. 加权计算最终优先级
            priority_score = (
                self.priority_weights['divergence'] * divergence_score +
                self.priority_weights['company_importance'] * company_importance +
                self.priority_weights['event_importance'] * event_importance
            )
            
            # 确保分数在0-1范围内
            priority_score = max(0.0, min(1.0, priority_score))
            
            self.logger.debug(f"股票{stock_code}优先级计算: 分歧度={divergence_score:.3f}, "
                            f"公司重要性={company_importance:.3f}, 事件重要性={event_importance:.3f}, "
                            f"最终优先级={priority_score:.3f}")
            
            return priority_score
            
        except Exception as e:
            self.logger.error(f"计算仲裁优先级失败: {e}")
            return 0.5  # 默认中等优先级
    
    def _calculate_company_importance(self, stock_code: str) -> float:
        """
        计算公司重要性分数
        
        Args:
            stock_code: 股票代码
            
        Returns:
            公司重要性分数 (0-1)
        """
        try:
            # 这里可以根据实际需求实现更复杂的公司重要性计算
            # 例如：市值、行业地位、历史表现等
            
            # 简单的实现：根据股票代码特征判断
            if stock_code.startswith('000') or stock_code.startswith('002'):
                return 0.8  # 主板股票，重要性较高
            elif stock_code.startswith('300'):
                return 0.6  # 创业板股票
            elif stock_code.startswith('688'):
                return 0.7  # 科创板股票
            else:
                return 0.5  # 其他股票，中等重要性
                
        except Exception as e:
            self.logger.error(f"计算公司重要性失败: {e}")
            return 0.5
    
    def _calculate_event_importance(self, comparison_result: ComparisonResult) -> float:
        """
        计算事件重要性分数
        
        Args:
            comparison_result: 报告对比结果
            
        Returns:
            事件重要性分数 (0-1)
        """
        try:
            # 基于分歧度、情感差异等指标计算事件重要性
            importance_factors = []
            
            # 分歧度越高，事件越重要
            importance_factors.append(comparison_result.divergence_score)
            
            # 情感差异越大，事件越重要
            importance_factors.append(comparison_result.sentiment_diff)
            
            # 实体差异越大，事件越重要
            importance_factors.append(comparison_result.entity_diff)
            
            # 取平均值作为事件重要性
            event_importance = sum(importance_factors) / len(importance_factors)
            
            return event_importance
            
        except Exception as e:
            self.logger.error(f"计算事件重要性失败: {e}")
            return 0.5
    
    def _save_arbitration_case(self, arbitration_case: Dict[str, Any]) -> None:
        """
        保存仲裁案件到数据库
        
        Args:
            arbitration_case: 仲裁案件数据
        """
        try:
            query = """
            INSERT INTO arbitration_cases (
                case_id, stock_code, trade_date, qwen_report_id, doubao_report_id,
                divergence_score, consensus_summary, conflict_summary, priority_score,
                status, created_at, analysis_metadata
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            ON CONFLICT (case_id) DO UPDATE SET
                divergence_score = EXCLUDED.divergence_score,
                consensus_summary = EXCLUDED.consensus_summary,
                conflict_summary = EXCLUDED.conflict_summary,
                priority_score = EXCLUDED.priority_score,
                analysis_metadata = EXCLUDED.analysis_metadata,
                updated_at = CURRENT_TIMESTAMP
            """
            
            with self.db_manager.get_session() as session:
                session.execute(query, (
                    arbitration_case['case_id'],
                    arbitration_case['stock_code'],
                    arbitration_case['trade_date'],
                    arbitration_case['qwen_report_id'],
                    arbitration_case['doubao_report_id'],
                    arbitration_case['divergence_score'],
                    arbitration_case['consensus_summary'],
                    arbitration_case['conflict_summary'],
                    arbitration_case['priority_score'],
                    arbitration_case['status'],
                    arbitration_case['created_at'],
                    json.dumps(arbitration_case['analysis_metadata'])
                ))
                session.commit()
            
            self.logger.info(f"成功保存仲裁案件: {arbitration_case['case_id']}")
            
        except Exception as e:
            self.logger.error(f"保存仲裁案件失败: {e}", exc_info=True)
            raise
    
    def _generate_processing_report(self, trade_date: str, results: Dict[str, Any]) -> None:
        """
        生成处理报告
        
        Args:
            trade_date: 交易日期
            results: 处理结果
        """
        self.logger.info("=== 仲裁预处理执行报告 ===")
        self.logger.info(f"处理日期: {trade_date}")
        self.logger.info(f"成功处理: {results['successful']} 个案件")
        self.logger.info(f"处理失败: {results['failed']} 个案件")
        
        if results['failed_cases']:
            self.logger.warning("失败案件详情:")
            for case in results['failed_cases']:
                self.logger.warning(f"  - 股票{case['stock_code']}: {case['error']}")
        
        self.logger.info("=== 仲裁预处理执行完成 ===")


def main():
    """
    主函数入口
    """
    try:
        # 加载配置
        config = load_config("config/main_config.json")
        
        # 获取命令行参数
        trade_date = None
        if len(sys.argv) > 1:
            trade_date = sys.argv[1]
        
        # 创建并运行仲裁预处理器
        preprocessor = ArbitrationPreprocessor(config)
        result = preprocessor.process_daily_arbitration_cases(trade_date)
        
        print(f"仲裁预处理执行完成: {result}")
        
    except Exception as e:
        print(f"仲裁预处理执行失败: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
