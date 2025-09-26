# Docstring规范指南

**版本**: v1.0  
**维护者**: AI Assistant  
**最后更新**: 2025年1月17日

---

## 概述

本指南基于《测试宪法》第八章"文档即基石"的要求，为项目中的Python代码提供统一的docstring规范。所有公共API都必须遵循此规范。

## 规范标准

### 1. 基本格式

使用Google风格的docstring格式：

```python
def function_name(param1: type, param2: type = default) -> return_type:
    """
    函数的简短描述（一行）。
    
    函数的详细描述，可以跨越多行。
    解释函数的目的、工作原理和重要细节。
    
    Args:
        param1: 参数1的描述
        param2: 参数2的描述，包含默认值说明
        
    Returns:
        返回值的描述，包括类型和含义
        
    Raises:
        ExceptionType: 什么情况下会抛出此异常
        
    Examples:
        >>> result = function_name("example", 42)
        >>> print(result)
        "expected output"
    """
```

### 2. 必需部分

每个公共函数的docstring必须包含以下部分：

#### 2.1 简短描述（必需）
- 一行简洁的函数功能描述
- 以动词开头，描述函数的作用
- 不超过80个字符

```python
def calculate_quant_signal(self, data: pd.DataFrame) -> QuantSignal:
    """计算量化信号，基于市场数据异常检测。"""
```

#### 2.2 详细描述（推荐）
- 解释函数的工作原理
- 说明重要的业务逻辑
- 描述算法或处理流程

```python
def calculate_quant_signal(self, data: pd.DataFrame) -> QuantSignal:
    """
    计算量化信号，基于市场数据异常检测。
    
    该方法通过分析市场数据的统计特征，识别潜在的异常模式，
    并生成相应的量化交易信号。信号强度基于异常程度和置信度。
    
    算法流程：
    1. 数据预处理和清洗
    2. 特征提取和标准化
    3. 异常检测和评分
    4. 信号生成和验证
    """
```

#### 2.3 Args部分（必需）
- 列出所有参数
- 包含类型信息和描述
- 说明默认值和约束条件

```python
def calculate_quant_signal(
    self, 
    market_data: pd.DataFrame, 
    threshold: float = 0.05,
    lookback_days: int = 30
) -> QuantSignal:
    """
    Args:
        market_data: 市场数据DataFrame，必须包含'price'和'volume'列
        threshold: 异常检测阈值，范围[0, 1]，默认0.05（5%）
        lookback_days: 回望天数，用于计算历史统计量，默认30天
    """
```

#### 2.4 Returns部分（必需）
- 描述返回值的类型和含义
- 说明返回值的结构和内容
- 包含特殊情况的说明

```python
def calculate_quant_signal(self, data: pd.DataFrame) -> QuantSignal:
    """
    Returns:
        QuantSignal: 包含以下属性的信号对象：
            - strength: 信号强度，范围[0, 1]
            - confidence: 置信度，范围[0, 1]
            - timestamp: 信号生成时间
            - metadata: 包含算法参数和中间结果
    """
```

#### 2.5 Raises部分（必需）
- 列出所有可能抛出的异常
- 说明异常触发条件
- 包含自定义业务异常

```python
def calculate_quant_signal(self, data: pd.DataFrame) -> QuantSignal:
    """
    Raises:
        DataValidationError: 当市场数据格式不正确或缺少必需列时
        CalculationError: 当信号计算过程中出现数值错误时
        InsufficientDataError: 当数据量不足以进行可靠计算时
    """
```

#### 2.6 Examples部分（推荐）
- 提供实际使用示例
- 展示常见用法和边界情况
- 包含预期输出

```python
def calculate_quant_signal(self, data: pd.DataFrame) -> QuantSignal:
    """
    Examples:
        >>> # 基本用法
        >>> signal = engine.calculate_quant_signal(df)
        >>> print(f"Signal strength: {signal.strength}")
        
        >>> # 自定义阈值
        >>> signal = engine.calculate_quant_signal(df, threshold=0.03)
        >>> print(f"Confidence: {signal.confidence}")
        
        >>> # 处理异常情况
        >>> try:
        ...     signal = engine.calculate_quant_signal(empty_df)
        ... except DataValidationError as e:
        ...     print(f"Data validation failed: {e}")
    """
```

### 3. 类文档规范

#### 3.1 类的基本结构

```python
class QuantSignalEngine:
    """
    量化信号引擎，负责生成基于市场数据的交易信号。
    
    该类封装了异常检测算法和信号生成逻辑，提供统一的接口
    用于计算各种类型的量化交易信号。
    
    Attributes:
        config: 引擎配置对象
        logger: 日志记录器
        cache: 缓存管理器
        
    Examples:
        >>> engine = QuantSignalEngine(config)
        >>> signal = engine.calculate_signal(market_data)
    """
    
    def __init__(self, config: EngineConfig):
        """
        初始化量化信号引擎。
        
        Args:
            config: 引擎配置对象，包含算法参数和系统设置
        """
```

