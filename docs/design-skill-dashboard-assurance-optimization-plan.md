# Design Skill Dashboard Assurance Implementation Plan

Run: `design-skill-dashboard-plan-delivery-20261012`
Owner: AI Engineer
Scope: Design Skill only
Status: implemented and validated on 2026-10-12; no artifact is self-promoted to `decision_ready` or `user_validated`

Implementation verification: `npm test` passed 259 tests with one environment-gated skip; `npm run test:strict` passed Chromium rendering and interaction checks; `npm run validate -- --strict` and packed-reference validation passed. Operational surfaces were manually inspected at 1440 / 390 / 320 px.

## 1. Goal, Baseline, And Limits

Goal: one deterministic dashboard path from catalogue resolution through plan, render evidence, check, Reviewer, evaluation, and showcase reporting.

Verified current facts:
- `design-profile/v2` and `design-profile-catalogue/v1` expose only `ppt`, `html`, and `poster`; `resolved_rules` has no locale field.
- `design-resolved-gate-plan/v3` accepts `dashboard`, but dashboard is absent from `designProfileArtifactTypes` and the schema condition that requires `design_profile` plus `template_resolution`.
- `scripts/design.mjs` does not include dashboard in `coreArtifactTypes` and only runs visual review when a root record already exists.
- The compiler exports exactly `VIS-ALIGN`, `VIS-LOCALE`, `VIS-ICON`, and `VIS-COLOR` from `scripts/validate-requirement-verification.mjs`.
- `design-requirement-verification/v1` has file refs `{ref,sha256}` and evidence refs `{ref,sha256,kind}`, but no shared artifact/plan/render chain.
- `design-render-spec/v2` and `design-render-profile/v2` already carry artifact, resolved-plan, render-spec, viewport, state, assertion, and screenshot data.
- `design-evaluation-record/v1` already binds current artifact bytes and supports `user_observed`, but has no task-observation section and currently rejects dashboards.
- `design-showcase-case/v1` stores five assurance labels but does not bind `user_validated` to an evaluation record.
- `design-reviewer-record/v4` and root `reviewer-record.json` are current; visual-review validation does not yet recompute all digest and identity bindings.

Occam limits:

| Entity | New count |
| --- | ---: |
| Runtime router, sidecar type, design system | 0 |
| Reviewer schema version, public CLI command | 0 |
| H0 requirement, render assertion family | 0 |

Keep `scripts/lib/design-profile.mjs` as the sole profile resolver, all existing schema versions, all five assurance labels, and current `profile`, `plan`, `check`, `preflight` public commands. Do not add another request authority or a status file.

## 2. DS-PLAN-001: Deterministic Dashboard, Locale, Plan, Check, Reviewer

### Exact locale authority and mapping

Add this exact object to the new `surface_contracts[id=dashboard]` in `design-systems/defaults/design-profile-catalogue.json`:

```json
{
  "locale": "zh-CN",
  "exempt_categories": [
    "brand",
    "technical_id",
    "source_field",
    "approved_abbreviation"
  ],
  "visible_text_violation_limit": 0,
  "accessible_name_violation_limit": 0
}
```

The field name is `locale_policy`. In `schemas/design-profile-catalogue.schema.json`, define this closed four-field object, allow surface id/artifact type `dashboard`, require `locale_policy` when `surface_contract.id == "dashboard"`, change the surface count from exactly 3 to exactly 4, and add `dashboard` to every preset's required `style_preset_by_surface` and `surface_emphasis` maps.

In `scripts/lib/design-profile.mjs`, resolve the catalogue surface first and assign `resolved_rules.locale_policy = structuredClone(surface.locale_policy)` with no fallback, inference, request override, or profile-slug branch. In `schemas/design-profile.schema.json`, define the same closed object and conditionally require it when `surface.id == "dashboard"`. Thus the only mapping is:

`catalogue.surface_contracts[dashboard].locale_policy` -> resolver copy -> `design-profile/v2.resolved_rules.locale_policy`.

`tests/design-profile.test.mjs` must prove exact deep equality, `zh-CN`, zero limits, deterministic replay, and rejection of a missing field, extra field, changed locale, or resolver output not equal to the catalogue. Existing 18 public routes remain unchanged; the dashboard matrix is additive.

### Dashboard profile, plan, and check

