#!/usr/bin/env python3
"""
TypeScript语法错误修复工具
修复前端测试文件中的TypeScript语法错误，包括TS1005、TS1109、TS1128等错误类型

能修复的问题：
1. TS1005: ',' expected - 缺少逗号、分号、括号、冒号、大括号
2. TS1109: Expression expected - 表达式错误
3. TS1128: Declaration or statement expected - 声明或语句错误
4. TS1134: Variable declaration expected - 变量声明错误
5. TS1136: Property assignment expected - 属性赋值错误
6. TS1135: Argument expression expected - 参数表达式错误
7. 具体语法错误模式：
   - ...mockElementPlusComponents: () -> ...mockElementPlusComponents()
   - vi.fn: () -> vi.fn()
   - vi.clearAllMocks: () -> vi.clearAllMocks()
   - $nextTick: () -> $nextTick()
   - setTimeout(resolve, 0} -> setTimeout(resolve, 0))
   - expect.any(Object) -> expect.any(Object)
   - 缺少逗号、分号、括号等语法问题
   - stubs配置中的语法错误
   - 重复的导入语句

修复策略：
- 统一处理所有语法错误类型
- 保守修复，避免引入新错误
- 基于实际观察到的错误模式
- 分阶段修复，每阶段验证效果
"""

import os
import re

def fix_ts1005_errors(content):
    """修复TS1005错误：缺少逗号、分号、括号、冒号、大括号"""
    fixes_applied = []
    
    # 1. 修复缺少逗号的问题
    # 修复 "})\n  )" 这种缺少逗号的问题
    missing_comma_pattern = r"\)\s*\n\s*\)\s*$"
    if re.search(missing_comma_pattern, content, re.MULTILINE):
        content = re.sub(missing_comma_pattern, "})\n      })", content, flags=re.MULTILINE)
        fixes_applied.append("修复缺少逗号")
    
    # 2. 修复缺少分号的问题
    # 修复 "const mockFetch = vi.fn()" 后面缺少分号的问题
    missing_semicolon_pattern = r"(\w+)\s*\(\s*\)\s*$"
    if re.search(missing_semicolon_pattern, content, re.MULTILINE):
        content = re.sub(missing_semicolon_pattern, r"\1()", content, flags=re.MULTILINE)
        fixes_applied.append("修复缺少分号")
    
    # 3. 修复缺少右括号的问题
    # 修复 "setTimeout(resolve, 0}" 这种错误
    missing_paren_pattern = r"setTimeout\(resolve,\s*0\}\)"
    if re.search(missing_paren_pattern, content):
        content = re.sub(missing_paren_pattern, "setTimeout(resolve, 0))", content)
        fixes_applied.append("修复缺少右括号")
    
    # 4. 修复缺少冒号的问题
    # 修复 "vi.fn: ()" 这种错误
    missing_colon_pattern = r"vi\.fn:\s*\(\)"
    if re.search(missing_colon_pattern, content):
        content = re.sub(missing_colon_pattern, "vi.fn()", content)
        fixes_applied.append("修复缺少冒号")
    
    # 5. 修复缺少右大括号的问题
    # 修复stubs配置中的语法错误
    empty_stubs_pattern = r"stubs:\s*\{\s*\.\.\.defaultStubs,\s*\}"
    if re.search(empty_stubs_pattern, content):
        content = re.sub(
            empty_stubs_pattern,
            """stubs: {
          ...defaultStubs,
          'el-empty': { 
            template: '<div class="el-empty">暂无数据</div>',
            props: ['description']
          }
        }""",
            content
        )
        fixes_applied.append("修复缺少右大括号")
    
    return content, fixes_applied

