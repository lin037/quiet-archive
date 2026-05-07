---
title: Quiet Archive Getting Started
description: 从 fork 仓库到上线运行的完整流程
---

# Quiet Archive Getting Started

Quiet Archive（静档）是一套文件系统驱动的个人档案馆基座。本文档帮你把项目从零跑起来：fork 仓库 → 本地预览 → 用 Claude Code 生成属于你自己的页面 → 写作 → 推送到私有仓库 → 服务器拉取构建 → Nginx 对外提供服务。

---

## 1. 项目定位与前提

Quiet Archive **不是一个可以开箱即用的博客主题**，而是一套「文件系统驱动的个人档案馆基座」：

- 内容结构、API 查询层、索引脚本、构建流水线是稳定核心。
- 页面视觉层是**推荐每个用户用 AI（例如 Claude Code + `blog-frontend-bootstrap` skill）为自己生成一套专属设计**的。
- 项目自带一套默认展示页面，可以直接预览效果和验证内容，但建议你最终用 AI 生成属于自己的版本。

**开始之前你需要：**

- Node.js >= 22.12.0（附带 npm >= 10）
- Python >= 3.10
- Git
- 一台可访问公网的服务器（用于部署），或任意静态托管平台
- 一个 GitHub / GitLab / 自建 Git 仓库，用来存你的内容（推荐私有仓库）

---

## 2. Fork & Clone

### 2.1 Fork

在 GitHub 上点击 `Fork` 把本仓库复刻到你自己的账户。

> 推荐：fork 后**把可见性改为 Private**。内容源和站点代码都放在私仓，只把构建产物暴露给公网。

### 2.2 Clone 到本地

```bash
git clone git@github.com:<you>/quiet-archive.git
cd quiet-archive

# Node 依赖
npm install

# Python 依赖（用于构建索引和中文搜索分词）
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r scripts/requirements.txt
```

### 2.3 清理默认前台展示页面和演示内容（可选）

项目自带了一套默认的前台展示页面（pages、components、layouts、styles）和演示文章。当你准备用 AI 生成自己的前端时，需要清理这些默认文件。

> **建议**：演示文章（`posts/` 下的 `.md` 文件）可以先保留。它们覆盖了多种内容类型、嵌套层级和展示模式，能帮助你在开发前端时验证各种场景。**等你的前端开发完成并测试通过后，再删除演示内容、替换为自己的文章即可。**

#### 清理前台展示层

```bash
# 删除默认页面（保留 API 路由）
find src/pages -maxdepth 1 -name '*.astro' -delete
rm -rf src/pages/article src/pages/note src/pages/column
# 注意：保留 src/pages/api/ 目录，这是稳定核心

# 删除默认组件、布局和样式
rm -rf src/components/*
rm -rf src/layouts/*
rm -rf src/styles/*
```

#### 清理演示文章（建议开发完前端后再执行）

```bash
# 删除演示文章（保留目录结构和 README.md）
rm -f posts/article/*.md
rm -f posts/note/*.md
rm -rf posts/column/quiet-engineering/

# 保留 about.md 和各类型栏的 README.md
# 你可以编辑它们来填入自己的信息
```

如果你只是想先看看效果，可以跳过这一步，直接进入下一节。

### 2.4 本地快速预览

```bash
# 1. 生成内容索引（首次运行或内容变更后需要执行）
npm run index

# 2. 启动开发服务器
npm run dev
```

浏览器打开 `http://localhost:4321`，你应该能看到默认展示页面和演示内容。

> **提示**：每次修改了 `posts/` 下的文件后，需要重新运行 `npm run index` 来更新索引，然后刷新页面即可看到变化。开发服务器本身会自动热重载页面文件的变更。

---

## 3. 用 Claude Code 生成专属前端（推荐流程）

这是 Quiet Archive 最具特色的使用方式：**不用折腾主题，直接让 AI 根据项目文档、API 能力、内容结构、素材和你的审美生成前端**。

