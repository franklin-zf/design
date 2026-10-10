# Design Skill 精美度优化专项方案

> 状态：Phase 0-4 已实施；Phase 5 感知校准待完成
> 日期：2026-10-09
> 基线：当前已安装 `~/.trae-cn/skills/design`，并参考工作区既有优化方案
> 目标：提升 Design 产物的内容专属性、视觉完成度和可感知品质，同时补齐产品需求逐项验收

## 1. 结论

Design 当前已经具备较强的事实保真、风险分级、真实表面检查和审查证据能力，但“精美”仍主要依赖模型临场发挥。现有流程善于阻止错误，却不足以稳定地产生强概念、强构图、强素材和完整视觉世界。

本专项不应继续增加零散禁止项，而应补齐一条正向生产链：

```text
产品需求
  -> 内容与体验目标
  -> 创意母题
  -> 两个结构不同的方向
  -> 关键页面样片
  -> 视觉系统与素材计划
  -> 全量实现
  -> 需求逐项验收
  -> 视觉完成度验收
  -> 用户感知证据
```

专项只新增一个必要 sidecar：`requirement-verification.json`。其他信息优先扩展现有 `design-brief`、`direction-comparison` 和 `reviewer-record`，不建立第二套 planner、runner 或发布状态机。

## 2. 第一性目标

### 2.1 “精美”的操作性定义

精美不是装饰数量，而是以下四项同时成立：

1. **内容专属性**：换一份内容后，核心构图、素材和视觉母题不能原样复用。
2. **视觉完成度**：构图、排版、色彩、素材、动效和细节属于同一个视觉世界。
3. **体验适配**：品牌展示、运营后台、数据报告和汇报演示使用不同的表达强度。
4. **需求完整性**：所有 P0/P1 产品需求都能从原文追溯到实现状态和验收证据。

事实正确、功能可用、无障碍和无阻塞仍是硬门槛。视觉高分不能抵消任何硬门槛失败。

### 2.2 专项成功标准

| 指标 | 专项门槛 |
| --- | --- |
| P0/P1 产品需求覆盖 | 100% 有来源、验收方法、状态和证据 |
| P0/P1 未通过项 | 0；`failed` 或 `not_run` 均阻止 ready |
| 方向探索 | 开放式 Standard/Assured 任务必须有 2 个结构不同的方向 |
| 关键样片 | 全量实现前完成首屏、最密页、关键状态、窄屏四类样片 |
| 表面缺陷 | 无内容遮挡、裁切、溢出、空素材、断裂状态 |
| 视觉审查 | 所有适用工艺维度至少达到 3/4，无 0/1 分 |
| 感知验证 | 先建立基线；校准后采用三秒回忆和盲测偏好门槛 |
| 跨体裁有效性 | 至少在品牌体验、运营界面、报告/演示三类任务上通过试点 |

当前端到端审美、偏好和返工基线尚未建立，初始值必须记为 `unknown`，不能假定已有提升。

## 3. 标杆研究结论

### 3.1 从 Muzli 样本提炼的方法

对用户给出的 Muzli Projects 页面及 Alt Shift、Emotion Agency、SL24、DesignUp X 样本的观察显示，高完成度项目通常不是“更丰富的组件库”，而是以下能力的组合：

- **一个清楚的创意母题**：例如实体化字标、工业物流、记忆物件，不是“现代、简洁、高级”。
- **一个视觉主角**：产品、人物、空间、3D 对象、摄影或强排版在首屏占据主导。
- **统一的世界观**：字体、网格、材质、色彩、光照、动效和文案语气共同表达同一概念。
- **跨区段节奏**：页面在尺度、密度、留白、方向和媒介之间有控制地变化。
- **动效承担叙事**：滚动、过渡和 3D 用于状态、空间或故事推进，而不是统一淡入。
- **微观完成度**：导航、控件、标签、裁切、边缘、响应式和静态降级都保持同一质量。

这类项目可作为“完成度和内容专属性”的标杆，但不能成为所有产物的风格模板。Muzli 的品牌与作品集样本强调记忆点，运营后台更应强调任务效率和状态清晰。

### 3.2 外部评审标准的共同信号

