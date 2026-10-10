import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const packageRoot = process.cwd();
const { summarizeDesignEvaluation, validateDesignEvaluation } = await import(
  '../scripts/validate-design-evaluation.mjs'
);

const validPreview = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'design-evaluation-'));
  const artifact = Buffer.from('<main data-design-id="evaluation-fixture">poster</main>\n');
  const policy = readFileSync(
    join(packageRoot, 'design-knowledge/evaluation-policy.json')
  );
  const comparisonValue = {
    schema_version: 'design-direction-comparison/v1',
    artifact_type: 'poster',
    content_ledger_sha256: sha256('content-ledger'),
    reference_registry_ref: 'reference-registry.json',
    reference_registry_sha256: sha256('reference-registry'),
    target_frame: { width: 1, height: 1, unit: 'px' },
    directions: [
      {
        id: 'direction-a',
        topology: 'one-message',
        visual_thesis: 'Make the primary message the first visible decision.',
        creative_basis: ['content_native'],
        anti_default: 'Avoid a card grid with equal visual weight.',
        primary_focus: 'Primary message and supporting evidence.',
        media_strategy: 'No media; use a restrained typographic field.',
        memorable_element: 'One oversized evidence marker.',
        restraint_rules: ['No decorative gradients.', 'No repeated card containers.'],
        anti_examples: ['Do not fill empty space with icons.'],
        preview_ref: 'preview-a.png',
        preview_sha256: sha256(validPreview),
        preview_frame: { width: 1, height: 1, unit: 'px' }
      },
      {
        id: 'direction-b',
        topology: 'evidence-sequence',
        visual_thesis: 'Make the evidence sequence explain the decision path.',
        creative_basis: ['knowledge_recombination'],
        anti_default: 'Avoid treating every claim as an isolated panel.',
        primary_focus: 'Evidence sequence and final decision.',
        media_strategy: 'Use one small diagram only when it clarifies sequence.',
        memorable_element: 'A continuous evidence line ending in the decision.',
        restraint_rules: ['Keep one visual system.', 'Use motion only as a finite reveal.'],
        anti_examples: ['Do not add stock imagery as filler.'],
        preview_ref: 'preview-b.png',
        preview_sha256: sha256(validPreview),
        preview_frame: { width: 1, height: 1, unit: 'px' }
      }
    ],
    selected_direction_id: 'direction-a',
    selection_rationale: 'Direction A makes the reader job immediately legible.'
  };
  const comparison = Buffer.from(JSON.stringify(comparisonValue));
  writeJson(join(root, 'manifest.json'), { artifact_type: 'poster' });
  writeFileSync(join(root, 'artifact.html'), artifact);
  writeFileSync(join(root, 'evaluation-policy.json'), policy);
  writeFileSync(join(root, 'direction-comparison.json'), comparison);
  writeFileSync(join(root, 'preview-a.png'), validPreview);
  writeFileSync(join(root, 'preview-b.png'), validPreview);
  const policyValue = JSON.parse(policy.toString('utf8'));
  policyValue.status = 'calibrated';
  const calibratedPolicy = Buffer.from(`${JSON.stringify(policyValue, null, 2)}\n`);
  writeFileSync(join(root, 'evaluation-policy.json'), calibratedPolicy);
  writeFileSync(join(root, 'evidence.txt'), 'blind panel transcript\n');
  writeJson(join(root, 'design-evaluation.json'), {
    schema_version: 'design-evaluation-record/v1',
    artifact_ref: 'artifact.html',
    artifact_sha256: sha256(artifact),
    policy_ref: 'evaluation-policy.json',
    policy_sha256: sha256(calibratedPolicy),
    evaluator_types: ['human_panel'],
    three_second: {
      status: 'passed',
      evaluator_type: 'human_panel',
      sample_size: 5,
      evidence_refs: ['evidence.txt'],
      recall: {
        reader_job_correct: 4,
        primary_conclusion_correct: 3,
        required_action_correct: 2
      }
    },
    blinded_preference: {
      status: 'passed',
      evaluator_type: 'human_panel',
      direction_comparison_ref: 'direction-comparison.json',
      direction_comparison_sha256: sha256(comparison),
      randomized_order: true,
      anonymized: true,
      randomization_seed: 'seed-42',
      labels: ['A', 'B'],
      sample_size: 10,
      votes: { A: 6, B: 3, tie: 1 },
      evidence_refs: ['evidence.txt']
    },
    non_claims: [
      'This panel is not universal taste evidence.',
      'This record does not prove business impact.'
    ]
  });
  return root;
}

