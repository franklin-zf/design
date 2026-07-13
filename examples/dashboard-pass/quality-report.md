# Quality Report

## Artifact
Dashboard fixture for validator testing.

## Sources
Uses `source.json`.

## Assumptions
The source is treated as reviewed operational data and includes trend, driver, and detail-table fields.

## Validation
Expected to pass the design artifact validator.

## Template
template_id: operational-dashboard
applicable_gates: validate-design-output, validate-claim-map, render-smoke
- gate_id: validate-design-output
  status: passed
  evidence: node scripts/validate-design-output.mjs examples/dashboard-pass
- gate_id: validate-claim-map
  status: passed
  evidence: node scripts/validate-claim-map.mjs examples/dashboard-pass
- gate_id: render-smoke
  status: passed
  evidence: node scripts/render-smoke.mjs examples/dashboard-pass/index.html --viewports=desktop,mobile
drivers: Expansion 28, Reactivation 19, Churn -12 from source.json
guardrails: incident count source value 2
filters: none applied in the fixture view
freshness: 24 hours from source.json

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
Browser smoke and strict layout smoke passed for desktop and mobile. Screenshots are stored in `qa/dashboard-pass-desktop.png` and `qa/dashboard-pass-mobile.png`.

## Data Gaps
No account-level row detail beyond segment aggregates.

## Remaining Risks
Freshness is illustrative; external source truth is not verified by this fixture.

Duplicate handling: no duplicate weeks or segments were merged in source.json.
