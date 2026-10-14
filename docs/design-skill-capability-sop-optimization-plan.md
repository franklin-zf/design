# Design Skill 完整优化方案

日期：2026-10-14
范围：本地 Design Skill 的能力架构、Dribbble MCP、SOP、证据链、测试与发布边界

## 1. 执行摘要

Design Skill 已具备内容保真、Profile 路由、四套生产设计系统、组件与图标
中枢、浏览器渲染、证据契约和独立 Review 能力。当前主要问题不是缺少
功能，而是部分链路存在：

```text
指令已要求 → Schema 未表达 → Runtime 未执行 → Evidence 未绑定
```

优化目标是让每项能力同时满足：

1. 有唯一权威入口；
2. 可被稳定调用；
3. 有结构化输入输出；
4. 进入测试与 npm 包闭包；
5. 形成真实表面和发布证据。

### 本轮已完成

- Dribbble Hub 已固化为只读 stdio MCP；
- 提供 status/search/get/list/create binding 五个只读 MCP 工具；
- `design.mjs shots` 保留为无 MCP 环境的 CLI fallback；
- MCP、CLI、素材校验、package closure 和统一测试共用同一实现；
- 第三方 PNG 已移出 npm 包并进入私有 user cache；
- `design-inspiration-binding/v1` 已接入 plan、runner、validator；
- `browser-test-evidence/v1` 已接入 Playwright 与 Browser MCP binder；
- PRD requirements 自动加入 browser evidence gate；
- `design.mjs review` 负责产证，`check` 保持只读；
- static/browser/strict 测试已拆分；
- capability manifest 已改为自动生成并检查漂移；
- Dribbble ingest/retire/freshness 已受控；
- MCP 已增加参数、请求大小和串行处理限制；
- 视觉默认值已服从 Profile，不再全局强制具体风格；
- Playwright 1.61.1、Chromium 和 Headless Shell 1228 已安装并可启动；
- Phase 0-2 聚焦测试已通过，最终全量验证见本文验收快照。

### 剩余改进

1. `validate-design-skill.mjs` 的 required-files 仍为人工基线；
2. Dribbble 检索仍缺少大规模相关性评测集。

## 2. 当前能力基线

| 能力域 | 当前状态 | 判断 |
| --- | --- | --- |
| Source extraction / content ledger | 已闭环 | 可保留 |
| 派生值代码溯源 | 已闭环 | 可保留 |
| Profile / template resolver | 已闭环 | 唯一路由权威 |
| 四套生产设计系统 | 已闭环 | 继续按任务边界使用 |
| Component Hub | 已闭环 | 可保留 |
| IconHub MCP | 已闭环 | 可保留 |
| Dribbble Hub MCP | 已闭环 | metadata-only package + private cache + binding |
| Browser render / human factors | 已闭环 | Playwright 与 host trace 共用 evidence schema |
| Requirement verification | 已闭环 | P0/P1 绑定 canonical browser evidence |
| Review / attestation | 已闭环 | review 产证、check 验证 |
| npm package closure | 已闭环 | 可保留 |
| Capability inventory | 已闭环 | generator + digest + `--check` |
| Knowledge / showcase | 有严格边界 | 保持显式启用 |

### 当前验证快照

| 检查 | 结果 |
| --- | --- |
| Browser preflight | package-local Playwright 与 Chromium launch 通过 |
| `npm run test:static` | 300 passed / 0 failed / 1 conditional skip |
| `npm run test:browser` | 24 passed / 0 failed |
| `npm run validate -- --strict` | 通过 |
| `npm run test:strict` | static + browser + 全 surface smoke 通过 |
| Render-spec browser suite | 6 / 6 通过 |
| Component browser suite | 2 / 2 通过 |
| Human-factors browser suite | 9 / 9 通过 |
| Packed references | 32 references 通过 |

## 3. 目标架构

```text
Request / PRD / Sources
          │
          ▼
G0 Truth
source extraction → content ledger → requirement map
          │
          ▼
G1 Direction
Taste Contract → profile resolver → design system
          │
          ├── conditional → Dribbble Hub MCP
          │                  status / search / get
          │                         │
          │                         ▼
          │               inspiration-binding
          ▼
G2 Structure
reading order → topology → responsive states
          │
          ▼
G3 Build
templates / components / icons / media
          │
          ▼
G4 Browser Review
PRD paths → actions → assertions → browser-test-evidence
          │
          ▼
G5 Release
truth / function / surface / craft / ownership
```

### 权威顺序

```text
source / PRD
> verified brand or existing product system
> scripts/lib/design-profile.mjs
> content-native composition
> conditional inspiration methods
> discretionary craft defaults
```

