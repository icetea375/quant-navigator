#!/bin/bash

# v10.5双脑分治架构部署脚本
# 自动化部署流程

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查环境
check_environment() {
    log_info "检查部署环境..."

    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装"
        exit 1
    fi

    # 检查Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python3未安装"
        exit 1
    fi

    # 检查MySQL
    if ! command -v mysql &> /dev/null; then
        log_error "MySQL未安装"
        exit 1
    fi

    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_warning "Docker未安装，将跳过容器化部署"
    fi

    log_success "环境检查通过"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."

    # 安装后端依赖
    log_info "安装后端依赖..."
    cd backend
    npm install --production
    cd ..

    # 安装前端依赖
    log_info "安装前端依赖..."
    cd frontend
    npm install --production
    cd ..

    # 安装Python依赖
    log_info "安装Python依赖..."
    pip3 install -r requirements.txt

    log_success "依赖安装完成"
}

# 运行数据库迁移
run_migration() {
    log_info "运行数据库迁移..."

    # 检查数据库连接
    if ! mysql -h${DB_HOST:-localhost} -u${DB_USER:-root} -p${DB_PASSWORD} -e "SELECT 1;" &> /dev/null; then
        log_error "无法连接到数据库"
        exit 1
    fi

    # 运行迁移脚本
    node scripts/migrate-database-v10.5.js migrate

    log_success "数据库迁移完成"
}

# 构建项目
build_project() {
    log_info "构建项目..."

    # 构建后端
    log_info "构建后端..."
    cd backend
    npm run build
    cd ..

    # 构建前端
    log_info "构建前端..."
    cd frontend
    npm run build
    cd ..

    log_success "项目构建完成"
}

# 运行测试
run_tests() {
    log_info "运行测试套件..."

    # 运行单元测试
    log_info "运行单元测试..."
    npm test -- --testPathPattern=unit --passWithNoTests

    # 运行集成测试
    log_info "运行集成测试..."
    npm test -- --testPathPattern=integration --passWithNoTests

    # 运行双脑分析测试
    log_info "运行双脑分析测试..."
    npm test -- --testPathPattern=dual-brain --passWithNoTests

    log_success "所有测试通过"
}

# 创建Docker镜像
build_docker_images() {
    if command -v docker &> /dev/null; then
        log_info "构建Docker镜像..."

        # 构建后端镜像
        log_info "构建后端Docker镜像..."
        docker build -t quantnav-backend:v10.5 ./backend

        # 构建前端镜像
        log_info "构建前端Docker镜像..."
        docker build -t quantnav-frontend:v10.5 ./frontend

        log_success "Docker镜像构建完成"
    else
        log_warning "跳过Docker镜像构建"
    fi
}

# 启动服务
start_services() {
    log_info "启动服务..."

    # 启动后端服务
    log_info "启动后端服务..."
    cd backend
    nohup npm start > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../logs/backend.pid
    cd ..

    # 等待后端服务启动
    sleep 5

    # 启动前端服务
    log_info "启动前端服务..."
    cd frontend
    nohup npm start > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../logs/frontend.pid
    cd ..

    # 检查服务状态
    sleep 10

    if ps -p $BACKEND_PID > /dev/null; then
        log_success "后端服务启动成功 (PID: $BACKEND_PID)"
    else
        log_error "后端服务启动失败"
        exit 1
    fi

    if ps -p $FRONTEND_PID > /dev/null; then
        log_success "前端服务启动成功 (PID: $FRONTEND_PID)"
    else
        log_error "前端服务启动失败"
        exit 1
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."

    # 检查后端API
    if curl -f http://localhost:8000/health &> /dev/null; then
        log_success "后端API健康检查通过"
    else
        log_error "后端API健康检查失败"
        exit 1
    fi

    # 检查前端页面
    if curl -f http://localhost:3000 &> /dev/null; then
        log_success "前端页面健康检查通过"
    else
        log_error "前端页面健康检查失败"
        exit 1
    fi

    # 检查双脑分析API
    if curl -f http://localhost:8000/api/dual-brain/pending-cases &> /dev/null; then
        log_success "双脑分析API健康检查通过"
    else
        log_warning "双脑分析API健康检查失败，可能需要配置API密钥"
    fi
}

# 创建日志目录
create_log_dirs() {
    log_info "创建日志目录..."
    mkdir -p logs
    log_success "日志目录创建完成"
}

# 显示部署信息
show_deployment_info() {
    log_success "v10.5双脑分治架构部署完成！"
    echo ""
    echo "📱 前端地址: http://localhost:3000"
    echo "🔧 后端地址: http://localhost:8000"
    echo "🧠 双脑分析API: http://localhost:8000/api/dual-brain"
    echo "📊 仲裁仪表盘: http://localhost:3000/arbitration"
    echo ""
    echo "📋 服务状态:"
    echo "  - 后端服务PID: $(cat logs/backend.pid 2>/dev/null || echo 'N/A')"
    echo "  - 前端服务PID: $(cat logs/frontend.pid 2>/dev/null || echo 'N/A')"
    echo ""
    echo "📝 日志文件:"
    echo "  - 后端日志: logs/backend.log"
    echo "  - 前端日志: logs/frontend.log"
    echo ""
    echo "🔧 管理命令:"
    echo "  - 停止服务: ./scripts/stop-v10.5.sh"
    echo "  - 重启服务: ./scripts/restart-v10.5.sh"
    echo "  - 查看日志: tail -f logs/backend.log"
    echo ""
}

# 主函数
main() {
    log_info "开始部署v10.5双脑分治架构..."

    # 检查参数
    if [ "$1" = "--skip-tests" ]; then
        SKIP_TESTS=true
    fi

    # 执行部署步骤
    check_environment
    create_log_dirs
    install_dependencies
    run_migration

    if [ "$SKIP_TESTS" != "true" ]; then
        run_tests
    else
        log_warning "跳过测试步骤"
    fi

    build_project
    build_docker_images
    start_services
    health_check
    show_deployment_info

    log_success "部署完成！"
}

# 执行主函数
main "$@"