Awwwards 将网站评价拆为设计、可用性、创意和内容四项，且设计与可用性权重最高。[cite:2] Webby 的网站标准同时检查内容、结构与导航、视觉设计、功能、交互和整体体验。[cite:3] 这说明“精美”不能只用截图观感判断，必须覆盖结构、功能与体验。

Playwright 官方提供稳定截图后的视觉比较能力，适合捕获回归，但视觉 diff 只能证明变化或稳定，不能证明审美优秀。[cite:4] WCAG 2.2 的可感知、可操作、可理解、健壮四项原则继续作为硬门槛。[cite:5] Nielsen 的启发式规则可补足系统状态、现实匹配、用户控制、一致性、错误预防和极简设计等交互检查。[cite:6]

## 4. 当前系统诊断

### 4.1 已有优势

- `Taste Contract` 已要求视觉论点、内容张力、记忆点、反参考和克制规则。
- `design-profile/v2` 已能按 reader job、关系类型、体裁和风险选择产品预设。
- `direction-comparison` 已要求两个同尺寸方向及差异证据。
- Truth、Utility、Taste、Surface 四道门已形成非补偿式质量底座。
- 三秒回忆、盲测偏好、真实表面和独立 Reviewer 已有数据结构。
- Playwright 截图、窄屏、人因、来源、数字和声明验证已经具备较强基础。

### 4.2 关键缺口

| 缺口 | 当前证据 | 直接后果 |
| --- | --- | --- |
| 语义配置强、实际物料弱 | 6 个产品预设，但生产级设计系统主要集中在 Swiss deck | 路由能说清方向，渲染仍回到中性模板 |
| 组件目录偏合同、缺少实现 | 多数已登记组件 `source_code_included=false` | 难以稳定产出素材、空间和动效主导的体验 |
| 方向比较可能共享同一 DOM | 当前预览工具以替换 CSS 为主 | 可验证配色差异，难以证明构图和叙事真正不同 |
| 关键样片门缺失 | 要求“先看关键页”，但没有强制状态与证据 | 全量实现后才发现方向弱，返工成本高 |
| 视觉审查过于二值 | `visual_qa: manual_reviewed` 可表达已审查，缺少锚定评分 | “看过”不等于达到商业完成度 |
| 感知评价尚未校准 | evaluation policy 为 `calibration_required` | 通过状态缺少统一阈值，无法稳定比较版本 |
| 产品需求验收过浅 | `acceptance_metrics` 只检查 id、label、source_ref 和 HTML marker | 不能证明功能、状态、响应式和设计要求逐项满足 |
| Showcase 为空 | 示例明确是 validator fixture，不是审美证明 | 缺少可复用的高质量正例和基线 |
| 工作区与已安装版本分叉 | 工作区 `SKILL.md` 与已安装 Skill 差异较大 | 后续实现容易改错基线或遗漏新能力 |

### 4.3 根因

当前系统的主链是“内容合同 -> 模板/预设 -> 完整实现 -> 验证”。缺少两个中间层：

1. **创意翻译层**：把内容张力翻译成视觉母题、主角、材质、排版和动效语法。
2. **关键样片层**：在全量实现前，用真实内容证明方向能覆盖首屏、密集内容、关键状态和窄屏。

因此，优化重点不是再扩充抽象风格词，而是把创意和完成度变成可观察的中间产物。

## 5. 目标架构

```text
H0 Requirement
  产品需求、优先级、验收标准、非目标

H1 Truth
  内容账本、数字、声明、来源和计算

H2 Experience
  受众、任务、场景、期望感受、成功动作

H3 Art Direction
  创意母题、视觉主角、排版、材质、媒体、动效语法

H4 Keyframes
  两个方向、四类关键样片、真实内容和真实资产

H5 Build
  设计系统、组件、全量页面、状态和响应式

H6 Acceptance
  需求证据、功能、表面、工艺、独特性和感知验证
```

H0 是新增的产品需求输入层，不替代现有 H1-H5 设计层级。它只负责回答“承诺了什么、如何证明”，并在 Reviewer 阶段闭环。

## 6. 新 SOP

### 6.1 阶段 0：基线对齐

**动作**

