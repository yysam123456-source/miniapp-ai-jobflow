> ⚠️ **【已作废 · v2】** 本文件所含"按混元单价核算 / 国内云服务器移植 / 国内第三方抠图 API / node @imgly 自托管"等全部结论已被 v4 推翻。以 `decision-brief-miniapp-ai-v4-2026-07-07.md` 为准。

# 小程序 AI 工具串联产品 · 待拍板决策项对比分析（v2 修正版）

**日期**：2026-07-07
**类型**：决策拍板对比（Decision Brief v2 修正）
**参与成员**：路径（Roadmap Planner Roadie）· 主理人方向明汇编
**代码依据**：codegraph + semble 已验证 `craftisle-resume` / `craftisle-app` 真实签名与实现

---

## 📌 TL;DR（执行摘要）

- 共 **5 拍板项**，其中 **R1 / R3 / R4 需老板拍板**，R2 随 R1 自动消解，R5 已在 Spec 锁定。
- **本版作废 v1 两项错误前提**：① 原 R1 推荐的"直连 Hono 后端（选项 B）"因国内连不上海外 Vercel 而**不可行，已剔除**；② 原 R3 的"OpenAI 兼容仅改配置"改为"**写 `hunyuan` provider 适配器**"——全栈只用混元、不碰 OpenAI，且**不再分"是否 OpenAI 兼容"的 A/B 选项**，直接落地混元适配层。
- **核心逻辑（已修正）**：所有方案都基于"**把代码移植改造进国内可运行后端**"。复用杠杆不变——`createResumePdfFile` / `buildDocx` / `resumeDataSchema` / `applyResumePatches` / `sanitizeAndParseResumeJson` / prompts 是平台无关纯逻辑，可直接拷；差异仅在运行时 / 运维 / 冷启动。
- **主理人总推荐**：`R1=B`（国内云服务器/SCF 移植 Node 服务）· `R3=写 hunyuan provider`（~1-2 人日，prompts/sanitize 零改）· `R4=国内第三方抠图 API 起步 + node 版 @imgly 自托管演进` · `R5=A`（完全数据隔离）。
- **最坏后果**：R1 误选 A 且 R2 未过 → F7 PDF 整链阻塞；R3 误判兼容 → F6b/F6c 重写吃掉证件照工期；R4 误选端侧/Sharp → 回执不达标丧失对标资格。

---

## 🎯 核心结论卡片（速拍表）

| 决策项 | 推荐 | 备选 | 关键差异一句话 | 拍板看什么 |
|------|------|------|------|------|
| **R1 架构** | B 国内云服务器/SCF 移植 Node 服务 | A 云函数 / C 混合 | 三者都是"移植代码进国内后端"非"调海外 API"；B 复用度最高且避 R2 | 上线速度 / 复用度 / R2 阻塞风险 |
| **R3 混元接入** | 写 `hunyuan` provider 适配器（统一方案） | — | prompts+`sanitizeAndParseResumeJson` 走 `getModel()` 抽象零改，仅新增混元调用层；无需判断"OpenAI 兼容" | 确认混元 API 接入方式（endpoint/鉴权/流式） |
| **R4 抠图引擎** | 国内第三方 API 起步→node 自托管 | 端侧 Canvas / 纯 Sharp | 端侧/Sharp 无发丝级→回执不达标；自托管/国内API 达合合照级 | 抠图质量 / 成本模型 / 免费卖点 |
| **R2 云函数导出** | （R1=B 时自动消解） | B 走国内服务器 | 仅 R1 选 A/C 才需验 @react-pdf 云函数可行性 | — |
| **R5 数据割裂** | A 完全隔离（Spec 锁定） | B 轻量打通 | 代码可共用（`resumeDataSchema`/`applyResumePatches`），账号/数据独立集合 | 合规 / 复用 web 资产 |

---

## 决策项 1：R1 整体架构（修正：剔除"调用海外后端"）

> 铁律：现有 craftisle-resume / craftisle-app 后端（Hono on Vercel）部署**海外**，国内网络**无法访问** → "直连 Hono / 调用已有后端接口"选项**已剔除**。"复用"= 把代码（函数 / Schema / Prompt）移植改造进国内可运行后端，改运行时（浏览器 `File`→Node `Buffer`、海外→国内）。

