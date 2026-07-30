# Design 完整优化方案

## 1. 一句话目标

在绝不改变源数据、数字、单位、事实和语义的前提下，把内容理解、设计方向、体裁表达、自动验证和独立审核编译进 Design 现有单一执行链，形成更有品味、更可指导且可测量提速的可视化报告生产方法。

## 2. 当前核心瓶颈

Design 当前的核心瓶颈不是缺少更多模板、组件或角色，而是：

> 审美判断没有被压缩成一份按体裁适配、可追溯、可复用并与执行计划绑定的决策合同，导致 Poster、Designer、Builder 和 Reviewer 重复读取上下文，方向容易漂移，确定性问题发现偏晚，审核返工缺少统一基准。

这个瓶颈同时影响四个目标：

- **设计品味**：风格规则较多，但“为什么这个内容应当长成这样”的判断还不够集中。
- **设计方法论**：事实、reader job、视觉方向、媒介和 feel check 尚未形成一条统一决策链。
- **业务流程**：角色上下文重复，模板探索、图片选择、detector 和 Reviewer 之间存在等待或重复检查。
- **执行时间**：当前没有可信 gate/role telemetry，无法判断时间花在哪里，也不能证明缓存、diff 或并发会带来收益。

## 3. 现有能力基线

必须增强而不是替换以下现有能力：

| 基线能力 | 当前价值 | 本方案处理 |
| --- | --- | --- |
| Express / Standard / Assured | 已有交付风险分档 | 原样复用；quick/standard/deep 只作为档内审计深度 |
| Poster / Designer / Reviewer | 内容、视觉、独立审核角色边界 | 原样复用；增加结构化 handoff，不新增平行角色 |
| L0/L1/L2 expression | 完整静态表达先于增强 | 原样复用；motion/image 不得破坏 L0 |
| Template / component registry | 可注册、可筛选、可门禁 | 加深 metadata，不创建第二套模板系统 |
| Artifact manifest / aesthetic contract | 已有结构化产物合同 | 增加可选 design context 与 Taste Decision Card |
| Compiler | 汇总模板、组件和风险 gate | 继续作为唯一计划权威 |
| Runner | 执行 gate、记录结果 | 继续作为唯一执行入口 |
| Evidence / Reviewer record | 数字、来源、运行和审核证据 | 增加 fidelity matrix 和 telemetry |
| Browser/render smoke | 真实表面检查 | 继续用于 HTML；PPT 和报告使用各自 renderer/export 证据 |

当前尚未测量代表性任务的端到端时延、角色上下文体积、gate 队列时间、缓存命中和返工分布。这些指标一律视为 `unknown`，不能写成数值零。

## 4. 不做什么

1. 不新增第四种 profile。
2. 不新增第二套 planner、runner、evidence path 或发布状态机。
3. 不复制 Impeccable 的 23 个顶层命令。
4. 不新增 asset producer、finish reviewer 或平行 design agent。
5. 不 vendor 第三方 detector、hooks、live runtime、agent prompt 或组件源码。
6. 不把 React、Next、Tailwind、Motion、暗色或营销 hero 设为默认栈或风格。
7. 不默认 imagegen first，不要求每页必须有图。
8. 不启用默认 live source mutation、CSP 注入、framework adapter 或远程 runtime。
9. 不用缓存、diff、并发或 quick audit 绕过事实、浏览器、可访问性和独立审核门禁。
10. 本轮只输出方案，不修改 Design 产品源码。

## 5. 目标架构

### 5.1 单一控制面

目标链路保持为：

```text
intake
  -> lightweight router
  -> Express | Standard | Assured
  -> role-specific context packets
  -> Poster
  -> Designer + Taste Decision Card
  -> Builder
  -> existing compiler
  -> existing runner
  -> deterministic evidence
  -> independent Reviewer
  -> ready | changes_required | blocked
```

新增字段、detector 和 telemetry 都进入现有 handoff、manifest、compiler、runner 和 evidence。任何新能力都不能产生第二个“是否可交付”的结论。

### 5.2 Profile 与审计深度

- `Express`、`Standard`、`Assured` 继续决定交付风险和硬门禁。
- `quick`、`standard`、`deep` 只决定当前 lane 内的审计深度。
- `quick` 仅用于可逆的迭代反馈，不能让 Standard 或 Assured 产物进入 ready。
- 发布、派生数据、敏感输入、重大决策、复杂交互、多产物依赖或关键未知自动进入 `deep`。
- 用户请求是风险下限，观察到的事实可以升级，不能降级。

### 5.3 少量 operation

把外部命令词汇归一为六个内部 operation：

| Operation | 典型表达 | 处理 |
| --- | --- | --- |
| `create` | 创建、生成、改造成 | 完整 intake、Poster、Designer、compile、run、review |
| `revise` | 重构、改版、调整 | 先判断 preserve/extend/replace，再进入同一链路 |
| `critique` | 审美 review、挑错 | Reviewer 先行，不自动实施 |
| `validate` | audit、校验、验收 | 确定性 gate 加独立 Reviewer |
| `polish` | 更克制、更大胆、优化排版 | 保持 source/shape，重做 Designer decision |
| `adapt` | 转 PPT、响应式、跨端 | 重验 target surface、内容和 fallback |

它们是 intake 字段，不是六套脚本、agent 或 workflow。

## 6. 上下文包

上下文只解析一次，按角色裁剪，并通过 digest 与 execution plan 绑定。

### 6.1 C0 Router

- 目标、受众、使用场景、artifact type 和 target surface；
- source ids、路径、hash 和 freshness；
- 方向已知/未知；
- 派生计算、敏感性、发布、交互、可逆性和多产物标记；
- changed paths、artifact digest、plan digest；
- 请求的 lane 和 audit depth。

Router 输出 resolved lane/depth、reason codes、operation、所需角色包、gate 列表和 material unknowns。请求清晰时直接路由；体裁、目标或场景不清晰时仅提供 2-3 个排序选择并等待用户，不自动执行。

