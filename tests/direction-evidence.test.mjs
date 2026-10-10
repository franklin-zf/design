import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';
import test from 'node:test';
import { validateDirectionEvidence } from '../scripts/validate-direction-evidence.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type);
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  typeBytes.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length);
  return output;
}

function png(width, height, paint) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 4);
    for (let x = 0; x < width; x += 1) {
      const color = paint(x, y);
      row[1 + x * 4] = color[0];
      row[2 + x * 4] = color[1];
      row[3 + x * 4] = color[2];
      row[4 + x * 4] = color[3] ?? 255;
    }
    rows.push(row);
  }
  const pixels = Buffer.concat(rows);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(pixels)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function truecolorTrnsPng(width, height, paint, transparentColor) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 3);
    for (let x = 0; x < width; x += 1) {
      const color = paint(x, y);
      row[1 + x * 3] = color[0];
      row[2 + x * 3] = color[1];
      row[3 + x * 3] = color[2];
    }
    rows.push(row);
  }
  const transparency = Buffer.alloc(6);
  transparency.writeUInt16BE(transparentColor[0], 0);
  transparency.writeUInt16BE(transparentColor[1], 2);
  transparency.writeUInt16BE(transparentColor[2], 4);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('tRNS', transparency),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const colors = {
  blue: [0, 71, 255],
  charcoal: [17, 17, 17],
  coral: [255, 93, 72],
  white: [248, 248, 245]
};

function dominantLayout(x, y, palette = colors) {
  if (x >= 3 && x < 34 && y >= 4 && y < 15) return palette.blue;
  if (x >= 5 && x < 27 && y >= 22 && y < 25) return palette.charcoal;
  if (x >= 5 && x < 36 && y >= 30 && y < 33) return palette.charcoal;
  if (x >= 5 && x < 20 && y >= 39 && y < 43) return palette.coral;
  return palette.white;
}

