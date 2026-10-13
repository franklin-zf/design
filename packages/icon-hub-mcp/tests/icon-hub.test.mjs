import test from 'node:test';
import assert from 'node:assert/strict';
import { executeMcpTool, MCP_TOOLS_MANIFEST } from '../src/index.mjs';
import { cleanAndNormalizeSvg } from '../src/sources/svg-cleaner.mjs';

test('MCP manifest lists 3 standard tools', () => {
  assert.equal(MCP_TOOLS_MANIFEST.length, 3);
  const toolNames = MCP_TOOLS_MANIFEST.map(t => t.name);
  assert.ok(toolNames.includes('search_icons'));
  assert.ok(toolNames.includes('get_icon_svg'));
  assert.ok(toolNames.includes('batch_fetch_icons'));
});

test('search_icons returns matches for Chinese queries', async () => {
  const res = await executeMcpTool('search_icons', { query: '仪表盘', limit: 3 });
  assert.equal(res.isError, false);
  const data = JSON.parse(res.content[0].text);
  assert.ok(data.count > 0);
  assert.ok(data.icons.some(i => i.name === 'layout-dashboard'));
  assert.ok(data.icons[0].preview_svg.includes('<svg'));
});

test('get_icon_svg produces normalized SVG', async () => {
  const res = await executeMcpTool('get_icon_svg', {
    name_or_id: 'search',
    size: 20,
    stroke_width: 2,
    color: '#4f46e5'
  });
  assert.equal(res.isError, false);
  const svg = res.content[0].text;
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('width="20"'));
  assert.ok(svg.includes('height="20"'));
  assert.ok(svg.includes('stroke="#4f46e5"'));
  assert.ok(svg.includes('stroke-width="2"'));
  assert.ok(svg.includes('viewBox="0 0 24 24"'));
});

test('batch_fetch_icons retrieves multiple SVGs concurrently', async () => {
  const res = await executeMcpTool('batch_fetch_icons', {
    queries: ['dashboard', '用户', '设置', '趋势']
  });
  assert.equal(res.isError, false);
  const data = JSON.parse(res.content[0].text);
  assert.equal(data.total, 4);
  assert.ok(data.icons['dashboard'].includes('<svg'));
  assert.ok(data.icons['用户'].includes('<svg'));
  assert.ok(data.icons['设置'].includes('<svg'));
  assert.ok(data.icons['趋势'].includes('<svg'));
});

test('cleanAndNormalizeSvg sanitizes raw markup', () => {
  const raw = `<?xml version="1.0"?><svg width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>`;
  const cleaned = cleanAndNormalizeSvg(raw, { size: 32, strokeWidth: 1.5 });
  assert.ok(!cleaned.includes('<?xml'));
  assert.ok(cleaned.includes('width="32"'));
  assert.ok(cleaned.includes('viewBox="0 0 100 100"'));
  assert.ok(cleaned.includes('stroke-width="1.5"'));
});