Dribbble MCP 只提供参考方法，不决定 Profile、产品事实或发布状态。

## 4. 风险与优化矩阵

| ID | 优先级 | 问题 | 状态 | 结果 / 下一步 |
| --- | --- | --- | --- | --- |
| R1 | P0 | 第三方 PNG 分发风险 | 已关闭 | npm metadata-only；预览转私有 cache |
| R2 | P0 | inspiration 无 Schema | 已关闭 | `design-inspiration-binding/v1` |
| R3 | P0 | browser-test 弱证据 | 已关闭 | `browser-test-evidence/v1` + digest chain |
| R4 | P0 | 视觉默认值冲突 | 已关闭 | Profile-resolved authority |
| R5 | P1 | Browser 执行面不互通 | 已关闭 | Playwright + host trace binder |
| R6 | P1 | check 不执行 browser | 已关闭 | 新增 `design.mjs review`，check 明示状态 |
| R7 | P1 | 测试环境耦合 | 已关闭 | static / browser / strict |
| R8 | P1 | Capability manifest 漂移 | 已关闭 | generator + source digest |
| R9 | P1 | Dribbble 无生命周期 | 已关闭 | ingest / retire / freshness |
| R10 | P2 | required-files 仍手工维护 | 部分完成 | package/reference graph 已自动校验；后续移除剩余清单 |
| R11 | P2 | MCP 无资源上限 | 已关闭 | 参数 64 KiB、stdio 1 MiB、串行处理 |
| R12 | P2 | 检索缺少大规模评测 | 待持续优化 | 当前由字段权重、去重和 fixture 覆盖 |

## 5. 核心方案

### 5.1 Dribbble MCP

#### 保留能力

```text
get_dribbble_library_status
search_dribbble_references
get_dribbble_reference
list_dribbble_references
```

#### 新增 binding

新增 `design-inspiration-binding/v1`：

```text
trigger_reason
selected_reference_ids
source_urls
snapshot_digests
extracted_methods
do_not_copy
skip_reason
mcp_server_version
library_version
artifact_type
execution_plan_digest
```

规则：

- 新视觉方向或用户明确要求灵感时调用；
- 精确改版、既有设计系统实现、纯证据 Review 可跳过；
- 跳过必须记录 `skip_reason`；
- 没有相关素材时，只阻断“Dribbble 参考已完成”的声明，不阻断
  content-native 方向；
- Dribbble 不提供产品事实、品牌授权或可直接复制的成品。

#### 素材治理

- `sync` 标记 deprecated，使用 `verify`；
- `ingest` 必须输入精确 source URL、作者、预览 URL、权利状态和人工标注；
- 使用 shot id + preview digest 去重；
- 增加 `last_verified_at`、`inactive_reason` 和复审记录；
- 默认排除失效、未授权或未复审记录；
- npm 包不默认分发第三方 PNG。

### 5.2 PRD Browser Review

新增 `browser-test-evidence/v1`，至少包含：

```text
artifact_digest
execution_plan_digest
render_spec_digest
browser_runtime_identity
requirement_id
viewport
initial_state
actions[]
assertions[]
expected
actual
console_errors
page_errors
network_policy
before_screenshot_digest
after_screenshot_digest
runner_event
reviewer_decision
```

P0/P1 的 `content / functional / interaction / responsive` requirement 必须：

1. 在真实浏览器执行；
2. 覆盖声明状态；
3. 绑定当前 artifact 和 plan digest；
4. 记录 expected / actual；
5. 无 console、page 或未授权 network error；
6. 由 Reviewer 复核。

代码检查、DOM 存在、单张截图或任意 JSON 文件不能替代 browser evidence。

### 5.3 Browser Adapter

统一三类执行面：

```text
Playwright Adapter
Browser MCP Adapter
Target-player Adapter
        │
        ▼
browser-test-evidence/v1
```

Adapter 只改变执行方式，不改变 evidence schema 和发布门禁。

### 5.4 CLI 职责

```bash
design.mjs profile   # 解析视觉控制
design.mjs plan      # 生成不可变执行计划
design.mjs review    # 产生 browser / requirement / visual evidence
design.mjs check     # 只读验证已有证据
design.mjs preflight # 验证能力可用性
```

`check` 输出必须明确：

```text
browser_required
browser_executed
browser_evidence_current
release_blockers
```

### 5.5 视觉权威收敛

删除 Agent 中以下全局默认：

- 所有场景使用 Bento；
- 所有标题负字距；
- 所有界面使用 OKLCH 高饱和光照；
- 所有容器使用三层阴影；
- 所有交互使用 spring。

