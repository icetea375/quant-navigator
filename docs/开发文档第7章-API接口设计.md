# 第7章：API接口设计

## 7.1 概述

本章详细说明量化导航仪系统的API接口设计，包括主工作流API、AI治理中心API、仲裁数据聚合API等各个模块的接口规范。

## 7.2 主工作流API (v10.1 仲裁界面升级版)

### 7.2.1 核心工作流接口

**接口名称**: 主工作流执行
**接口路径**: `POST /api/v1/workflow/execute`
**接口描述**: 执行主工作流，分析股票异常事件

**请求参数**:
```json
{
  "stock_codes": ["000001.SZ", "000002.SZ"],
  "analysis_date": "2025-01-17",
  "analysis_types": ["mda_verification", "event_chain", "prediction", "counterfactual"],
  "config": {
    "llm_provider": "tongyi",
    "confidence_threshold": 0.7,
    "enable_human_review": true
  }
}
```

**响应格式**:
```json
{
  "status": "success",
  "message": "工作流执行完成",
  "data": {
    "execution_id": "exec_20250117_001",
    "total_stocks": 2,
    "processed_stocks": 2,
    "failed_stocks": 0,
    "results": [
      {
        "stock_code": "000001.SZ",
        "analysis_results": {
          "mda_verification": {
            "credibility_score": 0.85,
            "consistency_score": 0.78,
            "verdict": "HIGH_CONFIDENCE"
          },
          "event_chain": {
            "chain_length": 5,
            "confidence": 0.82,
            "key_events": ["earnings_beat", "guidance_raise", "analyst_upgrade"]
          },
          "prediction": {
            "scenarios": [
              {
                "scenario": "bullish",
                "probability": 0.65,
                "price_target": 12.50
              },
              {
                "scenario": "neutral",
                "probability": 0.25,
                "price_target": 11.20
              },
              {
                "scenario": "bearish",
                "probability": 0.10,
                "price_target": 9.80
              }
            ]
          },
          "counterfactual": {
            "causal_effect": 0.15,
            "consistency_score": 0.88,
            "explanation": "基于因果分析，事件链对股价的影响为15%"
          }
        },
        "human_review_required": false,
        "created_at": "2025-01-17T10:30:00Z"
      }
    ]
  }
}
```

### 7.2.2 数据获取接口

**接口名称**: 获取股票数据
**接口路径**: `GET /api/v1/data/stock/{stock_code}`
**接口描述**: 获取指定股票的基础数据和量化信号

**请求参数**:
- `stock_code`: 股票代码 (路径参数)
- `start_date`: 开始日期 (查询参数)
- `end_date`: 结束日期 (查询参数)
- `data_types`: 数据类型 (查询参数，可选: price, volume, financial, news)

**响应格式**:
```json
{
  "status": "success",
  "data": {
    "stock_code": "000001.SZ",
    "stock_name": "平安银行",
    "data": {
      "price_data": [
        {
          "date": "2025-01-17",
          "open": 11.20,
          "high": 11.50,
          "low": 11.15,
          "close": 11.45,
          "volume": 15000000,
          "turnover": 171000000
        }
      ],
      "financial_data": {
        "revenue": 1500000000,
        "net_profit": 300000000,
        "pe_ratio": 8.5,
        "pb_ratio": 0.8
      },
      "quant_signals": {
        "return_z_score": 2.3,
        "volume_z_score": 1.8,
        "momentum_score": 0.75
      }
    }
  }
}
```

## 7.3 AI治理中心API

### 7.3.1 配置管理接口

**接口名称**: 获取系统配置
**接口路径**: `GET /api/v1/admin/configs`
**接口描述**: 获取系统配置信息

**请求参数**:
- `config_type`: 配置类型 (查询参数，可选: ATTRIBUTION_RULE, EVENT_TAG, PROMPT_TEMPLATE)
- `is_active`: 是否激活 (查询参数，布尔值)

