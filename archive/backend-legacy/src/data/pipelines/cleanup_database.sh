#!/bin/bash

# 雪球个股热帖数据清理脚本
# 每天凌晨2点执行一次

# 设置脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 设置日志文件
LOG_FILE="$PROJECT_ROOT/logs/cleanup_database.log"
mkdir -p "$(dirname "$LOG_FILE")"

# 设置Python环境
PYTHON_ENV="$PROJECT_ROOT/crawl4ai/xueqiu_api/test_env"
PYTHON_SCRIPT="$PROJECT_ROOT/crawl4ai/xueqiu_api/cleanup_service.py"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "开始执行数据库清理任务"

# 检查Python环境
if [ ! -d "$PYTHON_ENV" ]; then
    log "错误: Python虚拟环境不存在: $PYTHON_ENV"
    exit 1
fi

# 检查Python脚本
if [ ! -f "$PYTHON_SCRIPT" ]; then
    log "错误: Python脚本不存在: $PYTHON_SCRIPT"
    exit 1
fi

# 激活虚拟环境并执行清理
log "激活Python虚拟环境: $PYTHON_ENV"
source "$PYTHON_ENV/bin/activate"

log "执行清理脚本: $PYTHON_SCRIPT"
cd "$PROJECT_ROOT/crawl4ai/xueqiu_api"

# 执行清理，捕获输出
python cleanup_service.py 2>&1 | tee -a "$LOG_FILE"
EXIT_CODE=${PIPESTATUS[0]}

if [ $EXIT_CODE -eq 0 ]; then
    log "数据库清理任务执行成功"
else
    log "数据库清理任务执行失败，退出码: $EXIT_CODE"
fi

log "数据库清理任务结束"
exit $EXIT_CODE
