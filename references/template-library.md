# Template Library

## Purpose

The template module stores reusable design thinking, not only HTML files. A template entry should explain what reader job it serves, which style system it belongs to, what evidence it can carry, and what risks it creates.

Template depth must come from real executable assets, adapted components, fixtures, and rendered QA. Labels such as `guizang-inspired` or `open-design-inspired` are not evidence that a production template has been adopted.

## Registry

Template metadata and inventory live only in `assets/templates/registry.json`. Other references explain method but must not reproduce a second inventory or template status table.

Required fields per entry:

```json
{
  "id": "",
  "name": "",
  "artifact_types": [],
  "style_presets": [],
    "source": "bundled|guizang-inspired|open-design-inspired|local-case",
  "best_for": [],
  "avoid_when": [],
  "required_assets": [],
  "validation_gates": [],
  "thinking_ref": "",
  "showcase_refs": []
}
```

`showcase_refs` is required on every entry and is empty when no reviewed production case exists. Existing truthful provenance and production fields remain entry-specific; do not add aspirational metadata or infer validation status.

### Base Gates Versus Risk Supplements

The registry's `validation_gate_ids` are the base gates intrinsic to that template. They are not a promise that the template entry enumerates every gate required by every source, calculation, execution, or release scenario.

The compiler must union base gates with risk-derived supplements:

- source-backed visible summaries add `summary-map.json` and `validate-summary-map`;
- source-backed visible claims add `claim-map.json` and `validate-claim-map`;
- derived values add calculation code/tests/output, `data-provenance.json`, and provenance validation;
- untrusted code compiles to `zero_spawn`; review cannot authorize it, and only a new machine-verifiable trusted/restricted plan may execute;
- publication, sensitive, high-impact, or consequential-interaction facts add their human and runtime controls.

Do not bypass a registry base gate. Do not reject an otherwise compatible template only because the compiler must append a risk gate. Do not infer that passing the registry base gates completes the effective plan. Derived-data assets are conditional: a no-derived dashboard does not acquire provenance files merely because another Assured trigger is present.

## Selection Rule

Choose templates by reader job and evidence shape:

| Reader job | Template family |
| --- | --- |
| executive decision | deck, report, data hero, decision close |
| source-backed explanation | report, claim-evidence slide, system map |
| operational monitoring | dashboard, KPI strip, trend/driver/detail |
| visual persuasion | deck with image hero, statement, contrast, close |
| one-message visual | poster with type-led hook, image hero, or data hero |
| process or architecture | system map, lifecycle pipeline, Mermaid-derived diagram |
| UI evidence | screenshot board, before/after, image grid |

## Borrowed Patterns

### Guizang PPT

Use as semantic layout and rhythm discipline. The standalone local source is AGPL-3.0, so direct code copying is not the default path:

- style choice before slide work;
- one style system per deck;
- registered layout skeletons;
- Swiss grid, large type contrast, image slots, motion recipes;
- image hero and evidence grids;
- static fallback for motion;
- deck rhythm planning before implementation.

Adapt these ideas into Design-owned components unless an explicit AGPL distribution decision authorizes direct adoption. Do not copy `template*.html` or `motion.min.js` under an assumed permissive license.

### Open Design

Use as the primary production-template source where file-level licenses permit:

- design-system tokens;
- typed artifact contracts;
- component and template registry;
- tweakable artifacts when iteration matters;
- validation gates and quality reports;
- reusable design-system thinking separated from generated artifacts.

The local Open Design `html-ppt` package is MIT and supplies actual reusable assets: tokenized base CSS, runtime, themes, 31 single-page layouts, full-deck templates, animations, presenter behavior, and render scripts. Adopt selected assets with notices and dependency review instead of rebuilding a thin deck seed.

See `references/template-adoption-plan.md` for exact source paths, adoption waves, license gates, and visual acceptance criteria.

## Template Decision Record

For each artifact, record:

- selected template id;
- source repository, path, commit, and license;
- adoption action and implementation status;
- rejected templates and why;
- style preset;
- required images/diagrams/icons;
- known limitations;
- validation commands.

This can live in `quality-report.md`, `slide-plan.json`, or `agent-handoffs/designer.json`.

## Fixtures And Showcases

`examples/` is the compatibility fixture root. Passing fixtures demonstrate that a contract can pass; `invalid-*` fixtures demonstrate that a defect is detected. Neither status proves production design quality.

`showcases/registry.json` is the curated production-case index. A showcase must include a content-specific brief, considered and rejected directions, Taste Contract, final surface evidence, assurance attained, non-claims, and retrospective limits. Eligibility is fail closed: `artifact_ref`, every source, every surface capture, and review evidence must be safe existing paths with matching SHA-256 bindings; the artifact and review bind the current artifact/surface digests; review time must not predate any capture; assurance and review states use the published enums. Fixture-only records, missing artifacts, stale captures, digest drift, and arbitrary review strings are ineligible. Digest binding does not authenticate reviewer identity. Do not promote a fixture merely because validators pass.

## Maintenance Rules

- Keep templates dependency-light and self-contained.
- Avoid hidden external runtime assumptions.
- Do not introduce arbitrary hex colors when a preset is active.
- New templates need at least one passing example or a documented manual validation case.
- A passing fixture is not a showcase. Link `showcase_refs` only after Product and Design reviews real surface evidence and records the case in `showcases/registry.json`.
- Adopted/adapted templates need a provenance record, retained notices, dependency inventory, anti-copy review, source-backed fixture, desktop/narrow screenshots, and Product and Design approval.
- A production builder must bind to registered template and component ids; it may not bypass the registry and silently write a shallow replacement.
- New poster templates need `poster-plan.json`, a passing poster fixture, and an anti-AI-slop negative fixture.
- If a template includes motion, it must include reduced-motion or static fallback.
