# Design System

## Accepted Sources

- User-supplied `DESIGN.md`, brand guide, CSS tokens, existing app, screenshot, or deck.
- This skill's presets in `assets/themes/presets.json` when no brand source exists.

## Minimal Design System Shape

```text
design-system/
├── manifest.json
├── DESIGN.md
├── USAGE.md
├── tokens.css
├── design-tokens.json
├── components.html
├── components.manifest.json
├── preview/
│   ├── colors.html
│   ├── typography.html
│   ├── spacing.html
│   └── deck.html
└── source/
    ├── evidence.md
    └── token-contract.report.json
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
- component rules for covers, content slides, charts, diagrams, evidence blocks, callouts, and closing slides.
- preview pages that show the system in real browser surfaces, not just a written style guide.
- source evidence that explains which Open Design or Guizang/PPT idea was adapted and what was intentionally not copied.

## Style Discipline

- Use preset tokens instead of ad hoc hex values.
- Do not use decorative gradients, blobs, or emoji icons as default polish.
- Treat accent colors as roles, not decoration. For `swiss-deck`, `accent_2` is a marker only.
- Keep dashboards utilitarian and scannable.
- Keep reports readable and source-forward.
- Keep decks rhythmical and audience-facing.
- Keep posters direct: one message, one hook, one reading order.

## Package Validation

Run:

```bash
node scripts/validate-design-system-package.mjs . swiss-deck
```

This checks that the design system is executable as a package: tokens, components, previews, contracts, and source evidence are all present.
