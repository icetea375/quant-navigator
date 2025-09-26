#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
量化导航仪 - 主工作流脚本 (v11.9 "智能仲裁预处理"架构升级版)
双脑并行分析 + AI预处理 + 人类仲裁决策架构

作者: AI Assistant
创建时间: 2025-01-17
版本: v11.9
"""

import sys
from datetime import datetime
from typing import List, Dict, Any
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.append(str(project_root))

# 导入支持模块
from support_modules.data_pipeline import DataPipeline
from support_modules.quant_signal_engine import QuantSignalEngine
from support_modules.database_utils import DatabaseManager
from support_modules.utils import load_config, setup_logging

# 导入双脑分析器
from qwen_analyzer import QwenFactAnalyzer
from doubao_analyzer import DoubaoSentimentAnalyzer

# 导入v11.9新增的仲裁预处理模块
from scripts.run_arbitration_preprocess import ArbitrationPreprocessor


class MainWorkflow:
    """
    主工作流类 - v11.9智能仲裁预处理架构
    采用Qwen事实归因流 + 豆包舆情感知流的并行分析模式
    新增AI预处理模块，为人类仲裁官提供高质量案情摘要
    """

    def __init__(self, config_path: str = "config/main_config.json"):
        """
        初始化主工作流

        Args:
            config_path: 配置文件路径
        """
        self.config = load_config(config_path)
        self.logger = setup_logging("main_workflow")

        # 初始化数据库管理器
        self.db_manager = DatabaseManager(self.config["database"])

        # 初始化核心模块
        self.data_pipeline = DataPipeline(self.config["data_pipeline"])
        self.quant_engine = QuantSignalEngine(self.config["quant_engine"])

        # 初始化双脑分析器
        self.qwen_analyzer = QwenFactAnalyzer(self.config)
        self.doubao_analyzer = DoubaoSentimentAnalyzer(self.config)

        # 初始化v11.9新增的仲裁预处理器
        self.arbitration_preprocessor = ArbitrationPreprocessor(self.config)

        self.logger.info("v11.9智能仲裁预处理主工作流初始化完成")

    def run_daily_flow(self, trade_date: str = None) -> Dict[str, Any]:
        """
        执行每日的、事件驱动的在线分析流程

        Args:
            trade_date: 交易日期，格式为YYYY-MM-DD，默认为今天

        Returns:
            执行结果统计
        """
        if trade_date is None:
            trade_date = datetime.now().strftime("%Y-%m-%d")

        self.logger.info(f"=== 开始执行每日工作流: {trade_date} ===")

        try:
            # 1. 数据融合与特征工程
            self.logger.info("步骤1: 执行数据融合与特征工程...")
            self._execute_data_fusion(trade_date)

            # 2. 异常事件检测
            self.logger.info("步骤2: 执行异常事件检测...")
            anomaly_stocks = self._detect_anomalies(trade_date)

            if not anomaly_stocks:
                self.logger.info("未检测到显著异常，工作流结束")
                return {"status": "success", "anomaly_count": 0}

            self.logger.info(f"检测到 {len(anomaly_stocks)} 只异常股票需要处理")

            # 3. 对每个异常股票执行深度分析
            results = self._process_anomaly_stocks(anomaly_stocks, trade_date)

            # 4. 【v11.9新增】执行仲裁预处理 - AI总结和优先级计算
            self.logger.info("步骤4: 执行仲裁预处理...")
            arbitration_results = self._execute_arbitration_preprocessing(trade_date)

            # 5. 生成执行报告
            self._generate_execution_report(
                trade_date, anomaly_stocks, results, arbitration_results
            )

            return {
                "status": "success",
                "trade_date": trade_date,
                "anomaly_count": len(anomaly_stocks),
                "processed_count": results["successful"],
                "failed_count": results["failed"],
                "failed_stocks": results["failed_stocks"],
                "arbitration_cases_processed": arbitration_results.get(
                    "processed_count", 0
                ),
                "arbitration_cases_failed": arbitration_results.get("failed_count", 0),
            }

        except Exception as e:
            self.logger.critical(f"工作流执行过程中发生严重错误: {e}", exc_info=True)
            # 这里可以添加告警通知逻辑
            raise

    def _execute_data_fusion(self, trade_date: str) -> None:
        """
        执行数据融合与特征工程

        Args:
            trade_date: 交易日期
        """
        try:
            # 更新日度数据
            self.data_pipeline.update_daily_data(trade_date)

            # 计算量化信号
            self.quant_engine.calculate_daily_signals(trade_date)

            self.logger.info("数据融合与特征工程完成")

        except Exception as e:
            self.logger.error(f"数据融合与特征工程失败: {e}", exc_info=True)
            raise

    def _detect_anomalies(self, trade_date: str) -> List[str]:
        """
        检测异常事件

        Args:
            trade_date: 交易日期

        Returns:
            异常股票代码列表
        """
        try:
            anomaly_stocks = self.quant_engine.detect_anomalies(
                trade_date, self.config["anomaly_thresholds"]
            )
            return anomaly_stocks

        except Exception as e:
            self.logger.error(f"异常检测失败: {e}", exc_info=True)
            raise

    def _process_anomaly_stocks(
        self, anomaly_stocks: List[str], trade_date: str
    ) -> Dict[str, Any]:
        """
        处理异常股票 - 双脑并行分析

        Args:
            anomaly_stocks: 异常股票代码列表
            trade_date: 交易日期

        Returns:
            处理结果统计
        """
        successful = 0
        failed = 0
        failed_stocks = []

        for stock_code in anomaly_stocks:
            try:
                self.logger.info(f"--- 启动双脑并行分析: {stock_code} ---")

                # 【核心变更】启动并行分析
                # 现实中可以用多线程、多进程或异步IO实现
                # 这里用串行模拟，但逻辑上是并行的

                # 流程A: Qwen进行事实归因
                self.logger.info(f"流程A: Qwen事实归因分析 - {stock_code}")
                qwen_report = self.qwen_analyzer.analyze(stock_code, trade_date)
                self._save_report_to_db(qwen_report, source="qwen_fact_based")

                # 流程B: 豆包进行舆情感知
                self.logger.info(f"流程B: 豆包舆情感知分析 - {stock_code}")
                doubao_report = self.doubao_analyzer.analyze(stock_code, trade_date)
                self._save_report_to_db(doubao_report, source="doubao_sentiment_based")

                # 【v11.9变更】不再直接创建仲裁案件，而是等待预处理步骤统一处理
                self.logger.info(f"双脑报告已生成，等待仲裁预处理: {stock_code}")

                self.logger.info(f"成功生成双脑报告: {stock_code}")
                successful += 1

            except Exception as e:
                # 单只股票失败，记录错误并继续
                self.logger.error(f"处理股票 {stock_code} 失败: {e}", exc_info=True)
                failed_stocks.append(stock_code)
                failed += 1
                continue

        return {
            "successful": successful,
            "failed": failed,
            "failed_stocks": failed_stocks,
        }

    def _save_report_to_db(self, report: Dict[str, Any], source: str) -> None:
        """
        保存报告到数据库

        Args:
            report: 报告数据
            source: 报告来源 ('qwen_fact_based' 或 'doubao_sentiment_based')
        """
        try:
            # 添加source字段
            report["source"] = source
            report["created_at"] = datetime.now().isoformat()

            # 【v11.9新增】确保报告包含必要的字段用于预处理
            if "sentiment_score" not in report:
                report["sentiment_score"] = 0.0
            if "keywords" not in report:
                report["keywords"] = []
            if "entities" not in report:
                report["entities"] = []
            if "summary" not in report:
                report["summary"] = report.get("content", "")[
                    :500
                ]  # 使用内容前500字符作为摘要

            # 保存到generated_reports表
            self.db_manager.save_generated_report(report)
            self.logger.info(f"已保存{source}报告: {report.get('id', 'unknown')}")

        except Exception as e:
            self.logger.error(f"保存{source}报告失败: {e}", exc_info=True)
            raise

    def _execute_arbitration_preprocessing(self, trade_date: str) -> Dict[str, Any]:
        """
        【v11.9新增】执行仲裁预处理 - AI总结和优先级计算

        Args:
            trade_date: 交易日期

        Returns:
            预处理结果统计
        """
        try:
            self.logger.info(f"开始执行仲裁预处理: {trade_date}")

            # 调用仲裁预处理器处理当日案件
            result = self.arbitration_preprocessor.process_daily_arbitration_cases(
                trade_date
            )

            if result["status"] == "success":
                self.logger.info(
                    f"仲裁预处理完成: 处理了{result.get('processed_count', 0)}个案件"
                )
            else:
                self.logger.error(f"仲裁预处理失败: {result.get('error', '未知错误')}")

            return result

        except Exception as e:
            self.logger.error(f"执行仲裁预处理失败: {e}", exc_info=True)
            return {
                "status": "error",
                "processed_count": 0,
                "failed_count": 0,
                "error": str(e),
            }

    def _needs_human_review(self, results: Dict[str, Any]) -> bool:
        """
        判断是否需要人工仲裁

        Args:
            results: 分析结果

        Returns:
            是否需要人工仲裁
        """
        try:
            # 检查AI内部分歧
            if results.get("prediction", {}).get("ai_disagreement_score", 0) > 0.7:
                return True

            # 检查风险等级
            if results.get("prediction", {}).get("risk_level", "LOW") in [
                "HIGH",
                "CRITICAL",
            ]:
                return True

            # 检查置信度
            if results.get("prediction", {}).get("confidence_score", 1.0) < 0.6:
                return True

            return False

        except Exception as e:
            self.logger.error(f"判断是否需要人工仲裁失败: {e}", exc_info=True)
            return True  # 出错时默认需要人工仲裁

    def _generate_execution_report(
        self,
        trade_date: str,
        anomaly_stocks: List[str],
        results: Dict[str, Any],
        arbitration_results: Dict[str, Any],
    ) -> None:
        """
        生成执行报告

        Args:
            trade_date: 交易日期
            anomaly_stocks: 异常股票列表
            results: 处理结果
            arbitration_results: 仲裁预处理结果
        """
        self.logger.info("=== v11.9每日工作流执行报告 ===")
        self.logger.info(f"交易日期: {trade_date}")
        self.logger.info(f"异常股票总数: {len(anomaly_stocks)}")
        self.logger.info(f"双脑分析成功: {results['successful']}")
        self.logger.info(f"双脑分析失败: {results['failed']}")
        if results["failed_stocks"]:
            self.logger.info(f"失败股票: {', '.join(results['failed_stocks'])}")

        # 【v11.9新增】仲裁预处理统计
        self.logger.info("--- 仲裁预处理统计 ---")
        if arbitration_results["status"] == "success":
            self.logger.info(
                f"仲裁案件处理成功: {arbitration_results.get('processed_count', 0)}"
            )
            self.logger.info(
                f"仲裁案件处理失败: {arbitration_results.get('failed_count', 0)}"
            )
        else:
            self.logger.error(
                f"仲裁预处理失败: {arbitration_results.get('error', '未知错误')}"
            )

        self.logger.info("=== v11.9每日工作流执行完成 ===")


def main():
    """
    主函数入口
    """
    try:
        # 获取命令行参数或使用默认值
        trade_date = None
        if len(sys.argv) > 1:
            trade_date = sys.argv[1]

        # 创建并运行工作流
        workflow = MainWorkflow()
        result = workflow.run_daily_flow(trade_date)

        print(f"工作流执行完成: {result}")

    except Exception as e:
        print(f"工作流执行失败: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
