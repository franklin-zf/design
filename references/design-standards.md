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

Before selecting a template, record one Taste Contract 2.0:

- `visual_thesis`: the compositional point of view and specific artistic tone (e.g. industrial brutalist, modern tech craft, editorial luxury);
- `content_tension`: the primary comparison, change, sequence, exception, scale, or
  uncertainty that deserves first visual attention;
- `signature_move`: zero or at most one memorable visual action with reader value (e.g. ambient specular glow, magnetic 3D tilt hover, or watermark display type);
- `shot_reference`: explicit inspiration anchor selected from Dribbble popular shots or visual recipes (defining layout topology, OKLCH palette, and material formula);
- `anti_reference`: the concrete default or AI slop pattern this content must not resemble (e.g. homogeneous 3-column white card grid, generic blue/purple gradient);
- `restraint_rule`: what is removed, repeated less, or kept deliberately quiet, explicitly enforcing the Anti-Visual-Fill Principle (e.g. omitting out-of-scope metrics, refusing filler cards just to force 4-grid/6-grid symmetry).

**Contextual Semantic Fitness & Scope Filtering Protocol**:
- **Anti-Visual-Fill Principle**: Display only authentic metrics and elements that strictly belong to the current context and hierarchy level. If the source supplies only 3 valid metrics for the current scope, use a 3-column / 3-cell layout (e.g., `grid-cols-3` or asymmetric Bento grid); never mechanically stitch or borrow unrelated business nouns (e.g. adding "模型准召率" to a general workspace Hero Banner) merely to pursue 4-card or 6-card symmetrical grid symmetry. Aesthetic symmetry must never compromise semantic fitness.
- **Scope Filtering Principle**: When consuming upstream `content-handoff.json`, strictly match and filter by `context_scope`. Reject rendering metrics, facts, or controls that belong to different scopes or child views.

Generic adjectives, palette names, library names, and template ids do not satisfy
the contract. One surface has one primary attention region. Ambient effects
default to zero. Use type, spacing, position, grouping, and contrast before glow,
blur, shadow, depth, or motion.

When no explicit visual style is requested, apply the **Modern Craft Baseline (`default-modern-craft`)**:
- Display Sans + Monospace pairing with negative tracking on hero titles;
- Single accent discipline with OKLCH high-gamut tones and subtle base tint;
- 1px specular micro-borders and 3-tier ambient soft shadows;
- Asymmetric Bento Grid layout with optical nested radii;
- Anti-bleeding Inset Depth: Floating controls inside cards maintain ≥12px safe padding from borders, paired with surface elevation ramps (ΔL ≥ 3%) and tactile inset shadows;
- Anti-Repetition & Single Truth: Context metadata (titles, entity IDs, quotes) appears exactly once in the primary view; avoid duplicate copies across headers, cards, and summaries;
- Focal Weight Budget: Define exactly one primary visual focal area (≥40% visual weight via scale, high-contrast OKLCH tint, or Diff view); reject equal-weight card walls;
- Smooth spring physics motion with staggered reveals and full reduced-motion fallbacks;
- Default Simplified Chinese locale: UI copy, navigation, buttons, metrics, and labels default to clear Chinese; avoid untranslated English placeholders (Lorem Ipsum) or raw machine identifiers;
- Semantic Icon Anchors: Navigation items, KPI metrics, primary actions, and status badges must have precise vector icon anchors (sourced from iconfont.cn or inline SVGs with unified 1.5px-2px stroke, 16/20/24px grid); emojis are forbidden as functional UI icons.

Use the expression ladder:

| Level | Job | Admission |
| --- | --- | --- |
| `L0-static` | Complete claim, evidence, caveat, source, and reading order | Required |
| `L1-interactive` | Inspect, compare, filter, configure, disclose, or act | Named reader task |
| `L2-motion` | Explain state, direction, sequence, rhythm, or feedback | Clearer than static and has reduced-motion fallback |

