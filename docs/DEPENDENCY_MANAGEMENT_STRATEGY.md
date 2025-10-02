# 量化导航仪 Monorepo - 依赖管理策略

## 📋 概述

本文档描述了量化导航仪 Monorepo 的完整依赖管理策略，从根目录到各个子项目的层级依赖管理方案。

## 🏗️ 架构设计

### 依赖层级结构

```
根目录 (Root Level)
├── requirements.txt          # Python 统一依赖
├── pyproject.toml           # Python 项目配置
├── package.json             # Node.js 统一依赖
├── pnpm-workspace.yaml      # 工作区配置
└── .python-version          # Python 版本锁定

应用层 (Apps Level)
├── apps/api/package.json    # API 应用配置
└── apps/web/package.json    # Web 应用配置

包层 (Packages Level)
├── packages/backend-python/
│   ├── pyproject.toml       # 后端 Python 配置
│   └── requirements.txt     # 后端特定依赖
├── packages/frontend-main/
│   └── package.json         # 前端配置
└── packages/shared-types/
    ├── package.json         # 共享类型配置
    └── pyproject.toml       # Python 类型配置
```

## 🎯 管理原则

### 1. 统一性原则
- **根目录统一管理**：所有主要依赖在根目录统一管理
- **版本一致性**：确保所有子项目使用相同版本的依赖
- **配置集中化**：依赖配置集中在根目录，子项目继承

### 2. 分层管理原则
- **根目录**：核心依赖和开发工具
- **应用层**：应用特定的入口配置
- **包层**：包特定的依赖和版本覆盖

### 3. 自动化原则
- **自动安装**：一键安装所有依赖
- **自动验证**：自动验证依赖完整性
- **自动更新**：自动更新和审计依赖

## 🔧 技术实现

### Python 依赖管理

#### 根目录配置
```toml
# pyproject.toml
[tool.poetry]
name = "quant-navigator-monorepo"
version = "13.3.0"

[tool.poetry.dependencies]
python = "^3.9"
fastapi = "^0.100.0"
uvicorn = "^0.23.0"
# ... 其他核心依赖
```

#### 后端特定配置
```toml
# packages/backend-python/pyproject.toml
[tool.poetry.dependencies]
python = "^3.9"
quant-navigator-shared-types = {path = "../shared-types", develop = true}
# 注意：主要依赖由根目录管理
```

### Node.js 依赖管理

#### 根目录配置
```json
{
  "name": "@quant-navigator/monorepo",
  "workspaces": [
    "packages/*",
    "apps/*",
    "libs/*"
  ],
  "dependencies": {
    "vue": "^3.4.0",
    "element-plus": "^2.11.0"
  }
}
```

#### 工作区配置
```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - 'libs/*'
  - 'tools/tests'
```

## 🚀 使用指南

### 环境设置

#### 1. 自动设置（推荐）
```bash
# 一键设置完整环境
./tools/scripts/setup-environment.sh
```

#### 2. 手动设置
```bash
# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装 Python 依赖
pip install -r requirements.txt

# 安装 Node.js 依赖
pnpm install
```

### 依赖管理

#### 添加新依赖
```bash
# Python 依赖
pip install <package>
pip freeze > requirements.txt

# Node.js 依赖
pnpm add <package>
```

#### 更新依赖
```bash
# 使用依赖管理器
python tools/scripts/dependency-manager.py --update

# 或手动更新
pip install --upgrade -r requirements.txt
pnpm update
```

#### 安全审计
```bash
# 运行安全审计
python tools/scripts/dependency-manager.py --audit

# 或手动审计
safety check --file requirements.txt
pnpm audit
```

### 开发工作流

#### 启动开发环境
```bash
# 启动完整开发环境
./scripts/start_development.sh

# 或分别启动
pnpm dev:backend
pnpm dev:frontend
```

#### 运行测试
```bash
# 运行所有测试
pnpm test

# 运行特定测试
pnpm test:backend
pnpm test:frontend
```

#### 代码质量检查
```bash
# 代码检查
pnpm lint

# 类型检查
pnpm type-check

# 格式化
pnpm format
```

