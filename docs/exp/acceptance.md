# Delivery Acceptance

## Summary

本文件定义 `design skill` 优化实施的最终验收方式。当前交付仅包含需求、方案、工程计划和验收计划；未修改 Skill 实现、未重建 PPT/HTML/Poster、未安装或发布，因此所有实现 QA 结果保持 `PENDING`。

Implementation contributors: none; plan-only delivery

Fixed planning base: HEAD `f74611a4ceceaf8eac52e5b507fe443b45eb44ce`; pre-existing dirty paths and digests are frozen in [workspace-baseline.md](/Users/zhangfeng/Downloads/workspace/design/docs/exp/workspace-baseline.md). Each implementation slice must recheck that baseline and review only its explicit allowed paths.

## Success Gate

只有同时满足以下条件才可称为优化完成：

1. REQ-001 至 REQ-012 全部 `PASS`，且无未关闭的 blocking/major finding。
2. PPT、HTML、Poster 分别通过真实目标表面验收，不以 HTML handoff 代替 PPTX，不以单帧代替整套 contact sheet。
3. 每种体裁至少一个《2025年产品管理平台项目建议书》真实生产 showcase 通过独立 Reviewer 反证。
4. 六个生产拓扑模板分别有非空 showcase、方向比较、目标表面证据和独立 Reviewer 结果。
5. 本地 Skill 和产物最高状态为 `candidate_ready`；最终 `ready` 只存在于宿主任务的用户确认状态，不回写 artifact root。
6. 工作区、测试包、安装 Skill 与产物中的 skill identity 一致。
7. `npm run test:strict`、Exp delivery validator 和 scope audit 均通过。
8. 用户可查看三种最终产物并对视觉结果作出确认；未确认时不得声称“美观符合预期”。

## Traceability Matrix

| Requirement ID | Solution Decision | Implementation | Test Evidence | QA Result |
| --- | --- | --- | --- | --- |
| REQ-001 | Source inventory, narrative selection and exact protected tokens | Slice 2 host extraction/content contracts; Slices 3–5 target surfaces | Real project `.doc` extraction evidence plus content-chain tests, native PPT slide-text and HTML/Poster visible text; exact checks for `约17人月`, `大于等于1000`, `大于等于100`, `小于等于300 ms` | PENDING |
| REQ-002 | Source-bound narrative and independent semantic review | Slice 2 summary/claim views and reviewer checks | Existing plus new meaning-drift, qualifier-loss and jargon negative fixtures | PENDING |
| REQ-003 | Existing code-backed provenance referenced by ledger | Slice 2 provenance execution | Trusted calculation fixture reproduces every derived value and label | PENDING |
| REQ-004 | Skill/install/artifact identity digests and host PPT capability evidence | Slices 1, 3 and 6 | `node --test tests/install-parity.test.mjs tests/ppt-studio.test.mjs`; installed-copy parity after packaging | PENDING |
| REQ-005 | One source/content chain, three artifact identities | Slices 2 and 6 | Product-management showcase manifests share run/source/content digests | PENDING |
| REQ-006 | Expiring local approvals and host-only final status | Slices 1 and 3–5 | User rejection, artifact mutation, screenshot mutation and content mutation fixtures all invalidate local approval; local `ready` fails | PENDING |
| REQ-007 | Three end-to-end format studios | Slices 3–5 | Host-adapter PPTX/render evidence, HTML route/responsive tests, Poster target-size tests | PENDING |
| REQ-008 | Content topology before visual language | Slices 3–5 | Content-swap falsification and Reviewer explanation for chosen focal composition | PENDING |
| REQ-009 | Mandatory Standard/Assured reference roles and two same-size directions | Slices 3–5 | Missing-reference, one-direction and license-boundary negative fixtures; side-by-side direction evidence | PENDING |
| REQ-010 | Semantic media and rights/fallback contract | Slices 3–5 | Unauthorized, decorative-only and missing-fallback fixtures fail; product signal present in showcases | PENDING |
| REQ-011 | Bound independent visual falsification | Slices 1 and 3–5 | Screenshot digests, Chinese typography, content specificity, full-deck contact sheet and three-second review records | PENDING |
| REQ-012 | Frozen baseline-backed efficiency reduction | Slice 6 | Independently approved fixed 9-task set; confirmed-intake to `candidate_ready` wall-clock median improves >=20%, effective steps do not increase >10%, and REQ-001–REQ-011 have no regression | PENDING |

## Format Acceptance

### PPT

- Host presentation adapter capability is verified before generation; without it, PPT delivery is blocked and `ppt-handoff` is labeled as a separate option.
- Native `.pptx` exists, remains editable and is rendered by the declared target player/renderer recorded in host evidence.
- Host evidence includes PPTX hash, per-slide extracted text, renderer/tool identity, per-slide image hashes and contact-sheet hash; browser-only capture cannot satisfy this gate.
- Slide count matches `slide-plan.json`; every slide has a screenshot and the contact sheet contains every slide exactly once.
- Full-deck review checks focal hierarchy, page rhythm, silhouette repetition, Chinese typography, projection readability and source tokens.
- First three pages include a meaningful product object, UI, system relation or explicitly labeled content-specific schematic.
- HTML handoff quality cannot substitute for PPTX target-surface quality.

### HTML

