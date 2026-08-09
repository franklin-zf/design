# Advanced Assurance

## Trigger

Load this reference only for derived values, sensitive or untrusted inputs, publication, formal decisions, consequential interaction, dependent multi-artifact delivery, explicit high assurance, or explicit multi-agent execution.

## Controlled Plan

Compile a versioned request into an immutable execution plan:

```bash
node scripts/design.mjs plan request.json --out=execution-plan.json --shadow
node scripts/run-execution-plan.mjs execution-plan.json --workers=2
```

Shadow mode records decisions without authorizing release. Runtime cache is off and reports `cache_capability=not_implemented`. Unknown telemetry remains `unknown`. Legacy v1 requests are import-only through `migrate-execution-request-v1.mjs`.

Untrusted code is `zero_spawn`. Derived execution starts only through a digest-verified v2 plan with a registered CPU/memory limiter. Caller flags, signatures, and reviewer approval never change execution class.

## Evidence Bundle

Assured delivery binds source inventory, claim and summary maps, data provenance, immutable render specification, browser profile, accessibility checks, privacy checks, artifact digest, plan digest, machine evidence, reviewer registry, reviewer attestation, and reviewer record.

Artifact-authored sidecars cannot self-authorize `ready`. Machine evidence is runner-produced outside the artifact root. Reviewer identity must differ from the host-supplied artifact author, and approval binds current artifact, plan, and render digests. The present boundary is filesystem and digest based; it does not claim cryptographic identity authentication.

## Multi-Agent Roles

- **Poster** owns source-grounded narrative and proposed analysis questions, never calculated results.
- **Analyst or builder** executes accepted calculations and returns tested derived output with provenance.
- **Designer** owns the Taste Contract, visual system, media, layout, and target-surface implementation.
- **Reviewer** independently checks source fidelity, exact numbers, logic, aesthetics, visual defects, accessibility, privacy, and assurance status.

Use independent contexts when available. If the host cannot provide subagents, sequential execution is permitted only when it emits the same role-local handoffs and clearly states that review independence was not proven.

## Host Contract

The host adapter owns dispatch, observation, cancellation, collection, path normalization, capability reporting, and telemetry. Every attempt has stable `run_id`, `agent_id`, and new `attempt_id`; retries preserve prior evidence and require explicit idempotency, retry class, and maximum attempts. Missing terminal records, evidence, deadlines, or telemetry block the corresponding completion, timing, portability, or budget claim.

Run-local evidence uses normalized relative paths. Absolute paths are host-local pointers and never portability evidence.

## Ready Gate

Run the effective union of template base gates and risk supplements. `validate-design-output.mjs` is the structural floor; `validate-evidence-contract.mjs` binds trusted evidence. Every current accessibility and privacy check must pass. Ready delivery permits no unresolved privacy, major, or blocking finding.

Use the exact render-spec viewport/state/segment matrix. Schematic artifacts still require visible disclosure in every declared state and all applicable layout, accessibility, privacy, and render checks.

Assured completion reports what is proven and what remains external: validation cannot prove source truth, formula intent, cryptographic identity, native export fidelity, subjective taste, or real-user success.
