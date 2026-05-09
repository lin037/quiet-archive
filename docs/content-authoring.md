---
title: Content Authoring
description: 从新建文档到上线发布的完整流程
---

# Content Authoring

本文档覆盖：**如何写、如何组织、如何校验、如何发布**。

> 本文档适用于 Quiet Archive 项目。

---

## 1. 你的第一篇文章

假设要写一篇技术文章：

```bash
mkdir -p posts/article
cat > posts/article/my-first-post.md <<'EOF'
---
title: 我的第一篇文章
date: 2026-05-05
status: draft
summary: 测试一下这个档案馆系统。
tags: [meta]
---

## 引子

这是正文。
EOF
```

本地校验：

```bash
npm run check
```

注意：`status: draft` 状态下**不会进入正常页面路由、索引、搜索或静态 API**。确认满意后改为 `published`，再提交。

> 当前项目没有内置私有预览路由。如果你想在本地按最终页面效果预览草稿，可以临时改成 `published`，运行 `npm run dev` 后访问 `http://localhost:4321/article/my-first-post`；确认后再决定是否提交。也可以后续自行增加仅本地使用的 draft preview 页面。

---

## 2. 内容组织哲学

**文件夹即结构，命名即 URL，README.md 即目录页。**

这三条原则覆盖了所有场景，请熟记。

### 2.1 扁平内容

```
posts/article/dom-view-layer.md        → /article/dom-view-layer
posts/note/thinking-tools.md           → /note/thinking-tools
```

直接丢到类型栏根目录即可。

### 2.2 专题 / 子目录

```
posts/article/frontend-editor/
├── README.md            → /article/frontend-editor (专题首页)
├── dom-view-layer.md    → /article/frontend-editor/dom-view-layer
└── collaborative.md     → /article/frontend-editor/collaborative
```

子目录的 `README.md` 可以声明整个专题的元信息：

```yaml
---
title: 前端编辑器系列
description: 关于富文本编辑器、CRDT、CodeMirror 的一系列思考
status: published
date: 2026-05-01
display:
  defaultView: archive
---

这里可以写专题介绍的正文。
```

### 2.3 深度嵌套（专栏 / 书籍）

```
posts/column/archive-story/
├── README.md                  → /column/archive-story
├── volume-1/
│   ├── README.md              → /column/archive-story/volume-1
│   ├── chapter-001.md         → /column/archive-story/volume-1/chapter-001
│   └── chapter-002.md
└── volume-2/
    ├── README.md
    └── chapter-001.md
```

层级没有硬上限（推荐不超过 5 层，太深会影响可读性）。

---

## 3. Frontmatter 规范

### 3.1 普通内容条目

```yaml
---
title: 文章标题                      # 必填
date: 2026-05-05                    # 必填（YYYY-MM-DD）
status: published                    # published | draft | archived
summary: 一句话描述                   # 列表展示
tags: [frontend, architecture]       # 标签数组
featured: false                      # 是否精选
cover: /assets/covers/xxx.png        # 可选封面，实际文件放在 public/assets/covers/ 下
updated: 2026-05-06                  # 可选更新日期
series: 前端编辑器                    # 可选所属系列
order: 1                             # 可选自定义排序权重（越小越靠前）
---
```

### 3.2 封面图 `cover`

`cover` 是可选字段，用于文章卡片、详情页头图、分享图等前台展示场景。推荐把图片放在 `public/assets/` 下，并在 frontmatter 中写成站点根路径：

```yaml
cover: /assets/covers/my-post.png
```

也就是说，运行时 URL `/assets/covers/my-post.png` 对应仓库中的 `public/assets/covers/my-post.png`。如果图片只放在项目根目录 `assets/` 下，构建或部署后访问 `/assets/...` 时可能出现 404。

省略前导 `/` 的 `assets/covers/my-post.png` 也会被 `resolveAssetSrc()` 规范化为 `/assets/covers/my-post.png`，但实际文件仍应放在 `public/assets/covers/` 下。

生成或编写前端时，应该优先使用：

```ts
const coverSrc = resolveAssetSrc(entry.cover);
```

不要直接把 `entry.cover` 当作最终 `<img src>` 使用；渲染前应通过 `resolveAssetSrc()` 统一规范化。

