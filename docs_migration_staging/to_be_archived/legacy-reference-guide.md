# Legacy Code Reference Guide

## 概述

本文档说明如何将已归档的NestJS代码作为参考资料，在Python全栈重构过程中进行战略性借鉴。

## 归档信息

- **Legacy分支**: `legacy/pre-python-fullstack`
- **里程碑标签**: `v13.0-nestjs-legacy`
- **归档时间**: 2024年12月
- **归档原因**: 完整迁移到Python全栈架构

## 如何访问Legacy代码

### 1. 查看Legacy分支
```bash
git checkout legacy/pre-python-fullstack
```

### 2. 查看特定文件
```bash
# 查看旧的仲裁服务
git show legacy/pre-python-fullstack:backend/src/services/ArbitrationService.ts

# 查看旧的实体定义
git show legacy/pre-python-fullstack:backend/src/entities/ArbitrationCase.entity.ts

# 查看旧的控制器
git show legacy/pre-python-fullstack:backend/src/controllers/ArbitrationController.ts
```

### 3. 比较新旧实现
```bash
# 比较仲裁服务的实现
git diff legacy/pre-python-fullstack:backend/src/services/ArbitrationService.ts packages/backend-python/src/services/arbitration_service.py
```

## 参考策略

### 业务逻辑参考
在重构过程中，参考legacy代码中的：
- **方法签名**: 保持API接口的一致性
- **业务规则**: 确保业务逻辑的完整性
- **数据模型**: 参考实体关系设计
- **错误处理**: 学习异常处理模式

### 示例：仲裁服务重构参考

**Legacy TypeScript代码** (`legacy/pre-python-fullstack:backend/src/services/ArbitrationService.ts`):
```typescript
@Injectable()
export class ArbitrationService {
  async createArbitrationCase(data: CreateArbitrationCaseDto): Promise<ArbitrationCase> {
    // 业务逻辑实现
  }

  async processArbitrationCase(caseId: string): Promise<ProcessResult> {
    // 处理逻辑
  }
}
```

**Python重构实现** (`packages/backend-python/src/services/arbitration_service.py`):
```python
class ArbitrationService:
    async def create_arbitration_case(self, data: CreateArbitrationCaseSchema) -> ArbitrationCase:
        # 参考TS代码的业务逻辑，用Pythonic方式重新实现
        pass

    async def process_arbitration_case(self, case_id: str) -> ProcessResult:
        # 参考TS代码的处理逻辑
        pass
```

## 重构原则

### 1. 不是翻译，是重新实现
- 不要逐行翻译TypeScript代码
- 理解业务逻辑后，用Python的最佳实践重新实现
- 利用Python的特性（如类型提示、异步语法等）优化代码

### 2. 保持接口一致性
- API端点路径保持一致
- 请求/响应数据结构保持一致
- 错误码和消息格式保持一致

### 3. 改进架构设计
- 利用Python的模块化特性
- 使用更现代的Python框架特性
- 优化数据库查询和缓存策略

## 参考文件映射

| Legacy文件 | Python重构文件 | 说明 |
|-----------|---------------|------|
| `backend/src/services/ArbitrationService.ts` | `packages/backend-python/src/services/arbitration_service.py` | 仲裁服务核心逻辑 |
| `backend/src/entities/ArbitrationCase.entity.ts` | `packages/backend-python/src/schemas/arbitration.py` | 数据模型定义 |
| `backend/src/controllers/ArbitrationController.ts` | `packages/backend-python/src/api/arbitration.py` | API控制器 |
| `backend/src/config/` | `packages/backend-python/src/core/config.py` | 配置管理 |
| `backend/src/database/` | `packages/backend-python/src/database/` | 数据库连接 |

## 注意事项

1. **不要直接复制代码**: Legacy代码仅作为业务逻辑参考
2. **保持代码质量**: 新实现应该符合Python最佳实践
3. **测试覆盖**: 确保新实现有完整的测试覆盖
4. **文档更新**: 及时更新API文档和架构文档

## 清理完成状态

✅ **已完成**:
- 所有NestJS代码已归档到 `legacy/pre-python-fullstack` 分支
- 主分支已完全清理，只保留Python全栈代码
- 配置文件已更新，移除所有Node.js后端依赖
- CI/CD管道已更新为Python后端

✅ **可安全删除**:
- `_archive_backend_nestjs/` 目录（已归档到legacy分支）
- `_archive_aigc_backend_nestjs/` 目录（已归档到legacy分支）

## 下一步行动

1. 创建Pull Request合并清理更改
2. 在Python重构过程中参考legacy代码
3. 完成重构后，可以考虑删除本地archive目录
4. 定期检查legacy分支，确保其作为历史参考的价值
