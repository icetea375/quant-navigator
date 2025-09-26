# 智能分析系统 v13.0 TDD最终版

## 项目概述

这是一个**测试驱动开发(TDD)**为核心的智能分析系统，遵循严格的"红-绿-重构"开发流程，确保系统的可靠性由测试而非"希望"来保证。

## TDD宪法

本项目严格遵循《开发文档第0章-开发流程准则》中的TDD铁律：

- **核心原则**: **先写测试，再写代码**
- **开发流程**: 所有新功能或Bug修复，都必须严格遵循**"红-绿-重构 (Red-Green-Refactor)"**的循环
- **验收标准**: **任何没有对应测试用例的生产代码提交，都将被视为不合格**

## 项目结构

```
papa/
├── docs/                          # 开发文档
│   ├── 开发文档第0章-开发流程准则.md    # TDD宪法
│   ├── 开发文档第1章-系统概述.md
│   ├── 开发文档第2章-核心功能模块-上.md
│   ├── 开发文档第4章-技术架构.md
│   ├── 开发文档第5章-部署运维.md
│   └── 开发文档第6章-开发实施计划.md
├── tests/                         # 测试目录
│   ├── unit/                      # 单元测试
│   ├── integration/               # 集成测试
│   ├── e2e/                       # 端到端测试
│   └── config/                    # 测试配置
├── src/                           # 源代码目录
├── config/                        # 配置文件
├── requirements.txt               # Python依赖
├── package.json                   # Node.js依赖
├── pytest.ini                    # pytest配置
├── jest.config.js                 # Jest配置
└── README.md                      # 项目说明
```

## 开发环境设置

### 1. 克隆项目
```bash
git clone <repository-url>
cd papa
```

### 2. 设置Python环境
```bash
# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # macOS/Linux
# 或
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt
```

### 3. 设置Node.js环境
```bash
# 安装依赖
npm install
```

### 4. 运行测试
```bash
# Python测试
./venv/bin/python -m pytest tests/unit/test_tdd_infrastructure.py -v

# Node.js测试
npm test
```

## TDD开发流程

### 1. 红灯阶段 (Red)
- 编写一个**会失败**的测试用例
- 测试用例定义新功能的接口、输入和期望输出
- 运行测试，确认测试失败

### 2. 绿灯阶段 (Green)
- 编写**最少量**的生产代码，让测试通过
- 只写能让测试通过的最简代码
- 运行测试，确认测试通过

### 3. 重构阶段 (Refactor)
- 在测试保持通过的前提下，优化代码
- 改进代码质量，但功能行为不变
- 运行测试，确认所有测试继续通过

## 测试分层

### 单元测试 (Unit Tests)
- **覆盖率要求**: 90% 以上
- **执行时间**: < 1秒
- **工具**: pytest (Python), Jest (TypeScript)

### 集成测试 (Integration Tests)
- **覆盖率要求**: 80% 以上关键路径
- **执行时间**: < 10秒
- **工具**: pytest + TestClient, Jest + Supertest

### 端到端测试 (E2E Tests)
- **覆盖率要求**: 100% 核心用户场景
- **执行时间**: < 30秒
- **工具**: Playwright (Web)

## 代码质量

### 类型安全
- **Python**: 使用mypy进行类型检查
- **TypeScript**: 启用严格模式，严禁`as any`, `@ts-ignore`

### 代码风格
- **Python**: 使用black和isort
- **TypeScript**: 使用Prettier和ESLint

### 覆盖率检查
- 所有代码必须达到最低覆盖率要求
- CI/CD流水线强制执行覆盖率检查

## 开发指南

### 1. 开始新功能开发
```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 编写测试用例（红灯）
# 在tests/目录下创建对应的测试文件

# 3. 运行测试，确认失败
./venv/bin/python -m pytest tests/unit/test_new_feature.py -v

# 4. 实现功能代码（绿灯）
# 在src/目录下实现功能

# 5. 运行测试，确认通过
./venv/bin/python -m pytest tests/unit/test_new_feature.py -v

# 6. 重构代码（重构）
# 优化代码质量和性能

# 7. 运行所有测试
./venv/bin/python -m pytest tests/ -v
```

### 2. 提交代码
```bash
# 1. 运行所有测试
./venv/bin/python -m pytest tests/ -v
npm test

# 2. 检查代码质量
./venv/bin/python -m mypy src/
npm run lint

# 3. 提交代码
git add .
git commit -m "feat: add new feature with TDD approach"
git push origin feature/new-feature
```

## 项目目标

通过严格的TDD流程，构建一个**"能稳定赚钱的工具"**：

1. **系统可靠性**: 由测试而非"希望"来保证
2. **代码质量**: 通过测试驱动的高质量代码
3. **可维护性**: 清晰的测试用例作为活文档
4. **可扩展性**: 通过测试确保新功能不破坏现有功能

## 贡献指南

1. 严格遵循TDD开发流程
2. 所有代码必须有对应的测试用例
3. 测试覆盖率必须达到要求
4. 代码必须通过所有质量检查
5. 提交前必须运行完整的测试套件

## 许可证

MIT License

---

**版本**: v13.0 (TDD最终版)
**最后更新**: 2025-01-17
**维护者**: AI Assistant
**核心价值**: 通过严格的TDD流程，确保代码质量和系统可靠性，为构建"能稳定赚钱的工具"奠定坚实基础。