- 明确工作区源码与已安装 Skill 的唯一开发基线。
- 对 `SKILL.md`、schemas、scripts、references 和 assets 做版本差异清单。
- 冻结 6 个代表性任务的当前产物、截图、耗时和评审结果。

**输出**

- 基线版本和 digest。
- 3 类体裁各 2 个基线任务。
- 当前缺陷与返工记录。

**停止条件**

- 源码基线不唯一。
- 基线产物不可复现。

### 6.2 阶段 1：产品需求合同

把输入需求拆为：

- `functional`：功能和行为；
- `content`：必须出现的内容和声明；
- `visual`：品牌、风格、素材和层级要求；
- `interaction`：状态、反馈、导航和控制；
- `responsive`：桌面、移动、窄屏和打印；
- `accessibility`：键盘、语义、对比度和降级；
- `performance`：加载、动效和资源预算；
- `delivery`：格式、路径、可编辑性和兼容性。

每条需求必须记录来源、优先级、验收标准和允许的证据类型。模糊的“高级”“精美”“有冲击力”不能直接成为 pass/fail 标准，必须改写为可观察的构图、素材、记忆点或感知目标。

### 6.3 阶段 2：体验与创意简报

在现有 `design-brief` 中补充：

- `experience_mode`：`operational | editorial | expressive | immersive`；
- `desired_impression`：2-3 个可观察印象；
- `anti_impression`：不应产生的感受；
- `primary_subject`：必须成为视觉主角的对象；
- `memory_target`：用户离开后应记住什么；
- `reference_distance`：参考只允许借用方法、结构或工艺，不复制表达。

输出一句体验命题：

> 让【受众】在【场景】中，通过【视觉/交互主角】快速感知【核心价值】，并完成【关键动作】。

### 6.4 阶段 3：参考拆解

每个外部参考只能承担明确角色：

| 角色 | 可借用 | 禁止借用 |
| --- | --- | --- |
| 内容拓扑 | 信息组织、章节节奏 | 原文、事实、品牌主张 |
| 视觉语言 | 比例、网格、排版关系 | 商标、具体图形和整套造型 |
| 媒体策略 | 摄影、3D、图表或素材角色 | 未授权素材 |
| 交互策略 | 状态、空间和过渡方法 | 无任务价值的整套效果 |

参考板必须写清“借什么、为什么适合、在哪些边界内使用、如何保持距离”。不以“像某网站”为方向结论。

### 6.5 阶段 4：创意母题

每个方向必须回答六个问题：

1. 核心张力是什么？
2. 用什么视觉隐喻或结构把张力变得可见？
3. 什么对象是视觉主角？
4. 字体、网格、色彩和材质如何支持它？
5. 动效或交互承担什么语义工作？
6. 删除哪三种常见做法以保持辨识度？

禁止用“现代、简约、高级、科技感、国际化”作为母题。这些词只能描述结果，不能指导构图。

### 6.6 阶段 5：两个真实方向

两个方向必须使用同一内容账本和同一需求集合，但分别拥有：

- 独立 DOM 或独立幻灯片结构；
- 不同的信息层级或空间拓扑；
- 不同的主视觉机制；
- 各自真实的字体、素材和响应式策略；
- 同尺寸预览和同一评审问题。

仅改变颜色、圆角、阴影、字体或背景，不构成第二方向。

### 6.7 阶段 6：关键样片门

全量实现前只制作四类样片：

1. **第一视口/封面**：验证视觉主角、价值和下一段线索。
2. **最密内容页**：验证长文、表格、图表或复杂信息。
3. **关键交互/业务状态**：验证默认、加载、空、错误、成功或选中状态。
4. **窄屏/小屏**：验证重排，而不是桌面缩小。

关键样片必须使用真实内容、真实字体和最终级素材。占位块不能用于方向批准。

### 6.8 阶段 7：系统编译

批准方向后再编译：

- 排版角色和中英文 fallback；
- 网格、容器、间距、比例和页面节奏；
- 颜色、材质、光照和图片处理规则；
- 组件状态和交互反馈；
- 动效语法、时序和 reduced-motion；
- 图表、图标、摄影、3D 和示意图边界；
- 桌面、移动、打印/PPT 等表面映射。

