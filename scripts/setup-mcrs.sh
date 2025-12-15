#!/bin/bash
#
# 一键配置脚本：将服务器切换到 myMain 分支并配置 mcrs 命令
# 作者：Claude + User
# 用途：在已部署官方版本的服务器上快速切换到自定义 fork 版本
#
# 使用方法：
#   1. 上传此脚本到服务器
#   2. chmod +x setup-mcrs.sh
#   3. ./setup-mcrs.sh
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# 配置变量（根据你的实际情况修改）
FORK_REPO="https://github.com/whoismonay/claude-relay-service.git"
OFFICIAL_REPO="https://github.com/Wei-Shaw/claude-relay-service.git"
TARGET_BRANCH="myMain"
PROJECT_DIR="$HOME/claude-relay-service/app"

# 打印函数
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_step() {
    echo -e "\n${BOLD}${BLUE}=== $1 ===${NC}"
}

# 错误处理
handle_error() {
    print_error "脚本执行失败！"
    print_info "请检查错误信息并手动处理"
    exit 1
}

trap handle_error ERR

# 开始执行
echo -e "${BOLD}${GREEN}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║   Claude Relay Service - mcrs 一键配置脚本           ║"
echo "║   自动切换到 myMain 分支并配置自定义管理命令         ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 步骤 0：确认项目目录
print_step "步骤 0/7: 确认项目目录"
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "项目目录不存在: $PROJECT_DIR"
    print_info "请修改脚本中的 PROJECT_DIR 变量"
    exit 1
fi

cd "$PROJECT_DIR"
print_success "项目目录: $PROJECT_DIR"

# 显示当前状态
print_info "当前分支: $(git branch --show-current)"
print_info "当前版本: $(cat VERSION 2>/dev/null || echo '未知')"

# 步骤 1：检查服务状态
print_step "步骤 1/7: 检查服务状态"
if command -v crs &> /dev/null; then
    if pgrep -f "node.*src/app.js" > /dev/null; then
        SERVICE_PID=$(pgrep -f "node.*src/app.js" | head -1)
        print_success "服务正在运行 (PID: $SERVICE_PID)"
        print_warning "此脚本不会重启服务，现有服务将继续运行"
    else
        print_info "服务未运行（没有问题，可以继续）"
    fi
else
    print_warning "crs 命令不存在（可能是新安装）"
fi

# 步骤 2：备份当前状态
print_step "步骤 2/7: 备份当前状态"
BACKUP_BRANCH="backup-before-mcrs-$(date +%Y%m%d-%H%M%S)"
CURRENT_BRANCH=$(git branch --show-current)

print_info "创建备份分支: $BACKUP_BRANCH"
git branch "$BACKUP_BRANCH" 2>/dev/null || print_warning "备份分支可能已存在"
print_success "当前状态已备份到: $BACKUP_BRANCH"

# 步骤 3：配置 git remote
print_step "步骤 3/7: 配置 git remote"

# 检查当前 remote 配置
CURRENT_ORIGIN=$(git remote get-url origin 2>/dev/null || echo "")

if [[ "$CURRENT_ORIGIN" == *"$FORK_REPO"* ]] || [[ "$CURRENT_ORIGIN" == *"whoismonay"* ]]; then
    print_success "origin 已指向你的 fork，跳过配置"
else
    print_info "重新配置 git remote..."

    # 检查是否已有 upstream
    if git remote get-url upstream &> /dev/null; then
        print_info "upstream 已存在，跳过重命名"
    else
        print_info "重命名 origin -> upstream"
        git remote rename origin upstream 2>/dev/null || print_warning "重命名可能失败，继续..."
    fi

    # 添加你的 fork 作为 origin
    if git remote get-url origin &> /dev/null; then
        print_info "更新 origin 指向你的 fork"
        git remote set-url origin "$FORK_REPO"
    else
        print_info "添加 origin 指向你的 fork"
        git remote add origin "$FORK_REPO"
    fi

    print_success "git remote 配置完成"
fi

# 显示最终配置
print_info "Git remote 配置："
git remote -v | while read line; do
    echo "  $line"
done

# 步骤 4：拉取远程分支
print_step "步骤 4/7: 拉取远程分支"
print_info "从你的 fork 拉取所有分支..."
git fetch origin

if git branch -r | grep -q "origin/$TARGET_BRANCH"; then
    print_success "找到目标分支: origin/$TARGET_BRANCH"
else
    print_error "未找到分支 origin/$TARGET_BRANCH"
    print_info "请确认你的 fork 中已创建 $TARGET_BRANCH 分支"
    exit 1
fi

# 步骤 5：切换到 myMain 分支（零停机）
print_step "步骤 5/7: 切换到 $TARGET_BRANCH 分支"

