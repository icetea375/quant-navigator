#!/bin/bash

# NewsNow 停止脚本
# 停止前端和后端服务

set -e

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

echo "🛑 NewsNow 停止脚本"
echo "===================="
echo ""

# 停止前端服务
if [ -f ".frontend.pid" ]; then
    local frontend_pid=$(cat .frontend.pid)
    if ps -p $frontend_pid >/dev/null 2>&1; then
        log_info "停止前端服务 (PID: $frontend_pid)..."
        kill $frontend_pid
        sleep 2

        if ! ps -p $frontend_pid >/dev/null 2>&1; then
            log_success "前端服务已停止"
        else
            log_warning "前端服务仍在运行，强制停止..."
            kill -9 $frontend_pid
        fi
    else
        log_warning "前端服务进程不存在"
    fi
    rm -f .frontend.pid
else
    log_info "前端服务未启动"
fi

# 停止后端服务
if [ -f "news-analysis-service/.backend.pid" ]; then
    local backend_pid=$(cat news-analysis-service/.backend.pid)
    if ps -p $backend_pid >/dev/null 2>&1; then
        log_info "停止后端分析服务 (PID: $backend_pid)..."
        kill $backend_pid
        sleep 2

        if ! ps -p $backend_pid >/dev/null 2>&1; then
            log_success "后端分析服务已停止"
        else
            log_warning "后端分析服务仍在运行，强制停止..."
            kill -9 $backend_pid
        fi
    else
        log_warning "后端分析服务进程不存在"
    fi
    rm -f news-analysis-service/.backend.pid
else
    log_info "后端分析服务未启动"
fi

# 清理其他可能的进程
log_info "清理其他相关进程..."

# 停止vite进程
pkill -f "vite" 2>/dev/null || true

# 停止npm进程
pkill -f "npm run dev" 2>/dev/null || true

# 停止node进程（仅限news-analysis-service）
pkill -f "news-analysis-service.*dist/index.js" 2>/dev/null || true

log_success "🎉 所有服务已停止！"
