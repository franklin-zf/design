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

## Conditional Inputs

### Data/report/dashboard/chart

- metric definitions;
- unit, denominator, cohort, time window, filters;
- source-of-truth and freshness;
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

Ask 1-3 questions when an answer changes output shape or truth. Do not ask full questionnaires when enough facts are present to begin with explicit assumptions.
