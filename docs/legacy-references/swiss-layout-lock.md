# Swiss Layout Lock

Use this file when `style_preset` is `swiss-deck` and the artifact declares:

```json
"aesthetic_contract": { "layout_lock": "swiss-s01-s22" }
```

The goal is to stop decks from looking vaguely Swiss while ignoring the actual layout discipline.

## Rules

- Body slides must use registered `S01` through `S22` layouts.
- Covers and closers may use `SWISS-COVER-ASCII` and `SWISS-CLOSING-ASCII`.
- Do not invent `P23`, `D07-system-map`, `Swiss Image Split`, `Evidence Grid`, or similar unregistered bodies inside a locked Swiss deck.
- Top Chinese titles default to left alignment on the upper content axis.
- SVG generated assets may draw only geometry: lines, paths, circles, arrows, and fills. Visible words and numbers belong in HTML.
- Image slots must be selected before images are generated or selected.
- `S22` image hero must bind `s22-hero-21x9`.
- `S15` and `S16` multi-image grids must use consistent aspect ratios across the group.

## Registered Layouts

| ID | Name | Visual Weight |
| --- | --- | --- |
| S01 | Index Cover | cover |
| S02 | Vertical Timeline + KPI | evidence |
| S03 | Split Statement | statement |
| S04 | Six Cells | text |
| S05 | Three Layers | text |
| S06 | KPI Tower | metric |
| S07 | Horizontal Bar | metric |
| S08 | Duo Compare | comparison |
| S09 | Dot Matrix Statement | statement |
| S10 | Split Closing | close |
| S11 | Horizontal Timeline | evidence |
| S12 | Manifesto + Ink Banner | statement |
| S13 | Three Forces | comparison |
| S14 | Loop Form | diagram |
| S15 | Matrix + Hero Stat | metric |
| S16 | Multi-card Brief | evidence |
| S17 | System Diagram | diagram |
| S18 | Why Now | evidence |
| S19 | Four Cards | text |
| S20 | Stacked KPI Ledger | metric |
| S21 | Tech Spec Sheet | evidence |
| S22 | Image Hero | image-hero |

## Image Slots

| Layout | Required Slot | Aspect Ratio |
| --- | --- | --- |
| S22 | `s22-hero-21x9` | 21:9 |
| S17 | `s17-system-16x10` | 16:10 |
| S14 | `s14-loop-16x9` | 16:9 |
| S08 | `s08-map-16x9` | 16:9 |
| S21 | `s21-spec-16x9` | 16:9 |
| S15 | `s15-grid-21x9` | 21:9 |
| S16 | `s16-brief-21x9` | 21:9 |

## Quality Boundary

Passing the layout lock is not proof of great design. It proves the artifact did not violate the known Swiss skeleton. Final quality still requires visual QA and reviewer judgment.
