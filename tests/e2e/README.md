# E2E测试文档

## 概述

本目录包含"量化导航仪"系统的端到端(E2E)测试，严格遵循"测试宪法"第3.3条要求。

## 测试范围

### 1. 仲裁工作流测试 (`arbitration/`)
- **文件**: `arbitration-workflow.e2e.spec.ts`
- **覆盖范围**: AI治理中心的仲裁流程
- **测试场景**:
  - 完整仲裁工作流
  - 表单验证
  - 网络错误处理
  - 空案件列表
  - 案件列表刷新

### 2. 异常事件归因流程测试 (`attribution/`)
- **文件**: `attribution-workflow.e2e.spec.ts`
- **覆盖范围**: 异常事件的归因流程
- **测试场景**:
  - 完整归因分析流程
  - 分析失败处理
  - 重新分析功能
  - 报告导出
  - 事件过滤和搜索

## 技术栈

- **测试框架**: Playwright
- **浏览器支持**: Chromium, Firefox, WebKit
- **移动端测试**: Mobile Chrome, Mobile Safari
- **报告格式**: HTML, JSON, JUnit

## 环境要求

### 前置条件
1. **前端服务**: 运行在 `http://localhost:3000`
2. **后端API服务**: 运行在 `http://localhost:3001`
3. **数据库**: PostgreSQL测试数据库
4. **Node.js**: 版本 18+

### 环境变量
```bash
E2E_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/quant_navigator_test
```

## 运行测试

### 1. 通过根目录脚本运行
```bash
# 运行所有E2E测试
./run-tests.sh e2e

# 运行特定测试
pnpm --filter papa-test-suite run test:e2e -- --grep "仲裁工作流"
```

### 2. 直接运行Playwright
```bash
cd tests
pnpm run test:e2e
```

### 3. 调试模式
```bash
# 可视化调试
pnpm run test:e2e:ui

# 调试模式
pnpm run test:e2e:debug

# 有头模式
pnpm run test:e2e:headed
```

## 测试数据管理

### 自动清理
- 每个测试前自动清理测试数据
- 测试后自动清理用户数据
- 全局清理和重置数据库状态

### 测试数据创建
- 通过API创建测试事件
- 通过API创建测试仲裁案件
- 自动创建测试用户

## 测试选择器策略

### 稳定选择器
所有测试使用 `data-testid` 属性选择器，避免脆弱的CSS选择器：

```typescript
// ✅ 推荐
await page.locator('[data-testid="submit-button"]').click();

// ❌ 避免
await page.locator('div:nth-child(3) button').click();
```

### 必需的前端测试ID
前端组件需要添加以下测试ID：

```typescript
// 仲裁仪表盘
[data-testid="arbitration-dashboard-title"]
[data-testid="pending-cases-section"]
[data-testid="case-card"]
[data-testid="case-stock-code"]
[data-testid="case-trade-date"]

// 仲裁表单
[data-testid="final-recommendation-看涨"]
[data-testid="confidence-level-input"]
[data-testid="reasoning-textarea"]
[data-testid="submit-arbitration-button"]

// 事件归因
[data-testid="attribution-dashboard-title"]
[data-testid="events-list"]
[data-testid="event-item"]
[data-testid="start-attribution-button"]
```

## 报告和调试

### 测试报告
- **HTML报告**: `test-results/index.html`
- **JSON报告**: `test-results/e2e-results.json`
- **JUnit报告**: `test-results/e2e-results.xml`

### 调试信息
- **截图**: 失败时自动截图
- **视频**: 失败时自动录制视频
- **跟踪**: 失败时自动生成跟踪文件

### 查看报告
```bash
# 打开HTML报告
open test-results/index.html

# 查看测试结果
cat test-results/e2e-results.json
```

## 故障排除

### 常见问题

1. **浏览器启动失败**
   ```bash
   pnpm run e2e:install-deps
   ```

2. **服务连接失败**
   - 检查前端服务是否运行在3000端口
   - 检查后端API服务是否运行在3001端口
   - 检查数据库连接是否正常

3. **测试超时**
   - 检查网络连接
   - 增加超时时间配置
   - 检查服务响应时间

### 调试技巧

1. **使用调试模式**
   ```bash
   pnpm run test:e2e:debug
   ```

2. **查看浏览器控制台**
   - 在测试中添加 `await page.pause()`
   - 使用 `page.screenshot()` 截图

3. **检查网络请求**
   - 使用 `page.route()` 拦截请求
   - 检查API响应状态

## 符合"测试宪法"要求

### 第3.3条合规性
- ✅ 覆盖核心用户工作流
- ✅ 禁止使用数据模拟(Mock)
- ✅ 使用稳定的测试选择器
- ✅ 运行在真实环境中

### 第9条合规性
- ✅ 环境一致性
- ✅ 依赖一致性
- ✅ 配置一致性

### 第10条合规性
- ✅ 通过根目录统一入口执行
- ✅ 禁止子目录单独执行
