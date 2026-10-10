# Workflow and Tool Routing

## Intake

Determine audience, reader job, use scenario, target surface, artifact type,
delivery format, source materials, immutable constraints, product requirements,
and deadline. Classify each explicit requirement by type and priority. Ask only
questions that materially change truth, shape, risk, acceptance, or delivery.

When artifact type, goal, or scenario is materially missing, present two or three concrete directions. Each names the output, reader outcome, scenario, and tradeoff. Recommend one, preserve known facts exactly, and wait before substantial generation.

## Shape Selection

Choose one primary shape:

| Reader job | Shape |
| --- | --- |
| Read an argument with evidence | `data-report` |
| Monitor and inspect changing state | `dashboard` |
| Answer one quantitative question | `chart-frame` |
| Remember one message | `poster` |
| Follow a sequential presentation | `html-deck` or native `pptx` |
| Inspect UI evidence | `screenshot-evidence` |
| Explore meaningful parameters | `tweakable-artifact` |
| Reuse visual rules and components | `design-system` |

Use multiple artifacts only when reader jobs differ. Do not add formats merely because tools exist.

## Narrative and Responsibilities

Before visual design, write the one-sentence message, evidence order, caveats, desired action, must-keep facts, and prohibited claims. Decks need a narrative arc; dashboards need a default scan order; posters need one message and one visual hook.

When requirements exist, create `requirement-verification.json` before release.
Every P0/P1 item retains a stable id, source quote, acceptance criteria, required
surface states, verification method, and current evidence. Do not turn subjective
adjectives such as "premium" or "beautiful" directly into pass/fail checks; rewrite
them as observable composition, media, memory, or perception goals.

Read `references/design-standards.md`, then form the Taste Contract from current
content before choosing a preset or template. History is opt-in, not a prerequisite.
Do not read test fixtures, archived plans, or rejected artifacts as design guidance.
Use `references/frontend-styles.md` to find implemented assets. An explicitly chosen
reference contributes methods and limits, never current facts.

For new source-backed PPT, HTML, and Poster artifacts, create `source-extraction.json` before summarizing, then build one canonical `content-ledger.json`. Each ledger entry binds an extracted source path, SHA-256, exact quote, locator, semantic signature, and protected tokens. Poster owns the format-local `content-handoff.json`; it binds the reader job, direct message, selected semantic units, source refs, visual priority, explicit omissions, and must-not-say rules. The Designer consumes that handoff and may change visual form, not content truth. Use `surface-claims.json` when visible claims need exact DOM binding.

- **Poster/narrative owner**: reader job, decision value, source-grounded message, evidence sequence, semantic selections, omissions, and non-claims. It produces `content-handoff.json`.
- **Designer**: consumes the handoff and owns the Taste Contract, visual system,
  hierarchy, typography, color contract, layout, media, components,
  implementation, and finish.
- **Reviewer**: independently checks source fidelity, exact numbers, logic, content ownership, visual defects, and assurance status. It cannot use the Designer's explanation as evidence.

These are responsibilities, not mandatory agents or files. Express and Standard work may execute them sequentially. Independent agents and durable handoffs are required only when requested or when Assured risk requires independent review.

Use H1/H2 for Poster's truth and narrative decisions, H3/H4 for Designer's system
and composition decisions, and H5 for Reviewer's final-surface check. Reuse these
handoffs and the Taste Contract; do not add a form per layer. Production evidence
stays in internal records, while audience copy preserves the relevant business
status. The canonical hierarchy is `references/design-standards.md`.

H0 product requirement ownership remains with the request and Reviewer. Designer
may choose a visual implementation but cannot waive or silently reinterpret a
P0/P1 requirement.

## Capability Router

Design owns framing, visual direction, and quality. Specialized tools own native formats, deterministic analysis, media production, and browser execution. Choose the lightest verified capability for the required surface.

| Need | Preferred capability | Fail-closed fallback |
| --- | --- | --- |
| Editable PPTX or slide deck | Native presentation tool/runtime | Registered HTML deck with explicit PPT handoff |
| Report or dashboard | Structured analytics/report builder or HTML template | Static HTML report with source-backed charts |
| Calculations and chart geometry | Reproducible code or structured data tool | Block derived claims until deterministic execution exists |
| DOCX/PDF extraction | Native document/PDF parser | Text extraction with recorded limits; surface only decision-relevant uncertainty |
| Relevant factual image | Authorized image search with source record | Accurately labelled generated or schematic image |
| Custom illustration | Image generation | Purpose-built diagram or licensed asset |
| Process, hierarchy, relationship | Mermaid when its grammar fits | HTML/CSS diagram or editable slide shapes |
| HTML implementation | Existing frontend stack or registered template | Self-contained HTML/CSS/JS |
| HTML surface QA | Playwright/browser automation | Structural checks plus explicit browser-QA gap |

