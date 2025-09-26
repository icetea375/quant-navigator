-- 系统配置种子数据脚本
-- 初始化系统配置表，包含归因规则、事件标签、Prompt模板等核心配置

-- 插入归因规则配置
INSERT INTO system_configs (config_key, config_type, config_value, description, is_active, created_at, updated_at)
VALUES
('attribution_rules', 'ATTRIBUTION_RULE', '{
  "version": "1.1",
  "description": "精益归因流水线事件标签知识库 - 支持非开发人员维护的外部化配置",
  "last_updated": "2025-01-17",
  "rules": [
    {
      "rule_id": "ANNC_EARNINGS_POSITIVE",
      "description": "业绩预告 - 预增/扭亏",
      "data_source": "tushare",
      "api_name": "announcement",
      "target_field": "title",
      "keywords": ["业绩预增", "扭亏为盈", "业绩快报", "业绩预告", "同比增长", "净利润增长", "营收增长", "利润增长"],
      "keyword_logic": "ANY",
      "exclusion_keywords": ["下降", "减少", "亏损", "下滑", "预减"],
      "attribution_label": "业绩超预期",
      "priority": 1,
      "cost_tier": 1,
      "confidence_threshold": 0.8
    },
    {
      "rule_id": "ANNC_EARNINGS_NEGATIVE",
      "description": "业绩预告 - 预减/首亏",
      "data_source": "tushare",
      "api_name": "announcement",
      "target_field": "title",
      "keywords": ["业绩预减", "首亏", "业绩快报", "业绩预告", "同比下降", "净利润下滑", "营收下降", "利润下降"],
      "keyword_logic": "ANY",
      "exclusion_keywords": ["增长", "增加", "预增"],
      "attribution_label": "业绩低于预期",
      "priority": 1,
      "cost_tier": 1,
      "confidence_threshold": 0.8
    },
    {
      "rule_id": "ANNC_MAJOR_CONTRACT",
      "description": "重大合同中标",
      "data_source": "tushare",
      "api_name": "announcement",
      "target_field": "title",
      "keywords": ["重大合同", "中标", "签订合同", "合同公告", "项目中标", "订单公告"],
      "keyword_logic": "ANY",
      "exclusion_keywords": [],
      "attribution_label": "重大合同",
      "priority": 2,
      "cost_tier": 1,
      "confidence_threshold": 0.7
    },
    {
      "rule_id": "ANNC_SHARE_BUYBACK",
      "description": "股份回购/增持",
      "data_source": "tushare",
      "api_name": "announcement",
      "target_field": "title",
      "keywords": ["回购", "增持", "股份回购", "股票回购", "股东增持", "高管增持", "回购股份方案", "回购公司股份", "股份回购预案"],
      "keyword_logic": "ANY",
      "exclusion_keywords": ["减持", "出售", "进展", "完成", "结果", "实施", "注销", "通知债权人", "回购报告书"],
      "attribution_label": "股份回购/增持",
      "priority": 2,
      "cost_tier": 1,
      "confidence_threshold": 0.7
    },
    {
      "rule_id": "ANNC_ASSET_REORGANIZATION",
      "description": "资产重组",
      "data_source": "tushare",
      "api_name": "announcement",
      "target_field": "title",
      "keywords": ["资产重组", "重大资产重组", "重组预案", "收购", "并购", "资产注入"],
      "keyword_logic": "ANY",
      "exclusion_keywords": ["重组失败", "重组终止"],
      "attribution_label": "资产重组",
      "priority": 1,
      "cost_tier": 1,
      "confidence_threshold": 0.8
    }
  ]
}', '归因规则配置 - 用于事件归因分析', true, NOW(), NOW())
ON CONFLICT (config_key) DO NOTHING;

-- 插入事件标签配置
INSERT INTO system_configs (config_key, config_type, config_value, description, is_active, created_at, updated_at)
VALUES
('event_tags', 'EVENT_TAG', '{
  "version": "2.1",
  "description": "公告重要性评分算法事件标签知识库 - 支持非开发人员维护的外部化配置",
  "last_updated": "2025-01-17",
  "tags": {
    "E001": {
      "tag_name": "业绩超预期",
      "description": "公司发布的业绩预告或报告显著超过市场一致预期",
      "base_score": 9,
      "sentiment": "Positive",
      "keywords": ["业绩预增", "扭亏为盈", "业绩快报", "同比增长", "净利润增长"],
      "confidence_threshold": 0.8
    },
    "E002": {
      "tag_name": "业绩低于预期",
      "description": "公司发布的业绩预告或报告显著低于市场一致预期",
      "base_score": 9,
      "sentiment": "Negative",
      "keywords": ["业绩预减", "首亏", "同比下降", "净利润下滑"],
      "confidence_threshold": 0.8
    },
    "E003": {
      "tag_name": "重大合同中标",
      "description": "公司公告签订了对其收入有重大影响的新合同或订单",
      "base_score": 8,
      "sentiment": "Positive",
      "keywords": ["重大合同", "中标", "签订合同", "项目中标", "重大订单", "大单", "订单公告", "合同订单"],
      "confidence_threshold": 0.7
    },
    "E004": {
      "tag_name": "研发管线重大突破",
      "description": "例如新药获批、纳入突破性疗法、关键技术验证成功",
      "base_score": 9,
      "sentiment": "Positive",
      "keywords": ["新药获批", "突破性疗法", "技术验证", "研发突破"],
      "confidence_threshold": 0.8
    },
    "E005": {
      "tag_name": "监管处罚相关",
      "description": "公司或关键高管受到证监会、交易所等机构的行政处罚或立案调查",
      "base_score": 9,
      "sentiment": "Negative",
      "keywords": ["监管处罚", "行政处罚", "立案调查", "监管函", "收到立案调查通知书", "被立案调查", "监管调查"],
      "confidence_threshold": 0.9
    }
  }
}', '事件标签配置 - 用于事件重要性评分', true, NOW(), NOW())
ON CONFLICT (config_key) DO NOTHING;

