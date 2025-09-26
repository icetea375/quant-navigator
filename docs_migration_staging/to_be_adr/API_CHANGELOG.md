# API契约变更日志 (Contract Changelog)

> **目的**: 记录所有对前端产生影响的API契约变更，确保前后端协作的"人类层面"意图同步
>
> **纪律**: 每一次后端做出破坏性API契约变更时，必须在此文件中记录变更日志

---

## API版本: v1.3.0 (2025-01-26)

### BREAKING CHANGE: 简化服务监控端点

**端点**: `GET /services/health` 和 `GET /services/metrics`

**变更**:
- 移除了复杂的服务管理器依赖
- 简化为静态响应，不再动态获取服务状态
- 响应结构大幅简化

**理由**: 遵循YAGNI原则，当前只有1个LLM服务，不需要复杂的服务管理机制

**对前端的影响**:
- 前端监控页面需要更新为简化的响应结构
- 移除了动态服务列表和详细指标
- 需要更新相关的TypeScript类型定义

**迁移指南**:
```typescript
// 旧版本 (复杂)
interface ServiceHealth {
  service_name: string;
  status: string;
  dependencies: string[];
  call_count: number;
  error_count: number;
  error_rate: number;
}

// 新版本 (简化)
interface ServiceHealth {
  status: string;
  services: string[];
  timestamp: string;
}
```

---

## API版本: v1.4.0 (2025-01-26)

### BREAKING CHANGE: 采用YAGNI原则简化架构

**影响范围**: 整个后端服务架构

**变更**:
- 删除了`src/core/infra_proposals/`目录及其所有预研代码
- 移除了复杂的ServiceBase、ServiceManager等微服务化管理体系
- 回归到简单的手动依赖注入和顺序启动模式
- 简化了FastAPI应用的服务初始化流程

**理由**: 遵循YAGNI原则，当前只有1个LLM服务，复杂的微服务化管理是"赘肉"而非"骨骼"

**对前端的影响**:
- 无直接影响，API接口保持不变
- 服务监控端点已在前一版本中简化
- 后端架构更加简洁，维护成本降低

**架构决策**: 通过ADR-011记录了详细的服务管理模式选型决策

**预研代码位置**: 微服务化管理相关的POC代码已保存在Git历史记录中，可通过commit hash找到"永不腐烂"的特定版本

---

## API版本: v1.2.0 (2025-01-26)

### FEATURE: 添加健康检查端点

**端点**: `GET /health`

**变更**: 新增基础健康检查端点

**理由**: 为CI/CD流水线提供健康检查支持

**对前端的影响**: 无直接影响，仅用于运维监控

---

## API版本: v1.1.0 (2025-01-26)

### FEATURE: 添加服务监控端点

**端点**: `GET /services/health` 和 `GET /services/metrics`

**变更**: 新增服务监控相关端点

**理由**: 为运维监控提供数据支持

**对前端的影响**: 前端可以添加服务监控页面

---

## API版本: v1.0.0 (2025-01-26)

### INITIAL: 初始API版本

**端点**: 所有基础API端点

**变更**: 建立初始API契约

**理由**: 从NestJS迁移到Python FastAPI的初始版本

**对前端的影响**: 前端需要适配新的API响应格式

---

## 变更日志规范

### 记录时机
- 任何会改变API响应结构的修改
- 任何会改变请求参数的修改
- 任何会删除或重命名端点的修改
- 任何会改变错误响应格式的修改

### 记录格式
```
## API版本: vX.Y.Z (YYYY-MM-DD)

### 变更类型: BREAKING CHANGE | FEATURE | BUGFIX | DEPRECATION

**端点**: 受影响的API端点

**变更**: 具体的变更内容

**理由**: 变更的业务或技术理由

**对前端的影响**: 前端需要做的相应调整

**迁移指南**: 具体的代码示例和迁移步骤
```

### 变更类型说明
- **BREAKING CHANGE**: 破坏性变更，前端必须修改代码
- **FEATURE**: 新功能，前端可以选择性使用
- **BUGFIX**: 错误修复，通常不影响前端
- **DEPRECATION**: 废弃功能，前端需要准备迁移

### 前端同步流程
1. 后端开发者记录变更日志
2. 运行类型生成脚本更新TypeScript类型
3. 前端开发者查看变更日志和新的类型定义
4. 前端开发者根据迁移指南更新代码
5. 测试验证前后端协作正常

---

**维护说明**: 每次API变更后，请及时更新此文档。这是确保前后端协作质量的关键文档。
