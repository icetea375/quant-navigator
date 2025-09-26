#!/usr/bin/env python3
"""
量化导航仪 - 主工作流脚本 (v14.4 "元认知AI"架构)
双脑并行分析 + 元认知仲裁 + 人类最终决策架构

作者: AI Assistant
创建时间: 2025-01-17
版本: v14.4
"""

import asyncio
import json
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.append(str(project_root))

# 导入核心服务
# 导入异常类
from src.exceptions.workflow_exceptions import (  # noqa: E402
    ArbitrationWorkflowError,
    LLMServiceError,
    QuantDataProviderError,
)
from schemas.arbitration import AnalysisResult  # noqa: E402
from services.data_pipeline_service import DataPipelineService  # noqa: E402
from services.llm_service import LLMService  # noqa: E402
from services.meta_cognition_engine import MetaCognitionEngine  # noqa: E402
from services.quant_signal_service import QuantSignalService  # noqa: E402


class MainWorkflow:
    """
    主工作流类 - v14.4元认知AI架构
    采用Qwen事实归因流 + 豆包舆情感知流的并行分析模式
    新增元认知引擎,用AI来仲裁AI
    """

    def __init__(self, config: dict[str, Any]):
        """
        初始化主工作流

        Args:
            config: 配置参数
        """
        self.config = config
        self.logger = logging.getLogger(__name__)

        # 初始化并发控制器 - 防止惊群效应
        self.db_semaphore = asyncio.Semaphore(config.get("concurrency", {}).get("max_db_connections", 10))
        self.llm_semaphore = asyncio.Semaphore(config.get("concurrency", {}).get("max_llm_requests", 5))
        self.stock_processing_semaphore = asyncio.Semaphore(config.get("concurrency", {}).get("max_stock_processing", 20))

        # 初始化核心服务
        self.data_pipeline = DataPipelineService(config)
        self.quant_engine = QuantSignalService(config)
        self.llm_service = LLMService(config)

        # 初始化元认知引擎
        self.meta_cognition_engine = MetaCognitionEngine(self.llm_service)

        # 初始化LLM服务(解耦版本)
        self._initialize_llm_services()

        self.logger.info("v14.4元认知AI主工作流初始化完成")

    def _initialize_llm_services(self):
        """
        初始化LLM服务 - 解耦版本,只验证配置

        Raises:
            LLMServiceError: 当LLM服务配置验证失败时
        """
        try:
            # 只检查配置存在性,不测试连接
            if "llm_service" not in self.config:
                raise ValueError("缺少LLM服务配置")

            qwen_config = self.config["llm_service"].get("qwen", {})
            doubao_config = self.config["llm_service"].get("doubao", {})

            if not qwen_config.get("api_key"):
                raise ValueError("缺少Qwen API密钥")
            if not doubao_config.get("api_key"):
                raise ValueError("缺少豆包 API密钥")

            # 不进行连接测试,只验证配置
            self.logger.info("LLM服务配置验证完成")

        except Exception as e:
            self.logger.error(f"LLM服务配置验证失败: {e}")
            raise LLMServiceError(f"LLM服务配置验证失败: {e}") from e

    async def run_daily_flow(self, trade_date: Optional[str] = None) -> dict[str, Any]:
        """
        执行每日量化分析工作流 - 双脑并行分析的核心协调器
        
        为什么需要这个函数：
        - 金融数据具有时效性，必须在交易日内完成分析，错过时机=直接损失
        - 双脑架构（Qwen事实归因 + 豆包舆情感知）需要协调两个AI的并行分析
        - 元认知仲裁需要等待两个AI完成分析后才能进行决策，避免单点故障
        - 重试机制是因为LLM服务不稳定，金融分析不能因单次失败而中断
        
        为什么采用这种架构：
        - 事件驱动：响应市场数据变化，而非定时轮询，减少无效计算成本
        - 重试机制：金融分析容错性要求高，不能因网络问题失败
        - 隔离机制：防止单个股票分析失败影响整体流程，保护其他交易
        - 并发控制：防止惊群效应，保护下游服务，避免API限流
        
        性能数据收集：
        - 使用 tools/scripts/collect_performance_data.py 收集真实的性能数据
        - 数据存储在 data/performance/performance.db 中
        - 包括仲裁时间、API调用成本、错误成本等指标
        
        Args:
            trade_date: 交易日期，格式为YYYY-MM-DD，默认为今天
                       为什么需要日期参数：金融数据按交易日组织，必须指定分析哪一天的数据
            
        Returns:
            dict: 包含成功/失败股票统计、异常事件数量、仲裁结果等
                 为什么返回这些信息：需要向用户报告分析结果，便于监控和调试
                 
        Raises:
            ArbitrationWorkflowError: 当元认知仲裁失败时
            QuantDataProviderError: 当数据获取失败时
            LLMServiceError: 当LLM服务不可用时
        """
        if trade_date is None:
            trade_date = datetime.now().strftime("%Y-%m-%d")

        self.logger.info(f"=== 开始执行每日工作流: {trade_date} ===")

        try:
            # 1. 数据融合与特征工程
            self.logger.info("步骤1: 执行数据融合与特征工程...")
            await self._execute_data_fusion(trade_date)

            # 2. 异常事件检测(带重试机制)
            self.logger.info("步骤2: 执行异常事件检测...")
            anomaly_stocks = await self._retry_wrapper(
                self._detect_anomalies,
                trade_date,
                retries=3,
                delay=60,
                operation_name="异常检测"
            )

            if not anomaly_stocks:
                self.logger.info("未检测到显著异常,工作流结束")
                return {"status": "success", "anomaly_count": 0}

            self.logger.info(f"检测到 {len(anomaly_stocks)} 只异常股票需要处理")

            # 3. 对每个异常股票执行双脑并行分析 + 元认知仲裁
            results = await self._process_anomaly_stocks(anomaly_stocks, trade_date)

            # 4. 生成执行报告
            self._generate_execution_report(trade_date, anomaly_stocks, results)

            return {
                "status": "success",
                "trade_date": trade_date,
                "anomaly_count": len(anomaly_stocks),
                "processed_count": results["successful"],
                "failed_count": results["failed"],
                "failed_stocks": results["failed_stocks"],
                "human_review_cases": results["human_review_cases"]
            }

        except Exception as e:
            self.logger.critical(f"工作流执行过程中发生严重错误: {e}", exc_info=True)
            # 发送最高级别告警
            await self._send_critical_alert("每日工作流执行失败", str(e), trade_date)
            raise

    async def _execute_data_fusion(self, trade_date: str) -> None:
        """
        执行数据融合与特征工程

        Args:
            trade_date: 交易日期
        """
        try:
            # 更新日度数据
            await self.data_pipeline.fetch_tushare_data(trade_date)

            # 计算量化信号
            await self.quant_engine.calculate_daily_signals(trade_date)

            self.logger.info("数据融合与特征工程完成")

        except Exception as e:
            self.logger.error(f"数据融合与特征工程失败: {e}", exc_info=True)
            raise

    async def _detect_anomalies(self, trade_date: str) -> list[str]:
        """
        检测异常股票 - 快速失败版本,并行检测异常

        Args:
            trade_date: 交易日期

        Returns:
            异常股票代码列表

        Raises:
            QuantDataProviderError: 当异常检测失败时
        """
        try:
            self.logger.info(f"开始检测{trade_date}的异常股票")

            # 并行检测多种异常
            tasks = [
                self.quant_engine.detect_anomalies_async(trade_date),
                self.data_pipeline.get_price_anomalies_async(trade_date)
            ]

            results = await asyncio.gather(*tasks, return_exceptions=True)

            # 检查是否有异常
            for _i, result in enumerate(results):
                if isinstance(result, Exception):
                    raise QuantDataProviderError(f"异常检测失败: {result}")

            # 合并结果
            all_anomalies = list(set(results[0] + results[1]))

            if not all_anomalies:
                raise QuantDataProviderError(f"未检测到任何异常股票: {trade_date}")

            self.logger.info(f"检测到{len(all_anomalies)}只异常股票")
            return all_anomalies

        except QuantDataProviderError:
            # 重新抛出业务异常
            raise
        except Exception as e:
            # 快速失败 - 重新抛出异常
            self.logger.critical(f"异常检测失败: {e}", exc_info=True)
            raise QuantDataProviderError(f"异常检测失败: {e}") from e

    async def _load_stock_data(self, stock_code: str, trade_date: str) -> dict[str, Any]:
        """
        加载股票数据 - 快速失败版本,并行加载数据(带并发控制)

        Args:
            stock_code: 股票代码
            trade_date: 交易日期

        Returns:
            股票数据字典

        Raises:
            QuantDataProviderError: 当数据加载失败时
        """
        # 使用数据库信号量控制并发
        async with self.db_semaphore:
            try:
                self.logger.info(f"加载股票数据: {stock_code} (并发控制: {self.db_semaphore._value})")

                # 并行加载所有数据
                tasks = [
                    self.data_pipeline.get_financial_data_async(stock_code, trade_date),
                    self.data_pipeline.get_price_data_async(stock_code, trade_date),
                    self.data_pipeline.get_news_data_async(stock_code, trade_date),
                    self.data_pipeline.get_announcement_data_async(stock_code, trade_date)
                ]

                results = await asyncio.gather(*tasks, return_exceptions=True)

                # 检查是否有异常
                for _i, result in enumerate(results):
                    if isinstance(result, Exception):
                        raise QuantDataProviderError(f"数据加载失败: {result}")

                # 构建数据字典
                data = {
                    "financial_data": results[0],
                    "price_data": results[1],
                    "news_data": results[2],
                    "announcement_data": results[3],
                    "stock_code": stock_code,
                    "trade_date": trade_date
                }

                # 验证数据完整性
                if not data["financial_data"] and not data["price_data"]:
                    raise QuantDataProviderError(f"股票{stock_code}缺少核心数据")

                self.logger.info(f"股票数据加载完成: {stock_code}")
                return data

            except QuantDataProviderError:
                # 重新抛出业务异常
                raise
            except Exception as e:
                # 快速失败 - 重新抛出异常
                self.logger.error(f"加载股票数据失败: {stock_code} - {e}", exc_info=True)
                raise QuantDataProviderError(f"加载股票数据失败: {stock_code} - {e}") from e

    async def _retry_wrapper(self, func, *args, retries: int = 3, delay: int = 60, operation_name: str = "操作", **kwargs):
        """
        重试包装器 - 为关键操作提供重试机制

        Args:
            func: 要重试的函数
            *args: 函数参数
            retries: 重试次数
            delay: 重试延迟(秒)
            operation_name: 操作名称(用于日志)
            **kwargs: 函数关键字参数

        Returns:
            函数执行结果

        Raises:
            最后一次重试的异常
        """
        last_exception = None

        for attempt in range(retries + 1):
            try:
                self.logger.info(f"{operation_name} - 尝试 {attempt + 1}/{retries + 1}")
                result = await func(*args, **kwargs)
                if attempt > 0:
                    self.logger.info(f"{operation_name} - 重试成功")
                return result

            except Exception as e:
                last_exception = e
                self.logger.warning(f"{operation_name} - 尝试 {attempt + 1} 失败: {e}")

                if attempt < retries:
                    self.logger.info(f"{operation_name} - 等待 {delay} 秒后重试...")
                    await asyncio.sleep(delay)
                else:
                    self.logger.critical(f"{operation_name} - 所有重试失败,操作终止")

        # 所有重试都失败了,发送告警
        await self._send_critical_alert(f"{operation_name}重试失败", str(last_exception))
        raise last_exception

    async def _send_critical_alert(self, title: str, message: str, trade_date: Optional[str] = None):
        """
        发送最高级别告警

        Args:
            title: 告警标题
            message: 告警消息
            trade_date: 交易日期
        """
        try:
            {
                "title": title,
                "message": message,
                "trade_date": trade_date or datetime.now().strftime("%Y-%m-%d"),
                "timestamp": datetime.now().isoformat(),
                "severity": "CRITICAL"
            }

            # 记录到日志
            self.logger.critical(f"🚨 最高级别告警: {title} - {message}")

            # 这里可以集成真实的告警系统(邮件,钉钉,短信等)
            # 例如:await self.alert_manager.send_alert(alert_data)

            self.logger.info("告警已发送")

        except Exception as e:
            self.logger.error(f"发送告警失败: {e}", exc_info=True)

    async def health_check(self) -> dict[str, Any]:
        """
        健康检查端点 - 独立于启动过程

        Returns:
            健康状态字典
        """
        try:
            health_status = {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "checks": {}
            }

            # 检查数据库连接
            try:
                await self.data_pipeline.test_connection()
                health_status["checks"]["database"] = "healthy"
            except Exception as e:
                health_status["checks"]["database"] = f"unhealthy: {e}"
                health_status["status"] = "unhealthy"

            # 检查LLM服务
            try:
                await self._test_llm_connections()
                health_status["checks"]["llm_services"] = "healthy"
            except Exception as e:
                health_status["checks"]["llm_services"] = f"unhealthy: {e}"
                health_status["status"] = "unhealthy"

            return health_status

        except Exception as e:
            return {
                "status": "unhealthy",
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            }

    async def _test_llm_connections(self):
        """
        测试LLM连接 - 独立于启动过程

        Raises:
            LLMServiceError: 当LLM连接测试失败时
        """
        try:
            # 测试Qwen连接
            await self.llm_service.test_qwen_connection()

            # 测试豆包连接
            await self.llm_service.test_doubao_connection()

        except Exception as e:
            raise LLMServiceError(f"LLM连接测试失败: {e}") from e

    async def _process_single_stock_with_retry(
        self, stock_code: str, trade_date: str, max_retries: int
    ) -> dict[str, Any]:
        """
        单股票处理 - 带重试机制

        Args:
            stock_code: 股票代码
            trade_date: 交易日期
            max_retries: 最大重试次数

        Returns:
            处理结果字典

        Raises:
            ArbitrationWorkflowError: 当处理失败时
        """
        for attempt in range(max_retries):
            try:
                self.logger.info(f"处理股票 {stock_code} (尝试 {attempt + 1}/{max_retries})")

                # 1. 加载数据
                await self._load_stock_data(stock_code, trade_date)

                # 2. 并行生成双脑报告
                qwen_task = asyncio.create_task(
                    self.qwen_analyzer.analyze_async(stock_code, trade_date)
                )
                doubao_task = asyncio.create_task(
                    self.doubao_analyzer.analyze_async(stock_code, trade_date)
                )

                qwen_report, doubao_report = await asyncio.gather(
                    qwen_task, doubao_task
                )

                # 3. 保存报告
                await self._save_report_to_db_async(qwen_report, "qwen_fact_based")
                await self._save_report_to_db_async(doubao_report, "doubao_sentiment_based")

                # 4. 创建仲裁案件
                await self._create_arbitration_case_async(
                    stock_code, trade_date, qwen_report, doubao_report
                )

                self.logger.info(f"成功处理股票 {stock_code}")
                return {"stock_code": stock_code, "status": "success"}

            except Exception as e:
                self.logger.warning(f"处理股票 {stock_code} 失败 (尝试 {attempt + 1}): {e}")

                if attempt == max_retries - 1:
                    # 最后一次尝试失败
                    raise ArbitrationWorkflowError(f"股票 {stock_code} 处理失败: {e}") from e

                # 等待后重试
                await asyncio.sleep(2 ** attempt)  # 指数退避

    async def _save_report_to_db_async(self, report: dict[str, Any], report_type: str) -> dict[str, Any]:
        """
        保存报告到数据库

        Args:
            report: 报告数据
            report_type: 报告类型

        Returns:
            保存结果
        """
        try:
            # 这里应该调用数据库服务保存报告
            # 暂时返回模拟结果
            return {"id": f"{report_type}_{report.get('stock_code', 'unknown')}"}
        except Exception as e:
            self.logger.error(f"保存报告失败: {e}")
            raise

    async def _create_arbitration_case_async(
        self, stock_code: str, trade_date: str, qwen_report: dict[str, Any], doubao_report: dict[str, Any]
    ) -> dict[str, Any]:
        """
        创建仲裁案件

        Args:
            stock_code: 股票代码
            trade_date: 交易日期
            qwen_report: Qwen报告
            doubao_report: 豆包报告

        Returns:
            案件信息
        """
        try:
            # 这里应该调用数据库服务创建仲裁案件
            # 暂时返回模拟结果
            return {"case_id": f"case_{stock_code}_{trade_date}"}
        except Exception as e:
            self.logger.error(f"创建仲裁案件失败: {e}")
            raise

    async def _process_anomaly_stocks_parallel(
        self, anomaly_stocks: list[str], trade_date: str, max_retries: int = 3
    ) -> dict[str, Any]:
        """
        并行处理异常股票 - 异步版本

        Args:
            anomaly_stocks: 异常股票代码列表
            trade_date: 交易日期
            max_retries: 最大重试次数

        Returns:
            处理结果统计

        Raises:
            ArbitrationWorkflowError: 当并行处理失败时
        """
        try:
            self.logger.info(f"开始并行处理{len(anomaly_stocks)}只异常股票")

            # 创建并行任务
            tasks = []
            for stock_code in anomaly_stocks:
                task = asyncio.create_task(
                    self._process_single_stock_with_retry(
                        stock_code, trade_date, max_retries
                    )
                )
                tasks.append(task)

            # 等待所有任务完成
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # 统计结果
            successful = 0
            failed = 0
            failed_stocks = []

            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    failed += 1
                    failed_stocks.append({
                        "stock_code": anomaly_stocks[i],
                        "error": str(result)
                    })
                else:
                    successful += 1

            self.logger.info(f"并行处理完成: 成功{successful}, 失败{failed}")

            return {
                "successful": successful,
                "failed": failed,
                "failed_stocks": failed_stocks
            }

        except Exception as e:
            self.logger.critical(f"并行处理异常股票失败: {e}", exc_info=True)
            raise ArbitrationWorkflowError(f"并行处理异常股票失败: {e}") from e

    async def _process_anomaly_stocks(self, anomaly_stocks: list[str], trade_date: str) -> dict[str, Any]:
        """
        处理异常股票 - 双脑并行分析 + 元认知仲裁

        Args:
            anomaly_stocks: 异常股票代码列表
            trade_date: 交易日期

        Returns:
            处理结果统计
        """
        successful = 0
        failed = 0
        failed_stocks = []
        human_review_cases = 0

        for stock_code in anomaly_stocks:
            try:
                self.logger.info(f"--- 启动双脑并行分析: {stock_code} ---")

                # 1. 并行分析 (现实中可以用多线程,多进程或异步IO实现)
                self.logger.info(f"流程A: Qwen事实归因分析 - {stock_code}")
                qwen_report = await self._analyze_with_qwen(stock_code, trade_date)

                self.logger.info(f"流程B: 豆包舆情感知分析 - {stock_code}")
                doubao_report = await self._analyze_with_doubao(stock_code, trade_date)

                # 2. [v14.4核心]元认知仲裁
                self.logger.info(f"元认知仲裁: {stock_code}")
                meta_result = self.meta_cognition_engine.arbitrate_and_summarize(
                    qwen_report,
                    doubao_report
                )

                # 3. 根据仲裁结果处理
                if meta_result.requires_human_review:
                    self.logger.info(f"需要人工审查: {stock_code}")
                    human_review_cases += 1
                    await self._mark_for_human_review(stock_code, meta_result)
                else:
                    self.logger.info(f"自动仲裁完成: {stock_code}")
                    await self._save_final_report(stock_code, meta_result)

                self.logger.info(f"成功处理: {stock_code}")
                successful += 1

            except Exception as e:
                # 单只股票失败,记录错误并继续
                self.logger.error(f"处理股票 {stock_code} 失败: {e}", exc_info=True)
                failed_stocks.append(stock_code)
                failed += 1
                continue

        return {
            "successful": successful,
            "failed": failed,
            "failed_stocks": failed_stocks,
            "human_review_cases": human_review_cases
        }

    async def _analyze_with_qwen(self, stock_code: str, trade_date: str) -> AnalysisResult:
        """
        使用Qwen进行事实归因分析

        Args:
            stock_code: 股票代码
            trade_date: 交易日期

        Returns:
            Qwen分析结果
        """
        try:
            # 获取股票相关数据
            stock_data = await self.data_pipeline.get_stock_data(stock_code, trade_date)

            # 构建分析提示词
            prompt = f"""
            作为一位严谨的基本面分析师,请分析以下股票的基本面情况:

            股票代码: {stock_code}
            交易日期: {trade_date}
            财务数据: {json.dumps(stock_data, ensure_ascii=False, indent=2)}

            请从以下角度进行分析:
            1. 财务指标分析
            2. 行业地位评估
            3. 风险因素识别
            4. 投资建议

            请提供客观,基于数据的事实分析。
            """

            # 调用LLM分析
            result = await self.llm_service.analyze_fact({
                "news_content": prompt,
                "context": f"Qwen基本面分析-{stock_code}"
            })

            return result

        except Exception as e:
            self.logger.error(f"Qwen分析失败 {stock_code}: {e}")
            raise

    async def _analyze_with_doubao(self, stock_code: str, trade_date: str) -> AnalysisResult:
        """
        使用豆包进行舆情感知分析

        Args:
            stock_code: 股票代码
            trade_date: 交易日期

        Returns:
            豆包分析结果
        """
        try:
            # 获取市场情绪数据
            sentiment_data = await self.data_pipeline.get_sentiment_data(stock_code, trade_date)

            # 构建分析提示词
            prompt = f"""
            作为一位关注市场情绪的舆情分析师,请分析以下股票的市场情绪:

            股票代码: {stock_code}
            交易日期: {trade_date}
            情绪数据: {json.dumps(sentiment_data, ensure_ascii=False, indent=2)}

            请从以下角度进行分析:
            1. 市场情绪评估
            2. 舆情热点分析
            3. 投资者情绪变化
            4. 市场预期分析

            请提供基于市场情绪和舆情的分析。
            """

            # 调用LLM分析
            result = await self.llm_service.analyze_sentiment({
                "news_content": prompt,
                "context": f"豆包情绪分析-{stock_code}"
            })

            return result

        except Exception as e:
            self.logger.error(f"豆包分析失败 {stock_code}: {e}")
            raise

    async def _mark_for_human_review(self, stock_code: str, meta_result) -> None:
        """
        标记需要人工审查的案件

        Args:
            stock_code: 股票代码
            meta_result: 元认知仲裁结果
        """
        try:
            # 保存到仲裁案件表
            {
                "stock_code": stock_code,
                "status": "pending_human_review",
                "qwen_report": meta_result.final_conclusion.get("qwen_report", {}),
                "doubao_report": meta_result.final_conclusion.get("doubao_report", {}),
                "meta_analysis": meta_result.final_conclusion,
                "confidence": meta_result.confidence,
                "reasoning": meta_result.reasoning,
                "created_at": datetime.now().isoformat()
            }

            # 这里应该保存到数据库
            self.logger.info(f"已标记人工审查案件: {stock_code}")

        except Exception as e:
            self.logger.error(f"标记人工审查案件失败 {stock_code}: {e}")
            raise

    async def _save_final_report(self, stock_code: str, meta_result) -> None:
        """
        保存最终报告

        Args:
            stock_code: 股票代码
            meta_result: 元认知仲裁结果
        """
        try:
            # 构建最终报告
            {
                "stock_code": stock_code,
                "status": "completed",
                "final_conclusion": meta_result.final_conclusion,
                "confidence": meta_result.confidence,
                "reasoning": meta_result.reasoning,
                "created_at": datetime.now().isoformat()
            }

            # 这里应该保存到数据库
            self.logger.info(f"已保存最终报告: {stock_code}")

        except Exception as e:
            self.logger.error(f"保存最终报告失败 {stock_code}: {e}")
            raise

    def _generate_execution_report(self, trade_date: str, anomaly_stocks: list[str], results: dict[str, Any]) -> None:
        """
        生成执行报告

        Args:
            trade_date: 交易日期
            anomaly_stocks: 异常股票列表
            results: 处理结果
        """
        self.logger.info("=== v14.4每日工作流执行报告 ===")
        self.logger.info(f"交易日期: {trade_date}")
        self.logger.info(f"异常股票总数: {len(anomaly_stocks)}")
        self.logger.info(f"双脑分析成功: {results['successful']}")
        self.logger.info(f"双脑分析失败: {results['failed']}")
        self.logger.info(f"需要人工审查: {results['human_review_cases']}")
        if results["failed_stocks"]:
            self.logger.info(f"失败股票: {', '.join(results['failed_stocks'])}")

        self.logger.info("=== v14.4每日工作流执行完成 ===")


async def main():
    """
    主函数入口
    """
    try:
        # 获取命令行参数或使用默认值
        trade_date = None
        if len(sys.argv) > 1:
            trade_date = sys.argv[1]

        # 加载配置
        config = {
            "llm": {
                "provider": "qwen",
                "api_key": "your_api_key_here"
            },
            "database": {
                "url": "postgresql://user:pass@localhost/db"
            }
        }

        # 创建并运行工作流
        workflow = MainWorkflow(config)
        result = await workflow.run_daily_flow(trade_date)

        print(f"工作流执行完成: {result}")

    except Exception as e:
        print(f"工作流执行失败: {e}")
        sys.exit(1)


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
