import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMPONENT_CATALOG, searchComponents, getComponent } from '../packages/component-hub/src/index.mjs';

const __filename = fileURLToPath(import.meta.url);

// CLI Entry point
function runCli() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  if (command === 'search') {
    const query = args[1] || '';
    const results = searchComponents(query);
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  if (command === 'get') {
    const id = args[1];
    if (!id) {
      console.error('Error: missing component id');
      process.exit(1);
    }
    const comp = getComponent(id);
    if (!comp) {
      console.error(`Error: component not found: ${id}`);
      process.exit(1);
    }
    console.log(JSON.stringify(comp, null, 2));
    return;
  }

  if (command === 'list') {
    console.log(JSON.stringify(COMPONENT_CATALOG, null, 2));
    return;
  }

  console.error(`Unknown command: ${command}. Available: search, get, list`);
  process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}

export { COMPONENT_CATALOG, searchComponents, getComponent };