Token 只能稳定实现，不能替代创意方向。

### 6.9 阶段 8：全量实现

- 从已批准关键样片扩展，不从空模板重新拼装。
- 每个区段标记 reader job 和视觉节奏角色。
- 每个素材和动效标记内容任务。
- 每次结构调整重新检查完整需求覆盖和真实表面。

### 6.10 阶段 9：双轨验收

**轨道 A：产品需求验收**

- 按 `requirement-verification.json` 逐项检查。
- 每条 P0/P1 必须有可读取证据。
- `failed`、`blocked`、`not_run` 均阻止 ready。

**轨道 B：设计质量验收**

- 先检查 Truth、Utility、Surface 硬门槛。
- 再做工艺评分、独特性检查和感知验证。
- Reviewer 必须基于真实截图、真实状态和注释证据，不接受 Designer 自述。

### 6.11 阶段 10：学习

只有经过独立审查并得到真实偏好或任务证据的项目，才可提炼为候选案例。提炼对象优先是：

- 内容到构图的映射方法；
- 媒体和动效的适用边界；
- 容易复发的失败模式；
- 经验证的 primitives。

不得把整页 DOM/CSS、品牌资产或单一视觉风格自动提升为模板。

## 7. 设计规则与范式

### 7.1 构图

- 每个表面只有一个主导区域，但整页不能只有“标题加卡片”一种节奏。
- 用尺度、位置、裁切、留白、方向和重叠关系建立层级，再使用边框和阴影。
- 品牌/作品集允许一个边界突破；后台和报告保持稳定基线。
- 连续区段应在密度、方向或媒介上形成节奏，不得连续复制同构卡片。
- 第一视口必须出现真实产品、对象、人物、场景或明确的核心证据。

### 7.2 排版

- 先定义展示字、正文、数据、标签、来源和控件六类角色。
- 展示字体承担人格，正文字体承担持续阅读；不得用多字体制造假层级。
- 大标题只用于真正的主场景，工具面板、卡片和侧栏保持紧凑。
- 控制行长、断句、中文孤字和数字单位绑定。
- 字体替换后重新检查换行、遮挡和节奏。

### 7.3 色彩与材质

- 色彩先承担结构、品牌、状态或数据任务，再承担氛围。
- 允许内容驱动的强色，但禁止平均涂抹到所有容器。
- 材质必须和主题相关，例如纸张、金属、玻璃、织物或屏幕，不做无意义拟物。
- 背景、图片和文字必须在真实叠加状态下验证对比度。

### 7.4 媒体

- 品牌/对象型页面优先展示真实对象和真实状态，不用模糊氛围图替代。
- 关系、流程、数据和精确结构使用图表、SVG、Mermaid 或代码生成几何。
- 摄影、3D、生成图和截图必须分别记录来源、用途、真实性和 fallback。
- 图像裁切应在桌面和移动端单独导演，不使用一个 `object-fit` 规则解决所有场景。

### 7.5 动效

- 动效只承担状态、方向、顺序、空间、反馈或品牌节奏。
- 一个体验只保留一种主运动语法，禁止所有元素统一 fade-up。
- 首屏动效必须有稳定静态首帧；核心信息不等待动画才能出现。
- 支持 reduced-motion，并验证其不是“全部消失”。
- 连续 WebGL、视频和大图序列必须有资源预算和低性能降级。

### 7.6 响应式

- 响应式优先级是重排、替换、裁切和降级，不是等比缩小。
- 固定格式元素使用稳定宽高、比例和轨道约束。
- 移动端重新判断视觉主角和阅读顺序，不机械保留桌面左右结构。
- 长词、数字、表格、图例、控件和键盘焦点必须单独检查。

### 7.7 体裁边界

| 体裁 | 应强化 | 应克制 |
| --- | --- | --- |
| 品牌/作品集 | 视觉母题、真实媒体、空间、节奏、记忆点 | 运营卡片、解释性 UI、均匀模块化 |
| SaaS/后台 | 任务效率、状态、扫描、比较、错误恢复 | 沉浸式 hero、连续大动效、装饰性 3D |
| 报告/研究 | 阅读节奏、证据、批注、来源、结论 | 大量控件、空泛视觉、无问题的图表 |
| Deck/PPT | 叙事弧、远距可读、页面节奏、记忆锚点 | 网页式滚动、密集小字、每页同构 |

