# Requirements Analysis

Confirmation: proceeding-with-explicit-assumptions — brand, PPT player, asset rights and efficiency baseline are resolved at implementation intake

## Goal

`design skill` 必须稳定地把用户提供的内容或数据转化为准确、清晰、由内容驱动，并分别适配 PPT、HTML、Poster 使用场景的高质量可视化报告。

质量优先级固定为：源数据与原意准确 > 衍生分析可复现 > 信息可读和可决策 > 审美与内容匹配 > 动效和新奇性。

## Users And Scenarios

- Primary user: 需要把项目材料、业务数据或复杂内容转化为管理层汇报和视觉报告的中文用户。
- Primary scenario: 用户提供一份可信源材料，要求在 10–15 分钟内可讲清的 PPT、可分享和定位的 HTML 演示，或三秒内识别主结论的单页 Poster。
- Ambiguous-intake scenario: 用户未说明体裁、目标或场景时，系统提供 2–3 个具体方向，说明每个方向的产物类型、受众、使用场景和取舍，等待用户选择后再进入内容整理。
- Multi-format scenario: 同一源材料生成 PPT、HTML、Poster 时，共享同一内容真值链，但构图、节奏、媒体和交互按体裁独立设计。
- Failure and recovery scenario: 用户否决视觉结果后，旧审美审批立即失效；系统记录否决原因，重做视觉方向并重新完成独立检查和用户确认。

## Scope

### In Scope

- 内容总结、信息架构、核心视觉命题和叙事顺序。
- 原始数字、关系词、限定词、单位、日期、名称和标识符保护。
- 通过代码生成并留存可复现证据的衍生计算。
- PPT、HTML、Poster 三类核心产物及其独立场景验收。
- 参考检索、方向比较、模板选择、媒体选择和必要的图片、图表、流程图、图标、动效。
- 内容审核、视觉反证、用户视觉确认和审批失效机制。
- 面向不同产品语境的默认设计预设，以及 PPT、HTML、Poster 的体裁级设计规则。
- 工作区、测试对象、安装入口和交付物之间的版本一致性。
- 在质量不回退前提下缩短常规任务执行路径。

### Non-Goals

- 本切片不重新生成当前产品管理平台 PPT、HTML、Poster，不安装、不发布。
- 本切片不实现源文件抽取、Native PPTX 适配器或最终效率基准；这些能力继续由后续切片独立验收。
- 不复刻任何公司的品牌资产、专有模板或受限素材。
- 不把毛玻璃、炫酷动画、图片数量、模板数量或布局 ID 数量当作质量目标。
- 不强制所有产物使用 Apple、Swiss 或任一固定风格。
- 不扩展 PPT、HTML、Poster 以外的新产物类型。
- 不要求每个任务无条件启动多个智能体；角色和工具按风险、复杂度选择。

## Constraints And Assumptions

- Verified:
  - 用户已经明确否决当前 PPT、HTML、Poster 的视觉质量。
  - 当前工作区版本与 Codex 实际安装版本不一致。
  - 三类现有产物不是同一内容链生成的兄弟产物。
  - HTML 主视觉弱化或遗漏了 `约`、`≥`、`≤` 等关系语义。
  - 已被用户否决的产物仍可通过部分现有审美检查，说明检查存在误放行。
  - 当前产物缺少能够解释产品对象、界面或系统关系的有效媒体，模板轮廓重复。
  - 本切片开始时 `design` 工作区干净；实施仍不得覆盖、回滚或混入后续出现的无关改动。
  - 本轮复核时，先前给出的原始 `.doc` 路径已不可读；已有三个一致的 extracted `source.txt` 副本，但它们不能替代原文件抽取验收。
- Assumed:
  - PPT、HTML、Poster 继续作为长期支持的三类核心格式。
  - 默认面向中文商业汇报，并要求中文排版专项检查。
  - 本地 Skill 和产物最高状态为 `candidate_ready`；最终 `ready` 仅属于宿主任务状态，并由宿主记录用户对精确产物版本的确认。
  - 默认不为失效模板和旧 manifest 增加兼容层；确有迁移需求时另立需求。
  - 建立真实基线后，以固定任务集的 confirmed-intake 到 `candidate_ready` wall-clock 中位数降低 20% 作为试运行目标，质量门槛不得回退。
- Unknown:
  - 具体项目是否有固定企业品牌规范。
  - PPT 主要播放环境是 Microsoft PowerPoint、Keynote 还是其他软件。
  - 外部图片、生成图片和商业字体的项目级授权边界。
  - 当前常规任务的中位执行耗时和有效工具步骤基线。
  - 原始项目建议书 `.doc` 的当前可读位置；Slice 3 在原文件恢复前保持 blocked。

## Requirements

