# Quality Report

## Artifact

主题：Design Skill 瘦身效果评估。Reader Job：让 Design Skill 维护者在 60 秒内判断瘦身是否有效、是否牺牲可靠性、下一步是什么。Lane：Standard。Primary shape：source-backed `swiss-evidence-deck`。

## Sources

- `source.json`：唯一事实源，仅含 Slice 11 批准的 source-verbatim 数据、状态、commits 与下一步。
- `claim-map.json`：可见事实到 source quote 的映射。
- `summary-map.json`：60 秒 effectiveness / reliability / next-step 主线。

## Assumptions

- 不推导百分比、节省率、合成分数、面积比例或趋势。
- 静态 validator 通过不替代真实 Aime Chrome 与独立 QA。

## Template

template_id: swiss-evidence-deck
applicable_gates: validate-design-output, validate-summary-map, validate-aesthetic-contract, validate-asset-contract, validate-layout-lock, validate-visual-rhythm, render-smoke, manual-reviewer-pass
- gate_id: validate-design-output
  status: passed
  evidence: `node scripts/validate-design-output.mjs examples/design-slimming-eval-pass`
- gate_id: validate-summary-map
  status: passed
  evidence: `node scripts/validate-summary-map.mjs examples/design-slimming-eval-pass`
- gate_id: validate-aesthetic-contract
  status: passed
  evidence: `node scripts/validate-aesthetic-contract.mjs examples/design-slimming-eval-pass`
- gate_id: validate-asset-contract
  status: passed
  evidence: `node scripts/validate-asset-contract.mjs examples/design-slimming-eval-pass`
- gate_id: validate-layout-lock
  status: passed
  evidence: `node scripts/validate-layout-lock.mjs examples/design-slimming-eval-pass`
- gate_id: validate-visual-rhythm
  status: passed
  evidence: `node scripts/validate-visual-rhythm.mjs examples/design-slimming-eval-pass`
- gate_id: render-smoke
  status: not_run
  evidence: 按要求不运行 Playwright，等待 Aime Chrome
- gate_id: manual-reviewer-pass
  status: failed
  evidence: 独立 Aime Chrome QA 判定 CHANGES_REQUIRED；MAJ-005、MAJ-006、MIN-001 已修复，等待复验

## Status

artifact_status: partial
claim_assurance: local_provenance_only
semantic_entailment: manually_reviewed
summary_integrity: source_mapped
number_integrity: verbatim_checked
plain_language: manual_reviewed
visual_qa: blocked
accessibility: basic_checked
runtime.browser_smoke: missing
runtime.browser_launch: blocked

## Taste Contract

- 双轨：认知表面与运行时完整性在末页汇合。
- Swiss grid、细规则线、有限蓝色强调、警示色仅标记阻塞；无装饰图标，无面积编码比例。
- 结论先行；测试账本完整披露，不写“全部通过”。

## Read-only structure baseline

选择 `examples/swiss-evidence-deck-production-pass`。它与其它成熟 deck fixture 同批进入仓库，但具有更完整的 manifest、slide plan、source、summary map、claim map、quality report 与浏览器 QA 证据；仅复用文件职责、closed-contract 组织、合法 layout id 与 evidence-first 阅读结构。未复制其业务数据、品牌表达或 claims。同步只读检查了 `assets/templates/swiss-evidence-deck.html`、`assets/templates/registry.json`、`assets/templates/layouts/swiss-s01-s22.json` 及 manifest/deck-plan/summary-map/claim-map/review/render 相关 schema。

## Validation

模板声明中的六项静态门禁在初版通过；本次修复后重新执行并记录结果。`validate-claim-map`、`validate-schemas`、本地引用闭合、禁止 claim 与 source-verbatim occurrence 审计也必须保持通过。Playwright 按要求未运行；`render-smoke` 保持 `not_run`。独立 Aime Chrome QA 已判定 `CHANGES_REQUIRED`，`manual-reviewer-pass` 保持 `failed`，直到修复复验通过。

## Visual QA

独立 Aime Chrome QA 已判定 `CHANGES_REQUIRED`。修复前证据记录在 `render-evidence.json`：宽屏下 slides 3/5/6 超过 724px；窄屏下 slides 3/4/6 超高，且 slide 5 导致 document overflow 与标题裁切。MAJ-005、MAJ-006、MIN-001 已实施 CSS 修复，但不得据此宣称浏览器 PASS。待在 1230 / 390 / 320 重新检查每页高度、document width、固定导航净空、标题完整性、按钮与程序化 focus、console 和 page errors。

## Data Gaps

修复后的 Aime Chrome 复验结果尚未产生；独立 QA 尚未关闭 MAJ-005、MAJ-006、MIN-001。

## Remaining Risks

既有 Playwright runtime / `browser_smoke missing` 环境阻塞继续保留。在真实 Aime Chrome 与独立 QA 完成前，不声明 Slice 11 completed，也不声明整体项目 browser/visual 全量通过。
