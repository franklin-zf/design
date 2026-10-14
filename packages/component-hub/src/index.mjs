import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNIPPETS_DIR = path.join(__dirname, 'snippets');

// Registry of built-in headless components with anti-bleeding metrics
export const COMPONENT_CATALOG = [
  {
    id: 'switch-control',
    name: '防消融开关控件 (Anti-Bleeding Switch)',
    category: 'controls',
    target_library: 'Shadcn/ui & Radix',
    anti_bleeding_level: 'L3-Tactile-Inset',
    file: 'switch-control.html',
    tags: ['switch', 'toggle', 'control', 'button', '防消融', '开关'],
    description: '具有安全内边距、内凹轨道阴影与滑块接触投影的标准开关控件，彻底避免浅色背景消融。'
  },
  {
    id: 'card-header-actions',
    name: '防消融卡片头部与操作栏 (Card Header Actions)',
    category: 'containers',
    target_library: 'Semi Design & Shadcn',
    anti_bleeding_level: 'L3-Safe-Inset',
    file: 'card-header-actions.html',
    tags: ['card', 'header', 'actions', 'toolbar', '卡片', '操作栏', '防消融'],
    description: '卡片内嵌操作控件布局模板，严格保障 ≥12px Inset Padding、明度差与 1px 微边框。'
  },
  {
    id: 'evidence-diff-hero',
    name: '去重证据对比核心看板 (Evidence Diff Hero Container)',
    category: 'audit-review',
    target_library: 'Semi Design & Tremor',
    anti_bleeding_level: 'L3-Diff-Focus',
    file: 'evidence-diff-hero.html',
    tags: ['diff', 'audit', 'review', 'evidence', '去重', '审核', '质检', '对比看板'],
    description: '单点真理与强重心证据比对看板，合并 ASR/OCR/商品卡，高亮宣称事实与挂载事实冲突点。'
  },
  {
    id: 'kpi-metric-card',
    name: 'Bento KPI 指标数据卡片 (KPI Metric Card)',
    category: 'metrics',
    target_library: 'Tremor & Catalyst',
    anti_bleeding_level: 'L2-Elevation-Ramp',
    file: 'kpi-metric-card.html',
    tags: ['kpi', 'metric', 'bento', 'dashboard', 'tremor', '数据看板', '指标卡片'],
    description: '基于 Bento 比例的 KPI 核心指标卡，自带趋势徽标、状态指示器与等宽数字排版。'
  },
  {
    id: 'filter-toolbar',
    name: '高密业务筛选工具栏 (High-Density Filter Toolbar)',
    category: 'tables',
    target_library: 'Semi Design',
    anti_bleeding_level: 'L2-Elevation-Ramp',
    file: 'filter-toolbar.html',
    tags: ['filter', 'toolbar', 'table', 'search', '筛选', '工具栏', '中后台'],
    description: '中后台高密筛选与操作条，支持全中文检索、状态下拉与响应式换行排版。'
  },
  {
    id: 'bento-grid-2x2',
    name: '非对称 Bento Grid 栅格骨架 (Asymmetric Bento Grid)',
    category: 'layouts',
    target_library: 'Aceternity & Magic UI',
    anti_bleeding_level: 'L1-Structural',
    file: 'bento-grid-2x2.html',
    tags: ['bento', 'grid', 'layout', '2x2', '栅格', '非对称'],
    description: '2:1 比例非对称 Bento Grid 结构骨架，拉开主次焦点层级。'
  }
];

// Load html snippet for component
export function getComponentSnippet(componentId) {
  const item = COMPONENT_CATALOG.find(c => c.id === componentId);
  if (!item) return null;
  const filePath = path.join(SNIPPETS_DIR, item.file);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8').trim();
}

// Search component catalog
export function searchComponents(query, options = {}) {
  const limit = options.limit || 10;
  const q = (query || '').trim().toLowerCase();

  if (!q) {
    return COMPONENT_CATALOG.slice(0, limit);
  }

  return COMPONENT_CATALOG.filter(c => {
    return (
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q)) ||
      c.category.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  }).slice(0, limit);
}

// Get component with snippet
export function getComponent(componentId) {
  const item = COMPONENT_CATALOG.find(c => c.id === componentId);
  if (!item) return null;
  return {
    ...item,
    snippet: getComponentSnippet(componentId)
  };
}
