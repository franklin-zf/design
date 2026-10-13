#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { executeMcpTool } from '../packages/icon-hub-mcp/src/index.mjs';

const modulePath = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(modulePath), '..');

const [,, cmd, ...args] = process.argv;

async function main() {
  if (!cmd || cmd === 'help') {
    console.log(`Design IconHub Bridge CLI
Usage:
  node scripts/icon-hub.mjs search <query> [limit]
  node scripts/icon-hub.mjs get <name_or_id> [size]
  node scripts/icon-hub.mjs batch <q1,q2,q3>
`);
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

  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
}

main().catch(err => {
  console.error(`[scripts/icon-hub] Error: ${err.message}`);
  process.exit(1);
});
