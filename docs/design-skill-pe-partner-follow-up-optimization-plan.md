# Design Skill 运营产品精美度二期优化方案

> 测试样本：PE Partner 本地网页工程原型
> 范围：对齐、图标、默认中文、暖色/蓝色冷色、Reviewer 误放行
> 状态：已被 `design-skill-occam-optimization-plan.md` 的减法方案取代
> 日期：2026-10-10

## 1. 结论

这次失败不是单纯“颜色选错”或“页面没调齐”，而是 Design Skill 对运营产品缺少一条从设计决策到真实表面验收的完整合同。

原型已经通过来源、功能、响应式和 Reviewer v4，且 composition、typography、color/material、media/art direction、responsive、finish 均获 3/4；用户仍能稳定指出：

1. 页面 block 没有形成统一锚点；
2. icon、文字、状态和控件没有统一居中与对齐；
3. 默认中文界面泄漏大量英文枚举；
4. 缺少功能图标系统；
5. 灰绿色既不属于明确暖色，也不属于蓝色冷色，主强调色又与成功色混用。

因此，当前瓶颈是：

> Design profile 没有输出一个贯通运营界面策略、真实表面证据与 candidate-ready 门禁的 operational UI contract。

二期不新增四套平行规则或两个运营系统，只新增一个必要合同包络：

```text
design brief
  -> existing design-profile resolver
  -> enterprise-saas product preset
  -> operational-ui-contract
       ├─ alignment_geometry
       ├─ locale_display_labels
       ├─ icons
       └─ palette_family_policy
  -> one operational-product system
  -> render-spec measured evidence
  -> reviewer v5 non-compensating subgates
```

## 2. 测试证据

### 2.1 直接证据

- 两张用户截图分别为 `2442 × 1056` 和 `2448 × 1228`。
- 分享页解析到本地原型：
  `/Users/bytedance/Desktop/生服/薅流量/pe_partner-crx/pe_partner/redesign-v2/index.html`。
- 页面同时采用多套独立几何：
  - 页面 padding：`24px 28px 42px`；
  - 工作台：`1.5fr / .86fr`；
  - 数据页：`1fr / 390px`；
  - 用户页：`1.4fr / .75fr`；
  - 复核页：`270px / 1fr / 330px`。
- 控件高度并存 `24 / 32 / 38 / 40 / 42px`，没有密度等级合同。
- 没有图标库或图标 registry；导航使用 CSS 方块，状态使用圆点，返回和关闭使用 `‹`、`×` 字符。
- 可见英文包括 `TableVersion`、`TABLE VERSION`、`ACCESS GRANT`、`available`、`auth_required`、`partial_failed`、`sync_failed`、`Admin`、`Operator`、`Viewer`。
- 当前 palette 以 `#00755e` 青绿为 accent，同时承担主动作、选择、焦点、进度和成功状态。

### 2.2 验收误差

现有 Reviewer v4 只对七个宽 craft dimension 评分。一个维度内部没有非补偿子门，因此：

- “任务主次清楚”补偿了跨区块对齐漂移；
- “中文可读”补偿了英文枚举泄漏；
- “没有装饰图片”被用于证明 media/art direction，却没有检查功能图标；
- “低彩度 + 状态标签”补偿了 accent 与 success 角色冲突；
- 390px 能重排补偿了缺失的 320px 证据和固定导航遮挡。

这不是 Reviewer 没运行，而是 Reviewer 的验收分辨率不够。

## 3. 第一性目标

运营产品的“精美”应满足：

1. **秩序**：页面、区块、组件、图标文字共享可解释的锚点和节奏。
2. **扫描**：图标、中文标签、状态与动作能被快速区分。
3. **语义**：颜色、文字和图标各自承担稳定职责，不泄漏实现枚举。
4. **一致**：一个运营系统覆盖桌面、移动、最密集和异常状态。
5. **可证**：自动化给出 measured delta，人工审查真实表面；两者互不冒充。

成功标准：

| 指标 | 门槛 |
| --- | --- |
| 默认语言 | 普通用户界面非白名单英文展示词为 0 |
| 区块共享边缘 | 声明同组的边缘偏差 `<= 2 CSS px` |
| 图标/文字中心 | 几何偏差 `<= 1 CSS px`，再做人工光学复核 |
| 控件高度 | 仅使用合同声明的 `32 / 40 / 44px` 档位 |
| 图标来源 | 每个 artifact 仅 1 个功能图标 family |
| palette | 每个 artifact 仅激活 warm 或 blue-cool 之一 |
| 色彩职责 | focal token 不与 positive/warning/danger/info 复用 |
| 响应式证据 | 1440、390、320px 全部有当前截图与 measured evidence |
| Reviewer | 四个 operational subgate 全部通过，无分数补偿 |

