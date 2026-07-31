# Motion Policy

## Purpose

Motion is a semantic layer for state, direction, sequence, rhythm, evidence emphasis, and action feedback. It must not be used as decoration, as a substitute for hierarchy, or as the only carrier of meaning.

The artifact must be complete at `L0-static`. Add `L2-motion` only when a named relationship becomes materially easier to understand. Interaction alone is `L1-interactive` and does not justify motion.

## Semantic Jobs

Every motion recipe must declare exactly one primary `semantic_job`:

| Job | Allowed behavior | Static meaning |
| --- | --- | --- |
| `state` | Transition between two labeled states. | Both state labels and the current/final state remain explicit. |
| `direction` | Trace movement or orientation that the source supports. | A labeled arrow, connector, or positional relationship remains visible. |
| `sequence` | Reveal ordered evidence or steps. | Step numbers and the complete ordered sequence remain visible. |
| `rhythm` | Pace a deck transition, cover, close, or deliberate reading beat. | The same hierarchy and slide purpose remain clear in a still frame. |
| `evidence_emphasis` | Draw attention once to a source-backed claim, value, or change. | The evidence retains its final emphasis without animation. |
| `action_feedback` | Confirm hover, press, loading, success, error, or completion. | Text, icon, status, and outcome remain visible and announced where applicable. |

Do not use motion to simulate data, imply unsupported causality, conceal loading, make a static composition appear finished, or turn a generic template into a content-specific direction.

## Admission Rules

- Declare `semantic_job`, `reader_value`, trigger, scope, duration class, repetition, completion state, and every fallback before implementation.
- Use one localized motion zone. Each artifact may have at most one `signature_move`; the default ambient field count is zero.
- Use a user action, state change, or one-time visibility event as the trigger. Do not replay entrances whenever an element re-enters the viewport.
- Final content must exist in the DOM and remain readable when animation code, JavaScript, remote assets, or network access fail.
- Motion may not alter values, units, labels, chart marks, baselines, caveats, source notes, or semantic reading order.
- Do not delay primary content for a reveal. Motion may pace attention, not access.
- Do not apply one generic fade-up, stagger, count-up, or transition to every section or slide.
- Metric count-up shows a verified final value; it must not look like a calculation or stop at an intermediate value.
- Deck motion may support cover reveal, evidence sequence, directional transition, one metric emphasis, or close. Native PPT animation is a non-claim unless the generated PPTX and its runtime were verified.
- If browser behavior cannot be exercised, record motion QA as unverified and deliver the complete static state.

## Default-Prohibited Motion

The following are blocked by default and require a documented exception with content purpose, performance evidence, accessibility behavior, fallback, and independent review:

- continuous autoplay or ambient loops;
- parallax, scroll-jacking, cursor-following, magnetic controls, tilt, glare, and spotlight tracking;
- particles, WebGL fields, waves, animated grids, or shader backgrounds;
- flashing, rapid zoom, large camera movement, or motion that can trigger vestibular discomfort;
- infinite loaders that hide a failed or unknown state;
- animation that begins from pointer hover when the same task has no keyboard or touch path.

An exception still fails if the effect competes with evidence, causes content shift, increases input precision, or makes reduced/static/PPT states materially weaker.

## Timing And Attention

- Prefer short, direct transitions for action feedback and longer pacing only for deliberate deck or narrative transitions.
- Duration and easing must come from the active design system or motion recipe, not from component demo defaults.
- Stagger only when order is meaningful. Decorative per-character, per-word, or per-card staggering is prohibited.
- A semantic motion should settle into a stable final state. Do not keep evidence moving after the reader can understand it.
- Concurrent high-salience animations are prohibited. Source, caveat, table, and control regions remain visually stable while evidence is being read.

## Interaction, Keyboard, And Focus

- Motion triggered by a control must use a semantic control with an accessible name and a visible `focus-visible` state.
- Keyboard, pointer, and touch activation must produce the same state and final content.
- Hover may preview a non-essential effect; it may not be the only route to content, evidence, labels, or action.
- Focus must not be moved, hidden, or trapped by animation. DOM order remains the semantic reading order.
- Loading, success, and error feedback must expose a text or accessible status, not color or motion alone.
- Auto-advancing or continuous sequences need an obvious pause/stop control unless the movement is essential and separately approved.

