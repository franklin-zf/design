---
name: design
description: "Universal multi-agent design skill for turning data, documents, notes, screenshots, and business content into the right visual artifact: source-backed analytical reports, dashboards, charts, HTML decks/PPT handoffs, screenshot/UI evidence boards, tweakable HTML artifacts, and design-system-aligned deliverables. Use when Codex must choose, design, build, review, or validate an accurate and polished data/content presentation, deck, report, dashboard, or visual artifact across Codex, Claude-compatible, or other agent runtimes."
---

# Design

## Core Promise

Turn raw data or content into the most suitable visual form, with evidence, style discipline, multi-agent handoff, and validation. Prefer an honest artifact over a beautiful unsupported one.

For substantial artifacts, the skill operates as a three-role design studio:

- `poster` turns source material into decision-useful reporting.
- `designer` turns the narrative into a coherent visual system.
- `reviewer` challenges source fidelity, number integrity, logic, and aesthetic finish.

## Operating Contract

Use this skill when the user needs a data display, content presentation, analytical report, dashboard, HTML deck, PPT handoff, screenshot evidence board, or design-system-aligned visual artifact.

The work has three required controls:

1. Control input: identify audience, source materials, data status, summary constraints, style constraints, artifact surface, and missing evidence before building.
2. Control process: choose the artifact shape first, run poster/designer/reviewer handoffs when the work is broad or high-risk, then lock the contract, plan the layout, build from templates, and validate with the smallest checks that cover the risk.
3. Control output: ship file-backed artifacts with manifests, quality reports, validation evidence, assumptions, and explicit non-claims.

## Reference Map

Read only the references needed for the requested artifact:

1. Always read `references/workflow.md`, `references/shape-selection.md`, `references/input-contract.md`, `references/output-contract.md`, `references/content-summary.md`, `references/source-and-claims-policy.md`, and `references/checklist.md`.
2. Read `references/role-architecture.md` and `references/multi-agent-protocol.md` when the task is broad, source-backed, aesthetic-sensitive, PPT/deck-oriented, or explicitly asks for multiple agents.
3. Read `references/capability-map.md` when the user asks for broad, Open Design-like, PPT-like, or multi-output capability.
4. Read `references/data-visualization.md` for quantitative charts, scorecards, reports, or dashboards.
5. Read `references/report-dashboard.md` for durable analytical reports or monitoring dashboards.
6. Read `references/deck-ppt.md` for HTML decks, PPT handoffs, slide plans, or presentation narratives.
7. Read `references/aesthetic-principles.md`, `references/design-system.md`, and `references/style-presets.md` when a brand, style, theme, or visual direction matters.
8. Read `references/template-library.md` and `references/template-index.md` before selecting or modifying a bundled template.
9. Read `references/image-design.md` whenever the artifact may need images, screenshots, icons, Mermaid, mind maps, system maps, process diagrams, or web-sourced imagery.
10. Read `references/screenshot-ui-evidence.md` when the artifact uses screenshots, UI captures, evidence walls, or before/after redesigns.
11. Read `references/validation.md` before claiming the artifact is ready.

## Execution Workflow

1. Intake the brief and materials. Ask only for missing inputs that materially change artifact shape, data truth, style, or delivery surface.
2. Choose the artifact shape before designing: `data-report`, `dashboard`, `chart-frame`, `html-deck`, `ppt-handoff`, `screenshot-evidence`, `tweakable-artifact`, `design-system`, or `multi-artifact`.
3. Lock the contract: audience, source materials, summary policy, data policy, style preset/design system, delivery surface, output files, and validation gates.
4. For broad, deck/PPT, source-backed, or aesthetic-sensitive work, run or write the three role handoffs from `references/role-architecture.md`: poster brief, designer visual plan, and reviewer acceptance criteria.
5. Plan the layout before writing HTML or slides. Decks need a slide plan; reports need a report spine; dashboards need a metric model; charts need a chart contract; visually ambitious artifacts need an aesthetic contract.
6. Select templates from `assets/templates/registry.json` and record why the selected template fits the reader job.
7. Decide the image/diagram/icon strategy from `references/image-design.md`. For decks, include at least one explicit decision per slide: no image needed, local image, sourced image, generated schematic, Mermaid/flowchart, mind map, screenshot, icon, or chart.
8. Build from templates or established local patterns. Use `assets/templates/` as seed HTML, then adapt to the specific evidence and audience.
9. Generate `manifest.json`, `index.html`, and `quality-report.md` for every HTML artifact. Decks also need `slide-plan.json`.
10. Run `node scripts/validate-design-output.mjs <artifact-dir>` on every generated artifact directory.
11. For source-backed reports, dashboards, chart frames, decks, and PPT handoffs, include `summary-map.json` for visible summaries and run `node scripts/validate-summary-map.mjs <artifact-dir>`.
12. For source-backed reports, dashboards, and chart frames, include `claim-map.json` with file-backed `evidence_quotes` for verified claims, then run `node scripts/validate-claim-map.mjs <artifact-dir>`.
13. Run `node scripts/capability-preflight.mjs` before claiming browser, export, Figma, live connector, or Open Design daemon coverage. Use `--require=browser_launch` before claiming a browser can actually launch in the current host.
14. Run `node scripts/render-smoke.mjs <artifact-dir>/index.html --viewports=desktop,mobile --strict-layout` when browser overflow/overlap risk matters.
15. Run `node scripts/tweakable-smoke.mjs <artifact-dir>/index.html` for tweakable artifacts with controls.
16. Run `node scripts/validate-design-skill.mjs .` after changing this skill package.
17. For package-level validation, run `npm test`; run `npm run test:strict` when browser smoke can launch.
18. Hand off with evidence used, validation performed, unresolved assumptions, and exact artifact paths.