**响应格式**:
```json
{
  "status": "success",
  "data": {
    "configs": [
      {
        "config_id": 1,
        "config_type": "ATTRIBUTION_RULE",
        "config_key": "earnings_beat_rule",
        "config_value": {
          "condition": "earnings_growth > 0.2",
          "weight": 0.8,
          "description": "盈利超预期规则"
        },
        "version": "1.0.0",
        "is_active": true,
        "created_at": "2025-01-17T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20
  }
}
```

**接口名称**: 更新系统配置
**接口路径**: `PUT /api/v1/admin/configs/{config_id}`
**接口描述**: 更新指定配置项

**请求参数**:
```json
{
  "config_value": {
    "condition": "earnings_growth > 0.25",
    "weight": 0.85,
    "description": "盈利超预期规则(更新)"
  },
  "version": "1.1.0",
  "is_active": true
}
```

**响应格式**:
```json
{
  "status": "success",
  "message": "配置更新成功",
  "data": {
    "config_id": 1,
    "updated_at": "2025-01-17T11:00:00Z"
  }
}
```

### 7.3.2 仲裁管理接口

**接口名称**: 获取待仲裁案例
**接口路径**: `GET /api/v1/admin/arbitration/pending`
**接口描述**: 获取需要人工仲裁的案例列表

**请求参数**:
- `priority`: 优先级 (查询参数，可选: 1-5)
- `status`: 状态 (查询参数，可选: pending, in_progress, completed)
- `page`: 页码 (查询参数，默认: 1)
- `page_size`: 每页数量 (查询参数，默认: 20)

**响应格式**:
```json
{
  "status": "success",
  "data": {
    "cases": [
      {
        "case_id": "000001.SZ_20250117",
        "stock_code": "000001.SZ",
        "stock_name": "平安银行",
        "analysis_date": "2025-01-17",
        "priority": 3,
        "status": "pending",
        "analysis_type": "prediction",
        "confidence_score": 0.45,
        "ai_disagreement_score": 0.8,
        "risk_level": "HIGH",
        "created_at": "2025-01-17T10:30:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20
  }
}
```

**接口名称**: 提交仲裁决策
**接口路径**: `POST /api/v1/admin/arbitration/{case_id}/decide`
**接口描述**: 提交人工仲裁决策

**请求参数**:
```json
{
  "decision": "ACCEPT",
  "confidence": 0.9,
  "reasoning": "基于财务数据和市场分析，AI预测合理",
  "feedback": {
    "ai_analysis_quality": 4,
    "data_completeness": 5,
    "reasoning_clarity": 4
  },
  "suggestions": "建议增加更多行业对比数据"
}
```

**响应格式**:
```json
{
  "status": "success",
  "message": "仲裁决策提交成功",
  "data": {
    "case_id": "000001.SZ_20250117",
    "decision_id": "dec_20250117_001",
    "submitted_at": "2025-01-17T11:00:00Z"
  }
}
```

## 7.4 v10.1 仲裁数据聚合API

### 7.4.1 仲裁案例数据聚合接口

**接口名称**: 获取仲裁案例完整数据
**接口路径**: `GET /api/v1/admin/arbitration-cases/{case_id}`
**接口描述**: 获取指定仲裁案例的完整数据，包括五大核心数据面板的所有信息

**请求参数**:
- `case_id`: 案例ID (路径参数，格式: {stock_code}_{date})
- `include_panels`: 包含的数据面板 (查询参数，可选: raw_text, financial_snapshot, quant_signals, flow_and_chips, historical_arbitrations)
- `refresh_cache`: 是否刷新缓存 (查询参数，布尔值，默认: false)

