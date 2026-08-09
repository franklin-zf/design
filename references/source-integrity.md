# Source Integrity

## Authority Order

1. Immutable user-supplied source and raw values.
2. Reproducible code-derived output.
3. Source-preserving summary and interpretation.
4. Visual expression.

Lower layers never overwrite or silently reinterpret higher layers.

## Source Rules

- Record source identity, location, freshness when relevant, and SHA-256 for durable source-backed work.
- Preserve values, labels, units, signs, dates, identifiers, and quoted wording exactly.
- Keep source files read-only. Generated artifacts and derived output use separate paths.
- Missing evidence remains `unknown` or `data insufficient`; never fill gaps with plausible values.
- A local quote proves only that the text occurs in that file. It does not prove external truth, freshness, or complete interpretation.

## Summary Rules

- Preserve the original claim strength, scope, exclusions, uncertainty, and causal direction.
- Every visible numeric token must match the source exactly unless declared code-derived.
- Do not round, abbreviate, convert percentages, change signs, translate units, or normalize dates silently.
- Prefer direct, plain language. Remove filler and jargon without adding stronger claims.
- A summary map binds visible summary text to exact source references and preserved numeric tokens.

## Claims

Every material claim records its class, visible text, source references, evidence quote or derived reference, and status. Separate source-verbatim facts, code-derived results, interpretations, and schematic statements. One claim id appears exactly once in visible content.

## Derived Values

Any aggregation, ranking, conversion, rate, delta, filter, grouping, model output, chart scale, or mark position must come from executable code. Keep:

- source and code hashes;
- deterministic command and declared inputs/outputs;
- tests covering formulas and edge cases;
- derived output with stable identifiers;
- provenance binding each visible value or mark to an exact output location.

Static provenance validation proves declared identity and reproducibility, not external source truth, formula intent, safe execution, or business correctness. Untrusted code and sensitive data use the Assured path in `advanced-assurance.md`.
