# Reports And Dashboards

## Guidance Contract

An answer is useful only when the reader can tell what to decide or check
next. For decision-support reports and dashboards, keep this small guidance
record close to the answer or primary KPI:

| Field | Required meaning |
| --- | --- |
| `decision` | The decision the evidence can inform. |
| `action` | The next action, or `not_requested` for an informational output. |
| `decision_owner` | The person or team that can act. |
| `trigger` | The source-backed observation or threshold that starts the action. |
| `time_horizon` | The date, period, or review point. |
| `success_signal` | The observable result that would support continuation. |
| `stop_or_escalate_condition` | The missing evidence, failure, or threshold that requires a pause or escalation. |
| `uncertainty` | The evidence limit that may change the decision. |

These fields describe what the evidence can guide. They do not permit the
author to invent an owner, action, threshold, outcome, or confidence. If the
input does not provide one, use `unknown` or `not_requested` and explain why.
These fields are the product guidance contract. When an automatic validator
does not cover one, record human review or `not_checked`; do not infer a pass.

## Report Contract

Use a report when the reader needs an answer, evidence, interpretation, caveats, and next step.

Report spine:

1. question;
2. answer;
3. audience and decision;
4. metrics, cohort, denominator, time window;
5. findings with evidence;
6. caveats and sensitivity;
7. implication or next step.

For a decision-support report, the spine must also make `decision`, `action`,
`decision_owner`, `trigger`, `time_horizon`, `success_signal`, and
`stop_or_escalate_condition` visible or traceable in the report metadata.

Reports should be answer-first and narrative-led. Charts support claims; they are not the report.

Answer-first does not mean stronger-than-source. Report summaries must preserve source meaning, keep all visible numbers verbatim from source quotes, and map visible summary text through `summary-map.json`.

## Dashboard Contract

Use a dashboard when the reader needs to monitor, diagnose, or explore a recurring metric surface.

Dashboard model:

1. primary outcome;
2. hero KPIs;
3. movement over time;
4. breakdowns and drivers;
5. guardrails;
6. filters;
7. detail table;
8. source freshness and caveats.

Add the guidance record to the default view or its metadata. A dashboard that
shows movement but has no decision, owner, trigger, or next check is a monitor,
not a decision guide.

The default view must be useful before the user interacts.

## Source Rules

- Stop if a required source of truth is unavailable.
- Use mock or schematic data only when user allows it and manifest sets `schematic: true`.
- Put raw query paths and implementation details in source notes or manifest, not visible report prose unless needed for trust.
- Surface missing data where it changes interpretation.
- If no real-user sample or observed outcome is available, say so directly:
  "No claim is made about real-user usage or impact; no real-user evidence was
  provided." Do not turn a visual smoke check or internal review into a user
  success claim.
