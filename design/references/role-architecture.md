# Role Architecture

## Purpose

Standard and Assured artifacts use the roles required by their execution plan. They are not decorative personas: each role owns a different failure mode and leaves file-backed handoff evidence. Express still records the same domain decisions in a compact sequential handoff, without implying independent concurrency.

## Core Roles

| Role | Chinese name | Owns | Primary output |
| --- | --- | --- | --- |
| `poster` | 汇报者 | reader job, narrative value, decision feedback, concise reporting | poster brief and narrative spine |
| `designer` | 设计者 | visual system, layout rhythm, typography, images, icons, motion, aesthetic fit | visual plan and template choice |
| `reviewer` | 审核者 | source fidelity, number preservation, logic, visual defects, risk closure | review findings and acceptance status |

## Direction Gate Before Roles

The orchestrator runs `references/intake-direction-gate.md` before Poster. If artifact type, goal, or use scenario is missing, the orchestrator presents two or three concrete directions and pauses generation. Poster does not resolve an ambiguous product brief by silently choosing a surface or scenario.

The confirmed `intake-direction.json` becomes a required input to Poster for substantial work.

## Poster Role

The poster role turns raw material into decision-useful communication.

Operating principles:

- Treat reporting as value feedback in a decision chain, not a task diary.
- Start from the reader's decision, then choose what to show, omit, sequence, and emphasize.
- Be objective, truthful, concise, and high signal.
- Preserve the user's facts, dates, numbers, caveats, and uncertainty.
- Treat raw source files and values as immutable evidence.
- Propose analytical relationships through `analysis_requests`; never perform arithmetic, transformations, rankings, aggregations, or visual-scale calculations.
- Prefer one sharp narrative spine over many loosely related points.

Required handoff:

```json
{
  "role": "poster",
  "intake_direction_ref": "",
  "artifact_type": "",
  "goal": "",
  "use_scenario": "",
  "audience": "",
  "selection_source": "",
  "selected_direction_id": null,
  "accepted_tradeoff": null,
  "confirmation_evidence": "",
  "source_materials": [],
  "constraints": [],
  "summary_policy": {},
  "known_gaps": [],
  "analysis_requests": [
    {
      "id": "",
      "question": "",
      "source_refs": [],
      "requested_transform": "",
      "status": "proposed_not_computed"
    }
  ],
  "reader_job": "",
  "decision_context": "",
  "one_sentence_message": "",
  "narrative_spine": [],
  "must_keep_facts": [],
  "must_not_say": [],
  "source_refs": []
}
```

## Designer Role

The designer role turns the narrative into a visual artifact.

Operating principles:

- Design is a bridge between logic and aesthetics.
- Less but better: remove visual work that does not clarify the reader job.
- Design is rational problem solving before decoration.
- Use hierarchy, grid, type, color, image, icon, and motion to make the right thing easy to see.
- Choose one visual system per artifact and enforce it.

Required handoff. Complete the Taste Contract before selecting a preset or template; see `references/taste-loop.md`:

```json
{
  "role": "designer",
  "reader_job": "",
  "visual_thesis": "",
  "content_tension": {
    "statement": "",
    "source_refs": []
  },
  "direction_alternatives": [
    {
      "id": "",
      "thesis": "",
      "cost": "",
      "status": "selected|rejected",
      "reason": ""
    }
  ],
  "signature_move": {
    "move": "",
    "reader_value": ""
  },
  "anti_reference": [
    {
      "reference": "",
      "avoid_because": ""
    }
  ],
  "restraint_rule": "",
  "style_preset": "",
  "template_id": "",
  "rejected_template_ids": [],
  "layout_plan": [],
  "image_plan": [],
  "icon_plan": [],
  "motion_plan": [],
  "aesthetic_risks": []
}
```

## Reviewer Role

The reviewer role tries to break the output before the user sees it.

Operating principles:

- Compare visible content against the original source, not against the builder's intention.
- Numbers must not drift. No rounding, abbreviation, sign change, unit conversion, percent conversion, or newly computed value unless the exact string is source-backed.
- Logic must remain valid after summarization and slide sequencing.
- Aesthetic review is concrete: hierarchy, density, typography, color, image fit, motion purpose, and visual defects.
- Validator pass is necessary but not sufficient.
- Explain why the composition belongs to this content by connecting the reader job, visual thesis, content tension, signature move, and restraint rule.
- Report the assurance stage actually evidenced; do not translate internal review into `user_validated`.

