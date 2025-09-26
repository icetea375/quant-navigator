"""
工作流服务 - 处理主工作流相关业务逻辑
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path
import sys

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

# 导入原有的工作流模块
from main_workflow import MainWorkflow
from qwen_analyzer import QwenFactAnalyzer
from doubao_analyzer import DoubaoSentimentAnalyzer
from support_modules.data_pipeline import DataPipeline
from support_modules.quant_signal_engine import QuantSignalEngine


class WorkflowService:
    """工作流服务类"""

    def __init__(self):
        """初始化工作流服务"""
        self.active_workflows: Dict[str, Dict[str, Any]] = {}
        self.logger = logging.getLogger(__name__)

        # 初始化工作流组件
        self.main_workflow = MainWorkflow()
        self.qwen_analyzer = QwenFactAnalyzer()
        self.doubao_analyzer = DoubaoSentimentAnalyzer()
        self.data_pipeline = DataPipeline()
        self.quant_engine = QuantSignalEngine()

    async def run_daily_flow(self, target_date: str) -> str:
        """运行日常分析工作流"""
        workflow_id = f"daily_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        try:
            # 记录工作流开始
            self.active_workflows[workflow_id] = {
                "id": workflow_id,
                "type": "daily_flow",
                "status": "running",
                "start_time": datetime.now(),
                "target_date": target_date,
                "logs": [],
            }

            self.logger.info(f"开始运行日常分析工作流: {workflow_id}")
            self._add_log(workflow_id, "工作流启动", "info")

            # 运行主工作流
            result = await self._run_main_workflow(target_date)

            # 更新状态
            self.active_workflows[workflow_id].update(
                {"status": "completed", "end_time": datetime.now(), "result": result}
            )

            self._add_log(workflow_id, "工作流完成", "info")
            self.logger.info(f"日常分析工作流完成: {workflow_id}")

            return workflow_id

        except Exception as e:
            # 记录错误
            self.active_workflows[workflow_id].update(
                {"status": "failed", "end_time": datetime.now(), "error": str(e)}
            )

            self._add_log(workflow_id, f"工作流失败: {str(e)}", "error")
            self.logger.error(f"日常分析工作流失败: {workflow_id}, 错误: {str(e)}")

            return workflow_id

    async def run_historical_backfill(self, start_date: str, end_date: str) -> str:
        """运行历史数据回填工作流"""
        workflow_id = f"backfill_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        try:
            # 记录工作流开始
            self.active_workflows[workflow_id] = {
                "id": workflow_id,
                "type": "historical_backfill",
                "status": "running",
                "start_time": datetime.now(),
                "start_date": start_date,
                "end_date": end_date,
                "logs": [],
            }

            self.logger.info(f"开始运行历史数据回填工作流: {workflow_id}")
            self._add_log(workflow_id, "历史回填工作流启动", "info")

            # 解析日期范围
            start_dt = datetime.strptime(start_date, "%Y%m%d").date()
            end_dt = datetime.strptime(end_date, "%Y%m%d").date()

            # 逐日运行分析
            current_date = start_dt
            processed_days = 0
            total_days = (end_dt - start_dt).days + 1

            while current_date <= end_dt:
                try:
                    self._add_log(
                        workflow_id,
                        f"处理日期: {current_date} ({processed_days + 1}/{total_days})",
                        "info",
                    )

                    # 运行单日分析
                    result = await self._run_main_workflow(current_date.isoformat())

                    processed_days += 1
                    self._add_log(workflow_id, f"日期 {current_date} 处理完成", "info")

                    # 避免过于频繁的请求
                    await asyncio.sleep(1)

                except Exception as e:
                    self._add_log(
                        workflow_id, f"日期 {current_date} 处理失败: {str(e)}", "error"
                    )

                current_date += timedelta(days=1)

            # 更新状态
            self.active_workflows[workflow_id].update(
                {
                    "status": "completed",
                    "end_time": datetime.now(),
                    "processed_days": processed_days,
                    "total_days": total_days,
                }
            )

            self._add_log(
                workflow_id,
                f"历史回填完成，处理了 {processed_days}/{total_days} 天",
                "info",
            )
            self.logger.info(f"历史数据回填工作流完成: {workflow_id}")

            return workflow_id

        except Exception as e:
            # 记录错误
            self.active_workflows[workflow_id].update(
                {"status": "failed", "end_time": datetime.now(), "error": str(e)}
            )

            self._add_log(workflow_id, f"历史回填工作流失败: {str(e)}", "error")
            self.logger.error(f"历史数据回填工作流失败: {workflow_id}, 错误: {str(e)}")

            return workflow_id

    async def get_workflow_status(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """获取工作流状态"""
        return self.active_workflows.get(workflow_id)

    async def get_workflow_logs(self, workflow_id: str) -> List[Dict[str, Any]]:
        """获取工作流日志"""
        workflow = self.active_workflows.get(workflow_id)
        if not workflow:
            return []

        return workflow.get("logs", [])

    async def get_all_workflows(self) -> Dict[str, Any]:
        """获取所有工作流状态"""
        return {
            "active_workflows": len(
                [w for w in self.active_workflows.values() if w["status"] == "running"]
            ),
            "completed_workflows": len(
                [
                    w
                    for w in self.active_workflows.values()
                    if w["status"] == "completed"
                ]
            ),
            "failed_workflows": len(
                [w for w in self.active_workflows.values() if w["status"] == "failed"]
            ),
            "workflows": list(self.active_workflows.values()),
        }

    async def _run_main_workflow(self, target_date: str) -> Dict[str, Any]:
        """运行主工作流"""
        try:
            # 这里调用原有的MainWorkflow逻辑
            # 由于原有的MainWorkflow是同步的，我们需要在线程池中运行
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, self.main_workflow.run_daily_analysis, target_date
            )

            return {
                "success": True,
                "result": result,
                "timestamp": datetime.now().isoformat(),
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
            }

    def _add_log(self, workflow_id: str, message: str, level: str = "info"):
        """添加工作流日志"""
        if workflow_id in self.active_workflows:
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "level": level,
                "message": message,
            }
            self.active_workflows[workflow_id]["logs"].append(log_entry)

    async def cleanup_old_workflows(self, days: int = 7):
        """清理旧的工作流记录"""
        cutoff_time = datetime.now() - timedelta(days=days)

        workflows_to_remove = []
        for workflow_id, workflow in self.active_workflows.items():
            if workflow.get("start_time", datetime.min) < cutoff_time:
                workflows_to_remove.append(workflow_id)

        for workflow_id in workflows_to_remove:
            del self.active_workflows[workflow_id]

        self.logger.info(f"清理了 {len(workflows_to_remove)} 个旧工作流记录")
