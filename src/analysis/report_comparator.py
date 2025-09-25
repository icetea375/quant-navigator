#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
报告对比器 - v11.9架构升级核心模块
实现双脑报告对比分析，为人类仲裁官提供高质量案情摘要

作者: AI Assistant
创建时间: 2025-01-17
版本: v11.9
"""

import logging
import json
import re
from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime

# 导入LLM服务
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))
from support_modules.llm_service import LLMService


@dataclass
class ComparisonResult:
    """报告对比结果数据类"""
    divergence_score: float  # 分歧度分数 (0-1)
    consensus_summary: str   # 共识点摘要
    conflict_summary: str    # 核心争议点摘要
    sentiment_diff: float    # 情感差异分数
    keyword_overlap: float   # 关键词重合度
    entity_diff: float       # 核心实体差异
    analysis_timestamp: str  # 分析时间戳


class ReportComparator:
    """
    报告对比器 - 核心分析引擎
    
    负责对比Qwen事实归因报告和豆包舆情感知报告，
    生成结构化的案情摘要供人类仲裁官参考
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        初始化报告对比器
        
        Args:
            config: 配置参数，包含LLM服务配置
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # 初始化LLM服务
        self.llm_service = LLMService(config.get('llm', {}))
        
        # 权重配置
        self.weights = {
            'sentiment': 0.4,      # 情感差异权重
            'keywords': 0.3,       # 关键词重合度权重
            'entities': 0.3        # 核心实体差异权重
        }
        
        self.logger.info("报告对比器初始化完成")
    
    def calculate_divergence_score(self, qwen_report: Dict[str, Any], doubao_report: Dict[str, Any]) -> float:
        """
        计算分歧度分数 - 多维度加权算法
        
        Args:
            qwen_report: Qwen事实归因报告
            doubao_report: 豆包舆情感知报告
            
        Returns:
            分歧度分数 (0-1)，1表示完全分歧，0表示完全一致
        """
        try:
            self.logger.info("开始计算分歧度分数")
            
            # 检查空报告情况
            if not qwen_report and not doubao_report:
                return 0.0  # 两个空报告，无分歧
            elif not qwen_report or not doubao_report:
                return 0.5  # 一个空一个非空，中等分歧
            
            # 1. 计算情感差异
            sentiment_diff = self._calculate_sentiment_difference(qwen_report, doubao_report)
            
            # 2. 计算关键词重合度
            keyword_overlap = self._calculate_keyword_overlap(qwen_report, doubao_report)
            
            # 3. 计算核心实体差异
            entity_diff = self._calculate_entity_difference(qwen_report, doubao_report)
            
            # 4. 加权计算最终分歧度分数
            divergence_score = (
                self.weights['sentiment'] * sentiment_diff +
                self.weights['keywords'] * (1 - keyword_overlap) +  # 关键词不重合度
                self.weights['entities'] * entity_diff
            )
            
            # 确保分数在0-1范围内
            divergence_score = max(0.0, min(1.0, divergence_score))
            
            self.logger.info(f"分歧度计算完成: {divergence_score:.3f}")
            return divergence_score
            
        except Exception as e:
            self.logger.error(f"计算分歧度分数失败: {e}", exc_info=True)
            return 0.5  # 出错时返回中等分歧度
    
    def summarize_consensus(self, qwen_report: Dict[str, Any], doubao_report: Dict[str, Any]) -> str:
        """
        总结共识点 - 使用LLM生成共识摘要
        
        Args:
            qwen_report: Qwen事实归因报告
            doubao_report: 豆包舆情感知报告
            
        Returns:
            共识点文本摘要
        """
        try:
            self.logger.info("开始生成共识点摘要")
            
            # 构建共识分析Prompt
            prompt = self._build_consensus_prompt(qwen_report, doubao_report)
            
            # 调用LLM生成共识摘要
            consensus_summary = self.llm_service.call_llm(prompt, "qwen_plus")
            
            # 清理和验证结果
            consensus_summary = self._clean_llm_response(consensus_summary)
            
            self.logger.info("共识点摘要生成完成")
            return consensus_summary
            
        except Exception as e:
            self.logger.error(f"生成共识点摘要失败: {e}", exc_info=True)
            return "共识点分析暂时不可用，请查看原始报告进行判断。"
    
    def extract_conflicts(self, qwen_report: Dict[str, Any], doubao_report: Dict[str, Any]) -> str:
        """
        提取核心争议点 - 使用LLM生成争议摘要
        
        Args:
            qwen_report: Qwen事实归因报告
            doubao_report: 豆包舆情感知报告
            
        Returns:
            核心争议点文本摘要
        """
        try:
            self.logger.info("开始提取核心争议点")
            
            # 构建争议分析Prompt
            prompt = self._build_conflict_prompt(qwen_report, doubao_report)
            
            # 调用LLM生成争议摘要
            conflict_summary = self.llm_service.call_llm(prompt, "qwen_plus")
            
            # 清理和验证结果
            conflict_summary = self._clean_llm_response(conflict_summary)
            
            self.logger.info("核心争议点提取完成")
            return conflict_summary
            
        except Exception as e:
            self.logger.error(f"提取核心争议点失败: {e}", exc_info=True)
            return "争议点分析暂时不可用，请查看原始报告进行判断。"
    
    def compare_reports(self, qwen_report: Dict[str, Any], doubao_report: Dict[str, Any]) -> ComparisonResult:
        """
        完整对比两个报告 - 主入口方法
        
        Args:
            qwen_report: Qwen事实归因报告
            doubao_report: 豆包舆情感知报告
            
        Returns:
            完整的对比结果
        """
        try:
            self.logger.info("开始完整报告对比分析")
            
            # 计算分歧度分数
            divergence_score = self.calculate_divergence_score(qwen_report, doubao_report)
            
            # 生成共识摘要
            consensus_summary = self.summarize_consensus(qwen_report, doubao_report)
            
            # 提取争议点
            conflict_summary = self.extract_conflicts(qwen_report, doubao_report)
            
            # 计算各项指标
            sentiment_diff = self._calculate_sentiment_difference(qwen_report, doubao_report)
            keyword_overlap = self._calculate_keyword_overlap(qwen_report, doubao_report)
            entity_diff = self._calculate_entity_difference(qwen_report, doubao_report)
            
            # 构建结果
            result = ComparisonResult(
                divergence_score=divergence_score,
                consensus_summary=consensus_summary,
                conflict_summary=conflict_summary,
                sentiment_diff=sentiment_diff,
                keyword_overlap=keyword_overlap,
                entity_diff=entity_diff,
                analysis_timestamp=datetime.now().isoformat()
            )
            
            self.logger.info("完整报告对比分析完成")
            return result
            
        except Exception as e:
            self.logger.error(f"完整报告对比失败: {e}", exc_info=True)
            # 返回默认结果
            return ComparisonResult(
                divergence_score=0.5,
                consensus_summary="分析暂时不可用",
                conflict_summary="分析暂时不可用",
                sentiment_diff=0.5,
                keyword_overlap=0.5,
                entity_diff=0.5,
                analysis_timestamp=datetime.now().isoformat()
            )
    
    def _calculate_sentiment_difference(self, qwen_report: Dict[str, Any], doubao_report: Dict[str, Any]) -> float:
        """计算情感差异分数"""
        try:
            # 提取情感分数
            qwen_sentiment = self._extract_sentiment_score(qwen_report)
            doubao_sentiment = self._extract_sentiment_score(doubao_report)
            
            # 计算绝对差异
            sentiment_diff = abs(qwen_sentiment - doubao_sentiment)
            
            # 归一化到0-1范围
            return min(1.0, sentiment_diff / 2.0)  # 假设情感分数范围是-1到1
            
        except Exception as e:
            self.logger.error(f"计算情感差异失败: {e}")
            return 0.5
    
    def _calculate_keyword_overlap(self, qwen_report: Dict[str, Any], doubao_report: Dict[str, Any]) -> float:
        """计算关键词重合度"""
        try:
            # 提取关键词
            qwen_keywords = self._extract_keywords(qwen_report)
            doubao_keywords = self._extract_keywords(doubao_report)
            
            if not qwen_keywords or not doubao_keywords:
                return 0.0
            
            # 计算Jaccard相似度
            intersection = set(qwen_keywords) & set(doubao_keywords)
            union = set(qwen_keywords) | set(doubao_keywords)
            
            if not union:
                return 0.0
            
            return len(intersection) / len(union)
            
        except Exception as e:
            self.logger.error(f"计算关键词重合度失败: {e}")
            return 0.0
    
    def _calculate_entity_difference(self, qwen_report: Dict[str, Any], doubao_report: Dict[str, Any]) -> float:
        """计算核心实体差异"""
        try:
            # 提取核心实体
            qwen_entities = self._extract_entities(qwen_report)
            doubao_entities = self._extract_entities(doubao_report)
            
            if not qwen_entities or not doubao_entities:
                return 0.5
            
            # 计算实体差异
            intersection = set(qwen_entities) & set(doubao_entities)
            union = set(qwen_entities) | set(doubao_entities)
            
            if not union:
                return 0.5
            
            # 实体差异 = 1 - 重合度
            overlap_ratio = len(intersection) / len(union)
            return 1.0 - overlap_ratio
            
        except Exception as e:
            self.logger.error(f"计算核心实体差异失败: {e}")
            return 0.5
    
    def _extract_sentiment_score(self, report: Dict[str, Any]) -> float:
        """从报告中提取情感分数"""
        try:
            # 尝试从不同字段提取情感分数
            sentiment_fields = ['sentiment_score', 'emotion_score', 'sentiment', 'emotion']
            
            for field in sentiment_fields:
                if field in report and isinstance(report[field], (int, float)):
                    return float(report[field])
            
            # 如果没有直接的情感分数，尝试从文本中分析
            text_content = self._extract_text_content(report)
            if text_content:
                # 简单的关键词情感分析
                positive_words = ['上涨', '利好', '积极', '乐观', '增长', '盈利', '突破']
                negative_words = ['下跌', '利空', '消极', '悲观', '下降', '亏损', '风险']
                
                positive_count = sum(1 for word in positive_words if word in text_content)
                negative_count = sum(1 for word in negative_words if word in text_content)
                
                if positive_count + negative_count > 0:
                    return (positive_count - negative_count) / (positive_count + negative_count)
            
            return 0.0  # 默认中性
            
        except Exception as e:
            self.logger.error(f"提取情感分数失败: {e}")
            return 0.0
    
    def _extract_keywords(self, report: Dict[str, Any]) -> List[str]:
        """从报告中提取关键词"""
        try:
            keywords = []
            
            # 从keywords字段提取
            if 'keywords' in report and isinstance(report['keywords'], list):
                keywords.extend(report['keywords'])
            
            # 从summary字段提取关键词
            if 'summary' in report:
                summary_keywords = self._extract_keywords_from_text(report['summary'])
                keywords.extend(summary_keywords)
            
            # 从content字段提取关键词
            if 'content' in report:
                content_keywords = self._extract_keywords_from_text(report['content'])
                keywords.extend(content_keywords)
            
            # 去重并返回
            return list(set(keywords))
            
        except Exception as e:
            self.logger.error(f"提取关键词失败: {e}")
            return []
    
    def _extract_entities(self, report: Dict[str, Any]) -> List[str]:
        """从报告中提取核心实体"""
        try:
            entities = []
            
            # 从entities字段提取
            if 'entities' in report and isinstance(report['entities'], list):
                entities.extend(report['entities'])
            
            # 从文本中提取实体
            text_content = self._extract_text_content(report)
            if text_content:
                # 简单的实体提取（公司名、行业名等）
                entity_patterns = [
                    r'([A-Z]{2,}\d{6})',  # 股票代码
                    r'([\u4e00-\u9fff]{2,}公司)',  # 公司名
                    r'([\u4e00-\u9fff]{2,}行业)',  # 行业名
                    r'([\u4e00-\u9fff]{2,}板块)',  # 板块名
                ]
                
                for pattern in entity_patterns:
                    matches = re.findall(pattern, text_content)
                    entities.extend(matches)
            
            # 去重并返回
            return list(set(entities))
            
        except Exception as e:
            self.logger.error(f"提取核心实体失败: {e}")
            return []
    
    def _extract_text_content(self, report: Dict[str, Any]) -> str:
        """从报告中提取文本内容"""
        if report is None:
            return ""
            
        text_fields = ['content', 'summary', 'analysis', 'description', 'text']
        text_content = ""
        
        for field in text_fields:
            if field in report and isinstance(report[field], str):
                text_content += report[field] + " "
        
        return text_content.strip()
    
    def _extract_keywords_from_text(self, text: str) -> List[str]:
        """从文本中提取关键词"""
        try:
            # 简单的关键词提取（可以后续优化为更复杂的NLP方法）
            # 这里使用简单的分词和过滤
            import re
            
            # 中文关键词提取
            chinese_words = re.findall(r'[\u4e00-\u9fff]{2,}', text)
            
            # 过滤掉常见的停用词
            stop_words = {'这个', '那个', '一个', '一些', '可以', '应该', '可能', '或者', '但是', '然而'}
            keywords = [word for word in chinese_words if word not in stop_words and len(word) >= 2]
            
            # 返回前10个最长的关键词
            keywords.sort(key=len, reverse=True)
            return keywords[:10]
            
        except Exception as e:
            self.logger.error(f"从文本提取关键词失败: {e}")
            return []
    
    def _build_consensus_prompt(self, qwen_report: Dict[str, Any], doubao_report: Dict[str, Any]) -> str:
        """构建共识分析Prompt"""
        qwen_content = self._extract_text_content(qwen_report)
        doubao_content = self._extract_text_content(doubao_report)
        
        prompt = f"""
# 任务：分析两份AI报告的共同观点

## Qwen事实归因报告：
{qwen_content}

## 豆包舆情感知报告：
{doubao_content}

## 请分析并总结：
1. 两份报告在哪些方面观点一致？
2. 共同认可的关键事实是什么？
3. 对市场趋势的共同判断是什么？

请用简洁明了的语言，总结出两份报告的共识点，控制在200字以内。
"""
        return prompt
    
    def _build_conflict_prompt(self, qwen_report: Dict[str, Any], doubao_report: Dict[str, Any]) -> str:
        """构建争议分析Prompt"""
        qwen_content = self._extract_text_content(qwen_report)
        doubao_content = self._extract_text_content(doubao_report)
        
        prompt = f"""
# 任务：分析两份AI报告的核心争议点

## Qwen事实归因报告：
{qwen_content}

## 豆包舆情感知报告：
{doubao_content}

## 请分析并总结：
1. 两份报告在哪些方面存在分歧？
2. 核心争议点是什么？
3. 分歧的根本原因是什么？

请用简洁明了的语言，总结出两份报告的核心争议点，控制在200字以内。
"""
        return prompt
    
    def _clean_llm_response(self, response: str) -> str:
        """清理LLM响应结果"""
        try:
            if not response:
                return ""
                
            # 移除多余的空白字符
            response = response.strip()
            
            # 移除可能的JSON格式标记
            if response.startswith('```json'):
                response = response[7:]
            if response.endswith('```'):
                response = response[:-3]
            
            # 再次清理空白字符
            response = response.strip()
            
            # 移除可能的引号
            if response.startswith('"') and response.endswith('"') and len(response) > 2:
                response = response[1:-1]
            elif response.startswith("'") and response.endswith("'") and len(response) > 2:
                response = response[1:-1]
            
            return response.strip()
            
        except Exception as e:
            self.logger.error(f"清理LLM响应失败: {e}")
            return response


