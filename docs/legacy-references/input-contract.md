# Input Contract

## REQ-002 Minimum Contract

The input is complete only when it tells the system what to make, why it is
needed, who will use it, and what evidence may support it. These are the
minimum fields for every task:

| Field | Required | Meaning | Ready check |
| --- | --- | --- | --- |
| `artifact_type` | yes | Report, dashboard, chart, deck, poster, UI, or image. | One supported value is named. |
| `goal` | yes | The decision, communication, or artifact outcome. | It describes an outcome, not only a topic. |
| `use_scenario` | yes | When and how the reader will use the output. | The user action or meeting context is stated. |
| `audience` | yes | The people who will read or use it. | A concrete group is named. |
| `source_materials` | yes | Supplied files, data, URLs, notes, screenshots, or an explicit none record. | Every source has an ID and availability state. |
| `output_surface` | yes | HTML, report, dashboard, deck, PPTX handoff, image, or undecided. | Delivery surface is separate from artifact type. |
| `constraints` | yes | Deadline, language, size, brand, sensitive data, must-include, and must-exclude rules. | Known limits are listed; unknown limits are marked. |

If a required field is absent, the task is `needs_clarification`; it is not
ready for artifact selection. `source_materials` may say `none`, but it must
also state why and what claims are therefore out of scope.

The following compact record is an implementation suggestion, not a claim that
the current validator accepts this exact object:

```json
{
  "artifact_type": "report",
  "goal": "",
  "use_scenario": "",
  "audience": "",
  "source_materials": [{
    "id": "source-001",
    "path_or_url": "",
    "kind": "file|data|url|note|screenshot",
    "availability": "available|missing|none",
    "sha256": "64 lowercase hex characters or unavailable"
  }],
  "output_surface": "html",
  "constraints": [],
  "summary_policy": null,
  "calculation_policy": null,
  "guidance_policy": null
}
```

## Required For Every Task

| Field | Required | Notes |
| --- | --- | --- |
| `goal` | yes | What decision, communication, or artifact should the output support. |
| `audience` | yes | Executive, team, technical, customer, public, investor, classroom, etc. |
| `source_materials` | yes | Files, data, URLs, notes, screenshots, or explicit statement that none exist. |
| `output_surface` | yes | HTML, report, dashboard, deck, PPTX handoff, image, or not yet decided. |
| `constraints` | yes | Deadline, brand, size, page count, language, sensitive data, must include/exclude. |
| `summary_policy` | conditional | Required when summarizing user-provided content. State whether meaning must be preserved exactly, numbers must remain verbatim, and whether plain-language wording is mandatory. |
| `calculation_policy` | conditional | Required when any value will be derived. Raw sources stay immutable; Poster submits analysis requests; executable code, tests, derived output, and provenance produce the result. |
| `guidance_policy` | conditional | Required for decision-support reports or dashboards. State the decision, action, owner, trigger, time horizon, success signal, and stop/escalate condition. |

`summary_policy` is required when source text is compressed or rewritten. It
must state whether meaning and numbers stay exact, whether omission is allowed,
and whether plain wording is required. `calculation_policy` is required when
any value is converted, counted, filtered, ranked, grouped, or otherwise
changed from the source.

## Conditional Inputs

### Data/report/dashboard/chart

- metric definitions;
- unit, denominator, cohort, time window, filters;
- source-of-truth and freshness;
- source identity/hash and immutable raw-file location;
- raw versus code-derived field classification;
- whether mock/schematic data is allowed;
- missing values and known caveats.

### Deck/PPT

- style preset;
- presentation length or slide count;
- audience and setting;
- source outline or desired narrative;
- image/screenshot availability;
- hard constraints and must-include content.

### Content summary

- source passages to summarize;
- whether summary may omit details;
- exact numbers, dates, percentages, units, signs, and IDs that must remain verbatim;
- whether any requested relationship requires code-derived analysis;
- terms that must be preserved from the user's wording;
- forbidden wording such as vague business jargon or elevated rewrite style.

### Guidance and decision support

Reports and dashboards that are meant to guide a decision must provide these
fields in the input contract:

- `decision`: the decision the reader must make;
- `decision_owner`: who can make it;
- `action`: the next action, or `not_requested`;
- `trigger`: the evidence or threshold that should cause action;
- `time_horizon`: when the action or next check matters;
- `success_signal`: what would show that the action helped;
- `stop_or_escalate_condition`: when to pause, escalate, or request more data.

If the user asks only for information, set `guidance_policy.status` to
`not_requested`. Do not invent an action, owner, threshold, or success signal.

### Screenshot/UI evidence

- source image path;
- preserve, beautify, redesign, or compare;
- target ratio and placement;
- sensitive fields to redact;
- text/brand/data that must remain exact.

### Design system

- brand source or desired reference;
- tokens to preserve;
- components or artifact types to support;
- forbidden styles;
- export needs.

## Clarification Policy

Run `references/intake-direction-gate.md` before Poster or artifact selection.

- If `artifact_type`, `goal`, and use scenario are explicit, record the confirmed direction and continue without asking. Keep `output_surface` as a separate delivery decision.
- If any of those fields is materially missing, present 2-3 content-specific directions and ask 1-3 questions covering every missing field.
- Pause Poster summarization and generation until the direction is confirmed.
- Do not ask full questionnaires when enough facts are present to begin with explicit assumptions.

## Input Gate Outcome

Record one of these outcomes before production:

- `needs_clarification`: a required field or a material decision detail is missing;
- `ready_for_production`: the minimum fields are present and source/summary/calculation rules are set;
- `blocked`: a required source, permission, or safety condition prevents the requested output.

This outcome is a product-contract suggestion for REQ-002. It is not evidence
that a validator currently emits these exact values.