function evidenceLayout(x, y, palette = colors) {
  if (x >= 3 && x < 11 && y >= 4 && y < 46) return palette.charcoal;
  if (x >= 16 && x < 36 && y >= 5 && y < 17) return palette.blue;
  if (x >= 16 && x < 25 && y >= 23 && y < 38) return palette.coral;
  if (x >= 28 && x < 37 && y >= 23 && y < 38) return palette.charcoal;
  if (x >= 16 && x < 37 && y >= 43 && y < 46) return palette.blue;
  return palette.white;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'design-direction-'));
  writeJson(join(root, 'manifest.json'), {
    schema_version: 'design-artifact/v1',
    artifact_type: 'poster'
  });
  writeJson(join(root, 'content-ledger.json'), {
    schema_version: 'design-content-ledger/v1',
    source_records: [],
    entries: []
  });
  const topologySnapshot = Buffer.from(
    'Snapshot note: dominant claim precedes subordinate evidence.\n'
  );
  const visualSnapshot = Buffer.from(
    'Snapshot note: asymmetric type scale exposes the proof path.\n'
  );
  writeFileSync(join(root, 'reference-topology.txt'), topologySnapshot);
  writeFileSync(join(root, 'reference-visual.txt'), visualSnapshot);
  const registry = {
    schema_version: 'design-reference-registry/v1',
    artifact_type: 'poster',
    references: [
      {
        id: 'topology-reference',
        role: 'content_topology',
        source_url: 'https://example.com/topology',
        fixed_revision: 'snapshot-only',
        snapshot_ref: 'reference-topology.txt',
        snapshot_sha256: sha256(topologySnapshot),
        code_license: 'not-used',
        asset_license: 'not-used',
        adoption_mode: 'inspiration_only',
        allowed_paths: [],
        forbidden_paths: ['all source code and assets'],
        design_takeaway: 'Use one dominant claim before subordinate evidence.'
      },
      {
        id: 'visual-reference',
        role: 'visual_language',
        source_url: 'https://example.com/visual',
        fixed_revision: 'snapshot-only',
        snapshot_ref: 'reference-visual.txt',
        snapshot_sha256: sha256(visualSnapshot),
        code_license: 'not-used',
        asset_license: 'not-used',
        adoption_mode: 'inspiration_only',
        allowed_paths: [],
        forbidden_paths: ['all source code and assets'],
        design_takeaway: 'Use asymmetric type scale and an explicit evidence path.'
      }
    ]
  };
  writeJson(join(root, 'reference-registry.json'), registry);
  const first = png(40, 50, dominantLayout);
  const second = png(40, 50, evidenceLayout);
  writeFileSync(join(root, 'direction-a.png'), first);
  writeFileSync(join(root, 'direction-b.png'), second);
  const comparison = {
    schema_version: 'design-direction-comparison/v1',
    artifact_type: 'poster',
    content_ledger_sha256: sha256(readFileSync(join(root, 'content-ledger.json'))),
    reference_registry_ref: 'reference-registry.json',
    reference_registry_sha256: sha256(readFileSync(join(root, 'reference-registry.json'))),
    target_frame: { width: 40, height: 50, unit: 'px' },
    directions: [
      {
        id: 'dominant',
        topology: 'dominant-claim',
        visual_thesis: 'Let one claim own the entire first reading distance.',
        creative_basis: ['content_native'],
        anti_default: 'Avoid a uniform card wall and equal-weight panels.',
        primary_focus: 'one claim',
        media_strategy: 'typography first',
        memorable_element: 'oversized claim',
        restraint_rules: ['one headline only', 'evidence remains subordinate'],
        anti_examples: ['equal-weight card wall'],
        preview_ref: 'direction-a.png',
        preview_sha256: sha256(first),
        preview_frame: { width: 40, height: 50, unit: 'px' }
      },
      {
        id: 'evidence',
        topology: 'evidence-grid',
        visual_thesis: 'Let a compact proof structure support the same claim.',
        creative_basis: ['content_native'],
        anti_default: 'Avoid a decorative dashboard collage with no proof order.',
        primary_focus: 'evidence path',
        media_strategy: 'structured evidence',
        memorable_element: 'proof sequence',
        restraint_rules: ['one proof path only', 'no decorative charts'],
        anti_examples: ['dashboard collage'],
        preview_ref: 'direction-b.png',
        preview_sha256: sha256(second),
        preview_frame: { width: 40, height: 50, unit: 'px' }
      }
    ],
    selected_direction_id: 'dominant',
    selection_rationale: 'The dominant direction matches a three-second communication task.'
  };
  writeJson(join(root, 'direction-comparison.json'), comparison);
  return root;
}

