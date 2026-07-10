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