### 6.2 C1 Poster

- 确认的目标、受众、场景和 reader job；
- 相关原文摘录及不可变数字、单位、日期和 identifier；
- source/summary/claim/calculation/non-claim 规则；
- must-keep facts、known gaps 和 prohibited assertions。

不传模板库、组件库、实现细节和无关原文。

### 6.3 C2 Designer

- 已接受的 Poster handoff 和 narrative spine；
- content tension、visual job、source/media references；
- artifact-specific rules；
- 最多三个 registry-filtered 模板或组件候选；
- 适用的品牌和设计系统 token；
- Taste Decision Card。

除非具体视觉判断需要，不重复加载完整源材料。

### 6.4 C3 Builder

- 精确的 in-scope / out-of-scope paths；
- source、Poster、Designer、manifest、compiler 和 plan digests；
- 已选模板、组件、layout、token、asset medium 和 motion decision；
- 有序实现指令、automatic gate ids 和 stop-on-drift 行为。

任一绑定 digest 变化时停止并重新编译，不继续使用过期判断。

### 6.5 C4 Reviewer

- immutable source inventory；
- visible-number、claim、summary 和 calculation maps；
- baseline/candidate digests；
- changed paths 与 dependency closure；
- required screenshots、states、export 和 gate results；
- Poster/Designer decisions by digest。

不传 Builder 隐藏推理，不授予写权限。

## 7. Taste Decision Card

Taste Decision Card 是现有 Designer handoff 和 aesthetic contract 的子对象，不是新 sidecar 或审批系统。

```json
{
  "design_read": {
    "artifact_type": "",
    "audience": "",
    "reader_job": "",
    "personality": [],
    "evidence_risk": "",
    "visual_tendency": ""
  },
  "visual_thesis": "",
  "primary_mechanism": "",
  "counter_direction": "",
  "composition_variance": 0,
  "motion_intensity": 0,
  "information_density": 0,
  "type_character": "",
  "material_language": "",
  "composition_rule": "",
  "image_role": "",
  "first_viewport_or_slide": "",
  "anti_defaults": [],
  "rejected_options": [],
  "decision_basis": [],
  "approval_status": "not_required",
  "approval_ref": ""
}
```

### 使用规则

- 三个数值是解释轴，不是生成参数，也没有跨任务默认值。
- Express 可内联最小卡；Standard/Assured 使用完整卡。
- 已有品牌系统、严格模板或局部修订可设 `approval_status=not_required` 并写理由。
- 高风险、方向分叉或品牌级任务才需要候选方向和 approval。
- Card 不能覆盖 source truth、expression level、attention budget、motion admission 和 profile gate。
- Reviewer 依据 Card 审核 fidelity，但不接受 Designer 的自我辩护作为证据。

## 8. 端到端业务流程

### 8.1 Intake 与冻结

1. 明确 artifact type、目标、受众、场景和 reader job。
2. 冻结 source inventory、hash、freshness 和权限边界。
3. 建立 source ledger、visible-number map、claim map 和 non-claim list。
4. 若存在派生指标，先由代码计算并生成 calculation receipt。
5. 运行轻量 router，确定 lane、audit depth、operation 和上下文包。

停止条件：体裁、事实、来源、关键数字或使用场景存在重大未知。

### 8.2 Poster

1. 保留原意、数字、单位、限定词和不确定性。
2. 输出 reader job、内容层级、narrative spine、must-keep facts 和禁止主张。
3. 只在不改变原意的前提下总结；使用直接、清晰、普通的词。
4. 关联分析必须引用代码计算证据。

停止条件：任何数字或事实无法映射到源内容，或计算缺少程序证据。

### 8.3 Designer

1. 写 Design Read。
2. 按十二层决策顺序完成 Taste Decision Card。
3. 从 registry 筛选不超过三个候选。
4. 依据 reader job 选择模板、图表、图片、图形和动效。
5. 记录拒绝选项和原因。
6. 高风险开放任务才进入有限方向/comp 审批。

停止条件：视觉方向不能从内容、品牌、受众或场景解释。

### 8.4 Builder、Compiler 与 Runner

1. Builder 只接收 digest-bound 实现包。
2. Compiler 合并 profile、audit depth、模板、组件、asset、detector 和风险 gate。
3. Runner 执行依赖 DAG，记录 queue/execution/browser/review-wait/total telemetry。
4. 独立静态 gate 可在输入冻结后并行；浏览器默认单 worker。
5. Digest 漂移、未知依赖或 detector gate 失败时停止或扩展验证。

### 8.5 Reviewer

1. 先检查事实、数字、计算、来源和语义。
2. 再检查 reader job、Taste Decision Card fidelity 和体裁适配。
3. 消费 detector 结果，但不重复把 detector clean 当成审美判断。
4. 完成缩眼、五秒、缩略图/远距、真实内容、响应式或导出 feel check。
5. 输出 `approved`、`changes_required` 或 `blocked`。
6. 一次批量检查后允许一次集中修复和一次确认；仍有 major/blocking 时不得批准。

## 9. Detector 与 Reviewer 边界

### 9.1 Rule-ownership matrix

新 `validate-design-antipatterns` 不是第二套 truth validator。既有 source、summary、claim、calculation、provenance、artifact、asset、runtime 和 evidence validator 是各自事实的唯一 authority；新 detector 只处理尚无 owner 的 shape-aware structural/aesthetic 规则，或引用既有 gate result 作为报告上下文。

