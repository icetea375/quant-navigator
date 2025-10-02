# Quant Navigator Backend - Python 实现

## 目录结构

```
packages/backend-python/
├── config/                                    # 配置目录
│   ├── attribution_rules.json                # 归因规则配置，包含事件标签知识库
│   ├── default.json                          # 默认配置文件，包含应用、数据库、Redis、LLM等配置
│   ├── event_tags.json                       # 事件标签配置
│   ├── llm.service.json                      # LLM服务专用配置
│   ├── mda_verifier.service.json             # MDA验证服务配置
│   ├── scoring_rules.yml                     # 评分规则配置（PE、PB、PS等财务指标）
│   └── prompt_templates/                     # 提示词模板目录
│       ├── counterfactual_validation_prompts.json    # 反事实验证提示词
│       ├── event_chain_building_prompts.json         # 事件链构建提示词
│       ├── mda_verification_prompts.json             # MDA验证提示词
│       └── prediction_generation_prompts.json        # 预测生成提示词
├── data_contract/                            # 数据契约目录
│   └── qwen_api_schema.yaml                 # Qwen API数据契约定义
├── htmlcov/                                  # 测试覆盖率报告目录
│   ├── class_index.html                      # 类索引HTML报告
│   ├── function_index.html                   # 函数索引HTML报告
│   ├── index.html                            # 覆盖率主页
│   ├── status.json                           # 覆盖率状态JSON
│   └── *.html                                # 各模块覆盖率详细报告
├── scripts/                                  # 脚本目录
│   ├── check_entity_contracts.py            # 实体契约检查脚本
│   ├── generate_types.py                     # 自动生成前端TypeScript类型定义
│   ├── run_architecture_guard.sh            # 架构守护脚本
│   └── update_frontend_types.sh              # 更新前端类型脚本
├── src/                                      # 核心源码目录
│   ├── analysis/                             # 分析引擎目录
│   │   ├── engines/                          # 分析引擎子模块
│   │   │   ├── layer1_lightgbm.py           # 第一层LightGBM引擎
│   │   │   ├── layer2_finbert.py            # 第二层FinBERT引擎
│   │   │   ├── layer3_llama3.py             # 第三层LLaMA3引擎
│   │   │   ├── learning_loop_coordinator.py # 学习循环协调器
│   │   │   └── prediction_engine_main.py    # 预测引擎主程序
│   │   ├── report_comparator.py             # 报告比较器
│   │   └── signals/                          # 信号分析模块
│   ├── api/                                  # API层目录
│   │   ├── admin.py                          # 管理后台API路由
│   │   ├── ai_router.py                      # AI服务相关API路由
│   │   ├── calculation_router.py             # 计算服务API路由
│   │   ├── data_router.py                    # 数据服务API路由
│   │   ├── reports.py                        # 报告管理API路由
│   │   └── workflow.py                       # 工作流API路由
│   ├── core/                                 # 核心层目录
│   │   ├── config.py                         # 配置管理（已迁移到统一配置）
│   │   ├── contract_validator.py             # 数据契约验证器
│   │   ├── logging_config.py                 # 日志配置
│   │   └── interfaces/                       # 抽象接口定义
│   │       ├── data_source_interface.py     # 数据源接口
│   │       └── llm_provider_interface.py    # LLM提供商接口
│   ├── entities/                             # 实体层目录
│   │   ├── anomaly_event.py                 # 异常事件实体
│   │   ├── base.py                          # 基础实体类，提供通用数据库字段
│   │   ├── generated_report.py              # 生成报告实体
│   │   ├── processed_event.py               # 处理事件实体
│   │   └── quant_signal.py                  # 量化信号实体
│   ├── exceptions/                           # 异常处理目录
│   │   ├── quant_exceptions.py              # 量化相关异常
│   │   └── workflow_exceptions.py           # 工作流相关异常
│   ├── schemas/                              # 模式层目录
│   │   ├── arbitration.py                   # 仲裁案件相关的Pydantic模式
│   │   ├── reports.py                       # 报告相关的数据模式
│   │   └── scoring_rules_config.py          # 评分规则配置模式
│   ├── services/                             # 服务层目录
│   │   ├── data_sources/                     # 数据源子模块
│   │   │   └── tushare_fetcher.py           # Tushare数据获取器
│   │   ├── llm_providers/                    # LLM提供商子模块
│   │   │   └── qwen_provider.py             # Qwen提供商实现
│   │   ├── arbitration_service.py           # 仲裁服务
│   │   ├── data_pipeline_service.py         # 数据管道服务，负责Tushare数据获取和处理
│   │   ├── llm_service.py                   # LLM服务，统一管理AI分析
│   │   ├── mda_verifier_service.py          # MDA验证服务
│   │   ├── meta_cognition_engine.py         # 元认知引擎，用AI仲裁AI
│   │   ├── quant_signal_service.py          # 量化信号服务，计算各种Z分数和技术指标
│   │   ├── report_service.py                # 报告服务
│   │   └── simple_workflow_service.py       # 简化工作流服务
│   ├── main.py                              # FastAPI主应用，定义路由和中间件
│   └── main_workflow.py                     # 主工作流脚本，实现双脑并行分析+元认知仲裁
├── support_modules/                          # 支持模块目录
│   ├── causal_validator.py                  # 因果验证器
│   ├── data_pipeline.py                     # 数据管道模块
│   ├── database_utils.py                    # 数据库工具
│   ├── event_chain_builder.py               # 事件链构建器
│   ├── llm_service.py                       # LLM服务
│   ├── mda_verifier.py                      # MDA验证器
│   ├── prediction_generator.py              # 预测生成器
│   ├── quant_signal_engine.py               # 量化信号引擎
│   └── utils.py                             # 通用工具
├── tests/                                    # 测试目录
│   ├── architecture/                         # 架构测试
│   │   └── test_dependencies.py             # 依赖关系测试
│   ├── contracts/                            # 契约测试
│   │   ├── test_qwen_provider_contract.py   # Qwen提供商契约测试
│   │   ├── test_suite_generator.py          # 测试套件生成器
│   │   └── test_tushare_fetcher_contract.py # Tushare获取器契约测试
│   ├── e2e/                                  # 端到端测试
│   │   └── test_real_world_e2e.py           # 真实世界端到端测试
│   ├── integration/                          # 集成测试
│   │   ├── test_data_pipeline_end_to_end.py # 数据管道端到端测试
│   │   ├── test_data_pipeline_integration.py # 数据管道集成测试
│   │   ├── test_data_pipeline_real_database_integration.py # 真实数据库集成测试
│   │   ├── test_data_pipeline_storage_integration.py # 存储集成测试
│   │   ├── test_datapipeline_io.py          # 数据管道IO测试
│   │   ├── test_llm_gateway_io.py           # LLM网关IO测试
│   │   └── test_meta_cognition_integration.py # 元认知集成测试
│   ├── unit/                                 # 单元测试
│   │   ├── entities/                         # 实体测试
│   │   │   ├── test_anomaly_event_entity.py # 异常事件实体测试
│   │   │   └── test_base_entity.py          # 基础实体测试
│   │   ├── services/                         # 服务测试
│   │   │   ├── test_data_pipeline_service_unit.py # 数据管道服务单元测试
│   │   │   ├── test_llm_service_unit.py     # LLM服务单元测试
│   │   │   ├── test_meta_cognition_engine_unit.py # 元认知引擎单元测试
│   │   │   ├── test_quant_signal_service_unit.py # 量化信号服务单元测试
│   │   │   └── test_tushare_fetcher.py      # Tushare获取器测试
│   │   ├── test_config_integrity.py         # 配置完整性测试
│   │   ├── test_concurrency_control.py      # 并发控制测试
│   │   ├── test_detect_anomalies.py         # 异常检测测试
│   │   ├── test_exceptions.py               # 异常处理测试
│   │   ├── test_health_check.py             # 健康检查测试
│   │   └── test_main_workflow_tdd.py        # 主工作流TDD测试
│   └── test_config_integrity.py             # 配置完整性测试
├── tests_legacy/                             # 遗留测试目录
│   ├── api/                                  # 遗留API测试
│   ├── cli/                                  # 遗留CLI测试
│   ├── core/                                 # 遗留核心测试
│   ├── e2e/                                  # 遗留端到端测试
│   ├── integration/                          # 遗留集成测试
│   ├── services/                             # 遗留服务测试
│   └── unit/                                 # 遗留单元测试
├── doubao_analyzer.py                        # 豆包舆情感知分析器（v10.5双脑分治架构）
├── fix_anomaly_tests.py                      # 异常测试修复脚本
├── main.py                                   # CLI命令行入口，使用Typer创建专业命令行应用
├── main_workflow_legacy.py                   # 遗留的主工作流文件
├── pyproject.toml                            # Poetry项目配置，定义依赖、脚本和测试配置
├── qwen_analyzer.py                          # Qwen事实归因分析器（v10.5双脑分治架构）
├── ruff.toml                                 # 代码质量检查配置，遵循极简主义原则
└── coverage.json                             # 测试覆盖率报告数据
```

