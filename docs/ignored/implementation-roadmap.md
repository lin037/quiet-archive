# 实现路线图

## 阶段 1：项目基础

在当前仓库中创建 Astro 应用。

交付物：

- Astro 项目初始化。
- 基础布局壳。
- 全局设计 token。
- 黑白学术档案馆视觉基底。
- 绿色点睛色 token。
- Markdown 和 MDX 支持。
- `posts/`、`assets/`、`scripts/` 目录。

验收标准：

- 站点可以本地启动。
- 示例 `.md` 和 `.mdx` 内容可以成功渲染。
- 初始视觉已经像安静的个人档案馆，而不是默认模板。

## 阶段 2：内容协议

实现 `docs/content-system-spec.md` 中定义的文件协议。

交付物：

- `scripts/check.py`。
- frontmatter schema 校验。
- URI 生成。
- `README.md` 目录页处理。
- 每种 type 的示例内容。

验收标准：

- 非法 type 目录会校验失败。
- 非法文件名会校验失败。
- draft 内容不会进入生产索引。
- `README.md` 可以生成目录路由。

## 阶段 3：索引与路由

生成结构化内容索引。

交付物：

- `scripts/build_index.py`。
- `public/content-index.json`。
- `public/route-map.json`。
- `public/archive-tree.json`。
- Astro 动态路由，支持内容条目和 `README.md` 页面。

验收标准：

- 所有 published 内容都可路由。
- 归档页可以从生成索引渲染。
- 类型页使用对应 type 的默认展示。

## 阶段 4：页面体验

建设核心页面。页面职责、模块边界和设计禁区以 `docs/page-design-spec.md` 为准。

交付物：

- 首页。
- 混合归档页。
- 类型页。
- 目录页。
- 内容详情页。
- 作品页。
- 专栏导航。
- 关于页。
- 基于生成索引的初始统计页。
- 页面模块遵守 `docs/page-design-spec.md`。

验收标准：

- 首页能展示个人身份、最近写作、作品、活跃专栏和档案脉搏。
- 不同内容类型有不同展示方式，但属于同一视觉系统。
- 内容没有封面图时，页面仍然精致完整。
- 页面没有营销落地页、过度卡片化和强装饰背景倾向。

## 阶段 5：搜索

实现支持中文的快速模糊全文搜索。

交付物：

- 构建脚本中的中文分词。
- `public/search-index.json`。
- 搜索 UI。
- MiniSearch 或同类前端索引。
- 字段权重排序。

验收标准：

- 中文标题、摘要、标签、标题层级和正文可搜索。
- 输入时搜索响应快。
- 搜索结果显示类型、标题、摘要和 URI。
- 不需要服务端数据库。

## 阶段 6：分享图

生成论文封面感分享图。

交付物：

- `scripts/generate_share.py`。
- HTML 或图片模板。
- 输出到 `assets/share/`。
- `share.image` frontmatter 校验。
- Open Graph 元信息接入。

验收标准：

- published 内容可以生成适合微信传播的论文封面感图片。
- 生成图使用黑白基底和少量绿色点睛。
- 缺少分享图时可以优雅 fallback。

## 阶段 7：发布流程

串联本地和服务器工作流。

交付物：

- `scripts/publish.py` 本地辅助脚本。
- 服务器部署 hook 方案。
- Git pull 与 Astro build 流程。
- 未来统计用 SQLite 预留方案。

验收标准：

- 本地可以完成校验、索引、分享图、提交和推送。
- 服务器可以拉取并重新构建。
- 核心档案不依赖 SQLite。

## 暂缓工作

等档案基础稳定后再做：

- 真实页面浏览计数。
- SQLite 统计页。
- AI embedding 缓存。
- 基于个人知识库的 AI Agent。
- 评论系统。
- CMS 后台。
- 高级推荐。

## 当前已锁定决策

- 框架：Astro。
- 内容和站点代码放在同一个私有仓库。
- Git 是内容后端。
- Markdown 和 MDX 都支持。
- `.md` 默认使用，`.mdx` 用于需要组件的内容。
- 路径只允许小写英文字母、数字和短横杆。
- 文件路径生成 URI。
- `README.md` 是目录页或专题页。
- `status` 控制 draft、published、archived 行为。
- 本地资源优先，外链图片允许但 warning。
- 分享图在本地或内容更新阶段生成。
- 搜索需要中文分词和快速模糊匹配。
- 真实访问统计可以暂缓。
