# 04 Schema 契约、测试套件与夹具

## 一、JSON Schema 契约

Schema 是各阶段产物的结构化合同，由 `validate-schemas.mjs` 校验自身有效性。

| 域 | Schema |
| --- | --- |
| 产物与清单 | `artifact-manifest`、`machine-attestation`、`privacy-checks`、`accessibility-checks` |
| Intake 与方向 | `intake-direction`、`direction-comparison`、`inspiration-binding`、`approval-rejection` |
| 内容事实链 | `content-ledger`、`content-handoff`、`surface-claims`、`claim-map`、`summary-map`、`data-provenance`、`source-extraction`、`source-extraction-capability` |
| 需求与评审 | `requirement-verification`、`design-evaluation-record`、`design-evaluation-policy`、`reviewer-record`、`reviewer-attestation`、`reviewer-registry`、`evidence-contract` |
| 设计 profile/配方 | `design-brief`、`design-profile`、`visual-recipe-registry`、`design-profile-catalogue`、`design-primitives`、`design-spec-record`、`design-case-record`、`style-presets` |
| 视觉资产与美学 | `aesthetic-contract`、`color-contract`、`visual-asset`、`chart-spec`、`layout-registry` |
| Deck/Poster | `deck-plan`、`poster-plan` |
| 执行与渲染 | `execution-plan`、`render-spec`、`browser-test-evidence` |
| 组件与案例 | `component-catalogue`、`showcase-case`、`reference-registry` |

## 二、测试套件

动态数量以 capability manifest 为准。运行：
`npm run test:static`、`npm run test:browser`、`npm run test:strict`。

| 域 | 套件 |
| --- | --- |
| 基础工程 | `code-style`、`json-schema`、`validators`、`install-parity`、`migration` |
| 知识库/规格 | `design-knowledge-query`、`design-spec-record`、`distill-spec`、`extract-primitives`、`production-copy` |
| Profile/计划/执行 | `design-profile`、`execution-plan`、`execution-runner`、`production-design-systems`、`color-system` |
| 内容事实链 | `content-ledger`、`content-chain`、`content-handoff`、`source-extraction`、`evidence-contract`、`browser-test-evidence`、`requirement-verification`、`inspiration-binding`、`direction-evidence`、`visual-encoding`、`design-evaluation` |
| 视觉评审 | `visual-review`、`keyframe-capture`、`component-pilots`、`component-usage`、`component-catalogue`、`showcase-registry` |
| 打包 | `packed-references` |
| 能力中枢 | Dribbble CLI/MCP/lifecycle、`validate-ui-hierarchy`、IconHub MCP、Component Hub |
| 浏览器（strict） | `playwright-runtime`、`render-spec-browser`、`component-pilots-browser`、`human-factors-browser` |

`tests/fixtures/`：`execution-request.mjs` 与 `history/`（内容完整性历史夹具）。

## 三、Example 夹具（examples/，65 个：21 正向 + 44 负向）

夹具即活文档：`design.mjs test` 对全部正向夹具跑 `checkArtifact`，对负向夹具用 `expect-fail.mjs` 断言必须报出指定错误。

### 3.1 正向夹具（21）

| 类别 | 夹具 |
| --- | --- |
| 核心产物 | `data-report-pass`、`dashboard-pass`、`chart-frame-pass`、`deck-pass`、`poster-pass`、`screenshot-evidence-pass`、`tweakable-artifact-pass`、`design-system-pass`、`ppt-handoff-pass` |
| Deck/Swiss | `swiss-deck-pass`、`swiss-evidence-deck-production-pass`、`component-deck-pilot-pass` |
| 运营/组件试点 | `component-operational-pilot-pass` |
| 内容链 | `content-chain-pass`、`content-handoff-pass`、`source-extraction-pass` |
| Intake | `intake-direction-pass`、`intake-confirmed-pass`、`intake-selected-pass` |
| 评审/角色 | `role-handoff-pass`、`design-slimming-eval-pass` |

### 3.2 负向夹具（44，按失败原因分组）

| 失败面 | 夹具 |
| --- | --- |
| Intake 方向门禁 | `invalid-intake-direction-missing-scenario`、`invalid-intake-direction-known-drift`、`invalid-intake-direction-missing-known`、`invalid-intake-direction-multiple-recommended`、`invalid-intake-direction-option-count`、`invalid-intake-direction-unsupported-type`、`invalid-intake-selected-missing-trace`、`invalid-intake-poster-drift`、`invalid-intake-poster-incomplete` |
| 内容时态越界 | `invalid-content-historical-to-current`、`invalid-content-plan-to-verified-actual`、`invalid-content-question-to-precondition`、`invalid-content-requirement-to-gate`、`invalid-content-target-to-actual` |
| 摘要/主张映射 | `invalid-summary-jargon`、`invalid-summary-missing-map`、`invalid-summary-missing-preserved-number`、`invalid-summary-number-drift`、`invalid-summary-partial-map`、`invalid-summary-unmapped`、`invalid-claim-missing-evidence-quote`、`invalid-claim-quote-not-in-source` |
| 源提取安全 | `invalid-source-extraction-extracted-hash`、`invalid-source-extraction-forged-locator`、`invalid-source-extraction-missing-capability`、`invalid-source-extraction-original-hash`、`invalid-source-extraction-path-escape`、`invalid-source-extraction-tool-drift`、`invalid-missing-source` |
| 产物总契约 | `invalid-false-ready`、`invalid-missing-media-decision`、`invalid-style-preset-mismatch`、`invalid-chart-contract`、`invalid-empty-dashboard-chart` |
| Swiss/视觉 | `invalid-swiss-accent-overuse`、`invalid-swiss-bad-layout`、`invalid-swiss-fake-screenshot`、`invalid-swiss-rhythm`、`invalid-swiss-svg-text`、`invalid-bad-layout` |
| Poster | `invalid-poster-ai-slop`、`invalid-poster-missing-hook` |
| 布局应力（strict） | `invalid-horizontal-overflow`、`invalid-text-overlap` |

## 四、新增一条规则的标准动作

1. 在 `references/` 写明规则与正反例；2. 需要结构约束时新增/扩展 `schemas/`；3. 在 `validate-*.mjs` 实现确定性检查；4. 配 1 个 `examples/invalid-*` 负向夹具（必要时加正向）；5. 在 `tests/` 加断言并接入 `design.mjs test` 的编排；6. 跑 `node scripts/design.mjs validate` 与相关测试全绿。
