/* ═══════════════════════════════════════════════════
   Navigation API — Quiet Archive
   ═══════════════════════════════════════════════════ */

import type { ContentEntry, NavContext } from './types';
import { getAllEntries, discoverTypes, getDirectoryTitleMap } from './content';

/** 生成面包屑 */
export async function getBreadcrumb(uri: string): Promise<NavContext['breadcrumb']> {
  const types = await discoverTypes();
  const dirTitles = await getDirectoryTitleMap();
  const parts = uri.split('/').filter(Boolean);
  const crumbs: NavContext['breadcrumb'] = [{ label: '首页', href: '/' }];

  let path = '';
  for (let i = 0; i < parts.length; i++) {
    path += '/' + parts[i];
    const dirPath = parts.slice(0, i + 1).join('/');
    let label = dirTitles.get(dirPath) || parts[i].replace(/-/g, ' ');

    // 第一层用类型的中文名
    if (i === 0) {
      const typeMeta = types.find(t => t.slug === parts[i]);
      if (typeMeta) label = typeMeta.title;
    }

    crumbs.push({ label, href: path });
  }

  return crumbs;
}

/** 获取同类型的上下篇 */
export async function getPrevNext(
  uri: string,
  typeSlug: string
): Promise<{ prev?: ContentEntry; next?: ContentEntry }> {
  const entries = await getAllEntries();
  const sameType = entries.filter(e => e.typeSlug === typeSlug);
  const idx = sameType.findIndex(e => e.uri === uri);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? sameType[idx - 1] : undefined,
    next: idx < sameType.length - 1 ? sameType[idx + 1] : undefined,
  };
}

/** 提取目录 */
export interface TocItem {
  depth: number;
  text: string;
  slug: string;
}

export function getTableOfContents(
  headings: { depth: number; text: string; slug: string }[]
): TocItem[] {
  return headings.filter(h => h.depth >= 2 && h.depth <= 4);
}