1. Add the dashboard contract with artifact type `dashboard`, delivery mode `responsive_document`, edge tolerance `2`, one local icon family with visible-label fallback, and operational color-role separation.
2. Map every existing product preset's dashboard style and emphasis in the catalogue; the operational dashboard route resolves `style_preset: "operational-dashboard"`.
3. In `scripts/compile-execution-plan.mjs`, add dashboard to `designProfileArtifactTypes`; use existing `validateResolvedDesignProfile` and `resolveSelectedTemplate`; reject absent profile, artifact mismatch, style mismatch, template mismatch, or locale mismatch before digesting.
4. In `schemas/execution-plan.schema.json`, add dashboard to the existing conditional core set requiring `design_profile` and `template_resolution`; retain `design-resolved-gate-plan/v3`.
5. In `scripts/design.mjs`, add dashboard to `coreArtifactTypes`; Standard and Assured dashboard checks require the supplied digest-valid execution plan.
6. In `assets/templates/registry.json`, make both existing operational dashboard entries advertise `manual-reviewer-pass`; add no template.
7. Bind both dashboard templates to the shared existing-type `layout-registry/v1` contract at `assets/templates/layouts/operational-product-v1.json`, so topology validation remains deterministic without adding a router or template.

Positive tests in `tests/design-profile.test.mjs`, `tests/execution-plan.test.mjs`, and `tests/validators.test.mjs`: equal briefs yield byte-equivalent profiles/plans; dashboard requires and binds profile/template/locale; `profile -> plan -> check` uses one plan.

Negative tests: missing or altered profile; unknown surface/preset/template; unsupported template/artifact pair; locale catalogue/profile/render mismatch; stale or recomputed-tampered plan; missing check-time plan. Every case exits nonzero.

### Canonical Reviewer v4 fail closed

For Standard and Assured operational dashboards, `scripts/design.mjs` must require root `reviewer-record.json` and call `scripts/validate-visual-review.mjs`; `--record` remains diagnostic-only and cannot authorize `check`. `schemas/reviewer-record.schema.json` remains v4-compatible and no v5 is added.

The validator receives the bound execution plan, reuses current digest logic from `scripts/lib/execution-plan-binding.mjs` and `scripts/validate-evidence-contract.mjs`, and requires:
- `reviewer_id !== artifact_author_id`;
- `resolved_plan_digest` equals the validated plan's `resolved_gate_plan_digest`;
- `artifact_digest`, `content_digest`, and `surface_digest` equal recomputed current values;
- `alignment`, `locale`, `iconography`, and `palette` each occur exactly once, are `passed`, and reference current files;
- every required craft/ownership threshold passes independently; no score compensates for any failed operational check;
- Assured host machine/reviewer attestations remain additional gates, never substitutes.

Extend `tests/visual-review.test.mjs` and `tests/validators.test.mjs`: a current independent root v4 record passes; missing root, alternate filename, v3, self-review, digest drift, duplicate/missing/failed operational checks, and missing evidence fail even with all craft scores at 4.

## 3. DS-PLAN-002: Four H0 Semantics And One Current Digest Chain

The only operational H0 ids remain `VIS-ALIGN`, `VIS-LOCALE`, `VIS-ICON`, and `VIS-COLOR`. No generic requirement can substitute for one, and no fifth id is added.

### Exact in-place binding shape

In `schemas/requirement-verification.schema.json`, add `evidence_binding` directly to each existing requirement object and conditionally require it only for the four H0 ids:

```json
{
  "artifact": {"ref": "index.html", "sha256": "<sha256>"},
  "plan": {"ref": ".design/execution-plan.json", "sha256": "<sha256>"},
  "render_spec": {"ref": ".design/render-spec.json", "sha256": "<sha256>"},
  "render_profile": {"ref": "render-profile.json", "sha256": "<sha256>"},
  "screenshots": [
    {
      "ref": "qa/<capture>.png",
      "sha256": "<sha256>",
      "viewport": 1440,
      "state": "default"
    }
  ]
}
```

`artifact`, `plan`, `render_spec`, and `render_profile` are closed `{ref,sha256}` objects. Every screenshot is exactly `{ref,sha256,viewport,state}`, where `viewport` is one of `1440|390|320` and `state` is a non-empty declared render state. Existing `evidence_refs` and `kind` remain; the binding augments rather than replaces semantic evidence.

### Equality and freshness rules

`scripts/validate-requirement-verification.mjs` must parse the bound JSON and enforce all of these before counting H0 evidence:

