# Tool Routing

## Principle

Design owns content framing, visual direction, and quality. Specialized tools own native file formats, deterministic analysis, media production, and browser execution. Choose the lightest verified capability that produces the required target surface.

## Capability Router

| Need | Preferred capability | Fallback |
| --- | --- | --- |
| Editable PPTX or slide deck | Native presentation tool/runtime | Registered HTML deck plus explicit PPT handoff |
| Report or dashboard | Structured analytics/report builder or HTML template | Static HTML report with source-backed charts |
| Calculations and chart geometry | Reproducible code or structured data tool | Block derived claims until a deterministic runtime exists |
| DOCX/PDF extraction | Native document/PDF parser | Text extraction with visible fidelity limitations |
| Relevant factual image | Authorized image search with source record | Generated or schematic image labeled accurately |
| Custom illustration | Image generation | Purpose-built diagram or licensed asset |
| Process, hierarchy, relationship | Mermaid when its grammar fits | HTML/CSS diagram or editable slide shapes |
| HTML implementation | Existing frontend stack or registered template | Self-contained HTML/CSS/JS |
| HTML surface QA | Playwright/browser automation | Structural checks plus explicit browser-QA gap |

Never claim an unavailable native capability. Run preflight when availability can change.

## Selection Rules

- Prefer an existing project design system and runtime over introducing a new dependency.
- Use templates by reader job and evidence shape, not visual resemblance alone.
- Use real images that reveal the actual subject when inspection matters.
- Use icons for familiar actions and compact labels; do not replace content with ambiguous symbols.
- Use Mermaid only for relationships its layout can express clearly. Complex editorial composition belongs in the target medium.
- Start with L0 static content. Add components, interaction, or motion only when a named reader task becomes materially easier.
- Record source, license, dependency, accessibility, fallback, and target-surface compatibility for third-party assets or components.

## Local CLI

`scripts/design.mjs` is the public local interface. It routes planning, applicable artifact checks, browser rendering, deck capture, capability preflight, and repository validation to the existing deterministic implementation. Individual validator scripts are internal building blocks and remain callable for debugging.

The skill root is read-only during artifact generation. Write artifacts, telemetry, screenshots, and temporary evidence inside the user workspace. Network access, publication, and installation require their own authorization.
