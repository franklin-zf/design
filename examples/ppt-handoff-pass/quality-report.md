# Quality Report

## Artifact
PPT handoff fixture.

## Sources
Uses `source-notes.txt`.

## Assumptions
Native PPTX runtime is unavailable for this fixture.

## Validation
Expected to pass deck and PPT handoff checks.

## Template
template_id: swiss-evidence-deck
applicable_gates: validate-design-output, validate-summary-map, validate-aesthetic-contract, validate-asset-contract, validate-layout-lock, validate-visual-rhythm, render-smoke, manual-reviewer-pass
- gate_id: validate-design-output
  status: passed
  evidence: node scripts/validate-design-output.mjs examples/ppt-handoff-pass
- gate_id: validate-summary-map
  status: passed
  evidence: node scripts/validate-summary-map.mjs examples/ppt-handoff-pass
- gate_id: validate-aesthetic-contract
  status: passed
  evidence: package contract validation
- gate_id: validate-asset-contract
  status: passed
  evidence: package asset validation
- gate_id: validate-layout-lock
  status: passed
  evidence: package layout validation
- gate_id: validate-visual-rhythm
  status: passed
  evidence: package rhythm validation
- gate_id: render-smoke
  status: passed
  evidence: package render smoke
- gate_id: manual-reviewer-pass
  status: passed
  evidence: fixture review recorded in quality-report.md

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
Browser smoke and strict layout smoke passed for desktop and mobile. Screenshots are stored in `qa/ppt-handoff-pass-desktop.png` and `qa/ppt-handoff-pass-mobile.png`. PPTX fidelity is not verified.

## Data Gaps
No quantitative data.

## Remaining Risks
Native PPTX conversion may change layout.

## PPTX Conversion Notes
Use a native presentation runtime when available. Preserve `slide-plan.json`, source notes, layout ids, and style preset during conversion.
