# Color System

## Purpose

Color is an information system, not a mood layer. Use it to establish a readable
foundation, focus attention, identify state, encode data, or preserve a verified
brand. If a hue has no stable job, remove it.

The sole selection path remains the existing design profile:

```text
reader job and content
  -> primary product preset
  -> style preset
  -> color_contract
  -> artifact tokens and target-surface review
```

Do not add a parallel palette router. Product presets describe the contextual color
job; style presets and design-system tokens contain the executable color contract.

## Source Priority

Resolve color decisions in this order:

1. Accessibility, truthful encoding, and required state meaning.
2. Verified user brand tokens with known usage and contrast behavior.
3. Content and data semantics such as selection, warning, comparison, or sequence.
4. The resolved style preset or declared design system.
5. A suggested default with explicit provenance.

A supplied logo, screenshot, image, or adjective is not permission to extract and
apply arbitrary colors. A brand merge remains unresolved until the actual tokens,
usage rules, and required pairings are verified. Accessibility never yields to a
brand token.

## Role Model

Use five layers in order:

| Layer | Roles | Rule |
| --- | --- | --- |
| Foundation | `surface`, `panel`, `panel_alt`, `line` | Carries most of the field and establishes depth without competing for attention |
| Reading | `text`, `muted` | Body and supporting text must pass their declared foreground/background pairings |
| Focal | `accent`, optional `accent_2` | One primary accent has a stable job; a second accent follows its declared bounded mode |
| Semantic | `positive`, `negative`, `warning`, `danger`, `info` | Reserved for real state or truthful diverging meaning, never section decoration |
| Data | categorical, sequential, diverging, axis, grid | Selected by relationship and scale; labels, shape, position, or pattern preserve meaning without color |

Do not use status colors as generic accents. Do not use the primary accent for
positive status unless the active contract explicitly assigns both meanings and the
surface remains unambiguous. Do not silently derive new shades in component CSS.

## Paradigms

The contract selects one paradigm through the existing style preset:

| Paradigm | Best fit | Color behavior |
| --- | --- | --- |
| `neutral-evidence` | Analysis, executive evidence, concise reports | Neutral field, one evidence accent, semantic colors only for state or diverging values |
| `editorial-ink` | Research and long-form reading | Paper/ink foundation, one editorial accent, a bounded secondary for figures or source structure |
| `swiss-signal` | Technical and decision decks | High neutral contrast, one hard signal accent, second accent restricted to markers |
| `subject-led` | Brand, product, portfolio, campaign | The real subject or verified brand owns chroma; text sits on a tested reading layer |
| `operational-state` | SaaS, CRM, monitoring, admin | Low-chroma work surface; accent marks action/selection; status colors remain local and redundant with labels |
| `controlled-exploration` | Reversible visual tuning | Bounded alternatives with the same role map and contrast floor; exploration cannot redefine truth or state |

`chroma_budget` describes attention, not a decorative quota:

- `restrained`: neutral structure dominates; one focal hue is visible at a time.
- `balanced`: a focal hue and one bounded support hue may coexist.
- `expressive`: media or brand may own a larger field, but reading and state layers remain stable.
- `controlled`: alternatives are explicit controls and do not leak into production defaults.

`max_focal_hues` excludes localized semantic status and truthful chart series.
Those are exceptions, not permission to create a multicolor interface.

## Accent Rules

Before using `accent`, write its job in the resolved product preset: selection,
primary action, interactive text, chapter, key data, focus, or brand expression.
Equivalent objects reuse the same role. A section does not receive a new color just
to look different.

`accent_2` has one of four modes:

- `forbidden`: do not use it.
- `marker-only`: small marker, rule, cursor, or bounded inverse label; never a large surface.
- `semantic-support`: one declared supporting meaning that cannot be confused with state.
- `bounded-series`: a chart or comparison series with direct labels or another redundant channel.

## Contrast and Pairings

Every preset and production design system carries `design-color-contract/v1`.
Its `required_pairings` name actual token roles, minimum contrast, and usage.

- Body, supporting, interactive, and status text require at least `4.5:1`.
- Large display text may use `3:1` only after final size and weight are verified.
- Focus indicators and essential non-text marks require at least `3:1` against adjacent colors.
- Decorative colors have no semantic authority.
- Passing token contrast does not prove rendered contrast over images, gradients,
  transparency, blend modes, disabled states, or browser-computed overlays.

Run:

```bash
node scripts/validate-color-system.mjs .
```

Then inspect the rendered surface at 1440, 390, and 320 px. Check default, hover,
focus, selected, disabled, error, success, print/PPT, and reduced-transparency
states when applicable.

## Data Color

Choose color by relationship:

- Categorical: distinct named categories, directly labeled where possible.
- Sequential: one ordered lightness path for magnitude.
- Diverging: two directions around a meaningful midpoint.
- Status: operational state, not quantitative magnitude.

Keep scales stable across comparable views. Never reorder category colors between
pages. Do not encode critical meaning only with red/green, and do not treat a
categorical palette as a decorative rotation.

## Media and Dark Surfaces

For subject-led work, derive the composition from the real subject before choosing
a palette. Media color does not become a token automatically. Place text on a
stable tested layer or verify the exact crop and state; a dark overlay is not a
universal repair.

Dark mode is a complete token and state system, not inverted text plus a dark
background. If dark-mode tokens, pairings, imagery, focus, charts, and semantic
states are not verified, declare dark mode unsupported.

## Review

Reject the direction when:

- colors are chosen from generic mood words rather than reader and content jobs;
- multiple accents compete for the same attention role;
- status colors decorate headings, cards, or chapters;
- a second accent has no declared mode;
- text or focus pairings are absent or below the contract;
- color is the only channel for category, status, or selection;
- a palette passes token checks but fails on the rendered surface;
- the result reads as one undifferentiated hue family without content justification.

The reviewer records the target surface, state, failing pair, and repair. Automatic
contrast checks are evidence for declared token pairings only; they are not an
aesthetic pass or user validation.
