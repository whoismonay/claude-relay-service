# Claude Relay Service - 自定义版本部署和迁移指南

本文档说明如何部署和迁移到自定义 Fork 版本（使用 `mcrs` 管理命令）。

---

## 📋 目录

- [版本说明](#版本说明)
- [迁移指南：从官方版本迁移](#迁移指南从官方版本迁移)
- [全新部署：新服务器安装](#全新部署新服务器安装)
- [日常维护：更新和管理](#日常维护更新和管理)
- [工作流程：开发和同步](#工作流程开发和同步)
- [故障排除](#故障排除)

---

## 版本说明

### 官方版本 vs 自定义版本

| 特性 | 官方版本 (crs) | 自定义版本 (mcrs) |
|------|---------------|------------------|
| 仓库来源 | Wei-Shaw/claude-relay-service | whoismonay/claude-relay-service |
| 管理命令 | `crs` | `mcrs` |
| 更新分支 | 固定 main 分支 | 动态识别当前分支 |
| 部署分支 | main | myMain（或功能分支） |
| 同步官方 | - | 支持（通过 upstream） |

### 核心优势

- ✅ **灵活分支管理**：支持在 myMain 和功能分支之间自由切换
- ✅ **持续同步官方**：保留 upstream 远程仓库，随时同步官方更新
- ✅ **自定义功能**：在 myMain 基础上开发自己的功能
- ✅ **零停机切换**：Git 分支切换不影响运行中的服务

---

## 迁移指南：从官方版本迁移

### 适用场景

- 已使用官方部署脚本安装的服务器
- 正在运行官方版本的生产环境
- 需要切换到自定义 fork 版本

### 🚀 一键迁移（推荐）

**使用 `setup-mcrs.sh` 脚本自动完成所有配置：**

```bash
# 1. 下载一键迁移脚本
curl -fsSL https://raw.githubusercontent.com/whoismonay/claude-relay-service/myMain/scripts/setup-mcrs.sh -o ~/setup-mcrs.sh

# 2. 设置执行权限
chmod +x ~/setup-mcrs.sh

# 3. 执行脚本（全自动，零停机）
./setup-mcrs.sh
```

**脚本会自动完成：**
- ✅ 检查项目目录和服务状态
- ✅ 创建当前状态备份分支
- ✅ 配置 git remote（origin → 你的 fork，upstream → 官方）
- ✅ 切换到 myMain 分支
- ✅ 创建 mcrs 软链接
- ✅ 验证配置成功
- ✅ **不会重启服务**（零停机）

### 📝 手动迁移步骤

如果需要手动控制每一步，按以下步骤执行：

#### 步骤 1：进入项目目录

```bash
cd ~/claude-relay-service/app/
```

#### 步骤 2：备份当前状态（可选但推荐）

```bash
# 创建备份分支
git branch backup-before-migration-$(date +%Y%m%d)

# 备份配置文件
mkdir -p ~/backups/crs-$(date +%Y%m%d)
cp .env ~/backups/crs-$(date +%Y%m%d)/.env
cp config/config.js ~/backups/crs-$(date +%Y%m%d)/config.js
cp data/init.json ~/backups/crs-$(date +%Y%m%d)/init.json
```

#### 步骤 3：配置 git remote

```bash
# 查看当前配置
git remote -v

# 重命名官方仓库为 upstream
git remote rename origin upstream

# 添加你的 fork 作为 origin
git remote add origin https://github.com/whoismonay/claude-relay-service.git

# 验证配置
git remote -v
```

**预期输出：**
```
origin    https://github.com/whoismonay/claude-relay-service.git (fetch)
origin    https://github.com/whoismonay/claude-relay-service.git (push)
upstream  https://github.com/Wei-Shaw/claude-relay-service.git (fetch)
upstream  https://github.com/Wei-Shaw/claude-relay-service.git (push)
```

#### 步骤 4：拉取并切换到 myMain 分支

```bash
# 拉取你 fork 的所有分支
git fetch origin

# 切换到 myMain 分支（不影响运行中的服务）
git checkout -b myMain origin/myMain

# 验证
git branch --show-current  # 应显示：myMain
cat VERSION                 # 查看版本号
```

#### 步骤 5：创建 mcrs 命令

```bash
# 设置执行权限
chmod +x ~/claude-relay-service/app/scripts/manage-custom.sh

# 创建软链接
sudo ln -sf ~/claude-relay-service/app/scripts/manage-custom.sh /usr/bin/mcrs

# 验证
which mcrs
ls -la /usr/bin/mcrs
```

#### 步骤 6：测试 mcrs 命令

```bash
# 查看帮助
mcrs help

# 查看状态
mcrs status
```

### ✅ 迁移完成后的状态

**磁盘代码：**
- Git 分支：**myMain**
- 代码版本：**v1.1.233**（或更新版本）

**运行中的服务：**
- 代码版本：**v1.1.231**（或原始版本，未变）
- 状态：**继续运行**（零影响）

**可用命令：**
- `crs` - 官方命令（仍可用）
- `mcrs` - 自定义命令（新增）

### 🔄 应用新版本代码

迁移完成后，磁盘上的代码已更新，但运行中的服务仍是旧版本。

**等客户空闲时，应用新版本：**

```bash
# 方式 1：重启服务（10-30 秒停机）
mcrs restart

# 方式 2：更新服务（会检查远程更新，然后重启）
mcrs update

# 方式 3：使用官方命令重启
crs restart
```

---

## 全新部署：新服务器安装

### 适用场景

- 全新的服务器
- 从未安装过 Claude Relay Service
- 直接安装自定义版本

### 🚀 方式 1：使用 mcrs 一键安装（推荐）

```bash
# 步骤 1：下载 mcrs 脚本
curl -fsSL https://raw.githubusercontent.com/whoismonay/claude-relay-service/myMain/scripts/manage-custom.sh -o /tmp/manage-custom.sh

# 步骤 2：安装为全局命令
chmod +x /tmp/manage-custom.sh
sudo mv /tmp/manage-custom.sh /usr/bin/mcrs

# 步骤 3：运行安装（交互式配置）
mcrs install
```

**安装过程会：**
1. 检查并安装依赖（Node.js 18+, Git, Redis）
2. 配置 Redis 连接
3. 克隆你的 fork 仓库
4. **自动切换到 myMain 分支**
5. 安装 npm 依赖
6. 配置环境变量（生成密钥）
7. 运行初始化脚本
8. 下载预构建的前端文件
9. 启动服务

**安装完成后会显示：**
- Git 分支：myMain
- 代码版本：v1.1.233
- 访问地址：http://your-ip:3000/web

### 📝 方式 2：手动安装（完全控制）

#### 步骤 1：安装基础依赖

```bash
# Debian/Ubuntu
sudo apt-get update
sudo apt-get install -y git curl wget redis-server

# 启动 Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 步骤 2：克隆项目

```bash
# 克隆你的 fork
git clone https://github.com/whoismonay/claude-relay-service.git ~/claude-relay-service-temp
cd ~/claude-relay-service-temp

# 切换到 myMain 分支
git checkout myMain

# 移动到标准目录
mkdir -p ~/claude-relay-service
mv ~/claude-relay-service-temp ~/claude-relay-service/app
cd ~/claude-relay-service/app
```

#### 步骤 3：配置 remote

```bash
# 添加官方仓库为 upstream（用于后续同步）
git remote add upstream https://github.com/Wei-Shaw/claude-relay-service.git

# 验证
git remote -v
```

#### 步骤 4：安装依赖和配置

```bash
# 安装依赖
npm install

# 复制配置示例
cp config/config.example.js config/config.js

# 创建 .env 文件
cat > .env << EOF
NODE_ENV=production
PORT=3000
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 16)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
LOG_LEVEL=info
EOF

# 运行初始化
npm run setup
```

#### 步骤 5：创建 mcrs 命令

```bash
chmod +x ~/claude-relay-service/app/scripts/manage-custom.sh
sudo ln -sf ~/claude-relay-service/app/scripts/manage-custom.sh /usr/bin/mcrs
```

#### 步骤 6：启动服务

```bash
mcrs start

# 查看状态
mcrs status
```

---

## 日常维护：更新和管理

### 常用 mcrs 命令

```bash
mcrs help              # 查看帮助
mcrs status            # 查看服务状态
mcrs start             # 启动服务
mcrs stop              # 停止服务
mcrs restart           # 重启服务
mcrs update            # 更新当前分支（会重启服务）
mcrs switch-branch     # 切换分支（交互式）
mcrs update-pricing    # 更新模型价格数据
```

### 更新当前分支

```bash
# 更新 myMain 分支到最新版本
# 注意：会重启服务
mcrs update
```

**执行过程：**
1. 检测服务运行状态
2. 停止服务（如果在运行）
3. 备份配置文件
4. 从 origin 拉取当前分支最新代码
5. 更新 npm 依赖
6. 重新启动服务

### 切换分支

```bash
# 交互式选择分支
mcrs switch-branch

# 会显示所有可用分支，选择后自动切换并重启服务
```

---

## 工作流程：开发和同步

### 🔄 分支管理策略

```
upstream/main (官方仓库)
    ↓ [定期同步]
origin/main (你的 fork - 镜像官方)
    ↓ [合并官方更新]
origin/myMain (自定义主分支，生产部署)
    ↓ [创建功能分支]
origin/feature/xxx (功能开发)
    ↓ [合并回主分支]
origin/myMain
```

### 📝 场景 1：开发新功能

**本地开发环境：**

```bash
cd ~/claude-relay-service

# 1. 从 myMain 创建功能分支
git checkout myMain
git pull origin myMain
git checkout -b feature/new-awesome-feature

# 2. 开发功能
# ... 编辑代码 ...

# 3. 提交更改
git add .
git commit -m "feat: 实现新功能

- 添加功能 A
- 优化功能 B
"

# 4. 推送功能分支
git push origin feature/new-awesome-feature

# 5. 测试完成后，合并到 myMain
git checkout myMain
git merge feature/new-awesome-feature
git push origin myMain
```

**服务器更新：**

```bash
# 方式 1：直接更新（快速）
mcrs update

# 方式 2：先切换分支测试，再回到 myMain
mcrs switch-branch  # 选择 feature/new-awesome-feature 测试
# 测试通过后
mcrs switch-branch  # 切回 myMain
```

### 🔄 场景 2：同步官方更新

**本地操作：**

```bash
# 1. 在 GitHub 网页点击 "Sync fork" 同步 main 分支
# 或手动同步：
git checkout main
git fetch upstream
git merge upstream/main
git push origin main

# 2. 将官方更新合并到 myMain
git checkout myMain
git merge main

# 3. 如果有冲突，解决冲突
git status              # 查看冲突文件
# 编辑冲突文件，解决冲突
git add <resolved-files>
git commit -m "merge: 同步官方 v1.1.xxx 更新

- 合并官方最新代码
- 解决冲突：xxx
"

# 4. 推送到远程
git push origin myMain
```

**服务器更新：**

```bash
# 拉取包含官方更新的 myMain
mcrs update
```

### 🧪 场景 3：在服务器上测试功能分支

```bash
# 1. 切换到功能分支测试
mcrs switch-branch
# 选择 feature/test-feature

# 2. 测试功能...

# 3. 测试完成，切回 myMain
mcrs switch-branch
# 选择 myMain
```

---

## 故障排除

### 问题 1：mcrs 命令不存在

**症状：**
```bash
mcrs: command not found
```

**解决方法：**
```bash
# 检查软链接
ls -la /usr/bin/mcrs

# 重新创建软链接
sudo ln -sf ~/claude-relay-service/app/scripts/manage-custom.sh /usr/bin/mcrs

# 验证
which mcrs
```

### 问题 2：git remote 配置错误

**症状：**
```bash
fatal: 'origin' does not appear to be a git repository
```

**解决方法：**
```bash
cd ~/claude-relay-service/app/

# 查看当前配置
git remote -v

# 重新配置
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/whoismonay/claude-relay-service.git
git fetch origin
```

### 问题 3：分支切换失败

**症状：**
```bash
error: pathspec 'myMain' did not match any file(s) known to git
```

**解决方法：**
```bash
# 拉取远程分支
git fetch origin

# 查看可用分支
git branch -a

# 创建并切换到 myMain
git checkout -b myMain origin/myMain
```

### 问题 4：服务更新后无法启动

**症状：**
```bash
服务启动失败，请查看日志
```

**解决方法：**
```bash
# 1. 查看错误日志
tail -n 50 ~/claude-relay-service/app/logs/service.log

# 2. 检查配置文件
cat ~/claude-relay-service/app/.env

# 3. 检查依赖
cd ~/claude-relay-service/app/
npm install

# 4. 测试 Redis 连接
redis-cli ping

# 5. 回滚到备份分支
git checkout backup-before-migration-YYYYMMDD
mcrs restart
```

### 问题 5：想回退到官方版本

**临时回退：**
```bash
# 切换回 main 分支
git checkout main
crs restart
```

**永久回退：**
```bash
cd ~/claude-relay-service/app/

# 重新配置 remote
git remote remove origin
git remote rename upstream origin
git checkout main
git pull origin main
crs restart
```

### 问题 6：mcrs update 拉取失败

**症状：**
```bash
获取远程代码失败，请检查网络连接
```

**解决方法：**
```bash
# 手动更新
cd ~/claude-relay-service/app/
git fetch origin myMain
git reset --hard origin/myMain
npm install
mcrs restart
```

---

## 📊 命令对比参考

| 功能 | crs（官方） | mcrs（自定义） | 说明 |
|------|------------|---------------|------|
| 安装服务 | `crs install` | `mcrs install` | mcrs 会安装到 myMain 分支 |
| 更新服务 | `crs update` | `mcrs update` | crs 更新 main，mcrs 更新当前分支 |
| 启动服务 | `crs start` | `mcrs start` | 完全相同 |
| 停止服务 | `crs stop` | `mcrs stop` | 完全相同 |
| 重启服务 | `crs restart` | `mcrs restart` | 完全相同 |
| 查看状态 | `crs status` | `mcrs status` | 完全相同 |
| 切换分支 | `crs switch-branch` | `mcrs switch-branch` | 完全相同 |

---

## 🔒 安全和最佳实践

### 配置文件保护

**以下文件不会被 Git 跟踪（在 .gitignore 中）：**
- `.env` - 环境变量和密钥
- `config/config.js` - 服务配置
- `data/init.json` - 管理员凭据
- `logs/` - 日志文件

**切换分支时这些文件不会丢失。**

### 数据安全

- **Redis 数据**：独立存储，不受分支切换影响
- **API Keys**：保存在 Redis，不会丢失
- **账户信息**：保存在 Redis，不会丢失

### 更新前检查

```bash
# 1. 查看当前版本
cat ~/claude-relay-service/app/VERSION

# 2. 查看即将更新的版本
git fetch origin
git log HEAD..origin/myMain --oneline

# 3. 确认无问题后更新
mcrs update
```

---

## 📞 支持和帮助

### 常用命令快速参考

```bash
# 查看当前分支
cd ~/claude-relay-service/app && git branch --show-current

# 查看远程配置
git remote -v

# 查看服务状态
mcrs status

# 查看日志
tail -f ~/claude-relay-service/app/logs/claude-relay-*.log

# 查看 mcrs 软链接
ls -la /usr/bin/mcrs
```

### 重要文件位置

- 项目目录：`~/claude-relay-service/app/`
- 配置文件：`~/claude-relay-service/app/.env`
- 日志目录：`~/claude-relay-service/app/logs/`
- 管理脚本：`~/claude-relay-service/app/scripts/manage-custom.sh`
- 备份配置：`~/.config/mcrs/install.conf`

---

## 🎯 快速命令速查

### 迁移已有服务器
```bash
curl -fsSL https://raw.githubusercontent.com/whoismonay/claude-relay-service/myMain/scripts/setup-mcrs.sh | bash
```

### 全新服务器安装
```bash
# 安装 mcrs 命令
curl -fsSL https://raw.githubusercontent.com/whoismonay/claude-relay-service/myMain/scripts/manage-custom.sh -o /tmp/mcrs
chmod +x /tmp/mcrs && sudo mv /tmp/mcrs /usr/bin/mcrs

# 运行安装
mcrs install
```

### 应用更新
```bash
mcrs update
```

### 回滚操作
```bash
git checkout backup-YYYYMMDD-HHMMSS
mcrs restart
```

---

## 📅 维护计划建议

### 定期同步官方更新

**频率：每周或每两周**

```bash
# 本地操作
git checkout main
git pull upstream main
git push origin main

git checkout myMain
git merge main
git push origin myMain

# 服务器操作（选择低峰时段）
mcrs update
```

### 版本管理

**稳定版本打标签：**

```bash
# 本地
git tag -a v1.1.233-custom-1 -m "自定义版本 1（基于官方 v1.1.233）"
git push origin v1.1.233-custom-1

# 服务器切换到稳定版本
cd ~/claude-relay-service/app
git fetch origin --tags
git checkout v1.1.233-custom-1
mcrs restart
```

---

## 🆘 紧急回滚流程

**如果更新后服务出现问题：**

```bash
# 1. 查看备份分支
cd ~/claude-relay-service/app
git branch | grep backup

# 2. 切换到最近的备份
git checkout backup-YYYYMMDD-HHMMSS

# 3. 重启服务
mcrs restart

# 4. 验证
mcrs status
curl http://localhost:3000/health
```

---

**文档版本：1.0**
**最后更新：2025-12-15**
**适用版本：myMain 分支（基于官方 v1.1.233+）**
