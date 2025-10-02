# FastAPI 测试工具

本目录包含为 FastAPI + Python 后端设计的专用测试工具和辅助函数。

## 文件说明

### TypeScript 版本
- `fastapi-test-utils.ts` - TypeScript 版本的 FastAPI 测试工具
- 适用于前端测试和 E2E 测试

### Python 版本
- `fastapi_test_utils.py` - Python 版本的 FastAPI 测试工具
- 适用于后端单元测试和集成测试

## 主要功能

### 1. 服务管理
- 等待 FastAPI 服务启动
- 检查服务健康状态
- 创建测试客户端

### 2. 测试数据创建
- 用户数据 (`user`)
- 股票数据 (`stock`)
- 报告数据 (`report`)
- 仲裁案件数据 (`arbitration_case`)
- 认证数据 (`auth`)

### 3. 测试操作
- 创建测试用户
- 用户登录
- 创建测试案件
- 获取案件列表
- 清理测试数据

### 4. 工具函数
- 生成随机测试ID
- 验证响应格式
- 异步等待
- 配置管理

## 使用方法

### TypeScript 使用示例

```typescript
import { fastapiTestUtils, createTestData, waitForFastAPIService } from './fastapi-test-utils';

// 等待服务启动
await waitForFastAPIService(30000);

// 创建测试数据
const userData = createTestData('user', { username: 'testuser' });

// 创建测试用户
const user = await fastapiTestUtils.createTestUser(userData);

// 创建测试案件
const caseData = createTestData('arbitration_case', { case_id: 'TEST_001' });
const case = await fastapiTestUtils.createTestCase(caseData);
```

### Python 使用示例

```python
from fastapi_test_utils import fastapi_test_utils, create_test_data, wait_for_fastapi_service

# 等待服务启动
await wait_for_fastapi_service(30)

# 创建测试数据
user_data = create_test_data('user', {'username': 'testuser'})

# 创建测试用户
user = fastapi_test_utils.create_test_user(user_data)

# 创建测试案件
case_data = create_test_data('arbitration_case', {'case_id': 'TEST_001'})
case = fastapi_test_utils.create_test_case(case_data)
```

## 配置

测试工具支持以下环境变量：

- `API_BASE_URL` - API 基础URL (默认: http://localhost:8000)
- `FASTAPI_HOST` - FastAPI 主机 (默认: localhost)
- `FASTAPI_PORT` - FastAPI 端口 (默认: 8000)

## 注意事项

1. 确保 FastAPI 服务在测试前已启动
2. 测试数据会在测试完成后自动清理
3. 支持并发测试，每个测试实例使用独立的测试数据
4. 所有 API 调用都包含错误处理和重试机制

## 与原有测试工具的兼容性

这些工具完全替代了原有的 NestJS 测试工具，提供相同的功能但针对 FastAPI 后端进行了优化：

- 移除了 NestJS 相关的依赖
- 添加了 FastAPI 特定的配置和端点
- 保持了相同的 API 接口，确保现有测试代码的兼容性