function upgradeToV2(root) {
  const ledgerPath = join(root, 'content-ledger.json');
  writeJson(ledgerPath, {
    schema_version: 'design-content-ledger/v1',
    ledger_id: 'direction-ledger',
    entries: [{
      id: 'unit.one',
      source_ref: 'source.txt',
      source_sha256: 'a'.repeat(64),
      source_quote: 'One shared content unit.',
      source_locator: { kind: 'paragraph', start: 1, end: 1 },
      semantic_signature: {
        modality: 'assertion',
        temporal_status: 'timeless',
        evidence_status: 'source_supported'
      },
      protected_tokens: []
    }]
  });
  const structureA = '<main data-direction="a"><h1>One shared content unit.</h1></main>\n';
  const structureB = '<main data-direction="b"><aside>Proof</aside><h1>One shared content unit.</h1></main>\n';
  writeFileSync(join(root, 'direction-a.html'), structureA);
  writeFileSync(join(root, 'direction-b.html'), structureB);
  const keyframe = png(40, 50, evidenceLayout);
  const keyframeRoles = [
    'first_viewport',
    'dense_content',
    'critical_state',
    'narrow_screen'
  ];
  for (const role of keyframeRoles) {
    writeFileSync(join(root, `keyframe-${role}.png`), keyframe);
  }
  const comparisonPath = join(root, 'direction-comparison.json');
  const comparison = JSON.parse(readFileSync(comparisonPath, 'utf8'));
  comparison.schema_version = 'design-direction-comparison/v2';
  comparison.content_ledger_sha256 = sha256(readFileSync(ledgerPath));
  for (const [index, direction] of comparison.directions.entries()) {
    Object.assign(direction, {
      concept_statement: index
        ? 'A proof-led stage makes evidence sequence visible before decoration.'
        : 'A single declarative stage gives the claim one unmistakable owner.',
      primary_subject: index ? 'proof sequence' : 'primary claim',
      typography_strategy: index
        ? 'Compact editorial hierarchy with aligned proof labels.'
        : 'Large declarative display type with quiet evidence text.',
      material_strategy: index
        ? 'Neutral paper field with precise rule-based structure.'
        : 'High-contrast field with one restrained accent marker.',
      motion_grammar: index
        ? 'Evidence appears by ordered state change with a static fallback.'
        : 'The claim settles once while all evidence remains visible.',
      structure_kind: 'html',
      structure_ref: index ? 'direction-b.html' : 'direction-a.html',
      structure_sha256: sha256(Buffer.from(index ? structureB : structureA)),
      content_unit_ids: ['unit.one']
    });
  }
  comparison.keyframe_evidence = {
    selected_direction_id: comparison.selected_direction_id,
    frames: keyframeRoles.map((role) => ({
      role,
      state_id: role === 'critical_state' ? 'selected' : 'default',
      image_ref: `keyframe-${role}.png`,
      image_sha256: sha256(keyframe),
      frame: { width: 40, height: 50, unit: 'px' }
    }))
  };
  writeJson(comparisonPath, comparison);
  return comparison;
}

