# @design/icon-hub-mcp

> **IconHub MCP Server**: Multi-source Vector Icon Retrieval, Normalization, and Model Context Protocol Server for Modern Design & Engineering Workflows.

---

## 🌟 Key Features

1. **Dual-source retrieval**: High-speed curated vector registry (Lucide / Tabler style) + iconfont.cn integration;
2. **Chinese & English Natural Query**: Search by Chinese semantics (如 "看板", "风控", "用户", "报表") or English terms;
3. **Automated SVG Normalization**: Standardizes `viewBox="0 0 24 24"`, `stroke-width`, `currentColor` inheritance, and accessibility attributes;
4. **Standard MCP Protocol**: Implements JSON-RPC over stdio for seamless integration with AIME, Claude, Cursor, and Windsurf;
5. **Standalone CLI**: Direct command-line utility for search and batch retrieval.

---

## 🛠️ MCP Tools Interface

### 1. `search_icons`
Search vector icons by Chinese or English natural language keywords.
* **Input**: `{ query: string, limit?: number }`
* **Output**: JSON string containing icon candidates and inline SVG previews.

### 2. `get_icon_svg`
Get normalized inline SVG markup for a specific icon.
* **Input**: `{ name_or_id: string, size?: number, stroke_width?: number, color?: string, fill?: string }`
* **Output**: Standard `<svg>...</svg>` markup.

### 3. `batch_fetch_icons`
Batch retrieve a map of `query -> SVG` for fast page assembly.
* **Input**: `{ queries: string[], size?: number, stroke_width?: number }`
* **Output**: JSON string containing map of all resolved SVGs.

---

## 🚀 CLI Usage

```bash
# Start MCP server
node bin/icon-hub.mjs serve

# Search icons by keyword
node bin/icon-hub.mjs search "看板" 5

# Get normalized SVG
node bin/icon-hub.mjs get "settings" 24

# Batch fetch icons
node bin/icon-hub.mjs batch "dashboard,search,user,trend"
```
