import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { findProductionCommentary } from '../scripts/lib/production-copy.mjs';

test('production copy catches known author-side commentary', () => {
  for (const text of [
    '原文时长',
    '以下为原文验收要求，非实测结果',
    '依据保留文本快照整理',
    '原文未单独展开',
    '原始DOC完整性未重新核验',
    '不据此推算预算',
    '本页采用占位文案',
    '项目边界仍需按原文确认',
  ]) {
    assert.notDeepEqual(findProductionCommentary(text), [], text);
  }
});

test('production copy keeps business uncertainty, attribution and disclosures', () => {
  for (const text of [
    '计划时长：1-2个月',
    'TPS大于等于1000，响应时间小于等于300 ms',
    '人月单价与投资总额待确认。',
    '拟建对接关系，供应链接口预留。',
    '概念方案，模拟数据，不代表实际部署。',
    '引用原文：项目范围尚未确认。',
    '数据来源：年度报告。数据来源追踪与变更历史。',
    '文献比较：两篇原文对方法的定义不同。',
  ]) {
    assert.deepEqual(findProductionCommentary(text), [], text);
  }
});

test('production copy detector is deterministic and never rewrites input', () => {
  const text = '依据保留文本快照\n整理，原文时长为1-2个月';
  const first = findProductionCommentary(text);
  assert.deepEqual(findProductionCommentary(text), first);
  assert.equal(text, '依据保留文本快照\n整理，原文时长为1-2个月');
  assert.equal(first.length, 2);
});

test('summary map checks the audience text, not internal source evidence', () => {
  const root = resolve('.');
  const dir = mkdtempSync('/tmp/design-production-copy-');
  cpSync(join(root, 'examples/deck-pass'), dir, { recursive: true });
  const run = () => spawnSync(process.execPath, ['scripts/validate-summary-map.mjs', dir], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(run().status, 0);
  const summaryPath = join(dir, 'summary-map.json');
  const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
  const oldText = summary.summaries[0].summary_text;
  const newText = `${oldText} 依据保留文本快照整理`;
  summary.summaries[0].summary_text = newText;
  writeFileSync(summaryPath, JSON.stringify(summary));
  const htmlPath = join(dir, 'index.html');
  const html = readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes(`>${oldText}</h1>`));
  writeFileSync(htmlPath, html.replace(`>${oldText}</h1>`, `>${newText}</h1>`));
  const result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /contains production commentary/);
  assert.doesNotMatch(result.stderr, /summary_text must match/);
});

test('summary map preserves an exact source-bound quotation', () => {
  const dir = mkdtempSync('/tmp/design-production-quote-');
  const quote = '原文措施：分阶段培训。';
  writeFileSync(join(dir, 'source.txt'), quote);
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify({
    artifact_type: 'data-report',
    source_materials: ['source.txt']
  }));
  writeFileSync(join(dir, 'index.html'), `<blockquote data-summary-id="quote">${quote}</blockquote>`);
  writeFileSync(join(dir, 'summary-map.json'), JSON.stringify({
    schema_version: 'design-summary-map/v1',
    plain_language: { status: 'manual_reviewed' },
    summaries: [{
      id: 'quote',
      summary_text: quote,
      status: 'verified',
      source_refs: ['source.txt'],
      source_quotes: [{ source_ref: 'source.txt', quote }],
      preserved_numbers: []
    }]
  }));
  const result = spawnSync(process.execPath, ['scripts/validate-summary-map.mjs', dir], {
    cwd: resolve('.'),
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr);
});
