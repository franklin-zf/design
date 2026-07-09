# Deck And PPT

## Deck Intake

Ask or infer:

- style preset;
- audience and setting;
- duration or slide count;
- source material and narrative goal;
- images/screenshots;
- theme color from presets;
- hard constraints.

## Narrative Arc

Default structure:

1. hook;
2. context;
3. core argument;
4. evidence or demo;
5. shift or tension;
6. recommendation or close.

Visible slide copy must face the audience. Do not expose planning notes.

Audience-facing copy must still preserve source meaning. Any slide claim or source summary must use `data-summary-id`, map to `summary-map.json`, and keep visible numbers verbatim from source quotes.

## Poster Narrative Gate

Before slide implementation, produce a poster brief:

1. reader decision;
2. one-sentence message;
3. evidence sequence;
4. risk or missing-data sequence;
5. final ask or decision close.

Do not turn every source section into a slide. A deck is a decision path, not a document dump.

## Registered Layouts

Use registered layout ids instead of inventing slide structures:

| ID | Use |
| --- | --- |
| `D01-cover` | title, subtitle, metadata |
| `D02-section` | chapter divider |
| `D03-claim-evidence` | one claim plus supporting proof |
| `D04-data-hero` | single large number or KPI tower |
| `D05-comparison` | before/after or option A/B |
| `D06-timeline` | ordered sequence |
| `D07-system-map` | process or architecture map |
| `D08-image-hero` | large image with caption and source |
| `D09-grid` | 3-6 related items |
| `D10-table` | exact lookup |
| `D11-quote` | quotation or principle |
| `D12-closing` | decision, next step, or final thought |

Every slide in `index.html` must include `class="slide"`, `data-layout`, and `data-purpose`. Every slide in `slide-plan.json` must cite source or mark schematic.

## Media And Diagram Gate

Every slide must have an explicit media decision in the slide plan:

- `none`: text-only is intentional;
- `image`: local or sourced image;
- `screenshot`: source screenshot or framed UI evidence;
- `mermaid`: process, system, dependency, or mind map;
- `chart`: quantitative visual with chart contract;
- `icon`: scan aid;
- `generated-schematic`: generated information graphic, marked schematic where needed.

For structural content, prefer a Mermaid/process/system diagram or generated information graphic over text boxes. For Swiss decks, bind local images with `data-image-slot`; use S22 image hero or S15/S16 image grids when the slide needs visual evidence.

## Motion Gate

Use motion only to reveal sequence, hierarchy, or state. Deck motion should use stable `data-animate` and `data-anim` markers or equivalent, with `prefers-reduced-motion` or a static-mode fallback. Motion is a handoff enhancement for HTML; do not claim native PPTX animation unless the PPTX runtime was verified.

## Theme Rhythm

- Avoid 3+ consecutive slides with the same visual weight.
- Alternate dense evidence with breathing slides.
- Use one style preset per deck.
- Do not mix magazine, Swiss, dashboard, and report motifs without an explicit comparison goal.
- When the user references guizang-like quality, Swiss means registered layout, image slot, grid, type contrast, motion discipline, and visual rhythm; it does not mean only blue-white coloring.

## PPTX Handoff

When native PPTX tooling is unavailable, produce:

- HTML deck artifact;
- `slide-plan.json`;
- source and image folder;
- `quality-report.md` with PPTX conversion notes.