## 📊 依赖分类

### Python 依赖分类

#### 核心框架
- `fastapi` - Web 框架
- `uvicorn` - ASGI 服务器
- `granian` - 高性能 ASGI 服务器
- `pydantic` - 数据验证

#### 数据库
- `sqlalchemy` - ORM
- `psycopg2-binary` - PostgreSQL 驱动
- `asyncpg` - 异步 PostgreSQL 驱动

#### 数据科学
- `pandas` - 数据分析
- `numpy` - 数值计算
- `scikit-learn` - 机器学习
- `lightgbm` - 梯度提升

#### 金融数据
- `tushare` - 金融数据获取

#### LLM 服务
- `openai` - OpenAI API
- `anthropic` - Anthropic API
- `httpx` - HTTP 客户端

#### 后台任务
- `arq` - 异步任务队列
- `redis` - 缓存和消息队列

#### 开发工具
- `pytest` - 测试框架
- `ruff` - 代码检查
- `mypy` - 类型检查
- `black` - 代码格式化

### Node.js 依赖分类

#### 核心框架
- `vue` - 前端框架
- `element-plus` - UI 组件库
- `pinia` - 状态管理

#### 开发工具
- `vite` - 构建工具
- `typescript` - 类型系统
- `vitest` - 测试框架
- `eslint` - 代码检查

## 🔒 安全策略

### 依赖安全
1. **定期审计**：每周运行安全审计
2. **版本锁定**：使用精确版本号
3. **来源验证**：只使用可信来源的包
4. **漏洞监控**：监控已知安全漏洞

### 自动化安全
```bash
# 每日安全检查
python tools/scripts/dependency-manager.py --audit

# 依赖更新检查
python tools/scripts/dependency-manager.py --update --dry-run
```

## 📈 性能优化

### 安装优化
1. **并行安装**：使用 pnpm 的并行安装
2. **缓存利用**：利用 pip 和 pnpm 缓存
3. **依赖去重**：避免重复依赖

### 运行时优化
1. **按需加载**：只加载必要的依赖
2. **版本兼容**：确保版本兼容性
3. **内存管理**：优化内存使用

## 🐛 故障排除

### 常见问题

#### 1. 依赖冲突
```bash
# 检查依赖树
pip show <package>
pnpm list <package>

# 解决冲突
pip install --upgrade <package>
pnpm update <package>
```

#### 2. 版本不兼容
```bash
# 检查版本兼容性
python -c "import <package>; print(<package>.__version__)"
node -e "console.log(require('<package>/package.json').version)"
```

#### 3. 安装失败
```bash
# 清理缓存
pip cache purge
pnpm store prune

# 重新安装
rm -rf node_modules venv
./tools/scripts/setup-environment.sh
```

### 调试工具

#### 依赖分析
```bash
# 生成依赖报告
python tools/scripts/dependency-manager.py --report

# 分析依赖树
pip show --files <package>
pnpm list --depth=0
```

#### 性能分析
```bash
# 分析安装时间
time pip install -r requirements.txt
time pnpm install

# 分析包大小
pip show <package> | grep Size
pnpm list --depth=0 --json
```

## 📚 最佳实践

### 1. 依赖管理
- 定期更新依赖
- 使用版本锁定
- 避免过度依赖
- 定期清理未使用的依赖

### 2. 版本控制
- 提交 requirements.txt
- 提交 package-lock.yaml
- 使用语义化版本
- 记录重大版本变更

### 3. 团队协作
- 统一开发环境
- 文档化依赖变更
- 代码审查依赖更新
- 定期同步依赖

## 🔄 维护计划

### 日常维护
- 每日安全审计
- 每周依赖更新检查
- 每月性能优化

### 定期维护
- 每季度依赖大版本更新
- 每半年架构优化
- 每年技术栈评估

## 📞 支持

如有问题，请参考：
1. 本文档的故障排除部分
2. 项目 README.md
3. 相关工具文档
4. 团队技术文档

---

**最后更新**: 2025-01-17  
**版本**: v13.3.0  
**维护者**: Quant Navigator Team
