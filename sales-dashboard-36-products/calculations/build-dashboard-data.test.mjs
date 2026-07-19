#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = JSON.parse(readFileSync(join(root, 'source/simulated-products.json'), 'utf8'));
const derived = JSON.parse(readFileSync(join(root, 'derived/dashboard-data.json'), 'utf8'));
assert.equal(source.products.length, 36);
assert.equal(derived.product_count, 36);
assert.equal(derived.products.length, 36);
assert.equal(derived.summary.contract_amount, derived.products.reduce((sum, row) => sum + row.contract_amount, 0));
assert.equal(derived.summary.cash_received, derived.products.reduce((sum, row) => sum + row.cash_received, 0));
assert.equal(derived.summary.contract_completion_rate, Number((derived.summary.contract_amount / derived.summary.contract_target * 100).toFixed(2)));
assert.equal(derived.summary.cash_completion_rate, Number((derived.summary.cash_received / derived.summary.cash_target * 100).toFixed(2)));
for (const row of derived.products) {
  assert.ok(row.contract_completion_rate >= 0);
  assert.ok(row.cash_completion_rate >= 0);
  assert.ok(row.recognized_revenue <= row.contract_amount);
}
assert.equal(derived.leaderboard.length, 12);
for (let index = 1; index < derived.leaderboard.length; index += 1) {
  assert.ok(derived.leaderboard[index - 1].contract_amount >= derived.leaderboard[index].contract_amount);
}
