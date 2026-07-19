# Quality Report

## Artifact
Swiss deck fixture for aesthetic contract, layout lock, asset policy, and rhythm validation.

## Sources
Uses `source-notes.txt`.

## Assumptions
The SVG is a generated schematic, not a screenshot.

## Validation
Expected to pass design output, summary map, aesthetic contract, asset contract, layout lock, and visual rhythm checks.

## Template
template_id: swiss-evidence-deck
applicable_gates: validate-design-output, validate-summary-map, validate-aesthetic-contract, validate-asset-contract, validate-layout-lock, validate-visual-rhythm, render-smoke, manual-reviewer-pass
- gate_id: validate-design-output
  status: passed
  evidence: node scripts/validate-design-output.mjs examples/swiss-deck-pass
- gate_id: validate-summary-map
  status: passed
  evidence: node scripts/validate-summary-map.mjs examples/swiss-deck-pass
- gate_id: validate-aesthetic-contract
  status: passed
  evidence: node scripts/validate-aesthetic-contract.mjs examples/swiss-deck-pass
- gate_id: validate-asset-contract
  status: passed
  evidence: node scripts/validate-asset-contract.mjs examples/swiss-deck-pass
- gate_id: validate-layout-lock
  status: passed
  evidence: node scripts/validate-layout-lock.mjs examples/swiss-deck-pass
- gate_id: validate-visual-rhythm
  status: passed
  evidence: node scripts/validate-visual-rhythm.mjs examples/swiss-deck-pass
- gate_id: render-smoke
  status: passed
  evidence: package render smoke
- gate_id: manual-reviewer-pass
  status: passed
  evidence: fixture review recorded in quality-report.md

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
Native PPTX fidelity is not verified.