容差决策：跨区块共享边缘采用 `<= 2 CSS px`，用于吸收响应式分数轨道、
字体栅格化和亚像素舍入；同一控件内部的图标/文字几何中心采用更严格的
`<= 1 CSS px`。合同、render assertion、P1 退出条件和 Reviewer 证据统一
使用这两个值，不再混用。

## 4. 目标合同

### 4.1 Alignment Geometry

#### 页面级

- 每个断点声明唯一 `content-start`、`content-end` 和可选 `secondary-start`。
- 页面标题、页面动作、全宽反馈、主内容与 detail rail 绑定命名锚点。
- 常规页面复用同一壳层；full-bleed 复核页必须显式声明独立壳层。
- 固定导航必须预留安全区和滚动终点，不能遮挡内容或操作。

#### 区块级

- 区块标题、辅助说明、容器边缘、首内容单元共享左锚点。
- 同类区块的标题固定选择框内或框外，不逐页变化。
- 并列区块必须声明对齐关系：标题基线、容器顶边或首内容基线。
- 纵向节奏使用有限档位，不通过任意 margin 修补。

#### 组件级

- 控件高度收敛为：
  - `compact: 32px`
  - `default: 40px`
  - `touch: 44px`
- 同一工具条、按钮组、表格动作区只能使用一档。
- 多行行项按首行轴对齐序号、标题、版本和状态，不按整个文本块居中。
- 表头、单元格、详情字段、标签和值共享 inset 和文本基线。

#### 图标文字级

- 默认 optical box：`20 × 20px`。
- 按钮/表格 glyph：`16px`；主导航 glyph：`18px`。
- 图标文字 gap：`6px`，宽松动作使用 `8px`。
- 单图标命名 optical nudge 最大 `1px`，不改变布局盒。

### 4.2 默认中文 Language Contract

默认 `zh-CN` 覆盖：

- 导航、页面/区块标题；
- 按钮、筛选、表头；
- 状态、角色、空状态、错误、确认、toast；
- `aria-label`、`title` 和导出文案。

必须映射：

| 原值 | 中文展示 |
| --- | --- |
| `available` | 可用 |
| `auth_required` | 需要授权 |
| `partial_failed` | 部分失败 |
| `failed` | 失败 |
| `sync_failed` | 同步失败 |
| `parsing` | 解析中 |
| `active` | 有效 |
| `disabled` | 已停用 |
| `Admin` | 管理员 |
| `Operator` | 操作员 |
| `Viewer` | 只读成员 |
| `TableVersion` | 数据版本 |
| `Sheet` | 工作表 |
| `ACCESS GRANT` | 访问授权 |

允许英文的有限白名单：

- 正式品牌名：如 `PE Partner`；
- 需要复制/追踪的技术 ID：如 `tv_0012`、`v12`、用户标识、插件标识；
- 原始字段：仅在“原始字段/技术详情”区域；
- 批准的行业缩写：如 SSO、URI、ASR、CRX。

未知 enum：

- 普通界面显示“未知状态”；
- 原始 code 进入可观测错误或技术详情；
- 禁止静默回退为英文原值。

### 4.3 Functional Icon Contract

单一来源规则：

1. 宿主已有完整图标库则复用；
2. 否则统一采用 Lucide；
3. 禁止混用 Lucide、字符图标、emoji、CSS 几何图标和第二套线性图标。

必须覆盖：

- 主导航；
- 导入/新增/搜索/筛选；
- 返回/关闭/设置；
- 刷新/重试/导出/删除；
- 成功/警告/失败/阻塞/处理中；
- 表格动作与空状态。

边界：

- 主导航和标准动作：icon + 中文文字；
- 破坏性、陌生、领域专属动作：不可 icon-only；
- icon-only 仅用于高度通用且空间受限的次要动作，必须有中文可访问名称和 tooltip；
- 状态至少使用图标、中文标签、说明中的两种通道；
- 图标缺失时保留文字和操作，不得出现空白按钮。

### 4.4 Warm / Blue-Cool Palette Families

两组 family 属于同一个 `operational-product`，共享组件、模板、几何、语言与图标，只改变角色 token。

#### `operational-blue-cool`

适用于：

- 数据管理、权限、版本、状态监控；
- 高频扫描和异常恢复；
- 状态色密度高，需要与成功绿、警告黄分离。

PE Partner 默认选择 blue-cool。

建议校准种子，非最终批准 token：

