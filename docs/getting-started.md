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
pip3 install -r scripts/requirements.txt
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
请使用 blog-frontend-bootstrap skill，为这个博客项目重新设计并生成一套前端。

请先自行阅读项目中的 docs、.claude/skills 和 assets/placeholders/image-ratios.md，
理解项目 API、内容结构、设计规范、可用素材和约束后，再给出你的设计方案并开始实现。

我的偏好：<用一句话描述网站名、风格或你想要的感觉；如果没有明确偏好，就让 Agent 自己判断>
```

更短的版本：

```text
请使用 blog-frontend-bootstrap skill 重做博客前端。
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

### 5.2 服务器初始化（一次性）

<!-- 注意：以下路径 /var/www/quiet-archive 是示例，你可以替换为自己喜欢的部署路径 -->

```bash
# 依赖
sudo apt update
sudo apt install -y nginx git python3 python3-pip nodejs npm

# 建议用 nvm 装 Node >= 22.12
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22

# 拉取你的私仓（用 deploy key 或 PAT）
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www
git clone git@github.com:<you>/quiet-archive.git  # ← 替换 <you> 为你的 GitHub 用户名
cd quiet-archive

# 装依赖
npm ci
pip3 install -r scripts/requirements.txt

# 首次构建
npm run build
```

构建产物在 `dist/`，这是要对外暴露的唯一目录。

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
sudo systemctl reload nginx
```

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

#### 6.1.1 准备部署脚本

在服务器创建 `/var/www/quiet-archive/deploy.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail

cd /var/www/quiet-archive  # ← 替换为你的实际部署路径

echo "▶ pulling"
git fetch origin main
git reset --hard origin/main

echo "▶ installing node deps"
npm ci

echo "▶ installing python deps"
pip3 install -r scripts/requirements.txt

echo "▶ building static site"
rm -rf dist
npm run build

echo "✓ deployed at $(date -Iseconds)"
```

授权：

```bash
chmod +x /var/www/quiet-archive/deploy.sh
```

#### 6.1.2 配置 GitHub Secrets

在 GitHub 仓库：Settings → Secrets and variables → Actions → New repository secret，新增：

| Secret | 说明 |
|---|---|
| `SSH_HOST` | 服务器 IP 或域名 |
| `SSH_USER` | SSH 用户名 |
| `SSH_PORT` | SSH 端口，通常是 `22` |
| `SSH_PRIVATE_KEY` | 能登录服务器的私钥（建议专门创建一个部署用 key） |

#### 6.1.3 新增 GitHub Actions 工作流

在仓库里创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy

on:
  push:
    branches:
      - main
  workflow_dispatch:

concurrency:
  group: deploy-production
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SSH_PORT }}
          script: /var/www/quiet-archive/deploy.sh
```

之后你的发布流程就是：

```bash
git add .
git commit -m "article: publish xxx"
git push origin main
# GitHub Actions 自动完成部署，无需手动操作
```

### 6.2 关于全量构建

当前构建是**全量重新构建**：每次 `npm run build` 都会重新扫描所有内容、重新生成所有索引和页面。

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
*/5 * * * * cd /var/www/quiet-archive && git fetch origin main && [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ] && bash /var/www/quiet-archive/deploy.sh >> /var/log/quiet-archive-deploy.log 2>&1
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
