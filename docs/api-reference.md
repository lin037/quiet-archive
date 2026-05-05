---
title: API Reference
description: 内部查询 API 与对外暴露的 HTTP / MCP 接口
---

# API Reference

本项目的 API 层是核心资产。它让你的内容**既能渲染成博客，又能作为知识库被 Agent 查询**。

本文档分三部分：

- **Part 1**：已实现的内部 TypeScript API（`src/api/*`），供页面和 Astro 端点调用。
- **Part 2**：已实现的**静态 JSON HTTP API**（`dist/api/*.json`），供浏览器、cURL、Agent、MCP client 直接消费。
- **Part 3**：规划中的 MCP Server 设计。

---

## Part 1. 内部 TypeScript API

所有函数都是**纯函数 + Promise**，无副作用，不依赖运行时数据库。

### 1.1 类型定义（`src/api/types.ts`）

```ts
type ContentStatus = 'draft' | 'published' | 'archived';

type DisplayView =
  | 'archive' | 'timeline' | 'cards' | 'book'
  | 'qa' | 'project' | 'gallery';

interface TypeMeta {
  slug: string;           // 文件夹名，也是 URI 段
  title: string;          // 展示名
  description: string;
  displayView: DisplayView;
  density: 'compact' | 'medium' | 'comfortable';
  order: number;
  showInNav: boolean;
}

interface ContentEntry {
  id: string;             // Astro collection id
  uri: string;            // 最终 URI，例如 /article/foo
  typeSlug: string;       // 所属类型栏
  dirPath: string;        // 所在目录，例如 article/frontend-editor
  title: string;
  date: string;
  status: ContentStatus;
  summary: string;
  description?: string;
  tags: string[];
  featured: boolean;
  cover?: string;
  updated?: string;
  series?: string;
  order?: number;
  isDirectory: boolean;   // README.md 即 true
}

interface DirectoryListing {
  path: string;
  uri: string;
  meta?: ContentEntry;          // 目录自身的 README 元信息
  directories: ContentEntry[];  // 直接子目录
  entries: ContentEntry[];      // 分页后的直接条目
  pageInfo: PageInfo;
}

interface ArchiveStats {
  total: number;
  byType: { slug: string; title: string; count: number }[];
  recentUpdate: string;
  tags: { name: string; count: number }[];
}
```

### 1.2 `src/api/content.ts`

| 函数 | 说明 |
|---|---|
| `discoverTypes()` | 从 `posts/` 的直属子文件夹动态发现类型栏 |
| `getNavTypes()` | 导航中显示的类型栏（过滤 `showInNav: false`） |
| `getAllEntries()` | 所有已发布内容（不含 README 目录页） |
| `getAllEntriesWithDirectories()` | 所有已发布（含 README） |
| `getEntriesByType(typeSlug)` | 某类型栏下的所有条目 |
| `getEntriesInDir(dirPath)` | 某目录直接子内容 |
| `getSubDirectories(dirPath)` | 某目录的直接子目录 |
| `getDirectoryMeta(dirPath)` | 某目录的 README 元信息 |
| `getDirectoryListing(dirPath, { page, pageSize })` | 分页的目录内容（子目录 + 条目） |
| `getDirectoryTitleMap()` | 所有目录路径 → 标题映射（面包屑用） |
| `getRecentEntries(limit = 8)` | 最近发布内容 |
| `getFeaturedEntries()` | 精选内容 |
| `getEntriesByTag(tag)` | 某标签下内容 |
| `getEntryByUri(uri)` | 通过 URI 获取单条 |
| `paginate(items, page, pageSize)` | 通用分页工具 |

### 1.3 `src/api/navigation.ts`

| 函数 | 说明 |
|---|---|
| `getBreadcrumb(uri)` | 生成面包屑链（首页 → 类型 → 目录 → 当前） |
| `getPrevNext(uri, typeSlug)` | 同类型下的上一篇 / 下一篇 |
| `getTableOfContents(headings)` | 从 Astro 提供的 headings 提取 TOC（默认 h2-h4） |

### 1.4 `src/api/stats.ts`

| 函数 | 说明 |
|---|---|
| `getArchiveStats()` | 返回 `ArchiveStats`：总数、分类型数、最近更新、标签频次 |

### 1.5 `src/api/assets.ts`

资源引用辅助（当前轻量，后续会扩展为分享图路径解析等）。

### 1.6 使用范例