# 单元测试
if __name__ == "__main__":
    # 测试用例
    test_qwen_report = {
        "id": "qwen_001",
        "content": "该股票基本面良好，业绩增长稳定，技术指标显示上涨趋势，建议买入。",
        "summary": "基本面良好，技术面看涨",
        "sentiment_score": 0.8,
        "keywords": ["基本面", "业绩增长", "技术指标", "上涨趋势"],
        "entities": ["股票", "技术指标"]
    }
    
    test_doubao_report = {
        "id": "doubao_001", 
        "content": "市场情绪谨慎，投资者观望情绪浓厚，技术面存在回调风险，建议谨慎。",
        "summary": "市场情绪谨慎，存在回调风险",
        "sentiment_score": -0.3,
        "keywords": ["市场情绪", "观望", "回调风险", "谨慎"],
        "entities": ["市场", "投资者"]
    }
    
    # 创建测试配置
    test_config = {
        "llm": {
            "providers": {
                "qwen_plus": {
                    "api_key": "test_key",
                    "base_url": "https://dashscope.aliyuncs.com/api/v1",
                    "model": "qwen-plus"
                }
            },
            "default_provider": "qwen_plus"
        }
    }
    
    # 运行测试
    comparator = ReportComparator(test_config)
    result = comparator.compare_reports(test_qwen_report, test_doubao_report)
    
    print("=== 报告对比测试结果 ===")
    print(f"分歧度分数: {result.divergence_score:.3f}")
    print(f"情感差异: {result.sentiment_diff:.3f}")
    print(f"关键词重合度: {result.keyword_overlap:.3f}")
    print(f"实体差异: {result.entity_diff:.3f}")
    print(f"共识摘要: {result.consensus_summary}")
    print(f"争议摘要: {result.conflict_summary}")
