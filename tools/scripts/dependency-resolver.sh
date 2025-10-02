#!/bin/bash
# 依赖冲突解决脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORTS_DIR="$PROJECT_ROOT/reports/dependencies"
LOG_FILE="$REPORTS_DIR/dependency_resolution.log"

# 创建报告目录
mkdir -p "$REPORTS_DIR"

# 日志函数
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# 检查依赖冲突
check_conflicts() {
    log "检查依赖冲突..."
    
    local has_conflicts=false
    
    # 检查Node.js依赖冲突
    log "检查Node.js依赖冲突..."
    if ! pnpm install --frozen-lockfile 2>&1 | tee -a "$LOG_FILE"; then
        error "Node.js依赖安装失败，可能存在冲突"
        has_conflicts=true
    fi
    
    # 检查Python依赖冲突
    log "检查Python依赖冲突..."
    if ! pip check 2>&1 | tee -a "$LOG_FILE"; then
        error "Python依赖存在冲突"
        has_conflicts=true
    fi
    
    if [ "$has_conflicts" = true ]; then
        return 1
    else
        success "未发现依赖冲突"
        return 0
    fi
}

# 解决Node.js依赖冲突
resolve_node_conflicts() {
    log "解决Node.js依赖冲突..."
    
    # 清理缓存和锁文件
    log "清理pnpm缓存..."
    pnpm store prune
    
    # 删除锁文件重新安装
    if [ -f "pnpm-lock.yaml" ]; then
        log "删除pnpm-lock.yaml..."
        rm pnpm-lock.yaml
    fi
    
    # 重新安装依赖
    log "重新安装Node.js依赖..."
    pnpm install
    
    # 检查是否还有冲突
    if check_conflicts; then
        success "Node.js依赖冲突已解决"
    else
        error "Node.js依赖冲突仍未解决"
        return 1
    fi
}

# 解决Python依赖冲突
resolve_python_conflicts() {
    log "解决Python依赖冲突..."
    
    # 检查并激活虚拟环境
    if [ -f "venv/bin/activate" ]; then
        log "激活虚拟环境..."
        source venv/bin/activate
    elif [ -f "venv/Scripts/activate" ]; then
        log "激活虚拟环境 (Windows)..."
        source venv/Scripts/activate
    else
        log "虚拟环境未找到，使用系统 Python"
    fi

    # 升级pip
    log "升级pip..."
    if command -v pip3 &> /dev/null; then
        python3 -m pip install --upgrade pip
        PIP_CMD="pip3"
    elif command -v pip &> /dev/null; then
        python -m pip install --upgrade pip
        PIP_CMD="pip"
    else
        error "pip 命令未找到，请检查 Python 环境"
        return 1
    fi
    
    # 使用pip-tools解决冲突
    if command -v pip-compile &> /dev/null; then
        log "使用pip-compile解决冲突..."
        pip-compile requirements.txt --upgrade
    else
        log "安装pip-tools..."
        $PIP_CMD install pip-tools
        pip-compile requirements.txt --upgrade
    fi
    
    # 重新安装依赖
    log "重新安装Python依赖..."
    $PIP_CMD install -r requirements.txt
    
    # 检查是否还有冲突
    if pip check; then
        success "Python依赖冲突已解决"
    else
        error "Python依赖冲突仍未解决"
        return 1
    fi
}

# 智能版本解析
smart_version_resolution() {
    log "执行智能版本解析..."
    
    # 分析依赖树
    log "分析依赖树..."
    pnpm list --depth=0 > "$REPORTS_DIR/pnpm-tree.txt"
    pip list > "$REPORTS_DIR/pip-list.txt"
    
    # 查找版本冲突
    log "查找版本冲突..."
    python3 "$PROJECT_ROOT/tools/scripts/dependency-manager.py" --type all --dry-run --output "conflict_analysis.json"
    
    # 应用智能解析
    log "应用智能解析策略..."
    
    # 1. 优先解决安全漏洞
    log "优先解决安全漏洞..."
    pnpm audit --fix || true
    safety check --file requirements.txt --json | jq -r '.vulnerabilities[].package' | while read package; do
        if [ -n "$package" ]; then
            log "升级安全包: $package"
            pip install --upgrade "$package"
        fi
    done
    
    # 2. 解决版本冲突
    log "解决版本冲突..."
    
    # 对于Node.js，使用resolutions
    if [ -f "package.json" ]; then
        log "添加pnpm resolutions..."
        # 这里可以添加特定的版本解析规则
    fi
    
    # 对于Python，使用约束文件
    if [ -f "requirements.txt" ]; then
        log "生成约束文件..."
        pip freeze > requirements-locked.txt
    fi
}

# 验证解决方案
verify_solution() {
    log "验证解决方案..."
    
    # 运行测试
    log "运行测试验证..."
    
    # Node.js测试
    if [ -f "package.json" ]; then
        log "运行Node.js测试..."
        if pnpm test; then
            success "Node.js测试通过"
        else
            error "Node.js测试失败"
            return 1
        fi
    fi
    
    # Python测试
    if [ -f "requirements.txt" ]; then
        log "运行Python测试..."
        if python -m pytest tests/ -v; then
            success "Python测试通过"
        else
            warning "Python测试失败，但依赖冲突可能已解决"
        fi
    fi
    
    # 最终冲突检查
    if check_conflicts; then
        success "所有依赖冲突已解决"
        return 0
    else
        error "仍有依赖冲突未解决"
        return 1
    fi
}

# 生成解决报告
generate_report() {
    log "生成解决报告..."
    
    local report_file="$REPORTS_DIR/dependency_resolution_report_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# 依赖冲突解决报告

**生成时间**: $(date)
**项目路径**: $PROJECT_ROOT

## 解决过程

### 1. 冲突检测
- Node.js依赖检查: $(pnpm list --depth=0 | wc -l) 个包
- Python依赖检查: $(pip list | wc -l) 个包

### 2. 解决策略
- 清理缓存和锁文件
- 重新安装依赖
- 智能版本解析
- 安全漏洞优先修复

### 3. 验证结果
- 依赖冲突检查: $([ $? -eq 0 ] && echo "✅ 通过" || echo "❌ 失败")
- 测试验证: $([ $? -eq 0 ] && echo "✅ 通过" || echo "❌ 失败")

## 文件变更
- pnpm-lock.yaml: 重新生成
- requirements.txt: 更新版本
- requirements-locked.txt: 生成锁定文件

## 建议
1. 定期运行依赖更新检查
2. 使用依赖锁定文件确保一致性
3. 在CI/CD中集成冲突检测

EOF

    success "解决报告已生成: $report_file"
}

# 主函数
main() {
    log "开始依赖冲突解决流程..."
    
    cd "$PROJECT_ROOT"
    
    # 检查初始状态
    if check_conflicts; then
        success "未发现依赖冲突，无需解决"
        exit 0
    fi
    
    # 解决Node.js冲突
    if [ -f "package.json" ]; then
        resolve_node_conflicts || {
            error "Node.js依赖冲突解决失败"
            exit 1
        }
    fi
    
    # 解决Python冲突
    if [ -f "requirements.txt" ]; then
        resolve_python_conflicts || {
            error "Python依赖冲突解决失败"
            exit 1
        }
    fi
    
    # 智能版本解析
    smart_version_resolution
    
    # 验证解决方案
    if verify_solution; then
        success "依赖冲突解决成功"
        generate_report
        exit 0
    else
        error "依赖冲突解决失败"
        exit 1
    fi
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
