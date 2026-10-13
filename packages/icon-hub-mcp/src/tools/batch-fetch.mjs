import { handleGetIconSvg } from './get-icon-svg.mjs';

// *
  // MCP Tool Handler: batch_fetch_icons
  // /
export async function handleBatchFetchIcons(args = {}) {
  const {
    queries = [],
    size = 24,
    stroke_width = 1.5,
    color = 'currentColor'
  } = args;

  if (!Array.isArray(queries) || queries.length === 0) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "queries" must be a non-empty array of strings.' }]
    };
  }

  const iconMap = {};
  for (const q of queries) {
    const key = String(q).trim();
    if (key) {
      const res = await handleGetIconSvg({
        name_or_id: key,
        size,
        stroke_width,
        color
      });
      if (!res.isError && res.content && res.content[0]) {
        iconMap[key] = res.content[0].text;
      }
    }
  }

  return {
    isError: false,
    content: [{
      type: 'text',
      text: JSON.stringify({
        total: Object.keys(iconMap).length,
        icons: iconMap
      }, null, 2)
    }]
  };
}

