# PE Workbench V5 与 Design Skill 优化方案

> 状态：待实施
> 日期：2026-10-12
> 输入：`PE_Workbench_PRD.html`、`redesign-v4/index.html`
> 目标：先关闭 Design Skill 对 dashboard 的误放行，再从冻结内容重新生成可交付的 `redesign-v5`

## 1. 第一性原理判断

当前问题不是缺少颜色 token 或功能页面，而是两个问题叠加：

1. **产品表面没有围绕主要用户的下一步行动组织。**
   PRD 将 Operator 定义为主要用户，但 v4 首页唯一强主动作是 Admin 的
   “添加或管理功能”；窄屏复核又把当前任务、结论和保存动作拆散。
2. **Design Skill 的 dashboard 证据链没有 fail closed。**
   v4 缺少 design profile、execution plan、render profile 和合法的
   Reviewer v4，却仍能通过 Standard check，并通过自报 sidecar 宣称视觉验收完成。

所以优化顺序必须是：

> 修门禁 -> 定方向 -> 重做表面 -> 生成证据 -> 独立放行

如果先改 v4 CSS，旧的误放行路径仍会生成下一版同类问题。

## 2. 目标与非目标

### 目标

- Dashboard 成为 Design Skill 的一等 profile 与 execution-plan surface。
- 缺少 canonical Reviewer、render profile 或正确 H0 证据时必须失败。
- v5 首页默认服务 Operator 的进入、继续和恢复任务。
- 1440、390、320 px 的默认、最密、错误状态均无覆盖、错序或不可达动作。
- 使用一个本地、授权可追溯的图标 family。
- 中文为默认 UI，技术 ID 和原始字段通过显式豁免保留。
- 自动化、独立 Reviewer 和人工表面检查结论一致。

### 非目标

- 不修改 PRD 中的业务事实、数字、角色、功能边界或状态语义。
- 不把 v4 DOM/CSS 复制到 v5 后换皮。
- 不新增 router、sidecar、design system 或 Reviewer 版本。
- 不新增 warm preset；继续使用蓝色 action 与语义状态色分离。
- 不接入真实 SSO、飞书、URI Provider 或生产数据。

### 复杂度预算

| 项目 | 上限 |
| --- | ---: |
| 新 runtime router | 0 |
| 新 sidecar 类型 | 0 |
| 新 design system | 0 |
| Reviewer schema 升级 | 0 |
| 新公开 CLI 命令 | 0 |
| 新 H0 requirement | 0 |
| 新 render assertion family | 0 |

## 3. Workstream A：关闭 Design Skill 误放行

### A1. Dashboard 纳入现有 Design Profile

复用 `design-profile/v2` 和 `scripts/lib/design-profile.mjs`，不建第二套路由。

修改范围：

- `schemas/design-profile.schema.json`
- `schemas/design-brief.schema.json`
- `schemas/design-profile-catalogue.schema.json`
- `design-systems/defaults/design-profile-catalogue.json`
- `scripts/lib/design-profile.mjs`
- `scripts/design.mjs`

要求：

- `artifact_type`、brief 和 CLI 支持 `dashboard`。
- catalogue 新增 dashboard surface contract；现有 `operational-dashboard`
  继续作为 style preset。
- resolved profile 必须包含：
  - `experience_mode=operational`
  - `style_preset=operational-dashboard`
  - alignment contract
  - structured icon policy
  - color contract
  - `zh-CN` 默认与豁免政策
- 未知 profile、surface 或 preset 继续 fail closed。

退出标准：

- dashboard profile 可由同一个 resolver 生成并通过 schema。
- 不传 dashboard profile 时，受控计划编译失败。
- profile digest 可绑定到 execution plan 和 Reviewer record。

### A2. Dashboard 强制 Execution Plan

修改 `scripts/design.mjs`、execution request/plan schema 和 compiler：

- `dashboard` 加入 `requiresExecutionPlan`。
- Standard dashboard 也必须使用 digest-valid plan，不再仅靠 manifest 声明。
- template gate、risk supplement 和 operational H0 取并集。
- `design.mjs check` 缺 plan 时直接失败。
- runner 输出 gate telemetry、machine evidence 和最终状态。

退出标准：

- `redesign-v4` 在缺 plan 时失败。
- 同一 artifact 换 plan digest 时失败。
- 仅在 manifest 写入 `passed` 不改变 gate 结果。

