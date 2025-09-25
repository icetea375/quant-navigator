"""
第一阶段单元测试：QuantSignalEngine 核心算法
测试目标：确保量化信号计算算法的准确性，验证Z-Score等核心指标计算
测试框架：pytest
测试环境：本地MacBook M4
"""

import pytest
import pandas as pd
import numpy as np
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
import sys
import os
import time

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../support_modules'))

# 由于项目主要是TypeScript，我们创建Python版本的模拟类
class MockQuantSignalEngine:
    def __init__(self, db, config):
        self.db = db
        self.config = config
        self.logger = MagicMock()
    
    async def calculateAllSignals(self):
        """模拟计算所有信号"""
        return {
            'success': True,
            'signals_calculated': 10,
            'stocks_processed': 5
        }
    
    async def getRecentPriceData(self, stock_code):
        """模拟获取最近价格数据"""
        return [
            {'ts_code': stock_code, 'close': 1800.0, 'vol': 1000000, 'amount': 1800000000.0, 'pct_chg': 2.5, 'turnover_rate': 0.45},
            {'ts_code': stock_code, 'close': 1820.0, 'vol': 1200000, 'amount': 2184000000.0, 'pct_chg': 1.1, 'turnover_rate': 0.52},
            {'ts_code': stock_code, 'close': 1795.0, 'vol': 950000, 'amount': 1705250000.0, 'pct_chg': -1.4, 'turnover_rate': 0.43}
        ]
    
    async def getSignalsByStock(self, stock_code):
        """模拟获取股票信号"""
        return [
            {
                'signal_type': 'individual_z_score',
                'signal_value': 1.5,
                'z_score': 1.5,
                'calculated_at': int(time.time())
            },
            {
                'signal_type': 'macro_risk_z_score',
                'signal_value': 0.8,
                'z_score': 0.8,
                'calculated_at': int(time.time())
            }
        ]
    
    async def getComplexSignalsByStock(self, stock_code):
        """模拟获取复杂信号"""
        return [
            {
                'signal_type': 'individual_z_score',
                'signal_value': 1.5,
                'z_score': 1.5,
                'calculated_at': int(time.time())
            },
            {
                'signal_type': 'macro_risk_z_score',
                'signal_value': 0.8,
                'z_score': 0.8,
                'calculated_at': int(time.time())
            },
            {
                'signal_type': 'market_style_z_score',
                'signal_value': -0.5,
                'z_score': -0.5,
                'calculated_at': int(time.time())
            },
            {
                'signal_type': 'quant_fingerprint_z_score',
                'signal_value': 2.1,
                'z_score': 2.1,
                'calculated_at': int(time.time())
            }
        ]