| 事实或规则域 | 唯一 authority / owner | 新 detector 的权限 | 冲突处理 |
| --- | --- | --- | --- |
| Source identity、hash、freshness | `validate-evidence-contract` 绑定的 source inventory | 只消费 result ref；禁止重新哈希或判断 freshness | Owner verdict 唯一有效 |
| Summary 语义、原文数字、visible summary mapping | `validate-summary-map` | 禁止提取、比较或重新扫描 summary 数字 | Summary fail/block 不可被 aesthetic 结果改写 |
| Claim evidence、visible claim mapping、numeric semantics | `validate-claim-map` | 禁止解析 claim map、source quote 或 visible number 形成第二 verdict | Claim verdict 优先于 aesthetic finding |
| Calculation execution、derived value | Compiler execution policy 与 runner result | 禁止执行代码、公式或数值计算 | `zero_spawn`、failed、blocked 保持原判 |
| Provenance code/test/output identity | `validate-data-provenance` | 只引用已落盘结果；禁止重算 hash 或 lineage | Provenance verdict 唯一有效 |
| Ready evidence、accessibility、privacy、Reviewer binding | `validate-evidence-contract` | 禁止组装第二个 ready verdict | Evidence fail/block 最高优先 |
| Required files、manifest/HTML marker、placeholder floor | `validate-design-output` | 已有规则不得重复注册；只消费结果 | Existing structural owner 优先 |
| Aesthetic contract、attention、fallback declaration | `validate-aesthetic-contract` | 禁止重验 contract 字段；只检查其未覆盖的 rendered shape pattern | Contract verdict 优先 |
| Asset path、slot、provenance、screenshot/generated identity | `validate-asset-contract` | 禁止重验 broken image、license、slot 或 screenshot identity | Asset verdict 优先 |
| Poster anti-AI-slop | `validate-poster-anti-ai-slop` | Poster scope route-skip 同一 rule family | Poster owner 优先 |
| Component admission、digest、usage marker | `validate-component-usage` | 禁止重新判断 provenance 或 admission | Component owner 优先 |
| Browser layout、state、reduced-motion runtime | `render-smoke` / `tweakable-smoke` | 不启动浏览器；禁止重测 layout、animation 或 interaction | Runtime result 优先 |
| 无 owner 的 nested cards、card-per-paragraph、repeated kicker、shape repetition、非 poster generic gradient text | `validate-design-antipatterns` | 唯一可判定域；按 artifact shape 和 Taste Decision Card 适用 | Blocking 仅影响 aesthetic/structural readiness，不产生 truth verdict |

### 9.2 Gate-union 去重和冲突优先级

Compiler 对 template、component 和 risk supplement 提交的 gate request 使用 canonical key：

```text
<gate_id>@<adapter_version>|<target_scope>|<normalized_adapter_args_digest>
```

- 相同 key 只执行一次，`depends_on` 取并集，`cacheable=false` 优先，required 优先于 optional。
- 相同 `gate_id` 但 adapter version、target scope 或 adapter args 不兼容时返回 `gate_definition_conflict`，不得择一执行。
- Rule-level 去重 key 为 `<owner_gate>|<rule_id>|<canonical_target>|<subject_or_location>|<input_digest>`。
- 一个 `rule_id` 只能注册一个 owner；重复 owner 在 compile/schema validation 阶段返回 `rule_owner_conflict`。
- Truth owner 的 `blocked|failed` 永远保持，任何 aesthetic `passed|advisory|exception` 都不能升级、覆盖或软化。
- Existing structural/runtime owner verdict 优先于新 detector。
- Aesthetic advisory 只进入 Reviewer 上下文，不改变 truth、execution、assurance 或 delivery verdict。
- Reviewer 可以提高风险、要求修复或 block，但不能把 truth owner 的 fail 改为 pass。

### 9.3 确定性 detector

新 detector 只拥有：

- nested cards / card-per-paragraph；
- 非 poster HTML 中无内容理由的 generic purple-cyan gradient 或 gradient text；
- repeated eyebrow/kicker；
- 同一可见结构中无声明规则的 radius/icon treatment 混用；
- 连续、同构且无内容分组依据的 equal-weight shape repetition。

内容敏感的 typography、palette、copy、composition 和品牌选择默认只能产生 advisory。

新 detector 明确禁止：

- 读取 source、summary map、claim map、calculation、derived output、provenance、source inventory、accessibility/privacy sidecar 来重新判真；
- 重算 hash、执行公式或代码、启动浏览器、访问网络；
- 重验 asset path/license/screenshot identity、reduced-motion 或已有 contract；
- 在 Poster 已有 owner 的 rule family 上重复执行；
- 由 Reviewer 再次调用。

每个 `artifact_digest + target_scope + adapter_version` 最多扫描一次。Runner 必须记录 `scan_count=1`、input digest 和 owner-rule-set digest；第二次 invocation fail closed。

输出结构为：

```text
rule_id, owner_gate, severity, artifact_type, file, location,
evidence, scope, suppression_state, exception_ref,
input_digest, remediation_category
```

每个 blocking 规则至少有一个 positive fixture 和一个 negative fixture。允许例外必须由 manifest/Taste Decision Card 提供 `exception_ref`；结构 pass 仍不能证明好看。

### 9.4 主观 Reviewer

Reviewer 负责 detector 无法证明的事项：

- visual thesis 是否来自当前内容；
- 第一、第二重点和阅读节奏是否正确；
- 设计是否具体而非可替换模板；
- type character、material language、图片和主视觉机制是否一致；
- 视觉表达是否超过或低于 reader job 所需；
- PPT 叙事、报告比较、HTML 任务流是否在真实表面成立；
- 设计 ceiling、真实观看和整体美感。

Reviewer 使用 fidelity matrix：

```text
element, expected_ref, observed_evidence,
status(match|adaptation|missing|contradicted|unapproved_addition), reason
```

至少覆盖 `type_character`、`material_language`、`image_asset_presence` 和 `first_viewport_or_slide`。

## 10. 模板、图片、图表与动效策略

### 10.1 模板

- 保留现有模板 registry，不新增平行模板目录。
- 匹配维度升级为 artifact type、reader job、内容结构、density、brand authority、evidence burden 和 target surface。
- “商务、科技、高级”等模糊风格标签不能直接命中模板。
- Designer 最多接收三个候选；已有品牌/模板锁时直接继承。
- 深化现有 preset 的适用体裁、dial 范围、type character、material language、image role、composition family、motion ceiling 和 anti-default 例外，不增加 preset id。

