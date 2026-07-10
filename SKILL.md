---
name: design
description: "Universal multi-agent design skill for summarizing and processing user-supplied content or data into beautiful, accurate visual reports and presentation artifacts: source-backed analytical reports, dashboards, charts, posters, HTML decks/PPT handoffs, screenshot/UI evidence boards, tweakable HTML artifacts, and design-system-aligned deliverables. Use when Codex must choose, design, build, review, or validate an accurate and polished data/content presentation, poster, deck, report, dashboard, or visual artifact across Codex, Claude-compatible, or other agent runtimes."
---

# Design

## Core Promise

Turn user-supplied content or data into a beautiful, accurate visual report that makes the right answer easy to see. Preserve raw source values exactly. Allow derived analysis only when reproducible code produces and records it.

Design uses this ordered priority hierarchy:

1. immutable source truth;
2. reproducible code-derived analysis;
3. source-preserving synthesis;
4. reader usefulness and complete visible communication;
5. aesthetic delivery quality.

The order resolves conflicts, but `ready` requires all applicable levels. Beauty cannot compensate for altered data or unsupported calculations. Accuracy and auditability do not excuse a visually weak deliverable.

For substantial artifacts, the skill operates as a three-role design studio plus a code-owning execution function:

- `poster` turns source material into decision-useful reporting and may propose analytical relationships, but never performs calculations.
- `designer` turns the narrative into a coherent visual system.
- a code-owning builder or analyst executes calculations and writes derived artifacts with reproducible evidence.
- `reviewer` challenges source fidelity, calculation lineage, number integrity, logic, and aesthetic finish.

## Operating Contract

Use this skill when the user needs a data display, content presentation, analytical report, dashboard, poster, HTML deck, PPT handoff, screenshot evidence board, or design-system-aligned visual artifact.

The work has three required controls:

1. Control input: identify audience, source materials, data status, summary constraints, style constraints, artifact surface, and missing evidence before building.
2. Control process: choose the artifact shape first, snapshot immutable source identity, run poster/designer/reviewer handoffs when the work is broad or high-risk, execute every derived calculation in code, then lock the layout, build from registered templates, and validate with the smallest checks that cover the risk.
3. Control output: ship file-backed artifacts with manifests, quality reports, validation evidence, assumptions, and explicit non-claims.

## Reference Map

Read only the references needed for the requested artifact:

1. Always read `references/intake-direction-gate.md`, `references/data-integrity-and-calculation.md`, `references/workflow.md`, `references/shape-selection.md`, `references/input-contract.md`, `references/output-contract.md`, `references/content-summary.md`, `references/source-and-claims-policy.md`, and `references/checklist.md`.
2. Read `references/role-architecture.md` and `references/multi-agent-protocol.md` when the task is broad, source-backed, aesthetic-sensitive, PPT/deck-oriented, or explicitly asks for multiple agents.
3. Read `references/capability-map.md` when the user asks for broad, Open Design-like, PPT-like, or multi-output capability.
4. Read `references/data-visualization.md` for quantitative charts, scorecards, reports, or dashboards.
5. Read `references/report-dashboard.md` for durable analytical reports or monitoring dashboards.
6. Read `references/deck-ppt.md` for HTML decks, PPT handoffs, slide plans, or presentation narratives.
7. Read `references/aesthetic-principles.md`, `references/design-system.md`, `references/style-presets.md`, `references/anti-ai-slop.md`, and `references/motion-policy.md` when a brand, style, theme, or visual direction matters.
8. Read `references/template-library.md`, `references/template-adoption-plan.md`, and `references/template-index.md` before selecting, adopting, or modifying a template.
9. Read `references/image-design.md` whenever the artifact may need images, screenshots, icons, Mermaid, mind maps, system maps, process diagrams, or web-sourced imagery.
10. Read `references/screenshot-ui-evidence.md` when the artifact uses screenshots, UI captures, evidence walls, or before/after redesigns.
11. Read `references/poster-design.md` for posters, one-message visual briefs, social cards, launch visuals, and campaign boards.
12. Read `references/swiss-layout-lock.md` for Swiss/Guizang-inspired decks, PPT handoffs, generated schematics, image slots, and layout rhythm.
13. Read `references/validation.md` before claiming the artifact is ready.

