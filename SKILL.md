---
name: design
description: Turn supplied content or data into accurate, content-specific visual artifacts. Use for reports, dashboards, charts, posters, web experiences, HTML decks, PPT/PPTX, screenshot evidence, or design systems.
---

# Design

## Contract

Make the right conclusion easy to see without changing the source. Resolve
conflicts in this order: source truth, reproducible analysis, reader usefulness,
content-specific design, then interaction and novelty.

- Preserve values, labels, units, signs, dates, identifiers, quotations, and
  claim strength exactly.
- Every visible value is source-verbatim or code-derived. Derived values require
  executable code, tests, output, and provenance.
- Never fabricate data, sources, screenshots, UI states, or provenance. Label
  generated diagrams and mockups as schematic.
- Mechanical validation is only a floor. Real target-surface inspection and
  independent review remain required where the selected risk lane demands them.
- Apply H0-H5 from `references/design-standards.md`. No content obstruction,
  unresolved major finding, or unsupported capability may ship.

## Architecture

| Layer | Authority | Responsibility |
| --- | --- | --- |
| Entry | `SKILL.md`, `references/workflow.md` | Contract, risk, loading, and the single operating path |
| Content roles | `agents/poster.md`, `agents/designer.md`, `agents/reviewer.md` | Narrative ownership, visual execution, and independent review |
| Design control | `scripts/lib/design-profile.mjs`, catalogue, `design-systems/` | Deterministic profile, topology, interface policy, and visual system resolution |
| Execution | `scripts/design.mjs`, templates, components, media tooling | Plan, build, render, and evidence capture |
| Release | validators, schemas, tests, evidence contracts | Truth, function, surface, craft, and ownership gates |

The profile resolver is the sole runtime routing authority. Do not create a
parallel content router or treat examples, fixtures, history, or inspiration
records as automatic design guidance.

## Capabilities

| Reader need | Supported output |
| --- | --- |
| Read evidence or monitor state | Report, dashboard, chart frame |
| Remember one message | Poster |
| Follow a sequence | HTML deck or explicit PPT handoff |
| Inspect product behavior | Web experience or screenshot-evidence board |
| Explore meaningful parameters | Interactive or tweakable artifact |
| Reuse visual rules | Design system, tokens, components, and handoff |

Native documents, spreadsheets, PPTX, image production, browser automation, and
deterministic analysis route to their verified specialist capability. Fail closed
when the required native surface or evidence cannot be proven.

## Single Operating Path

1. **Frame and freeze**: define the audience, reader job, scenario, surface,
   format, requirements, source identity, and risk lane. Build one canonical
   content ledger and requirement map before summarizing.
2. **Direct**: record one content-specific Taste Contract, then resolve one
   primary preset, at most one supporting preset, and one production design
   system. Run the local Dribbble reference pass when the user requests visual
   inspiration or when a net-new visual direction has no verified brand or
   existing design system. Bind one to three source-verified references and the
   methods extracted from them; never treat them as sources of facts.
3. **Structure**: choose one primary shape and reading order. Prove the first
   viewport, densest content, critical error, and narrow screen before styling.
4. **Build**: complete the static state with real content and final-grade assets.
   Preserve content ownership, provenance, accessibility, and fallback behavior.
5. **Enhance**: add interaction or motion only for a named reader task. Complete
   relevant focus, selected, disabled, empty, error, success, and reduced-motion
   states.
6. **Verify and release**: run non-compensating Requirement/Truth, Function,
   Surface, Craft, and Ownership gates. Inspect the real surface at 1440, 390,
   and 320 px under extreme content stress, then report `Lane`, `Proven`,
   `Not proven`, and the smallest `Next` action.

For a prototype with a PRD, browser review is mandatory. Use browser automation
to execute every P0/P1 content, functional, interaction, and responsive path,
then bind `browser-test-evidence.json` to `requirement-verification.json`. Static code
inspection, screenshots without interaction, and validator-only passes cannot
authorize release. If a browser cannot launch, the prototype remains blocked.

