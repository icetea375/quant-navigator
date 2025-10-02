"""
量化信号服务 - 量化信号计算和异常检测实现
遵循TDD原则:先写测试,后写实现
"""

import logging
from datetime import datetime
from typing import Any, Optional

from quant_navigator_shared_types.events import AnomalyEvent, AnomalyType, SeverityLevel
from quant_navigator_shared_types.quant_signals import (
    QuantSignal,
    SignalStatus,
    SignalType,
)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.entities.base import Base
from src.entities.quant_signal import QuantSignalEntity
from src.exceptions import (
    QuantAnomalyDetectionError,
    QuantDatabaseError,
    QuantSignalError,
)


class QuantSignalService:
    """量化信号服务类 - 负责量化信号计算和异常检测"""

    def __init__(self, config: dict[str, Any]):
        """
        初始化量化信号服务

        Args:
            config: 配置参数
        """
        self.config = config
        self.logger = logging.getLogger(__name__)

        # 初始化数据库连接
        database_config = config.get("database", {})
        self.engine = create_engine(
            database_config.get("url", "sqlite:///:memory:"),
            echo=database_config.get("echo", False),
        )
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

        # 量化引擎配置
        self.quant_config = config.get("quant_engine", {})
        self.z_score_threshold = self.quant_config.get("z_score_threshold", 2.0)
        self.lookback_days = self.quant_config.get("lookback_days", 30)
        self.min_data_points = self.quant_config.get("min_data_points", 20)

    async def calculate_quant_signal(
        self,
        stock_code: str,
        trade_date: datetime,
        financial_factors: dict[str, Any],
        price_data: list[dict[str, Any]],
    ) -> QuantSignal:
        """
        计算量化信号

        Args:
            stock_code: 股票代码
            trade_date: 交易日期
            financial_factors: 财务因子
            price_data: 价格数据

        Returns:
            量化信号对象
        """
        self.logger.info(f"开始计算量化信号: {stock_code}, {trade_date}")

        try:
            # 计算各种Z分数
            return_z_score = self._calculate_return_z_score(price_data)
            volume_z_score = self._calculate_volume_z_score(price_data)
            momentum_z_score = self._calculate_momentum_z_score(price_data)
            volatility_z_score = self._calculate_volatility_z_score(price_data)

            # 计算宏观和市场指标
            macro_risk_z_score = self._calculate_macro_risk_z_score(financial_factors)
            market_style_z_score = self._calculate_market_style_z_score(
                financial_factors
            )
            industry_rotation_z_score = self._calculate_industry_rotation_z_score(
                financial_factors
            )
            concept_z_score = self._calculate_concept_z_score(financial_factors)

            # 计算MDA相关指标
            mda_fulfillment_rate = self._calculate_mda_fulfillment_rate(
                financial_factors
            )
            management_credibility_score = self._calculate_management_credibility_score(
                financial_factors
            )
            disclosure_quality_score = self._calculate_disclosure_quality_score(
                financial_factors
            )
            financial_transparency_score = self._calculate_financial_transparency_score(
                financial_factors
            )

            # 计算技术指标
            rsi = self._calculate_rsi(price_data)
            macd_signal = self._calculate_macd_signal(price_data)
            bollinger_position = self._calculate_bollinger_position(price_data)
            ma_signal = self._calculate_ma_signal(price_data)

            # 计算综合指标
            overall_signal_strength = self._calculate_overall_signal_strength(
                return_z_score, volume_z_score, momentum_z_score, volatility_z_score
            )
            signal_confidence = self._calculate_signal_confidence(
                financial_factors, price_data
            )

            # 创建量化信号对象
            quant_signal = QuantSignal(
                signal_id=f"sig_{stock_code}_{trade_date.strftime('%Y%m%d')}_{int(datetime.now().timestamp())}",
                target_code=stock_code,
                signal_date=trade_date,
                signal_type=SignalType.INDIVIDUAL,
                status=SignalStatus.ACTIVE,
                return_z_score=return_z_score,
                volume_z_score=volume_z_score,
                momentum_z_score=momentum_z_score,
                volatility_z_score=volatility_z_score,
                macro_risk_z_score=macro_risk_z_score,
                market_style_z_score=market_style_z_score,
                industry_rotation_z_score=industry_rotation_z_score,
                concept_z_score=concept_z_score,
                mda_fulfillment_rate=mda_fulfillment_rate,
                management_credibility_score=management_credibility_score,
                disclosure_quality_score=disclosure_quality_score,
                financial_transparency_score=financial_transparency_score,
                rsi=rsi,
                macd_signal=macd_signal,
                bollinger_position=bollinger_position,
                ma_signal=ma_signal,
                overall_signal_strength=overall_signal_strength,
                signal_confidence=signal_confidence,
                validity_days=30,
                model_version="v1.0.0",
                calculation_params={
                    "z_score_threshold": self.z_score_threshold,
                    "lookback_days": self.lookback_days,
                },
                source="quant_signal_service",
                metadata={
                    "calculated_at": datetime.now().isoformat(),
                    "financial_factors": financial_factors,
                },
            )

            self.logger.info(
                f"量化信号计算完成: {stock_code}, 信号强度: {overall_signal_strength:.3f}"
            )
            return quant_signal

        except Exception as e:
            self.logger.error(f"计算量化信号失败: {e}")
            raise QuantSignalError(
                f"量化信号计算失败: {e}",
                signal_id=f"sig_{stock_code}_{trade_date.strftime('%Y%m%d')}",
                signal_type="quantitative",
                context={
                    "stock_code": stock_code,
                    "trade_date": trade_date.isoformat(),
                    "financial_factors_keys": list(financial_factors.keys())
                    if financial_factors
                    else [],
                    "price_data_length": len(price_data) if price_data else 0,
                },
            ) from e

    async def detect_anomalies(
        self,
        stock_code: str,
        trade_date: datetime,
        price_data: list[dict[str, Any]],
        basic_data: list[dict[str, Any]],
    ) -> list[AnomalyEvent]:
        """
        检测异常事件

        Args:
            stock_code: 股票代码
            trade_date: 交易日期
            price_data: 价格数据
            basic_data: 基本面数据

        Returns:
            异常事件列表
        """
        self.logger.info(f"开始检测异常事件: {stock_code}, {trade_date}")

        anomalies = []

        try:
            if not price_data or not basic_data:
                return anomalies

            price_info = price_data[0]
            basic_info = basic_data[0]

            # 检测价格异常
            price_anomaly = self._detect_price_anomaly(
                stock_code, trade_date, price_info
            )
            if price_anomaly:
                anomalies.append(price_anomaly)

            # 检测成交量异常
            volume_anomaly = self._detect_volume_anomaly(
                stock_code, trade_date, price_info, basic_info
            )
            if volume_anomaly:
                anomalies.append(volume_anomaly)

            # 检测波动率异常
            volatility_anomaly = self._detect_volatility_anomaly(
                stock_code, trade_date, price_info
            )
            if volatility_anomaly:
                anomalies.append(volatility_anomaly)

            self.logger.info(
                f"异常检测完成: {stock_code}, 发现 {len(anomalies)} 个异常"
            )
            return anomalies

        except Exception as e:
            self.logger.error(f"异常检测失败: {e}")
            raise QuantAnomalyDetectionError(
                f"异常检测失败: {e}",
                stock_code=stock_code,
                anomaly_type="multi_type",
                context={
                    "stock_code": stock_code,
                    "trade_date": trade_date.isoformat(),
                    "price_data_length": len(price_data) if price_data else 0,
                    "basic_data_length": len(basic_data) if basic_data else 0,
                },
            ) from e

    async def save_quant_signal(self, quant_signal: QuantSignal) -> QuantSignalEntity:
        """
        保存量化信号到数据库

        Args:
            quant_signal: 量化信号对象

        Returns:
            保存的实体对象
        """
        self.logger.info(f"开始保存量化信号: {quant_signal.signal_id}")

        try:
            with self.Session() as session:
                # 转换为实体对象
                signal_entity = QuantSignalEntity.from_quant_signal(quant_signal)

                # 保存到数据库
                session.add(signal_entity)
                session.commit()
                session.refresh(signal_entity)

                self.logger.info(f"量化信号保存成功: {signal_entity.signal_id}")
                return signal_entity

        except Exception as e:
            self.logger.error(f"保存量化信号失败: {e}")
            raise QuantDatabaseError(
                f"保存量化信号失败: {e}",
                operation="save",
                entity="QuantSignal",
                context={
                    "signal_id": quant_signal.signal_id if quant_signal else "unknown",
                    "target_code": quant_signal.target_code
                    if quant_signal
                    else "unknown",
                    "signal_type": quant_signal.signal_type.value
                    if quant_signal and hasattr(quant_signal.signal_type, "value")
                    else "unknown",
                },
            ) from e

    async def get_quant_signal_by_id(
        self, signal_id: str
    ) -> Optional[QuantSignalEntity]:
        """
        根据ID获取量化信号

        Args:
            signal_id: 信号ID

        Returns:
            量化信号实体对象
        """
        try:
            with self.Session() as session:
                return (
                    session.query(QuantSignalEntity)
                    .filter(QuantSignalEntity.signal_id == signal_id)
                    .first()
                )

        except Exception as e:
            self.logger.error(f"获取量化信号失败: {e}")
            raise QuantDatabaseError(
                f"获取量化信号失败: {e}",
                operation="query",
                entity="QuantSignal",
                context={"signal_id": signal_id, "query_type": "by_id"},
            ) from e

    def _calculate_return_z_score(self, price_data: list[dict[str, Any]]) -> float:
        """计算收益率Z分数"""
        if not price_data:
            return 0.0

        # 简化实现,实际应该基于历史数据计算
        pct_chg = price_data[0].get("pct_chg", 0.0)
        return pct_chg / 10.0  # 简化的Z分数计算

    def _calculate_volume_z_score(self, price_data: list[dict[str, Any]]) -> float:
        """计算成交量Z分数"""
        if not price_data:
            return 0.0

        # 简化实现
        volume = price_data[0].get("vol", 0.0)
        return (volume - 100000000) / 50000000  # 简化的Z分数计算

    def _calculate_momentum_z_score(self, price_data: list[dict[str, Any]]) -> float:
        """计算动量Z分数"""
        if not price_data:
            return 0.0

        # 简化实现
        pct_chg = price_data[0].get("pct_chg", 0.0)
        return pct_chg / 5.0  # 简化的动量Z分数

    def _calculate_volatility_z_score(self, price_data: list[dict[str, Any]]) -> float:
        """计算波动率Z分数"""
        if not price_data:
            return 0.0

        # 简化实现
        pct_chg = price_data[0].get("pct_chg", 0.0)
        return abs(pct_chg) / 3.0  # 简化的波动率Z分数

    def _calculate_macro_risk_z_score(self, financial_factors: dict[str, Any]) -> float:
        """计算宏观风险Z分数"""
        # 简化实现
        return 0.0

    def _calculate_market_style_z_score(
        self, financial_factors: dict[str, Any]
    ) -> float:
        """计算市场风格Z分数"""
        # 简化实现
        return 0.0

    def _calculate_industry_rotation_z_score(
        self, financial_factors: dict[str, Any]
    ) -> float:
        """计算行业轮动Z分数"""
        # 简化实现
        return 0.0

    def _calculate_concept_z_score(self, financial_factors: dict[str, Any]) -> float:
        """计算概念Z分数"""
        # 简化实现
        return 0.0

    def _calculate_mda_fulfillment_rate(
        self, financial_factors: dict[str, Any]
    ) -> float:
        """计算MDA履行率"""
        # 简化实现
        return 0.8

    def _calculate_management_credibility_score(
        self, financial_factors: dict[str, Any]
    ) -> float:
        """计算管理层可信度分数"""
        # 简化实现
        return 0.7

    def _calculate_disclosure_quality_score(
        self, financial_factors: dict[str, Any]
    ) -> float:
        """计算披露质量分数"""
        # 简化实现
        return 0.75

    def _calculate_financial_transparency_score(
        self, financial_factors: dict[str, Any]
    ) -> float:
        """计算财务透明度分数"""
        # 简化实现
        return 0.8

    def _calculate_rsi(self, price_data: list[dict[str, Any]]) -> float:
        """计算RSI指标"""
        if not price_data:
            return 50.0

        # 简化实现
        pct_chg = price_data[0].get("pct_chg", 0.0)
        return min(max(50 + pct_chg * 2, 0), 100)  # 简化的RSI计算

    def _calculate_macd_signal(self, price_data: list[dict[str, Any]]) -> float:
        """计算MACD信号"""
        if not price_data:
            return 0.0

        # 简化实现
        pct_chg = price_data[0].get("pct_chg", 0.0)
        return pct_chg / 10.0  # 简化的MACD信号

    def _calculate_bollinger_position(self, price_data: list[dict[str, Any]]) -> float:
        """计算布林带位置"""
        if not price_data:
            return 0.5

        # 简化实现
        pct_chg = price_data[0].get("pct_chg", 0.0)
        return min(max(0.5 + pct_chg / 100, 0), 1)  # 简化的布林带位置

    def _calculate_ma_signal(self, price_data: list[dict[str, Any]]) -> float:
        """计算移动平均信号"""
        if not price_data:
            return 0.0

        # 简化实现
        pct_chg = price_data[0].get("pct_chg", 0.0)
        return pct_chg / 5.0  # 简化的移动平均信号

    def _calculate_overall_signal_strength(
        self, return_z: float, volume_z: float, momentum_z: float, volatility_z: float
    ) -> float:
        """计算整体信号强度"""
        # 加权平均
        weights = [0.3, 0.2, 0.3, 0.2]
        z_scores = [return_z, volume_z, momentum_z, volatility_z]

        weighted_sum = sum(w * z for w, z in zip(weights, z_scores))
        return min(max(weighted_sum / 2.0, -1.0), 1.0)  # 归一化到[-1, 1]

    def _calculate_signal_confidence(
        self, financial_factors: dict[str, Any], price_data: list[dict[str, Any]]
    ) -> float:
        """计算信号置信度"""
        # 简化实现,基于数据完整性
        confidence = 0.5

        if financial_factors and len(financial_factors) > 5:
            confidence += 0.2

        if price_data and len(price_data) > 0:
            confidence += 0.3

        return min(confidence, 1.0)

    def _detect_price_anomaly(
        self, stock_code: str, trade_date: datetime, price_info: dict[str, Any]
    ) -> Optional[AnomalyEvent]:
        """检测价格异常"""
        pct_chg = price_info.get("pct_chg", 0.0)

        if abs(pct_chg) > 10.0:  # 涨跌幅超过10%
            z_score = abs(pct_chg) / 3.0
            severity = (
                SeverityLevel.HIGH if abs(pct_chg) > 15.0 else SeverityLevel.MEDIUM
            )

            return AnomalyEvent(
                id=f"anomaly_{stock_code}_{trade_date.strftime('%Y%m%d')}_price_{int(datetime.now().timestamp())}",
                stock_code=stock_code,
                timestamp=int(trade_date.timestamp() * 1000),
                anomaly_type=AnomalyType.PRICE,
                severity=severity,
                description=f"价格异常波动: {pct_chg:.2f}%",
                z_score=z_score,
                current_value=pct_chg,
                expected_value=0.0,
                deviation=pct_chg,
                confidence=min(z_score / 5.0, 1.0),
                context={
                    "market_state": "trading",
                    "sector_performance": 0.0,
                    "news_count": 0,
                    "volume_ratio": 1.0,
                },
                metadata={"detection_method": "price_threshold"},
            )

        return None

    def _detect_volume_anomaly(
        self,
        stock_code: str,
        trade_date: datetime,
        price_info: dict[str, Any],
        basic_info: dict[str, Any],
    ) -> Optional[AnomalyEvent]:
        """检测成交量异常"""
        volume_ratio = basic_info.get("volume_ratio", 1.0)

        if volume_ratio > 3.0:  # 成交量比率超过3倍
            z_score = volume_ratio / 2.0
            severity = (
                SeverityLevel.HIGH if volume_ratio > 5.0 else SeverityLevel.MEDIUM
            )

            return AnomalyEvent(
                id=f"anomaly_{stock_code}_{trade_date.strftime('%Y%m%d')}_volume_{int(datetime.now().timestamp())}",
                stock_code=stock_code,
                timestamp=int(trade_date.timestamp() * 1000),
                anomaly_type=AnomalyType.VOLUME,
                severity=severity,
                description=f"成交量异常放大: {volume_ratio:.2f}倍",
                z_score=z_score,
                current_value=volume_ratio,
                expected_value=1.0,
                deviation=volume_ratio - 1.0,
                confidence=min(z_score / 3.0, 1.0),
                context={
                    "market_state": "trading",
                    "sector_performance": 0.0,
                    "news_count": 0,
                    "volume_ratio": volume_ratio,
                },
                metadata={"detection_method": "volume_threshold"},
            )

        return None

    def _detect_volatility_anomaly(
        self, stock_code: str, trade_date: datetime, price_info: dict[str, Any]
    ) -> Optional[AnomalyEvent]:
        """检测波动率异常"""
        pct_chg = price_info.get("pct_chg", 0.0)
        volatility = abs(pct_chg)

        if volatility > 8.0:  # 波动率超过8%
            z_score = volatility / 2.0
            severity = SeverityLevel.HIGH if volatility > 12.0 else SeverityLevel.MEDIUM

            return AnomalyEvent(
                id=f"anomaly_{stock_code}_{trade_date.strftime('%Y%m%d')}_volatility_{int(datetime.now().timestamp())}",
                stock_code=stock_code,
                timestamp=int(trade_date.timestamp() * 1000),
                anomaly_type=AnomalyType.VOLATILITY,
                severity=severity,
                description=f"波动率异常: {volatility:.2f}%",
                z_score=z_score,
                current_value=volatility,
                expected_value=2.0,
                deviation=volatility - 2.0,
                confidence=min(z_score / 4.0, 1.0),
                context={
                    "market_state": "trading",
                    "sector_performance": 0.0,
                    "news_count": 0,
                    "volume_ratio": 1.0,
                },
                metadata={"detection_method": "volatility_threshold"},
            )

        return None