## Execution Workflow

1. Run the direction gate from `references/intake-direction-gate.md`. If artifact type, goal, or use scenario is missing, present two or three content-specific directions, ask only for the missing fields, and pause generation until the user confirms a direction.
2. Intake the remaining brief and materials. Ask only for missing inputs that materially change artifact shape, data truth, style, or delivery surface.
3. Choose the artifact shape before designing: `data-report`, `dashboard`, `chart-frame`, `poster`, `html-deck`, `ppt-handoff`, `screenshot-evidence`, `tweakable-artifact`, `design-system`, or `multi-artifact`.
4. Snapshot source identity before synthesis. Treat raw files and values as immutable; record source paths and hashes when the artifact is source-backed.
5. Lock the contract: audience, source materials, summary policy, data policy, style preset/design system, delivery surface, output files, and validation gates.
6. For broad, deck/PPT, source-backed, or aesthetic-sensitive work, run or write the three role handoffs from `references/role-architecture.md`: poster brief, designer visual plan, and reviewer acceptance criteria. Poster starts from the confirmed direction, not from an unbounded source dump.
7. Route Poster analysis requests to a code-owning role. Every non-verbatim value, transform, aggregation, ranking, conversion, scale, or chart mark must be produced by executable code and returned as a derived artifact with provenance and test evidence.
8. Plan the layout before writing HTML or slides. Decks need a slide plan; posters need `poster-plan.json`; reports need a report spine; dashboards need a metric model; charts need a chart contract; visually ambitious artifacts need an aesthetic contract.
9. Select templates from `assets/templates/registry.json` and `references/template-adoption-plan.md`. Record the reader-job fit, source asset, action (`adopt|adapt|reference-only`), license, modifications, and rejected alternatives.
10. Decide the image/diagram/icon strategy from `references/image-design.md`. For decks, include at least one explicit decision per slide: no image needed, local image, sourced image, generated schematic, Mermaid/flowchart, mind map, screenshot, icon, or chart.
11. Build from registered production templates or established local patterns. Do not author a production deck from a shallow generic seed when a deeper adopted or adapted template fits.
12. Generate `manifest.json`, `index.html`, and `quality-report.md` for every HTML artifact. Decks also need `slide-plan.json`; posters also need `poster-plan.json`; Open Design-like systems need a design-system package or explicit design-system link. Code-derived artifacts also need calculation code, tests, derived output, and `data-provenance.json` as defined in `references/data-integrity-and-calculation.md`.
13. For artifacts with derived values, run `node scripts/validate-data-provenance.mjs <artifact-dir> --execute-trusted` only after confirming the generated calculation code is trusted local code. The validator reruns calculation and test argv in a temporary copy, checks hashes, and blocks source mutation. Unknown external artifacts stay in static validation mode without the flag.
14. Run `node scripts/validate-design-output.mjs <artifact-dir>` on every generated artifact directory.
15. For source-backed reports, dashboards, chart frames, decks, and PPT handoffs, include `summary-map.json` for visible summaries and run `node scripts/validate-summary-map.mjs <artifact-dir>`.
16. For source-backed reports, dashboards, chart frames, and production evidence decks, include `claim-map.json` with file-backed `evidence_quotes` for verified claims, then run `node scripts/validate-claim-map.mjs <artifact-dir>`.
17. Run `node scripts/capability-preflight.mjs` before claiming browser, export, Figma, live connector, or Open Design daemon coverage. Use `--require=browser_launch` before claiming a browser can actually launch in the current host.
18. Run `node scripts/render-smoke.mjs <artifact-dir>/index.html --viewports=desktop,mobile --strict-layout` when browser overflow/overlap risk matters. For production decks, also run `node scripts/capture-deck-slides.mjs <artifact-dir>/index.html --reduced-motion` and inspect the ordered contact sheets.
19. Run `node scripts/tweakable-smoke.mjs <artifact-dir>/index.html` for tweakable artifacts with controls.
20. Run aesthetic and asset validators when their contracts are present: `validate-aesthetic-contract.mjs`, `validate-asset-contract.mjs`, `validate-layout-lock.mjs`, `validate-visual-rhythm.mjs`, `validate-poster-contract.mjs`, and `validate-poster-anti-ai-slop.mjs`.
21. Run `node scripts/validate-design-skill.mjs .` after changing this skill package.
22. For package-level validation, run `npm test`; run `npm run test:strict` when browser smoke can launch.
23. Hand off with evidence used, source and calculation provenance, validation performed, unresolved assumptions, and exact artifact paths.

