import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPONENT_CATALOG, searchComponents, getComponent, getComponentSnippet } from '../src/index.mjs';

test('Component Hub - catalog contains built-in anti-bleeding components', () => {
  assert.ok(COMPONENT_CATALOG.length >= 5, 'should contain at least 5 components');
  assert.ok(COMPONENT_CATALOG.some(c => c.id === 'switch-control'));
  assert.ok(COMPONENT_CATALOG.some(c => c.id === 'evidence-diff-hero'));
});

test('Component Hub - searchComponents by Chinese tag', () => {
  const results = searchComponents('去重');
  assert.ok(results.length > 0, 'should find evidence-diff-hero component');
  assert.equal(results[0].id, 'evidence-diff-hero');
});

test('Component Hub - getComponent returns HTML snippet with shadow & inset', () => {
  const comp = getComponent('switch-control');
  assert.ok(comp, 'should find component');
  assert.ok(comp.snippet.includes('role="switch"'));
  assert.ok(comp.snippet.includes('shadow-'));
});

test('Component Hub - evidence-diff-hero snippet contains diff highlight and compact header', () => {
  const snippet = getComponentSnippet('evidence-diff-hero');
  assert.ok(snippet.includes('音画宣传事实'));
  assert.ok(snippet.includes('挂载商品真实信息'));
  assert.ok(snippet.includes('冲突矛盾'));
});