-- 插入MD&A验证Prompt模板
INSERT INTO system_configs (config_key, config_type, config_value, description, is_active, created_at, updated_at)
VALUES
('mda_verification_prompts', 'PROMPT_TEMPLATE', '{
  "version": "1.0",
  "description": "管理层履约记录审查官 - MD&A验证Prompt模板库",
  "last_updated": "2025-01-17",
  "prompts": {
    "extract_promises": {
      "role": "你是一名专业的财务分析师，擅长从上市公司的管理层讨论与分析(MD&A)中，提取出可被客观验证的、未来导向的经营计划。你对华丽但空洞的辞藻保持警惕。",
      "instructions": [
        "1. **任务**: 从以下【T-1期MD&A文本】中，提取所有关于【下一个报告期】的、**可量化的、具体的**经营承诺或目标。",
        "2. **提取标准**: 只提取包含**具体数字、项目名称、明确时间节点或可衡量结果**的陈述。",
        "3. **【关键约束】忽略项**: **绝对不要**提取任何模糊的、无法量化的愿景陈述。",
        "4. **输出格式**: 必须以一个JSON列表的形式输出。"
      ]
    }
  }
}', 'MD&A验证Prompt模板 - 用于管理层履约记录验证', true, NOW(), NOW())
ON CONFLICT (config_key) DO NOTHING;

-- 插入事件链构建Prompt模板
INSERT INTO system_configs (config_key, config_type, config_value, description, is_active, created_at, updated_at)
VALUES
('event_chain_building_prompts', 'PROMPT_TEMPLATE', '{
  "version": "1.0",
  "description": "历史学家与逻辑学家 - 事件链构建Prompt模板库",
  "last_updated": "2025-01-17",
  "prompts": {
    "build_chain": {
      "role": "你是一名资深的产业分析师和商业历史学家，擅长从一系列看似孤立的事件中，梳理出其背后的商业逻辑和因果联系。",
      "instructions": [
        "1. **背景**: 你正在为【{{stock_name}}】撰写一份从【{{start_date}}】到【{{end_date}}】的商业大事记。",
        "2. **核心输入**: 以下是按时间排序的【异常事件列表】和该公司在此期间的【MD&A核心战略】。",
        "3. **任务**: 将事件列表，改写成一个连贯的、可读的、按时间顺序的事件链。"
      ]
    }
  }
}', '事件链构建Prompt模板 - 用于构建逻辑连贯的事件链', true, NOW(), NOW())
ON CONFLICT (config_key) DO NOTHING;

-- 插入预测生成Prompt模板
INSERT INTO system_configs (config_key, config_type, config_value, description, is_active, created_at, updated_at)
VALUES
('prediction_generation_prompts', 'PROMPT_TEMPLATE', '{
  "version": "1.0",
  "description": "首席投资官 (CIO) - 预测生成Prompt模板库",
  "last_updated": "2025-01-17",
  "prompts": {
    "generate_probabilistic_forecast": {
      "role": "你是一位经验丰富的A股首席投资官(CIO)，你深知市场充满不确定性，从不给出单一的确定性预测。",
      "instructions": [
        "1. **任务**: 基于以下完整的【决策信息包】，对【{{stock_name}}】未来5个交易日的超额收益率，进行一次**多场景概率性预测**。",
        "2. **【关键约束】**: **你的三个场景的概率之和必须严格等于1.0。**"
      ]
    }
  }
}', '预测生成Prompt模板 - 用于生成多场景概率性预测', true, NOW(), NOW())
ON CONFLICT (config_key) DO NOTHING;

-- 插入反事实验证Prompt模板
INSERT INTO system_configs (config_key, config_type, config_value, description, is_active, created_at, updated_at)
VALUES
('counterfactual_validation_prompts', 'PROMPT_TEMPLATE', '{
  "version": "1.0",
  "description": "魔鬼代言人 - 反事实验证Prompt模板库",
  "last_updated": "2025-01-17",
  "prompts": {
    "challenge_prediction": {
      "role": "你是一个极其严苛和多疑的风险官，你的任务是挑战一个看似乐观的预测，找出所有可能导致它失败的、被忽略的因素。",
      "instructions": [
        "1. **背景**: 我们的内部模型刚刚对【{{stock_name}}】做出了一个**高置信度的看涨预测**。",
        "2. **任务**: 请进行一次**反事实思考**，推演出**最可能导致这个失败的1-2个风险**。"
      ]
    }
  }
}', '反事实验证Prompt模板 - 用于挑战高置信度预测', true, NOW(), NOW())
ON CONFLICT (config_key) DO NOTHING;

-- 插入系统基础配置
INSERT INTO system_configs (config_key, config_type, config_value, description, is_active, created_at, updated_at)
VALUES
('system_settings', 'SYSTEM_CONFIG', '{
  "version": "1.0",
  "anomaly_thresholds": {
    "z_score_threshold": 2.5,
    "confidence_threshold": 0.6,
    "ai_disagreement_threshold": 0.7
  },
  "arbitration_settings": {
    "auto_arbitration_threshold": 0.8,
    "human_review_required": true,
    "notification_enabled": true
  },
  "llm_settings": {
    "default_provider": "tongyi",
    "timeout": 30000,
    "max_retries": 3,
    "max_concurrent": 5
  }
}', '系统基础配置 - 包含异常检测阈值、仲裁设置、LLM配置等', true, NOW(), NOW())
ON CONFLICT (config_key) DO NOTHING;
