# Validation

## Structural Validation

Run:

```bash
node scripts/validate-design-output.mjs <artifact-dir>
node scripts/validate-summary-map.mjs <artifact-dir>
node scripts/validate-claim-map.mjs <artifact-dir>
node scripts/validate-design-skill.mjs <skill-dir>
node scripts/capability-preflight.mjs --require=browser_smoke
node scripts/capability-preflight.mjs --require=browser_launch
node scripts/render-smoke.mjs <artifact-dir>/index.html --viewports=desktop,mobile
node scripts/render-smoke.mjs <artifact-dir>/index.html --viewports=desktop,mobile --strict-layout
node scripts/tweakable-smoke.mjs <artifact-dir>/index.html
```

These scripts check required files, manifest fields, placeholder text, deck layout metadata, image slots, source declarations, visible summary mappings, verbatim summary numbers, plain-language status, claim evidence quotes, style preset usage, chart contracts, visual QA evidence, browser rendering, and optional interaction behavior.

For triad-driven work, also inspect `agent-handoffs/` or the project `.exp-skill/runs/<run-id>/role-handoffs/` directory. Reviewer approval or documented residual risk is required before claiming the artifact is ready.

`render-smoke.mjs` is optional and requires Playwright from the host environment. Use it when browser loading, console-error checks, screenshot evidence, or responsive smoke coverage matters. It can write desktop and mobile screenshots under `<artifact-dir>/qa/`.

Use `--strict-layout` when obvious horizontal overflow, broken media, clipped text, or obvious visible text overlap would materially affect trust. Strict layout is heuristic. It does not prove aesthetic quality, all overlap cases, full accessibility, or native PPTX/PDF/Figma fidelity.

When `quality-report.md` says `visual_qa: smoke_passed`, the artifact directory must contain desktop and mobile screenshots under `qa/`. If screenshots are unavailable, keep `visual_qa: not_run` or use `manual_reviewed` with a written note.

`schemas/*.schema.json` are the published interchange contracts. `validate-schemas.mjs` checks that the manifest schema's required fields stay aligned with the validator's required fields. The final pass/fail behavior is defined by the scripts in `scripts/`.

For source-backed reports, dashboards, and chart frames, include `claim-map.json` and run `validate-claim-map.mjs`. Verified claims need `evidence_quotes` that are present in local source files. This proves local source support only; it does not prove external truth or complete semantic entailment.

For source-backed reports, dashboards, chart frames, decks, and PPT handoffs, include `summary-map.json` and run `validate-summary-map.mjs`. The summary validator checks that mapped visible summaries exist in HTML, source quotes are local and readable, summary numbers appear verbatim in those source quotes, and plain-language review is recorded.

For tweakable artifacts, run `tweakable-smoke.mjs` when controls are part of the deliverable. It checks that core controls change DOM/CSS/localStorage state; it does not prove every possible interaction path.

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

When possible, open `index.html` in a browser or render/screenshot it. Record the check in `quality-report.md`.

## Risk Closure Rule

Close only the risks that have direct evidence:

- Source provenance risk is closed when `validate-claim-map.mjs` passes with file-backed `evidence_quotes`.
- Summary integrity risk is closed when `validate-summary-map.mjs` passes with mapped `data-summary-id` entries and file-backed `source_quotes`.
- Summary number drift risk is closed when `validate-summary-map.mjs` passes with verbatim number tokens and no new, rounded, abbreviated, percent-converted, or signed variants.
- Browser execution risk is closed for the current host only when `capability-preflight.mjs --require=browser_launch` passes.
- Obvious layout-regression risk is closed for the checked examples only when strict browser smoke passes.
- Interaction risk is closed only for the controls exercised by `tweakable-smoke.mjs` or an equivalent targeted smoke.

These are explicit non-claims, not open engineering risks in this package:

- external fact truth or freshness without an external trusted source check;
- complete semantic entailment beyond local quote and summary-map containment;
- subjective aesthetic quality without human or product-design review;
- accessibility completeness without a dedicated accessibility audit;
- native PPTX, PDF, Figma, live connector, or Open Design daemon fidelity without that runtime.

## Completion Rule

An artifact is ready only when:

- required files exist;
- validators pass;
- evidence and assumptions are recorded;
- visual QA is performed or explicitly marked unavailable;
- remaining risks are visible to the user.

For `artifact_status: ready`, visual QA cannot be `not_run`, semantic entailment cannot be `not_proven`, and accessibility cannot be `not_run`.