### 10.2 图片与视觉资产

- 每个主要视觉区域先标记 `produce|direct|semantic`。
- `produce`：人物、真实产品、场景、材质、光照等需要真实或生成 raster 的内容。
- `direct`：可由代码精确表达的几何、背景、图标和装饰。
- `semantic`：图表、流程、关系、UI 和必须保持可读/可访问的数据内容。
- 图片必须有 `visual_role`、尺寸、来源、license、production status、QA status 和使用绑定。
- 用户图片和 Web 图片必须记录授权或来源；生成图片必须标记生成属性。
- 不得把语义文字和关键数据烘焙进 raster，不得用生成图伪造证据。
- 没有语义价值时，允许不使用图片。

### 10.3 图表、流程图与图形

- 图表选择从比较、趋势、分布、组成、关系或流程任务出发。
- 必须保留单位、口径、分母、时间窗、缺失值、来源和计算依据。
- Mermaid 用于可读的流程、思维导图和关系图；复杂或需精确排版时使用 SVG/代码。
- 图标用于清晰命令、类别或状态，不得作为无语义装饰填充。
- 数据不能只靠颜色表达；至少增加一种非颜色线索。
- 图表截图不能替代可追溯数据和 claim map。

### 10.4 动效

- L0 静态表达必须先完整。
- 只有当动效解释反馈、状态、关系、层级、讲述顺序或因果时才允许进入。
- 高频操作、关键数字和持续比较默认稳定。
- 一个页面、章节或 deck 只允许少量主导机制。
- HTML 动效可中断、支持 reduced motion，脚本失败时内容可见。
- PPT 动画不得承载唯一信息，PDF/static fallback 保持相同语义。
- 数据报告导出不能依赖 motion 才能理解。

## 11. Telemetry-first 提速方案

### 11.1 先测量

当前 cache capability 明确为 `not_implemented`：

- `scripts/compile-execution-plan.mjs` 当前固定输出 `runner.cache.enabled=true`；
- `scripts/run-execution-plan.mjs` 只创建并校验 `cacheDir`，没有读取、写入、hit 或 miss 实现；
- 当前 runner tests 只覆盖 cache path containment，不覆盖 cache semantics。

因此，当前状态是 declaration/runtime drift，不是可用缓存，也不能作为 enabled baseline。任何时延测量前必须先完成 P0 一致性修复。

每次运行记录：

- run、artifact、plan、source 和 context-packet digests；
- lane、audit depth、artifact type、changed-path count 和 invalidation size；
- role context bytes、引用文件数和角色等待时间；
- gate queue、execution、browser、review-wait 和 total wall time；
- gate input bytes/files、cache `declared_mode`、`effective_mode`、`hit|miss|unsupported|not_applicable` 和 invalidation reason；
- process/worker count、exit status、retry 和 rework cycles；
- 按 severity 的 findings 数；
- truth、source、calculation、browser、accessibility 和 review status。

不可取得的值写 `unknown`，不能写零。

### 11.2 基线协议

1. 冻结 host、commit/tree、输入和 browser version。
2. 完成 P0 cache 一致性修复，以 `declared_mode=off`、`effective_mode=off`、`result=not_applicable` 运行当前链路。
3. 在相同冻结输入上运行候选链路。
4. 重复到可报告 median 和 tail dispersion。
5. 先比较事实正确性和证据完整性，再比较时间。
6. 保留 raw telemetry 和失败运行。

### 11.3 Pilot target

以下百分比仅是 pilot target，不是已实现结果：

- Poster 和 Designer 的 pilot median context bytes 至少减少 `25%`；
- unchanged-input rerun 的 median wall time 至少降低 `20%`；
- scoped visual-only edit 的 median wall time 至少降低 `15%`；
- visible numbers、units、sources、calculation、semantic、browser coverage 和 independent review 零回归；
- p95 rework cycles 和未关闭 blocking/major findings 不增加。

基线建立后必须根据实测修订 target。

### 11.4 P0 cache 一致性修复

P0 必须同步修复 schema、compiler、runner 和 tests：

| 文件 | P0 行为 |
| --- | --- |
| `schemas/execution-plan.schema.json` | 定义显式 cache mode，canonical plan 默认 `off`；拒绝无效值和冲突的 legacy/new 字段 |
| `scripts/compile-execution-plan.mjs` | 默认输出 cache `off`；不得从 gate 的 `cacheable` metadata 推断 runtime capability |
| `scripts/run-execution-plan.mjs` | 声明 `cache_capability=not_implemented`；plan 声明 enabled 而 capability unsupported 时，在 gate 执行前 fail closed |
| `tests/execution-plan.test.mjs` | 证明 compiler 默认 off、schema 拒绝无效或冲突 mode |
| `tests/execution-runner.test.mjs` | 证明 off 正常运行、enabled+unsupported fail closed，且不会伪造 hit/miss |

Telemetry 必须分离意图、有效行为和结果：

```text
declared_mode = off | enabled
effective_mode = off | enabled | unsupported
result = hit | miss | unsupported | not_applicable
cache_capability = not_implemented | implemented
```

当前唯一合法 baseline：

```text
declared_mode=off
effective_mode=off
result=not_applicable
cache_capability=not_implemented
```

旧计划或 malformed plan 声明 enabled 时必须记录：

```text
declared_mode=enabled
effective_mode=unsupported
result=unsupported
cache_capability=not_implemented
```

并在执行 gate 前停止。不得静默降级为 off，也不得报告 hit 或 miss。

### 11.5 P2 cache 与 diff invalidation

P2 只能通过默认关闭的 feature flag 在 pilot 上启用。只缓存确定性静态 gate，Cache key 至少包含：

```text
gate_id
+ validator digest
+ schema/registry/design-system digests
+ canonical gate configuration
+ declared input paths and content digests
+ runtime major version
```

