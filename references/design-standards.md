# Design Standards

This is the packaged design rule entrypoint for Design. It does not depend on
project memory. Source truth, accessibility, and target-surface constraints are
mandatory; composition must be justified by the current content.

## Product promise

Make the right conclusion easy to see without changing the source. A design earns
attention by improving understanding, not by adding decoration.

## Aesthetic Method

Content precedes style; hierarchy precedes ornament; truthful encoding precedes
novelty. Density follows the reader job and surface. Every border, card, image,
icon, control, and animation must earn its attention. Preserve meaning across
HTML, PPT, screenshots, print, static, and reduced-motion fallbacks.

Before selecting a template, record one Taste Contract:

- `visual_thesis`: the compositional point of view;
- `content_tension`: the comparison, change, sequence, exception, scale, or
  uncertainty that deserves first attention;
- `signature_move`: zero or one memorable action with reader value;
- `anti_reference`: the concrete default this content must not resemble;
- `restraint_rule`: what is removed, repeated less, or kept quiet.

Generic adjectives, palette names, library names, and template ids do not satisfy
the contract. One surface has one primary attention region. Ambient effects
default to zero. Use type, spacing, position, grouping, and contrast before glow,
blur, shadow, depth, or motion.

Use the expression ladder:

| Level | Job | Admission |
| --- | --- | --- |
| `L0-static` | Complete claim, evidence, caveat, source, and reading order | Required |
| `L1-interactive` | Inspect, compare, filter, configure, disclose, or act | Named reader task |
| `L2-motion` | Explain state, direction, sequence, rhythm, or feedback | Clearer than static and has reduced-motion fallback |

Reject generic gradient/glass heroes, equal-weight card walls, fake UI or charts,
emoji icons, filler media, tiny evidence under oversized titles, mixed component
worlds, and repeated motion without a semantic job.

For responsive HTML applications and dashboards, load
`references/web-interface-standards.md`. Its rules are explicitly classified as
`hard_floor`, `product_default`, or `contextual_advisory`. Do not promote an
aesthetic tendency such as curvature preference into an accessibility gate:
rounded shapes can support an approachable tone, while dense tables, joined
controls, technical diagrams, and formal evidence may require smaller or zero
radii.

## Design Hierarchy

Use H0-H5 as decision layers, not new workflow stages or mandatory documents.
They are distinct from the L0/L1/L2 static, interaction, and motion levels.

| Layer | Decision and owner | Existing place to record it | Acceptance |
| --- | --- | --- | --- |
| H0 Product requirements | Request owner and Reviewer define what is promised, excluded, and how it will be proven | Design brief and `requirement-verification.json` | Every P0/P1 item has source, acceptance criteria, current evidence, and `passed` status |
| H1 Truth and meaning | Poster preserves facts, numerical bindings, time status, questions, and exclusions | Source ledger and content handoff | Exact values and code-derived results remain traceable; plans never become actuals |
| H2 Reader and narrative | Poster defines the audience's takeaway, evidence order, and unresolved decisions | Reader job, message, content units, visual priority | Finished business language; primary evidence and material caveats survive reduction |
| H3 Visual system | Designer selects the language-appropriate type family, color roles, density, and spacing | Taste Contract, existing profile and tokens | One coherent system, verified fonts, restrained accent, legible hierarchy |
| H4 Composition and media | Designer makes comparison, sequence, hierarchy, and magnitude visible | Reading order, slide/poster plan, media and chart contracts | Source-supported geometry and connections; each visual earns its space |
| H5 Delivery quality | Reviewer checks the actual export and the audience experience | Existing review and render evidence | No obstruction or leakage of production notes; content, surface, and human evidence are reported separately |

Resolve meaning before styling, styling before decorative effects. This order does
not make lower layers optional: accurate content with overlap still fails. User
brand and format requirements override discretionary H3/H4 defaults, never H1,
accessibility, or the no-obstruction gate. Templates and component libraries serve
these layers; they cannot define a competing design hierarchy.

## Product Requirement Traceability

Treat explicit product requirements as H0 input, not ordinary copy. Classify each
requirement as functional, content, visual, interaction, responsive, accessibility,
performance, or delivery. Preserve its stable id, source quote, priority,
acceptance criteria, declared surface states, verification method, and evidence.

Use `requirement-verification.json` when P0/P1 requirements exist. A passed item
binds the current `index.html`, `manifest.json`, source bytes, implementation
references, and evidence bytes. Any P0/P1 item in `failed`, `blocked`, `not_run`,
or `not_applicable` blocks candidate-ready delivery. A screenshot proves a visible
state, not a complete interaction; an automated assertion proves only its stated
behavior, not visual quality. Requirement changes invalidate affected evidence.

## Audience-Facing Production Copy

Deliver the report itself, not a commentary about producing the report. Apply this
to headings, chart labels, tables, captions, speaker notes, exports, and default
HTML states. Poster writes business copy; Designer must not append audit language.

