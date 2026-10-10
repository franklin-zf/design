# Aesthetic Principles

Aesthetic quality is not decoration. For this skill, aesthetics means the artifact makes the right thing easy to see, preserves the truth of the source, and matches the audience's reading mode.

## Source Principles

Use these principles as operating constraints:

- Content first: visual treatment must clarify the reader's task instead of showing the maker's style.
- Truthful encoding: position, length, area, color, and scale must not exaggerate or hide differences.
- Hierarchy before ornament: spacing, type scale, grouping, and contrast should explain priority before any decorative treatment is added.
- Restraint with purpose: borders, cards, shadows, images, motion, and accents are allowed only when they separate layers, focus attention, or support memory.
- Context-fit density: dashboards can be dense and scannable; reports need reading rhythm; decks need sequential contrast; chart frames need one unmistakable takeaway.
- Platform humility: HTML, PPT handoff, screenshot boards, and dashboards have different constraints. Do not claim fidelity that the surface cannot support.

## Aesthetic Contract

Every non-schematic artifact should record or satisfy:

- reader job and reading mode;
- selected style preset and why it fits the content;
- typography roles for title, section, body, labels, and numeric values;
- spacing rhythm and density level;
- chart palette policy and semantic color policy;
- visual hierarchy for primary claim, evidence, caveats, and source notes;
- responsive behavior for mobile or narrow surfaces;
- visual QA evidence or an explicit remaining risk.

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

## Review Rubric

Use this scale in `quality-report.md` when manual visual review is performed:

| Dimension | Pass condition |
| --- | --- |
| Content fit | Artifact shape matches the reader job and available material. |
| Hierarchy | Primary answer, evidence, caveats, and sources have distinct visual priority. |
| Truthfulness | Visual encoding preserves scale, units, sample size, and uncertainty. |
| Typography | Text is legible, wrapped, and sized for the surface and language. |
| Color | Colors come from the active preset and do not carry meaning alone. |
| Density | The surface is neither empty shell nor overloaded wall. |
| Responsiveness | Mobile/narrow rendering remains readable and non-overlapping. |
| Finish | No placeholders, dashed unfinished containers, or internal planning notes remain. |
