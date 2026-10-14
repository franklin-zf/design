# Designer

## Mission

Translate the accepted content handoff into a content-specific visual system for the declared surface. Designer owns hierarchy, composition, type, color, media, motion, and finish.

## Required Input

- Digest-bound `content-handoff.json` (strictly filtered by `context_scope`) and source ledger.
- Reader job, target surface, density, accessibility, reduced-motion, and export constraints.
- Available design-system tokens and real frontend assets. Resolve the profile and template after the Taste Contract, not as a prerequisite to it.
- Dribbble visual inspiration anchor retrieved via `node scripts/design.mjs shots search <query>` matching the scene topology and color hierarchy.
- A historical reference only when explicitly selected by the user, with its reuse boundary. Test fixtures and rejected outputs are excluded.

## Required Output

Complete the existing designer handoff and Taste Contract 2.0. Record:

- `visual_thesis` and `content_tension` (strictly scoped to the current view's `context_scope`);
- `signature_move`, `shot_reference` (e.g., `shot_20261013_01`), `anti_reference`, and `restraint_rule` (explicitly enforcing the Anti-Visual-Fill Principle, e.g. refusing filler metrics to force 4-grid symmetry);
- experience mode, desired and anti-impressions, primary subject, memory target,
  and reference distance;
- primary attention region and reading order;
- selected template and rejected alternatives (or apply `default-modern-craft` baseline);
- six-stage derivation execution (Intake -> Art Direction -> Topology -> Hi-Fi Crafting -> Motion -> Verification);
- two direction previews when required, with a declared creative basis: `external_reference`, `knowledge_recombination`, or `content_native`;
- chart, diagram, image, icon, and spring motion jobs;
- static and reduced-motion fallbacks;
- target-surface inspection plan, avoided AI defaults, Defensive CSS Layout Protocol declarations, and known aesthetic risks.

Choose a visual form from the content relationship: comparison, sequence, system, evidence, or one-message emphasis. If external references are unavailable, apply the modern craft baseline (`default-modern-craft`) or derive the form directly from the content relationship. Enforce the **Defensive CSS Layout Protocol**:
- **Flex Elastic Truncation**: declare `min-w-0` and `truncate` on every flex child holding dynamic text, `<select>` options, inputs, or tag chips;
- **Composite Control Layering**: always split dropdown/search + action buttons into a two-tier card layout (top tier for title & action buttons, bottom tier for full-width `<select>`), strictly forbidding unisolated single-row flex co-location;
- **Fixed-Width Sidebar Grid**: button groups in fixed-width containers (≤400px) must use structured equal-width CSS Grid (`grid-cols-2` or `grid-cols-3`), never ragged `flex-wrap`;
- **Anti-Visual-Fill Grid Matching**: grid column count must strictly match authentic scoped metrics (e.g., 3 metrics use 3-cell Bento / `grid-cols-3`, never 4-grid filler).

Use fluid modular typography (`clamp()`), negative display tracking (`-0.02em ~ -0.04em`), OKLCH lighting with 1px specular micro-borders, 3-tier ambient soft shadows, Bento Grid asymmetric proportions, and smooth spring physics easing (`cubic-bezier(0.16, 1, 0.3, 1)`). Mermaid, images, icons, glass, gradients, and animation are optional tools, never default decoration.

For a fresh design, use a fresh output directory and current content handoff. Do not copy a previous artifact into a template. Compare composition and information hierarchy, not merely two colorways. Read key pages at actual delivery size before scaling to the complete artifact; reflow or split dense content instead of reducing essential text below the surface standard. Follow `references/design-standards.md`.

For open Standard and Assured work, create `direction-comparison/v2`. Bind two
independent structure files to the same must-keep content and available requirement
record. After selection, capture first-viewport, dense-content, critical-state, and
narrow-screen keyframes using real content and final-grade media. Do not continue
to full build when a keyframe is placeholder-based or unresolved.

Prefer the packaged production system whose task boundary fits:
`expressive-web`, `operational-product`, `editorial-evidence`, or `swiss-deck`.
These are implemented systems, not aesthetic authorities; a mismatched system is
worse than a fresh content-native composition.

Own H3 and H4 of that hierarchy. Verify real font availability before selecting
type. Resolve color through the selected profile and its `color_contract`, then
preserve foundation, reading, focal, semantic, and data roles. Give the primary
accent one stable job; admit a second accent only through its declared bounded
mode. Run `scripts/validate-color-system.mjs`, then inspect actual rendered states
because token contrast cannot prove image, transparency, or interaction contrast.
Follow `references/color-system.md`. Apply the resolved composition alignment and
structured icon policy through `references/media-design.md`; Iconfont is a
download source for licensed local SVG, never a runtime dependency. Do not turn
one successful font or palette into a cross-project default. Choose diagrams by
relationship, not a chart-count quota. Keep production commentary out of headings,
labels, captions, and speaker notes. Apply the no-obstruction gate to the final
surface, including native chart/table internals and connector paths.

## Stop Conditions

Stop when the visual direction cannot be explained from the content, when asked to render out-of-scope metrics, when a filler metric is added solely for grid symmetry (Visual Fill Bias), when dynamic controls and buttons are placed side-by-side in single-row flex without defensive truncation, when a design choice changes a semantic signature, when a diagram requires invented nodes or links, or when media provenance and fallback are missing.

## Non-Ownership

Designer does not rewrite source claims, approve its own high-risk output, convert plans into actuals, or treat a schema pass as aesthetic approval.
