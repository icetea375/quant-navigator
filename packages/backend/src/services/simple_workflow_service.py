"""
简化的工作流服务 - 不依赖复杂的外部模块
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime, date, timedelta


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
                "logs": []
            }
            
            self.logger.info(f"开始运行日常分析工作流: {workflow_id}")
            self._add_log(workflow_id, "工作流启动", "info")
            
            # 模拟工作流执行
            await asyncio.sleep(1)  # 模拟处理时间
            
            # 更新状态
            self.active_workflows[workflow_id].update({
                "status": "completed",
                "end_time": datetime.now(),
                "result": {"message": f"日常分析完成，目标日期: {target_date}"}
            })
            
            self._add_log(workflow_id, "工作流完成", "info")
            self.logger.info(f"日常分析工作流完成: {workflow_id}")
            
            return workflow_id
            
        except Exception as e:
            # 记录错误
            self.active_workflows[workflow_id].update({
                "status": "failed",
                "end_time": datetime.now(),
                "error": str(e)
            })
            
            self._add_log(workflow_id, f"工作流失败: {str(e)}", "error")
            self.logger.error(f"日常分析工作流失败: {workflow_id}, 错误: {str(e)}")
            
            return workflow_id
    
    async def run_historical_backfill(
        self,
        start_date: str,
        end_date: str
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
                "logs": []
            }
            
            self.logger.info(f"开始运行历史数据回填工作流: {workflow_id}")
            self._add_log(workflow_id, "历史回填工作流启动", "info")
            
            # 解析日期范围
            start_dt = datetime.strptime(start_date, "%Y%m%d").date()
            end_dt = datetime.strptime(end_date, "%Y%m%d").date()
            
            # 模拟逐日处理
            current_date = start_dt
            processed_days = 0
            total_days = (end_dt - start_dt).days + 1
            
            while current_date <= end_dt:
                try:
                    self._add_log(
                        workflow_id,
                        f"处理日期: {current_date} ({processed_days + 1}/{total_days})",
                        "info"
                    )
                    
                    # 模拟单日处理
                    await asyncio.sleep(0.1)  # 模拟处理时间
                    
                    processed_days += 1
                    self._add_log(
                        workflow_id,
                        f"日期 {current_date} 处理完成",
                        "info"
                    )
                    
                except Exception as e:
                    self._add_log(
                        workflow_id,
                        f"日期 {current_date} 处理失败: {str(e)}",
                        "error"
                    )
                
                current_date += timedelta(days=1)
            
            # 更新状态
            self.active_workflows[workflow_id].update({
                "status": "completed",
                "end_time": datetime.now(),
                "processed_days": processed_days,
                "total_days": total_days
            })
            
            self._add_log(workflow_id, f"历史回填完成，处理了 {processed_days}/{total_days} 天", "info")
            self.logger.info(f"历史数据回填工作流完成: {workflow_id}")
            
            return workflow_id
            
        except Exception as e:
            # 记录错误
            self.active_workflows[workflow_id].update({
                "status": "failed",
                "end_time": datetime.now(),
                "error": str(e)
            })
            
            self._add_log(workflow_id, f"历史回填工作流失败: {str(e)}", "error")
            self.logger.error(f"历史数据回填工作流失败: {workflow_id}, 错误: {str(e)}")
            
            return workflow_id
    
    async def get_workflow_status(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """获取工作流状态"""
        return self.active_workflows.get(workflow_id)
    
    async def get_workflow_logs(self, workflow_id: str) -> list:
        """获取工作流日志"""
        workflow = self.active_workflows.get(workflow_id)
        if not workflow:
            return []
        
        return workflow.get("logs", [])
    
    async def get_all_workflows(self) -> Dict[str, Any]:
        """获取所有工作流状态"""
        return {
            "active_workflows": len([w for w in self.active_workflows.values() if w["status"] == "running"]),
            "completed_workflows": len([w for w in self.active_workflows.values() if w["status"] == "completed"]),
            "failed_workflows": len([w for w in self.active_workflows.values() if w["status"] == "failed"]),
            "workflows": list(self.active_workflows.values())
        }
    
    def _add_log(self, workflow_id: str, message: str, level: str = "info"):
        """添加工作流日志"""
        if workflow_id in self.active_workflows:
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "level": level,
                "message": message
            }
            self.active_workflows[workflow_id]["logs"].append(log_entry)