test('direction evidence binds two same-size, materially different previews', () => {
  const root = fixture();
  try {
    assert.deepEqual(validateDirectionEvidence(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('v2 direction evidence binds independent structures and four keyframes', () => {
  const root = fixture();
  try {
    upgradeToV2(root);
    assert.deepEqual(validateDirectionEvidence(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('v2 direction evidence rejects shared structure and content coverage drift', () => {
  const root = fixture();
  try {
    const comparison = upgradeToV2(root);
    comparison.directions[1].structure_ref = comparison.directions[0].structure_ref;
    comparison.directions[1].structure_sha256 =
      comparison.directions[0].structure_sha256;
    comparison.directions[1].content_unit_ids = [];
    comparison.keyframe_evidence.frames[3].role = 'first_viewport';
    writeJson(join(root, 'direction-comparison.json'), comparison);
    const output = validateDirectionEvidence(root).join('\n');
    assert.match(output, /distinct structure files and bytes/);
    assert.match(output, /same content units/);
    assert.match(output, /each required role exactly once/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('v2 direction evidence binds available product requirements', () => {
  const root = fixture();
  try {
    const comparison = upgradeToV2(root);
    writeFileSync(
      join(root, 'requirement-verification.json'),
      '{"schema_version":"design-requirement-verification/v1"}\n'
    );
    writeJson(join(root, 'direction-comparison.json'), comparison);
    assert.match(
      validateDirectionEvidence(root).join('\n'),
      /must bind the available requirement verification/
    );
    comparison.requirement_verification_ref = 'requirement-verification.json';
    comparison.requirement_verification_sha256 = sha256(
      readFileSync(join(root, 'requirement-verification.json'))
    );
    writeJson(join(root, 'direction-comparison.json'), comparison);
    assert.deepEqual(validateDirectionEvidence(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('content-native direction evidence does not require external references', () => {
  const root = fixture();
  try {
    const comparisonPath = join(root, 'direction-comparison.json');
    const comparison = JSON.parse(readFileSync(comparisonPath, 'utf8'));
    delete comparison.reference_registry_ref;
    delete comparison.reference_registry_sha256;
    rmSync(join(root, 'reference-registry.json'));
    rmSync(join(root, 'reference-topology.txt'));
    rmSync(join(root, 'reference-visual.txt'));
    writeJson(comparisonPath, comparison);
    assert.deepEqual(validateDirectionEvidence(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('direction evidence rejects fake preview bytes and frame drift', () => {
  const root = fixture();
  try {
    writeFileSync(join(root, 'direction-a.png'), 'not a png');
    assert.match(validateDirectionEvidence(root).join('\n'), /SHA-256 mismatch|complete PNG/);
    const fresh = fixture();
    try {
      const comparisonPath = join(fresh, 'direction-comparison.json');
      const comparison = JSON.parse(readFileSync(comparisonPath, 'utf8'));
      comparison.directions[0].preview_frame.width = 41;
      writeJson(comparisonPath, comparison);
      assert.match(validateDirectionEvidence(fresh).join('\n'), /preview frame must match/);
    } finally {
      rmSync(fresh, { recursive: true, force: true });
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('direction evidence rejects shallow variants and unsafe reference licensing', () => {
  const root = fixture();
  try {
    const comparisonPath = join(root, 'direction-comparison.json');
    const comparison = JSON.parse(readFileSync(comparisonPath, 'utf8'));
    comparison.directions[1].topology = comparison.directions[0].topology;
    comparison.directions[1].primary_focus = comparison.directions[0].primary_focus;
    comparison.directions[1].media_strategy = comparison.directions[0].media_strategy;
    writeJson(comparisonPath, comparison);
    assert.match(validateDirectionEvidence(root).join('\n'), /directions must differ/);

    const registryPath = join(root, 'reference-registry.json');
    const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
    registry.references[1].asset_license = 'unknown';
    writeJson(registryPath, registry);
    comparison.reference_registry_sha256 = sha256(readFileSync(registryPath));
    writeJson(comparisonPath, comparison);
    assert.match(validateDirectionEvidence(root).join('\n'), /unresolved license status/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('direction evidence rejects corrupt PNG CRC and reference snapshot drift', () => {
  const root = fixture();
  try {
    const comparisonPath = join(root, 'direction-comparison.json');
    const comparison = JSON.parse(readFileSync(comparisonPath, 'utf8'));
    const corrupt = Buffer.from(readFileSync(join(root, 'direction-a.png')));
    corrupt[corrupt.length - 20] ^= 0x01;
    writeFileSync(join(root, 'direction-b.png'), corrupt);
    comparison.directions[1].preview_sha256 = sha256(corrupt);
    writeJson(comparisonPath, comparison);
    assert.match(
      validateDirectionEvidence(root).join('\n'),
      /complete PNG|decodable 8-bit PNG/i
    );

    const fresh = fixture();
    try {
      writeFileSync(join(fresh, 'reference-visual.txt'), 'changed snapshot\n');
      assert.match(
        validateDirectionEvidence(fresh).join('\n'),
        /reference visual-reference snapshot SHA-256 mismatch/i
      );
    } finally {
      rmSync(fresh, { recursive: true, force: true });
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('direction evidence rejects a global palette-only recolor', () => {
  const root = fixture();
  try {
    const comparisonPath = join(root, 'direction-comparison.json');
    const comparison = JSON.parse(readFileSync(comparisonPath, 'utf8'));
    const recolored = png(40, 50, (x, y) => dominantLayout(x, y, {
      blue: [88, 24, 188],
      charcoal: [8, 91, 74],
      coral: [238, 180, 20],
      white: [226, 235, 245]
    }));
    writeFileSync(join(root, 'direction-b.png'), recolored);
    comparison.directions[1].preview_sha256 = sha256(recolored);
    comparison.directions[1].topology = 'palette-led-grid';
    comparison.directions[1].primary_focus = 'recolored evidence';
    comparison.directions[1].media_strategy = 'palette contrast';
    writeJson(comparisonPath, comparison);
    assert.match(
      validateDirectionEvidence(root).join('\n'),
      /machine structural floor; human review is still required/i
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('direction evidence rejects a localized patch despite metadata drift', () => {
  const root = fixture();
  try {
    const comparisonPath = join(root, 'direction-comparison.json');
    const comparison = JSON.parse(readFileSync(comparisonPath, 'utf8'));
    const patched = png(40, 50, (x, y) => (
      x >= 24 && x < 34 && y >= 36 && y < 45
        ? colors.coral
        : dominantLayout(x, y)
    ));
    writeFileSync(join(root, 'direction-b.png'), patched);
    comparison.directions[1].preview_sha256 = sha256(patched);
    comparison.directions[1].topology = 'patched-asymmetry';
    comparison.directions[1].primary_focus = 'new lower-right focus';
    comparison.directions[1].media_strategy = 'localized accent';
    writeJson(comparisonPath, comparison);
    assert.match(
      validateDirectionEvidence(root).join('\n'),
      /machine structural floor; human review is still required/i
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('direction evidence ignores RGB structure hidden behind zero alpha', () => {
  const root = fixture();
  try {
    const comparisonPath = join(root, 'direction-comparison.json');
    const comparison = JSON.parse(readFileSync(comparisonPath, 'utf8'));
    const transparentA = png(40, 50, () => [0, 0, 0, 0]);
    const transparentB = png(40, 50, (x, y) => (
      dominantLayout(x, y) === colors.white
        ? [255, 255, 255, 0]
        : [...dominantLayout(x, y), 0]
    ));
    writeFileSync(join(root, 'direction-a.png'), transparentA);
    writeFileSync(join(root, 'direction-b.png'), transparentB);
    comparison.directions[0].preview_sha256 = sha256(transparentA);
    comparison.directions[1].preview_sha256 = sha256(transparentB);
    writeJson(comparisonPath, comparison);
    assert.match(
      validateDirectionEvidence(root).join('\n'),
      /machine structural floor; human review is still required/i
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('direction evidence ignores imperceptible RGB structure behind near-zero alpha', () => {
  const root = fixture();
  try {
    const comparisonPath = join(root, 'direction-comparison.json');
    const comparison = JSON.parse(readFileSync(comparisonPath, 'utf8'));
    const transparentA = png(40, 50, () => [0, 0, 0, 1]);
    const transparentB = png(40, 50, (x, y) => (
      [...dominantLayout(x, y), 1]
    ));
    writeFileSync(join(root, 'direction-a.png'), transparentA);
    writeFileSync(join(root, 'direction-b.png'), transparentB);
    comparison.directions[0].preview_sha256 = sha256(transparentA);
    comparison.directions[1].preview_sha256 = sha256(transparentB);
    writeJson(comparisonPath, comparison);
    assert.match(
      validateDirectionEvidence(root).join('\n'),
      /machine structural floor; human review is still required/i
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('direction evidence rejects PNG tRNS transparency fail-closed', () => {
  const root = fixture();
  try {
    const comparisonPath = join(root, 'direction-comparison.json');
    const comparison = JSON.parse(readFileSync(comparisonPath, 'utf8'));
    const hidden = colors.coral;
    const first = truecolorTrnsPng(40, 50, (x, y) => (
      dominantLayout(x, y) === colors.white ? colors.white : hidden
    ), hidden);
    const second = truecolorTrnsPng(40, 50, (x, y) => (
      evidenceLayout(x, y) === colors.white ? colors.white : hidden
    ), hidden);
    writeFileSync(join(root, 'direction-a.png'), first);
    writeFileSync(join(root, 'direction-b.png'), second);
    comparison.directions[0].preview_sha256 = sha256(first);
    comparison.directions[1].preview_sha256 = sha256(second);
    writeJson(comparisonPath, comparison);
    assert.match(
      validateDirectionEvidence(root).join('\n'),
      /complete decodable 8-bit PNG/i
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('direction evidence rejects selection and digest drift', () => {
  const root = fixture();
  try {
    const comparisonPath = join(root, 'direction-comparison.json');
    const comparison = JSON.parse(readFileSync(comparisonPath, 'utf8'));
    comparison.selected_direction_id = 'missing';
    comparison.content_ledger_sha256 = '0'.repeat(64);
    writeJson(comparisonPath, comparison);
    const errors = validateDirectionEvidence(root).join('\n');
    assert.match(errors, /selected_direction_id/);
    assert.match(errors, /content_ledger_sha256 mismatch/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
