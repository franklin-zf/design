# Validation

## Delivery Gate And Assurance

Use `references/assurance-ladder.md` to report what the available evidence
actually proves. Existing `ready` fields are legacy compatibility labels, not a
substitute for the ladder and never evidence of `user_validated`.

An artifact may be delivered as decision-ready only when all applicable gates
below pass:

1. **Input complete.** `artifact_type`, `goal`, `use_scenario`, `audience`,
   `source_materials`, `output_surface`, and `constraints` are present. The
   summary and calculation policies are present when their conditions apply.
2. **Source identity recorded.** Every available source has an ID, readable
   path or captured URL, and a lowercase SHA-256 for the bytes used. Rehash at
   the gate; any mismatch blocks readiness. Missing source identity is a
   `blocked` or `partial` result, not an inferred pass.
3. **Summary and claims reviewed.** Every visible mapped summary and claim has
   local evidence, a class/status, and a semantic review. Any `fail` or
   `not_checked` result blocks a source-backed `ready` artifact.
4. **Guidance recorded.** A decision-support report or dashboard has
   `decision`, `action`, `decision_owner`, `trigger`, `time_horizon`,
   `success_signal`, `stop_or_escalate_condition`, and `uncertainty`. An
   informational artifact explicitly records `guidance: not_requested`.
5. **Reviewer record exists.** The record names the reviewer, review time,
   artifact hash, checks, findings, approval status, and remaining risks.
6. **User evidence boundary is explicit.** If no real-user sample or observed
   outcome exists, the artifact records the missing evidence and a non-claim;
   it does not claim usability, comprehension, satisfaction, completion, or
   business impact.
7. **Existing checks pass.** Applicable structural, provenance, summary-map,
   claim-map, visual, and runtime checks pass, or their unavailable state and
   effect on readiness are recorded.

The smallest gate result exposes both compatibility status and assurance:

```json
{
  "status": "ready|partial|blocked|needs_clarification",
  "blocking_reasons": [],
  "passed_gates": [],
  "not_claimed": [],
  "reviewer_record_ref": "",
  "assurance": [
    {
      "stage": "structure_passed|evidence_traced|visually_reviewed|decision_ready|user_validated",
      "status": "passed|failed|not_run|not_applicable",
      "evidence": [],
      "reason": ""
    }
  ]
}
```

Where scripts do not emit these fields directly, the execution plan and
Reviewer assemble them from actual command evidence. Missing evidence remains
`not_run` or `failed`; it cannot become an inferred pass.

## Gate Composition Rule

The effective validation plan is the union of:

1. template base gates from `assets/templates/registry.json`;
2. compiler-added risk gates from explicit source, derived-data, execution, sensitivity, interaction, decision, and publication facts;
3. non-cacheable human and independent gates.

Registry base gates remain mandatory but are never sufficient by themselves. A template base pass proves only those checks ran; it cannot close source-summary, calculation-lineage, execution-policy, semantic, visual, independent-review, freshness, or release risk unless the corresponding evidence also exists.

Risk supplements are conditional and must not be over-applied:

- Source-backed visible summaries require `summary-map.json` and `validate-summary-map` even if the selected template does not list that gate.
- Source-backed visible claims require `claim-map.json` and `validate-claim-map` even if the selected template does not list that gate.
- Derived values require separate calculation code, deterministic tests, derived output, `data-provenance.json`, and provenance validation.
- Every lane requires non-cacheable `real-surface-visual-review`.
- Source-backed work requires non-cacheable `source-freshness-review` and `semantic-claims-review`.
- Derived work requires non-cacheable `code-and-formula-review` in addition to calculation/provenance evidence.
- Untrusted code is `zero_spawn`. It may be reconsidered only through a new request whose machine-verifiable registry, path, capability, and hash facts compile to trusted or restricted; human credentials are irrelevant to admission.
- Interactive work requires non-cacheable `interaction-review`.
- Assured work adds `independent-high-assurance-review`; publication adds `publication-approval`.
- A no-derived artifact does not require calculation/provenance assets solely because its lane is Assured. Other Assured human, visual, interaction, freshness, or release gates may still apply.

Every listed human gate is pending until direct evidence exists. `manual-reviewer-pass` remains separate when selected from the registry or Standard contract. Human review affects assurance and delivery only, never execution admission.

Do not edit or resume an untrusted plan. Create a new v2 request with new machine-verifiable execution facts and compile a new digest; the old plan remains blocked.

