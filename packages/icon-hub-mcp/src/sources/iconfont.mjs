import { cleanAndNormalizeSvg } from './svg-cleaner.mjs';
import { VECTOR_ICON_REGISTRY } from './lucide-dataset.mjs';

// *
  // Iconfont.cn & Registry search integration.
  // /
export async function searchIconfont(query, options = {}) {
  const { limit = 5, timeoutMs = 2500 } = options;
  const normalizedQuery = (query || '').trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  // 1. First, search local offline high-priority vector registry
  const localMatches = [];
  for (const [key, item] of Object.entries(VECTOR_ICON_REGISTRY)) {
    const isTagMatched = item.tags.some(tag => tag.toLowerCase().includes(normalizedQuery) || normalizedQuery.includes(tag.toLowerCase()));
    const isNameMatched = item.name.toLowerCase().includes(normalizedQuery);
    if (isTagMatched || isNameMatched) {
      localMatches.push({
        id: item.name,
        name: item.name,
        source: 'vector-registry',
        category: item.category,
        tags: item.tags,
        svg: cleanAndNormalizeSvg(item.svgBody, { title: item.name })
      });
    }
  }

  if (localMatches.length >= limit) {
    return localMatches.slice(0, limit);
  }

  // 2. Query iconfont.cn API with fallback
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const encoded = encodeURIComponent(normalizedQuery);
    const apiUrl = `https://www.iconfont.cn/api/icon/search.json?q=${encoded}&page=1&pageSize=${limit}&type=json`;

    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IconHubMCP/1.0; +https://github.com/aime)',
        'Referer': 'https://www.iconfont.cn/'
      }
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data && data.data && Array.isArray(data.data.icons)) {
        for (const remoteIcon of data.data.icons) {
          if (remoteIcon.show_svg) {
            localMatches.push({
              id: `iconfont-${remoteIcon.id}`,
              name: remoteIcon.name || remoteIcon.font_class,
              source: 'iconfont.cn',
              category: 'iconfont',
              tags: [normalizedQuery, remoteIcon.name],
              svg: cleanAndNormalizeSvg(remoteIcon.show_svg, { title: remoteIcon.name })
            });
          }
        }
      }
    }
  } catch (err) {
    // Graceful offline fallback
  }

  // Deduplicate by name/id
  const seen = new Set();
  const deduped = [];
  for (const item of localMatches) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      deduped.push(item);
    }
  }

  return deduped.slice(0, limit);
}

