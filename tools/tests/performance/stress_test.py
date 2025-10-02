"""
压力测试 - FastAPI版本
测试系统在极限负载下的稳定性和恢复能力
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

class TestStressPerformance:
    """压力性能测试类"""
    
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_green_phase_high_concurrency_stress(self):
        pass
        """测试高并发压力"""
        results = []
        errors = []
        
        def stress_worker(worker_id):
            try:
                for i in range(20):  # 每个线程发送20个请求
                    start_time = time.time()
                    response = client.get("/health")
                    end_time = time.time()
                    
                    results.append({
                        'worker_id': worker_id,
                        'request_id': i,
                        'status_code': response.status_code,
                        'response_time': (end_time - start_time) * 1000,
                        'success': response.status_code == 200,
                        'timestamp': time.time()
                    })
                    
                    # 短暂延迟避免过于密集的请求
                    time.sleep(0.01)
            except Exception as e:
                errors.append(f"Worker {worker_id}: {e}")
        
        # 创建100个并发线程
        threads = []
        for i in range(100):
            thread = threading.Thread(target=stress_worker, args=(i,))
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 验证结果
        print(f"总请求数: {len(results)}")
        print(f"错误数: {len(errors)}")
        
        if errors:
            print(f"错误详情: {errors[:5]}")  # 只显示前5个错误
        
        # 验证请求成功率（允许一定的失败率）
        success_count = sum(1 for r in results if r['success'])
        success_rate = success_count / len(results) if results else 0
        assert success_rate >= 0.8, f"成功率 {success_rate:.2%} 低于80%"
        
        # 验证响应时间（在压力下允许更长的响应时间）
        response_times = [r['response_time'] for r in results if r['success']]
        if response_times:
            avg_time = statistics.mean(response_times)
            max_time = max(response_times)
            
            assert avg_time < 5000, f"平均响应时间 {avg_time:.2f}ms 超过5秒"
            assert max_time < 30000, f"最大响应时间 {max_time:.2f}ms 超过30秒"
    
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_burst_traffic_stress(self):
        pass
        """测试突发流量压力"""
        results = []
        
        def burst_worker():
            try:
                # 突发发送10个请求
                for _ in range(10):
                    start_time = time.time()
                    response = client.get("/api/v1/admin/arbitration-cases")
                    end_time = time.time()
                    
                    results.append({
                        'status_code': response.status_code,
                        'response_time': (end_time - start_time) * 1000,
                        'success': response.status_code in [200, 401, 403]
                    })
            except Exception as e:
                results.append({
                    'status_code': 0,
                    'response_time': 0,
                    'success': False,
                    'error': str(e)
                })
        
        # 同时启动50个突发线程
        threads = []
        for _ in range(50):
            thread = threading.Thread(target=burst_worker)
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 验证结果
        success_count = sum(1 for r in results if r['success'])
        success_rate = success_count / len(results)
        
        # 在突发流量下,允许较低的成功率
        assert success_rate >= 0.7, f"突发流量成功率 {success_rate:.2%} 低于70%"
        
        # 验证系统没有完全崩溃
        assert len(results) > 0, "系统在突发流量下完全无响应"
    
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_memory_stress(self):
        pass
        """测试内存压力"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        results = []
        
        def memory_stress_worker():
            try:
                # 发送大量请求测试内存使用
                for _ in range(50):
                    response = client.get("/health")
                    results.append(response.status_code == 200)
                    
                    # 创建一些临时数据增加内存压力
                    temp_data = [i for i in range(1000)]
                    del temp_data
            except Exception as e:
                results.append(False)
        
        # 创建多个线程
        threads = []
        for _ in range(20):
            thread = threading.Thread(target=memory_stress_worker)
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 检查内存使用
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # 验证内存增长在合理范围内
        assert memory_increase < 200, f"内存增长 {memory_increase:.2f}MB 超过200MB"
        
        # 验证系统仍然响应
        success_count = sum(results)
        assert success_count > 0, "系统在内存压力下无响应"
    
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_connection_stress(self):
        pass
        """测试连接压力"""
        results = []
        
        def connection_worker():
            try:
                # 快速连续发送请求
                for _ in range(30):
                    start_time = time.time()
                    response = client.get("/health")
                    end_time = time.time()
                    
                    results.append({
                        'status_code': response.status_code,
                        'response_time': (end_time - start_time) * 1000,
                        'success': response.status_code == 200
                    })
                    
                    # 极短延迟
                    time.sleep(0.001)
            except Exception as e:
                results.append({
                    'status_code': 0,
                    'response_time': 0,
                    'success': False,
                    'error': str(e)
                })
        
        # 创建大量连接
        threads = []
        for _ in range(200):
            thread = threading.Thread(target=connection_worker)
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 验证结果
        success_count = sum(1 for r in results if r['success'])
        success_rate = success_count / len(results) if results else 0
        
        # 在连接压力下,允许较低的成功率
        assert success_rate >= 0.6, f"连接压力成功率 {success_rate:.2%} 低于60%"
        
        # 验证系统没有完全崩溃
        assert len(results) > 0, "系统在连接压力下完全无响应"
    
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_error_recovery_stress(self):
        pass
        """测试错误恢复压力"""
        results = []
        
        def error_recovery_worker():
            try:
                # 混合正常请求和可能导致错误的请求
                for i in range(20):
                    if i % 3 == 0:
                        # 正常请求
                        response = client.get("/health")
                    elif i % 3 == 1:
                        # 可能返回404的请求
                        response = client.get("/api/v1/non-existent")
                    else:
                        # 可能返回400的请求
                        response = client.post("/api/v1/ai/analyze", json={})
                    
                    results.append({
                        'status_code': response.status_code,
                        'success': response.status_code in [200, 400, 404, 422]
                    })
            except Exception as e:
                results.append({
                    'status_code': 0,
                    'success': False,
                    'error': str(e)
                })
        
        # 创建多个线程
        threads = []
        for _ in range(30):
            thread = threading.Thread(target=error_recovery_worker)
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 验证结果
        success_count = sum(1 for r in results if r['success'])
        success_rate = success_count / len(results) if results else 0
        
        # 在错误恢复压力下,允许较低的成功率
        assert success_rate >= 0.5, f"错误恢复成功率 {success_rate:.2%} 低于50%"
        
        # 验证系统能够处理错误并继续运行
        assert len(results) > 0, "系统在错误恢复压力下无响应"
    
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_sustained_stress(self):
        pass
        """测试持续压力"""
        results = []
        start_time = time.time()
        
        def sustained_worker():
            try:
                while time.time() - start_time < 30:  # 持续30秒
                    response = client.get("/health")
                    results.append({
                        'status_code': response.status_code,
                        'success': response.status_code == 200,
                        'timestamp': time.time()
                    })
                    time.sleep(0.1)  # 100ms间隔
            except Exception as e:
                results.append({
                    'status_code': 0,
                    'success': False,
                    'error': str(e),
                    'timestamp': time.time()
                })
        
        # 创建持续工作线程
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=sustained_worker)
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 验证结果
        success_count = sum(1 for r in results if r['success'])
        success_rate = success_count / len(results) if results else 0
        
        # 在持续压力下,要求较高的成功率
        assert success_rate >= 0.9, f"持续压力成功率 {success_rate:.2%} 低于90%"
        
        # 验证系统能够持续运行
        assert len(results) > 100, f"持续压力下请求数 {len(results)} 过少"
    
    # TODO: 简化复杂测试逻辑,拆分为多个简单测试
def test_resource_exhaustion_stress(self):
        pass
        """测试资源耗尽压力"""
        results = []
        
        def resource_exhaustion_worker():
            try:
                # 发送大量请求消耗资源
                for _ in range(100):
                    response = client.get("/api/v1/data/status")
                    results.append({
                        'status_code': response.status_code,
                        'success': response.status_code in [200, 401, 403]
                    })
            except Exception as e:
                results.append({
                    'status_code': 0,
                    'success': False,
                    'error': str(e)
                })
        
        # 创建大量线程消耗资源
        threads = []
        for _ in range(50):
            thread = threading.Thread(target=resource_exhaustion_worker)
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 验证结果
        success_count = sum(1 for r in results if r['success'])
        success_rate = success_count / len(results) if results else 0
        
        # 在资源耗尽压力下,允许较低的成功率
        assert success_rate >= 0.3, f"资源耗尽成功率 {success_rate:.2%} 低于30%"
        
        # 验证系统没有完全崩溃
        assert len(results) > 0, "系统在资源耗尽压力下完全无响应"

if __name__ == "__main__":
    pytest.main([__file__])