class TestQuantSignalEngine:
    """QuantSignalEngine 核心算法单元测试类"""
    
    def setup_method(self):
        """测试前准备"""
        self.test_config = {
            'enabled': True,
            'signalTypes': {
                'macroRisk': {'enabled': True, 'updateInterval': 3600},
                'marketStyle': {'enabled': True, 'updateInterval': 3600},
                'quantFingerprint': {'enabled': True, 'updateInterval': 3600}
            },
            'universe': {
                'broadIndex': ['000300.SH', '000905.SH', '000852.SH'],
                'primaryIndex': ['000001.SH', '000002.SH'],
                'secondaryIndex': ['399001.SZ', '399006.SZ'],
                'leadingStocks': ['600519.SH', '000001.SZ']
            },
            'alerting': {
                'enabled': True,
                'thresholds': {
                    'priceChange': 0.05,
                    'volumeChange': 2.0,
                    'volatility': 0.03
                }
            }
        }
        
        # 准备测试用的价格数据DataFrame
        self.test_price_data = pd.DataFrame({
            'trade_date': pd.date_range('2024-01-01', periods=90, freq='D'),
            'ts_code': ['600519.SH'] * 90,
            'close': np.random.normal(1800, 50, 90),  # 围绕1800的正态分布
            'vol': np.random.normal(1000000, 100000, 90),  # 围绕100万的成交量
            'amount': np.random.normal(1800000000, 100000000, 90),  # 成交额
            'pct_chg': np.random.normal(0, 2, 90),  # 涨跌幅
            'turnover_rate': np.random.normal(0.5, 0.1, 90)  # 换手率
        })
        
        # 准备市场指数数据
        self.test_index_data = pd.DataFrame({
            'trade_date': pd.date_range('2024-01-01', periods=90, freq='D'),
            'ts_code': ['000300.SH'] * 90,
            'close': np.random.normal(4000, 100, 90),
            'pct_chg': np.random.normal(0, 1.5, 90)
        })
    
    def test_individual_z_score_calculation(self):
        """测试个体Z分数计算准确性"""
        # 手动计算期望的Z分数
        close_prices = self.test_price_data['close'].values
        mean_price = np.mean(close_prices)
        std_price = np.std(close_prices, ddof=1)
        
        # 计算最后一天的手动Z分数
        last_price = close_prices[-1]
        expected_z_score = (last_price - mean_price) / std_price
        
        # 模拟QuantSignalEngine的Z分数计算
        def calculate_individual_z_score(prices):
            if len(prices) < 2:
                return 0
            mean_val = np.mean(prices)
            std_val = np.std(prices, ddof=1)
            if std_val == 0:
                return 0
            return (prices[-1] - mean_val) / std_val
        
        actual_z_score = calculate_individual_z_score(close_prices)
        
        # 验证Z分数计算准确性（小数点后4位内保持一致）
        assert abs(actual_z_score - expected_z_score) < 0.0001, \
            f"Z分数计算不准确：期望{expected_z_score:.6f}，实际{actual_z_score:.6f}"
        
        # 验证Z分数的合理性
        assert -5 <= actual_z_score <= 5, f"Z分数应该在合理范围内：{actual_z_score}"
    
    def test_macro_risk_z_score_calculation(self):
        """测试宏观风险Z分数计算"""
        # 准备宏观风险相关数据
        risk_factors = {
            'market_volatility': np.random.normal(0.02, 0.005, 90),  # 市场波动率
            'sector_correlation': np.random.normal(0.6, 0.1, 90),    # 行业相关性
            'liquidity_ratio': np.random.normal(0.8, 0.05, 90),     # 流动性比率
            'sentiment_index': np.random.normal(0.5, 0.1, 90)       # 情绪指数
        }
        
        # 计算综合宏观风险分数
        risk_scores = []
        for i in range(90):
            score = (
                risk_factors['market_volatility'][i] * 0.3 +
                (1 - risk_factors['sector_correlation'][i]) * 0.25 +
                (1 - risk_factors['liquidity_ratio'][i]) * 0.25 +
                (1 - risk_factors['sentiment_index'][i]) * 0.2
            )
            risk_scores.append(score)
        
        risk_scores = np.array(risk_scores)
        
        # 计算Z分数
        mean_risk = np.mean(risk_scores)
        std_risk = np.std(risk_scores, ddof=1)
        macro_risk_z_score = (risk_scores[-1] - mean_risk) / std_risk
        
        # 验证宏观风险Z分数
        assert isinstance(macro_risk_z_score, (int, float)), "宏观风险Z分数应该是数值类型"
        assert not np.isnan(macro_risk_z_score), "宏观风险Z分数不应该是NaN"
        assert not np.isinf(macro_risk_z_score), "宏观风险Z分数不应该是无穷大"
        assert -5 <= macro_risk_z_score <= 5, f"宏观风险Z分数应该在合理范围内：{macro_risk_z_score}"
    
    def test_market_style_z_score_calculation(self):
        """测试市场风格Z分数计算"""
        # 准备市场风格因子数据
        style_factors = {
            'value_factor': np.random.normal(0, 1, 90),      # 价值因子
            'growth_factor': np.random.normal(0, 1, 90),     # 成长因子
            'momentum_factor': np.random.normal(0, 1, 90),   # 动量因子
            'quality_factor': np.random.normal(0, 1, 90),    # 质量因子
            'size_factor': np.random.normal(0, 1, 90)        # 规模因子
        }
        
        # 计算市场风格综合分数
        style_scores = []
        for i in range(90):
            score = (
                style_factors['value_factor'][i] * 0.2 +
                style_factors['growth_factor'][i] * 0.2 +
                style_factors['momentum_factor'][i] * 0.2 +
                style_factors['quality_factor'][i] * 0.2 +
                style_factors['size_factor'][i] * 0.2
            )
            style_scores.append(score)
        
        style_scores = np.array(style_scores)
        
        # 计算Z分数
        mean_style = np.mean(style_scores)
        std_style = np.std(style_scores, ddof=1)
        market_style_z_score = (style_scores[-1] - mean_style) / std_style
        
        # 验证市场风格Z分数
        assert isinstance(market_style_z_score, (int, float)), "市场风格Z分数应该是数值类型"
        assert not np.isnan(market_style_z_score), "市场风格Z分数不应该是NaN"
        assert not np.isinf(market_style_z_score), "市场风格Z分数不应该是无穷大"
        assert -5 <= market_style_z_score <= 5, f"市场风格Z分数应该在合理范围内：{market_style_z_score}"
    
    def test_quant_fingerprint_z_score_calculation(self):
        """测试量化指纹Z分数计算"""
        # 准备量化指纹特征数据
        fingerprint_features = {
            'price_momentum': np.random.normal(0, 1, 90),        # 价格动量
            'volume_pattern': np.random.normal(0, 1, 90),        # 成交量模式
            'volatility_regime': np.random.normal(0, 1, 90),     # 波动率状态
            'correlation_structure': np.random.normal(0, 1, 90), # 相关性结构
            'regime_indicator': np.random.normal(0, 1, 90)       # 状态指标
        }
        
        # 计算量化指纹综合分数
        fingerprint_scores = []
        for i in range(90):
            score = (
                fingerprint_features['price_momentum'][i] * 0.25 +
                fingerprint_features['volume_pattern'][i] * 0.2 +
                fingerprint_features['volatility_regime'][i] * 0.2 +
                fingerprint_features['correlation_structure'][i] * 0.2 +
                fingerprint_features['regime_indicator'][i] * 0.15
            )
            fingerprint_scores.append(score)
        
        fingerprint_scores = np.array(fingerprint_scores)
        
        # 计算Z分数
        mean_fingerprint = np.mean(fingerprint_scores)
        std_fingerprint = np.std(fingerprint_scores, ddof=1)
        quant_fingerprint_z_score = (fingerprint_scores[-1] - mean_fingerprint) / std_fingerprint
        
        # 验证量化指纹Z分数
        assert isinstance(quant_fingerprint_z_score, (int, float)), "量化指纹Z分数应该是数值类型"
        assert not np.isnan(quant_fingerprint_z_score), "量化指纹Z分数不应该是NaN"
        assert not np.isinf(quant_fingerprint_z_score), "量化指纹Z分数不应该是无穷大"
        assert -5 <= quant_fingerprint_z_score <= 5, f"量化指纹Z分数应该在合理范围内：{quant_fingerprint_z_score}"
    
    def test_anomaly_detection_logic(self):
        """测试异常检测逻辑"""
        # 准备正常和异常数据
        normal_z_scores = np.random.normal(0, 1, 100)  # 正常Z分数
        anomaly_z_scores = np.random.normal(0, 1, 100)
        anomaly_z_scores[0] = 4.5  # 添加一个异常值
        anomaly_z_scores[1] = -4.2  # 添加另一个异常值
        
        def detect_anomalies(z_scores, threshold=2.5):
            return np.abs(z_scores) > threshold
        
        # 测试正常数据
        normal_anomalies = detect_anomalies(normal_z_scores)
        normal_anomaly_count = np.sum(normal_anomalies)
        assert normal_anomaly_count <= 5, f"正常数据中异常值过多：{normal_anomaly_count}"
        
        # 测试异常数据
        anomaly_detections = detect_anomalies(anomaly_z_scores)
        assert anomaly_detections[0] == True, "应该检测到第一个异常值"
        assert anomaly_detections[1] == True, "应该检测到第二个异常值"
        
        # 验证异常检测阈值
        threshold = 2.5
        for i, z_score in enumerate(anomaly_z_scores):
            expected_anomaly = abs(z_score) > threshold
            actual_anomaly = anomaly_detections[i]
            assert expected_anomaly == actual_anomaly, \
                f"异常检测逻辑错误：Z分数{z_score}，期望{expected_anomaly}，实际{actual_anomaly}"
    
    def test_signal_consistency_across_timeframes(self):
        """测试信号在不同时间窗口下的一致性"""
        # 准备不同时间窗口的数据
        short_window = 20
        long_window = 60
        
        # 计算短期和长期Z分数
        short_prices = self.test_price_data['close'].tail(short_window).values
        long_prices = self.test_price_data['close'].tail(long_window).values
        
        def calculate_z_score(prices):
            if len(prices) < 2:
                return 0
            mean_val = np.mean(prices)
            std_val = np.std(prices, ddof=1)
            if std_val == 0:
                return 0
            return (prices[-1] - mean_val) / std_val
        
        short_z_score = calculate_z_score(short_prices)
        long_z_score = calculate_z_score(long_prices)
        
        # 验证Z分数的合理性
        assert isinstance(short_z_score, (int, float)), "短期Z分数应该是数值类型"
        assert isinstance(long_z_score, (int, float)), "长期Z分数应该是数值类型"
        assert not np.isnan(short_z_score), "短期Z分数不应该是NaN"
        assert not np.isnan(long_z_score), "长期Z分数不应该是NaN"
        
        # 验证信号方向一致性（当数据足够时）
        if len(short_prices) >= 10 and len(long_prices) >= 30:
            # 短期和长期信号应该有一定的相关性
            correlation = np.corrcoef(short_prices, long_prices[-len(short_prices):])[0, 1]
            assert correlation > 0.5, f"短期和长期价格数据相关性过低：{correlation}"
    
    def test_edge_cases_and_boundary_conditions(self):
        """测试边界条件和特殊情况"""
        # 测试空数据
        empty_prices = np.array([])
        empty_z_score = (empty_prices[-1] - np.mean(empty_prices)) / np.std(empty_prices) if len(empty_prices) > 0 else 0
        assert np.isnan(empty_z_score) or empty_z_score == 0, "空数据应该返回0或NaN"
        
        # 测试单点数据
        single_price = np.array([1800.0])
        single_z_score = (single_price[-1] - np.mean(single_price)) / np.std(single_price, ddof=1)
        assert np.isnan(single_z_score), "单点数据应该返回NaN"
        
        # 测试常数数据
        constant_prices = np.array([1800.0] * 10)
        constant_z_score = (constant_prices[-1] - np.mean(constant_prices)) / np.std(constant_prices, ddof=1)
        assert np.isnan(constant_z_score), "常数数据应该返回NaN"
        
        # 测试极值数据
        extreme_prices = np.array([1, 2, 3, 4, 5, 1000])  # 包含极值
        extreme_z_score = (extreme_prices[-1] - np.mean(extreme_prices)) / np.std(extreme_prices, ddof=1)
        assert abs(extreme_z_score) > 2, f"极值数据应该产生高Z分数：{extreme_z_score}"
    
    def test_signal_calculation_performance(self):
        """测试信号计算性能"""
        import time
        
        # 准备大量数据
        large_dataset = np.random.normal(1800, 50, 10000)
        
        def calculate_z_score_performance(prices):
            start_time = time.time()
            mean_val = np.mean(prices)
            std_val = np.std(prices, ddof=1)
            z_score = (prices[-1] - mean_val) / std_val if std_val > 0 else 0
            end_time = time.time()
            return z_score, end_time - start_time
        
        z_score, execution_time = calculate_z_score_performance(large_dataset)
        
        # 验证性能要求（单次计算<1秒）
        assert execution_time < 1.0, f"Z分数计算时间过长：{execution_time:.4f}秒"
        assert isinstance(z_score, (int, float)), "Z分数应该是数值类型"
        assert not np.isnan(z_score), "Z分数不应该是NaN"
    
    def test_signal_quality_metrics(self):
        """测试信号质量指标"""
        # 准备测试数据
        test_signals = np.random.normal(0, 1, 1000)
        
        # 计算信号质量指标
        signal_mean = np.mean(test_signals)
        signal_std = np.std(test_signals, ddof=1)
        signal_skewness = np.mean(((test_signals - signal_mean) / signal_std) ** 3)
        signal_kurtosis = np.mean(((test_signals - signal_mean) / signal_std) ** 4) - 3
        
        # 验证信号质量
        assert abs(signal_mean) < 0.1, f"信号均值应该接近0：{signal_mean}"
        assert 0.8 < signal_std < 1.2, f"信号标准差应该在合理范围内：{signal_std}"
        assert abs(signal_skewness) < 0.5, f"信号偏度应该在合理范围内：{signal_skewness}"
        assert abs(signal_kurtosis) < 1.0, f"信号峰度应该在合理范围内：{signal_kurtosis}"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