## 8. 产品需求对照验收

### 8.1 新增唯一 sidecar

新增 `requirement-verification.json`：

```json
{
  "schema_version": "design-requirement-verification/v1",
  "source_refs": ["prd.md"],
  "requirements": [
    {
      "id": "REQ-001",
      "type": "interaction",
      "priority": "P0",
      "source_quote": "用户可以在移动端完成筛选并看到已选条件",
      "acceptance_criteria": [
        "320px 和 390px 可打开筛选",
        "选择后有可见状态",
        "刷新后按产品要求保留或清除"
      ],
      "surface_states": ["mobile-default", "mobile-filter-open", "mobile-filter-applied"],
      "verification_method": "browser-test",
      "evidence_refs": [
        "qa/mobile-filter.spec.json",
        "qa/mobile-filter-applied.png"
      ],
      "status": "passed",
      "reviewer": "independent-reviewer"
    }
  ],
  "coverage": {
    "p0_p1_total": 1,
    "p0_p1_with_evidence": 1,
    "p0_p1_passed": 1
  }
}
```

### 8.2 验收方法

| 需求类型 | 首选证据 |
| --- | --- |
| 功能/交互 | 浏览器操作记录、断言、状态截图 |
| 内容/声明 | DOM marker、内容账本和 source quote |
| 视觉 | 目标表面截图、注释区域、Reviewer 结论 |
| 响应式 | 声明视口矩阵截图和布局审计 |
| 无障碍 | 键盘路径、语义检查、对比度和 reduced-motion |
| 性能 | 可复现的加载、资源和动画预算记录 |
| 交付 | 文件存在、格式、打开能力和目标播放器证据 |

### 8.3 强制规则

- Requirement id 在来源、实现、测试和 Reviewer 记录中保持稳定。
- 每个 P0/P1 需求必须有 `source_quote` 或已绑定的来源定位。
- `passed` 必须绑定当前 artifact digest 和证据文件。
- 截图只能证明可见状态，不能独自证明完整交互。
- 自动测试只能证明断言，不独自证明视觉质量。
- 任何需求变更都使受影响证据过期，并触发增量重验。
- 未明确承诺的事项记录为 non-goal，避免 Reviewer 擅自扩张范围。

## 9. 视觉质量模型

### 9.1 非补偿式 Gate

| Gate | 内容 | 通过条件 |
| --- | --- | --- |
| G0 Requirement & Truth | 需求、来源、数字、声明、计算 | P0/P1 100% 覆盖且无失败 |
| G1 Function & Usability | 核心流程、状态、导航、反馈 | 关键任务可完成，无阻塞 |
| G2 Surface | 遮挡、裁切、溢出、资源、响应式 | 声明表面无 major/blocking |
| G3 Craft | 构图、排版、色彩、媒体、动效、细节 | 每个适用维度至少 3/4 |
| G4 Ownership | 内容专属性、统一世界观、记忆点 | 无通用模板感；能解释为何属于当前内容 |
| G5 Perception | 三秒回忆、盲测偏好、真实用户证据 | 按校准后的策略执行 |

任何前置 Gate 失败，后续高分都不能放行。

### 9.2 工艺评分锚点

每项采用 0-4 分：

- `0`：缺失或严重错误；
- `1`：可见缺陷，明显影响理解或完成度；
- `2`：基本可用，但模板感、节奏或细节明显不足；
- `3`：商业可交付，结构统一，细节完整；
- `4`：内容专属、完成度高、在目标体裁中具有明确辨识度。

评分维度：

1. composition；
2. typography；
3. color/material；
4. media/art direction；
5. motion/interaction；
6. responsive/adaptation；
7. finish/micro-detail。

`motion/interaction` 在静态产物中可记为 `not_applicable`，不得为了得分强加动效。

### 9.3 Reviewer 证据要求

Reviewer 的每个低于 3 分或每个 major finding 必须包含：

- 当前 artifact digest；
- 页面、视口和状态；
- 截图或目标播放器证据；
- 标注区域或 DOM/slide locator；
- 对应规则或 reader job；
- 最小修复建议。