# 检查是否已在目标分支
if [ "$CURRENT_BRANCH" = "$TARGET_BRANCH" ]; then
    print_info "已在 $TARGET_BRANCH 分支，更新到最新版本"
    git pull origin "$TARGET_BRANCH" || {
        print_warning "拉取失败，尝试强制同步..."
        git fetch origin "$TARGET_BRANCH"
        git reset --hard "origin/$TARGET_BRANCH"
    }
else
    print_info "从 $CURRENT_BRANCH 切换到 $TARGET_BRANCH"

    # 检查本地是否已有该分支
    if git show-ref --verify --quiet "refs/heads/$TARGET_BRANCH"; then
        print_info "本地已有 $TARGET_BRANCH 分支，切换并更新"
        git checkout "$TARGET_BRANCH"
        git pull origin "$TARGET_BRANCH" --rebase 2>/dev/null || {
            print_warning "更新失败，强制同步..."
            git fetch origin "$TARGET_BRANCH"
            git reset --hard "origin/$TARGET_BRANCH"
        }
    else
        print_info "创建并切换到 $TARGET_BRANCH 分支"
        git checkout -b "$TARGET_BRANCH" "origin/$TARGET_BRANCH"
    fi
fi

print_success "成功切换到 $TARGET_BRANCH 分支"
print_info "新版本: $(cat VERSION 2>/dev/null || echo '未知')"

# 步骤 6：配置 mcrs 命令
print_step "步骤 6/7: 配置 mcrs 命令"

CUSTOM_SCRIPT="$PROJECT_DIR/scripts/manage-custom.sh"

if [ ! -f "$CUSTOM_SCRIPT" ]; then
    print_error "未找到自定义脚本: $CUSTOM_SCRIPT"
    print_info "请确认 $TARGET_BRANCH 分支包含 manage-custom.sh"
    exit 1
fi

print_info "设置执行权限..."
chmod +x "$CUSTOM_SCRIPT"
print_success "已设置执行权限"

print_info "创建 mcrs 软链接..."
sudo ln -sf "$CUSTOM_SCRIPT" /usr/bin/mcrs
print_success "已创建 /usr/bin/mcrs 命令"

# 验证软链接
if [ -L "/usr/bin/mcrs" ]; then
    LINK_TARGET=$(readlink -f /usr/bin/mcrs)
    print_success "软链接验证成功: /usr/bin/mcrs -> $LINK_TARGET"
else
    print_error "软链接创建失败"
    exit 1
fi

# 步骤 7：最终验证
print_step "步骤 7/7: 最终验证"

print_info "验证 mcrs 命令..."
if command -v mcrs &> /dev/null; then
    print_success "mcrs 命令可用"
else
    print_error "mcrs 命令不可用"
    exit 1
fi

print_info "检查服务状态..."
if pgrep -f "node.*src/app.js" > /dev/null; then
    FINAL_PID=$(pgrep -f "node.*src/app.js" | head -1)
    if [ "$FINAL_PID" = "$SERVICE_PID" ]; then
        print_success "服务仍在运行 (PID: $FINAL_PID) - 未受影响 ✓"
    else
        print_warning "服务 PID 已变化 (旧: $SERVICE_PID, 新: $FINAL_PID)"
    fi
else
    print_info "服务未运行"
fi

# 显示最终状态
print_step "配置完成！"
echo ""
echo -e "${GREEN}✓ 所有步骤已成功完成！${NC}"
echo ""
echo -e "${BOLD}当前状态：${NC}"
echo -e "  Git 分支: ${GREEN}$(git branch --show-current)${NC}"
echo -e "  代码版本: ${GREEN}$(cat VERSION 2>/dev/null || echo '未知')${NC}"
echo -e "  运行版本: ${YELLOW}$([ -n "$SERVICE_PID" ] && echo "v1.1.231 (未重启)" || echo "未运行")${NC}"
echo ""
echo -e "${BOLD}可用命令：${NC}"
echo -e "  ${BLUE}mcrs help${NC}    - 查看帮助"
echo -e "  ${BLUE}mcrs status${NC}  - 查看状态"
echo -e "  ${BLUE}mcrs update${NC}  - 更新当前分支（会重启服务）"
echo ""
echo -e "${BOLD}备份信息：${NC}"
echo -e "  原分支已备份到: ${YELLOW}$BACKUP_BRANCH${NC}"
echo -e "  如需回滚: ${YELLOW}git checkout $BACKUP_BRANCH${NC}"
echo ""
echo -e "${YELLOW}注意事项：${NC}"
echo -e "  1. 当前磁盘代码已更新，但运行中的服务仍是旧版本"
echo -e "  2. 需要应用新版本时，运行: ${BLUE}mcrs restart${NC}"
echo -e "  3. 或等客户空闲时运行: ${BLUE}mcrs update${NC}"
echo ""
echo -e "${GREEN}配置成功！enjoy your mcrs! 🚀${NC}"
