# Screenshot And UI Evidence

## Modes

| Mode | Use |
| --- | --- |
| `preserve` | Exact evidence; do not alter source pixels except scaling/cropping. |
| `beautify` | Put screenshot on controlled canvas, add margin/shadow/frame. |
| `redesign` | Rebuild or reinterpret the screenshot; only with permission. |
| `compare` | Before/after, old/new, competitor/customer evidence wall. |

## Required Inputs

- source image path;
- mode;
- target ratio;
- sensitive fields to redact;
- text/data/brand that must stay exact;
- output artifact type.

## Rules

- Preserve exact screenshots for evidence unless user asks for redesign.
- Bind every local image to `data-image-slot`.
- Record cropping or redaction in `quality-report.md`.
- Do not use screenshot redesign to alter factual numbers or claims.
