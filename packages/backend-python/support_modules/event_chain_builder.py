#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
事件链构建器 - 将孤立事件串联成逻辑故事线
v10.1 仲裁界面升级版

作者: AI Assistant
创建时间: 2025-01-17
版本: v10.1
"""

import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from pathlib import Path

from .llm_service import LLMService


class EventChainBuilder:
    """
    事件链构建器 - 使用商业LLM API构建逻辑事件链

    核心功能：
    1. 将孤立事件串联成连贯的故事线
    2. 识别事件间的因果关系
    3. 关联事件与MD&A核心战略
    4. 生成结构化的事件链数据
    """

    def __init__(self, config: Dict[str, Any]):
        """
        初始化事件链构建器

        Args:
            config: 配置字典，包含LLM服务配置
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.llm_service = LLMService(config.get("llm_service", {}))

        # 加载Prompt模板
        self.prompt_templates = self._load_prompt_templates()

    def _load_prompt_templates(self) -> Dict[str, Any]:
        """加载事件链构建的Prompt模板"""
        try:
            template_path = Path(
                "config/prompt_templates/event_chain_building_prompts.json"
            )
            if template_path.exists():
                with open(template_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            else:
                self.logger.warning("Prompt模板文件不存在，使用默认模板")
                return self._get_default_templates()
        except Exception as e:
            self.logger.error(f"加载Prompt模板失败: {e}")
            return self._get_default_templates()

    def _get_default_templates(self) -> Dict[str, Any]:
        """获取默认的Prompt模板"""
        return {
            "version": "1.0",
            "build_chain": {
                "role": "你是一名资深的产业分析师和商业历史学家，擅长从一系列看似孤立的事件中，梳理出其背后的商业逻辑和因果联系。",
                "instructions": [
                    "1. **背景**: 你正在为【{{stock_name}}】撰写一份从【{{start_date}}】到【{{end_date}}】的商业大事记。",
                    "2. **核心输入**: 以下是按时间排序的【异常事件列表】和该公司在此期间的【MD&A核心战略】。",
                    "3. **任务**: ",
                    "   a. **串联事件**: 将事件列表，改写成一个连贯的、可读的、按时间顺序的事件链。",
                    "   b. **【关键】注入因果**: 如果你认为事件B的发生，是事件A的直接或间接结果，请明确标注出这种**因果关系**。例如：'在投入了巨额研发费用后（事件A），公司成功发布了新产品（事件B）。'",
                    "   c. **【关键】关联战略**: 将每一个关键事件，与【MD&A核心战略】进行关联，并标注**匹配度**（高/中/低）。",
                    "4. **【关键约束】**: **不要臆想因果关系。** 如果两个事件只是时间上先后发生，而没有明确的逻辑联系，就只陈述事实，不要强加因果。",
                    "5. **输出格式**: 必须以一个JSON列表输出。每个对象代表一个事件节点，包含'date', 'event_description' (你改写后的描述，可能包含因果链接), 'mda_strategy_link' (关联的战略), 和'alignment_score' (匹配度评分)。",
                ],
                "input_template": "\n\n# 异常事件列表\n\n{{event_list_json}}\n\n# MD&A核心战略\n\n{{mda_features_json}}",
            },
        }

    def build(self, stock_code: str, trade_date: str) -> Dict[str, Any]:
        """
        构建事件链

        Args:
            stock_code: 股票代码
            trade_date: 交易日期

        Returns:
            事件链构建结果
        """
        try:
            self.logger.info(f"开始构建事件链: {stock_code} @ {trade_date}")

            # 1. 获取异常事件列表
            events = self._get_anomaly_events(stock_code, trade_date)
            if not events:
                self.logger.warning(f"未找到异常事件: {stock_code}")
                return self._create_empty_chain()

            # 2. 获取MD&A核心战略
            mda_features = self._get_mda_features(stock_code, trade_date)

            # 3. 构建事件链
            event_chain = self._build_event_chain(
                events, mda_features, stock_code, trade_date
            )

            # 4. 计算事件链质量评分
            quality_score = self._calculate_chain_quality(event_chain)

            result = {
                "stock_code": stock_code,
                "trade_date": trade_date,
                "event_chain": event_chain,
                "quality_score": quality_score,
                "event_count": len(events),
                "chain_length": len(event_chain),
                "created_at": datetime.now().isoformat(),
            }

            self.logger.info(f"事件链构建完成: {len(event_chain)}个事件节点")
            return result

        except Exception as e:
            self.logger.error(f"构建事件链失败: {e}", exc_info=True)
            return self._create_empty_chain()

    def _get_anomaly_events(
        self, stock_code: str, trade_date: str
    ) -> List[Dict[str, Any]]:
        """获取异常事件列表"""
        # 这里应该从数据库查询异常事件
        # 暂时返回模拟数据
        return [
            {
                "event_id": "evt_001",
                "event_type": "news",
                "title": "公司发布2024年第三季度财务报告",
                "content": "公司营收同比增长15.2%，净利润增长22.1%...",
                "published_at": "2024-10-28T09:30:00Z",
                "importance_score": 0.85,
                "sentiment_score": 0.75,
            },
            {
                "event_id": "evt_002",
                "event_type": "announcement",
                "title": "公司宣布与特斯拉签署长期合作协议",
                "content": "公司将向特斯拉供应新能源电池组件...",
                "published_at": "2024-10-25T14:20:00Z",
                "importance_score": 0.95,
                "sentiment_score": 0.90,
            },
        ]

    def _get_mda_features(self, stock_code: str, trade_date: str) -> Dict[str, Any]:
        """获取MD&A核心战略特征"""
        # 这里应该从数据库查询MD&A特征
        # 暂时返回模拟数据
        return {
            "core_strategies": ["新能源业务扩张", "技术创新投入", "市场拓展计划"],
            "key_metrics": {
                "revenue_growth_target": 20,
                "rd_investment_ratio": 5,
                "market_share_target": 15,
            },
        }

    def _build_event_chain(
        self,
        events: List[Dict[str, Any]],
        mda_features: Dict[str, Any],
        stock_code: str,
        trade_date: str,
    ) -> List[Dict[str, Any]]:
        """使用LLM构建事件链"""
        try:
            # 准备输入数据
            event_list_json = json.dumps(events, ensure_ascii=False, indent=2)
            mda_features_json = json.dumps(mda_features, ensure_ascii=False, indent=2)

            # 获取Prompt模板
            template = self.prompt_templates["build_chain"]

            # 构建完整的Prompt
            prompt = self._build_prompt(
                template,
                {
                    "stock_name": stock_code,
                    "start_date": (
                        datetime.strptime(trade_date, "%Y%m%d") - timedelta(days=30)
                    ).strftime("%Y-%m-%d"),
                    "end_date": trade_date,
                    "event_list_json": event_list_json,
                    "mda_features_json": mda_features_json,
                },
            )

            # 调用LLM服务
            response = self.llm_service.call_llm(prompt, model="kimi")

            # 解析响应
            event_chain = self._parse_llm_response(response)

            return event_chain

        except Exception as e:
            self.logger.error(f"LLM构建事件链失败: {e}")
            return []

    def _build_prompt(self, template: Dict[str, Any], variables: Dict[str, str]) -> str:
        """构建完整的Prompt"""
        role = template["role"]
        instructions = "\n".join(template["instructions"])
        input_template = template["input_template"]

        # 替换变量
        for key, value in variables.items():
            input_template = input_template.replace(f"{{{{{key}}}}}", value)

        prompt = f"""# 角色定义
{role}

# 任务指令
{instructions}

{input_template}

# 输出要求
请严格按照JSON格式输出，不要包含任何其他内容。"""

        return prompt

    def _parse_llm_response(self, response: str) -> List[Dict[str, Any]]:
        """解析LLM响应"""
        try:
            # 尝试直接解析JSON
            if response.strip().startswith("["):
                return json.loads(response)

            # 尝试从响应中提取JSON
            import re

            json_match = re.search(r"\[.*\]", response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())

            # 如果都失败，返回空列表
            self.logger.warning("无法解析LLM响应为JSON格式")
            return []

        except json.JSONDecodeError as e:
            self.logger.error(f"JSON解析失败: {e}")
            return []

    def _calculate_chain_quality(self, event_chain: List[Dict[str, Any]]) -> float:
        """计算事件链质量评分"""
        if not event_chain:
            return 0.0

        # 基础评分
        base_score = 0.5

        # 事件数量评分
        event_count_score = min(len(event_chain) / 10, 1.0) * 0.2

        # 因果关系评分
        causal_links = sum(
            1 for event in event_chain if "因果" in event.get("event_description", "")
        )
        causal_score = min(causal_links / len(event_chain), 1.0) * 0.2

        # 战略关联评分
        strategy_links = sum(
            1 for event in event_chain if event.get("mda_strategy_link")
        )
        strategy_score = min(strategy_links / len(event_chain), 1.0) * 0.1

        total_score = base_score + event_count_score + causal_score + strategy_score
        return min(total_score, 1.0)

    def _create_empty_chain(self) -> Dict[str, Any]:
        """创建空的事件链"""
        return {
            "stock_code": "",
            "trade_date": "",
            "event_chain": [],
            "quality_score": 0.0,
            "event_count": 0,
            "chain_length": 0,
            "created_at": datetime.now().isoformat(),
            "error": "No events found",
        }

    def get_chain_summary(self, event_chain: List[Dict[str, Any]]) -> Dict[str, Any]:
        """获取事件链摘要"""
        if not event_chain:
            return {"summary": "无事件链数据"}

        # 统计信息
        total_events = len(event_chain)
        causal_events = sum(
            1 for event in event_chain if "因果" in event.get("event_description", "")
        )
        strategy_events = sum(
            1 for event in event_chain if event.get("mda_strategy_link")
        )

        # 时间范围
        dates = [event.get("date", "") for event in event_chain if event.get("date")]
        start_date = min(dates) if dates else ""
        end_date = max(dates) if dates else ""

        return {
            "total_events": total_events,
            "causal_events": causal_events,
            "strategy_events": strategy_events,
            "time_range": f"{start_date} 至 {end_date}",
            "causal_ratio": causal_events / total_events if total_events > 0 else 0,
            "strategy_ratio": strategy_events / total_events if total_events > 0 else 0,
        }
