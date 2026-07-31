# Risk Profiles

## Purpose

Choose the lightest assurance lane that fits observable risk. The lane controls references, sidecars, checks, human gates, and delivery claims. It never changes the immutable-source or honest-claims floor.

Use explicit facts rather than adjectives such as “substantial” or “important.” Unknown material facts fail closed by escalating one lane. A requested profile is an assurance floor, never permission to downgrade.

## Required Routing Facts

Record all of these; do not infer a missing boolean as `false`:

- artifact type, output surface, and template id;
- whether claims are source-backed;
- derived data: `none` or `derived`, with a machine-classified execution policy of `trusted`, `restricted`, or `untrusted`;
- sensitive data;
- publication or formal decision target;
- dependent multi-artifact output;
- consequential interactivity;
- requested profile: `auto`, `express`, `standard`, or `assured`.

## Deterministic Precedence

Apply `Assured > Standard > Express`.

### Assured

Select when any of these are true:

- derived data is not `none`;
- data or content is sensitive;
- the artifact is intended for publication or a formal/high-impact decision;
- untrusted code or unknown executable content is present;
- multiple dependent artifacts are required;
- interactivity can change a conclusion or stored state;
- the artifact type is `multi-artifact`;
- the user explicitly requests Assured.

Required: complete source/calculation provenance, machine-admitted isolated execution, every applicable gate, human release control, and independent review. Untrusted code is always `zero_spawn`; human review cannot change admission.

### Standard

Select only when no Assured trigger is present and any of these are true:

- claims are source-backed;
- the artifact is a report, dashboard, chart frame, deck/PPT handoff, screenshot evidence board, or design-system handoff;
- the user explicitly requests Standard.

Required: source identity/freshness when material, applicable summary and claim maps, Designer and independent Reviewer handoffs, target-surface QA, and evidence-traced delivery status.

### Express

Select only when neither higher lane applies and all are true:

- one reversible artifact for internal or exploratory use;
- known direction and surface;
- no source-backed factual claim;
- no derived value, sensitive data, untrusted execution, publication target, dependent multi-artifact output, or consequential interactivity;
- requested profile is `auto` or `express`.

Required: truth floor, reader job, shape, Taste Contract, registered-template or no-template decision, applicable structural checks, one real-surface inspection, and explicit omitted guarantees.

## Non-Overridable Rules

- An explicit profile may raise assurance but cannot lower it.
- Unknown template ids, artifact/template mismatch, incomplete facts, or unknown validation gates block compilation.
- Express cannot waive source fidelity, honest schematic/screenshot labels, or visual inspection.
- Standard cannot omit registered gates or source/claim/summary gates added by its risk facts.
- No lane can cache or auto-pass the compiler's human gates. Independent review is additive and does not satisfy visual, freshness, semantic, formula, trust, interaction, or publication gates.
- Shadow mode records the selected path and comparison evidence; it does not imply release approval.

## Effective Gate Composition

The registry and compiler own different truths:

- `assets/templates/registry.json` is authoritative for template identity, artifact compatibility, reader-job fit, and the template's base structural, aesthetic, asset, interaction, and runtime gates.
- The compiler is authoritative for risk-derived supplements. It forms the effective plan as `registry base gates + applicable risk-derived gates + human gates` and deduplicates by gate id without dropping either source.

Mandatory supplements:

| Observable fact | Required supplement |
| --- | --- |
| every request | `real-surface-visual-review` |
| `source_backed: true` | `source-freshness-review` and `semantic-claims-review`; source-backed visible summaries also require `summary-map.json` plus `validate-summary-map`; source-backed visible claims require `claim-map.json` plus `validate-claim-map` |
| `derived_data != none` | `code-and-formula-review`, separate source/calculations/tests/derived output, `data-provenance.json`, calculation tests, and `validate-data-provenance` after code trust is established |
| execution policy class is `untrusted` | `blocked_untrusted` with zero artifact/gate spawn; only new machine-verifiable facts in a new request may change classification |
| `interactive: true` | `interaction-review` |
| Assured profile | `independent-high-assurance-review` in addition to every applicable specialist gate |
| `publication_target: true` | `publication-approval` after other required evidence is complete |

Template compatibility is decided from artifact type, reader job, avoidance conditions, and required surface capability—not by asking one registry entry to enumerate every future risk supplement. Do not reject a shape-compatible template merely because a risk-derived gate is absent from its base list when the compiler can append that gate. Conversely, never treat a template or artifact as complete merely because every registry base gate passed.

Risk-derived assets remain conditional. In particular, an Assured dashboard with `derived_data: none` does not need `calculations/`, `derived/`, or `data-provenance.json` solely because it is Assured. Source-backed summary/claim controls still apply independently.

Every named human gate is `cacheable: false` and remains pending until a human supplies direct evidence. `manual-reviewer-pass`, when registered by a template or required for Standard work, also remains separate.

`independent-high-assurance-review` checks the integrated Assured package; it does not subsume or perform `real-surface-visual-review`, `semantic-claims-review`, `code-and-formula-review`, `interaction-review`, or `publication-approval`. Each applicable owner records its own evidence before independent acceptance; none is execution authority.

An untrusted plan is never mutated or manually overridden. Supply a new v2 request with an exact registered entrypoint, code/lock hashes, safe fixed argv, and required host capabilities; compile a new digest. Only a new machine-classified trusted/restricted plan may schedule execution; the prior untrusted plan remains non-executable evidence.

## Route Disclosure

Every plan and delivery states:

```text
Lane: <Express|Standard|Assured>
Why: <stable observable trigger facts>
Required assurance: <applicable guarantees>
Not run / not claimed: <omitted or external guarantees>
Escalate when: <smallest additional trigger>
```

See `schemas/execution-plan.schema.json` and `scripts/compile-execution-plan.mjs` for the executable interchange contract. Validator CLIs remain independently callable for static checks, but executable argv is admitted only by `run-execution-plan.mjs`; legacy `--execute-trusted` is rejected.
