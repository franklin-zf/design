# Template Index

`assets/templates/registry.json` is the only template inventory and the authoritative source for template ids, artifact compatibility, reader-job fit, avoidance conditions, production status, template-required assets, base validation gates, and showcase links. Its gate list is not the complete risk plan: the compiler adds mandatory source, derived-data, execution, human-review, and release supplements from explicit facts.

Do not copy its entries into prose. Query the registry directly:

```bash
jq '.templates[] | {id, artifact_types, best_for, avoid_when, production_status, showcase_refs}' assets/templates/registry.json
```

Use `references/template-library.md` for the selection method and `references/template-adoption-plan.md` for provenance/adoption discipline. Curated production cases are indexed separately in `showcases/registry.json`; `examples/` are compatibility and validator fixtures, not a production showcase catalog.

For a generated artifact, record the selected registry `template_id`, reader-job rationale, rejected template ids, required media, registry base gates, compiler-added risk gates, and any adaptation in `manifest.json`, `quality-report.md`, `slide-plan.json`, or `agent-handoffs/designer.json` as appropriate. Base-gate success alone cannot establish delivery assurance.

If a user supplies a brand template, reference deck, Figma file, screenshot, or external template, treat it as source material. Record what was adopted, adapted, ignored, and why; do not add it to the registry until provenance, license, implementation, and validation evidence are complete.
