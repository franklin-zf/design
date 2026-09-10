# Delivery Acceptance

## Summary

本文件定义 `design skill` 优化实施的最终验收方式。Slice 1 已完成本地状态上限、审批失效、Assured 边界和打包身份机制；Slice 2 已通过独立复核，完成六类产品预设、三体裁规则、七类内容拓扑、共享布局注册表、设计档案解析和安装包引用闭环。尚未重建 PPT/HTML/Poster、安装或发布，因此最终交付和真实安装一致性仍保持 `PENDING`。

Implementation contributors: codex-main, implementation-agent-019fe742-ecb1-7f40-a548-4424cf3b902b

Fixed Slice 1 implementation base: HEAD `55105c3`; the earlier dirty state was audited and committed as `9450d6e`, and the implementation plan was committed as `55105c3`. Each later slice must review only its explicit allowed paths.

## Success Gate

只有同时满足以下条件才可称为优化完成：

1. REQ-001 至 REQ-013 全部 `PASS`，且无未关闭的 blocking/major finding。
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
| REQ-001 | Source inventory, narrative selection and exact protected tokens | Slice 3 host extraction/content contracts; Slices 4–6 target surfaces | Real project `.doc` extraction evidence plus content-chain tests, native PPT slide-text and HTML/Poster visible text; exact checks for `约17人月`, `大于等于1000`, `大于等于100`, `小于等于300 ms` | PENDING |
| REQ-002 | Source-bound narrative and independent semantic review | Slice 3 summary/claim views and reviewer checks | Existing plus new meaning-drift, qualifier-loss and jargon negative fixtures | PENDING |
| REQ-003 | Existing code-backed provenance referenced by ledger | Slice 3 provenance execution | Trusted calculation fixture reproduces every derived value and label | PENDING |
| REQ-004 | Skill/install/artifact identity digests and host PPT capability evidence | Slices 1, 4 and 7 | `node --test tests/install-parity.test.mjs tests/ppt-studio.test.mjs`; installed-copy parity after packaging | PENDING |
| REQ-005 | One source/content chain, three artifact identities | Slices 3 and 7 | Product-management showcase manifests share run/source/content digests | PENDING |
| REQ-006 | Expiring local approvals and host-only final status | Slices 1 and 4–6 | User rejection, artifact mutation, screenshot mutation and content mutation fixtures all invalidate local approval; local `ready` fails | PENDING |
| REQ-007 | Three end-to-end format studios plus surface contracts | Slices 2 and 4–6 | Design-profile surface routes, host-adapter PPTX/render evidence, HTML route/responsive tests, Poster target-size tests | PENDING |
| REQ-008 | Content topology before visual language | Slices 2 and 4–6 | Deterministic topology route, content-swap falsification and Reviewer explanation for chosen focal composition | PENDING |
| REQ-009 | Mandatory Standard/Assured reference roles and two same-size directions | Slices 4–6 | Missing-reference, one-direction and license-boundary negative fixtures; side-by-side direction evidence | PENDING |
| REQ-010 | Semantic media and rights/fallback contract | Slices 4–6 | Unauthorized, decorative-only and missing-fallback fixtures fail; product signal present in showcases | PENDING |
| REQ-011 | Bound independent visual falsification | Slices 1 and 4–6 | Screenshot digests, Chinese typography, content specificity, full-deck contact sheet and three-second review records | PENDING |
| REQ-012 | Frozen baseline-backed efficiency reduction | Slice 7 | Independently approved fixed 9-task set; confirmed-intake to `candidate_ready` wall-clock median improves >=20%, effective steps do not increase >10%, and REQ-001–REQ-013 have no regression | PENDING |
| REQ-013 | Six controlled product presets, surface rules and topology routing | Slice 2 design-profile catalogue, resolver, CLI, plan binding and final-artifact layout checks | 18 deterministic routes; 126 automatic and 90 explicit inheritance combinations; bypass, digest-tamper, layout, split-brain and package-reference negative tests; independent architecture and QA review | PASS |

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
| 1 | `node --test tests/install-parity.test.mjs tests/evidence-contract.test.mjs tests/execution-plan.test.mjs tests/validators.test.mjs tests/showcase-registry.test.mjs`: 43 passed, 1 optional skip | `npm test`: 83 passed, 1 optional skip; `npm run test:strict`: browser and all target captures passed | `slice1-independent-qa-20260810`; final showcase bindings reviewed; implementation identities excluded; actual install switch remains RISK-001 in Slice 7 | PASS |
| 2 | `node --test tests/design-profile.test.mjs tests/packed-references.test.mjs tests/execution-plan.test.mjs tests/install-parity.test.mjs`: 23 passed | `npm test`: 101 passed, 1 optional skip; `node scripts/design.mjs validate`: passed; `npm run test:strict`: passed outside the macOS sandbox; `npm run pack:skill`: 127-file parity passed | Reviewer `01a01a89-a42d-7a93-a45b-a9afbb5076f2`; fifth review replayed Deck and Poster HTML-only split-brain attacks and found no open critical/major | PASS |
| 3 | `node --test tests/source-extraction.test.mjs tests/content-chain.test.mjs tests/validators.test.mjs` | `npm test` | Independent source-semantics review | PENDING |
| 4 | `node --test tests/ppt-studio.test.mjs` plus host adapter run | `npm test` | Independent PPT target-surface review | PENDING |
| 5 | `node --test tests/html-studio-browser.test.mjs` | `npm run test:strict` | Independent HTML direction and surface review | PENDING |
| 6 | `node --test tests/poster-studio-browser.test.mjs` | `npm run test:strict` | Independent three-second and content-swap review | PENDING |
| 7 | `node --test tests/efficiency-baseline.test.mjs tests/legacy-protocol-rejection.test.mjs` | `npm run test:strict` | Quality non-regression review | PENDING |

