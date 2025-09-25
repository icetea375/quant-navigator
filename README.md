# 量化导航仪 - 智能投资分析平台

## 🎯 项目简介

量化导航仪是一个基于AI的智能投资分析平台，提供市场雷达、AI投研助理等核心功能，帮助投资者做出更明智的投资决策。

## 🏗️ 项目架构

本项目采用Monorepo架构，包含以下核心服务：

```
quant-navigator-system/
├── 📁 frontend/          # 前端应用 (Vue 3 + Vite)
├── 📁 backend/           # 后端服务 (Node.js + NestJS)
├── 📁 data_services/     # 数据与计算服务 (Python + FastAPI)
├── 📁 database/          # 数据库相关
├── 📁 config/            # 全局配置文件
├── 📁 scripts/           # 全局脚本
└── 📁 docs/              # 项目文档
```

## 🚀 快速开始

### 环境要求

- Docker & Docker Compose
- Node.js 18+ (本地开发)
- Python 3.11+ (本地开发)

### 一键启动

```bash
# 克隆项目
git clone <repository-url>
cd quant-navigator-system

# 运行安装脚本
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 手动启动

```bash
# 1. 启动数据库和缓存
docker-compose up postgres redis -d

# 2. 启动后端服务
cd backend
npm install
npm run start:dev

# 3. 启动数据服务
cd ../data_services
pip install -r requirements.txt
python -m uvicorn app.main:app --reload

# 4. 启动前端服务
cd ../frontend
npm install
npm run dev
```

## 🌐 访问地址

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:3001
- **数据服务**: http://localhost:8000
- **API文档**: http://localhost:8000/docs

## 📚 核心功能

### 1. 市场雷达 (公开版)
- 实时市场数据展示
- 基础技术指标分析
- 市场热点追踪

### 2. AI投研助理 (私人版)
- 个性化股票池管理
- AI驱动的投资分析
- 智能归因分析
- 每日市场快报

### 3. 系统大脑控制台 (管理员)
- 配置管理
- 系统监控
- 用户管理

## 🛠️ 开发指南

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

### 后端开发

```bash
cd backend
npm install
npm run start:dev
```

### 数据服务开发

```bash
cd data_services
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

## 📝 配置说明

配置文件位于 `config/` 目录：

- `default.json` - 默认配置
- `development.json` - 开发环境配置
- `production.json` - 生产环境配置

## 🐳 Docker部署

```bash
# 构建所有服务
docker-compose build

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 📊 数据库

项目使用PostgreSQL作为主数据库，Redis作为缓存。

### 数据库迁移

```bash
# 运行迁移脚本
cd database
psql -h localhost -U postgres -d quant_navigator -f migrations/001_create_users_table.sql
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- 项目维护者: [Your Name]
- 邮箱: [your.email@example.com]
- 项目链接: [https://github.com/your-username/quant-navigator-system]

---

**注意**: 这是一个开发中的项目，请在生产环境中谨慎使用。
