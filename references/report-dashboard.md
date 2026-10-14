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

## Choose the Form by the Question

Use the lightest form that answers the reader's question. These are options, not
a quota or a prescribed sequence of charts.

| Reader question | Suitable form | Evidence boundary |
| --- | --- | --- |
| Which problem does a proposed action address? | Problem-to-action comparison | Keep proposed action distinct from achieved effect; pairing is not proof of causality. |
| What comes next? | Process or lifecycle diagram | Edges need supported order; order does not establish duration or parallelism. |
| Which system relates to which object? | Association matrix or system map | Label the relationship; not described is not absent, zero, or completed. |
| What belongs under what? | Hierarchy or capability map | Area and node size must not imply unsupported importance, workload, or deployment structure. |
| How long might a phase take? | Point for fixed duration; interval for a range | Derive positions from bound source values; exclude unbounded duration from a numeric axis. Do not infer a calendar schedule or total. |
| What must meet acceptance? | Labeled threshold values | Keep comparator, unit, and requirement status visible. Mixed units are not comparable bar lengths; no actuals means no progress gauge. |

Use bars, lines, or part-to-whole charts only with the needed comparable values,
observations, or denominator. Use text when the evidence supports no useful chart.
Keep a common visual grammar across forms. Repetition is useful for comparable
series; variety is useful only when it reveals a different relationship.

Apply the hierarchy and disclosure rules in `references/design-standards.md`.
Inspect whether the opening takeaway and the section evidence agree, whether
labels and legends survive narrow-screen reflow, and whether supporting detail
remains accessible in the intended export. Test selection and bindings, not just
the presence of numbers somewhere in the source.

## Dashboard Contract

Use a dashboard when the reader needs to monitor, diagnose, or explore a recurring metric surface.

Dashboard model:

1. primary outcome;
2. hero KPIs (strictly scope-bound: if 3 valid KPIs exist for this context, use 3 cards in `grid-cols-3` or Bento layout; never fabricate a 4th KPI solely for 4-grid symmetry);
3. movement over time;
4. breakdowns and drivers;
5. guardrails;
6. filters and composite controls (enforcing two-tier card layout and `min-w-0` truncation);
7. detail table;
8. source freshness and caveats.

Add the guidance record to the default view or its metadata. A dashboard that
shows movement but has no decision, owner, trigger, or next check is a monitor,
not a decision guide.

The default view must be useful before the user interacts. Hero KPI cards and overview widgets must enforce the **Anti-Visual-Fill Principle**: metrics must strictly belong to the current host view context without mechanical borrowing across child entities or subsystems.

## Operational Surface Defaults

Operational products default to `zh-CN`. Brand names, technical IDs, original
fields, and approved abbreviations require an explicit locale exemption. Unknown
enum values use a visible Chinese fallback such as “未知状态” while preserving the
raw code in internal data or evidence; never expose `auth_required`, `Admin`, or a
similar English code as the fallback label.

Use declared page, section, row, control, and icon-text anchors. Edge delta is at
most 2 px and icon optical center delta at most 1 px. Controls use 32, 40, or
44 px heights according to density and touch needs.

Use one local icon family per artifact. Icon-only controls are limited to
universal secondary actions and require accessible names; uncertain or missing
assets fall back to visible Chinese labels. For operational color, blue owns
action, selection, and focus while green, amber, and red retain positive, warning,
and danger meaning.

Bind these four H0 requirements as `VIS-ALIGN`, `VIS-LOCALE`, `VIS-ICON`, and
`VIS-COLOR`. All operational sidebars (≤400px), composite filter bars, and card panels must strictly enforce the Defensive CSS Layout Protocol (`min-w-0` on dynamic flex children, two-tier card layout for select/search + action buttons, and structured `grid-cols-2`/`grid-cols-3` for sidebar button groups). Verify default, densest, error, and 1440/390/320 states with current
render evidence and separate Reviewer v4 checks.

## Source Rules

- Stop if a required source of truth is unavailable.
- Use mock or schematic data only when user allows it and manifest sets `schematic: true`.
- Put raw query paths and implementation details in source notes or manifest, not visible report prose unless needed for trust.
- Apply the production-copy boundary in `references/design-standards.md`: source
  notes here mean internal evidence records, not automatically speaker notes.
- Surface missing data where it changes interpretation.
- If impact evidence affects the reader's decision, use a business qualification
  such as "使用效果待验证". Otherwise retain the evidence gap in the internal review
  and handoff rather than adding an author disclaimer to every page. Never turn a
  visual smoke check or internal review into a real-user success claim.
