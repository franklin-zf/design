# Product And Solution

## Product Promise

`design skill` 将同一份可信内容或数据，稳定转化为事实一致、表达清晰、由内容决定视觉形式，并分别适配 PPT、HTML、Poster 场景的高质量可视化报告。

## Chosen Solution

采用 **单一内容真值链 + 体裁工作室 + 可失效审批**。

事实只整理一次；PPT、HTML、Poster 共享源版本、事实、结论边界和衍生计算，但分别完成叙事、构图、媒体、交互和目标表面验收。Swiss、Editorial、Product UI 等只是视觉语言，必须晚于内容拓扑选择。

### Alternatives Considered

| Option | Benefit | Failure Mode | Decision |
| --- | --- | --- | --- |
| 只加强现有模板和校验器 | 改动小 | 不能关闭多条内容链、模板换皮和自证审批 | Reject as primary solution |
| 每次完全自由艺术指导 | 审美上限高 | 慢、不可复用，事实漂移与风格不稳定 | Use only for direction exploration |
| 真值链 + 体裁工作室 + 精选拓扑 | 准确性、审美上限和效率较均衡 | 需要淘汰旧链路并重建基准 | Adopt |

## Feature Architecture

| Layer | Responsibility | Requirements |
| --- | --- | --- |
| Intake | 明确受众、任务、场景和体裁；信息不足时给出 2–3 个具体方向 | REQ-007, REQ-009 |
| Content Spine | 冻结源版本、事实、限定词、衍生计算和结论边界 | REQ-001–REQ-005 |
| Art Direction | 提炼视觉命题，选择参考职责，比较两个实质不同的方向 | REQ-008–REQ-010 |
| Format Studios | PPT、HTML、Poster 按目标表面独立设计和验证 | REQ-005, REQ-007, REQ-010 |
| Review And Release | 内容复核、视觉反证、哈希绑定、用户确认与否决失效 | REQ-004, REQ-006, REQ-011 |
| Efficiency | 复用真值链和成熟拓扑，减少重复整理与无效审核 | REQ-012 |

## Interaction Design

### Entry

1. 用户提交材料。
2. 若产物类型、目标或场景缺失，给出 2–3 个具体方向：
   - 管理层 PPT：10–15 分钟决策汇报。
   - HTML 演示：分享、逐页定位和自主阅读。
   - 单页 Poster：快速传播一个核心结论。
3. 每个方向说明目标读者、使用场景、信息密度和取舍；用户选定后继续。

### Primary Flow

1. 冻结源材料，建立内容真值账本；歧义、缺失或冲突进入 `blocked`。
2. Poster 责任先确定主结论、证据顺序、限制条件和读者动作。
3. 检索 2–3 个分别承担内容拓扑、视觉语言、媒体或交互职责的参考。
4. 生成两个同尺寸、事实相同但构图或媒体策略明显不同的方向。
5. 根据表达效果选择方向，不以“更炫”或组件更多为理由。
6. 进入对应体裁工作室，设计并渲染真实目标表面。
7. 本地自动检查与独立 Reviewer 最多把产物推进到 `candidate_ready`。
8. 用户确认精确产物版本后，只有宿主任务可显示 `ready`；本地 artifact、manifest 和 Reviewer 文件均不能写入该状态。

### States And Recovery

```text
draft
  -> blocked
  -> direction_review
  -> rendering
  -> review_failed
  -> candidate_ready
  -> host-ready

host-ready -- user rejects --> changes_required + stale_approval
candidate_ready -- artifact/content/screenshot hash changes --> review_required
```

- `candidate_ready`: 内容、目标表面和独立视觉检查通过，证据绑定最终产物和截图。
- `host-ready`: 宿主任务记录用户确认了该精确版本；该状态不回写到产物作者可修改的目录。
- `stale_approval`: 原审批指向的内容、产物或截图已经变化，或用户已明确否决。
- 内容不足保持“数据不足”；媒体授权不明时使用自有素材、可验证开源素材或明确标注的示意图，不静默替换。

## Data Flow

```text
源材料快照
  -> 内容真值账本
  -> 叙事模型
  -> 参考与视觉方向记录
  -> 体裁蓝图
  -> PPT / HTML / Poster
  -> 内容证据 + 最终截图 + 独立审核
  -> 用户版本确认
```

- 源材料快照记录原始文件 hash；抽取记录另存抽取工具、版本、抽取文本 hash 和段落定位，原文件与抽取文本之间可追溯。
- 内容真值账本统一管理原文事实、数字、单位、关系词、限定词、来源位置和衍生计算。
- Summary、claim、chart data 和大字数字只是账本视图，不再各自形成平行真值源。
- 衍生分析记录输入、程序、公式和输出，产物中明确标识 `derived`。
- 叙事模型只组织主结论、证据顺序、风险、边界和读者动作，不改变事实强度。
- 三类产物共享 `run_id`、source identity 和 content identity，不共享排版结果。
- 内容、源版本、产物或截图哈希变化后，下游审批自动失效。