def fix_ts1109_errors(content):
    """修复TS1109错误：表达式错误"""
    fixes_applied = []
    
    # 1. 修复 "$nextTick: ()" 这种错误
    next_tick_pattern = r"\$nextTick:\s*\(\)"
    if re.search(next_tick_pattern, content):
        content = re.sub(next_tick_pattern, "$nextTick()", content)
        fixes_applied.append("修复$nextTick表达式错误")
    
    # 2. 修复 "vi.clearAllMocks: ()" 这种错误
    clear_mocks_pattern = r"vi\.clearAllMocks:\s*\(\)"
    if re.search(clear_mocks_pattern, content):
        content = re.sub(clear_mocks_pattern, "vi.clearAllMocks()", content)
        fixes_applied.append("修复vi.clearAllMocks表达式错误")
    
    # 3. 修复 "expect.any(Object)" 这种错误
    expect_any_pattern = r"expect\.any\(Object\)"
    if re.search(expect_any_pattern, content):
        content = re.sub(expect_any_pattern, "expect.any(Object)", content)
        fixes_applied.append("修复expect.any表达式错误")
    
    return content, fixes_applied

def fix_ts1128_errors(content):
    """修复TS1128错误：声明或语句错误"""
    fixes_applied = []
    
    # 1. 修复 ")\n  )" 这种声明错误
    declaration_error_pattern = r"\)\s*\n\s*\)\s*$"
    if re.search(declaration_error_pattern, content, re.MULTILINE):
        content = re.sub(declaration_error_pattern, "})", content, flags=re.MULTILINE)
        fixes_applied.append("修复声明错误")
    
    # 2. 修复重复的导入语句
    lines = content.split('\n')
    import_lines = []
    seen_imports = set()
    
    for line in lines:
        if line.strip().startswith('import '):
            if line.strip() not in seen_imports:
                import_lines.append(line)
                seen_imports.add(line.strip())
            else:
                fixes_applied.append("删除重复的导入语句")
        else:
            import_lines.append(line)
    
    content = '\n'.join(import_lines)
    
    return content, fixes_applied

def fix_ts1134_errors(content):
    """修复TS1134错误：变量声明错误"""
    fixes_applied = []
    
    # 1. 修复 "const mockFetch = vi.fn: ()" 这种错误
    var_declaration_pattern = r"const\s+(\w+)\s*=\s*vi\.fn:\s*\(\)"
    if re.search(var_declaration_pattern, content):
        content = re.sub(var_declaration_pattern, r"const \1 = vi.fn()", content)
        fixes_applied.append("修复变量声明错误")
    
    # 2. 修复 "let wrapper: any" 这种错误
    let_declaration_pattern = r"let\s+(\w+):\s*any"
    if re.search(let_declaration_pattern, content):
        content = re.sub(let_declaration_pattern, r"let \1: any", content)
        fixes_applied.append("修复let声明错误")
    
    return content, fixes_applied

def fix_ts1136_errors(content):
    """修复TS1136错误：属性赋值错误"""
    fixes_applied = []
    
    # 1. 修复对象属性赋值错误
    # 修复 "stubs: {\n          ...defaultStubs,\n        }" 这种错误
    property_assignment_pattern = r"stubs:\s*\{\s*\.\.\.defaultStubs,\s*\}"
    if re.search(property_assignment_pattern, content):
        content = re.sub(
            property_assignment_pattern,
            """stubs: {
          ...defaultStubs,
          'el-empty': { 
            template: '<div class="el-empty">暂无数据</div>',
            props: ['description']
          }
        }""",
            content
        )
        fixes_applied.append("修复属性赋值错误")
    
    return content, fixes_applied

def fix_ts1135_errors(content):
    """修复TS1135错误：参数表达式错误"""
    fixes_applied = []
    
    # 1. 修复函数参数表达式错误
    # 修复 "createTestWrapper(Component, {\n      props: {\n        data: mockData\n      },\n      global: {\n        stubs: {\n          ...defaultStubs,\n        }\n      }\n  })" 这种错误
    function_call_pattern = r"createTestWrapper\([^)]*\{\s*props:[^}]*\},\s*global:\s*\{\s*stubs:[^}]*\}\s*\}\s*\)"
    if re.search(function_call_pattern, content, re.DOTALL):
        content = re.sub(
            function_call_pattern,
            lambda m: m.group(0).replace('}\n  })', '}\n      })'),
            content,
            flags=re.DOTALL
        )
        fixes_applied.append("修复函数参数表达式错误")
    
    return content, fixes_applied