| Role | Candidate |
| --- | --- |
| surface | `#F3F6FA` |
| panel | `#FFFFFF` |
| panel_alt | `#EAF0F7` |
| text | `#172033` |
| muted | `#5F6B7A` |
| line | `#D5DEE9` |
| focal | `#245EA8` |
| focal_hover | `#1B4A85` |
| positive | `#26705A` |
| warning | `#8A5B00` |
| danger | `#B33A32` |
| info | `#0F7180` |

#### `operational-warm`

适用于：

- 人际协作、内容复核、案例处理；
- 状态色密度低到中等；
- 目标气质偏亲近、稳重、有人情味。

避免用于 warning/danger 高频并置且无法与 focal 分离的界面。

建议校准种子，非最终批准 token：

| Role | Candidate |
| --- | --- |
| surface | `#F7F4EF` |
| panel | `#FFFDF9` |
| panel_alt | `#EFE9E1` |
| text | `#24211E` |
| muted | `#6E665E` |
| line | `#D9D1C7` |
| focal | `#9C4F32` |
| focal_hover | `#823C25` |
| positive | `#26705A` |
| warning | `#8A5B00` |
| danger | `#B33A32` |
| info | `#315F8C` |

以上候选在基础 surface/panel 配对上达到 `4.5:1`，但仍需验证 focus、selected、disabled、error、success、overlay、chart 和真实浏览器状态。

## 5. Reviewer v5

新候选使用 `design-reviewer-record/v5`；v4 仅保留历史可读性。

保留七个 craft dimension，但运营产品新增恰好四个非补偿 subgate：

1. `alignment-geometry`
2. `locale-display-label`
3. `icon-system`
4. `palette-role-separation`

规则：

- 四项均为 required，不允许 `not_applicable`；
- 每项必须绑定当前 artifact digest 的 measured evidence 与截图；
- 缺失、重复、失败、证据过期均阻止 candidate-ready；
- 任一 subgate 失败时，相关 craft dimension 最高 `2/4`；
- 总分、平均分、ownership 高分不能补偿；
- Reviewer v4 可历史读取，但不能批准新的 candidate-ready artifact。

对 PE Partner 现有评分的反审计：

| Dimension | 当前 | 重新判断 |
| --- | --- | --- |
| composition | 3 | 最高 2，直至四级对齐通过 |
| typography | 3 | 最高 2，直至默认中文通过 |
| color/material | 3 | 最高 2，直至 family 与角色分离通过 |
| media/art direction | 3 | 最高 2，直至功能图标系统通过 |
| responsive | 3 | 证据不足；缺少 320px 且存在固定导航风险 |
| finish | 3 | 最高 2，直至控件尺寸与光学居中通过 |
| world coherence | 3 | 最高 2，直至四项形成一个系统 |

## 6. 工程落点

### P0：合同与单一路由

新增：

- `schemas/operational-ui-contract.schema.json`
- `schemas/display-label-map.schema.json`

修改：

- `schemas/design-brief.schema.json`
- `schemas/design-profile-catalogue.schema.json`
- `schemas/design-profile.schema.json`
- `design-systems/defaults/design-profile-catalogue.json`
- `assets/themes/presets.json`
- `scripts/lib/design-profile.mjs`
- `scripts/validate-color-system.mjs`
- `scripts/build-production-design-systems.mjs`
- `schemas/reviewer-record.schema.json`
- `scripts/validate-visual-review.mjs`
- `scripts/validate-evidence-contract.mjs`
- `tests/visual-review.test.mjs`
- `tests/evidence-contract.test.mjs`

决策：

- 只新增一个 operational contract；
- `design-profile.mjs` 继续是唯一 authority；
- warm/blue-cool 为同一系统的 token family；
- blue-cool 为 enterprise-saas 默认，warm 只能显式选择；
- unknown family fail closed；
- focal 与 semantic token 相同直接失败。
- `design-reviewer-record/v5` 四个 operational subgate 在 P1 开始前强制生效；
- v4 仅历史可读，不能批准新的 candidate-ready。

P0 退出：

- 相同输入稳定解析为一个 contract 和一个 family；
- secondary preset 不能覆盖；
- 仓库仍只有一个 `operational-product`；
- 两组 token 通过 color contract；
- v5 缺失、重复、失败或证据不足时 candidate-ready fail closed；
- profile 正负测试通过。

### P1：真实表面自动证据

前提：P0 的 Reviewer v5 已 fail closed，P1 不存在继续使用 v4 误放行的窗口。

扩展现有 `render-spec/v2` assertion，不增加新 sidecar：

- `aligned_edges`
- `centered_within`
- `equal_height`
- `baseline_delta`
- `display_labels`
- `icon_contract`

修改：

