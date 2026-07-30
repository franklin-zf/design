# Design 三源设计方法综合报告

## 1. 报告结论

三套来源不能被合并成一套可直接复制的设计规范。它们分别解决不同问题：

1. `skills` 提供判断与克制：先判断目的、频率和必要性，再决定是否增加视觉或动效；机械检查之外保留真实观看的 feel check。
2. `taste-skill` 提供方向控制：先读取受众、场景、品牌与限制，再用明确的视觉方向和可调维度对抗模型默认风格。
3. `impeccable` 提供设计 harness：用持久上下文、任务路由、确定性 detector、有限 QA 和独立终审把设计判断变成可执行流程。

对 Design 最有价值的不是复制第三方规则或源码，而是把三种能力重组为一个统一系统：

> 以内容真值为不可覆盖的底座，以读者任务决定体裁和信息结构，以一张可追溯的 Taste Decision Card 固定视觉方向，再由确定性检查和独立审美审核共同验收。

本报告是方法综合与后续实施依据，不证明 Design 已经提高审美、缩短执行时间或改善真实用户结果。

## 2. 证据范围

### 2.1 固定来源

本报告只分析以下固定提交，不将当前上游或之后的变更混入结论：

| 来源 | 精确提交 | 仓库关系 | 许可 |
| --- | --- | --- | --- |
| `franklin-zf/skills` | `6bf24434f7730ad169077756cf9c7cd7bd675fc6` | GitHub fork，源自 `emilkowalski/skills` | MIT |
| `franklin-zf/taste-skill` | `e988add20dab0fa97d7a76781c48961c8184288e` | GitHub fork，源自 `Leonxlnx/taste-skill` | MIT |
| `pbakaus/impeccable` | `6b342244e915d64b0d6e84d5eec448fd196ce6bb` | GitHub 标记为非 fork | Apache-2.0 |

检索与快照核验日期为 `2026-07-31`。

### 2.2 思想归属

- `franklin-zf/skills` 是固定证据载体，不代表 Franklin 是其中设计思想的原创者。仓库内容主要归因于 Emil Kowalski，Apple 相关材料应归因于 Apple/WWDC。
- `franklin-zf/taste-skill` 是固定证据载体，其上游、安装入口和版权信息指向 Leon Lin / `Leonxlnx/taste-skill`。
- `pbakaus/impeccable` 的 Apache-2.0 许可文件归因于 Paul Bakaus；其 NOTICE 还记录了平台参考材料的第三方 MIT 归属。

公开表达必须保留上述归属，不得把 fork 托管者写成方法原创者。

### 2.3 许可与复用边界

- MIT 许可允许使用、修改和分发，但复制或分发软件及 substantial portions 时必须保留版权和许可声明。
- Apache-2.0 允许复制和衍生分发，但涉及许可证副本、修改声明、归属通知、NOTICE 和商标边界。
- 本方案只提炼思想、机制、决策顺序和可观察行为，不复制、vendor、安装或重新分发第三方源码、提示词、检测器、素材、截图或生成资产。
- 后续若需要逐字或代码级复用，必须单独完成来源、许可、NOTICE、修改声明和再分发审查。

## 3. 三源对比矩阵

| 维度 | `skills` | `taste-skill` | `impeccable` | 对 Design 的迁移结论 |
| --- | --- | --- | --- | --- |
| 核心强项 | 有证据的判断与克制 | 视觉方向与 anti-default | 可执行的设计 harness | 组合为判断层、方向层、执行层 |
| 输入控制 | 词汇、目的、频率、侦察 | Design Read、受众、参考、三个 dial | PRODUCT/DESIGN/surface context 与路由 | 压缩为一次 intake 和角色上下文包 |
| 输出控制 | 排序机会、拒绝项、自包含计划 | 风格世界、构图、图片和 pre-flight | command contract、critique、agent output | 统一进入现有 handoff、manifest 和 evidence |
| 审美方法 | 信息密集内容默认稳定；先删无意义效果 | 主动对抗 AI 默认构图和风格 | brief、visual world、craft floor、finish review | 内容先行，允许一个被内容赢得的主视觉机制 |
| 质量机制 | 机械检查加慢放、逐帧、真实体验 | 可计数 anti-pattern 与完整性检查 | detector、hooks、行为测试、独立终审 | detector 只抓确定性问题，Reviewer 负责主观判断 |
| 流程控制 | 发现、审计、计划、执行、审核分离 | 实现、重设计、图片、输出路径分离 | 上下文一次加载、单 playbook、有限 QA | 复用现有 Poster/Designer/Reviewer，不新增角色 |
| 运行证据 | 主要是 instruction corpus | 主要是 instruction corpus 与示例 | 脚本、hooks、agents 和行为测试源 | 只能证明机制存在，不能证明跨体裁效果 |
| 主要限制 | 偏 Web UI motion | 主 skill 排除 dashboard/data table | 前端导向，clean scan 不等于好设计 | 必须增加数据报告、PPT 和事实保真边界 |

