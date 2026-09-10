# Engineering Design

Status: implementation in progress; Slices 1 and 2 passed; Slice 3 remains pending

## Current Repository Findings

- Project structure: 本地文件与 Node.js ESM CLI 驱动的 Skill；入口为 `SKILL.md` 和 `scripts/design.mjs`，契约在 `schemas/`，验证器在 `scripts/`，模板和设计系统在 `assets/` 与 `design-systems/`，正负例在 `examples/` 与 `tests/`。
- Existing similar modules: `summary-map`、`claim-map`、`data-provenance` 已覆盖来源、结论和代码计算；`evidence-contract`、`reviewer-record` 已有哈希绑定和独立 Reviewer 基础；Playwright、render smoke 和 deck capture 已有 HTML 目标表面基础。
- Build and test commands: `npm run validate`、`npm test`、`npm run test:strict`；单产物入口为 `node scripts/design.mjs check <artifact-dir> --profile=<lane>`。
- Public interfaces and constraints: 保留 command-first CLI；Standard 必须成为可信默认链路；Assured 只增加证据与身份强度，不能替代 Standard 正确性。
- Confirmed capability gap: `capability-preflight.mjs` 将 `native_pptx` 和 `pdf_export` 标记为 `not_claimed`，`capture-deck-slides.mjs` 只接受 HTML。当前仓库没有已验证的原生 PPTX 生成或 PowerPoint/LibreOffice 渲染能力。
- Resolved Slice 1 gap: 本地 `ready` 和 smoke-only candidate 已被拒绝，审批绑定 artifact/content/surface/machine evidence；真实安装副本仍与工作区漂移并由 parity gate 阻断。
- Passed Slice 2 implementation: 六类产品预设、三体裁规则、七类内容拓扑和 `design-profile` 已落盘；全部 18 条路由进入候选选择或明确 `unsupported`；核心体裁在 compiler、plan schema、runner 和 public artifact check 边界必须绑定 profile；模板拓扑通过共享 layout registry 与 digest-valid execution plan 约束到最终 Deck/Poster 布局。第五轮独立复核重放 split-brain 反例后判定 `PASS`。
- Workspace constraint: 当前分支工作区在本切片开始时干净并与 `origin/main` 对齐；实施时禁止覆盖或混入后续出现的未审查变化。

## Existing Dependency Review

| Need | Existing Dependency Or Standard Library Checked | Capability | Decision |
| --- | --- | --- | --- |
| Browser rendering and screenshots | Existing `playwright` | 多视口、路由、键盘、reduced-motion、截图 | Reuse |
| Digests and file identity | Node.js `crypto`, `fs`, `path` | SHA-256、文件枚举、路径边界 | Reuse |
| Schema validation | Existing schema loader and `validate-schemas.mjs` | 当前 JSON Schema 子集和 fixtures | Extend; do not add a second validator stack |
| Derived calculations | Existing `data-provenance` contract and validator | 程序、输入、公式、输出、执行证据 | Reuse |
| HTML deck runtime | Existing vendored Open Design `html-ppt` and local runtime | 页面切换与本地静态输出 | Reuse and harden; do not add Reveal.js by default |
| Native PPTX | Current package and capability preflight | `not_claimed`; no native renderer | Add a host-provided presentation adapter contract; fail closed when absent |
| UI frameworks | React/Next/Tailwind/Slidev reviewed | 组件和主题生态 | Do not add; use as design references only |

## Architecture

### Dependency Direction

```text
Original source + extraction evidence
  -> Content ledger
  -> Summary / Claim views
  -> Design profile resolver
  -> Narrative selection + direction record
  -> One format studio
  -> Target-surface captures
  -> Independent review
  -> local candidate_ready
  -> host-owned user confirmation state
```

- `content-ledger.json` 是跨体裁唯一事实源；summary、claim、chart 和大字数字只能引用它。
- Format Studios 只能消费 ledger 与已选视觉方向，不能直接重新解释源文档。
- Design profile resolver 只消费已确认的 reader job、内容关系和目标体裁；主预设控制主题与视觉规则，最多一个辅助预设且只能贡献拓扑和体裁强调。
- Reviewer 只消费最终 artifact、content 和 target-surface digests，不能修改产物。
- 本地 artifact contract 不包含 `ready`。宿主可在任务层记录用户确认，但该事件不写入 artifact root，也不由本地 CLI 验证。
- 任一 source、content、artifact 或 surface digest 变化，本地审批解析为 `stale_approval` 并退回 review。

