#!/bin/bash

# v9.6全流程测试执行脚本
# 基于"第一步：逻辑验证与快速迭代"计划和v9.6统一开发文档

set -e

# 默认配置
START_DATE="2024-01-01"
END_DATE="2024-03-31"
PRELOAD_DAYS=180
DB_HOST="localhost"
DB_PORT=5432
DB_NAME="news_analysis"
DB_USER="news_user"
DB_PASSWORD="news_password"
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_DB=0
SKIP_ENV_SETUP=false
PARALLEL_TESTS=false

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 显示帮助信息
show_help() {
    echo "v9.6全流程测试执行脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --start-date DATE        主测试开始日期 (默认: 2024-01-01)"
    echo "  --end-date DATE          主测试结束日期 (默认: 2024-03-31)"
    echo "  --preload-days DAYS      预加载天数 (默认: 180)"
    echo "  --db-host HOST           数据库主机 (默认: localhost)"
    echo "  --db-port PORT           数据库端口 (默认: 5432)"
    echo "  --db-name NAME           数据库名称 (默认: news_analysis)"
    echo "  --db-user USER           数据库用户 (默认: news_user)"
    echo "  --db-password PASS       数据库密码 (默认: news_password)"
    echo "  --redis-host HOST        Redis主机 (默认: localhost)"
    echo "  --redis-port PORT        Redis端口 (默认: 6379)"
    echo "  --redis-db DB            Redis数据库 (默认: 0)"
    echo "  --skip-env-setup         跳过环境准备步骤"
    echo "  --parallel               启用并行测试"
    echo "  --help                   显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --start-date 2024-01-01 --end-date 2024-03-31"
    echo "  $0 --skip-env-setup --parallel"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --start-date)
            START_DATE="$2"
            shift 2
            ;;
        --end-date)
            END_DATE="$2"
            shift 2
            ;;
        --preload-days)
            PRELOAD_DAYS="$2"
            shift 2
            ;;
        --db-host)
            DB_HOST="$2"
            shift 2
            ;;
        --db-port)
            DB_PORT="$2"
            shift 2
            ;;
        --db-name)
            DB_NAME="$2"
            shift 2
            ;;
        --db-user)
            DB_USER="$2"
            shift 2
            ;;
        --db-password)
            DB_PASSWORD="$2"
            shift 2
            ;;
        --redis-host)
            REDIS_HOST="$2"
            shift 2
            ;;
        --redis-port)
            REDIS_PORT="$2"
            shift 2
            ;;
        --redis-db)
            REDIS_DB="$2"
            shift 2
            ;;
        --skip-env-setup)
            SKIP_ENV_SETUP=true
            shift
            ;;
        --parallel)
            PARALLEL_TESTS=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_message $RED "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 显示配置信息
print_message $BLUE "=== v9.6全流程测试配置 ==="
echo "主测试期: $START_DATE 到 $END_DATE"
echo "预加载期: $(( $(date -d "$START_DATE" +%s) - $PRELOAD_DAYS * 86400 )) 到 $START_DATE"
echo "数据库: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo "Redis: $REDIS_HOST:$REDIS_PORT/$REDIS_DB"
echo "跳过环境准备: $SKIP_ENV_SETUP"
echo "并行测试: $PARALLEL_TESTS"
echo ""

# 检查Python环境
print_message $YELLOW "检查Python环境..."
if ! command -v python3 &> /dev/null; then
    print_message $RED "Python3未安装"
    exit 1
fi

# 检查虚拟环境
if [ ! -d "test_v95_env" ]; then
    print_message $YELLOW "创建测试虚拟环境..."
    python3 -m venv test_v95_env
    source test_v95_env/bin/activate
    pip install pandas numpy sqlalchemy psycopg2-binary redis aiohttp requests
    deactivate
fi

# 激活虚拟环境
source test_v95_env/bin/activate

# 运行环境准备
if [ "$SKIP_ENV_SETUP" = false ]; then
    print_message $YELLOW "运行环境准备..."
    python3 tests/unit/test_environment_setup.py \
        --start-date "$START_DATE" \
        --end-date "$END_DATE" \
        --preload-days "$PRELOAD_DAYS" \
        --db-host "$DB_HOST" \
        --db-port "$DB_PORT" \
        --db-name "$DB_NAME" \
        --db-user "$DB_USER" \
        --db-password "$DB_PASSWORD" \
        --redis-host "$REDIS_HOST" \
        --redis-port "$REDIS_PORT" \
        --redis-db "$REDIS_DB"
    
    if [ $? -ne 0 ]; then
        print_message $RED "环境准备失败"
        exit 1
    fi
    
    print_message $GREEN "环境准备完成"
fi

# 运行完整工作流测试
print_message $YELLOW "运行v9.6完整工作流测试..."
python3 tests/unit/test_complete_workflow.py \
    --start-date "$START_DATE" \
    --end-date "$END_DATE" \
    --preload-days "$PRELOAD_DAYS" \
    --db-host "$DB_HOST" \
    --db-port "$DB_PORT" \
    --db-name "$DB_NAME" \
    --db-user "$DB_USER" \
    --db-password "$DB_PASSWORD" \
    --redis-host "$REDIS_HOST" \
    --redis-port "$REDIS_PORT" \
    --redis-db "$REDIS_DB"

if [ $? -ne 0 ]; then
    print_message $RED "完整工作流测试失败"
    exit 1
fi

print_message $GREEN "v9.6全流程测试完成！"

# 显示测试报告
if [ -f "test_report_*.json" ]; then
    print_message $BLUE "测试报告已生成:"
    ls -la test_report_*.json
fi

deactivate