### A3. Canonical Reviewer 必须存在

修改 `scripts/design.mjs` 和 `validate-visual-review.mjs`：

- operational dashboard 的 Standard/Assured 检查必须存在根目录
  `reviewer-record.json`。
- 只接受 `design-reviewer-record/v4`。
- 不再因为文件缺失而跳过 Reviewer。
- manifest 中的 `manual-reviewer-pass` 只是适用 gate，不是结果。
- `evidence/visual-review.json`、`reviewer-v4` 或自由文本 reviewer 不得授权。
- Reviewer 必须绑定当前 artifact、content、surface 和 plan digests。
- `alignment / locale / iconography / palette` 四项必须独立通过。

退出标准：

- v4 当前 review 文件被拒绝。
- 缺根目录 Reviewer 时 Standard operational check 失败。
- craft 高分不能补偿任一 operational check 失败。

### A4. H0 校验证据类型，而不只校验 hash

扩展现有 `validate-requirement-verification.mjs`，不新增 validator。

| Requirement | 必需证据 |
| --- | --- |
| `VIS-ALIGN` | render profile 中 `relation` assertion，edge <=2px、icon center <=1px |
| `VIS-LOCALE` | render profile 中 `locale` assertion，违规数为 0 |
| `VIS-ICON` | render profile 中 `icon` assertion、本地资产 hash、license provenance |
| `VIS-COLOR` | color validator 输出和错误状态截图；accent 与 semantic 不相等 |

规则：

- 普通 screenshot 或 review prose 不能单独证明上述四项。
- evidence kind 与 requirement id 不匹配时失败。
- render profile 必须绑定同一 artifact/plan/render-spec digest。
- 1440、390、320 和 default/dense/error 状态缺一不可。

退出标准：

- v4 的 screenshot-only `VIS-LOCALE`、text-only `VIS-ICON` 被拒绝。
- 修改 screenshot 或 render profile 后 digest 校验失败。
- 伪造 `status=passed` 不改变验证结果。

### A5. 状态标签改为单调升级

所有交付统一使用：

`structure_passed -> evidence_traced -> visually_reviewed -> decision_ready -> user_validated`

- `design.mjs check --profile=standard` 最多产生 `structure_passed` 或
  `evidence_traced`。
- 缺 canonical Reviewer 时禁止 `visually_reviewed`。
- 缺 Assured evidence contract 时禁止 `decision_ready`。
- 缺真实任务观察时禁止 `user_validated`。

## 4. Workstream B：重新定义 V5 产品表面

### B1. 读者任务

一句话产品承诺：

> 已授权 Operator 从一个平台进入或继续正确任务，并在失败时保留身份、数据版本和草稿状态。

默认阅读/操作顺序：

1. 我现在最应该继续什么；
2. 当前任务为什么被阻断；
3. 我可以进入哪个独立功能；
4. 管理员如何管理功能、用户和数据。

### B2. V5 Taste Contract

```json
{
  "visual_thesis": "当前任务和下一步行动先于平台管理",
  "content_tension": "继续业务任务与处理失败状态之间的优先级",
  "signature_move": "一个跨功能的继续/恢复任务轨道",
  "anti_reference": "插件市场、KPI 大盘、等权卡片墙、通用后台模板",
  "restraint_rule": "首页不展示装饰 KPI、重复状态、首字母假图标或大面积空白面板"
}
```

### B3. 两个独立方向

#### 方向 A：Resume & Resolve（推荐）

- 首屏主区只呈现当前任务、阻断原因和唯一下一步。
- 两个独立功能作为次级功能轨道。
- 管理功能放入右上角次级菜单，仅 Admin 可见。
- 最近数据降为末级证据，不与当前任务争夺注意力。

#### 方向 B：Capability Switchboard

- 两个独立功能占据首屏主区。
- 每个功能只显示身份、健康、当前任务和唯一动作。
- 跨功能最近任务在功能区之后。
- Admin 管理仍为次级入口。

方向比较必须：

- 绑定同一 content units 和 P0 requirement；
- 分别输出 1440 首屏、最密状态、错误状态和 320 窄屏；
- 在结构、任务顺序或交互模型上不同，不能只是换颜色。

选择门：

- 三秒内能否指出当前主任务；
- 首屏是否只有一个主动作；
- 错误状态是否紧邻恢复动作；
- 320 px 是否保留任务、状态和主动作；
- 结构是否明显属于 PE Workbench，而非通用后台。

