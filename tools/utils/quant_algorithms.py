"""
量化算法工具类
实现真实的量化计算算法
"""

import math
from typing import Any, Dict, List, Tuple


class QuantAlgorithms:
    """量化算法工具类"""
    
    @staticmethod
    def calculate_z_score(values: List[float], current_value: float) -> float:
        """
        计算Z分数
        
        Args:
            values: 历史数据列表
            current_value: 当前值
            
        Returns:
            Z分数
        """
        if not values or len(values) < 2:
            return 0.0
        
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        std_dev = math.sqrt(variance)
        
        if std_dev == 0:
            return 0.0
        
        return (current_value - mean) / std_dev
    
    @staticmethod
    def calculate_return_z_score(price_data: List[Dict[str, Any]], lookback_days: int = 30) -> float:
        """
        计算收益率Z分数
        
        Args:
            price_data: 价格数据列表
            lookback_days: 回望天数
            
        Returns:
            收益率Z分数
        """
        if not price_data or len(price_data) < 2:
            return 0.0
        
        # 提取收益率数据
        returns = [data.get("pct_chg", 0.0) for data in price_data[-lookback_days:]]
        current_return = returns[-1] if returns else 0.0
        
        return QuantAlgorithms.calculate_z_score(returns[:-1], current_return)
    
    @staticmethod
    def calculate_volume_z_score(price_data: List[Dict[str, Any]], lookback_days: int = 30) -> float:
        """
        计算成交量Z分数
        
        Args:
            price_data: 价格数据列表
            lookback_days: 回望天数
            
        Returns:
            成交量Z分数
        """
        if not price_data or len(price_data) < 2:
            return 0.0
        
        # 提取成交量数据
        volumes = [data.get("vol", 0.0) for data in price_data[-lookback_days:]]
        current_volume = volumes[-1] if volumes else 0.0
        
        return QuantAlgorithms.calculate_z_score(volumes[:-1], current_volume)
    
    @staticmethod
    def calculate_momentum_z_score(price_data: List[Dict[str, Any]], lookback_days: int = 30) -> float:
        """
        计算动量Z分数
        
        Args:
            price_data: 价格数据列表
            lookback_days: 回望天数
            
        Returns:
            动量Z分数
        """
        if not price_data or len(price_data) < 2:
            return 0.0
        
        # 计算动量（短期收益率）
        returns = [data.get("pct_chg", 0.0) for data in price_data[-lookback_days:]]
        if len(returns) < 2:
            return 0.0
        
        # 计算5日动量
        momentum_period = min(5, len(returns) - 1)
        momentum_values = []
        
        for i in range(momentum_period, len(returns)):
            momentum = sum(returns[i-momentum_period:i])
            momentum_values.append(momentum)
        
        if not momentum_values:
            return 0.0
        
        current_momentum = momentum_values[-1]
        return QuantAlgorithms.calculate_z_score(momentum_values[:-1], current_momentum)
    
    @staticmethod
    def calculate_volatility_z_score(price_data: List[Dict[str, Any]], lookback_days: int = 30) -> float:
        """
        计算波动率Z分数
        
        Args:
            price_data: 价格数据列表
            lookback_days: 回望天数
            
        Returns:
            波动率Z分数
        """
        if not price_data or len(price_data) < 2:
            return 0.0
        
        # 计算滚动波动率
        returns = [data.get("pct_chg", 0.0) for data in price_data[-lookback_days:]]
        if len(returns) < 10:
            return 0.0
        
        volatility_period = min(10, len(returns) - 1)
        volatility_values = []
        
        for i in range(volatility_period, len(returns)):
            period_returns = returns[i-volatility_period:i]
            mean_return = sum(period_returns) / len(period_returns)
            variance = sum((r - mean_return) ** 2 for r in period_returns) / len(period_returns)
            volatility = math.sqrt(variance)
            volatility_values.append(volatility)
        
        if not volatility_values:
            return 0.0
        
        current_volatility = volatility_values[-1]
        return QuantAlgorithms.calculate_z_score(volatility_values[:-1], current_volatility)
    
    @staticmethod
    def calculate_rsi(price_data: List[Dict[str, Any]], period: int = 14) -> float:
        """
        计算RSI指标
        
        Args:
            price_data: 价格数据列表
            period: RSI周期
            
        Returns:
            RSI值 (0-100)
        """
        if not price_data or len(price_data) < period + 1:
            return 50.0
        
        # 提取价格变化
        returns = [data.get("pct_chg", 0.0) for data in price_data[-period-1:]]
        
        gains = []
        losses = []
        
        for i in range(1, len(returns)):
            change = returns[i] - returns[i-1]
            if change > 0:
                gains.append(change)
                losses.append(0)
            else:
                gains.append(0)
                losses.append(-change)
        
        if len(gains) < period:
            return 50.0
        
        # 计算平均收益和平均损失
        avg_gain = sum(gains[-period:]) / period
        avg_loss = sum(losses[-period:]) / period
        
        if avg_loss == 0:
            return 100.0
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return max(0, min(100, rsi))
    
    @staticmethod
    def calculate_macd(price_data: List[Dict[str, Any]], fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[float, float, float]:
        """
        计算MACD指标
        
        Args:
            price_data: 价格数据列表
            fast: 快线周期
            slow: 慢线周期
            signal: 信号线周期
            
        Returns:
            (MACD, Signal, Histogram)
        """
        if not price_data or len(price_data) < slow:
            return 0.0, 0.0, 0.0
        
        # 提取价格数据（这里用收益率作为价格代理）
        prices = [data.get("pct_chg", 0.0) for data in price_data[-slow*2:]]
        
        if len(prices) < slow:
            return 0.0, 0.0, 0.0
        
        # 计算EMA
        def calculate_ema(values: List[float], period: int) -> float:
            if not values:
                return 0.0
            
            multiplier = 2 / (period + 1)
            ema = values[0]
            
            for value in values[1:]:
                ema = (value * multiplier) + (ema * (1 - multiplier))
            
            return ema
        
        # 计算快线和慢线EMA
        fast_ema = calculate_ema(prices[-fast:], fast)
        slow_ema = calculate_ema(prices[-slow:], slow)
        
        macd_line = fast_ema - slow_ema
        
        # 计算信号线（MACD的EMA）
        if len(prices) >= slow + signal:
            macd_values = []
            for i in range(slow, len(prices)):
                fast_ema_i = calculate_ema(prices[i-fast:i+1], fast)
                slow_ema_i = calculate_ema(prices[i-slow:i+1], slow)
                macd_values.append(fast_ema_i - slow_ema_i)
            
            if len(macd_values) >= signal:
                signal_line = calculate_ema(macd_values[-signal:], signal)
            else:
                signal_line = 0.0
        else:
            signal_line = 0.0
        
        histogram = macd_line - signal_line
        
        return macd_line, signal_line, histogram
    
    @staticmethod
    def calculate_bollinger_bands(price_data: List[Dict[str, Any]], period: int = 20, std_dev: float = 2.0) -> Tuple[float, float, float, float]:
        """
        计算布林带
        
        Args:
            price_data: 价格数据列表
            period: 周期
            std_dev: 标准差倍数
            
        Returns:
            (上轨, 中轨, 下轨, 位置)
        """
        if not price_data or len(price_data) < period:
            return 0.0, 0.0, 0.0, 0.5
        
        # 提取价格数据
        prices = [data.get("pct_chg", 0.0) for data in price_data[-period:]]
        
        if len(prices) < period:
            return 0.0, 0.0, 0.0, 0.5
        
        # 计算中轨（移动平均）
        middle_band = sum(prices) / len(prices)
        
        # 计算标准差
        variance = sum((p - middle_band) ** 2 for p in prices) / len(prices)
        std = math.sqrt(variance)
        
        # 计算上下轨
        upper_band = middle_band + (std * std_dev)
        lower_band = middle_band - (std * std_dev)
        
        # 计算当前位置
        current_price = prices[-1]
        if upper_band != lower_band:
            position = (current_price - lower_band) / (upper_band - lower_band)
            position = max(0, min(1, position))  # 限制在0-1之间
        else:
            position = 0.5
        
        return upper_band, middle_band, lower_band, position
    
    @staticmethod
    def calculate_moving_average_signal(price_data: List[Dict[str, Any]], short_period: int = 5, long_period: int = 20) -> float:
        """
        计算移动平均信号
        
        Args:
            price_data: 价格数据列表
            short_period: 短期周期
            long_period: 长期周期
            
        Returns:
            移动平均信号强度
        """
        if not price_data or len(price_data) < long_period:
            return 0.0
        
        # 提取价格数据
        prices = [data.get("pct_chg", 0.0) for data in price_data[-long_period:]]
        
        if len(prices) < long_period:
            return 0.0
        
        # 计算短期和长期移动平均
        short_ma = sum(prices[-short_period:]) / short_period
        long_ma = sum(prices[-long_period:]) / long_period
        
        # 计算信号强度
        if long_ma != 0:
            signal = (short_ma - long_ma) / abs(long_ma)
        else:
            signal = 0.0
        
        return signal
    
    @staticmethod
    def calculate_signal_strength(
        return_z: float,
        volume_z: float,
        momentum_z: float,
        volatility_z: float,
        weights: Tuple[float, float, float, float]
    ) -> float:
        """
        计算综合信号强度
        
        Args:
            return_z: 收益率Z分数
            volume_z: 成交量Z分数
            momentum_z: 动量Z分数
            volatility_z: 波动率Z分数
            weights: 权重元组 (return, volume, momentum, volatility)
            
        Returns:
            综合信号强度 (-1到1)
        """
        return_weight, volume_weight, momentum_weight, volatility_weight = weights
        
        # 加权平均
        weighted_sum = (
            return_z * return_weight +
            volume_z * volume_weight +
            momentum_z * momentum_weight +
            volatility_z * volatility_weight
        )
        
        # 归一化到[-1, 1]
        return max(-1.0, min(1.0, weighted_sum / 2.0))
    
    @staticmethod
    def calculate_confidence(
        financial_factors: Dict[str, Any],
        price_data: List[Dict[str, Any]],
        base_confidence: float = 0.5,
        financial_bonus: float = 0.2,
        price_bonus: float = 0.3,
        min_financial_factors: int = 5
    ) -> float:
        """
        计算信号置信度
        
        Args:
            financial_factors: 财务因子
            price_data: 价格数据
            base_confidence: 基础置信度
            financial_bonus: 财务因子奖励
            price_bonus: 价格数据奖励
            min_financial_factors: 最小财务因子数量
            
        Returns:
            置信度 (0到1)
        """
        confidence = base_confidence
        
        # 财务因子奖励
        if financial_factors and len(financial_factors) >= min_financial_factors:
            confidence += financial_bonus
        
        # 价格数据奖励
        if price_data and len(price_data) > 0:
            confidence += price_bonus
        
        return min(confidence, 1.0)
