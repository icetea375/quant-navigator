# 智能分析系统测试套件

基于全流程测试计划v1.0的完整测试实现

## 📁 目录结构

```
tests/
├── config/                    # 测试配置
│   ├── test-setup.ts         # 测试环境设置
│   └── test-teardown.ts      # 测试环境清理
├── unit/                     # 单元测试
│   ├── backend/
│   │   ├── admin/            # 管理模块测试
│   │   ├── services/         # 服务层测试
│   │   └── engines/          # 引擎测试
│   └── frontend/             # 前端测试
├── integration/              # 集成测试
│   ├── database.integration.spec.ts
│   └── api.integration.spec.ts
├── e2e/                      # 端到端测试
│   └── workflow.e2e.spec.ts
├── performance/              # 性能测试
│   ├── load-test.spec.ts
│   └── stress-test.spec.ts
├── utils/                    # 测试工具
│   ├── test-data-manager.ts
│   └── test-helpers.ts
├── scripts/                  # 测试脚本
│   ├── setup-test-env.js
│   └── cleanup-test-data.js
├── data/                     # 测试数据
│   ├── fixtures/
│   ├── mocks/
│   └── datasets/
├── reports/                  # 测试报告
│   ├── coverage/
│   └── performance/
└── package.json              # 测试依赖配置
```

## 🚀 快速开始

### 1. 安装项目依赖

```bash
# 在项目根目录安装所有依赖
cd /path/to/papa
npm install

# 或者分别安装
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. 设置测试环境

```bash
# 在项目根目录运行
./run-tests.sh setup
```

### 3. 运行测试

**推荐方式（从项目根目录）：**
```bash
# 运行所有测试
./run-tests.sh all

# 运行特定类型测试
./run-tests.sh unit          # 单元测试
./run-tests.sh integration   # 集成测试
./run-tests.sh e2e          # 端到端测试
./run-tests.sh backend      # 后端测试
./run-tests.sh coverage     # 生成覆盖率报告
```

**或者从测试目录运行：**
```bash
cd tests

# 运行所有测试
npx jest

# 运行特定类型测试
npx jest --testPathPattern=unit
npx jest --testPathPattern=integration
npx jest --testPathPattern=e2e
npx jest --coverage
```

## 📋 测试类型说明

### 单元测试 (Unit Tests)
- **位置**: `unit/` 目录
- **目的**: 测试单个组件、服务、控制器的功能
- **特点**: 快速、独立、使用Mock对象
- **覆盖**: 业务逻辑、数据处理、错误处理

### 集成测试 (Integration Tests)
- **位置**: `integration/` 目录
- **目的**: 测试模块间的交互和集成
- **特点**: 使用真实数据库和外部服务
- **覆盖**: 数据库操作、API调用、服务间通信

### 端到端测试 (E2E Tests)
- **位置**: `e2e/` 目录
- **目的**: 测试完整的业务流程
- **特点**: 模拟真实用户操作
- **覆盖**: 完整工作流、用户场景、系统集成

### 性能测试 (Performance Tests)
- **位置**: `performance/` 目录
- **目的**: 测试系统性能和稳定性
- **特点**: 高负载、压力测试
- **覆盖**: 响应时间、吞吐量、资源使用

## 🛠️ 测试工具

### TestDataManager
测试数据管理器，用于创建和管理测试数据：

```typescript
import { TestDataManager } from './utils/test-data-manager';

const dataManager = new TestDataManager();

// 创建历史数据测试集
const datasetId = await dataManager.createHistoricalDataset({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  symbols: ['000001.SZ', '000002.SZ']
});

// 加载测试数据集
const dataset = await dataManager.loadDataset(datasetId);
```

### TestHelpers
测试辅助工具，提供常用的测试功能：

```typescript
import { TestHelpers } from './utils/test-helpers';

// 生成测试数据
const stockData = TestHelpers.generateTestData('stock_prices', 10);

// 创建Mock对象
const mockDatabase = TestHelpers.createMockDatabase();
const mockRedis = TestHelpers.createMockRedis();

// 验证API响应
const isValid = TestHelpers.validateApiResponse(response, ['id', 'name', 'value']);
```

## 📊 测试报告

### 覆盖率报告
```bash
npm run test:coverage
```
生成覆盖率报告到 `reports/coverage/` 目录

### 性能报告
```bash
npm run test:performance
```
生成性能测试报告到 `reports/performance/` 目录

## 🔧 配置说明

### 环境变量
```bash
# 测试数据库
DATABASE_URL=postgresql://test:test@localhost:5432/quant_navigator_test

# Redis配置
REDIS_URL=redis://localhost:6379/1

# 测试环境
NODE_ENV=test
```

### Jest配置
测试配置在 `package.json` 的 `jest` 字段中，包括：
- 模块路径映射
- 测试环境设置
- 覆盖率配置
- 超时设置

## 📈 测试标准

### 覆盖率要求
- **单元测试覆盖率**: >90%
- **集成测试覆盖率**: >80%
- **端到端测试覆盖率**: >70%
- **关键路径覆盖率**: 100%

### 性能要求
- **API响应时间**: 95% < 2秒
- **数据库查询**: 95% < 100ms
- **并发处理**: >500用户
- **错误率**: <1%

### 稳定性要求
- **系统可用性**: >99.5%
- **故障恢复时间**: <5分钟
- **内存使用**: <80%

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查数据库服务
   docker-compose up -d postgres

   # 检查连接配置
   echo $DATABASE_URL
   ```

2. **Redis连接失败**
   ```bash
   # 检查Redis服务
   docker-compose up -d redis

   # 检查连接配置
   echo $REDIS_URL
   ```

3. **测试超时**
   ```bash
   # 增加超时时间
   export TEST_TIMEOUT=30000
   ```

4. **内存不足**
   ```bash
   # 增加Node.js内存限制
   node --max-old-space-size=4096 node_modules/.bin/jest
   ```

### 调试模式
```bash
# 调试模式运行测试
npm run test:debug

# 详细日志输出
DEBUG=* npm test
```

## 📝 最佳实践

1. **测试隔离**: 每个测试用例应该独立运行
2. **数据清理**: 测试后清理测试数据
3. **Mock使用**: 合理使用Mock对象避免外部依赖
4. **断言明确**: 使用明确的断言验证结果
5. **错误处理**: 测试异常情况和边界条件
6. **性能考虑**: 避免长时间运行的测试
7. **文档更新**: 及时更新测试文档

## 🔄 持续集成

### GitHub Actions示例
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd tests && npm install
      - run: cd tests && npm test
      - run: cd tests && npm run test:coverage
```

## 📞 支持

如有问题，请查看：
1. 测试日志文件
2. 错误堆栈信息
3. 系统资源使用情况
4. 网络连接状态

---

**注意**: 本测试套件基于全流程测试计划v1.0设计，确保系统质量和稳定性。请严格按照测试标准执行测试。