## Findings

| ID | Severity | Requirement ID | Problem | Evidence | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- |
| RISK-001 | major | REQ-004 | 当前工作区与已安装 Skill 的版本漂移仍存在；新校验器已稳定阻断，但尚未执行安装切换 | `node scripts/validate-install-parity.mjs /Users/zhangfeng/.codex/skills/design` returns nonzero with exact drift list | Slice 7 owner | open |
| RISK-002 | major | REQ-006, REQ-011 | 自报 `ready`、`smoke_passed` 误放行和未知 Assured profile 绕过 | Local status/evidence/profile negative tests plus independent review | Slice 1 owner | resolved |
| RISK-003 | major | REQ-007, REQ-011 | 当前包未声明 native PPTX/PDF capability | `capability-preflight.mjs` and HTML-only capture script | Slice 4 owner | open |
| RISK-004 | major | REQ-013 | 核心体裁可通过直接 compiler API 或 plan schema 绕过 design profile | Compiler unconditional profile gate, conditional plan schema and negative regression | Slice 2 owner | resolved |
| RISK-005 | major | REQ-008, REQ-013 | Topology layout 未贯通到最终渲染，plan/HTML split-brain 曾可由元数据掩盖 | Shared registries; Runner semantic replay; plan-bound output; Deck manifest/slide-plan/HTML per-page equality; Poster manifest/plan/HTML marker equality; unknown, registered-incompatible, split-brain and digest-refresh negative regressions | Slice 2 owner | resolved |

## Scope Audit

- Declared allowed paths for Slice 1: the Slice 1 row in [engineering.md](/Users/zhangfeng/Downloads/workspace/design/docs/exp/engineering.md), plus this acceptance record.
- Actual changed paths for Slice 1: status/evidence/identity schemas and validators, focused tests, affected positive quality reports, and independently rebound production showcase records.
- Declared allowed paths for Slice 2: the Slice 2 row in [engineering.md](/Users/zhangfeng/Downloads/workspace/design/docs/exp/engineering.md), plus this acceptance record.
- Actual changed paths for Slice 2: core Skill/library guidance; design-profile catalogue and schemas; resolver, catalogue/package validators, CLI and execution-plan binding; focused tests; package inclusion; four Exp documents.
- Pre-existing repository changes: none at Slice 1 base `55105c3`.
- Out-of-scope changes: none
- Generated clutter: none
- Obsolete or compatibility code: old protocol removal remains planned in Slice 7; Slice 1 introduced no compatibility path.

