# Source And Claims Policy

## Claim Classes

| Class | Requirement |
| --- | --- |
| Source fact | Must point to a supplied file, data source, URL, screenshot, or inspected artifact. |
| Computed metric | Must state formula, unit, denominator, filters, and time window. |
| Inference | Must be labeled as interpretation and tied to supporting evidence. |
| Recommendation | Must state evidence and uncertainty. |
| Schematic content | Must set `schematic: true` in `manifest.json`. |

## Missing Data

When required source evidence is unavailable:

- do not fill gaps with plausible numbers;
- put the gap in `missing_data`;
- state whether the artifact is blocked, partial, or schematic;
- ask for the source if the missing fact changes the conclusion.

## Provenance

Keep provenance close enough for audit but not so heavy that it ruins the reader-facing artifact. Use `manifest.json` and `quality-report.md` for implementation paths, source notes, and unverified items.

For visible summaries, use `summary-map.json`:

- every mapped summary must point to local `source_quotes`;
- every number in the visible summary must appear verbatim in those source quotes;
- do not treat abbreviations, percentages, rounded values, unit conversions, or signed variants as equivalent;
- language style must pass the plain-language gate in `references/content-summary.md`.

For source-backed artifacts, use `claim-map.json`:

- `source_refs` must point to declared source IDs or source material paths.
- `verified` claims must include `evidence_quotes`, each with `source_ref` and a short `quote` found in the local source file.
- `assumption` claims should be labeled as interpretation and tied to supporting sources when available.
- `unverified` claims must also appear in `manifest.unverified_items`.

`evidence_quotes` prove local provenance only. They do not prove external truth, complete semantic entailment, data freshness, or that the artifact's interpretation is correct. `summary-map.json` closes only local summary coverage, verbatim number preservation, and plain-language review for mapped summaries.