### 3.1 理解稳定核心和前台展示层

生成前端时，请把项目分成两类区域：

- **稳定核心（不要动）**：`src/api/**`、`scripts/**`、`src/content.config.ts`、`posts/**`、`src/pages/api/**`。
- **前台展示层（可以重做）**：普通页面、组件、布局和样式。

稳定核心负责内容发现、索引、查询、静态 JSON API 和构建能力。前台展示层可以由 Agent 根据你的站点定位重新设计，但必须**调用稳定核心，不要重造稳定核心**。

> **重要**：API 层除非你明确要求 Agent 修改，否则 Agent 只会使用它而不会改动它。这是 skill 中的硬性约束。

### 3.2 让 Agent 接管

在项目根目录打开 Claude Code（或其他支持 skill 的 AI 编码工具），使用类似下面的提示词：

```text
/blog-frontend-bootstrap 请为这个博客项目重新设计并生成一套前端页面。

请先自行阅读项目中的 docs、.claude/skills 和 assets/placeholders/image-ratios.md，
理解项目 API、内容结构、设计规范、可用素材和约束后，再给出你的设计方案并开始实现。

我的偏好：<用一句话描述网站名、风格或你想要的感觉；如果没有明确偏好，就让 Agent 自己判断>
```

更短的版本：

```text
/blog-frontend-bootstrap 重做博客前端。
请先阅读项目文档和现有 skill，理解 API、内容结构和素材后，自己完成设计与实现。
我的偏好是：<一句话偏好>。
```

Agent 会自动阅读项目文档和 skill，了解 API 能力和内容模型，然后：

1. 确认站点名称、视觉方向和功能范围（可能会问你一轮问题）
2. 设计并实现前端页面
3. 运行构建检查确保没有错误

**你需要做的**：根据 Agent 的提问回答你的偏好，审查生成的结果，提出修改意见。整个过程是交互式的，你可以随时调整方向。

### 3.3 查看生成效果

Agent 生成前端后，在本地查看效果：

```bash
# 1. 重新生成索引（如果 Agent 没有自动执行的话）
npm run index

# 2. 启动开发服务器
npm run dev

# 3. 打开浏览器访问
open http://localhost:4321
```

如果对效果不满意，直接告诉 Agent 你想调整什么。你也可以手动编辑生成的文件——它们都是标准的 Astro 组件和 CSS。

### 3.4 完整构建测试

在部署前，建议做一次完整构建确保没有问题：

```bash
npm run build
```

构建成功后，产物在 `dist/` 目录。你可以用以下命令本地预览构建结果：

```bash
npm run preview
```

然后访问 `http://localhost:4321` 查看最终效果。

---

## 4. 写作工作流

### 4.1 内容组织

```
posts/
├── about.md               关于页
├── article/               类型栏
│   ├── README.md          类型栏元信息
│   └── my-post.md         一篇文章
├── note/                  另一个类型栏
│   ├── README.md
│   └── some-thought.md
└── column/                专栏类型栏
    ├── README.md
    └── my-series/         子目录（专题）
        ├── README.md      目录页
        └── chapter-01.md
```

每个子文件夹都会被自动识别：有 `README.md` 就有目录页，没有就按目录名显示。详见 [content-authoring.md](./content-authoring.md)。

### 4.2 新建一篇文章

```bash
# 1. 新建文件
cat > posts/note/2026-05-05-some-thought.md <<'EOF'
---
title: 一个想法
date: 2026-05-05
status: draft
tags: [thinking]
summary: 今天的一点想法。
---

正文……
EOF

# 2. 本地校验
npm run check

# 3. 本地预览（需要先改成 published 才能在页面上看到）
npm run index
npm run dev
```

确认无误后把 `status: draft` 改成 `status: published`。只有 `published` 状态的文章会被构建出来。

> `status` 有三个可选值：`published`（发布）、`draft`（草稿）、`archived`（归档/下架）。只有 `published` 会出现在公开站点中。

### 4.3 提交到自己的私有仓库

