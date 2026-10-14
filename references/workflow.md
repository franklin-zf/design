# Workflow and Tool Routing

This is the canonical execution path for the Design skill. Use all six stages in
order. Scale the evidence and review depth to the selected risk lane; do not
create parallel workflows for different artifact types.

## Six-Stage SOP

### 1. Frame and Freeze (G0)

Define the audience, reader job, scenario, target surface, artifact type,
delivery format, deadline, immutable constraints, and explicit P0/P1/P2
requirements. Ask only questions that materially change truth, shape, risk,
acceptance, or delivery.

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

Use multiple artifacts only when reader jobs differ. When the goal or scenario is
materially missing, present two or three concrete directions with output, reader
outcome, tradeoff, and a recommendation before substantial generation.

For source-backed work:

1. Create `source-extraction.json` and bind source path, hash, extraction method,
   tool identity, freshness, and limits.
2. Build one canonical `content-ledger.json` with exact quotations, locators,
   semantic signatures, and protected tokens.
3. Create `content-handoff.json` with the reader job, message, evidence order,
   selected semantic units, omissions, and prohibited claims.
4. Create `requirement-verification.json` when P0/P1 requirements exist. Keep a
   stable id, source quote, acceptance criteria, required states, verification
   method, and evidence for every item.

Stop on source drift, missing extraction identity, changed values or units,
strengthened claims, or unresolved questions presented as fact.

### 2. Direct (G1)

Read `references/design-standards.md` and write the one-sentence message,
evidence order, caveats, desired action, must-keep facts, and prohibited claims.
Then record the five-field Taste Contract from current content.

Resolve one primary preset, at most one supporting preset, one color contract,
and one production design system through `scripts/lib/design-profile.mjs`.
Consume the resolved `interface_policy` for responsive applications and
dashboards; do not recreate its target, reflow, focus, dialog, table, icon, or
feedback rules in a parallel prompt. Older profile records without
`interface_policy` retain their legacy behavior.

Direction-known work proceeds directly. Compare two independently structured
directions only when the direction is genuinely open and the selected lane
requires the comparison. Both directions bind the same content and requirements.

Run the Dribbble reference pass when either condition is true:

- the user explicitly asks for Dribbble, inspiration, visual references,
  beautification, or a new visual direction;
- a net-new prototype, site, application, dashboard, poster, or deck has no
  verified brand system or accepted design direction.

Skip it only for an exact revision of an accepted design, strict implementation
of an existing design system, evidence-only review, or a user prohibition on
external references. Record the reason when skipped.

Prefer the read-only `dribbble-hub-mcp`:

1. `get_dribbble_library_status`
2. `search_dribbble_references` with the reader job or scenario
3. `get_dribbble_reference` for one to three selected ids
4. `create_inspiration_binding` with the selected ids, roles, artifact type,
   trigger reason, and execution-plan digest

When the host does not expose that MCP, use the equivalent CLI bridge:

```bash
node scripts/design.mjs shots status
node scripts/design.mjs shots search "<reader-job or scenario>" --limit=3
node scripts/design.mjs shots get <selected-shot-id>
node scripts/design.mjs shots binding <binding-input.json>
```

`status` must report `ready: true`. Select one to three records and write one
`inspiration-binding.json` that binds each source, role, extracted method,
rights boundary, and `do_not_copy` list to the execution-plan digest. If the pass is required but the library
is unavailable or no relevant source-verified record exists, record the
inspiration gap and continue only from a content-native direction. Do not claim
that the reference pass succeeded or silently substitute a generic style.

History and visual recipes remain opt-in. The inspiration hub supplies methods,
not facts:

```bash
node scripts/design.mjs shots search "商家经营工作台" --limit=3
```

Extract methods such as hierarchy, topology, material, or motion. Never import
facts, brand claims, or a complete composition from an inspiration record. The
current content and resolved profile remain authoritative.

The skill package distributes metadata only. Optional preview bytes live in the
private cache declared by `DESIGN_DRIBBBLE_CACHE`; never copy those bytes into
the artifact or publish them as reusable assets.

### 3. Structure (G2)

Establish the information hierarchy, reading order, component boundaries, and
responsive reflow before visual finish. Prove these four surfaces with real
content:

- first viewport;
- densest content state;
- critical error or exception state;
- narrow screen.

Use a content-native structure based on comparison, sequence, hierarchy, scale,
or tension. Choose templates by reader job and evidence shape, not visual
resemblance. Keep one primary attention region and at most one signature move.

### 4. Build (G3)

Choose the lightest verified capability and complete the static state first. Use
final-grade media and preserve source, license, dependency, accessibility,
fallback, and surface compatibility for every external asset or component.

Bind the manifest, claims, summaries, provenance, calculation receipts, profile,
and execution-plan evidence required by the lane. Use `surface-claims.json` when
visible claims need exact DOM binding. PPT handoff remains HTML unless native
PPTX generation and target-player evidence are separately proven.

For responsive HTML, apply the Defensive CSS Layout Protocol:

- dynamic flex children use `min-w-0` and an explicit truncation or wrapping rule;
- select/search controls and adjacent actions use a stable two-tier layout;
- sidebar button groups at 400 px or below use structured two- or three-column
  grids;
- fixed-format controls and boards have stable dimensions and responsive
  constraints.

### 5. Enhance (G4)

Start at L0 static content. Add L1 interaction or L2 motion only when it makes a
named reader task materially easier. Complete all applicable default, hover,
active, focus, selected, disabled, empty, error, success, loading, print, and
reduced-motion states.