## 4. 可迁移机制

### 4.1 从 `skills` 迁移判断纪律

1. **先定义问题，再选择形式。** 模糊的“更顺滑”“更高级”必须先转成目的、对象、频率和可观察结果。
2. **先问是否需要。** 动效、图片、卡片、装饰和视觉效果都允许以“不增加”为正确结论。
3. **机会与纠错分离。** Additive review 寻找被内容赢得的增强机会；Corrective review 删除干扰、错误和模板化痕迹。
4. **拒绝项是正式输出。** 未被采用的候选及拒绝理由应写入决策记录，防止后续重复探索。
5. **机械验证不能替代感知验证。** 规则通过后仍需缩眼、五秒、缩略图、远距、真实内容和独立 feel check。
6. **第一修复动作优先删除。** 当方向不成立时，先移除无意义效果，不用更多 polish 掩盖问题。

### 4.2 从 `taste-skill` 迁移方向控制

1. **Design Read。** 在设计前用一句话固定体裁、受众、reader job、人格、证据风险和视觉倾向。
2. **三个解释轴。** 使用 `composition_variance`、`motion_intensity`、`information_density` 描述方向，但不设跨任务默认值。
3. **视觉方向先于组件。** 先解释为什么这个内容应当形成这种视觉世界，再选择模板、版式、字体、图片和动效。
4. **Anti-default。** 识别无内容依据的紫蓝渐变、暗色 mesh hero、三等分卡片、全局玻璃、装饰标签、统一 reveal 等常见模型默认。
5. **已有系统优先。** 重设计前先审计品牌资产、信息架构、token、保留项、退役项和无障碍约束。
6. **完整性预检。** 声称使用的图片、动效、状态和输出必须真实存在；无法完成时降低承诺，不提交半成品声明。

### 4.3 从 `impeccable` 迁移 harness 机制

1. **上下文一次解析。** 产品真值、设计系统、目标 surface 和变更范围只解析一次，再形成按角色裁剪的上下文包。
2. **按 reader job 路由。** Persuade、Operate、Read、Experience 的核心思想可迁移为 Understand、Compare、Decide、Present、Operate/Explore。
3. **任务动词归一。** 外部的众多命令只作为词汇来源，统一映射到 Design 的少量 operation，不新增顶层命令体系。
4. **方向合同与构图探索分离。** 高风险、开放式任务先确定 visual world，再比较有限候选；已有模板或明确品牌系统直接走继承短路径。
5. **媒介诚实。** 人物、真实产品、场景、材质和光照通常需要真实或生成 raster；流程、关系、图表和精确几何应由 Mermaid、SVG、图表或代码表达。
6. **Detector 与主观评审隔离。** Detector 提供可重复事实，不能证明审美优秀；独立 Reviewer 不继承 Designer 的自我解释。
7. **有限 QA。** 一次批量检查、一次集中修复、一次确认；仍有 major/blocking 时进入 blocked 或用户决策，不能因轮次耗尽而放行。

## 5. 统一审美哲学

### 5.1 一句话定义

Design 的审美不是给内容套上更强的风格，而是在绝不损害事实的前提下，为特定读者任务找到最清楚、最贴合、最有辨识度且可验证的表达形式。

### 5.2 六条原则

1. **Truth before taste**
   源数据、数字、单位、日期、名称、限定词、来源、计算和不确定性先于所有视觉决定。
2. **Reader success before category habit**
   从读者需要理解、比较、决定、汇报还是操作出发，不从行业标签直接推导样式。
3. **Specificity before novelty**
   设计必须来自当前内容、业务机制、受众和场景；新奇不能替代贴合。
4. **Hierarchy before decoration**
   先让阅读顺序、分组、尺度、对比和共同基线成立，再使用图片、材质、动效和 delight。
5. **One authored idea, many quiet supports**
   允许一个被内容赢得的主视觉机制，其余元素保持克制并服务它。
6. **Evidence before approval**
   Schema、detector、截图和导出只是证据；最终还需真实内容、目标体裁和独立 Reviewer 验证。

### 5.3 十二层决策顺序

前一层未稳定时，不得用后一层的装饰补救：