```bash
git add posts/note/2026-05-05-some-thought.md
git commit -m "note: 一个想法"
git push origin main
```

---

## 5. 服务器部署

### 5.1 部署模型概览

Quiet Archive 是**全量静态构建**项目，不是长期运行的 Node / Python 服务：

- `npm run build` 会依次执行内容索引、搜索索引和 Astro 静态构建。
- Python 只在构建阶段运行，用来生成 `public/*.json` 索引文件。
- Astro 构建时会重新生成 `dist/`。
- Nginx 直接托管 `dist/`，不需要 `proxy_pass`。

所以这里没有要长期启动的 Node 服务。真正对外提供访问的是服务器上的 Nginx；自动部署只是更新 `dist/` 目录里的静态文件。

服务器地址也不能用随机 IP。正式部署应使用云服务器的固定公网 IP，或者绑定一个弹性公网 IP（EIP）。如果你有域名，就把域名的 A 记录指向这个固定公网 IP；后续 `SSH_HOST` 可以填固定公网 IP，也可以填域名。

### 5.2 服务器初始化（一次性）

<!-- 注意：以下路径 /var/www/quiet-archive 是示例，你可以替换为自己喜欢的部署路径 -->

```bash
# 依赖
sudo apt update
sudo apt install -y nginx git python3 python3-venv nodejs npm

# 建议用 nvm 装 Node >= 22.12
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22

# 确认系统依赖可用
nginx -v
git --version
python3 --version
python3 -m venv --help >/dev/null
npm -v

# 拉取你的私仓（用 deploy key 或 PAT）
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www
git clone git@github.com:<you>/quiet-archive.git  # ← 替换 <you> 为你的 GitHub 用户名
cd quiet-archive

# 装依赖
npm ci
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r scripts/requirements.txt

# 首次构建
npm run build
```

构建产物在 `dist/`，这是要对外暴露的唯一目录。

> Ubuntu / Debian 服务器上没有 `python` 命令是正常的。请使用 `python3 --version` 检查 Python，而不是 `python version` 或 `python --version`。

### 5.3 Nginx 配置

创建 `/etc/nginx/sites-available/quiet-archive`：

<!-- 注意：将 blog.example.com 替换为你自己的域名 -->

```nginx
server {
    listen 80;
    server_name blog.example.com;  # ← 替换为你的实际域名

    root /var/www/quiet-archive/dist;  # ← 如果你的部署路径不同，这里也要改
    index index.html;

    # 默认路由 + 404 fallback
    location / {
        try_files $uri $uri/ $uri.html =404;
    }

    # 静态资源长期缓存
    location /_astro/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.(png|jpg|jpeg|gif|svg|webp|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public";
    }

    # JSON 索引短缓存，保证更新及时
    location ~* \.(json)$ {
        add_header Cache-Control "public, max-age=300";
    }

    # gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1024;
}
```

启用 + 重载：

```bash
sudo ln -s /etc/nginx/sites-available/quiet-archive /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

确认 Nginx 已启动：

```bash
sudo systemctl status nginx
curl -I http://127.0.0.1
```

如果 `curl` 能看到 `HTTP/1.1 200 OK` 或 `HTTP/1.1 301 Moved Permanently`，说明 Nginx 已经在响应请求。

如果浏览器看到 `403 Forbidden`，优先检查两件事。这里的 Nginx `root` 是配置项，表示静态文件根目录，不是 Linux 的 `root` 用户；Nginx worker 进程通常会以 `www-data` 或 `nginx` 用户读取文件。

1. Nginx 的 `root` 是否指向真实的 `dist/` 目录。例如项目在 `/opt/server/apps/quiet-archive`，就应该写成 `root /opt/server/apps/quiet-archive/dist;`。
2. Nginx worker 用户是否有权限读取 `dist/index.html`，并且能进入它的所有父目录。

可以在服务器执行：

```bash
sudo nginx -T | grep -n "root "
namei -l /opt/server/apps/quiet-archive/dist/index.html
sudo tail -n 50 /var/log/nginx/error.log
```

如果是权限问题，可以先修 `dist/` 权限：

```bash
find /opt/server/apps/quiet-archive/dist -type d -exec chmod 755 {} \;
find /opt/server/apps/quiet-archive/dist -type f -exec chmod 644 {} \;
```

这不会影响部署用户下次删除 `dist/`。只要 `dist/` 仍然属于部署用户，`755` 表示 owner 仍有写权限，`rm -rf dist` 可以正常执行。

如果 `namei -l` 显示父目录没有 `x` 权限，需要给父目录补可进入权限，或把项目部署到更适合 Nginx 托管的 `/var/www/quiet-archive`。

### 5.4 HTTPS（推荐）

使用 Let's Encrypt 免费证书：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d blog.example.com  # ← 替换为你的实际域名
```

