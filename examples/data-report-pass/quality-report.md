# Quality Report

## Artifact
Data report fixture for validator testing.

## Sources
Uses `source.csv`.

## Assumptions
The fixture treats the CSV as reviewed source material.

## Validation
Expected to pass `node ../../scripts/validate-design-output.mjs .`.

## Template
template_id: source-backed-report
applicable_gates: validate-design-output, validate-summary-map, validate-claim-map
- gate_id: validate-design-output
  status: passed
  evidence: node scripts/validate-design-output.mjs examples/data-report-pass
- gate_id: validate-summary-map
  status: passed
  evidence: node scripts/validate-summary-map.mjs examples/data-report-pass
- gate_id: validate-claim-map
  status: passed
  evidence: node scripts/validate-claim-map.mjs examples/data-report-pass
answer: source-backed revenue and activation finding
caveats: segment, channel, and cohort detail are absent
next_step: review segment and retention cohorts

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
Browser smoke and strict layout smoke passed for desktop and mobile. Screenshots are stored in `qa/data-report-pass-desktop.png` and `qa/data-report-pass-mobile.png`.

## Data Gaps
No segment or channel breakdown; the report states this as a caveat.

## Remaining Risks
Evidence quotes prove local source support only. External source truth is not verified by this fixture.

Duplicate handling: no duplicate monthly keys were merged; the source has one row per month.
