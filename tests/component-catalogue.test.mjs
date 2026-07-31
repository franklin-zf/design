import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import {
  resolveComponentSelection,
  validateComponentCatalogue
} from '../scripts/lib/component-catalogue.mjs';

const root = resolve('.');
const catalogue = JSON.parse(
  readFileSync(join(root, 'assets/components/registry.json'), 'utf8')
);
const schema = JSON.parse(
  readFileSync(join(root, 'schemas/component-catalogue.schema.json'), 'utf8')
);

function mutatedComponent(componentId, mutate) {
  const value = structuredClone(catalogue);
  const component = value.components.find((item) => item.id === componentId);
  mutate(component, value);
  return value;
}

test('shipped catalogue is valid and contains no third-party source code', () => {
  assert.deepEqual(validateComponentCatalogue(catalogue, schema), []);
  assert.equal(
    catalogue.components.some((component) => (
      component.ownership === 'third_party_reference'
      && component.implementation.source_code_included
    )),
    false
  );
});

test('admission fails closed for provenance, licence, dependencies, fallback, a11y, and performance', () => {
  const id = 'design-owned-static-focus-field';
  const cases = [
    ['hash', (component) => {
      component.provenance.source_sha256 = '0'.repeat(64);
    }],
    ['license', (component) => {
      component.license.status = 'unknown';
    }],
    ['dependency', (component) => {
      component.implementation.runtime_dependencies = ['motion'];
    }],
    ['remote', (component) => {
      component.implementation.remote_origins = ['https://example.com'];
    }],
    ['fallback', (component) => {
      component.fallback.static_html.status = 'unknown';
    }],
    ['accessibility', (component) => {
      component.accessibility.contrast = 'unknown';
    }],
    ['performance', (component) => {
      component.performance.status = 'unknown';
    }]
  ];
  for (const [label, mutate] of cases) {
    const errors = validateComponentCatalogue(
      mutatedComponent(id, mutate),
      schema
    );
    assert.ok(errors.length, label);
  }
});

test('duplicate ids and third-party source inclusion are rejected', () => {
  const duplicate = structuredClone(catalogue);
  duplicate.components.push(structuredClone(duplicate.components[0]));
  assert.match(
    validateComponentCatalogue(duplicate, schema).join(' '),
    /duplicate component id/
  );

  const thirdPartySource = mutatedComponent(
    'uiverse-item-adaptation-boundary',
    (component) => {
      component.implementation.source_code_included = true;
    }
  );
  assert.match(
    validateComponentCatalogue(thirdPartySource, schema).join(' '),
    /third-party source code is forbidden/
  );
});

test('resolution admits only compatible shared-skill html_css records', () => {
  const resolved = resolveComponentSelection({
    catalogue,
    componentIds: ['design-owned-static-focus-field'],
    templateId: 'poster-type-led',
    artifactType: 'poster'
  });
  assert.equal(resolved.selected[0].technical_class, 'html_css');
  assert.ok(
    resolved.selected[0].required_gate_ids.includes(
      'validate-component-usage'
    )
  );

  for (const componentId of [
    'react-bits-motion-grammar-reference',
    'project-local-native-react-boundary'
  ]) {
    assert.throws(
      () => resolveComponentSelection({
        catalogue,
        componentIds: [componentId],
        templateId: 'swiss-evidence-deck',
        artifactType: 'html-deck'
      }),
      /not admitted/
    );
  }
  assert.throws(
    () => resolveComponentSelection({
      catalogue,
      componentIds: ['design-owned-static-focus-field'],
      templateId: 'operational-dashboard',
      artifactType: 'dashboard'
    }),
    /incompatible/
  );
});
