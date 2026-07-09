# Anti-AI-Slop Rules

These are concrete blocking rules for generated design artifacts. They are inspired by Open Design craft gates and adapted for this skill.

## Blocking Patterns

- Default AI indigo or purple accents hardcoded outside tokens: `#6366f1`, `#4f46e5`, `#4338ca`, `#3730a3`, `#8b5cf6`, `#7c3aed`, `#a855f7`.
- Two-stop trust gradients: purple to blue, blue to cyan, indigo to pink.
- Emoji as feature icons or poster visual hooks.
- Placeholder or filler copy: `lorem ipsum`, `placeholder`, `sample content`, `feature one`, `metric a`.
- Fake screenshots, generated dashboards, or UI mockups labelled as real screenshots.
- Rounded glassmorphism card stacks used as default polish.
- Decorative robots, abstract 3D shapes, neon grids, or particle networks without a content job.
- More than 12 raw hex values outside token declarations.
- Repeated `var(--accent)` or active accent use that floods the screen.

## Poster-Specific Rules

- A poster must have exactly one primary message.
- Poster text cannot rely on inflated words such as "赋能", "焕新", "重塑", or "颠覆" unless those words are present in the source and needed verbatim.
- A poster cannot be marked ready without `poster-plan.json`.
- A product poster cannot use generated UI art as a screenshot.

## Review Boundary

The anti-slop validator catches known bad patterns. It does not prove taste. Reviewer or human visual QA remains required for high-stakes presentation claims.
