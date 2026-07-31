# Component Library Policy

## Purpose

The component catalogue is a controlled set of visual capabilities, not a gallery and not a second runtime. It helps Design choose the smallest expression that improves a named reader job while preserving source truth, accessibility, performance, and target-surface compatibility.

The existing template registry, compiler, runner, evidence contract, and independent review remain the only control path. Component records provide facts and required gates. They do not own approval state, arbitrary commands, remote installation, or release.

## Product Boundary

Design may learn from React Bits, Aceternity UI, Uiverse, Open Design, Guizang PPT, and other authorized sources. A visual reference does not grant source-code redistribution rights and does not become Design's aesthetic identity.

- React Bits is a reference for semantic text, state, direction, sequence, and feedback motion. Shared-skill source adoption is blocked unless the exact redistribution boundary is explicitly cleared.
- Aceternity UI is a reference for spatial focus, asymmetric hierarchy, comparison, and high-tension composition. Unknown free-item redistribution terms fail closed.
- Uiverse is a reference for local control affordance and micro-interaction. Admission is item-level, not site-wide, and must retain source, author, license, and notice facts.
- Open Design and Guizang PPT remain subject to their file-level provenance, license, adaptation, and notice policies.

Do not record marketing counts, popularity, stars, or visual impact as quality or admission evidence.

## Decision Classes

Every candidate has exactly one decision:

| Decision | Meaning | Shared-skill code allowed |
| --- | --- | --- |
| `inspiration_only` | Study the semantic or compositional principle and implement no copied source. This is the default. | No |
| `admitted` | Design-owned code and assets passed every catalogue, compatibility, fallback, accessibility, performance, and evidence gate. | Yes |
| `project_local` | Authorized code is used only inside a named user project under that project's dependency, license, and build controls. | No redistribution through Design |
| `blocked` | A critical fact is unknown, prohibited, incompatible, or fails a required gate. | No |

Ownership is separate: `design_owned` identifies Design-created code, while `third_party_reference` identifies reference-only material. Never reinterpret `inspiration_only` as permission to make a close port. Never move `project_local` code into the shared skill. Never turn an unknown license into MIT by inference. Third-party source vendoring is outside the current P0 shared-skill contract.

## Borrow, Adapt, Vendor, Or Forbid

Use this order:

1. **Borrow the principle.** Name the semantic job or compositional relationship in plain language.
2. **Use a base primitive.** Prefer type, spacing, grid, chart, table, image, familiar control, or plain diagram when it completes the job.
3. **Adapt as Design-owned.** Reimplement only the general behavior or layout grammar using Design tokens and without copying distinctive source expression.
4. **Admit Design-owned code.** Use `admitted` only after the exact implementation and all required gates pass.
5. **Use project-local code.** Only in an explicitly authorized project with a verified package manager, lockfile, framework boundary, license, build, and fallback.
6. **Forbid or block.** Third-party vendoring is prohibited in this phase. Stop when a critical fact is unknown or the candidate creates more risk than reader value.

The simplest complete expression wins. A candidate is not admitted because it is attractive, popular, easy to copy, or available through a CLI.

## Candidate Record

The machine-readable catalogue is the source of truth when it exists. A human proposal should use the same concepts:

```json
{
  "id": "component-id",
  "name": "Human-readable name",
  "decision": "admitted|inspiration_only|project_local|blocked",
  "ownership": "design_owned|third_party_reference",
  "technical_class": "html_css|static_snapshot|native_react",
  "provenance": {
    "source_kind": "design_owned|third_party_reference",
    "source_ref": "Stable item-level source",
    "author": "Known author or unknown",
    "retrieved_at": "YYYY-MM-DD",
    "hash_status": "verified|unknown",
    "source_sha256": "Lowercase SHA-256 when verified"
  },
  "license": {
    "status": "known|unknown|conflicted",
    "id": "Exact license identifier or unknown",
    "scope": "Recorded use and redistribution boundary",
    "redistribution": "allowed|forbidden|not_applicable|unknown",
    "notice_requirement": "required|not_required|unknown",
    "evidence_ref": "Stable evidence reference"
  },
  "semantics": {
    "semantic_job": "state|direction|sequence|rhythm|evidence_emphasis|action_feedback",
    "reader_value": "What becomes harder without this component",
    "expression_level": "L0-static|L1-interactive|L2-motion"
  },
  "implementation": {
    "source_code_included": false,
    "runtime_dependencies": [],
    "remote_origins": [],
    "adapter_id": "html_css|static_snapshot|native_react",
    "materialized_files": []
  },
  "compatibility": {
    "artifact_types": [],
    "template_ids": []
  },
  "fallback": {
    "static_html": {"status": "required|not_applicable|unknown", "description": "Concrete equivalent"},
    "reduced_motion": {"status": "required|not_applicable|unknown", "description": "Concrete equivalent"},
    "ppt_handoff": {"status": "required|not_applicable|unknown", "description": "Concrete equivalent"}
  },
  "accessibility": {
    "keyboard": "required|not_applicable|unknown|failed",
    "focus_visible": "required|not_applicable|unknown|failed",
    "accessible_name": "required|not_applicable|unknown|failed",
    "screen_reader": "required|not_applicable|unknown|failed",
    "contrast": "required|not_applicable|unknown|failed",
    "reduced_motion": "required|not_applicable|unknown|failed"
  },
  "performance": {
    "status": "bounded|unknown|failed",
    "max_js_bytes": 0,
    "max_css_bytes": 0,
    "max_asset_bytes": 0,
    "max_dom_nodes": 0,
    "max_continuous_loops": 0
  },
  "required_gate_ids": [],
  "evidence_refs": [],
  "limitations": []
}
```

This shape mirrors `schemas/component-catalogue.schema.json`. The schema is authoritative. Do not create undocumented aliases in artifact manifests or handoffs.

## Selection Grammar

Choose a component only after reader job, visual thesis, content tension, template, and L0 expression are known:

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

A valid selection answers:

1. What source-supported content or action job exists?
2. Why is the base L0 primitive insufficient?
3. What becomes harder to understand or do without the component?
4. Why is this the lowest sufficient expression level?
5. How does it inherit the active template's type, color, spacing, radius, stroke, and motion grammar?
6. What are the exact reduced-motion, static HTML, and PPT equivalents?
7. Which source, license, dependency, accessibility, performance, compatibility, and evidence gates apply?
8. Which simpler or visually tempting option was rejected, and why?

If any answer is generic, unknown, or unsupported, use the base primitive or set the decision to `blocked`.

## Content-To-Component Rules

| Content or action job | Default primitive | Optional enhancement | Reject |
| --- | --- | --- | --- |
| Claim plus evidence | Type hierarchy, direct labels, evidence block, source note | One evidence emphasis or ordered reveal | Background loop, hover-only evidence, decorative count-up |
| Priority or grouped comparison | Grid, grouping, position, restrained area hierarchy | Asymmetric evidence grid or compare control | Geometry that implies unsupported magnitude |
| Sequence or progress | Stepper, timeline, numbered small multiples | Staged reveal or trace | Animation as the only indication of order |
| Causal or system relationship | Diagram, labeled connector, annotation | Directional trace tied to a source-supported edge | Decorative beams, invented links, unlabeled motion |
| Single-message persuasion | Type/image hero and one focus | One localized signature move | Multiple focal effects or atmospheric filler |
| Operational action | Familiar button, input, select, toggle, status | Local state feedback | Decorative controls, hover-only task, unfamiliar control grammar |
| Data comparison or monitoring | Chart, KPI context, table, filter, freshness | Control feedback only | Effects that change marks, scale, baseline, units, or evidence prominence |
| Long-form explanation | Editorial type, figure, heading, note | Rare local disclosure or feedback | Ambient loop and repeated section entrances |

## Admission Gates

A candidate can enter shared-skill use only when all applicable facts are known and verified:

- stable item-level source, author, version/commit, content hash, exact license, and retained notice;
- ownership and provenance `source_kind` match; only verified `design_owned` implementations may be `admitted`;
- redistribution scope is explicit; no inference from copy access, pricing, site terms, or popularity;
- complete direct and transitive dependency inventory with no runtime registry or network requirement;
- explicit target compatibility for self-contained HTML, PPT handoff, and project-local React as applicable;
- full static HTML, reduced-motion, and PPT fallback with unchanged meaning and reading order;
- keyboard, touch, focus-visible, naming, status, contrast, and non-color meaning where interactive;
- bounded DOM, payload, animation, continuous-work, and layout-shift risk;
- inheritance of the selected template and design-system tokens;
- positive and negative verification bound to the same component, plan, and artifact digest;
- independent Product and Design review of reader value and content ownership.

