# Media Design

## Images

Every image decision states the content job: evidence, explanation, identification, comparison, atmosphere with narrative purpose, or deliberate omission. Prefer images that reveal the actual product, place, person, state, or object. Do not use dark, blurred, heavily cropped, or generic stock imagery when readers need to inspect the subject.

Web images require source and license records. Generated images are labeled generated and may not impersonate screenshots or evidence. Schematic images disclose their status visibly.

## Diagrams

Use Mermaid for clear processes, sequences, hierarchies, state transitions, and modest relationship graphs. Use a mind map only when radial grouping aids understanding. Do not force dense editorial composition, complex geometry, or precise spatial evidence into Mermaid.

Every connector, order, color, and size must reflect a supported relationship. Generated diagrams are schematic, not observed system evidence.

## Screenshots

Real screenshot evidence records the source application or page, capture context, viewport or device, freshness, and relevant state. Do not place generated UI inside a device frame and label it a screenshot. Crop only when the omitted context cannot change interpretation.

## Icons

Use a coherent icon family. Prefer familiar symbols for actions and icon-plus-text where ambiguity remains. Avoid emoji icons, mixed stroke systems, and decorative icons that compete with evidence.

Choose one family per artifact in this order: the host's complete local icon
library; one authorized project or style from
[Iconfont](https://www.iconfont.cn/) downloaded as local SVG; local Lucide icons.
Define the semantic icon list before searching. Do not mix projects or authors to
approximate a family.

Normalize local SVG `viewBox`, size, fill or stroke, and optical box. Record source
URL, icon name, author or project, license note, retrieval date, and file hash in
the existing visual asset provenance. Unknown licensing fails closed to Lucide.
Never load Iconfont fonts, JavaScript, or CDN assets at runtime.

Use the resolved `media.icon_policy` size, box, and text gap. Icon-only controls
are limited to universal secondary actions and require an accessible name. Keep a
visible text fallback for missing assets or uncertain meaning.

## Motion

Motion must explain state, direction, sequence, rhythm, evidence emphasis, or action feedback. One localized motion zone is normally sufficient. Avoid recurring entrance animation, autoplay ambience, parallax, tilt, glare, and cursor-following effects.

Provide reduced-motion behavior and a complete final static state. Motion may not alter numbers, hide caveats, delay essential evidence, or become the only carrier of meaning.

## QA

Check asset loading, crop, contrast, resolution, attribution, semantic accuracy, mobile behavior, reduced motion, keyboard/focus behavior when interactive, and static/PPT fallback equivalence.
