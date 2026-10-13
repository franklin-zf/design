import { VECTOR_ICON_REGISTRY } from '../sources/lucide-dataset.mjs';
import { cleanAndNormalizeSvg } from '../sources/svg-cleaner.mjs';
import { searchIconfont } from '../sources/iconfont.mjs';

// *
  // MCP Tool Handler: get_icon_svg
  // /
export async function handleGetIconSvg(args = {}) {
  const {
    name_or_id,
    size = 24,
    stroke_width = 1.5,
    color = 'currentColor',
    fill = 'none',
    class_name = 'icon-hub-svg',
    aria_hidden = true
  } = args;

  if (!name_or_id || typeof name_or_id !== 'string') {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "name_or_id" parameter is required.' }]
    };
  }

  const lookupKey = name_or_id.toLowerCase().trim();

  // 1. Check local registry
  if (VECTOR_ICON_REGISTRY[lookupKey]) {
    const item = VECTOR_ICON_REGISTRY[lookupKey];
    const svg = cleanAndNormalizeSvg(item.svgBody, {
      size,
      strokeWidth: stroke_width,
      color,
      fill,
      className: class_name,
      title: item.name,
      ariaHidden: aria_hidden
    });

    return {
      isError: false,
      content: [{ type: 'text', text: svg }]
    };
  }

  // 2. Query search fallback
  const results = await searchIconfont(lookupKey, { limit: 1 });
  if (results.length > 0) {
    const item = results[0];
    const svg = cleanAndNormalizeSvg(item.svg, {
      size,
      strokeWidth: stroke_width,
      color,
      fill,
      className: class_name,
      title: item.name,
      ariaHidden: aria_hidden
    });

    return {
      isError: false,
      content: [{ type: 'text', text: svg }]
    };
  }

  // 3. Fallback generic spark / dot icon
  const genericSvg = cleanAndNormalizeSvg(
    `<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>`,
    { size, strokeWidth: stroke_width, color, fill, className: class_name }
  );

  return {
    isError: false,
    content: [{ type: 'text', text: genericSvg }]
  };
}

