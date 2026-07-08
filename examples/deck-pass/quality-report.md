# Quality Report

## Artifact
HTML deck fixture for validator testing.

## Sources
Uses `source-notes.txt`.

## Assumptions
Three slides are enough for fixture validation.

## Validation
Expected to pass deck checks.

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
Browser smoke and strict layout smoke passed for desktop and mobile. Screenshots are stored in `qa/deck-pass-desktop.png` and `qa/deck-pass-mobile.png`.

## Data Gaps
No quantitative evidence included.

## Remaining Risks
No live presentation rehearsal. Native PPTX fidelity and fine-grained layout quality are not verified.