> **说明**：`certbot` 会交互式地引导你完成证书申请。过程中需要：
> - 输入你的邮箱地址（用于证书到期提醒）
> - 同意服务条款
> - 选择是否将 HTTP 自动重定向到 HTTPS（推荐选是）
>
> 按照终端提示一步步操作即可。证书会自动续期，无需额外配置。

---

## 6. 自动发布：push 后网站自动更新

你的预期流程是「写完 → commit & push → 网站自动更新」，推荐主方案是：**GitHub Actions 通过 SSH 登录服务器部署**。

### 6.1 主方案：GitHub Actions SSH 部署（推荐）

这套方案的意思是：你把代码 push 到 GitHub 后，GitHub Actions 会临时启动一台机器，再用 SSH 登录你的服务器，在服务器上的项目目录里执行部署脚本。

这两个文件已经放在本仓库里，不需要用户再手写：

| 文件 | 在哪里生效 | 作用 |
|---|---|---|
| `.github/workflows/deploy.yml` | GitHub | 告诉 GitHub push 后通过 SSH 登录服务器，并先拉取最新代码 |
| `scripts/deploy-production.sh` | 服务器 | 安装依赖、构建静态站点；不负责拉取代码 |

你要做的是：确认服务器登录信息、让服务器上有一份这个仓库、配置 GitHub Secrets，然后把这两个文件一起 push 到 GitHub。

这里有三个地方容易混淆：

| 名称 | 指什么 |
|---|---|
| 本机 | 你现在写代码、执行 `git push` 的电脑 |
| GitHub Actions | GitHub 临时启动的自动化机器 |
| 服务器 | 真正运行网站的机器 |

#### 6.1.1 先确认服务器登录信息

后面会用到三个值，它们不是随便填的，也不是 GitHub 用户名，而是你平时 SSH 登录服务器时已经在用的信息。

| 名称 | 含义 | 示例 |
|---|---|---|
| `SSH_HOST` | 服务器 IP 或域名 | `1.2.3.4`、`blog.example.com` |
| `SSH_USER` | SSH 登录用户名 | `root`、`ubuntu`、`deploy` |
| `SSH_PORT` | SSH 端口 | 通常是 `22` |

例如你平时这样登录服务器：

```bash
ssh -p 22 root@1.2.3.4
```

那就表示：

```text
SSH_HOST = 1.2.3.4
SSH_USER = root
SSH_PORT = 22
```

如果你还不知道这三个值，先不要继续配置 GitHub Actions。你需要先确认自己能从本机登录服务器。

为了让后面的命令更容易复制，可以先在本机终端里设置这三个变量。把下面的示例值换成你自己的：

```bash
export SSH_HOST="1.2.3.4"
export SSH_USER="root"
export SSH_PORT="22"
```

这里的 `export` 只在当前终端窗口有效。关闭这个终端窗口后就没了；下次重新打开终端，需要重新执行这几行，或者直接在命令里写真实值。

测试能否登录：

```bash
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "whoami"
```

如果能输出用户名，说明登录信息是对的。

