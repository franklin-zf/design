# Design Skill — Project Rules

This repository contains the **Design Skill**: a content-aware design system that turns user-supplied content or data into trustworthy visual artifacts.

## Core Contract

1. **Source truth is immutable.** Never alter raw values, labels, units, signs, dates, or identifiers. Every visible value is either `source-verbatim` or `code-derived` with provenance.
2. **Reader job first.** State what the reader should understand, decide, or do before choosing any shape, template, or preset.
3. **Lightest risk lane.** Choose Express → Standard → Assured based on observable risk facts, not adjectives. Unknown material risk escalates.
4. **Taste Contract before template.** Record `visual_thesis`, `content_tension`, `signature_move`, `anti_reference`, and `restraint_rule` before selecting any preset or template.
5. **Real surface inspection is mandatory.** Structural validation never proves visual quality. Every delivered artifact requires inspection of the actual rendered surface at target viewports (1440 / 390 / 320 px).

## Architecture

- `SKILL.md` — single entry point and operating path.
- `references/` — on-demand guidance loaded by task shape and risk.
- `scripts/lib/design-profile.mjs` — sole runtime authority for profile resolution, content signals, and variation admission. Do not create parallel routers.
- `assets/templates/registry.json` — authoritative template catalog.
- `schemas/` — JSON Schema definitions for briefs, profiles, catalogues, and execution plans.
- `design-systems/` — visual system presets and surfaces.
- `examples/` — validator fixtures, NOT showcases.
- `showcases/registry.json` — empty endorsement registry; no historical reference is currently approved.
- `tests/fixtures/history/` — regression inputs only; never generation context or design guidance.

## Development Rules

- Follow existing code style and module boundaries. Do not add abstraction without a current requirement.
- Run `npm test` and `npm run validate -- --strict` before delivery.
- Browser smoke tests require Playwright Chromium; set `DESIGN_PLAYWRIGHT_PATH` if not at the default location.
- All runtime references must be resolvable inside the npm package closure (`npm pack`). Run `node scripts/validate-packed-references.mjs .`.
- Git commits use `AIME <aime@bytedance.com>` as author. Branch naming: `aime/<timestamp>-<slug>`.

## Non-Goals

- Do not fabricate data, sources, screenshots, or provenance.
- Do not ship placeholders, unresolved major findings, or unreviewed derived values.
- Do not add third-party dynamic components without reading `references/frontend-styles.md` and `references/library.md` first.
- Do not treat a generated mockup as a screenshot or an internal review as user validation.