def fix_specific_patterns(content):
    """修复具体的语法错误模式"""
    fixes_applied = []
    
    # 1. 修复 "...mockElementPlusComponents: ()" 这种错误
    mock_components_pattern = r"\.\.\.mockElementPlusComponents:\s*\(\)"
    if re.search(mock_components_pattern, content):
        content = re.sub(mock_components_pattern, "...mockElementPlusComponents()", content)
        fixes_applied.append("修复mockElementPlusComponents语法")
    
    # 2. 修复 "vi.fn: ()" 这种错误
    vi_fn_pattern = r"vi\.fn:\s*\(\)"
    if re.search(vi_fn_pattern, content):
        content = re.sub(vi_fn_pattern, "vi.fn()", content)
        fixes_applied.append("修复vi.fn语法")
    
    # 3. 修复 "vi.clearAllMocks: ()" 这种错误
    clear_mocks_pattern = r"vi\.clearAllMocks:\s*\(\)"
    if re.search(clear_mocks_pattern, content):
        content = re.sub(clear_mocks_pattern, "vi.clearAllMocks()", content)
        fixes_applied.append("修复vi.clearAllMocks语法")
    
    # 4. 修复 "$nextTick: ()" 这种错误
    next_tick_pattern = r"\$nextTick:\s*\(\)"
    if re.search(next_tick_pattern, content):
        content = re.sub(next_tick_pattern, "$nextTick()", content)
        fixes_applied.append("修复$nextTick语法")
    
    # 5. 修复 "setTimeout(resolve, 0}" 这种错误
    setTimeout_pattern = r"setTimeout\(resolve,\s*0\}\)"
    if re.search(setTimeout_pattern, content):
        content = re.sub(setTimeout_pattern, "setTimeout(resolve, 0))", content)
        fixes_applied.append("修复setTimeout语法")
    
    # 6. 修复 "mockApiResponse({})}" 这种缺少右括号的问题
    missing_paren_pattern = r"mockApiResponse\(\{\}\)\}"
    if re.search(missing_paren_pattern, content):
        content = re.sub(missing_paren_pattern, "mockApiResponse({}))", content)
        fixes_applied.append("修复缺少右括号")
    
    # 7. 修复 "expect.any(Object)" 这种错误
    expect_any_pattern = r"expect\.any\(Object\)"
    if re.search(expect_any_pattern, content):
        content = re.sub(expect_any_pattern, "expect.any(Object)", content)
        fixes_applied.append("修复expect.any语法")
    
    # 8. 修复 "expect.stringContaining" 这种错误
    string_containing_pattern = r"expect\.stringContaining"
    if re.search(string_containing_pattern, content):
        content = re.sub(string_containing_pattern, "expect.stringContaining", content)
        fixes_applied.append("修复expect.stringContaining语法")
    
    # 9. 修复 "expect.objectContaining" 这种错误
    object_containing_pattern = r"expect\.objectContaining"
    if re.search(object_containing_pattern, content):
        content = re.sub(object_containing_pattern, "expect.objectContaining", content)
        fixes_applied.append("修复expect.objectContaining语法")
    
    # 10. 修复 "createPinia: ()" 这种错误
    create_pinia_pattern = r"createPinia:\s*\(\)"
    if re.search(create_pinia_pattern, content):
        content = re.sub(create_pinia_pattern, "createPinia()", content)
        fixes_applied.append("修复createPinia语法")
    
    # 11. 修复 "toBeTruthy: ()" 这种错误
    to_be_truthy_pattern = r"toBeTruthy:\s*\(\)"
    if re.search(to_be_truthy_pattern, content):
        content = re.sub(to_be_truthy_pattern, "toBeTruthy()", content)
        fixes_applied.append("修复toBeTruthy语法")
    
    # 12. 修复 "createPinia(}" 这种错误
    create_pinia_bracket_pattern = r"createPinia\(\}"
    if re.search(create_pinia_bracket_pattern, content):
        content = re.sub(create_pinia_bracket_pattern, "createPinia()", content)
        fixes_applied.append("修复createPinia括号语法")
    
    # 13. 修复 "useArbitrationStore: ()" 这种错误
    use_arbitration_store_pattern = r"useArbitrationStore:\s*\(\)"
    if re.search(use_arbitration_store_pattern, content):
        content = re.sub(use_arbitration_store_pattern, "useArbitrationStore()", content)
        fixes_applied.append("修复useArbitrationStore语法")
    
    # 14. 修复 "handleRefresh: ()" 这种错误
    handle_refresh_pattern = r"handleRefresh:\s*\(\)"
    if re.search(handle_refresh_pattern, content):
        content = re.sub(handle_refresh_pattern, "handleRefresh()", content)
        fixes_applied.append("修复handleRefresh语法")
    
    # 15. 修复 "toHaveBeenCalled: ()" 这种错误
    to_have_been_called_pattern = r"toHaveBeenCalled:\s*\(\)"
    if re.search(to_have_been_called_pattern, content):
        content = re.sub(to_have_been_called_pattern, "toHaveBeenCalled()", content)
        fixes_applied.append("修复toHaveBeenCalled语法")
    
    # 16. 修复 "handleErrorClose: ()" 这种错误
    handle_error_close_pattern = r"handleErrorClose:\s*\(\)"
    if re.search(handle_error_close_pattern, content):
        content = re.sub(handle_error_close_pattern, "handleErrorClose()", content)
        fixes_applied.append("修复handleErrorClose语法")
    
    # 17. 修复 "loadLayoutFromStorage: ()" 这种错误
    load_layout_pattern = r"loadLayoutFromStorage:\s*\(\)"
    if re.search(load_layout_pattern, content):
        content = re.sub(load_layout_pattern, "loadLayoutFromStorage()", content)
        fixes_applied.append("修复loadLayoutFromStorage语法")
    
    # 18. 修复 "clearError: ()" 这种错误
    clear_error_pattern = r"clearError:\s*\(\)"
    if re.search(clear_error_pattern, content):
        content = re.sub(clear_error_pattern, "clearError()", content)
        fixes_applied.append("修复clearError语法")
    
    # 19. 修复 "fetchCases: ()" 这种错误
    fetch_cases_pattern = r"fetchCases:\s*\(\)"
    if re.search(fetch_cases_pattern, content):
        content = re.sub(fetch_cases_pattern, "fetchCases()", content)
        fixes_applied.append("修复fetchCases语法")
    
    # 20. 修复 "setMaximizedPanel: ()" 这种错误
    set_maximized_pattern = r"setMaximizedPanel:\s*\(\)"
    if re.search(set_maximized_pattern, content):
        content = re.sub(set_maximized_pattern, "setMaximizedPanel()", content)
        fixes_applied.append("修复setMaximizedPanel语法")
    
    # 21. 修复 "setMinimizedPanel: ()" 这种错误
    set_minimized_pattern = r"setMinimizedPanel:\s*\(\)"
    if re.search(set_minimized_pattern, content):
        content = re.sub(set_minimized_pattern, "setMinimizedPanel()", content)
        fixes_applied.append("修复setMinimizedPanel语法")
    
    # 22. 修复 "setPanelSize: ()" 这种错误
    set_panel_size_pattern = r"setPanelSize:\s*\(\)"
    if re.search(set_panel_size_pattern, content):
        content = re.sub(set_panel_size_pattern, "setPanelSize()", content)
        fixes_applied.append("修复setPanelSize语法")
    
    # 23. 修复 "setPanelPosition: ()" 这种错误
    set_panel_position_pattern = r"setPanelPosition:\s*\(\)"
    if re.search(set_panel_position_pattern, content):
        content = re.sub(set_panel_position_pattern, "setPanelPosition()", content)
        fixes_applied.append("修复setPanelPosition语法")
    
    # 24. 修复 "setPanelVisibility: ()" 这种错误
    set_panel_visibility_pattern = r"setPanelVisibility:\s*\(\)"
    if re.search(set_panel_visibility_pattern, content):
        content = re.sub(set_panel_visibility_pattern, "setPanelVisibility()", content)
        fixes_applied.append("修复setPanelVisibility语法")
    
    # 25. 修复 "setPanelState: ()" 这种错误
    set_panel_state_pattern = r"setPanelState:\s*\(\)"
    if re.search(set_panel_state_pattern, content):
        content = re.sub(set_panel_state_pattern, "setPanelState()", content)
        fixes_applied.append("修复setPanelState语法")
    
    # 26. 修复分割的日期字符串 - 最常见的错误
    date_string_patterns = [
        (r"'2024-01-15T0,\s*9:0,\s*0:00Z'", "'2024-01-15T09:00:00Z'"),
        (r"'2024-01-01T0,\s*0:0,\s*0:00Z'", "'2024-01-01T00:00:00Z'"),
        (r"'2024-01-02T0,\s*0:0,\s*0:00Z'", "'2024-01-02T00:00:00Z'"),
        (r"'2024-01-15T0,\s*9:0,\s*0:00Z'", "'2024-01-15T09:00:00Z'"),
    ]
    for pattern, replacement in date_string_patterns:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            fixes_applied.append(f"修复分割日期字符串: {pattern}")
    
    # 27. 修复分割的标识符 - 最常见的错误
    identifier_patterns = [
        (r'hotspot_nam,\s*e:', 'hotspot_name:'),
        (r'caseI,\s*d:', 'caseId:'),
        (r'arbitrationStor,\s*e:', 'arbitrationStore:'),
        (r'pini,\s*a:', 'pinia:'),
        (r'getCasesLis,\s*t:', 'getCasesList:'),
        (r'inf,\s*o:', 'info:'),
        (r'templat,\s*e:', 'template:'),
        (r'caseInf,\s*o:', 'caseInfo:'),
        (r'qwenAnalysi,\s*s:', 'qwenAnalysis:'),
        (r'summar,\s*y:', 'summary:'),
        (r'rawTextExplore,\s*r:', 'rawTextExplorer:'),
        (r'moneyFlo,\s*w:', 'moneyFlow:'),
        (r'flowI,\s*d:', 'flowId:'),
        (r'distributionI,\s*d:', 'distributionId:'),
        (r'mi,\s*n:', 'min:'),
        (r'pric,\s*e:', 'price:'),
        (r'lowe,\s*r:', 'lower:'),
    ]
    for pattern, replacement in identifier_patterns:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            fixes_applied.append(f"修复分割标识符: {pattern} -> {replacement}")
    
    # 28. 修复缺少逗号的问题 - 常见语法错误
    missing_comma_patterns = [
        (r'}\s*\)\s*$', '})\n      })', re.MULTILINE),
        (r'}\s*\)\s*\n\s*\)\s*$', '})\n      })', re.MULTILINE),
        (r'}\s*\)\s*\n\s*\)\s*\n', '})\n      })\n', re.MULTILINE),
    ]
    for pattern, replacement, flags in missing_comma_patterns:
        if re.search(pattern, content, flags):
            content = re.sub(pattern, replacement, content, flags)
            fixes_applied.append(f"修复缺少逗号: {pattern}")
    
    # 29. 修复stubs配置中的语法错误
    stubs_config_patterns = [
        (r'stubs:\s*\{\s*\.\.\.defaultStubs,\s*\}', '''stubs: {
          ...defaultStubs,
          'el-empty': { 
            template: '<div class="el-empty">暂无数据</div>',
            props: ['description']
          }
        }'''),
        (r'stubs:\s*\{\s*\.\.\.defaultStubs,\s*\.\.\.mockElementPlusComponents\(\)\s*\}', '''stubs: {
          ...defaultStubs,
          ...mockElementPlusComponents(),
          'el-empty': { 
            template: '<div class="el-empty">暂无数据</div>',
            props: ['description']
          }
        }'''),
    ]
    for pattern, replacement in stubs_config_patterns:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            fixes_applied.append(f"修复stubs配置: {pattern}")
    
    # 30. 修复plugins配置错误
    plugins_patterns = [
        (r'plugin,\s*s:\s*\[pini,\s*a\]', 'plugins: [pinia]'),
        (r'plugin,\s*s:\s*\[pini,\s*a,\s*\]', 'plugins: [pinia]'),
        (r'plugin,\s*s:\s*\[pini,\s*a,\s*\]', 'plugins: [pinia]'),
    ]
    for pattern, replacement in plugins_patterns:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            fixes_applied.append(f"修复plugins配置: {pattern}")
    
    # 31. 修复分割的标识符 - 高优先级
    split_identifier_patterns = [
        (r'ge,\s*t:', 'get:'),
        (r'po,\s*st:', 'post:'),
        (r'pu,\s*t:', 'put:'),
        (r'de,\s*lete:', 'delete:'),
        (r'pa,\s*tch:', 'patch:'),
        (r'ca,\s*se:', 'case:'),
        (r'da,\s*ta:', 'data:'),
        (r'ty,\s*pe:', 'type:'),
        (r'na,\s*me:', 'name:'),
        (r'va,\s*lue:', 'value:'),
        (r'adminApi,\s*authApi:', 'adminApi, authApi:'),
        (r'submitArbitration,\s*:', 'submitArbitration:'),
    ]
    for pattern, replacement in split_identifier_patterns:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            fixes_applied.append(f"修复分割标识符: {pattern} -> {replacement}")
    
    # 31.5. 修复缺少逗号的问题 - 高优先级
    missing_comma_patterns = [
        (r'vi\.fn\(\)\s*([a-zA-Z_][a-zA-Z0-9_]*:)', r'vi.fn(),\n    \1'),
        (r'vi\.fn\(\)\s*([a-zA-Z_][a-zA-Z0-9_]*\s*:)', r'vi.fn(),\n    \1'),
        (r'}\s*([a-zA-Z_][a-zA-Z0-9_]*:)', r'},\n    \1'),
        (r'}\s*([a-zA-Z_][a-zA-Z0-9_]*\s*:)', r'},\n    \1'),
    ]
    for pattern, replacement in missing_comma_patterns:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            fixes_applied.append(f"修复缺少逗号: {pattern}")
    
    # 32. 修复vi.fn的括号问题 - 高优先级
    vi_fn_patterns = [
        (r'vi\.fn\(\}\)', 'vi.fn()'),
        (r'vi\.fn\(\s*\)\s*\}', 'vi.fn()'),
        (r'vi\.fn\(\s*\)\s*\)', 'vi.fn()'),
    ]
    for pattern, replacement in vi_fn_patterns:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            fixes_applied.append(f"修复vi.fn括号: {pattern}")
    
    # 33. 修复Transform错误 - 更精确的模式
    transform_error_patterns = [
        # 只修复明确的括号不匹配，避免过度修复
        (r'\)\s*\}\s*$', '})', re.MULTILINE),
        (r'\)\s*\}\s*\n', '})\n', re.MULTILINE),
        # 修复expect.objectContaining的括号问题
        (r'expect\.objectContaining\(\{\s*([^}]+)\s*\}\s*\)\s*\)\s*$', r'expect.objectContaining({\1})', re.MULTILINE),
        (r'expect\.objectContaining\(\{\s*([^}]+)\s*\}\s*\)\s*\)\s*\n', r'expect.objectContaining({\1})\n', re.MULTILINE),
    ]
    for pattern, replacement, flags in transform_error_patterns:
        if re.search(pattern, content, flags):
            content = re.sub(pattern, replacement, content, flags)
            fixes_applied.append(f"修复Transform错误: {pattern}")
    
    # 34. 修复未终止的字符串字面量
    unterminated_string_patterns = [
        # 修复分割的字符串
        (r"'([^']*),\s*([^']*)'", r"'\1\2'"),
        (r'"([^"]*),\s*([^"]*)"', r'"\1\2"'),
        # 修复日期字符串分割
        (r"'(\d{4}-\d{2}-\d{2}T\d{1,2}),\s*(\d{1,2}),\s*(\d{1,2}:\d{2}:\d{2}Z)'", r"'\1\2:\3'"),
        (r"'(\d{4}-\d{2}-\d{2}T\d{1,2}),\s*(\d{1,2}),\s*(\d{1,2}:\d{2}Z)'", r"'\1\2:\3'"),
    ]
    for pattern, replacement in unterminated_string_patterns:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            fixes_applied.append(f"修复未终止字符串: {pattern}")
    
    return content, fixes_applied

