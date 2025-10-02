"""
工作流适配器 - 为API提供简化的接口
"""

import asyncio
import logging
from datetime import datetime
from typing import Any, Optional

from src.main_workflow import MainWorkflow


class WorkflowAdapter:
    """工作流适配器类 - 为API提供简化的接口"""

    def __init__(self, config: Optional[dict[str, Any]] = None):
        """初始化工作流适配器"""
        self.config = config or self._get_default_config()
        self.active_workflows: dict[str, dict[str, Any]] = {}
        self.logger = logging.getLogger(__name__)

    def _get_default_config(self) -> dict[str, Any]:
        """获取默认配置"""
        return {
            "llm_service": {
                "qwen": {"api_key": "test_key"},
                "doubao": {"api_key": "test_key"},
            },
            "concurrency": {
                "max_db_connections": 10,
                "max_llm_requests": 5,
                "max_stock_processing": 20,
            },
        }

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

            # 创建并运行主工作流
            workflow = MainWorkflow(self.config)
            result = await workflow.run_daily_flow(target_date)

            # 更新状态
            self.active_workflows[workflow_id].update(
                {
                    "status": "completed",
                    "end_time": datetime.now(),
                    "result": result,
                }
            )

            self._add_log(workflow_id, "工作流完成", "info")
            self.logger.info(f"日常分析工作流完成: {workflow_id}")

            return workflow_id

        except Exception as e:
            # 记录错误
            self.active_workflows[workflow_id].update(
                {
                    "status": "failed",
                    "end_time": datetime.now(),
                    "error": str(e),
                }
            )
            self._add_log(workflow_id, f"工作流失败: {e!s}", "error")
            self.logger.error(f"日常分析工作流失败: {workflow_id}, 错误: {e}")
            raise

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

            # 模拟历史回填 - 可以在这里调用实际的历史回填逻辑
            await asyncio.sleep(2)  # 模拟处理时间

            # 更新状态
            self.active_workflows[workflow_id].update(
                {
                    "status": "completed",
                    "end_time": datetime.now(),
                    "result": {
                        "message": f"历史数据回填完成,日期范围: {start_date} 到 {end_date}"
                    },
                }
            )

            self._add_log(workflow_id, "历史回填工作流完成", "info")
            self.logger.info(f"历史数据回填工作流完成: {workflow_id}")

            return workflow_id

        except Exception as e:
            # 记录错误
            self.active_workflows[workflow_id].update(
                {
                    "status": "failed",
                    "end_time": datetime.now(),
                    "error": str(e),
                }
            )
            self._add_log(workflow_id, f"历史回填工作流失败: {e!s}", "error")
            self.logger.error(f"历史数据回填工作流失败: {workflow_id}, 错误: {e}")
            raise

    async def get_workflow_status(self, workflow_id: str) -> Optional[dict[str, Any]]:
        """获取工作流状态"""
        return self.active_workflows.get(workflow_id)

    async def get_workflow_logs(self, workflow_id: str) -> list[dict[str, Any]]:
        """获取工作流日志"""
        workflow = self.active_workflows.get(workflow_id)
        if not workflow:
            return []
        return workflow.get("logs", [])

    async def get_all_workflows(self) -> list[dict[str, Any]]:
        """获取所有工作流"""
        return list(self.active_workflows.values())

    async def cancel_workflow(self, workflow_id: str) -> bool:
        """取消工作流"""
        if workflow_id in self.active_workflows:
            workflow = self.active_workflows[workflow_id]
            if workflow["status"] == "running":
                workflow["status"] = "cancelled"
                workflow["end_time"] = datetime.now()
                self._add_log(workflow_id, "工作流被取消", "warning")
                return True
        return False

    def _add_log(self, workflow_id: str, message: str, level: str):
        """添加日志"""
        if workflow_id in self.active_workflows:
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "level": level,
                "message": message,
            }
            self.active_workflows[workflow_id]["logs"].append(log_entry)
