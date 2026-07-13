# Quality Report

## Artifact
Poster fixture for one-message visual output.

## Sources
Uses `source.txt`.

## Assumptions
The poster keeps the source meaning and removes context not needed for the one-message surface.

## Validation
Expected to pass design output, poster contract, and poster anti-AI-slop checks.

## Template
template_id: poster-type-led
applicable_gates: validate-design-output, validate-poster-contract, validate-poster-anti-ai-slop
- gate_id: validate-design-output
  status: passed
  evidence: node scripts/validate-design-output.mjs examples/poster-pass
- gate_id: validate-poster-contract
  status: passed
  evidence: node scripts/validate-poster-contract.mjs examples/poster-pass
- gate_id: validate-poster-anti-ai-slop
  status: passed
  evidence: node scripts/validate-poster-anti-ai-slop.mjs examples/poster-pass

## Status
artifact_status: ready
claim_assurance: local_provenance_only
semantic_entailment: manually_reviewed
summary_integrity: source_mapped
number_integrity: verbatim_checked
plain_language: manual_reviewed
visual_qa: manual_reviewed
accessibility: basic_checked
runtime.browser_smoke: not_claimed
runtime.browser_launch: not_claimed

## Visual QA
Manual fixture review only. Browser smoke is not claimed by this file.

## Data Gaps
No quantitative evidence included.

## Remaining Risks
Campaign performance and production export fidelity are not verified.
