# Quality Report

## Artifact

Northstar 36 产品 B 端销售驾驶舱：PC 与手机端响应式 HTML，展示销量、合同额、确认收入、收现、合同完成率和收现完成率。

## Sources

使用 `source/simulated-products.json` 作为固定 seed 的模拟源数据，由 `calculations/build-dashboard-data.mjs` 生成 `derived/dashboard-data.json` 与浏览器数据包。

## Assumptions

数据明确标注为 simulated；金额按整元计算，界面仅做万/百万/亿元格式化。完成率的分母分别是合同目标与收现目标，区域汇总采用目标加总后计算，而不是简单平均产品百分比。

## Validation

## Template
template_id: operational-dashboard
applicable_gates: validate-design-output, validate-claim-map, render-smoke
- gate_id: validate-design-output
  status: passed
  evidence: node /Users/ff/.codex/skills/design/scripts/validate-design-output.mjs .
- gate_id: validate-claim-map
  status: passed
  evidence: node /Users/ff/.codex/skills/design/scripts/validate-claim-map.mjs .
- gate_id: render-smoke
  status: passed
  evidence: node qa/render-smoke-local.mjs index.html --viewports=desktop,mobile --strict-layout
provenance: node /Users/ff/.codex/skills/design/scripts/validate-data-provenance.mjs . --execute-trusted passed
drivers: 区域合同完成率与整体收现完成率的对照，来自 derived/dashboard-data.json
guardrails: 页面顶部模拟数据提示、公式说明和无外部来源声明
filters: 产品搜索、区域、品类与排序均在浏览器本地执行
freshness: FY2026 Q2 固定模拟快照；不代表实时业务数据

## Status

artifact_status: schematic
claim_assurance: local_provenance_only
semantic_entailment: manually_reviewed
summary_integrity: not_applicable
number_integrity: not_applicable
plain_language: manual_reviewed
visual_qa: smoke_passed
accessibility: basic_checked
runtime.browser_smoke: available
runtime.browser_launch: available
calculation_integrity: code_tested

## Visual QA

浏览器严格布局检查通过。截图：`qa/sales-dashboard-36-products-desktop.png`、`qa/sales-dashboard-36-products-mobile.png`。交互探针 `qa/browser-probe.json` 在 1440px、390px、320px 通过：默认 36 行、搜索 Cloud 为 3 行、追加 East 为 1 行、重置回 36 行；无文档横向溢出、无小于 44px 的交互控件、无控制台错误、无外部网络请求。

## Data Gaps

没有接入真实 CRM/ERP、权限、时间序列、产品成本、税务口径或合同状态明细。

## Remaining Risks

这是可复现的模拟 fixture，不应被用于经营决策。当前视觉采用冷蓝色 B 端销售运营工作台：深蓝固定导航、冰蓝工作区、浅色高密度表格、蓝色目标进度条和青绿色收现状态；不使用外部品牌素材。

Duplicate handling: source product_id is unique; no duplicate product rows were merged.
