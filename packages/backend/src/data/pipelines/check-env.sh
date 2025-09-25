#!/bin/bash

# 环境变量检查脚本
# 用于检查各服务的环境变量配置

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查全局环境变量
check_global_env() {
    log_info "检查全局环境变量..."
    
    if [ -f ".env" ]; then
        log_success "找到全局 .env 文件"
        
        # 检查关键环境变量
        local required_vars=("NODE_ENV" "HOST" "JWT_SECRET")
        for var in "${required_vars[@]}"; do
            if grep -q "^${var}=" .env; then
                log_success "$var 已配置"
            else
                log_warning "$var 未配置"
            fi
        done
        
        # 显示端口配置
        log_info "端口配置："
        grep "^.*_PORT=" .env | while read line; do
            echo "  $line"
        done
    else
        log_error "未找到全局 .env 文件"
        return 1
    fi
}

# 检查新闻分析服务环境变量
check_analysis_env() {
    log_info "检查新闻分析服务环境变量..."
    
    if [ -f "news-analysis-service/.env" ]; then
        log_success "找到新闻分析服务 .env 文件"
        
        # 检查关键配置
        local port=$(grep "^PORT=" news-analysis-service/.env | cut -d'=' -f2)
        if [ "$port" = "3001" ]; then
            log_success "新闻分析服务端口配置正确: $port"
        else
            log_warning "新闻分析服务端口配置: $port (期望: 3001)"
        fi
    else
        log_warning "未找到新闻分析服务 .env 文件"
    fi
}

# 检查雪球API服务环境变量
check_xueqiu_env() {
    log_info "检查雪球API服务环境变量..."
    
    if [ -f "crawl4ai/xueqiu_api/.env" ]; then
        log_success "找到雪球API服务 .env 文件"
    else
        log_warning "未找到雪球API服务 .env 文件"
    fi
}

# 检查虚拟环境
check_virtual_env() {
    log_info "检查虚拟环境..."
    
    # 检查Python虚拟环境
    if [ -d "crawl4ai/xueqiu_api/test_env" ]; then
        log_success "找到Python虚拟环境: crawl4ai/xueqiu_api/test_env"
        
        # 检查虚拟环境中的Python
        if [ -f "crawl4ai/xueqiu_api/test_env/bin/python" ]; then
            log_success "Python解释器存在"
        else
            log_error "Python解释器不存在"
        fi
    else
        log_warning "未找到Python虚拟环境"
    fi
    
    # 检查Node.js依赖
    if [ -d "news-analysis-service/node_modules" ]; then
        log_success "找到新闻分析服务依赖"
    else
        log_warning "未找到新闻分析服务依赖"
    fi
}

# 检查端口占用
check_ports() {
    log_info "检查端口占用情况..."
    
    local ports=("3000" "3001" "5173" "8000" "8001")
    for port in "${ports[@]}"; do
        if lsof -i :$port >/dev/null 2>&1; then
            local process=$(lsof -i :$port | tail -n1 | awk '{print $1}')
            log_warning "端口 $port 被占用: $process"
        else
            log_success "端口 $port 可用"
        fi
    done
}

# 检查环境变量冲突
check_env_conflicts() {
    log_info "检查环境变量冲突..."
    
    # 检查是否有重复的PORT配置
    local port_count=$(grep -r "^PORT=" . --include="*.env" 2>/dev/null | wc -l)
    if [ $port_count -gt 1 ]; then
        log_warning "发现多个PORT配置:"
        grep -r "^PORT=" . --include="*.env" 2>/dev/null | while read line; do
            echo "  $line"
        done
    else
        log_success "PORT配置无冲突"
    fi
}

# 主函数
main() {
    echo "🔍 环境变量检查工具"
    echo "========================"
    echo ""
    
    check_global_env
    echo ""
    
    check_analysis_env
    echo ""
    
    check_xueqiu_env
    echo ""
    
    check_virtual_env
    echo ""
    
    check_ports
    echo ""
    
    check_env_conflicts
    echo ""
    
    log_info "环境检查完成"
}

# 运行主函数
main "$@"