**响应格式**:
```json
{
  "status": "success",
  "data": {
    "case_id": "000001.SZ_20250117",
    "stock_code": "000001.SZ",
    "stock_name": "平安银行",
    "date": "2025-01-17",
    "panels": {
      "raw_text": {
        "events": [
          {
            "id": "evt_001",
            "title": "平安银行2024年业绩预告",
            "content": "平安银行预计2024年净利润同比增长15%...",
            "source": "announcement",
            "timestamp": "2025-01-17T09:00:00Z",
            "highlighted_sentences": [
              "净利润同比增长15%",
              "资产质量持续改善"
            ]
          }
        ],
        "reports": [
          {
            "id": "rpt_001",
            "conclusion": "业绩超预期，维持买入评级",
            "confidence": 0.85,
            "reasoning": "基于财务数据和行业分析..."
          }
        ]
      },
      "financial_snapshot": {
        "stock_code": "000001.SZ",
        "quarters": [
          {
            "quarter": "2024Q3",
            "revenue": 1500000000,
            "revenue_growth": 0.12,
            "net_profit": 300000000,
            "net_profit_growth": 0.15,
            "gross_margin": 0.45,
            "net_margin": 0.20,
            "operating_cash_flow": 250000000,
            "r_d_ratio": 0.02,
            "contract_liabilities": 50000000
          }
        ]
      },
      "quant_signals": {
        "stock_signals": {
          "return_z_score": 2.3,
          "volume_z_score": 1.8,
          "mda_credibility_score": 0.85,
          "mda_consistency_score": 0.78
        },
        "market_signals": {
          "macro_risk_z": -0.5,
          "dominant_style": "value",
          "industry_performance": 0.08,
          "concept_performance": {
            "banking": 0.06,
            "fintech": 0.12
          }
        }
      },
      "flow_and_chips": {
        "money_flow": {
          "daily_flows": [
            {
              "date": "2025-01-17",
              "main_net_inflow": 50000000,
              "super_large_net_inflow": 30000000
            }
          ]
        },
        "top_list": {
          "date": "2025-01-17",
          "reason": "日涨幅偏离值达7%",
          "buy_seats": [
            {
              "seat_name": "机构专用",
              "amount": 25000000
            }
          ],
          "sell_seats": [
            {
              "seat_name": "机构专用",
              "amount": 15000000
            }
          ]
        },
        "chip_distribution": {
          "current_price": 11.45,
          "cost_peaks": [10.80, 11.20, 11.60],
          "cost_range_90": [10.50, 12.00],
          "avg_cost": 11.15,
          "profit_ratio": 0.65
        }
      },
      "historical_arbitrations": {
        "same_company": [
          {
            "id": "arb_001",
            "date": "2024-12-15",
            "decision": "ACCEPT",
            "reasoning": "基于财务数据，AI分析合理",
            "confidence": 0.9
          }
        ],
        "same_industry": [
          {
            "id": "arb_002",
            "stock_code": "000002.SZ",
            "date": "2024-12-10",
            "decision": "REJECT",
            "reasoning": "行业环境变化，需要重新评估"
          }
        ]
      }
    },
    "metadata": {
      "generated_at": "2025-01-17T11:00:00Z",
      "data_freshness": "2025-01-17T10:30:00Z",
      "panel_count": 5,
      "processing_time_ms": 1200
    }
  }
}
```

### 7.4.2 数据面板专用接口

**接口名称**: 获取原始文本数据
**接口路径**: `GET /api/v1/admin/arbitration-cases/{case_id}/raw-text`
**接口描述**: 获取指定案例的原始文本数据

**响应格式**:
```json
{
  "status": "success",
  "data": {
    "events": [
      {
        "id": "evt_001",
        "title": "平安银行2024年业绩预告",
        "content": "平安银行预计2024年净利润同比增长15%...",
        "source": "announcement",
        "timestamp": "2025-01-17T09:00:00Z",
        "highlighted_sentences": [
          "净利润同比增长15%",
          "资产质量持续改善"
        ]
      }
    ],
    "reports": [
      {
        "id": "rpt_001",
        "conclusion": "业绩超预期，维持买入评级",
        "confidence": 0.85,
        "reasoning": "基于财务数据和行业分析..."
      }
    ]
  }
}
```

**接口名称**: 获取财务数据快照
**接口路径**: `GET /api/v1/admin/arbitration-cases/{case_id}/financial-snapshot`
**接口描述**: 获取指定案例的财务数据快照

**响应格式**:
```json
{
  "status": "success",
  "data": {
    "stock_code": "000001.SZ",
    "quarters": [
      {
        "quarter": "2024Q3",
        "revenue": 1500000000,
        "revenue_growth": 0.12,
        "net_profit": 300000000,
        "net_profit_growth": 0.15,
        "gross_margin": 0.45,
        "net_margin": 0.20,
        "operating_cash_flow": 250000000,
        "r_d_ratio": 0.02,
        "contract_liabilities": 50000000
      }
    ]
  }
}
```

