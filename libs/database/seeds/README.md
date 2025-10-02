# 数据库种子数据脚本说明

## 📋 概述

本目录包含量化导航仪系统的数据库种子数据脚本，用于系统初始化、开发调试和自动化测试。所有脚本都是幂等的，可以安全地重复执行。

## 📁 文件结构

```
database/seeds/
├── README.md                    # 本说明文档
├── run_seeds.sh                 # 种子数据执行脚本
├── 01_system_configs.sql        # 系统配置数据
├── 02_industry_classification.sql # 行业分类数据
├── 03_users.sql                 # 用户管理数据
└── 04_sample_data.sql           # 示例数据
```

## 🚀 使用方法

### 1. 直接执行脚本

```bash
# 使用默认配置
./run_seeds.sh

# 使用自定义配置
./run_seeds.sh -h localhost -p 5432 -d quant_navigator -u postgres -w mypassword

# 使用环境变量
DB_PASSWORD=mypassword ./run_seeds.sh
```

### 2. 手动执行SQL文件

```bash
# 按顺序执行各个SQL文件
psql -h localhost -p 5432 -U postgres -d quant_navigator -f 01_system_configs.sql
psql -h localhost -p 5432 -U postgres -d quant_navigator -f 02_industry_classification.sql
psql -h localhost -p 5432 -U postgres -d quant_navigator -f 03_users.sql
psql -h localhost -p 5432 -U postgres -d quant_navigator -f 04_sample_data.sql
```

## 📊 数据内容

### 1. 系统配置数据 (01_system_configs.sql)

- **归因规则配置**: 包含5条核心归因规则
- **事件标签配置**: 包含5个主要事件标签
- **Prompt模板**: 4个核心Prompt模板库
- **系统设置**: 异常检测阈值、仲裁设置、LLM配置等

### 2. 行业分类数据 (02_industry_classification.sql)

- **申万一级行业**: 28个一级行业分类
- **申万二级行业**: 主要行业的二级分类
- **完整索引**: 支持快速查询和关联

### 3. 用户管理数据 (03_users.sql)

- **默认管理员**: admin/admin123
- **仲裁员账户**: arbitrator/admin123
- **分析师账户**: analyst/admin123

### 4. 示例数据 (04_sample_data.sql)

- **股票基础信息**: 5只示例股票
- **处理事件**: 5条示例事件记录
- **生成报告**: 5份AI分析报告
- **人工反馈**: 5条仲裁记录
- **量化信号**: 5条量化信号数据
- **财务数据**: 5条财务报告数据

## ⚠️ 重要注意事项

### 1. 数据安全
- 默认密码仅用于开发环境
- 生产环境必须修改默认密码
- 建议使用环境变量管理敏感信息

### 2. 幂等性
- 所有脚本都使用 `ON CONFLICT DO NOTHING`
- 可以安全地重复执行
- 不会创建重复数据

### 3. 依赖关系
- 必须先创建数据库表结构
- 建议按文件顺序执行
- 确保外键约束正确

## 🔧 配置说明

### 环境变量

```bash
DB_HOST=localhost          # 数据库主机
DB_PORT=5432              # 数据库端口
DB_NAME=quant_navigator   # 数据库名称
DB_USER=postgres          # 数据库用户
DB_PASSWORD=password      # 数据库密码
```

### 命令行参数

```bash
-h, --host HOST      # 数据库主机
-p, --port PORT      # 数据库端口
-d, --database NAME  # 数据库名称
-u, --user USER      # 数据库用户
-w, --password PASS  # 数据库密码
```

## 🧪 测试验证

### 1. 验证系统配置

```sql
-- 检查系统配置数据
SELECT config_type, COUNT(*) FROM system_configs GROUP BY config_type;

-- 检查归因规则
SELECT config_key, description FROM system_configs WHERE config_type = 'ATTRIBUTION_RULE';
```

### 2. 验证行业分类

```sql
-- 检查行业分类数据
SELECT level, COUNT(*) FROM industry_classification GROUP BY level;

-- 检查一级行业
SELECT industry_code, industry_name FROM industry_classification WHERE level = 1;
```

### 3. 验证用户数据

```sql
-- 检查用户数据
SELECT username, role, is_active FROM users;

-- 验证管理员账户
SELECT username FROM users WHERE role = 'admin';
```

### 4. 验证示例数据

```sql
-- 检查示例数据
SELECT 'stocks' as table_name, COUNT(*) as count FROM stocks
UNION ALL
SELECT 'processed_events', COUNT(*) FROM processed_events
UNION ALL
SELECT 'generated_reports', COUNT(*) FROM generated_reports
UNION ALL
SELECT 'human_feedback_loop', COUNT(*) FROM human_feedback_loop;
```

## 🔄 维护说明

### 1. 添加新配置
- 在对应的SQL文件中添加新记录
- 使用 `ON CONFLICT DO NOTHING` 确保幂等性
- 更新版本号和描述信息

### 2. 更新现有配置
- 使用 `ON CONFLICT DO UPDATE` 更新现有记录
- 保持向后兼容性
- 记录变更历史

### 3. 清理数据
- 使用 `DELETE` 语句清理不需要的数据
- 注意外键约束
- 备份重要数据

## 📈 性能优化

### 1. 索引优化
- 为常用查询字段创建索引
- 定期分析查询性能
- 优化慢查询

### 2. 批量操作
- 使用批量插入提高性能
- 避免逐条插入大量数据
- 使用事务确保数据一致性

### 3. 监控告警
- 监控脚本执行时间
- 设置数据完整性检查
- 建立异常告警机制

---

**文档版本**: v1.0
**最后更新**: 2025-01-17
**维护者**: AI Assistant
**优化说明**: 基于v10.1架构，提供完整的数据库种子数据解决方案，确保系统能够快速启动和正常运行