- `schemas/render-spec.schema.json`
- `scripts/render-smoke.mjs`
- `scripts/compile-execution-plan.mjs`
- `scripts/run-execution-plan.mjs`
- `scripts/validate-operational-ui-contract.mjs`

先只使用一个最密集运营 fixture，覆盖：

- 默认；
- 最密内容；
- 授权/同步错误；
- focus/selected/disabled；
- 1440/390/320px。

P1 退出：

- render profile 记录实际 delta，不只记录 pass/fail；
- 四类 negative fixture 可稳定失败；
- 自动检查结果不标记为 aesthetic pass 或 user validation；
- 人工检查确认几何、光学中心和整体气质。

### P2：迁移、文档与历史兼容收口

修改：

- `references/media-design.md`
- `references/color-system.md`
- `references/quality-bar.md`
- `design-systems/operational-product/DESIGN.md`
- `design-systems/operational-product/USAGE.md`

P2 退出：

- 代表 fixture 通过后再迁移受维护的运营资产；
- 新候选流程不再依赖 v4，历史 artifact 保持可读取；
- `npm test`、strict validation、package closure 全部通过；
- 所有受维护表面具备 1440/390/320px 人工记录。

## 7. 测试矩阵

| 领域 | 正向 | 负向 |
| --- | --- | --- |
| Profile | warm/blue-cool 确定性解析 | unknown family、secondary override |
| Alignment | edges <=2px，center <=1px | detail rail 偏移 3px、icon 偏移 2px |
| Controls | 32/40/44px 合同档位 | 未声明的 38px 控件 |
| Language | enum 全部中文映射 | 泄漏 `auth_required`、缺失 map、伪造豁免 |
| Icons | 单一 family、可访问名称、fallback | 混用 family、字符图标、emoji、空白按钮 |
| Color | 两 family 对比度和角色分离 | accent=positive、family 元数据与 hue 不符 |
| Reviewer | 四子门全部通过 | 总分 4 但任一子门失败仍拒绝 |
| Responsive | 1440/390/320 全状态 | 固定导航遮挡、中文增长后裁切 |

## 8. 明确删除与推迟

删除：

- 四个独立 policy router；
- 两套 operational component/template system；
- 页面级随机暖/冷换肤；
- 逐页 margin 和字符串替换补丁；
- 更多加权平均分；
- 用通用 screenshot diff 代替关系测量；
- 用 ASCII 正则粗暴判定语言；
- 把 SVG 数量当作图标质量。

推迟：

- 全量模板迁移；
- 第三种 palette family；
- 非运营 profile 全局化；
- 暖/冷盲测偏好结论；
- 自动审美评分；
- 通用 OCR 或计算机视觉验收平台。

## 9. 风险

| 风险 | 控制 |
| --- | --- |
| operational contract 变成配置垃圾桶 | 只允许四个闭合部分，禁止 artifact selector |
| 图标增多造成噪声 | 只覆盖稳定隐喻和高频扫描任务 |
| 中文增长造成窄屏回归 | locale、icon、geometry 在同一最密 fixture 联合验证 |
| 暖色与 warning/danger 混淆 | 状态密度作为准入条件；不能分离则拒绝 warm |
| 蓝色默认被误认为用户偏好 | 标记为可逆产品判断，不标记 user validated |
| 自动几何通过但光学仍差 | measured delta 后继续 100%/200% 人工检查 |
| v5 暂时阻塞 candidate-ready | 预期 fail closed；先打通一个代表 fixture |

## 10. 专项完成定义

只有以下全部成立，才能宣称本轮优化已实现：

1. 单一 operational UI contract 已接入现有 profile。
2. warm 与 blue-cool 共用一个 operational system。
3. 默认中文与有限英文白名单可自动验证。
4. 单一图标 family、尺寸、对齐和 fallback 可验证。
5. 1440/390/320px 的最密和错误状态通过。
6. Reviewer v5 四项子门全部有当前证据并通过。
7. PE Partner 同内容 candidate 通过独立视觉复审。
8. 未开展用户测试时，不宣称偏好或任务效率已改善。

## 11. 证据边界

**已验证**

- 用户截图中的四类缺陷；
- 原型源码、token、DOM 文案和几何实现；
- Reviewer v4 已批准但未识别这些缺陷；
- 当前 Design Skill 缺少 alignment、locale 与 icon 的结构化 contract。

**推断**

- 单一 operational UI contract 是当前成本最低的系统性修复。
- PE Partner 的高状态密度更适合 blue-cool 默认。

**未验证**

- 真实用户更偏好 warm 还是 blue-cool；
- 新合同实施后的任务效率或返工率改善；
- 所有运营页面都存在同等严重度缺陷。
