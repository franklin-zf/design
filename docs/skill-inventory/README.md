# Design Skill 架构与能力索引

当前本地包版本：`2.0.0`。本目录用于快速回答三个问题：

1. Design Skill 如何运行；
2. 能力由哪些模块负责；
3. 修改或排查时应读取哪个入口。

机器可读快照见
[`capability-manifest.json`](capability-manifest.json)，详细文件清单见文末四个附录。

## 架构

```text
Request + Sources
       │
       ▼
SKILL.md ──► references/workflow.md
       │            │
       ▼            ▼
Content roles   Design profile resolver
Poster          Presets / topology / interface policy
Designer                   │
Reviewer                   ▼
       └──────────► Build runtime + design systems
                              │
                              ▼
                    Validators + evidence
                              │
                              ▼
                         Deliverable
```

| 层 | 权威入口 | 职责 |
| --- | --- | --- |
| 入口 | `SKILL.md`、`references/workflow.md` | 契约、风险分级、六阶段 SOP、按需加载 |
| 内容角色 | `agents/poster.md`、`agents/designer.md`、`agents/reviewer.md` | 叙事、视觉执行、独立审查 |
| 设计控制 | `scripts/lib/design-profile.mjs`、catalogue、`design-systems/` | profile、拓扑、界面策略、视觉系统 |
| 执行 | `scripts/design.mjs`、`assets/`、`packages/` | 规划、模板、组件、媒体、渲染与截图 |
| 发布 | `schemas/`、validators、`tests/` | 事实、功能、表面、工艺、职责证据 |

`scripts/lib/design-profile.mjs` 是唯一运行时路由权威。示例、测试夹具、历史记录和灵感素材均不是默认设计输入。

## 能力

| 能力组 | 当前能力 |
| --- | --- |
| 内容与证据 | 来源提取、内容台账、需求追踪、claim 绑定、派生值 provenance |
| 设计方向 | Taste Contract、6 个 product presets、7 个 content topologies、4 个 surface contracts |
| 视觉生产 | 4 套设计系统、模板、组件、图标、媒体与自包含 HTML 运行时 |
| 交付形态 | 报告、Dashboard、图表、海报、HTML Deck、PPT handoff、Web 体验、截图证据、设计系统 |
| 交互与响应式 | interface policy v2、状态设计、键盘/焦点、reduced motion、Defensive CSS |
| 质量控制 | Express / Standard / Assured 风险车道、结构校验、PRD 浏览器内容/功能验收、Reviewer 证据 |

## 单一执行路径

```text
G0 定义与冻结
 → G1 方向与 Taste Contract
 → G2 信息结构与响应式骨架
 → G3 静态成品构建
 → G4 有任务价值的交互与动效
 → G5 事实 / 功能 / 表面 / 工艺 / 职责验收
```

核心命令面：

```bash
node scripts/design.mjs profile <brief.json> --artifact-type=<type>
node scripts/design.mjs plan <request.json> --design-profile=<profile.json>
node scripts/design.mjs review <artifact-dir> --execution-plan=<plan.json>
node scripts/design.mjs check <artifact-dir> --execution-plan=<plan.json>
node scripts/design.mjs preflight
```

当用户明确要求灵感，或新原型没有已验证品牌/设计系统时，G1 优先调用
`dribbble-hub-mcp` 的 `status/search/get/create binding` 对应工具；无 MCP
时使用 CLI：

```bash
node scripts/design.mjs shots status
node scripts/design.mjs shots search "<场景>" --limit=3
node scripts/design.mjs shots get <shot-id>
node scripts/design.mjs shots binding <input.json>
```

当前 Hub 包含 4 条精确 Dribbble 来源。npm 包仅分发 metadata；4 张
1600×1200 预览保存在用户私有 cache，并校验来源、尺寸、SHA-256、权利
状态与禁止直接复用边界。

## 关键边界

- `ppt-handoff` 默认是 HTML 交接，不等于原生 PPTX。
- Dribbble 是条件强制的方向研究能力，只提供可回溯的视觉方法，不提供产品事实或可直接复制的成品。
- PRD-backed 原型必须用浏览器执行 P0/P1 内容、功能、交互和响应式路径，并生成 plan-bound `browser-test-evidence.json`；浏览器不可用时阻断发布。
- 校验器通过不等于视觉质量通过；交付前仍需检查 1440 / 390 / 320 px 真实表面。
- 派生值没有可执行代码、测试、输出和 `data-provenance.json` 时必须阻断。
- `validate-ui-hierarchy.mjs` 尚未静态覆盖全部 Defensive CSS 规则，当前仍需 Reviewer 人工检查。

## 详细索引

| 文件 | 内容 |
| --- | --- |
| [01-entry-agents-references.md](01-entry-agents-references.md) | 入口、角色与 references |
| [02-cli-scripts.md](02-cli-scripts.md) | CLI、脚本与共享库 |
| [03-packages-assets-systems.md](03-packages-assets-systems.md) | packages、assets、设计系统与知识库 |
| [04-schemas-tests-examples.md](04-schemas-tests-examples.md) | schemas、tests 与 examples |
| [capability-manifest.json](capability-manifest.json) | 机器可读能力快照 |
