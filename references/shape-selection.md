# Shape Selection

Use this when the brief does not already name the artifact type.

## First Question

What job must the reader/viewer do after opening the artifact?

| Reader job | Shape |
| --- | --- |
| Understand one answer and evidence | `data-report` |
| Monitor ongoing status | `dashboard` |
| Inspect one relationship or comparison | `chart-frame` |
| Persuade or present in sequence | `html-deck` or `ppt-handoff` |
| Compare screenshots or UI evidence | `screenshot-evidence` |
| Explore style variants | `tweakable-artifact` |
| Reuse a visual language | `design-system` |
| Need multiple surfaces | `multi-artifact` |

## Routing Rules

- If the user asks for a decision memo with data, choose `data-report`.
- If the user asks for recurring metrics, filters, drilldown, or monitoring, choose `dashboard`.
- If the user asks for "make this chart better", choose `chart-frame`.
- If the user asks for a talk, keynote, PPT, pitch, class, roadshow, or presentation, choose `html-deck` unless native PPTX runtime is available and requested.
- If the source is mostly screenshots, choose `screenshot-evidence`.
- If the user asks for knobs, variants, or live adjustment, choose `tweakable-artifact`.

## Multi-Artifact Rule

Use `multi-artifact` only when the deliverables have different reader jobs, such as an executive report plus a presentation deck. Do not create multiple outputs just because the skill can.
