# Multi-Agent Protocol

## Purpose

Make the skill usable across Codex, Claude-compatible, and other agent runtimes. Use independent roles when the task is broad, risky, data-heavy, style-heavy, or user explicitly asks for multiple agents.

## Roles

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

Use this JSON when passing work between agents:

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

## Review Loop

1. Builder produces artifact directory.
2. Validator runs `scripts/validate-design-output.mjs`.
3. Visual reviewer inspects rendered output when possible.
4. Data reviewer confirms source bindings when data is decision-relevant.
5. Orchestrator hands off with remaining risks.

Do not let a single agent silently invent facts owned by another role. If the host lacks subagents, run the roles sequentially and preserve handoff artifacts.
