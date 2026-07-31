---
name: design
description: "Turn user-supplied content or data into trustworthy, content-specific visual artifacts using the lightest workflow appropriate to risk. Use when Codex must choose, design, build, review, or validate a report, dashboard, chart, poster, HTML deck/PPT handoff, screenshot evidence board, tweakable artifact, or design-system-aligned deliverable."
---

# Design

## Promise

Turn user-supplied content or data into a trustworthy visual artifact that makes the right conclusion easy to see, using the lightest workflow appropriate to risk.

Resolve conflicts in this order:

1. immutable source truth;
2. reproducible code-derived analysis;
3. source-preserving synthesis;
4. reader usefulness;
5. aesthetic quality.

Every applicable level must pass. Beauty cannot excuse altered data; structural validation cannot prove visual quality or user success.

## Start Here

1. State the reader job: what should the reader understand, decide, monitor, compare, or do?
2. Confirm only facts that materially change shape, truth, risk, or delivery. If direction is missing, use `references/intake-direction-gate.md`; otherwise proceed with explicit reversible assumptions.
3. Choose one primary shape with `references/shape-selection.md`: `data-report`, `dashboard`, `chart-frame`, `poster`, `html-deck`, `ppt-handoff`, `screenshot-evidence`, `tweakable-artifact`, `design-system`, or justified `multi-artifact`.
4. Select `Express`, `Standard`, or `Assured` from observable facts in `references/risk-profiles.md`. Unknown material risk escalates; a requested profile is a floor, never a downgrade.
5. Write the Taste Contract before choosing a preset or template: `visual_thesis`, `content_tension`, `signature_move`, `anti_reference`, and `restraint_rule`. Follow `references/taste-loop.md`.
6. Select a template only by `id` from `assets/templates/registry.json`, or record why no registered template fits. Record rejected alternatives. Registry gates are the template's base checks; the compiler must add source-, calculation-, execution-, and release-risk supplements. A template is not complete merely because its base gates pass.
7. Build the complete L0 static expression first. Add at most three component references from `assets/components/registry.json` only when each one improves a named reader job and survives the static HTML, reduced-motion, PPT, accessibility, performance, provenance, and compatibility gates in `references/component-library.md`. Inspiration-only and blocked records authorize no source use.
8. Compile the explicit request when the orchestration scripts are available:

   ```bash
   node scripts/compile-execution-plan.mjs request.json --out=execution-plan.json --shadow
   node scripts/run-execution-plan.mjs execution-plan.json --workers=2
   ```

   Shadow mode records the decision without implying automatic release. Runtime cache is explicitly off and reports `cache_capability=not_implemented`; telemetry defaults to the artifact workspace, and the skill root remains read-only. Legacy v1 requests are import-only: run `node scripts/migrate-execution-request-v1.mjs old-request.json`, complete the reported v2 facts, then compile a new plan.
9. Inspect the real target surface and deliver the evidence-backed status from `references/assurance-ladder.md`: what is proven, what is not proven, and the smallest next action.

## Non-Negotiable Core

- Treat supplied source files and raw values as read-only evidence. Preserve values, labels, units, signs, dates, identifiers, and quoted wording exactly.
- Classify every visible value as source-verbatim or code-derived. Any transform, aggregation, ranking, conversion, scale, or chart mark must come from executable code with tests, output, and provenance.
- Do not fabricate data, sources, quotes, screenshots, or provenance. Mark illustrative content `schematic: true`.
- A generated diagram or mockup is not a screenshot. A local evidence quote proves support in that file, not external truth, freshness, or complete interpretation.
- Do not let validator success imply aesthetic quality, accessibility completeness, native export fidelity, or real-user success.
- Do not ship placeholders, unsupported capabilities, unresolved major/blocking findings, or unreviewed derived values.
- Keep one visual system per artifact. Reject generic AI defaults and decorative work that does not clarify the reader job.
- Manual inspection of the actual surface is required for every delivered artifact. Assured work also keeps human quality/release review; these gates cannot be cached or auto-passed and never authorize execution.

## Risk Lanes

### Express

Use only for one reversible, internal/exploratory artifact with known direction, no source-backed claims, no derived values, no sensitive or untrusted input, no publication, no consequential interactivity, and no dependent multi-artifact output.

Keep the truth floor, shape, full Taste Contract, registered-template decision, applicable structural checks, and one real-surface review. List omitted checks and guarantees not claimed. Any unknown eligibility fact escalates.

### Standard

Use for source-backed reports, dashboards, charts, posters, decks, evidence boards, or design-system handoffs without derived calculations, sensitive inputs, untrusted execution, publication, or other Assured triggers.

Add source identity/freshness, applicable summary and claim mapping, Designer and independent Reviewer handoffs, target-surface QA, and evidence-traced delivery status.

### Assured

Use when any input has code-derived values, untrusted execution, sensitive data, publication/formal decision impact, consequential interactivity, multiple dependent artifacts, or an explicit high-assurance request.

