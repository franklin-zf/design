# Content Summary

## Promise

Summaries must help the reader understand supplied content without changing it. A summary is not a rewrite license.

## Hard Rules

- Preserve original meaning. Do not strengthen, weaken, merge, or invert a user-provided claim.
- Preserve numbers verbatim. Do not abbreviate, round, convert units, convert decimals to percentages, add signs, remove signs, or introduce computed numbers unless the exact number string appears in a supplied source quote.
- Keep language direct and clear. Prefer common words over impressive words.
- Do not use vague business language such as leverage, unlock, robust, holistic, synergy, paradigm, momentum, best-in-class, 赋能, 抓手, 闭环, 高阶, 范式, or 飞轮 unless the term appears in the source and is necessary.
- If the source wording is unclear, state the ambiguity instead of polishing it into a stronger conclusion.

## Summary Map

For non-schematic source-backed reports, dashboards, chart frames, decks, and PPT handoffs, include `summary-map.json`.

Every visible summary, headline claim, KPI explanation, slide claim, or interpretive sentence that summarizes source material must:

- have a stable `data-summary-id` in `index.html`;
- appear in `summary-map.json`;
- bind to local `source_quotes`;
- list any carried numbers in `preserved_numbers`;
- pass `node scripts/validate-summary-map.mjs <artifact-dir>`.

## Plain-Language Gate

`summary-map.json` must declare:

```json
{
  "plain_language": {
    "status": "manual_reviewed",
    "rules": ["direct", "clear", "no_unnecessary_jargon"]
  }
}
```

`manual_reviewed` means a human or responsible agent checked that the summary keeps the source meaning, uses plain wording, and does not add decorative language.

## When Numbers Need Calculation

If the artifact needs a computed metric, put the formula, inputs, unit, denominator, and time window in the metric/chart contract. Do not put a computed number in the summary unless that exact number string is also present in a supplied source quote or a generated calculation artifact declared as a source material.
