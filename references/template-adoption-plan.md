# Template Adoption Plan

## Objective

Replace shallow generic seeds with production-grade visual-report templates while preserving Design's source, calculation, provenance, and readiness contracts. Template depth must come from real executable assets and rendered fixtures, not `inspired` labels.

## Implemented P1 Slice

The first production slice is `swiss-evidence-deck-production`:

- adopted verbatim from Open Design `html-ppt` under its nested MIT license: `LICENSE`, `base.css`, and `runtime.js` at commit `1925fe6086180c7e8987ac95dead63a622c688b2`;
- Design-owned `swiss-evidence-deck.html` and `design-systems/swiss-deck/layouts.css`;
- nine source-backed semantic layouts with process, system, metric, comparison, screenshot, control, cover, statement, and decision-close roles;
- executable data provenance, deterministic negative tests, desktop/mobile/reduced-motion captures, and ordered contact sheets;
- standalone Guizang AGPL code remains reference-only and is not copied.

## Adoption Vocabulary

- `adopt`: copy named code/assets under a verified license, retain required notices, record modifications and dependencies.
- `adapt`: reimplement layout grammar or interaction behavior in Design-owned tokens/components without copying example content or distinctive brand signatures.
- `reference-only`: use for taste comparison; do not ship the source code, assets, demo content, or substantially similar identity.

## Source And License Gate

| Source | Local license evidence | Default action |
| --- | --- | --- |
| Open Design repository | Apache-2.0 root license | Adapt repository-level patterns after checking nested template licenses. |
| Open Design `design-templates/html-ppt` | MIT, copyright 2026 lewis | Adopt selected runtime, base, layout, theme, and render assets with notice and dependency inventory. |
| Open Design finance report, clinical case report, live dashboard | Covered by repository or nested license only after file-level check | Adapt information architecture; do not import before license record exists. |
| Standalone `guizang-ppt-skill` | AGPL-3.0 | Adapt high-level semantic layout grammar. Direct copying requires an explicit AGPL distribution/source-availability decision. |
| Open Design packaged Guizang example | Separate MIT metadata exists locally | Do not use as a license shortcut until file identity, provenance, and history are reconciled with the standalone AGPL source. |

This is an engineering provenance gate, not legal advice.

## Wave 1: Production Foundation

Adopt from Open Design `html-ppt`:

- `assets/base.css` for tokenized deck primitives;
- `assets/runtime.js` for navigation, overview, and presenter behavior;
- `scripts/render.sh` workflow as a rendering reference;
- selected MIT themes: `corporate-clean.css`, `swiss-grid.css`, `editorial-serif.css`, and `minimal-white.css`;
- single-page layouts: `cover.html`, `comparison.html`, `timeline.html`, `process-steps.html`, `flow-diagram.html`, `arch-diagram.html`, `kpi-grid.html`, `table.html`, `chart-bar.html`, `chart-line.html`, `image-hero.html`, `image-grid.html`, `roadmap.html`, `gantt.html`, `pros-cons.html`, and `thanks.html`;
- full-deck structures: `pitch-deck`, `product-launch`, `tech-sharing`, and `presenter-mode-reveal` only where the reader job fits.

Required Design changes:

- replace demo content with source-bound slots;
- remove themes that violate Design anti-AI-slop rules;
- remove unsupported synthetic metrics;
- bind every component to template, layout, source, and calculation ids;
- bundle or explicitly declare external dependencies;
- preserve reduced-motion, static, responsive, and offline fallbacks.

## Wave 1: Swiss Evidence Deck

Adapt from Guizang's semantic layout grammar:

- comparison and split statement;
- vertical and horizontal timelines;
- three-layer architecture and system diagram;
- loop/process form;
- KPI tower, horizontal bar, and stacked ledger;
- technical specification sheet;
- image hero and evidence grid;
- risk/control page and decision close;
- theme rhythm, image-slot ratios, semantic motion, static mode, and reduced motion.

Implementation rule: build Design-owned components and tokens. Do not copy standalone AGPL `template*.html` or `motion.min.js` into the package unless the explicit AGPL path is selected and documented.

Acceptance for the first deck fixture:

- 8-10 source-backed slides;
- at least 6 distinct semantic layouts;
- no three consecutive body slides with the same structure;
- cover, comparison/timeline, structure, exact-data, image/evidence, risk, and decision close represented;
- all visible values trace to immutable source or code-derived output;
- applicable source, calculation, asset, aesthetic, layout, rhythm, responsive, static/reduced-motion, and manual taste gates pass without skip.

## Wave 2: Visual Report Families

Adapt these Open Design information architectures after file-level license review:

| Family | Source | Design target |
| --- | --- | --- |
| Decision report | `design-templates/finance-report/`, `clinical-case-report/` | answer hero, evidence band, exact-value table, caveat rail, provenance footer, print CSS |
| Operational dashboard | `design-templates/live-dashboard/` | outcome, trend, driver, guardrail, detail, freshness/stale states |
| Editorial research brief | Open Design editorial decks plus Guizang editorial layout grammar | quote/evidence plates, image-caption pairs, comparisons, section transitions |
| Visual evidence board | Guizang image grids/slots plus current screenshot contract | source/capture metadata, crop disclosure, media truth, before/after comparison |

## Provenance Record

Every adopted or adapted asset must record:

```text
source_repository
source_path
source_commit
license_id
copyright_notice
retrieved_at
local_destination
action: adopt|adapt|reference-only
modifications
third_party_dependencies
anti_copy_review
implementation_status: planned|implemented|validated
```

## Non-Claims

This plan does not mean the templates are already present in Design. Adoption is complete only when files, provenance records, source-backed fixtures, desktop/narrow screenshots, validator evidence, and Product and Design approval exist.