Keep complete source/calculation provenance, machine-admitted isolated execution, every applicable gate, human release control, and independent review. Untrusted code is `zero_spawn`; signatures and reviewer approval cannot change execution class. Never use Express wording to override an Assured trigger.

## Taste Contract

Every direction records:

```json
{
  "visual_thesis": "One content-specific sentence",
  "content_tension": {"statement": "The contrast that must become visible", "source_refs": []},
  "signature_move": {"move": "One memorable visual action", "reader_value": "Why it helps"},
  "anti_reference": [{"reference": "What this must not resemble", "avoid_because": "Content-specific reason"}],
  "restraint_rule": "What stays deliberately quiet or is removed",
  "direction_alternatives": []
}
```

For aesthetic-sensitive or uncertain work, compare two materially different directions and reject one with a reason. Otherwise record why divergence would add no decision value. Generic adjectives, palette names, or preset ids do not satisfy the contract.

## Load References on Demand

- Source, summaries, claims, or calculations: `references/data-integrity-and-calculation.md`, `references/source-and-claims-policy.md`, and `references/content-summary.md` as applicable.
- Reports, dashboards, and charts: `references/report-dashboard.md` and `references/data-visualization.md`.
- Decks and PPT handoffs: `references/deck-ppt.md`; add `references/swiss-layout-lock.md` only for that system.
- Posters: `references/poster-design.md` and `references/anti-ai-slop.md`.
- Images, screenshots, diagrams, or UI evidence: `references/image-design.md` and/or `references/screenshot-ui-evidence.md`.
- Style, systems, or components: `references/aesthetic-principles.md`, `references/style-presets.md`, `references/design-system.md`, `references/motion-policy.md`, and `references/component-library.md` only as needed.
- Templates: query `assets/templates/registry.json`; use `references/template-library.md` for selection and provenance method. `examples/` are validator fixtures, not showcases; curated production cases live in `showcases/registry.json`.
- Standard/Assured roles: `references/role-architecture.md`; host execution details: `references/multi-agent-protocol.md`.
- Artifact inputs/outputs and exact validation: `references/input-contract.md`, `references/output-contract.md`, and `references/validation.md` only when producing or claiming delivery.

## Build and Evidence

Use registered production templates or established local patterns. Every HTML artifact has `index.html`, `manifest.json`, and `quality-report.md`; add only lane- and shape-applicable sidecars. Decks need `slide-plan.json`; posters need `poster-plan.json`; source-backed summaries/claims need their maps. Only code-derived artifacts require calculation code, tests, derived output, and `data-provenance.json`; an Assured no-derived dashboard does not require calculation assets solely because of its lane.

Run the effective union of registry base gates and compiler-added risk gates. `validate-design-output.mjs` is the structural floor and `validate-evidence-contract.mjs` binds source, claim, immutable render spec, accessibility, privacy, reviewer, artifact, and plan evidence. Every named accessibility/privacy check is mandatory and must be `passed`; no current check may self-waive as `not_applicable`. Artifact-authored sidecars never authorize `ready`: readiness additionally requires runner-produced external machine evidence plus host-supplied external reviewer registry and attestation, with reviewer identity distinct from the host-supplied artifact author. Missing trusted host inputs fail closed; the current boundary is digest/filesystem based and does not claim cryptographic authentication. Ready delivery permits no unresolved privacy finding, and an approved reviewer must pass every mandatory review check with no unresolved major/blocking finding. Source-backed numeric facts bind the signed value, currency, unit, metric, entity, period, denominator, grain, and exact occurrence count in both source evidence and visible copy; claim ids are exactly once. Derived values add provenance and execution controls; untrusted code never spawns. A caller flag is never resource-limit evidence: when no registered CPU/memory limiter exists, derived execution blocks before spawn. Schematic HTML needs browser-computed visible `data-schematic-disclosure` in every declared viewport/state and still runs layout, accessibility, privacy, and render checks. Use `render-smoke.mjs --viewports=desktop,mobile,small-phone --strict-layout --spec=<artifact>/.design/render-spec.json --profile-out=... --artifact-digest=... --plan-digest=...` for exact 1440/390/320 state/segment evidence. Read `references/validation.md` before making a delivery claim.

All browser scripts use `scripts/lib/playwright-runtime.mjs`. Runtime resolution is deterministic: `DESIGN_PLAYWRIGHT_PATH` (module, package directory, or `node_modules` root), then package-local `node_modules/playwright`, then the current user's Codex bundled runtime cache. The loader validates both the `chromium` API and executable path; missing runtime evidence is blocking and actionable. Do not copy `node_modules` into the skill.

## Handoff

Deliver exact artifact paths plus:

```text
Lane: <Express|Standard|Assured> — <observable reasons>
Proven: <checks and evidence>
Not proven: <unrun or external guarantees>
Next: <smallest action that raises assurance or unblocks delivery>
```

If blocked, also state `blocked_at`, `preserved_work`, `smallest_next_action`, and the condition for resume. Never label internal review as `user_validated`.