`SSH_USER` 不需要在 GitHub 里创建。它必须是服务器上已经存在、并且可以 SSH 登录的系统用户。普通用户也可以，不一定要用 `root`；但这个用户必须能进入部署目录、拉取代码、安装依赖并执行构建。

#### 6.1.2 准备服务器上的项目目录

这一步是在**服务器**上准备一份仓库代码，不是在本机创建文件。

先登录服务器：

```bash
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST"
```

假设网站代码部署在 `/var/www/quiet-archive`。如果你想换路径，后面所有 `/var/www/quiet-archive` 都要换成你的实际路径。

如果是私有仓库，服务器也需要有权限从 GitHub 拉代码。推荐给服务器配置一个只读 Deploy key。

在服务器上生成一把专门用于读取 GitHub 仓库的 key：

```bash
ssh-keygen -t ed25519 -C "quiet-archive-server-read" -f ~/.ssh/quiet_archive_github
cat ~/.ssh/quiet_archive_github.pub
```

把输出的公钥添加到 GitHub 仓库：Settings → Deploy keys → Add deploy key。不要勾选 Allow write access。

然后在服务器上指定这把 key 用于访问 GitHub：

```bash
cat > ~/.ssh/config <<'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/quiet_archive_github
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config
```

服务器第一次连接 GitHub 时，会要求确认 `github.com` 的 SSH 主机指纹。这不是你的 Deploy key，而是用来确认“当前连到的服务器确实是 GitHub”。

GitHub 官方文档会公布当前 SSH host key fingerprints。确认前，应以 GitHub 官方文档为准进行比对；如果终端显示的指纹和 GitHub 官方文档不一致，不要输入 `yes`，应停止操作并检查网络、DNS 或是否存在中间人风险。

当前 GitHub 官方 ED25519 指纹是：

```text
SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU
```

如果终端提示的 ED25519 指纹与 GitHub 官方文档一致，就输入 `yes`。这一步会把 `github.com` 写入服务器当前用户的 `~/.ssh/known_hosts`，以后就不会再问。

也可以先抓取 GitHub 的 ED25519 host key，核对指纹后再写入 `known_hosts`：

```bash
ssh-keyscan -t ed25519 github.com 2>/tmp/github_known_host
ssh-keygen -lf /tmp/github_known_host
# 确认输出的 SHA256 指纹和 GitHub 官方文档一致后，再执行：
cat /tmp/github_known_host >> ~/.ssh/known_hosts
chmod 600 ~/.ssh/known_hosts
rm /tmp/github_known_host
```

如果服务器上还没有这个仓库，先 clone 一份。把下面的仓库地址替换成你的 GitHub 仓库地址：

```bash
git clone git@github.com:你的用户名/quiet-archive.git /var/www/quiet-archive
```

如果服务器上已经有这个仓库，就直接进入项目目录：

```bash
cd /var/www/quiet-archive
```

确认当前 SSH 用户拥有部署目录的写权限。GitHub Actions 后面会用同一个用户执行 `git reset --hard`，所以这个用户必须能改写整个仓库目录：

```bash
whoami
ls -ld /var/www/quiet-archive
ls -l .github/workflows/deploy.yml 2>/dev/null || true
```

如果文件属于 `root` 或其他用户，先修正目录归属。不要用 `chmod 777`：

```bash
sudo chown -R "$(whoami):$(id -gn)" /var/www/quiet-archive
find /var/www/quiet-archive -type d -exec chmod u+rwx {} \;
find /var/www/quiet-archive -type f -exec chmod u+rw {} \;
```

确认服务器自己能从 GitHub 拉代码：

```bash
git remote -v
git fetch origin main
```

这里检查的是**服务器 → GitHub** 的拉取权限，和前面配置的 **GitHub Actions → 服务器** 登录权限不是一回事。如果这里报 `Permission denied`，说明服务器没有读取私有仓库的权限，需要检查 GitHub Deploy key 是否配置正确。

本仓库已经内置部署脚本 `scripts/deploy-production.sh`。它只负责构建，不负责拉取代码。它会自动执行：