1. Every ref is artifact-relative, regular, non-symlinked, current, and hashes to its `sha256`.
2. All four H0 records have byte-identical `artifact`, `plan`, `render_spec`, and `render_profile` bindings.
3. `artifact` equals the `artifact_refs` entry for the same ref; the plan's `artifact.artifact_dir` resolves to the validated artifact root.
4. Parsed plan passes current execution-plan digest validation; its `resolved_gate_plan_digest` equals render spec `resolved_plan_digest` and render profile `resolved_plan_digest`.
5. Runtime render spec passes `schemas/render-spec.schema.json`; its immutable fields and `spec_digest` equal `plan.render_spec`, and its `artifact_digest` equals the current `computeArtifactDigest(root)`.
6. Render profile `render_spec_digest` equals render spec `spec_digest`; render profile `artifact_digest` equals render spec `artifact_digest`.
7. Every screenshot binding matches exactly one render-profile segment with the same `screenshot_ref`, `screenshot_sha256`, viewport width, and containing state id. Every required viewport/state segment is bound; undeclared extras cannot satisfy coverage.
8. A `passed` H0 requires all mapped assertions to exist and have `passed: true`; the requirement's own `status` never overrides measured failure.

### Existing evidence semantics

| H0 id | Required current payload and states | Pass rule |
| --- | --- | --- |
| `VIS-ALIGN` | Render-profile `relation` assertions at 1440/390/320, default and dense | Edge `delta_px_max <= 2`; icon center `<= 1`; declared tolerance cannot exceed those limits |
| `VIS-LOCALE` | `locale` assertions at all three viewports, default/dense/error | `actual.locale == resolved_rules.locale_policy.locale == "zh-CN"`; both violation counts are 0 after only declared exemptions |
| `VIS-ICON` | `icon` assertions at all three viewports, default/dense/error | One declared family; local resource; current asset SHA/provenance; accessible name and visible label; center delta `<= 1` |
| `VIS-COLOR` | Bound error screenshots at all three viewports plus plan `resolved_theme` | Reuse `validateColorContract` from `scripts/validate-color-system.mjs`; accent differs from positive/warning/negative/danger; no color-only pass |

`VIS-COLOR` adds no render assertion family. Screenshot-only locale, prose-only icon, or one H0's valid payload attached to another H0 fails.

### Exact producer authority and state-matrix rule

`design-systems/operational-product/preview/render-spec.json` is the sole checked-in operational assertion input. Its existing producer is `operationalRenderSpec(componentHtml)` in `scripts/build-production-design-systems.mjs`, which writes that exact path. The compiler-generated `plan.render_spec`, and the runtime `.design/render-spec.json` written by `scripts/run-execution-plan.mjs`, are derived artifacts, never independent assertion authorities.

For an operational dashboard, `scripts/compile-execution-plan.mjs` must load the checked-in input through the selected `operational-product` template/design-system route, validate it with `schemas/render-spec.schema.json`, strip only preview bindings (`resolved_plan_digest`, `artifact_digest`, `spec_digest`), and compare the request's viewports, segments, states, setup, and assertions to that canonical payload. It rejects rather than merges or accepts caller replacements. It then injects the canonical payload into `plan.render_spec`, computes its new `spec_digest`, and `scripts/run-execution-plan.mjs` adds only current plan/artifact digests.

The existing producer function must place cloned existing assertions as follows:

| State | Required existing kinds |
| --- | --- |
| `default` | existing `relation`, `locale`, and `icon` assertions |
| `dense` | the same four existing `relation` assertions plus the same existing `locale` and `icon` assertions, alongside current dense checks |
| `error` | the same existing `locale` and `icon` assertions, alongside current error checks |

No new kind, family, or sidecar is permitted. `scripts/validate-design-system-package.mjs` validates the checked-in source. Compiler validation additionally requires exactly `default`, `dense`, `error`, the matrix above, relation tolerances `<=2` and icon-center tolerances `<=1`, `locale == design_profile.resolved_rules.locale_policy.locale`, and icon fields equal to the selected local package manifest/profile. Missing state/kind, duplicate state id, divergent clone, request override, or digest mismatch fails before plan digesting.

Positive tests: `tests/production-design-systems.test.mjs` asserts the exact per-state kind matrix in the generated checked-in input; `tests/execution-plan.test.mjs` proves the compiler derives an equal immutable matrix and rejects a conflicting request; `tests/execution-runner.test.mjs` proves runtime changes only current digests; `tests/render-spec-browser.test.mjs` measures every required kind at every required viewport/state. Missing-state regressions delete `dense`, delete `error`, delete one required kind from each applicable state, and mutate locale/icon/relation clones; producer/package, compiler, and browser tests must reject the relevant fixture.

### Producer, schema, validator, and tests

