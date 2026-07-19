# Taste Loop

## Purpose

Taste is a sequence of content-specific choices: inspect, form a thesis, compare only when useful, reject, restrain, build, and criticize. A preset can stabilize tokens; it cannot supply the point of view.

Run the Taste Loop after reader-job and shape selection, before preset or template selection.

## Taste Contract

Every Designer handoff records:

```json
{
  "visual_thesis": "One sentence describing what the composition should make the reader understand or feel",
  "content_tension": {
    "statement": "The contrast, conflict, hierarchy, or change that must become visible",
    "source_refs": []
  },
  "direction_alternatives": [
    {
      "id": "direction-a",
      "thesis": "",
      "cost": "",
      "status": "selected|rejected",
      "reason": ""
    }
  ],
  "signature_move": {
    "move": "One memorable visual action",
    "reader_value": "How the action helps the reader job"
  },
  "anti_reference": [
    {
      "reference": "A pattern, mood, or comparison this must not resemble",
      "avoid_because": "Why it would misrepresent this content"
    }
  ],
  "restraint_rule": "What is removed, repeated less, or kept quiet"
}
```

Do not satisfy these fields with only a preset, font, palette, template id, or generic adjectives such as clean, premium, modern, professional, bold, or elegant.

## Sequence

### 1. Recon

Inspect the source, audience, reader job, use frequency, existing design system, target surface, and evidence limits. Identify what is immutable and what the artifact may legitimately interpret.

### 2. Thesis

Write `visual_thesis` and `content_tension` before opening the preset registry. The thesis should predict a compositional choice, not merely a mood.

### 3. Diverge Only When It Adds Decision Value

For aesthetic-sensitive or uncertain work, form two materially different directions. They must differ in hierarchy, pacing, evidence treatment, or image/type relationship—not only color.

When a second direction adds no decision value, use an empty alternatives list and record a content reason, such as a binding brand system or a single evidence-preserving layout. Convenience is not a reason.

### 4. Reject

Name the rejected direction and `anti_reference`. Explain why each would obscure the reader job, overstate the source, imitate a category cliché, or create an unsustainable visual system. Do not merge every attractive idea into one artifact.

### 5. Restrain

Choose one `signature_move`; then write `restraint_rule`. A signature move earns attention only when surrounding elements are quieter. Prefer one memorable relationship over a collection of effects.

### 6. Build the Smallest Representative Surface

Before scaling the artifact, build the smallest surface that proves:

- first-view hierarchy;
- evidence path and uncertainty expression;
- the signature move;
- target viewport legibility;
- compatibility with the selected template or design system.

### 7. Validate Twice

Mechanical review checks truth, structure, required files, overflow, and applicable contracts. Visual review inspects the real surface slowly and at target size for hierarchy, rhythm, type, density, image fit, contrast, and content ownership.

### 8. Independent Critique

Reviewer must answer:

> Why does this composition belong to this content?

The answer must cite the reader job, visual thesis, content tension, source evidence, signature move, and restraint. “The validator passed” is not an aesthetic argument.

### 9. Loop at the Right Level

- If the direction is generic or belongs to different content, return to thesis/divergence.
- If the direction is right but the surface fails, return to the smallest representative build.
- If truth or risk fails, return to the source/assurance contract.
- Do not add a global rule or validator to hide one failed direction.

## Taste Gate

Before delivery, require a clear first-view claim, visible evidence path, content-specific composition, strong type hierarchy, target-surface legibility, explicit risk/uncertainty treatment, and one disciplined signature move. Decorative motion, theme variants, and non-core export surfaces may remain deferred.

`examples/` demonstrates validator behavior and is not a taste gallery. Use only case records in `showcases/registry.json` as curated production references, and retain each showcase's rejected directions and non-claims.
