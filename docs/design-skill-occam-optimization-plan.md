# Design Skill 奥卡姆优化方案

> 目标：用最少新增概念，提高 Design Skill 的稳定审美与交付质量
> 状态：P0/P1/P2 已实施并完成全量验收
> 日期：2026-10-10

## 1. 判断

当前问题不是能力少，而是核心路径过长、规则重复、已有扩展点执行不强。

仓库已有 42 个 schema、59 个顶层脚本、16 份 reference，相关代码和文档约 21,000 行。继续增加合同、sidecar 和 validator 会放大维护面。

优化原则：

> 缩短主路径，强化现有结构，删除补偿性验收。

复杂度预算：

- 新 runtime router：0
- 新 artifact sidecar：0
- 新 design system：0
- Reviewer 版本升级：0
- 新公开 CLI 命令：0
- P0 新 theme preset：0
- 新 render assertion family：最多 3
- 新 runtime 文件：原则上 0

超出预算前，必须证明现有扩展点无法解决。

## 2. 删除上一版的过度设计

| 删除 | 复用 |
| --- | --- |
| `operational-ui-contract.schema.json` | product preset 的 `composition`、`media`、`color_direction` |
| `display-label-map.schema.json` | H0 requirement + render assertion |
| 独立 operational validator | `render-smoke`、`validate-color-system`、`validate-visual-review` |
| Reviewer v5 | Reviewer v4 的 `checks` |
| warm/blue 两套系统 | 一个 `operational-product` |
| palette router | `design-profile.mjs` 唯一路由 |
| 六种布局 assertion | 一个通用 `relation` assertion |

## 3. 核心能力只保留五项

1. **Truth**：保护来源、数字、结论和 provenance。
2. **Direction**：从 reader job 生成 Taste Contract 与 profile。
3. **System**：只选择一个 production design system。
4. **Surface**：在 1440/390/320px 检查真实关键状态。
5. **Review**：独立 Reviewer 非补偿放行。

History、knowledge、recipe variations、primitive extraction 和 Assured evidence 均为按需能力，不进入普通 Standard 任务默认路径。

## 4. 10 步流程压缩为 4 步

### Define

合并 Frame 与 Freeze：读者、任务、来源、P0/P1 要求、格式和风险。

输出一个 content ledger、一个 content handoff 和 requirement verification。

### Resolve

合并 Direct、Profile 与 Select：一个 Taste Contract、一个 primary preset、最多一个 supporting preset、一个 design system。

`scripts/lib/design-profile.mjs` 继续是唯一 authority。

### Build

合并 Prototype 与 Compile。方向开放时才比较两个独立结构；方向已知时不强制双方向。

先完成首屏、最密内容、关键错误和窄屏四个 keyframe，再扩展完整页面。

### Verify

合并 Review 与 Handoff：Requirement/Truth、Function、Surface、Craft、Ownership。

Learning 和 knowledge extraction 只在用户明确要求时运行。

## 5. 用现有结构修复四类问题

### 对齐

扩展现有 `composition`，不新增合同：

```json
{
  "grid": "stable operational grid",
  "density": "dense",
  "primary_focus": "workflow state or exception",
  "max_radius_px": 6,
  "edge_tolerance_px": 2,
  "control_heights_px": [32, 40, 44],
  "alignment_policy": "shared page, section, row and icon-text anchors"
}
```

生产系统通过现有 CSS token 落地 page inset、section gap、row inset、control height、icon box 和 icon/text gap，不增加页面级 geometry config。

### 默认中文

不新增 display-label sidecar。运营模式自动产生 H0 requirement：

> 默认 zh-CN；除品牌、技术 ID、原始字段和批准缩写外，不显示英文。

未知 enum 显示中文兜底并记录原始 code，不回退为英文 UI。

Render spec 增加 `locale` assertion；合法豁免使用 `data-locale-exempt` 标记。

### 图标

将现有 `media.icon_policy` 从字符串改为结构化对象：

```json
{
  "family": "iconfont-project",
  "source": "iconfont-local-svg",
  "sizes_px": [16, 18],
  "box_px": 20,
  "text_gap_px": 6,
  "icon_only": "universal-secondary-actions-only",
  "fallback": "visible-label"
}
```

来源优先级：