Reject generic gradient/glass heroes, equal-weight card walls, fake UI or charts,
emoji icons, filler media, tiny evidence under oversized titles, mixed component
worlds, unstyled default tables, and repeated motion without a semantic job.

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
| H1 Truth and meaning | Poster preserves facts, numerical bindings, time status, questions, exclusions, and context scope | Source ledger and content handoff | Exact values and code-derived results remain traceable; context scope is preserved; plans never become actuals |
| H2 Reader and narrative | Poster defines the audience's takeaway, evidence order, context scope, and unresolved decisions | Reader job, message, content units, visual priority | Finished business language; primary evidence and material caveats survive reduction; scope boundaries are respected |
| H3 Visual system | Designer selects type, color, density, spacing, and enforces Defensive CSS Layout Protocol | Taste Contract, existing profile and tokens | One coherent system, verified fonts, restrained accent, legible hierarchy, `min-w-0` truncation, and structured grids |
| H4 Composition and media | Designer makes comparison, sequence, hierarchy, and composite control layering visible | Reading order, slide/poster plan, media and chart contracts | Source-supported geometry, scope-matched grid counts (no filler cards), two-tier composite controls; each visual earns space |
| H5 Delivery quality | Reviewer checks the actual export, boundary constraints, extreme content stress, and audience experience | Existing review and render evidence | No obstruction, no button ejection, no overflow; extreme text truncates cleanly; content, surface, and human evidence reported separately |

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

- For modern digital surfaces, use fluid modular typography scale:
  - Hero Display: `clamp(2.5rem, 4.5vw + 1rem, 5rem)`, line-height `1.05 - 1.1`, negative tracking `-0.02em ~ -0.06em`;
  - H1 / Primary Section Title: `clamp(1.75rem, 3vw + 0.5rem, 2.75rem)`, line-height `1.15`, tracking `-0.02em`;
  - Body Reading: 15px - 16px, line-height `1.5 - 1.6`, constrained to max reading width (600px - 720px);
  - Metadata / Code / Metrics: 12px - 13px monospace with uppercase letter-spacing `+0.04em`.
- Pair high-character sans-serif (Display/Sans) for editorial headlines with precise monospace for data and metrics.
- Keep letter spacing at zero or negative for large display headlines (`-0.02em ~ -0.04em`) to prevent visual divergence, but never negative on body text.
- Resolve color through the existing profile and its `color_contract`; never add a
  parallel palette router. Use foundation, reading, focal, semantic, and data roles
  in that order. The primary accent has one stable job. A second accent follows its
  declared mode: forbidden, marker-only, semantic support, or bounded series.
- Modern lighting & material discipline:
  - Use OKLCH color space for wide-gamut vibrancy without middle-tone mud;
  - Micro-borders: use `1px solid rgba(255,255,255,0.08)` (dark) or `1px solid rgba(0,0,0,0.06)` (light) with top-light gradient emphasis;
  - Multi-layered soft shadows: 3-tier decay (Ambient + Direct + Contact) rather than single heavy black drop shadows;
  - Subtle noise texture (2% SVG fractal noise overlay) on dark/gradient surfaces to eliminate digital banding.
- Validate declared token pairings with
  `node scripts/validate-color-system.mjs .`, then inspect the actual rendered
  surface. Token contrast does not prove contrast over imagery, transparency,
  gradients, blend modes, or interactive states.

## Defensive Layout and Container Protocol

All responsive HTML, dashboard, and web interface implementations must strictly enforce the **Defensive CSS Layout Protocol** as a non-negotiable hard floor to prevent container blowouts, content overlapping, and button ejections:

### 1. Flex Elastic Truncation Law (`min-w-0` + `truncate`)
- Every Flex child item containing dynamic text, `<select>` dropdowns, user input fields, or tag chips must explicitly declare `min-w-0` and text truncation classes (`truncate` or `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`).
- *Technical cause*: In CSS Flexbox, child elements default to `min-width: auto`. This prevents children from shrinking below their intrinsic text/content width. Without `min-w-0`, dynamic long names (such as 50+ character entity titles or database table paths) or wide `<select>` elements expand indefinitely, pushing sibling buttons and controls outside the container boundaries.
- *Standard implementation*: Always pair dynamic text in flex containers with `min-w-0 flex-1 truncate` or equivalent CSS properties (`min-width: 0; flex: 1 1 0%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`).

### 2. Composite Control Layering Principle (Two-Tier Card Layout)
- Any composite control combining "Selection Dropdown / Search Input + Trigger Action Buttons" (e.g., table selector + batch operations / refresh buttons) **must use a vertically layered card structure** (`flex-col gap-2.5`):
  - **Top Tier (Header & Actions)**: Title/label on the left, action buttons aligned on the right or spread evenly;
  - **Bottom Tier (Selector / Input)**: Full-width `<select>` or search input (`w-full`) underneath.
- *Strict prohibition*: Placing a dynamic `<select>` side-by-side with fixed action buttons in an unisolated single horizontal flex row is strictly forbidden. Long option strings will inevitably compress or eject action buttons outside cards in width-constrained views.

### 3. Fixed-Width Sidebar Grid Law (`grid-cols-2` / `grid-cols-3`)
- Inside all fixed-width containers (width ≤ 400px, such as sidebars, queue panels, inspection drawers), button groups must use an equal-width structured CSS Grid (e.g., `grid grid-cols-2 gap-2` or `grid grid-cols-3 gap-2`).
- *Strict prohibition*: Relying on free-flowing `flex-wrap` in narrow or fixed-width containers is strictly forbidden, as variable button label lengths cause ragged multi-row wrapping, button clipping, height collapse, or lateral container overflow.

### 4. Anti-Visual-Fill Grid Protocol
- Grid column counts must strictly match the authentic count of scoped metrics. For 3 metrics, use `grid-cols-3` or 2+1 Bento proportion; do not force 4-column grids with fabricated filler metrics.

## Non-negotiable standards

1. Preserve source values, units, dates, names, signs, uncertainty, and claim strength.
2. Compute derived values with executable code and retain the calculation receipt.
3. State the reader job before choosing a visual form, preset, or template.
4. Use one visual system and one primary attention region per surface.
5. Filter upstream content by declared `context_scope`; enforce Anti-Visual-Fill and contextual semantic fitness.
6. Enforce Defensive CSS Layout Protocol (`min-w-0`, two-tier composite controls, sidebar button grids).
7. Make the complete L0 static state understandable before adding interaction or motion.
8. Give every chart, image, icon, diagram, and animation a named content job and fallback.
9. Inspect the real target surface against extreme content stress; structural validation alone never proves taste.

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
Check clipping, text-to-container fit, container boundary containment, and pairwise intersections. Shrinking
essential type, hiding content, adding opaque masks, or suppressing warnings is not
a fix. Reflow, shorten an approved summary, move the connector, enlarge its region,
or split the page while retaining bindings and reading order.

- PPT: inspect exported shape bounds, text fit, connector paths and endpoints,
  native table cells, chart labels, footers, and notes separately. Render all final
  slides. HTML screenshots do not establish native PPTX or target-player behavior.
- HTML: inspect actual loaded fonts and all declared viewport/state combinations,
  including disclosure, focus, sticky elements, print, and reduced motion when used.
  Perform **Target Surface Extreme Content Stress Inspection**:
  - Test dynamic text, `<select>` options, entity titles, and tag chips with 50+ character strings to verify that `min-w-0` and truncation classes (`truncate`) prevent container blowout;
  - Verify that no element bounding box exceeds its parent container and no action buttons or controls are pushed outside cards or panels;
  - Verify zero unexpected horizontal scrolling (`scrollWidth > clientWidth`) on page-level or panel-level containers.
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
