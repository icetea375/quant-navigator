"""
量化数据验证器
"""

from datetime import datetime
from typing import Any, Dict, List


class QuantDataValidator:
    """量化数据验证器类"""
    
    def validate_calculation_inputs(
        self,
        stock_code: str,
        trade_date: datetime,
        financial_factors: Dict[str, Any],
        price_data: List[Dict[str, Any]]
    ) -> bool:
        """验证计算输入数据"""
        if not stock_code:
            raise ValueError("股票代码不能为空")
        
        if not trade_date:
            raise ValueError("交易日期不能为空")
        
        if not financial_factors:
            raise ValueError("财务因子数据不能为空")
        
        if not price_data:
            raise ValueError("价格数据不能为空")
        
        return True
    
    def validate_signal_data(self, signal_data: Dict[str, Any]) -> bool:
        """验证信号数据"""
        required_fields = ["stock_code", "signal_type", "strength", "confidence"]
        
        for field in required_fields:
            if field not in signal_data:
                raise ValueError(f"缺少必要字段: {field}")
        
        return True
    
    def validate_anomaly_data(self, anomaly_data: Dict[str, Any]) -> bool:
        """验证异常数据"""
        required_fields = ["stock_code", "anomaly_type", "severity", "z_score"]
        
        for field in required_fields:
            if field not in anomaly_data:
                raise ValueError(f"缺少必要字段: {field}")
        
        return True
