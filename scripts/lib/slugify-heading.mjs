const reservedLayerSlugs = new Set(['app', 'compositions', 'domains', 'infra', 'ui', 'shared']);

export const slugifyHeading = (value) => {
  const slug = value
    .replace(/<[^>]+>/g, '')
    .replace(/`/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
    .replace(/-+/g, '-');

  return reservedLayerSlugs.has(slug) ? `layer-${slug}` : slug;
};
