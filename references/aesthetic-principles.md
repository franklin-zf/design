# Aesthetic Principles

Aesthetic quality is not decoration. For this skill, aesthetics means the artifact makes the right thing easy to see, preserves the truth of the source, and matches the audience's reading mode.

## Product Promise

Make the correct claim, evidence, state, or action easier to understand while keeping the artifact truthful, quiet, legible, and complete without interaction or motion.

Use this priority order when two design goals conflict:

1. source truth, numeric fidelity, units, caveats, and semantic reading order;
2. reader job and first-view hierarchy;
3. evidence and action clarity;
4. static completeness, accessibility, and target-surface compatibility;
5. interaction utility;
6. motion, material treatment, and novelty.

Do not trade a higher item for a lower item. A visually memorable treatment fails when it changes meaning, delays evidence, hides a caveat, weakens accessibility, or has no complete fallback.

## Source Principles

Use these principles as operating constraints:

- Content first: visual treatment must clarify the reader's task instead of showing the maker's style.
- Truthful encoding: position, length, area, color, and scale must not exaggerate or hide differences.
- Hierarchy before ornament: spacing, type scale, grouping, and contrast should explain priority before any decorative treatment is added.
- Restraint with purpose: borders, cards, shadows, images, motion, and accents are allowed only when they separate layers, focus attention, or support memory.
- Context-fit density: dashboards can be dense and scannable; reports need reading rhythm; decks need sequential contrast; chart frames need one unmistakable takeaway.
- Platform humility: HTML, PPT handoff, screenshot boards, and dashboards have different constraints. Do not claim fidelity that the surface cannot support.

## Expression Ladder

Choose the lowest level that completes the reader job:

| Level | Purpose | Admission condition | Required fallback |
| --- | --- | --- | --- |
| `L0-static` | Present the complete claim, evidence, caveat, source, control label, and reading order without interaction. | Default for every artifact and required before enhancement. | None. This is the fallback contract. |
| `L1-interactive` | Let the reader inspect, compare, filter, configure, disclose, or act. | The interaction answers a named reader question or performs a named task. The default view remains useful, and no meaning is hover-only. | A labeled default state plus visible access to essential detail. PPT uses a selected state, annotation, appendix, or small multiple. |
| `L2-motion` | Explain state, direction, sequence, rhythm, evidence emphasis, or completion feedback. | The semantic job is named and is materially clearer than at L0/L1. | A complete final state, reduced-motion behavior, static HTML behavior, and PPT handoff. |

`L1` does not imply `L2`. `L2` is never the default merely because the output surface supports animation. If an enhancement is removed, all source-backed meaning, numbers, units, labels, caveats, and source notes must remain unchanged.

## Attention Budget

Attention is a finite content resource. Spend it on the most important relationship, not on the number of available effects.

- Every viewport or slide has exactly one `primary_attention_region`.
- Every artifact has at most one `signature_move`. It may recur only when the same semantic relationship recurs and the repetition remains quiet.
- The default `ambient_field_count` is `0`. A value of `1` requires a named content purpose, verified text contrast, no competition with evidence or controls, and a static removal path.
- Evidence, source, caveat, and operational-control regions must not contain competing high-salience motion.
- Use type, spacing, grouping, position, and contrast before glow, blur, shadow, depth, or motion.
- Repeated monitoring surfaces should remain stable. Local action feedback is allowed; recurring entrance animation is not.

Reject a direction when two or more regions compete for first attention, when a background is more salient than the claim, or when removing an effect does not reduce comprehension.

## Aesthetic Contract

Every non-schematic artifact should record or satisfy the existing contract plus these product decisions:

- reader job and reading mode;
- immutable source facts and evidence order;
- `visual_thesis`, `content_tension`, and a content-specific ownership reason;
- selected style preset and why it fits the content;
- typography roles for title, section, body, labels, and numeric values;
- spacing rhythm and density level;
- chart palette policy and semantic color policy;
- visual hierarchy for primary claim, evidence, caveats, and source notes;
- `expression_level`: `L0-static`, `L1-interactive`, or `L2-motion`;
- `semantic_job` for every non-basic component or motion;
- `reader_value`: what becomes harder to understand or do when the enhancement is removed;
- `attention_budget` with `primary_attention_region`, `signature_move_count`, and `ambient_field_count`;
- complete `static_html`, `reduced_motion`, and `ppt_handoff` fallbacks when applicable;
- component provenance and the selected component decision from `references/component-library.md`;
- selected and rejected directions with evidence-based reasons;
- responsive behavior for mobile or narrow surfaces;
- visual QA evidence or an explicit remaining risk.

