# 内容系统规范

## 核心原则

私有 Git 仓库就是内容后端。

Markdown、MDX、静态资源和脚本与站点代码放在同一个仓库中。文件是内容的唯一事实来源。索引、路由表、搜索数据和分享图都是从文件派生出来的产物。

内容系统必须保持可读、可迁移、本地易维护。

## 仓库结构

```txt
posts/
  article/
  note/
  answer/
  project-log/
  column/
  work/
  experiment/

assets/
  images/
  covers/
  share/
  attachments/

scripts/
  check.py
  build_index.py
  generate_share.py
  publish.py

docs/
```

规则：

- `posts/` 只存放内容。
- `posts/` 下只允许出现一级 type 目录。
- 一级目录名就是内容 `type`。
- 支持的 type 固定为：
  - `article`
  - `note`
  - `answer`
  - `project-log`
  - `column`
  - `work`
  - `experiment`
- 目录名和内容文件名只允许小写英文字母、数字和短横杆。
- 中文允许出现在标题、摘要、标签和正文中，不允许出现在路径中。
- `README.md` 是保留文件名，表示目录页。
- 非 `README.md` 的 `.md` 和 `.mdx` 文件是内容条目。
- 目录允许嵌套，但一个 type 下默认最多五层。

建议的实际深度：

```txt
posts/<type>/<topic>/<subtopic>/<entry>.md
```

## URI 规则

URI 从 `posts/` 下的路径生成。

示例：

```txt
posts/article/frontend-editor/dom-view-layer.md
```

生成：

```txt
/article/frontend-editor/dom-view-layer
```

```txt
posts/article/frontend-editor/README.md
```

生成：

```txt
/article/frontend-editor
```

```txt
posts/column/archive-story/volume-01/chapter-001.md
```

生成：

```txt
/column/archive-story/volume-01/chapter-001
```

路径冲突是非法的。例如，目录 `README.md` 和普通内容文件不能生成同一个 URI。

## Markdown 与 MDX

`.md` 和 `.mdx` 都需要支持。

默认使用 `.md`：

- 正式文章。
- 短笔记。
- 问答。
- 项目日志。
- 专栏章节。
- 普通作品说明。

只有内容需要组件时才使用 `.mdx`：

- 交互 Demo。
- 自定义项目卡片。
- 图片画廊。
- 图表。
- 特殊排版模块。

系统不把 `.md` 文件自动转换为 `.mdx` 文件，而是在解析阶段统一抽象为 `ContentEntry`：

```txt
.md  -> ContentEntry
.mdx -> ContentEntry
```

MDX 组件由作者个人维护。由于这是个人私有站点，第一版不需要组件白名单或黑名单。

## 目录 README

每个目录都可以有一个 `README.md`。

`README.md` 表示目录页、集合页、类型页、专题页、卷页或专栏总览页。

顶层 type README 示例：

```md
---
title: "文章"
type: "article"
layout: "article-index"
description: "正式技术文章、工程思考和长期整理。"
display:
  defaultView: "archive"
  density: "medium"
  showTimeline: false
---

这里是 article 类型的说明。
```

专题 README 示例：

```md
---
title: "前端编辑器"
layout: "collection-index"
description: "关于编辑器架构、语法、渲染和交互的长期记录。"
order: 10
featured: true
---

这里是这个专题的介绍。
```

## 内容 frontmatter

公开内容条目的必需字段：

```yaml
title: "标题"
date: "2026-05-04"
status: "published"
summary: "一句话摘要"
```

推荐字段：

```yaml
tags: ["frontend", "editor", "architecture"]
featured: false
cover: ""
updated: "2026-05-04"
```

可选字段：

```yaml
series: "frontend-editor"
order: 10
layout: "article"
share:
  image: "/assets/share/article/frontend-editor/dom-view-layer.png"
  theme: "paper"
  accent: "green"
```

`status` 可选值：

```txt
draft
published
archived
```

`status` 行为：

- `draft`：本地预览可见，不进入生产索引。
- `published`：公开可见，并进入索引。
- `archived`：直接访问可见，但不进入首页精选和普通推荐区域。

## 类型默认展示

每种 type 都有默认渲染模式：

```txt
article       article
note          timeline
answer        qa
project-log   project-timeline
column        book
work          portfolio
experiment    experiment
```

类型默认展示应配置在 `posts/<type>/README.md`。

单篇内容可以覆盖少量展示细节，但不允许随意切换到与 type 无关的页面模板。整个站点必须保持档案系统的一致性。

## 静态资源

静态资源放在 `assets/` 下。

推荐目录：

```txt
assets/images/
assets/covers/
assets/share/
assets/attachments/
```

推荐 Markdown 写法：

```md
![示例图](/assets/images/editor-layout.png)
```

允许外链图片，但不推荐。校验脚本对外链图片给出 warning，不阻断构建。

分享图生成到：

```txt
assets/share/<type>/<path>.png
```

## 校验规则

`scripts/check.py` 需要校验：

- `posts/` 下只存在受支持的 type 目录。
- 目录名和文件名符合小写短横杆 URI 规则。
- 不存在 URI 冲突。
- frontmatter 是合法 YAML。
- 内容条目存在必需字段。
- `status` 值合法。
- 本地资源引用可以解析。
- 外链图片只产生 warning。
- 生产输出排除 draft 内容。
- `README.md` 可以生成合法目录页。

发布前必须运行校验脚本。

## 生成索引

索引脚本生成派生产物，例如：

```txt
public/content-index.json
public/search-index.json
public/route-map.json
public/archive-tree.json
```

这些文件必须能从 `posts/` 和 `assets/` 重新生成。

`content-index.json` 存放列表和路由所需元信息。

`search-index.json` 存放分词后的搜索字段和排序权重。

`archive-tree.json` 保留目录层级，用于档案导航。

## 发布流程

本地流程：

```txt
write content
  -> scripts/check.py
  -> scripts/build_index.py
  -> scripts/generate_share.py
  -> git commit
  -> git push
```

服务器流程：

```txt
receive deploy hook
  -> git pull
  -> scripts/check.py
  -> scripts/build_index.py
  -> astro build
  -> restart or refresh static hosting
```

推荐在本地生成分享图后再 push。这样可以在部署前发现字体、排版或图片生成问题。
