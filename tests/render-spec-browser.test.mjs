import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { computeArtifactDigest } from '../scripts/validate-evidence-contract.mjs';

const sha = (value) => createHash('sha256').update(value).digest('hex');
const stable = (value) => {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};

function runNode(args) {
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: resolve('.'),
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', reject);
    child.once('close', (status, signal) => {
      resolveResult({ status, signal, stdout, stderr });
    });
  });
}

function listen(server) {
  return new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolveListen(server.address()));
  });
}

test('Chromium executes every declared viewport, state, assertion, and segment with hashed screenshots', () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'design-render-spec-browser-'));
  const artifact = join(temporaryRoot, 'artifact');
  try {
    cpSync(resolve('examples/data-report-pass'), artifact, { recursive: true });
    const planDigest = 'b'.repeat(64);
    const payload = {
      schema_version: 'design-render-spec/v2',
      viewports: [1440, 390, 320],
      segments: [
        { id: 'primary', kind: 'selector', selector: '[data-design-id="primary-finding"]' },
        { id: 'caveats', kind: 'selector', selector: '[data-design-id="caveats"]' }
      ],
      states: [
        { id: 'default', setup: [], assertions: [{ kind: 'visible', selector: 'main' }] },
        { id: 'source-visible', setup: [], assertions: [{ kind: 'text', selector: '[data-design-id="report-context"]', expected: 'Source' }] }
      ],
      remote_policy: { mode: 'deny_all', allowed_origins: [] }
    };
    const spec = {
      ...payload,
      resolved_plan_digest: planDigest,
      artifact_digest: computeArtifactDigest(artifact),
      spec_digest: sha(stable(payload))
    };
    const specPath = join(temporaryRoot, 'render-spec.json');
    const profilePath = join(artifact, 'render-profile.json');
    writeFileSync(specPath, `${JSON.stringify(spec, null, 2)}\n`);
    const result = spawnSync(process.execPath, [
      resolve('scripts/render-smoke.mjs'), join(artifact, 'index.html'),
      '--viewports=desktop,mobile,small-phone', '--strict-layout', `--spec=${specPath}`,
      `--profile-out=${profilePath}`, `--artifact-digest=${spec.artifact_digest}`, `--plan-digest=${planDigest}`
    ], { encoding: 'utf8', timeout: 120000 });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
    assert.deepEqual(profile.profiles.map((item) => item.width), [1440, 390, 320]);
    for (const viewport of profile.profiles) {
      assert.equal(viewport.strict_success, true);
      assert.equal(viewport.reduced_motion, 'passed');
      assert.equal(viewport.reduced_motion_evidence.preference_matches, true);
      assert.equal(viewport.reduced_motion_evidence.static_text_equivalent, true);
      assert.equal(viewport.reduced_motion_evidence.active_animation_count, 0);
      assert.match(viewport.reduced_motion_evidence.visible_text_sha256, /^[a-f0-9]{64}$/);
      assert.deepEqual(viewport.states.map((state) => state.id), ['default', 'source-visible']);
      for (const state of viewport.states) {
        assert.ok(state.assertions.every((assertion) => assertion.passed));
        assert.match(state.visible_text_sha256, /^[a-f0-9]{64}$/);
        assert.deepEqual(state.segments.map((segment) => segment.id), ['primary', 'caveats']);
        for (const segment of state.segments) {
          const screenshot = resolve(artifact, segment.screenshot_ref);
          assert.equal(existsSync(screenshot) && statSync(screenshot).isFile(), true);
          assert.equal(sha(readFileSync(screenshot)), segment.screenshot_sha256);
        }
      }
    }
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('operational relation, locale, and icon assertions emit measured evidence', () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'design-operational-render-'));
  const artifact = resolve('design-systems/operational-product');
  try {
    const specPath = join(artifact, 'preview/render-spec.json');
    const spec = JSON.parse(readFileSync(specPath, 'utf8'));
    const profilePath = join(temporaryRoot, 'render-profile.json');
    const result = spawnSync(process.execPath, [
      resolve('scripts/render-smoke.mjs'),
      join(artifact, 'components.html'),
      join(temporaryRoot, 'captures'),
      '--viewports=desktop,mobile,small-phone',
      '--strict-layout',
      `--spec=${specPath}`,
      `--profile-out=${profilePath}`,
      `--artifact-digest=${spec.artifact_digest}`,
      `--plan-digest=${spec.resolved_plan_digest}`
    ], { encoding: 'utf8', timeout: 120000 });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
    for (const viewport of profile.profiles) {
      assert.deepEqual(
        viewport.states.map((state) => state.id),
        ['default', 'dense', 'error']
      );
      assert.deepEqual(viewport.remote_requests, []);
      const defaultState = viewport.states[0];
      const relation = defaultState.assertions.find(
        (assertion) => assertion.kind === 'relation'
      );
      const locale = defaultState.assertions.find(
        (assertion) => assertion.kind === 'locale'
      );
      const icon = defaultState.assertions.find(
        (assertion) => assertion.kind === 'icon'
      );
      assert.ok(relation.actual.delta_px_max <= relation.tolerance_px);
      assert.equal(locale.actual.violations.length, 0);
      assert.ok(locale.actual.checked_text_nodes > 0);
      assert.equal(icon.actual.icon_count, 9);
      assert.deepEqual(icon.actual.families, ['ant-design-official']);
      assert.equal(icon.actual.violations.length, 0);
      assert.match(icon.actual.asset_sha256, /^[a-f0-9]{64}$/);
      assert.equal(
        icon.actual.provenance_id,
        'ant-design-official-operational-icons'
      );
    }
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('operational assertions reject misalignment, English leakage, and icon drift', () => {
  const cases = [
    {
      name: 'relation',
      mutate(html) {
        return html.replace(
          '<main class="ds-workbench">',
          '<main class="ds-workbench" style="transform:translateX(3px)">'
        );
      },
      assertion: {
        kind: 'relation',
        selector: '.ds-workbench',
        target_selector: 'body',
        relation: 'left-edge',
        tolerance_px: 2
      },
      expected: /relation actual=.*delta_px_max.*3/u
    },
    {
      name: 'locale',
      mutate(html) {
        return html.replace('</main>', '<p>Admin auth_required</p></main>');
      },
      assertion: {
        kind: 'locale',
        selector: 'body',
        locale: 'zh-CN',
        exempt_selector: '[data-locale-exempt]',
        allowed_terms: []
      },
      expected: /locale actual=.*Admin.*auth_required/u
    },
    {
      name: 'icon',
      mutate(html) {
        return html.replace(
          'data-icon-family="ant-design-official"',
          'data-icon-family="mixed-family"'
        );
      },
      assertion: {
        kind: 'icon',
        selector: '[data-icon]',
        family: 'ant-design-official',
        asset_ref: 'assets/icons.svg',
        provenance_ref: 'manifest.json',
        sizes_px: [16, 18],
        box_selector: '[data-icon-box]',
        box_px: 20,
        tolerance_px: 1,
        fallback: 'visible-label'
      },
      expected: /icon actual=.*mixed-family/u
    }
  ];
  for (const current of cases) {
    const temporaryRoot = mkdtempSync(
      join(tmpdir(), `design-operational-${current.name}-`)
    );
    const artifact = join(temporaryRoot, 'operational-product');
    try {
      cpSync(resolve('design-systems/operational-product'), artifact, {
        recursive: true
      });
      const htmlPath = join(artifact, 'components.html');
      writeFileSync(
        htmlPath,
        current.mutate(readFileSync(htmlPath, 'utf8'))
      );
      const payload = {
        schema_version: 'design-render-spec/v2',
        viewports: [1440],
        segments: [{ id: 'main', kind: 'selector', selector: 'main' }],
        states: [{
          id: 'default',
          setup: [],
          assertions: [current.assertion]
        }],
        remote_policy: { mode: 'deny_all', allowed_origins: [] }
      };
      const spec = {
        ...payload,
        resolved_plan_digest: '1'.repeat(64),
        artifact_digest: '2'.repeat(64),
        spec_digest: sha(stable(payload))
      };
      const specPath = join(temporaryRoot, 'render-spec.json');
      writeFileSync(specPath, `${JSON.stringify(spec, null, 2)}\n`);
      const result = spawnSync(process.execPath, [
        resolve('scripts/render-smoke.mjs'),
        htmlPath,
        join(temporaryRoot, 'captures'),
        '--viewports=desktop',
        `--spec=${specPath}`,
        `--artifact-digest=${spec.artifact_digest}`,
        `--plan-digest=${spec.resolved_plan_digest}`
      ], { encoding: 'utf8', timeout: 120000 });
      assert.notEqual(result.status, 0, current.name);
      assert.match(
        `${result.stdout}\n${result.stderr}`,
        current.expected,
        current.name
      );
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  }
});

test('reduced-motion evidence rejects a continuing animation', () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'design-reduced-motion-browser-'));
  const htmlPath = join(temporaryRoot, 'index.html');
  try {
    writeFileSync(htmlPath, `<!doctype html>
<html>
<head>
  <style>
    @keyframes drift { to { transform: translateX(20px); } }
    .moving { animation: drift 1s linear infinite; }
  </style>
</head>
<body><main><h1 class="moving">Meaning must remain still</h1></main></body>
</html>
`);
    const result = spawnSync(process.execPath, [
      resolve('scripts/render-smoke.mjs'),
      htmlPath,
      '--viewports=desktop'
    ], { encoding: 'utf8', timeout: 120000 });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /reduced-motion behavior failed.*active_animations=1/i);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('remote policy aborts unauthorized fetch and image requests before send', async () => {
  for (const mode of ['deny_all', 'allowlist']) {
    let received = 0;
    const server = createServer((request, response) => {
      received += 1;
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('unexpected');
    });
    const temporaryRoot = mkdtempSync(
      join(tmpdir(), `design-network-${mode}-`)
    );
    try {
      const address = await listen(server);
      const origin = `http://127.0.0.1:${address.port}`;
      const artifact = join(temporaryRoot, 'artifact');
      const htmlPath = join(artifact, 'index.html');
      cpSync(resolve('examples/data-report-pass'), artifact, { recursive: true });
      writeFileSync(htmlPath, `<!doctype html>
<html lang="en">
<head><title>Network denial</title></head>
<body>
  <main><h1>Blocked before send</h1><img src="${origin}/pixel"></main>
  <script>fetch('${origin}/leak', { method: 'POST', body: 'secret' }).catch(() => {});</script>
</body>
</html>
`);
      const planDigest = 'c'.repeat(64);
      const payload = {
        schema_version: 'design-render-spec/v2',
        viewports: [1440],
        segments: [
          { id: 'main', kind: 'selector', selector: 'main' }
        ],
        states: [
          {
            id: 'default',
            setup: [],
            assertions: [{ kind: 'visible', selector: 'main' }]
          }
        ],
        remote_policy: {
          mode,
          allowed_origins: mode === 'allowlist'
            ? ['http://127.0.0.1:1']
            : []
        }
      };
      const spec = {
        ...payload,
        resolved_plan_digest: planDigest,
        artifact_digest: computeArtifactDigest(artifact),
        spec_digest: sha(stable(payload))
      };
      const specPath = join(temporaryRoot, 'render-spec.json');
      writeFileSync(specPath, `${JSON.stringify(spec, null, 2)}\n`);
      const result = await runNode([
        resolve('scripts/render-smoke.mjs'),
        htmlPath,
        '--viewports=desktop',
        `--spec=${specPath}`,
        `--artifact-digest=${spec.artifact_digest}`,
        `--plan-digest=${planDigest}`
      ]);
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
      assert.notEqual(result.status, 0, `${mode} command must fail`);
      assert.match(
        `${result.stdout}\n${result.stderr}`,
        /unauthorized remote request blocked before send/i
      );
      assert.match(`${result.stdout}\n${result.stderr}`, /\/pixel|\/leak/);
      assert.equal(
        received,
        0,
        `${mode} must abort unauthorized requests before the server receives them`
      );
    } finally {
      await new Promise((resolveClose) => server.close(resolveClose));
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  }
});

test('allowlist permits an exact matching origin', async () => {
  const received = [];
  const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64'
  );
  const server = createServer((request, response) => {
    received.push(request.url);
    if (request.url === '/pixel') {
      response.writeHead(200, {
        'access-control-allow-origin': '*',
        'content-type': 'image/png'
      });
      response.end(pixel);
      return;
    }
    response.writeHead(200, {
      'access-control-allow-origin': '*',
      'content-type': 'text/plain'
    });
    response.end('allowed');
  });
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'design-network-allowed-'));
  try {
    const address = await listen(server);
    const origin = `http://127.0.0.1:${address.port}`;
    const artifact = join(temporaryRoot, 'artifact');
    const htmlPath = join(artifact, 'index.html');
    cpSync(resolve('examples/data-report-pass'), artifact, { recursive: true });
    writeFileSync(htmlPath, `<!doctype html>
<html lang="en">
<head><title>Allowed origin</title></head>
<body>
  <main><h1>Exact origin allowed</h1><img src="${origin}/pixel"></main>
  <script>fetch('${origin}/allowed').catch(() => {});</script>
</body>
</html>
`);
    const planDigest = 'd'.repeat(64);
    const payload = {
      schema_version: 'design-render-spec/v2',
      viewports: [1440],
      segments: [{ id: 'main', kind: 'selector', selector: 'main' }],
      states: [{
        id: 'default',
        setup: [],
        assertions: [{ kind: 'visible', selector: 'main' }]
      }],
      remote_policy: { mode: 'allowlist', allowed_origins: [origin] }
    };
    const spec = {
      ...payload,
      resolved_plan_digest: planDigest,
      artifact_digest: computeArtifactDigest(artifact),
      spec_digest: sha(stable(payload))
    };
    const specPath = join(temporaryRoot, 'render-spec.json');
    writeFileSync(specPath, `${JSON.stringify(spec, null, 2)}\n`);
    const result = await runNode([
      resolve('scripts/render-smoke.mjs'),
      htmlPath,
      '--viewports=desktop',
      `--spec=${specPath}`,
      `--artifact-digest=${spec.artifact_digest}`,
      `--plan-digest=${planDigest}`
    ]);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.ok(received.includes('/pixel'));
    assert.ok(received.includes('/allowed'));
  } finally {
    await new Promise((resolveClose) => server.close(resolveClose));
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