| Responsibility | Current file and planned change |
| --- | --- |
| Checked-in assertion producer/input | `scripts/build-production-design-systems.mjs` -> `design-systems/operational-product/preview/render-spec.json`: own and emit the exact matrix above |
| Plan producer | `scripts/compile-execution-plan.mjs`: validate/load that input, inject the canonical payload, preserve four H0 ids |
| Runtime derived producer | `scripts/run-execution-plan.mjs`: write `.design/execution-plan.json` and derived `.design/render-spec.json`, adding only current artifact/plan digests |
| Screenshot/render-profile producer | `scripts/render-smoke.mjs`: retain current screenshot hashes and viewport/state/assertion output; add no sidecar |
| Render-spec shape | `schemas/render-spec.schema.json`: retain v2 and existing relation/locale/icon families |
| Requirement shape | `schemas/requirement-verification.schema.json`: add only the in-place `evidence_binding` definitions and H0 condition |
| Semantic/freshness validator | `scripts/validate-requirement-verification.mjs`: enforce the equality chain and H0-specific payload rules |
| Tests | `tests/production-design-systems.test.mjs`, `tests/execution-plan.test.mjs`, `tests/requirement-verification.test.mjs`, `tests/render-spec-browser.test.mjs`, `tests/execution-runner.test.mjs` |

Positive fixture: all four H0 records share one current chain and exact state matrix. Negative matrix: swapped kinds; screenshot/prose-only evidence; `2.01px` edge or `1.01px` icon center; missing viewport/state/accessibility name; remote/mixed/unlicensed icon; excessive declared tolerance; stale artifact/plan/spec/profile/screenshot; duplicate screenshot tuple; forged `passed`; color pass without bound error screenshots.

## 4. DS-PLAN-003: Sole User-Validation Authority And Monotonic Reporting

### Authority contract

`design-evaluation-record/v1` at root `design-evaluation.json` is the sole authority for user validation. Add one optional closed `task_observation` to `schemas/design-evaluation-record.schema.json`:

```json
{
  "status": "not_run|passed|failed|rejected",
  "evaluator_type": "user_observed",
  "observed_task_count": 0,
  "successful_task_count": 0,
  "failed_task_count": 0,
  "rejected_task_count": 0,
  "task_results": [
    {
      "task_id": "stable-task-id",
      "outcome": "passed|failed|rejected",
      "artifact_sha256": "<current top-level artifact_sha256>",
      "evidence_refs": [{"ref": "evidence/task.json", "sha256": "<sha256>"}],
      "observed_at": "ISO-8601",
      "rejection_of_task_id": "prior-task-id"
    }
  ]
}
```

Each task result is a closed, immutable append-only event and requires a unique stable `task_id` (the event/node id), `outcome`, current top-level `artifact_sha256`, at least one digest-bound closed `{ref,sha256}`, and parseable `observed_at`. A passed event has no relation and can never be rewritten or superseded. A distinct rejected event requires `rejection_of_task_id` targeting one earlier terminal passed event; `supersedes_task_id` remains allowed only when replacing an earlier non-passed failed/rejected event. Every relation target must be distinct, earlier, in this record, bound to the same current artifact, current at validation time, and terminal immediately before the new event. Reject missing or forward targets, duplicate ids or incoming edges, duplicate rejection of one target, mixed-edge cycles, cross-artifact or stale targets, and relation fields invalid for the event outcome. Preserve target and successor events in `task_results`.

Rules in `scripts/validate-design-evaluation.mjs`:
- resolve every evidence ref under the artifact root as a current regular non-symlink file and verify its SHA; reject one binding reused by different task ids, evidence swap, and byte drift;
- construct the directed event graph from validated relations, retain every event, and derive effective terminal outcomes from nodes with no valid successor; a rejection successor replaces its target only in the effective projection, never in stored history;
- derive counts from effective terminal events only: observed is their length and successful/failed/rejected count outcomes; supplied counts and status must equal the derivation;
- derive `not_run` only from an empty list, `passed` only from at least one terminal result and all passed, `failed` when any terminal result failed and none rejected, and `rejected` when any terminal result is rejected; precedence is `rejected > failed > passed > not_run`;
- require `evaluator_types` to contain `user_observed`; every entry artifact hash must equal current top-level `artifact_sha256`;
- missing `task_observation` remains schema-valid for compatibility but cannot authorize `user_validated`; add dashboard support without weakening three-second or blinded-preference rules.

Extend `tests/design-evaluation.test.mjs` for a valid multi-task dashboard pass; a valid later pass-to-reject event that preserves both entries and derives `rejected`; and absent optional section, duplicate ids, supplied count/outcome mismatch, zero-sample pass, artifact/evidence swap or drift, non-user evaluator, missing/forward/duplicate/cyclic/cross-artifact/stale rejection target, duplicate rejection, forbidden relation field, and failed task.

