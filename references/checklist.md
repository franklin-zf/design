# Checklist

## P0 Must Fix

- Missing `manifest.json`, `index.html`, or `quality-report.md`.
- Manifest missing required fields.
- Unsupported metrics or fabricated data without `schematic: true`.
- Summary changes the source meaning, adds a stronger claim, or omits a caveat that changes interpretation.
- Summary rewrites any number through abbreviation, rounding, unit conversion, percent conversion, sign change, or a newly computed value not present verbatim in source quotes.
- Non-schematic source-backed report, dashboard, chart frame, deck, or PPT handoff is missing `summary-map.json`.
- Placeholder text remains.
- Deck slide missing `data-layout` or `data-purpose`.
- Local image missing `data-image-slot`.
- Deck or PPT handoff has structural content but no explicit media, Mermaid, process, or system-diagram decision in the slide plan.
- Style preset missing or mixed.
- Chart has no source, unit, or context when used as evidence.
- Chart contract missing question, takeaway, grain, fields, scale, sample size, or visual encoding.
- `artifact_status: ready` conflicts with missing semantic review, visual QA, or accessibility status.
- `visual_qa: smoke_passed` has no desktop and mobile screenshot evidence.
- Dashboard contains empty chart regions or a default view that cannot be read without interaction.
- User-facing artifact contains internal planning notes.

## P1 Should Fix

- Chart type does not match analytical question.
- Report lacks answer-first summary.
- Summary uses vague elevated language instead of direct wording.
- Dashboard default view requires interaction to be useful.
- Deck has flat rhythm or repeated layout.
- Deck lacks poster narrative spine or treats the source document as a page-by-page dump.
- Images, icons, Mermaid diagrams, or generated graphics are decorative rather than explanatory.
- Table used where chart would communicate better.
- Visual labels collide or are too small.
- Excessive decorative elements.
- Visual hierarchy is flattened by too many equally framed cards or panels.
- Deck long text or mobile layout is likely to clip.

## P2 Polish

- Add better source notes.
- Tighten narrative.
- Improve density and spacing.
- Add tweak controls only when iteration is useful.
- Add responsive refinements.
