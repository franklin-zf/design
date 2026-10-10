# Design Library

## Default Product Profiles

For `ppt-handoff`, `html-deck`, and `poster`, resolve a design profile before template selection:

```bash
node scripts/design.mjs profile brief.json --artifact-type=html-deck --out=design-profile.json
node scripts/design.mjs plan request.json --design-profile=design-profile.json --out=execution-plan.json
node scripts/design.mjs check artifact --execution-plan=execution-plan.json
```

The catalogue is `design-systems/defaults/design-profile-catalogue.json`. It contains exactly six product presets, three surface contracts, seven content topologies, and deterministic routing from structured reader jobs. Product presets reference existing style presets instead of copying HEX values or font stacks.

The main preset owns the aesthetic thesis, resolved theme, typography direction, composition, media language, data-visualization language, motion, and anti-patterns. A supporting preset is optional and may contribute only topology and surface emphasis. A supplied brand reference remains `requires_verified_brand_merge`; the resolver never invents or silently applies brand tokens.

`ppt-handoff` resolves to `handoff_only`. Do not call it native PPTX without separately verified host presentation capability and target-player evidence.

## Registries

- Templates: `assets/templates/registry.json`.
- Components: `assets/components/registry.json`.
- Style presets: `assets/themes/presets.json`.
- Packaged design systems: `design-systems/`.

Examples are validator fixtures, not aesthetic proof. Promote production evidence only through repository review; it is not part of the installed runtime surface.

## Optional User-Selected History

Stable standards ship in `references/design-standards.md`. Actual code assets are indexed in `references/frontend-styles.md`. Neither requires project history. The optional repository `design-knowledge/` has no endorsed historical records by default; regression records are not design references.

Only inspect history explicitly selected by the user, after framing the current content:

```bash
node scripts/query-design-spec.mjs --artifact-type=html-deck --risk-lane=standard --signal=editorial --status=confirmed --knowledge-root=/path/to/approved-reference
```

Without the explicit root, historical retrieval is disabled. An inherited
`DESIGN_KNOWLEDGE_ROOT` does not enable it. This intentionally replaces implicit
recall behavior. A selected reference remains advisory, not a generation source.

- `reviewer_confirmed` matches rank above `candidate`; candidates are inspection-only and cannot serve as approved references. Internal review does not establish user preference.
- Project cases are method evidence, not source material. Prefer cases with the same reader job and content topology, and obey their `reuse_boundary`.
- Matches are advisory. Priority order stays: source truth > accessibility > content constraints > content-aware profile > memory. Memory never blocks a job and never overrides the profile.
- No match is a normal state: build from content signals. Do not search test fixtures or old artifacts to fill the gap.

Write memory only when requested by the user and after review:

```bash
node scripts/distill-spec.mjs /path/to/approved-artifact       # artifact -> candidate spec record
node scripts/extract-primitives.mjs design-systems/<system>    # system/artifact -> atomic primitives
node scripts/validate-design-spec.mjs design-knowledge         # gate: values trace to tokens, registry closed
```

- Distillation extracts deterministic values only (colors, typography, spacing, radius) from the bound token source. It refuses when tokens are missing rather than inventing values.
- `why_it_works`, `tags`, and `signature_move` are never machine-generated; a named reviewer fills them after independent visual QA and flips `judgment.status` to `reviewer_confirmed`.
- Primitives stay `candidate` forever; subjective confirmation belongs to the spec record they link to.
- Raw source material, sensitive data, and local-only files stay under `design-knowledge/private/` and are never indexed for sharing.

## Template Selection

Select by registry id after the reader job, evidence shape, target surface, and Taste Contract are known. Record the selected template, rejected alternatives, and why the choice fits. A base template supplies structure and base checks; source, calculation, execution, and release risk add their own gates.

Adapt the template to the content. Preserve its layout locks and design tokens where they protect rhythm, but do not force content into an incompatible slot. Record why no registered template fits when building from an established local pattern.

## Components

Use basic HTML, chart, slide, and design-system primitives first. Add no more than three distinctive components unless the artifact itself is a component catalogue. Each component requires:

- a named content or action job;
- clear reader value over a simpler primitive;
- compatible source, license, dependency, accessibility, performance, and fallback evidence;
- normalized tokens, geometry, states, and motion;
- a complete static, reduced-motion, and PPT representation when applicable.

`inspiration_only` records design reference without copying source. `blocked` records unresolved risk. Third-party site references never authorize code redistribution.

## Style Presets

Presets stabilize typography, color, spacing, density, and motion; they do not supply a point of view. Use one preset or one existing design system per artifact. Every preset carries `design-color-contract/v1`; semantic colors retain one meaning, the primary accent has a declared job, and a second accent follows its bounded mode. Validate contracts and declared token pairings with `scripts/validate-color-system.mjs`. Accent colors focus attention rather than fill empty space.

The registered presets cover neutral analytic, editorial report, Swiss deck, magazine deck, operational dashboard, and tweakable lab. Read their tokens from `assets/themes/presets.json` instead of reproducing values in prose. A preset stabilizes execution; the content relationship and Taste Contract supply the point of view.

## Design Systems

A reusable design-system deliverable needs tokens, typography roles, spacing rhythm, semantic color rules, component states, layout examples, accessibility behavior, and usage boundaries. Validate packages against the schemas under `design-systems/_schema/`.

Four production systems are packaged:

- `design-systems/swiss-deck/` for technical and decision presentations;
- `design-systems/expressive-web/` for media-led brand and product experiences;
- `design-systems/operational-product/` for repeated SaaS and operational work;
- `design-systems/editorial-evidence/` for reports, research, and sustained evidence reading.

Each system owns different task boundaries. Do not transplant the expressive media
stage into an operational dashboard, dashboard density into a brand experience, or
editorial pacing into a repeated-action queue. The Swiss deck remains one
registered system, not the universal default. Use the selected system's implemented
tokens, layouts, components, states, and usage boundary instead of improvising a
second grammar.

## Maintenance

Add a template or component only when it removes recurring complexity or represents a proven production pattern. Keep provenance and license records beside vendored assets. Remove dead registry entries rather than preserving aspirational capability claims.