这些方法只能来自 resolved Profile、现有品牌系统或内容关系。

### 5.6 能力清单自动化

新增 `scripts/generate-capability-manifest.mjs`：

1. 从 package、CLI help、registries、schemas、tests 和 design systems 生成；
2. 记录输入 digest；
3. 支持 `--write` 和 `--check`；
4. CI 中禁止 snapshot 漂移；
5. README 只保留稳定架构，不复制动态计数。

## 6. 目标 SOP

| Gate | 输入 | 动作 | 输出 | 阻断条件 |
| --- | --- | --- | --- | --- |
| G0 定义与冻结 | source、PRD、reader job | 冻结事实、P0/P1、surface、lane | ledger、requirement map | 关键输入缺失、事实漂移 |
| G1 方向 | ledger、brand、profile signals | Taste Contract、Profile、条件调用 Dribbble MCP | profile、inspiration binding | Profile 冲突、伪造参考 |
| G2 结构 | content handoff、requirements | reading order、topology、dense/error/narrow | structure / direction record | 内容覆盖不一致 |
| G3 构建 | approved structure | static-first、components、icons、media | artifact、manifest | 缺 provenance、placeholder |
| G4 浏览器验收 | artifact、plan、PRD | 执行路径、状态、断言、多视口 | browser-test evidence | 未执行、失败、证据过期 |
| G5 发布 | 所有 evidence | truth/function/surface/craft/ownership Review | Lane/Proven/Not proven/Next | 任一非补偿门禁失败 |

## 7. 实施路线

### Phase 0：消除错误授权（已完成）

交付物：

1. Dribbble 分发许可决策；
2. `design-inspiration-binding/v1`；
3. `browser-test-evidence/v1`；
4. 统一后的视觉权威文档与 Agent 指令；
5. 对应 validators、schemas、fixtures 和 tests。

退出条件：

- 无法通过自由文本伪造 license；
- 无 inspiration binding 不得声称使用了 Dribbble；
- 无 runner-bound browser evidence，P0/P1 不得通过；
- Agent、Workflow、Standards 不再冲突。

### Phase 1：形成完整调用链（已完成）

交付物：

1. Browser Adapter；
2. `design.mjs review`；
3. Dribbble MCP host 注册配置；
4. `test:static`、`test:browser`、`test:strict`；
5. `check` 的 browser 状态输出。

退出条件：

- Playwright 与 Browser MCP 产生相同 evidence schema；
- `review` 可完成 PRD 路径并生成证据；
- `check` 不再暗示自己执行了浏览器；
- 静态测试不依赖浏览器安装。

### Phase 2：降低维护成本（主体完成）

交付物：

1. Capability manifest generator；
2. package/reference graph 校验与 required-files 收敛；
3. Dribbble ingest / freshness / retirement；
4. inspiration 字段从 Taste Contract/direction 中抽离为独立 binding；
5. MCP 请求大小、并发和超时限制。

退出条件：

- Manifest 与运行时零漂移；
- 素材可新增、复审、停用和追踪；
- 同一设计决策只存在一个结构化记录位置；
- MCP 对异常输入 fail closed。

剩余低风险工作：

- 删除 `validate-design-skill.mjs` 中尚存的手工 required-files 基线；
- 建立更大规模的 Dribbble 搜索相关性评测集。

## 8. 验收命令

```bash
node packages/dribbble-hub-mcp/bin/dribbble-hub.mjs status
node --test packages/dribbble-hub-mcp/tests/*.test.mjs
node scripts/design.mjs preflight --require=browser_launch
node scripts/validate-design-skill.mjs .
node scripts/validate-packed-references.mjs .
npm test
npm run validate -- --strict
npm run test:strict
```

最终验收标准：

- 新设计可证明是否、为何、如何使用 Dribbble；
- 每条外部参考具有明确权利状态和不可复制边界；
- PRD P0/P1 只有真实浏览器执行后才能通过；
- Browser Adapter 产出统一证据；
- Profile resolver 仍是唯一视觉路由权威；
- 静态测试、浏览器测试和严格测试职责清晰；
- capability manifest、package closure 和测试清单自动一致；
- Validator 通过不被描述为审美通过或用户验证。

## 9. 非目标

- 不把 Dribbble 设为产品事实来源；
- 不复制 Dribbble 原图、品牌、业务数据或完整构图；
- 不让 MCP 绕过 Profile resolver；
- 不用 Validator 分数替代人工视觉判断；
- 不把 HTML handoff 声称为原生 PPTX；
- 不把内部 Review 标记为 `user_validated`。
