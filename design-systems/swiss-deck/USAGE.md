# Swiss Deck Usage

## Required Contract

Deck artifacts using this system should include:

- `manifest.design_system.id: "swiss-deck"`
- `manifest.aesthetic_contract.layout_lock: "swiss-s01-s22"`
- `slide-plan.slides[].visual_weight`
- `slide-plan.slides[].slot_contract` when `media_decision` is not `none`
- `manifest.visual_assets[].provenance`
- `manifest.visual_assets[].text_policy`

## Quality Gate

Do not mark a Swiss deck as high quality until:

- `validate-aesthetic-contract.mjs` passes;
- `validate-asset-contract.mjs` passes;
- `validate-layout-lock.mjs` passes;
- `validate-visual-rhythm.mjs` passes;
- browser or manual visual QA evidence exists.
