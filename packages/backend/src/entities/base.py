"""
基础实体类 - 所有实体的基类
提供通用的数据库字段和验证逻辑
"""

from datetime import datetime
from typing import Any, Dict
from sqlalchemy import Column, String, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from pydantic import BaseModel, Field, validator

# 创建SQLAlchemy基类
Base = declarative_base()


class DatabaseEntityMixin:
    """数据库实体混入类 - 提供通用字段"""
    
    id = Column(String(255), primary_key=True, comment="唯一标识符")
    created_at = Column(DateTime, default=func.now(), nullable=False, comment="创建时间")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False, comment="更新时间")
    metadata_json = Column(JSON, default=dict, comment="元数据")


class PydanticMixin:
    """Pydantic混入类 - 提供与Pydantic模型的转换方法"""
    
    def to_pydantic(self, pydantic_class: BaseModel) -> BaseModel:
        """转换为Pydantic模型"""
        data = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                # 处理时间戳字段
                if column.name in ['timestamp']:
                    data[column.name] = int(value.timestamp() * 1000)  # 转换为毫秒时间戳
                else:
                    data[column.name] = value.isoformat()
            elif column.name == 'metadata_json':
                data['metadata'] = value or {}
            else:
                data[column.name] = value
        
        return pydantic_class(**data)
    
    @classmethod
    def from_pydantic(cls, pydantic_model: BaseModel, **kwargs):
        """从Pydantic模型创建实体实例"""
        data = pydantic_model.model_dump()
        
        # 处理特殊字段
        if 'metadata' in data:
            data['metadata_json'] = data.pop('metadata')
        
        # 处理时间戳字段
        if 'timestamp' in data and isinstance(data['timestamp'], int):
            data['timestamp'] = datetime.fromtimestamp(data['timestamp'] / 1000)
        
        # 添加额外参数
        data.update(kwargs)
        
        return cls(**data)


class BaseEntity(Base, DatabaseEntityMixin, PydanticMixin):
    """基础实体类 - 所有实体的基类"""
    __abstract__ = True
    
    def __repr__(self):
        """字符串表示"""
        return f"<{self.__class__.__name__}(id='{self.id}')>"
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                result[column.name] = value.isoformat()
            else:
                result[column.name] = value
        return result
