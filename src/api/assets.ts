const assetModules = import.meta.glob<{ default: { src: string } }>('/assets/**/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
});

function normalizeAssetPath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

/** 将内容 frontmatter 中的本地 assets 路径解析为 Astro 构建后的图片地址。 */
export function resolveAssetSrc(path?: string): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;

  const normalized = normalizeAssetPath(path);
  return assetModules[normalized]?.default?.src || normalized;
}
