# Quality Report

## Artifact
Tweakable artifact fixture.

## Sources
Schematic fixture.

## Assumptions
The fixture proves required control markers.

## Validation
Expected to pass tweakable control checks.

## Template
template_id: tweakable-artifact
applicable_gates: validate-design-output, tweakable-smoke, render-smoke
- gate_id: validate-design-output
  status: passed
  evidence: node scripts/validate-design-output.mjs examples/tweakable-artifact-pass
- gate_id: tweakable-smoke
  status: passed
  evidence: node scripts/tweakable-smoke.mjs examples/tweakable-artifact-pass/index.html
- gate_id: render-smoke
  status: passed
  evidence: package render smoke

## Status
artifact_status: schematic
claim_assurance: schematic
semantic_entailment: not_proven
summary_integrity: not_applicable
number_integrity: not_applicable
plain_language: not_applicable
visual_qa: smoke_passed
accessibility: basic_checked
runtime.browser_smoke: available
runtime.browser_launch: available

## Visual QA
Browser smoke, strict layout smoke, and tweakable interaction smoke passed. Desktop and mobile screenshots are stored in `qa/tweakable-artifact-pass-desktop.png` and `qa/tweakable-artifact-pass-mobile.png`.

## Data Gaps
No source data.

## Remaining Risks
Only core controls are smoke-tested. Production artifacts may still need deeper interaction coverage.
