import { searchIconfont } from '../sources/iconfont.mjs';

// *
  // MCP Tool Handler: search_icons
  // /
export async function handleSearchIcons(args = {}) {
  const { query, limit = 6 } = args;

  if (!query || typeof query !== 'string') {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "query" parameter is required and must be a string.' }]
    };
  }

  const results = await searchIconfont(query, { limit });

  return {
    isError: false,
    content: [{
      type: 'text',
      text: JSON.stringify({
        query,
        count: results.length,
        icons: results.map(r => ({
          id: r.id,
          name: r.name,
          source: r.source,
          category: r.category,
          tags: r.tags,
          preview_svg: r.svg
        }))
      }, null, 2)
    }]
  };
}

