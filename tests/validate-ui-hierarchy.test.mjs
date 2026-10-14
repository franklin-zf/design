import test from 'node:test';
import assert from 'node:assert/strict';
import { validateHtmlHierarchy } from '../scripts/validate-ui-hierarchy.mjs';

test('UI Hierarchy Validator - clean anti-bleeding switch passes', () => {
  const html = `
    <button type="button" role="switch" class="border border-black/10 bg-blue-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
      <span></span>
    </button>
  `;
  const res = validateHtmlHierarchy(html);
  assert.equal(res.valid, true);
  assert.equal(res.errors, 0);
});

test('UI Hierarchy Validator - switch lacking shadow & border fails', () => {
  const html = `
    <button type="button" role="switch" class="bg-blue-600">
      <span></span>
    </button>
  `;
  const res = validateHtmlHierarchy(html);
  assert.equal(res.valid, false);
  assert.ok(res.findings.some(f => f.rule === 'SWITCH_TACTILE_DEFENSE'));
});

test('UI Hierarchy Validator - Lorem Ipsum placeholder fails', () => {
  const html = `
    <div class="p-4">
      <p>Lorem ipsum dolor sit amet</p>
    </div>
  `;
  const res = validateHtmlHierarchy(html);
  assert.equal(res.valid, false);
  assert.ok(res.findings.some(f => f.rule === 'ANTI_AI_SLOP_PLACEHOLDER'));
});

test('UI Hierarchy Validator - emoji as solitary button icon fails', () => {
  const html = `
    <button class="btn">🔥</button>
  `;
  const res = validateHtmlHierarchy(html);
  assert.equal(res.valid, false);
  assert.ok(res.findings.some(f => f.rule === 'NO_EMOJI_FUNCTIONAL_ICON'));
});

test('UI Hierarchy Validator - dynamic flex control requires min-w-0', () => {
  const html = `
    <div class="flex gap-2">
      <select class="truncate"><option>超长动态选项</option></select>
      <button>确认</button>
    </div>
  `;
  const res = validateHtmlHierarchy(html);
  assert.equal(res.valid, false);
  assert.ok(res.findings.some(
    (finding) => finding.rule === 'FLEX_DYNAMIC_MIN_WIDTH'
  ));
});

test('UI Hierarchy Validator - min-w-0 dynamic flex control passes', () => {
  const html = `
    <div class="flex gap-2">
      <select class="min-w-0 truncate"><option>超长动态选项</option></select>
      <button>确认</button>
    </div>
  `;
  const res = validateHtmlHierarchy(html);
  assert.equal(
    res.findings.some(
      (finding) => finding.rule === 'FLEX_DYNAMIC_MIN_WIDTH'
    ),
    false
  );
});

test('UI Hierarchy Validator - narrow sidebar rejects ragged button flex', () => {
  const html = `
    <aside class="sidebar w-[320px] flex flex-wrap gap-2">
      <button>通过</button>
      <button>驳回</button>
      <button>转交</button>
    </aside>
  `;
  const res = validateHtmlHierarchy(html);
  assert.equal(res.valid, false);
  assert.ok(res.findings.some(
    (finding) => finding.rule === 'SIDEBAR_BUTTON_GRID'
  ));
});

test('UI Hierarchy Validator - narrow sidebar button grid passes', () => {
  const html = `
    <aside class="sidebar w-[320px] grid grid-cols-3 gap-2">
      <button>通过</button>
      <button>驳回</button>
      <button>转交</button>
    </aside>
  `;
  const res = validateHtmlHierarchy(html);
  assert.equal(
    res.findings.some(
      (finding) => finding.rule === 'SIDEBAR_BUTTON_GRID'
    ),
    false
  );
});