如果文章没有 `cover`，前端可以根据视觉设计使用排版、类型标签、占位图片或纯文字卡片作为回退。项目自带的占位图片位于 `public/assets/placeholders/`，运行时路径为 `/assets/placeholders/...`。

### 3.3 目录页（`README.md`）

```yaml
---
title: 文章                          # 目录显示名
description: 正式技术文章与长文思考    # 目录描述
status: published                    # 目录也需要 published 才会被识别
date: 2026-05-01
display:
  defaultView: archive               # 决定列表展示形式
  density: medium                    # compact | medium | comfortable
order: 10                            # 在导航中的顺序
showInNav: true                      # 是否显示在顶部导航
---

（可选）目录页的正文介绍。
```

### 3.4 `status` 可见性语义

`status` 是构建期的公开开关：

| 状态 | 语义 | 是否公开 |
|---|---|---:|
| `published` | 正式发布 | 是 |
| `draft` | 草稿，保留在私仓中 | 否 |
| `archived` | 已归档 / 下架，文件继续保留 | 否 |

只有 `published` 会进入：

- 页面详情路由
- 首页 / 列表 / 归档
- 搜索索引 `/search-index.json`
- 内容索引 `/content-index.json`
- 静态 API `/api/*.json`

这不是登录鉴权，而是**构建期过滤**：只要仓库是私有的，且 Nginx 只暴露 `dist/`，普通内容就只会暴露 `published` 产物。

> 注意：根目录特殊页取决于你的前端实现。`posts/about.md` 是一个特殊文件，它位于 `posts/` 根目录而非某个类型栏下，通常由前端的 `/about` 页面路由直接读取，不参与类型栏的自动发现和列表展示。不要把未发布或敏感内容放进这类被页面直接读取的文件；正式生成自己的前端时，也应让特殊页面遵循同样的 `published` 过滤约定。

### 3.5 `display.defaultView` 可选值

| 值 | 适合内容 |
|---|---|
| `archive` | 标准时间倒序列表（默认） |
| `timeline` | 时间线（短笔记、动态） |
| `cards` | 卡片墙（作品、实验、封面型） |
| `book` | 书籍章节（专栏、连载） |
| `qa` | 问答形式 |
| `project` | 项目时间线 |
| `gallery` | 图文画廊 |

具体呈现取决于你的前端实现层。API 会把 `displayView` 值原样提供。

---

## 4. 内容类型建议

以下是一些推荐的内容类型，但类型不是硬约定——你可以随时新增自己的类型：

| 类型 | 用途 | 写作节奏 |
|---|---|---|
| `article` | 正式技术文章、长文思考 | 慢 / 结构化 |
| `note` | 短随笔、动态、半成品想法 | 快 / 高频 |
| `column` | 长期专栏、连载 | 慢 / 系列 |
| `answer` | 问答、自问自答 | 中 / 结构化 |
| `project-log` | 项目进展、开发日志 | 中 / 时间戳 |
| `work` | 作品、项目、工具 | 慢 / 文档化 |
| `experiment` | 小实验、原型 | 快 / 记录性 |

新增类型只需要创建文件夹并添加 README.md：

```bash
mkdir posts/my-type
cat > posts/my-type/README.md <<'EOF'
---
title: 我的类型
description: 这个类型的描述
status: published
date: 2026-05-05
display:
  defaultView: archive
order: 50
showInNav: true
---
EOF
```

系统会自动识别并加入导航（前提是 `status: published` 且 `showInNav: true`）。

---

## 5. 写作工作流

```
┌─────────────────────────────────────────────┐
│ 1. 在 posts/ 下写 markdown                   │
│    status: draft                            │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ 2. npm run check                            │
│    校验 frontmatter / URI 冲突等             │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ 3. 需要页面预览时临时改成 published          │
│    npm run dev 预览，确认后再决定是否提交     │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ 4. 最终确认 status: published               │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ 5. git commit && git push                   │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ 6. GitHub Actions SSH 到服务器               │
│    自动拉取 + 全量构建 + 上线                 │
└─────────────────────────────────────────────┘
```

**关键：第 6 步是全自动的，你不需要手动调用任何接口。** 推荐主方案见 [getting-started.md](./getting-started.md) 的 GitHub Actions SSH 部署。

---

## 6. 常见场景

