# Taste Loop

## Purpose

Taste is a sequence of content-specific choices: inspect, form a thesis, compare only when useful, reject, restrain, build, and criticize. A preset can stabilize tokens; it cannot supply the point of view.

Run the Taste Loop after reader-job and shape selection, before preset or template selection.

## Taste Contract

Every Designer handoff records:

```json
{
  "reader_job": "The decision, understanding, comparison, or action the artifact must support",
  "reading_mode": "scan|read|present|monitor|operate",
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
  "expression_level": "L0-static|L1-interactive|L2-motion",
  "semantic_job": "state|direction|sequence|rhythm|evidence_emphasis|action_feedback",
  "reader_value": "What becomes harder to understand or do if the enhancement is removed",
  "attention_budget": {
    "primary_attention_region": "One named viewport region",
    "signature_move_count": 0,
    "ambient_field_count": 0
  },
  "fallback": {
    "reduced_motion": "Equivalent state or not_applicable",
    "static_html": "Complete still representation",
    "ppt_handoff": "Editable still or ordered slide representation"
  },
  "component_selection": [
    {
      "component_id": "Registered id or proposed local id",
      "content_job": "The named content or action job",
      "decision": "admitted|inspiration_only|project_local|blocked",
      "ownership": "design_owned|third_party_reference",
      "why_selected": "Why the base primitive is insufficient",
      "provenance_ref": "Registry or source record",
      "fallback_ready": true
    }
  ],
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

The complete artifact must exist at `L0-static`. `L1-interactive` and `L2-motion` are optional progressive enhancements. When no component or enhancement is needed, use an empty `component_selection` list and omit component-only semantics. Record the static reader value directly in the thesis.

## Component Selection Syntax

For each non-basic component, write the decision as:

```text
SELECT <component_id>
FOR <content_job>
AT <L0-static|L1-interactive|L2-motion>
BECAUSE <reader_value>
WITH <reduced_motion>; <static_html>; <ppt_handoff>
UNDER <primary_attention_region>; signature=<0|1>; ambient=<0|1>
DECISION <admitted|inspiration_only|project_local|blocked>
OWNERSHIP <design_owned|third_party_reference>
SOURCE <provenance_ref>
REJECT <simpler_or_competing_pattern> BECAUSE <reason>
```

Selection is valid only when every line is concrete and the selected decision is allowed by `references/component-library.md`.

- `inspiration_only` informs a Design-owned solution but contributes no copied code.
- `admitted` is reserved for verified `design_owned` code and assets that pass all catalogue gates.
- `project_local` stays in an explicitly authorized user project and is not redistributed by the shared skill.
- `blocked` is the fail-closed result for unknown or incompatible source, license, dependency, fallback, accessibility, performance, or target-surface facts.

`design_owned` and `third_party_reference` are ownership values, not admission decisions. Third-party source vendoring is outside the current shared-skill contract and remains blocked.

The base primitive wins when it completes the reader job with less attention, dependency, or risk. "Looks better", "feels premium", library popularity, component count, and visual novelty are not selection reasons.

## Sequence

### 1. Recon

Inspect the source, audience, reader job, use frequency, existing design system, target surface, and evidence limits. Identify what is immutable and what the artifact may legitimately interpret.

### 2. Thesis

Write `visual_thesis` and `content_tension` before opening the preset registry. The thesis should predict a compositional choice, not merely a mood.

Name the immutable source facts and semantic reading order. State which relationship deserves first attention and which evidence must remain quiet but visible.

### 3. Diverge Only When It Adds Decision Value

For aesthetic-sensitive or uncertain work, form two materially different directions. They must differ in hierarchy, pacing, evidence treatment, or image/type relationship—not only color.

When a second direction adds no decision value, use an empty alternatives list and record a content reason, such as a binding brand system or a single evidence-preserving layout. Convenience is not a reason.

### 4. Reject

Name the rejected direction and `anti_reference`. Explain why each would obscure the reader job, overstate the source, imitate a category cliché, or create an unsustainable visual system. Do not merge every attractive idea into one artifact.

At minimum, test the selected direction against:

- the simplest L0 primitive;
- the strongest competing hierarchy;
- the relevant anti-AI-slop pattern;
- any component whose source, license, dependency, fallback, or surface compatibility is unknown.

Reject rather than repair by decoration when a direction depends on card stacking, generic neon/glass treatment, repeated entrances, atmospheric filler, or a component-library collage.

### 5. Restrain

Choose one `signature_move`; then write `restraint_rule`. A signature move earns attention only when surrounding elements are quieter. Prefer one memorable relationship over a collection of effects.

Set `primary_attention_region`, `signature_move_count`, and `ambient_field_count`. More than one signature move is invalid. Ambient defaults to zero and requires a content-specific exception.

### 6. Choose The Lowest Sufficient Expression Level

1. Build the complete `L0-static` expression.
2. Add `L1-interactive` only for a named inspect, compare, filter, configure, disclose, or action task.
3. Add `L2-motion` only for state, direction, sequence, rhythm, evidence emphasis, or action feedback.
4. Write all three fallbacks before accepting an enhanced component.
5. Use the component selection syntax and fail closed on unknown provenance, license, dependency, accessibility, performance, or compatibility.

### 7. Build the Smallest Representative Surface

Before scaling the artifact, build the smallest surface that proves:

- first-view hierarchy;
- evidence path and uncertainty expression;
- the signature move;
- L0 completeness and declared L1/L2 reader value;
- the attention budget;
- reduced-motion, static HTML, and PPT fallback;
- target viewport legibility;
- compatibility with the selected template or design system.

### 8. Validate Twice

Mechanical review checks truth, structure, required files, overflow, and applicable contracts. Visual review inspects the real surface slowly and at target size for hierarchy, rhythm, type, density, image fit, contrast, and content ownership.

Mechanical checks may prove contract presence or detect a known violation. They cannot prove that the composition belongs to the content, that the signature move has reader value, or that a third-party pattern is tasteful.

### 9. Independent Critique

Reviewer must answer:

> Why does this composition belong to this content?

The answer must cite the reader job, visual thesis, content tension, source evidence, signature move, and restraint. “The validator passed” is not an aesthetic argument.

The reviewer must also compare normal, reduced-motion, static HTML, and PPT states when an enhancement is used. A weaker fallback is a failed direction, not deferred polish.

### 10. Loop at the Right Level

- If the direction is generic or belongs to different content, return to thesis/divergence.
- If the selected component has no named reader value or exceeds the attention budget, return to L0 and component selection.
- If the direction is right but the surface fails, return to the smallest representative build.
- If reduced/static/PPT meaning differs, repair L0 and fallback before restoring enhancement.
- If truth or risk fails, return to the source/assurance contract.
- Do not add a global rule or validator to hide one failed direction.

## Taste Gate

Before delivery, require:

- a clear first-view claim and exactly one primary attention region;
- a visible evidence path, caveat treatment, and unchanged source meaning;
- a content-specific composition with a defensible ownership answer;
- strong type hierarchy and target-surface legibility;
- a complete `L0-static` state;
- named reader value for every `L1-interactive` or `L2-motion` enhancement;
- static HTML, reduced-motion, and PPT fallback equivalence;
- one or zero signature moves and zero ambient fields by default;
- no blocked component selection and no library collage;
- selected and rejected directions with content reasons.

Decorative motion, theme variants, and non-core export surfaces may remain deferred. Essential evidence, accessibility, fallback integrity, and content ownership may not.

`examples/` demonstrates validator behavior and is not a taste gallery. Use only case records in `showcases/registry.json` as curated production references, and retain each showcase's rejected directions and non-claims.
