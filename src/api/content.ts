/* ═══════════════════════════════════════════════════
   Content API — Quiet Archive
   动态发现类型栏，从文件系统结构推导类型和目录。
   ═══════════════════════════════════════════════════ */

import { getCollection } from 'astro:content';
import type { ContentEntry, TypeMeta, DisplayView, DirectoryListing, PageInfo } from './types';

function formatPathTitle(path: string): string {
  const segment = path.split('/').filter(Boolean).at(-1) || path;
  return segment.replace(/-/g, ' ');
}

function getParentPath(path: string): string {
  return path.split('/').slice(0, -1).join('/');
}

function normalizeDirPath(dirPath: string): string {
  return dirPath.replace(/^\/|\/$/g, '');
}

function collectDirectoryPaths(entries: ContentEntry[]): Set<string> {
  const paths = new Set<string>();

  for (const entry of entries) {
    if (entry.typeSlug === '') continue;

    const parts = entry.dirPath.split('/').filter(Boolean);

    for (let index = 1; index <= parts.length; index += 1) {
      paths.add(parts.slice(0, index).join('/'));
    }
  }

  return paths;
}

function createDirectoryFallback(path: string): ContentEntry {
  const parts = path.split('/').filter(Boolean);

  return {
    id: `${path}/README`,
    uri: `/${path}`,
    typeSlug: parts[0] || '',
    dirPath: path,
    title: formatPathTitle(path),
    date: '',
    status: 'published',
    summary: '',
    description: '',
    tags: [],
    featured: false,
    isDirectory: true,
  };
}

// ─── 类型发现 ───

/** 从所有 posts 动态发现类型栏（posts 直属文件夹） */
export async function discoverTypes(): Promise<TypeMeta[]> {
  const posts = await getCollection('posts');
  const publishedPosts = posts.filter(post => post.data.status === 'published');
  const typeMap = new Map<string, TypeMeta>();

  for (const post of publishedPosts) {
    const parts = post.id.split('/');
    // 根目录文件（如 about.md）不是栏目
    if (parts.length === 1) continue;
    const typeSlug = parts[0];

    if (typeMap.has(typeSlug)) continue;

    // 寻找该类型的已发布 README
    const readme = publishedPosts.find(p => p.id.toLowerCase() === `${typeSlug}/readme`);
    const data = readme?.data as Record<string, unknown> | undefined;
    const display = data?.display as Record<string, unknown> | undefined;

    typeMap.set(typeSlug, {
      slug: typeSlug,
      title: (data?.title as string) || typeSlug.replace(/-/g, ' '),
      description: (data?.description as string) || (data?.summary as string) || '',
      displayView: (display?.defaultView as DisplayView) || 'archive',
      density: (display?.density as TypeMeta['density']) || 'medium',
      order: (data?.order as number) || 99,
      showInNav: (data?.showInNav as boolean) ?? true,
    });
  }

  return Array.from(typeMap.values()).sort((a, b) => a.order - b.order);
}

/** 获取导航中要显示的类型 */
export async function getNavTypes(): Promise<TypeMeta[]> {
  const types = await discoverTypes();
  return types.filter(t => t.showInNav && t.slug !== 'persona');
}

// ─── 内容查询 ───

function toContentEntry(entry: { id: string; data: Record<string, unknown> }): ContentEntry {
  const parts = entry.id.split('/');
  const isRootFile = parts.length === 1; // e.g. about.md
  const typeSlug = isRootFile ? '' : parts[0];
  const isReadme = parts[parts.length - 1]?.toLowerCase() === 'readme';

  let uri: string;
  if (isReadme) {
    uri = '/' + parts.slice(0, -1).join('/');
  } else {
    uri = '/' + entry.id;
  }

  // 目录路径：该文件所在的文件夹
  const dirPath = isReadme
    ? parts.slice(0, -1).join('/')
    : parts.slice(0, -1).join('/');

  const data = entry.data;

  return {
    id: entry.id,
    uri,
    typeSlug,
    dirPath,
    title: (data.title as string) || 'Untitled',
    date: (data.date as string) || '',
    status: (data.status as ContentEntry['status']) || 'draft',
    summary: (data.summary as string) || '',
    description: (data.description as string) || (data.summary as string) || '',
    tags: (data.tags as string[]) || [],
    featured: (data.featured as boolean) || false,
    cover: data.cover as string | undefined,
    updated: data.updated as string | undefined,
    series: data.series as string | undefined,
    order: data.order as number | undefined,
    isDirectory: isReadme,
  };
}

function byOrderThenDateThenTitle(a: ContentEntry, b: ContentEntry): number {
  const ao = a.order ?? 9999;
  const bo = b.order ?? 9999;
  if (ao !== bo) return ao - bo;
  const ad = a.date || '';
  const bd = b.date || '';
  if (ad !== bd) return bd.localeCompare(ad);
  return a.title.localeCompare(b.title, 'zh-CN');
}

