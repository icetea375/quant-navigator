"""
量化引擎配置类
"""

from typing import Any, Dict


class QuantEngineConfig:
    """量化引擎配置类"""
    
    def __init__(self, config: Dict[str, Any]):
        """
        初始化量化引擎配置
        
        Args:
            config: 配置字典
        """
        # 基础配置
        self.z_score_threshold = config.get("z_score_threshold", 2.5)
        self.lookback_days = config.get("lookback_days", 30)
        self.min_data_points = config.get("min_data_points", 20)
        
        # 技术指标配置
        self.rsi_period = config.get("rsi_period", 14)
        self.macd_fast = config.get("macd_fast", 12)
        self.macd_slow = config.get("macd_slow", 26)
        self.macd_signal = config.get("macd_signal", 9)
        self.bollinger_period = config.get("bollinger_period", 20)
        self.bollinger_std = config.get("bollinger_std", 2)
        
        # 权重配置
        self.return_weight = config.get("return_weight", 0.3)
        self.volume_weight = config.get("volume_weight", 0.2)
        self.momentum_weight = config.get("momentum_weight", 0.2)
        self.volatility_weight = config.get("volatility_weight", 0.3)
        
        # 置信度配置
        self.base_confidence = config.get("base_confidence", 0.5)
        self.financial_factors_bonus = config.get("financial_factors_bonus", 0.2)
        self.price_data_bonus = config.get("price_data_bonus", 0.1)
        self.min_financial_factors = config.get("min_financial_factors", 3)
        
        # 异常检测阈值
        self.price_anomaly_threshold = config.get("price_anomaly_threshold", 10.0)
        self.high_price_anomaly_threshold = config.get("high_price_anomaly_threshold", 20.0)
        self.volume_anomaly_threshold = config.get("volume_anomaly_threshold", 3.0)
        self.high_volume_anomaly_threshold = config.get("high_volume_anomaly_threshold", 5.0)
        self.volatility_anomaly_threshold = config.get("volatility_anomaly_threshold", 8.0)
        self.high_volatility_anomaly_threshold = config.get("high_volatility_anomaly_threshold", 15.0)