## 文件作用说明

### 根目录文件
- **main.py**: CLI命令行入口，提供工作流运行、历史回填、服务器启动等功能
- **qwen_analyzer.py**: Qwen事实归因分析器，专门负责基于内部结构化数据的事实归因分析
- **doubao_analyzer.py**: 豆包舆情感知分析器，专门负责基于外部实时网络信息的舆情感知分析
- **pyproject.toml**: Poetry项目配置文件，定义项目依赖、脚本命令和测试配置
- **ruff.toml**: 代码质量检查配置，遵循极简主义原则，统一代码风格
- **coverage.json**: 测试覆盖率数据文件
- **fix_anomaly_tests.py**: 异常测试修复脚本

### 配置目录 (config/)
- **default.json**: 默认配置文件，包含应用、数据库、Redis、LLM、分析引擎等完整配置
- **llm.service.json**: LLM服务专用配置，定义多个Qwen模型提供商
- **mda_verifier.service.json**: MDA验证服务配置
- **scoring_rules.yml**: 评分规则配置，定义PE、PB、PS等财务指标的评分标准
- **attribution_rules.json**: 归因规则配置，包含事件标签知识库，支持非开发人员维护
- **event_tags.json**: 事件标签配置文件
- **prompt_templates/**: 提示词模板目录，包含各种AI分析任务的提示词模板

### 源码目录 (src/)
- **main.py**: FastAPI主应用，定义API路由、中间件和生命周期管理
- **main_workflow.py**: 主工作流脚本，实现双脑并行分析+元认知仲裁架构

#### API层 (src/api/)
- **admin.py**: 管理后台API路由
- **ai_router.py**: AI服务相关API路由
- **calculation_router.py**: 计算服务API路由
- **data_router.py**: 数据服务API路由
- **reports.py**: 报告管理API路由
- **workflow.py**: 工作流API路由

#### 分析引擎 (src/analysis/)
- **engines/**: 三层分析引擎架构
  - **layer1_lightgbm.py**: 第一层LightGBM机器学习引擎
  - **layer2_finbert.py**: 第二层FinBERT金融文本分析引擎
  - **layer3_llama3.py**: 第三层LLaMA3大语言模型引擎
  - **learning_loop_coordinator.py**: 学习循环协调器
  - **prediction_engine_main.py**: 预测引擎主程序
- **report_comparator.py**: 报告比较器
- **signals/**: 信号分析模块

#### 核心层 (src/core/)
- **config.py**: 配置管理模块（已迁移到统一配置）
- **contract_validator.py**: 数据契约验证器
- **logging_config.py**: 日志配置模块
- **interfaces/**: 抽象接口定义
  - **data_source_interface.py**: 数据源接口抽象
  - **llm_provider_interface.py**: LLM提供商接口抽象

#### 实体层 (src/entities/)
- **base.py**: 基础实体类，提供通用数据库字段和转换方法
- **anomaly_event.py**: 异常事件实体，存储异常检测结果
- **generated_report.py**: 生成报告实体，存储AI分析报告
- **processed_event.py**: 处理事件实体，存储事件处理结果
- **quant_signal.py**: 量化信号实体，存储量化分析信号

#### 服务层 (src/services/)
- **data_pipeline_service.py**: 数据管道服务，负责Tushare数据获取和财务因子提取
- **quant_signal_service.py**: 量化信号服务，计算各种Z分数、技术指标和异常检测
- **llm_service.py**: LLM服务，统一管理AI分析调用
- **meta_cognition_engine.py**: 元认知引擎，用AI仲裁AI的分析结果
- **arbitration_service.py**: 仲裁服务
- **mda_verifier_service.py**: MDA验证服务
- **report_service.py**: 报告服务
- **simple_workflow_service.py**: 简化工作流服务
- **data_sources/**: 数据源子模块
  - **tushare_fetcher.py**: Tushare数据获取器实现
- **llm_providers/**: LLM提供商子模块
  - **qwen_provider.py**: Qwen提供商实现

#### 模式层 (src/schemas/)
- **arbitration.py**: 仲裁案件相关的Pydantic数据模式
- **reports.py**: 报告相关的数据模式
- **scoring_rules_config.py**: 评分规则配置模式

#### 异常处理 (src/exceptions/)
- **quant_exceptions.py**: 量化相关异常定义
- **workflow_exceptions.py**: 工作流相关异常定义

### 支持模块 (support_modules/)
- **data_pipeline.py**: 数据管道模块，负责数据获取和预处理
- **database_utils.py**: 数据库工具模块
- **llm_service.py**: LLM服务支持模块
- **quant_signal_engine.py**: 量化信号引擎
- **causal_validator.py**: 因果验证器
- **event_chain_builder.py**: 事件链构建器
- **mda_verifier.py**: MDA验证器
- **prediction_generator.py**: 预测生成器
- **utils.py**: 通用工具模块

### 测试目录 (tests/)
- **architecture/**: 架构测试，验证系统架构和依赖关系
- **contracts/**: 契约测试，验证接口契约和数据格式
- **e2e/**: 端到端测试，验证完整业务流程
- **integration/**: 集成测试，验证模块间集成
- **unit/**: 单元测试，验证单个模块功能
  - **entities/**: 实体类单元测试
  - **services/**: 服务类单元测试

### 脚本目录 (scripts/)
- **check_entity_contracts.py**: 实体契约检查脚本
- **generate_types.py**: 自动生成前端TypeScript类型定义
- **run_architecture_guard.sh**: 架构守护脚本
- **update_frontend_types.sh**: 更新前端类型脚本

### 其他目录
- **data_contract/**: 数据契约定义目录
- **htmlcov/**: 测试覆盖率HTML报告目录
- **tests_legacy/**: 遗留测试目录，包含旧版本的测试文件