export function paginate<T>(items: T[], page = 1, pageSize = 50): { items: T[]; pageInfo: PageInfo } {
  const safePageSize = Math.max(1, pageSize);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize),
    pageInfo: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages,
      hasPrev: safePage > 1,
      hasNext: safePage < totalPages,
    },
  };
}

/** 获取所有已发布的内容条目（不含 README 目录页，不含根目录特殊页） */
export async function getAllEntries(): Promise<ContentEntry[]> {
  const posts = await getCollection('posts');
  return posts
    .map(p => toContentEntry(p as { id: string; data: Record<string, unknown> }))
    .filter(e => e.status === 'published' && !e.isDirectory && e.typeSlug !== '')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** 获取所有已发布条目（含 README） */
export async function getAllEntriesWithDirectories(): Promise<ContentEntry[]> {
  const posts = await getCollection('posts');
  return posts
    .map(p => toContentEntry(p as { id: string; data: Record<string, unknown> }))
    .filter(e => e.status === 'published')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** 获取所有已发布目录。没有 README 的目录会从已发布子内容中自动推导。 */
export async function getAllDirectoryEntries(): Promise<ContentEntry[]> {
  const all = await getAllEntriesWithDirectories();
  const directories = new Map<string, ContentEntry>();

  for (const entry of all) {
    if (entry.isDirectory && entry.typeSlug !== '') {
      directories.set(entry.dirPath, entry);
    }
  }

  for (const path of collectDirectoryPaths(all)) {
    if (!directories.has(path)) {
      directories.set(path, createDirectoryFallback(path));
    }
  }

  return Array.from(directories.values()).sort(byOrderThenDateThenTitle);
}

/** 获取某个类型栏下的内容 */
export async function getEntriesByType(typeSlug: string): Promise<ContentEntry[]> {
  const all = await getAllEntries();
  return all.filter(e => e.typeSlug === typeSlug).sort(byOrderThenDateThenTitle);
}

/** 获取某个目录下的直接内容 */
export async function getEntriesInDir(dirPath: string): Promise<ContentEntry[]> {
  const all = await getAllEntries();
  return all.filter(e => e.dirPath === dirPath).sort(byOrderThenDateThenTitle);
}

/** 获取某个目录下的子目录 */
export async function getSubDirectories(dirPath: string): Promise<ContentEntry[]> {
  const all = await getAllDirectoryEntries();
  const normalized = normalizeDirPath(dirPath);

  return all.filter(e => {
    if (!e.isDirectory) return false;
    return e.dirPath !== normalized && getParentPath(e.dirPath) === normalized;
  }).sort(byOrderThenDateThenTitle);
}

/** 获取某个目录自身的 README 元信息 */
export async function getDirectoryMeta(dirPath: string): Promise<ContentEntry | undefined> {
  const all = await getAllEntriesWithDirectories();
  const normalized = normalizeDirPath(dirPath);
  return all.find(e => e.isDirectory && e.dirPath === normalized);
}

/** 获取目录 listing：直接子目录 + 直接内容，内容支持分页。 */
export async function getDirectoryListing(
  dirPath: string,
  options: { page?: number; pageSize?: number } = {}
): Promise<DirectoryListing> {
  const normalized = normalizeDirPath(dirPath);
  const directories = await getSubDirectories(normalized);
  const directEntries = await getEntriesInDir(normalized);
  const { items, pageInfo } = paginate(directEntries, options.page ?? 1, options.pageSize ?? 50);
  const meta = await getDirectoryMeta(normalized);

  return {
    path: normalized,
    uri: '/' + normalized,
    meta,
    directories,
    entries: items,
    pageInfo,
  };
}

/** 获取目录路径每一层的标题，优先使用该目录 README.md 中的 title。 */
export async function getDirectoryTitleMap(): Promise<Map<string, string>> {
  const all = await getAllDirectoryEntries();
  const map = new Map<string, string>();
  for (const entry of all) {
    if (entry.isDirectory) {
      map.set(entry.dirPath, entry.title);
    }
  }
  return map;
}

/** 获取最近内容 */
export async function getRecentEntries(limit = 8): Promise<ContentEntry[]> {
  const all = await getAllEntries();
  return all.slice(0, limit);
}

/** 获取精选内容 */
export async function getFeaturedEntries(): Promise<ContentEntry[]> {
  const all = await getAllEntries();
  return all.filter(e => e.featured);
}

/** 获取某标签下的内容 */
export async function getEntriesByTag(tag: string): Promise<ContentEntry[]> {
  const all = await getAllEntries();
  return all.filter(e => e.tags.includes(tag));
}

/** 通过 URI 获取单个条目 */
export async function getEntryByUri(uri: string): Promise<ContentEntry | undefined> {
  const all = await getAllEntriesWithDirectories();
  return all.find(e => e.uri === uri);
}
