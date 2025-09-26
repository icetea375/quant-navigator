#!/bin/bash
# ==============================================================================
# 文档索引自动更新脚本
# 用于自动更新docs/README.md中的文档信息
# ==============================================================================

set -e

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📚 开始更新文档索引...${NC}"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCS_DIR="$PROJECT_ROOT/docs"

echo -e "${YELLOW}📁 项目根目录: $PROJECT_ROOT${NC}"
echo -e "${YELLOW}📁 文档目录: $DOCS_DIR${NC}"

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到Python3${NC}"
    exit 1
fi

# 检查文档目录
if [ ! -d "$DOCS_DIR" ]; then
    echo -e "${RED}❌ 错误: 文档目录不存在: $DOCS_DIR${NC}"
    exit 1
fi

# 运行Python脚本
echo -e "${YELLOW}🐍 运行文档索引更新脚本...${NC}"
cd "$PROJECT_ROOT"
python3 "$SCRIPT_DIR/update_docs_index.py"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 文档索引更新成功！${NC}"
    
    # 显示更新后的统计信息
    echo -e "${BLUE}📊 文档统计:${NC}"
    echo -e "   - 核心开发文档: $(find "$DOCS_DIR" -name "开发文档第*章*.md" | wc -l) 个"
    echo -e "   - 架构设计文档: $(find "$DOCS_DIR" -name "架构设计*.md" | wc -l) 个"
    echo -e "   - 项目管理文档: $(find "$DOCS_DIR" -name "*.md" | grep -E "(ADR|API_CHANGELOG|LINTING_PHILOSOPHY|测试宪法)" | wc -l) 个"
    echo -e "   - 完成报告: $(find "$DOCS_DIR" -name "v*_完成报告.md" | wc -l) 个"
    
    echo -e "${GREEN}🎉 文档索引更新完成！${NC}"
else
    echo -e "${RED}❌ 文档索引更新失败！${NC}"
    exit 1
fi
