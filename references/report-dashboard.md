# Reports And Dashboards

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

The default view must be useful before the user interacts.

## Source Rules

- Stop if a required source of truth is unavailable.
- Use mock or schematic data only when user allows it and manifest sets `schematic: true`.
- Put raw query paths and implementation details in source notes or manifest, not visible report prose unless needed for trust.
- Surface missing data where it changes interpretation.