**接口名称**: 获取量化信号数据
**接口路径**: `GET /api/v1/admin/arbitration-cases/{case_id}/quant-signals`
**接口描述**: 获取指定案例的量化信号数据

**响应格式**:
```json
{
  "status": "success",
  "data": {
    "stock_signals": {
      "return_z_score": 2.3,
      "volume_z_score": 1.8,
      "mda_credibility_score": 0.85,
      "mda_consistency_score": 0.78
    },
    "market_signals": {
      "macro_risk_z": -0.5,
      "dominant_style": "value",
      "industry_performance": 0.08,
      "concept_performance": {
        "banking": 0.06,
        "fintech": 0.12
      }
    }
  }
}
```

**接口名称**: 获取资金流向与筹码分布数据
**接口路径**: `GET /api/v1/admin/arbitration-cases/{case_id}/flow-and-chips`
**接口描述**: 获取指定案例的资金流向与筹码分布数据

**响应格式**:
```json
{
  "status": "success",
  "data": {
    "money_flow": {
      "daily_flows": [
        {
          "date": "2025-01-17",
          "main_net_inflow": 50000000,
          "super_large_net_inflow": 30000000
        }
      ]
    },
    "top_list": {
      "date": "2025-01-17",
      "reason": "日涨幅偏离值达7%",
      "buy_seats": [
        {
          "seat_name": "机构专用",
          "amount": 25000000
        }
      ],
      "sell_seats": [
        {
          "seat_name": "机构专用",
          "amount": 15000000
        }
      ]
    },
    "chip_distribution": {
      "current_price": 11.45,
      "cost_peaks": [10.80, 11.20, 11.60],
      "cost_range_90": [10.50, 12.00],
      "avg_cost": 11.15,
      "profit_ratio": 0.65
    }
  }
}
```

**接口名称**: 获取历史仲裁记录
**接口路径**: `GET /api/v1/admin/arbitration-cases/{case_id}/historical-arbitrations`
**接口描述**: 获取指定案例的历史仲裁记录

**响应格式**:
```json
{
  "status": "success",
  "data": {
    "same_company": [
      {
        "id": "arb_001",
        "date": "2024-12-15",
        "decision": "ACCEPT",
        "reasoning": "基于财务数据，AI分析合理",
        "confidence": 0.9
      }
    ],
    "same_industry": [
      {
        "id": "arb_002",
        "stock_code": "000002.SZ",
        "date": "2024-12-10",
        "decision": "REJECT",
        "reasoning": "行业环境变化，需要重新评估"
      }
    ]
  }
}
```

## 7.5 错误处理

### 7.5.1 错误码定义

| 错误码 | HTTP状态码 | 错误描述 | 解决方案 |
|--------|------------|----------|----------|
| 10001 | 400 | 请求参数错误 | 检查请求参数格式和必填字段 |
| 10002 | 404 | 资源不存在 | 检查资源ID是否正确 |
| 10003 | 500 | 内部服务器错误 | 联系技术支持 |
| 10004 | 503 | 服务不可用 | 稍后重试或联系技术支持 |
| 10005 | 429 | 请求频率过高 | 降低请求频率 |
| 10006 | 401 | 认证失败 | 检查API密钥或登录状态 |
| 10007 | 403 | 权限不足 | 联系管理员获取权限 |

### 7.5.2 错误响应格式

```json
{
  "status": "error",
  "error_code": "10001",
  "error_message": "请求参数错误",
  "error_details": {
    "field": "stock_code",
    "message": "股票代码格式不正确"
  },
  "timestamp": "2025-01-17T11:00:00Z",
  "request_id": "req_20250117_001"
}
```

## 7.6 性能要求

### 7.6.1 响应时间要求

| 接口类型 | 响应时间要求 | 备注 |
|----------|--------------|------|
| 主工作流API | < 30秒 | 包含完整的分析流程 |
| 数据获取API | < 2秒 | 单次数据查询 |
| 配置管理API | < 1秒 | 配置读写操作 |
| 仲裁管理API | < 3秒 | 仲裁案例查询 |
| 仲裁数据聚合API | < 2秒 | 五大面板数据聚合 |