For responsive HTML, enforce the Defensive CSS Layout Protocol: `min-w-0` and
truncation for dynamic flex children, two-tier select/search plus action layouts,
and structured two- or three-column button grids in sidebars at 400 px or below.

## Taste Contract

Record these five decisions before choosing a template:

```json
{
  "visual_thesis": "What the composition must make clear",
  "content_tension": "The contrast, hierarchy, or change that must become visible within the current context_scope",
  "signature_move": "At most one memorable visual action and its reader value",
  "anti_reference": "What this must not resemble and why",
  "restraint_rule": "What stays quiet, removed, or filtered by scope"
}
```

Generic adjectives, palette names, preset ids, and library names do not satisfy
the contract. Keep one visual system and one primary attention region per
surface. Refuse filler metrics, decorative component walls, fake screenshots,
out-of-scope content, and motion without a semantic job.

## Risk Lanes

| Lane | Use when | Minimum proof |
| --- | --- | --- |
| `Express` | Reversible internal exploration without source-backed or derived claims | Core rules, Taste Contract, structural checks, one real-surface review |
| `Standard` | Ordinary source-backed artifact | Source identity, claim mapping, target-surface QA, content and visual review |
| `Assured` | Derived values, sensitive input, publication, formal decisions, consequential interaction, or explicit high assurance | Complete provenance, controlled execution, evidence binding, independent release review |

Unknown material risk escalates. A requested lane is a floor, never a downgrade.
Load `references/advanced-assurance.md` and `references/quality-bar.md` only for
Assured or formal release work.

## Runtime

```bash
node scripts/design.mjs profile <brief.json> --artifact-type=<ppt-handoff|html-deck|poster> [--out=design-profile.json]
node scripts/design.mjs plan <request.json> --design-profile=design-profile.json [--out=execution-plan.json --shadow]
node scripts/design.mjs review <artifact-dir> --execution-plan=execution-plan.json [review options]
node scripts/design.mjs check <artifact-dir> [--profile=express|standard|assured] [--execution-plan=execution-plan.json]
node scripts/design.mjs preflight [capability options]
```

These five commands are the ordinary planning and release path. `review`
produces browser and requirement evidence; `check` only validates current
evidence. The Dribbble
pass is a conditional direction step. Prefer the read-only
`dribbble-hub-mcp` tools `get_dribbble_library_status`,
`search_dribbble_references`, `get_dribbble_reference`, and
`create_inspiration_binding` when the host exposes the MCP; use the CLI bridge
otherwise:

```bash
node scripts/design.mjs shots status
node scripts/design.mjs shots search "<scenario>" --limit=3
node scripts/design.mjs shots get <shot-id>
node scripts/design.mjs shots binding <input.json>
```

Dribbble preview bytes stay in a private user cache and are not distributed in
the skill package. The packaged library contains source metadata, digest,
rights status, extracted methods, and do-not-copy boundaries only.

Rendering, capture, individual validators, evaluation, and knowledge commands are
targeted execution or diagnostic operations documented in
`references/workflow.md`.

## Boundaries and Loading

For a new design or requested redesign, create a fresh artifact directory outside
the skill root. Preserve the source ledger, not a previous visual DOM or CSS.
Reuse an old layout only when the user explicitly asks to revise it. Examples are
test fixtures, not aesthetic references.

- Default: this file plus `references/workflow.md`.
- Add one task reference: `report-dashboard.md`, `deck-ppt.md`,
  `poster-design.md`, `source-integrity.md`, or `media-design.md`.
- Add `references/web-interface-standards.md` for responsive applications or
  dashboards.
- Load visual recipes, history, or knowledge tooling only when the user requests
  variation or reference reuse.

Never call an HTML handoff native PPTX, a generated mockup a screenshot, an
internal review user validation, or a structural pass aesthetic approval.