Do not satisfy the contract with a preset, template id, component name, library name, or adjectives such as "clean", "premium", "modern", "professional", "bold", or "elegant". These labels do not explain reader value.

## Artifact-Specific Gates

### Reports

- Start with the answer and decision context.
- Use fewer framed surfaces than content groups; whitespace and headings should carry most hierarchy.
- Charts support claims and must include unit, source, denominator or cohort when relevant.
- Caveats must be visible without visually competing with the primary answer.

### Dashboards

- The default view must be useful without interaction.
- KPI strips need movement/context, not isolated numbers only.
- Trend, driver, guardrail, and detail-table regions must contain real content or be removed.
- Dense layouts should still preserve scan order: outcome, movement, drivers, details, freshness.

### Chart Frames

- One chart answers one question.
- Axes, baseline, scale, sample size, and units must be declared.
- Use direct labels when they reduce lookup effort.
- Avoid hand-coded mark sizes unless they are generated from the data scale and the scale is declared.

### Decks And PPT Handoffs

- Slides need rhythm: claim, evidence, breath, transition, close.
- Avoid three consecutive slides with the same visual weight.
- Long titles and Chinese text need responsive wrapping and mobile-safe fallback.
- Evidence slides must not become unreadable just to preserve a dramatic layout.

### Tweakable Artifacts

- Controls should expose meaningful design decisions, not arbitrary knobs.
- Defaults must be polished before tweak controls are considered useful.
- Saved state and reset behavior must be smoke-tested when controls are part of the deliverable.

## Anti-AI-Slop And Rejected Patterns

Reject these defaults unless a source-backed, content-specific reason and a quieter alternative are recorded:

- purple, indigo, cyan, or pink trust gradients used as generic polish;
- dark neon heroes, glowing borders, glass panels, spotlight fields, particles, grids, waves, or cursor effects applied regardless of subject;
- card-per-paragraph layouts, nested cards, equal-weight bento grids, and excessive pill-shaped labels;
- multiple accent colors, multiple type personalities, or multiple motion grammars in one artifact;
- decorative 3D objects, fake device screenshots, fake charts, fake product UI, emoji icons, and filler copy;
- large titles that displace evidence, tiny evidence used to preserve drama, and atmospheric images that do not reveal the actual subject;
- generic fade-up on every section or slide, looping backgrounds, autoplay, parallax, tilt, glare, or cursor-following without a semantic job;
- library collage: mixing visually distinctive patterns from multiple authors without normalizing tokens, states, geometry, and motion;
- decorative controls, hover-only meaning, unfamiliar controls for familiar actions, or feedback that is more prominent than the action outcome;
- geometry, glow, size, animation, or connectors that imply unsupported magnitude, priority, sequence, or causality.

A pattern is not forbidden because it is popular. It is rejected when it has no content job, creates false meaning, competes for attention, breaks the target surface, or cannot meet the fallback and accessibility contract.

## Review Rubric

Use this scale in `quality-report.md` when manual visual review is performed:

| Dimension | Pass condition |
| --- | --- |
| Content fit | Artifact shape matches the reader job and available material. |
| Content ownership | The reviewer can explain why the composition belongs to this content using the reader job, visual thesis, tension, evidence, signature move, and restraint rule. |
| Hierarchy | Primary answer, evidence, caveats, and sources have distinct visual priority. |
| Truthfulness | Visual encoding preserves scale, units, sample size, and uncertainty. |
| Typography | Text is legible, wrapped, and sized for the surface and language. |
| Color | Colors come from the active preset and do not carry meaning alone. |
| Density | The surface is neither empty shell nor overloaded wall. |
| Responsiveness | Mobile/narrow rendering remains readable and non-overlapping. |
| Expression level | The artifact uses the lowest sufficient L0/L1/L2 level and names the semantic job for every enhancement. |
| Attention | One region owns first attention; signature and ambient counts stay within the declared budget. |
| Fallback | Static HTML, reduced-motion, and PPT states preserve meaning and reading order. |
| Coherence | Components inherit the active template tokens and do not introduce a second visual or motion system. |
| Finish | No placeholders, dashed unfinished containers, or internal planning notes remain. |

Mechanical checks can reject missing fields, unsupported patterns, broken fallbacks, and structural violations. They cannot prove content ownership or aesthetic quality. Final aesthetic acceptance remains an independent human review of the real rendered surface.
