import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import {
  catalogueSha256,
  resolveComponentSelection
} from '../scripts/lib/component-catalogue.mjs';
import { computeArtifactDigest } from '../scripts/validate-evidence-contract.mjs';
import { validateComponentUsage } from '../scripts/validate-component-usage.mjs';
import { v2Request } from './fixtures/execution-request.mjs';

const root = resolve('.');
const catalogue = JSON.parse(
  readFileSync(join(root, 'assets/components/registry.json'), 'utf8')
);
const templateRegistry = JSON.parse(
  readFileSync(join(root, 'assets/templates/registry.json'), 'utf8')
);

function artifactFixture({ componentIds = [], html = '<main>fixture</main>' } = {}) {
  const workspace = mkdtempSync(join(tmpdir(), 'design-component-'));
  const artifact = join(workspace, 'artifact');
  mkdirSync(artifact);
  writeFileSync(join(artifact, 'index.html'), html);
  writeFileSync(join(artifact, 'manifest.json'), `${JSON.stringify({
    schema_version: 'design-artifact/v1',
    artifact_type: 'poster',
    template_id: 'poster-type-led',
    ...(componentIds.length ? { component_refs: componentIds } : {})
  }, null, 2)}\n`);
  return { workspace, artifact };
}

function runtimeResolution(artifact, componentIds) {
  const resolution = resolveComponentSelection({
    catalogue,
    componentIds,
    templateId: 'poster-type-led',
    artifactType: 'poster'
  });
  return {
    ...resolution,
    plan_digest: 'a'.repeat(64),
    artifact_digest: computeArtifactDigest(artifact)
  };
}

test('usage binds manifest, HTML markers, catalogue records, and artifact digest', () => {
  const componentId = 'design-owned-static-focus-field';
  const fixture = artifactFixture({
    componentIds: [componentId],
    html: `<main data-design-component="${componentId}">fixture</main>`
  });
  try {
    const resolution = runtimeResolution(fixture.artifact, [componentId]);
    assert.deepEqual(validateComponentUsage({
      artifactRoot: fixture.artifact,
      catalogue,
      resolution
    }), []);

    const markerDrift = readFileSync(
      join(fixture.artifact, 'index.html'),
      'utf8'
    ).replace(componentId, 'unknown-component');
    writeFileSync(join(fixture.artifact, 'index.html'), markerDrift);
    assert.match(
      validateComponentUsage({
        artifactRoot: fixture.artifact,
        catalogue,
        resolution
      }).join(' '),
      /markers must match|artifact digest mismatch/
    );
  } finally {
    rmSync(fixture.workspace, { recursive: true, force: true });
  }
});

test('component usage blocks active remote resources but permits ordinary links', () => {
  const componentId = 'design-owned-static-focus-field';
  const fixture = artifactFixture({
    componentIds: [componentId],
    html: `<main data-design-component="${componentId}">`
      + '<a href="https://example.com/evidence">source</a>'
      + '</main>'
  });
  try {
    let resolution = runtimeResolution(fixture.artifact, [componentId]);
    assert.deepEqual(validateComponentUsage({
      artifactRoot: fixture.artifact,
      catalogue,
      resolution
    }), []);

    writeFileSync(
      join(fixture.artifact, 'index.html'),
      `<main data-design-component="${componentId}">`
        + '<script src="https://example.com/runtime.js"></script></main>'
    );
    resolution = runtimeResolution(fixture.artifact, [componentId]);
    assert.match(
      validateComponentUsage({
        artifactRoot: fixture.artifact,
        catalogue,
        resolution
      }).join(' '),
      /active remote resources/
    );
  } finally {
    rmSync(fixture.workspace, { recursive: true, force: true });
  }
});

test('no component refs remain backward compatible', () => {
  const fixture = artifactFixture();
  try {
    const resolution = {
      schema_version: 'design-component-resolution/v1',
      catalogue_digest: catalogueSha256(catalogue),
      selected: []
    };
    assert.deepEqual(validateComponentUsage({
      artifactRoot: fixture.artifact,
      catalogue,
      resolution
    }), []);
  } finally {
    rmSync(fixture.workspace, { recursive: true, force: true });
  }
});

test('compiler deterministically unions component gates into one digest', async () => {
  const { compileExecutionPlan } = await import(
    '../scripts/compile-execution-plan.mjs'
  );
  const outputSurface = {
    artifact_dir: 'artifact',
    artifact_type: 'poster',
    template_id: 'poster-type-led',
    component_refs: ['design-owned-static-focus-field']
  };
  const input = v2Request({ output_surface: outputSurface });
  const first = compileExecutionPlan(input, {
    registry: templateRegistry,
    componentCatalogue: catalogue,
    compilerVersion: 'component-test'
  });
  const second = compileExecutionPlan(input, {
    registry: templateRegistry,
    componentCatalogue: catalogue,
    compilerVersion: 'component-test'
  });
  assert.deepEqual(first, second);
  assert.deepEqual(first.artifact.component_refs, outputSurface.component_refs);
  assert.equal(first.component_resolution.selected.length, 1);
  assert.ok(
    first.automatic_gates.some((gate) => (
      gate.gate_id === 'validate-component-usage'
    ))
  );

  const legacy = compileExecutionPlan(v2Request(), {
    registry: templateRegistry,
    compilerVersion: 'component-test'
  });
  assert.equal(Object.hasOwn(legacy, 'component_resolution'), false);
  assert.equal(
    legacy.automatic_gates.some((gate) => (
      gate.gate_id === 'validate-component-usage'
    )),
    false
  );
});

test('runner uses the registered component-usage adapter only', async () => {
  const { gateInvocation, runExecutionPlan } = await import(
    '../scripts/run-execution-plan.mjs'
  );
  const componentId = 'design-owned-static-focus-field';
  const fixture = artifactFixture({
    componentIds: [componentId],
    html: `<main data-design-component="${componentId}">fixture</main>`
  });
  try {
    const { compileExecutionPlan } = await import(
      '../scripts/compile-execution-plan.mjs'
    );
    const plan = compileExecutionPlan(v2Request({
      output_surface: {
        artifact_dir: 'artifact',
        artifact_type: 'poster',
        template_id: 'poster-type-led',
        component_refs: [componentId]
      },
      constraints: {
        ...v2Request().constraints,
        workspace_root: fixture.workspace
      }
    }), {
      registry: templateRegistry,
      componentCatalogue: catalogue
    });
    const gateIds = [];
    const result = await runExecutionPlan(plan, {
      executeGate: async (gate) => {
        gateIds.push(gate.gate_id);
        return {
          status: 'passed',
          exit_code: 0,
          evidence: gate.gate_id
        };
      }
    });
    assert.equal(result.execution_status, 'complete');
    assert.ok(gateIds.includes('validate-component-usage'));

    const sidecar = join(
      fixture.artifact,
      '.design',
      'component-resolution.json'
    );
    const invocation = gateInvocation(
      { gate_id: 'validate-component-usage' },
      fixture.artifact,
      'a'.repeat(64),
      'b'.repeat(64),
      join(fixture.artifact, '.design', 'render-spec.json'),
      sidecar
    );
    assert.deepEqual(invocation.args.slice(1), [
      fixture.artifact,
      `--resolution=${sidecar}`
    ]);
  } finally {
    rmSync(fixture.workspace, { recursive: true, force: true });
  }
});
