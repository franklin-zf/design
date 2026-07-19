#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePath = join(root, 'source/simulated-products.json');
const outputPath = join(root, 'derived/dashboard-data.json');
const browserDataPath = join(root, 'derived/dashboard-data.js');
const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
const round = (value, digits = 2) => Number(value.toFixed(digits));
const sum = (rows, field) => rows.reduce((total, row) => total + row[field], 0);

const totalContractTarget = sum(source.products, 'contract_target');
const totalCashTarget = sum(source.products, 'cash_target');
const totalContract = sum(source.products, 'contract_amount');
const totalRevenue = sum(source.products, 'recognized_revenue');
const totalCash = sum(source.products, 'cash_received');
const money = (value) => Math.round(value);
const rows = source.products.map((row) => ({
  ...row,
  contract_completion_rate: round(row.contract_amount / row.contract_target * 100),
  cash_completion_rate: round(row.cash_received / row.cash_target * 100),
  revenue_recognition_rate: round(row.recognized_revenue / row.contract_amount * 100),
  cash_gap: money(row.recognized_revenue - row.cash_received)
}));

const groupBy = (field) => [...new Set(rows.map((row) => row[field]))].map((key) => {
  const group = rows.filter((row) => row[field] === key);
  const contractTarget = sum(group, 'contract_target');
  const cashTarget = sum(group, 'cash_target');
  return {
    key,
    sales_volume: sum(group, 'sales_volume'),
    contract_amount: sum(group, 'contract_amount'),
    recognized_revenue: sum(group, 'recognized_revenue'),
    cash_received: sum(group, 'cash_received'),
    contract_completion_rate: round(sum(group, 'contract_amount') / contractTarget * 100),
    cash_completion_rate: round(sum(group, 'cash_received') / cashTarget * 100)
  };
});

const derived = {
  schema_version: 'simulated-sales-derived/v1',
  simulated: true,
  source_seed: source.seed,
  period: source.period,
  currency: source.currency,
  product_count: rows.length,
  summary: {
    sales_volume: sum(rows, 'sales_volume'),
    contract_amount: totalContract,
    contract_target: totalContractTarget,
    recognized_revenue: totalRevenue,
    cash_received: totalCash,
    cash_target: totalCashTarget,
    contract_completion_rate: round(totalContract / totalContractTarget * 100),
    cash_completion_rate: round(totalCash / totalCashTarget * 100),
    revenue_recognition_rate: round(totalRevenue / totalContract * 100),
    cash_gap: money(totalRevenue - totalCash)
  },
  regions: groupBy('region'),
  categories: groupBy('category'),
  leaderboard: [...rows].sort((a, b) => b.contract_amount - a.contract_amount).slice(0, 12),
  products: rows
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(derived, null, 2)}\n`);
writeFileSync(browserDataPath, `window.__SALES_DASHBOARD_DATA__ = ${JSON.stringify(derived)};\n`);
