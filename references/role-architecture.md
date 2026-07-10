# Role Architecture

## Purpose

Every substantial design artifact uses three core roles. They are not decorative personas. Each role owns a different failure mode and must leave file-backed handoff evidence when the host supports multi-agent work.

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

Required handoff:

```json
{
  "role": "designer",
  "style_preset": "",
  "template_family": "",
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
  "remaining_risks": []
}
```

## Collaboration Flow

1. Orchestrator confirms artifact type, goal, and use scenario through the direction gate.
2. Orchestrator snapshots immutable source identity before synthesis.
3. Poster locks the reader job, decision context, source facts, narrative spine, non-claims, and any `proposed_not_computed` analysis requests.
4. A code-owning analyst or builder executes each accepted request, tests it, and emits a derived artifact with provenance. Poster receives results only after this gate.
5. Designer selects the template family, style preset, layout rhythm, images, diagrams, icons, and motion without modifying source values.
6. Builder implements the artifact from registered templates and records source, calculation, and visible-summary mappings.
7. Reviewer checks source immutability, calculation lineage, numbers, logic, visual quality, accessibility basics, and runtime evidence.
8. Blocking or major findings return to the owning role for the smallest correction.
9. Delivery happens only after reviewer approval or explicit user acceptance of residual risk.

## When Subagents Are Available

Use independent contexts for poster, designer, and reviewer when the task is broad, high stakes, source-backed, style-heavy, or explicitly multi-agent. Record handoffs under `artifact/agent-handoffs/` or a project `.exp-skill/runs/<run-id>/role-handoffs/` directory.

## When Subagents Are Not Available

Run the same roles sequentially and write the same handoff artifacts. Do not collapse the roles into an invisible internal monologue.
