---
title: 文件系统作为数据库：一种被低估的架构模式
date: 2026-05-03
status: published
summary: 探讨为什么在特定场景下，文件系统比传统数据库更适合作为数据存储层，以及如何正确地使用这种模式。
tags: [architecture, filesystem, database, design-patterns]
featured: true
---

## 引言

在现代软件开发中，我们几乎条件反射地为每个项目引入数据库。MySQL、PostgreSQL、MongoDB——这些名字如此熟悉，以至于我们很少停下来问一个基本问题：**我们真的需要数据库吗？**

这不是一个反数据库的宣言。数据库在绝大多数场景下都是正确的选择。但存在一类特殊的应用场景，文件系统不仅足够，而且可能是更优的选择。

## 什么时候文件系统就够了

让我们先明确适用条件：

1. **数据是文本为主的**：Markdown、JSON、YAML、配置文件
2. **写入频率低**：不是每秒数千次写入，而是每天几次到几十次
3. **不需要复杂查询**：不需要 JOIN、不需要事务、不需要实时聚合
4. **版本历史很重要**：Git 天然提供了完整的变更追踪
5. **可移植性是优先级**：不想被特定数据库绑定

个人博客、文档站点、知识库、配置管理——这些场景完美匹配上述条件。

## 文件系统的隐藏优势

### 1. 零运行时依赖

```bash
# 传统方案：启动前需要确保数据库在运行
docker-compose up -d postgres
npm run migrate
npm run seed
npm run dev

# 文件系统方案：直接开始
npm run dev
```

没有连接池配置、没有迁移脚本、没有 ORM 映射。你的数据就在那里，用任何文本编辑器都能直接查看和修改。

### 2. Git 即版本控制

每一次 `git commit` 都是一次完整的数据库快照。你可以：

- 回溯到任意历史版本
- 查看每条数据的完整变更历史
- 使用 `git blame` 追踪每一行的来源
- 通过 `git diff` 精确了解两个版本之间的差异

这比任何数据库的审计日志都要强大和可靠。

### 3. 人类可读

打开文件夹，你看到的就是你的数据。不需要 GUI 客户端，不需要 SQL 查询，不需要理解二进制格式。任何人——包括非技术人员——都能直接阅读和理解数据的结构。

```
posts/
├── article/
│   ├── README.md          ← 一眼就知道这是文章分类
│   ├── my-first-post.md   ← 一眼就知道这是一篇文章
│   └── frontend/
│       ├── README.md      ← 一眼就知道这是前端子分类
│       └── react-hooks.md ← 一眼就知道这是关于 React Hooks 的文章
```

### 4. 天然的备份策略

Git 仓库本身就是分布式的。你的数据同时存在于：

- 本地开发机
- GitHub/GitLab 远端
- 任何 clone 过这个仓库的机器

这比配置数据库备份策略简单得多，也可靠得多。

## 如何正确使用文件系统作为数据库

### 建立索引层

文件系统的弱点是查询能力。解决方案是在构建时生成索引：

```python
# 扫描所有 Markdown 文件，提取 frontmatter
# 生成结构化的 JSON 索引
entries = []
for md_file in glob("posts/**/*.md"):
    frontmatter = parse_frontmatter(md_file)
    entries.append({
        "uri": get_uri(md_file),
        "title": frontmatter["title"],
        "date": frontmatter["date"],
        "tags": frontmatter.get("tags", []),
    })

# 输出为静态 JSON
write_json("public/content-index.json", entries)
```

这个索引在构建时生成，运行时只需要读取 JSON 文件即可完成所有查询。

### 用文件夹表达关系

传统数据库用外键表达关系，文件系统用目录结构：

```
# 数据库思维
SELECT * FROM posts WHERE category_id = 5;

# 文件系统思维
ls posts/article/frontend/
```

目录嵌套天然表达了「属于」关系，不需要额外的关联表。

### 用 frontmatter 表达元数据

```yaml
---
title: 文章标题
date: 2026-05-03
tags: [frontend, react]
series: React 深入
order: 3
---
```

YAML frontmatter 是文件系统数据库的「字段定义」。它足够灵活（可以随时添加新字段），又足够结构化（可以被程序解析）。

## 局限性与应对

### 并发写入

文件系统不擅长处理并发写入。但对于个人档案馆这类场景，写入者通常只有一个人，这个问题不存在。

### 复杂查询

如果你需要 `SELECT * FROM posts WHERE tags CONTAINS 'react' AND date > '2026-01-01' ORDER BY date DESC LIMIT 10`，文件系统确实不方便。

解决方案：构建时预计算。把所有可能的查询结果预先生成为 JSON 文件，运行时直接读取。

### 数据量

当文件数量超过数万时，文件系统的性能会开始下降。但对于个人档案馆，即使写 20 年，也很难达到这个量级。

## 结论

文件系统作为数据库不是银弹，但在正确的场景下，它提供了一种更简单、更可靠、更持久的数据管理方式。

关键判断标准：**如果你的数据 10 年后还需要能被读取，文件系统几乎一定比任何数据库更可靠。** 因为文本文件的格式不会过时，而数据库的版本会。

> 最好的数据库是你不需要的那个。
