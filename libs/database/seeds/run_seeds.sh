#!/bin/bash

# 数据库种子数据执行脚本
# 用于初始化系统的核心配置和示例数据

set -e

# 配置变量
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-quant_navigator}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-password}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查PostgreSQL连接
check_db_connection() {
    log_info "检查数据库连接..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_info "数据库连接成功"
    else
        log_error "无法连接到数据库，请检查配置"
        exit 1
    fi
}

# 执行SQL文件
run_sql_file() {
    local file=$1
    local description=$2

    if [ -f "$file" ]; then
        log_info "执行: $description"
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$file"
        if [ $? -eq 0 ]; then
            log_info "✓ $description 执行成功"
        else
            log_error "✗ $description 执行失败"
            exit 1
        fi
    else
        log_warn "文件不存在: $file"
    fi
}

# 主函数
main() {
    log_info "开始执行数据库种子数据初始化..."

    # 检查数据库连接
    check_db_connection

    # 获取脚本所在目录
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    # 按顺序执行种子数据脚本
    run_sql_file "$SCRIPT_DIR/01_system_configs.sql" "系统配置数据"
    run_sql_file "$SCRIPT_DIR/02_industry_classification.sql" "行业分类数据"
    run_sql_file "$SCRIPT_DIR/03_users.sql" "用户管理数据"
    run_sql_file "$SCRIPT_DIR/04_sample_data.sql" "示例数据"

    log_info "数据库种子数据初始化完成！"
    log_info "系统已准备就绪，可以启动应用服务"
}

# 显示使用说明
show_usage() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --host HOST     数据库主机 (默认: localhost)"
    echo "  -p, --port PORT     数据库端口 (默认: 5432)"
    echo "  -d, --database NAME 数据库名称 (默认: quant_navigator)"
    echo "  -u, --user USER     数据库用户 (默认: postgres)"
    echo "  -w, --password PASS 数据库密码 (默认: password)"
    echo "  --help              显示此帮助信息"
    echo ""
    echo "环境变量:"
    echo "  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
    echo ""
    echo "示例:"
    echo "  $0"
    echo "  $0 -h localhost -p 5432 -d quant_navigator -u postgres -w mypassword"
    echo "  DB_PASSWORD=mypassword $0"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            DB_HOST="$2"
            shift 2
            ;;
        -p|--port)
            DB_PORT="$2"
            shift 2
            ;;
        -d|--database)
            DB_NAME="$2"
            shift 2
            ;;
        -u|--user)
            DB_USER="$2"
            shift 2
            ;;
        -w|--password)
            DB_PASSWORD="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            log_error "未知参数: $1"
            show_usage
            exit 1
            ;;
    esac
done

# 执行主函数
main