## UI Direction

### Shared Principles

- 一个画面只有一个主要注意中心；信息层级通过尺度、位置、留白和对比建立。
- 内容拓扑先于风格：先决定 `decision-brief` 或 `dominant-claim`，再选择 Swiss、Editorial 或 Product UI 语言。
- 产品类内容必须出现可理解的产品对象、真实 UI、系统关系或明确标注的内容专属示意图。
- 中文标题、正文、数字、单位、关系词和换行分别做光学检查。
- 毛玻璃、粒子、装饰网格和循环背景只有承担语义任务时才允许存在。

### Format Studios

| Format | Content Topologies | Designed Experience | Acceptance Surface |
| --- | --- | --- | --- |
| PPT | `decision-brief`, `system-narrative` | 面向现场讲述，形成问题、机制、对象、证据、风险和决策节奏；前 3 页出现产品对象、界面或系统关系 | PPTX/PDF 实际渲染、逐页截图、全页 contact sheet、投影可读性 |
| HTML | `paged-product-story`, `anchored-decision-report` | URL 定位、刷新恢复、键盘、响应式、静态与 reduced-motion 降级；动效只解释状态、顺序、因果或流向 | 桌面/移动多视口、逐页 route、刷新、键盘和静态回退 |
| Poster | `dominant-claim`, `evidence-grid` | 一个主结论、一个视觉入口；证据退居次级层，不压缩成单页报告 | 25% 缩放、三秒记忆、目标打印/屏幕尺寸 |

原生 PPTX 不是当前 `design` 包已证明的能力。PPT Studio 必须通过宿主 presentation adapter 取得能力证明、真实 `.pptx`、提取文本和渲染证据；能力缺失时 fail-closed，只能把 `ppt-handoff` 作为不同产物供用户选择。

## Reference And Direction Gate

Standard 和 Assured 的 PPT、HTML、Poster 必须使用 2–3 个有明确职责的参考，例如：一个负责内容拓扑、一个负责媒体策略、一个负责交互。Express 可以跳过，但只能输出 preview，不能进入 `candidate_ready`。两个候选方向必须：

- 使用相同事实、相同目标尺寸；
- 在信息拓扑、视觉焦点或媒体策略上实质不同；
- 分别说明视觉命题、内容张力、记忆点、反例和克制规则；
- 通过并排截图比较后再选择；
- 不复制公司品牌资产或许可证不明确的实现。

对产品管理平台案例，至少比较：

- `中枢对象`: 产品主数据位于中心，突出三类系统关系和平台边界。
- `流程闭环`: 通过建设前后或状态变化，突出管理价值和落地路径。

## Media Semantics

| Content Task | Preferred Medium | Constraint |
| --- | --- | --- |
| 证明产品真实存在 | 真实 UI、产品状态截图 | 记录来源和状态；生成 UI 不得冒充真实截图 |
| 解释系统关系 | Mermaid、系统图、信息示意图 | 连接、顺序和颜色必须有事实依据 |
| 表达数量、比例或差异 | 可追溯图表 | 标尺、数值和标记由代码生成 |
| 识别对象或场景 | 真实或授权图片 | 不用模糊氛围图替代可检查对象 |
| 帮助快速扫描 | 同一图标家族 | 图标不能替代关键文字 |
| 解释状态和顺序 | 局部动效 | 必须提供等价静态和 reduced-motion 状态 |

每个媒体元素都必须回答“它帮助理解什么”。回答不了则删除。

## GitHub And Mature References

Research status: completed

Evidence basis: local snapshots reviewed on 2026-08-09; upstream maintenance was not refreshed in this planning turn.