```astro
---
// src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import {
  getNavTypes,
  getRecentEntries,
  getFeaturedEntries,
} from '../api/content';
import { getArchiveStats } from '../api/stats';

const [types, recent, featured, stats] = await Promise.all([
  getNavTypes(),
  getRecentEntries(10),
  getFeaturedEntries(),
  getArchiveStats(),
]);
---
<BaseLayout title="首页">
  <!-- 全由视觉层自由发挥 -->
</BaseLayout>
```

---

## Part 2. 静态 JSON HTTP API

### 2.1 设计原则

- 所有端点**只读**，不接受写入（事实来源永远是 Git）。
- 所有端点都是**静态 JSON 文件**，由 Astro 在构建阶段生成，放在 `dist/api/` 下。
- **不依赖任何运行时**。关掉 Node，这些 API 仍然可用（Nginx 直接托管）。
- CORS 开放：端点返回头带 `Access-Control-Allow-Origin: *`，任意客户端可调。
- 约定路径前缀：`/api/`，后缀 `.json`。

### 2.2 端点清单

| 端点 | 生成文件 | 说明 | 状态 |
|---|---|---|---|
| `GET /api/types.json` | `src/pages/api/types.json.ts` | 所有内容类型栏 | ✅ |
| `GET /api/entries.json` | `src/pages/api/entries.json.ts` | 所有已发布内容条目 | ✅ |
| `GET /api/entry/<uri>.json` | `src/pages/api/entry/[...uri].json.ts` | 单条详情（含正文 body） | ✅ |
| `GET /api/tree.json` | `src/pages/api/tree.json.ts` | 完整归档树 | ✅ |
| `GET /api/stats.json` | `src/pages/api/stats.json.ts` | 档案统计 | ✅ |
| `GET /api/tags.json` | `src/pages/api/tags.json.ts` | 标签频次 | ✅ |
| `GET /search-index.json` | `scripts/build_search_index.py` | 搜索索引（中文已分词） | ✅ |

### 2.3 详细定义

#### `GET /api/types.json`

```json
{
  "types": [
    {
      "slug": "article",
      "title": "文章",
      "description": "正式技术文章与长文思考",
      "displayView": "archive",
      "density": "medium",
      "order": 10,
      "showInNav": true
    }
  ]
}
```

#### `GET /api/entries.json`

返回所有 `status: published` 的内容条目（不含 README 目录页）。

```json
{
  "total": 125,
  "items": [
    {
      "id": "article/foo",
      "uri": "/article/foo",
      "typeSlug": "article",
      "dirPath": "article",
      "title": "Foo",
      "date": "2026-05-01",
      "status": "published",
      "summary": "一句话摘要",
      "tags": ["frontend"],
      "featured": false,
      "isDirectory": false
    }
  ]
}
```

> **客户端过滤**：静态模式下不支持服务端过滤参数。建议客户端拿到全部 `items` 后在内存里过滤/分页（典型数据量在几百到几千条，前端过滤性能完全够用）。

#### `GET /api/entry/<uri>.json`

`<uri>` 为内容 URI 去掉首个 `/`。例如：

- `posts/article/foo.md` → `/api/entry/article/foo.json`
- `posts/article/README.md` → `/api/entry/article.json`
- `posts/column/story/ch-01.md` → `/api/entry/column/story/ch-01.json`

响应：

```json
{
  "entry": { /* ContentEntry */ },
  "body": "# Foo\n\n正文 Markdown..."
}
```

#### `GET /api/tree.json`

```json
{
  "tree": [
    {
      "path": "/article",
      "type": "article",
      "title": "文章",
      "entries": [
        { "uri": "/article/foo", "title": "Foo", "date": "2026-05-01" }
      ],
      "children": [
        {
          "path": "/article/frontend",
          "title": "Frontend",
          "entries": [ /* ... */ ]
        }
      ]
    }
  ]
}
```

#### `GET /api/stats.json`

```json
{
  "total": 125,
  "byType": [
    { "slug": "article", "title": "文章", "count": 42 }
  ],
  "recentUpdate": "2026-05-05",
  "tags": [
    { "name": "frontend", "count": 17 }
  ]
}
```

#### `GET /api/tags.json`

```json
{
  "total": 36,
  "tags": [
    { "name": "frontend", "count": 17 },
    { "name": "architecture", "count": 9 }
  ]
}
```

#### `GET /search-index.json`

搜索引擎使用的索引。条目结构：