test('evaluation record validates and computes rates from raw counts', () => {
  const root = fixture();
  try {
    assert.deepEqual(validateDesignEvaluation(root), []);
    const record = JSON.parse(readFileSync(join(root, 'design-evaluation.json'), 'utf8'));
    const summary = summarizeDesignEvaluation(record);
    assert.equal(summary.three_second.recall_rates.reader_job_correct, 0.8);
    assert.equal(summary.blinded_preference.winner, 'A');
    assert.equal(summary.blinded_preference.win_rate, 6 / 9);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('evaluation record rejects vote totals that do not match sample size', () => {
  const root = fixture();
  try {
    const path = join(root, 'design-evaluation.json');
    const record = JSON.parse(readFileSync(path, 'utf8'));
    record.blinded_preference.sample_size = 11;
    writeJson(path, record);
    assert.match(
      validateDesignEvaluation(root).join('\n'),
      /vote total must equal sample_size/
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('evaluation record rejects a digest drift in the shared policy', () => {
  const root = fixture();
  try {
    const policyPath = join(root, 'evaluation-policy.json');
    const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
    policy.purpose = `${policy.purpose} changed`;
    writeJson(policyPath, policy);
    assert.match(
      validateDesignEvaluation(root).join('\n'),
      /policy_sha256 mismatch/
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('complete evaluation rejects an uncalibrated policy and missing previews', () => {
  const root = fixture();
  try {
    const policyPath = join(root, 'evaluation-policy.json');
    const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
    policy.status = 'calibration_required';
    writeJson(policyPath, policy);
    const recordPath = join(root, 'design-evaluation.json');
    const record = JSON.parse(readFileSync(recordPath, 'utf8'));
    record.policy_sha256 = sha256(readFileSync(policyPath));
    writeJson(recordPath, record);
    assert.match(
      validateDesignEvaluation(root, { requireComplete: true }).join('\n'),
      /calibrated evaluation policy/
    );

    const calibratedRoot = fixture();
    try {
      const calibratedRecordPath = join(calibratedRoot, 'design-evaluation.json');
      const calibratedRecord = JSON.parse(readFileSync(calibratedRecordPath, 'utf8'));
      calibratedRecord.blinded_preference.direction_comparison_sha256 = sha256(
        readFileSync(join(calibratedRoot, 'direction-comparison.json'))
      );
      writeJson(calibratedRecordPath, calibratedRecord);
      rmSync(join(calibratedRoot, 'preview-b.png'));
      assert.match(
        validateDesignEvaluation(calibratedRoot, { requireComplete: true }).join('\n'),
        /direction-b preview is missing/
      );
    } finally {
      rmSync(calibratedRoot, { recursive: true, force: true });
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('evaluation record rejects an incomplete direction comparison', () => {
  const root = fixture();
  try {
    const path = join(root, 'direction-comparison.json');
    const comparison = JSON.parse(readFileSync(path, 'utf8'));
    delete comparison.directions[0].visual_thesis;
    writeJson(path, comparison);
    const recordPath = join(root, 'design-evaluation.json');
    const record = JSON.parse(readFileSync(recordPath, 'utf8'));
    record.blinded_preference.direction_comparison_sha256 = sha256(
      readFileSync(path)
    );
    writeJson(recordPath, record);
    assert.match(
      validateDesignEvaluation(root).join('\n'),
      /direction-comparison.*visual_thesis/
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('not-run evaluation may declare the gap without placeholder previews', () => {
  const root = fixture();
  try {
    const recordPath = join(root, 'design-evaluation.json');
    const record = JSON.parse(readFileSync(recordPath, 'utf8'));
    const preference = record.blinded_preference;
    preference.status = 'not_run';
    preference.sample_size = 0;
    preference.votes = { A: 0, B: 0, tie: 0 };
    delete preference.direction_comparison_ref;
    delete preference.direction_comparison_sha256;
    delete preference.randomized_order;
    delete preference.anonymized;
    delete preference.randomization_seed;
    delete preference.labels;
    writeJson(recordPath, record);
    assert.deepEqual(validateDesignEvaluation(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('require-complete rejects a structurally valid not-run record', () => {
  const root = fixture();
  try {
    const recordPath = join(root, 'design-evaluation.json');
    const record = JSON.parse(readFileSync(recordPath, 'utf8'));
    record.three_second.status = 'not_run';
    record.three_second.sample_size = 0;
    record.three_second.recall = {
      reader_job_correct: 0,
      primary_conclusion_correct: 0,
      required_action_correct: 0
    };
    record.three_second.evidence_refs = [];
    record.blinded_preference.status = 'not_run';
    record.blinded_preference.sample_size = 0;
    record.blinded_preference.votes = { A: 0, B: 0, tie: 0 };
    record.blinded_preference.evidence_refs = [];
    writeJson(recordPath, record);
    assert.match(
      validateDesignEvaluation(root, { requireComplete: true }).join('\n'),
      /--require-complete requires three_second\.status=passed/
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
