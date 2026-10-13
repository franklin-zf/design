#!/usr/bin/env node
import { startMcpServer, executeMcpTool } from '../src/index.mjs';

const [,, cmd, ...args] = process.argv;

async function main() {
  if (!cmd || cmd === 'serve' || cmd === 'mcp') {
    await startMcpServer();
    return;
  }

  if (cmd === 'search') {
    const query = args[0] || 'dashboard';
    const limit = parseInt(args[1] || '6', 10);
    const res = await executeMcpTool('search_icons', { query, limit });
    console.log(res.content[0].text);
    return;
  }

  if (cmd === 'get') {
    const name = args[0] || 'search';
    const size = parseInt(args[1] || '24', 10);
    const res = await executeMcpTool('get_icon_svg', { name_or_id: name, size });
    console.log(res.content[0].text);
    return;
  }

  if (cmd === 'batch') {
    const queries = (args[0] || 'dashboard,search,settings').split(',').map(s => s.trim());
    const res = await executeMcpTool('batch_fetch_icons', { queries });
    console.log(res.content[0].text);
    return;
  }

  console.log(`IconHub CLI & MCP Server
Usage:
  icon-hub serve                     Start MCP Server over stdio
  icon-hub search <query> [limit]    Search icons by Chinese/English keyword
  icon-hub get <name_or_id> [size]   Get inline normalized SVG markup
  icon-hub batch <q1,q2,q3>          Batch retrieve SVGs for a list of queries
`);
}

main().catch(err => {
  console.error(`[icon-hub] Error: ${err.message}`);
  process.exit(1);
});

