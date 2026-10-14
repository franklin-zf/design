# 03 能力中枢、资产与设计系统

## 一、独立能力包（packages/）

### 1.1 Component Hub（`packages/component-hub/`）

免编译 HTML/Tailwind/CSS Snippet 中枢，范式取自 Shadcn/ui、Radix、Tremor、Semi、Aceternity。

| 文件 | 内容 |
| --- | --- |
| `src/index.mjs` | `COMPONENT_CATALOG`、`searchComponents()`、`getComponent()`、`getComponentSnippet()` |
| `scripts/` 侧入口 | `scripts/component-hub.mjs`（search/get/list） |
| `src/snippets/bento-grid-2x2.html` | 非对称 Bento 网格 |
| `src/snippets/kpi-metric-card.html` | Tremor 风格 KPI 指标卡 |
| `src/snippets/filter-toolbar.html` | Semi 风格筛选工具栏 |
| `src/snippets/card-header-actions.html` | 卡片头部操作栏 |
| `src/snippets/switch-control.html` | 防消融 Switch（触觉内阴影 + 微边框） |
| `src/snippets/evidence-diff-hero.html` | 去重证据对比 Hero（单点真理 Header + 事实冲突高亮 + 抽帧区） |
| `tests/component-hub.test.mjs` | 4 项测试 |

### 1.2 IconHub MCP（`packages/icon-hub-mcp/`）

确定性图标检索与 SVG 清洗的 MCP 服务；工具：`search_icons`、`get_icon_svg`、`batch_fetch_icons`。

| 路径 | 内容 |
| --- | --- |
| `bin/icon-hub.mjs` | MCP 服务入口；主仓库桥接：`scripts/icon-hub.mjs` |
| `src/sources/iconfont.mjs` | iconfont.cn 数据源（仅作本地 SVG 下载源，非运行时依赖） |
| `src/sources/lucide-dataset.mjs` | Lucide 离线 registry |
| `src/sources/svg-cleaner.mjs` | SVG 清洗（去脏属性、统一 viewBox） |
| `src/tools/search-icons.mjs` / `get-icon-svg.mjs` / `batch-fetch.mjs` | 三个 MCP 工具实现 |
| `tests/icon-hub.test.mjs` | 5 项测试 |

### 1.3 Dribbble Hub MCP（`packages/dribbble-hub-mcp/`）

| 路径 | 内容 |
| --- | --- |
| `src/index.mjs` | 只读 MCP：status/search/get/list/create inspiration binding |
| `bin/dribbble-hub.mjs` | stdio MCP 与独立 CLI 入口 |
| `mcp-server.json` | host 注册清单、stdio 命令、cache 环境与工具列表 |
| `assets/dribbble-shots/index.json` | 4 条精确 Dribbble shot 来源：B2B 分析、商家总览、AI 策略关系台、移动 POS |
| `~/.cache/design-skill/dribbble/*.png` | 可选私有预览 cache；不进入 npm 包 |
| `scripts/dribbble-hub.mjs` | Design CLI 桥接：查询、binding、ingest、retire、freshness |
| `scripts/manage-dribbble-library.mjs` | 受控素材生命周期；去重、active/inactive、复审时效 |
| `tests/dribbble-hub.test.mjs` | metadata、cache、检索与弃用行为测试 |
| `packages/dribbble-hub-mcp/tests/` | MCP manifest、查询、binding 与 fail-closed 测试 |

每条记录区分来源事实与本地人工标注：来源事实含精确 shot URL、作者、
预览 URL、digest 与 attribution；人工标注只提取 `layout_topology`、
`visual_methods`、`do_not_copy`、`applicable_scenes` 与检索词。第三方图片
只允许进入私有 cache，禁止随 Skill 分发或直接复用。

## 二、运行时与模板资产（assets/）

| 子目录 | 内容 |
| --- | --- |
| `assets/templates/*.html` | 8 个零构建模板：dashboard、report、deck、poster、tweakable-artifact、operational-product、expressive-web-stage、editorial-evidence、swiss-evidence-deck |
| `assets/templates/registry.json` | 模板注册表 |
| `assets/templates/layouts/*.json` | 5 个布局定义（各设计系统 v1 + poster + swiss-s01-s22） |
| `assets/templates/handoffs/*.json` | designer-handoff / intake-direction / poster-handoff / reviewer-report 骨架 |
| `assets/themes/presets.json` | 风格预设注册表（style preset） |
| `assets/components/registry.json` | 组件资产注册表 |
| `assets/runtime/deck-bootstrap.js`、`human-factors.css/js` | Deck 启动脚本与人因标注运行时 |
| `assets/vendor/open-design-html-ppt/` | 第三方 vendor：base.css、runtime.js，带 `LICENSE` 与 `PROVENANCE.json`（`validate-vendor-provenance` 校验） |

## 三、生产设计系统（design-systems/，4 套）

每套系统结构一致：`DESIGN.md`（设计主张）、`USAGE.md`（使用边界）、`tokens.css` + `design-tokens.json`（令牌）、`layouts.css`（布局）、`components.html`（组件预览）、`components.manifest.json`、`manifest.json`。

| 系统 | 任务边界 |
| --- | --- |
| `operational-product` | 运营后台 / 高密度控制台（含 H0 基线、render-spec 与 QA 输出） |
| `expressive-web` | 品牌营销 / 表现型 Web 页面 |
| `editorial-evidence` | 证据型长文 / 研究报告 |
| `swiss-deck` | Swiss 风格 Deck（swiss-s01-s22 layout lock、visual rhythm） |

公共部分：`design-systems/_schema/`（package、tokens、components-manifest 三个 schema）、`design-systems/defaults/visual-recipe-registry.json` 与 `design-profile-catalogue.json`（profile resolver 的唯一数据源）。系统包由 `build-production-design-systems.mjs` 构建、`validate-design-system-package.mjs` 逐包校验。

## 四、知识库与案例

| 路径 | 内容 |
| --- | --- |
| `design-knowledge/registry.json` | 知识库注册（`query-design-spec.mjs` 检索入口） |
| `design-knowledge/DESIGN_STANDARDS.md` | 沉淀的设计标准长文 |
| `design-knowledge/evaluation-policy.json` | 评估策略（design-evaluation gate 消费） |
| `showcases/registry.json` | 展示案例注册表（`validate-showcase-registry` 校验） |

## 五、外部资产溯源纪律

- 第三方代码只能落在 `assets/vendor/`，必须带 LICENSE + PROVENANCE，CI 由 `validate-vendor-provenance.mjs` 强制。
- iconfont 等外部图标只作为**本地清洗后 SVG**入库，禁止运行时网络依赖（media-design.md）。
- Dribbble 参考图只用于内部视觉方法研究；保留 attribution，禁止把原图、品牌、业务内容或完整构图直接复用到交付物。
