#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import {
  executeMcpTool,
  startMcpServer
} from '../src/index.mjs';

const [,, command, ...args] = process.argv;

async function printTool(name, input) {
  const result = await executeMcpTool(name, input);
  const output = result.content?.[0]?.text || '';
  if (result.isError) {
    console.error(output);
    process.exitCode = 1;
    return;
  }
  console.log(output);
}

async function main() {
  if (!command || command === 'serve' || command === 'mcp') {
    await startMcpServer();
    return;
  }
  if (command === 'status' || command === 'verify') {
    await printTool('get_dribbble_library_status', {});
    return;
  }
  if (command === 'search') {
    await printTool('search_dribbble_references', {
      query: args[0] || '',
      limit: Number.parseInt(args[1], 10) || 3
    });
    return;
  }
  if (command === 'get') {
    await printTool('get_dribbble_reference', { id: args[0] || '' });
    return;
  }
  if (command === 'list') {
    await printTool('list_dribbble_references', {
      limit: Number.parseInt(args[0], 10) || 20
    });
    return;
  }
  if (command === 'binding') {
    if (!args[0]) throw new Error('binding requires an input JSON path');
    await printTool(
      'create_inspiration_binding',
      JSON.parse(readFileSync(args[0], 'utf8'))
    );
    return;
  }
  console.log(`Dribbble Hub MCP
Usage:
  dribbble-hub serve
  dribbble-hub status
  dribbble-hub search <query> [limit]
  dribbble-hub get <reference-id>
  dribbble-hub list [limit]
  dribbble-hub binding <input.json>
`);
}

main().catch((error) => {
  console.error(`[dribbble-hub] ${error.message}`);
  process.exit(1);
});
