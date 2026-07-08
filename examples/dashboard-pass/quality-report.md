# Quality Report

## Artifact
Dashboard fixture for validator testing.

## Sources
Uses `source.json`.

## Assumptions
The source is treated as reviewed operational data and includes trend, driver, and detail-table fields.

## Validation
Expected to pass the design artifact validator.

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
