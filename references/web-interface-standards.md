# Web Interface Standards

Use this reference only for responsive HTML applications and dashboards. It
extends `references/design-standards.md`; it does not replace the design-profile
resolver or create a second release gate.

## Evidence Levels

Classify every rule before applying it:

| Level | Meaning | Enforcement |
| --- | --- | --- |
| `hard_floor` | Accessibility, semantics, information preservation, or task completion | Fail when applicable and unproven |
| `product_default` | A broadly supported starting point for usable interfaces | Apply unless a documented task, density, platform, or brand constraint overrides it |
| `contextual_advisory` | Aesthetic or perceptual tendency | Use in design judgment; never auto-pass taste or user preference |

External design systems are evidence for methods, not universal brand defaults.
WCAG conformance claims use W3C thresholds; stronger platform recommendations
remain labelled as product defaults.

## Shape And Radius

`contextual_advisory`

Curved contours are often perceived as softer or more approachable, but preference
depends on familiarity, object type, expertise, culture, and context. Research does
not establish that every rectangle should be rounded or that larger radius is
always better. Material, Fluent, and Atlassian all use role-based radius scales,
including square or low-radius cases, rather than one global radius.

Apply shape by role:

| Element | Default treatment | Boundary |
| --- | --- | --- |
| Page bands, table grids, split panes, joined controls | Square joined edges or `0px` | Do not create gaps or false separation |
| Dense operational containers / high-density tables | `0-6px`, bounded by resolved preset | Preserve scan density and row continuity |
| Buttons, inputs, menus, compact cards | `6-8px` token from resolved scale | Keep peer controls geometrically consistent |
| Large low-density cards, dialogs, Bento Grid containers | `12-16px` within resolved preset cap | Linear uses `12px`, Stripe uses `16px`; separate surface from background |
| Status chips, tags, toggles, avatars | Pill (`9999px`) or circular form is allowed | Do not turn ordinary text buttons, tabs, or filters into pills |

Optical Nested Radius Rule:
- When rounded surfaces are nested, maintain optical concentricity:
  $$\text{Radius}_{\text{inner}} = \text{Radius}_{\text{outer}} - \text{Padding}$$
- E.g., if outer card radius is `12px` and padding is `8px`, inner element radius must be `4px`.
- Never use identical inner and outer radii when nested (causes corner distortion and pinched borders).

Reject:

- universal rounding (everything 16px/24px);
- radius chosen only to look modern;
- large rounded cards repeated for every paragraph or table row;
- nested cards with equal radius;
- pill-shaped navigation and commands when ordinary controls are clearer.

Verification: inspect computed radii by component role and density, then perform
human review. Browser geometry can verify the chosen values, but it cannot prove
friendliness.