| Production commentary to remove | Reader-facing expression, when supported |
| --- | --- |
| 原文时长 | 计划时长 |
| 以下为原文验收要求，非实测结果 | 性能与功能验收标准 |
| 原文未单独展开 | 接口范围待确认 |
| 依据保留文本快照整理 | Omit; retain extraction evidence in internal records |
| 不据此推算预算 | 人月单价与投资总额待确认 |

These are editorial examples, not global search-and-replace rules. Preserve plan,
target, estimate, reserved-interface, missing-data, and unresolved-question status.
Do not turn an open question into an approved condition or conceal uncertainty to
make a slide cleaner. Business data lineage is legitimate content; build hashes,
validator output, model self-evaluation, and extraction logs belong in the ledger
or review record, not the artifact or speaker notes.

Keep citations and attribution when needed for the reader's trust. Source criticism,
document comparison, and exact quotations can legitimately discuss the source.
Synthetic data, generated mockups, and illustrative relationships that could be
mistaken for observations still require clear disclosure, such as "概念方案" or
"模拟数据". An accurate proposed-system diagram can use "拟建对接关系" instead of
a production disclaimer. Presentation tone never overrides disclosure obligations.

The content-handoff and summary checks detect a small set of production-commentary
phrases in narrative text. They do not inspect every delivered heading, speaker
note, chart, or runtime state; H5 must still inspect the final artifact.

## Typography and Color Discipline

- For a concise Chinese business report without a supplied brand, start with one
  available modern CJK sans-serif family. MiSans and Noto Sans SC are candidates,
  not bundled fonts or universal choices. Verify actual family, glyph coverage,
  weights, licensing, renderer availability, and the target player's fallback.
- Use weight, size, position, and whitespace for hierarchy before adding a second
  family. Serif/editorial or brand-specific type remains appropriate when the
  brief calls for it; do not mix fonts simply to make the cover look different.
- Resolve color through the existing profile and its `color_contract`; never add a
  parallel palette router. Use foundation, reading, focal, semantic, and data roles
  in that order. The primary accent has one stable job. A second accent follows its
  declared mode: forbidden, marker-only, semantic support, or bounded series.
- Additional colors require semantic work: data categories, state, accessible
  distinctions, verified media, or supplied brand. Preserve meaning through labels,
  geometry, position, shape, or pattern; color alone never carries a critical state.
- Validate declared token pairings with
  `node scripts/validate-color-system.mjs .`, then inspect the actual rendered
  surface. Token contrast does not prove contrast over imagery, transparency,
  gradients, blend modes, or interactive states.
- Use `references/color-system.md` for source priority, the six color paradigms,
  accent boundaries, data color, dark-surface rules, and review failures.
- Keep letter spacing at zero. Verify actual px/pt and font substitution in the
  final renderer. Missing fonts are a delivery risk, not resolved by declaring a
  family name in CSS or OOXML.

## Non-negotiable standards

1. Preserve source values, units, dates, names, signs, uncertainty, and claim strength.
2. Compute derived values with executable code and retain the calculation receipt.
3. State the reader job before choosing a visual form, preset, or template.
4. Use one visual system and one primary attention region per surface.
5. Make the complete L0 static state understandable before adding interaction or motion.
6. Give every chart, image, icon, diagram, and animation a named content job and fallback.
7. Inspect the real target surface; structural validation alone never proves taste.

## Creative rule

Start with the source relationship and compare two materially different compositions.
External references or user-selected history may inform the method, but their
availability does not determine the visual direction. Novelty without reader value
is rejected. A color swap is not a second composition.

For open Standard and Assured work, use `direction-comparison/v2`. The two
directions bind separate HTML or slide-plan structures, distinct structure hashes,
the same must-keep content units, and the same available requirement record.
After selection, capture four real-content keyframes: first viewport, densest
content, critical state, and narrow screen. Placeholders, CSS-only recolors, and
metadata-only variants cannot approve a direction.

## Composition rule

Find the content tension first: comparison, change, sequence, system, exception,
scale, uncertainty, or one-message emphasis. Select the lightest form that makes
that relationship visible. Generate two materially different directions for
Standard and Assured work when the user has not supplied a direction.

## Reduction rule

Remove any element whose content job cannot be stated. Prefer type, position,
spacing, grouping, scale, and contrast before glow, blur, glass, shadow, or motion.
Use at most one signature move per artifact. Avoid card-per-paragraph layouts,
decorative gradients, filler media, fake screenshots, and repeated effects.

## Hierarchy in Practice

Before adding visual variety, name the first takeaway, the evidence that supports
it, and the detail that can be read later. Record this in the existing reading
order or Taste Contract, not a new mandatory form. A decision-changing uncertainty
belongs beside the takeaway, not in the last footnote.

