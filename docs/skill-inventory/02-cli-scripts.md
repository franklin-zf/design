# 02 CLI 与脚本能力清单

脚本与共享库的动态数量以 `capability-manifest.json` 为准。公开接口只有
`scripts/design.mjs`，其余脚本为内部构建块，仍可单独调试调用。

## 一、统一 CLI：`node scripts/design.mjs <command>`

| 命令 | 转发目标 | 用途 |
| --- | --- | --- |
| `profile <brief.json>` | `resolve-design-profile.mjs` | 解析设计 profile（artifact-type / --out） |
| `plan <request.json>` | `compile-execution-plan.mjs` | 编译 digest 绑定的执行计划（--shadow / --design-profile） |
| `review <artifact-dir>` | execution runner + browser/requirement/check | 产生浏览器证据并完成发布前 Review |
| `check <artifact-dir>` | 校验器编排 | 只读验证已有证据；核心类型要求 --execution-plan |
| `shots` / `inspiration` | `dribbble-hub.mjs` | `status/search/get/list/verify/binding/ingest/retire/freshness`；`sync` 已弃用 |
| `render <index.html>` | `render-smoke.mjs` | 多视口渲染与 strict-layout 检查 |
| `capture <index.html>` | `capture-deck-slides.mjs` | Deck 截图 / reduced-motion 截图 |
| `directions <dir>` | `validate-direction-evidence.mjs` | 双方向证据校验 |
| `bind-human-factors` / `audit-human-factors` | 同名脚本 | 人因证据绑定与审计 |
| `preflight` | `capability-preflight.mjs` | 浏览器等外部能力探测（--require=browser_smoke/browser_launch） |
| `validate` | 仓库级校验编排 | code-style / design-skill / schemas / color / profile-catalogue / packed-references / component-catalogue / vendor-provenance / 4 套设计系统包 |
| `test` | 静态 suite + 正/负向夹具 | 不要求浏览器 |
| `test --browser` | Browser suites | Playwright runtime、render spec、组件、人因 |
| `test --strict` | 全部 suite + 真实表面 | static + browser + 多视口 render smoke |

## 二、规划与执行内核（4）

| 脚本 | 职责 |
| --- | --- |
| `resolve-design-profile.mjs` | design-profile/v2 解析：profile/recipe 冲突 fail-closed、capability fallback、digest trace |
| `compile-execution-plan.mjs` | 把 profile + 请求编译为不可变执行计划 |
| `run-execution-plan.mjs` | 按计划执行构建步骤并产出绑定证据 |
| `migrate-execution-request-v1.mjs` | v1 请求迁移 |

## 三、三大能力中枢桥接（3）

| 脚本 | 能力 |
| --- | --- |
| `dribbble-hub.mjs` | `dribbble-hub-mcp` 的 CLI 桥接；metadata、私有 cache、binding 与 lifecycle |
| `component-hub.mjs` | Component Hub：组件目录 search/get/list 与 snippet 提取 |
| `icon-hub.mjs` | IconHub MCP 主仓库桥接（search/get/batch），数据源见 `packages/icon-hub-mcp` |

## 四、规格蒸馏与知识库（5）

| 脚本 | 职责 |
| --- | --- |
| `distill-spec.mjs` | 从站点/材料蒸馏设计规格原语 |
| `extract-primitives.mjs` | 提取 design primitives（令牌、布局、字体） |
| `query-design-spec.mjs` | 查询 design-knowledge 知识库 |
| `validate-design-spec.mjs` | 规格记录校验 |
| `build-production-design-systems.mjs` | 从源规格构建 4 套生产设计系统包 |

## 五、校验器（36）

### 5.1 仓库与打包级（13）

| 脚本 | 校验对象 |
| --- | --- |
| `validate-code-style.mjs` | 代码风格与禁用写法 |
| `validate-design-skill.mjs` | Skill 结构完整性 |
| `validate-schemas.mjs` | 42 个 JSON Schema 自身有效性 |
| `validate-packed-references.mjs` | 打包后 references 存在性与交叉引用（基线 32 引用面） |
| `validate-install-parity.mjs` | 安装包与仓库内容一致性 |
| `validate-vendor-provenance.mjs` | vendor 第三方资产 LICENSE/PROVENANCE |
| `validate-color-system.mjs` | 色彩系统与 color_contract |
| `validate-component-catalogue.mjs` | Component Hub 目录结构 |
| `validate-component-usage.mjs` | 组件使用契约 |
| `validate-design-profile-catalogue.mjs` | profile 目录与 recipe 注册表 |
| `validate-showcase-registry.mjs` | showcases 注册表 |
| `validate-design-system-package.mjs` | 单套设计系统包（4 套逐一校验） |
| `validate-component-pilots.mjs` | 组件试点产物 |

