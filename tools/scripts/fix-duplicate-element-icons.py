#!/usr/bin/env python3
"""
修复Element Plus图标重复键问题
第二战役：完善Element Plus组件Mock"骨骼系统"
"""

import re
from collections import OrderedDict

def fix_duplicate_icons():
    """修复重复的图标定义"""
    print("🔧 第二战役：修复Element Plus图标重复键问题...")
    
    file_path = "tools/tests/setup/frontend/setup-element-plus-icons.ts"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取图标定义部分
    start_marker = "vi.mock('@element-plus/icons-vue', () => ({"
    end_marker = "}))"
    
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker, start_idx) + len(end_marker)
    
    if start_idx == -1 or end_idx == -1:
        print("❌ 找不到图标定义部分")
        return False
    
    # 提取图标定义
    icons_section = content[start_idx:end_idx]
    
    # 解析图标定义
    icon_pattern = r'(\w+):\s*\{\s*template:\s*[\'"]([^\'"]+)[\'"]\s*\}'
    matches = re.findall(icon_pattern, icons_section)
    
    # 使用OrderedDict去重，保持顺序
    unique_icons = OrderedDict()
    for icon_name, template in matches:
        if icon_name not in unique_icons:
            unique_icons[icon_name] = template
    
    # 重新生成图标定义
    new_icons_section = start_marker + "\n"
    
    # 按类别分组
    categories = {
        "基础图标": ["TrendCharts", "ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Monitor", "User", "DataAnalysis"],
        "状态图标": ["CircleCheck", "Check", "Close", "Warning", "WarningFilled", "Info", "InfoFilled", "Success", "SuccessFilled", "Error", "ErrorFilled", "CircleCheckFilled", "CircleClose", "CircleCloseFilled"],
        "操作图标": ["Fold", "Unfold", "Clock", "Setting", "Search", "Plus", "Minus", "Edit", "Delete", "Refresh", "Download", "Upload", "View", "Link", "Filter", "Loading", "Message", "Hide"],
        "导航图标": ["Home", "Menu", "Back", "Forward"],
        "媒体图标": ["Play", "Pause", "Stop"],
        "其他图标": ["Calendar", "Location", "Phone", "Email", "Lock", "Unlock", "Eye", "EyeClosed", "Star", "Heart", "Share", "Copy", "Cut", "Paste"]
    }
    
    for category_name, icon_names in categories.items():
        new_icons_section += f"  // {category_name}\n"
        for icon_name in icon_names:
            if icon_name in unique_icons:
                new_icons_section += f"  {icon_name}: {{ template: '{unique_icons[icon_name]}' }},\n"
        new_icons_section += "\n"
    
    new_icons_section += "}))"
    
    # 替换原文件中的图标定义部分
    new_content = content[:start_idx] + new_icons_section + content[end_idx:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✅ 已修复重复图标定义")
    print(f"原始图标数量: {len(matches)}")
    print(f"去重后图标数量: {len(unique_icons)}")
    print(f"移除重复图标: {len(matches) - len(unique_icons)}")
    
    return True

if __name__ == "__main__":
    fix_duplicate_icons()



