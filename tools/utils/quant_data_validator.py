"""
量化数据验证工具
"""

from typing import Any, Dict, List

from src.exceptions import QuantValidationError


class QuantDataValidator:
    """量化数据验证器"""
    
    @staticmethod
    def validate_financial_factors(financial_factors: Dict[str, Any]) -> None:
        """
        验证财务因子数据
        
        Args:
            financial_factors: 财务因子字典
            
        Raises:
            QuantValidationError: 数据验证失败
        """
        if not isinstance(financial_factors, dict):
            raise QuantValidationError("financial_factors must be a dictionary")
        
        # 检查是否有有效的财务数据
        if not financial_factors:
            raise QuantValidationError("financial_factors cannot be empty")
        
        # 验证数值类型
        for key, value in financial_factors.items():
            if not isinstance(value, (int, float)):
                raise QuantValidationError(f"Financial factor '{key}' must be numeric, got {type(value)}")
            
            if isinstance(value, float) and (value != value):  # 检查NaN
                raise QuantValidationError(f"Financial factor '{key}' contains NaN value")
            
            if isinstance(value, float) and value in (float('inf'), float('-inf')):
                raise QuantValidationError(f"Financial factor '{key}' contains infinite value")
    
    @staticmethod
    def validate_price_data(price_data: List[Dict[str, Any]]) -> None:
        """
        验证价格数据
        
        Args:
            price_data: 价格数据列表
            
        Raises:
            QuantValidationError: 数据验证失败
        """
        if not isinstance(price_data, list):
            raise QuantValidationError("price_data must be a list")
        
        if not price_data:
            raise QuantValidationError("price_data cannot be empty")
        
        # 验证必需字段
        required_fields = ["pct_chg", "vol"]
        for i, data_point in enumerate(price_data):
            if not isinstance(data_point, dict):
                raise QuantValidationError(f"Price data point {i} must be a dictionary")
            
            for field in required_fields:
                if field not in data_point:
                    raise QuantValidationError(f"Missing required field '{field}' in price data point {i}")
                
                value = data_point[field]
                if not isinstance(value, (int, float)):
                    raise QuantValidationError(f"Field '{field}' in price data point {i} must be numeric, got {type(value)}")
                
                if isinstance(value, float) and (value != value):  # 检查NaN
                    raise QuantValidationError(f"Field '{field}' in price data point {i} contains NaN value")
                
                if isinstance(value, float) and value in (float('inf'), float('-inf')):
                    raise QuantValidationError(f"Field '{field}' in price data point {i} contains infinite value")
    
    @staticmethod
    def validate_basic_data(basic_data: List[Dict[str, Any]]) -> None:
        """
        验证基本面数据
        
        Args:
            basic_data: 基本面数据列表
            
        Raises:
            QuantValidationError: 数据验证失败
        """
        if not isinstance(basic_data, list):
            raise QuantValidationError("basic_data must be a list")
        
        if not basic_data:
            raise QuantValidationError("basic_data cannot be empty")
        
        # 验证数据点
        for i, data_point in enumerate(basic_data):
            if not isinstance(data_point, dict):
                raise QuantValidationError(f"Basic data point {i} must be a dictionary")
            
            # 验证数值字段
            for key, value in data_point.items():
                if isinstance(value, (int, float)):
                    if isinstance(value, float) and (value != value):  # 检查NaN
                        raise QuantValidationError(f"Field '{key}' in basic data point {i} contains NaN value")
                    
                    if isinstance(value, float) and value in (float('inf'), float('-inf')):
                        raise QuantValidationError(f"Field '{key}' in basic data point {i} contains infinite value")
    
    @staticmethod
    def validate_stock_code(stock_code: str) -> None:
        """
        验证股票代码
        
        Args:
            stock_code: 股票代码
            
        Raises:
            QuantValidationError: 数据验证失败
        """
        if not isinstance(stock_code, str):
            raise QuantValidationError("stock_code must be a string")
        
        if not stock_code:
            raise QuantValidationError("stock_code cannot be empty")
        
        if len(stock_code) < 6:
            raise QuantValidationError("stock_code must be at least 6 characters")
        
        # 检查是否包含有效的股票代码格式
        if not any(suffix in stock_code.upper() for suffix in ['.SZ', '.SH', '.BJ']):
            raise QuantValidationError("stock_code must contain valid exchange suffix (.SZ, .SH, .BJ)")
    
    @staticmethod
    def validate_trade_date(trade_date: Any) -> None:
        """
        验证交易日期
        
        Args:
            trade_date: 交易日期
            
        Raises:
            QuantValidationError: 数据验证失败
        """
        from datetime import datetime
        
        if not isinstance(trade_date, datetime):
            raise QuantValidationError("trade_date must be a datetime object")
        
        # 检查日期是否合理（不能是未来日期）
        from datetime import date
        today = date.today()
        if trade_date.date() > today:
            raise QuantValidationError("trade_date cannot be in the future")
        
        # 检查日期是否太早（比如100年前）
        from datetime import timedelta
        min_date = today - timedelta(days=365 * 100)
        if trade_date.date() < min_date:
            raise QuantValidationError("trade_date is too far in the past")
    
    @classmethod
    def validate_calculation_inputs(
        cls,
        stock_code: str,
        trade_date: Any,
        financial_factors: Dict[str, Any],
        price_data: List[Dict[str, Any]]
    ) -> None:
        """
        验证计算输入参数
        
        Args:
            stock_code: 股票代码
            trade_date: 交易日期
            financial_factors: 财务因子
            price_data: 价格数据
            
        Raises:
            QuantValidationError: 数据验证失败
        """
        cls.validate_stock_code(stock_code)
        cls.validate_trade_date(trade_date)
        cls.validate_financial_factors(financial_factors)
        cls.validate_price_data(price_data)
    
    @classmethod
    def validate_anomaly_detection_inputs(
        cls,
        stock_code: str,
        trade_date: Any,
        price_data: List[Dict[str, Any]],
        basic_data: List[Dict[str, Any]]
    ) -> None:
        """
        验证异常检测输入参数
        
        Args:
            stock_code: 股票代码
            trade_date: 交易日期
            price_data: 价格数据
            basic_data: 基本面数据
            
        Raises:
            QuantValidationError: 数据验证失败
        """
        cls.validate_stock_code(stock_code)
        cls.validate_trade_date(trade_date)
        cls.validate_price_data(price_data)
        cls.validate_basic_data(basic_data)
