/* ═══════════════════════════════════════════════════
   Type Definitions — Quiet Archive API Layer

   核心概念：
   - posts/ 下的每个直属文件夹就是一个"类型栏"
   - 类型不是硬编码的，由文件系统动态发现
   - 每个类型栏通过 README.md 定义元信息和展示方式
   - 类型栏内可以有嵌套目录（最多5层），每层可有 README.md
   - 非 README 的 .md/.mdx 文件是内容条目
   ═══════════════════════════════════════════════════ */

/** Content lifecycle status */
export type ContentStatus = 'draft' | 'published' | 'archived';

/** Display layout variants (由 README.md 中的 display.defaultView 指定) */
export type DisplayView =
  | 'archive'       // 标准列表归档
  | 'timeline'      // 时间线（短笔记、动态）
  | 'cards'         // 卡片墙（作品、实验）
  | 'book'          // 书籍章节（专栏、连载）
  | 'qa'            // 问答形式
  | 'project'       // 项目时间线
  | 'gallery';      // 图文画廊

/** 类型栏信息（从 README.md 解析） */
export interface TypeMeta {
  /** 文件夹名（URI 段） */
  slug: string;
  /** 显示名称 */
  title: string;
  /** 简短描述 */
  description: string;
  /** 默认展示方式 */
  displayView: DisplayView;
  /** 排序权重 */
  order: number;
  /** 展示密度 */
  density: 'compact' | 'medium' | 'comfortable';
  /** 是否在导航中显示 */
  showInNav: boolean;
}

/** 目录节点（从某层 README.md 解析） */
export interface DirectoryNode {
  /** 相对 posts/ 的路径 */
  path: string;
  /** URI */
  uri: string;
  /** 显示名称 */
  title: string;
  /** 描述 */
  description: string;
  /** 所属类型栏 slug */
  typeSlug: string;
  /** 子目录 */
  children: DirectoryNode[];
  /** 直接内容条目 */
  entries: ContentEntry[];
  /** 是否有正文内容 */
  hasBody: boolean;
  /** 排序权重 */
  order: number;
}

/** 一个内容条目 */
export interface ContentEntry {
  /** 文件 id（Astro content collection） */
  id: string;
  /** 最终 URI */
  uri: string;
  /** 所属类型栏 slug */
  typeSlug: string;
  /** 所在目录路径 */
  dirPath: string;
  /** 标题 */
  title: string;
  /** 日期 */
  date: string;
  /** 状态 */
  status: ContentStatus;
  /** 摘要 */
  summary: string;
  /** 标签 */
  tags: string[];
  /** 是否精选 */
  featured: boolean;
  /** 封面 */
  cover?: string;
  /** 描述（目录 README 可使用 description，内容条目可回退到 summary） */
  description?: string;
  /** 更新日期 */
  updated?: string;
  /** 系列 */
  series?: string;
  /** 排序 */
  order?: number;
  /** 是否为 README (目录页) */
  isDirectory: boolean;
}

/** 分页信息 */
export interface PageInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

/** 目录内容列表。仅返回某一目录的直接子目录和直接内容，不做递归展开。 */
export interface DirectoryListing {
  /** 目录相对 posts/ 的路径，例如 article/frontend-editor */
  path: string;
  /** 目录 URI */
  uri: string;
  /** 目录自身 README 元信息；没有 README 时为空 */
  meta?: ContentEntry;
  /** 直接子目录 */
  directories: ContentEntry[];
  /** 当前分页下的直接内容条目 */
  entries: ContentEntry[];
  /** 分页信息 */
  pageInfo: PageInfo;
}

/** 档案统计 */
export interface ArchiveStats {
  total: number;
  byType: { slug: string; title: string; count: number }[];
  recentUpdate: string;
  tags: { name: string; count: number }[];
}

/** 导航上下文 */
export interface NavContext {
  breadcrumb: { label: string; href: string }[];
  prev?: { title: string; uri: string };
  next?: { title: string; uri: string };
}
