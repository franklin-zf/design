# Data Integrity And Calculation

## Authority Order

Design uses this ordered hierarchy:

1. immutable source truth;
2. reproducible code-derived analysis;
3. source-preserving synthesis;
4. reader usefulness;
5. aesthetic delivery quality.

The order resolves conflicts. It does not make aesthetics optional: an accurate but visually weak artifact cannot be `ready`, while a beautiful artifact can never compensate for altered source data or unsupported calculations.

## Three Data Layers

| Layer | Allowed behavior | Required evidence |
| --- | --- | --- |
| Immutable raw source | Read, hash, copy, and cite. Never edit values, labels, units, signs, thresholds, dates, identifiers, or quoted wording in place. | source id, local path, SHA-256, capture/freshness note when relevant |
| Source-preserving summary | Reorder and compress without strengthening, weakening, rounding, converting, calculating, or inventing. | source quote, stable summary id, verbatim preserved numbers |
| Code-derived analysis | Calculate relationships, conversions, rates, differences, rankings, counts, aggregates, filters, models, scales, and mark positions only through executable code. | source ids/hashes, code path/hash, formula or transform, filters, denominator, unit, time window, output path/hash, deterministic test and observed command result |

Formatting that changes a numeric string or its semantics is a derivation. This includes abbreviation, rounding, percentage conversion, unit conversion, sign changes, threshold rewrites, date bucketing, grouping, sorting, and filtering.

## Poster Boundary

Poster may:

- identify a possible relationship between supplied fields;
- state the analytical question and decision relevance;
- list required source fields;
- request a transform or metric;
- organize and summarize verified source facts and code-derived results.

Poster must not:

- perform arithmetic or return a calculated value;
- manually convert, rank, aggregate, normalize, round, or abbreviate data;
- manually position chart marks or encode a value as a visual size;
- present a proposed relationship as a verified result.

Use this request shape:

```json
{
  "analysis_requests": [
    {
      "id": "conversion-by-channel",
      "question": "Does conversion differ by channel?",
      "source_refs": ["orders"],
      "requested_transform": "group by channel; compute converted_accounts / eligible_accounts",
      "status": "proposed_not_computed"
    }
  ]
}
```

A code-owning role or builder executes the request, tests it, and returns a derived artifact. Poster can use the result only after provenance and test evidence are available.

## Derived Artifact Contract

For every source-backed artifact containing a derived value, include:

```text
artifact/
├── source/
├── calculations/
├── derived/
└── data-provenance.json
```

The implemented `design-data-provenance/v1` sidecar binds raw sources, code, tests, and derived outputs by SHA-256. At minimum it records:

- source id, path, and hash;
- derivation id and source ids;
- code path, code hash, runtime, and argv-form rerun command;
- formula or transform, unit, denominator, filters, and time window;
- deterministic test path, hash, command, and observed status;
- derived output path and hash.

Raw source paths must never be derivation output paths.

## Current Enforcement Boundary

Run `node scripts/validate-data-provenance.mjs <artifact-dir>` for static lineage checks. It checks artifact-root containment, rejects symbolic links and source/output aliasing, and recomputes source/code/test/output hashes. Executable argv must enter through a digest-verified `design-execution-request/v2` and `run-execution-plan.mjs`; the legacy `--execute-trusted` option is rejected so it cannot bypass machine policy.

Computed summaries and claims also bind every visible derived token to an exact JSON Pointer in the declared output; token coincidence elsewhere in a file is not evidence. Static provenance validation proves declared identity, not execution, external source truth, formula intent, tamper-proof storage, or safe code. Untrusted artifacts remain `zero_spawn`; human review changes assurance only.