## Lifecycle And Cleanup

- Start motion only from a named trigger and stop it on completion, cancellation, unmount, page/slide exit, or reduced-motion change.
- Cancel timers, animation frames, observers, listeners, Web Animations, and library timelines during cleanup.
- Prevent duplicate registration and replay after rerender, resize, navigation, or slide re-entry.
- Pause non-essential work when the document is hidden or the motion zone is outside the active surface.
- A failed motion initializer must leave the final static state visible and must not block navigation or controls.
- Do not make runtime network requests to load motion code, assets, fonts, or registry content.

## Reduced Motion

`prefers-reduced-motion` is behavioral policy, not a keyword check.

- Detect `@media (prefers-reduced-motion: reduce)` for CSS and `matchMedia('(prefers-reduced-motion: reduce)')` when JavaScript behavior must change.
- Under reduced motion, remove autoplay, continuous loops, parallax, large transforms, zoom, rotation, tracing, stagger, and cursor-following.
- Replace motion with an immediate final state or a short non-spatial state change. Do not merely shorten a large movement.
- Preserve all claims, values, units, labels, states, caveats, source notes, actions, focus order, and reading order.
- Do not require a refresh to honor a preference change when the runtime can observe it.
- A component that cannot provide an equivalent reduced state is not admitted for shared-skill use.

## Static HTML And PPT Fallbacks

| Dynamic pattern | Static/reduced HTML | PPT handoff |
| --- | --- | --- |
| Text or metric reveal | Show the complete final text/value in final hierarchy. | Use the final state; use duplicate slides only when sequence is itself the reader job. |
| Staged evidence | Show all evidence in semantic order with step or group labels. | Use step numbers, builds represented as duplicate slides, or a complete evidence slide. |
| Beam, connector, or traced path | Use a labeled line, arrow, step number, or relationship annotation. | Use editable connectors and labels; no GIF/video dependency. |
| Hover reveal or expandable detail | Place essential detail inline or in a visible callout. | Use an adjacent annotation, appendix, or small multiple. |
| Toggle, filter, or configuration | Show the decision-relevant default and label the represented state. | Show selected states as labeled small multiples when comparison is required. |
| Tilt, parallax, spotlight, glare, or cursor response | Use a stable crop/contrast field or remove the effect. | Flatten decorative depth while keeping text and evidence editable. |
| Ambient loop | Remove it. The composition must still hold. | No animated substitute. |

## Motion Recipe

Record this before implementing any `L2-motion` behavior:

```json
{
  "id": "motion-id",
  "semantic_job": "state|direction|sequence|rhythm|evidence_emphasis|action_feedback",
  "reader_value": "What becomes harder to understand or do without this motion",
  "trigger": "load_once|visibility_once|user_action|state_change|slide_enter",
  "scope": "One named element or region",
  "duration_class": "instant|short|deliberate",
  "repetition": "once|per_user_action",
  "completion_state": "The stable final state",
  "pause_or_stop": "How non-essential continuous behavior stops, or not_applicable",
  "cleanup": "Timers, frames, observers, listeners, and timelines to cancel",
  "fallback": {
    "reduced_motion": "Immediate equivalent state",
    "static_html": "Complete still representation",
    "ppt_handoff": "Editable still or ordered slide representation"
  }
}
```

`loop`, `autoplay_continuous`, and `hover_only` are not valid default repetition or trigger values.

## Verification And Non-Claims

Behavioral QA should compare normal, reduced-motion, static/no-JavaScript where applicable, keyboard, touch/narrow viewport, page/slide re-entry, and network-denied states. Verify that:

- the final state and all source-backed content are equivalent;
- no continuous animation remains under reduced motion;
- controls and focus remain operable;
- no duplicate timers/listeners appear after re-entry;
- no unexpected network request or layout shift is introduced.

The presence of a media query does not prove reduced-motion compliance. A static screenshot does not prove lifecycle cleanup. Passing mechanical checks does not prove that motion has reader value; final approval requires Product and Design review of the real behavior.
