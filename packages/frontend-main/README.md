# 量化导航仪前端应用

基于Vue 3 + TypeScript + Element Plus的现代化前端应用，为量化投资分析提供智能化的用户界面。

## 🚀 快速开始

### 环境要求

- Node.js 18.0+
- npm 8.0+ 或 yarn 1.22+

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 📁 项目结构

```
frontend/
├── src/
│   ├── components/          # 组件目录
│   │   ├── admin/          # 管理后台组件
│   │   ├── public/         # 公共版组件
│   │   └── private/        # 私人版组件
│   ├── views/              # 页面级组件
│   │   ├── auth/           # 认证页面
│   │   ├── private/        # 私人版页面
│   │   └── admin/          # 管理页面
│   ├── stores/             # Pinia状态管理
│   ├── services/           # API服务层
│   ├── types/              # TypeScript类型定义
│   ├── router/             # 路由配置
│   ├── assets/             # 静态资源
│   ├── App.vue             # 根组件
│   └── main.ts             # 应用入口
├── public/                 # 公共静态资源
├── package.json            # 项目配置
├── vite.config.ts          # Vite配置
├── tsconfig.json           # TypeScript配置
├── Dockerfile              # Docker配置
└── nginx.conf              # Nginx配置
```

## 🎯 功能模块

### 公共版功能
- **市场雷达** - 实时监控市场动态，智能识别投资机会
- **盘前高能事件** - 展示重要市场事件和影响分析
- **盘后热点复盘** - 分析市场异动原因和投资机会

### 私人版功能
- **AI投研助理** - 基于个人持仓的个性化投资分析
- **股票池管理** - 管理个人股票池，跟踪投资组合
- **专属盘前雷达** - 针对个人持仓的定制化市场分析

### 用户认证
- **登录/注册** - 安全的用户认证系统
- **个人资料** - 用户信息管理
- **权限控制** - 基于角色的访问控制

### 管理员功能
- **系统大脑控制台** - 系统状态监控和管理
- **数据管道监控** - 实时监控数据处理流程
- **AI引擎管理** - 管理和监控AI模型运行状态
- **系统配置** - 灵活的系统参数配置
- **日志管理** - 系统日志查看和导出

## 🛠️ 技术栈

- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 类型安全的JavaScript超集
- **Element Plus** - 基于Vue 3的组件库
- **Pinia** - Vue 3状态管理库
- **Vue Router** - Vue.js官方路由管理器
- **Axios** - HTTP客户端
- **Vite** - 下一代前端构建工具
- **Day.js** - 轻量级日期处理库

## 🔧 开发规范

### 代码规范
- 使用ESLint进行代码检查
- 遵循Vue 3 Composition API最佳实践
- TypeScript严格模式
- 组件单一职责原则

### 命名规范
- 组件文件使用PascalCase
- 工具函数使用camelCase
- 常量使用UPPER_SNAKE_CASE
- CSS类名使用kebab-case

### 目录规范
- 按功能模块组织代码
- 公共组件放在components目录
- 页面组件放在views目录
- 工具函数放在utils目录

## 🐳 Docker部署

### 构建镜像

```bash
docker build -t quant-navigator-frontend .
```

### 运行容器

```bash
docker run -p 80:80 quant-navigator-frontend
```

### Docker Compose

```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    depends_on:
      - backend
```

## 🔗 API集成

### 后端服务
- 后端API地址: http://localhost:3001
- 数据服务地址: http://localhost:8000

### API代理配置
开发环境下，Vite会自动代理API请求到后端服务。

### 环境变量
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_DATA_SERVICE_URL=http://localhost:8000
```

## 📱 响应式设计

应用完全支持响应式设计，适配以下设备：
- 桌面端 (1200px+)
- 平板端 (768px - 1199px)
- 移动端 (< 768px)

## 🧪 测试

### 单元测试
```bash
npm run test:unit
```

### 端到端测试
```bash
npm run test:e2e
```

### 测试覆盖率
```bash
npm run test:coverage
```

## 📦 构建优化

- 代码分割和懒加载
- 静态资源压缩
- Tree Shaking
- Gzip压缩
- 浏览器缓存优化

## 🚨 故障排除

### 常见问题

1. **依赖安装失败**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **端口被占用**
   ```bash
   # 修改vite.config.ts中的端口配置
   server: { port: 3001 }
   ```

3. **API请求失败**
   - 检查后端服务是否启动
   - 确认API地址配置正确
   - 检查网络连接

4. **构建失败**
   - 检查TypeScript类型错误
   - 确认所有依赖已安装
   - 查看构建日志

## 📄 许可证

MIT License

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 📞 支持

如有问题，请联系开发团队或提交Issue。

---

**版本**: v1.0.0
**更新时间**: 2024年1月
**维护者**: 开发团队
