// Design knowledge retrieval. Reads the local, Git-synced design-knowledge/
// directory (standards, cases, spec records, and primitives) and ranks
// reviewer-bound knowledge against the current job's classification.
//
// Advisory only. Memory suggestions rank BELOW source truth, accessibility,
// content constraints, and the content-aware profile. This module never blocks,
// never invents values, and never overrides Taste Contract decisions.

import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';

function resolveKnowledgeRoot(skillRoot, configuredRoot) {
  const root = configuredRoot;
  if (!root) return resolve(skillRoot, 'design-knowledge');
  const candidate = resolve(root);
  return existsSync(join(candidate, 'registry.json'))
    ? candidate
    : join(candidate, 'design-knowledge');
}

function resolveKnowledgeFile(kbDir, registryRef) {
  if (typeof registryRef !== 'string' || !registryRef) return null;
  const rel = registryRef.replace(/^design-knowledge[\\/]/, '');
  if (isAbsolute(rel)) return null;
  const abs = resolve(kbDir, rel);
  const fromRoot = relative(kbDir, abs);
  if (fromRoot === '' || fromRoot.startsWith('..') || isAbsolute(fromRoot)) return null;
  return abs;
}

export function loadDesignKnowledge(skillRoot = process.cwd(), options = {}) {
  const kbDir = resolveKnowledgeRoot(skillRoot, options.knowledgeRoot);
  const registryPath = join(kbDir, 'registry.json');
  const empty = {
    records: [],
    cases: [],
    primitives: [],
    registryPath,
    standardsRef: null,
    evaluationPolicyRef: null,
    standardsAvailable: false,
    evaluationPolicyAvailable: false,
    available: false
  };
  if (!existsSync(registryPath)) return empty;
  let registry;
  try { registry = JSON.parse(readFileSync(registryPath, 'utf8')); } catch { return empty; }
  const standardsRef = registry.standards_ref || null;
  const evaluationPolicyRef = registry.evaluation_policy_ref || null;
  const standardsPath = resolveKnowledgeFile(kbDir, standardsRef);
  const evaluationPolicyPath = resolveKnowledgeFile(kbDir, evaluationPolicyRef);
  const read = (rel) => {
    const abs = resolveKnowledgeFile(kbDir, rel);
    if (!abs || !existsSync(abs)) return null;
    try { return JSON.parse(readFileSync(abs, 'utf8')); } catch { return null; }
  };
  // A local registry or inherited environment is not permission to reuse history.
  const historyEnabled = Boolean(options.knowledgeRoot);
  const records = (historyEnabled ? registry.spec_records || [] : [])
    .map((rel) => ({ rel, doc: read(rel) }))
    .filter((x) => x.doc && x.doc.schema_version === 'design-spec-record/v1');
  const primitives = (historyEnabled ? registry.primitives || [] : [])
    .map((rel) => ({ rel, doc: read(rel) }))
    .filter((x) => x.doc && x.doc.schema_version === 'design-primitives/v1');
  const cases = (historyEnabled ? registry.case_records || [] : [])
    .map((rel) => ({ rel, doc: read(rel) }))
    .filter((x) => x.doc && x.doc.schema_version === 'design-case-record/v1');
  return {
    records,
    cases,
    primitives,
    historyEnabled,
    registryPath,
    standardsRef,
    evaluationPolicyRef,
    standardsPath,
    evaluationPolicyPath,
    standardsAvailable: Boolean(standardsPath && existsSync(standardsPath)),
    evaluationPolicyAvailable: Boolean(evaluationPolicyPath && existsSync(evaluationPolicyPath)),
    available: true
  };
}

function scoreRecord(record, query) {
  const c = record.classification || {};
  const reasons = [];
  let score = 0;
  let relevance = 0;
  if (query.artifactType && c.artifact_type === query.artifactType) {
    score += 3; relevance += 3;
    reasons.push(`artifact_type=${c.artifact_type} (+3)`);
  }
  if (query.projectType && c.project_type
      && c.project_type !== 'unclassified-pending-review'
      && c.project_type === query.projectType) {
    score += 2; relevance += 2;
    reasons.push(`project_type=${c.project_type} (+2)`);
  }
  const wanted = (query.signals || []).map((s) => String(s).toLowerCase());
  const have = new Set((c.content_signals?.tags || []).map((t) => String(t).toLowerCase()));
  let signalHits = 0;
  for (const tag of wanted) {
    for (const h of have) {
      if (h === tag || h.includes(tag) || tag.includes(h)) { signalHits += 1; reasons.push(`signal~${h} (+1)`); break; }
    }
  }
  score += signalHits; relevance += signalHits;
  if (query.riskLane && c.risk_lane === query.riskLane) {
    score += 1; relevance += 1;
    reasons.push(`risk_lane=${c.risk_lane} (+1)`);
  }
  const confirmed = record.judgment?.status === 'reviewer_confirmed';
  if (confirmed) { score += 2; reasons.push('reviewer_confirmed (+2, ranking only)'); }
  // Reviewer trust ranks matches; it never creates relevance. A confirmed record
  // for a different artifact type must not surface for this job.
  return { score, relevance, reasons, confirmed };
}

