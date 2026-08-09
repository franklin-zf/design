# Design Library

## Registries

- Templates: `assets/templates/registry.json`.
- Components: `assets/components/registry.json`.
- Style presets: `assets/themes/presets.json`.
- Packaged design systems: `design-systems/`.
- Repository-only curated production cases: `showcases/registry.json` when present.

Examples are validator fixtures, not aesthetic proof. A showcase must bind a real artifact, source identity, surface captures, and current review evidence.

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

Presets stabilize typography, color, spacing, density, and motion; they do not supply a point of view. Use one preset or one existing design system per artifact. Semantic colors retain one meaning. Accent colors focus attention rather than fill empty space.

The registered presets cover neutral analytic, editorial report, Swiss deck, magazine deck, operational dashboard, and tweakable lab. Read their tokens from `assets/themes/presets.json` instead of reproducing values in prose.

## Design Systems

A reusable design-system deliverable needs tokens, typography roles, spacing rhythm, semantic color rules, component states, layout examples, accessibility behavior, and usage boundaries. Validate packages against the schemas under `design-systems/_schema/`.

The Swiss deck is one registered system, not the universal default. When selected, use its registered layouts and token contract from `design-systems/swiss-deck/`; do not improvise a second grid or accent grammar.

## Maintenance

Add a template or component only when it removes recurring complexity or represents a proven production pattern. Keep provenance and license records beside vendored assets. Remove dead registry entries rather than preserving aspirational capability claims.