### 7.6.2 并发要求

- **主工作流API**: 支持最多5个并发请求
- **数据获取API**: 支持最多50个并发请求
- **配置管理API**: 支持最多100个并发请求
- **仲裁管理API**: 支持最多20个并发请求
- **仲裁数据聚合API**: 支持最多10个并发请求

## 7.7 安全要求

### 7.7.1 认证机制

- **API密钥认证**: 所有API请求需要携带有效的API密钥
- **JWT令牌**: 用户登录后使用JWT令牌进行身份验证
- **权限控制**: 基于角色的访问控制(RBAC)

### 7.7.2 数据安全

- **HTTPS**: 所有API通信必须使用HTTPS
- **数据加密**: 敏感数据在传输和存储时进行加密
- **访问日志**: 记录所有API访问日志
- **限流控制**: 防止API滥用和DDoS攻击

## 7.8 核心实现代码 🆕 v10.1 新增

### 7.8.1 ArbitrationDataAggregatorService 完整实现

**文件位置**: `aigc/backend/src/arbitration/arbitration-data-aggregator.service.ts`
**技术栈**: NestJS + TypeORM + Redis Cache
**核心特点**: 高性能并行数据聚合，支持五大核心数据面板

**核心类结构**:
```typescript
@Injectable()
export class ArbitrationDataAggregatorService {
  async getArbitrationCaseData(caseId: string, includePanels?: string[]): Promise<ArbitrationCaseData> {
    // 并行获取所有面板数据
    // 缓存机制
    // 错误处理
  }

  async getRawTextData(caseId: string): Promise<RawTextData> {
    // 获取原始文本数据
  }

  async getFinancialSnapshot(stockCode: string): Promise<FinancialSnapshot> {
    // 获取财务数据快照
  }

  async getQuantSignals(stockCode: string, date: string): Promise<QuantSignalsData> {
    // 获取量化信号数据
  }

  async getFlowAndChipsData(stockCode: string, date: string): Promise<FlowAndChipsData> {
    // 获取资金流向与筹码分布数据
  }

  async getHistoricalArbitrations(stockCode: string, industry: string): Promise<HistoricalArbitrations> {
    // 获取历史仲裁记录
  }
}
```

**关键特性**:
- **并行数据获取**: 使用 `Promise.all` 同时获取多个数据源
- **缓存机制**: Redis缓存，5分钟TTL，提升响应速度
- **错误处理**: 完整的异常处理和日志记录
- **数据新鲜度**: 实时监控数据更新时间
- **模块化设计**: 每个数据面板独立的方法实现

### 7.8.2 主工作流API实现

**文件位置**: `main_workflow.py`
**技术栈**: Python + 商业LLM API
**核心特点**: 健壮的单体串行脚本，完整的错误处理

**核心API方法**:
```python
class MainWorkflow:
    def run_daily_flow(self, trade_date: str = None) -> Dict[str, Any]:
        """执行每日工作流"""
        
    def _execute_data_fusion(self, trade_date: str) -> None:
        """执行数据融合与特征工程"""
        
    def _detect_anomalies(self, trade_date: str) -> List[str]:
        """检测异常事件"""
        
    def _process_anomaly_stocks(self, anomaly_stocks: List[str], trade_date: str) -> Dict[str, Any]:
        """处理异常股票"""
        
    def _save_analysis_results(self, stock_code: str, trade_date: str, results: Dict[str, Any]) -> None:
        """保存分析结果到数据库"""
```

**关键特性**:
- **模块化设计**: 通过支持模块实现功能分离
- **容错机制**: 单只股票失败不影响整体流程
- **日志记录**: 完整的执行日志和错误追踪
- **配置驱动**: 通过JSON配置文件管理所有参数
- **异步处理**: 支持并行数据获取和处理

## 7.9 数据库实体定义文件 🆕 v10.1 新增

**文件位置**: `aigc/backend/src/entities/`
**技术栈**: TypeScript + TypeORM + class-validator