## Summary Rules

When summarizing user-provided content:

- Treat supplied source files and raw values as immutable evidence.
- Preserve the original meaning.
- Preserve every number exactly as supplied.
- Use direct, clear language.
- Avoid inflated wording, abstract jargon, and unsupported emphasis.
- Classify every visible value as source-verbatim or code-derived.
- Poster may request relational analysis but must not calculate it; use reproducible code and a declared derived artifact.
- Map visible summaries through `summary-map.json` when the artifact is source-backed.

## Hard Rules

- Do not fabricate data, metrics, sources, quotes, screenshots, or provenance. If a value is illustrative, mark `schematic: true` in `manifest.json`.
- Do not edit or overwrite supplied source files. Raw data, labels, units, signs, thresholds, dates, identifiers, and quoted wording are immutable evidence.
- Do not perform calculations in Poster prose, prompts, slide copy, or manual HTML/CSS/SVG geometry. Every derived value and visual encoding must come from executable code with source, formula, code, test, and output evidence.
- Do not start Poster summarization or artifact generation while the direction gate is `needs_clarification`.
- Do not label generated diagrams, SVGs, or UI mockups as screenshots. Screenshot claims require a user-supplied or runtime-captured screenshot asset.
- Do not place visible text inside generated SVG assets when the Swiss deck contract is active. Use HTML labels so typography, accessibility, and review remain controllable.
- Do not rewrite user-provided numbers in summaries. No abbreviation, rounding, percent conversion, sign change, unit conversion, or newly computed number is allowed unless the exact number string appears in the supplied source quote.
- Do not change the original meaning of user-provided content when summarizing. Keep summaries direct, clear, and plain.
- Do not choose a chart or layout because it looks impressive. Choose it because it answers the reader's question.
- Do not mix deck style systems. One artifact uses one registered style preset unless the user explicitly asks for a comparison set.
- Do not use arbitrary hex colors when a preset or design system is active.
- Do not mark an artifact `ready` when visual QA is missing, semantic interpretation is unreviewed, or the default view still contains placeholder chart regions.
- Do not mark an artifact `ready` when the reviewer role has unresolved blocking or major findings.
- Do not mark a source-backed artifact with derived values `ready` when calculation code, deterministic tests, derived output, and provenance evidence are missing or unreviewed.
- Do not ship placeholder text such as unfilled task markers, `lorem ipsum`, `[必填]`, `Metric A`, or `sample content`.
- Do not ship AI-slop visual defaults: generic purple/indigo trust gradients, emoji hooks, vague words like `赋能` or `重塑`, fake glass cards, decorative abstract 3D blobs, or unexplained neon grids.
- Do not claim PPTX, PDF, Figma, plugin-marketplace, live-connector, or desktop-runtime behavior unless the environment actually provides that surface. When unavailable, produce the HTML artifact and a handoff contract.
- Do not let validator success imply external fact truth or visual perfection. It proves structural checks only.
- Do not let source accuracy become an excuse for weak visual design. A source-true artifact still needs a coherent template, content-specific composition, legibility, responsive QA, and Product and Design approval before `ready`.
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

Artifacts with code-derived values additionally contain:

```text
artifact/
├── source/
├── calculations/
├── derived/
└── data-provenance.json
```

