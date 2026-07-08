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

## Theme Rhythm

- Avoid 3+ consecutive slides with the same visual weight.
- Alternate dense evidence with breathing slides.
- Use one style preset per deck.
- Do not mix magazine, Swiss, dashboard, and report motifs without an explicit comparison goal.

## PPTX Handoff

When native PPTX tooling is unavailable, produce:

- HTML deck artifact;
- `slide-plan.json`;
- source and image folder;
- `quality-report.md` with PPTX conversion notes.
