"""
量化信号配置管理
"""

from typing import Any, Dict


class QuantSignalConfig:
    """量化信号配置类"""
    
    def __init__(self, config: Dict[str, Any]):
        """
        初始化配置
        
        Args:
            config: 配置字典
        """
        # 数据库配置
        database_config = config.get("database", {})
        self.database_url = database_config.get("url", "sqlite:///:memory:")
        self.database_echo = database_config.get("echo", False)
        
        # 量化引擎配置
        quant_config = config.get("quant_engine", {})
        self.z_score_threshold = quant_config.get("z_score_threshold", 2.0)
        self.lookback_days = quant_config.get("lookback_days", 30)
        self.min_data_points = quant_config.get("min_data_points", 20)
        
        # 异常检测阈值
        self.price_anomaly_threshold = quant_config.get("price_anomaly_threshold", 10.0)
        self.volume_anomaly_threshold = quant_config.get("volume_anomaly_threshold", 3.0)
        self.volatility_anomaly_threshold = quant_config.get("volatility_anomaly_threshold", 8.0)
        
        # 高风险阈值
        self.high_price_anomaly_threshold = quant_config.get("high_price_anomaly_threshold", 15.0)
        self.high_volume_anomaly_threshold = quant_config.get("high_volume_anomaly_threshold", 5.0)
        self.high_volatility_anomaly_threshold = quant_config.get("high_volatility_anomaly_threshold", 12.0)
        
        # 技术指标参数
        self.rsi_period = quant_config.get("rsi_period", 14)
        self.macd_fast = quant_config.get("macd_fast", 12)
        self.macd_slow = quant_config.get("macd_slow", 26)
        self.macd_signal = quant_config.get("macd_signal", 9)
        self.bollinger_period = quant_config.get("bollinger_period", 20)
        self.bollinger_std = quant_config.get("bollinger_std", 2.0)
        
        # 信号强度权重
        self.return_weight = quant_config.get("return_weight", 0.3)
        self.volume_weight = quant_config.get("volume_weight", 0.2)
        self.momentum_weight = quant_config.get("momentum_weight", 0.3)
        self.volatility_weight = quant_config.get("volatility_weight", 0.2)
        
        # 置信度计算参数
        self.base_confidence = quant_config.get("base_confidence", 0.5)
        self.financial_factors_bonus = quant_config.get("financial_factors_bonus", 0.2)
        self.price_data_bonus = quant_config.get("price_data_bonus", 0.3)
        self.min_financial_factors = quant_config.get("min_financial_factors", 5)
    
    def validate(self) -> None:
        """验证配置参数"""
        if self.z_score_threshold <= 0:
            raise ValueError("z_score_threshold must be positive")
        
        if self.lookback_days <= 0:
            raise ValueError("lookback_days must be positive")
        
        if self.min_data_points <= 0:
            raise ValueError("min_data_points must be positive")
        
        if not (0 < self.return_weight < 1):
            raise ValueError("return_weight must be between 0 and 1")
        
        if not (0 < self.volume_weight < 1):
            raise ValueError("volume_weight must be between 0 and 1")
        
        if not (0 < self.momentum_weight < 1):
            raise ValueError("momentum_weight must be between 0 and 1")
        
        if not (0 < self.volatility_weight < 1):
            raise ValueError("volatility_weight must be between 0 and 1")
        
        # 检查权重总和
        total_weight = self.return_weight + self.volume_weight + self.momentum_weight + self.volatility_weight
        if abs(total_weight - 1.0) > 0.001:
            raise ValueError(f"Weights must sum to 1.0, got {total_weight}")
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "database_url": self.database_url,
            "database_echo": self.database_echo,
            "z_score_threshold": self.z_score_threshold,
            "lookback_days": self.lookback_days,
            "min_data_points": self.min_data_points,
            "price_anomaly_threshold": self.price_anomaly_threshold,
            "volume_anomaly_threshold": self.volume_anomaly_threshold,
            "volatility_anomaly_threshold": self.volatility_anomaly_threshold,
            "high_price_anomaly_threshold": self.high_price_anomaly_threshold,
            "high_volume_anomaly_threshold": self.high_volume_anomaly_threshold,
            "high_volatility_anomaly_threshold": self.high_volatility_anomaly_threshold,
            "rsi_period": self.rsi_period,
            "macd_fast": self.macd_fast,
            "macd_slow": self.macd_slow,
            "macd_signal": self.macd_signal,
            "bollinger_period": self.bollinger_period,
            "bollinger_std": self.bollinger_std,
            "return_weight": self.return_weight,
            "volume_weight": self.volume_weight,
            "momentum_weight": self.momentum_weight,
            "volatility_weight": self.volatility_weight,
            "base_confidence": self.base_confidence,
            "financial_factors_bonus": self.financial_factors_bonus,
            "price_data_bonus": self.price_data_bonus,
            "min_financial_factors": self.min_financial_factors,
        }