### 选项 A｜微信云开发云函数（把代码移植进云函数）
- **描述**：将 `packages/pdf`、`packages/docx`、`packages/schema`、`packages/resume`、`packages/ai`、`packages/import` 移植进云函数；DB/登录/存储换云开发 NoSQL + openid。
- **优**：贴合 Spec"云开发"字面；免服务器运维、免合法域名；`resumeDataSchema`/`pictureSchema`/`styleRuleSchema`/`styleIntentSchema`（`packages/schema/src/resume/data.ts`）与 `applyResumePatches`（RFC6902, `packages/resume/src/patch.ts`）纯 Zod/纯函数，零平台依赖直接拷进。
- **劣**：`createResumePdfFile({data,filename,template?,resolveSectionTitle?}):Promise<File>`（`packages/pdf/src/server.tsx:15`）返回浏览器 `File`，须改返回 `Buffer`（底层 `renderToBuffer` 已是 Buffer）；`buildDocx(data):Promise<Blob>`（`packages/docx/src/index.ts:6`）改 `Packer.toBuffer`；须验 @react-pdf/renderer + 中文字体体积/冷启动（R2 风险在 A/C 存在）。
- **成本**：开发 +6 人日（移植 + Buffer 适配 + 冷启动验证）；运行=云函数按量，冷启动偶发卡顿。
- **风险**：R2 未过则 F7 导出整链阻塞；与源仓双份维护。
- **适用条件**：强约束"必须云开发"。
- **推荐度**：★★★☆☆

### 选项 B（推荐）｜国内云服务器/Serverless（腾讯云 SCF / 国内 region 部署移植后 Node 服务）
- **描述**：把同一批代码移植进一个部署在国内 region 的 Node 服务，结构贴近现有 Hono，复用度更高；平台层换国内 DB/对象存储/openid。
- **优**：`getModel()`（`packages/api/src/features/ai/service.ts:76`）改造为"混元适配器"、prompts/sanitize 零改；`createResumePdfFile`/`buildDocx` 改 Buffer 后 Node 直出，无云函数体积/冷启动硬约束；结构贴近现有 Hono，移植损耗最小（省 ~58% 工期）。
- **劣**：需自管服务器/SCF 运维与扩缩容；需配小程序 request 国内合法域名；与 R5 隔离需显式独立库。
- **成本**：开发 +3~4 人日（移植 + Buffer + 混元适配器 + openid）；运行=国内实例边际成本极低。
- **风险**：运维责任上移；合法域名审核（约一周）。
- **适用条件**：以降本 + 提速 + 规避 R2 为优先。
- **推荐度**：★★★★★

### 选项 C｜混合（简历链路走国内云服务器，图片处理走云函数）
- **描述**：简历/PDF/Word 走 B；证件照 Sharp/`passportPhoto` 走云函数就近微信生态。
- **优**：图片处理贴近微信；简历复用最大化且规避 R2。
- **劣**：两套部署、运维翻倍；图片与简历数据跨端同步复杂；`createResumePdfFile` 的 File→Buffer 改造在 B 侧仍要做。
- **成本**：开发 +8 人日；运行双计费。
- **风险**：架构复杂度高，P0 工期压力大。
- **适用条件**：云函数对图片处理有强约束时。
- **推荐度**：★★☆☆☆

**主理人推荐 + 决策标准**：推荐 **B**。① 三者都是"移植代码"非"调海外 API"；② B 复用度最高且 R2 风险最小；③ 选 A 必须同步拍 R2 验证；④ 接受"云开发"字面退化为 A 的前提。最坏：选 A 且 R2 未过 → F7 整链阻塞。

---

## 决策项 2：R3 LLM 接入（统一方案：写 `hunyuan` provider 适配器，不再分"OpenAI 兼容 / 原生"选项）

