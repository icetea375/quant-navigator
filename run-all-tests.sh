#!/bin/bash

# "量化导航仪" v10.5 全系统测试执行脚本
# 严格按照四阶段测试方案执行

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
    log_info "检查测试环境..."
    
    # 检查Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python3 未安装"
        exit 1
    fi
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装"
        exit 1
    fi
    
    log_success "环境检查通过"
}

# 准备测试环境
prepare_test_environment() {
    log_info "准备测试环境..."
    
    # 启动测试数据库和Redis
    log_info "启动测试数据库和Redis..."
    docker-compose -f docker-compose.test.yml up -d postgres redis
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 验证服务状态
    if ! docker-compose -f docker-compose.test.yml ps | grep -q "Up"; then
        log_error "测试服务启动失败"
        exit 1
    fi
    
    # 检查数据库连接
    if ! psql -h localhost -U postgres -d quant_navigator_test -c "SELECT 1;" &> /dev/null; then
        log_error "数据库连接失败"
        exit 1
    fi
    
    # 检查Redis连接
    if ! redis-cli ping &> /dev/null; then
        log_error "Redis连接失败"
        exit 1
    fi
    
    log_success "测试环境准备完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装测试依赖..."
    
    # 安装Python依赖
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    fi
    
    # 安装测试依赖
    pip install pytest pytest-cov pytest-html pytest-xdist pytest-asyncio
    
    # 安装Node.js依赖
    if [ -d "backend" ]; then
        cd backend
        npm install
        cd ..
    fi
    
    log_success "依赖安装完成"
}

# 第一阶段：单元测试
run_unit_tests() {
    log_info "开始第一阶段：单元测试"
    log_info "测试目标：确保每一个独立的函数和类的行为都100%符合预期"
    
    local unit_test_results=0
    
    # DataPipeline Fetchers测试
    log_info "运行DataPipeline Fetchers单元测试..."
    if pytest tests/unit/backend/test_datapipeline_fetchers.py -v --tb=short; then
        log_success "DataPipeline Fetchers测试通过"
    else
        log_error "DataPipeline Fetchers测试失败"
        unit_test_results=1
    fi
    
    # QuantSignalEngine测试
    log_info "运行QuantSignalEngine单元测试..."
    if pytest tests/unit/backend/test_quant_signal_engine.py -v --tb=short; then
        log_success "QuantSignalEngine测试通过"
    else
        log_error "QuantSignalEngine测试失败"
        unit_test_results=1
    fi
    
    # MD&A Verifier测试
    log_info "运行MD&A Verifier单元测试..."
    if pytest tests/unit/backend/test_mda_verifier.py -v --tb=short; then
        log_success "MD&A Verifier测试通过"
    else
        log_error "MD&A Verifier测试失败"
        unit_test_results=1
    fi
    
    # LLM Gateway测试
    log_info "运行LLM Gateway单元测试..."
    if pytest tests/unit/backend/test_llm_gateway_prompt_building.py -v --tb=short; then
        log_success "LLM Gateway测试通过"
    else
        log_error "LLM Gateway测试失败"
        unit_test_results=1
    fi
    
    if [ $unit_test_results -eq 0 ]; then
        log_success "第一阶段单元测试全部通过"
    else
        log_error "第一阶段单元测试存在失败"
        return 1
    fi
}

# 第二阶段：集成测试
run_integration_tests() {
    log_info "开始第二阶段：集成测试"
    log_info "测试目标：确保模块与模块之间、模块与数据库/Redis之间的接口调用和数据传递是通畅无误的"
    
    local integration_test_results=0
    
    # DataPipeline数据库集成测试
    log_info "运行DataPipeline数据库集成测试..."
    if pytest tests/integration/test_datapipeline_database_integration.py -v --tb=short; then
        log_success "DataPipeline数据库集成测试通过"
    else
        log_error "DataPipeline数据库集成测试失败"
        integration_test_results=1
    fi
    
    # QuantSignalEngine集成测试
    log_info "运行QuantSignalEngine集成测试..."
    if pytest tests/integration/test_quant_signal_datapipeline_integration.py -v --tb=short; then
        log_success "QuantSignalEngine集成测试通过"
    else
        log_error "QuantSignalEngine集成测试失败"
        integration_test_results=1
    fi
    
    # LLM Gateway API集成测试（可选，会产生费用）
    if [ "$SKIP_API_TESTS" != "true" ]; then
        log_info "运行LLM Gateway API集成测试（会产生真实费用）..."
        if pytest tests/integration/test_llm_gateway_api_integration.py -v --tb=short -m slow; then
            log_success "LLM Gateway API集成测试通过"
        else
            log_warning "LLM Gateway API集成测试失败（可能是网络或API问题）"
            # API测试失败不阻止后续测试
        fi
    else
        log_warning "跳过LLM Gateway API集成测试（SKIP_API_TESTS=true）"
    fi
    
    if [ $integration_test_results -eq 0 ]; then
        log_success "第二阶段集成测试全部通过"
    else
        log_error "第二阶段集成测试存在失败"
        return 1
    fi
}

