# Quant Navigator Shared Types

**量化导航仪项目的类型契约宪法**

这是所有模块关于业务数据结构的单一事实来源。任何模块都必须通过此包导入共享类型定义。

## 设计原则

1. **单一事实来源**: 所有业务实体的数据结构定义都在这里
2. **类型安全**: 使用 Pydantic 确保运行时类型验证
3. **前后端一致**: Python 后端和 TypeScript 前端使用相同的契约
4. **版本控制**: 所有变更都有明确的版本记录

## 核心模块

- `events.py`: 事件相关类型定义
- `reports.py`: 报告相关类型定义  
- `quant_signals.py`: 量化信号相关类型定义
- `workflow.py`: 工作流相关类型定义
- `common.py`: 通用类型定义

## 安装

```bash
pip install -e .
```

## 使用示例

```python
from quant_navigator_shared_types.events import ProcessedEvent, AnomalyEvent
from quant_navigator_shared_types.quant_signals import QuantSignal
from quant_navigator_shared_types.common import ApiResponse

# 创建事件实例
event = ProcessedEvent(
    event_id="evt_123",
    event_type="news",
    title="重大公告",
    content="公司发布重要公告...",
    # ... 其他字段
)

# 类型验证
print(event.model_dump_json())
```

## 开发

```bash
# 安装开发依赖
pip install -e ".[dev]"

# 运行测试
pytest

# 类型检查
mypy src/

# 代码格式化
black src/
isort src/
```
