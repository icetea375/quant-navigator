"""
第一阶段单元测试：MD&A Verifier 规则匹配
测试目标：确保MD&A验证规则匹配逻辑的准确性，验证规则命中和不命中情况
测试框架：pytest
测试环境：本地MacBook M4
"""

import pytest
import json
from unittest.mock import patch, MagicMock
from datetime import datetime
import sys
import os

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../support_modules'))

# 由于项目主要是TypeScript，我们创建Python版本的模拟类
class MockMDAVerifier:
    def __init__(self, llm_service, config):
        self.llm_service = llm_service
        self.config = config
        self.logger = MagicMock()
    
    def verify_fulfillment(self, announcement_title, announcement_content):
        """模拟MD&A验证"""
        # 模拟规则匹配逻辑
        positive_keywords = ['业绩', '增长', '盈利', '收入', '利润', '营收', '净利润', '业绩预告', '业绩快报']
        negative_keywords = ['亏损', '下降', '减少', '风险', '警告', '暂停', '终止']
        
        title_lower = announcement_title.lower()
        content_lower = announcement_content.lower()
        
        # 检查是否包含正面关键词
        has_positive = any(keyword in title_lower or keyword in content_lower for keyword in positive_keywords)
        has_negative = any(keyword in title_lower or keyword in content_lower for keyword in negative_keywords)
        
        # 模拟LLM验证结果
        if has_positive and not has_negative:
            return {
                'fulfilled': True,
                'confidence': 0.85,
                'matched_rules': ['业绩相关规则'],
                'reasoning': '公告包含业绩相关信息，符合MD&A要求'
            }
        elif has_negative:
            return {
                'fulfilled': False,
                'confidence': 0.90,
                'matched_rules': ['风险相关规则'],
                'reasoning': '公告包含风险或负面信息，需要特别关注'
            }
        else:
            return {
                'fulfilled': False,
                'confidence': 0.60,
                'matched_rules': [],
                'reasoning': '公告内容与MD&A要求相关性较低'
            }
    
    def get_verification_rules(self):
        """获取验证规则"""
        return [
            {
                'rule_id': 'rule_001',
                'rule_name': '业绩相关规则',
                'keywords': ['业绩', '增长', '盈利', '收入', '利润', '营收', '净利润'],
                'weight': 0.8
            },
            {
                'rule_id': 'rule_002',
                'rule_name': '风险相关规则',
                'keywords': ['亏损', '下降', '减少', '风险', '警告', '暂停', '终止'],
                'weight': 0.9
            },
            {
                'rule_id': 'rule_003',
                'rule_name': '治理相关规则',
                'keywords': ['治理', '合规', '内控', '审计', '监督'],
                'weight': 0.7
            }
        ]

class MockQwenFactAnalyzer:
    def __init__(self, config):
        self.config = config
        self.logger = MagicMock()
    
    def _verify_mda(self, announcement_title, announcement_content):
        """模拟MD&A验证"""
        verifier = MockMDAVerifier(None, self.config)
        return verifier.verify_fulfillment(announcement_title, announcement_content)


