> ⚠️ **【已作废 · v1】** 本文件所含"直连 Hono 后端 / OpenAI 兼容 / 第三方抠图 API / node @imgly 自托管"等全部结论已被 v4 推翻。以 `decision-brief-miniapp-ai-v4-2026-07-07.md` 为准。

# 小程序 AI 工具串联产品 · 待拍板决策项对比分析

**日期**：2026-07-07
**类型**：决策拍板对比（Decision Brief）
**参与成员**：路径（路线图规划师 Roadie）· 主理人汇编
**代码依据**：codegraph + semble 已验证 `craftisle-resume` / `craftisle-app` 真实签名与实现

---

## 📌 TL;DR（执行摘要）

- 共 **5 个拍板项**，其中 **R1 / R3 / R4 需老板拍板**，R2 随 R1 自动消解，R5 已在 Spec 锁定。
- **主理人总推荐**：`R1=B`（直连 Hono 后端）· `R3=A`（混元 OpenAI 兼容仅改配置）· `R4=第三方抠图 API 起步 + node 版 @imgly 自托管演进` · `R5=A`（完全数据隔离）。
- **核心逻辑**：复用优先——所有"差异/优劣"都锚在真实代码事实（如 `createResumePdfFile` 返回 `File` 需包 `Buffer`、`idphoto/inference.ts` 是浏览器/GPU 绑定不能进云函数）。
- **最坏后果**：R1 误选 A 且 R2 未过 → PDF 导出整链阻塞；R3 误判兼容 → F6b/F6c 重写吃掉证件照工期；R4 误选纯端侧/Sharp → 回执不达标丧失对标资格。

---

## 🎯 核心结论卡片（速拍表）

| 决策项 | 推荐 | 备选 | 关键差异一句话 | 拍板看什么 |
|------|------|------|------|------|
| **R1 架构** | B 直连 Hono | A 云函数 / C 混合 | B 复用 `createResumePdfFile` 零改造省 ~58% 工期；A 需把 `File`→`Buffer` 且要闯 R2 | 上线速度 / 复用度 / R2 阻塞风险 |
| **R3 混元接入** | A OpenAI 兼容 | B 自写 adapter | A 仅改 `AI_PROVIDERS` 配置，prompt+清洗零改；B 重写 LLM 层 +5~8 人日 | T0 兼容性实测 / P0 工期 |
| **R4 抠图引擎** | 第三方 API 起步→node 自托管 | 端侧 Canvas / 纯 Sharp | 端侧/Sharp 无发丝级，回执不达标；自托管/API 达合合照级 | 抠图质量 / 成本模型 / 是否冲击"免费" |
| **R2 云函数导出** | （R1=B 时自动消解） | B 走 Hono | 仅 R1 选 A 才需验证 @react-pdf 云函数可行性 | — |
| **R5 数据割裂** | A 完全隔离（Spec 锁定） | B 轻量打通 | 代码可共用，账号/数据独立集合 | 合规 / 复用 web 资产 |

---

## 决策项 1：R1 整体架构

### 选项 A｜微信云函数（移植 Node/Sharp/craftisle-resume 逻辑）
- **描述**：把 `packages/pdf`、`packages/docx`、`packages/schema`、`packages/ai`、`packages/import` 拷进云函数，平台层（DB/登录/存储）全换云开发。
- **优**：贴合 Spec"云开发"字面决策；部署单一、免服务器运维。
- **劣**：复用有损耗——`createResumePdfFile` 返回浏览器 `File`、`buildDocx` 返回 `Blob`，需改包 `Buffer`；须验证 @react-pdf/renderer + 中文字体体积/冷启动（R2）。
- **成本**：开发 +6 人日（移植 + Buffer 适配 + 冷启动验证）；运行=云函数按量，冷启动偶发卡顿。
- **风险**：R2 未过则 PDF 导出整链路阻塞；与 craftisle-resume 双份维护。
- **适用条件**：强约束"必须云开发"。
- **推荐度**：★★★☆☆

### 选项 B（推荐）｜小程序直连现有 Hono 后端
- **描述**：小程序 `request` 直连已部署 Hono（Vercel）后端，新增 `mini` 路由；AI 切混元；加 openid 适配。
- **优**：`createResumePdfFile`/`buildDocx`/`applyResumePatches` 零改造复用；Postgres/存储/5 套模板直接可用；复用度最高（省 ~58% 工期）。
- **劣**：偏离 Spec"云开发"字面；需配 request 合法域名；登录走 openid 而非 Better Auth；与 R5 数据割裂需显式隔离（`users/assets` 新集合）。
- **成本**：开发 +2 人日（mini 路由 + openid）；运行=现有 Hono 实例边际成本极低。
- **风险**：合法域名审核；微信登录与 openid 处理差异需单独写。
- **适用条件**：以降本 + 提速为优先。
- **推荐度**：★★★★★

