# Data Visualization

## Chart Selection

Choose charts from the analytical question:

| Question | Preferred forms |
| --- | --- |
| Current status | KPI card, scorecard, compact table |
| Trend over time | line, indexed line, area only when magnitude fill helps |
| Category comparison | sorted bar, dot/lollipop, leaderboard |
| Composition | stacked bar, 100% stacked bar, stacked area for time mix |
| Distribution | histogram, box plot, violin only when reader can interpret it |
| Relationship | scatter with point labels, denominator, sample size |
| Drivers | waterfall when additive, ranked bars otherwise |
| Funnel/progression | stage bar or funnel when order matters |
| Matrix/cohort | heatmap |

## Data Sufficiency

- Trend: aim for at least 8-12 temporal points.
- Scatter: aim for at least 12-20 comparable observations; fewer than 8 is usually a table or bar.
- Bars: use horizontal bars for long labels.
- Composition: expose denominator and time/cohort context.
- Ranking: top-N only when top-N is the actual question; preserve long tail in table if lookup matters.

## Chart Contract

Before drawing, define:

- analytical question;
- takeaway;
- chart family and variant;
- data grain;
- fields and units;
- denominator, cohort, time window, filters;
- fallback if data is sparse;
- surface and container;
- palette policy;
- source binding.
- data origin: `raw` or `code_derived`;
- derivation reference when any field, metric, order, scale, or mark position is computed;
- executable code path/hash, rerun command, deterministic test, and derived output/hash;
- sample size and whether it is enough for the claimed pattern;
- visual encoding: baseline, axis policy, scale domain, truncation policy, and label policy.

## Visual Rules

- Use quiet grids, dark text, clear titles, and explicit units.
- Do not rely on color alone.
- Do not create redundant legends.
- Avoid gradients inside chart marks.
- Preserve enough table fields to audit the visual.
- Use labels and annotations only when they reduce reader effort.
- Do not hand-code bar heights or mark positions unless they are derived from a declared scale.
- Do not let Poster, the LLM, or manually authored HTML/CSS/SVG calculate values, scales, rankings, or mark positions. Generate them from code and retain the derived data used for rendering.
- Preserve raw source fields alongside derived chart fields so the visual remains auditable.
- For trend claims, use at least 8 comparable time points unless the artifact is explicitly marked partial or uses a non-trend fallback.