## Verification

- Delivery validator: the plan must pass `validate_delivery.py --phase engineering`; full acceptance is expected to fail until all implementation rows are real `PASS` and the final Reviewer approves.
- Repository checks for Slice 1: focused Node tests, `npm test`, `npm run test:strict`, schema/style/skill validators, package extraction parity, installed-copy negative check, screenshot pre/post hashes and changed-path audit.
- Repository checks for Slice 2: 23 focused tests, 101 passing standard tests plus 1 optional installed-copy skip, repository validators, strict browser regression, 23 packaged-reference checks and 127-file package parity.
- Fixed review base: `55105c3`; Slice 1 package identity was `cecddded5adf550866a45822ad61916e50308b370d5cd049f2de82dcfa818741` over 112 shipped files. Current Slice 2 package identity is `d76b6a0ce03c63e2cba1e1b8539ed03097db0f67d160f82514921a3a67a8c4f7` over 127 shipped files.
- Specification-fidelity review: independent QA must compare all four documents with the root-cause report and REQ-001–REQ-013.
- Standards/code-health review: planned for each implementation slice and final `npm run test:strict`.
- Rendered UI review: strict Playwright browser suite passed; three rewritten component-deck baselines were detected by hash audit and restored, after which all tracked PNG hashes matched the pre-test snapshot.
- Unverified surfaces: regenerated product-management PPT/HTML/Poster, host adapter trust, target-player PPT rendering, actual installed-copy parity, host user-confirmation state and efficiency improvement.

### Frozen Benchmark Inputs

- Product-management extracted text SHA-256: `07db558a23b31ae96ba21ababe65cf3ac196600a7a8e0ffb8887fe8ae6563817`; original `.doc` must be restored and independently re-extracted before Slice 3 can pass.
- Numeric CSV SHA-256: `3050fec36df64b9da9d56b08896bb2b146897d1b6aef3593022e830302afc4fb`.
- Dense brief SHA-256: `56ecd25c40b444bf026c73ad52e4244372a9710810d2cc613921cb54f8ab6f0d`.
- Each input is run as PPT, HTML and Poster. An independent Reviewer approves `tasks.json` before the first measurement; no post-result substitution is allowed.
- Each old/new pair freezes the same Reviewer identity and tool/model version before execution. Active review timing starts when the complete evidence set is opened and stops at the submitted decision; queue, scheduler and user-wait time is reported separately.

## QA Decision

Decision: Slices 1-2 passed; pending Slices 3-7 and final delivery review

Reviewer: final-review-pending; Slice 1 reviewer `slice1-independent-qa-20260810`; Slice 2 reviewer `01a01a89-a42d-7a93-a45b-a9afbb5076f2`

Plan QA: `PASS_FOR_IMPLEMENTATION` by independent Reviewer `019fe706-58b6-73a1-85aa-8cc5113b8484`; this does not satisfy final delivery acceptance.

Slice 1 QA: local `ready` is rejected; `candidate_ready` binds independent content/artifact/surface/machine evidence; later user/host rejection invalidates unchanged bytes; package mutation/deletion/addition and actual install drift fail closed.

Slice 2 QA: compiler, schema, Runner and public check require a reproducible design profile for core surfaces; shared registries bind topology to template layouts; Deck and Poster reject unknown, registered-incompatible, digest-refreshed and plan/HTML split-brain layouts. This is contract approval, not final visual approval.

Remaining risks: actual installed-copy parity, native PPT capability, brand rules, primary PPT player, media/font licensing and the 20% efficiency baseline remain unresolved in their planned slices.