> 铁律：全栈只用混元，不碰 OpenAI。现有 `getModel()` 的 `openai-compatible` 只是一个 provider 抽象壳（非 OpenAI 服务依赖），本项统一**新增一个 `hunyuan` provider**，复用 `analyzeResumeSystemPrompt`/`pdfParserSystemPrompt`/`docxParserSystemPrompt`（packages/ai/src/prompts/*）与 `sanitizeAndParseResumeJson`（sanitize.ts:226）——这些本就走 `getModel()` 抽象调用，无论混元 API 长什么样都**零改**，只新增混元调用层。

### 统一方案｜写 `hunyuan` provider（接入混元，100% 混元调用）
- **描述**：在 `service.ts` 的 `getModel()` 抽象下新增 `hunyuan` provider（鉴权 / 请求体 / 流式按混元官方 API 实现），`getModel({provider:'hunyuan', model, apiKey, baseURL})` 返回混元客户端；prompts/sanitize 完全不动。
- **优**：彻底去除对 `openai-compatible` 抽象壳的依赖与"是否兼容"的纠结；调用最贴合混元原生能力；F6b/F6c 全部 prompt 与清洗逻辑零改，业务复用等价。
- **劣**：相比"恰好兼容则改配置"，实现层多写一个 provider 模块；开发 ~1~2 人日。
- **成本**：开发 ~1~2 人日；**运行成本按混元官方现行单价核算 token 费用（非"微信云开发免费额度"假设，修正 v1 成本误区）**。
- **风险**：混元 API 请求 / 流式格式需实测对齐；模型质量波动（与方案选择无关，所有方案同）。
- **唯一待确认（正常集成调研，非 OpenAI 测试）**：混元 API 的 endpoint / 鉴权方式（API key 或腾讯云签名）/ 请求体字段 / 是否支持流式 —— 由后端在 T0 用 1 天确认，据此落地 provider。
- **推荐度**：★★★★★

**主理人结论**：不再提供 A/B 选项。原"测混元网关是否 OpenAI 兼容"本质是看混元 API 接口长相以选最小改动，但既然已拍板全部移植改造、只用混元，直接写 `hunyuan` provider 最干净，省去"兼容与否"的岔路。最坏：混元 API 细节有出入，仅 provider 内部小补，不影响 prompts/sanitize 复用与证件照工期。

---

## 决策项 3：R4 证件照 matting/换底引擎（保留，强调"国内运行"）

> 约束：`craftisle-app/lib/idphoto/inference.ts` 是浏览器/Canvas/GPU 绑定（`document.createElement`、`ImageData`、`device:'gpu'`），不能原样跑服务端，需移植；`passportPhoto(buffer,{preset})`（`lib/image-tools/process/passport-photo.ts:16`，Sharp resize+flatten 白底+jpeg q95）Node 可直接跑、可移植进国内后端。第三方必须国内可达合规。

### 选项 1｜移植 node 版 @imgly/background-removal（onnxruntime-node，对应 `removeBackgroundML` 的 ISNet）
- **描述**：自托管于国内服务器/云函数，复用 `ID_PHOTO_SIZES`(6 规格)/`BG_COLORS`(5 色)/`applyBackground`/`cropToSize`。
- **优**：发丝级（合合照同级）；自托管免按张调用费；长期降本。
- **劣**：node 版需评包体积/冷启动；GPU 算力成本；开发 +8~12 人日。
- **成本**：开发 8~12 人日 + 自托管算力（月几百元级）。
- **风险**：onnx 模型体积大、首包加载慢（与 R2 同类）。
- **推荐度**：★★★★☆

### 选项 2（推荐起步）｜国内可达第三方抠图 API（腾讯云/国内合规厂商，非 Remove.bg 海外）
- **描述**：调国内合规 API 返回透明图，再 `applyBackground` 换底。
- **优**：质量稳定、免运维、上线快（2~3 人日）；发丝级达标。
- **劣**：按张计费；依赖外部 SLA；需确认国内网络可达 + 数据合规（修正 v1 提 Remove.bg 海外之误）。
- **成本**：开发 2~3 人日 + 单张 0.1~0.5 元（量大月数千元）。
- **风险**：成本随量线性上升；断供风险。
- **推荐度**：★★★★☆

### 选项 3｜小程序端 Canvas 跑 `removeBackground`（容差兜底，无 GPU）
- **描述**：复用已写浏览器实现，端侧容差抠图。
- **优**：省移植、端侧免费、零服务端算力。
- **劣**：非发丝级，精度有限；影响 F3 检测与回执达标。
- **成本**：开发 3~4 人日。
- **风险**：抠图不达标 → 合规/回执失败率升。
- **推荐度**：★★★☆☆

### 选项 4｜纯 Sharp `flatten` 白底（无发丝级）
- **描述**：`passportPhoto` 的 resize+flatten(白底)+jpeg q95，无抠图。
- **优**：成本最低、Node 直接跑、最稳。
- **劣**：无发丝级 / 无换蓝红底；对标合合照明显偏弱。
- **成本**：开发 1 人日。
- **风险**：`BG_COLORS` 5 色换底无法实现 → 差异化受损。
- **推荐度**：★★☆☆☆

**主理人推荐 + 决策标准**：推荐 **选项 2（国内第三方）起步 + 选项 1（node 自托管）降本演进**。① 抠图质量（发丝级定合规/回执达标）；② 成本模型（自托管 vs 按张）；③ 是否冲击"免费"卖点（自托管/端侧不冲击，第三方按张冲击）；④ F3 检测配套。最坏：选 3/4 → 回执不达标，被 nik拼/完美证件照碾压。

---

## 决策项 4：R2 导出链路上云函数可行性（仅 R1 选 A/C 时需）
- **选项 A**：验证 @react-pdf/renderer 云函数体积/冷启动——开发 0.5 人日验证，失败则阻塞 F7（`createResumePdfFile` File→Buffer 改造 + 字体包须测）。
- **选项 B**：导出改走国内云服务器（Node `renderToBuffer` 直出 Buffer，规避云函数限制）——与 R1-B 一致，零验证风险。
- **结论**：R1 选 B 则本项自动消解；选 A/C 必须先验 R2。

---

## 决策项 5：R5 数据割裂策略（Spec 锁定 A）
- **选项 A（已锁定）**：与 web 端 Craftisle 完全账号/数据隔离——代码可共用 `resumeDataSchema`/`applyResumePatches`，但 `users/assets/workflows` 独立集合、openid 独立。优：合规清晰、零耦合；劣：无法复用 web 用户资产。
- **选项 B**：同主体轻量打通——省登录可导流，但牺牲隔离、增合规面。
- **结论**：Spec 已锁定 **A**，无需再拍板；B 仅作未来记录。

---

## ✅ 行动清单（拍板后）

| # | 行动 | 负责方 | 时间窗 |
|---|------|--------|--------|
| 1 | T0：确认混元 API 接入方式（endpoint/鉴权/流式）→ 落地 `hunyuan` provider（~1-2 人日，prompts/sanitize 零改） | 后端 | 1 天 |
| 2 | R1 决策：建议 B（国内云服务器/SCF 移植 Node 服务）；**"直连海外 Hono 后端"已剔除** | 产品+技术 | T0 |
| 3 | R4：评估国内第三方抠图 API（国内可达合规）/ node 版 @imgly 自托管 | 后端+AI | T2 前 |
| 4 | 移植 `schema/pdf/docx/ai/import` 进国内后端，跑通 `exportPdf`（验 R2 若选 A/C） | 后端 | T1 |
| 5 | `ID_PHOTO_SIZES`/`BG_COLORS`/Sharp 白底封装入库（F4 规格/换色/尺寸） | 后端 | T2 |
| 6 | `parsePdf`/`parseDocx` + 混元适配器跑通 `importParse`+`optimize` 串联 | AI+后端 | T1–T2 |
| 7 | 微信登录（openid）+ 分享卡片 + workflow 状态机持久化 | 前端+后端 | T3 |
| 8 | 灰度前验证内容安全拦截率 <2%、**混元成本监控**（按混元单价核算，非免费额度） | 后端 | T4 |

---

## ⚠️ 待确认 / 假设 / Non-goals

- **待拍板（P0）**：R1（国内云服务器 B / 云函数 A / 混合 C）、R4（国内第三方 / node 自托管 / 端侧 / Sharp）。R3 已定为"写 `hunyuan` provider"，仅余混元 API 接入细节（endpoint/鉴权/流式）为工程任务，不再作为选项拍板。
- **假设（修正 v1 成本误区）**：混元 API 成本按**你们现行混元单价**核算 token 费用，**非"微信云开发免费额度"**；@react-pdf/renderer + 中文字体可在国内 Node 服务直出（R2，仅 R1=A/C 需验）；与 web 端 Craftisle 完全割裂（R5，代码共用但数据/账号隔离）。
- **Non-goals（本决策文档不覆盖）**：具体 PRD 需求池（见 `product-blueprint-miniapp-ai-detailed-2026-07-07.md`，其 R1/R3 旧表述以本 v2 为准）；UI 设计细节；90 天增长目标拆解。

---

## 📚 数据来源 & 成员产出索引
- **路径（Roadmap Planner）**：本决策对比全文产出（v2 修正版）。
- **主理人（方向明）**：SOP 编排、共享上下文、代码复用事实供给、结论卡片汇编、v1 错误前提纠错。
- **代码事实来源**：codegraph + semble 扫描 `craftisle-resume`（`packages/pdf/src/server.tsx`、`packages/docx/src/index.ts`、`packages/api/src/features/ai/service.ts`、`packages/ai/src/prompts/*`、`packages/schema/src/resume/data.ts`、`packages/resume/src/patch.ts`）、`craftisle-app`（`lib/idphoto/inference.ts`、`lib/image-tools/process/passport-photo.ts`、`lib/tools.ts`、`registry.ts`）。
- **上游文档**：`refs/strategy-context.md`、`refs/reuse-map.md`、`refs/research-bundle.md`、`product-blueprint-miniapp-ai-detailed-2026-07-07.md`（蓝图，其 R1/R3/免费额度旧表述以本 v2 勘误为准）。

---

> 本报告由产品战略团队 AI 协作生成（v2 修正版），已剔除"调用海外后端/OpenAI 兼容"两项错误前提。重要决策请由产品负责人审定。
