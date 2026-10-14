# Design Skill 全量引用与能力清单

> 生成日期：2026-10-14 ｜ 分支：`aime/20261010-164925-design-skill-v2` ｜ HEAD：`ff604ad`
> 追踪文件总数：728（`git ls-files`）｜ 工作区状态：clean

本文件夹是 Design Skill 的**全量引用与能力索引**，用于回答三个问题：Skill 由什么构成、每项能力落在哪个文件、改动时该读哪里。配套机器可读清单见 `capability-manifest.json`。

## 一、能力地图（六层架构）

| 层 | 目录 / 入口 | 职责 | 索引 |
| --- | --- | --- | --- |
| L0 入口与角色内核 | `SKILL.md`、`AGENTS.md`、`agents/` | Skill 契约、加载策略、风险车道；Designer / Reviewer / Poster 三个角色内核 | [01](01-entry-agents-references.md) |
| L1 规范引用层 | `references/`（15 篇） | H0–H5 设计标准、工作流、质量门禁、色彩、媒体、Web 界面、工具路由 | [01](01-entry-agents-references.md) |
| L2 资产与能力中枢 | `packages/`、`assets/` | Component Hub、IconHub MCP、Dribbble Inspiration Hub、模板/主题/运行时/vendor | [03](03-packages-assets-systems.md) |
| L3 设计系统与知识库 | `design-systems/`（4 套）、`design-knowledge/`、`showcases/` | 可直接落地的生产设计系统、设计规范知识库、案例展示 | [03](03-packages-assets-systems.md) |
| L4 CLI 与脚本层 | `scripts/`（63 脚本 + 14 库） | 统一入口 `design.mjs`、profile/plan 规划、36 个校验器、浏览器 QA、中枢桥接 | [02](02-cli-scripts.md) |
| L5 契约 / 验证 / 夹具 | `schemas/`（42）、`tests/`（37）、`examples/`（65） | JSON Schema 契约、node:test 测试、正负向产物夹具 | [04](04-schemas-tests-examples.md) |

## 二、端到端主线（六阶段门禁流水线）

```
G0 Intake 内容冻结（content-ledger / content-handoff / requirement-verification）
  └─► G1 Taste Contract 2.0 + context_scope 过滤 + Dribbble 素材检索（shots search）
        └─► G2 拓扑线框（Bento / Focal Weight Budget / 8pt 网格）
              └─► G3 高保真注入（OKLCH / 微高光边框 / Component Hub / IconHub）
                    └─► G4 弹簧动效与全状态分支（reduced-motion 降级）
                          └─► G5 双轨验收（校验器静态断言 + 真实视口/极限数据截图 + Reviewer v4）
```

## 三、当前关键规范版本（截至 HEAD ff604ad）

- **Taste Contract 2.0**：`visual_thesis / content_tension / signature_move / anti_reference / restraint_rule`，含 Anti-Visual-Fill（禁止为凑 4 宫格拼指标）。
- **Contextual Semantic Fitness**：严格按 `context_scope`（host / asset / plugin）过滤上游 handoff 字段，跨作用域指标 Fail-Closed。
- **Defensive CSS Layout Protocol**：动态 flex 子项 `min-w-0` + truncate；下拉/搜索 + 按钮上下分层；≤400px 侧栏按钮组 `grid-cols-2/3`。
- **Target Surface Extreme Content Stress**：50+ 字符超长串、零按钮挤出、零溢出。
- **默认精工基线 default-modern-craft**：OKLCH、Display Sans + Mono、1px 微边框、三层阴影、非对称 Bento、Spring 动效、默认简体中文、语义矢量 Icon。
- 自动化校验器侧的两条新静态规则（flex 防御、侧栏按钮网格）**尚未落地**到 `validate-ui-hierarchy.mjs`，目前由规范 + Reviewer 人工红线约束，见 [遗留观察](#五遗留观察)。

## 四、文件索引

| 文件 | 内容 |
| --- | --- |
| [01-entry-agents-references.md](01-entry-agents-references.md) | SKILL.md / AGENTS.md / 3 个 Agent 内核 / 15 篇 references 全量引用与加载时机 |
| [02-cli-scripts.md](02-cli-scripts.md) | `design.mjs` 命令面、63 个脚本分类、14 个共享库 |
| [03-packages-assets-systems.md](03-packages-assets-systems.md) | Component Hub、IconHub MCP、Dribbble Hub、assets、4 套设计系统、知识库、vendor 溯源 |
| [04-schemas-tests-examples.md](04-schemas-tests-examples.md) | 42 个 JSON Schema、37 个测试套件、65 个 example 夹具清单 |
| [capability-manifest.json](capability-manifest.json) | 机器可读能力清单（计数、分类、路径） |

## 五、遗留观察

1. `validate-ui-hierarchy.mjs` 现有 4 条规则（占位英文、Emoji 按钮、Switch 触觉阴影、`p-0` 内边距），Defensive CSS 的静态自动拦截（`FLEX_DYNAMIC_MIN_WIDTH`、`SIDEBAR_BUTTON_GRID`）与配套 snippet（stacked-select-actions / defensive-chip-row）尚未实现；规范层已先行落地。
2. `docs/` 根下 6 份历史优化方案（`design-optimization-plan.md` 等）为 Git 追踪的过程文档，不属于 Skill 运行时资产，但有历史价值，未纳入本次清理；如需瘦身可单独决策归档。
3. Dribbble Hub 当前素材为 4 条种子索引（2026-10-13 入库），依赖每日 sync 持续扩充。

## 六、本次清理记录（2026-10-14）

| 对象 | 类型 | 体积 | Git 状态 | 处理 |
| --- | --- | --- | --- | --- |
| `.exp-skill/`（memory + runs 截图证据） | exp-skill 在本仓库运行时的跨 Skill 残留 | 7.6 MB | gitignored，未追踪 | 移入 macOS 废纸篓 `~/.Trash/design-skill-cleanup-20261014/` |
| `dist/design-2.0.0.tgz` | `pack-skill` 打包产物，可重新生成 | 3.6 MB | gitignored，未追踪 | 同上 |

未发现 `.DS_Store`、`*.bak`、`*.tmp`、`*.orig`、`*.swp`、`*.log` 等垃圾文件。所有 Git 追踪文件均未删除。
