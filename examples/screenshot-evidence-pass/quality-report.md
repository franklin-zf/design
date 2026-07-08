# Quality Report

## Artifact
Screenshot evidence fixture.

## Sources
Uses `images/source.svg`.

## Assumptions
The fixture SVG stands in for a product screenshot.

## Validation
Expected to pass screenshot mode and image slot checks.

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
Browser smoke and strict layout smoke passed for desktop and mobile. Screenshots are stored in `qa/screenshot-evidence-pass-desktop.png` and `qa/screenshot-evidence-pass-mobile.png`.

## Data Gaps
No live product screenshot supplied; this fixture is explicitly schematic.

## Remaining Risks
No sensitive-data redaction was required for this fixture.
