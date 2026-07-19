# Assurance Ladder

## Purpose

Translate technical evidence into a user-readable delivery state. The ladder describes what was actually proved; it does not add five workflows or replace the selected risk lane.

## Stages

### `structure_passed`

Required files, declared contracts, and applicable structural checks passed. This does not prove source truth, aesthetic quality, accessibility completeness, or runtime fidelity.

### `evidence_traced`

Source and code-derived lineage required by the selected lane were traced to local evidence. Local hashes and quotes prove identity/support at review time, not external truth, freshness, formula intent, or complete semantic entailment.

### `visually_reviewed`

The actual target surface was inspected at required viewports/states. Browser or structural validation alone cannot set this stage. Record reviewer, surface, evidence, defects checked, and remaining limits.

### `decision_ready`

Semantic interpretation, intended scenario, and material risks were reviewed, with no unresolved blocking or major finding. This status is scoped to the declared audience and decision; it does not prove a real user can succeed.

### `user_validated`

Observed evidence exists from the stated users performing the stated task. Internal review, a fixture, a smoke test, an attractive screenshot, or stakeholder opinion cannot set this stage.

## Status Record

Each stage uses `passed`, `failed`, `not_run`, or `not_applicable` and includes evidence plus a plain-language reason:

```json
{
  "stage": "visually_reviewed",
  "status": "passed",
  "evidence": ["qa/contact-sheet.png", "quality-report.md"],
  "reason": "The target surface was inspected at the declared desktop and mobile viewports."
}
```

## Monotonicity and Truth Rules

- A higher stage cannot pass while a required lower stage failed or was not run.
- `not_applicable` needs a reason tied to the lane and artifact.
- Missing evidence is `not_run` or `failed`, never an inferred pass.
- A cached automatic check may support `structure_passed` or local evidence identity when its cache key is valid; it cannot prove a human or external stage.
- Human approval, real visual review, external freshness, independent review, publication approval, and user validation are never cacheable or auto-passed. They affect assurance/delivery only; execution admission is machine policy.
- `ready` may remain in legacy artifact files, but delivery must expand it into the ladder so the user can see the exact boundary.

## Explicit Human Gates

The compiler emits these `cacheable: false` gates when their facts apply:

| Gate id | Applies when | Evidence boundary |
| --- | --- | --- |
| `real-surface-visual-review` | every lane | a human inspected the actual generated/rendered target surface; required for `visually_reviewed` |
| `source-freshness-review` | source-backed | a human assessed whether source age/identity is fit for the decision; a hash alone is insufficient |
| `semantic-claims-review` | source-backed | a human reviewed summaries, claims, recommendations, scope, strength, conditions, numbers, and units |
| `code-and-formula-review` | derived data | a human reviewed code behavior and formula intent, denominator, cohort, filters, time window, and unit |
| `interaction-review` | interactive | a human reviewed consequential states, defaults, controls, persistence, error/recovery behavior, and conclusion stability |
| `independent-high-assurance-review` | Assured | an independent context reviews the integrated evidence and closes blocking/major findings |
| `publication-approval` | publication target | an authorized human approves the specific release after all prerequisite evidence |

`manual-reviewer-pass` remains separate when registered by the template or required for Standard work. `independent-high-assurance-review` is an integration review, not a shortcut: it does not subsume visual, freshness, semantic, formula, interaction, or publication gates. Each applicable gate needs its own evidence and none authorizes execution.

Untrusted code is `zero_spawn`. Only a newly compiled request whose registry, hashes, paths, argv, and host capabilities machine-classify as trusted or restricted may schedule execution. Review records remain assurance evidence.

## Delivery Copy

Every handoff should be understandable in under 30 seconds:

```text
Lane: <Express|Standard|Assured> — <observable reasons>
Proven: <passed ladder stages and evidence>
Not proven: <not_run, not_applicable, or external guarantees>
Next: <smallest action that raises assurance>
```

If blocked, also record:

```text
blocked_at: <stage or gate>
preserved_work: <safe artifacts and evidence already retained>
smallest_next_action: <one concrete action>
resume_when: <observable condition>
```

Ask the user only when the missing decision materially changes shape, truth, risk, or delivery. Otherwise preserve work and continue with an explicit reversible assumption.
