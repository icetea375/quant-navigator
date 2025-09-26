#!/bin/bash

# NewsNow 服务状态检查脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "📊 NewsNow 服务状态检查"
echo "========================"
echo ""

# 检查环境变量
log_info "环境配置检查："
if [ -n "$ANALYSIS_SERVICE_URL" ]; then
    log_success "ANALYSIS_SERVICE_URL: $ANALYSIS_SERVICE_URL"
else
    log_warning "ANALYSIS_SERVICE_URL: 未设置"
fi

if [ -n "$JWT_SECRET" ]; then
    log_success "JWT_SECRET: 已设置"
else
    log_warning "JWT_SECRET: 未设置"
fi

echo ""

# 检查端口占用
log_info "端口占用检查："

# 检查前端端口
if lsof -i :5173 >/dev/null 2>&1; then
    local frontend_info=$(lsof -i :5173 | grep LISTEN | head -1)
    log_success "端口 5173 (前端): 被占用"
    echo "  $frontend_info"
else
    log_error "端口 5173 (前端): 未被占用"
fi

# 检查后端端口
if lsof -i :3001 >/dev/null 2>&1; then
    local backend_info=$(lsof -i :3001 | grep LISTEN | head -1)
    log_success "端口 3001 (后端): 被占用"
    echo "  $backend_info"
else
    log_error "端口 3001 (后端): 未被占用"
fi

echo ""

# 检查进程状态
log_info "进程状态检查："

# 检查前端进程
frontend_pid=""
if [ -f ".frontend.pid" ]; then
    frontend_pid=$(cat .frontend.pid)
    if ps -p $frontend_pid >/dev/null 2>&1; then
        log_success "前端服务进程: 运行中 (PID: $frontend_pid)"
    else
        log_error "前端服务进程: 已停止 (PID: $frontend_pid)"
    fi
else
    log_warning "前端服务进程: 未找到PID文件"
fi

# 检查后端进程
backend_pid=""
if [ -f "news-analysis-service/.backend.pid" ]; then
    backend_pid=$(cat news-analysis-service/.backend.pid)
    if ps -p $backend_pid >/dev/null 2>&1; then
        log_success "后端服务进程: 运行中 (PID: $backend_pid)"
    else
        log_error "后端服务进程: 已停止 (PID: $backend_pid)"
    fi
else
    log_warning "后端服务进程: 未找到PID文件"
fi

echo ""

# 检查服务健康状态
log_info "服务健康检查："

# 检查前端服务
if [ -n "$frontend_pid" ] && ps -p $frontend_pid >/dev/null 2>&1; then
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        log_success "前端服务: 健康"
    else
        log_error "前端服务: 无法访问"
    fi
else
    log_warning "前端服务: 未运行"
fi

# 检查后端服务
if [ -n "$backend_pid" ] && ps -p $backend_pid >/dev/null 2>&1; then
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        local health_response=$(curl -s http://localhost:3001/health)
        log_success "后端服务: 健康"
        echo "  健康状态: $health_response"
    else
        log_error "后端服务: 无法访问"
    fi
else
    log_warning "后端服务: 未运行"
fi

echo ""

# 显示访问地址
log_info "访问地址："
echo "  🌐 前端服务: http://localhost:5173"
    echo "  🔧 后端服务: http://localhost:3001"
    echo "  📊 健康检查: http://localhost:3001/health"
echo ""

# 显示日志文件位置
log_info "日志文件位置："
if [ -f ".frontend.log" ]; then
    echo "  📝 前端日志: .frontend.log"
else
    echo "  📝 前端日志: 未找到"
fi

if [ -f "news-analysis-service/logs/startup.log" ]; then
    echo "  📝 后端日志: news-analysis-service/logs/startup.log"
else
    echo "  📝 后端日志: 未找到"
fi

echo ""
