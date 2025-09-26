#!/usr/bin/env python3
"""
量化导航仪后端服务 - CLI入口点
使用Typer创建专业的命令行应用
"""

from datetime import date, datetime

import typer

from src.core.logging_config import setup_logging
from src.services.simple_workflow_service import (
    SimpleWorkflowService as WorkflowService,
)

app = typer.Typer(help="量化导航仪后端服务 CLI")


@app.command()
def run_daily_flow(
    target_date: str = typer.Option(
        None, "--date", "-d", help="目标分析日期 (YYYY-MM-DD)，默认为今天"
    ),
):
    """运行日常分析工作流"""
    if not target_date:
        target_date = date.today().isoformat()

    typer.echo(f"启动日常分析工作流，目标日期: {target_date}")

    # 设置日志
    logger = setup_logging()

    # 运行工作流
    workflow_service = WorkflowService()

    try:
        import asyncio

        workflow_id = asyncio.run(workflow_service.run_daily_flow(target_date))
        typer.echo(f"工作流已启动，ID: {workflow_id}")
    except Exception as e:
        typer.echo(f"启动工作流失败: {e!s}", err=True)
        raise typer.Exit(1)


@app.command()
def run_historical_backfill(
    start_date: str = typer.Option(
        ..., "--start-date", "-s", help="开始日期 (YYYYMMDD)"
    ),
    end_date: str = typer.Option(..., "--end-date", "-e", help="结束日期 (YYYYMMDD)"),
):
    """运行历史数据回填工作流"""
    typer.echo(f"启动历史数据回填工作流，日期范围: {start_date} 到 {end_date}")

    # 设置日志
    logger = setup_logging()

    # 运行工作流
    workflow_service = WorkflowService()

    try:
        import asyncio

        workflow_id = asyncio.run(
            workflow_service.run_historical_backfill(start_date, end_date)
        )
        typer.echo(f"历史回填工作流已启动，ID: {workflow_id}")
    except Exception as e:
        typer.echo(f"启动历史回填工作流失败: {e!s}", err=True)
        raise typer.Exit(1)


@app.command()
def start_server(
    host: str = typer.Option("0.0.0.0", "--host", "-h", help="服务器主机"),
    port: int = typer.Option(8000, "--port", "-p", help="服务器端口"),
    reload: bool = typer.Option(False, "--reload", "-r", help="开发模式热重载"),
):
    """启动FastAPI服务器"""
    typer.echo(f"启动FastAPI服务器: http://{host}:{port}")

    import uvicorn

    uvicorn.run("src.main:app", host=host, port=port, reload=reload, log_level="info")


@app.command()
def test():
    """运行测试套件"""
    typer.echo("运行测试套件...")

    import subprocess
    import sys

    try:
        result = subprocess.run([sys.executable, "-m", "pytest", "-v"], check=True)
        typer.echo("所有测试通过！")
    except subprocess.CalledProcessError as e:
        typer.echo(f"测试失败，退出码: {e.returncode}", err=True)
        raise typer.Exit(e.returncode)


@app.command()
def status():
    """查看服务状态"""
    typer.echo("量化导航仪后端服务状态:")
    typer.echo("版本: 13.1.0")
    typer.echo(f"时间: {datetime.now().isoformat()}")
    typer.echo("状态: 运行中")


if __name__ == "__main__":
    app()
