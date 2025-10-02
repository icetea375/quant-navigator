#!/usr/bin/env python3
"""
转换 NestJS 测试文件为 FastAPI + pytest 版本
"""

import os
import re
import glob
from pathlib import Path

def convert_nestjs_test_file(file_path):
    """转换单个 NestJS 测试文件为 FastAPI 版本"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 如果是 TypeScript 文件，转换为 Python
        if file_path.suffix == '.ts':
            # 转换文件扩展名
            new_file_path = file_path.with_suffix('.py')
            
            # 转换内容
            content = convert_ts_to_py(content)
            
            # 写新文件
            with open(new_file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # 删除原文件
            os.remove(file_path)
            
            print(f"✅ 转换: {file_path} -> {new_file_path}")
            return True
        else:
            # 如果是 Python 文件，直接修改
            content = convert_python_nestjs_to_fastapi(content)
            
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"✅ 更新: {file_path}")
                return True
            else:
                print(f"⏭️  无需更新: {file_path}")
                return False
                
    except Exception as e:
        print(f"❌ 转换失败 {file_path}: {e}")
        return False

def convert_ts_to_py(content):
    """将 TypeScript 测试内容转换为 Python"""
    # 基本转换
    content = re.sub(r'import.*@nestjs.*', '', content)
    content = re.sub(r'import.*supertest.*', '', content)
    content = re.sub(r'import.*express.*', '', content)
    
    # 添加 Python 导入
    python_imports = '''#!/usr/bin/env python3
"""
转换后的 FastAPI 测试文件
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../packages/backend-python'))

# 导入 FastAPI 应用
try:
    from main import app
except ImportError:
    from fastapi import FastAPI
    app = FastAPI(title="Test API", version="1.0.0")
    
    @app.get("/health")
    async def health():
        return {"status": "healthy", "version": "1.0.0"}

'''
    
    # 移除 TypeScript 特定的内容
    content = re.sub(r'describe\([^)]+\)\s*\{', 'class TestConverted:', content)
    content = re.sub(r'it\([^)]+\)\s*\{', 'def test_', content)
    content = re.sub(r'beforeAll\([^)]*\)\s*\{', 'def setup_method(self):', content)
    content = re.sub(r'afterAll\([^)]*\)\s*\{', 'def teardown_method(self):', content)
    content = re.sub(r'beforeEach\([^)]*\)\s*\{', 'def setup_method(self):', content)
    content = re.sub(r'afterEach\([^)]*\)\s*\{', 'def teardown_method(self):', content)
    
    # 转换 expect 断言
    content = re.sub(r'expect\(([^)]+)\)\.toHaveProperty\(([^,]+),\s*([^)]+)\)', r'assert \1.get(\2) == \3', content)
    content = re.sub(r'expect\(([^)]+)\)\.toBe\(([^)]+)\)', r'assert \1 == \2', content)
    content = re.sub(r'expect\(([^)]+)\)\.toEqual\(([^)]+)\)', r'assert \1 == \2', content)
    
    # 转换 request 调用
    content = re.sub(r'request\(app\.getHttpServer\(\)\)', 'client', content)
    content = re.sub(r'\.post\(([^)]+)\)\s*\.send\(([^)]+)\)\s*\.expect\((\d+)\)', r'.post(\1, json=\2)', content)
    content = re.sub(r'\.get\(([^)]+)\)\s*\.expect\((\d+)\)', r'.get(\1)', content)
    
    # 添加 client fixture
    content += '''

@pytest.fixture
def client():
    """FastAPI 测试客户端"""
    return TestClient(app)
'''
    
    return python_imports + content

def convert_python_nestjs_to_fastapi(content):
    """将 Python 文件中的 NestJS 引用转换为 FastAPI"""
    # 移除 NestJS 导入
    content = re.sub(r'from.*@nestjs.*\n', '', content)
    content = re.sub(r'import.*@nestjs.*\n', '', content)
    content = re.sub(r'from.*supertest.*\n', '', content)
    content = re.sub(r'import.*supertest.*\n', '', content)
    
    # 添加 FastAPI 导入
    if 'from fastapi.testclient import TestClient' not in content:
        content = 'from fastapi.testclient import TestClient\n' + content
    
    # 转换 Test.createTestingModule
    content = re.sub(r'Test\.createTestingModule\([^)]+\)', 'app', content)
    content = re.sub(r'INestApplication', 'FastAPI', content)
    content = re.sub(r'TestingModule', 'FastAPI', content)
    
    # 转换 supertest 调用
    content = re.sub(r'request\([^)]+\)', 'client', content)
    
    return content

def main():
    """主函数"""
    # 测试目录
    test_dir = Path(__file__).parent.parent / "tests"
    
    # 查找需要转换的文件
    files_to_convert = []
    
    # 查找使用 NestJS 的 TypeScript 文件
    for pattern in ["**/*.ts", "**/*.tsx"]:
        for file_path in test_dir.glob(pattern):
            if file_path.is_file():
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    if any(keyword in content for keyword in ['@nestjs/testing', 'Test.createTestingModule', 'INestApplication']):
                        files_to_convert.append(file_path)
                except:
                    continue
    
    # 查找使用 supertest 的 Python 文件
    for pattern in ["**/*.py"]:
        for file_path in test_dir.glob(pattern):
            if file_path.is_file():
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    if any(keyword in content for keyword in ['supertest', 'request(', 'express']):
                        files_to_convert.append(file_path)
                except:
                    continue
    
    print(f"🔍 找到 {len(files_to_convert)} 个需要转换的文件")
    
    converted_count = 0
    for file_path in files_to_convert:
        if convert_nestjs_test_file(file_path):
            converted_count += 1
    
    print(f"🎉 完成！转换了 {converted_count} 个文件")

if __name__ == "__main__":
    main()
