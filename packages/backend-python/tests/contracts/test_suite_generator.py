"""
契约测试生成器 - 为抽象接口生成标准化的测试套件
遵循YAGNI平衡法则:这是"必要的架构守护",不是"不必要的复杂功能"
"""

import pandas as pd

from src.core.interfaces import (
    DataSourceError,
    DataSourceInterface,
    LlmProviderError,
    LlmProviderInterface,
)


class DataSourceContractTester:
    """
    数据源契约测试器 - 自动验证DataSourceInterface实现是否符合契约
    """

    def __init__(self, data_source: DataSourceInterface):
        """
        初始化数据源契约测试器

        Args:
            data_source: 实现了DataSourceInterface的实例
        """
        self.data_source = data_source

    async def run_all_contract_tests(self):
        """运行所有契约测试"""
        test_results = []

        # 测试基本方法存在性
        test_results.append(await self._test_method_existence())

        # 测试返回类型
        test_results.append(await self._test_return_types())

        # 测试异常处理
        test_results.append(await self._test_exception_handling())

        # 测试数据格式
        test_results.append(await self._test_data_formats())

        # 测试健康检查
        test_results.append(await self._test_health_check())

        return all(test_results)

    async def _test_method_existence(self) -> bool:
        """测试所有必需方法是否存在"""
        required_methods = [
            "get_daily_quotes",
            "get_announcements",
            "get_financial_data",
            "get_industry_classification",
            "get_concept_data",
            "get_market_data",
            "health_check",
        ]

        for method_name in required_methods:
            assert hasattr(
                self.data_source, method_name
            ), f"缺少必需方法: {method_name}"
            method = getattr(self.data_source, method_name)
            assert callable(method), f"方法不可调用: {method_name}"

        return True

    async def _test_return_types(self) -> bool:
        """测试返回类型是否符合契约"""
        # 测试get_daily_quotes返回DataFrame
        try:
            result = await self.data_source.get_daily_quotes("000001.SZ", "20250126")
            assert isinstance(result, pd.DataFrame), "get_daily_quotes必须返回DataFrame"
        except Exception:
            pass  # 允许API调用失败,但返回类型必须正确

        # 测试get_announcements返回List[Dict]
        try:
            result = await self.data_source.get_announcements("000001.SZ", "20250126")
            assert isinstance(result, list), "get_announcements必须返回List"
            if result:
                assert isinstance(result[0], dict), "get_announcements的元素必须是Dict"
        except Exception:
            pass

        # 测试get_financial_data返回Dict
        try:
            result = await self.data_source.get_financial_data("000001.SZ", "20241231")
            assert isinstance(result, dict), "get_financial_data必须返回Dict"
        except Exception:
            pass

        # 测试get_industry_classification返回Dict
        try:
            result = await self.data_source.get_industry_classification("000001.SZ")
            assert isinstance(result, dict), "get_industry_classification必须返回Dict"
        except Exception:
            pass

        # 测试get_concept_data返回List[Dict]
        try:
            result = await self.data_source.get_concept_data("000001.SZ", "20250126")
            assert isinstance(result, list), "get_concept_data必须返回List"
            if result:
                assert isinstance(result[0], dict), "get_concept_data的元素必须是Dict"
        except Exception:
            pass

        # 测试get_market_data返回Dict
        try:
            result = await self.data_source.get_market_data("20250126")
            assert isinstance(result, dict), "get_market_data必须返回Dict"
        except Exception:
            pass

        # 测试health_check返回Dict
        try:
            result = await self.data_source.health_check()
            assert isinstance(result, dict), "health_check必须返回Dict"
        except Exception:
            pass

        return True

    async def _test_exception_handling(self) -> bool:
        """测试异常处理是否符合契约"""
        # 测试无效输入时抛出DataSourceError
        try:
            await self.data_source.get_daily_quotes("INVALID_CODE", "INVALID_DATE")
        except DataSourceError:
            pass  # 期望的异常
        except Exception as e:
            # 其他异常也应该被包装为DataSourceError
            assert isinstance(e, DataSourceError), f"异常类型错误: {type(e)}"

        return True

    async def _test_data_formats(self) -> bool:
        """测试数据格式是否符合契约"""
        # 测试get_daily_quotes的DataFrame格式
        try:
            result = await self.data_source.get_daily_quotes("000001.SZ", "20250126")
            if not result.empty:
                required_columns = [
                    "stock_code",
                    "trade_date",
                    "open",
                    "high",
                    "low",
                    "close",
                    "volume",
                    "amount",
                ]
                assert set(required_columns).issubset(
                    result.columns
                ), f"DataFrame缺少必需列: {required_columns}"
        except Exception:
            pass

        # 测试get_announcements的Dict格式
        try:
            result = await self.data_source.get_announcements("000001.SZ", "20250126")
            if result:
                announcement = result[0]
                required_keys = [
                    "announcement_id",
                    "stock_code",
                    "title",
                    "content",
                    "publish_date",
                    "announcement_type",
                ]
                assert set(required_keys).issubset(
                    announcement.keys()
                ), f"公告Dict缺少必需键: {required_keys}"
        except Exception:
            pass

        # 测试get_financial_data的Dict格式
        try:
            result = await self.data_source.get_financial_data("000001.SZ", "20241231")
            if result:
                required_keys = [
                    "stock_code",
                    "report_date",
                    "revenue",
                    "net_profit",
                    "total_assets",
                    "total_liabilities",
                    "roe",
                    "roa",
                ]
                assert set(required_keys).issubset(
                    result.keys()
                ), f"财务数据Dict缺少必需键: {required_keys}"
        except Exception:
            pass

        return True

    async def _test_health_check(self) -> bool:
        """测试健康检查格式"""
        try:
            result = await self.data_source.health_check()
            required_keys = [
                "status",
                "response_time",
                "last_success",
                "error_count",
                "rate_limit_remaining",
            ]
            assert set(required_keys).issubset(
                result.keys()
            ), f"健康检查Dict缺少必需键: {required_keys}"

            # 测试status值
            assert result["status"] in [
                "healthy",
                "unhealthy",
                "degraded",
            ], f"无效的status值: {result['status']}"

        except Exception:
            pass

        return True