### 选项 C｜混合（导出/AI 走 Hono，图片走云函数）
- **描述**：简历链路走 B，证件照 Sharp/`passportPhoto` 走云函数。
- **优**：证件照就近微信生态；简历复用最大化。
- **劣**：两套部署、运维翻倍；图片与简历数据跨端同步复杂。
- **成本**：开发 +8 人日；运行双计费。
- **风险**：整体架构复杂度高，P0 工期压力大。
- **适用条件**：云函数对图片处理有强约束时。
- **推荐度**：★★☆☆☆

**主理人推荐 + 决策标准**：推荐 **B**。老板看——① 首版上线速度（B 省 6+ 人日）；② 复用度（B 近乎零改）；③ R2 阻塞风险（A 有、B 无）；④ 接受"直连 Hono"偏离 Spec 字面。若法务/合规强制云开发，退化 A。

---

## 决策项 2：R3 混元 LLM 接入方式

### 选项 A（推荐）｜混元暴露 OpenAI 兼容协议 → 仅改配置
- **描述**：`getModel()` 已支持 `openai-compatible`（`createOpenAICompatible({name,apiKey,baseURL}).languageModel(model)`），改 `AI_PROVIDERS` 即可。
- **优**：F6b/F6c 的 `pdfParserSystemPrompt`/`analyzeResumeSystemPrompt` 及 `sanitizeAndParseResumeJson` 清洗逻辑零改；成本最低、风险最小。
- **劣**：依赖混元网关确为 OpenAI 兼容（需 T0 实测）。
- **成本**：开发 1 人日（配置 + 连通性验证）。
- **风险**：协议微调需小补；模型质量波动。
- **适用条件**：混元 Hy3 暴露 `/v1/chat/completions` 兼容。
- **推荐度**：★★★★★

### 选项 B｜混元不兼容，自写 adapter
- **描述**：重写 LLM 调用层 + prompt/清洗适配。
- **优**：不依赖兼容性假设。
- **劣**：重写 `service.ts` 调用层、迁移 `sanitizeAndParseResumeJson` 清洗、重写 prompt 适配；开发量 +5~8 人日；P0 工期直接受压。
- **成本**：开发 +5~8 人日；运行同 A。
- **风险**：清洗逻辑重写易引入"虚构"漏洞，破坏 Spec"禁虚构"约束。
- **适用条件**：实测确认不兼容时才选。
- **推荐度**：★★☆☆☆

**主理人推荐 + 决策标准**：推荐 **A**。老板看——① T0 先做兼容性实测（一日可决）；② 选 A 可保 F6b/F6c 在 P0 内交付；③ 选 B 会吃掉证件照引擎工期。最坏：若直到 T1 才发现不兼容，需立刻切 B 并砍 P1。

---

## 决策项 3：R4 证件照 matting/换底引擎（核心难点）

> 约束前提：`craftisle-app/lib/idphoto/inference.ts` 是**浏览器/Canvas/GPU 绑定**（`document.createElement('canvas')`、`ImageData`、`device:"gpu"`），**不能直接跑微信云函数**。内含 `ID_PHOTO_SIZES`（6 规格）、`BG_COLORS`（5 色）、`removeBackgroundML`（ISNet 发丝级）、`applyBackground`、`cropToSize`。

### 选项 1｜移植 node 版 @imgly/background-removal 服务端
- **描述**：对应 `removeBackgroundML` 的 ISNet UAN 能力，onnxruntime-node 跑。
- **优**：发丝级抠图（与竞品合合照同级）；自托管免调用费；复用 `ID_PHOTO_SIZES`/`BG_COLORS`。
- **劣**：`device:'gpu'` 浏览器绑定，node 版需评包体积/冷启动；GPU 算力成本；开发 +8~12 人日。
- **成本**：开发 8~12 人日 + 自托管 GPU 算力（月几百元级）。
- **风险**：onnx 模型体积大、首包加载慢；与 R2 同类风险。
- **适用条件**：追求发丝级 + 长期降本、接受前期投入。
- **推荐度**：★★★★☆

### 选项 2（推荐起步）｜第三方抠图 API（Remove.bg / 合合照类）
- **描述**：调外部 API 返回透明图，再 `applyBackground` 换底。
- **优**：质量稳定、免运维、上线快（2~3 人日）；发丝级达标。
- **劣**：按张计费，侵蚀"免费混元"卖点；依赖外部 SLA；数据出境合规需评估。
- **成本**：开发 2~3 人日 + 单张 0.1~0.5 元（量大月成本数千元）。
- **风险**：成本随量线性上升；断供风险。
- **适用条件**：先快速上线、量未起时。
- **推荐度**：★★★★☆

### 选项 3｜小程序端 Canvas 跑 `inference.ts`
- **描述**：直接复用已写好的浏览器实现，`removeBackground` 容差兜底（无 GPU）。
- **优**：省移植、端侧免费、零服务端算力。
- **劣**：仅容差兜底（非发丝级），精度有限；影响 F3 检测与回执达标；与"发丝级对标合合照"不符。
- **成本**：开发 3~4 人日（端侧封装）。
- **风险**：抠图质量不达标 → 合规/回执失败率上升。
- **适用条件**：仅作 MVP 兜底、后续升级。
- **推荐度**：★★★☆☆

