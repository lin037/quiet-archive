# 技术架构文档

## 技术栈决策

站点使用 Astro。

原因：

- 项目是内容密集型、档案型站点。
- Astro 对 Markdown/MDX 驱动的静态页面非常合适。
- 静态输出可以降低服务器运行成本。
- 只有搜索等局部功能需要交互，适合使用 Astro islands。
- 页面可以保持很少的浏览器 JavaScript，速度和稳定性更好。

内容仓库和网站代码仓库不分离。写作内容、脚本、静态资源和站点实现都放在同一个私有 Git 仓库中，减少维护成本。

## 运行模型

核心档案必须可以仅由文件和生成索引渲染出来。

```txt
posts/ + assets/
  -> 校验
  -> 解析
  -> 生成索引
  -> Astro 路由
  -> 静态页面
```

运行时服务是可选项。普通页面渲染不能依赖数据库。

SQLite 后续可以用于非核心数据：

- 浏览计数。
- 构建缓存。
- 搜索缓存。
- 分享图生成缓存。
- AI 摘要或 embedding 缓存。

SQLite 不存储文章正文，也不作为内容事实来源。

## 服务器模型

服务器可以运行轻量后端或脚本。

服务器职责：

- 拉取私有 Git 仓库。
- 运行内容校验。
- 生成索引。
- 构建 Astro 站点。
- 提供静态文件服务。
- 可选：暴露部署 hook。
- 可选：用 SQLite 存储少量运行时数据。

推荐脚本职责：

```txt
scripts/check.py
  校验内容仓库规范。

scripts/build_index.py
  解析 posts，生成内容索引、路由表、档案树和搜索索引。

scripts/generate_share.py
  生成论文封面感分享图。

scripts/publish.py
  本地发布辅助脚本，串联校验、索引、分享图、git push 和远端部署 hook。
```

## Markdown 渲染

Astro 需要同时渲染 `.md` 和 `.mdx`。

渲染管线：

```txt
Markdown/MDX
  -> frontmatter parser
  -> remark plugins
  -> rehype plugins
  -> Astro content rendering
  -> custom typography styles
```

预期能力：

- GitHub-flavored Markdown。
- 代码高亮。
- 标题锚点。
- 目录。
- 需要时支持脚注。
- 本地图片处理。
- 自定义 MDX 组件。

样式层需要提供 type-aware 布局组件：

```txt
ArticleLayout
NoteTimelineLayout
AnswerLayout
ProjectLogLayout
ColumnLayout
WorkLayout
ExperimentLayout
DirectoryLayout
```

## 搜索架构

搜索必须快，并且支持中文内容。

第一版架构：

```txt
scripts/build_index.py
  -> 解析 Markdown 文本
  -> 抽取 title、summary、tags、headings、body
  -> 执行中文分词
  -> 生成 search-index.json

前端搜索 UI
  -> 加载 search-index.json
  -> 使用客户端模糊搜索
  -> 按字段权重排序
```

推荐实现：

- 用 Python 生成索引。
- 构建阶段使用 `jieba` 或同类中文分词库。
- 分词后的字段写入 `search-index.json`。
- 前端使用 MiniSearch 或 Fuse.js 这类轻量浏览器搜索库。

偏好：

- 搜索速度和字段索引更重要时，优先 MiniSearch。
- 内容量小、实现要更简单时，Fuse.js 也可以接受。

第一版推荐选择：

```txt
jieba 构建时分词 + MiniSearch 前端索引
```

搜索字段权重：

```txt
title       最高
tags        高
summary     高
headings    中
directory   中
body        普通
uri         低
```

索引条目示例：

```json
{
  "id": "/article/frontend-editor/dom-view-layer",
  "uri": "/article/frontend-editor/dom-view-layer",
  "title": "DOM View Layer 设计笔记",
  "type": "article",
  "summary": "一次关于编辑器 DOM 视图层边界的整理。",
  "tags": ["frontend", "editor", "architecture"],
  "headings": ["背景", "边界", "实现"],
  "tokens": "dom view layer 设计 笔记 前端 编辑器 架构",
  "body": "正文抽取后的纯文本..."
}
```

保持搜索速度的规则：

- 构建时生成索引。
- 去掉 Markdown 语法，只保留纯文本。
- 索引过大时不要把完整正文全部塞进前端。
- 第一版可以限制 body 摘录长度。
- 内容量变大后可以按 type 拆分搜索索引。

未来升级路线：

1. MiniSearch 静态索引。
2. Pagefind 静态站点搜索。
3. SQLite FTS5 服务端搜索。
4. 内容规模足够大时再考虑 Meilisearch。

## 分享图生成

分享图在本地或内容更新阶段生成。

推荐流程：

```txt
scripts/generate_share.py
  -> 读取内容元信息
  -> 渲染论文封面感模板
  -> 写入 assets/share/<type>/<path>.png
  -> 校验或更新 frontmatter share.image
```

设计要求：

- 黑白基底。
- 少量绿色点睛。
- 论文封面或学术预印本气质。
- 包含标题、类型、日期、URI 或短签名。
- 同时适配中文和英文标题。
- 输出尺寸稳定，适合微信分享和 Open Graph。

实现选项：

- Python + Pillow：依赖少，实现简单。
- Playwright 截图 HTML 模板：排版能力更强，与站点视觉更一致。

第一版推荐：

```txt
HTML template + Playwright screenshot
```

这样分享图可以更接近真实网页设计。

## 统计

第一版不要求真实访客统计。

`/stats` 页面可以先显示生成型档案数据：

- 总内容数。
- 各类型内容数。
- 最近更新。
- 活跃专栏。
- 精选作品。

如果后续加入浏览计数：

```txt
POST /api/view
GET /stats
SQLite views table
```

最小 SQLite 表：

```sql
create table views (
  path text primary key,
  count integer not null default 0,
  updated_at text not null
);
```

浏览统计必须保持可选。没有 SQLite 时，核心档案仍然必须可用。

## 性能策略

性能规则：

- 不在每次请求时扫描所有 Markdown。
- 普通页面不在请求时解析 Markdown。
- 构建或同步阶段生成索引。
- 分享图需要缓存。
- 浏览器 JavaScript 尽量少。
- 默认使用 Astro 静态页面。
- 只有搜索和小工具使用交互岛。

预期规模：

- 几十篇内容：完全轻松。
- 几百篇内容：安全。
- 几千篇内容：通过生成索引和搜索优化仍然安全。
- 上万篇内容：重新评估搜索和构建管线。

## 实现边界

稳定核心：

- `posts/` 文件协议。
- frontmatter schema。
- URI 规则。
- 生成索引。
- Astro 路由映射。

灵活表层：

- 视觉细节。
- 搜索 UI。
- 分享图模板。
- 可选统计。
- MDX 组件。

避免过早复杂化：

- CMS 后台。
- 登录认证。
- 评论系统。
- 推荐引擎。
- 数据库托管正文。
