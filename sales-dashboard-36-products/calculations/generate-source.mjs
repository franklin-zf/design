#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, 'source/simulated-products.json');
const names = [
  'Aster CRM', 'Beacon Secure', 'Cinder Data', 'Drift Commerce', 'Elm Finance', 'Fable Studio',
  'Grove Cloud', 'Harbor Desk', 'Ion Analytics', 'Juniper Pay', 'Kite Identity', 'Lumen Engage',
  'Mica Warehouse', 'Northstar AI', 'Orbit Care', 'Pillar Ops', 'Quarry Insights', 'Radian POS',
  'Sable Docs', 'Tide Workflow', 'Umber Risk', 'Vale Connect', 'Wisp Billing', 'Yarrow HR',
  'Zephyr Cloud', 'Atlas Secure', 'Bloom Data', 'Cobalt Commerce', 'Dawn Finance', 'Ember Studio',
  'Flint Cloud', 'Halo Desk', 'Iris Analytics', 'Lark Pay', 'Moss Identity', 'Nova Engage'
];
const categories = ['Cloud', 'Security', 'Data', 'Commerce', 'Finance', 'Collaboration'];
const regions = ['East', 'South', 'West', 'North'];
const round = (value, step = 1000) => Math.round(value / step) * step;

const products = names.map((name, index) => {
  const contractTarget = round(1800000 + ((index * 173000) % 4800000));
  const contractAmount = round(contractTarget * (0.72 + ((index * 13) % 24) / 100));
  const recognizedRevenue = round(contractAmount * (0.58 + ((index * 17) % 34) / 100));
  const cashReceived = round(contractAmount * (0.46 + ((index * 19) % 44) / 100));
  return {
    product_id: `P-${String(index + 1).padStart(2, '0')}`,
    product_name: name,
    category: categories[index % categories.length],
    region: regions[index % regions.length],
    sales_volume: 72 + ((index * 37) % 220),
    contract_amount: contractAmount,
    contract_target: contractTarget,
    recognized_revenue: recognizedRevenue,
    cash_received: cashReceived,
    cash_target: round(contractTarget * (0.68 + ((index * 7) % 18) / 100))
  };
});

const payload = {
  schema_version: 'simulated-sales-source/v1',
  simulated: true,
  seed: 'design-sales-36-v1',
  period: 'FY2026 Q2',
  currency: 'CNY',
  unit_notes: {
    sales_volume: 'contracts signed, count',
    money: 'CNY, whole yuan in source; UI formats in 万/百万 only for display'
  },
  products
};

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`);
