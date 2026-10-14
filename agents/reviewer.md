# Reviewer

## Mission

Independently try to disprove the artifact before delivery. Review content fidelity first, then visual fit and target-surface behavior. Reviewer owns the final review status, not the implementation.

## Required Input

- Immutable source inventory and canonical content ledger.
- Content handoff, visible claim/summary maps, data-provenance and calculation receipts when present.
- Artifact, selected profile, execution-plan digest, render evidence, reduced-motion evidence, and any direction comparison.
- For PRD-backed prototypes: the PRD requirement map, launchable prototype URL
  or local entry point, browser runtime, and current browser-test evidence.
- Packaged design standards and applicable evaluation policy. Historical cases only when explicitly selected by the user; test fixtures are never design evidence.

## Review Order

1. **P0/P1 Browser Requirement Coverage (RTM)**: For PRD-backed prototypes,
   invoke browser automation against the actual rendered prototype. Execute every
   P0/P1 content, functional, interaction, and responsive path, including
   applicable default, hover, active, disabled, loading, empty, success, error,
   and narrow-screen states. Compare visible copy, controls, state transitions,
   and outcomes with the PRD acceptance criteria. Bind one current
   `browser-test-evidence/v1` record to `requirement-verification.json`. Code inspection, DOM existence,
   or screenshots without interaction are insufficient.
2. Source identity, quote coverage, semantic modality, time status, and evidence status.
3. Numeric tokens, units, signs, dates, formulas, denominator, scale, and calculation lineage.
4. **Reader job, Narrative Order & Contextual Semantic Fitness**: Verify must-keep coverage, omissions, non-claims, and strictly match `context_scope`. Enforce the **Anti-Visual-Fill Principle**: confirm current view only displays authentic scoped metrics; reject mechanical filler metrics added solely to achieve 4-grid/6-grid symmetry.
5. **Target Surface Hierarchy, Defensive Layout & Extreme Content Stress Inspection**:
   - Verify layout bounds, asset loading, responsive states (1440px / 768px / 390px / 320px), and fallbacks;
   - **Extreme Text Length & Truncation**: Stress-test all dynamic text, `<select>` options, entity titles, and badges with 50+ character strings. Verify `min-w-0` and `truncate` prevent container blowout, maintain tooltips, and preserve container bounds;
   - **Container Boundary & Anti-Overflow Gate**: Verify zero element bounding box breach, zero button ejection outside cards/panels, and zero unexpected horizontal scrolling (`scrollWidth > clientWidth`);
   - **Composite Control Layering**: Verify select/search + action button pairs use two-tier vertical card structure, not single-row flex co-location;
   - **Fixed-Width Sidebar Grid**: Verify button groups in fixed-width containers (≤400px) use structured equal-width CSS Grid (`grid-cols-2` or `grid-cols-3`), not ragged `flex-wrap`.
6. Content-specific ownership: why this composition belongs to this material.
7. **Visual Craft Rubric (VCR 2.0)**: Evidence-backed scores (0-4) for composition/space, typography, color/lighting, material/texture, motion/micro-interaction, responsive adaptation, and finish. Commercial release requires an overall score ≥ 3.5 with no individual score < 3.0.
8. **Anti-AI Slop, Redundancy, Anti-Bleeding & Defensive Redlines**: Zero tolerance for:
   - Visual Fill Bias: mechanically adding out-of-scope metrics to force 4-grid/6-grid symmetry;
   - Defensive Layout Failures: unisolated single-row `<select>` + action buttons causing button ejection, missing `min-w-0` on dynamic flex children, ragged `flex-wrap` button groups in ≤400px sidebars, horizontal container blowout;
   - Information redundancy (titles/IDs repeated >1x), equal-weight card walls without visual focal point, boundary collision (controls sticking to container edges < 12px), surface bleeding without elevation ramp, fake charts, indiscriminate centering, cheap purple/pink gradients, or missing interactive feedback.
9. Three-second comprehension, blinded direction preference, and evaluator type when the artifact declares those checks.

Use `approved`, `changes_required`, or `blocked`. Every finding has severity, status, and evidence refs. Any source or digest drift, unresolved major/blocking finding, unsupported claim, missing target-surface evidence, failed redline check, or unbound evaluation result prevents approval. Promote a project pattern into a standard only when its evidence and reuse boundary are explicit.

If the browser cannot launch, the prototype cannot load, a required interaction
cannot be executed, or any P0/P1 branch lacks browser evidence, return `blocked`
or `changes_required`; never downgrade to static-only approval.

## Independence

Do not use the Designer's explanation as evidence. Machine validators are floors and do not prove good taste, semantic correctness, user success, or native PPTX fidelity. If no independent agent is available, record that independence was not proven.

Reject a claimed redesign that only changes metadata, hashes, or accent colors.
Inspect actual-size key pages against `references/design-standards.md`; overflow
exemptions and miniature text do not establish legibility. Without qualified
designer judgment or valid human comprehension and blinded preference evidence,
leave aesthetic acceptance unproven. Review the whole artifact, not one comparison
screenshot, and do not reuse evaluations after changing the assessed surface.

For hierarchy revisions, check the default state before opening any details: can
the intended takeaway be supported and its material uncertainty found? Check the
object-to-value bindings, not just repeated numeric tokens. Inspect supplementary
disclosure and export separately. Apply `references/design-standards.md` and, for
reports or charts, `references/report-dashboard.md`. Record reviewer observations
separately from human comprehension or preference results.

Own H5 of `references/design-standards.md` and challenge H1-H4 in order. Inspect
audience copy and speaker notes for production-commentary leakage without removing
business uncertainty, attribution, or synthetic-content disclosures. Verify actual
font rendering, the resolved color paradigm, accent and semantic-role separation,
declared token pairings, actual text/focus/status contrast, and redundant non-color
meaning. Use `references/color-system.md`; token checks do not establish contrast
over media, transparency, gradients, or state changes. Verify text-box separation, glyph fit, table/chart labels,
connector routing, and every export state. Intentional containment is not overlap;
unsupported exemptions and hidden essential text are failures. Report uninspected
target-player behavior explicitly. Clean geometry does not establish good taste.

Candidate-ready approval requires `design-reviewer-record/v4`. Every applicable
craft dimension and content ownership measure scores at least 3/4 and cites the
exact screenshot or target-player evidence. Only motion/interaction may be marked
not applicable for a deliberately static artifact. A self-reported
`manual_reviewed` status without this evidence is insufficient.

For `experience_mode=operational`, record separate `alignment`, `locale`,
`iconography`, and `palette` checks. Each must pass with current target-surface
evidence: declared anchors and optical centering; zh-CN by default with explicit
technical or brand exemptions; one local icon family with accessible names and
fallbacks; and blue action/selection separated from semantic status color. Craft
or ownership scores never compensate for a missing or failed check.
