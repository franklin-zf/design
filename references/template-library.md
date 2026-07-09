# Template Library

## Purpose

The template module stores reusable design thinking, not only HTML files. A template entry should explain what reader job it serves, which style system it belongs to, what evidence it can carry, and what risks it creates.

## Registry

Template metadata lives in `assets/templates/registry.json`.

Required fields per entry:

```json
{
  "id": "",
  "name": "",
  "artifact_types": [],
  "style_presets": [],
  "source": "bundled|guizang-inspired|open-design-inspired|local-case",
  "best_for": [],
  "avoid_when": [],
  "required_assets": [],
  "validation_gates": [],
  "thinking_ref": ""
}
```

## Selection Rule

Choose templates by reader job and evidence shape:

| Reader job | Template family |
| --- | --- |
| executive decision | deck, report, data hero, decision close |
| source-backed explanation | report, claim-evidence slide, system map |
| operational monitoring | dashboard, KPI strip, trend/driver/detail |
| visual persuasion | deck with image hero, statement, contrast, close |
| process or architecture | system map, lifecycle pipeline, Mermaid-derived diagram |
| UI evidence | screenshot board, before/after, image grid |

## Borrowed Patterns

### Guizang PPT

Use as design discipline, not as blind copy:

- style choice before slide work;
- one style system per deck;
- registered layout skeletons;
- Swiss grid, large type contrast, image slots, motion recipes;
- image hero and evidence grids;
- static fallback for motion;
- deck rhythm planning before implementation.

### Open Design

Use as artifact discipline:

- design-system tokens;
- typed artifact contracts;
- component and template registry;
- tweakable artifacts when iteration matters;
- validation gates and quality reports;
- reusable design-system thinking separated from generated artifacts.

## Template Decision Record

For each artifact, record:

- selected template id;
- rejected templates and why;
- style preset;
- required images/diagrams/icons;
- known limitations;
- validation commands.

This can live in `quality-report.md`, `slide-plan.json`, or `agent-handoffs/designer.json`.

## Maintenance Rules

- Keep templates dependency-light and self-contained.
- Avoid hidden external runtime assumptions.
- Do not introduce arbitrary hex colors when a preset is active.
- New templates need at least one passing example or a documented manual validation case.
- If a template includes motion, it must include reduced-motion or static fallback.

