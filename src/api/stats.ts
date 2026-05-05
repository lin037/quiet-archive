/* ═══════════════════════════════════════════════════
   Stats API — Quiet Archive
   ═══════════════════════════════════════════════════ */

import type { ArchiveStats } from './types';
import { getAllEntries, discoverTypes } from './content';

export async function getArchiveStats(): Promise<ArchiveStats> {
  const entries = await getAllEntries();
  const types = await discoverTypes();

  const byType = types
    .filter(t => t.slug !== 'persona')
    .map(t => ({
      slug: t.slug,
      title: t.title,
      count: entries.filter(e => e.typeSlug === t.slug).length,
    }))
    .filter(t => t.count > 0);

  const tagMap = new Map<string, number>();
  let recentUpdate = '';

  for (const entry of entries) {
    const d = entry.updated || entry.date;
    if (!recentUpdate || d > recentUpdate) recentUpdate = d;
    for (const tag of entry.tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }

  const tags = Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return { total: entries.length, byType, recentUpdate, tags };
}