| ID | Priority | Requirement | Observable Acceptance |
| --- | --- | --- | --- |
| REQ-001 | P0 | 所有被选择进入叙事的事实及其可见内容必须保持源数据和原意。 | Source inventory 覆盖抽取出的全部事实；narrative selection 明确允许省略哪些未选事实；一旦事实被选入任一体裁，其数字、单位、关系词、限定词、日期、名称和标识符必须按源文词法完整显示，零改写、零局部缺失。`约17人月`、`大于等于1000`、`大于等于100`、`小于等于300 ms` 默认不得自动改写为 `17人月`、`1000+`、`≥100` 或 `300 ms`。原始文件 hash、抽取工具/版本、抽取文本 hash 和段落定位必须可追溯。 |
| REQ-002 | P0 | 总结必须直接、清晰，不增强或削弱原文结论。 | 每个关键结论可定位到来源；独立审核未发现新增判断、删除限制条件、术语包装或含义漂移。 |
| REQ-003 | P0 | 衍生分析必须准确且可追溯。 | 每个非源文档数字均标识为衍生结果，并可复现输入、计算程序和输出；人工心算或无证据数字不得交付。 |
| REQ-004 | P0 | 实际运行版本必须等于批准和测试版本。 | 每次验收可证明工作区、测试对象、安装入口和交付物属于同一版本；任一不一致时状态为 `blocked`。 |
| REQ-005 | P0 | 同一次多格式输出必须来自单一内容真值链。 | PPT、HTML、Poster 绑定同一源版本、事实集合和已确认结论；不得混入历史产物或其他 Skill 的派生副本。 |
| REQ-006 | P0 | 用户否决必须使旧审美审批失效。 | 用户否决后产物立即退出可交付状态；任何内容、截图或产物哈希变化后都必须重新视觉检查和用户确认。 |
| REQ-007 | P1 | 三种格式必须分别适配实际使用场景。 | PPT 通过投影可读性和整套节奏检查；HTML 支持刷新定位、键盘操作、响应式和静态降级；Poster 的三秒测试只识别出一个主结论。 |
| REQ-008 | P1 | 视觉设计必须由内容命题驱动。 | Reviewer 能说明核心视觉焦点如何表达本次内容；替换成无关正文后版式明显不再成立，通用换字模板不得通过。 |
| REQ-009 | P1 | Standard 和 Assured 的 PPT、HTML、Poster 必须经过参考检索和方向比较。 | 记录 2–3 个与内容、受众和场景相关的参考，产出至少两个同尺寸但构图明显不同的方向，并以表达效果说明取舍；Express 可跳过，但只能交付明确标记的 preview，不能达到 `candidate_ready`。 |
| REQ-010 | P1 | 图片、图表、流程图、图标和动效必须承担语义任务。 | 每个媒体元素都能回答“帮助理解什么”；删除后不影响表达的装饰被移除；产品材料出现可理解的产品对象、界面或系统关系。 |
| REQ-011 | P1 | 审美验收必须能够主动证伪。 | 产物通过内容专属性、三秒记忆、中文排版、目标尺寸、整套节奏和参考对照检查；审核记录绑定最终产物和截图哈希。 |
| REQ-012 | P2 | 在不降低质量的前提下缩短执行链路。 | 使用固定的 3 个 source pack × 3 个体裁任务集；旧链和新链各预热 1 次、独立测量 3 次。主指标是从 confirmed intake 到 `candidate_ready` 的本机 active wall-clock 中位数，排除用户/调度队列等待，包含生成和 Reviewer active review time，目标降低至少 20%；每组旧/新配对由预先冻结的同一 Reviewer 身份、工具版本和计时边界审核。有效工具步骤是辅助指标且不得增加超过 10%。硬件、缓存策略、失败重试和原始日志固定留存，REQ-001 至 REQ-011 不得回退。 |
| REQ-013 | P1 | PPT、HTML、Poster 必须从一套受控的默认设计规范中选择产品预设、体裁规则和内容拓扑。 | 注册表恰好包含 `executive-strategy`、`enterprise-saas`、`data-analytics`、`technical-architecture`、`consumer-brand`、`editorial-research` 六类主预设；每类定义审美命题、色彩方向、字体角色、布局、媒体、数据表达、动效和反模式。解析器根据 reader job、内容关系和体裁生成绑定注册表 digest 的 `design-profile/v1`；最多一个辅助预设，且不得覆盖主预设的配色、字体和构图规则。三体裁分别返回可执行约束，未知预设、缺失体裁规则、悬空样式或拓扑引用必须失败。 |

## Material Questions

- 品牌、播放环境和素材授权属于单次项目的 intake 字段；素材信息缺失时使用开源/自有素材和系统字体。原生 PPTX capability 未验证时必须阻塞 PPT 交付，并把 `ppt-handoff` 作为不同产物选项明确告知用户，不能冒充 PPT。
- 本地 Skill 永远不写 `ready`；宿主任务可在用户确认精确 artifact/content/surface digests 后显示 `ready`，但该状态不回写到可由产物作者修改的 artifact root。
- 旧模板和旧 manifest 默认不兼容；旧版本直接给出可操作错误，不提供 import 或兼容路径。
- 20% 效率目标按 REQ-012 的固定基准方法进入方案；实施前如产品决策改变，必须先更新本文件并重新做追溯。

## Content Selection Semantics

- `source inventory`: 从原始材料可靠抽取出的全部事实和定位，不要求全部进入最终产物。
- `narrative selection`: 每个体裁明确选入和省略的事实；省略只能发生在选取阶段，不能把已选事实截断成更强或更弱的表达。
- `protected token`: 已选事实中必须作为一个整体显示的源文词法片段，包括数字、单位、关系词和限定词。
- `display variant`: 默认禁止。只有用户明确确认某个等价表示后，才能记录 source token、display token、语义关系和确认事件；自动 Reviewer 无权批准转换。
- Native PPT 验收同时检查 PPTX 提取文本中的完整 token 和真实渲染截图；只检查 HTML handoff 不算通过。

## Evidence Basis

- [设计质量归因报告](/Users/zhangfeng/Downloads/workspace/design-reference-study-2026-08-09/analysis/design-quality-root-cause.md)
- [参考项目与素材清单](/Users/zhangfeng/Downloads/workspace/design-reference-study-2026-08-09/REFERENCE_INVENTORY.md)
- [当前 Design Skill 入口](/Users/zhangfeng/Downloads/workspace/design/SKILL.md)