### Stable Interfaces

1. `design plan`: intake -> execution plan，包含 skill identity、source set、目标体裁和 review lane。
2. `design profile`: design brief + artifact type -> digest-bound `design-profile/v1`，包含主预设、有限辅助预设、拓扑、体裁规则和已解析主题。
3. `design check`: artifact root -> 结构、真值链、体裁和本地审批状态；任何本地 `ready` 字段直接失败。
4. `design render/capture`: HTML/Poster target surface -> screenshots、route/capture metadata 和 digests。
5. Host source-extraction adapter: original file -> UTF-8 text、paragraph map、tool/version evidence and digests。Adapter 缺失或不支持格式时保持 `blocked`。
6. Host presentation adapter: `ppt-plan + content-ledger + media refs` -> native `.pptx`、slide-text report、渲染图片、contact sheet 和 host-controlled capability/evidence record。
7. `design test`: repository contract tests；`--strict` 增加浏览器和可用的真实目标表面验证。

所有失败返回非零退出码和可操作错误；缺少能力或证据按 fail-closed 处理，不填充 `pass`、`ready`、零值遥测或推测状态。

## Contract Changes

| Contract | Change | Reason |
| --- | --- | --- |
| `schemas/data-provenance.schema.json` | Reuse | 已能承载代码、输入、公式、测试和衍生输出证据。 |
| `schemas/design-brief.schema.json` | Add | 约束 reader job、主关系、辅助关系、品牌上下文和受控 override。 |
| `schemas/design-profile-catalogue.schema.json` | Add | 约束六类产品预设、三体裁规则、七类内容拓扑及路由映射。 |
| `schemas/design-profile.schema.json` | Add | 绑定 catalogue/theme digest、主预设、有限辅助继承、体裁和拓扑解析结果。 |
| `schemas/source-extraction-capability.schema.json` | Add | 描述宿主抽取 adapter 支持的格式、工具身份和版本。 |
| `schemas/source-extraction.schema.json` | Add | 绑定原始文件 hash、抽取工具/版本、抽取文本 hash、段落 map 和 host capability evidence。 |
| `schemas/content-ledger.schema.json` | Add | 表达 source inventory、narrative selection、protected token 和跨体裁内容身份。 |
| `schemas/summary-map.schema.json` | Upgrade to v2 with `content_refs`, `display_token_refs` | 总结保留人读映射，但不维护独立数字真值。 |
| `schemas/claim-map.schema.json` | Upgrade to v2; claims reference ledger entries | Claim 不再复制数字和限定词。 |
| `schemas/artifact-manifest.schema.json` | Upgrade to v2 with run/content/source/skill digests; remove local `ready` | 证明三体裁和真实调用版本一致。 |
| `schemas/evidence-contract.schema.json` | Upgrade to v3 with `candidate_ready` and content/skill/artifact/surface digests | 把自动候选与宿主用户状态分离。 |
| `schemas/reviewer-record.schema.json` | Upgrade to v3 with content-specificity, Chinese typography, reference comparison and format checks | Reviewer 必须主动反证。 |
| `schemas/visual-asset.schema.json` | Upgrade to v2 with semantic job, owner, source, license, allowed use and static fallback | 统一媒体语义和授权；不新增 media registry。 |
| `schemas/execution-plan.schema.json` | Upgrade to v3 with skill/content identities and release ceiling | 执行入口绑定批准版本并禁止本地 ready。 |
| `schemas/reference-registry.schema.json` | Add | 表达参考职责、固定 SHA、代码/资产许可证和禁止路径。 |
| `schemas/native-pptx-capability.schema.json` | Add | 描述宿主 adapter、目标播放器、工具版本和可用输出。 |
| `schemas/native-pptx-evidence.schema.json` | Add | 绑定 PPTX、slide-text、逐页渲染和 contact sheet digests。 |

不新增 `user-confirmation.json`。本地 schema 无法证明文件不是产物作者伪造，最终用户确认必须留在宿主任务信任边界。

### Canonical Content Rules

- `source_inventory`: 全部可靠抽取事实，可在最终叙事中省略。
- `narrative_selection`: 每个体裁明确选入和省略项。
- `protected_token`: 被选事实中必须完整显示的源文词法片段；默认不允许 `大于等于1000 -> ≥1000` 等自动改写。
- `display_variant`: 只有宿主记录的用户明确确认才允许；本地 Reviewer 不能创建。
- HTML/Poster 使用 `data-content-token-id`；Native PPT 由 host adapter 输出按 slide/paragraph 合并 text run 的 `slide-text.json`。两者均对 ledger 做双向覆盖，渲染截图再做人工可见性确认。