If the current compiler cannot append a mandatory supplement, record the execution plan as incomplete and block the affected assurance claim. This is a compiler-plan defect, not evidence that the shape-compatible template itself is invalid or must be bypassed.

## Reviewer Record

Use one file-backed record for the final review. The minimum record is:

```json
{
  "reviewer_id": "",
  "reviewed_at": "",
  "artifact_ref": "",
  "artifact_sha256": "",
  "review_status": "approved|changes_required|blocked",
  "checks": {
    "input_contract": "pass|fail|not_checked",
    "source_identity": "pass|fail|not_checked",
    "summary_semantics": "pass|fail|not_checked",
    "claim_semantics": "pass|fail|not_checked",
    "guidance": "pass|fail|not_checked",
    "user_evidence": "pass|fail|not_checked"
  },
  "findings": [],
  "remaining_risks": [],
  "non_claims": []
}
```

`approved` means the listed checks were actually reviewed for this artifact;
it does not mean external truth, complete semantic entailment, or real-user
success was proven. A missing reviewer record blocks `ready`.

## Structural Validation

Run:

```bash
node scripts/validate-intake-direction.mjs <intake-direction.json-or-directory>
node scripts/validate-intake-direction.mjs <intake-direction.json-or-directory> --require-confirmed --poster=<poster-handoff.json>
node scripts/validate-design-output.mjs <artifact-dir>
node scripts/validate-summary-map.mjs <artifact-dir>
node scripts/validate-claim-map.mjs <artifact-dir>
node scripts/validate-evidence-contract.mjs <artifact-dir> --machine-attestation=<host-path> --reviewer-registry=<host-path> --reviewer-attestation=<host-path>
node scripts/validate-showcase-registry.mjs .
node scripts/validate-design-skill.mjs <skill-dir>
node scripts/validate-design-system-package.mjs <skill-dir> swiss-deck
node scripts/validate-aesthetic-contract.mjs <artifact-dir>
node scripts/validate-component-catalogue.mjs <skill-dir>
node scripts/validate-component-usage.mjs <artifact-dir> --resolution=<artifact-dir>/.design/component-resolution.json
node scripts/validate-asset-contract.mjs <artifact-dir>
node scripts/validate-layout-lock.mjs <artifact-dir>
node scripts/validate-visual-rhythm.mjs <artifact-dir>
node scripts/validate-poster-contract.mjs <artifact-dir>
node scripts/validate-poster-anti-ai-slop.mjs <artifact-dir>
node scripts/capability-preflight.mjs --require=browser_smoke
node scripts/capability-preflight.mjs --require=browser_launch
node scripts/render-smoke.mjs <artifact-dir>/index.html --viewports=desktop,mobile,small-phone --strict-layout --spec=<artifact-dir>/.design/render-spec.json --profile-out=<artifact-dir>/render-profile.json --artifact-digest=<sha256> --plan-digest=<sha256>
node scripts/render-smoke.mjs <artifact-dir>/index.html --viewports=desktop,mobile --strict-layout
node scripts/tweakable-smoke.mjs <artifact-dir>/index.html
```

These scripts check intake direction completeness, required files, manifest fields, placeholder text, deck layout metadata, image slots, source declarations, visible summary mappings, verbatim summary numbers, plain-language status, claim evidence quotes, style preset usage, chart contracts, aesthetic contracts, component catalogue admission and artifact binding, visual asset provenance, registered layout locks, visual rhythm, poster contracts, anti-AI-slop patterns, visual QA evidence, browser rendering, and optional interaction behavior.

For artifacts with derived values, `node scripts/validate-data-provenance.mjs <artifact-dir>` performs static identity, containment, role, and hash checks. The legacy `--execute-trusted` path is disabled. Any calculation execution must enter through a digest-verified v2 plan and `run-execution-plan.mjs`; otherwise it is a policy bypass and must fail. Without policy-run evidence, derived artifacts cannot be `ready`.

For triad-driven work, also inspect `agent-handoffs/` or the project `.exp-skill/runs/<run-id>/role-handoffs/` directory. Reviewer approval or documented residual risk is required before claiming the artifact is ready.