Required JSON review:

```json
{
  "review_status": "approved|changes_required|blocked",
  "findings": [
    {
      "id": "DESIGN-001",
      "severity": "blocking|major|minor",
      "role_owner": "poster|designer|builder",
      "requirement": "",
      "evidence": "",
      "problem": "",
      "recommendation": ""
    }
  ],
  "checks": {
    "source_fidelity": "pass|fail|not_checked",
    "number_integrity": "pass|fail|not_checked",
    "logic": "pass|fail|not_checked",
    "aesthetic_fit": "pass|fail|not_checked",
    "visual_defects": "pass|fail|not_checked"
  },
  "content_ownership": {
    "status": "pass|fail|not_checked",
    "why_this_composition_belongs": "",
    "evidence_refs": []
  },
  "assurance": {
    "highest_passed_stage": "structure_passed|evidence_traced|visually_reviewed|decision_ready|user_validated|null",
    "unverified_items": []
  },
  "remaining_risks": []
}
```

## Collaboration Flow

1. Orchestrator confirms artifact type, goal, and use scenario through the direction gate.
2. Orchestrator snapshots immutable source identity before synthesis.
3. Poster locks the reader job, decision context, source facts, narrative spine, non-claims, and any `proposed_not_computed` analysis requests.
4. A code-owning analyst or builder executes each accepted request, tests it, and emits a derived artifact with provenance. Poster receives results only after this gate.
5. Designer completes the content-specific Taste Contract, then selects a registry `template_id`, style preset, layout rhythm, images, diagrams, icons, and motion without modifying source values.
6. Builder implements the artifact from registered templates and records source, calculation, and visible-summary mappings.
7. Reviewer checks source immutability, calculation lineage, numbers, logic, visual quality, accessibility basics, and runtime evidence.
8. Reviewer answers why the composition belongs to the content and records the assurance stages actually evidenced.
9. Blocking or major findings return to the owning role for the smallest correction.
10. Delivery happens only after reviewer approval or explicit user acceptance of residual risk; user acceptance is not evidence of `user_validated` without observed task evidence.

## When Subagents Are Available

Use independent contexts when the Standard or Assured execution plan requires them, or when the user explicitly requests multi-agent work. Assured independent review must use a context that did not implement the artifact. Record handoffs under `artifact/agent-handoffs/` or a project `.exp-skill/runs/<run-id>/role-handoffs/` directory.

## When Subagents Are Not Available

Run the same roles sequentially and write the same handoff artifacts. Do not collapse the roles into an invisible internal monologue.

## Controlled Execution Envelope

The role payloads above remain the domain contract. A controlled run adds an
execution envelope beside that payload; it does not replace the role-specific
handoff shape or modify the exp-skill controller. At minimum, the envelope
records:

```json
{
  "run_id": "",
  "role": "",
  "agent_id": "",
  "attempt_id": "",
  "host_adapter": "",
  "platform": "",
  "lifecycle_status": "completed|failed|timed_out|disconnected|escalated",
  "claims": [],
  "evidence": [],
  "telemetry": {
    "tokens": "unknown",
    "duration_ms": "unknown",
    "tool_calls": "unknown",
    "external_cost_usd": "unknown"
  }
}
```

`agent_id` identifies the stable role context; `attempt_id` identifies one
dispatch and must change on retry. One role has one registered `agent_id`, and
the reviewer must remain independent from implementation agents. The host
adapter owns dispatch, observation, cancellation, collection, path
normalization, and capability reporting. If it cannot provide a field, the
envelope records `unknown` and the role cannot claim the corresponding
completion, timing, budget, or portability property.

Timeouts, disconnects, retries, and escalation follow the rules in
`multi-agent-protocol.md`: deadlines and retry limits are explicit host input;
retries are bounded and preserve prior attempts; ambiguous or non-idempotent
side effects escalate; and a process exit without a complete handoff is not
success. A host-equivalent sequential run is valid only when it emits the same
role-local handoffs and labels the absence of independent concurrency.

All run-local evidence references are normalized POSIX-style relative paths.
An absolute path can identify a host-local implementation artifact only when
it is labeled as a host-local non-claim. It must never be used to imply that a
different host, shell, or filesystem can resolve the artifact. The POSIX
support matrix and per-host preflight evidence in
`multi-agent-protocol.md` are authoritative for portability claims.
