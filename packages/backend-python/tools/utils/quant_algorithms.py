"""
量化算法工具类
"""

from typing import List, Dict, Any
import numpy as np
import pandas as pd


class QuantAlgorithms:
    """量化算法工具类"""
    
    @staticmethod
    def calculate_momentum(data: List[float], period: int = 20) -> float:
        """计算动量指标"""
        if len(data) < period:
            return 0.0
        
        recent_data = data[-period:]
        return (recent_data[-1] - recent_data[0]) / recent_data[0] if recent_data[0] != 0 else 0.0
    
    @staticmethod
    def calculate_mean_reversion(data: List[float], period: int = 14) -> float:
        """计算均值回归指标"""
        if len(data) < period:
            return 0.0
        
        recent_data = data[-period:]
        mean = np.mean(recent_data)
        std = np.std(recent_data)
        
        if std == 0:
            return 0.0
        
        return (recent_data[-1] - mean) / std
    
    @staticmethod
    def calculate_volatility(data: List[float], period: int = 20) -> float:
        """计算波动率"""
        if len(data) < period:
            return 0.0
        
        recent_data = data[-period:]
        returns = np.diff(recent_data) / recent_data[:-1]
        return np.std(returns) * np.sqrt(252)  # 年化波动率
    
    @staticmethod
    def detect_anomalies(data: List[float], threshold: float = 2.0) -> List[bool]:
        """检测异常值"""
        if len(data) < 2:
            return [False] * len(data)
        
        mean = np.mean(data)
        std = np.std(data)
        
        if std == 0:
            return [False] * len(data)
        
        z_scores = [(x - mean) / std for x in data]
        return [abs(z) > threshold for z in z_scores]