### 6.1 想保存但还不想发布

```yaml
status: draft
```

草稿会留在仓库里，不会出现在构建产物里。这让「仓库 = 完整档案，站点 = 公开档案」。

### 6.2 想下线一篇已发布文章

```yaml
status: archived
```

或直接改回 `draft`。也可以删除文件，但从档案馆的角度**归档比删除更合适**。

下架后提交并 push，下一次自动部署成功后，它会从页面、索引、搜索和静态 API 中消失；原 URL 会变成 404。文件仍然保留在私有仓库里，方便以后重新发布或追溯历史。

### 6.3 调整一篇文章的 URL

直接改文件名 / 移动文件夹即可。URI 会跟着变。

注意：对外已经被引用过的 URL 会 404。如果很重要，建议在 nginx 加 rewrite：

```nginx
location = /article/old-slug {
    return 301 /article/new-slug;
}
```

### 6.4 批量重构内容结构

```bash
# 例如把所有 article/frontend-* 归到一个专题下
mkdir posts/article/frontend
git mv posts/article/frontend-*.md posts/article/frontend/
# 加个 README
cat > posts/article/frontend/README.md <<'EOF'
---
title: 前端
status: published
date: 2026-05-05
---
EOF
npm run check
npm run dev  # 预览确认
```

### 6.5 添加图片

```
public/assets/
  article/
    frontend-editor/
      dom-view-layer-fig-1.png
```

在文章里引用：

```markdown
![DOM view layer](/assets/article/frontend-editor/dom-view-layer-fig-1.png)
```

注意：Markdown 中写的是运行时 URL `/assets/...`，对应仓库里的物理路径是 `public/assets/...`。

---

## 7. 写作建议

### 7.1 URI 稳定性

**一旦文章发布、URI 对外暴露过，就尽量不要改了**。这是档案馆的尊严。

起名时多想 30 秒，用小写英文短横线风格：`dom-view-layer`，不要用时间戳、不要用数字编号（除非是章节）。

### 7.2 Summary 要写好

`summary` 出现在所有列表、搜索结果、分享卡片里。把它当成一篇文章的"招牌"：

- 一句话说清内容是什么
- 不要是标题的复读
- 40-80 字为佳

### 7.3 Tags 要克制

一篇文章 3-5 个标签足够。标签多了就失去了分类意义。

### 7.4 对未来的自己友好

你写的东西会作为 Agent 的知识库被反复检索。所以：

- 标题要清晰（不要「关于 xxx 的一点想法」这种懒惰标题）
- 要点要明确（用列表、分节、代码块）
- 上下文要完整（不要假设读者/Agent 知道前情）

**你是为 5 年后那个已经忘了一切的你而写。**

---

## 8. 发布检查清单

提交前快速过一遍：

- [ ] `npm run check` 通过
- [ ] `status: published`
- [ ] `title` / `date` / `summary` / `tags` 都填了
- [ ] 本地 `npm run dev` 预览过
- [ ] 图片都放在 `public/assets/` 并通过 `/assets/...` 引用
- [ ] 代码块有语言标记（`` ```ts ``、`` ```bash ``）
- [ ] commit message 格式类似：`article: <短描述>` / `note: <短描述>`

---

## 9. 特殊文件说明

### `posts/about.md`

`about.md` 位于 `posts/` 根目录，是关于页面的内容源。它不属于任何类型栏，不会出现在类型列表或归档中。前端通常通过专门的 `/about` 路由读取并渲染它。

它的 frontmatter 只需要基本字段：

```yaml
---
title: 关于
date: 2026-05-05
status: published
summary: 关于这个档案馆。
---
```

---

## 10. 进阶：让 Agent 帮你写

因为本项目设计上就是 Agent 友好的，你可以在 Claude Code / Cursor 里做：

```
请帮我起草一篇 article，主题：<xxx>。
参考 posts/article/ 下已有文章的 frontmatter 格式和文风。
写完存到 posts/article/<合适的 slug>.md。
```

或者让 Agent 读取你的旧 note，合成成一篇 article：

```
请读取 posts/note/ 下所有关于「xxx」的 note，
帮我整理成一篇 article 草稿，结构要清晰，引用原 note 的 uri。
```

**写作、归档、复用，是同一个系统里的三种形态。**
