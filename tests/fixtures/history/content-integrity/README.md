# Product Management Platform Content Baseline

This is the first content-understanding fixture for Design Skill.

`source.txt` is a preserved text snapshot from an earlier artifact. The original
`.doc` was not present at its historical path during this run, so this fixture is
explicitly `snapshot_only` and is not evidence of a fresh source extraction.

`content-ledger.json` demonstrates the semantic layer required before visual design:

- source-grounded semantic units;
- fact, issue, target, plan, requirement, and question distinctions;
- protected numeric and date tokens;
- explicit relationships;
- partial coverage and unresolved questions;
- a non-promoted draft review state.

The fixture must not be promoted to `content_reviewed` until the original source is
available and an independent content reviewer confirms the complete ledger.