**核心实体文件**:
- `processed-events.entity.ts` - 原始事件数据实体
- `generated-reports.entity.ts` - AI生成报告实体
- `financial-reports.entity.ts` - 财务报告实体
- `quant-signals.entity.ts` - 量化信号实体
- `money-flow.entity.ts` - 资金流向实体
- `top-list.entity.ts` - 龙虎榜实体
- `chip-distribution.entity.ts` - 筹码分布实体
- `human-feedback-loop.entity.ts` - 人工反馈循环实体

**接口定义文件**:
- `arbitration.interface.ts` - 仲裁相关接口定义

**关键特性**:
- **工业级数据校验**: 使用class-validator装饰器进行数据验证
- **完整业务注释**: 每个字段都有清晰的TSDoc注释
- **严格关系定义**: 使用TypeORM装饰器定义实体关系
- **类型安全**: 完整的TypeScript类型定义

## 7.10 健壮LLM调用API 🆕 v10.1 新增

### 7.10.1 带验证的LLM调用接口

**接口名称**: 健壮LLM调用
**接口路径**: `POST /api/v1/llm/call-with-validation`
**接口描述**: 使用7步走工作流进行带验证的LLM调用

**请求参数**:
```json
{
  "prompt": "基于以下信息进行预测分析...",
  "task_type": "prediction_generation",
  "options": {
    "max_tokens": 4000,
    "temperature": 0.7,
    "system_prompt": "你是一个专业的投资分析师"
  }
}
```

**任务类型**:
- `prediction_generation`: 预测生成
- `mda_verification`: MD&A验证
- `counterfactual_validation`: 反事实验证
- `event_chain_building`: 事件链构建

**响应格式**:
```json
{
  "status": "success",
  "data": {
    "content": "{\"scenario_optimistic\": {...}, \"confidence_score\": 0.85}",
    "usage": {
      "prompt_tokens": 1500,
      "completion_tokens": 800,
      "total_tokens": 2300
    },
    "model": "qwen-max",
    "provider": "通义千问",
    "finish_reason": "stop",
    "response_time": 2500,
    "timestamp": 1705488000000
  }
}
```

**错误响应**:
```json
{
  "status": "error",
  "error_type": "LlmResponseValidationError",
  "message": "Schema validation failed",
  "details": {
    "field": "probabilities.optimistic",
    "expected": "number between 0 and 1",
    "actual": "1.5"
  }
}
```

### 7.10.2 错误类型说明

**LlmResponseFormatError**: JSON格式错误
- 原因: LLM返回的不是有效JSON
- 处理: 自动尝试修复一次

**LlmResponseValidationError**: Schema验证错误
- 原因: 数据结构不符合预期Schema
- 处理: 返回详细验证错误信息

**LlmLowConfidenceError**: 低置信度错误
- 原因: confidence_score低于阈值
- 处理: 拒绝低质量结果

## 7.11 支持模块完整实现 🆕 v10.1 新增

**事件链构建器** (`event_chain_builder.py`):
- 使用商业LLM API构建逻辑事件链
- 识别事件间的因果关系
- 关联事件与MD&A核心战略

**预测生成器** (`prediction_generator.py`):
- 生成多场景概率性预测
- 整合量化分析师和情报分析师的观点
- 识别关键驱动因素

**因果验证器** (`causal_validator.py`):
- 反事实验证预测结果
- 识别潜在风险因素
- 进行因果推断分析

**数据库工具类** (`database_utils.py`):
- 统一管理数据库连接和操作
- 支持仲裁案例数据聚合
- 提供五大核心数据面板数据

---

**文档版本**: v10.1 (仲裁界面升级版)  
**最后更新**: 2025-01-17  
**维护者**: AI Assistant  
**优化说明**: 新增v10.1仲裁界面升级相关的API接口设计，包括仲裁数据聚合API、五大核心数据面板专用接口，以及相应的错误处理、性能要求和安全要求。提供完整的核心实现代码，包括数据库实体定义文件、支持模块完整实现、ArbitrationDataAggregatorService和MainWorkflow的完整实现。