## Database Design

Not applicable — Skill 使用本地不可变文件、JSON 契约和 SHA-256 身份，不需要数据库、事务、备份或服务端生命周期。

## API Design

Not applicable — 本次不建设网络 API。CLI、JSON schema 和 host presentation adapter 是稳定边界；adapter 缺失、attestation 不可信或输出不完整时，PPT 请求保持 `blocked`，可另行提供 `ppt-handoff` 选项但不得冒充原生 PPT。

## Security Accessibility And Operations

- Reference/media registry 对来源、所有者、代码许可证、资产许可证、允许用途和禁止路径 fail-closed；AGPL/GPL 与公司官网默认 `inspiration_only`。
- 不把源文件、截图或用户数据上传到外部服务；外部生成和检索服从单次项目授权。
- HTML 保持键盘、可见焦点、语义标题、对比度、响应式和 reduced-motion；PPT/Poster 保证字号、对比和非颜色单一编码。
- 使用 Node 标准能力和现有依赖；新增函数单一职责、显式参数/返回值、不可变输入、2-space JSON/JS 风格，错误指出对象和修复动作。
- 耗时、工具步骤或 capability 未测得时记录 `unknown`，不写 `0` 或 `within_budget`。

## Vertical Slices

| Slice | Requirement IDs | End-To-End Behavior | Allowed Paths | Test Seam | Exit Criteria |
| --- | --- | --- | --- | --- | --- |
| 1 | REQ-004, REQ-006, REQ-011 | CLI 绑定工作区/安装/产物 identity；本地状态最高为 `candidate_ready`；否决或 digest 变化使审批 stale | `package.json`; `scripts/pack-skill.mjs`; `scripts/design.mjs`; `scripts/compile-execution-plan.mjs`; `scripts/run-execution-plan.mjs`; `scripts/lib/skill-identity.mjs`; `scripts/validate-install-parity.mjs`; `scripts/validate-design-output.mjs`; `scripts/validate-evidence-contract.mjs`; `scripts/validate-design-skill.mjs`; `scripts/validate-schemas.mjs`; `schemas/artifact-manifest.schema.json`; `schemas/evidence-contract.schema.json`; `schemas/reviewer-record.schema.json`; `schemas/reviewer-attestation.schema.json`; `schemas/approval-rejection.schema.json`; `schemas/execution-plan.schema.json`; `tests/install-parity.test.mjs`; `tests/evidence-contract.test.mjs`; `tests/execution-plan.test.mjs`; `tests/validators.test.mjs`; `tests/showcase-registry.test.mjs`; positive `examples/*/quality-report.md` records affected by the status ceiling; `showcases/swiss-evidence-deck-production/case.json`; `showcases/swiss-evidence-deck-production/review.json`; `examples/candidate-ready-pass/`; `examples/invalid-install-drift/`; `examples/invalid-local-ready/`; `examples/invalid-stale-approval/` | `node --test tests/install-parity.test.mjs tests/evidence-contract.test.mjs tests/execution-plan.test.mjs tests/validators.test.mjs tests/showcase-registry.test.mjs` | 打包副本与工作区可验证一致；实际安装副本漂移被明确拒绝并留到 Slice 7 切换；本地 `ready` 稳定失败；`candidate_ready` 必须绑定独立人工复核；宿主 Reviewer 绑定最终 content、artifact、surface 与 machine evidence；artifact/content/surface 变更稳定失效；未知 assurance profile 不得绕过证据验证；仓库保持可运行。 |
| 2 | REQ-007, REQ-008, REQ-013 | `design profile` 将已确认 brief 解析为六类产品预设之一、最多一个有限辅助预设、内容拓扑、体裁规则和现有 theme tokens；模板注册表把拓扑映射到允许布局，核心 plan 只接受候选模板或明确返回 unsupported | `design-systems/defaults/design-profile-catalogue.json`; `assets/templates/registry.json`; `assets/templates/layouts/*`; `assets/templates/poster.html`; `schemas/design-brief.schema.json`; `schemas/design-profile-catalogue.schema.json`; `schemas/design-profile.schema.json`; `schemas/execution-plan.schema.json`; `scripts/lib/design-profile.mjs`; `scripts/lib/execution-plan-binding.mjs`; `scripts/lib/layout-registry.mjs`; `scripts/resolve-design-profile.mjs`; `scripts/validate-design-profile-catalogue.mjs`; `scripts/validate-packed-references.mjs`; `scripts/compile-execution-plan.mjs`; `scripts/run-execution-plan.mjs`; `scripts/design.mjs`; `scripts/validate-component-pilots.mjs`; `scripts/validate-design-output.mjs`; `scripts/validate-layout-lock.mjs`; `scripts/validate-poster-contract.mjs`; `scripts/validate-schemas.mjs`; `scripts/validate-design-skill.mjs`; `tests/design-profile.test.mjs`; `tests/packed-references.test.mjs`; `tests/execution-plan.test.mjs`; `tests/execution-runner.test.mjs`; `tests/component-usage.test.mjs`; `tests/fixtures/execution-request.mjs`; `examples/poster-pass/index.html`; `examples/component-deck-pilot-pass/slide-plan.json`; `package.json`; `package-lock.json`; `SKILL.md`; `references/library.md`; `docs/exp/*` | `node --test tests/design-profile.test.mjs tests/packed-references.test.mjs tests/execution-plan.test.mjs tests/install-parity.test.mjs` plus `node scripts/design.mjs validate` and `npm run pack:skill` | 注册表恰好含六类预设、三体裁和七拓扑；18 条 reader-job × 体裁路由稳定进入候选或明确 unsupported；自动 126 组和显式 90 组主辅继承保持主视觉所有权；核心体裁无 profile 时 compiler/schema/public check 均失败；Runner 即使面对重算 digest 的篡改 plan 也重放 profile/template/topology 解析；Deck 的 manifest、slide-plan 与 HTML 布局逐页一致并覆盖每个选中拓扑，Poster 的 manifest、poster-plan 与 HTML marker 一致且满足选中拓扑；未知或悬空引用失败；所有 template/showcase/thinking/layout refs 在安装包中可解析。 |
| 3 | REQ-001–REQ-005 | Host adapter 对原始文件做可追溯抽取并进入一个 ledger；summary/claim/三体裁只引用 ledger；derived values 通过代码复现 | `schemas/source-extraction-capability.schema.json`; `schemas/source-extraction.schema.json`; `schemas/content-ledger.schema.json`; `schemas/summary-map.schema.json`; `schemas/claim-map.schema.json`; `scripts/capability-preflight.mjs`; `scripts/validate-source-extraction.mjs`; `scripts/validate-content-chain.mjs`; `scripts/validate-summary-map.mjs`; `scripts/validate-claim-map.mjs`; `scripts/validate-data-provenance.mjs`; `scripts/validate-design-output.mjs`; `tests/source-extraction.test.mjs`; `tests/content-chain.test.mjs`; `tests/validators.test.mjs`; `tests/fixtures/source-extraction/minimal-legacy.doc`; `examples/product-management-source-extraction/`; `examples/content-chain-pass/`; `examples/invalid-source-extraction/`; `examples/invalid-qualifier-drift/`; `examples/invalid-derived-without-code/` | `node --test tests/source-extraction.test.mjs tests/content-chain.test.mjs tests/validators.test.mjs` plus one host extraction of the original project `.doc` | Unsupported/missing adapter fails closed；原始项目 `.doc` 的 hash、抽取工具、文本 hash、段落 map 和 protected tokens 可复现；三体裁 content digest 一致；已选 token 零漂移；derived values 由代码复现。 |
| 4 | REQ-007–REQ-011, REQ-013 | PPT 从两个方向选择一个拓扑，经 host adapter 生成并检查 native PPTX、提取文本、逐页渲染和全页 contact sheet | `schemas/reference-registry.schema.json`; `schemas/visual-asset.schema.json`; `schemas/native-pptx-capability.schema.json`; `schemas/native-pptx-evidence.schema.json`; `assets/templates/ppt-decision-brief.html`; `assets/templates/ppt-system-narrative.html`; `assets/templates/registry.json`; `references/deck-ppt.md`; `scripts/capability-preflight.mjs`; `scripts/validate-native-pptx-evidence.mjs`; `scripts/capture-deck-contact-sheets.mjs`; `tests/ppt-studio.test.mjs`; `examples/ppt-studio-pass/`; `examples/invalid-ppt-capability/`; `examples/invalid-ppt-surface-drift/` | `node --test tests/ppt-studio.test.mjs` plus one host adapter production run | Native capability 缺失时 fail-closed；两个 PPT 拓扑各有生产 showcase；PPTX text 和渲染保留 tokens；contact sheet 页数完整；独立 Reviewer 绑定最终 digests。 |
| 5 | REQ-007–REQ-011, REQ-013 | HTML 从两个方向选择拓扑，完成 deep link、刷新、键盘、响应式、静态与 reduced-motion 的目标表面闭环 | `assets/templates/html-paged-product-story.html`; `assets/templates/html-anchored-decision-report.html`; `assets/templates/registry.json`; `assets/vendor/open-design-html-ppt/runtime.js`; `references/deck-ppt.md`; `scripts/capture-deck-slides.mjs`; `scripts/render-smoke.mjs`; `tests/html-studio-browser.test.mjs`; `examples/html-studio-pass/`; `examples/invalid-html-route/`; `examples/invalid-html-motion-fallback/` | `node --test tests/html-studio-browser.test.mjs` | 两个 HTML 拓扑各有生产 showcase；每个 route 可直达和刷新；各视口无 token 漂移或布局错误；动效去除不损失语义。 |
| 6 | REQ-007–REQ-011, REQ-013 | Poster 从两个方向选择拓扑，完成原尺寸、25% 预览和独立三秒测试 | `assets/templates/poster-dominant-claim.html`; `assets/templates/poster-evidence-grid.html`; `assets/templates/registry.json`; `references/poster-design.md`; `scripts/validate-poster-contract.mjs`; `scripts/validate-poster-anti-ai-slop.mjs`; `scripts/capture-poster-evidence.mjs`; `tests/poster-studio-browser.test.mjs`; `examples/poster-studio-pass/`; `examples/invalid-poster-multiple-claims/`; `examples/invalid-poster-content-swap/` | `node --test tests/poster-studio-browser.test.mjs` | 两个 Poster 拓扑各有生产 showcase；唯一主结论、25% 可读、媒体有语义；独立 Reviewer 的三秒召回只记录一个 claim。 |
| 7 | REQ-004, REQ-005, REQ-012 | 在固定 9 任务集上建立旧/新基线，完成入口切换，删除 migration helper，并直接拒绝旧协议 | `benchmarks/design-v2/tasks.json`; `benchmarks/design-v2/README.md`; `scripts/benchmark-workflow.mjs`; `tests/efficiency-baseline.test.mjs`; `tests/legacy-protocol-rejection.test.mjs`; `tests/migration.test.mjs` (delete); `scripts/migrate-execution-request-v1.mjs` (delete); `scripts/compile-execution-plan.mjs`; `scripts/run-execution-plan.mjs`; `scripts/validate-design-skill.mjs`; `scripts/design.mjs`; `SKILL.md`; `agents/openai.yaml`; `package.json`; `assets/templates/registry.json`; `assets/templates/swiss-evidence-deck.html`; `examples/swiss-evidence-deck-production-pass/` | `node --test tests/efficiency-baseline.test.mjs tests/legacy-protocol-rejection.test.mjs` then `npm run test:strict` | Wall-clock 中位数降低 >=20%，有效步骤不增加 >10%，REQ-001–REQ-013 无回退；migration helper/test 被删除，所有旧调用点移除，旧协议直接返回明确错误；工作区与安装副本使用同一批准 digest。 |

