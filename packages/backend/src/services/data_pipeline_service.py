"""
数据管道服务 - 财务数据翻译层实现
遵循TDD原则：先写测试，后写实现
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
import tushare as ts
from quant_navigator_shared_types.events import AnomalyEvent, AnomalyType, SeverityLevel


class DataPipelineService:
    """数据管道服务类 - 负责从Tushare获取数据并提取财务因子"""
    
    def __init__(self, config: Dict[str, Any]):
        """
        初始化数据管道服务
        
        Args:
            config: 配置参数
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # 初始化Tushare
        tushare_config = config.get("tushare", {})
        if "token" in tushare_config:
            ts.set_token(tushare_config["token"])
        self.pro = ts.pro_api()
    
    async def fetch_tushare_data(self, stock_code: str, trade_date: str) -> Dict[str, Any]:
        """
        从Tushare获取原始数据
        
        Args:
            stock_code: 股票代码
            trade_date: 交易日期
            
        Returns:
            原始数据字典
        """
        # 参数验证
        if not stock_code:
            raise ValueError("股票代码不能为空")
        
        try:
            # 验证日期格式
            datetime.strptime(trade_date, "%Y%m%d")
        except ValueError:
            raise ValueError("无效的日期格式，应为YYYYMMDD")
        
        self.logger.info(f"开始获取Tushare数据: {stock_code}, {trade_date}")
        
        try:
            # 获取股票基本信息
            stock_basic = self.pro.stock_basic(
                ts_code=stock_code,
                fields="ts_code,symbol,name,area,industry,market,list_date"
            )
            
            # 获取日度基本面数据
            daily_basic = self.pro.daily_basic(
                ts_code=stock_code,
                trade_date=trade_date,
                fields="ts_code,trade_date,close,turnover_rate,volume_ratio,pe,pe_ttm,pb,ps,ps_ttm,dv_ratio,dv_ttm,total_share,float_share,free_share,total_mv,circ_mv"
            )
            
            # 获取日度行情数据
            daily = self.pro.daily(
                ts_code=stock_code,
                trade_date=trade_date,
                fields="ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount"
            )
            
            return {
                "stock_basic": stock_basic.to_dict("records"),
                "daily_basic": daily_basic.to_dict("records"),
                "daily": daily.to_dict("records")
            }
            
        except Exception as e:
            self.logger.error(f"获取Tushare数据失败: {e}")
            raise Exception(f"API调用失败: {e}")
    
    async def extract_financial_factors(self, stock_code: str, trade_date: str, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        从原始数据中提取财务因子
        
        Args:
            stock_code: 股票代码
            trade_date: 交易日期
            raw_data: 原始数据
            
        Returns:
            财务因子字典
        """
        # 参数验证
        if not stock_code:
            raise ValueError("股票代码不能为空")
        
        if not trade_date:
            raise ValueError("交易日期不能为空")
        
        if not raw_data:
            raise ValueError("原始数据不能为空")
        
        self.logger.info(f"开始提取财务因子: {stock_code}, {trade_date}")
        
        try:
            # 从daily_basic数据中提取财务指标
            daily_basic = raw_data.get("daily_basic", [])
            if not daily_basic:
                raise ValueError("缺少日度基本面数据")
            
            basic_data = daily_basic[0]
            
            # 提取核心财务因子
            financial_factors = {
                "stock_code": stock_code,
                "trade_date": trade_date,
                "pe_ratio": basic_data.get("pe", 0.0),
                "pb_ratio": basic_data.get("pb", 0.0),
                "ps_ratio": basic_data.get("ps", 0.0),
                "dividend_yield": basic_data.get("dv_ratio", 0.0),
                "market_cap": basic_data.get("total_mv", 0.0),
                "turnover_rate": basic_data.get("turnover_rate", 0.0),
                "volume_ratio": basic_data.get("volume_ratio", 0.0),
                "float_market_cap": basic_data.get("circ_mv", 0.0),
                "total_shares": basic_data.get("total_share", 0.0),
                "float_shares": basic_data.get("float_share", 0.0),
                "free_shares": basic_data.get("free_share", 0.0)
            }
            
            # 从daily数据中提取价格信息
            daily = raw_data.get("daily", [])
            if daily:
                price_data = daily[0]
                financial_factors.update({
                    "open_price": price_data.get("open", 0.0),
                    "high_price": price_data.get("high", 0.0),
                    "low_price": price_data.get("low", 0.0),
                    "close_price": price_data.get("close", 0.0),
                    "pre_close": price_data.get("pre_close", 0.0),
                    "price_change": price_data.get("change", 0.0),
                    "price_change_pct": price_data.get("pct_chg", 0.0),
                    "volume": price_data.get("vol", 0.0),
                    "amount": price_data.get("amount", 0.0)
                })
            
            self.logger.info(f"财务因子提取完成: {len(financial_factors)} 个指标")
            return financial_factors
            
        except Exception as e:
            self.logger.error(f"提取财务因子失败: {e}")
            raise Exception(f"财务因子提取失败: {e}")
    
    async def calculate_super_financial_factors(self, financial_factors: Dict[str, Any]) -> Dict[str, Any]:
        """
        计算超级财务因子
        
        Args:
            financial_factors: 基础财务因子
            
        Returns:
            超级财务因子字典
        """
        self.logger.info("开始计算超级财务因子")
        
        try:
            # 计算复合财务指标
            pe_ratio = financial_factors.get("pe_ratio", 0.0)
            pb_ratio = financial_factors.get("pb_ratio", 0.0)
            ps_ratio = financial_factors.get("ps_ratio", 0.0)
            dividend_yield = financial_factors.get("dividend_yield", 0.0)
            
            # 计算价值评分（0-100分）
            value_score = self._calculate_value_score(pe_ratio, pb_ratio, ps_ratio, dividend_yield)
            
            # 计算成长性评分（0-100分）
            growth_score = self._calculate_growth_score(financial_factors)
            
            # 计算盈利能力评分（0-100分）
            profitability_score = self._calculate_profitability_score(financial_factors)
            
            # 计算财务健康度评分（0-100分）
            financial_health_score = self._calculate_financial_health_score(financial_factors)
            
            # 计算综合评分
            overall_score = (value_score + growth_score + profitability_score + financial_health_score) / 4
            
            super_factors = {
                **financial_factors,
                "value_score": value_score,
                "growth_score": growth_score,
                "profitability_score": profitability_score,
                "financial_health_score": financial_health_score,
                "overall_score": overall_score,
                "calculated_at": datetime.now().isoformat()
            }
            
            self.logger.info(f"超级财务因子计算完成: 综合评分 {overall_score:.2f}")
            return super_factors
            
        except Exception as e:
            self.logger.error(f"计算超级财务因子失败: {e}")
            raise Exception(f"超级财务因子计算失败: {e}")
    
    def _calculate_value_score(self, pe: float, pb: float, ps: float, dividend_yield: float) -> float:
        """计算价值评分"""
        score = 0.0
        
        # PE评分（越低越好）
        if pe > 0 and pe < 10:
            score += 25
        elif pe >= 10 and pe < 20:
            score += 20
        elif pe >= 20 and pe < 30:
            score += 15
        elif pe >= 30 and pe < 50:
            score += 10
        else:
            score += 5
        
        # PB评分（越低越好）
        if pb > 0 and pb < 1:
            score += 25
        elif pb >= 1 and pb < 2:
            score += 20
        elif pb >= 2 and pb < 3:
            score += 15
        elif pb >= 3 and pb < 5:
            score += 10
        else:
            score += 5
        
        # PS评分（越低越好）
        if ps > 0 and ps < 2:
            score += 25
        elif ps >= 2 and ps < 5:
            score += 20
        elif ps >= 5 and ps < 10:
            score += 15
        elif ps >= 10 and ps < 20:
            score += 10
        else:
            score += 5
        
        # 股息率评分（越高越好）
        if dividend_yield > 5:
            score += 25
        elif dividend_yield > 3:
            score += 20
        elif dividend_yield > 1:
            score += 15
        elif dividend_yield > 0:
            score += 10
        else:
            score += 5
        
        return min(score, 100.0)
    
    def _calculate_growth_score(self, factors: Dict[str, Any]) -> float:
        """计算成长性评分"""
        # 简化实现，实际应该基于历史数据计算增长率
        return 50.0  # 默认中等成长性
    
    def _calculate_profitability_score(self, factors: Dict[str, Any]) -> float:
        """计算盈利能力评分"""
        # 简化实现，实际应该基于ROE、ROA等指标
        return 50.0  # 默认中等盈利能力
    
    def _calculate_financial_health_score(self, factors: Dict[str, Any]) -> float:
        """计算财务健康度评分"""
        # 简化实现，实际应该基于负债率、流动比率等指标
        return 50.0  # 默认中等财务健康度
