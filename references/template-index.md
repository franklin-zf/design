# Template Index

For template selection strategy, reader-job fit, borrowed patterns, and registry metadata, read `references/template-library.md` first.

## Bundled Templates

| Template | Use | Style preset |
| --- | --- | --- |
| `assets/templates/report.html` | Analytical report shell | `neutral-analytic`, `editorial-report` |
| `assets/templates/dashboard.html` | Operational dashboard shell | `operational-dashboard` |
| `assets/templates/deck.html` | Horizontal HTML deck shell | `swiss-deck`, `magazine-deck` |
| `assets/templates/tweakable-artifact.html` | Parameterized wrapper | `tweakable-lab` |

Template metadata is registered in `assets/templates/registry.json`.

## Template Rules

- Copy a seed template into the artifact directory as `index.html`.
- Replace all double-brace tokens before validation.
- Keep semantic `data-design-id` regions.
- Decks must keep slide metadata.
- Add only the CSS and JavaScript required for the artifact.
- Use the active preset tokens; do not introduce arbitrary hex colors in generated artifacts.
- Replace dashed chart containers with real charts before an artifact is marked `ready`.
- Record selected template id, rejected alternatives, and required media in `quality-report.md`, `slide-plan.json`, or `agent-handoffs/designer.json`.

## External Templates

If a user provides a brand template, reference deck, Figma file, screenshot, or Open Design template, treat it as a source. Record what was copied, adapted, ignored, and why in `quality-report.md`.