1. 加载 `nvm` 环境（如果服务器使用 `nvm` 安装 Node）
2. 检查 `npm`、`python3` 是否可用
3. 创建或复用项目内的 `.venv` 虚拟环境；如果上次失败留下了不完整 `.venv`，会自动删除并重建
4. 对 `scripts/requirements.txt` 做 hash 检测，没变化就跳过 Python 依赖安装
5. 对 `package-lock.json` 做 hash 检测，没变化且已有 `node_modules` 就跳过 `npm ci`
6. `npm run build`
7. 检查 `dist/index.html` 是否生成
8. 修正 `dist/` 目录和文件权限，避免 Nginx 因静态文件不可读返回 `403 Forbidden`

先在服务器手动跑一次，确认服务器本身能完成部署：

```bash
bash scripts/deploy-production.sh
```

如果这一步失败，先修服务器上的 Node、Python、Git 拉取权限或目录权限，不要急着配置 GitHub Actions。部署脚本不会自动执行 `sudo apt install`，系统级依赖应该由用户明确安装，避免自动部署过程修改服务器系统环境。

如果你现在还在服务器终端里，先退出回到本机：

```bash
exit
```

#### 6.1.3 准备部署 SSH Key

GitHub Actions 需要通过 SSH 登录你的服务器。推荐在**本机**生成一把专门用于部署的 SSH key。

SSH key 分两部分：

| 文件 | 放在哪里 | 作用 |
|---|---|---|
| `quiet_archive_deploy.pub` | 放到服务器 | 公钥，允许持有私钥的人登录 |
| `quiet_archive_deploy` | 放到 GitHub Secret | 私钥，GitHub Actions 用它登录服务器 |

> 不需要在服务器上生成私钥。服务器只保存公钥；GitHub Secret 保存私钥。

在本机执行：

```bash
export DEPLOY_KEY_PATH="$HOME/.ssh/quiet_archive_deploy"
ssh-keygen -t ed25519 -a 200 -C "github-actions-deploy" -f "$DEPLOY_KEY_PATH"
```

如果提示输入 passphrase，直接按回车两次即可。

下面的命令会用到前面设置的 `SSH_HOST`、`SSH_USER`、`SSH_PORT` 和 `DEPLOY_KEY_PATH`。如果你没有设置这些变量，就把命令里的变量替换成自己的真实值。

把公钥添加到服务器：

```bash
cat "$DEPLOY_KEY_PATH.pub" | ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" \
  'mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
```

这条命令的含义是：读取本机的公钥文件，通过你已有的 SSH 登录方式连到服务器，然后把公钥追加到服务器当前用户的 `~/.ssh/authorized_keys` 里。

验证这把新 key 能登录服务器：

```bash
ssh -i "$DEPLOY_KEY_PATH" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "whoami"
```

`whoami` 是在服务器上执行的测试命令，用来打印当前登录到服务器的用户名。如果能输出用户名，说明 GitHub Actions 后面也可以用这把 key 登录服务器。

复制私钥内容，后面填到 `SSH_PRIVATE_KEY`：

```bash
pbcopy < "$DEPLOY_KEY_PATH"
```

如果不是 macOS，没有 `pbcopy`，就用下面的命令显示私钥内容，然后手动完整复制：

```bash
cat "$DEPLOY_KEY_PATH"
```

复制时必须包含开头和结尾这两行：

