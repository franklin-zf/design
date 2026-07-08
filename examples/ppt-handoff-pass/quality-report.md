# Quality Report

## Artifact
PPT handoff fixture.

## Sources
Uses `source-notes.txt`.

## Assumptions
Native PPTX runtime is unavailable for this fixture.

## Validation
Expected to pass deck and PPT handoff checks.

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
Browser smoke and strict layout smoke passed for desktop and mobile. Screenshots are stored in `qa/ppt-handoff-pass-desktop.png` and `qa/ppt-handoff-pass-mobile.png`. PPTX fidelity is not verified.

## Data Gaps
No quantitative data.

## Remaining Risks
Native PPTX conversion may change layout.

## PPTX Conversion Notes
Use a native presentation runtime when available. Preserve `slide-plan.json`, source notes, layout ids, and style preset during conversion.