```json
{
  "id": "/article/foo",
  "uri": "/article/foo",
  "type": "article",
  "title": "Foo",
  "summary": "...",
  "tags": ["frontend"],
  "headings": ["背景", "实现"],
  "body": "正文纯文本前 600 字...",
  "tokens": "foo 前端 架构 jieba 分词后的 token ...",
  "date": "2026-05-01",
  "featured": false,
  "isDirectory": false
}
```

字段语义：

- `tokens` 是 jieba 分词后的空格分隔 token 串，用于快速 token 命中。
- `body` 是去除 markdown 语法、截断到 600 字的纯文本，用于命中上下文展示。
- 字段权重推荐：`title(10) > tags(6) > summary(5) > headings(4) > body(1)`。

### 2.4 调用示例

**用 curl 查询档案统计：**

```bash
curl -s https://blog.example.com/api/stats.json | jq '.byType'
```

**用 fetch 拿某条详情：**

```js
const res = await fetch('https://blog.example.com/api/entry/article/foo.json');
const { entry, body } = await res.json();
```

**在 Agent / 脚本中做本地搜索：**

```python
import json
import urllib.request

with urllib.request.urlopen('https://blog.example.com/search-index.json') as r:
    index = json.load(r)

query = 'dom editor'
hits = [e for e in index if query.lower() in e['title'].lower() or query.lower() in e['body'].lower()]
```

---

## Part 3. MCP Server（规划中）

一旦 Part 2 就绪（已完成），把内容暴露成 MCP Server 是**几乎零成本**的 —— 只需写一个 HTTP client wrapper。

### 3.1 推荐工具清单

| Tool | 描述 | 调用的后端 |
|---|---|---|
| `list_types` | 列出所有内容类型栏 | `/api/types.json` |
| `list_entries` | 按条件列出内容 | `/api/entries.json`（客户端过滤） |
| `get_entry` | 获取单条详情（含正文） | `/api/entry/<uri>.json` |
| `search` | 全文搜索 | `/search-index.json`（客户端检索） |
| `get_tree` | 获取归档树 | `/api/tree.json` |
| `get_stats` | 获取档案统计 | `/api/stats.json` |
| `list_tags` | 列出所有标签 | `/api/tags.json` |

### 3.2 结构建议

```
blog-mcp/
├── package.json
├── src/
│   ├── index.ts           MCP server 入口
│   ├── tools/
│   │   ├── list_entries.ts
│   │   ├── get_entry.ts
│   │   └── search.ts
│   └── client.ts          统一的 HTTP client，指向 https://blog.example.com/api/*
```

每个 tool 的实现就是一次 `fetch` + 返回格式化。代码量预计 <300 行。

### 3.3 配置到 Claude Desktop 的示意

```json
{
  "mcpServers": {
    "my-blog": {
      "command": "npx",
      "args": ["blog-mcp", "--site", "https://blog.example.com"]
    }
  }
}
```

配置完成后，AI 在对话中能直接：「查一下我 2024 年写过的关于 editor 的 article」「把我所有 tag 包含 agent 的笔记列出来」。

### 3.4 使用场景

- **接入 Claude Desktop / Cursor**：AI 在对话里直接查你的博客 / 知识库。
- **接入自己的 Agent**：把档案馆当作 Agent 的长期记忆层。
- **接入 Skills**：Skill 直接 `fetch` 静态 JSON 也可以，不一定非要走 MCP。

---

## Part 4. 作为 Agent 知识库的最佳实践

本项目天生适合做 Agent 知识库，因为：

- **内容结构化**：每条都有 uri / tags / summary / type，Agent 友好。
- **版本化**：Git 本身就是最可靠的知识库持久层。
- **可 diff**：Agent 可以对比两次构建之间的内容变化。
- **公私分离**：私仓保留草稿与过程，公开站点只暴露你愿意公开的内容。
- **0 运行时**：Agent 调用的 API 是静态 JSON，便宜、可缓存、稳定。

### 推荐的写作 + 知识库协作姿势

1. 用 `note/` 快速记录想法（短动态）。
2. 用 `project-log/` 记录开发过程（时间戳密集）。
3. 用 `article/` 沉淀长期思考（结构化、可检索）。
4. 用 `answer/` 回答自问自答的问题（QA 格式，检索友好）。
5. 让 Agent 定期通过 `/search-index.json` 或 MCP 把你的旧内容拉出来复习、重组、产生新想法。

**你写得越多，你的 Agent 就越懂你。** 这是博客 + 知识库双重形态的长期价值。
