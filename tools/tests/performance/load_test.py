"""
负载测试 - FastAPI版本
测试系统在高负载下的性能表现
"""

import pytest
from fastapi.testclient import TestClient
import threading
import time
import statistics
import sys
import os

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../packages/backend-python'))

from src.main import app

client = TestClient(app)

class TestLoadPerformance:
    """负载性能测试类"""
    
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_green_phase_concurrent_health_checks(self):
        pass
        """测试并发健康检查"""
        results = []
        errors = []
        
        def make_health_request():
            try:
                start_time = time.time()
                response = client.get("/health")
                end_time = time.time()
                
                results.append({
                    'status_code': response.status_code,
                    'response_time': (end_time - start_time) * 1000,
                    'success': response.status_code == 200
                })
            except Exception as e:
                errors.append(str(e))
        
        # 创建50个并发请求
        threads = []
        for _ in range(50):
            thread = threading.Thread(target=make_health_request)
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 验证结果
        assert len(errors) == 0, f"发现错误: {errors}"
        assert len(results) == 50
        
        # 验证所有请求都成功
        success_count = sum(1 for r in results if r['success'])
        assert success_count == 50, f"只有 {success_count}/50 个请求成功"
        
        # 验证响应时间
        response_times = [r['response_time'] for r in results]
        avg_response_time = statistics.mean(response_times)
        max_response_time = max(response_times)
        
        assert avg_response_time < 1000, f"平均响应时间 {avg_response_time}ms 超过1秒"
        assert max_response_time < 5000, f"最大响应时间 {max_response_time}ms 超过5秒"
    
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_concurrent_api_requests(self):
        pass
        """测试并发API请求"""
        results = []
        errors = []
        
        def make_api_request():
            try:
                start_time = time.time()
                response = client.get("/api/v1/admin/arbitration-cases")
                end_time = time.time()
                
                results.append({
                    'status_code': response.status_code,
                    'response_time': (end_time - start_time) * 1000,
                    'success': response.status_code in [200, 401, 403]
                })
            except Exception as e:
                errors.append(str(e))
        
        # 创建30个并发请求
        threads = []
        for _ in range(30):
            thread = threading.Thread(target=make_api_request)
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 验证结果
        assert len(errors) == 0, f"发现错误: {errors}"
        assert len(results) == 30
        
        # 验证请求成功率
        success_count = sum(1 for r in results if r['success'])
        success_rate = success_count / len(results)
        assert success_rate >= 0.9, f"成功率 {success_rate:.2%} 低于90%"
        
        # 验证响应时间
        response_times = [r['response_time'] for r in results if r['success']]
        if response_times:
            avg_response_time = statistics.mean(response_times)
            max_response_time = max(response_times)
            
            assert avg_response_time < 2000, f"平均响应时间 {avg_response_time}ms 超过2秒"
            assert max_response_time < 10000, f"最大响应时间 {max_response_time}ms 超过10秒"
    
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_sustained_load(self):
        pass
        """测试持续负载"""
        results = []
        errors = []
        
        def make_sustained_request():
            try:
                for _ in range(10):  # 每个线程发送10个请求
                    start_time = time.time()
                    response = client.get("/health")
                    end_time = time.time()
                    
                    results.append({
                        'status_code': response.status_code,
                        'response_time': (end_time - start_time) * 1000,
                        'success': response.status_code == 200
                    })
                    
                    time.sleep(0.1)  # 100ms间隔
            except Exception as e:
                errors.append(str(e))
        
        # 创建10个线程,每个发送10个请求
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=make_sustained_request)
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 验证结果
        assert len(errors) == 0, f"发现错误: {errors}"
        assert len(results) == 100  # 10线程 × 10请求
        
        # 验证成功率
        success_count = sum(1 for r in results if r['success'])
        success_rate = success_count / len(results)
        assert success_rate >= 0.95, f"成功率 {success_rate:.2%} 低于95%"
    
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_mixed_workload(self):
        pass
        """测试混合工作负载"""
        results = []
        errors = []
        
        def health_check_worker():
            try:
                for _ in range(5):
                    start_time = time.time()
                    response = client.get("/health")
                    end_time = time.time()
                    
                    results.append({
                        'type': 'health',
                        'status_code': response.status_code,
                        'response_time': (end_time - start_time) * 1000,
                        'success': response.status_code == 200
                    })
                    time.sleep(0.05)
            except Exception as e:
                errors.append(f"health_check: {e}")
        
        def api_worker():
            try:
                for _ in range(5):
                    start_time = time.time()
                    response = client.get("/api/v1/admin/arbitration-cases")
                    end_time = time.time()
                    
                    results.append({
                        'type': 'api',
                        'status_code': response.status_code,
                        'response_time': (end_time - start_time) * 1000,
                        'success': response.status_code in [200, 401, 403]
                    })
                    time.sleep(0.05)
            except Exception as e:
                errors.append(f"api: {e}")
        
        def data_worker():
            try:
                for _ in range(5):
                    start_time = time.time()
                    response = client.get("/api/v1/data/status")
                    end_time = time.time()
                    
                    results.append({
                        'type': 'data',
                        'status_code': response.status_code,
                        'response_time': (end_time - start_time) * 1000,
                        'success': response.status_code in [200, 401, 403]
                    })
                    time.sleep(0.05)
            except Exception as e:
                errors.append(f"data: {e}")
        
        # 创建混合工作负载
        threads = []
        
        # 5个健康检查线程
        for _ in range(5):
            thread = threading.Thread(target=health_check_worker)
            threads.append(thread)
            thread.start()
        
        # 3个API线程
        for _ in range(3):
            thread = threading.Thread(target=api_worker)
            threads.append(thread)
            thread.start()
        
        # 2个数据线程
        for _ in range(2):
            thread = threading.Thread(target=data_worker)
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 验证结果
        assert len(errors) == 0, f"发现错误: {errors}"
        assert len(results) == 50  # (5+3+2) × 5请求
        
        # 按类型验证成功率
        for request_type in ['health', 'api', 'data']:
            type_results = [r for r in results if r['type'] == request_type]
            success_count = sum(1 for r in type_results if r['success'])
            success_rate = success_count / len(type_results)
            assert success_rate >= 0.9, f"{request_type} 成功率 {success_rate:.2%} 低于90%"
    
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_memory_usage_under_load(self):
        pass
        """测试负载下的内存使用"""
        import psutil
        import os
        
        # 获取当前进程
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        results = []
        
        def memory_test_worker():
            try:
                for _ in range(20):
                    response = client.get("/health")
                    results.append(response.status_code == 200)
            except Exception as e:
                results.append(False)
        
        # 创建多个线程
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=memory_test_worker)
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 检查内存使用
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # 验证内存增长在合理范围内（小于100MB）
        assert memory_increase < 100, f"内存增长 {memory_increase:.2f}MB 超过100MB"
        
        # 验证请求成功率
        success_count = sum(results)
        success_rate = success_count / len(results)
        assert success_rate >= 0.95, f"成功率 {success_rate:.2%} 低于95%"
    
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_response_time_distribution(self):
        pass
        """测试响应时间分布"""
        results = []
        
        def response_time_worker():
            try:
                for _ in range(10):
                    start_time = time.time()
                    response = client.get("/health")
                    end_time = time.time()
                    
                    results.append({
                        'response_time': (end_time - start_time) * 1000,
                        'status_code': response.status_code
                    })
            except Exception as e:
                pass
        
        # 创建多个线程
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=response_time_worker)
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 分析响应时间分布
        response_times = [r['response_time'] for r in results if r['status_code'] == 200]
        
        if response_times:
            avg_time = statistics.mean(response_times)
            median_time = statistics.median(response_times)
            p95_time = sorted(response_times)[int(len(response_times) * 0.95)]
            p99_time = sorted(response_times)[int(len(response_times) * 0.99)]
            
            # 验证响应时间指标
            assert avg_time < 500, f"平均响应时间 {avg_time:.2f}ms 超过500ms"
            assert median_time < 300, f"中位数响应时间 {median_time:.2f}ms 超过300ms"
            assert p95_time < 1000, f"95%响应时间 {p95_time:.2f}ms 超过1000ms"
            assert p99_time < 2000, f"99%响应时间 {p99_time:.2f}ms 超过2000ms"

if __name__ == "__main__":
    pytest.main([__file__])
