#!/usr/bin/env node
// Query the local design-knowledge base for reviewer-bound design specs that
// match the current job's classification. History requires an explicit root;
// no history is a normal state, not a reason to reuse a previous artifact.
//
// Usage:
//   node scripts/query-design-spec.mjs --artifact-type=html-deck \
//     --risk-lane=standard --signal=editorial --signal=swiss [--status=confirmed|candidate|all] [--knowledge-root=/path/to/repo] [--json]

import { queryDesignSpec } from './lib/design-knowledge.mjs';

function parseArgs(argv) {
  const flags = { signals: [] };
  for (const a of argv.slice(2)) {
    if (!a.startsWith('--')) continue;
    const kv = a.slice(2).split('=');
    const key = kv[0];
    const val = kv.length > 1 ? kv.slice(1).join('=') : true;
    if (key === 'signal') flags.signals.push(val);
    else flags[key] = val;
  }
  return flags;
}

const flags = parseArgs(process.argv);
const query = {
  artifactType: flags['artifact-type'],
  projectType: flags['project-type'],
  riskLane: flags['risk-lane'],
  signals: flags.signals,
  status: flags.status || 'confirmed'
};

const result = queryDesignSpec(query, {
  skillRoot: process.cwd(),
  knowledgeRoot: flags['knowledge-root']
});

if (flags.json) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.available ? 0 : 4);
}

console.log(`Design knowledge query: artifact=${query.artifactType || '*'} project=${query.projectType || '*'} risk=${query.riskLane || '*'} signals=${query.signals.join(',') || '*'}`);
if (!result.available) {
  console.log('  No local design-knowledge/ registry found. Nothing to reuse yet; proceed without memory and distill after QA.');
  process.exit(4);
}
if (result.standards_ref) {
  console.log(`  standards: ${result.standards_ref} (${result.standards_available ? 'available' : 'missing'})`);
}
if (result.evaluation_policy_ref) {
  console.log(`  evaluation policy: ${result.evaluation_policy_ref} (${result.evaluation_policy_available ? 'available' : 'missing'})`);
}
if (result.match_count === 0 && result.case_match_count === 0) {
  console.log('  No matching verified specs. Proceed from content signals; this job can seed new knowledge after independent QA.');
  process.exit(0);
}
if (result.match_count > 0) {
  console.log(`  ${result.match_count} match(es):`);
  for (const m of result.matches) {
    const accent = m.colors.accent?.value || '';
    const spacing = Object.entries(m.spacing).map(([k, v]) => `${k}:${v}`).join(' ');
    console.log(`  [${m.score}] ${m.id} (${m.status}) — ${m.classification.artifact_type}/${m.classification.risk_lane}`);
    console.log(`      reasons: ${m.reasons.join('; ')}`);
    console.log(`      record: ${m.rel}`);
    console.log(`      tokens: accent ${accent}; spacing ${spacing}`);
    if (m.signature_move) console.log(`      signature: ${m.signature_move.move}`);
    if (m.why_it_works) console.log(`      why it works: ${m.why_it_works}`);
    for (const p of m.primitives) {
      console.log(`      primitives: ${p.rel} (${p.pairings} pairings, zero_radius=${p.structural_facts?.zero_radius})`);
    }
    if (m.status === 'candidate') console.log('      candidate: inspection only; not an approved design reference.');
  }
}
if (result.case_match_count > 0) {
  console.log(`  ${result.case_match_count} project case match(es):`);
  for (const c of result.case_matches) {
    console.log(`  [${c.score}] ${c.id} (${c.status}) — ${c.classification.artifact_type}/${c.classification.risk_lane}`);
    console.log(`      reasons: ${c.reasons.join('; ')}`);
    console.log(`      record: ${c.rel}`);
    console.log(`      creative basis: ${c.creative_basis.join(', ') || 'not recorded'}`);
    console.log(`      reusable rules: ${c.reusable_rules.join(' | ')}`);
    console.log(`      reuse boundary: ${c.reuse_boundary.join(' | ')}`);
  }
}
console.log(`  ${result.note}`);
