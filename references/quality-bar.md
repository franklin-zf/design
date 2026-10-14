# Quality Bar

## Non-Compensating Gates

| Gate | Pass condition |
| --- | --- |
| G0 Requirement and Truth | Every P0/P1 requirement is passed with current evidence; PRD-backed prototype content is browser-verified; source values and meaning are unchanged; derived values are code-produced and traceable; contextual semantic fitness is verified |
| G1 Function and Utility | Browser execution proves the PRD-backed prototype's P0/P1 functional, interaction, and responsive paths; states, navigation, feedback, answer, evidence, caveats, and action support the named reader job |
| G2 Surface | The real target surface has no placeholder, overflow, overlap, missing asset, unreadable text, or broken state; Defensive CSS Layout Protocol is satisfied with zero container boundary breach, zero button ejection, and verified 50+ character truncation |
| G3 Craft | Every applicable craft dimension has evidence and scores at least 3/4 |
| G4 Ownership | Content specificity, visual-world coherence, and memorable element each score at least 3/4 |
| G5 Perception | Three-second, blinded-preference, or observed-user evidence is reported according to the calibrated policy without overstating evaluator type |

All applicable gates must pass. Mechanical validation is a floor; real-surface
visual inspection is mandatory. For PRD-backed prototypes, an unavailable
browser or static-only review blocks release. Passing requirements bind one
`browser-test-evidence/v1` record to the current artifact, plan, render spec,
actions, assertions, screenshots, and browser runtime.
Apply the H0-H5 responsibilities and no-obstruction gate in
`references/design-standards.md`. These refine the existing four gates; they do not
create a second release state machine or another set of mandatory handoff files.

## Assurance Lanes

### Express
Use only for reversible internal exploration with known direction, no source-backed or derived claims, no sensitive or untrusted input, no publication, and no consequential interaction. Require universal gates and disclose omitted guarantees.

### Standard
Use for ordinary source-backed artifacts. Add source identity, applicable summary/claim mapping, target-surface QA, and an independent content-and-visual review. Independent means a separate review pass, not necessarily a separate agent.

### Assured
Use for derived values, sensitive or untrusted inputs, publication, formal decisions, consequential interaction, dependent multi-artifact output, explicit high assurance, or explicit multi-agent execution. Add complete provenance, controlled execution, external evidence binding, and independent release review.

Unknown material risk escalates. Lane selection changes assurance depth, never the truth or taste floor.

## Assured Controlled Execution

Compile a versioned request into an immutable plan:

```bash
node scripts/design.mjs plan request.json --out=execution-plan.json --shadow
node scripts/run-execution-plan.mjs execution-plan.json --workers=2
```

Shadow mode records decisions without authorizing release. Runtime cache is off and reports `cache_capability=not_implemented`; unknown telemetry remains `unknown`. Legacy v1 requests remain import-only through `scripts/migrate-execution-request-v1.mjs`.

Untrusted code is `zero_spawn`. Derived execution starts only through a digest-verified v2 plan with a registered CPU/memory limiter. Caller flags, signatures, and reviewer approval never change execution class.

## Assured Evidence and Handoffs

Bind source inventory, claim/summary maps, data provenance, immutable render specification, browser profile, accessibility and privacy checks, artifact and plan digests, machine evidence, reviewer registry, attestation, and reviewer record.

Artifact-authored sidecars cannot self-authorize `ready`. Machine evidence is runner-produced outside the artifact root. Reviewer identity differs from the host-supplied artifact author; approval binds current artifact, plan, and render digests. This filesystem-and-digest boundary does not claim cryptographic identity authentication.

Use the workflow's Poster, Designer, and Reviewer responsibilities in independent contexts when available. If the host lacks subagents, sequential execution is allowed only with equivalent role-local handoffs and an explicit statement that review independence was not proven. Three-second and blinded-preference results must bind their evaluator type and raw counts; they do not become human evidence merely because a model or artifact reports them. An evaluation record with `not_run` is a declared gap, not a passing result; do not create placeholder previews, votes, or rates to satisfy the record.

