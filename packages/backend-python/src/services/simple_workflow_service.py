"""
简化的工作流服务 - 不依赖复杂的外部模块
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional


class SimpleWorkflowService:
    """简化的工作流服务类"""

    def __init__(self):
        """初始化工作流服务"""
        self.active_workflows: Dict[str, Dict[str, Any]] = {}
        self.logger = logging.getLogger(__name__)

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

            # 模拟工作流执行
            await asyncio.sleep(1)  # 模拟处理时间

            # 更新状态
            self.active_workflows[workflow_id].update(
                {
                    "status": "completed",
                    "end_time": datetime.now(),
                    "result": {"message": f"日常分析完成，目标日期: {target_date}"},
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

    async def run_historical_backfill(
        self, start_date: str, end_date: str
    ) -> str:
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

            # 模拟工作流执行
            await asyncio.sleep(2)  # 模拟更长的处理时间

            # 更新状态
            self.active_workflows[workflow_id].update(
                {
                    "status": "completed",
                    "end_time": datetime.now(),
                    "result": {
                        "message": f"历史数据回填完成，日期范围: {start_date} 到 {end_date}"
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

    async def get_workflow_status(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """获取工作流状态"""
        return self.active_workflows.get(workflow_id)

    async def get_workflow_logs(self, workflow_id: str) -> List[Dict[str, Any]]:
        """获取工作流日志"""
        workflow = self.active_workflows.get(workflow_id)
        if not workflow:
            return []
        return workflow.get("logs", [])

    async def get_all_workflows(self) -> List[Dict[str, Any]]:
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

    async def cleanup_old_workflows(self, hours: int = 24):
        """清理旧的工作流记录"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        to_remove = []

        for workflow_id, workflow in self.active_workflows.items():
            if workflow["start_time"] < cutoff_time:
                to_remove.append(workflow_id)

        for workflow_id in to_remove:
            del self.active_workflows[workflow_id]

        self.logger.info(f"清理了 {len(to_remove)} 个旧工作流记录")
