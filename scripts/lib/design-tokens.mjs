// Deterministic design-token extraction. Shared by distill-spec (produce) and
// validate-design-spec (cross-check). Never invents a value: every returned token
// is read literally from a bound tokens source (design-tokens.json, tokens.css,
// or an inline :root block in an HTML file).

import { readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const HEX_RE = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

function normalizeHex(raw) {
  let h = raw.replace('#', '').toLowerCase();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return `#${h}`;
}

const ROLE_RULES = [
  [/^(?:surface|paper|background|bg|page|ground)/i, 'surface'],
  [/^(?:panel[_-]?alt|card[_-]?alt|alt[_-]?surface|recess)/i, 'panel_alt'],
  [/^(?:panel|card)/i, 'panel'],
  [/^(?:accent[_-]?2|marker|lime|secondary[_-]?accent)/i, 'accent_2'],
  [/^(?:accent|primary|brand|blue)/i, 'accent'],
  [/^(?:muted|caption|subtle|secondary[_-]?text)/i, 'muted'],
  [/^(?:line|border|hairline|divider|stroke)/i, 'line'],
  [/^(?:text|ink|foreground|fg|heading)/i, 'text'],
  [/^(?:success|ok)/i, 'success'],
  [/^(?:warning|warn)/i, 'warning'],
  [/^(?:error|danger)/i, 'error']
];

function roleForName(name) {
  const clean = name.replace(/^--/, '');
  for (const rule of ROLE_RULES) {
    if (rule[0].test(clean)) return rule[1];
  }
  return clean.replace(/-/g, '_');
}

function isHex(v) {
  return /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(String(v).trim());
}

function parseCssVars(text) {
  const vars = {};
  const re = /--([A-Za-z0-9_-]+)\s*:\s*([^;}]+)[;}]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    vars[m[1].trim()] = m[2].trim();
  }
  return vars;
}

function looksLikeFontStack(value) {
  return value.includes(',') || /serif|sans|mono|helvetica|arial|inter|menlo|system-ui/i.test(value);
}

function varsToTokens(vars) {
  const colors = {};
  const typography = {};
  const spacing = {};
  const radius = {};
  for (const entry of Object.entries(vars)) {
    const name = entry[0];
    const value = entry[1].trim();
    const role = roleForName(name);
    if (isHex(value)) {
      colors[role] = { value: normalizeHex(value), role };
      continue;
    }
    if (/font|typeface|family/i.test(name) && looksLikeFontStack(value)) {
      const key = /display|heading|title/i.test(name) ? 'display'
        : /mono|code/i.test(name) ? 'mono' : 'body';
      typography[key] = value;
      continue;
    }
    if (/radius|round/i.test(name)) {
      radius.default = value;
      continue;
    }
    if (/^(?:space|spacing|gap|pad|margin|section|page|tight|gutter)/i.test(name)
      && /^[0-9.]+(?:px|rem|em|vw|vh|%|pt)?$/.test(value)) {
      spacing[role] = value;
    }
  }
  return { colors, typography, spacing, radius };
}

function tokensFromJson(json) {
  const colors = {};
  for (const entry of Object.entries(json.colors || {})) {
    const role = entry[0];
    const val = entry[1];
    const value = typeof val === 'string' ? val : (val && val.value);
    if (typeof value === 'string' && isHex(value)) {
      colors[role] = { value: normalizeHex(value), role };
    }
  }
  const typography = {};
  for (const entry of Object.entries(json.typography || {})) {
    if (typeof entry[1] === 'string') typography[entry[0]] = entry[1];
  }
  const spacing = {};
  for (const entry of Object.entries(json.spacing || {})) {
    if (typeof entry[1] === 'string') spacing[entry[0]] = entry[1];
  }
  const radius = {};
  if (json.radius && typeof json.radius === 'object') {
    for (const entry of Object.entries(json.radius)) {
      if (typeof entry[1] === 'string') radius[entry[0]] = entry[1];
    }
  }
  return { colors, typography, spacing, radius };
}

// Locate and load the bound tokens source for an artifact or design-system dir.
export function loadDesignTokens(dir) {
  const jsonPath = join(dir, 'design-tokens.json');
  if (existsSync(jsonPath)) {
    const json = JSON.parse(readFileSync(jsonPath, 'utf8'));
    return {
      sourceType: 'json',
      tokensFile: basename(jsonPath),
      tokens: tokensFromJson(json)
    };
  }
  const cssPath = join(dir, 'tokens.css');
  if (existsSync(cssPath)) {
    const text = readFileSync(cssPath, 'utf8');
    return { sourceType: 'css', tokensFile: basename(cssPath), tokens: varsToTokens(parseCssVars(text)) };
  }
  const htmlPath = join(dir, 'index.html');
  if (existsSync(htmlPath)) {
    const text = readFileSync(htmlPath, 'utf8');
    const rootMatch = text.match(/:root\s*\{([^}]*)\}/);
    if (rootMatch) {
      const tokens = varsToTokens(parseCssVars(`:root{${rootMatch[1]}}`));
      if (Object.keys(tokens.colors).length > 0) {
        return { sourceType: 'html', tokensFile: basename(htmlPath), tokens };
      }
    }
  }
  return null;
}

// All hex colors literally present in a tokens source file (no-fabrication check).
export function hexSetInSource(absPath) {
  if (!existsSync(absPath)) return new Set();
  const text = readFileSync(absPath, 'utf8');
  const set = new Set();
  let m;
  HEX_RE.lastIndex = 0;
  while ((m = HEX_RE.exec(text)) !== null) set.add(normalizeHex(m[0]));
  return set;
}

export { normalizeHex, roleForName, parseCssVars, varsToTokens, tokensFromJson, isHex };
