import { handleSearchIcons } from './tools/search-icons.mjs';
import { handleGetIconSvg } from './tools/get-icon-svg.mjs';
import { handleBatchFetchIcons } from './tools/batch-fetch.mjs';

// *
  // Standard Model Context Protocol (MCP) Server for IconHub.
  // /
export const MCP_TOOLS_MANIFEST = [
  {
    name: 'search_icons',
    description: 'Search vector icons by Chinese or English natural language keywords (e.g. "看板", "用户", "trend", "audit"). Returns matched metadata and inline SVG previews.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query in Chinese or English (e.g. "数据看板", "设置", "search", "security")'
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of icon candidates to return (default: 6)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_icon_svg',
    description: 'Get normalized, standard production-ready inline SVG string by icon name, id, or semantic tag.',
    inputSchema: {
      type: 'object',
      properties: {
        name_or_id: {
          type: 'string',
          description: 'Icon name or keyword (e.g. "layout-dashboard", "search", "bar-chart-3", "用户")'
        },
        size: {
          type: 'integer',
          description: 'SVG width and height in pixels (default: 24)'
        },
        stroke_width: {
          type: 'number',
          description: 'SVG stroke line width (default: 1.5)'
        },
        color: {
          type: 'string',
          description: 'SVG stroke color (default: "currentColor")'
        },
        fill: {
          type: 'string',
          description: 'SVG fill color (default: "none")'
        }
      },
      required: ['name_or_id']
    }
  },
  {
    name: 'batch_fetch_icons',
    description: 'Batch retrieve normalized inline SVGs for a list of semantic queries in one call.',
    inputSchema: {
      type: 'object',
      properties: {
        queries: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of icon names or keywords needed by the page layout (e.g. ["dashboard", "user", "settings", "chart"])'
        },
        size: {
          type: 'integer',
          description: 'SVG size in pixels (default: 24)'
        },
        stroke_width: {
          type: 'number',
          description: 'SVG stroke width (default: 1.5)'
        }
      },
      required: ['queries']
    }
  }
];

export async function executeMcpTool(name, args) {
  switch (name) {
    case 'search_icons':
      return await handleSearchIcons(args);
    case 'get_icon_svg':
      return await handleGetIconSvg(args);
    case 'batch_fetch_icons':
      return await handleBatchFetchIcons(args);
    default:
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown tool: "${name}"` }]
      };
  }
}

// *
  // Standard stdio JSON-RPC loop for Model Context Protocol.
  // /
export async function startMcpServer() {
  process.stdin.setEncoding('utf8');

  let buffer = '';
  process.stdin.on('data', async (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const req = JSON.parse(line);
        const res = await handleJsonRpcRequest(req);
        if (res) {
          process.stdout.write(JSON.stringify(res) + '\n');
        }
      } catch (err) {
        process.stderr.write(`[icon-hub-mcp] Error parsing request: ${err.message}\n`);
      }
    }
  });
}

async function handleJsonRpcRequest(req) {
  const { id, method, params } = req;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'icon-hub-mcp', version: '1.0.0' }
      }
    };
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { tools: MCP_TOOLS_MANIFEST }
    };
  }

  if (method === 'tools/call') {
    const toolName = params?.name;
    const toolArgs = params?.arguments || {};
    const executionResult = await executeMcpTool(toolName, toolArgs);

    return {
      jsonrpc: '2.0',
      id,
      result: executionResult
    };
  }

  if (method === 'notifications/initialized' || method === 'ping') {
    return id !== undefined ? { jsonrpc: '2.0', id, result: {} } : null;
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` }
  };
}

if (process.argv[1] && process.argv[1].endsWith('index.mjs')) {
  startMcpServer();
}

