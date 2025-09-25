#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库工具类 - 数据库连接和操作工具
v10.1 仲裁界面升级版

作者: AI Assistant
创建时间: 2025-01-17
版本: v10.1
"""

import json
import logging
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Union
from pathlib import Path
from sqlalchemy import create_engine, text, MetaData, Table, Column, String, Integer, Float, DateTime, JSON
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import redis
from contextlib import contextmanager

class DatabaseManager:
    """
    数据库管理器 - 统一管理数据库连接和操作
    
    核心功能：
    1. 数据库连接管理
    2. 数据查询和插入
    3. 事务管理
    4. 缓存管理
    5. 数据备份和恢复
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        初始化数据库管理器
        
        Args:
            config: 配置字典，包含数据库连接信息
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # 数据库连接
        self.db_engine = None
        self.db_session = None
        self.redis_client = None
        
        # 初始化连接
        self._initialize_connections()
        
    def _initialize_connections(self):
        """初始化数据库连接"""
        try:
            # 初始化PostgreSQL连接
            self._initialize_postgresql()
            
            # 初始化Redis连接
            self._initialize_redis()
            
            self.logger.info("数据库连接初始化完成")
            
        except Exception as e:
            self.logger.error(f"数据库连接初始化失败: {e}")
            raise
    
    def _initialize_postgresql(self):
        """初始化PostgreSQL连接"""
        try:
            database_url = self.config.get('database_url')
            if not database_url:
                raise ValueError("数据库URL未配置")
            
            self.db_engine = create_engine(
                database_url,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True,
                pool_recycle=3600,
                echo=False
            )
            
            # 创建会话工厂
            Session = sessionmaker(bind=self.db_engine)
            self.db_session = Session
            
            self.logger.info("PostgreSQL连接初始化完成")
            
        except Exception as e:
            self.logger.error(f"PostgreSQL连接初始化失败: {e}")
            raise
    
    def _initialize_redis(self):
        """初始化Redis连接"""
        try:
            redis_url = self.config.get('redis_url', 'redis://localhost:6379')
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            
            # 测试连接
            self.redis_client.ping()
            
            self.logger.info("Redis连接初始化完成")
            
        except Exception as e:
            self.logger.warning(f"Redis连接初始化失败: {e}")
            self.redis_client = None
    
    @contextmanager
    def get_session(self):
        """获取数据库会话上下文管理器"""
        session = self.db_session()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            self.logger.error(f"数据库操作失败: {e}")
            raise
        finally:
            session.close()
    
    def execute_query(self, query: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        执行查询语句
        
        Args:
            query: SQL查询语句
            params: 查询参数
            
        Returns:
            查询结果列表
        """
        try:
            with self.get_session() as session:
                result = session.execute(text(query), params or {})
                columns = result.keys()
                rows = result.fetchall()
                
                return [dict(zip(columns, row)) for row in rows]
                
        except SQLAlchemyError as e:
            self.logger.error(f"查询执行失败: {e}")
            raise
    
    def execute_insert(self, table_name: str, data: Dict[str, Any]) -> int:
        """
        执行插入操作
        
        Args:
            table_name: 表名
            data: 插入数据
            
        Returns:
            插入记录的ID
        """
        try:
            with self.get_session() as session:
                # 构建插入语句
                columns = list(data.keys())
                values = list(data.values())
                placeholders = ', '.join([f':{col}' for col in columns])
                
                query = f"""
                INSERT INTO {table_name} ({', '.join(columns)})
                VALUES ({placeholders})
                RETURNING id
                """
                
                result = session.execute(text(query), data)
                record_id = result.fetchone()[0]
                
                return record_id
                
        except SQLAlchemyError as e:
            self.logger.error(f"插入操作失败: {e}")
            raise
    
    def execute_update(self, table_name: str, data: Dict[str, Any], 
                      where_clause: str, where_params: Dict[str, Any] = None) -> int:
        """
        执行更新操作
        
        Args:
            table_name: 表名
            data: 更新数据
            where_clause: WHERE条件
            where_params: WHERE参数
            
        Returns:
            更新的记录数
        """
        try:
            with self.get_session() as session:
                # 构建更新语句
                set_clause = ', '.join([f'{col} = :{col}' for col in data.keys()])
                
                query = f"""
                UPDATE {table_name}
                SET {set_clause}
                WHERE {where_clause}
                """
                
                # 合并参数
                params = {**data, **(where_params or {})}
                
                result = session.execute(text(query), params)
                return result.rowcount
                
        except SQLAlchemyError as e:
            self.logger.error(f"更新操作失败: {e}")
            raise
    
    def execute_delete(self, table_name: str, where_clause: str, 
                      where_params: Dict[str, Any] = None) -> int:
        """
        执行删除操作
        
        Args:
            table_name: 表名
            where_clause: WHERE条件
            where_params: WHERE参数
            
        Returns:
            删除的记录数
        """
        try:
            with self.get_session() as session:
                query = f"DELETE FROM {table_name} WHERE {where_clause}"
                result = session.execute(text(query), where_params or {})
                return result.rowcount
                
        except SQLAlchemyError as e:
            self.logger.error(f"删除操作失败: {e}")
            raise
    
    def get_cache(self, key: str) -> Optional[Any]:
        """
        获取缓存数据
        
        Args:
            key: 缓存键
            
        Returns:
            缓存数据
        """
        if not self.redis_client:
            return None
        
        try:
            data = self.redis_client.get(key)
            if data:
                return json.loads(data)
            return None
            
        except Exception as e:
            self.logger.error(f"获取缓存失败: {e}")
            return None
    
    def set_cache(self, key: str, data: Any, ttl: int = 3600) -> bool:
        """
        设置缓存数据
        
        Args:
            key: 缓存键
            data: 缓存数据
            ttl: 过期时间（秒）
            
        Returns:
            是否设置成功
        """
        if not self.redis_client:
            return False
        
        try:
            json_data = json.dumps(data, ensure_ascii=False, default=str)
            return self.redis_client.setex(key, ttl, json_data)
            
        except Exception as e:
            self.logger.error(f"设置缓存失败: {e}")
            return False
    
    def delete_cache(self, key: str) -> bool:
        """
        删除缓存数据
        
        Args:
            key: 缓存键
            
        Returns:
            是否删除成功
        """
        if not self.redis_client:
            return False
        
        try:
            return bool(self.redis_client.delete(key))
            
        except Exception as e:
            self.logger.error(f"删除缓存失败: {e}")
            return False
    
    def save_results_to_db(self, results: Dict[str, Any]) -> bool:
        """
        保存分析结果到数据库
        
        Args:
            results: 分析结果
            
        Returns:
            是否保存成功
        """
        try:
            # 保存到不同的表
            if 'prediction' in results:
                self._save_prediction_results(results)
            
            if 'event_chain' in results:
                self._save_event_chain_results(results)
            
            if 'validation' in results:
                self._save_validation_results(results)
            
            self.logger.info("分析结果保存成功")
            return True
            
        except Exception as e:
            self.logger.error(f"保存分析结果失败: {e}")
            return False
    
    def _save_prediction_results(self, results: Dict[str, Any]):
        """保存预测结果"""
        try:
            prediction = results.get('prediction', {})
            stock_code = results.get('stock_code', '')
            trade_date = results.get('trade_date', '')
            
            # 保存到generated_reports表
            report_data = {
                'report_type': 'prediction_forecast',
                'target_code': stock_code,
                'report_date': trade_date,
                'title': f'{stock_code} 预测分析报告',
                'summary': f'基于多场景分析，预测未来5日收益率',
                'content': json.dumps(prediction, ensure_ascii=False),
                'confidence_score': prediction.get('probabilities', {}).get('optimistic', 0),
                'model_used': 'kimi-v1-8k',
                'version': '1.0',
                'key_findings': prediction.get('key_drivers', {}).get('positive', []),
                'risk_factors': prediction.get('key_drivers', {}).get('negative', []),
                'created_by': 'ai_system',
                'created_at': datetime.now()
            }
            
            self.execute_insert('generated_reports', report_data)
            
        except Exception as e:
            self.logger.error(f"保存预测结果失败: {e}")
            raise
    
    def _save_event_chain_results(self, results: Dict[str, Any]):
        """保存事件链结果"""
        try:
            event_chain = results.get('event_chain', [])
            stock_code = results.get('stock_code', '')
            trade_date = results.get('trade_date', '')
            
            # 保存到generated_reports表
            report_data = {
                'report_type': 'event_chain',
                'target_code': stock_code,
                'report_date': trade_date,
                'title': f'{stock_code} 事件链分析报告',
                'summary': f'构建了包含{len(event_chain)}个事件的事件链',
                'content': json.dumps(event_chain, ensure_ascii=False),
                'confidence_score': results.get('quality_score', 0),
                'model_used': 'kimi-v1-8k',
                'version': '1.0',
                'created_by': 'ai_system',
                'created_at': datetime.now()
            }
            
            self.execute_insert('generated_reports', report_data)
            
        except Exception as e:
            self.logger.error(f"保存事件链结果失败: {e}")
            raise
    
    def _save_validation_results(self, results: Dict[str, Any]):
        """保存验证结果"""
        try:
            validation = results.get('validation', {})
            stock_code = results.get('stock_code', '')
            trade_date = results.get('trade_date', '')
            
            # 保存到generated_reports表
            report_data = {
                'report_type': 'counterfactual_validation',
                'target_code': stock_code,
                'report_date': trade_date,
                'title': f'{stock_code} 反事实验证报告',
                'summary': f'验证了预测的可靠性，识别了{len(validation.get("risk_factors", []))}个风险因素',
                'content': json.dumps(validation, ensure_ascii=False),
                'confidence_score': validation.get('validation_score', 0),
                'model_used': 'kimi-v1-8k',
                'version': '1.0',
                'created_by': 'ai_system',
                'created_at': datetime.now()
            }
            
            self.execute_insert('generated_reports', report_data)
            
        except Exception as e:
            self.logger.error(f"保存验证结果失败: {e}")
            raise
    
    def get_arbitration_case_data(self, case_id: str) -> Dict[str, Any]:
        """
        获取仲裁案例数据
        
        Args:
            case_id: 案例ID
            
        Returns:
            仲裁案例数据
        """
        try:
            # 解析案例ID
            if '_' in case_id:
                stock_code, report_date = case_id.split('_', 1)
            else:
                stock_code = case_id
                report_date = datetime.now().strftime('%Y-%m-%d')
            
            # 获取AI辩论数据
            ai_debate = self._get_ai_debate_data(stock_code, report_date)
            
            # 获取五大核心数据面板数据
            panels = {
                'raw_text_explorer': self._get_raw_text_data(stock_code, report_date),
                'financial_snapshot': self._get_financial_snapshot(stock_code, report_date),
                'quant_signal_dashboard': self._get_quant_signals(stock_code, report_date),
                'flow_and_chips_viewer': self._get_flow_and_chips_data(stock_code, report_date),
                'precedent_viewer': self._get_historical_arbitrations(stock_code, report_date)
            }
            
            return {
                'case_info': {
                    'case_id': case_id,
                    'stock_code': stock_code,
                    'report_date': report_date,
                    'status': 'pending',
                    'priority': 1,
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                },
                'ai_debate': ai_debate,
                'panels': panels
            }
            
        except Exception as e:
            self.logger.error(f"获取仲裁案例数据失败: {e}")
            return {}
    
    def _get_ai_debate_data(self, stock_code: str, report_date: str) -> Dict[str, Any]:
        """获取AI辩论数据"""
        try:
            query = """
            SELECT * FROM generated_reports 
            WHERE target_code = :stock_code 
            AND report_date = :report_date
            ORDER BY created_at DESC
            LIMIT 1
            """
            
            results = self.execute_query(query, {
                'stock_code': stock_code,
                'report_date': report_date
            })
            
            if results:
                return results[0]
            else:
                return {}
                
        except Exception as e:
            self.logger.error(f"获取AI辩论数据失败: {e}")
            return {}
    
    def _get_raw_text_data(self, stock_code: str, report_date: str) -> List[Dict[str, Any]]:
        """获取原始文本数据"""
        try:
            query = """
            SELECT * FROM processed_events 
            WHERE :stock_code = ANY(related_stocks)
            AND published_at >= :start_date
            AND published_at <= :end_date
            ORDER BY published_at DESC
            LIMIT 20
            """
            
            start_date = (datetime.strptime(report_date, '%Y-%m-%d') - timedelta(days=30)).strftime('%Y-%m-%d')
            end_date = (datetime.strptime(report_date, '%Y-%m-%d') + timedelta(days=1)).strftime('%Y-%m-%d')
            
            return self.execute_query(query, {
                'stock_code': stock_code,
                'start_date': start_date,
                'end_date': end_date
            })
            
        except Exception as e:
            self.logger.error(f"获取原始文本数据失败: {e}")
            return []
    
    def _get_financial_snapshot(self, stock_code: str, report_date: str) -> List[Dict[str, Any]]:
        """获取财务快照数据"""
        try:
            query = """
            SELECT * FROM financial_reports 
            WHERE stock_code = :stock_code
            ORDER BY report_date DESC
            LIMIT 8
            """
            
            return self.execute_query(query, {'stock_code': stock_code})
            
        except Exception as e:
            self.logger.error(f"获取财务快照数据失败: {e}")
            return []
    
    def _get_quant_signals(self, stock_code: str, report_date: str) -> List[Dict[str, Any]]:
        """获取量化信号数据"""
        try:
            query = """
            SELECT * FROM quant_signals 
            WHERE target_code = :stock_code
            AND signal_date = :report_date
            """
            
            return self.execute_query(query, {
                'stock_code': stock_code,
                'report_date': report_date
            })
            
        except Exception as e:
            self.logger.error(f"获取量化信号数据失败: {e}")
            return []
    
    def _get_flow_and_chips_data(self, stock_code: str, report_date: str) -> Dict[str, Any]:
        """获取资金流向与筹码分布数据"""
        try:
            # 获取资金流向数据
            flow_query = """
            SELECT * FROM money_flow 
            WHERE stock_code = :stock_code
            AND flow_date = :report_date
            """
            
            flow_data = self.execute_query(flow_query, {
                'stock_code': stock_code,
                'report_date': report_date
            })
            
            # 获取龙虎榜数据
            top_list_query = """
            SELECT * FROM top_list 
            WHERE stock_code = :stock_code
            AND list_date = :report_date
            """
            
            top_list_data = self.execute_query(top_list_query, {
                'stock_code': stock_code,
                'report_date': report_date
            })
            
            # 获取筹码分布数据
            chip_query = """
            SELECT * FROM chip_distribution 
            WHERE stock_code = :stock_code
            AND distribution_date = :report_date
            """
            
            chip_data = self.execute_query(chip_query, {
                'stock_code': stock_code,
                'report_date': report_date
            })
            
            return {
                'money_flow': flow_data[0] if flow_data else {},
                'top_list': top_list_data,
                'chip_distribution': chip_data
            }
            
        except Exception as e:
            self.logger.error(f"获取资金流向与筹码分布数据失败: {e}")
            return {}
    
    def _get_historical_arbitrations(self, stock_code: str, report_date: str) -> List[Dict[str, Any]]:
        """获取历史仲裁记录"""
        try:
            query = """
            SELECT * FROM human_feedback_loop 
            WHERE stock_code = :stock_code
            AND feedback_date >= :start_date
            ORDER BY feedback_date DESC
            LIMIT 5
            """
            
            start_date = (datetime.strptime(report_date, '%Y-%m-%d') - timedelta(days=365)).strftime('%Y-%m-%d')
            
            return self.execute_query(query, {
                'stock_code': stock_code,
                'start_date': start_date
            })
            
        except Exception as e:
            self.logger.error(f"获取历史仲裁记录失败: {e}")
            return []
    
    def close_connections(self):
        """关闭数据库连接"""
        try:
            if self.db_engine:
                self.db_engine.dispose()
            
            if self.redis_client:
                self.redis_client.close()
            
            self.logger.info("数据库连接已关闭")
            
        except Exception as e:
            self.logger.error(f"关闭数据库连接失败: {e}")
    
    def __del__(self):
        """析构函数，确保连接被关闭"""
        self.close_connections()


def load_config(config_path: str) -> Dict[str, Any]:
    """
    加载配置文件
    
    Args:
        config_path: 配置文件路径
        
    Returns:
        配置字典
    """
    try:
        config_file = Path(config_path)
        if not config_file.exists():
            raise FileNotFoundError(f"配置文件不存在: {config_path}")
        
        with open(config_file, 'r', encoding='utf-8') as f:
            if config_file.suffix == '.json':
                return json.load(f)
            elif config_file.suffix in ['.yaml', '.yml']:
                import yaml
                return yaml.safe_load(f)
            else:
                raise ValueError(f"不支持的配置文件格式: {config_file.suffix}")
                
    except Exception as e:
        logging.error(f"加载配置文件失败: {e}")
        raise


def save_results_to_db(db_engine, data: Dict[str, Any]) -> bool:
    """
    保存分析结果到数据库（兼容性函数）
    
    Args:
        db_engine: 数据库引擎
        data: 分析结果
        
    Returns:
        是否保存成功
    """
    try:
        # 创建数据库管理器
        config = {'database_url': str(db_engine.url)}
        db_manager = DatabaseManager(config)
        
        # 保存结果
        return db_manager.save_results_to_db(data)
        
    except Exception as e:
        logging.error(f"保存分析结果失败: {e}")
        return False
