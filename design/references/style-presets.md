# Style Presets

Presets are contracts, not suggestions. Use one preset per artifact unless generating explicit alternatives.

## Presets

### `neutral-analytic`

For reports, dashboards, scorecards. Quiet canvas, compact hierarchy, high readability, source-first. Avoid editorial decoration.

### `editorial-report`

For narrative reports and longform explainers. Stronger typography, more whitespace, article-like pacing, restrained charts.

### `swiss-deck`

For technical, data, product, engineering, strategy decks. Grid-first, high contrast, one accent, registered layouts, no arbitrary decoration.

### `magazine-deck`

For keynote, thought leadership, culture, creative, and human narrative decks. Strong typography, image rhythm, wider spacing.

### `operational-dashboard`

For monitoring surfaces. Dense but calm, KPI strip first, filters only when useful, tables lower.

### `tweakable-lab`

For variants and live tuning. Uses CSS variables for accent, scale, density, mode, and motion.

## Color Rules

- Pick from `assets/themes/presets.json`.
- Use at most two non-neutral roots for analytical artifacts unless category identity requires more.
- Avoid red/green defaults for signed values unless domain semantics require them.
- Use direct labels and line styles when color alone would carry meaning.
- HTML colors must come from the active preset or from declared `style_overrides` in `manifest.json`.

## Token Rules

Each preset should define:

- surfaces: `surface`, `panel`, `panel_alt`, `line`, `text`, `muted`;
- accents: `accent`, `accent_2`, semantic positive/negative/warning;
- typography: display, body, mono, and a named type scale;
- spacing and density: compact/normal/roomy values;
- chart palette: categorical, sequential, diverging, grid, and axis colors;
- accessibility: minimum contrast notes and color-alone restrictions.

Treat preset names as contracts. If an artifact needs a different visual language, create or import a design system instead of mixing arbitrary colors into the artifact.
