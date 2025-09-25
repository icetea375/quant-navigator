"""
报告服务 - 处理报告相关业务逻辑
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, date
from src.schemas.reports import (
    GeneratedReport,
    ReportCreate,
    ReportUpdate,
    ReportType,
    ReportStatus
)


class ReportService:
    """报告服务类"""
    
    def __init__(self):
        """初始化报告服务"""
        self.reports: Dict[int, GeneratedReport] = {}
        self._next_id = 1
        self._initialize_sample_data()
    
    def _initialize_sample_data(self):
        """初始化示例数据"""
        sample_report = GeneratedReport(
            report_id=1,
            report_type=ReportType.DAILY_ANALYSIS,
            target_code="000001.SZ",
            report_date=date.today(),
            content="今日市场分析报告：市场整体表现平稳，建议关注...",
            status=ReportStatus.COMPLETED,
            created_at=datetime.now()
        )
        self.reports[1] = sample_report
        self._next_id = 2
    
    async def get_reports(
        self,
        page: int = 1,
        size: int = 10,
        report_type: Optional[str] = None,
        target_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """获取报告列表"""
        
        # 过滤条件
        filtered_reports = list(self.reports.values())
        
        if report_type:
            filtered_reports = [
                report for report in filtered_reports 
                if report.report_type == report_type
            ]
        
        if target_code:
            filtered_reports = [
                report for report in filtered_reports 
                if report.target_code == target_code
            ]
        
        # 按创建时间倒序排序
        filtered_reports.sort(key=lambda x: x.created_at, reverse=True)
        
        # 分页
        total = len(filtered_reports)
        start = (page - 1) * size
        end = start + size
        paginated_reports = filtered_reports[start:end]
        
        return {
            "data": paginated_reports,
            "total": total
        }
    
    async def get_report_by_id(self, report_id: int) -> Optional[GeneratedReport]:
        """根据ID获取报告"""
        return self.reports.get(report_id)
    
    async def create_report(self, report_data: ReportCreate) -> GeneratedReport:
        """创建新报告"""
        report = GeneratedReport(
            report_id=self._next_id,
            report_type=report_data.report_type,
            target_code=report_data.target_code,
            report_date=report_data.report_date,
            content=report_data.content,
            status=ReportStatus.PENDING,
            created_at=datetime.now()
        )
        
        self.reports[self._next_id] = report
        self._next_id += 1
        
        return report
    
    async def update_report(
        self,
        report_id: int,
        update_data: ReportUpdate
    ) -> Optional[GeneratedReport]:
        """更新报告"""
        report = self.reports.get(report_id)
        if not report:
            return None
        
        # 更新字段
        if update_data.content is not None:
            report.content = update_data.content
        if update_data.status is not None:
            report.status = update_data.status
        
        report.updated_at = datetime.now()
        return report
    
    async def delete_report(self, report_id: int) -> bool:
        """删除报告"""
        if report_id in self.reports:
            del self.reports[report_id]
            return True
        return False
    
    async def get_reports_by_date_range(
        self,
        start_date: date,
        end_date: date
    ) -> List[GeneratedReport]:
        """根据日期范围获取报告"""
        filtered_reports = [
            report for report in self.reports.values()
            if start_date <= report.report_date <= end_date
        ]
        return sorted(filtered_reports, key=lambda x: x.report_date, reverse=True)
    
    async def get_reports_by_type(self, report_type: ReportType) -> List[GeneratedReport]:
        """根据类型获取报告"""
        return [
            report for report in self.reports.values()
            if report.report_type == report_type
        ]
    
    async def get_reports_by_target_code(self, target_code: str) -> List[GeneratedReport]:
        """根据目标代码获取报告"""
        return [
            report for report in self.reports.values()
            if report.target_code == target_code
        ]
    
    async def get_statistics(self) -> Dict[str, Any]:
        """获取报告统计信息"""
        total_reports = len(self.reports)
        
        # 按状态统计
        status_counts = {}
        for report in self.reports.values():
            status_counts[report.status] = status_counts.get(report.status, 0) + 1
        
        # 按类型统计
        type_counts = {}
        for report in self.reports.values():
            type_counts[report.report_type] = type_counts.get(report.report_type, 0) + 1
        
        # 按目标代码统计
        target_code_counts = {}
        for report in self.reports.values():
            if report.target_code:
                target_code_counts[report.target_code] = target_code_counts.get(report.target_code, 0) + 1
        
        return {
            "total_reports": total_reports,
            "status_distribution": status_counts,
            "type_distribution": type_counts,
            "target_code_distribution": target_code_counts,
            "latest_report_date": max(
                [report.created_at for report in self.reports.values()],
                default=None
            )
        }
