# Quality Report

## Artifact

Swiss Evidence Deck production fixture using a licensed Open Design runtime and Design-owned visual system.

## Sources

- `source/decision-brief.md`
- `source/layout-inventory.csv`
- `data-provenance.json`
- `assets/vendor/open-design-html-ppt/PROVENANCE.json`

## Assumptions

- The controlled local fixture is trusted for explicit calculation execution.
- The component screenshot proves local rendering, not external fact truth.

## Validation

- Calculation command: `node calculations/inventory.mjs`
- Test command: `node calculations/inventory.test.mjs`
- Provenance command: `node scripts/validate-data-provenance.mjs examples/swiss-evidence-deck-production-pass --execute-trusted`
- Layout, rhythm, asset, summary, claim, responsive, and reduced-motion gates are package-controlled.

## Status

artifact_status: ready
claim_assurance: local_provenance_only
semantic_entailment: manually_reviewed
summary_integrity: source_mapped
number_integrity: verbatim_checked
plain_language: manual_reviewed
calculation_integrity: code_tested
visual_qa: smoke_passed
accessibility: basic_checked
runtime.browser_smoke: available
runtime.browser_launch: available

## Visual QA

Desktop, mobile, and reduced-motion captures are present in `qa/`. `capture:production` enforces exactly 36 canonical per-slide images, then waits for all desktop images to decode and rebuilds both contact sheets. Both current contact sheets were manually reviewed; the mobile slide 6 overflow found during review was fixed and recaptured.

## Data Gaps

No external facts are claimed. Native PPTX, PDF, and Figma fidelity are not covered.

## Remaining Risks

The fixture proves one production path. It does not establish universal template fit or tamper-proof storage.
