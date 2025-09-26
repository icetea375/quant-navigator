"""
CLI工具测试 - 遵循测试宪法TDD原则
先写测试（红灯），再实现功能（绿灯），最后重构
"""

import pytest
from unittest.mock import Mock, patch
from typer.testing import CliRunner
from main import app as cli_app


class TestMainCLI:
    """CLI工具测试类"""

    @pytest.fixture
    def runner(self):
        """创建CLI测试运行器"""
        return CliRunner()

    def test_run_daily_flow_with_date(self, runner):
        """测试运行日常分析工作流 - 指定日期"""
        # Arrange - 准备测试数据
        test_date = "2025-01-26"

        # Act - 执行CLI命令
        result = runner.invoke(cli_app, ["run-daily-flow", "--date", test_date])

        # Assert - 验证结果
        assert result.exit_code == 0
        assert "启动日常分析工作流" in result.output
        assert f"目标日期: {test_date}" in result.output
        assert "工作流已启动" in result.output

    def test_run_daily_flow_without_date(self, runner):
        """测试运行日常分析工作流 - 使用默认日期"""
        # Act - 执行CLI命令（不指定日期）
        result = runner.invoke(cli_app, ["run-daily-flow"])

        # Assert - 验证结果
        assert result.exit_code == 0
        assert "启动日常分析工作流" in result.output
        assert "目标日期:" in result.output
        assert "工作流已启动" in result.output

    def test_run_historical_backfill(self, runner):
        """测试运行历史数据回填工作流"""
        # Arrange - 准备测试数据
        start_date = "20230101"
        end_date = "20231231"

        # Act - 执行CLI命令
        result = runner.invoke(
            cli_app,
            [
                "run-historical-backfill",
                "--start-date",
                start_date,
                "--end-date",
                end_date,
            ],
        )

        # Assert - 验证结果
        assert result.exit_code == 0
        assert "启动历史数据回填工作流" in result.output
        assert f"日期范围: {start_date} 到 {end_date}" in result.output
        assert "历史回填工作流已启动" in result.output

    @patch("uvicorn.run")
    def test_start_server_default(self, mock_uvicorn_run, runner):
        """测试启动服务器 - 默认参数"""
        # Arrange - 模拟uvicorn.run
        mock_uvicorn_run.return_value = None

        # Act - 执行CLI命令
        result = runner.invoke(cli_app, ["start-server"])

        # Assert - 验证结果
        assert result.exit_code == 0
        assert "启动FastAPI服务器" in result.output
        assert "http://0.0.0.0:8000" in result.output
        mock_uvicorn_run.assert_called_once()

    @patch("uvicorn.run")
    def test_start_server_custom_params(self, mock_uvicorn_run, runner):
        """测试启动服务器 - 自定义参数"""
        # Arrange - 准备测试数据
        host = "127.0.0.1"
        port = "9000"
        mock_uvicorn_run.return_value = None

        # Act - 执行CLI命令
        result = runner.invoke(
            cli_app, ["start-server", "--host", host, "--port", port]
        )

        # Assert - 验证结果
        assert result.exit_code == 0
        assert "启动FastAPI服务器" in result.output
        assert f"http://{host}:{port}" in result.output
        mock_uvicorn_run.assert_called_once()

    @patch("uvicorn.run")
    def test_start_server_with_reload(self, mock_uvicorn_run, runner):
        """测试启动服务器 - 开发模式"""
        # Arrange - 模拟uvicorn.run
        mock_uvicorn_run.return_value = None

        # Act - 执行CLI命令
        result = runner.invoke(cli_app, ["start-server", "--reload"])

        # Assert - 验证结果
        assert result.exit_code == 0
        assert "启动FastAPI服务器" in result.output
        assert "http://0.0.0.0:8000" in result.output
        mock_uvicorn_run.assert_called_once()

    @patch("subprocess.run")
    def test_run_tests(self, mock_subprocess_run, runner):
        """测试运行测试套件"""
        # Arrange - 模拟subprocess.run
        mock_subprocess_run.return_value = Mock(returncode=0)

        # Act - 执行CLI命令
        result = runner.invoke(cli_app, ["test"])

        # Assert - 验证结果
        assert result.exit_code == 0
        assert "运行测试套件" in result.output
        assert "所有测试通过" in result.output
        mock_subprocess_run.assert_called_once()

    def test_status(self, runner):
        """测试查看服务状态"""
        # Act - 执行CLI命令
        result = runner.invoke(cli_app, ["status"])

        # Assert - 验证结果
        assert result.exit_code == 0
        assert "量化导航仪后端服务状态" in result.output
        assert "版本: 13.1.0" in result.output
        assert "状态: 运行中" in result.output

    def test_help(self, runner):
        """测试帮助信息"""
        # Act - 执行CLI命令
        result = runner.invoke(cli_app, ["--help"])

        # Assert - 验证结果
        assert result.exit_code == 0
        assert "量化导航仪后端服务 CLI" in result.output
        assert "run-daily-flow" in result.output
        assert "run-historical-backfill" in result.output
        assert "start-server" in result.output
        assert "test" in result.output
        assert "status" in result.output

    def test_invalid_command(self, runner):
        """测试无效命令"""
        # Act - 执行无效命令
        result = runner.invoke(cli_app, ["invalid-command"])

        # Assert - 验证结果
        assert result.exit_code != 0
        assert "No such command" in result.output or "Error" in result.output

    def test_run_daily_flow_error_handling(self, runner):
        """测试日常分析工作流错误处理"""
        # Arrange - 模拟工作流服务错误
        with patch("main.WorkflowService") as mock_service:
            mock_instance = Mock()
            mock_instance.run_daily_flow.side_effect = Exception("工作流启动失败")
            mock_service.return_value = mock_instance

            # Act - 执行CLI命令
            result = runner.invoke(cli_app, ["run-daily-flow", "--date", "2025-01-26"])

            # Assert - 验证结果
            assert result.exit_code == 1
            assert "启动工作流失败" in result.output
            assert "工作流启动失败" in result.output

    def test_run_historical_backfill_error_handling(self, runner):
        """测试历史回填工作流错误处理"""
        # Arrange - 模拟工作流服务错误
        with patch("main.WorkflowService") as mock_service:
            mock_instance = Mock()
            mock_instance.run_historical_backfill.side_effect = Exception(
                "历史回填启动失败"
            )
            mock_service.return_value = mock_instance

            # Act - 执行CLI命令
            result = runner.invoke(
                cli_app,
                [
                    "run-historical-backfill",
                    "--start-date",
                    "20230101",
                    "--end-date",
                    "20231231",
                ],
            )

            # Assert - 验证结果
            assert result.exit_code == 1
            assert "启动历史回填工作流失败" in result.output
            assert "历史回填启动失败" in result.output
