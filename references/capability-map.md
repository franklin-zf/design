# Capability Map

## Open Design Capability Parity

| Source capability | Skill-level replication | Runtime dependency |
| --- | --- | --- |
| Skill protocol and frontmatter | `SKILL.md`, routing description, references, scripts, assets | none |
| Typed inputs and parameters | `references/input-contract.md` plus manifest schema | host UI optional |
| Design system injection | `references/design-system.md`; use supplied system or bundled `design-systems/swiss-deck` package | host prompt injection optional |
| Design-system package | `design-systems/<id>/` with manifest, tokens, components, previews, and source evidence | browser for visual QA |
| Craft rules | `references/style-presets.md`, `references/checklist.md`, validator checks | none |
| HTML artifact preview | `index.html` output contract | browser for visual QA |
| Production template depth | Adopted Open Design `html-ppt` MIT base/runtime plus Design-owned Swiss layouts, production shell, nine-slide fixture, and rendered QA | browser QA and manual taste review |
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
| Theme rhythm | `aesthetic_contract.visual_rhythm`, `slide-plan.json`, and `validate-visual-rhythm.mjs` |
| Swiss layout lock | `references/swiss-layout-lock.md` and `validate-layout-lock.mjs` |
| Image/SVG discipline | `validate-asset-contract.mjs` blocks fake screenshots and forbidden SVG text |
| Swiss validator pattern | `validate-design-output.mjs`, `validate-aesthetic-contract.mjs`, `validate-layout-lock.mjs`, `validate-visual-rhythm.mjs` |
| Semantic layout grammar | Implemented Design-owned statement, process, system, metric, comparison, image, risk/control, cover, and decision-close layouts; standalone Guizang AGPL code is not imported |

## Additional Local Capability Parity

- Data visualization: chart selection, chart contracts, denominator/sample-size discipline, surface-specific QA.
- Reports: answer-first spine, evidence placement, caveats, source metadata, no chat-summary substitute.
- Dashboards: metric model, source freshness, filters, default view, reconciliation.
- Presentations: narrative, audience-facing copy, font/overlap/visual QA.
- Product design: context gate, visual source, interactivity level.

## Explicit Non-Claims

This package does not include a desktop daemon, app marketplace, BI connector, native Google Slides importer, native PowerPoint renderer, Figma plugin, or scheduled refresh service. It can produce contracts and handoffs for those surfaces when the host provides them.

The package includes one validated Open Design-based Swiss production path and one machine-validated calculation fixture. This does not imply native PPTX/PDF parity, the full Open Design template catalog, all Guizang layouts, universal visual fit, or safe execution of untrusted calculation code.