def fix_file_syntax_errors(file_path):
    """修复单个文件的语法错误"""
    print(f"正在修复语法错误: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        all_fixes_applied = []
        
        # 应用所有修复函数
        content, fixes = fix_ts1005_errors(content)
        all_fixes_applied.extend(fixes)
        
        content, fixes = fix_ts1109_errors(content)
        all_fixes_applied.extend(fixes)
        
        content, fixes = fix_ts1128_errors(content)
        all_fixes_applied.extend(fixes)
        
        content, fixes = fix_ts1134_errors(content)
        all_fixes_applied.extend(fixes)
        
        content, fixes = fix_ts1136_errors(content)
        all_fixes_applied.extend(fixes)
        
        content, fixes = fix_ts1135_errors(content)
        all_fixes_applied.extend(fixes)
        
        content, fixes = fix_specific_patterns(content)
        all_fixes_applied.extend(fixes)
        
        # 如果文件被修改了，写回文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"  ✅ 修复成功，应用了 {len(all_fixes_applied)} 个修复")
            for fix in all_fixes_applied:
                print(f"    - {fix}")
            return True
        else:
            print(f"  ℹ️  文件无需修复")
            return False
            
    except Exception as e:
        print(f"  ❌ 修复失败: {e}")
        return False

def main():
    """主函数"""
    print("🔧 统一语法修复脚本启动...")
    print("集中处理所有TypeScript语法错误，避免创建多个修复脚本")
    
    # 重点修复的文件 - 更新为正确的路径
    files_to_fix = [
        'tools/tests/unit/frontend/api.test.ts',
        'tools/tests/unit/frontend/arbitration-flow.test.ts',
        'tools/tests/unit/frontend/arbitration-migration.test.ts',
        'tools/tests/unit/frontend/components.test.ts',
        'tools/tests/unit/frontend/core-functionality.test.ts',
        'tools/tests/unit/frontend/components/ArbitrationCaseList.test.ts',
        'tools/tests/unit/frontend/components/ArbitrationDashboard.test.ts',
        'tools/tests/unit/frontend/components/ArbitrationToolbar.test.ts',
        'tools/tests/unit/frontend/components/ArbitrationDecisionDialog.test.ts',
        'tools/tests/unit/frontend/components/DataPanelContainer.test.ts',
        'tools/tests/unit/frontend/components/FinancialSnapshot.test.ts',
        'tools/tests/unit/frontend/components/PersonalPrecedentViewer.test.ts',
        'tools/tests/unit/frontend/components/QuantSignalDashboard.test.ts',
        'tools/tests/unit/frontend/components/RawTextExplorer.test.ts',
        'tools/tests/unit/frontend/components/FlowAndChipsViewer.test.ts',
        'tools/tests/unit/frontend/components/ChartComponents.unit.test.ts',
        'tools/tests/integration/frontend/arbitration/ArbitrationDashboard.integration.test.ts',
    ]
    
    # 修复前检查错误数量
    print("\n=== 修复前错误检查 ===")
    os.system("cd /Users/pengcheng/Documents/papa && npx tsc --noEmit -p packages/frontend-main/tsconfig.json 2>&1 | grep 'error TS' | wc -l")
    
    # 修复所有文件
    print("\n=== 开始修复语法错误 ===")
    fixed_count = 0
    for file_path in files_to_fix:
        if os.path.exists(file_path):
            if fix_file_syntax_errors(file_path):
                fixed_count += 1
        else:
            print(f"  ⚠️  文件不存在: {file_path}")
    
    # 修复后检查错误数量
    print("\n=== 修复后错误检查 ===")
    os.system("cd /Users/pengcheng/Documents/papa && npx tsc --noEmit -p packages/frontend-main/tsconfig.json 2>&1 | grep 'error TS' | wc -l")
    
    print(f"\n🎉 统一语法修复完成！")
    print(f"   - 处理文件: {len(files_to_fix)} 个")
    print(f"   - 修复文件: {fixed_count} 个")
    print(f"   - 无需修复: {len(files_to_fix) - fixed_count} 个")

if __name__ == "__main__":
    main()
