# Design System

## Accepted Sources

- User-supplied `DESIGN.md`, brand guide, CSS tokens, existing app, screenshot, or deck.
- This skill's presets in `assets/themes/presets.json` when no brand source exists.

## Minimal Design System Shape

```text
design-system/
├── DESIGN.md
├── tokens.css
├── manifest.json
└── assets/
```

## Required Decisions

- typography roles: display, body, mono;
- palette: surface, text, muted, accent, positive/negative if needed;
- density: airy, normal, dense;
- corner radius and stroke system;
- chart palette policy;
- motion level;
- accessibility constraints.
- type scale and spacing scale;
- visual hierarchy rules for primary, secondary, caveat, and source content;
- chart encoding rules for axes, baselines, sample size, and labels.

## Style Discipline

- Use preset tokens instead of ad hoc hex values.
- Do not use decorative gradients, blobs, or emoji icons as default polish.
- Keep dashboards utilitarian and scannable.
- Keep reports readable and source-forward.
- Keep decks rhythmical and audience-facing.
