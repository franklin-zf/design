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
