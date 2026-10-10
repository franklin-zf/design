# Optional Design Knowledge

The active registry contains standards and evaluation policy only. It endorses no
historical case, spec record, or primitive. Generation must work without history.

Historical retrieval requires a user-selected reference and an explicit
`--knowledge-root` argument. Environment variables do not enable retrieval.
Candidate records are inspection-only, not approved templates.

The canonical rules ship in `references/design-standards.md`. Raw projects and old
outputs belong outside the skill. Regression records under `tests/fixtures/history/`
exist only to test validators and must never be used as generation context.