| Project Or Product | URL | License | Maintenance Checked | Useful Pattern | Fit And Gaps | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| Open Design | https://github.com/nexu-io/open-design | Root Apache-2.0; subprojects must be checked separately | Fixed local snapshot, 2026-08-09 | `DESIGN.md`, Skill/design-system separation, manifest/provenance, format-oriented architecture | Architecture fits; desktop app, cloud and brand styles exceed scope | Adopt architecture; selectively adopt separately licensed code |
| Guizang PPT Skill | https://github.com/op7418/guizang-ppt-skill | Local snapshot indicates AGPL-3.0 | Fixed local snapshot, 2026-08-09 | Narrative arc, page rhythm, locked layouts, Chinese typography preflight, static fallback | Strong deck method; license and fixed styles make direct copying unsuitable | Borrow methods only |
| Slidev Themes | https://github.com/slidevjs/themes | Code MIT; bundled images/assets separately CC BY-NC-SA 4.0 | SHA `6bb2889...`, 2026-08-09 | Distinct page types and theme/content separation | Useful rhythm; bundled assets unsuitable for unrestricted commercial reuse | Borrow structure; audit every asset |
| Reveal.js | https://github.com/hakimel/reveal.js | MIT | SHA `a3b9406...`, 2026-08-09 | Hash deep links, keyboard, notes, export | Strong runtime reference, not an aesthetic benchmark | Borrow interaction contract; do not replace runtime by default |
| Gemini | https://github.com/anishathalye/gemini | MIT | SHA `57af58d...`, 2026-08-09 | Dense evidence grid and print hierarchy | Good Poster topology; LaTeX is not a shared runtime | Borrow topology; selectively reimplement grid behavior |
| Better Poster | https://github.com/rafaelbailo/betterposter-latex-template | GPL-3.0 | SHA `30baa8e...`, 2026-08-09 | One dominant claim and distance readability | Method fits; direct template reuse adds GPL obligations and generic visual mimicry | Inspiration only |
| Page UI | https://github.com/PageAI-Pro/page-ui | MIT | SHA `bb4951f...`, 2026-08-09 | Product screenshot as composition, responsive media regions | Useful HTML patterns; full CLI/framework is unnecessary | Borrow patterns; adopt code only when isolated and attributed |
| Shadcn dashboard landing template | https://github.com/shadcnstore/shadcn-dashboard-landing-template | Fixed checkout includes MIT `License.md`; asset rights remain separate | SHA `65fc112...`, 2026-08-09 | Dashboard shell, charts and product surfaces | Full dependency tree and generic SaaS composition do not fit report generation | Reject bundle; borrow local patterns only |
| Apple, Linear, Stripe, Vercel homepages | Public company sites | No reuse license established | Screenshots captured 2026-08-09 | Product object, dominant composition, claim plus evidence, whitespace control | Useful internal benchmark only | Inspiration only; never distribute code, images or brand assets |

Reference registry must record source URL, fixed SHA, code license, asset license, allowed paths, forbidden paths and adoption mode. AGPL/GPL and company references default to `inspiration_only`. The reference inventory has been corrected to reflect the reviewed Shadcn `License.md`; third-party asset rights remain separate.

## Requirement Mapping

| Requirement ID | Feature Or Decision | Flow Or State | Data Impact |
| --- | --- | --- | --- |
| REQ-001 | Content Spine canonical display tokens | Source snapshot -> ledger -> every visible surface | Preserves digits, units, signs and qualifiers |
| REQ-002 | Source-bound narrative model | Content review before art direction | Prevents invented or inflated conclusions |
| REQ-003 | Code-backed derived analysis | `blocked` until calculation evidence exists | Stores input, program, formula and output |
| REQ-004 | Version and evidence identity | Any mismatch -> `blocked` | Binds workspace, installed skill, artifact and review identity |
| REQ-005 | One run, three format studios | Shared content chain, independent layouts | Shared source/content IDs, separate artifact IDs |
| REQ-006 | Expiring local approval plus host-only final state | Rejection or hash change -> `stale_approval` | Invalidates prior review references; local artifacts never store ready |
| REQ-007 | Format-specific studios | PPT/HTML/Poster target-surface flows | Records per-format acceptance evidence |
| REQ-008 | Content topology before style | Art direction gate | Records visual thesis and selected topology |
| REQ-009 | Mandatory Standard/Assured reference and two-direction gate | `direction_review`; Express remains preview | Records reference roles, alternatives and decision |
| REQ-010 | Semantic media contract | Media selection and format rendering | Records source, license, semantic job and fallback |
| REQ-011 | Independent visual falsification | `candidate_ready` only after bound evidence | Stores screenshot hashes and falsification result |
| REQ-012 | Reused content chain and topology library | Baseline -> pilot comparison | Records elapsed time and effective tool steps without overriding quality |

## Scope Decisions

- Keep: source-first priority, Taste Contract, L0/L1/L2 expression ladder, one attention center, assurance lanes, professional tool routing, license records and real target-surface checks.
- Simplify: summary, claim and provenance become views of one content ledger; roles are responsibilities rather than mandatory agents; templates are grouped by content topology; Standard uses one independent content review and one visual falsification pass.
- Cut: fixed Swiss default, self-declared `ready`, `smoke_passed` as aesthetic proof, layout-count quality metrics, empty showcases, shared cross-format layout, historical artifact mixing and non-semantic effects.
- Defer only when explicitly outside current scope: new output formats, brand-specific design systems, upstream dependency upgrades and any public distribution of third-party assets.
- Deferred topology candidates: `evidence-review` and `narrative-map` require a separately proven content gap after the first six production templates; they are not part of this implementation plan.