function scoreCase(record, query) {
  const c = record.classification || {};
  const signals = record.classification?.content_signals || {};
  const reasons = [];
  let score = 0;
  let relevance = 0;
  if (query.artifactType && c.artifact_type === query.artifactType) {
    score += 3; relevance += 3;
    reasons.push(`artifact_type=${c.artifact_type} (+3)`);
  }
  if (query.projectType && c.project_type === query.projectType) {
    score += 2; relevance += 2;
    reasons.push(`project_type=${c.project_type} (+2)`);
  }
  if (query.riskLane && c.risk_lane === query.riskLane) {
    score += 1; relevance += 1;
    reasons.push(`risk_lane=${c.risk_lane} (+1)`);
  }
  const availableSignals = new Set([
    ...(signals.tags || []),
    signals.reader_job,
    signals.topology
  ].filter(Boolean).map((value) => String(value).toLowerCase()));
  for (const wanted of query.signals || []) {
    const match = [...availableSignals].find((value) => value.includes(String(wanted).toLowerCase()));
    if (match) {
      score += 1; relevance += 1;
      reasons.push(`signal~${match} (+1)`);
    }
  }
  const status = record.judgment?.status || 'candidate';
  const confirmed = ['reviewer_confirmed', 'user_validated'].includes(status);
  if (confirmed) { score += 2; reasons.push(`${status} (+2, ranking only)`); }
  return { score, relevance, reasons, confirmed };
}

// query: { artifactType, projectType, riskLane, signals: [], status: 'all'|'confirmed'|'candidate' }
export function queryDesignSpec(query = {}, opts = {}) {
  const skillRoot = opts.skillRoot || process.cwd();
  const kb = loadDesignKnowledge(skillRoot, { knowledgeRoot: opts.knowledgeRoot });
  const matches = [];
  for (const { rel, doc } of kb.records) {
    const { score, relevance, reasons, confirmed } = scoreRecord(doc, query);
    if (relevance <= 0) continue;
    if (query.status === 'confirmed' && !confirmed) continue;
    if (query.status === 'candidate' && confirmed) continue;
    const primitives = kb.primitives
      .filter((p) => p.doc.source?.tokens_ref && p.doc.source.tokens_ref === doc.source?.tokens_ref)
      .map((p) => ({
        rel: p.rel,
        id: p.doc.id,
        pairings: p.doc.color_pairings?.length || 0,
        spacing_scale: p.doc.spacing_scale || [],
        structural_facts: p.doc.structural_facts
      }));
    matches.push({
      id: doc.id,
      status: doc.judgment?.status || 'candidate',
      score,
      reasons,
      rel,
      source_ref: doc.source?.ref,
      tokens_ref: doc.source?.tokens_ref,
      classification: doc.classification,
      colors: doc.extracted?.colors || {},
      spacing: doc.extracted?.spacing || {},
      signature_move: doc.judgment?.signature_move || null,
      why_it_works: doc.judgment?.why_it_works || null,
      tags: doc.judgment?.tags || [],
      primitives
    });
  }
  const caseMatches = [];
  for (const { rel, doc } of kb.cases) {
    const { score, relevance, reasons, confirmed } = scoreCase(doc, query);
    if (relevance <= 0) continue;
    if (query.status === 'confirmed' && !confirmed) continue;
    if (query.status === 'candidate' && confirmed) continue;
    caseMatches.push({
      id: doc.id,
      status: doc.judgment?.status || 'candidate',
      score,
      reasons,
      rel,
      classification: doc.classification,
      reader_job: doc.reader_job,
      creative_basis: doc.design_decisions?.creative_basis || [],
      reusable_rules: doc.lessons?.reusable_rules || [],
      anti_patterns: doc.lessons?.anti_patterns || [],
      reuse_boundary: doc.lessons?.reuse_boundary || [],
      source_ref: doc.source?.artifact_ref
    });
  }
  matches.sort((a, b) => b.score - a.score
    || Number(b.status === 'reviewer_confirmed') - Number(a.status === 'reviewer_confirmed'));
  caseMatches.sort((a, b) => b.score - a.score
    || Number(['reviewer_confirmed', 'user_validated'].includes(b.status))
    - Number(['reviewer_confirmed', 'user_validated'].includes(a.status)));
  return {
    queried: query,
    available: kb.available,
    history_enabled: Boolean(kb.historyEnabled),
    standards_ref: kb.standardsRef,
    standards_available: kb.standardsAvailable,
    evaluation_policy_ref: kb.evaluationPolicyRef,
    evaluation_policy_available: kb.evaluationPolicyAvailable,
    match_count: matches.length,
    matches,
    case_match_count: caseMatches.length,
    case_matches: caseMatches.slice(0, 3),
    note: 'Advisory design memory. Priority: source truth > accessibility > content constraints > content-aware profile > these suggestions.'
  };
}
