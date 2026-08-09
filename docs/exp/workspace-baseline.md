# Workspace Baseline

Captured: 2026-08-09, before implementation

- Branch state: `main...origin/main [ahead 1]`
- HEAD: `f74611a4ceceaf8eac52e5b507fe443b45eb44ce`
- Scope: pre-existing dirty paths outside `docs/exp/`
- Normalized snapshot SHA-256: `25a46eab280621e9b272da837a96abb87d93cb3598e95c2082134efcdfbff9b2`
- Normalization: one tab-separated row per `git status --porcelain=v1` entry containing status, current SHA-256 or `DELETED`, and path, sorted in Git status order.

```text
 M  064a696818151752b2be21035a30e967f7acfdbbe6087a8fb79e09a763c6761f  SKILL.md
 M  8fba4826015c32abcf60dfff15718c58ee9cfc098ab01c8f3cc4ed8f813d20db  agents/openai.yaml
 M  7c69f937519dd24a2c07d659cb241168e4da352ab6db06ce2ce3dc12d487256d  assets/components/registry.json
 M  ea99e178e578c6f9e4329d4d8d05cb249b17d0e01d8bb79d341b042be184e309  assets/templates/registry.json
 M  776db523a87129ea18d4beee8ef0854b3056161262b2d8f13064b87078551f05  design-systems/swiss-deck/DESIGN.md
 M  5559d4b4f8f09a0ad49b30eb52fac7d9d9e16ee9e7ee953e00ef2c2844f46b0d  examples/role-handoff-pass/manifest.json
 M  c7f1c376450af38c39e14083c5fb29cafcc15bcea575542db01a0401e2cbd338  package-lock.json
 M  db1638faa3ba36d8de6d2abe9cb85ac9f8a592e43e677a3e608e79fea0dab244  package.json
 D  DELETED  references/aesthetic-principles.md
 D  DELETED  references/anti-ai-slop.md
 D  DELETED  references/assurance-ladder.md
 D  DELETED  references/capability-map.md
 D  DELETED  references/checklist.md
 D  DELETED  references/component-library.md
 D  DELETED  references/content-summary.md
 D  DELETED  references/data-integrity-and-calculation.md
 D  DELETED  references/data-visualization.md
 M  4ea84bd21e1fec165c66c38113e41809eed41442c70d1abfb529857aee334c31  references/deck-ppt.md
 D  DELETED  references/design-system.md
 D  DELETED  references/image-design.md
 D  DELETED  references/input-contract.md
 D  DELETED  references/intake-direction-gate.md
 D  DELETED  references/motion-policy.md
 D  DELETED  references/multi-agent-protocol.md
 D  DELETED  references/output-contract.md
 D  DELETED  references/risk-profiles.md
 D  DELETED  references/role-architecture.md
 D  DELETED  references/screenshot-ui-evidence.md
 D  DELETED  references/shape-selection.md
 D  DELETED  references/source-and-claims-policy.md
 D  DELETED  references/style-presets.md
 D  DELETED  references/swiss-layout-lock.md
 D  DELETED  references/taste-loop.md
 D  DELETED  references/template-adoption-plan.md
 D  DELETED  references/template-index.md
 D  DELETED  references/template-library.md
 D  DELETED  references/validation.md
 M  9af4bb75595a4a603493546749cc2363325c19cbe79990bf775f776e0ff5b64b  references/workflow.md
 M  c9f5cf18b82671dc2c731f8fcbba4849987ab80b09341022d703b2e8421f5ad9  scripts/validate-code-style.mjs
 M  bdcb28d663306db3286ab41cebede88b0b21594ba93851e1a54810d1d8a79094  scripts/validate-design-skill.mjs
??  b6544a3f9f851027d636d7daaa891c981164b2cc9d8d3b40bde877b6d5cadc28  references/advanced-assurance.md
??  5094548a0631cdd4ea34f9df410c68cc0c82a2b8c35938f250a3b6c90145af91  references/library.md
??  10dbadfd91689c3be2db2ed36bb612a6825f1362e3b1be64907ee49630c3cb9a  references/media-design.md
??  50d07108434e9007a80dac2d9032f91a6f4c51ed00dc5e90d1093241f1f49314  references/philosophy.md
??  70fe520e724d2853e488293f4beb543ba8978a52dab6919d8f0ca667cd5f761c  references/quality-bar.md
??  615173c49266ebc43d6ceb1e7749fe5a9f13c149d58d677fe79fbb7c56615861  references/source-integrity.md
??  225e61d5612a1ac0f6ea6f175f41aaf10cf69cc147e77827624b7e72e355edf8  references/tool-routing.md
??  64d034d6e0cf987557ebadac27f3b89b1b79315959e01129b1ac9707e4246a1e  scripts/design.mjs
```

Any change outside the current slice's declared allowed paths blocks staging until a fresh baseline is explicitly approved. Changes inside allowed paths are expected implementation diffs and must be reviewed against this baseline.
