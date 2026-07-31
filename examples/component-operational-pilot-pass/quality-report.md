# Quality Report

## Artifact

Controlled baseline and enhanced operational component pilot.

## Sources

`source.json` is a local reviewed fixture, not a live operational feed.

## Assumptions

The fixed review tasks are sufficient to compare the operational scan path.

## Validation

Static, browser, and independent review evidence is recorded by the current
exp-skill run. This fixture does not self-award those checks.

drivers: Queue status and request age are read from source.json.
guardrails: The priority exception and affected metric are read from source.json.
filters: The owner handoff control changes only local display state.
freshness: Snapshot time is read verbatim from source.json.

## Template

template_id: operational-dashboard
applicable_gates: validate-design-output, validate-claim-map, render-smoke, validate-component-usage
- gate_id: validate-design-output
  status: passed
  evidence: node scripts/validate-design-output.mjs examples/component-operational-pilot-pass
- gate_id: validate-claim-map
  status: passed
  evidence: node scripts/validate-claim-map.mjs examples/component-operational-pilot-pass
- gate_id: render-smoke
  status: passed
  evidence: strict render smoke passed at 1440, 390, and 320 pixels
- gate_id: validate-component-usage
  status: passed
  evidence: node scripts/validate-component-pilots.mjs examples/component-operational-pilot-pass

## Status

artifact_status: partial
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

Strict Chromium smoke passed at desktop, mobile, and small-phone sizes.
Default, keyboard-focus, and checked reduced-motion screenshots are stored
under `qa/`.

## Data Gaps

No live freshness or real-user task outcome is available.

## Remaining Risks

The enhanced direction must win the fixed reader task in independent review.