## Architecture Decisions

| Decision | Requirements | Chosen Design | Mature Reference | Rejected Alternative And Reason |
| --- | --- | --- | --- | --- |
| Canonical content | REQ-001–REQ-005 | One ledger with extraction evidence and summary/claim views | Open Design manifest/provenance pattern | Three parallel truth maps already drifted |
| Native PPT | REQ-001, REQ-004, REQ-007, REQ-011 | Host adapter plus fail-closed capability/evidence contract | Host presentation tooling | Pretend HTML handoff is PPT: contradicts current capability evidence |
| Template model | REQ-007–REQ-010 | Two content topologies per format, each shipped end-to-end | Guizang rhythm, Gemini and Better Poster topology | Many style presets repeat shallow-template failure |
| Product preset model | REQ-007, REQ-008, REQ-013 | One main product preset references existing theme tokens; at most one supporting preset contributes only topology and surface emphasis | Open Design design-system separation and content-first art direction | Six duplicated theme files would create color/font drift and shallow skinning |
| Review state | REQ-006, REQ-011 | Local ceiling `candidate_ready`; host owns user confirmation | Existing Assured digest binding | Local `user-confirmation.json` is forgeable by artifact author |
| Media governance | REQ-009, REQ-010 | Extend visual asset contract; add reference registry | Page UI patterns and current provenance | Separate media registry duplicates manifest ownership |
| Compatibility | REQ-004, REQ-012 | Direct versioned cutover; old protocols fail with actionable error | Current explicit schema versions | Import or compatibility path was not requested and preserves invalid states |