Poster artifacts additionally contain:

```text
artifact/
└── poster-plan.json
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
  "design_system": {
    "id": "swiss-deck"
  },
  "aesthetic_contract": {
    "layout_lock": "swiss-s01-s22",
    "accent_policy": {
      "accent_2": "marker_only"
    },
    "svg_text_policy": "forbid_visible_text_in_swiss_assets",
    "motion_policy": "semantic_with_reduced_motion",
    "visual_rhythm": {
      "max_same_weight_run": 2
    }
  },
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
- `assets/templates/swiss-evidence-deck.html` — production Swiss evidence-deck shell using the adopted MIT runtime and Design-owned layouts.
- `assets/templates/poster.html` — one-message poster shell with explicit hook and anti-AI-slop checks.
- `assets/templates/tweakable-artifact.html` — parameterized artifact wrapper pattern.
- `assets/templates/registry.json` — template registry with reader-job fit, required assets, thinking references, and validation gates.
- `assets/themes/presets.json` — curated style presets.
- `design-systems/` — reusable design-system packages, including the Swiss deck package with tokens, components, previews, and source evidence.
- `assets/vendor/open-design-html-ppt/` — retained MIT notice, provenance record, base CSS, and runtime adopted from Open Design commit `1925fe6086180c7e8987ac95dead63a622c688b2`.
- `schemas/` — JSON schemas for manifests, deck plans, and chart specs.
- `scripts/validate-design-output.mjs` — artifact validator.
- `scripts/validate-data-provenance.mjs` — source/code/test/output hash and trusted temporary execution validator.
- `scripts/capture-deck-slides.mjs` — per-slide desktop, mobile, and reduced-motion capture validator.
- `scripts/validate-deck-capture-set.mjs` — exact capture-set validator against `slide-plan.json`; rejects clone pages, stale captures, and missing viewports.
- `scripts/capture-deck-contact-sheets.mjs` — waits for all canonical slide images to decode, rebuilds normal/reduced contact sheets, and rejects stale aggregates.
- `scripts/validate-design-system-package.mjs` — Open Design-style design-system package validator.
- `scripts/validate-aesthetic-contract.mjs` — aesthetic contract validator.
- `scripts/validate-asset-contract.mjs` — visual asset provenance, slot, and SVG text-policy validator.
- `scripts/validate-layout-lock.mjs` — Swiss/Guizang layout registry validator.
- `scripts/validate-visual-rhythm.mjs` — repeated visual-weight and layout-rhythm validator.
- `scripts/validate-poster-contract.mjs` — poster-plan and primary-message validator.
- `scripts/validate-poster-anti-ai-slop.mjs` — poster AI-slop and inflated-language validator.
- `scripts/validate-summary-map.mjs` — visible-summary source, number, and plain-language validator.
- `scripts/validate-claim-map.mjs` — claim-to-source binding validator.
- `scripts/validate-code-style.mjs` — dependency-free package code-style validator.
- `scripts/tweakable-smoke.mjs` — interaction smoke for tweakable artifacts.
- `scripts/capability-preflight.mjs` — runtime capability preflight.
- `scripts/expect-fail.mjs` — negative-fixture helper.
- `scripts/validate-design-skill.mjs` — package shape validator.
- `examples/` — passing and failing fixtures for validator checks.

## Borrowed Capability Model

This skill adopts a minimal MIT-licensed Open Design HTML deck runtime and adapts Guizang concepts into Design-owned components:

- Open Design: retained license, provenance record, base slide primitives, keyboard/presenter runtime, typed contracts, and validator architecture.
- Guizang: reference-only semantic layout discipline, projection typography, registered layouts, slide rhythm, image slots, and static/reduced-motion behavior; standalone AGPL implementation code is not copied.
- Data Analytics pattern: chart choice starts from the analytical question, data grain, denominator, and final surface.
- Presentations pattern: narrative first, audience-facing copy, no unintended overlap, legible typography, visual QA before handoff.

See `references/capability-map.md` for the parity matrix and limitations.