Use one icon family. Motion must communicate hierarchy, causality, continuity,
or feedback; otherwise remove it. A design system may provide craft methods, but
no palette, grid, shadow, radius, or motion recipe is universally mandatory.

### 6. Verify and Release (G5)

Run five non-compensating gates:

| Gate | Proof |
| --- | --- |
| Requirement / Truth | P0/P1 traceability, source fidelity, exact values, claims, and provenance |
| Function | Complete workflows, controls, states, keyboard behavior, and fallbacks |
| Surface | Actual rendering at 1440, 390, and 320 px with no overlap or overflow |
| Craft | Hierarchy, typography, color, composition, media quality, and content-specific finish |
| Ownership | Correct role separation, independent review, and current evidence bindings |

When a PRD exists for an interactive prototype, run a browser review before the
human craft decision:

1. Require a launchable browser:
   `node scripts/design.mjs preflight --require=browser_launch`.
2. Map every P0/P1 content, functional, interaction, and responsive requirement
   to a browser setup action and observable assertion in the render spec.
3. Open the actual prototype with browser automation, execute the primary path
   plus required empty, error, disabled, loading, and narrow-screen branches, and
   compare visible copy and behavior with the PRD acceptance criteria.
4. Produce `browser-test-evidence.json` through the Playwright adapter or bind a
   host Browser MCP trace with `bind-browser-evidence`.
5. Run `design.mjs review`; it executes the plan, binds the browser evidence
   digest into `requirement-verification.json`, and then runs `design.mjs check`.

Code inspection, a static screenshot, or a DOM existence assertion alone does
not prove content or functional compliance. A missing browser runtime, failed
interaction, stale evidence, or uncovered P0/P1 branch blocks release.

Stress every delivered surface with 50+ character strings and verify zero button
ejection and zero incoherent overflow. Mechanical validators do not replace
manual inspection of the rendered artifact. Candidate-ready work requires current
digest bindings, no unresolved blocking or major finding, and Reviewer evidence
appropriate to the lane.

Release with exact artifact paths and:

```text
Lane:
Proven:
Not proven:
Next:
```

Knowledge extraction occurs only after review and only when explicitly requested.

## Responsibilities

- **Poster / narrative owner**: reader job, decision value, source-grounded
  message, evidence sequence, semantic selection, omissions, and non-claims.
- **Designer**: Taste Contract, visual system, hierarchy, typography, color,
  layout, media, components, implementation, and finish.
- **Reviewer**: source fidelity, exact values, logic, requirements, visual
  defects, operational states, and assurance status. The Designer's explanation
  is not review evidence.

These are ownership boundaries, not mandatory agents. Express and Standard work
may execute them sequentially. Independent agents and durable handoffs are
required only when requested or when Assured risk requires independence.
H0 remains owned by the request and Reviewer; the Designer cannot waive or
silently reinterpret a P0/P1 requirement.

## Capability Router

Design owns framing, visual direction, and quality. Specialized tools own native
formats, deterministic analysis, media production, and browser execution.

| Need | Preferred capability | Fail-closed fallback |
| --- | --- | --- |
| Editable PPTX | Native presentation runtime | Registered HTML deck labelled as PPT handoff |
| Report or dashboard | Structured report builder or registered HTML template | Static source-backed HTML report |
| Calculations and chart geometry | Reproducible code or structured data tool | Block derived claims |
| DOCX/PDF extraction | Native document or PDF parser | Recorded text extraction limits |
| Relevant factual image | Authorized image search with source record | Labelled generated or schematic image |
| Custom illustration | Image generation | Purpose-built diagram or licensed asset |
| Process or relationship | Mermaid when its grammar fits | HTML/CSS diagram or editable slide shapes |
| HTML implementation | Existing frontend stack or registered template | Self-contained HTML/CSS/JS |
| HTML surface QA | Playwright or browser automation | Structural checks plus an explicit QA gap |

Prefer existing project systems over new dependencies. Never claim an unavailable
native capability. Run preflight when availability can change.

## Local CLI and Workspace

Ordinary path:

```bash
node scripts/design.mjs profile <brief.json> --artifact-type=<type>
node scripts/design.mjs plan <request.json> --design-profile=<profile.json>
node scripts/design.mjs review <artifact-dir> --execution-plan=<plan.json>
node scripts/design.mjs check <artifact-dir> --execution-plan=<plan.json>
node scripts/design.mjs preflight
```

Use render, capture, individual validators, evaluation, and knowledge commands
only for targeted execution, debugging, repository maintenance, or explicit
user requests. Dribbble commands are conditionally required by Stage 2.
`design.mjs review` produces browser and requirement evidence.
`design.mjs check` is read-only and owns the applicable union of release
validators; it reports whether browser evidence was required, executed, and
current.

The skill root is read-only during artifact generation. Write artifacts,
telemetry, screenshots, and temporary evidence in the user workspace. Network
access, publication, installation, and external state changes require their own
authorization.

Use a fresh output directory for a new design or requested redesign. Exclude the
previous DOM, CSS, screenshots, and evaluations unless the user requests a
revision of that artifact. Binding hashes and running validators are
verification, not visual generation. Examples and test fixtures are never
aesthetic proof.

## Stop Conditions

Stop and report the exact blocker on source or digest drift, missing extraction
identity, modified values, unsupported claims, incompatible profile or template,
missing asset provenance or fallback, empty or colliding surfaces, failed
reduced-motion or target-surface checks, incomplete P0/P1 evidence, or unproven
review independence when the selected lane requires it.