仅写 `manual_reviewed` 不足以证明通过。

### 9.4 感知校准

先执行 6-12 个基线任务，收集：

- 三秒回忆：reader job、主结论、关键动作；
- 同内容 baseline/candidate 盲测偏好；
- 评审者类型和样本量；
- 任务完成、误解和主要负面原因。

在完成校准前，结果用于比较和诊断，不设置伪精确的全局阈值。校准后再更新 `evaluation-policy.json`，并按体裁设置门槛，不能用品牌站阈值评价运营后台。

## 10. 数据结构与工具改造

### 10.1 复用与扩展

| 现有对象 | 改造 |
| --- | --- |
| `design-brief.schema.json` | 增加 experience mode、desired impression、primary subject、memory target |
| `direction-comparison.schema.json` | 升级 v2，允许独立结构、母题、视觉主角、媒体和动效语法 |
| `reviewer-record.schema.json` | 增加工艺评分、截图注释、需求验收摘要 |
| `design-evaluation-policy` | 完成按体裁校准，不再长期停留在 `calibration_required` |
| `execution-plan` | 加入 requirement gate、keyframe gate 和失效依赖 |
| `quality-bar.md` | 明确 G0-G5 非补偿式规则和评分锚点 |

### 10.2 新增最小能力

1. `schemas/requirement-verification.schema.json`
2. `scripts/validate-requirement-verification.mjs`
3. `scripts/capture-keyframes.mjs`
4. `scripts/validate-visual-review.mjs`
5. `tests/requirement-verification.test.mjs`
6. 三类体裁的正反 fixtures

### 10.3 方向预览升级

当前替换 CSS 的方式保留为快速色彩/材质比较。涉及构图差异时改为：

```text
directions/
├── direction-a/index.html
├── direction-b/index.html
├── shared/content-ledger.json
└── qa/
    ├── direction-a-desktop.png
    └── direction-b-desktop.png
```

Validator 同时检查：

- 内容账本 digest 相同；
- 两个方向 DOM/slide 结构独立；
- 预览尺寸相同；
- 结构差异达到最低可观察范围；
- must-keep 内容覆盖一致；
- 不因方向差异改变事实或功能需求。

## 11. 生产能力建设

### 11.1 从“预设”升级到“可实现系统”

优先补齐三套 production-grade 表达系统，而不是继续新增风格名：

1. **Expressive Web**
   品牌、产品、作品集和活动体验；包含沉浸首屏、真实媒体、章节过渡、空间层级和降级策略。
2. **Operational Product**
   SaaS、CRM 和后台；包含导航、数据密度、状态、批量操作、筛选、空错加载和移动端任务流。
3. **Editorial Evidence**
   报告、研究和叙事型数据；包含章节、边注、引文、图表、来源、目录和打印。

每套系统必须同时包含 tokens、layouts、implemented primitives、states、sample content、responsive evidence 和 usage boundary。

### 11.2 Primitives 优先级

P0：

- image-led hero / product-stage；
- editorial chapter / pull-quote / annotated figure；
- metric narrative / comparison / evidence band；
- operational navigation / filter / table / state panel；
- media transition / semantic reveal；
- responsive crop / art-directed picture。

P1：

- Three.js/Canvas 场景外壳及静态 fallback；
- scroll scene 和章节进度；
- typed motion presets；
- richer diagram and data-story primitives。

所有 primitives 必须先有内容任务和体裁边界，再进入 registry。

## 12. 实施路线

### Phase 0：基线和源码对齐

**工作量：1-2 天**

- 选择唯一源码基线。
- 建立 6 个代表性 baseline。
- 固定当前截图、digest、耗时和缺陷。

**退出标准**

- 基线可复现。
- 工作区与已安装版本差异已分类。

### Phase 1：需求验收闭环

**工作量：3-5 天**

- 增加 requirement schema、validator、execution gate 和 tests。
- Reviewer record 绑定需求覆盖。
- 用现有三类 fixture 验证 pass/fail/not-run/过期证据。

**退出标准**

- P0/P1 需求缺证据时 fail closed。
- 任一 artifact 变更会使关联验收证据失效。

