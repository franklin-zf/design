// *
  // Normalizes raw SVG markup into standard, accessible, responsive inline SVG.
  // /
export function cleanAndNormalizeSvg(rawSvg, options = {}) {
  const {
    size = 24,
    strokeWidth = 1.5,
    color = 'currentColor',
    fill = 'none',
    className = 'icon-hub-svg',
    title = '',
    ariaHidden = true,
  } = options;

  if (!rawSvg || typeof rawSvg !== 'string') {
    throw new Error('cleanAndNormalizeSvg: rawSvg must be a non-empty string');
  }

  let cleaned = rawSvg
    .replace(/<\?xml.*?\?>/gi, '')
    .replace(/<!DOCTYPE.*?>/gi, '')
    .replace(/<!--.*?-->/gis, '')
    .trim();

  // Extract inner SVG content if full <svg> tag is provided
  const svgTagMatch = cleaned.match(/<svg\b([^>]*)>(.*?)<\/svg>/is);
  let innerContent = cleaned;
  let existingViewBox = '0 0 24 24';

  if (svgTagMatch) {
    const rawAttrs = svgTagMatch[1];
    innerContent = svgTagMatch[2].trim();

    const viewBoxMatch = rawAttrs.match(/viewBox=["']([^"']+)["']/i);
    if (viewBoxMatch) {
      existingViewBox = viewBoxMatch[1];
    }
  }

  // Remove hardcoded width, height, stroke, fill in inner content to ensure currentColor inheritance
  innerContent = innerContent
    .replace(/\s(width|height)=["'][^"']*["']/gi, '')
    .replace(/\sclass=["'][^"']*["']/gi, '');

  // Remove any pre-existing title tags in inner content if title option is provided
  if (title) {
    innerContent = innerContent.replace(/<title>.*?<\/title>/gis, '');
  }

  const titleTag = title ? `<title>${escapeXml(title)}</title>` : '';
  const ariaAttr = ariaHidden && !title ? 'aria-hidden="true"' : 'role="img"';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${existingViewBox}" fill="${fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" ${ariaAttr}>${titleTag}${innerContent}</svg>`;
}

function escapeXml(unsafe) {
  return String(unsafe).replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

