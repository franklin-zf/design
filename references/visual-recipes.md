# Visual Recipes and Profiles

## Purpose and boundary

Visual recipes describe reusable composition, material, lighting, color, typography, and accessibility mechanisms. Profiles only compose recipe IDs and provide labelled inputs. The resolver remains generic: it must not branch on `glassmorphism-card`, `editorial-ink-panel`, or any future profile slug.

This contract implements `REQ-003`, `REQ-004`, `REQ-005`, `REQ-006`, and `REQ-008`. It does not generate CSS or prove browser rendering, visual quality, contrast, performance, or accessibility. Those remain target-surface review work. Tasteful Prompt's page CSS is not copied, and its case values are not global defaults.

## Source of truth

- Registry schema: `schemas/visual-recipe-registry.schema.json`
- Production registry: `design-systems/defaults/visual-recipe-registry.json`
- Brief input: `schemas/design-brief.schema.json` → `visual_treatment`
- Resolved output: `schemas/design-profile.schema.json` → `design-profile/v2`
- Resolver and replay: `scripts/lib/design-profile.mjs`

The registry is the sole production record for recipe definitions and profile composition. Do not duplicate recipe conflict or fallback rules in prose, CLI code, renderers, or profile-specific branches.

## Input and output

A brief may select one explicit `profile_id` or provide exact `cues`. It may also declare:

- `overrides`: path-keyed `{ value, unit?, provenance }` inputs;
- `recipe_ids`: additional registered recipes, principally for explicit composition and conflict checks;
- `capabilities.backdrop_filter`;
- `background_complexity`.

Numeric inputs require a unit. Supported provenance, in descending priority, is:

1. `source-verbatim`
2. `accessibility-policy`
3. `content-constraint`
4. `profile-explicit`
5. `suggested-default`

`source-verbatim` belongs in a validated request/evidence overlay. Production profiles cannot claim that provenance. Missing exact values stay absent or retain a lower, explicit provenance; they must not be relabelled as source facts.

The resolver returns `resolved`, `profile_not_applied`, `conflict`, or `capability_fallback`, plus `profile_id`, path-keyed `decisions`, and deterministic `trace`. `design-profile/v2` binds this result and the registry digest. Replay rejects digest drift or modified decisions.

## Conflict and fallback behavior

Recipe conflicts are symmetric registry relationships. If a selected profile plus explicit recipe IDs contains an unresolved conflict, resolution fails closed; it does not pick the last registered item.

A translucent treatment degrades to `material.mode = opaque-readable` and removes `material.blur` when:

- backdrop filtering is unsupported;
- content density is `dense`; or
- background complexity is `high`.

The fallback retains semantic composition and content-role decisions. An unrelated or ambiguous request returns `profile_not_applied`, allowing the existing product/style preset path to continue without glass, purple-pink, blur, or edge leakage.

## Included proof profiles

- `glassmorphism-card`: a translucent foreground surface with one primary content group, restrained edge treatment, low-frequency background field, and readability guard. Its profile intentionally does not encode the case's 16px blur, purple-to-pink field, or 1px white edge as source facts. Those values are preserved only when supplied as `source-verbatim` overrides.
- `editorial-ink-panel`: an opaque warm-paper panel with ink hairline and editorial typography. It uses the same registry and resolver contract and contains no blur or glass-specific fields.

## Add a profile

1. Add a profile to the production registry using existing recipe IDs.
2. Add a recipe only when no existing mechanism expresses the requirement.
3. Keep every recipe ID, fallback, and conflict reference closed within the registry.
4. Add positive, unrelated, conflict, fallback, replay, and plan-binding assertions to the repository test suite.
5. Do not modify resolver selection/merge code for a style slug. If a new profile requires such a branch, stop and review the abstraction.

## Commands

```bash
node --test tests/design-profile.test.mjs
node --test tests/execution-plan.test.mjs
node --test tests/design-profile.test.mjs tests/execution-plan.test.mjs tests/json-schema.test.mjs
node scripts/design.mjs validate
```

The first two commands are focused and execution-plan regression checks. The combined command checks the directly related schema surface. Full validation may exercise browser prerequisites; report capability failures separately and never reinterpret structural tests as visual approval.

## Known limits

- Browser and screenshot validation for this slice is `not_run` by design; visual readiness is not claimed.
- The resolver consumes validated structured intent and does not infer a profile from arbitrary prompt text.
- Runtime extraction remains deferred until a second production caller proves the same pure-function contract.
- The current fallback is a semantic resolved decision, not a renderer implementation.


## Profile-local variations

A `variation_id` is resolved only after a unique semantic profile has been selected. The selected profile owns the variation namespace. Each variation is a recipe-scoped overlay and may write only the recipe/input pairs listed in that profile's `compatible_recipe_inputs`.

Resolution order is base profile inputs, selected variation, then request overrides and existing accessibility/content fallbacks. Variation inputs are always `profile-explicit`; they cannot claim or elevate to `source-verbatim`. Consequently, a validated `source-verbatim` override wins without losing its provenance, while accessibility and content constraints retain their existing priority.

No `variation_id` means the base profile with `variation_id: null` and an empty `variation_patch`. An unknown ID returns `variation_not_found`; an undeclared recipe/input returns `incompatible_recipe`. Both are fail-closed, apply no partial patch, and are rejected before a design profile or execution plan is emitted.

Variations must not introduce recipes, profiles, templates, structure, topology, state, truth, claims, facts, motion/delivery gates, or recovery contracts. If one of those semantic invariants changes, select an already-declared semantic profile upstream rather than expanding a variation.

To add a variation:

1. Reuse a recipe already used by the profile.
2. Add the exact recipe/input pair to `compatible_recipe_inputs`.
3. Add a unique profile-local variation whose inputs use `profile-explicit` provenance.
4. Add known, absent, unknown, incompatible, source-override, replay, and plan-binding tests.
5. Keep the human evidence mapping in repository research documentation; do not duplicate it into packaged runtime data.

Focused verification:

```bash
node --test tests/design-profile.test.mjs tests/execution-plan.test.mjs
```