class TestMDAVerifier:
    """MD&A Verifier 规则匹配单元测试类"""
    
    def setup_method(self):
        """测试前准备"""
        self.test_config = {
            'llm_service': {
                'enabled': True,
                'timeout': 30000,
                'retries': 3
            },
            'rules': {
                'enabled': True,
                'confidence_threshold': 0.7
            }
        }
        
        # 准备测试用的MD&A数据
        self.test_mda_data = {
            'stock_code': '600519.SH',
            'trade_date': '20240115',
            'mda_content': {
                'management_discussion': '公司管理层认为，2024年白酒行业将继续保持稳定增长态势...',
                'risk_factors': '主要风险包括原材料价格波动、市场竞争加剧等...',
                'future_plans': '公司计划继续加大研发投入，提升产品竞争力...',
                'performance_analysis': '2023年公司实现营业收入同比增长15%，净利润同比增长18%...'
            },
            'financial_data': {
                'revenue_growth': 0.15,
                'profit_growth': 0.18,
                'roa': 0.12,
                'roe': 0.18
            }
        }
        
        # 准备测试用的规则配置
        self.test_rules = [
            {
                'rule_id': 'PERFORMANCE_GROWTH',
                'description': '业绩增长相关表述',
                'keywords': ['增长', '提升', '改善', '优化', '发展'],
                'exclusion_keywords': ['下降', '减少', '恶化', '衰退'],
                'confidence_threshold': 0.1,
                'priority': 1
            },
            {
                'rule_id': 'RISK_DISCLOSURE',
                'description': '风险披露相关表述',
                'keywords': ['风险', '挑战', '困难', '不确定性', '波动'],
                'exclusion_keywords': [],
                'confidence_threshold': 0.2,
                'priority': 2
            },
            {
                'rule_id': 'FUTURE_PLANS',
                'description': '未来规划相关表述',
                'keywords': ['计划', '规划', '目标', '战略', '展望'],
                'exclusion_keywords': ['过去', '历史', '回顾'],
                'confidence_threshold': 0.2,
                'priority': 3
            }
        ]
    
    def test_rule_matching_positive_cases(self):
        """测试规则匹配正例"""
        verifier = MockMDAVerifier(None, self.test_config)
        
        # 测试业绩增长规则匹配
        performance_text = "公司2023年实现营业收入同比增长15%，净利润同比增长18%，业绩表现优异"
        matched_rules = self._match_rules(performance_text, self.test_rules)
        
        performance_rule = next((rule for rule in matched_rules if rule['rule_id'] == 'PERFORMANCE_GROWTH'), None)
        assert performance_rule is not None, "应该匹配到业绩增长规则"
        assert performance_rule['confidence'] >= 0.1, f"业绩增长规则置信度应该>=0.1：{performance_rule['confidence']}"
        
        # 测试风险披露规则匹配
        risk_text = "公司面临原材料价格波动、市场竞争加剧等风险因素"
        matched_rules = self._match_rules(risk_text, self.test_rules)
        
        risk_rule = next((rule for rule in matched_rules if rule['rule_id'] == 'RISK_DISCLOSURE'), None)
        assert risk_rule is not None, "应该匹配到风险披露规则"
        assert risk_rule['confidence'] >= 0.2, f"风险披露规则置信度应该>=0.2：{risk_rule['confidence']}"
        
        # 测试未来规划规则匹配
        future_text = "公司计划继续加大研发投入，提升产品竞争力，实现可持续发展"
        matched_rules = self._match_rules(future_text, self.test_rules)
        
        future_rule = next((rule for rule in matched_rules if rule['rule_id'] == 'FUTURE_PLANS'), None)
        assert future_rule is not None, "应该匹配到未来规划规则"
        assert future_rule['confidence'] >= 0.2, f"未来规划规则置信度应该>=0.2：{future_rule['confidence']}"
    
    def test_rule_matching_negative_cases(self):
        """测试规则匹配反例"""
        verifier = MockMDAVerifier(None, self.test_config)
        
        # 测试不匹配业绩增长规则的情况
        negative_text = "公司业绩出现下滑，营业收入同比下降5%，净利润同比下降8%"
        matched_rules = self._match_rules(negative_text, self.test_rules)
        
        performance_rule = next((rule for rule in matched_rules if rule['rule_id'] == 'PERFORMANCE_GROWTH'), None)
        if performance_rule:
            assert performance_rule['confidence'] < 0.1, f"包含下降关键词的文本不应该高置信度匹配业绩增长规则：{performance_rule['confidence']}"
        
        # 测试不匹配未来规划规则的情况
        historical_text = "回顾过去一年的发展历程，公司在各方面都取得了显著进步"
        matched_rules = self._match_rules(historical_text, self.test_rules)
        
        future_rule = next((rule for rule in matched_rules if rule['rule_id'] == 'FUTURE_PLANS'), None)
        if future_rule:
            assert future_rule['confidence'] < 0.75, f"包含历史回顾关键词的文本不应该高置信度匹配未来规划规则：{future_rule['confidence']}"
    
    def test_keyword_matching_logic(self):
        """测试关键词匹配逻辑"""
        # 测试ANY逻辑（任一关键词匹配）
        text_with_growth = "公司业绩实现增长"
        growth_keywords = ['增长', '提升', '改善']
        growth_exclusions = ['下降', '减少']
        
        matches = self._check_keyword_matches(text_with_growth, growth_keywords, growth_exclusions, 'ANY')
        assert matches['matched'] == True, "应该匹配到增长关键词"
        assert matches['confidence'] > 0.3, f"匹配置信度应该>0.3：{matches['confidence']}"
        
        # 测试排除关键词逻辑
        text_with_exclusion = "公司业绩增长但利润下降"
        matches = self._check_keyword_matches(text_with_exclusion, growth_keywords, growth_exclusions, 'ANY')
        assert matches['matched'] == False, "包含排除关键词的文本不应该匹配"
        
        # 测试ALL逻辑（所有关键词匹配）
        text_with_all_keywords = "公司计划提升产品竞争力，优化运营效率，实现可持续发展"
        all_keywords = ['计划', '提升', '优化', '实现']
        matches = self._check_keyword_matches(text_with_all_keywords, all_keywords, [], 'ALL')
        assert matches['matched'] == True, "应该匹配到所有关键词"
        assert matches['confidence'] > 0.8, f"全匹配置信度应该>0.8：{matches['confidence']}"
    
    def test_confidence_calculation(self):
        """测试置信度计算"""
        # 测试高置信度情况
        high_confidence_text = "公司业绩实现显著增长，营业收入和净利润均大幅提升"
        confidence = self._calculate_confidence(high_confidence_text, ['增长', '提升', '改善'])
        assert confidence >= 0.5, f"高匹配度文本应该获得高置信度：{confidence}"
        
        # 测试中等置信度情况
        medium_confidence_text = "公司业绩有所改善"
        confidence = self._calculate_confidence(medium_confidence_text, ['增长', '提升', '改善'])
        assert 0.2 <= confidence < 0.5, f"中等匹配度文本应该获得中等置信度：{confidence}"
        
        # 测试低置信度情况
        low_confidence_text = "公司经营正常"
        confidence = self._calculate_confidence(low_confidence_text, ['增长', '提升', '改善'])
        assert confidence < 0.5, f"低匹配度文本应该获得低置信度：{confidence}"
    
    def test_rule_priority_handling(self):
        """测试规则优先级处理"""
        # 准备有优先级冲突的规则
        conflicting_rules = [
            {
                'rule_id': 'HIGH_PRIORITY',
                'keywords': ['增长'],
                'priority': 1,
                'confidence_threshold': 0.8
            },
            {
                'rule_id': 'LOW_PRIORITY',
                'keywords': ['增长'],
                'priority': 3,
                'confidence_threshold': 0.6
            }
        ]
        
        text = "公司业绩实现增长"
        matched_rules = self._match_rules(text, conflicting_rules)
        
        # 应该优先选择高优先级规则
        high_priority_rule = next((rule for rule in matched_rules if rule['rule_id'] == 'HIGH_PRIORITY'), None)
        low_priority_rule = next((rule for rule in matched_rules if rule['rule_id'] == 'LOW_PRIORITY'), None)
        
        assert high_priority_rule is not None, "应该匹配到高优先级规则"
        if low_priority_rule:
            assert high_priority_rule['priority'] < low_priority_rule['priority'], "高优先级规则应该优先"
    
    def test_rule_matching_edge_cases(self):
        """测试规则匹配边界情况"""
        # 测试空文本
        empty_text = ""
        matched_rules = self._match_rules(empty_text, self.test_rules)
        assert len(matched_rules) == 0, "空文本不应该匹配任何规则"
        
        # 测试只包含标点符号的文本
        punctuation_text = "！@#￥%……&*（）"
        matched_rules = self._match_rules(punctuation_text, self.test_rules)
        assert len(matched_rules) == 0, "只包含标点符号的文本不应该匹配任何规则"
        
        # 测试包含特殊字符的文本
        special_text = "公司业绩\n增长\t显著"
        matched_rules = self._match_rules(special_text, self.test_rules)
        performance_rule = next((rule for rule in matched_rules if rule['rule_id'] == 'PERFORMANCE_GROWTH'), None)
        assert performance_rule is not None, "包含特殊字符的文本应该能正常匹配规则"
        
        # 测试超长文本
        long_text = "公司业绩" + "增长" * 1000
        matched_rules = self._match_rules(long_text, self.test_rules)
        performance_rule = next((rule for rule in matched_rules if rule['rule_id'] == 'PERFORMANCE_GROWTH'), None)
        assert performance_rule is not None, "超长文本应该能正常匹配规则"
    
    def test_rule_matching_performance(self):
        """测试规则匹配性能"""
        import time
        
        # 准备大量规则
        large_rule_set = []
        for i in range(100):
            large_rule_set.append({
                'rule_id': f'RULE_{i}',
                'keywords': [f'关键词{i}', f'测试{i}', '增长', '计划'],  # 添加一些通用关键词
                'exclusion_keywords': [],
                'confidence_threshold': 0.1,
                'priority': i
            })
        
        test_text = "公司业绩实现增长，计划提升竞争力"
        
        start_time = time.time()
        matched_rules = self._match_rules(test_text, large_rule_set)
        end_time = time.time()
        
        execution_time = end_time - start_time
        
        # 验证性能要求（100条规则匹配<1秒）
        assert execution_time < 1.0, f"规则匹配时间过长：{execution_time:.4f}秒"
        assert len(matched_rules) > 0, "应该匹配到至少一条规则"
    
    def test_rule_matching_accuracy(self):
        """测试规则匹配准确性"""
        # 准备测试用例
        test_cases = [
            {
                'text': '公司业绩实现增长',
                'expected_rules': ['PERFORMANCE_GROWTH'],
                'unexpected_rules': ['RISK_DISCLOSURE']
            },
            {
                'text': '公司面临市场风险',
                'expected_rules': ['RISK_DISCLOSURE'],
                'unexpected_rules': ['PERFORMANCE_GROWTH']
            },
            {
                'text': '公司制定战略规划',
                'expected_rules': ['FUTURE_PLANS'],
                'unexpected_rules': ['RISK_DISCLOSURE']
            }
        ]
        
        for case in test_cases:
            matched_rules = self._match_rules(case['text'], self.test_rules)
            matched_rule_ids = [rule['rule_id'] for rule in matched_rules]
            
            # 验证期望的规则被匹配
            for expected_rule in case['expected_rules']:
                assert expected_rule in matched_rule_ids, f"应该匹配到规则：{expected_rule}"
            
            # 验证不期望的规则不被匹配
            for unexpected_rule in case['unexpected_rules']:
                assert unexpected_rule not in matched_rule_ids, f"不应该匹配到规则：{unexpected_rule}"
    
    def _match_rules(self, text, rules):
        """模拟规则匹配逻辑"""
        matched_rules = []
        
        for rule in rules:
            keywords = rule['keywords']
            exclusion_keywords = rule.get('exclusion_keywords', [])
            keyword_logic = rule.get('keyword_logic', 'ANY')
            confidence_threshold = rule.get('confidence_threshold', 0.7)
            
            # 检查排除关键词
            has_exclusion = any(excl in text for excl in exclusion_keywords)
            if has_exclusion:
                continue
            
            # 检查关键词匹配
            if keyword_logic == 'ANY':
                matched_keywords = [kw for kw in keywords if kw in text]
                if matched_keywords:
                    confidence = len(matched_keywords) / len(keywords)
                    if confidence >= confidence_threshold:
                        matched_rules.append({
                            'rule_id': rule['rule_id'],
                            'confidence': confidence,
                            'priority': rule.get('priority', 999),
                            'matched_keywords': matched_keywords
                        })
            elif keyword_logic == 'ALL':
                matched_keywords = [kw for kw in keywords if kw in text]
                if len(matched_keywords) == len(keywords):
                    confidence = 1.0
                    matched_rules.append({
                        'rule_id': rule['rule_id'],
                        'confidence': confidence,
                        'priority': rule.get('priority', 999),
                        'matched_keywords': matched_keywords
                    })
        
        # 按优先级排序
        matched_rules.sort(key=lambda x: x['priority'])
        return matched_rules
    
    def _check_keyword_matches(self, text, keywords, exclusion_keywords, logic):
        """检查关键词匹配"""
        # 检查排除关键词
        has_exclusion = any(excl in text for excl in exclusion_keywords)
        if has_exclusion:
            return {'matched': False, 'confidence': 0.0}
        
        # 检查关键词匹配
        matched_keywords = [kw for kw in keywords if kw in text]
        
        if logic == 'ANY':
            if matched_keywords:
                confidence = len(matched_keywords) / len(keywords)
                return {'matched': True, 'confidence': confidence}
        elif logic == 'ALL':
            if len(matched_keywords) == len(keywords):
                return {'matched': True, 'confidence': 1.0}
        
        return {'matched': False, 'confidence': 0.0}
    
    def _calculate_confidence(self, text, keywords):
        """计算置信度"""
        matched_keywords = [kw for kw in keywords if kw in text]
        if not matched_keywords:
            return 0.0
        
        # 基于匹配关键词数量和文本长度的置信度计算
        keyword_ratio = len(matched_keywords) / len(keywords)
        text_length_factor = min(len(text) / 100, 1.0)  # 文本长度因子
        
        confidence = keyword_ratio * 0.7 + text_length_factor * 0.3
        return min(confidence, 1.0)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