Never claim an unavailable native capability. Run preflight when availability can change.

## Selection Rules

- Prefer an existing project design system and runtime over a new dependency.
- Choose templates by reader job and evidence shape, not visual resemblance.
- Use real images when inspection of the actual subject matters; icons only for familiar actions or compact labels.
- Use Mermaid only for relationships its layout expresses clearly; complex editorial composition belongs in the target medium.
- Start at L0 static content. Add components, interaction, or motion only when a named task becomes materially easier.
- Record source, license, dependency, accessibility, fallback, and surface compatibility for third-party assets or components.

## Four-Step Execution

### Define

Collect audience, reader job, scenario, target surface, output format, deadline,
immutable constraints, and explicit P0/P1/P2 requirements. Classify Express,
Standard, or Assured risk. Freeze source identity before summarizing: bind original
and extracted hashes, extraction method, tool identity, freshness, and known
limits. Build one canonical content ledger and one content handoff. Stop on source
drift, missing extraction identity, changed numbers or units, strengthened claims,
or unresolved questions presented as fact.

### Resolve

Complete the Taste Contract from current content, then resolve one primary preset,
at most one supporting preset, and one design system through
`scripts/lib/design-profile.mjs`. Resolve its color contract through the same
profile. Direction-known work proceeds directly; genuinely open Standard or
Assured work compares two independently structured directions bound to the same
content and requirements. History and recipe variations are never automatic.

### Build

Choose the lightest verified capability. Build a complete L0 static state first.
Prove first viewport, densest content, critical error, and narrow screen with real
content and final-grade media before expanding. Add L1 interaction or L2 motion
only for a named reader task. Bind manifest, claims, summaries, provenance,
calculation receipts, local asset licensing, profile, and execution-plan evidence.
PPT handoff remains HTML unless native PPTX and target-player evidence are proven.

### Verify

Run the effective Requirement/Truth, Function, Surface, Craft, and Ownership gates.
Inspect 1440, 390, and 320 px plus applicable focus, selected, disabled, error,
success, print, and reduced-motion states. Candidate-ready work requires current
digest bindings, no unresolved major/blocking finding, and Reviewer v4 evidence.
Report `Lane`, `Proven`, `Not proven`, and `Next`. Knowledge extraction happens
only after review and only when the user asks.

## Local CLI and Workspace

`scripts/design.mjs` exposes the ordinary public path:

```bash
node scripts/design.mjs profile <brief.json> --artifact-type=<type>
node scripts/design.mjs plan <request.json> --design-profile=<profile.json>
node scripts/design.mjs check <artifact-dir> --execution-plan=<plan.json>
node scripts/design.mjs preflight
```

Use the following only for debugging, targeted evidence capture, repository
maintenance, or explicitly requested knowledge work:

```bash
node scripts/render-smoke.mjs <artifact-dir>/index.html --viewports=desktop,mobile,small-phone --strict-layout
node scripts/capture-direction-previews.mjs <direction-a.html> --target=<selector> --direction-b=<direction-b.html> --out=<dir>
node scripts/capture-keyframes.mjs <artifact-dir>/index.html --spec=<spec.json> --out=<dir>
node scripts/validate-requirement-verification.mjs <artifact-dir>
node scripts/validate-visual-review.mjs <artifact-dir>
node scripts/validate-color-system.mjs .
node scripts/validate-design-evaluation.mjs <artifact-dir> --require-complete
node scripts/distill-spec.mjs <artifact-or-system-dir>
node scripts/extract-primitives.mjs <design-system-dir>
```

Individual validators are debugging building blocks. Ordinary users should use
`design.mjs check`, which selects the applicable union of gates.

The skill root is read-only during artifact generation. Write artifacts, telemetry, screenshots, and temporary evidence inside the user workspace. Network access, publication, and installation require their own authorization.

Use a fresh output directory for a new design or requested redesign. Previous DOM,
CSS, screenshots, and evaluations are excluded unless the user requests a revision
of that specific artifact. Binding hashes and running validators are verification,
not visual generation. Existing examples are test inputs only.

## Stop Conditions

Stop and report the exact blocker on source or digest drift, missing extraction
identity, modified values, unsupported claims, incompatible profile/template,
missing asset provenance or fallback, empty or colliding surfaces, failed
reduced-motion or target-surface checks, incomplete P0/P1 evidence, or unproven
review independence when the selected lane requires it.