不可缓存：

- source freshness；
- browser/interaction；
- semantic/visual review；
- independent approval；
- publication approval。

规则：

- `cacheable=true` 只表示未来 eligibility，不证明当前 runner 已实现缓存。
- 依赖未知、覆盖缺失、版本漂移或证据过期一律 cache miss。
- Cached evidence 必须存在、位于 workspace containment 内并与记录 digest 一致。
- 损坏、不完整、过期、symlinked 或 digest-mismatched entry 必须拒绝。
- 任一 artifact digest 变化使旧 browser 和 human evidence 失效。
- `changed_paths` 只决定关注范围，不能豁免 invariants。
- source/summary/claim/schema/registry 变化必须扩大 dependency closure。
- 依赖关系未知时运行完整适用 gate。
- Browser、source freshness、semantic、visual、interaction、independent review 和 publication gate 永远不能 hit。
- 在上述 positive/negative tests 全部通过前，feature flag 保持 off，`cache_capability=not_implemented`。

### 11.6 并行边界

可并行：

- source hashing、host preflight、registry lookup；
- Poster source reading 与 Designer read-only catalogue reconnaissance；
- 输入互斥的静态 gates；
- artifact freeze 后的截图准备与只读 review 准备。

必须串行：

- 派生计算先于 Poster 和图表；
- Poster narrative 先于最终 Designer selection；
- artifact freeze 先于 cache、browser 和 review；
- 自动证据先于独立 approval；
- approval 先于 ready/publishable。

默认总并发保持 `2`、browser 并发保持 `1`，直到 gate telemetry 支持调整。

## 12. P0/P1/P2 文件级改动表

### 12.1 P0：统一方法、上下文和观测，不改变交付语义

| 文件 | 改动 | 验证 | 退出条件 | 回滚 |
| --- | --- | --- | --- | --- |
| `SKILL.md` | 增加 `design_operation`、`incumbent_authority`、Design Read 和 Taste Decision Card 入口；强调体裁适配与 truth-first | Skill 结构检查、术语一致性 | 旧入口仍可执行 | 删除新增可选入口，保留现有 Start Here |
| `references/input-contract.md` | 增加可选 `design_context`、router input 和 material unknowns | Positive/negative contract fixtures | 缺字段保持 legacy 行为 | 关闭新字段读取 |
| `references/workflow.md` | 增加六类 operation、audit depth、bounded visual passes | 路由表与状态测试 | 不产生第二个 ready 状态 | 回到现有 workflow |
| `references/role-architecture.md` | 扩展 Poster/Designer/Reviewer handoff；定义 C1-C4 | Handoff schema/ownership test | 角色职责无重叠 | 忽略新可选字段 |
| `references/taste-loop.md` | 合并十二层方法、Design Read、三个 dial、拒绝项和 feel check | 文档检查、scenario review | 数据报告/PPT/HTML 都有适用规则 | 恢复现有 Taste Loop |
| `references/aesthetic-principles.md` | 写入统一六原则、anti-AI 三层规则和 content-specificity | 规则冲突检查 | 与 truth/L0/motion policy 无冲突 | 移除新增章节 |
| `references/style-presets.md` | 加深现有六个 preset 的适用模式和边界 | Preset completeness test | 不新增 preset id | 使用旧 preset metadata |
| `assets/themes/presets.json` | 增加 dial range、type/material/image/motion/exception metadata | JSON schema、legacy fixture | 旧 preset id/digest 迁移可控 | 回滚 metadata 字段 |
| `schemas/aesthetic-contract.schema.json` | 增加可选 `design_context` 与 `taste_decision` | Schema positive/negative | Legacy artifact 通过 | 字段保持未启用 |
| `schemas/artifact-manifest.schema.json` | 同步内嵌 aesthetic contract | Schema drift test | 两处 schema 无漂移 | 同步撤销新增字段 |
| `schemas/execution-plan.schema.json` | 修正 cache 声明：canonical default 为 `off`，拒绝无效或冲突 mode | Compiler/schema fixtures | 不再生成声明 enabled 但 runtime unsupported 的计划 | 保持显式 off |
| `scripts/validate-aesthetic-contract.mjs` | 验证 card 范围、审批和体裁适配 | Unit tests | 不把偏好误判为 truth failure | 禁用新增检查 |
| `scripts/compile-execution-plan.mjs` | 在 shadow mode 解析 audit depth、role packets 和 digest；cache 默认 off，不从 `cacheable` 推断能力 | Compiler contract tests | Gate closure 不变，cache metadata 与 runtime 一致 | 关闭 shadow 字段并保持 cache off |
| `scripts/run-execution-plan.mjs` | 声明 cache `not_implemented`；enabled+unsupported 在 gate 前 fail closed；记录 phase/gate/role 及 declared/effective/result telemetry | Runner fail-closed 与 telemetry tests | 不产生虚假 hit/miss，缺失值写 unknown | 保持 cache off，关闭非必要 telemetry |
| `tests/execution-plan.test.mjs` | 增加 default-off、invalid/conflicting mode 和 legacy migration 负例 | Test suite | Canonical plan 只有显式 off | 保留旧计划解析但禁止 enabled 执行 |
| `tests/execution-runner.test.mjs` | 增加 off 正常、enabled+unsupported fail closed、无虚假 hit/miss | Test suite | 当前 capability 诚实为 `not_implemented` | 强制 off |
| `schemas/taste-pilot.schema.json` | 定义三体裁 pilot contract、digest、baseline/candidate、rubric 和 evidence path | Schema positive/negative | 三个 pilot 使用同一可复现合同 | 不创建 pilot artifact |
| `examples/design-taste-pilots/{data-report,native-ppt,interactive-html}/pilot-contract.json` | 实施阶段创建冻结输入、baseline/candidate 和验证矩阵 | Contract validator | 所有必需 digest/path 已固定 | 删除未运行的 pilot 目录 |
| `package.json` | 保留并验证现有 `plan:compile`、`plan:run`；只新增必要且不重名的 `audit:quick`、`audit:standard`、`audit:deep`、`release:verify` 薄入口 | 脚本名唯一性检查；每个薄入口 smoke 必须直接调用现有 compiler/runner | 不覆盖现有脚本，不引入第二 runner | 删除新增薄入口，保留现有两个 plan 脚本 |

