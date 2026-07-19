# Quality Report

## Artifact

Role handoff pass fixture for the design skill.

## Sources

- source-notes.txt

## Assumptions

- This fixture demonstrates the triad workflow and visual asset contract.

## Validation

- node scripts/validate-design-output.mjs examples/role-handoff-pass
- node scripts/validate-summary-map.mjs examples/role-handoff-pass

## Template
template_id: swiss-evidence-deck
applicable_gates: validate-design-output, validate-summary-map, validate-aesthetic-contract, validate-asset-contract, validate-layout-lock, validate-visual-rhythm, render-smoke, manual-reviewer-pass
- gate_id: validate-design-output
  status: passed
  evidence: node scripts/validate-design-output.mjs examples/role-handoff-pass
- gate_id: validate-summary-map
  status: passed
  evidence: node scripts/validate-summary-map.mjs examples/role-handoff-pass
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

Manual fixture review: the flowchart image is local, has a slot, and is readable.

## Data Gaps

None.

## Remaining Risks

This is a compact fixture and does not prove full presentation aesthetics.
