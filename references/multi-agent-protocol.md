# Multi-Agent Protocol

## Purpose

Make the skill usable across Codex, Claude-compatible, and other agent runtimes. Use independent roles when the task is broad, risky, data-heavy, style-heavy, or user explicitly asks for multiple agents.

For design-quality work, the canonical collaboration model is the `poster` / `designer` / `reviewer` triad described in `references/role-architecture.md`.

## Roles

### Design Triad

| Role | Owns | Output |
| --- | --- | --- |
| `poster` | reader job, decision value, source-grounded narrative, what to say and not say | poster brief and narrative spine |
| `designer` | visual system, layout rhythm, templates, images, diagrams, icons, motion, finish | visual plan and media plan |
| `reviewer` | source fidelity, number integrity, logic, aesthetic quality, visual defects, risk closure | JSON review findings and acceptance |

Use this triad for deck/PPT work, executive reports, poster-like artifacts, user-provided-source summarization, and any task where the user explicitly cares about beauty, accuracy, or review.

### Specialist Roles

| Role | Owns | Output |
| --- | --- | --- |
| `orchestrator` | brief, route, contracts, final handoff | `agent-handoff.json` |
| `data-analyst` | source truth, metrics, transformations | source notes, chart contracts |
| `information-architect` | report spine, deck narrative, dashboard hierarchy | outline or slide plan |
| `visual-designer` | style preset, layout, typography, craft gates | visual plan and QA notes |
| `presentation-builder` | deck/PPT implementation | HTML deck or PPT handoff |
| `frontend-builder` | HTML/CSS/JS artifact implementation | `index.html` |
| `validator` | schema, placeholders, layout, source, risk checks | `quality-report.md` and validator output |

## Handoff Shape

Before role handoffs, validate the confirmed direction:

```bash
node scripts/validate-intake-direction.mjs <intake-direction.json-or-directory> --require-confirmed --poster=<poster-handoff.json>
```

Base validation may accept a well-formed `needs_clarification` record. The pre-Poster command must use `--require-confirmed`; do not dispatch Poster while the direction status is pending or the Poster handoff differs from the confirmed brief.

Use this JSON when passing work between specialist agents:

```json
{
  "task_id": "short-slug",
  "artifact_type": "data-report",
  "owner_agent": "orchestrator",
  "next_agent": "visual-designer",
  "inputs": [],
  "contracts": {
    "input": "references/input-contract.md",
    "output": "references/output-contract.md",
    "style": "references/style-presets.md"
  },
  "decisions": [],
  "evidence": [],
  "open_questions": [],
  "blocked": false
}
```

Use the handoff shapes in `references/role-architecture.md` for `poster`, `designer`, and `reviewer`.

## Review Loop

1. Orchestrator confirms artifact type, goal, and use scenario through the direction gate.
2. Orchestrator snapshots immutable source identities and records any missing evidence.
3. Poster defines the narrative spine, source-grounded message, and `proposed_not_computed` analysis requests from the confirmed direction.
4. A code-owning analyst or builder executes accepted analysis requests, runs deterministic tests, and emits derived artifacts with provenance.
5. Designer selects the template, style preset, visual rhythm, and media plan without changing source values or calculated results.
6. Builder produces the artifact directory from registered production templates.
7. Validator runs structural, source, calculation, template, and applicable visual checks.
8. Reviewer inspects source immutability, calculation lineage, numbers, logic, aesthetics, media fit, responsive behavior, and runtime evidence.
9. Blocking or major findings return to the owning role.
10. Orchestrator hands off with evidence and remaining risks.

Poster never owns calculated results. `analysis_requests[].status` remains `proposed_not_computed` until a code-owning role returns a tested derived artifact.

Do not let a single agent silently invent facts owned by another role. If the host lacks subagents, run the roles sequentially and preserve handoff artifacts.

## Controlled Host Contract

The design skill does not assume that Codex, Claude-compatible hosts, or any
other runtime expose the same process, stream, filesystem, or telemetry APIs.
The host adapter is the boundary that makes those differences explicit. It
must provide, or explicitly mark as unavailable, these operations:

| Operation | Required result |
| --- | --- |
| `dispatch` | A stable `attempt_id`, the assigned `agent_id`, and a dispatch acknowledgement or `unknown` |
| `observe` | Latest lifecycle state, heartbeat/output timestamp, and transport errors when available |
| `cancel` | Whether cancellation was requested and whether termination was confirmed |
| `collect` | A terminal record, exit reason, handoff path, and evidence paths; no terminal record means no completion claim |
| `capabilities` | Host/platform support for process control, stream collection, path translation, and artifact persistence |