### Frozen Efficiency Benchmark

在首次运行前由独立 Reviewer 批准以下任务集和摘要；运行后不得替换 source pack：

| Source pack | SHA-256 | Purpose |
| --- | --- | --- |
| `product-management-source-text` | `07db558a23b31ae96ba21ababe65cf3ac196600a7a8e0ffb8887fe8ae6563817` | 中文项目建议书、系统关系、指标和长叙事；原始 `.doc` 当前路径不可读，Slice 3 必须恢复原文件并另做抽取回归 |
| `examples/chart-frame-pass/source.csv` | `3050fec36df64b9da9d56b08896bb2b146897d1b6aef3593022e830302afc4fb` | 结构化数值和图表表达 |
| `examples/deck-pass/source-notes.txt` | `56ecd25c40b444bf026c73ad52e4244372a9710810d2cc613921cb54f8ab6f0d` | 稠密文本、摘要和 deck 叙事 |

三份 source pack 分别执行 PPT、HTML、Poster，共 9 个任务；每条链预热 1 次、测量 3 次。任务文件只可在基准前由独立 Reviewer 批准一次。每组旧/新配对预先冻结同一 Reviewer identity、模型/工具版本和随机执行顺序；Reviewer active time 从首次打开完整证据到提交决定，调度、排队和用户等待单独记录且不进入主指标。

