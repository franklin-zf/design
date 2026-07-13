# Validation

## REQ-002 Ready Gate Proposal

This is the product contract for a future implementation. It is a suggested
gate, not a claim that the current scripts implement these checks.

An artifact may be called `ready` only when all applicable gates below pass:

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

The smallest gate result should expose:

```json
{
  "status": "ready|partial|blocked|needs_clarification",
  "blocking_reasons": [],
  "passed_gates": [],
  "not_claimed": [],
  "reviewer_record_ref": ""
}
```

The fields and result above are implementation guidance for REQ-002. They are
not current validator output.

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
node scripts/validate-design-skill.mjs <skill-dir>
node scripts/validate-design-system-package.mjs <skill-dir> swiss-deck
node scripts/validate-aesthetic-contract.mjs <artifact-dir>
node scripts/validate-asset-contract.mjs <artifact-dir>
node scripts/validate-layout-lock.mjs <artifact-dir>
node scripts/validate-visual-rhythm.mjs <artifact-dir>
node scripts/validate-poster-contract.mjs <artifact-dir>
node scripts/validate-poster-anti-ai-slop.mjs <artifact-dir>
node scripts/capability-preflight.mjs --require=browser_smoke
node scripts/capability-preflight.mjs --require=browser_launch
node scripts/render-smoke.mjs <artifact-dir>/index.html --viewports=desktop,mobile
node scripts/render-smoke.mjs <artifact-dir>/index.html --viewports=desktop,mobile --strict-layout
node scripts/tweakable-smoke.mjs <artifact-dir>/index.html
```

These scripts check intake direction completeness, required files, manifest fields, placeholder text, deck layout metadata, image slots, source declarations, visible summary mappings, verbatim summary numbers, plain-language status, claim evidence quotes, style preset usage, chart contracts, aesthetic contracts, visual asset provenance, registered layout locks, visual rhythm, poster contracts, anti-AI-slop patterns, visual QA evidence, browser rendering, and optional interaction behavior.

For artifacts with derived values, run `node scripts/validate-data-provenance.mjs <artifact-dir> --execute-trusted` only on reviewed local calculation code. It verifies source/code/test/output hashes, path containment, source/output separation, rerun output identity, deterministic test exit, and source stability in a temporary copy. Without this evidence, derived artifacts cannot be `ready`.

For triad-driven work, also inspect `agent-handoffs/` or the project `.exp-skill/runs/<run-id>/role-handoffs/` directory. Reviewer approval or documented residual risk is required before claiming the artifact is ready.

For substantial work, base-validate `intake-direction.json` while collecting direction input. Immediately before Poster, rerun with `--require-confirmed --poster=<poster-handoff.json>`. A `needs_clarification` result is a deliberate pause state, not permission to infer the missing product brief.

`render-smoke.mjs` is optional and requires Playwright from the host environment. Use it when browser loading, console-error checks, screenshot evidence, or responsive smoke coverage matters. It can write desktop and mobile screenshots under `<artifact-dir>/qa/`.

Use `--strict-layout` when obvious horizontal overflow, broken media, clipped text, or obvious visible text overlap would materially affect trust. Strict layout is heuristic. It does not prove aesthetic quality, all overlap cases, full accessibility, or native PPTX/PDF/Figma fidelity.

When `quality-report.md` says `visual_qa: smoke_passed`, the artifact directory must contain desktop and mobile screenshots under `qa/`. If screenshots are unavailable, keep `visual_qa: not_run` or use `manual_reviewed` with a written note.

`schemas/*.schema.json` are the published interchange contracts. `validate-schemas.mjs` checks that the manifest schema's required fields stay aligned with the validator's required fields. The final pass/fail behavior is defined by the scripts in `scripts/`.

For source-backed reports, dashboards, and chart frames, include `claim-map.json` and run `validate-claim-map.mjs`. Verified claims need `evidence_quotes` that are present in local source files. This proves local source support only; it does not prove external truth or complete semantic entailment.

For source-backed reports, dashboards, chart frames, decks, and PPT handoffs, include `summary-map.json` and run `validate-summary-map.mjs`. The summary validator checks that mapped visible summaries exist in HTML, source quotes are local and readable, summary numbers appear verbatim in those source quotes, and plain-language review is recorded.

For tweakable artifacts, run `tweakable-smoke.mjs` when controls are part of the deliverable. It checks that core controls change DOM/CSS/localStorage state; it does not prove every possible interaction path.

For Swiss/Guizang-style decks and PPT handoffs, run `validate-aesthetic-contract.mjs`, `validate-asset-contract.mjs`, `validate-layout-lock.mjs`, and `validate-visual-rhythm.mjs`. These close local risks around fake screenshot labels, generated SVG text, unregistered layouts, accent flooding, missing reduced-motion fallback, and repetitive visual rhythm.

For posters, run `validate-poster-contract.mjs` and `validate-poster-anti-ai-slop.mjs`. These close local risks around missing `poster-plan.json`, missing hook, multiple primary headings, AI-default indigo/purple styling, emoji hooks, placeholder copy, and inflated language.

For reusable design systems, run `validate-design-system-package.mjs`. This verifies the Open Design-style package shape: manifest, design rationale, tokens, components, previews, and source evidence.

Run `capability-preflight.mjs` before claiming browser smoke, native PPTX, PDF export, Figma, live connector, or Open Design daemon coverage. `browser_smoke` checks package/binary availability; `browser_launch` verifies a real Chromium launch and may require host permissions. Missing optional runtimes should remain `not_claimed`, not silently become capabilities.

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