- Every `#/n` route can be opened directly, refreshed and shared without losing page state.
- Keyboard navigation, visible focus, mobile/small-phone layouts, static fallback and reduced-motion work.
- Motion explains state, order, causality or flow; removal of motion does not remove meaning.
- Desktop and mobile screenshots bind to the review digest, with no text overlap, clipping or semantic token loss.

### Poster

- One dominant claim is identifiable in an independent three-second test; the Reviewer records the single recalled claim.
- Original-size and 25% previews remain legible, with one visual entry point and subordinate evidence.
- Poster does not compress a report into one page; content that cannot be reduced without meaning drift is blocked or routed to another format.
- Source, qualifier and derived labels remain readable at target output size.

## Slice Results

| Slice | Focused Tests | Regression Tests | Independent Reviewer | Result |
| --- | --- | --- | --- | --- |
| 1 | `node --test tests/install-parity.test.mjs tests/evidence-contract.test.mjs` | `npm run validate` | Must differ from artifact author | PENDING |
| 2 | `node --test tests/source-extraction.test.mjs tests/content-chain.test.mjs tests/validators.test.mjs` | `npm test` | Independent source-semantics review | PENDING |
| 3 | `node --test tests/ppt-studio.test.mjs` plus host adapter run | `npm test` | Independent PPT target-surface review | PENDING |
| 4 | `node --test tests/html-studio-browser.test.mjs` | `npm run test:strict` | Independent HTML direction and surface review | PENDING |
| 5 | `node --test tests/poster-studio-browser.test.mjs` | `npm run test:strict` | Independent three-second and content-swap review | PENDING |
| 6 | `node --test tests/efficiency-baseline.test.mjs tests/legacy-protocol-rejection.test.mjs` | `npm run test:strict` | Quality non-regression review | PENDING |

## Findings

| ID | Severity | Requirement ID | Problem | Evidence | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- |
| RISK-001 | major | REQ-004 | 当前工作区与已安装 Skill 的版本漂移仍存在 | Root-cause report and current repository state | Slice 1 owner | open |
| RISK-002 | major | REQ-006, REQ-011 | 当前自报 `ready` 与 `smoke_passed` 误放行路径尚未删除 | Existing validators and root-cause report | Slice 1 owner | open |
| RISK-003 | major | REQ-007, REQ-011 | 当前包未声明 native PPTX/PDF capability | `capability-preflight.mjs` and HTML-only capture script | Slice 3 owner | open |

## Scope Audit

- Declared allowed paths for this planning turn: `docs/exp/requirements.md`, `docs/exp/solution.md`, `docs/exp/engineering.md`, `docs/exp/acceptance.md`, `docs/exp/workspace-baseline.md`, and the single Shadcn license-evidence row in `/Users/zhangfeng/Downloads/workspace/design-reference-study-2026-08-09/REFERENCE_INVENTORY.md`.
- Actual changed paths for this planning turn: the five planning files plus that evidence-row correction; all other `design` dirty paths match the frozen pre-existing baseline.
- Pre-existing repository changes: present; excluded from this review and must remain untouched.
- Out-of-scope changes: none
- Generated clutter: none
- Obsolete or compatibility code: not introduced in this planning turn; old protocol removal is planned in Slice 6 with no import path.

## Verification

- Delivery validator: the plan must pass `validate_delivery.py --phase engineering`; full acceptance is expected to fail until all implementation rows are real `PASS` and the final Reviewer approves.
- Repository checks for this planning turn: Markdown structure, requirement ID coverage, internal path existence and changed-path audit.
- Fixed review base: `f74611a4ceceaf8eac52e5b507fe443b45eb44ce` plus normalized dirty snapshot `25a46eab280621e9b272da837a96abb87d93cb3598e95c2082134efcdfbff9b2`; refresh only by explicit approval.
- Specification-fidelity review: independent QA must compare all four documents with the root-cause report and REQ-001–REQ-012.
- Standards/code-health review: planned for each implementation slice and final `npm run test:strict`.
- Rendered UI review when relevant: mandatory in Slice 5; not performed in this planning turn.
- Unverified surfaces: all code changes, regenerated PPT/HTML/Poster, host adapter trust, target-player PPT rendering, installed-copy parity, host user-confirmation state and efficiency improvement.

### Frozen Benchmark Inputs

- Product-management extracted text SHA-256: `07db558a23b31ae96ba21ababe65cf3ac196600a7a8e0ffb8887fe8ae6563817`; original `.doc` must be restored and independently re-extracted before Slice 2 can pass.
- Numeric CSV SHA-256: `3050fec36df64b9da9d56b08896bb2b146897d1b6aef3593022e830302afc4fb`.
- Dense brief SHA-256: `56ecd25c40b444bf026c73ad52e4244372a9710810d2cc613921cb54f8ab6f0d`.
- Each input is run as PPT, HTML and Poster. An independent Reviewer approves `tasks.json` before the first measurement; no post-result substitution is allowed.
- Each old/new pair freezes the same Reviewer identity and tool/model version before execution. Active review timing starts when the complete evidence set is opened and stops at the submitted decision; queue, scheduler and user-wait time is reported separately.

## QA Decision

Decision: pending implementation and final delivery review

Reviewer: pending

Plan QA: `PASS_FOR_IMPLEMENTATION` by independent Reviewer `019fe706-58b6-73a1-85aa-8cc5113b8484`; this does not satisfy final delivery acceptance.

Remaining minor risks: brand rules, primary PPT player, media/font licensing and the 20% efficiency baseline must be resolved or measured at implementation intake.