Sources: [Material shape](https://m3.material.io/styles/shape/corner-radius-scale),
[Fluent shapes](https://fluent2.microsoft.design/shapes),
[Atlassian radius](https://atlassian.design/foundations/radius),
[curvature review](https://pmc.ncbi.nlm.nih.gov/articles/PMC4709714/), and
[familiarity study](https://pmc.ncbi.nlm.nih.gov/articles/PMC8269663/).

## Hierarchy And Primary Action

`product_default`

- Give each task context one primary action. A second prominent action is allowed
  only when it represents a genuinely peer decision.
- On repeated operational surfaces, show the current task, blocking state,
  recovery action, and next action before catalogues, configuration, or
  administration.
- Use position, grouping, type, whitespace, and contrast before adding containers,
  elevation, or color.
- Make an action's visual label match what activating it does. Selection controls
  must not look like direct commands.
- Single-Truth Context Protocol: Context information (task title, entity ID, source quotes) must be declared
  once in a compact breadcrumb or header, and must not be duplicated across child evidence cards.
- Diff-First Principle for Review/Audit: In comparison or review cockpits, anchor the visual center with a unified
  Conflict Diff hero container rather than scattering claims and facts across separate equal-weight cards.
- Focal Weight Budget: Ensure the primary focal container commands at least 40% of first-scan visual weight;
  stacking more than 3 equal-weight rectangular cards without a clear focal anchor is forbidden.
- Every additional block competes with the primary task; remove any block whose
  reader job cannot be named.

Verification: inspect the first viewport at every required width. Record the
primary task and action coordinates, and reject equal-weight card walls or multiple
unexplained primary buttons.

Sources: [Material structure](https://m3.material.io/foundations/designing/structure),
[Apple buttons](https://developer.apple.com/design/human-interface-guidelines/buttons),
and [Nielsen Norman usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).

## Defensive Layout Protocol

`hard_floor`

All responsive web interfaces, dashboards, and side panels must strictly enforce defensive CSS layout rules to eliminate container overflow, button ejection, and visual-fill distortion:

### 1. Flex Elastic Truncation Law
- Any Flex child item containing dynamic text, `<select>` dropdowns, user input fields, or tag chips must explicitly declare `min-w-0` and text truncation classes (`truncate` or `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`).
- *Technical imperative*: In CSS Flexbox, child elements default to `min-width: auto`. This prevents children from shrinking below their intrinsic text/content width. Without `min-w-0`, dynamic long names (such as 50+ character entity titles or database table paths) or wide `<select>` elements expand indefinitely, pushing sibling buttons and controls outside the container boundaries.
- *Standard pattern*: Always pair dynamic flex items with `min-w-0 flex-1 truncate` or equivalent CSS properties (`min-width: 0; flex: 1 1 0%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`).

### 2. Composite Control Layering Principle
- Any composite control combining "Selection Dropdown / Search Input + Trigger Action Buttons" (e.g., table selector + batch operations / refresh buttons) **must use a vertically layered card structure** (`flex-col gap-2.5`):
  - **Top Tier (Header & Actions)**: Title/label on the left, action buttons aligned on the right or spread evenly;
  - **Bottom Tier (Selector / Input)**: Full-width `<select>` or search input (`w-full`) underneath.
- *Strict prohibition*: Placing a dynamic `<select>` side-by-side with fixed action buttons in an unisolated single horizontal flex row is strictly forbidden. Long option strings will inevitably compress or eject action buttons outside cards in width-constrained views.

### 3. Fixed-Width Sidebar Grid Law
- Inside all fixed-width containers (width ≤ 400px, such as sidebars, queue panels, inspection drawers), button groups must use an equal-width structured CSS Grid (e.g., `grid grid-cols-2 gap-2` or `grid grid-cols-3 gap-2`).
- *Strict prohibition*: Relying on free-flowing `flex-wrap` in narrow or fixed-width containers is strictly forbidden, as variable button label lengths cause ragged multi-row wrapping, button clipping, height collapse, or lateral container overflow.

### 4. Anti-Visual-Fill Principle & Contextual Scope Filtering
- Display only authentic metrics that strictly belong to the current context and hierarchy level.
- If the source supplies only 3 valid metrics for the current scope, use a 3-column / 3-cell layout (e.g., `grid-cols-3` or asymmetric Bento grid); never mechanically stitch or borrow unrelated business nouns (e.g. adding "模型准召率" to a general workspace Hero Banner) merely to pursue 4-card or 6-card symmetrical grid symmetry.
- When consuming upstream `content-handoff.json`, strictly match and filter by `context_scope`. Reject rendering metrics, facts, or controls that belong to different scopes or child views.

Verification: inspect rendered containers under 50+ character string stress tests, check bounding boxes for zero overflow/ejection at 1440px / 768px / 390px / 320px, and verify zero horizontal scrolling.

## Spacing And Density

`product_default`

- Use the 8pt dynamic scale: `[4, 8, 12, 16, 24, 32, 48, 64, 96, 128px]`. Do not introduce
  arbitrary per-element gaps to repair individual screens.
- Keep within-group gaps smaller than between-group gaps.
- Let parent layout own spacing; avoid stacked child margins and separator lines
  when spacing already communicates the grouping.
- Containerless Design: prioritize whitespace, alignment anchors, and typography contrast
  to group content before wrapping every element in bordered boxes.
- Bento Grid Composition: use asymmetric ratios (e.g. 2:1 or 1.618 golden ratio) for
  primary vs secondary visual containers rather than flat 1:1:1 columns.
- Container Inset Floor: controls, switches, and action buttons floating inside cards
  must maintain at least 12px safe padding from parent borders; zero-inset boundary collision is forbidden.
- Surface Elevation Ramp: nested cards must establish clear physical depth via lightness delta (ΔL ≥ 3%),
  1px specular micro-borders, and subtle ambient shadows to prevent surface dissolution and boundary bleeding.
- White space must create focus, grouping, or reading rest. Large unused regions
  beside compressed text are imbalance, not restraint.
- Use compact density only for repeated expert work, and do not reduce target size,
  essential text, or state clarity to achieve it.

Exact token values remain design-system choices. A 4px or 8px base is not a
cross-product requirement.

Verification: compare computed spacing against declared tokens and inspect whether
the grouping survives the densest and narrowest states.

Source: [Carbon spacing](https://carbondesignsystem.com/guidelines/spacing/overview/).

## Typography And Contrast

`hard_floor` for contrast and adaptation; `product_default` for initial sizes.

- Normal text must reach 4.5:1 contrast; large text may use 3:1. Meaningful control
  boundaries, icons, and state indicators require 3:1 against adjacent colors.
- Color must not be the only state channel.
- Fluid Typography: for responsive web experiences, use `clamp()` for headline hierarchy:
  - Hero: `clamp(2.5rem, 4vw + 1rem, 4.5rem)` with tracking `-0.03em`;
  - H1: `clamp(1.75rem, 2.5vw + 0.5rem, 2.75rem)` with tracking `-0.02em`;
  - Body: 16px (1rem), line-height 1.5 - 1.6, max reading width 650px.
- Pair Sans-serif for narrative text and Monospace for data metrics and badges.
- Essential HTML reading text starts at 16 CSS px. Supporting operational text
  starts at 14px. `12-13px` is limited to non-critical metadata on desktop.
- Preserve content and function when users enlarge text to 200 percent.
- Preserve content and function when users override line height to 1.5, paragraph
  spacing to 2em, letter spacing to 0.12em, and word spacing to 0.16em. These are
  stress-test values, not required defaults.

Verification: compute contrast from authored colors, inspect loaded fonts, test
200 percent text zoom, and run the WCAG text-spacing override without clipping,
overlap, hidden controls, or lost text.

Sources: [WCAG text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html),
[WCAG non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html),
[WCAG text spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html),
and [Apple accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).

## Targets And Focus

`hard_floor` for the 24px minimum and visible focus; `product_default` for the
larger touch target and enhanced focus treatment.

- Every authored pointer target is at least `24 x 24 CSS px`, unless a documented
  WCAG exception applies.
- Prefer at least `44 x 44 CSS px` for touch or mixed-input Web products. A visual
  icon may be smaller when its interactive hit region meets the target size.
- Prefer at least 8px between adjacent touch targets.
- Every keyboard-operable control has a visible focus indicator.
- Use an enhanced focus treatment equivalent to a 2px perimeter with at least
  3:1 contrast change as the product default. This is based on WCAG 2.4.13 AAA,
  not an AA conformance claim.
- Match the focus outline to the component geometry and keep it visible against
  every adjacent surface.
- Tactile Inset & Shadow for Toggle/Switch Controls: toggle tracks must provide an inset track shadow
  (`box-shadow: inset 0 1px 2px rgba(0,0,0,0.12)`) and 1px micro-border (`1px solid rgba(0,0,0,0.08)`),
  and thumbs must provide a contact shadow (`box-shadow: 0 1px 3px rgba(0,0,0,0.2)`) to eliminate color conflation
  and boundary dissolution against light card backgrounds.

Verification: measure hit regions and spacing, tab through the real page, compare
focused and unfocused states, and record documented exceptions.

Sources: [WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
[WCAG enhanced target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html),
[WCAG focus appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html),
[Material structure](https://m3.material.io/foundations/designing/structure),
[Apple accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility),
and [Atlassian radius](https://atlassian.design/foundations/radius).

## Responsive Reflow And Tables

`hard_floor`

- At 320 CSS px, ordinary content and controls preserve information and function
  without page-level horizontal scrolling.
- Reflow changes layout order and grouping; it does not shrink a desktop canvas.
- A genuinely two-dimensional table, map, diagram, media view, or persistent
  manipulation toolbar may use local two-dimensional scrolling.
- Keep every exception inside a bounded region with an accessible name, visible
  overflow cue, keyboard access, and readable cell or panel content.
- Preserve row identity, state, and the primary action in the initial view. Do not
  silently drop columns.
- Convert a table to record cards only when the reader works by record; preserve
  tabular comparison when cross-row comparison is the task.

Verification: inspect 1440, 390, and 320px; distinguish page overflow from named
local overflow; test keyboard access and verify that essential content remains
discoverable.

Source: [WCAG reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

## Dialogs

`hard_floor` for truthful semantics and an accessible name; `product_default`
for the complete APG interaction pattern.

- Use a native `dialog` where it fits, or a container with `role="dialog"`, an
  accessible name, and `aria-modal="true"` only when the background is actually
  inert.
- As the product default, move focus inside when opened; contain Tab and
  Shift+Tab; close with Escape unless an explicit safety requirement forbids it;
  and return focus to the invoker or a logical successor.
- As product defaults, include a visible close or cancel action, choose initial
  focus by content and risk, and avoid stacked modals. For destructive or
  hard-to-reverse actions, prefer the safer action.

Verification: test open, forward and reverse Tab wrapping, Escape, background
inertness, close, and focus restoration on every declared viewport.

Sources: [WAI-ARIA 1.2 aria-modal](https://www.w3.org/TR/wai-aria-1.2/#aria-modal)
and the authoritative but non-normative
[WAI-ARIA APG modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## Language And Iconography

`product_default`

- **Language Default**: User-facing interfaces default to Chinese (Simplified). Navigation, metric cards, action buttons, table headers, empty states, and validation messages must be fully localized in natural Chinese; avoid untranslated English placeholders (e.g. "Lorem Ipsum", "Submit", "Filter") unless the user explicitly requested a multilingual or English interface.
- **Iconography System**:
  - Functional Visual Anchors: Key interactive and informational elements (navigation tabs, metric cards, primary CTA buttons, category badges, empty state illustrations) must carry matching vector icons.
  - Sourcing: Source vector icons from [iconfont.cn](https://www.iconfont.cn/) or clean inline SVG symbol libraries (e.g. Lucide / Tabler / Phosphor style).
  - Geometry & Stroke: Icons in the same surface must share consistent stroke width (1.5px or 2px), unified viewBox (e.g. 24x24), and proportional sizes (`16px`, `20px`, `24px`, or `32px`).
  - Semantic Alignment: Icons must reinforce semantic meaning (e.g. search, trend up, filter, alert, user, settings); do not use informal emojis as primary UI icons.

## Errors, Status, And Recovery

`hard_floor` for text error identification, programmatically determinable status
messages, and non-color meaning; `product_default` for recovery placement and
workflow coverage.

- Identify automatically detected input errors in text and identify the affected
  item.
- Make applicable status messages programmatically determinable when they do not
  take focus, and do not rely on color alone for status meaning.
- As product defaults, state what happened and what the user can do next, keep
  one recovery action adjacent to the failure, and preserve non-sensitive input.
- As product defaults, expose applicable pending, success, failure, and recovery
  states; do not make a transient toast the sole record of critical status.
- As a product default, delayed actions show immediate busy feedback and prevent
  accidental duplicate submission.

Verification: exercise default, pending, success, failure, and recovery paths;
confirm that the same action name means the same outcome and that recoverable input
survives.

Sources: [WCAG error identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html),
[WCAG status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html),
[GOV.UK error messages](https://design-system.service.gov.uk/components/error-message/),
[Nielsen Norman usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/),
and [Apple buttons](https://developer.apple.com/design/human-interface-guidelines/buttons).

## Form Assistance

`hard_floor` for applicable labels, semantics, input purpose, and same-process
repeated entry; `product_default` for native associations and concise
instructions. Purpose: reduce input burden without hiding what a field means.

- Give every data-entry control a presented label or necessary instruction, and
  independently expose its programmatic name, role, and label relationship.
- For a field collecting current-user information whose purpose is in WCAG's
  fixed list and expressible by the technology, expose accurate purpose
  metadata. A matching HTML `autocomplete` token is the default method, not the
  only conforming method.
- When the same process requests information the user already entered or
  received, auto-populate it or make the prior value selectable.

Boundaries: labels and instructions apply to required and optional data entry,
not links or non-input commands; add no instruction when a clear label suffices.
Purpose metadata excludes other people's, business, search, unsupported, and
unlisted data. Re-entry need not cross sessions and may remain when essential,
required for security, or based on invalidated data. No exact HTML markup is
universal; an accessible name alone does not replace a presented cue.

Reject: placeholder-only labels, indiscriminate or mismatched `autocomplete`,
browser autofill as the only repeated-entry support, unjustified re-entry, and
instructions that repeat or bury the task.

Verification: inspect visible cues and DOM or accessibility-tree associations;
match current-user fields to valid purpose tokens; trace multi-step processes
and test prior-value reuse plus every claimed exception.

Sources: [labels or instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html),
[input purpose](https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html),
[redundant entry](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html),
and [name, role, value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html).

## Accessible Authentication

`hard_floor` for Accessible Authentication (Minimum); passwordless architecture
and the Level AAA enhanced outcome are not hard floors. Purpose: keep unaided
memory, transcription, or puzzle solving from becoming the only path.

- A cognitive function test requires an alternative without that test, a
  mechanism that assists completion, or an applicable Level AA exception.
- When passwords or codes provide that assistance, preserve manager or autofill
  recognition and whole-value paste; segmented code fields must accept the whole
  code when no other conforming path exists.
- At least one complete path must conform through every authentication step,
  including multi-factor and account-recovery steps used for authentication.

Boundaries: Level AA permits object recognition and recognition of non-text
content supplied by the user; Level AAA does not. Account creation is outside
the criterion's direct scope. Audio transcription remains a cognitive test, and
an accessible first factor does not cure an inaccessible second factor.
Passwordless, WebAuthn, OAuth, hardware keys, and biometrics are optional product
or security choices.

Reject: blocked password or code paste when it is the assistance mechanism,
character-by-character-only code entry, treating every CAPTCHA as forbidden at
AA, or claiming accessible authentication means passwordless-only.

Verification: test password-manager or autofill recognition, password and
whole-code paste, every multi-factor and recovery step, and conditional
challenges; record the alternative, assistance, or AA exception for each
cognitive-test step.

Sources: [accessible authentication minimum](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html),
[accessible authentication enhanced](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-enhanced.html),
and [failure F109](https://www.w3.org/WAI/WCAG22/Techniques/failures/F109).

## Transient Interaction, Focus, Motion, And Time

`hard_floor` for applicable hover or focus content, minimum focus visibility,
adjustable timing, and pause, stop, or hide outcomes; `product_default` for full
focus visibility and disabling non-essential interaction-triggered motion.
Purpose: prevent overlays, motion, and time from hiding or interrupting the task.

- Authored content that appears and disappears with hover or focus must be
  dismissible without moving the trigger, hoverable when pointer-triggered, and
  persistent until trigger removal, dismissal, or invalidation.
- A keyboard-focused component must never be entirely hidden by authored
  content. Keep it fully visible as the stronger Level AAA product default,
  separate from focus-indicator visibility.
- For each content-set time limit, let users turn it off beforehand, adjust it
  across at least ten times the default, or receive at least 20 seconds to extend
  it with a simple action at least ten times.
- Automatically starting parallel movement over five seconds needs pause, stop,
  or hide unless essential. Parallel auto-updates need pause, stop, hide, or
  frequency control unless essential; no five-second threshold applies.
- Suppress non-essential interaction-triggered motion by default without losing
  information or function; reduced motion is one sufficient route, not the only
  mandated implementation.
- Spring Physics & Micro-Interactions (`product_default`):
  - Use spring easing curves: `cubic-bezier(0.16, 1, 0.3, 1)` for smooth damping, or `cubic-bezier(0.34, 1.56, 0.64, 1)` for subtle tactile snap;
  - Interactive hover states: subtle scaling (`scale(1.01)`), specular edge highlight, or radial ambient glow tracker on cursor focus;
  - Staggered entry: sequence page load or section entry elements with 40-60ms staggered delay for rhythmic perception;
  - Always pair with `@media (prefers-reduced-motion: reduce)` to immediately collapse all transitions to instant static rendering.

Boundaries: hover or focus rules exclude unmodified user-agent content,
focus-revealed controls, and modals; dismissal without moving the trigger is not
required for input errors or non-obscuring content. For movable authored regions,
focus-obscuring checks use initial positions; user-opened content may obscure
focus when reveal does not advance focus. Timing exceptions are unavoidable
real-time events, essential limits invalidated by extension, and limits over 20
hours; external limits are out of scope and security is not a blanket exception.
Movement of five seconds or less and an essential loader shown alone are outside
the movement branch. Essential interaction motion is exempt from the default.

Reject: promoting full focus visibility or reduced motion to AA; treating Escape,
APG tooltip roles, `scroll-padding`, or `prefers-reduced-motion` as the sole
implementation; requiring all animation to pause or all limits to disappear;
focus-only pause controls; or fully obscured keyboard focus.

Verification: test hover travel, keyboard focus, dismissal, and persistence; tab
with every sticky layer open at 1440, 390, and 320 CSS px; use controlled clocks
for limits, extensions, movement, and updates; exercise reduced-motion behavior
without information or function loss.

Sources: [content on hover or focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html),
[focus not obscured minimum](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html),
[focus not obscured enhanced](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-enhanced.html),
[timing adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html),
[pause, stop, hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html),
[animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html),
and the non-normative [APG tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/).

## Repeated Context Consistency

`hard_floor` for repeated help, navigation, and functional identification within
a declared page set; `product_default` for stable visual help placement.
Purpose: reduce relearning across related pages.

- Preserve the relative order of repeated human contact details or mechanisms,
  self-help, and automated contact mechanisms unless the user initiates change.
- Preserve repeated navigation order; inserted or removed items are allowed when
  repeated items keep their relative order.
- Identify repeated same-function components consistently in visible and
  accessible presentation. Context-sensitive wording may differ when the
  function remains recognizable; different outcomes must remain distinct.

Boundaries: help need not exist, be continuously available, or include contextual
field help. Declare page sets before review; distinct functional or language
sets may differ. Expected user-initiated layout changes may change order, but
ordinary navigation or login is not automatically an exception. Consistency
does not require identical wording, alternatives, visuals, or non-functional
styling.

Reject: adding help merely for conformance, freezing every navigation item or
layout, forcing context-insensitive identical labels, or comparing undeclared
and unrelated page sets.

Verification: declare page sets and recurring mechanisms; at 1440, 390, and 320
CSS px compare serialized order at equivalent states, visible and accessible
identification, user-initiated variants, and the separate product-default visual
placement.

Sources: [consistent help](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html),
[consistent navigation](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html),
and [consistent identification](https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html).

## Icons And Labels

`product_default`

- Use one declared local icon family with consistent stroke, optical box, and
  alignment.
- Use familiar icons for familiar secondary actions. Use a visible verb-object
  label when the icon is ambiguous or the action is consequential.
- Icon-only controls require an accessible name and a tooltip when the meaning is
  not immediately universal.
- Hide decorative icons from assistive technology.
- Do not use emoji or text glyphs such as `×`, `‹`, or `→` as production icons.

Verification: inspect asset provenance, accessible names, focus state, optical
centering, fallback labels, and missing-icon behavior.

Sources: [Apple buttons](https://developer.apple.com/design/human-interface-guidelines/buttons),
[Material structure](https://m3.material.io/foundations/designing/structure), and
[Nielsen Norman consistency guidance](https://www.nngroup.com/articles/ten-usability-heuristics/).

## Release Boundary

Automated checks may prove dimensions, overflow, contrast inputs, element roles,
focus order, and declared tokens. They cannot prove friendliness, aesthetic
quality, correct task priority, or real-user success. Those remain Reviewer and,
when required, observed-user judgments.