The adapter normalizes each attempt into a record containing `run_id`,
`role`, `agent_id`, `attempt_id`, `host`, `platform`, `lifecycle_status`,
`evidence`, and `telemetry`. `telemetry` has the fields `tokens`,
`duration_ms`, `tool_calls`, and `external_cost_usd`. Each field is either a
measured number or the literal `unknown`; a missing host metric must never be
replaced with a guessed value. The existing run controller remains the source
of run state. This document defines the evidence that the role must record; it
does not extend or bypass the controller.

## Timeout, Disconnect, Retry, And Escalation

Timeout policy is host-provided, not a hidden default. A dispatch policy may
define `dispatch_timeout`, `silence_timeout`, and `completion_timeout`, plus a
heartbeat source and unit. If any required policy value or heartbeat source is
missing, its value is `unknown` and the attempt cannot be represented as a
verified timely completion.

Use these lifecycle outcomes:

| Condition | Lifecycle outcome | Required action |
| --- | --- | --- |
| No dispatch acknowledgement by the host-provided dispatch deadline | `timed_out` | Record the deadline and observed state; do not claim the role ran |
| No heartbeat or output by the host-provided silence deadline | `timed_out` or `disconnected` | Let the adapter distinguish a timeout from transport loss; otherwise record `unknown` and escalate |
| Host process exits without a terminal record | `disconnected` | Preserve partial output, mark completion unverified, and escalate or retry only if allowed |
| Terminal record exists but handoff or required evidence is absent | `failed` | Do not infer success from process exit; return to the owning role |
| Required adapter capability is absent | `escalated` | Use a host-equivalent sequential path only when its evidence contract is available |

Retry is allowed only when all of the following are explicit: the operation is
idempotent or has a resume/compensation rule, the host policy supplies a
`max_attempts` value, the failure class is retryable, and a new `attempt_id`
will preserve the previous attempt record. A retry must not overwrite prior
logs, handoffs, or evidence. Missing `max_attempts`, ambiguous side effects,
or an unknown failure class means no automatic retry.

Escalate to the orchestrator when retries are exhausted, timeout versus
disconnect cannot be classified, a non-idempotent attempt has ambiguous
effects, evidence paths cannot be persisted, budget telemetry is unavailable
for a budget-sensitive decision, or independent reviewer identity cannot be
verified. Escalation records the reason, attempted actions, exact evidence
paths, and open decision. `timed_out`, `disconnected`, and `escalated` are not
successful role outcomes.

## POSIX Support Matrix

This is a protocol support matrix, not proof that the current host has any
listed capability. A claim for a concrete run requires adapter preflight and
run-local evidence for that host/platform pair.

| Protocol capability | macOS | Linux | Windows native | WSL2 | Claim rule |
| --- | --- | --- | --- | --- | --- |
| Run-local relative paths using `/` | native | native | adapter-required | adapter-required | Claim only after normalization and existence check |
| Atomic file write/rename and file locking | native | native | adapter-required | adapter-required | Record the adapter implementation and result |
| Process-group timeout and cancellation | adapter/host evidence required | adapter/host evidence required | adapter-required | adapter/host evidence required | Do not equate a cancellation request with confirmed termination |
| Heartbeat and streamed output collection | adapter-defined | adapter-defined | adapter-defined | adapter-defined | Claim only with observed timestamps or mark `unknown` |
| Unix-domain socket transport | native | native | not claimed without adapter evidence | in-WSL only unless bridge is verified | Cross-boundary support is always a separate claim |

### Absolute paths are non-claims

An absolute path is a host-local pointer, not evidence of portability. It may
appear in an external implementation-artifact field only when it is labeled
`path_kind: host_local_absolute` and `portability_claim: none`. Run-local
handoff, review, verification, and cost evidence must use normalized POSIX
relative paths: no leading `/`, drive prefix, `~`, environment expansion, or
`..` segment. A path that merely looks portable is not proof that another host
can read it.

To claim cross-host support, each target host adapter must produce its own
capability result and evidence. Existence of an absolute path, a successful
local read, or a copied string is insufficient. When the adapter cannot
translate or verify the path, record `unknown` and use `non-claim`, not a
best-effort portability statement.