### Showcase consumes; runner reports only

In `schemas/showcase-case.schema.json`, add optional `user_validation_binding: {ref,sha256}`. If `assurance.user_validated == "passed"`, require this binding. In `scripts/validate-showcase-registry.mjs`, resolve it inside `artifact_ref`, hash current bytes, require `design-evaluation-record/v1`, invoke the same evaluation validator, and require `task_observation.status == "passed"` against current evaluated artifact bytes. The showcase field is a checked projection, not an authority.

If evaluation is absent, stale, failed, or effectively rejected, `assurance.user_validated` must be `not_run` or `not_claimed`; a stale `passed` case fails eligibility. A valid later rejection event targeting an earlier passed task preserves both events, takes precedence, and demotes the highest status to `decision_ready` or lower. Extend `tests/showcase-registry.test.mjs` for valid consumption, missing/stale binding, self-declared pass, preserved pass-plus-rejection demotion, invalid rejection graph, and evidence drift.

Keep the ordered labels:

| Highest reportable status | Current prerequisites |
| --- | --- |
| `structure_passed` | current `validate-design-output` pass |
| `evidence_traced` | structure plus current requirement/evidence pass |
| `visually_reviewed` | evidence plus canonical current independent Reviewer v4 |
| `decision_ready` | visual review plus applicable Assured host-external boundary |
| `user_validated` | decision readiness plus authoritative current task observation pass |

Add the optional ordered vocabulary to `schemas/execution-plan.schema.json` `result_contract` and an orthogonal `evidence_status` report to `scripts/run-execution-plan.mjs`. The runner recomputes the highest proven stage from current validator outcomes on each run, never writes evaluation/showcase authority, never trusts manifest/quality-report status, and cannot skip a prerequisite. Existing execution/assurance/delivery fields remain unchanged. `tests/execution-plan.test.mjs` and `tests/execution-runner.test.mjs` cover one-stage promotion, missing Reviewer/H0 ceiling, byte-drift demotion, approval-only ceiling, ignored self-award, and later rejection demotion.

## 5. Implementation Order And Verification

1. Add negative characterization tests; confirm each fails for the intended current gap.
2. Add dashboard catalogue/profile/locale mapping, then compiler/schema/check binding.
3. Enforce canonical Reviewer v4 and current digest/identity checks.
4. Add H0 in-place binding schema and validator semantics using current producers.
5. Add optional task observation, showcase consumption, and report-only status derivation.
6. Run focused tests after each slice, then full validation; request a new independent audit.

```bash
node --test tests/design-profile.test.mjs tests/execution-plan.test.mjs
node --test tests/visual-review.test.mjs tests/validators.test.mjs
node --test tests/requirement-verification.test.mjs tests/render-spec-browser.test.mjs
node --test tests/design-evaluation.test.mjs tests/showcase-registry.test.mjs
node --test tests/execution-runner.test.mjs tests/evidence-contract.test.mjs
npm test
npm run validate -- --strict
node scripts/validate-packed-references.mjs .
```

Positive CLI acceptance is `profile dashboard -> plan dashboard -> check dashboard`. Each missing, mismatched, stale, self-authored, semantically swapped, or later-rejected input must exit nonzero with fixture-specific evidence. Validator success is not aesthetic approval or real-user success.

## 6. Compatibility, Rollback, And Residual Risk

- Existing poster, HTML deck, PPT handoff, report, chart, screenshot, tweakable, design-system, and multi-artifact behavior remains unchanged.
- Existing v3 plans remain schema-readable; only newly compiled dashboards require dashboard profile/locale binding. `design-profile/v2`, Reviewer v4, and evaluation v1 versions remain unchanged.
- Records lacking optional task observation remain valid but cannot claim `user_validated`. Operational H0 records must be regenerated for the new required binding chain.
- Roll back in reverse slices: report-only status/showcase consumption, task observation, H0 bindings, Reviewer enforcement, dashboard profile/locale. Remove each slice with its tests; never weaken a test to retain partial behavior.
- Stop if dashboard resolution needs a second router, if evidence needs a new sidecar/assertion family, or if host identity cannot establish the applicable ceiling.
- Full browser evidence depends on Playwright Chromium. Legacy records may become stale under current-byte checks. Record unrelated baseline failures without expanding scope.
- Independent Quality and Risk Auditor must review `DS-AUDIT-F001..F003` and `DS-PLAN-001..003`; AI Engineer does not approve this plan.