P0 不声明审美或时延提升。退出 P0 的必要条件是 telemetry 可读、legacy fixtures 通过、现有 ready/publish 语义无变化。

### 12.2 P1：确定性 detector、资产合同和终审增强

| 文件 | 改动 | 验证 | 退出条件 | 回滚 |
| --- | --- | --- | --- | --- |
| `scripts/validate-design-antipatterns.mjs` | Design-owned clean implementation；只处理 ownership matrix 中无 owner 的 structural/aesthetic 规则，truth 仅消费 result ref | 每规则正负 fixture、禁止读取 truth sidecar | Blocking 仅限 detector 独占且被证明稳定的 structural rule | 从 required DAG 移除 |
| `scripts/compile-execution-plan.mjs` | 加入 detector；按 canonical gate key 去重并拒绝 `rule_owner_conflict` / `gate_definition_conflict` | Gate-union、owner、definition conflict tests | 不新增 planner，同一扫描只在 DAG 出现一次 | 删除 detector mapping |
| `scripts/run-execution-plan.mjs` | 增加一个 allowlisted adapter；同 digest 单次扫描并记录 `scan_count` | Runner adapter 与 duplicate invocation tests | 第二次扫描 fail closed，detector crash 不伪造 pass | 禁用 adapter |
| `assets/templates/registry.json` | 按 artifact/reader mode 条件加入 gate；Poster 已有 owner 的 rule family route-skip | Registry/owner validation | Web gate 不误用 PPT/native，不重复 owner | 移除 conditional gate |
| `tests/design-antipatterns.test.mjs` | 覆盖 blocking/advisory/exception、owner conflict、gate-union 去重、truth priority 和重复扫描 | Test suite | Advisory 不改变 truth verdict；false-positive pilot 达标后才升级规则 | 将规则降为 advisory |
| `tests/fixtures/design-antipatterns/*` | 三体裁按适用性建立无 owner structural/aesthetic 正负样例 | Fixture digest/check | 每个候选 blocking rule 有正负样例 | 保留但不执行 gate |
| `schemas/visual-asset.schema.json` | 增加 medium、role、license、production/QA status 和使用绑定 | Schema tests | Legacy asset 保持兼容 | 字段设 optional/禁用 |
| `references/image-design.md` | 定义 produce/direct/semantic、生成图和证据边界 | 文档与 scenario review | 无强制 imagegen | 恢复旧决策树 |
| `scripts/validate-asset-contract.mjs` | 检查存在、引用、来源、媒介与 semantic rasterization | Asset fixtures | 不把无图误判为失败 | 禁用新增检查 |
| `schemas/reviewer-record.schema.json` | 增加 fidelity matrix 和 bounded pass evidence | Schema tests | Verdict 枚举不变 | 忽略新增字段 |
| `references/validation.md` | 增加 detector/Reviewer 边界和体裁 feel check | Review checklist test | Reviewer 保持独立 | 回到现有 review |
| `scripts/validate-evidence-contract.mjs` | 绑定 fidelity matrix、screenshots/export 和 digest | Evidence fixtures | 旧 evidence 可迁移 | 关闭新增 binding |
| `tests/evidence-contract.test.mjs` | 覆盖 stale digest、缺图、错误批准等负例 | Unit tests | 所有负例稳定失败 | 保留现有测试集 |
| `scripts/validate-taste-pilots.mjs` | 校验三个 pilot contract、digest、同源 baseline/candidate、rubric、surface evidence 和独立 review | Positive/negative pilot fixtures | 缺一体裁或 PPT 以 HTML 冒充时失败 | Pilot gate 保持非 required |
| `tests/taste-pilots.test.mjs` | 覆盖 source/plan/artifact drift、缺失 viewport/export、非独立 reviewer、false-positive 分母不足 | Test suite | 三体裁均可按冻结输入复跑 | 不推广 pilot 规则 |
| `showcases/registry.json` | 仅在 pilot 全部通过后登记三个通过案例和 evidence digest | Showcase registry validation | 未通过案例不得登记 | 删除对应 registry entry |
| `evidence/taste-pilots/{data-report,native-ppt,interactive-html}/` | 实施阶段写入运行、截图/播放/导出、preference、fidelity 和 detector adjudication 证据 | Evidence contract | Evidence 与冻结 digest 完全绑定 | 删除失败候选 evidence，不修改源输入 |

P1 先 advisory pilot，再只提升被正负测试和三体裁案例证明稳定、且无既有 owner 的 structural 规则。Truth invariant 始终由既有 validator 判定；任何视觉偏好不得自动修改内容。

### 12.3 P1 可复现三体裁 pilot 矩阵

以下目录和文件在后续实施阶段创建；本轮只固定计划路径和合同，不声称它们已经存在或运行。

#### 共同合同

每个 pilot 使用：

```text
examples/design-taste-pilots/<pilot-id>/
  pilot-contract.json
  source/
  baseline/
  candidate/
  execution-request.json
  baseline-plan.json
  candidate-plan.json
  rubric.json

evidence/taste-pilots/<pilot-id>/
  run-record.json
  gate-results.json
  reviewer-preference.json
  fidelity-record.json
  detector-adjudication.json
```

`pilot-contract.json` 必须固定：

- `source_digest`；
- `baseline_artifact_digest` 与 `candidate_artifact_digest`；
- `baseline_plan_digest` 与 `candidate_plan_digest`；
- `rubric_digest`；
- Design commit/tree、host、runtime、browser 或 Office renderer 版本；
- baseline/candidate label randomization record；
- required viewports、states、playback/export 和 evidence paths。

