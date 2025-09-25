# v11.9架构升级 - 数据库迁移指南

## 概述

本文档描述了v11.9架构升级中的数据库Schema变更，主要涉及仲裁预处理模块的数据库结构调整。

## 迁移目标

- **降级AI仲裁**：移除自动仲裁功能，改为AI预处理
- **强化AI总结**：为人类仲裁官提供高质量的案情摘要
- **优化数据结构**：支持分歧度分析、优先级计算和人类反馈

## 主要变更

### 1. 重新设计arbitration_cases表

**变更前**：
- 简单的案件管理表
- 缺少分歧度分析字段
- 没有优先级计算支持

**变更后**：
- 完整的AI预处理结果存储
- 包含分歧度、情感差异、关键词重合度等分析字段
- 支持优先级排序和状态管理
- 添加人类仲裁员反馈字段

### 2. 修改generated_reports表

**新增字段**：
- `sentiment_score`: 情感分数(-1到1)
- `keywords`: 关键词列表(JSON格式)
- `entities`: 核心实体列表(JSON格式)
- `summary`: 报告摘要

**移除字段**：
- `pair_report_id`: 不再需要，由arbitration_cases统一管理

### 3. 新增支持表

- `arbitration_analysis_stats`: 每日统计汇总表
- `human_arbitrator_feedback`: 人类仲裁员反馈表

### 4. 新增视图和存储过程

- `v_high_priority_cases`: 高优先级案件视图
- `v_arbitration_cases_overview`: 案件概览视图
- `UpdateArbitrationDailyStats`: 每日统计更新存储过程

## 迁移文件

- **主迁移文件**: `027_v11_9_arbitration_preprocessing_upgrade.sql`
- **执行脚本**: `scripts/run_database_migration.py`
- **测试脚本**: `scripts/test_database_migration.py`

## 执行步骤

### 1. 备份数据库

```bash
# 建议在执行迁移前备份数据库
mysqldump -u username -p database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. 执行迁移

```bash
# 进入项目目录
cd /path/to/papa

# 执行迁移脚本
python scripts/run_database_migration.py
```

### 3. 验证迁移

```bash
# 运行测试脚本验证迁移结果
python scripts/test_database_migration.py
```

## 数据结构说明

### arbitration_cases表结构

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | BIGINT | 主键 |
| case_id | VARCHAR(100) | 案件ID: ARB_{stock_code}_{date} |
| stock_code | VARCHAR(20) | 股票代码 |
| trade_date | DATE | 交易日期 |
| qwen_report_id | BIGINT | Qwen事实归因报告ID |
| doubao_report_id | BIGINT | 豆包舆情感知报告ID |
| divergence_score | DECIMAL(5,4) | 分歧度分数(0-1) |
| sentiment_diff | DECIMAL(5,4) | 情感差异分数(0-1) |
| keyword_overlap | DECIMAL(5,4) | 关键词重合度(0-1) |
| entity_diff | DECIMAL(5,4) | 核心实体差异(0-1) |
| consensus_summary | TEXT | AI共识点摘要 |
| conflict_summary | TEXT | 核心争议点摘要 |
| priority_score | DECIMAL(5,4) | 仲裁优先级分数(0-1) |
| company_importance | DECIMAL(5,4) | 公司重要性分数(0-1) |
| event_importance | DECIMAL(5,4) | 事件重要性分数(0-1) |
| status | ENUM | 案件状态 |
| human_arbitrator_id | VARCHAR(50) | 人类仲裁员ID |
| human_decision | TEXT | 人类仲裁决策 |
| final_recommendation | ENUM | 最终建议 |
| final_confidence | DECIMAL(3,2) | 最终置信度(0-1) |
| analysis_metadata | JSON | 分析元数据 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |
| completed_at | TIMESTAMP | 完成时间 |

### 索引说明

- `idx_case_id`: 案件ID索引
- `idx_stock_date`: 股票代码+日期复合索引
- `idx_status`: 状态索引
- `idx_priority_score`: 优先级分数索引（降序）
- `idx_divergence_score`: 分歧度分数索引（降序）
- `idx_status_priority`: 状态+优先级复合索引
- `idx_trade_date_status`: 交易日期+状态复合索引

## 注意事项

### 1. 数据兼容性

- 现有的`arbitration_cases`表将被删除并重新创建
- 请确保在迁移前备份重要数据
- 新的表结构不兼容旧的数据格式

### 2. 性能考虑

- 新增的索引可能会影响写入性能
- 建议在低峰期执行迁移
- 迁移后监控数据库性能

### 3. 应用兼容性

- 需要更新相关的应用代码以适配新的表结构
- 确保所有依赖`arbitration_cases`表的代码都已更新

## 回滚方案

如果迁移出现问题，可以执行以下步骤回滚：

1. 停止相关应用服务
2. 恢复数据库备份
3. 检查数据完整性
4. 重新启动应用服务

## 验证清单

迁移完成后，请验证以下项目：

- [ ] arbitration_cases表结构正确
- [ ] generated_reports表字段完整
- [ ] 所有索引创建成功
- [ ] 视图可以正常查询
- [ ] 存储过程可以正常执行
- [ ] 示例数据插入成功
- [ ] 应用可以正常连接数据库

## 联系支持

如果在迁移过程中遇到问题，请：

1. 查看日志文件获取详细错误信息
2. 检查数据库连接和权限
3. 确认迁移文件语法正确
4. 联系技术支持团队

---

**重要提醒**: 在生产环境执行迁移前，请务必在测试环境完整验证迁移过程。