## Requirement Mapping

| Requirement ID | Module Or Interface | Slice | Verification Plan |
| --- | --- | --- | --- |
| REQ-001 | host source extraction, content ledger, visible token binding, PPT slide-text evidence | 3, 4, 5, 6 | Legacy `.doc` extraction evidence, source/selection distinction, relation-word fixtures and target-surface comparison |
| REQ-002 | source-bound summary/claim review | 3 | Meaning-drift, qualifier-loss and jargon negative fixtures plus independent review |
| REQ-003 | data provenance plus ledger derivation refs | 3 | Execute trusted calculation fixture and compare exact output |
| REQ-004 | skill/install/artifact digests and local release ceiling | 1, 7 | Parity drift fixtures and installed-copy verification |
| REQ-005 | run/content identities | 3, 7 | Three-format showcase shares source/content digest and has separate artifact digests |
| REQ-006 | digest-based approval invalidation | 1, 4, 5, 6 | Rejection and content/artifact/surface mutation fixtures |
| REQ-007 | format-specific templates and target-surface tests | 2, 4, 5, 6 | Design-profile surface contracts plus Native PPT, HTML and Poster end-to-end checks |
| REQ-008 | topology and art-direction contracts | 2, 4, 5, 6 | Deterministic topology route, content-swap falsification and focal-composition explanation |
| REQ-009 | mandatory Standard/Assured reference and direction record | 4, 5, 6 | Missing-reference and one-direction negative fixtures |
| REQ-010 | visual asset semantic job and fallback | 4, 5, 6 | Unauthorized/decorative media failures and static fallback checks |
| REQ-011 | independent reviewer and surface digests | 1, 4, 5, 6 | Screenshot mutation, Chinese typography, full-deck rhythm and three-second evidence |
| REQ-012 | fixed benchmark protocol and cutover | 7 | Three source packs × three formats × three measured runs; preserve raw logs |
| REQ-013 | design profile catalogue, resolver, CLI and packaged references | 2 | Eighteen deterministic routes, override failures, digest tamper failure, plan binding and npm package reference integrity |

## Main Risks

- Host presentation adapter trust and availability are outside the local package; no attestation means native PPT remains blocked.
- Aesthetic quality cannot be fully automated; independent falsification, same-size direction comparison and user review remain mandatory.
- Token markers may omit visible copies; require ledger-to-surface and surface-to-ledger coverage plus relation-word negative fixtures.
- PPT rendering varies by player; intake records target player, and adapter evidence identifies the actual renderer.
- External asset rights may be ambiguous; default to internal inspiration or reject from delivery.
- Strict tests may become slower; each format slice has a focused test, while full multi-format coverage remains strict.