In the V2 evidence contract, all published accessibility and privacy check ids are mandatory: `failed` blocks and `not_applicable` is not an allowed status. Privacy findings record id, severity, open/resolved status, summary, and evidence references; any open privacy finding blocks `ready`. Artifact-local sidecars and reviewer records remain diagnostic inputs but cannot authorize `ready`. Ready requires a runner-produced machine attestation outside the artifact, bound to a frozen execution-event snapshot, render profile, artifact digest, and plan digest. It also requires a host-supplied reviewer registry and reviewer attestation outside the artifact; the reviewer must be active, differ from the host-supplied artifact author, approve all seven checks, and review evidence no older than the machine attestation. Missing host identity or external evidence fails closed. These are filesystem and digest boundaries, not cryptographic identity or authentication.

Ready review is intentionally two-stage. First run the plan with `--artifact-author-id=<host-id>`; after `render-smoke`, the runner writes machine evidence under the external trust directory, while `ready` remains closed without reviewer inputs. A host reviewer then inspects the digest-bound artifact/render evidence and writes the external registry and attestation. Rerun the same canonical plan with `--machine-attestation=<first-run-path> --reviewer-registry=<host-path> --reviewer-attestation=<host-path>`. The second run consumes, and does not overwrite, the prior runner attestation; any artifact, plan, render-profile, registry, identity, or freshness drift fails validation.

For substantial work, base-validate `intake-direction.json` while collecting direction input. Immediately before Poster, rerun with `--require-confirmed --poster=<poster-handoff.json>`. A `needs_clarification` result is a deliberate pause state, not permission to infer the missing product brief.

`render-smoke.mjs` is optional only outside a resolved-plan evidence contract and requires Playwright from the host environment. In V2 profile mode it installs a context route before page creation or navigation. `deny_all` aborts every HTTP(S) request before send; `allowlist` continues exact allowed origins and aborts all others. Attempted requests remain in evidence, and any unauthorized attempt fails the gate. It then executes every declared setup/assertion and segment at 1440/390/320, measures strict layout and computed schematic disclosure, and hashes screenshots under `<artifact-dir>/qa/`. A missing state/segment, failed assertion, unauthorized request, or screenshot mismatch blocks evidence validation.

Component selection is valid only through the existing compiler and runner.
`validate-component-catalogue.mjs` fails closed on unknown provenance, license,
dependency, fallback, compatibility, accessibility, or performance facts.
`validate-component-usage.mjs` binds the manifest ids, visible HTML markers,
catalogue record digests, artifact digest, and runner-written resolution
sidecar. A passing catalogue fixture proves contract compatibility, not
production beauty, accessibility completeness, legal interpretation, or
reader value.

Use `--strict-layout` when obvious horizontal overflow, broken media, clipped text, or obvious visible text overlap would materially affect trust. Strict layout is heuristic. It does not prove aesthetic quality, all overlap cases, full accessibility, or native PPTX/PDF/Figma fidelity.

When `quality-report.md` says `visual_qa: smoke_passed`, the artifact directory must contain desktop and mobile screenshots under `qa/`. If screenshots are unavailable, keep `visual_qa: not_run` or use `manual_reviewed` with a written note.

`schemas/*.schema.json` are the published interchange contracts. `validate-schemas.mjs` checks that the manifest schema's required fields stay aligned with the validator's required fields. The final pass/fail behavior is defined by the scripts in `scripts/`.

For source-backed reports, dashboards, and chart frames, include `claim-map.json` and run `validate-claim-map.mjs`. V2 numeric evidence additionally requires the signed value, currency, unit, metric, entity, period, denominator, grain, source id, exact evidence text, and occurrence count to match both local source evidence and the exactly-once visible `data-claim-id`. This proves local source support only; it does not prove external truth or complete semantic entailment.

For source-backed reports, dashboards, chart frames, decks, and PPT handoffs, include `summary-map.json` and run `validate-summary-map.mjs`. The summary validator checks that mapped visible summaries exist in HTML, source quotes are local and readable, summary numbers appear verbatim in those source quotes, and plain-language review is recorded.

For tweakable artifacts, run `tweakable-smoke.mjs` when controls are part of the deliverable. It checks that core controls change DOM/CSS/localStorage state; it does not prove every possible interaction path.

For Swiss/Guizang-style decks and PPT handoffs, run `validate-aesthetic-contract.mjs`, `validate-asset-contract.mjs`, `validate-layout-lock.mjs`, and `validate-visual-rhythm.mjs`. These close local risks around fake screenshot labels, generated SVG text, unregistered layouts, accent flooding, missing reduced-motion fallback, and repetitive visual rhythm.

