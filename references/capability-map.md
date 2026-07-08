# Capability Map

## Open Design Capability Parity

| Source capability | Skill-level replication | Runtime dependency |
| --- | --- | --- |
| Skill protocol and frontmatter | `SKILL.md`, routing description, references, scripts, assets | none |
| Typed inputs and parameters | `references/input-contract.md` plus manifest schema | host UI optional |
| Design system injection | `references/design-system.md`; use supplied `DESIGN.md` or preset | host prompt injection optional |
| Craft rules | `references/style-presets.md`, `references/checklist.md`, validator checks | none |
| HTML artifact preview | `index.html` output contract | browser for visual QA |
| Live tweak controls | `assets/templates/tweakable-artifact.html` | browser/localStorage |
| Live connectors | represented as source contract and handoff, not implemented | external connector runtime |
| Plugin marketplace | not replicated inside skill | platform |
| Desktop app UI | not replicated inside skill | platform |
| PDF/PPTX/export pipelines | handoff contracts; native generation only when external skill/tool is available | external runtime |

## Guizang PPT Capability Parity

| Source capability | Skill-level replication |
| --- | --- |
| Clarification before deck work | `references/deck-ppt.md` |
| Style A/B separation | registered presets in `assets/themes/presets.json` |
| Preset-only color | validator checks style preset, references forbid arbitrary hex mixing |
| Registered layouts | `references/deck-ppt.md` and `slide-plan.json` |
| Image slots and ratios | `data-image-slot` contract and validator checks |
| Theme rhythm | deck planning rules and quality report |
| Swiss validator pattern | `scripts/validate-design-output.mjs` |

## Additional Local Capability Parity

- Data visualization: chart selection, chart contracts, denominator/sample-size discipline, surface-specific QA.
- Reports: answer-first spine, evidence placement, caveats, source metadata, no chat-summary substitute.
- Dashboards: metric model, source freshness, filters, default view, reconciliation.
- Presentations: narrative, audience-facing copy, font/overlap/visual QA.
- Product design: context gate, visual source, interactivity level.

## Explicit Non-Claims

This package does not include a desktop daemon, app marketplace, BI connector, native Google Slides importer, native PowerPoint renderer, Figma plugin, or scheduled refresh service. It can produce contracts and handoffs for those surfaces when the host provides them.
