# Workflow

## Goal

Build the right visual artifact for the user's data or content. The workflow is shape-first, evidence-first, and style-controlled.

## Decision Sequence

1. Define the job: decision, audience, context, source materials, deadline, and delivery surface.
2. Classify the material:
   - structured data or metrics;
   - narrative content or notes;
   - mixed data plus story;
   - screenshots or UI evidence;
   - existing deck/report/dashboard to revise;
   - brand/design-system request.
3. Choose one primary artifact shape:
   - `data-report`: durable answer-first narrative with evidence.
   - `dashboard`: monitoring or exploration surface.
   - `chart-frame`: one focused visual.
   - `poster`: one-message visual artifact with a locked hook, strict source/claim policy, and no inflated language.
   - `html-deck`: slide-like web presentation.
   - `ppt-handoff`: HTML deck plus PPTX implementation notes, or native PPTX when a presentation runtime is available.
   - `screenshot-evidence`: UI capture, before/after, or evidence wall.
   - `tweakable-artifact`: HTML artifact with parameter controls.
   - `design-system`: reusable visual language and tokens.
4. Lock contracts before generation: input, output, evidence, style, layout, visual assets, and validation.
   - For summaries, lock meaning preservation, verbatim number preservation, and plain-language rules before writing visible copy.
   - For posters, lock `poster-plan.json`, one-sentence message, visual hook, image strategy, claim integrity, and anti-AI-slop checks before writing the HTML.
   - For Swiss/Guizang-style decks, lock `aesthetic_contract`, design-system id, registered layouts, image slots, SVG text policy, motion policy, and visual rhythm before writing slides.
5. For substantial artifacts, run the design triad:
   - poster: reader job, decision value, narrative spine, source facts, non-claims;
   - designer: style preset, template, layout rhythm, images, diagrams, icons, motion;
   - reviewer: source fidelity, numbers, logic, aesthetic quality, visual defects.
6. Build from the smallest template that proves the artifact's purpose.
7. Validate structurally, validate aesthetic/asset contracts when present, then inspect visually in the real final surface when possible.
8. Deliver artifact paths plus a concise quality report.

## Ask Or Proceed

Ask before building when missing information changes:

- source truth;
- audience;
- output surface;
- deck style;
- chart interpretation;
- screenshot preservation/redaction;
- brand system;
- legal/compliance/sensitive-data handling.

Proceed with stated assumptions when the missing information only affects polish or can be safely revised later.

## Failure Modes

- Beautiful but unsupported numbers.
- Smooth summaries that alter original meaning or rewrite exact numbers.
- Dense artifact with no reader path.
- Dashboard used where a report is needed.
- Report used where a dashboard is needed.
- Deck with no narrative arc.
- Deck with no media decision, no image slots, and no flow/system diagram when the content is structural.
- Poster with generic AI words, emoji hooks, purple gradients, or a message that could fit any product.
- Generated SVG with visible text when the deck needs HTML-controlled typography.
- Generated diagram or UI mockup mislabeled as a screenshot.
- Chart family chosen before the analytical question.
- Style preset mixed with arbitrary color additions.
- Validator passed but browser layout was never inspected.
