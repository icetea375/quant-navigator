#!/usr/bin/env python3
"""
修复AnomalyEvent测试脚本
"""

import re


def fix_anomaly_tests():
    """修复AnomalyEvent测试文件"""

    # 读取文件
    with open(
        "tests/unit/entities/test_anomaly_event_entity.py", encoding="utf-8"
    ) as f:
        content = f.read()

    # 修复模式1: 添加id字段和完整context
    pattern1 = r'(\s+)(entity = AnomalyEventEntity\(\s*\n)(\s+)(stock_code="[^"]+",\s*\n)(\s+)(timestamp=[^,]+,\s*\n)(\s+)(anomaly_type="[^"]+",\s*\n)(\s+)(severity="[^"]+",\s*\n)(\s+)(description="[^"]+",\s*\n)(\s+)(z_score=[^,]+,\s*\n)(\s+)(current_value=[^,]+,\s*\n)(\s+)(expected_value=[^,]+,\s*\n)(\s+)(deviation=[^,]+,\s*\n)(\s+)(confidence=[^,]+,\s*\n)(\s+)(context_json=\{[^}]+\},\s*\n)(\s+)(metadata_json=\{[^}]+\}\s*\n)(\s+\))'

    def replace_entity_creation(match):
        indent1 = match.group(1)
        indent2 = match.group(3)
        indent3 = match.group(5)
        indent4 = match.group(7)
        indent5 = match.group(9)
        indent6 = match.group(11)
        indent7 = match.group(13)
        indent8 = match.group(15)
        indent9 = match.group(17)
        indent10 = match.group(19)
        indent11 = match.group(21)
        indent12 = match.group(23)
        indent13 = match.group(25)

        return f"""{indent1}entity = AnomalyEventEntity(
{indent2}id="test_anomaly_{hash(match.group(0)) % 1000:03d}",
{indent3}stock_code="000001.SZ",
{indent4}timestamp=int(datetime.now().timestamp() * 1000),
{indent5}anomaly_type="price",
{indent6}severity="high",
{indent7}description="价格异常波动",
{indent8}z_score=2.5,
{indent9}current_value=12.50,
{indent10}expected_value=10.00,
{indent11}deviation=2.50,
{indent12}confidence=0.85,
{indent13}context_json={{
{indent13}    "market_state": "trading",
{indent13}    "sector_performance": 0.05,
{indent13}    "news_count": 10,
{indent13}    "volume_ratio": 1.5
{indent13}}},
{indent13}metadata_json={{"source": "test"}}
{indent1})"""

    # 应用修复
    content = re.sub(
        pattern1, replace_entity_creation, content, flags=re.MULTILINE | re.DOTALL
    )

    # 修复模式2: 修复AnomalyEvent创建
    pattern2 = r'(anomaly_event = AnomalyEvent\(\s*\n)(\s+)(id="[^"]+",\s*\n)(\s+)(stock_code="[^"]+",\s*\n)(\s+)(timestamp=datetime\.now\(\),\s*\n)(\s+)(anomaly_type=AnomalyType\.[^,]+,\s*\n)(\s+)(severity=SeverityLevel\.[^,]+,\s*\n)(\s+)(description="[^"]+",\s*\n)(\s+)(z_score=[^,]+,\s*\n)(\s+)(current_value=[^,]+,\s*\n)(\s+)(expected_value=[^,]+,\s*\n)(\s+)(deviation=[^,]+,\s*\n)(\s+)(confidence=[^,]+,\s*\n)(\s+)(context=\{[^}]+\},\s*\n)(\s+)(metadata=\{[^}]+\}\s*\n)(\s+\))'

    def replace_anomaly_event(match):
        indent1 = match.group(2)
        indent2 = match.group(4)
        indent3 = match.group(6)
        indent4 = match.group(8)
        indent5 = match.group(10)
        indent6 = match.group(12)
        indent7 = match.group(14)
        indent8 = match.group(16)
        indent9 = match.group(18)
        indent10 = match.group(20)
        indent11 = match.group(22)
        indent12 = match.group(24)

        return f"""anomaly_event = AnomalyEvent(
{indent1}id="test_id",
{indent2}stock_code="000001.SZ",
{indent3}timestamp=int(datetime.now().timestamp() * 1000),
{indent4}anomaly_type=AnomalyType.PRICE,
{indent5}severity=SeverityLevel.HIGH,
{indent6}description="价格异常波动",
{indent7}z_score=2.5,
{indent8}current_value=12.50,
{indent9}expected_value=10.00,
{indent10}deviation=2.50,
{indent11}confidence=0.85,
{indent12}context={{
{indent12}    "market_state": "trading",
{indent12}    "sector_performance": 0.05,
{indent12}    "news_count": 10,
{indent12}    "volume_ratio": 1.5
{indent12}}},
{indent12}metadata={{"source": "test"}}
)"""

    # 应用修复
    content = re.sub(
        pattern2, replace_anomaly_event, content, flags=re.MULTILINE | re.DOTALL
    )

    # 写回文件
    with open(
        "tests/unit/entities/test_anomaly_event_entity.py", "w", encoding="utf-8"
    ) as f:
        f.write(content)

    print("AnomalyEvent测试文件修复完成")


if __name__ == "__main__":
    fix_anomaly_tests()
