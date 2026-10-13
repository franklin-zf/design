import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPONENT_CATALOG, searchComponents, getComponent, getComponentSnippet } from '../src/index.mjs';

test('Component Hub - catalog contains built-in anti-bleeding components', () => {
  assert.ok(COMPONENT_CATALOG.length >= 4, 'should contain at least 4 components');
  assert.ok(COMPONENT_CATALOG.some(c => c.id === 'switch-control'));
  assert.ok(COMPONENT_CATALOG.some(c => c.id === 'card-header-actions'));
});

test('Component Hub - searchComponents by Chinese tag', () => {
  const results = searchComponents('开关');
  assert.ok(results.length > 0, 'should find switch component');
  assert.equal(results[0].id, 'switch-control');
});

test('Component Hub - getComponent returns HTML snippet with shadow & inset', () => {
  const comp = getComponent('switch-control');
  assert.ok(comp, 'should find component');
  assert.ok(comp.snippet.includes('role="switch"'));
  assert.ok(comp.snippet.includes('shadow-'));
});

test('Component Hub - card-header-actions snippet contains safe padding', () => {
  const snippet = getComponentSnippet('card-header-actions');
  assert.ok(snippet.includes('border-b'));
  assert.ok(snippet.includes('px-4 py-3'));
});