```text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

#### 6.1.4 配置 GitHub Secrets

在 GitHub 仓库顶部导航点击 Settings。进入 Settings 后，在左侧边栏找到 Security and quality 分组，点击 Secrets and variables → Actions。进入后切到 Secrets 标签页，点击 New repository secret。

这里用的是 New repository secret，不是 Environments。当前工作流直接读取 `${{ secrets.SSH_HOST }}` 这类仓库级 Secret；只有需要生产环境审批、环境保护规则时，才需要额外使用 Environments。

每个 Secret 都要单独创建一次。页面里会有两个输入框：

| 输入框 | 填什么 |
|---|---|
| Name | Secret 的名字，例如 `SSH_HOST` |
| Secret | Secret 的具体内容，例如服务器 IP |

填完后点击 Add secret。回到列表页后，再点 New repository secret 创建下一个。

这里一共要创建 5 个 Secret：

| 第几次 | Name 填 | Secret 填 |
|---|---|---|
| 1 | `SSH_HOST` | 你的服务器 IP 或域名，例如 `1.2.3.4` |
| 2 | `SSH_USER` | 你的 SSH 登录用户名，例如 `root` |
| 3 | `SSH_PORT` | 你的 SSH 端口，通常是 `22` |
| 4 | `SSH_PRIVATE_KEY` | 上一步复制的私钥完整内容，不是 `.pub` 公钥 |
| 5 | `DEPLOY_PATH` | 服务器上的项目目录，例如 `/var/www/quiet-archive` |

创建 `SSH_PRIVATE_KEY` 时，页面应该这样填：

```text
Name:
SSH_PRIVATE_KEY

Secret:
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

其中 `...` 不是让你手动输入省略号，而是私钥中间的所有真实内容。必须从 `-----BEGIN OPENSSH PRIVATE KEY-----` 一直复制到 `-----END OPENSSH PRIVATE KEY-----`。

#### 6.1.5 确认工作流文件已经在仓库里

工作流文件已经写在本仓库的 `.github/workflows/deploy.yml`，部署脚本也已经写在 `scripts/deploy-production.sh`。你不需要在服务器上手动创建这两个文件。

GitHub Actions 登录服务器后，会先在 `DEPLOY_PATH` 目录执行 `git fetch origin main` 和 `git reset --hard origin/main`，让服务器拿到最新代码，然后再执行 `bash scripts/deploy-production.sh`。拉取代码只放在工作流里，部署脚本本身只负责安装依赖和构建。

在本机项目根目录确认文件存在：

```bash
ls .github/workflows/deploy.yml
ls scripts/deploy-production.sh
```

`DEPLOY_PATH` 必须和 Nginx 静态目录对应：如果 Nginx 写的是 `root /srv/apps/quiet-archive/dist;`，那么 `DEPLOY_PATH` 就应该填 `/srv/apps/quiet-archive`。两边路径不一致时，Actions 会更新一个目录，而 Nginx 仍然服务另一个目录，页面就可能保持旧内容或报错。

如果你修改了服务器部署路径，只需要改 GitHub Secret 里的 `DEPLOY_PATH`，不需要改工作流文件。

> **如果 Nginx 跑在 Docker 里**：docker-compose 的 bind mount（如 `- /opt/.../dist:/srv/apps/quiet-archive/dist:ro`）会绑定宿主机目录的 inode。构建脚本**不能 `rm -rf dist` 整个目录**，否则容器内挂载会失效，表现为部署后 403。本仓库的 `scripts/deploy-production.sh` 已改为只清空 `dist/` 内部文件，不删除目录本身。如果你自行改写脚本，请保持这个约束，或使用"构建到临时目录再 `rsync -a --delete` 到 dist/"的方式。

之后你的发布流程就是：

```bash
git add .
git commit -m "article: publish xxx"
git push origin main
# GitHub Actions 自动完成部署
```

#### 6.1.6 怎么确认已经部署成功

可以从三个地方确认。

**1. 看 GitHub Actions 是否执行成功**

进入 GitHub 仓库顶部的 Actions 页签，点击最新一次 Deploy 记录：

- 绿色对勾：工作流执行成功。
- 红色叉号：工作流失败，点进去看 `Deploy over SSH` 的日志。
- 没有记录：通常是 `.github/workflows/deploy.yml` 还没 push 到 GitHub，或者 push 的不是 `main` 分支。

**2. 看服务器上的代码和构建产物是否更新**

登录服务器后执行：

```bash
cd /var/www/quiet-archive
git log -1 --oneline
ls -lah dist/index.html
```