### Phase 2：创意方向与关键样片

**工作量：5-7 天**

- 扩展 brief 和 direction comparison v2。
- 支持独立结构方向。
- 增加关键样片 capture 和批准门。

**退出标准**

- 两个方向不能通过换色伪装。
- 未通过关键样片门不能进入全量实现。

### Phase 3：视觉工艺验收

**工作量：3-5 天**

- 扩展 Reviewer schema。
- 增加 0-4 锚定评分和截图注释。
- 建立 G0-G5 非补偿式 release rule。

**退出标准**

- `manual_reviewed` 无证据不能放行。
- 工艺低分可以定位到页面、状态和修复动作。

### Phase 4：三套生产表达系统

**工作量：2-3 周**

- 先实现 Expressive Web 最小纵切。
- 再实现 Operational Product 和 Editorial Evidence。
- 每套只做 5-8 个高复用 primitives，避免组件堆积。

**退出标准**

- 每套均有完整真实样例、桌面/移动、状态、降级和独立审查。
- 不再只有 Swiss deck 一条成熟生产路径。

### Phase 5：评估校准与发布

**工作量：1-2 周**

- 对 6-12 个基线任务做同内容 A/B。
- 收集设计师、人类目标用户和模型面板的分层证据。
- 校准不同体裁的三秒回忆和盲测门槛。
- 更新 evaluation policy 和 showcase registry。

**退出标准**

- 至少三类体裁均有 baseline-relative 改善证据。
- 不把模型面板冒充人类或用户验证。

## 13. 试点设计

| 体裁 | 任务 | 核心考察 |
| --- | --- | --- |
| 品牌体验 | 产品官网首屏 + 2 个区段 | 母题、视觉主角、节奏、动效 |
| 作品集 | 项目详情页 | 媒体导演、叙事、记忆点 |
| SaaS | 高频运营页 | 扫描、状态、批量操作、响应式 |
| 数据看板 | 异常诊断页 | 证据、层级、可操作性 |
| 研究报告 | 长文 + 图表 | 阅读节奏、引用、图表和打印 |
| Deck | 8-10 页决策汇报 | 叙事弧、远距可读、页面变化 |

每个试点使用同一份内容和需求生成 baseline/candidate。盲评时隐藏版本来源，允许平局，并记录不喜欢的具体原因。

## 14. 专项验收

专项只有在以下条件全部满足时才能宣称完成：

1. 唯一源码基线已确定。
2. Requirement gate 已纳入统一 execution plan。
3. 开放式方向必须通过独立结构比较。
4. 关键样片门已覆盖四类必需状态。
5. Reviewer 视觉结论具备截图和定位证据。
6. 三套体裁至少各完成一个 production-grade 纵切。
7. 现有 truth、provenance、accessibility 和 surface tests 无回归。
8. A/B 评估显示相对 baseline 的改善，且评审者类型透明。
9. Showcase 只收录有独立审查和复用边界的案例。
10. 文档明确哪些能力仍未证明，不能用“已优化”代替证据。

## 15. 优先级清单

### P0

- 对齐工作区和已安装 Skill。
- 落地 `requirement-verification.json` 和 fail-closed gate。
- 升级 direction comparison，禁止 CSS-only 伪方向。
- 建立关键样片门。
- Reviewer 增加锚定工艺评分和截图证据。

### P1

- 建设 Expressive Web 纵切。
- 建设 Operational Product 和 Editorial Evidence 最小系统。
- 完成体裁化评价校准。
- 建立 6 个 baseline/candidate 案例。

### P2

- 增加 3D/Canvas、scroll scene 和高级媒体 primitives。
- 提炼通过验证的设计知识。
- 优化缓存、增量重验和执行耗时。

## 16. 风险

| 风险 | 控制 |
| --- | --- |
| 为追求 Muzli 风格而损害后台效率 | 强制 experience mode 和体裁边界 |
| 规则继续膨胀 | 只新增一个 sidecar，其他扩展现有合同 |
| 评分被当成审美真理 | 分数只用于门槛和诊断，保留盲评与用户证据 |
| 外部参考导致复制 | Reference role、distance 和许可边界 |
| 方向探索增加成本 | 只在开放式 Standard/Assured 任务启用 |
| 动效和 3D 降低性能 | 资源预算、静态首帧、reduced-motion 和低性能 fallback |
| 需求验收沦为勾选表 | 必须绑定当前 digest 和真实证据 |
| 模型自评自批 | 独立 Reviewer，模型面板不冒充人类 |