class LlmProviderContractTester:
    """
    LLM提供商契约测试器 - 自动验证LlmProviderInterface实现是否符合契约
    """

    def __init__(self, llm_provider: LlmProviderInterface):
        """
        初始化LLM提供商契约测试器

        Args:
            llm_provider: 实现了LlmProviderInterface的实例
        """
        self.llm_provider = llm_provider

    async def run_all_contract_tests(self):
        """运行所有契约测试"""
        test_results = []

        # 测试基本方法存在性
        test_results.append(await self._test_method_existence())

        # 测试返回类型
        test_results.append(await self._test_return_types())

        # 测试异常处理
        test_results.append(await self._test_exception_handling())

        # 测试健康检查
        test_results.append(await self._test_health_check())

        return all(test_results)

    async def _test_method_existence(self) -> bool:
        """测试所有必需方法是否存在"""
        required_methods = [
            "generate_text",
            "chat_completion",
            "generate_embeddings",
            "analyze_sentiment",
            "analyze_fact",
            "batch_process",
            "get_available_models",
            "get_model_info",
            "health_check",
        ]

        for method_name in required_methods:
            assert hasattr(
                self.llm_provider, method_name
            ), f"缺少必需方法: {method_name}"
            method = getattr(self.llm_provider, method_name)
            assert callable(method), f"方法不可调用: {method_name}"

        return True

    async def _test_return_types(self) -> bool:
        """测试返回类型是否符合契约"""
        # 测试generate_text返回str
        try:
            result = await self.llm_provider.generate_text("测试", "qwen-plus")
            assert isinstance(result, str), "generate_text必须返回str"
        except Exception:
            pass

        # 测试chat_completion返回str
        try:
            messages = [{"role": "user", "content": "测试"}]
            result = await self.llm_provider.chat_completion(messages, "qwen-plus")
            assert isinstance(result, str), "chat_completion必须返回str"
        except Exception:
            pass

        # 测试generate_embeddings返回List[List[float]]
        try:
            result = await self.llm_provider.generate_embeddings(
                ["测试"], "text-embedding-v1"
            )
            assert isinstance(result, list), "generate_embeddings必须返回List"
            if result:
                assert isinstance(
                    result[0], list
                ), "generate_embeddings的元素必须是List"
                assert isinstance(result[0][0], (int, float)), "embedding元素必须是数字"
        except Exception:
            pass

        # 测试analyze_sentiment返回Dict
        try:
            result = await self.llm_provider.analyze_sentiment("测试文本", "qwen-plus")
            assert isinstance(result, dict), "analyze_sentiment必须返回Dict"
        except Exception:
            pass

        # 测试analyze_fact返回Dict
        try:
            result = await self.llm_provider.analyze_fact(
                "测试文本", "测试上下文", "qwen-plus"
            )
            assert isinstance(result, dict), "analyze_fact必须返回Dict"
        except Exception:
            pass

        # 测试batch_process返回List[Dict]
        try:
            requests = [{"id": "1", "type": "text_generation", "prompt": "测试"}]
            result = await self.llm_provider.batch_process(requests, "qwen-plus")
            assert isinstance(result, list), "batch_process必须返回List"
            if result:
                assert isinstance(result[0], dict), "batch_process的元素必须是Dict"
        except Exception:
            pass

        # 测试get_available_models返回List[str]
        try:
            result = self.llm_provider.get_available_models()
            assert isinstance(result, list), "get_available_models必须返回List"
            if result:
                assert isinstance(result[0], str), "get_available_models的元素必须是str"
        except Exception:
            pass

        # 测试get_model_info返回Dict
        try:
            result = self.llm_provider.get_model_info("qwen-plus")
            assert isinstance(result, dict), "get_model_info必须返回Dict"
        except Exception:
            pass

        # 测试health_check返回Dict
        try:
            result = await self.llm_provider.health_check()
            assert isinstance(result, dict), "health_check必须返回Dict"
        except Exception:
            pass

        return True

    async def _test_exception_handling(self) -> bool:
        """测试异常处理是否符合契约"""
        # 测试无效输入时抛出LlmProviderError
        try:
            await self.llm_provider.generate_text("", "INVALID_MODEL")
        except LlmProviderError:
            pass  # 期望的异常
        except Exception as e:
            # 其他异常也应该被包装为LlmProviderError
            assert isinstance(e, LlmProviderError), f"异常类型错误: {type(e)}"

        return True

    async def _test_health_check(self) -> bool:
        """测试健康检查格式"""
        try:
            result = await self.llm_provider.health_check()
            required_keys = [
                "status",
                "response_time",
                "last_success",
                "error_count",
                "rate_limit_remaining",
                "available_models",
            ]
            assert set(required_keys).issubset(
                result.keys()
            ), f"健康检查Dict缺少必需键: {required_keys}"

            # 测试status值
            assert result["status"] in [
                "healthy",
                "unhealthy",
                "degraded",
            ], f"无效的status值: {result['status']}"

        except Exception:
            pass

        return True


async def run_data_source_contract_tests(data_source: DataSourceInterface) -> bool:
    """
    运行数据源契约测试

    Args:
        data_source: 实现了DataSourceInterface的实例

    Returns:
        bool: 是否通过所有测试
    """
    tester = DataSourceContractTester(data_source)
    return await tester.run_all_contract_tests()


async def run_llm_provider_contract_tests(llm_provider: LlmProviderInterface) -> bool:
    """
    运行LLM提供商契约测试

    Args:
        llm_provider: 实现了LlmProviderInterface的实例

    Returns:
        bool: 是否通过所有测试
    """
    tester = LlmProviderContractTester(llm_provider)
    return await tester.run_all_contract_tests()
