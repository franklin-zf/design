# Quality Report

## Artifact

Controlled baseline and enhanced HTML deck component pilot.

## Sources

`source-notes.txt` is a local test brief. It is not external fact evidence.

## Assumptions

The fixed review tasks are sufficient to compare the sequence treatment.

## Validation

Static, browser, and independent review evidence is recorded by the current
exp-skill run. This fixture does not self-award those checks.

## Template

template_id: swiss-evidence-deck
applicable_gates: validate-design-output, validate-summary-map, validate-aesthetic-contract, validate-asset-contract, validate-layout-lock, validate-visual-rhythm, render-smoke, validate-component-usage, manual-reviewer-pass
- gate_id: validate-design-output
  status: passed
  evidence: node scripts/validate-design-output.mjs examples/component-deck-pilot-pass
- gate_id: validate-summary-map
  status: passed
  evidence: node scripts/validate-summary-map.mjs examples/component-deck-pilot-pass
- gate_id: validate-aesthetic-contract
  status: passed
  evidence: node scripts/validate-aesthetic-contract.mjs examples/component-deck-pilot-pass
- gate_id: validate-asset-contract
  status: passed
  evidence: node scripts/validate-asset-contract.mjs examples/component-deck-pilot-pass
- gate_id: validate-layout-lock
  status: passed
  evidence: node scripts/validate-layout-lock.mjs examples/component-deck-pilot-pass
- gate_id: validate-visual-rhythm
  status: passed
  evidence: node scripts/validate-visual-rhythm.mjs examples/component-deck-pilot-pass
- gate_id: render-smoke
  status: passed
  evidence: strict render smoke passed at 1440, 390, and 320 pixels
- gate_id: validate-component-usage
  status: passed
  evidence: node scripts/validate-component-pilots.mjs examples/component-deck-pilot-pass
- gate_id: manual-reviewer-pass
  status: not_run
  evidence: Independent P1 review is pending.

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
Screenshots are stored under `qa/`.

## Data Gaps

No real-user task outcome is available.

## Remaining Risks

The enhanced direction must win the fixed reader task in independent review.
