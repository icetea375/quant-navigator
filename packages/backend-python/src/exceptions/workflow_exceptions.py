#!/usr/bin/env python3
"""
工作流异常类定义 - TDD第一步:绿灯
定义具体的业务异常类,用于快速失败和错误追踪
"""


class QuantDataProviderError(Exception):
    """
    量化数据提供者错误

    当数据加载,异常检测等数据相关操作失败时抛出
    """

    pass


class LLMServiceError(Exception):
    """
    LLM服务错误

    当LLM服务配置错误,连接失败等AI服务相关操作失败时抛出
    """

    pass


class ArbitrationWorkflowError(Exception):
    """
    仲裁工作流错误

    当仲裁工作流执行失败,案件创建失败等工作流相关操作失败时抛出
    """

    pass