## Summary Rules

When summarizing user-provided content:

- Preserve the original meaning.
- Preserve every number exactly as supplied.
- Use direct, clear language.
- Avoid inflated wording, abstract jargon, and unsupported emphasis.
- Map visible summaries through `summary-map.json` when the artifact is source-backed.

## Hard Rules

- Do not fabricate data, metrics, sources, quotes, screenshots, or provenance. If a value is illustrative, mark `schematic: true` in `manifest.json`.
- Do not rewrite user-provided numbers in summaries. No abbreviation, rounding, percent conversion, sign change, unit conversion, or newly computed number is allowed unless the exact number string appears in the supplied source quote.
- Do not change the original meaning of user-provided content when summarizing. Keep summaries direct, clear, and plain.
- Do not choose a chart or layout because it looks impressive. Choose it because it answers the reader's question.
- Do not mix deck style systems. One artifact uses one registered style preset unless the user explicitly asks for a comparison set.
- Do not use arbitrary hex colors when a preset or design system is active.
- Do not mark an artifact `ready` when visual QA is missing, semantic interpretation is unreviewed, or the default view still contains placeholder chart regions.
- Do not mark an artifact `ready` when the reviewer role has unresolved blocking or major findings.
- Do not ship placeholder text such as unfilled task markers, `lorem ipsum`, `[必填]`, `Metric A`, or `sample content`.
- Do not claim PPTX, PDF, Figma, plugin-marketplace, live-connector, or desktop-runtime behavior unless the environment actually provides that surface. When unavailable, produce the HTML artifact and a handoff contract.
- Do not let validator success imply external fact truth or visual perfection. It proves structural checks only.
- Treat external fact truth, aesthetic judgment, accessibility completeness, and native export fidelity as external review/runtime gates unless the user provides the required evidence or tool surface.

## Style Rules

- Use one visual system per artifact unless the user asks for alternatives.
- Let the content choose the form: comparison, trend, ranking, composition, relationship, process, narrative, or evidence board.
- Favor clarity, hierarchy, spacing, legibility, and honest contrast over decorative complexity.
- Use registered presets from `assets/themes/presets.json` or an explicit user-provided design system.
- Keep generated code simple, dependency-light, and readable. Package scripts must pass `npm run validate:code-style`.

## Output Contract

Every generated artifact directory should contain:

```text
artifact/
├── index.html
├── manifest.json
└── quality-report.md
```

Deck artifacts additionally contain:

```text
artifact/
├── slide-plan.json
└── images/
```

Use this manifest skeleton:

```json
{
  "schema_version": "design-artifact/v1",
  "artifact_type": "data-report",
  "audience": "executive",
  "surface": "html",
  "style_preset": "neutral-analytic",
  "schematic": false,
  "source_materials": [],
  "data_sources": [],
  "metrics": [],
  "charts": [],
  "layouts": [],
  "assumptions": [],
  "missing_data": [],
  "unverified_items": []
}
```

## Bundled Resources

- `assets/templates/report.html` — source-backed analytical report shell.
- `assets/templates/dashboard.html` — compact operational dashboard shell.
- `assets/templates/deck.html` — horizontal HTML deck shell with slide navigation.
- `assets/templates/tweakable-artifact.html` — parameterized artifact wrapper pattern.
- `assets/templates/registry.json` — template registry with reader-job fit, required assets, thinking references, and validation gates.
- `assets/themes/presets.json` — curated style presets.
- `schemas/` — JSON schemas for manifests, deck plans, and chart specs.
- `scripts/validate-design-output.mjs` — artifact validator.
- `scripts/validate-summary-map.mjs` — visible-summary source, number, and plain-language validator.
- `scripts/validate-claim-map.mjs` — claim-to-source binding validator.
- `scripts/validate-code-style.mjs` — dependency-free package code-style validator.
- `scripts/tweakable-smoke.mjs` — interaction smoke for tweakable artifacts.
- `scripts/capability-preflight.mjs` — runtime capability preflight.
- `scripts/expect-fail.mjs` — negative-fixture helper.
- `scripts/validate-design-skill.mjs` — package shape validator.
- `examples/` — passing and failing fixtures for validator checks.

## Borrowed Capability Model

This skill borrows architecture patterns from Open Design and Guizang PPT without depending on their runtime:

- Open Design pattern: skill metadata, typed inputs, design-system injection, craft gates, artifact contracts, tweakable artifacts, and validators.
- Guizang pattern: clarify before deck work, separate style systems, preset-only themes, registered layouts, slide rhythm, image slots, and deck validators.
- Data Analytics pattern: chart choice starts from the analytical question, data grain, denominator, and final surface.
- Presentations pattern: narrative first, audience-facing copy, no unintended overlap, legible typography, visual QA before handoff.

See `references/capability-map.md` for the parity matrix and limitations.