### 5.2 产物视觉契约（9）

| 脚本 | 校验对象 |
| --- | --- |
| `validate-design-output.mjs` | 产物 manifest 与总门禁入口（状态字段、media_decision、style preset、图表区域非空等） |
| `validate-aesthetic-contract.mjs` | 美学契约（accent marker_only 用量等） |
| `validate-asset-contract.mjs` | 视觉资产契约（SVG 文字策略、禁止假截图） |
| `validate-layout-lock.mjs` | Swiss 等 layout lock（未注册布局即失败） |
| `validate-visual-rhythm.mjs` | 视觉节奏 |
| `validate-poster-contract.mjs` | 海报契约（visual_hook 等） |
| `validate-poster-anti-ai-slop.mjs` | 海报反 AI 套路红线 |
| `validate-visual-encoding.mjs` | 图表视觉编码（数据报告/看板） |
| `validate-visual-review.mjs` | reviewer-record 绑定的视觉评审记录 |

### 5.3 内容真实性与需求追踪（11）

| 脚本 | 校验对象 |
| --- | --- |
| `validate-content-ledger.mjs` | 内容总账（冻结源值） |
| `validate-content-chain.mjs` | surface-claims 证据链 |
| `validate-content-handoff.mjs` | designer 输入 handoff |
| `validate-summary-map.mjs` | 摘要 ↔ 可见 HTML 文本/数字映射 |
| `validate-claim-map.mjs` | claim ↔ evidence_quotes 逐字映射 |
| `validate-data-provenance.mjs` | 数据溯源 |
| `validate-source-extraction.mjs` | 源材料提取（路径逃逸、hash 伪造 fail-closed） |
| `validate-requirement-verification.mjs` | P0/P1 需求 RTM 追踪 |
| `validate-direction-evidence.mjs` | 双方向预览证据 |
| `validate-design-evaluation.mjs` | 设计评估记录（--require-complete） |
| `validate-evidence-contract.mjs` | Assured 证据契约 |

### 5.4 输入门禁与 UI 层级（3）

| 脚本 | 校验对象 |
| --- | --- |
| `validate-intake-direction.mjs` | Intake 方向选择（2–3 选项、唯一推荐、confirmed 状态） |
| `validate-ui-hierarchy.mjs` | **UI 层级红线**：Lorem 占位、Emoji 功能按钮、Switch 触觉阴影/边框缺失、卡片 `p-0` 消融风险 |
| `validate-deck-capture-set.mjs` | Deck 截图集完整性（含 reduced-motion） |

## 六、浏览器渲染与截图 QA（11 + 1 负向工具）

| 脚本 | 职责 |
| --- | --- |
| `render-smoke.mjs` | Playwright 多视口（desktop/mobile/small-phone）渲染、--strict-layout 横向溢出/文字重叠检测 |
| `tweakable-smoke.mjs` | 可调参产物交互冒烟 |
| `capture-deck-slides.mjs` | 逐页幻灯片截图 |
| `capture-deck-contact-sheets.mjs` | 截图接触印相汇总 |
| `capture-keyframes.mjs` | 关键帧/动效截图 |
| `capture-direction-previews.mjs` | 双方向首视图预览 |
| `capture-component-pilot-states.mjs` | 组件试点全状态截图 |
| `check-empty-qa.mjs` | 防止空 QA 证据目录蒙混过关 |
| `bind-human-factors.mjs` / `audit-human-factors.mjs` | 人因证据绑定与审计 |
| `capability-preflight.mjs` | 浏览器可用性预检 |
| `expect-fail.mjs` | 负向夹具通用工具（断言某命令必须以指定报错失败） |
| `test-data-provenance-negative.mjs` | 数据溯源负向回归 |

## 七、共享库 `scripts/lib/（14）

| 库 | 职责 |
| --- | --- |
| `skill-identity.mjs` | Skill 身份与根路径解析 |
| `json-schema.mjs` | JSON Schema 校验封装 |
| `artifact-digest.mjs` | 产物/计划摘要 digest |
| `design-profile.mjs` | profile resolver 纯函数内核（冲突/fallback/replay） |
| `design-tokens.mjs` | 设计令牌确定性提取（distill 与校验共用） |
| `design-knowledge.mjs` | 本地 Git 同步知识库检索 |
| `execution-plan-binding.mjs` | 执行计划 digest 绑定 |
| `component-catalogue.mjs` | 组件目录数据内核 |
| `layout-registry.mjs` | 布局注册表 |
| `operational-h0.mjs` | 运营后台 H0 基线 |
| `human-factors.mjs` | 人因检查数据模型 |
| `playwright-runtime.mjs` | Playwright 运行时封装与能力降级 |
| `png.mjs` | PNG 读写（截图证据） |
| `production-copy.mjs` | 生产文案处理 |
