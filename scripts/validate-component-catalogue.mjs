#!/usr/bin/env node
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadComponentCatalogue,
  validateComponentCatalogue
} from './lib/component-catalogue.mjs';

const modulePath = fileURLToPath(import.meta.url);
const packageRoot = resolve(dirname(modulePath), '..');

export { validateComponentCatalogue };

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  try {
    const root = resolve(process.argv[2] || packageRoot);
    const cataloguePath = join(root, 'assets/components/registry.json');
    const schemaPath = join(root, 'schemas/component-catalogue.schema.json');
    const catalogue = loadComponentCatalogue(cataloguePath, schemaPath);
    process.stdout.write(
      `Component catalogue validation passed (${catalogue.components.length} records).\n`
    );
  } catch (error) {
    console.error(`Component catalogue validation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