### 选项 4｜纯 Sharp `flatten` 白底
- **描述**：`passportPhoto` 的 `resize+flatten(白底)+jpeg q95`，无抠图。
- **优**：成本最低、Node 直接跑、最稳。
- **劣**：无发丝级 / 无换蓝红底，仅满足"白底合规"最低要求；对标合合照明显偏弱。
- **成本**：开发 1 人日。
- **风险**：换底 5 色（`BG_COLORS`）无法实现 → 差异化受损。
- **适用条件**：极致降本、接受质量妥协。
- **推荐度**：★★☆☆☆

**主理人推荐 + 决策标准**：推荐 **选项 2（先第三方 API）起步 + 选项 1（node @imgly）为降本演进**。老板看——① 抠图质量（发丝级与否直接定合规/回执达标）；② 成本模型（自托管 vs 按张）；③ 是否冲击"免费"卖点（端侧/自托管不冲击，第三方按张冲击）；④ 与 F3 检测的配套。最坏：选 3/4 导致回执不达标，被 nik拼/完美证件照碾压。

---

## 决策项 4：R2 导出链路上云函数可行性（仅 R1=A 时需）

- **选项 A**：验证 @react-pdf/renderer 云函数体积/冷启动——开发 0.5 人日验证，失败则阻塞 F7。
- **选项 B**：导出改走 Hono 后端（规避云函数限制）——与 R1-B 一致，零验证风险。
- **结论**：若 R1 选 B 则本项自动消解；选 A 必须先验 R2。

---

## 决策项 5：R5 数据割裂策略

- **选项 A（Spec 已锁定）**：与 web 端 Craftisle 完全账号/数据隔离——代码共用（`resumeDataSchema`/`createResumePatches`），但 `users/assets/workflows` 独立集合、openid 独立。优：合规清晰、零耦合；劣：无法复用 web 用户资产。
- **选项 B**：同主体轻量打通——省登录、可导流，但牺牲隔离、增耦合与合规面。
- **结论**：Spec 已锁定 **A**，无需再拍板；B 仅作未来选项记录。

---

## ✅ 行动清单（拍板后）

| # | 行动 | 负责方 | 时间窗 |
|---|------|--------|--------|
| 1 | 老板拍板 R1（B 推荐）/ R3（A 推荐）/ R4（第三方起步+node 演进） | 产品负责人 | T-0 当日 |
| 2 | T0：混元 Hy3 兼容性实测（OpenAI `/v1/chat/completions` 探活） | 后端 | 1 天 |
| 3 | 若 R1=B：新增 Hono `mini` 路由 + openid 适配（2 人日） | 后端 | T1 |
| 4 | 若 R4=第三方：接入抠图 API + `applyBackground`/`cropToSize` 换底 | 后端 | T2 |
| 5 | 简历内核复用：F7/F7b/F6/F6b/F6c 调通（零改造或仅改 provider） | 前端+后端 | T1–T3 |
| 6 | R5 隔离落地：`users/assets/workflows` 独立集合 | 后端 | T1 |

---

## ⚠️ 待确认 / 假设 / Non-goals

- **待确认**：混元 Hy3 / Hy Image 3.0 是否 OpenAI 兼容（R3-T0 实测定）；混元免费额度具体上限与超阈降级策略；第三方抠图 API 国内合规与数据出境口径。
- **假设**：R1=B 时合法域名审核可在一周内通过；`@imgly` node 版可在 Hono 后端稳定运行（R4 演进阶段验证）。
- **Non-goals（本决策文档不覆盖）**：具体 PRD 需求池（见 `product-blueprint-miniapp-ai-detailed-2026-07-07.md`）；UI 设计细节；90 天增长目标拆解。

---

## 📚 数据来源 & 成员产出索引

- **路径（路线图规划师）**：本决策对比全文产出。
- **主理人（方向明）**：SOP 编排、共享上下文、代码复用事实供给、结论卡片汇编。
- **代码事实来源**：codegraph + semble 扫描 `craftisle-resume`（`packages/pdf/src/server.tsx`、`packages/docx/src/index.ts`、`packages/api/src/features/ai/service.ts`、`packages/ai/src/prompts/*`、`packages/schema/src/resume/data.ts`、`packages/resume/src/patch.ts`）、`craftisle-app`（`lib/idphoto/inference.ts`、`lib/image-tools/process/passport-photo.ts`、`lib/tools.ts`、`registry.ts`、`BackgroundRemovalTool.tsx`）。
- **上游文档**：`refs/strategy-context.md`、`refs/reuse-map.md`、`refs/research-bundle.md`、`product-blueprint-miniapp-ai-detailed-2026-07-07.md`。

---

> 本报告由产品战略团队 AI 协作生成，重要决策请由产品负责人审定。