For posters, run `validate-poster-contract.mjs` and `validate-poster-anti-ai-slop.mjs`. These close local risks around missing `poster-plan.json`, missing hook, multiple primary headings, AI-default indigo/purple styling, emoji hooks, placeholder copy, and inflated language.

For reusable design systems, run `validate-design-system-package.mjs`. This verifies the Open Design-style package shape: manifest, design rationale, tokens, components, previews, and source evidence.

Run `capability-preflight.mjs` before claiming browser smoke, native PPTX, PDF export, Figma, live connector, or Open Design daemon coverage. `browser_smoke` checks package/binary availability; `browser_launch` verifies a real Chromium launch and may require host permissions. Missing optional runtimes should remain `not_claimed`, not silently become capabilities.

Browser entrypoints share `scripts/lib/playwright-runtime.mjs`. It resolves, in order: `DESIGN_PLAYWRIGHT_PATH` when explicitly configured as a Playwright module/package/`node_modules` root; package-local `node_modules/playwright`; then `<current-user-home>/.cache/codex-runtimes/*/dependencies/node/node_modules/playwright`, preferring `codex-primary-runtime`. Each candidate must export `chromium` with launch/executable APIs and point to an existing Chromium executable. Failure output lists attempted paths and the configuration action. This discovery avoids bundling or copying `node_modules` into the skill.

## Manual Validation

Scripts do not prove:

- external source truth;
- browser aesthetic quality;
- all visual overlap or clipping cases;
- chart interpretation;
- audience persuasion;
- PPTX fidelity;
- accessibility completeness.
- that Poster or an LLM did not perform arithmetic before a manually authored derived file was created;
- external source truth, formula intent, tamper-proof storage, or safety of untrusted calculation code; provenance validation proves only declared identity and reproducibility.

When possible, open `index.html` in a browser or render/screenshot it. Record the check in `quality-report.md`.

## Risk Closure Rule

Close only the risks that have direct evidence:

- Source provenance risk is closed when `validate-claim-map.mjs` passes with file-backed `evidence_quotes`.
- Summary integrity risk is closed when `validate-summary-map.mjs` passes with mapped `data-summary-id` entries and file-backed `source_quotes`.
- Summary number drift risk is closed when `validate-summary-map.mjs` passes with verbatim number tokens and no new, rounded, abbreviated, percent-converted, or signed variants.
- Browser execution risk is closed for the current host only when `capability-preflight.mjs --require=browser_launch` passes.
- Obvious layout-regression risk is closed for the checked examples only when strict browser smoke passes.
- Interaction risk is closed only for the controls exercised by `tweakable-smoke.mjs` or an equivalent targeted smoke.
- Swiss deck aesthetic-contract risk is closed only when the aesthetic, asset, layout-lock, and rhythm validators pass on the artifact.
- Poster anti-AI-slop risk is closed only when the poster contract and poster anti-AI-slop validators pass on the artifact.
- Component control-path risk is closed only when catalogue validation,
  digest-bound compiler resolution, runner-side component-usage validation,
  strict browser evidence, and independent aesthetic review all pass for the
  same artifact.
- Calculation-lineage risk is machine-checked for the trusted local production fixture. Formula correctness, source truth, and untrusted-code execution remain separate reviewer/security gates.

These are explicit non-claims, not open engineering risks in this package:

- external fact truth or freshness without an external trusted source check;
- complete semantic entailment beyond local quote and summary-map containment;
- subjective aesthetic quality without human or product-design review;
- accessibility completeness without a dedicated accessibility audit;
- native PPTX, PDF, Figma, live connector, or Open Design daemon fidelity without that runtime.
- real-user usability, comprehension, satisfaction, completion, retention, or business impact when no real-user sample or observed outcome was supplied.

When that evidence is missing, record a direct non-claim such as: "No claim is
made about real-user usage or impact; no real-user evidence was provided."
Also record the next evidence request. Do not mark a local render smoke or
reviewer opinion as user validation.

## Completion Rule

An artifact is ready only when:

- required files exist;
- validators pass;
- evidence and assumptions are recorded;
- visual QA is performed or explicitly marked unavailable;
- remaining risks are visible to the user.

For `artifact_status: ready`, visual QA cannot be `not_run`, semantic entailment cannot be `not_proven`, and accessibility cannot be `not_run`.
