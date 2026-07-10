# Input Contract

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