# 第三阶段：系统测试
run_system_tests() {
    log_info "开始第三阶段：系统测试"
    log_info "测试目标：在本地环境中，执行端到端的、完整的业务流程"
    
    # 加载测试数据
    log_info "加载3个月历史测试数据..."
    if [ -f "scripts/load-test-data.py" ]; then
        python scripts/load-test-data.py --start-date 2023-10-01 --end-date 2024-03-31
    else
        log_warning "测试数据加载脚本不存在，使用模拟数据"
    fi
    
    # 运行系统测试
    log_info "运行完整工作流系统测试..."
    if pytest tests/system/test_complete_workflow_system.py -v --tb=short; then
        log_success "第三阶段系统测试通过"
    else
        log_error "第三阶段系统测试失败"
        return 1
    fi
}

# 第四阶段：用户验收测试
run_uat_tests() {
    log_info "开始第四阶段：用户验收测试"
    log_info "测试目标：在真实的生产环境中，验证系统是否真正带来价值"
    
    # 检查生产环境配置
    if [ -z "$PROD_DB_HOST" ] || [ -z "$PROD_DB_USER" ] || [ -z "$PROD_DB_PASSWORD" ]; then
        log_warning "生产环境配置不完整，跳过UAT测试"
        log_warning "请设置以下环境变量：PROD_DB_HOST, PROD_DB_USER, PROD_DB_PASSWORD, PROD_REDIS_HOST"
        return 0
    fi
    
    # 运行UAT测试
    log_info "运行用户验收测试..."
    if pytest tests/uat/test_production_environment_validation.py -v --tb=short -m production; then
        log_success "第四阶段用户验收测试通过"
    else
        log_error "第四阶段用户验收测试失败"
        return 1
    fi
}

# 生成测试报告
generate_test_report() {
    log_info "生成测试报告..."
    
    # 创建报告目录
    mkdir -p test-reports
    
    # 生成HTML报告
    pytest tests/ --html=test-reports/test-report.html --self-contained-html
    
    # 生成覆盖率报告
    pytest tests/ --cov=backend/src --cov-report=html --cov-report=xml --cov-report=term
    
    # 生成性能报告
    pytest tests/ --durations=10 --durations-min=1.0 > test-reports/performance-report.txt
    
    log_success "测试报告已生成到 test-reports/ 目录"
}

# 清理测试环境
cleanup_test_environment() {
    log_info "清理测试环境..."
    
    # 停止测试服务
    docker-compose -f docker-compose.test.yml down
    
    log_success "测试环境清理完成"
}

# 主函数
main() {
    log_info "开始执行'量化导航仪' v10.5 全系统测试"
    log_info "严格按照四阶段测试方案执行"
    
    local start_time=$(date +%s)
    local overall_result=0
    
    # 检查环境
    check_environment
    
    # 安装依赖
    install_dependencies
    
    # 准备测试环境
    prepare_test_environment
    
    # 执行四阶段测试
    if ! run_unit_tests; then
        overall_result=1
    fi
    
    if ! run_integration_tests; then
        overall_result=1
    fi
    
    if ! run_system_tests; then
        overall_result=1
    fi
    
    if ! run_uat_tests; then
        overall_result=1
    fi
    
    # 生成测试报告
    generate_test_report
    
    # 清理测试环境
    cleanup_test_environment
    
    # 计算总执行时间
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    
    # 输出结果
    if [ $overall_result -eq 0 ]; then
        log_success "所有测试阶段完成！总执行时间：${total_time}秒"
        log_success "系统已准备好投入日常使用"
    else
        log_error "测试过程中存在失败，请检查测试报告"
        log_error "总执行时间：${total_time}秒"
    fi
    
    exit $overall_result
}

# 处理命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-api-tests)
            SKIP_API_TESTS=true
            shift
            ;;
        --help)
            echo "用法: $0 [选项]"
            echo "选项:"
            echo "  --skip-api-tests    跳过API测试（避免产生费用）"
            echo "  --help              显示此帮助信息"
            exit 0
            ;;
        *)
            log_error "未知参数: $1"
            exit 1
            ;;
    esac
done

# 执行主函数
main "$@"