## 5. Workstream C：V5 交互与视觉实施

### C1. 首页

- 主动作：`继续当前任务` 或当前最重要的恢复动作。
- `打开功能` 为次级动作。
- `添加或管理功能` 移入 Admin-only 次级菜单。
- 功能区不再使用 `PE`、`URI` 首字母方块充当图标。
- 同一信息只出现一次；删除重复的健康、版本和来源标签。
- 持续显示安静的 `交互原型 · 模拟数据` 标记。

### C2. 复核工作区

桌面：

- 保留 queue / evidence / decision 三个职责区。
- 当前证据与结论同屏，错误和恢复动作就地出现。
- 删除无信息价值的大面积空白。

移动：

- 只显示一个当前任务。
- 任务切换进入明确的队列抽屉/选择器，不使用隐藏的横向长条。
- 顺序固定为：任务 -> 证据 -> 结论 -> 保存/下一条。
- 保存与下一条使用不遮挡内容的 sticky action bar，并为内容预留等高空间。
- 错误状态、草稿状态和恢复动作保持可见。

### C3. 导航

- 移动底栏必须占据正常布局空间或通过等高 safe-area padding 补偿。
- 不允许 fixed 导航与任何可见内容发生像素交集。
- focus mode 可以隐藏平台导航，但必须保留可理解的返回路径。
- 1440/390/320 都必须用 relation assertion 检查容器边缘和中心。

### C4. 图标

- 使用 Design Skill 已本地化的 Ant Design Iconfont family。
- 尺寸 16/18px，20px optical box，icon/text gap 6px。
- 导航、返回、关闭、导入、错误、成功等使用同一 family。
- 禁止 `‹`、`×`、`↻`、Unicode 对勾、CSS 方块和圆点承担功能图标。
- 保留中文 visible label 和 accessible name。
- manifest 记录 source URL、project、author、license、日期和 SHA-256。

### C5. 语言

- 删除 `PLATFORM`、`PE WORKBENCH` 等装饰英文。
- `pe-partner-crx`、URI、Dataset、DatasetVersion、Sheet、ASR、技术 ID
  通过 `data-locale-exempt` 明确标记。
- 未知 enum 显示中文兜底，原始 code 只保留在数据/证据层。
- `locale` assertion 同时扫描可见文本和 accessible name。

### C6. 颜色

- 蓝色只用于 action、selection、focus。
- green / amber / red 只用于 positive / warning / danger。
- `版本冲突` 不再使用蓝色 info surface。
- SSO 失败、同步失败、授权失效和版本冲突有明确且一致的 severity。
- recovery button 可以是蓝色，但错误容器仍使用语义状态色。

### C7. 字体与密度

- 关键任务文本与正文不低于 16px。
- 密集表格和辅助标签不低于 12px，禁止 10/11px 承担核心信息。
- 只保留一个一级标题和一个主要注意区域。
- 减少重复 panel header、细边框和空白容器。
- 宽屏不通过拉长行宽制造“高级感”；限制内容宽度并提高信息聚合。

## 6. Workstream D：全新生成与证据闭环

### D1. Fresh Generation

- 新建 `redesign-v5/`。
- 只复用 PRD、source extraction、content ledger 和经复核的 requirement。
- 禁止复制 v4 DOM、CSS、组件或截图。
- 使用 Design Skill `operational-product` production system。
- 在 keyframe 通过前不扩展完整页面。

### D2. 必需文件

继续复用现有合同：

- `manifest.json`
- `design-profile.json`
- `execution-plan.json`
- `requirement-verification.json`
- `render-spec.json`
- `render-profile.json`
- `reviewer-record.json`
- `evidence-contract.json`
- `claim-map.json`
- `quality-report.md`

不得新增替代 sidecar。

### D3. Render Matrix

| Viewport | 默认 | 最密 | 错误 |
| --- | --- | --- | --- |
| 1440 | 首页 | 复核工作区 | 同步失败/版本冲突 |
| 390 | 首页 | 复核工作区 | 同步失败/版本冲突 |
| 320 | 首页 | 复核工作区 | 同步失败/版本冲突 |

附加状态：

- 登录默认、SSO 错误、会话过期；
- focus、selected、disabled；
- reduced motion；
- 模拟数据披露可见。

## 7. 验收矩阵

