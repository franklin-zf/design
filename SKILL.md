---
name: design
description: Turn supplied content or data into accurate, content-specific visual artifacts. Use for reports, dashboards, charts, posters, web experiences, HTML decks, PPT/PPTX, screenshot evidence, or design systems.
---

# Design

## Promise and Truth Floor

Make the right conclusion easy to see without changing the source. Resolve conflicts in this order: source truth and exact numbers; reproducible code-derived analysis; reader usefulness; content-specific aesthetic quality; interaction and novelty.

- Every visible value is source-verbatim or code-derived. Preserve numbers, units, signs, dates, names, identifiers, quoted wording, and meaning.
- Transformations, aggregation, ranking, conversion, chart scales, and mark positions come from executable code with tests and provenance.
- Never fabricate data, sources, quotes, screenshots, UI states, or provenance. Label generated diagrams and mockups as schematic.
- Mechanical validation is only a floor. Do not ship placeholders, unsupported capabilities, unreviewed derived values, or unresolved blocking/major findings.
- Apply H0 requirements plus H1 truth, H2 reader narrative, H3 visual system, H4 composition, and H5 delivery from `references/design-standards.md`. Artifacts and speaker notes use audience-facing business language; production evidence stays internal. Preserve material uncertainty, citations, and synthetic-content disclosure. No content obstruction is acceptable.

## Core Workflow

1. **Define** the audience, reader job, scenario, target surface, source identity,
   requirements, format, and risk lane. Freeze raw evidence, then build one
   canonical content ledger, one content handoff, and requirement verification.
   Preserve exact facts, numbers, claim strength, caveats, and prohibited claims.
2. **Resolve** one Taste Contract, one primary preset, at most one supporting
   preset, and one production design system. The existing design-profile resolver
   remains the only routing authority. Compare two independent structures only
   when direction is genuinely open; history and recipe variations are opt-in.
3. **Build** the complete static state first. Prove the first viewport, densest
   content, critical error, and narrow screen with real content and final-grade
   assets, then expand the full artifact. Add interaction or motion only for a
   named reader task. Keep one icon family and local, licensed assets.
4. **Verify** non-compensating Requirement/Truth, Function, Surface, Craft, and
   Ownership gates on the real target surface. Bind P0/P1 evidence, require
   Reviewer v4 craft and operational checks where applicable, then hand off exact
   paths, `Lane`, `Proven`, `Not proven`, and the smallest `Next` action.

Use `references/workflow.md` for the executable path and select at most one
task-specific reference such as `report-dashboard.md`, `deck-ppt.md`, or
`poster-design.md`. Load `advanced-assurance.md` only for Assured work.

## Taste Contract

Record five content-specific decisions:

```json
{
  "visual_thesis": "What the composition must make clear",
  "content_tension": "The contrast, hierarchy, or change that must become visible",
  "signature_move": "At most one memorable visual action and its reader value",
  "anti_reference": "What this must not resemble and why",
  "restraint_rule": "What stays deliberately quiet or is removed"
}
```

Generic adjectives, palette names, preset ids, and library names do not satisfy the contract. Keep one visual system, one primary attention region per surface, and at most one signature move. Reject decorative component collages, filler media, fake screenshots, and motion without a semantic job.

## Risk Lanes

| Lane | Use when | Floor |
| --- | --- | --- |
| `Express` | Reversible internal exploration without source-backed/derived claims | Core rules, Taste Contract, structural checks, one real-surface review |
| `Standard` | Ordinary source-backed artifact | Source identity, applicable claim mapping, target-surface QA, independent content/visual review |
| `Assured` | Derived values, sensitive/untrusted input, publication, formal decisions, consequential interaction, or explicit high assurance | Complete provenance, controlled execution, external evidence binding, independent release review |

Unknown material risk escalates. A requested lane is a floor, never a downgrade. Assured plans, role handoffs, evidence bundles, and attestations live only in `references/quality-bar.md`; ordinary work does not create them for ceremony.

## Runtime Contract

```bash
node scripts/design.mjs profile <brief.json> --artifact-type=<ppt-handoff|html-deck|poster> [--out=design-profile.json]
node scripts/design.mjs plan <request.json> --design-profile=design-profile.json [--out=execution-plan.json --shadow]
node scripts/design.mjs check <artifact-dir> [--profile=express|standard|assured] [--execution-plan=execution-plan.json] [--require-complete-evaluation]
node scripts/design.mjs preflight [capability options]
```

Render, capture, individual validators, evaluation, and knowledge commands are
debugging or opt-in operations documented in `references/workflow.md`. Historical
records stay disabled unless the user explicitly selects a reference and scope.

## Fresh Generation Boundary

For a new design or a rejected design that the user asks to redo, create a fresh artifact directory outside the skill root. Preserve the source ledger, not the previous visual DOM or CSS. Reuse a previous layout only when the user explicitly requests a revision of that layout. Never copy a rendered output back into a template and describe rebinding metadata as redesign. The local CLI validates and binds artifacts; it does not generate a visual composition.

Inspect actual-size key pages before implementing the entire set. Two directions use separate structure files and must differ in hierarchy or composition, not only accent color. Both cover the same must-keep content and bind any available requirement verification. Fix density by editing the approved summary, reflowing, or splitting pages; never shrink essential text to pass overflow checks. Recheck the complete content and requirement evidence after any visual change.

## Creative Fallback

Start with `content_native`: derive the composition from comparison, sequence, hierarchy, scale, or tension in the source. An explicitly selected `external_reference` or approved `knowledge_recombination` can supply a method, never current facts or an automatic default. Generate two materially different directions when the lane requires it, name the avoided default, and keep the signature move to zero or one.

Checks for `ppt-handoff`, `html-deck`, and `poster` require the same digest-valid execution plan used for generation. `ppt-handoff` means handoff only unless native PPTX capability and target-player evidence are separately verified.

## Load Only What You Need

- Default: this file plus `references/workflow.md`.
- Add one task reference: reports/charts `references/report-dashboard.md`;
  decks/PPT `references/deck-ppt.md`; posters
  `references/poster-design.md`; source-heavy work
  `references/source-integrity.md`; media/icon work
  `references/media-design.md`.
- For responsive HTML applications or dashboards, also load
  `references/web-interface-standards.md` before resolving layout, controls, or
  interaction behavior.
- Load `references/advanced-assurance.md` and `references/quality-bar.md` only
  for Assured or formal release evidence.
- Load `references/visual-recipes.md`, design history, or knowledge tooling only
  when the user explicitly requests variation or reference reuse.

Use the implemented `expressive-web`, `operational-product`, and `editorial-evidence` systems only inside their declared task boundaries. Never call an HTML handoff native PPTX, a generated mockup a screenshot, an internal review user validation, or a structural pass aesthetic approval.