Baseline 和 candidate 必须使用同一 frozen source、目标、受众、reader job 和内容边界。Baseline 走冻结的当前流程，candidate 走候选流程；不得在对比中改变数据、文案事实、计算或 source scope。

| Pilot | 精确 artifact 路径 | 真实表面证据 | 固定 rubric |
| --- | --- | --- | --- |
| Data report | `examples/design-taste-pilots/data-report/source/source.json`、`source-ledger.json`、`baseline/index.html`、`candidate/index.html`、两份 manifest/plan | `evidence/taste-pilots/data-report/screenshots/{baseline,candidate}/{1440x900,390x844,320x568}.png`、`print/{baseline,candidate}.pdf`、`gray-check.json` | 数字/单位/来源、比较基线、图表语义、层级、扫描、打印/灰度、Taste Card fidelity |
| Native PPT | `examples/design-taste-pilots/native-ppt/source/source.md`、`source-ledger.json`、`baseline/deck.pptx`、`candidate/deck.pptx`、两份 manifest/plan | `evidence/taste-pilots/native-ppt/playback/{baseline,candidate}/slide-*.png`、`export/{baseline,candidate}.pdf`、`pptx-inspection.json`、字体替换与 fallback record | 原文/数字、跨页叙事、缩略图节奏、远距可读、动画非唯一信息、PPTX 结构和 PDF export fidelity |
| Interactive HTML | `examples/design-taste-pilots/interactive-html/source/source.json`、`baseline/index.html`、`candidate/index.html`、两份 manifest/plan | `evidence/taste-pilots/interactive-html/screenshots/{baseline,candidate}/{1440x900,390x844,320x568}/{default,keyboard,expanded,reduced}.png`、interaction trace | 任务完成、状态、响应式、keyboard/zoom、reduced motion、内容可见、视觉层级和 Taste Card fidelity |

Native PPT pilot 必须生成并检查真实 `.pptx`。PDF export 是 PPT 证据和静态 fallback，不是 native PPT 的替代品；若环境不能生成或读取 `.pptx`，该 pilot 状态为 `blocked`。HTML deck 永远不能冒充或自动满足 native PPT pilot。

#### 独立 Reviewer 记录

- `reviewer-preference.json` 使用随机 A/B label，记录 reviewer agent id、independence attestation、rubric digest、preference=`A|B|tie`、逐维理由和置信边界。
- `fidelity-record.json` 逐项记录 truth、reader job、type、material、image、first viewport/slide、surface behavior 和 export/playback 的 expected/observed/status。
- Reviewer 先看 frozen source、rubric 和真实表面，再读取方向合同；不能看到 Builder 隐藏推理。
- Truth、accessibility、runtime 或 export 任一硬门禁失败时，preference 不得覆盖失败。

#### Detector false-positive 分母与升级阈值

- 每个 rule 的 false-positive numerator 是独立 Reviewer 判定为“不构成该规则违规”但 detector 报出的 finding 数。
- Denominator 是该 rule 在正负 fixtures 和三个 pilot 中所有适用、经独立标注为 non-violating 的 artifact-region evaluations；`not_applicable` 不进入分母。
- `detector-adjudication.json` 必须记录 rule id、artifact digest、region、expected label、observed finding、adjudicator、numerator、denominator 和例外依据。
- 从 advisory 升级为 blocking 的 pilot threshold：该 rule 至少有 `30` 个适用的 non-violating evaluations，覆盖其所有适用体裁；false-positive numerator 必须为 `0`；全部 positive fixtures 必须命中；不得出现 ownership、重复扫描或 truth-verdict 冲突。
- 分母不足、存在任一 false positive、适用体裁未覆盖或 Reviewer 有争议时，规则保持 advisory。
- Detector 整体是否改善审美不由命中数证明，只由同源 A/B preference、fidelity 和硬门禁共同判断。

### 12.4 P2：实测后才进入的优化

| 文件/范围 | 改动 | 启动条件 | 验证 | 回滚 |
| --- | --- | --- | --- | --- |
| `scripts/compile-execution-plan.mjs` | 仅通过默认关闭的 feature flag 启用 dependency closure、static cache policy 和 diff scope | P0 baseline 完成且 cache 负向测试通过 | Paired pilot、digest/invalidation tests | Feature flag off，cache mode off，全量 gate |
| `scripts/run-execution-plan.mjs` | 实现 feature-flagged cache read/write/hit/miss 验证和基于 telemetry 的静态 gate 并发 | P1 无事实/浏览器/审核回归 | Median/tail、declared/effective/result 与正确性对照 | Feature flag off，总 worker 2，browser 1 |
| `tests/execution-plan.test.mjs` | quick 不降级、unknown full invalidation、non-cacheable gate | P2 开发前 | 全部负例通过 | 禁用 P2 feature flag |
| `tests/execution-runner.test.mjs` | stale evidence、cache digest、hook timeout、并发顺序 | P2 开发前 | 失败保持 pending/blocked | 强制全量执行 |
| `tweakable-artifact` project-local pilot | 仅试验 live variant，不 vendor Impeccable runtime | 用户显式授权、Assured、CSP/source lock/rollback 就绪 | accept/discard receipt、cleanup、browser QA | 回退 render-spec + browser smoke |

P2 不属于默认能力。没有 telemetry、用户授权和跨体裁正确性证据时保持 disabled。

## 13. 验收门禁

任何阶段不得绕过：

1. Source identity、hash 和 freshness。
2. Visible numbers、units、dates、denominators、identifiers 精确一致。
3. 派生计算由代码执行且可复现。
4. Source、summary、claim 和 non-claim 可追溯。
5. Semantic entailment，无新增或歪曲主张。
6. Privacy 和 untrusted-code policy。
7. Accessibility、keyboard、contrast 和 reduced-motion。
8. 体裁要求的 browser、state、PPT playback/export、report print/gray checks。
9. Taste Decision Card 与产物 fidelity。
10. 独立 Reviewer approved，且无 open blocking/major。
11. Publication allowlist 和 remote commit verification。