Use a source-supported message as the section heading where possible; a topic
label alone does not establish priority. Distinguish takeaway, evidence, and
supporting detail through position, grouping, type, and contrast. These are reading
roles, not a requirement for three boxes, fixed font ratios, or repeated summaries.
Emphasize according to the reader job, not simply the largest number. Keep a
highlighted value's unit, comparator, time status, and caveat equally discoverable.

In HTML, only supplementary detail may be collapsed. The default state must retain
the conclusion, essential evidence, exclusions, and unresolved decisions. Verify
keyboard disclosure and expand supplementary detail for print; in PPT or posters,
provide a readable static continuation or appendix when needed.

## Revision Discipline

Diagnose the reported failure before changing the surface: source interpretation,
missing evidence, weak priority, unsuitable visual form, or rendering. More charts
do not repair weak hierarchy. Different content relationships may need different
forms; comparable evidence should keep consistent scales and forms. There is no
minimum chart-type count. Use `references/report-dashboard.md` for form selection.

For a revision, record the feedback, suspected cause, targeted change, and observed
result in the existing review record. Separate a hypothesis from a demonstrated
cause. Preserve source bindings and recheck the complete artifact after changing
layout or disclosure. Feedback on an earlier version is not approval of a later
one. Without human evidence, report the implemented change and checks, not improved
comprehension or preference. External references are optional, not a repair step.

## Readability and Surface Rules

- PPT: inspect at the intended presentation size. As an initial floor, use 24 pt
  for essential body text and 18 pt for supporting labels in native slides; verify
  the exported result, since CSS px and slide pt are not interchangeable.
- HTML: essential reading text starts at 16 CSS px at normal zoom. Preserve reading
  order on narrow screens; reflow instead of shrinking a desktop canvas to fit.
- Poster: establish viewing distance and physical or screen size first. The main
  message must be identifiable before details. Offer zoom for fixed-size posters;
  do not claim thumbnail visibility proves full-poster readability.
- These are starting floors, not guarantees. Use larger text where viewing distance
  requires it. Resolve overflow through reflow, approved summarization, or more pages.
- Keep Chinese headings in meaningful phrase groups; avoid single-character orphan
  lines and oversized headlines that crowd out the evidence.
- Every diagram edge must name a source-supported relationship. Decorative endpoints,
  invented connections, and unlabeled semantics fail content review.
- Compare actual-size compositions before expanding to a full set. Inspect cover,
  the densest content page, a relationship page, and the final decision page.

## No-Obstruction Gate

No text, value, comparator, label, connector, or control may obscure other content.
Check clipping and text-to-container fit as well as pairwise intersections. Shrinking
essential type, hiding content, adding opaque masks, or suppressing warnings is not
a fix. Reflow, shorten an approved summary, move the connector, enlarge its region,
or split the page while retaining bindings and reading order.

- PPT: inspect exported shape bounds, text fit, connector paths and endpoints,
  native table cells, chart labels, footers, and notes separately. Render all final
  slides. HTML screenshots do not establish native PPTX or target-player behavior.
- HTML: inspect actual loaded fonts and all declared viewport/state combinations,
  including disclosure, focus, sticky elements, print, and reduced motion when used.
- Poster: inspect at the delivery size and intended viewing distance, not just a
  thumbnail; a fixed poster may need zoom rather than shrinking to a phone.

Intentional containment (text inside its node) and documented background imagery
are not defects when contrast and readability survive. Separate text boxes should
not intersect. Investigate each geometric warning; a bounding-box scan cannot
measure glyph collisions, chart internals, z-order, or perceived reading quality on
its own. If a tool cannot inspect a surface, record the gap, never a zero-defect pass.

## Acceptance Evidence

Code tests establish structural behavior, not beauty. Without qualified designer
judgment, aesthetic acceptance remains unproven until real human evidence exists.
For a three-second test, show the relevant surface for a measured visible interval,
hide it, and collect free recall before recognition prompts. Keep answer keys hidden.
For blind preference tests, randomize positions, record stable variant identity,
allow a tie, and keep repeated responses from the same person identifiable. Prior
exposure, sample size, uncertainty, and test scope must be reported. Do not label
model responses or automated form fills as human evidence.

## Preset guidance

The six registered presets stabilize execution; they do not replace judgment:

- `neutral-analytic`: measured data and analysis;
- `editorial-report`: research and long-form reading;
- `swiss-deck`: executive, technical, and product decisions;
- `magazine-deck`: narrative and brand presentation;
- `operational-dashboard`: repeated scanning and action;
- `tweakable-lab`: reversible visual exploration.

## Promotion rule

A project record is evidence, not a standard. Promote a reusable rule only when its
scope, failure boundary, source, and evaluation evidence are explicit and the rule
has survived more than one materially different case or a documented expert review.
Explicit user requirements may become scoped normative rules immediately; this is
not empirical approval of the example artifact. The product-platform revisions
established the requirements above, not a universally approved MiSans/blue template.
Borrowed methods and implementation boundaries are mapped in
`references/frontend-styles.md`; do not load old decks to enforce these standards.