1. 宿主已有完整图标库；
2. [Iconfont](https://www.iconfont.cn/) 中同一项目或同一风格的授权图标；
3. Lucide 本地图标。

Iconfont 只作为素材获取源：

- 先定义语义清单，再搜索图标；
- 同一 artifact 只选择一个项目/风格，不拼接多个作者的近似图标；
- 下载 SVG 后放入本地 assets，统一 `viewBox`、尺寸、fill/stroke 和 optical box；
- 在现有 `manifest.visual_assets` 或 design-system 资产记录中保存来源 URL、图标名、作者/项目、授权说明、获取日期和文件 hash；
- 授权不明确时禁止交付，回退到 Lucide；
- 禁止运行时引用 Iconfont 在线字体、JavaScript 或 CDN。

一个 artifact 只使用一个 family；禁止 emoji、Unicode 字符和 CSS 方块承担功能图标。

### 配色

当前确定性缺陷是 `operational-dashboard accent == positive`。

P0 只修默认：

- 现有 `operational-dashboard` 改为蓝色冷色；
- blue 负责 action/selection/focus；
- green 只负责 positive；
- warm 不注册新 preset。

建议默认种子：

| surface | panel | text | muted | accent | positive | warning | danger |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `#F3F6FA` | `#FFFFFF` | `#172033` | `#5F6B7A` | `#245EA8` | `#26705A` | `#8A5B00` | `#B33A32` |

Warm 只写入设计指导。至少两个真实任务明确需要、用户明确指定，或品牌 token 已提供时，才评估新增 preset。

## 6. Render Spec 只增加三类 assertion

### `relation`

统一承载 aligned edge、centered within、equal height 和 baseline delta。

### `locale`

检查 visible text、accessible name 和合法豁免。

### `icon`

检查 family、size、box、accessible name、fallback、本地资源和 provenance。

颜色继续由现有 `validate-color-system.mjs` 负责。

## 7. Reviewer v4 直接收紧

不升级 schema 版本，只扩展 v4 `check.id`：

- `alignment`
- `locale`
- `iconography`
- `palette`

当 `experience_mode=operational` 时，`validate-visual-review.mjs` 要求四项存在、passed 且证据有效。

任一 check 失败即不能 approved；craft score 和 ownership 不能补偿。PE Partner 旧 reviewer record 将自然成为负向 fixture。

## 8. 自动产生四条 H0 要求

| ID | Requirement |
| --- | --- |
| `VIS-ALIGN` | 页面、区块、组件和 icon/text 使用声明锚点 |
| `VIS-LOCALE` | 默认 zh-CN，非白名单英文为 0 |
| `VIS-ICON` | 单一 icon family、中文名称和 fallback |
| `VIS-COLOR` | accent 与 semantic 分离 |

写入现有 `requirement-verification.json`，不新增 sidecar。

## 9. CLI 与文档减法

SKILL 主路径只展示：

```bash
node scripts/design.mjs profile
node scripts/design.mjs plan
node scripts/design.mjs check
node scripts/design.mjs preflight
```

render、capture 和独立 validator 移到调试 reference。

文档收敛：

- `execution-path.md` 合入 `workflow.md`
- `philosophy.md` 的硬规则合入 `design-standards.md`
- `advanced-assurance.md` 只在 Assured lane 加载
- `visual-recipes.md` 移出普通路径

普通任务默认最多读取 SKILL + 2 份 reference，每条规则只保留一个权威位置。

## 10. 分期

### P0：关闭误放行

只修改现有 profile、preset、color validator 和 reviewer validator。

退出标准：

- accent 不再等于 positive
- composition 与 icon policy 已结构化
- operational Reviewer v4 必须有四项 checks
- PE Partner 旧 reviewer record 被拒绝
- 0 新 runtime 文件

### P1：真实表面证据

只扩展 render spec、render smoke、operational system builder 和 tests。

退出标准：

- `relation / locale / icon` 可测
- 1440/390/320px 默认、最密、错误状态通过
- Iconfont 来源图标已本地化、授权可追溯且无外部请求
- measured delta 写入 render profile
- 人工光学与整体表面复核通过

### P2：删除与收口

- 合并重复 reference
- SKILL 核心流程降到四步
- 内部命令退出主路径
- warm 达到真实触发条件时再评估

## 11. 验收矩阵

| 能力 | 正向 | 负向 |
| --- | --- | --- |
| Alignment | edge <=2px，icon center <=1px | 偏移 3px/2px 失败 |
| Locale | 中文 UI + 合法豁免 | `auth_required`、`Admin` 泄漏失败 |
| Icon | 单一 family、本地资产、provenance、名称和 fallback | Unicode/CSS 图标、混用项目、外部 CDN、授权缺失失败 |
| Color | blue accent 与 positive green 分离 | accent=positive 失败 |
| Reviewer | 四项 checks 全通过 | craft 4/4 但 check 失败仍拒绝 |
| Responsive | 1440/390/320 当前证据 | 缺一个视口不得 approved |

## 12. 完成定义

1. 新增概念少于删除或合并的概念。
2. PE Partner 四类问题能被现有 profile/render/reviewer 拦截。
3. 同一规则只有一个权威位置。
4. 普通任务主路径从 10 步降到 4 步。
5. 不增加 router、sidecar、design system 或 Reviewer 版本。
6. 自动化不冒充审美和用户验证。
7. Truth、功能与 Assured 能力无回归。
