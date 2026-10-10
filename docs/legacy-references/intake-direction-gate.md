# Intake Direction Gate

## Purpose

Do not ask Poster to summarize content before the artifact direction is clear. The direction gate resolves three shape-critical fields:

- `artifact_type`: the form to build, such as PPT handoff, HTML deck, report, dashboard, poster, or chart frame;
- `goal`: the decision, understanding, or action the artifact must support;
- `use_scenario`: where and how it will be used, including live presentation, asynchronous review, recurring monitoring, public communication, or another concrete setting.

## Trigger

Evaluate the three fields before artifact selection or Poster work.

- If all three are explicit, record a confirmed direction and proceed without asking another question.
- If any field is missing or materially ambiguous, stop generation and present two or three content-specific directions.
- Do not treat a source file, topic, or vague request to "make it visual" as an artifact type, goal, or use scenario.

## Direction Options

Each option must state:

1. artifact type;
2. intended goal;
3. use scenario and likely audience;
4. why it fits the supplied material;
5. the main tradeoff.

Put the recommended option first and mark exactly one option as recommended. Options must be meaningfully different, not cosmetic style variants.

When the material gives no stronger clue, adapt two or three of these starting points:

| Direction | Artifact type | Best for | Tradeoff |
| --- | --- | --- | --- |
| Live decision review | `ppt-handoff` or `html-deck` | A presenter guiding an executive or project review meeting | Strong pacing, less suitable for detailed asynchronous reading |
| Asynchronous evidence review | `data-report` | Readers who need sources, caveats, and detail without a presenter | More complete, less dramatic in a live room |
| Recurring operational view | `dashboard` | Repeated monitoring of stable metrics and actions | Requires structured, refreshable data and clear metric definitions |

Do not offer a dashboard when the input is only narrative content with no recurring measures. Do not offer a poster when the user needs a multi-step decision or detailed evidence.

## Questions

Ask one to three short questions. The questions must cover every missing field among `artifact_type`, `goal`, and `use_scenario`. A single combined prompt is acceptable when it remains easy to answer.

Recommended wording:

> 我建议优先选择方向 A。请选择 A/B/C，并确认：产物类型、希望促成的决定或结果、实际使用场景与受众。

Use the host's supported question interface when available; otherwise ask in normal conversation. Do not invent a runtime-specific question tool.

## Artifact

For substantial work, write `intake-direction.json` from `assets/templates/handoffs/intake-direction.json` and validate it:

```bash
node scripts/validate-intake-direction.mjs <intake-direction.json-or-directory>
```

`needs_clarification` means generation is paused pending the user's answer. `confirmed` means the brief is complete enough for Poster.

Immediately before Poster, fail closed and cross-check the handoff:

```bash
node scripts/validate-intake-direction.mjs <intake-direction.json-or-directory> --require-confirmed --poster=<poster-handoff.json>
```

## Poster Boundary

Poster starts only after `status` is `confirmed`. Poster must receive:

- `intake_direction_ref`;
- `selection_source` and `selected_direction_id`;
- the accepted tradeoff when the user selected a direction;
- confirmation evidence from the explicit brief or the user's selected direction;
- `artifact_type`;
- `goal`;
- `use_scenario`;
- `audience`;
- source materials and constraints.

Poster then organizes and summarizes the supplied content under the confirmed goal and scenario. Poster must still preserve original meaning, exact numbers, caveats, and explicit uncertainty.
