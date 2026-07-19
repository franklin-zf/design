# Quality Report

## Artifact
Chart-frame fixture.

## Sources
Uses `source.csv`.

## Assumptions
The fixture treats the CSV as reviewed source material.

## Validation
Expected to pass chart-frame checks for source, chart id, family, source, unit, sample size, and visual encoding.

## Template
template_id: source-backed-report
applicable_gates: validate-design-output, validate-summary-map, validate-claim-map
- gate_id: validate-design-output
  status: passed
  evidence: node scripts/validate-design-output.mjs examples/chart-frame-pass
- gate_id: validate-summary-map
  status: passed
  evidence: node scripts/validate-summary-map.mjs examples/chart-frame-pass
- gate_id: validate-claim-map
  status: passed
  evidence: node scripts/validate-claim-map.mjs examples/chart-frame-pass
answer: source-backed chart finding
caveats: segment and channel detail are absent
next_step: review the next source slice before extending the chart

## Status
artifact_status: ready
claim_assurance: local_provenance_only
semantic_entailment: manually_reviewed
summary_integrity: source_mapped
number_integrity: verbatim_checked
plain_language: manual_reviewed
visual_qa: smoke_passed
accessibility: basic_checked
runtime.browser_smoke: available
runtime.browser_launch: available

## Visual QA
Browser smoke and strict layout smoke passed for desktop and mobile. Screenshots are stored in `qa/chart-frame-pass-desktop.png` and `qa/chart-frame-pass-mobile.png`.

## Data Gaps
No segment or channel breakdown.

## Remaining Risks
Evidence quotes prove local source support only. External source truth is not verified by this fixture.
