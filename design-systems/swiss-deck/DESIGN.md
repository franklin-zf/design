# Swiss Deck Evidence System

## Purpose

Use this system for technical, product, data, and project-report decks where the reader needs a clear decision path and visible evidence. It is inspired by Open Design package discipline and Guizang Swiss deck layout locks.

## Promise

One deck, one visual system: registered layouts, strong hierarchy, source-backed claims, disciplined image slots, and no generic PPT card wall.

## Visual Rules

- Use the registered Swiss layouts described in `references/library.md`.
- Use one dominant accent. `--accent-2` is marker-only and must not become a surface, card fill, or large background.
- Use large type, hard alignment, asymmetry, and negative space before adding decoration.
- SVG generated assets may contain geometry only. Visible words, numbers, labels, and captions belong in HTML.
- Real screenshots must be declared as `kind: "screenshot"` with provenance. Generated UI illustrations must be `generated-schematic` or `ui-scenario`.
- Every image must bind to a named slot with a declared aspect ratio.
- Motion must support `prefers-reduced-motion` and may not carry the only meaning of a state change.

## Color

Use the `swiss-signal` paradigm. Neutral fields carry structure, blue identifies
focus and key evidence, and lime is marker-only with its declared inverse-text
pairing. A new chapter does not receive a new accent.

## Anti-Patterns

- Fake product screenshots.
- Purple or blue trust gradients.
- Multi-card walls with equal visual weight.
- Three consecutive slides with the same visual weight.
- Unregistered body layouts.
- Arbitrary hex colors outside the active design system.
