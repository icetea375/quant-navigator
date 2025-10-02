"""
BaseEntity 单元测试
测试基础实体类的功能
"""

from datetime import datetime

import pytest
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.orm import sessionmaker

from src.entities.base import Base, BaseEntity, DatabaseEntityMixin


class TestEntity(BaseEntity):
    """测试实体类"""

    __tablename__ = "test_entities"

    name = Column(String(255), nullable=False)
    value = Column(Integer, default=0)


class TestPydanticModel(BaseModel):
    """测试Pydantic模型"""

    id: str
    name: str
    value: int = 0
    created_at: datetime
    updated_at: datetime
    metadata: dict = {}


class TestDatabaseEntityMixin:
    """测试DatabaseEntityMixin混入类"""

    def test_database_entity_mixin_attributes(self):
        """测试数据库实体混入类的属性"""
        # 检查类属性
        assert hasattr(DatabaseEntityMixin, "id")
        assert hasattr(DatabaseEntityMixin, "created_at")
        assert hasattr(DatabaseEntityMixin, "updated_at")
        assert hasattr(DatabaseEntityMixin, "metadata_json")


class TestPydanticMixin:
    """测试PydanticMixin混入类"""

    @pytest.fixture
    def test_entity(self):
        """创建测试实体实例"""
        return TestEntity(
            id="test_001",
            name="Test Entity",
            value=42,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            metadata_json={"source": "test"},
        )

    def test_to_pydantic_conversion(self, test_entity):
        """测试转换为Pydantic模型"""
        pydantic_model = test_entity.to_pydantic(TestPydanticModel)

        assert isinstance(pydantic_model, TestPydanticModel)
        assert pydantic_model.id == "test_001"
        assert pydantic_model.name == "Test Entity"
        assert pydantic_model.value == 42
        assert pydantic_model.metadata == {"source": "test"}
        assert isinstance(pydantic_model.created_at, datetime)
        assert isinstance(pydantic_model.updated_at, datetime)

    def test_from_pydantic_conversion(self):
        """测试从Pydantic模型创建实体"""
        pydantic_model = TestPydanticModel(
            id="test_002",
            name="Test Model",
            value=100,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            metadata={"source": "pydantic"},
        )

        entity = TestEntity.from_pydantic(pydantic_model)

        assert isinstance(entity, TestEntity)
        assert entity.id == "test_002"
        assert entity.name == "Test Model"
        assert entity.value == 100
        assert entity.metadata_json == {"source": "pydantic"}

    def test_from_pydantic_with_timestamp(self):
        """测试从Pydantic模型创建实体(带时间戳)"""
        pydantic_model = TestPydanticModel(
            id="test_003",
            name="Test Timestamp",
            value=200,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            metadata={"timestamp": 1640995200000},  # 2022-01-01 00:00:00 UTC
        )

        entity = TestEntity.from_pydantic(pydantic_model)

        assert isinstance(entity, TestEntity)
        assert entity.id == "test_003"
        assert entity.name == "Test Timestamp"
        assert entity.value == 200
        assert entity.metadata_json == {"timestamp": 1640995200000}

    def test_from_pydantic_with_extra_kwargs(self):
        """测试从Pydantic模型创建实体(带额外参数)"""
        pydantic_model = TestPydanticModel(
            id="test_004",
            name="Test Extra",
            value=300,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            metadata={"extra": "data"},
        )

        # 注意: SQLAlchemy实体不支持额外字段,所以只测试基本转换
        entity = TestEntity.from_pydantic(pydantic_model)

        assert isinstance(entity, TestEntity)
        assert entity.id == "test_004"
        assert entity.name == "Test Extra"
        assert entity.value == 300
        assert entity.metadata_json == {"extra": "data"}


class TestBaseEntity:
    """测试BaseEntity基类"""

    @pytest.fixture
    def test_entity(self):
        """创建测试实体实例"""
        return TestEntity(
            id="test_005",
            name="Base Test",
            value=500,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            metadata_json={"type": "base_test"},
        )

    def test_repr(self, test_entity):
        """测试字符串表示"""
        repr_str = repr(test_entity)
        assert "TestEntity" in repr_str
        assert "test_005" in repr_str

    def test_to_dict(self, test_entity):
        """测试转换为字典"""
        result = test_entity.to_dict()

        assert isinstance(result, dict)
        assert result["id"] == "test_005"
        assert result["name"] == "Base Test"
        assert result["value"] == 500
        assert result["metadata_json"] == {"type": "base_test"}
        assert "created_at" in result
        assert "updated_at" in result
        assert isinstance(result["created_at"], str)  # ISO格式
        assert isinstance(result["updated_at"], str)  # ISO格式

    def test_to_dict_with_datetime_conversion(self, test_entity):
        """测试字典转换中的时间格式"""
        result = test_entity.to_dict()

        # 验证时间格式
        created_at = datetime.fromisoformat(result["created_at"])
        updated_at = datetime.fromisoformat(result["updated_at"])

        assert isinstance(created_at, datetime)
        assert isinstance(updated_at, datetime)

    def test_abstract_base_class(self):
        """测试抽象基类"""
        # TestEntity不是抽象类,因为它有具体的表定义
        assert hasattr(TestEntity, "__tablename__")
        assert BaseEntity.__abstract__ is True


class TestBaseEntityIntegration:
    """测试BaseEntity集成功能"""

    @pytest.fixture
    def engine(self):
        """创建内存数据库引擎"""
        return create_engine("sqlite:///:memory:", echo=False)

    @pytest.fixture
    def session(self, engine):
        """创建数据库会话"""
        Base.metadata.create_all(engine)
        Session = sessionmaker(bind=engine)
        return Session()

    def test_database_operations(self, session):
        """测试数据库操作"""
        # 创建实体
        entity = TestEntity(
            id="db_test_001",
            name="Database Test",
            value=999,
            metadata_json={"test": "database"},
        )

        # 保存到数据库
        session.add(entity)
        session.commit()

        # 查询实体
        retrieved = session.query(TestEntity).filter_by(id="db_test_001").first()
        assert retrieved is not None
        assert retrieved.name == "Database Test"
        assert retrieved.value == 999
        assert retrieved.metadata_json == {"test": "database"}

        # 测试转换为Pydantic
        pydantic_model = retrieved.to_pydantic(TestPydanticModel)
        assert pydantic_model.id == "db_test_001"
        assert pydantic_model.name == "Database Test"
        assert pydantic_model.value == 999
        assert pydantic_model.metadata == {"test": "database"}

        # 测试转换为字典
        entity_dict = retrieved.to_dict()
        assert entity_dict["id"] == "db_test_001"
        assert entity_dict["name"] == "Database Test"
        assert entity_dict["value"] == 999
        assert entity_dict["metadata_json"] == {"test": "database"}

    def test_pydantic_round_trip(self, session):
        """测试Pydantic往返转换"""
        # 创建Pydantic模型
        pydantic_model = TestPydanticModel(
            id="round_trip_001",
            name="Round Trip Test",
            value=777,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            metadata={"round_trip": True},
        )

        # 转换为实体
        entity = TestEntity.from_pydantic(pydantic_model)
        session.add(entity)
        session.commit()

        # 查询并转换回Pydantic
        retrieved = session.query(TestEntity).filter_by(id="round_trip_001").first()
        converted_back = retrieved.to_pydantic(TestPydanticModel)

        # 验证数据一致性
        assert converted_back.id == pydantic_model.id
        assert converted_back.name == pydantic_model.name
        assert converted_back.value == pydantic_model.value
        assert converted_back.metadata == pydantic_model.metadata