The host adapter owns dispatch, observation, cancellation, collection, path normalization, capability reporting, and telemetry. Every attempt has stable `run_id`, `agent_id`, and a new `attempt_id`; retries preserve prior evidence and declare idempotency, retry class, and maximum attempts. Missing terminal records, evidence, deadlines, or telemetry block corresponding completion, timing, portability, or budget claims. Run-local evidence uses normalized relative paths; absolute paths are host-local pointers, never portability evidence.

## Ready Gate

Run the effective union of template base gates and risk supplements. `scripts/validate-design-output.mjs` is the structural floor; `scripts/validate-evidence-contract.mjs` binds trusted evidence. Every current accessibility and privacy check must pass. Ready delivery permits no unresolved privacy, major, or blocking finding.

Use the exact render-spec viewport/state/segment matrix. Schematic artifacts require visible disclosure in every declared state and all applicable layout, accessibility, privacy, and render checks.

Assured completion reports proven and external limits: validation cannot prove source truth, formula intent, cryptographic identity, native export fidelity, subjective taste, or real-user success.

## Visual Review Rubric

- **Content fit & Contextual Semantic Fitness**: shape, density, and metrics match material, reading mode, and declared `context_scope`; zero visual-fill bias.
- **Hierarchy**: answer, evidence, caveats, and sources have distinct priority.
- **Ownership**: composition follows this content, not a generic template.
- **Typography & Defensive Layout**: text is legible, wrapped, and sized for target language and surface; `min-w-0` and truncation classes (`truncate`) protect flex items; composite controls use two-tier vertical cards; sidebar button groups use structured grids; zero element or button ejection beyond container boundaries.
- **Color**: follows the resolved `color_contract`; foundation, focal, semantic,
  and data roles remain distinct; declared pairings and actual rendered states are
  accessible; critical meaning never depends on color alone.
- **Media**: every image, icon, diagram, and motion element has a content job.
- **Responsiveness**: declared narrow states remain readable and non-overlapping; no unexpected horizontal scroll.
- **Fallback**: static and reduced states preserve meaning.
- **Finish**: no placeholder, internal note, empty frame, broken asset, or accidental style remains.
- **Audience copy**: captions, chart/table labels, speaker notes, and default states
  describe the business, not production checks. Required attribution and meaningful
  uncertainty remain visible. A source quote is not rewritten to satisfy a blacklist.

Candidate-ready review uses `design-reviewer-record/v4` and
`design-craft-rubric/v1` (VCR 2.0). Score composition/space, typography, color/lighting,
material/texture, motion/micro-interaction, responsive adaptation, and finish from
0 to 4. `0` is absent or seriously broken; `1` is visibly defective; `2` is
usable but generic or unfinished; `3` is commercially deliverable; `4` is
content-owned and exceptionally resolved (Muzli/Awwwards grade). High-end release
requires an overall score of at least 3.5 with no individual dimension below 3.0.
Only motion/interaction may be `not_applicable` for a deliberately static artifact.
Every score and ownership judgment binds a real screenshot or target-player evidence file.

Anti-AI Slop & Defensive Layout Redlines (Automatic Failure):
- Visual Fill Bias: mechanically adding out-of-scope metrics to force 4-grid/6-grid symmetry;
- Defensive Layout Failures: unisolated single-row `<select>` + action buttons causing button ejection, missing `min-w-0` on dynamic flex children, ragged `flex-wrap` button groups in ≤400px sidebars, horizontal container blowout;
- Homogeneous card walls (≥ 4 identical rounded boxes in a flat grid);
- Fake UI / fake charts without data logic;
- Indiscriminate center alignment across body text and lists;
- Cheap generic purple/pink high-saturation gradients;
- Interactive elements without hover/active/focus state feedback.

Weighted averages are for comparison only. They never compensate for a failed
requirement, task, accessibility, privacy, obstruction, craft, or ownership gate.

## Evidence Status

Use monotonic labels: `structure_passed` → `evidence_traced` → `visually_reviewed` → `decision_ready` → `user_validated`. User validation requires observed task evidence; approval alone is insufficient.

Delivery reports `Lane`, `Proven`, `Not proven`, and `Next`. Never translate a lower stage into a higher claim.