1. **内容真值**：区分原文、代码计算、推断和未知。
2. **Reader job**：明确理解、比较、决策、汇报或操作任务。
3. **产品与品牌人格**：选择两个可观察特质，并记录反方向。
4. **视觉方向**：写出 visual thesis、主视觉机制和三个解释轴。
5. **构图与空间**：先写阅读顺序，再定义网格、分组和节奏。
6. **排版**：定义标题、结论、正文、注释、来源、数字和单位的角色。
7. **色彩与材质**：每种颜色和材质必须承担品牌、层级、状态、数据或氛围任务。
8. **图片与图形**：先定义证据、解释、情绪、品牌或数据任务，再选择媒介。
9. **动效与交互**：只用于反馈、状态、关系、层级或讲述顺序。
10. **响应式与无障碍**：在画布、输入、缩放、语言和降级条件下保持语义。
11. **反模式检查**：区分硬拒绝、条件性反模式和体裁专属反模式。
12. **Feel check**：在机械验证后检查真实观看的清晰度、贴合度和记忆点。

## 6. 不可让位的事实保真规则

1. 用户提供的源数据、数字、单位、日期、名称、事实、限定条件和语义不得修改。
2. 不得为了“更真实”“更自然”或视觉平衡而取整、随机化、替换、拆散或补写任何数字和日期。
3. 不得编造客户、评价、市场数据、功能、效果、时间、地点或商业主张。
4. Poster 可以进行关联分析，但派生计算必须由代码执行，并保留输入、公式、单位、精度、输出和程序证据。
5. 示例数据必须明确标记为 synthetic，不能与真实结论混排或伪装成真实数据。
6. 缺少信息时必须标记未知、数据不足或待补充，不得用设计完整性掩盖证据缺口。
7. 图表必须保留口径、分母、时间窗、单位、缺失值、来源和不确定性；视觉编码不得改变结论。
8. 所有审美规则、模板规则和来源建议都低于本节。发生冲突时，拒绝来源建议。

## 7. 按体裁的设计规则

### 7.1 数据报告

**核心任务**

- 优先服务理解、比较、复核和决策。
- 先建立 source ledger、visible-number map、claim map 和 calculation record。
- 图表选择由比较关系决定，不由视觉风格决定。

**版式与排版**

- 共同尺度和比较基线优先于装饰。
- 数字、单位、时间窗、分母、来源和限定条件必须可见。
- 数字比较可使用 tabular figures，但不能把全部内容改成等宽体营造“技术感”。
- 卡片只用于真实独立对象，不得把每段文字装进卡片。

**色彩、图片和动效**

- 数据不能只依赖颜色编码，必须同时使用标签、位置、形状、明度或纹理。
- 图片仅在提供证据、解释或主题上下文时使用。
- 动效仅用于交互探索中的状态、筛选和关系连续性；静态导出必须完整表达。

**验收**

- 校验屏幕和打印、灰度退化、长来源、缺失值、负数和极值。
- Detector clean 不能作为报告优秀的证明。

### 7.2 PPT

**核心任务**

- 一页只承担一个主要 reader job。
- 通过章节、重复锚点、密度变化、尺度变化和安静页建立跨页叙事。
- 汇报者的讲述顺序、观看距离和记忆点优先于网页式首屏逻辑。

**版式与排版**

- 先写叙事 spine，再分配页面功能和版式。
- 按缩略图、全屏投影、字体替换和 PDF 导出检查。
- 标题、核心数字、单位、图表标签和来源必须在目标观看距离可读。
- 高风险、品牌级或视觉高度开放的 deck 才进入方向候选和 comp 审批。

**图片和动效**

- 图片必须支持远距离识别并承担证据、解释或情绪任务。
- 动画只用于讲述顺序、对象连续性和因果揭示。
- 动画不能承载唯一信息，静态/PDF fallback 必须保持完整语义。

**不适用的 Web 规则**

- Hover、scroll、keyboard、网页 hero 高度、CTA 字数和 DOM/CSS detector 不构成 PPT 质量标准。

### 7.3 交互 HTML

**核心任务**

- 先确定 Understand、Compare、Decide、Present、Operate/Explore 中的 reader job。
- Operate 型界面以任务、状态、扫描和重复操作为先；Read 型界面以理解和 wayfinding 为先。
- Persuade 或 Experience 只在业务场景确实需要时提高视觉表达强度。

**交互与运行**

- 响应式应重排、折叠、替换和调整优先级，不能机械缩小。
- 必须覆盖 desktop、mobile、small phone、keyboard、zoom、reduced motion、长内容和空/错/加载状态。
- 动效必须可中断；脚本失败和 reduced-motion 模式下内容仍然可见。
- 新品牌或高审美风险表面可使用有限 visual-world/comp 探索；已有系统直接继承。

**不适用的规则**

- 不强制动画、双主题、暗色、图片或营销 hero。
- Detector 无 finding 不能替代独立视觉审核。

## 8. 明确拒绝的源规则

以下规则不得进入 Design 的全局默认或硬门禁：

