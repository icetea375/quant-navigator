# 量化导航仪后端服务 - Python全栈架构 v13.1

## 概述

这是量化导航仪系统的后端服务，采用纯Python技术栈，基于FastAPI框架构建。本架构实现了从原有的"JS+Python"混合技术栈到统一Python全栈的迁移。

## 技术栈

- **Web框架**: FastAPI + Uvicorn
- **数据验证**: Pydantic
- **数据库**: SQLAlchemy + PostgreSQL
- **缓存**: Redis
- **测试**: pytest + httpx
- **CLI**: Typer
- **代码质量**: Black + isort + mypy + flake8

## 项目结构

```
packages/backend-python/
├── src/                          # 源代码
│   ├── api/                      # API路由
│   │   ├── admin.py             # 管理后台API
│   │   ├── reports.py           # 报告管理API
│   │   └── workflow.py          # 工作流API
│   ├── core/                    # 核心模块
│   │   ├── config.py            # 配置管理
│   │   └── logging_config.py    # 日志配置
│   ├── database/                # 数据库
│   │   └── connection.py        # 数据库连接
│   ├── schemas/                 # Pydantic模式
│   │   ├── arbitration.py       # 仲裁案件模式
│   │   └── reports.py           # 报告模式
│   ├── services/                # 业务逻辑层
│   │   ├── arbitration_service.py
│   │   ├── report_service.py
│   │   └── workflow_service.py
│   └── main.py                  # FastAPI应用入口
├── tests/                       # 测试代码
│   ├── api/                     # API测试
│   ├── services/                # 服务测试
│   └── conftest.py             # 测试配置
├── main.py                      # CLI入口点
├── pyproject.toml              # 项目配置
└── pytest.ini                 # 测试配置
```

## 快速开始

### 1. 安装依赖

```bash
# 使用Poetry（推荐）
poetry install

# 或使用pip
pip install -r requirements.txt
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/quantitative_navigator

# Redis配置
REDIS_URL=redis://localhost:6379/0

# LLM API密钥
QWEN_API_KEY=your_qwen_api_key
DOUBAO_API_KEY=your_doubao_api_key
OPENAI_API_KEY=your_openai_api_key

# 其他配置
SECRET_KEY=your-secret-key
DEBUG=true
```

### 3. 启动服务

```bash
# 启动FastAPI服务器
python main.py start-server

# 或直接使用uvicorn
uvicorn src.main:app --reload
```

### 4. 运行测试

```bash
# 运行所有测试
python main.py test

# 或直接使用pytest
pytest -v
```

## CLI命令

```bash
# 运行日常分析工作流
python main.py run-daily-flow --date 2025-01-26

# 运行历史数据回填
python main.py run-historical-backfill --start-date 20230101 --end-date 20231231

# 启动服务器
python main.py start-server --host 0.0.0.0 --port 8000

# 运行测试
python main.py test

# 查看状态
python main.py status
```

## API文档

启动服务后，访问以下地址查看API文档：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 主要功能

### 1. 管理后台API (`/api/v1/admin`)

- 获取仲裁案件列表
- 查看仲裁案件详情
- 更新仲裁案件状态
- 预处理仲裁案件（为人类仲裁官提供案情摘要）
- 获取统计信息

### 2. 报告管理API (`/api/v1/reports`)

- 创建、查询、更新、删除报告
- 按类型、日期、目标代码筛选报告
- 获取报告统计信息

### 3. 工作流API (`/api/v1/workflow`)

- 启动日常分析工作流
- 启动历史数据回填工作流
- 查看工作流状态和日志

## 开发指南

### TDD开发流程

1. **红灯**: 编写会失败的测试
2. **绿灯**: 编写最简单的代码让测试通过
3. **重构**: 优化代码结构，保持测试通过

### 代码质量

```bash
# 格式化代码
black src/ tests/

# 排序导入
isort src/ tests/

# 类型检查
mypy src/

# 代码检查
flake8 src/ tests/
```

### 测试覆盖率

```bash
# 运行测试并生成覆盖率报告
pytest --cov=src --cov-report=html
```

## 架构特点

1. **统一技术栈**: 纯Python，消除跨语言通信复杂性
2. **TDD驱动**: 严格的测试驱动开发流程
3. **模块化设计**: 清晰的层次结构和职责分离
4. **类型安全**: 使用Pydantic和mypy确保类型安全
5. **异步支持**: 基于FastAPI的异步API设计
6. **CLI友好**: 使用Typer创建专业的命令行工具

## 迁移说明

本架构是从原有的NestJS + Python混合架构迁移而来：

- 原有的NestJS后端已归档到 `_archive_backend_nestjs/`
- 原有的AIGC NestJS后端已归档到 `_archive_aigc_backend_nestjs/`
- 所有Python模块已整合到新的统一架构中
- 保持了原有的业务逻辑和API接口兼容性

## 版本历史

- **v13.1**: Python全栈架构重构，统一技术栈
- **v11.9**: 智能仲裁预处理架构升级
- **v11.0**: 双脑并行分析架构

## 贡献指南

1. 遵循TDD开发流程
2. 保持代码质量和测试覆盖率
3. 更新相关文档
4. 提交前运行所有测试和代码检查

## 许可证

MIT License
