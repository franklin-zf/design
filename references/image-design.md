# Image Design

## Purpose

Images, diagrams, Mermaid charts, mind maps, screenshots, and icons are evidence and explanation tools. They are not decorative filler.

## Mandatory Image Decision

For every deck, report, dashboard, or visual artifact, decide whether the content needs:

- a process flow;
- a system relationship map;
- a mind map or hierarchy diagram;
- a chart or KPI figure;
- screenshots or UI evidence;
- sourced web images;
- generated local information graphics;
- icons that make controls or categories faster to scan.

Record the answer in `slide-plan.json`, `manifest.visual_assets`, `quality-report.md`, or the role handoff.

## Mermaid And Diagram Policy

Use Mermaid when the source content is primarily structural:

| Content pattern | Preferred form |
| --- | --- |
| ordered steps | `flowchart LR` or timeline |
| dependencies | `flowchart TD` |
| role or system interaction | `flowchart LR`, C4-like system map, or swimlane |
| branching decisions | decision tree |
| concept hierarchy | mind map |
| lifecycle | loop or pipeline |

Rules:

- Mermaid labels must preserve source meaning and numbers.
- Do not add steps that are not present in the source unless marked as an inference.
- Export Mermaid or render it into a stable local asset when the final surface cannot execute Mermaid reliably.
- When embedded in HTML, give the rendered asset a `data-image-slot` or `data-design-id`.

## Web Image Policy

Use web images only when they strengthen the reader's understanding and licensing/provenance can be recorded.

Rules:

- Search only when current or specific image relevance matters.
- Prefer official, source-provided, public-domain, or permissively licensed images.
- Do not hotlink fragile third-party assets in the final artifact unless the quality report declares the dependency.
- Download or generate a local asset under `images/` when allowed.
- Record URL, source, license or usage assumption, and retrieval date in `quality-report.md`.
- If usage rights are unclear, use the image only as a private reference or replace it with a generated schematic.

## Generated Image Policy

Generated images must match the artifact's active style preset and slot.

Required fields for each generated image:

```json
{
  "id": "",
  "slide_id": "",
  "file": "images/name.ext",
  "slot": "",
  "type": "photo|system-map|pipeline|mind-map|ui-scenario|data-block|icon-set",
  "source_basis": [],
  "prompt_summary": "",
  "schematic": true
}
```

Do not generate:

- random business stock photos;
- decorative robots, neon interfaces, 3D shapes, glassmorphism, or pseudo logos;
- image text that changes source wording or numbers;
- slide chrome inside the image.

## Swiss Deck Image Rules

Borrowed from the guizang Swiss discipline:

- Use 12/16 column alignment, direct rectangles, hairlines, and large negative space.
- Use black, white, gray, and one accent from the active preset.
- Bind every local image with `data-image-slot`.
- S22 image hero uses `data-image-slot="s22-hero-21x9"`.
- S15/S16 image grids use consistent 21:9 slots.
- System and process diagrams should explain relationships, not merely decorate a text slide.
- Motion should reveal sequence or state; provide static fallback.

## Icon Policy

Use icons only when they reduce reading effort:

- controls and actions should use familiar icons where available;
- category icons need labels unless the meaning is universally clear;
- icons must align to the same stroke width, size, and baseline;
- do not mix icon families in one artifact;
- decorative icon clouds are not allowed.

## QA

Reviewer must check:

- every local image path resolves;
- every local image has `data-image-slot`;
- no critical image text is clipped or too small;
- diagrams do not invent facts;
- web image provenance is recorded;
- icon meaning is clear without guessing;
- motion does not hide content when disabled.