1. 用 fake、organic 或“更自然”的数字替换用户数字。
2. 随机化日期、姓名、客户、指标、评价或任何事实。
3. 为所有任务设定固定高 variance、motion 或 density 默认值。
4. 强制 imagegen first，或要求每页、每屏使用固定数量图片。
5. 将暗色、营销 hero、渐变文字、glass、特定字体或特定标点设为全局偏好或绝对禁令。
6. 将 HTML 的 hover、scroll、CTA、首屏和 DOM 规则泛化到数据报告或 PPT。
7. 每个任务都执行七方向、随机 seed、三 comp 和完整审批。
8. 把 23 个顶层命令、第二套 planner、第二套 runner 或第二条 evidence 路径接入 Design。
9. 默认接入 live source-mutation runtime、CSP 注入、framework adapter 或远程运行依赖。
10. 把 detector clean、schema pass 或内部代理评分表述为设计优秀、用户满意或真实效果验证。

## 9. Anti-AI 规则的正确边界

Anti-AI 不应退化为固定颜色、字体或字符串黑名单。Design 应采用三层规则：

1. **跨体裁硬拒绝**
   - 编造或修改事实、数字、单位、日期和来源；
   - 用装饰掩盖内容缺失；
   - 图表编码误导；
   - 关键内容溢出、不可见或不可访问；
   - 生成图冒充证据；
   - 设计者批准自己的高风险产物。
2. **条件性反模式**
   - 三等分卡片、eyebrow、渐变文字、glass、等宽体、中心 hero、巨型数字、section 编号、暗色主题；
   - 只有当 reader job、品牌、内容结构或真实状态需要时才可采用，并记录理由。
3. **体裁专属反模式**
   - 数据报告：装饰 KPI、截断坐标、颜色唯一编码、缺少口径或来源；
   - PPT：网页式滚动暗示、过密小字、每页同构卡片、动画承载唯一信息；
   - HTML：假交互、缺少状态、hover-only 信息、不可中断动效、移动端重叠。

规则库必须允许有证据的 override，并记录 `exception_ref`。流行风格会变化，反模式库不能成为永久审美宪法。

## 10. 事实、推断与未知

### 10.1 已验证事实

- 三个固定提交、fork 关系、许可和核心文件快照已经核验。
- `taste-skill` 的主 skill 明确偏向 landing page、portfolio 和 redesign，并非数据报告或 dashboard 的通用规范。
- `impeccable` 包含上下文、路由、detector、hooks、角色合同和行为测试源。
- 三套来源都把删除、保留、拒绝或不增加效果视为有效设计结果。

### 10.2 综合推断

- 三套来源可分别理解为判断纪律、方向控制和 harness 控制。这是本报告的分析模型，不是任一来源的自我定义。
- Taste Decision Card 有望减少角色之间的方向歧义，但只有实施和对照测试才能证明。
- 按角色裁剪上下文、只加载拥有当前任务的规则，可能减少重复读取；是否缩短时间必须由 telemetry 验证。
- 体裁化 detector 可提前发现部分结构问题，但不能证明内容贴合或审美优秀。

### 10.3 未知与未验证

- 三套来源是否提高用户评分、业务结果、任务完成率、token 使用或端到端时间。
- `taste-skill` 的数值阈值能否跨出营销前端。
- `impeccable` 在固定提交上的 provider-backed 行为测试是否全部通过。
- 三套 Web/UI 方法迁移到精确数据报告、PPT、Office 导出和跨格式一致性后的实际效果。
- 当前 Design 的端到端时延、各 gate 时延、角色上下文体积和返工分布基线。

## 11. 证据局限

- 本研究是核心入口的选择性分析，不是三个仓库的完整代码审计。
- `impeccable` 的生成副本、provider/plugin mirrors、完整站点、live protocol 细节和全部 2,942 个 tracked files 未逐项审计。
- `taste-skill/research` 中转述的研究结果未在本轮独立复现。
- 当前上游在固定提交之后的变化不属于本报告事实。
- 本报告没有运行三套来源来生成 Design 的数据报告或 PPT，也没有真实用户盲评。
- 因此，本报告只支持“哪些机制值得试点”的结论，不支持“已经提升审美或效率”的完成性声明。

## 12. 后续使用原则

后续实现应优先吸收方法和契约，采用 Design-owned clean implementation：

- 复用 Design 现有 Express/Standard/Assured、Poster/Designer/Reviewer、compiler/runner/evidence；
- 用 Taste Decision Card 固定设计判断，不增加平行 planner；
- 用 shape-aware detector 提供确定性证据，不取代独立 Reviewer；
- 按数据报告、PPT、交互 HTML 分别试点；
- 先记录 baseline，再讨论审美、返工或时延收益。