#### 3.2 属性文档

```python
class QuantSignalEngine:
    """
    Attributes:
        config (EngineConfig): 引擎配置对象，包含所有算法参数
        logger (Logger): 日志记录器，用于记录引擎运行状态
        cache (CacheManager): 缓存管理器，用于存储中间计算结果
        is_initialized (bool): 引擎是否已初始化，只读属性
    """
```

### 4. 模块文档规范

#### 4.1 模块头部文档

```python
"""
量化信号引擎模块

本模块提供量化信号生成的核心功能，包括：
- 市场数据异常检测
- 量化信号计算
- 信号质量评估
- 历史信号回测

主要类：
    QuantSignalEngine: 信号引擎主类
    QuantSignal: 信号数据模型
    SignalConfig: 信号配置类

主要函数：
    calculate_signal: 计算单个信号
    batch_calculate: 批量计算信号
    validate_signal: 验证信号质量

作者: AI Assistant
版本: v1.0
日期: 2025年1月17日
"""
```

### 5. 特殊情况的文档

#### 5.1 异步函数

```python
async def fetch_market_data(self, symbol: str) -> pd.DataFrame:
    """
    异步获取市场数据。
    
    从外部API异步获取指定股票的市场数据，支持并发请求。
    
    Args:
        symbol: 股票代码，如'AAPL'
        
    Returns:
        pd.DataFrame: 包含OHLCV数据的DataFrame
        
    Raises:
        APIError: 当API请求失败时
        TimeoutError: 当请求超时时
        
    Examples:
        >>> data = await engine.fetch_market_data('AAPL')
        >>> print(data.head())
    """
```

#### 5.2 装饰器函数

```python
def retry_on_failure(max_retries: int = 3):
    """
    失败重试装饰器。
    
    当函数执行失败时，自动重试指定次数。
    
    Args:
        max_retries: 最大重试次数，默认3次
        
    Returns:
        装饰器函数
        
    Examples:
        >>> @retry_on_failure(max_retries=5)
        ... def risky_operation():
        ...     # 可能失败的操作
        ...     pass
    """
    def decorator(func):
        # 装饰器实现
        pass
    return decorator
```

#### 5.3 属性文档

```python
class QuantSignal:
    """量化信号数据模型。"""
    
    @property
    def strength(self) -> float:
        """
        信号强度。
        
        范围[0, 1]，值越大表示信号越强。
        0表示无信号，1表示最强信号。
        
        Returns:
            float: 信号强度值
        """
        return self._strength
```

### 6. 文档质量检查

#### 6.1 自动检查工具

使用项目提供的文档质量检查工具：

```bash
# 检查docstring覆盖率
python tools/scripts/check_docs_quality.py

# 检查特定文件
python tools/scripts/check_docs_quality.py --file src/engines/quant_signal.py
```

#### 6.2 手动检查清单

- [ ] 所有公共函数都有docstring
- [ ] docstring包含所有必需部分
- [ ] 参数描述准确完整
- [ ] 返回值描述清晰
- [ ] 异常情况都有说明
- [ ] 示例代码可以运行
- [ ] 格式符合Google风格

### 7. 常见错误和最佳实践

#### 7.1 常见错误

❌ **错误示例**：
```python
def calculate_signal(data):
    """计算信号"""
    pass
```

✅ **正确示例**：
```python
def calculate_signal(data: pd.DataFrame) -> QuantSignal:
    """
    计算量化信号，基于市场数据异常检测。
    
    Args:
        data: 市场数据DataFrame，必须包含'price'和'volume'列
        
    Returns:
        QuantSignal: 包含信号强度和置信度的信号对象
        
    Raises:
        DataValidationError: 当数据格式不正确时
    """
    pass
```

#### 7.2 最佳实践

1. **保持简洁**: docstring应该简洁明了，避免冗余
2. **及时更新**: 代码变更时同步更新docstring
3. **使用类型提示**: 结合类型提示使文档更清晰
4. **提供示例**: 复杂函数应该提供使用示例
5. **解释业务逻辑**: 重点解释"为什么"而不是"做什么"

### 8. 工具和IDE支持

#### 8.1 VS Code扩展

推荐安装以下扩展：
- Python Docstring Generator
- autoDocstring
- Python Type Hint

#### 8.2 自动生成工具

```bash
# 安装docstring生成工具
pip install docstring-generator

# 为文件生成docstring模板
docstring-generator src/engines/quant_signal.py
```

---

## 总结

遵循本规范可以确保：
- 代码的可读性和可维护性
- 团队协作的效率
- 文档与代码的同步性
- 项目的长期健康发展

记住：**好的docstring是代码的第一层文档，也是最重要的文档。**

---

**维护说明**:
- 本规范与《测试宪法》第八章保持一致
- 定期审查和更新规范内容
- 新团队成员必须学习本规范
- 代码审查时必须检查docstring质量
