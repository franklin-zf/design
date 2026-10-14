# 01 入口、角色内核与规范引用

## 一、Skill 入口文件

| 文件 | 作用 |
| --- | --- |
| `SKILL.md` | Skill 唯一入口：Promise 与 Truth Floor、Core Workflow（Define→Resolve→Build→Verify）、Taste Contract、Risk Lanes（Express/Standard/Assured）、Runtime Contract、Fresh Generation Boundary、按需加载策略 |
| `AGENTS.md` | 面向 Agent / 贡献者的工程纪律：第一性原理、harness 工程、改动范围最小化、验证与交付标准 |
| `.trae/rules/design-skill.md` | Trae IDE 侧的 Skill 规则映射，用于本机 Trae 调用同一套规范 |

按需加载原则（SKILL.md「Load Only What You Need」）：默认只读 SKILL.md + workflow.md；按任务追加一篇任务型引用；响应式应用才加载 web-interface-standards；Assured 才加载 advanced-assurance / quality-bar；visual-recipes 等仅在用户显式要求时加载。

## 二、角色内核（agents/）

| 文件 | 职责边界 |
| --- | --- |
| `agents/designer.md` | 视觉设计专家：消费 digest 绑定的 content-handoff（按 `context_scope` 严格过滤）；产出 Taste Contract 2.0（含 `shot_reference`）、注意力区域、阅读顺序、六阶段推导；设计前必须检索 Dribbble Hub；不拥有事实改写权 |
| `agents/reviewer.md` | 独立评审：审查面含 Contextual Semantic Fitness 与 Anti-Visual-Fill 红线、防消融/重复信息红线、Defensive CSS 与极限内容应力；不能自我审批 |
| `agents/poster.md` | 海报专家：单一信息 + 单一视觉钩子，poster contract 与 anti-ai-slop 校验 |
| `agents/openai.yaml` | Agent 编排的角色声明配置 |

## 三、规范引用全量索引（references/，共 15 篇）

### 3.1 主规范与工作流

| 文件 | 标题 | 内容与加载时机 |
| --- | --- | --- |
| `workflow.md` | Workflow and Tool Routing | **默认必读**。Intake、Shape Selection、六阶段流水线 G0–G5（Stage 2 强制 Dribbble 检索）、叙述与责任、CLI 调试命令索引 |
| `design-standards.md` | Design Standards | H0–H5 质量层级（需求/事实/叙事/视觉系统/构图/交付）；Scope Filtering Principle、Anti-Visual-Fill、默认现代精工基线、全中文与语义 Icon、防消融、去重、Focal Weight Budget |
| `quality-bar.md` | Quality Bar | G0–G5 门禁定义、VCR 2.0 七维工艺评审、Assured 证据契约、Contextual Semantic Fitness 评分项 |
| `advanced-assurance.md` | Advanced Assurance | 仅 Assured 车道：完整溯源、受控执行、外部证据绑定、独立发布评审、角色 handoff/attestation |

### 3.2 任务型引用（按产物追加一篇）

| 文件 | 标题 | 适用任务 |
| --- | --- | --- |
| `report-dashboard.md` | Reports and Dashboards | 数据报告、看板：证据顺序、图表编码、扫描路径 |
| `deck-ppt.md` | Deck and PPT | HTML 演示文稿与 PPTX handoff（handoff 不等于原生 PPTX） |
| `poster-design.md` | Poster Design | 单信息海报：视觉钩子、layout lock、anti-ai-slop |

### 3.3 界面与媒体规范

| 文件 | 标题 | 内容 |
| --- | --- | --- |
| `web-interface-standards.md` | Web Interface Standards | 响应式 Web 应用/看板必读。Container Inset Floor、Surface Elevation Ramp（ΔL ≥3%）、Switch 触觉阴影、Single-Truth Context、Diff-First、Focal Weight Budget、Defensive CSS Layout Protocol、context_scope 消费、1440/390/320px 验证 |
| `media-design.md` | Media Design | 图片/图表/diagram/icon 分工；语义图标策略；iconfont 仅作本地 SVG 下载源、禁止运行时依赖 |
| `color-system.md` | Color System | OKLCH 色彩角色（foundation/reading/focal/semantic/data）、`color_contract`、`validate-color-system` 前置 |
| `frontend-styles.md` | Frontend Style Assets | 前端样式资产的注册、复用与打包边界 |
| `visual-recipes.md` | Visual Recipes and Profiles | 视觉配方/Profile 注册表与 resolver 契约（glassmorphism、editorial-ink 等）；不按风格 slug 写分支；仅显式要求时加载 |

### 3.4 事实与工具治理

| 文件 | 标题 | 内容 |
| --- | --- | --- |
| `source-integrity.md` | Source Integrity | 源材料密集型任务：claim/summary 映射、数字保真、provenance、禁止伪造 |
| `tool-routing.md` | Tool Routing | 能力路由表（Dribbble Hub、Component Hub、IconHub MCP、原生 PPT、浏览器 QA 等）；最轻可用能力原则；`design.mjs` 为公开本地接口 |
| `library.md` | Design Library | 设计库/模板的消费规则与边界 |

### 3.5 打包校验约束

`scripts/validate-packed-references.mjs` 对打包后的 references 做存在性与一致性校验（当前打包校验基线：32 个引用面，含交叉引用目标）。新增/重命名 reference 必须同步该注册表，否则 `design.mjs validate` 失败。