| 能力 | 正向标准 | 负向测试 |
| --- | --- | --- |
| Profile | dashboard profile 与 plan digest 绑定 | 缺 profile 或换 digest 失败 |
| Plan | operational dashboard 必须提供 plan | 仅 manifest 自报 passed 失败 |
| Reviewer | 根目录 Reviewer v4、独立身份、当前 digests | legacy review、缺文件、自审失败 |
| Alignment | edge <=2px；icon center <=1px | 3px/2px 偏移失败 |
| Obstruction | 可见元素交集 0；sticky 区有等高补偿 | fixed nav 覆盖任一内容失败 |
| Locale | 中文 UI；合法豁免明确 | `PLATFORM`、`Admin`、未知 enum 泄漏失败 |
| Icon | 单一 family、本地、授权、名称、fallback | CSS/Unicode、混 family、外链失败 |
| Color | action blue 与 semantic 分离 | 版本冲突使用 info blue 失败 |
| Task focus | 首屏一个主动作；Operator task 优先 | Admin 管理成为唯一主 CTA 失败 |
| Disclosure | 每个模拟业务状态都可见原型标记 | 登录后披露消失失败 |
| Typography | 关键文本 >=16px；辅助文本 >=12px | 10/11px 核心信息失败 |
| Responsive | 1440/390/320 任务顺序完整 | 隐藏横向任务、保存动作不可达失败 |
| Evidence | render/H0/reviewer 引用当前字节 | screenshot-only 或 prose-only 失败 |

## 8. 实施阶段

### P0：堵住误放行

1. Dashboard profile 与 plan 支持。
2. Canonical Reviewer 强制。
3. H0 证据类型与 render profile 绑定。
4. monotonic status。
5. 将 v4 关键缺陷抽象为最小负向 fixture。

退出标准：当前 v4 不再通过 Standard operational release gate。

### P1：方向样片

1. Freeze PRD/content ledger。
2. 生成 A/B 两个独立结构。
3. 输出四类 keyframe。
4. Product & Design 选择方向。

退出标准：首屏主任务、错误恢复和 320px 任务顺序通过。

### P2：完整 V5

1. 从选定 keyframe 扩展完整页面。
2. 接入本地图标、locale、semantic state 和持续披露。
3. 完成核心交互与恢复路径。

退出标准：功能测试、无外部请求、无 console error、无 body overflow。

### P3：Assured 放行

1. 生成完整 render matrix 和 profile。
2. 验证 requirement、truth、function、surface、craft、ownership。
3. 独立 Reviewer v4。
4. Assured evidence contract。
5. 人工复核 1440/390/320。

退出标准：`decision_ready`；不得声称 `user_validated`。

## 9. 测试要求

Design Skill：

```bash
npm test
npm run validate -- --strict
npm run test:strict
node scripts/validate-packed-references.mjs .
```

V5：

```bash
node scripts/design.mjs profile <brief> --artifact-type=dashboard
node scripts/design.mjs plan <request> --design-profile=<profile>
node scripts/run-execution-plan.mjs <plan>
node scripts/design.mjs check <redesign-v5> --profile=assured --execution-plan=<plan>
```

人工复核：

- 1440、390、320 实际尺寸；
- 首页、最密复核、同步失败、版本冲突；
- 图标光学中心和文本 baseline；
- 当前主任务与唯一主动作；
- 模拟数据披露；
- 无覆盖、断字和错误语义色。

## 10. 完成定义

1. v4 当前误放行路径已有自动负向回归。
2. Dashboard 使用同一 profile resolver 和 execution-plan authority。
3. 同一 gate 只有一个权威结果，不接受 manifest 自报覆盖 validator。
4. v5 不复用 v4 DOM/CSS。
5. Operator 的下一步行动是每个页面唯一主要注意区域。
6. 390/320 不存在导航或 sticky action 对内容的像素遮挡。
7. Iconfont 资产本地、单 family、授权和 hash 可追溯。
8. H0 四项由正确 render evidence 证明。
9. Reviewer v4 与 artifact author 独立并绑定当前 digests。
10. 自动化通过后仍完成实际表面人工复核。

## 11. 剩余边界

- 本方案不证明真实 SSO、飞书、URI Provider 或持久化行为。
- 本方案不证明真实用户偏好或任务成功率。
- `decision_ready` 之后仍需真实用户任务观察，才能升级为
  `user_validated`。
