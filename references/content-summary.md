# Content Summary

## Promise

Summaries must help the reader understand supplied content without changing it. A summary is not a rewrite license.

The source layer is immutable. Summaries may reorder or compress content, but must never edit the supplied file, replace raw values, or silently normalize source wording.

## Hard Rules

- Preserve original meaning. Do not strengthen, weaken, merge, or invert a user-provided claim.
- Preserve numbers verbatim. Do not abbreviate, round, convert units, convert decimals to percentages, add signs, remove signs, or introduce computed numbers unless the exact number string appears in a supplied source quote.
- Classify every visible value as `source_verbatim` or `code_derived`. A value that is reformatted, converted, grouped, filtered, ranked, aggregated, rounded, or counted is code-derived even when the change looks minor.
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

Poster may propose an analytical relationship, question, or requested transform. Poster must not perform arithmetic or provide the result.

If the artifact needs a computed metric:

1. execute the calculation in code;
2. preserve the raw source and record its identity/hash;
3. record code path/hash, formula/transform, inputs, filters, denominator, unit, time window, deterministic test, rerun command, derived output, and output hash;
4. declare the generated calculation artifact as a derived source;
5. bind the visible summary to that derived artifact.

Do not put a computed number in a summary unless it appears in a code-generated calculation artifact with reviewed provenance and test evidence. Formula text or LLM reasoning alone is not calculation evidence.