## 17. Sources

[cite:1] Muzli.Me, “Your Creative Work, All in One Place”
https://me.muz.li/

[cite:2] Awwwards, “Evaluation System”
https://www.awwwards.com/about-evaluation/

[cite:3] The Webby Awards, “Judging Criteria”
https://www.webbyawards.com/judging-criteria

[cite:4] Playwright, “Visual comparisons”
https://playwright.dev/docs/test-snapshots

[cite:5] W3C, “WCAG 2 Overview”
https://www.w3.org/WAI/standards-guidelines/wcag/

[cite:6] Nielsen Norman Group, “10 Usability Heuristics for User Interface Design”
https://www.nngroup.com/articles/ten-usability-heuristics/

## 18. 本地审计范围

本方案重点审计了以下当前实现：

- `~/.trae-cn/skills/design/SKILL.md`
- `~/.trae-cn/skills/design/references/design-standards.md`
- `~/.trae-cn/skills/design/references/philosophy.md`
- `~/.trae-cn/skills/design/references/workflow.md`
- `~/.trae-cn/skills/design/references/quality-bar.md`
- `~/.trae-cn/skills/design/references/execution-path.md`
- `~/.trae-cn/skills/design/references/library.md`
- `~/.trae-cn/skills/design/references/visual-recipes.md`
- `~/.trae-cn/skills/design/design-systems/defaults/design-profile-catalogue.json`
- `~/.trae-cn/skills/design/assets/templates/registry.json`
- `~/.trae-cn/skills/design/assets/components/registry.json`
- `~/.trae-cn/skills/design/schemas/design-brief.schema.json`
- `~/.trae-cn/skills/design/schemas/direction-comparison.schema.json`
- `~/.trae-cn/skills/design/schemas/reviewer-record.schema.json`
- `~/.trae-cn/skills/design/design-knowledge/evaluation-policy.json`

工作区原有 `docs/design-optimization-plan.md` 和 `docs/research/design-method-synthesis.md` 作为历史方案与方法输入，本专项不覆盖它们。

## 19. 实施与验证记录

截至 2026-10-09，以下能力已落地：

- H0 产品需求合同、P0/P1 fail-closed 验收和当前证据 digest 绑定。
- 两个独立结构方向、同内容单元约束，以及首屏、最密内容、关键状态、窄屏四类关键样片。
- Reviewer record v4 的七项工艺评分、三项所有权评分、截图定位证据和非补偿式放行门槛。
- Expressive Web、Operational Product、Editorial Evidence 三套 production 表达系统及真实组件、模板、状态、响应式和 keyframe 样例。
- `design-color-contract/v1` 配色范式：统一 foundation、reading、focal、semantic、data 角色，绑定主强调色职责、第二强调色边界、颜色冗余表达和已验证对比度配对。
- 新能力接入统一 execution plan、runner、CLI、schema、正反 fixtures 和安装一致性检查。

当前验证证据：

```bash
DESIGN_PLAYWRIGHT_PATH='…/playwright' \
DESIGN_CHROMIUM_EXECUTABLE='…/headless_shell' \
npm run test:strict

node scripts/validate-code-style.mjs .
node scripts/validate-design-skill.mjs .
node scripts/validate-schemas.mjs .
node scripts/validate-packed-references.mjs .
```

上述检查均通过；严格测试包含真实 Chromium 启动、三套系统的 desktop/mobile/small-phone 严格布局和四类关键样片捕获。

尚未证明：

- `design-knowledge/evaluation-policy.json` 仍为 `calibration_required`，尚无真实目标用户三秒回忆或盲测偏好证据。
- native PPTX、PDF 导出和 Figma 运行时未验证，继续 fail closed，不宣称具备。
- Phase 5 的 6-12 个 baseline/candidate A/B 试点与 showcase 晋级仍需独立开展。
