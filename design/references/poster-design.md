# Poster Design

## Purpose

Poster artifacts compress one message into one high-recognition visual surface. A poster is not a PPT slide screenshot and not a generic AI image prompt.

## Product Promise

A poster should make one source-backed or clearly creative message visible in three seconds, with a strong visual hook and no generic AI template smell.

## Required Plan

Every poster artifact must include `poster-plan.json`:

```json
{
  "schema_version": "design-poster-plan/v1",
  "poster_goal": "product",
  "audience": "operators",
  "single_message": "One sentence only",
  "visual_hook": "What the eye remembers",
  "layout_lock": "poster-type-led",
  "design_system": "swiss-deck",
  "source_materials": ["source.txt"],
  "image_strategy": "typography-only",
  "claim_integrity": "source-backed",
  "anti_ai_slop_checks": ["no_gradient_hero", "no_emoji_icons"]
}
```

## Hard Constraints

- One poster has one primary message.
- The primary title must be the clear entry point.
- The poster must declare a visual hook.
- Colors must come from a preset or design-system package.
- Images must be real, generated with declared provenance, or omitted.
- Product posters prefer real screenshots or product-state visuals. If unavailable, mark the artifact as schematic or use typography/diagram.
- Do not use filler text, vague business slogans, or unsupported metrics.

## Layout Locks

- `poster-type-led`: typography is the hero.
- `poster-image-hero`: one image dominates, text supports it.
- `poster-data-hero`: one number or data statement dominates.
- `poster-split-claim`: one side claim, one side proof.
- `poster-editorial`: print-like title, caption, and source line.
- `poster-product-shot`: product or UI state is the core evidence.
- `poster-event`: time, place, title, and action hierarchy.

## Taste Gate

- Readable at 25 percent zoom.
- No more than one dominant visual entry point.
- No meaningless gradient, blob, glass card, or floating abstract 3D object.
- The poster still has identity if the title is hidden.
- Source-backed numbers remain verbatim.
- Any generated image or schematic is declared honestly.
