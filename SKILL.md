---
name: design
description: "Turn user-supplied content or data into accurate, content-specific, aesthetically strong visual artifacts. Use when Codex must choose, design, build, review, or validate a report, dashboard, chart, poster, HTML deck, PPT/PPTX, screenshot evidence board, or design-system-aligned deliverable."
---

# Design

## Promise

Make the right conclusion easy to see without changing the source. Resolve conflicts in this order:

1. source truth and exact numbers;
2. reproducible code-derived analysis;
3. reader usefulness and clear communication;
4. content-specific aesthetic quality;
5. interaction, motion, and novelty.

Beauty never excuses altered data. Validator success never proves visual quality.

## Default Workflow

1. **Frame**: identify audience, reader job, use scenario, target surface, and delivery format. If artifact type, goal, or scenario is materially missing, offer two or three concrete directions and wait for selection.
2. **Freeze**: treat supplied files and raw values as read-only evidence. Preserve numbers, units, signs, dates, names, identifiers, and quoted wording exactly.
3. **Shape**: choose one primary artifact form and write the one-sentence message, evidence order, caveats, and desired reader action. Use `references/workflow.md`.
4. **Direct**: complete the Taste Contract before choosing a template, component, image, or effect. Use `references/philosophy.md`.
5. **Build**: select the lightest capable tool and the lowest sufficient expression level. Start with a complete static state; add interaction or motion only for a named reader job. Use `references/tool-routing.md`.
6. **Review**: pass the applicable Truth, Utility, Taste, and Surface gates in `references/quality-bar.md`. Inspect the real target surface before delivery.

## Taste Contract

Record five content-specific decisions:

```json
{
  "visual_thesis": "What the composition must make clear",
  "content_tension": "The contrast, hierarchy, or change that must become visible",
  "signature_move": "At most one memorable visual action and its reader value",
  "anti_reference": "What this must not resemble and why",
  "restraint_rule": "What stays deliberately quiet or is removed"
}
```

Generic adjectives, palette names, preset ids, and library names do not satisfy the contract. For uncertain or highly aesthetic work, compare two materially different directions and reject one with a content-based reason.

## Non-Negotiable Core

- Every visible value is either source-verbatim or code-derived. Transformations, aggregation, ranking, conversion, chart scales, and mark positions come from executable code with tests and provenance.
- Do not fabricate data, sources, quotes, screenshots, UI states, or provenance. Label generated diagrams and mockups as schematic.
- Summaries preserve the original meaning and every numeric token. Use direct language; do not add jargon or stronger claims.
- Keep one visual system, one primary attention region per surface, and no more than one signature move.
- Reject generic AI defaults, decorative component collages, filler images, fake screenshots, and motion without a semantic job.
- The artifact must remain complete without hover or motion. Preserve meaning in reduced-motion, static, narrow-screen, and PPT states when applicable.
- Do not ship placeholders, unresolved blocking or major findings, unsupported capabilities, or unreviewed derived values.

## Assurance Lanes

| Lane | Use when | Additional requirements |
| --- | --- | --- |
| `Express` | Reversible internal exploration with no source-backed or derived claims | Core rules, Taste Contract, applicable structural checks, one real-surface review |
| `Standard` | Source-backed report, chart, poster, deck, dashboard, or evidence board | Source identity, applicable summary/claim mapping, independent content and visual review |
| `Assured` | Derived values, sensitive or untrusted input, publication, formal decisions, consequential interaction, or explicit high assurance | Complete provenance, controlled execution, external evidence binding, independent release review |

Unknown material risk escalates. A requested lane is a floor, never a downgrade. Detailed Assured execution is opt-in through `references/advanced-assurance.md`; ordinary work must not create execution plans, role handoffs, or attestations solely for ceremony.

## Tool Routing

Prefer specialized native capabilities over rebuilding them inside this skill: presentation tools for editable PPTX, structured analytics or code for charts and calculations, document/PDF tools for extraction, image search or generation for relevant media, Mermaid for suitable relationships, and browser automation for HTML QA. Verify availability before claiming a capability and use the declared fallback when unavailable.

The unified local interface is:

```bash
node scripts/design.mjs plan <request.json> [--out=execution-plan.json --shadow]
node scripts/design.mjs check <artifact-dir> [--profile=express|standard|assured]
node scripts/design.mjs render <artifact-dir>/index.html [render options]
node scripts/design.mjs capture <artifact-dir>/index.html [capture options]
node scripts/design.mjs preflight [capability options]
```

## Load Only What You Need

- Source, summaries, claims, and calculations: `references/source-integrity.md`.
- Intake, shape, narrative, and role responsibilities: `references/workflow.md`.
- Aesthetic philosophy and design method: `references/philosophy.md`.
- Quality thresholds and delivery status: `references/quality-bar.md`.
- Tool selection and fallbacks: `references/tool-routing.md`.
- Reports, dashboards, and charts: `references/report-dashboard.md`.
- Decks and PPT/PPTX: `references/deck-ppt.md`.
- Posters: `references/poster-design.md`.
- Images, diagrams, screenshots, icons, and motion: `references/media-design.md`.
- Templates, components, presets, and design systems: `references/library.md`.
- Controlled execution, multi-agent handoffs, and external attestations: `references/advanced-assurance.md` only when triggered.

## Delivery

Return exact artifact paths and state `Lane`, `Proven`, `Not proven`, and `Next`. Never call an HTML handoff native PPTX, a generated mockup a screenshot, an internal review user validation, or a structural pass aesthetic approval.