如果最新 commit 是你刚 push 的 commit，并且 `dist/index.html` 的修改时间变新，说明部署脚本已经跑过。

**3. 看网站是否能访问**

在服务器本机测试 Nginx：

```bash
curl -I http://127.0.0.1
```

在你自己的电脑测试公网访问：

```bash
curl -I http://你的服务器固定公网IP
# 或者
curl -I https://你的域名
```

这个项目不是长期运行的 Node 服务，所以不用检查 `npm run dev` 是否启动。线上只需要确认 Nginx 正在运行，并且 Nginx 指向的是最新的 `dist/` 目录。

### 6.2 关于全量构建

当前构建是**全量重新构建**：每次 `npm run build` 都会重新扫描所有内容、重新生成所有索引和页面。

不过部署脚本已经对依赖安装做了 hash 检测：`scripts/requirements.txt` 没变化会跳过 Python 依赖安装，`package-lock.json` 没变化且服务器已有 `node_modules` 会跳过 `npm ci`。所以日常只改文章时，主要耗时会集中在静态构建本身。

这意味着：
- 新增文章：下一次构建后出现
- 删除文件：下一次构建后从站点消失
- 改成 `status: draft` 或 `archived`：下一次构建后从公开站点消失
- 改文件名 / 移动目录：旧 URI 变成 404，新 URI 出现

> **未来计划**：后续版本会支持增量构建以提升构建性能，以及更智能的下架/重定向管理。对于当前内容量级（数百篇以内），全量构建的耗时完全可以接受。

### 6.3 备选方案

#### 定时拉取（最简单）

如果不想配置 GitHub Actions，可以用 cron 定时检查：

```bash
crontab -e
# 添加以下行（每 5 分钟检查一次远端是否有更新）：
*/5 * * * * cd /var/www/quiet-archive && git fetch origin main && [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ] && bash scripts/deploy-production.sh >> /var/log/quiet-archive-deploy.log 2>&1
```

#### CI 构建 + 服务器拉产物

如果服务器性能差，可以在 GitHub Actions 中完成构建，再把 `dist/` 上传到服务器。这个方案更像传统静态站点发布。

---

## 7. 日常维护清单

| 场景 | 命令 |
|---|---|
| 新建文章 | 在 `posts/<type>/` 下新建 md，写 frontmatter |
| 本地校验 | `npm run check` |
| 本地预览 | `npm run index && npm run dev` |
| 本地构建 | `npm run build` |
| 预览构建结果 | `npm run preview` |
| 发布 | `git push` → 服务器自动构建 |
| 删除一篇文章 | 删文件 → commit → push |
| 批量调整结构 | 直接移动 / 重命名文件夹 → 重新构建即可 |

---

## 8. 常见问题

**Q: 项目自带的默认页面可以直接用吗？**
A: 可以直接用来预览和验证内容。但本项目的核心体验是用 `blog-frontend-bootstrap` skill 让 AI 生成属于你自己的页面设计。默认页面更多是一个参考实现。

**Q: 内容必须放在同一个仓库吗？**
A: 当前设计是同仓（见 [architecture-overview.md](./architecture-overview.md)），降低维护成本。如果你真的要分，可以用 git submodule 挂 `posts/` 进来。

**Q: 我想让别人也能读到我的文章，但不公开整个仓库？**
A: 私仓 + 公开站点就是这套方案的默认形态。别人只能看到构建后的页面，看不到 commit 历史和未发布的草稿。

**Q: 没有服务器可以吗？**
A: 可以，把 `dist/` 推到 Vercel / Netlify / Cloudflare Pages / GitHub Pages 都行，只是失去了"自己可加 API 层"的后续扩展空间。

**Q: 我怎么把这个博客同时用作 AI 知识库？**
A: 参见 [api-reference.md](./api-reference.md) 的 Agent & MCP 章节。你的每一篇内容天然就是知识库条目，静态 JSON API 可以直接被 Agent / MCP / Skill 消费。
