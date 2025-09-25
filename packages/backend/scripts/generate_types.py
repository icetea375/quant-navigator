#!/usr/bin/env python3
"""
自动生成前端TypeScript类型定义
从FastAPI的OpenAPI规范自动生成前端类型文件
"""

import json
import requests
import sys
from pathlib import Path
from typing import Dict, Any

def fetch_openapi_spec(base_url: str = "http://localhost:8000") -> Dict[str, Any]:
    """从FastAPI应用获取OpenAPI规范"""
    try:
        response = requests.get(f"{base_url}/openapi.json", timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"❌ 无法获取OpenAPI规范: {e}")
        print("请确保FastAPI服务器正在运行: python main.py start-server")
        sys.exit(1)

def generate_typescript_types(openapi_spec: Dict[str, Any]) -> str:
    """将OpenAPI规范转换为TypeScript类型定义"""
    
    types = []
    types.append("// 自动生成的API类型定义")
    types.append("// 生成时间: " + str(Path(__file__).stat().st_mtime))
    types.append("// 来源: FastAPI OpenAPI规范")
    types.append("")
    
    # 处理组件模式
    components = openapi_spec.get("components", {})
    schemas = components.get("schemas", {})
    
    for schema_name, schema_def in schemas.items():
        if schema_name.startswith("HTTP"):
            continue
            
        types.append(f"export interface {schema_name} {{")
        
        properties = schema_def.get("properties", {})
        required = schema_def.get("required", [])
        
        for prop_name, prop_def in properties.items():
            # 转换类型
            ts_type = convert_openapi_type_to_ts(prop_def)
            is_optional = prop_name not in required
            optional_marker = "?" if is_optional else ""
            
            # 添加注释
            description = prop_def.get("description", "")
            if description:
                types.append(f"  /** {description} */")
            
            types.append(f"  {prop_name}{optional_marker}: {ts_type};")
        
        types.append("}")
        types.append("")
    
    # 处理枚举类型
    for schema_name, schema_def in schemas.items():
        if schema_def.get("type") == "string" and "enum" in schema_def:
            types.append(f"export type {schema_name} =")
            enum_values = schema_def["enum"]
            for i, value in enumerate(enum_values):
                comma = "," if i < len(enum_values) - 1 else ""
                types.append(f"  | '{value}'{comma}")
            types.append("")
    
    return "\n".join(types)

def convert_openapi_type_to_ts(prop_def: Dict[str, Any]) -> str:
    """将OpenAPI类型转换为TypeScript类型"""
    prop_type = prop_def.get("type", "string")
    format_type = prop_def.get("format", "")
    
    # 基本类型映射
    type_mapping = {
        "string": "string",
        "integer": "number",
        "number": "number",
        "boolean": "boolean",
        "array": "any[]",  # 简化处理
        "object": "Record<string, any>"
    }
    
    if prop_type == "string":
        if format_type == "date":
            return "string"  # 日期作为字符串处理
        elif format_type == "date-time":
            return "string"  # 日期时间作为字符串处理
        else:
            return "string"
    elif prop_type == "array":
        items = prop_def.get("items", {})
        if "$ref" in items:
            ref_name = items["$ref"].split("/")[-1]
            return f"{ref_name}[]"
        else:
            return "any[]"
    elif "$ref" in prop_def:
        ref_name = prop_def["$ref"].split("/")[-1]
        return ref_name
    else:
        return type_mapping.get(prop_type, "any")

def main():
    """主函数"""
    print("🚀 开始生成前端TypeScript类型定义...")
    
    # 获取OpenAPI规范
    print("📡 获取OpenAPI规范...")
    openapi_spec = fetch_openapi_spec()
    
    # 生成TypeScript类型
    print("⚙️  生成TypeScript类型...")
    ts_types = generate_typescript_types(openapi_spec)
    
    # 写入文件
    output_path = Path(__file__).parent.parent.parent / "frontend" / "src" / "types" / "api.ts"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(ts_types)
    
    print(f"✅ 类型定义已生成: {output_path}")
    print(f"📊 生成了 {len(ts_types.split('export interface')) - 1} 个接口定义")

if __name__ == "__main__":
    main()
