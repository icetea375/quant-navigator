"""
第二阶段集成测试：LLM_Gateway -> 真实API
测试目标：验证API Key、网络连接、以及对商业LLM API的调用和认证逻辑是正确的
测试环境：本地MacBook M4，使用成本最低的qwen-flash模型
测试框架：pytest
注意：这个测试会产生真实费用，应该被标记为@pytest.mark.slow
"""

import pytest
import asyncio
import json
import os
import sys
from unittest.mock import patch, MagicMock
from datetime import datetime
import time

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), '../../backend/src'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../../support_modules'))

from llm.LLM_Gateway import LLM_Gateway
from llm.config import UNIFIED_LLM_CONFIG, selectModelForTask
from services.llm import LLMServiceManager


class TestLLMGatewayAPIIntegration:
    """LLM_Gateway与真实API集成测试类"""
    
    @pytest.fixture(scope="class")
    def llm_gateway(self):
        """LLM Gateway实例"""
        return LLM_Gateway()
    
    @pytest.fixture(scope="class")
    def llm_service_manager(self):
        """LLM服务管理器实例"""
        return LLMServiceManager()
    
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_qwen_flash_api_connection(self, llm_gateway):
        """测试通义千问Flash API连接（成本最低）"""
        # 准备测试请求
        request = {
            'id': 'test_001',
            'taskType': 'news_classification',  # 使用成本最低的任务类型
            'prompt': '你好，请简单回复"测试成功"',
            'qualityLevel': 'normal',
            'priority': 1,
            'timestamp': int(time.time()),
            'context': {
                'test_mode': True,
                'max_tokens': 50  # 限制输出长度以降低成本
            }
        }
        
        try:
            # 执行API调用
            response = await llm_gateway.processRequest(request)
            
            # 验证响应结构
            assert response is not None, "API调用应该返回响应"
            assert 'id' in response, "响应应该包含请求ID"
            assert 'content' in response, "响应应该包含内容"
            assert 'model' in response, "响应应该包含模型信息"
            assert 'provider' in response, "响应应该包含提供商信息"
            
            # 验证响应内容
            assert len(response['content']) > 0, "响应内容不应该为空"
            assert '测试' in response['content'] or '成功' in response['content'], \
                f"响应应该包含测试相关内容：{response['content']}"
            
            # 验证模型选择
            assert 'qwen' in response['model'].lower(), f"应该使用通义千问模型：{response['model']}"
            assert 'flash' in response['model'].lower(), f"应该使用Flash版本：{response['model']}"
            
            print(f"✅ API调用成功 - 模型: {response['model']}, 内容: {response['content']}")
            
        except Exception as e:
            pytest.fail(f"API调用失败：{e}")
    
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_api_key_authentication(self, llm_service_manager):
        """测试API Key认证"""
        # 检查环境变量中的API Key
        qwen_api_key = os.getenv('QWEN_API_KEY')
        assert qwen_api_key is not None, "QWEN_API_KEY环境变量应该设置"
        assert len(qwen_api_key) > 10, "API Key应该有足够的长度"
        
        # 测试API Key格式
        assert qwen_api_key.startswith('sk-'), f"API Key应该以'sk-'开头：{qwen_api_key[:10]}..."
        
        print(f"✅ API Key认证检查通过 - Key前缀: {qwen_api_key[:10]}...")
    
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_network_connectivity(self, llm_gateway):
        """测试网络连接"""
        import aiohttp
        
        # 测试网络连接
        qwen_base_url = UNIFIED_LLM_CONFIG['qwen']['baseUrl']
        
        try:
            async with aiohttp.ClientSession() as session:
                # 测试基本连接
                async with session.get(qwen_base_url, timeout=10) as response:
                    assert response.status in [200, 401, 403], \
                        f"API端点应该可访问，状态码：{response.status}"
                
                print(f"✅ 网络连接测试通过 - 端点: {qwen_base_url}")
                
        except Exception as e:
            pytest.fail(f"网络连接测试失败：{e}")
    
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_model_selection_logic(self, llm_gateway):
        """测试模型选择逻辑"""
        # 测试不同任务类型的模型选择
        test_cases = [
            {
                'taskType': 'news_classification',
                'expected_model_prefix': 'qwen3-flash',
                'expected_provider': 'qwen'
            },
            {
                'taskType': 'mda_extraction',
                'expected_model_prefix': 'qwen3-plus',
                'expected_provider': 'qwen'
            }
        ]
        
        for case in test_cases:
            # 获取模型选择
            model_selection = selectModelForTask(case['taskType'], 'normal', True)
            
            assert model_selection is not None, f"应该为{case['taskType']}选择模型"
            assert case['expected_provider'] in model_selection['provider'], \
                f"应该选择{case['expected_provider']}提供商"
            assert case['expected_model_prefix'] in model_selection['model'], \
                f"应该选择{case['expected_model_prefix']}模型"
            
            print(f"✅ 模型选择测试通过 - 任务: {case['taskType']}, 模型: {model_selection['model']}")
    
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_cost_estimation_accuracy(self, llm_gateway):
        """测试成本估算准确性"""
        # 准备测试请求
        request = {
            'id': 'test_cost_001',
            'taskType': 'news_classification',
            'prompt': '这是一个测试提示词，用于验证成本估算功能。',
            'qualityLevel': 'normal',
            'priority': 1,
            'timestamp': int(time.time())
        }
        
        # 获取模型选择
        model_selection = selectModelForTask(request['taskType'], request['qualityLevel'], True)
        
        # 估算成本
        estimated_cost = llm_gateway.estimateCost(request, model_selection)
        
        # 验证成本估算
        assert estimated_cost is not None, "应该能够估算成本"
        assert estimated_cost['totalCost'] >= 0, "成本应该大于等于0"
        assert estimated_cost['inputCost'] >= 0, "输入成本应该大于等于0"
        assert estimated_cost['outputCost'] >= 0, "输出成本应该大于等于0"
        
        print(f"✅ 成本估算测试通过 - 总成本: {estimated_cost['totalCost']:.6f}元")
    
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_error_handling_and_retry_logic(self, llm_gateway):
        """测试错误处理和重试逻辑"""
        # 准备无效请求（触发错误）
        invalid_request = {
            'id': 'test_error_001',
            'taskType': 'invalid_task_type',  # 无效的任务类型
            'prompt': '测试错误处理',
            'qualityLevel': 'normal',
            'priority': 1,
            'timestamp': int(time.time())
        }
        
        try:
            # 执行无效请求
            response = await llm_gateway.processRequest(invalid_request)
            pytest.fail("无效请求应该抛出异常")
        except Exception as e:
            # 验证错误处理
            assert "invalid_task_type" in str(e) or "无法为任务类型" in str(e), \
                f"应该抛出任务类型相关的错误：{e}"
            print(f"✅ 错误处理测试通过 - 错误: {e}")
    
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_response_time_performance(self, llm_gateway):
        """测试响应时间性能"""
        # 准备测试请求
        request = {
            'id': 'test_perf_001',
            'taskType': 'news_classification',
            'prompt': '请简单回复"性能测试"',
            'qualityLevel': 'normal',
            'priority': 1,
            'timestamp': int(time.time()),
            'context': {
                'max_tokens': 20  # 限制输出长度
            }
        }
        
        # 测量响应时间
        start_time = time.time()
        response = await llm_gateway.processRequest(request)
        end_time = time.time()
        
        response_time = end_time - start_time
        
        # 验证性能要求（API调用<30秒）
        assert response_time < 30.0, f"API响应时间过长：{response_time:.2f}秒"
        assert response is not None, "应该返回有效响应"
        
        print(f"✅ 性能测试通过 - 响应时间: {response_time:.2f}秒")
    
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_batch_processing_capability(self, llm_gateway):
        """测试批处理能力"""
        # 准备批处理请求
        batch_requests = []
        for i in range(3):  # 小批量测试
            batch_requests.append({
                'id': f'batch_test_{i:03d}',
                'taskType': 'news_classification',
                'prompt': f'批处理测试 {i+1}',
                'qualityLevel': 'normal',
                'priority': 1,
                'timestamp': int(time.time()),
                'context': {'max_tokens': 20}
            })
        
        # 执行批处理
        start_time = time.time()
        responses = []
        for request in batch_requests:
            try:
                response = await llm_gateway.processRequest(request)
                responses.append(response)
            except Exception as e:
                print(f"批处理请求 {request['id']} 失败：{e}")
        
        end_time = time.time()
        batch_time = end_time - start_time
        
        # 验证批处理结果
        assert len(responses) > 0, "应该至少有一个成功的批处理响应"
        assert batch_time < 60.0, f"批处理时间过长：{batch_time:.2f}秒"
        
        print(f"✅ 批处理测试通过 - 成功: {len(responses)}/{len(batch_requests)}, 时间: {batch_time:.2f}秒")
    
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_chinese_text_processing(self, llm_gateway):
        """测试中文文本处理"""
        # 准备中文测试请求
        chinese_request = {
            'id': 'test_chinese_001',
            'taskType': 'news_classification',
            'prompt': '请分析以下新闻的重要性：贵州茅台发布2024年业绩预告，预计净利润同比增长15%。',
            'qualityLevel': 'normal',
            'priority': 1,
            'timestamp': int(time.time()),
            'context': {'max_tokens': 100}
        }
        
        try:
            # 执行中文请求
            response = await llm_gateway.processRequest(chinese_request)
            
            # 验证中文处理
            assert response is not None, "中文请求应该返回响应"
            assert len(response['content']) > 0, "中文响应内容不应该为空"
            
            # 验证响应包含中文
            chinese_chars = sum(1 for char in response['content'] if '\u4e00' <= char <= '\u9fff')
            assert chinese_chars > 0, f"响应应该包含中文字符：{response['content']}"
            
            print(f"✅ 中文处理测试通过 - 响应: {response['content'][:50]}...")
            
        except Exception as e:
            pytest.fail(f"中文处理测试失败：{e}")
    
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_rate_limiting_handling(self, llm_gateway):
        """测试速率限制处理"""
        # 准备快速连续请求
        rapid_requests = []
        for i in range(5):  # 5个快速请求
            rapid_requests.append({
                'id': f'rate_test_{i:03d}',
                'taskType': 'news_classification',
                'prompt': f'速率限制测试 {i+1}',
                'qualityLevel': 'normal',
                'priority': 1,
                'timestamp': int(time.time()),
                'context': {'max_tokens': 10}
            })
        
        # 执行快速连续请求
        start_time = time.time()
        responses = []
        errors = []
        
        for request in rapid_requests:
            try:
                response = await llm_gateway.processRequest(request)
                responses.append(response)
                # 添加小延迟避免过于频繁的请求
                await asyncio.sleep(0.5)
            except Exception as e:
                errors.append(str(e))
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # 验证速率限制处理
        success_rate = len(responses) / len(rapid_requests)
        assert success_rate >= 0.6, f"成功率应该至少60%：{success_rate:.2%}"
        
        print(f"✅ 速率限制测试通过 - 成功率: {success_rate:.2%}, 总时间: {total_time:.2f}秒")
    
    def test_environment_variables_validation(self):
        """测试环境变量验证"""
        # 检查必要的环境变量
        required_vars = ['QWEN_API_KEY']
        optional_vars = ['QWEN_BASE_URL', 'LLM_TIMEOUT', 'LLM_MAX_RETRIES']
        
        # 验证必需的环境变量
        for var in required_vars:
            value = os.getenv(var)
            assert value is not None, f"环境变量 {var} 应该设置"
            assert len(value) > 0, f"环境变量 {var} 不应该为空"
            print(f"✅ 环境变量 {var} 检查通过")
        
        # 验证可选的环境变量
        for var in optional_vars:
            value = os.getenv(var)
            if value is not None:
                print(f"✅ 环境变量 {var} 已设置: {value}")
            else:
                print(f"ℹ️ 环境变量 {var} 未设置，将使用默认值")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-m', 'slow'])
