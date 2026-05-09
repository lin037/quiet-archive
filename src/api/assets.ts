function normalizeAssetPath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

/** 将内容 frontmatter 中的本地资源路径规范化为可直接访问的 URL。 */
export function resolveAssetSrc(path?: string): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;

  return normalizeAssetPath(path);
}
