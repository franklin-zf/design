# Design Skill Rules

These rules apply when working with the Design Skill in this repository.

## When This Skill Triggers

Use this skill when the task involves:
- Creating a report, dashboard, chart, poster, HTML deck, PPT handoff, or screenshot evidence board
- Reviewing or validating a visual artifact's source fidelity, layout, or aesthetic quality
- Selecting a design profile, template, or visual recipe for content
- Compiling or running an execution plan for artifact generation

## Non-Negotiable

1. **Never alter source data.** Preserve values, labels, units, signs, dates, IDs, and quoted wording exactly.
2. **Every derived value must have code provenance** — executable code, tests, derived output, and `data-provenance.json`.
3. **Do not fabricate** data, sources, quotes, screenshots, or provenance.
4. **Manual inspection of the actual rendered surface is required** for every delivered artifact at 1440 / 390 / 320 px.
5. **Validator pass ≠ aesthetic pass.** Structural validation does not prove visual quality, accessibility completeness, or real-user success.
6. **One visual system per artifact.** Reject generic AI defaults and decorative work that does not clarify the reader job.

## Risk Lanes

- **Express**: One reversible internal artifact, known direction, no source claims, no derived values, no sensitive data.
- **Standard**: Source-backed reports, dashboards, decks, or design-system handoffs without Assured triggers.
- **Assured**: Derived data, sensitive data, publication, consequential interactivity, multiple dependent artifacts, or explicit high-assurance request.

A requested profile is a floor, never a downgrade. Unknown material risk escalates one lane.

## File Conventions

- User artifacts live outside the skill root. `examples/` and `tests/fixtures/` are regression inputs, never design references. Historical reuse requires explicit user selection.
- Every HTML artifact has `index.html`, `manifest.json`, and `quality-report.md`.
- Decks add `slide-plan.json`; posters add `poster-plan.json`.
- Source-backed artifacts add `summary-map.json` and `claim-map.json` as applicable.
- Validation scripts are in `scripts/`; run them from the repository root.

## Key Commands

```bash
npm test
npm run validate -- --strict
node scripts/validate-design-output.mjs <artifact-dir>
node scripts/validate-evidence-contract.mjs <artifact-dir>
node scripts/compile-execution-plan.mjs request.json --out=plan.json --shadow
node scripts/run-execution-plan.mjs plan.json --workers=2
```

## Do Not

- Do not create a parallel content router. `scripts/lib/design-profile.mjs` is the sole runtime authority.
- Do not reference files outside the npm package closure in runtime references.
- Do not use Express wording to override an Assured trigger.
- Do not cache or auto-pass human review gates.
- Do not label internal review as `user_validated`.