结构验证、detector clean、内部评分或 schema pass 不能单独表示“美观”或“可发布”。

## 14. 负向测试

实施必须证明以下失败不会被错误放行：

- `quick` 不能让 Standard/Assured 输出 ready；
- Express 在派生数据、发布、敏感、复杂交互或未知风险时自动升级；
- Web detector 不作用于不兼容的 PPT/native internals；
- Detector crash 不能变成 passed gate；
- Template/component/supplement 请求同一 canonical gate 时只执行一次；
- 同一 `rule_id` 出现两个 owner 时返回 `rule_owner_conflict`；
- 同一 gate id 的 version/target/args 冲突时返回 `gate_definition_conflict`；
- Detector 尝试读取或重算 source/summary/claim/calculation/provenance/evidence/asset/runtime truth 时失败；
- 同一 artifact digest 的 detector `scan_count` 必须为 1，第二次 invocation fail closed；
- Truth owner failed 且 detector passed/advisory 时，truth 与 delivery 仍保持 failed/blocked；
- Aesthetic advisory 不能改变 truth、execution、assurance 或 delivery verdict；
- Stale context、Taste Card、artifact 或 plan digest 停止执行；
- Source/claim/summary/schema/registry 变化扩展 invalidation；
- Unknown dependency 执行完整适用验证；
- Schema/compiler 默认 cache off；
- Plan 声明 enabled 且 runner capability=`not_implemented` 时在 gate 前 fail closed；
- Cache telemetry 分离 declared/effective/hit/miss/unsupported，不伪造活动；
- P2 feature flag 在 digest、evidence、invalidation 和 non-cacheable gate 负例通过前不能开启；
- Browser、semantic、visual 和 independent review 永不 cache hit；
- Cache evidence 缺失或 digest 不匹配时拒绝命中；
- Hook timeout/failure 使后续 required gate 保持 pending；
- 未经用户明确意图不能创建 suppression；
- Context packet 不包含无关库，但保留精确 source values；
- Fake/organic number、random date、缺失单位、截断坐标和颜色唯一编码被拦截；
- 生成图冒充证据被拦截；
- HTML 的 hover-only 信息、移动端重叠和不可中断 motion 被拦截；
- PPT 的动画唯一信息、不可读字号和导出丢失被拦截；
- Publication 含任何非 allowlisted path 时在 commit 前失败。

## 15. Rollout 与回滚

### Phase 0：Observe

- 先完成 cache 一致性修复：schema/compiler 默认 off，runner 声明 `cache_capability=not_implemented`，enabled+unsupported fail closed。
- 再增加包含 declared/effective/result 的 telemetry，不改变路由、gate 或并发。
- 退出：代表性 Express/Standard/Assured 基线可读，不存在声明 enabled 但 runtime unsupported 的伪基线，未知值诚实记录。
- 回滚：保持 cache 显式 off并关闭非必要 telemetry；gate 行为不变。

### Phase 1：Method、Router 与 Context

- Design Read、Taste Decision Card、operation 和 role packets 先以 shadow mode 运行。
- 退出：legacy compatibility、三体裁 pilot contract schema 和 digest binding 通过；真实 pilot 在 Phase 2 执行。
- 回滚：使用当前完整上下文和 compiler inputs。

### Phase 2：Detector 与 Reviewer

- Detector 先 advisory；只有 ownership matrix 中无既有 owner、达到 false-positive 分母和升级阈值的 structural 规则可升级 blocking。
- 退出：ownership/去重负例、正负 fixture、三体裁 frozen pilot 和独立 Reviewer 记录通过。
- 回滚：从 required DAG 移除 detector，保留现有 validator。

### Phase 3：Cache 与 Diff

- 仅通过默认关闭的 P2 feature flag 对 pilot artifact 启用 deterministic static cache 和 dependency closure。
- 退出：paired telemetry 达到 pilot target，且事实、浏览器、可访问性和审核零回归。
- 回滚：关闭 feature flag，恢复 declared/effective mode off，强制完整 gate closure。

### Phase 4：Concurrency 与 Live Pilot

- 并发只根据 gate telemetry 调整；browser 默认仍为 1。
- Live variant 仅在用户项目内、显式授权且 Assured 条件满足时试点。
- 回滚：总 worker 恢复 2、browser 1；live 回退现有 render-spec 和 browser smoke。

任何阶段出现 truth、browser、accessibility 或 independent-review 回归，立即停止推进。

## 16. 发布范围

当前方案阶段只允许发布：

```text
docs/research/design-method-synthesis.md
docs/design-optimization-plan.md
```

不得把当前 dirty worktree 的其他文件加入提交。发布前必须：

1. 确认独立审核 approved，且无 open blocking/major。
2. 确认 index 初始为空。
3. 只按精确路径 staging 两个文档。
4. 校验 staged path set 与 allowlist 完全相等。
5. 校验 commit path set 与 allowlist 完全相等。
6. Push 后校验本地 commit 与 `origin/main` 远端 hash。
7. 记录 commit、branch、remote、paths、命令和结果。

发现额外 staged path、远端分支漂移、审核未通过或 remote hash 不一致时立即中止。不得自动 reset、force-push 或吸收无关改动。

## 17. 成功定义与非声明

本方案只有在后续实施满足以下条件时，才能分别讨论目标达成：

- **设计品味**：三体裁对照案例中，独立 Reviewer 基于固定 rubric 和真实表面证据更偏好候选产物。
- **方法论**：每个产物都有 truth ledger、reader job、Taste Decision Card、体裁规则和独立 review。
- **流程流畅性**：角色 handoff 缺失、重复读取、等待和返工原因可观测并减少。
- **执行时间**：paired telemetry 达到 pilot target，且所有硬门禁零回归。

当前只完成优化方案设计，不代表 Design 源码已经修改，不代表审美已经提升，不代表流程已经提速，也不代表 P2 能力可用。
