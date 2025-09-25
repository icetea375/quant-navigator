#!/usr/bin/env python3
"""
v9.6完整数据加载脚本
按照DataPipeline规范加载所有数据维度

数据维度包括：
1. 市场结构数据 (指数、行业、概念)
2. 资金流向数据 (主力、北向、南向)
3. 热点资金数据 (龙虎榜、涨跌停)
4. 预期数据 (机构观点、研报)
5. 聪明资金数据 (基金持仓)
6. 文本数据 (新闻、公告、互动)
"""

import argparse
import asyncio
import logging
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.append(str(Path(__file__).parent.parent))

import pandas as pd
import psycopg2
from tushare import get_token, set_token
import tushare as ts

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('complete_data_loading.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class CompleteDataLoader:
    """完整数据加载器"""
    
    def __init__(self, config):
        self.config = config
        self.ts = None
        self.conn = None
        self.cursor = None
        
    async def initialize(self):
        """初始化连接"""
        logger.info("初始化数据源连接...")
        
        # 初始化Tushare
        token = os.getenv('TUSHARE_TOKEN')
        if not token:
            raise Exception("TUSHARE_TOKEN环境变量未设置")
        
        set_token(token)
        self.ts = ts.pro_api()
        logger.info("Tushare连接成功")
        
        # 初始化数据库连接
        self.conn = psycopg2.connect(
            host=self.config['db_host'],
            port=self.config['db_port'],
            database=self.config['db_name'],
            user=self.config['db_user'],
            password=self.config['db_password']
        )
        self.cursor = self.conn.cursor()
        logger.info("数据库连接成功")
        
    async def create_missing_tables(self):
        """创建缺失的数据表"""
        logger.info("创建缺失的数据表...")
        
        tables_sql = [
            # 市场结构数据表
            """
            CREATE TABLE IF NOT EXISTS index_weights (
                id SERIAL PRIMARY KEY,
                index_code VARCHAR(20) NOT NULL,
                stock_code VARCHAR(20) NOT NULL,
                trade_date DATE NOT NULL,
                weight DECIMAL(10,6),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(index_code, stock_code, trade_date)
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS shenwan_industry (
                id SERIAL PRIMARY KEY,
                industry_code VARCHAR(20) NOT NULL,
                industry_name VARCHAR(100) NOT NULL,
                level INTEGER NOT NULL,
                parent_code VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(industry_code)
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS shenwan_industry_members (
                id SERIAL PRIMARY KEY,
                industry_code VARCHAR(20) NOT NULL,
                stock_code VARCHAR(20) NOT NULL,
                stock_name VARCHAR(50) NOT NULL,
                weight DECIMAL(10,6),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(industry_code, stock_code)
            );
            """,
            # 资金流向数据表
            """
            CREATE TABLE IF NOT EXISTS money_flow (
                id SERIAL PRIMARY KEY,
                stock_code VARCHAR(20) NOT NULL,
                trade_date DATE NOT NULL,
                net_mf_amount DECIMAL(15,2),
                trade_money DECIMAL(15,2),
                net_mf_amount_ratio DECIMAL(10,6),
                buy_sm_amount DECIMAL(15,2),
                sell_sm_amount DECIMAL(15,2),
                buy_md_amount DECIMAL(15,2),
                sell_md_amount DECIMAL(15,2),
                buy_lg_amount DECIMAL(15,2),
                sell_lg_amount DECIMAL(15,2),
                buy_elg_amount DECIMAL(15,2),
                sell_elg_amount DECIMAL(15,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(stock_code, trade_date)
            );
            """,
            # 热点资金数据表
            """
            CREATE TABLE IF NOT EXISTS top_list (
                id SERIAL PRIMARY KEY,
                trade_date DATE NOT NULL,
                ts_code VARCHAR(20) NOT NULL,
                name VARCHAR(50),
                close DECIMAL(10,2),
                pct_change DECIMAL(10,4),
                turnover_rate DECIMAL(10,4),
                amount DECIMAL(15,2),
                l_sell DECIMAL(15,2),
                l_buy DECIMAL(15,2),
                l_amount DECIMAL(15,2),
                net_amount DECIMAL(15,2),
                net_rate DECIMAL(10,4),
                amount_rate DECIMAL(10,4),
                reason VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(trade_date, ts_code)
            );
            """,
            # 预期数据表
            """
            CREATE TABLE IF NOT EXISTS jg_gold_stock (
                id SERIAL PRIMARY KEY,
                trade_date DATE NOT NULL,
                ts_code VARCHAR(20) NOT NULL,
                name VARCHAR(50),
                close DECIMAL(10,2),
                pct_change DECIMAL(10,4),
                volume BIGINT,
                amount DECIMAL(15,2),
                reason VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(trade_date, ts_code)
            );
            """,
            # 聪明资金数据表
            """
            CREATE TABLE IF NOT EXISTS fund_portfolio (
                id SERIAL PRIMARY KEY,
                ts_code VARCHAR(20) NOT NULL,
                ann_date DATE NOT NULL,
                end_date DATE NOT NULL,
                symbol VARCHAR(20) NOT NULL,
                mkv DECIMAL(15,2),
                amount DECIMAL(15,2),
                stk_mkv_ratio DECIMAL(10,6),
                stk_float_ratio DECIMAL(10,6),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(ts_code, symbol, end_date)
            );
            """,
            # 概念数据表
            """
            CREATE TABLE IF NOT EXISTS ths_concept (
                id SERIAL PRIMARY KEY,
                trade_date DATE NOT NULL,
                ts_code VARCHAR(20) NOT NULL,
                name VARCHAR(100),
                lead_stock VARCHAR(50),
                close_price DECIMAL(10,2),
                pct_change DECIMAL(10,4),
                industry_index DECIMAL(10,2),
                company_num INTEGER,
                pct_change_stock DECIMAL(10,4),
                net_buy_amount DECIMAL(15,2),
                net_sell_amount DECIMAL(15,2),
                net_amount DECIMAL(15,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(trade_date, ts_code)
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS ths_concept_members (
                id SERIAL PRIMARY KEY,
                concept_code VARCHAR(20) NOT NULL,
                stock_code VARCHAR(20) NOT NULL,
                stock_name VARCHAR(50),
                weight DECIMAL(10,6),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(concept_code, stock_code)
            );
            """,
            # 文本数据表
            """
            CREATE TABLE IF NOT EXISTS long_form_news (
                id SERIAL PRIMARY KEY,
                news_id VARCHAR(50) NOT NULL,
                title VARCHAR(500),
                content TEXT,
                publish_time TIMESTAMP,
                source VARCHAR(100),
                sentiment_score DECIMAL(5,4),
                importance_score DECIMAL(5,4),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(news_id)
            );
            """,
            # 新增：日线行情数据表
            """
            CREATE TABLE IF NOT EXISTS index_daily_prices (
                id SERIAL PRIMARY KEY,
                ts_code VARCHAR(20) NOT NULL,
                trade_date DATE NOT NULL,
                open DECIMAL(10,2),
                high DECIMAL(10,2),
                low DECIMAL(10,2),
                close DECIMAL(10,2),
                pre_close DECIMAL(10,2),
                change DECIMAL(10,2),
                pct_chg DECIMAL(10,4),
                vol DECIMAL(15,2),
                amount DECIMAL(15,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(ts_code, trade_date)
            );
            """,
            # 新增：新闻数据表
            """
            CREATE TABLE IF NOT EXISTS news (
                id SERIAL PRIMARY KEY,
                datetime TIMESTAMP NOT NULL,
                content TEXT,
                title VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(datetime, title)
            );
            """,
            # 新增：股东增减持数据表
            """
            CREATE TABLE IF NOT EXISTS holder_trade (
                id SERIAL PRIMARY KEY,
                ts_code VARCHAR(20) NOT NULL,
                ann_date DATE NOT NULL,
                holder_name VARCHAR(100) NOT NULL,
                holder_type VARCHAR(20),
                in_de VARCHAR(10),
                change_vol DECIMAL(15,2),
                change_ratio DECIMAL(10,6),
                after_share DECIMAL(15,2),
                after_ratio DECIMAL(10,6),
                avg_price DECIMAL(10,2),
                total_share DECIMAL(15,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(ts_code, ann_date, holder_name)
            );
            """,
            # 新增：两融数据表
            """
            CREATE TABLE IF NOT EXISTS margin_detail (
                id SERIAL PRIMARY KEY,
                trade_date DATE NOT NULL,
                ts_code VARCHAR(20) NOT NULL,
                rzye DECIMAL(15,2),
                rqye DECIMAL(15,2),
                rzmre DECIMAL(15,2),
                rqyl DECIMAL(15,2),
                rzche DECIMAL(15,2),
                rqchl DECIMAL(15,2),
                rqmcl DECIMAL(15,2),
                rzrqye DECIMAL(15,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(trade_date, ts_code)
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS announcements (
                id SERIAL PRIMARY KEY,
                ann_date DATE NOT NULL,
                ts_code VARCHAR(20) NOT NULL,
                name VARCHAR(100),
                title VARCHAR(500),
                url TEXT,
                rec_time TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(ann_date, ts_code, title)
            );
            """
        ]
        
        for sql in tables_sql:
            try:
                self.cursor.execute(sql)
                self.conn.commit()
                logger.info("表创建成功")
            except Exception as e:
                logger.error(f"表创建失败: {e}")
                
    async def load_market_structure_data(self):
        """加载市场结构数据"""
        logger.info("开始加载市场结构数据...")
        
        try:
            # 1. 加载申万行业分类
            logger.info("加载申万行业分类...")
            industry_data = self.ts.index_classify(level='L1', src='SW2021')
            if not industry_data.empty:
                for _, row in industry_data.iterrows():
                    self.cursor.execute("""
                        INSERT INTO shenwan_industry 
                        (industry_code, industry_name, level, parent_code)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (industry_code) DO UPDATE SET
                        industry_name = EXCLUDED.industry_name,
                        level = EXCLUDED.level
                    """, (
                        row['index_code'],
                        row['industry_name'],
                        1,
                        None
                    ))
                self.conn.commit()
                logger.info(f"申万行业分类加载完成: {len(industry_data)} 条")
            
            # 2. 加载指数成分权重
            logger.info("加载指数成分权重...")
            # 获取主要指数列表
            index_list = ['000001.SH', '000300.SH', '000905.SH', '399001.SZ', '399006.SZ']
            
            for index_code in index_list:
                try:
                    weight_data = self.ts.index_weight(
                        index_code=index_code,
                        start_date=self.config['start_date'].replace('-', ''),
                        end_date=self.config['end_date'].replace('-', '')
                    )
                    
                    if not weight_data.empty:
                        for _, row in weight_data.iterrows():
                            self.cursor.execute("""
                                INSERT INTO index_weights 
                                (index_code, stock_code, trade_date, weight)
                                VALUES (%s, %s, %s, %s)
                                ON CONFLICT (index_code, stock_code, trade_date) DO UPDATE SET
                                weight = EXCLUDED.weight
                            """, (
                                index_code,
                                row['con_code'],
                                datetime.strptime(str(row['trade_date']), '%Y%m%d').date(),
                                row['weight']
                            ))
                        self.conn.commit()
                        logger.info(f"指数 {index_code} 权重数据加载完成: {len(weight_data)} 条")
                    
                    await asyncio.sleep(0.2)  # 避免API限制
                    
                except Exception as e:
                    logger.warning(f"指数 {index_code} 权重数据加载失败: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"市场结构数据加载失败: {e}")
    
    async def load_daily_market_data(self):
        """加载日线行情数据 - 最高优先级"""
        logger.info("开始加载日线行情数据...")
        
        try:
            # 1. 加载A股日线行情
            logger.info("加载A股日线行情...")
            # 获取股票列表
            stock_list = self.ts.stock_basic(exchange='', list_status='L', fields='ts_code')
            
            # 分批获取日线数据
            batch_size = 50
            for i in range(0, min(len(stock_list), 200), batch_size):  # 限制前200只股票
                batch_stocks = stock_list.iloc[i:i+batch_size]['ts_code'].tolist()
                
                for ts_code in batch_stocks:
                    try:
                        daily_data = self.ts.daily(
                            ts_code=ts_code,
                            start_date=self.config['start_date'].replace('-', ''),
                            end_date=self.config['end_date'].replace('-', '')
                        )
                        
                        if not daily_data.empty:
                            for _, row in daily_data.iterrows():
                                self.cursor.execute("""
                                    INSERT INTO daily_prices 
                                    (ts_code, trade_date, open, high, low, close, pre_close, 
                                     change, pct_chg, vol, amount)
                                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                                    ON CONFLICT (ts_code, trade_date) DO UPDATE SET
                                    open = EXCLUDED.open,
                                    high = EXCLUDED.high,
                                    low = EXCLUDED.low,
                                    close = EXCLUDED.close,
                                    pre_close = EXCLUDED.pre_close,
                                    change = EXCLUDED.change,
                                    pct_chg = EXCLUDED.pct_chg,
                                    vol = EXCLUDED.vol,
                                    amount = EXCLUDED.amount
                                """, (
                                    row['ts_code'],
                                    datetime.strptime(str(row['trade_date']), '%Y%m%d').date(),
                                    row['open'],
                                    row['high'],
                                    row['low'],
                                    row['close'],
                                    row['pre_close'],
                                    row['change'],
                                    row['pct_chg'],
                                    row['vol'],
                                    row['amount']
                                ))
                            self.conn.commit()
                            logger.info(f"股票 {ts_code} 日线数据加载完成: {len(daily_data)} 条")
                            
                    except Exception as e:
                        logger.error(f"股票 {ts_code} 日线数据加载失败: {e}")
            
            # 2. 加载指数日线行情
            logger.info("加载指数日线行情...")
            index_list = ['000001.SH', '000300.SH', '000905.SH', '399001.SZ', '399006.SZ']
            
            for index_code in index_list:
                try:
                    index_daily_data = self.ts.index_daily(
                        ts_code=index_code,
                        start_date=self.config['start_date'].replace('-', ''),
                        end_date=self.config['end_date'].replace('-', '')
                    )
                    
                    if not index_daily_data.empty:
                        for _, row in index_daily_data.iterrows():
                            self.cursor.execute("""
                                INSERT INTO index_daily_prices 
                                (ts_code, trade_date, open, high, low, close, pre_close, 
                                 change, pct_chg, vol, amount)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                                ON CONFLICT (ts_code, trade_date) DO UPDATE SET
                                open = EXCLUDED.open,
                                high = EXCLUDED.high,
                                low = EXCLUDED.low,
                                close = EXCLUDED.close,
                                pre_close = EXCLUDED.pre_close,
                                change = EXCLUDED.change,
                                pct_chg = EXCLUDED.pct_chg,
                                vol = EXCLUDED.vol,
                                amount = EXCLUDED.amount
                            """, (
                                row['ts_code'],
                                datetime.strptime(str(row['trade_date']), '%Y%m%d').date(),
                                row['open'],
                                row['high'],
                                row['low'],
                                row['close'],
                                row['pre_close'],
                                row['change'],
                                row['pct_chg'],
                                row['vol'],
                                row['amount']
                            ))
                        self.conn.commit()
                        logger.info(f"指数 {index_code} 日线数据加载完成: {len(index_daily_data)} 条")
                        
                except Exception as e:
                    logger.error(f"指数 {index_code} 日线数据加载失败: {e}")
                    
        except Exception as e:
            logger.error(f"日线行情数据加载失败: {e}")
    
    async def load_money_flow_data(self):
        """加载资金流向数据"""
        logger.info("开始加载资金流向数据...")
        
        try:
            # 获取股票列表
            self.cursor.execute("SELECT DISTINCT ts_code FROM daily_prices LIMIT 100")
            stock_codes = [row[0] for row in self.cursor.fetchall()]
            
            for stock_code in stock_codes:
                try:
                    # 使用正确的接口获取资金流向数据
                    money_flow_data = self.ts.moneyflow_hsgt(
                        start_date=self.config['start_date'].replace('-', ''),
                        end_date=self.config['end_date'].replace('-', '')
                    )
                    
                    if not money_flow_data.empty:
                        for _, row in money_flow_data.iterrows():
                            self.cursor.execute("""
                        INSERT INTO money_flow 
                        (stock_code, trade_date, net_mf_amount, trade_money, net_mf_amount_ratio,
                         buy_sm_amount, sell_sm_amount, buy_md_amount, sell_md_amount,
                         buy_lg_amount, sell_lg_amount, buy_elg_amount, sell_elg_amount)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (stock_code, trade_date) DO UPDATE SET
                        net_mf_amount = EXCLUDED.net_mf_amount,
                        trade_money = EXCLUDED.trade_money,
                        net_mf_amount_ratio = EXCLUDED.net_mf_amount_ratio,
                        buy_sm_amount = EXCLUDED.buy_sm_amount,
                        sell_sm_amount = EXCLUDED.sell_sm_amount,
                        buy_md_amount = EXCLUDED.buy_md_amount,
                        sell_md_amount = EXCLUDED.sell_md_amount,
                        buy_lg_amount = EXCLUDED.buy_lg_amount,
                        sell_lg_amount = EXCLUDED.sell_lg_amount,
                        buy_elg_amount = EXCLUDED.buy_elg_amount,
                        sell_elg_amount = EXCLUDED.sell_elg_amount
                            """, (
                                stock_code,
                                datetime.strptime(str(row['trade_date']), '%Y%m%d').date(),
                                row.get('net_mf_amount', 0),
                                row.get('trade_money', 0),
                                row.get('net_mf_amount', 0) / row.get('trade_money', 1) if row.get('trade_money', 0) > 0 else 0,
                                row.get('buy_sm_amount', 0),
                                row.get('sell_sm_amount', 0),
                                row.get('buy_md_amount', 0),
                                row.get('sell_md_amount', 0),
                                row.get('buy_lg_amount', 0),
                                row.get('sell_lg_amount', 0),
                                row.get('buy_elg_amount', 0),
                                row.get('sell_elg_amount', 0)
                            ))
                        self.conn.commit()
                        logger.info(f"股票 {stock_code} 资金流向数据加载完成: {len(money_flow_data)} 条")
                    
                    await asyncio.sleep(0.2)  # 避免API限制
                    
                except Exception as e:
                    logger.warning(f"股票 {stock_code} 资金流向数据加载失败: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"资金流向数据加载失败: {e}")
    
    async def load_hot_money_data(self):
        """加载热点资金数据"""
        logger.info("开始加载热点资金数据...")
        
        try:
            # 加载龙虎榜数据 - 使用正确的接口
            top_list_data = self.ts.top_list(
                trade_date='20240102'  # 使用交易日
            )
            
            if not top_list_data.empty:
                for _, row in top_list_data.iterrows():
                    self.cursor.execute("""
                        INSERT INTO top_list 
                        (trade_date, ts_code, name, close, pct_change, turnover_rate, 
                         amount, l_sell, l_buy, l_amount, net_amount, net_rate, 
                         amount_rate, reason)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (trade_date, ts_code) DO UPDATE SET
                        name = EXCLUDED.name,
                        close = EXCLUDED.close,
                        pct_change = EXCLUDED.pct_change,
                        turnover_rate = EXCLUDED.turnover_rate,
                        amount = EXCLUDED.amount,
                        l_sell = EXCLUDED.l_sell,
                        l_buy = EXCLUDED.l_buy,
                        l_amount = EXCLUDED.l_amount,
                        net_amount = EXCLUDED.net_amount,
                        net_rate = EXCLUDED.net_rate,
                        amount_rate = EXCLUDED.amount_rate,
                        reason = EXCLUDED.reason
                    """, (
                        datetime.strptime(str(row['trade_date']), '%Y%m%d').date(),
                        row['ts_code'],
                        row['name'],
                        row['close'],
                        row['pct_change'],
                        row['turnover_rate'],
                        row['amount'],
                        row['l_sell'],
                        row['l_buy'],
                        row['l_amount'],
                        row['net_amount'],
                        row['net_rate'],
                        row['amount_rate'],
                        row['reason']
                    ))
                self.conn.commit()
                logger.info(f"龙虎榜数据加载完成: {len(top_list_data)} 条")
                
        except Exception as e:
            logger.error(f"热点资金数据加载失败: {e}")
    
    async def load_expectation_data(self):
        """加载预期数据"""
        logger.info("开始加载预期数据...")
        
        try:
            # 加载机构观点金股数据 - 使用正确的接口
            jg_gold_data = self.ts.broker_recommend(
                month='202401'  # 使用月份格式
            )
            
            if not jg_gold_data.empty:
                for _, row in jg_gold_data.iterrows():
                    self.cursor.execute("""
                        INSERT INTO jg_gold_stock 
                        (trade_date, ts_code, name, close, pct_change, volume, amount, reason)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (trade_date, ts_code) DO UPDATE SET
                        name = EXCLUDED.name,
                        close = EXCLUDED.close,
                        pct_change = EXCLUDED.pct_change,
                        volume = EXCLUDED.volume,
                        amount = EXCLUDED.amount,
                        reason = EXCLUDED.reason
                    """, (
                        datetime.strptime(str(row['month']), '%Y%m').date().replace(day=1),
                        row['ts_code'],
                        row['name'],
                        0,  # close - 机构观点数据没有价格
                        0,  # pct_change - 机构观点数据没有涨跌幅
                        0,  # volume - 机构观点数据没有成交量
                        0,  # amount - 机构观点数据没有成交额
                        f"机构观点: {row['broker']}"  # reason - 使用券商名称作为原因
                    ))
                self.conn.commit()
                logger.info(f"机构观点金股数据加载完成: {len(jg_gold_data)} 条")
                
        except Exception as e:
            logger.error(f"预期数据加载失败: {e}")
    
    async def load_smart_money_data(self):
        """加载聪明资金数据"""
        logger.info("开始加载聪明资金数据...")
        
        try:
            # 加载公募基金持仓数据 - 使用正确的接口和参数
            # 获取最近一个季度的数据
            fund_portfolio_data = self.ts.fund_portfolio(
                period='20231231'  # 2023年Q4数据
            )
            
            if not fund_portfolio_data.empty:
                for _, row in fund_portfolio_data.iterrows():
                    self.cursor.execute("""
                        INSERT INTO fund_portfolio 
                        (ts_code, ann_date, end_date, symbol, mkv, amount, stk_mkv_ratio, stk_float_ratio)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (ts_code, symbol, end_date) DO UPDATE SET
                        ann_date = EXCLUDED.ann_date,
                        mkv = EXCLUDED.mkv,
                        amount = EXCLUDED.amount,
                        stk_mkv_ratio = EXCLUDED.stk_mkv_ratio,
                        stk_float_ratio = EXCLUDED.stk_float_ratio
                    """, (
                        row['ts_code'],
                        datetime.strptime(str(row['ann_date']), '%Y%m%d').date(),
                        datetime.strptime(str(row['end_date']), '%Y%m%d').date(),
                        row['symbol'],
                        row['mkv'],
                        row['amount'],
                        row['stk_mkv_ratio'],
                        row['stk_float_ratio']
                    ))
                self.conn.commit()
                logger.info(f"公募基金持仓数据加载完成: {len(fund_portfolio_data)} 条")
            else:
                logger.warning("公募基金持仓数据为空")
                
        except Exception as e:
            logger.error(f"聪明资金数据加载失败: {e}")
    
    async def load_concept_data(self):
        """加载概念数据"""
        logger.info("开始加载概念数据...")
        
        try:
            # 加载同花顺板块指数行情数据 - 使用正确的接口
            ths_daily_data = self.ts.ths_daily(
                trade_date='20240102'  # 使用交易日
            )
            
            if not ths_daily_data.empty:
                for _, row in ths_daily_data.iterrows():
                    self.cursor.execute("""
                        INSERT INTO ths_concept 
                        (trade_date, ts_code, name, lead_stock, close_price, pct_change, 
                         industry_index, company_num, pct_change_stock, net_buy_amount, 
                         net_sell_amount, net_amount, open_price, high_price, low_price,
                         pre_close, avg_price, change_amount, volume, turnover_rate)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (trade_date, ts_code) DO UPDATE SET
                        name = EXCLUDED.name,
                        lead_stock = EXCLUDED.lead_stock,
                        close_price = EXCLUDED.close_price,
                        pct_change = EXCLUDED.pct_change,
                        industry_index = EXCLUDED.industry_index,
                        company_num = EXCLUDED.company_num,
                        pct_change_stock = EXCLUDED.pct_change_stock,
                        net_buy_amount = EXCLUDED.net_buy_amount,
                        net_sell_amount = EXCLUDED.net_sell_amount,
                        net_amount = EXCLUDED.net_amount,
                        open_price = EXCLUDED.open_price,
                        high_price = EXCLUDED.high_price,
                        low_price = EXCLUDED.low_price,
                        pre_close = EXCLUDED.pre_close,
                        avg_price = EXCLUDED.avg_price,
                        change_amount = EXCLUDED.change_amount,
                        volume = EXCLUDED.volume,
                        turnover_rate = EXCLUDED.turnover_rate
                    """, (
                        datetime.strptime(str(row['trade_date']), '%Y%m%d').date(),
                        row['ts_code'],
                        '',  # name - 从ths_index获取
                        '',  # lead_stock - 从ths_member获取
                        row.get('close', 0),  # close_price
                        row.get('pct_change', 0),  # pct_change
                        0,  # industry_index - 从ths_index获取
                        0,  # company_num - 从ths_member获取
                        0,  # pct_change_stock - 从ths_member获取
                        0,  # net_buy_amount - 从moneyflow_cnt_ths获取
                        0,  # net_sell_amount - 从moneyflow_cnt_ths获取
                        0,  # net_amount - 从moneyflow_cnt_ths获取
                        row.get('open', 0),  # open_price
                        row.get('high', 0),  # high_price
                        row.get('low', 0),   # low_price
                        row.get('pre_close', 0),  # pre_close
                        row.get('avg_price', 0),  # avg_price
                        row.get('change', 0),     # change_amount
                        row.get('vol', 0),        # volume
                        row.get('turnover_rate', 0)  # turnover_rate
                    ))
                self.conn.commit()
                logger.info(f"同花顺板块指数行情数据加载完成: {len(ths_daily_data)} 条")
                
        except Exception as e:
            logger.error(f"概念数据加载失败: {e}")
    
    async def load_news_data(self):
        """加载新闻数据 - 最高优先级"""
        logger.info("开始加载新闻数据...")
        
        try:
            # 新闻数据源列表
            news_sources = ['sina', 'wallstreetcn', '10jqka', 'eastmoney', 'cls', 'yicai']
            total_news = 0
            
            for src in news_sources:
                try:
                    # 使用正确的参数格式加载新闻快讯数据
                    news_data = self.ts.news(
                        src=src,
                        start_date=f"{self.config['start_date']} 09:00:00",
                        end_date=f"{self.config['end_date']} 18:00:00"
                    )
                    
                    if not news_data.empty:
                        for _, row in news_data.iterrows():
                            self.cursor.execute("""
                                INSERT INTO news 
                                (datetime, content, title, channels)
                                VALUES (%s, %s, %s, %s)
                                ON CONFLICT (datetime, title) DO UPDATE SET
                                content = EXCLUDED.content,
                                channels = EXCLUDED.channels
                            """, (
                                row['datetime'],
                                row['content'] if row['content'] is not None else '',
                                row['title'] if row['title'] is not None else '',
                                row.get('channels', src) if row.get('channels') is not None else src  # 使用数据源作为分类
                            ))
                        self.conn.commit()
                        total_news += len(news_data)
                        logger.info(f"新闻源 {src} 数据加载完成: {len(news_data)} 条")
                    else:
                        logger.warning(f"新闻源 {src} 数据为空")
                        
                except Exception as e:
                    logger.warning(f"新闻源 {src} 加载失败: {e}")
                    continue
            
            if total_news > 0:
                logger.info(f"新闻数据加载完成: 总计 {total_news} 条")
            else:
                logger.warning("所有新闻源都无数据")
                
        except Exception as e:
            logger.error(f"新闻数据加载失败: {e}")
    
    async def load_holder_trade_data(self):
        """加载股东增减持数据 - 中优先级"""
        logger.info("开始加载股东增减持数据...")
        
        try:
            # 加载股东增减持数据
            holder_data = self.ts.stk_holdertrade(
                start_date=self.config['start_date'].replace('-', ''),
                end_date=self.config['end_date'].replace('-', '')
            )
            
            if not holder_data.empty:
                for _, row in holder_data.iterrows():
                    self.cursor.execute("""
                        INSERT INTO holder_trade 
                        (ts_code, ann_date, holder_name, holder_type, in_de, 
                         change_vol, change_ratio, after_share, after_ratio, 
                         avg_price, total_share)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (ts_code, ann_date, holder_name) DO UPDATE SET
                        holder_type = EXCLUDED.holder_type,
                        in_de = EXCLUDED.in_de,
                        change_vol = EXCLUDED.change_vol,
                        change_ratio = EXCLUDED.change_ratio,
                        after_share = EXCLUDED.after_share,
                        after_ratio = EXCLUDED.after_ratio,
                        avg_price = EXCLUDED.avg_price,
                        total_share = EXCLUDED.total_share
                    """, (
                        row['ts_code'],
                        datetime.strptime(str(row['ann_date']), '%Y%m%d').date(),
                        row['holder_name'],
                        row['holder_type'],
                        row['in_de'],
                        row['change_vol'],
                        row['change_ratio'],
                        row['after_share'],
                        row['after_ratio'],
                        row['avg_price'],
                        row['total_share']
                    ))
                self.conn.commit()
                logger.info(f"股东增减持数据加载完成: {len(holder_data)} 条")
            else:
                logger.warning("股东增减持数据为空")
                
        except Exception as e:
            logger.error(f"股东增减持数据加载失败: {e}")
    
    async def load_margin_data(self):
        """加载两融数据 - 中优先级"""
        logger.info("开始加载两融数据...")
        
        try:
            # 加载两融数据
            margin_data = self.ts.margin_detail(
                start_date=self.config['start_date'].replace('-', ''),
                end_date=self.config['end_date'].replace('-', '')
            )
            
            if not margin_data.empty:
                for _, row in margin_data.iterrows():
                    self.cursor.execute("""
                        INSERT INTO margin_detail 
                        (trade_date, ts_code, rzye, rqye, rzmre, rqyl, 
                         rzche, rqchl, rqmcl, rzrqye)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (trade_date, ts_code) DO UPDATE SET
                        rzye = EXCLUDED.rzye,
                        rqye = EXCLUDED.rqye,
                        rzmre = EXCLUDED.rzmre,
                        rqyl = EXCLUDED.rqyl,
                        rzche = EXCLUDED.rzche,
                        rqchl = EXCLUDED.rqchl,
                        rqmcl = EXCLUDED.rqmcl,
                        rzrqye = EXCLUDED.rzrqye
                    """, (
                        datetime.strptime(str(row['trade_date']), '%Y%m%d').date(),
                        row['ts_code'],
                        row['rzye'],
                        row['rqye'],
                        row['rzmre'],
                        row['rqyl'],
                        row['rzche'],
                        row['rqchl'],
                        row['rqmcl'],
                        row['rzrqye']
                    ))
                self.conn.commit()
                logger.info(f"两融数据加载完成: {len(margin_data)} 条")
            else:
                logger.warning("两融数据为空")
                
        except Exception as e:
            logger.error(f"两融数据加载失败: {e}")
    
    async def load_textual_data(self):
        """加载文本数据"""
        logger.info("开始加载文本数据...")
        
        try:
            # 加载公司公告数据 - 使用正确的接口
            announcement_data = self.ts.anns_d(
                ann_date='20240102'  # 使用交易日
            )
            
            if not announcement_data.empty:
                for _, row in announcement_data.iterrows():
                    self.cursor.execute("""
                        INSERT INTO announcements 
                        (ann_date, ts_code, name, title, url, rec_time)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT (ann_date, ts_code, title) DO UPDATE SET
                        name = EXCLUDED.name,
                        url = EXCLUDED.url,
                        rec_time = EXCLUDED.rec_time
                    """, (
                        datetime.strptime(str(row['ann_date']), '%Y%m%d').date(),
                        row['ts_code'],
                        row['name'],
                        row['title'],
                        row['url'],
                        row.get('rec_time', None)  # 可能为空
                    ))
                self.conn.commit()
                logger.info(f"公司公告数据加载完成: {len(announcement_data)} 条")
                
        except Exception as e:
            logger.error(f"文本数据加载失败: {e}")
    
    async def verify_data_completeness(self):
        """验证数据完整性"""
        logger.info("验证数据完整性...")
        
        tables = [
            'daily_prices',
            'index_daily_prices',  # 新增：指数日线行情
            'index_weights',
            'shenwan_industry',
            'shenwan_industry_members',
            'money_flow',
            'top_list',
            'jg_gold_stock',
            'fund_portfolio',
            'ths_concept',
            'ths_concept_members',
            'news',  # 新增：新闻数据
            'holder_trade',  # 新增：股东增减持
            'margin_detail',  # 新增：两融数据
            'long_form_news',
            'announcements'
        ]
        
        for table in tables:
            try:
                self.cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = self.cursor.fetchone()[0]
                logger.info(f"{table}: {count:,} 条记录")
            except Exception as e:
                logger.warning(f"{table}: 表不存在或查询失败 - {e}")
    
    async def run(self):
        """运行完整数据加载"""
        logger.info("开始完整数据加载...")
        
        try:
            await self.initialize()
            await self.create_missing_tables()
            await self.load_market_structure_data()
            await self.load_daily_market_data()  # 新增：日线行情数据
            await self.load_money_flow_data()
            await self.load_hot_money_data()
            await self.load_expectation_data()
            await self.load_smart_money_data()
            await self.load_concept_data()
            await self.load_news_data()  # 新增：新闻数据
            await self.load_holder_trade_data()  # 新增：股东增减持数据
            await self.load_margin_data()  # 新增：两融数据
            await self.load_textual_data()
            await self.verify_data_completeness()
            
            logger.info("完整数据加载完成！")
            
        except Exception as e:
            logger.error(f"数据加载失败: {e}")
            raise
        finally:
            if self.cursor:
                self.cursor.close()
            if self.conn:
                self.conn.close()

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='v9.6完整数据加载')
    parser.add_argument('--start-date', required=True, help='开始日期 (YYYY-MM-DD)')
    parser.add_argument('--end-date', required=True, help='结束日期 (YYYY-MM-DD)')
    parser.add_argument('--db-host', default='localhost', help='数据库主机')
    parser.add_argument('--db-port', type=int, default=5432, help='数据库端口')
    parser.add_argument('--db-name', default='news_analysis', help='数据库名称')
    parser.add_argument('--db-user', default='news_user', help='数据库用户')
    parser.add_argument('--db-password', default='news_password', help='数据库密码')
    
    args = parser.parse_args()
    
    config = {
        'start_date': args.start_date,
        'end_date': args.end_date,
        'db_host': args.db_host,
        'db_port': args.db_port,
        'db_name': args.db_name,
        'db_user': args.db_user,
        'db_password': args.db_password
    }
    
    loader = CompleteDataLoader(config)
    
    try:
        asyncio.run(loader.run())
        print("✅ 完整数据加载完成！")
    except KeyboardInterrupt:
        print("❌ 数据加载被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 数据加载失败: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
