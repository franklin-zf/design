# Quality Report

## Artifact
Design system fixture.

## Sources
No external source; schematic fixture.

## Assumptions
Fixture exists to prove DESIGN.md and tokens.css contract.

## Validation
Expected to pass design-system checks.

## Template
template_id: design-system-package
applicable_gates: validate-design-output, validate-design-system-package, manual-reviewer-pass
- gate_id: validate-design-output
  status: passed
  evidence: node scripts/validate-design-output.mjs examples/design-system-pass
- gate_id: validate-design-system-package
  status: passed
  evidence: package design-system validation
- gate_id: manual-reviewer-pass
  status: passed
  evidence: fixture review recorded in quality-report.md

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
Browser smoke and strict layout smoke passed for desktop and mobile. Screenshots are stored in `qa/design-system-pass-desktop.png` and `qa/design-system-pass-mobile.png`.

## Data Gaps
No brand source supplied.

## Remaining Risks
Not a production brand system. Visual/aesthetic quality is not fully verified by smoke tests.
