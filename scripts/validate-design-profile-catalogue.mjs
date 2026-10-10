#!/usr/bin/env node
import { resolve } from 'node:path';
import { loadDesignProfileAssets } from './lib/design-profile.mjs';

try {
  const root = resolve(process.argv[2] || '.');
  const assets = loadDesignProfileAssets(root);
  console.log(
    `Design profile catalogue validation passed: ${assets.catalogueDigest} `
    + `(${assets.catalogue.product_presets.length} presets, `
    + `${assets.catalogue.surface_contracts.length} surfaces, `
    + `${assets.catalogue.topology_patterns.length} topologies).`
  );
} catch (error) {
  console.error(`Design profile catalogue validation failed: ${error.message}`);
  process.exit(1);
}