Critical unknowns fail closed. A reviewer may reject a known candidate; reviewer approval may not convert unknown provenance, license, dependency, or fallback into known facts.

## Adapter Boundaries

### `html_css`

For Design-owned or clearly permitted HTML/CSS with no runtime dependency or remote request. It must remain self-contained, keyboard-operable where interactive, and complete without motion.

### `static_snapshot`

For visual ideas that become a still image, editable structure, or static CSS treatment. Snapshotting must not rasterize source text, values, labels, caveats, or evidence that should remain editable and accessible.

### `native_react`

For a user-owned React/Next project only. It requires explicit authorization, exact dependencies and lockfile, framework/client boundary, production build and payload delta, browser evidence, and static/PPT fallback. The shared runner must not execute shadcn, jsrepo, package installation, or any remote registry command.

An adapter is an implementation class, not an approval path. It must resolve through the existing compiler and allowlisted runner.

## Attention And Coherence

- One viewport has one `primary_attention_region`.
- One artifact has at most one `signature_move`; `ambient_field_count` defaults to zero.
- A component inherits the active template's typography, spacing, color, radius, stroke, shadows, icon grammar, state language, and motion curve.
- Do not mix distinctive author styles. Normalize or reject.
- Components remain quieter than the claim, evidence, caveat, and action outcome they support.
- Repeated operational surfaces favor stability and recognition over novelty.

## Anti-AI-Slop Rejection

Reject component choices that create:

- a dark neon, purple-blue gradient, glass, glow, particle, or bento default unrelated to the subject;
- card-per-paragraph or nested-card composition;
- multiple accent systems, type systems, radii, shadows, icon styles, or motion grammars;
- fake screenshots, fake charts, filler metrics, generic abstract 3D objects, or decorative emoji;
- generic repeated entrance animation, autoplay, parallax, cursor-following, tilt, glare, or ambient loops;
- visual hierarchy based on component-demo spectacle rather than source-backed importance;
- familiar actions made less recognizable by novelty controls;
- any implied magnitude, priority, sequence, or causality not present in the source.

## Rejected Patterns Record

Record at least one simpler or competing direction:

```json
{
  "candidate_id": "component-id",
  "rejected_pattern": "Plain primitive or alternative component",
  "reason": "Specific reader-value, truth, attention, license, dependency, accessibility, performance, or compatibility reason",
  "evidence_ref": "Source, preview, test, or review record"
}
```

Do not merge rejected effects back into the selected direction as decoration.

## Stop Conditions

Stop adoption and return to the L0 primitive when:

- source, author, license, notice, dependency, hash, or redistribution scope is unknown;
- the candidate requires unapproved installation, arbitrary commands, remote runtime, or a second control path;
- the static, reduced-motion, or PPT state loses meaning, evidence, labels, caveats, sources, actions, or reading order;
- keyboard, focus, touch, contrast, status, or motion safety cannot be verified;
- the component conflicts with the selected template or spends more attention than the content warrants;
- payload, continuous work, layout shift, or maintenance cost exceeds the declared reader value;
- the reviewer cannot explain why the component belongs to this content.

Removal is the default rollback. Do not weaken a gate to retain a visually attractive candidate.

## Evidence And Non-Claims

A catalogue entry proves only the facts and gate results it records. A passing fixture proves contract compatibility, not production beauty. A screenshot proves a rendered state, not keyboard behavior, lifecycle cleanup, reduced-motion equivalence, license rights, or reader value.

The following remain human judgments:

- whether the composition belongs to the content;
- whether the attention budget is well spent;
- whether the enhancement materially improves the reader job;
- whether the artifact feels coherent rather than assembled from component demos.

Final shared-skill admission requires both deterministic evidence and independent review. Third-party legal interpretation remains outside this design policy; unresolved license scope stays blocked.
