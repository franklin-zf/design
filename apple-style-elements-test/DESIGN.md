# Still — Design Contract

## Scope

Still is a fictional, schematic, one-page study of a quiet focus-session interface. It is an original design-system handoff, not a replica, endorsement, factual product claim, or shipping application.

- Reader job: let a product designer or frontend implementer judge whether the core controls form a coherent, buildable loop for starting, shaping, and completing a focus session.
- Shape: `design-system`, rendered as one responsive browser page.
- Lane: Standard, because the artifact is a design-system handoff.
- Template: registered `design-system-package`; chosen for component and token handoff intent.
- Reading mode: first-view orientation followed by an editorial, top-to-bottom element study.
- Schematic: `true`; there are no source-backed or derived claims.

## Taste Contract

```json
{
  "visual_thesis": "A pale, nearly silent field should make one warm focus pulse and a small set of precise controls feel like the room settling before work begins.",
  "content_tension": {
    "statement": "Duration and task state must be immediately legible without turning focus into a metric-heavy dashboard.",
    "source_refs": []
  },
  "direction_alternatives": [
    {
      "id": "quiet-field",
      "thesis": "Open light space, graphite type, a single amber pulse, and hairline structure.",
      "cost": "Relies on disciplined spacing and typography rather than decorative novelty.",
      "status": "selected",
      "reason": "It keeps the working state primary and makes the controls read as one instrument."
    },
    {
      "id": "dark-immersive-orbit",
      "thesis": "A full-screen black field with luminous orbital timer graphics.",
      "cost": "Higher spectacle, contrast tuning, and motion burden.",
      "status": "rejected",
      "reason": "It over-dramatizes an everyday utility and approaches a familiar device-demo aesthetic."
    }
  ],
  "signature_move": {
    "move": "A single amber progress arc opens into a hairline timeline that quietly organizes the study.",
    "reader_value": "It connects active session state to the element system without dashboard chrome."
  },
  "anti_reference": [
    {
      "reference": "Recognizable branded product pages, settings screens, control tiles, hardware pills, or activity rings",
      "avoid_because": "Those compositions would turn an original focus instrument into imitation."
    },
    {
      "reference": "Generic SaaS card mosaics and neon productivity dashboards",
      "avoid_because": "They fragment attention and contradict the product's stillness."
    }
  ],
  "restraint_rule": "Use one accent, one continuous arc motif, no decorative imagery, no gradients, no stacked cards, and never more than one emphasized action in a section."
}
```

## Frontend Thesis

- Visual thesis: warm paper, graphite hierarchy, and one amber incomplete arc create a calm working instrument.
- Content plan: opening/orient; shape duration and sound; operate task and progress states; close with one commitment.
- Interaction thesis: one staged arrival, one shared-plane duration change, and one reversible begin/pause state transition.

## System Decisions

### Typography

The sole stack is `ui-sans-serif, system-ui, sans-serif`; no fonts are bundled or requested. Display is 64/64 desktop and 42/44 mobile at weight 560. Section title is 28/32, body 16/24, and utility 13/18 with modest tracking. Time uses tabular numerals. The product name is the loudest brand text.

### Color and semantic use

- Paper: `#F5F4F0`
- Raised plane: `#FCFBF8`
- Ink: `#191918`
- Secondary ink: `#6B6A65`
- Rule: `rgba(25,25,24,.14)`
- Sole accent: `#D06F2D`

Amber identifies the primary action and progress. Status always includes a symbol and text. Error uses an exclamation symbol, label, and ink boundary rather than a new semantic hue. There is no chart palette because the artifact contains no charts.

### Density, space, and form

Density is airy. The 4px base uses 8, 12, 16, 24, 32, 48, 72, and 112px primary intervals. Desktop content is capped at 1180px with 48px gutters; mobile gutters are 20px. Controls use 12px corners, the session plane alone uses 20px, and only the pulse and compact switch are fully round. Borders are 1px. The session plane alone receives a diffuse ambient lift.

### Hierarchy

The opening headline and live instrument share the first view. Family titles orient; demonstrations carry the primary evidence; annotations remain secondary. Dividers and whitespace group content. No card grid, metrics strip, logo cloud, decorative section, or ornamental image is present.

## Exactly Six Element Families

1. Type and status
2. Action controls
3. Choice controls
4. Task input
5. Session progress
6. Session row

The HTML preserves this order and does not introduce another titled family.

## Exactly Three Restrained Interactions

1. Arrival: wordmark, headline, copy, and primary action rise 8px and fade with 55ms staggering; the arc track draws once.
2. Duration change: direct taps and arrow/Home/End keys move one shared selection plane and crossfade the readout by 4px.
3. Begin / pause: the action compresses to 0.98 for 90ms, then status and labels crossfade while progress advances; pausing freezes and exposes Resume.

Reduced-motion preference collapses animation and transition durations to immediate state changes. No hover-only content exists.

## Responsive Contract

- 1440px: 64px transparent header; opening uses a 5-column copy span, one empty column, and a 6-column session instrument. Family content alternates annotation and demonstration across a 12-column editorial grid.
- Below 900px: opening and families become a vertical stack; documented control groups remain intact.
- 390px: 56px header, 42/44 display, 20px gutters, arc capped at 260px, full-width action buttons, one-row duration segment, and wrapped session-row metadata.
- 320px: the arc caps at 220px; all content remains vertically reachable without a horizontal layout requirement.
- Safe-area insets are respected at the header and closing edge.

## Accessibility Contract

Interactive targets are designed to be at least 44×44px. Focus uses a visible 2px ink outline with a 3px paper offset. The duration segment uses radiogroup semantics, roving `tabindex`, `aria-checked`, arrow keys, Home, End, and direct activation. Progress SVGs provide text equivalents, while visible time/state labels repeat the meaning. Labels remain outside inputs, and state never depends on color alone.

## Originality and Asset Boundary

The name, copy, incomplete lower-left arc path, proportions, symbols, and choreography are authored for Still. The study uses no external assets, network requests, images, device silhouettes, third-party icons, proprietary UI copy, branded marks, bundled fonts, or cloned layouts. Inspiration is restricted to general reduction, hierarchy, material clarity, space, and motion restraint.

## Assurance Boundary

This contract records intent and structure. It does not prove rendered fidelity, browser behavior, accessibility conformance, visual quality, independent review, user success, or legal clearance. See `quality-report.md` for current statuses.
