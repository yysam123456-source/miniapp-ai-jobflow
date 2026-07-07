> ⚠️ **【已作废 · v3】** 本文件所含"数据万象 AIPortraitMatting 付费抠图 / 独立腾讯云 SCF / 按混元单价核算"等全部结论已被 v4 推翻。以 `decision-brief-miniapp-ai-v4-2026-07-07.md` 为准。

# 小程序 AI 工具串联产品 · 待拍板决策项对比分析（v3 · 锚定微信小程序+腾讯云+混元）

**日期**：2026-07-07
**类型**：决策拍板对比（Decision Brief v3，平台栈重锚定）
**参与成员**：路径（Roadmap Planner Roadie）· 主理人方向明汇编
**代码依据**：codegraph + semble 已验证 `craftisle-resume` / `craftisle-app` 真实签名与实现

---

## 📌 TL;DR（执行摘要）

- **平台栈铁定**：这是**微信小程序**产品 → 后端天然跑在**微信云开发（CloudBase，腾讯云）**。前端小程序、登录走 openid、存储/DB/函数全在腾讯云，**国内可达、合规、免海外链路**。
- **全栈 AI = 混元（文本/理解）+ 腾讯云视觉（抠图）**。文本类（简历解析/润色/优化）走混元；抠图/换底走**腾讯云人像抠图 API**，不再移植浏览器 CV 引擎、不接海外第三方。
- **三次前提纠错已全部落地**：① 直连海外 Hono 后端（国内不通）→ 剔除；② OpenAI/OpenAI 兼容 → 全栈只用混元；③ 抠图用移植 ISNet / 海外第三方 → 改用**腾讯云数据万象 `AIPortraitMatting`**。
- **"复用"的精确定义**：把 `craftisle-resume` / `craftisle-app` 的**平台无关纯逻辑**（Schema / Patch / prompts / sanitize / 几何换色）移植进微信云开发云函数，只改运行时（浏览器 `File`→Node `Buffer`、海外→腾讯云）。ML 抠图那部分**不移植**，直接用云端 API 替代。
- **拍板项收敛为 3 个**：`R1`（微信云开发 vs 独立腾讯云 SCF，推荐前者）、`R4`（腾讯云抠图产品选型，推荐数据万象）、`R3` 已定写 `hunyuan` provider、`R2` 随 R1 消解、`R5` 已锁定。

---

## 🎯 核心结论卡片（速拍表）

| 决策项 | 推荐 | 备选 | 关键差异一句话 | 拍板看什么 |
|------|------|------|------|------|
| **R1 架构** | 微信云开发（CloudBase）云函数 + 云数据库 + openid | 独立腾讯云 SCF + 自有域名 | 都是腾讯云、都移植代码；云开发免域名备案、openid 直拿、生态最贴合小程序 | 是否需极致自定义/独立域名 |
| **R3 混元接入** | 写 `hunyuan` provider 适配器（统一方案） | — | prompts+`sanitizeAndParseResumeJson` 走 `getModel()` 抽象零改，仅新增混元调用层 | 确认混元 API 接入方式（endpoint/鉴权/流式） |
| **R4 抠图引擎** | 腾讯云数据万象 `AIPortraitMatting`（人像抠图） | 人体分析 `SegmentPortraitPic` | 云端发丝级、国内合规、按量；替代原浏览器 ISNet 代码，复用仅几何/换色逻辑 | 抠图质量 / 计费模型 / 与换底流水线衔接 |
| **R2 云函数导出** | （R1=云开发时，T1 验一次 @react-pdf 云函数可行性） | 失败则改 SCF 容器 | 仅在云函数体积/冷启动有问题时才需兜底 | — |
| **R5 数据割裂** | A 完全隔离（Spec 锁定） | B 轻量打通 | 代码可共用（`resumeDataSchema`/`applyResumePatches`），账号/数据独立集合 | 合规 / 复用 web 资产 |

---

## 决策项 1：R1 整体架构（锚定：微信小程序 + 微信云开发 / 腾讯云）

> 铁律：① 现有 `craftisle-resume` / `craftisle-app` 后端（Hono on Vercel）部署**海外**，国内网络**无法访问** → "直连 Hono / 调用已有后端接口"选项**已剔除**；② 本产品是**微信小程序**，云托管天然是**腾讯云（微信云开发）**；③ "复用"= 把代码（函数 / Schema / Prompt）移植改造进微信云开发云函数，改运行时（浏览器 `File`→Node `Buffer`、海外→腾讯云）。

### 选项 A（推荐）｜微信云开发（CloudBase）
- **描述**：将 `packages/pdf`、`packages/docx`、`packages/schema`、`packages/resume`、`packages/ai`、`packages/import` 移植进**云函数**；DB/登录/存储换**云开发 NoSQL + 云存储 + openid**。
- **优**：最贴合小程序生态——免服务器运维、**免小程序 request 合法域名备案**、openid 直接拿、与微信登录/分享/支付无缝；`resumeDataSchema`/`pictureSchema`/`styleRuleSchema`/`styleIntentSchema`（`packages/schema/src/resume/data.ts`）与 `applyResumePatches`（RFC6902, `packages/resume/src/patch.ts`）纯 Zod/纯函数，零平台依赖直接拷进。
- **劣**：`createResumePdfFile({data,filename,template?,resolveSectionTitle?}):Promise<File>`（`packages/pdf/src/server.tsx:15`）返回浏览器 `File`，须改返回 `Buffer`（底层 `renderToBuffer` 已是 Buffer）；`buildDocx(data):Promise<Blob>`（`packages/docx/src/index.ts:6`）改 `Packer.toBuffer`；须验 @react-pdf/renderer + 中文字体体积/冷启动（R2，T1 验一次）。
- **成本**：开发 +6 人日（移植 + Buffer 适配 + 冷启动验证）；运行=云函数/云数据库按量，免费额度起步、冷启动偶发卡顿。
- **风险**：R2 未过则 F7 导出需改 SCF 容器兜底（非阻塞，有退路）；与源仓双份维护。
- **适用条件**：标准微信小程序交付（默认）。
- **推荐度**：★★★★★

### 选项 B｜独立腾讯云 SCF + 自有域名
- **描述**：把同一批代码移植进独立部署的腾讯云 SCF（或 CVM 容器），结构贴近现有 Hono，平台层换腾讯云 DB/对象存储 + 小程序 request **合法域名（需备案）**。
- **优**：完全自定义、不受云开发配额/运行时约束；`createResumePdfFile`/`buildDocx` 改 Buffer 后 Node 直出，无云函数体积/冷启动硬约束。
- **劣**：需自管运维与扩缩容；**需配小程序 request 国内合法域名（备案约一周）**；与 R5 隔离需显式独立库；openid 接入需自行对接。
- **成本**：开发 +3~4 人日（移植 + Buffer + 混元适配器 + openid + 域名）；运行=腾讯云实例边际成本极低。
- **风险**：合法域名备案周期；运维责任上移。
- **适用条件**：对运行时/配额有强定制诉求，或云开发无法满足时。
- **推荐度**：★★★☆☆

**主理人推荐 + 决策标准**：推荐 **A（微信云开发）**。① 与"微信小程序"产品形态最契合，免域名备案、openid 直拿；② 两者都是"移植代码进腾讯云"非"调海外 API"，复用杠杆等价；③ 选 A 时 R2 仅 T1 验一次 @react-pdf 可行性，失败有 SCF 兜底不阻塞；④ 仅在需极致自定义/独立域名时退 B。最坏：选 A 且 R2 未过 → F7 导出改走 SCF 容器（已有退路，不致命）。

---

## 决策项 2：R3 LLM 接入（统一方案：写 `hunyuan` provider 适配器，不再分"OpenAI 兼容 / 原生"选项）

> 铁律：全栈只用混元，不碰 OpenAI。现有 `getModel()` 的 `openai-compatible` 只是一个 provider 抽象壳（非 OpenAI 服务依赖），本项统一**新增一个 `hunyuan` provider**，复用 `analyzeResumeSystemPrompt`/`pdfParserSystemPrompt`/`docxParserSystemPrompt`（packages/ai/src/prompts/*）与 `sanitizeAndParseResumeJson`（sanitize.ts:226）——这些本就走 `getModel()` 抽象调用，无论混元 API 长什么样都**零改**，只新增混元调用层。

### 统一方案｜写 `hunyuan` provider（接入混元，100% 混元调用）
- **描述**：在 `service.ts` 的 `getModel()` 抽象下新增 `hunyuan` provider（鉴权 / 请求体 / 流式按混元官方 API 实现），`getModel({provider:'hunyuan', model, apiKey, baseURL})` 返回混元客户端；prompts/sanitize 完全不动。
- **优**：彻底去除对 `openai-compatible` 抽象壳的依赖与"是否兼容"的纠结；调用最贴合混元原生能力；F6b/F6c 全部 prompt 与清洗逻辑零改，业务复用等价。
- **劣**：相比"恰好兼容则改配置"，实现层多写一个 provider 模块；开发 ~1~2 人日。
- **成本**：开发 ~1~2 人日；**运行成本按混元官方现行单价核算 token 费用（非"微信云开发免费额度"假设）**。
- **风险**：混元 API 请求 / 流式格式需实测对齐；模型质量波动（与方案选择无关，所有方案同）。
- **唯一待确认（正常集成调研，非 OpenAI 测试）**：混元 API 的 endpoint / 鉴权方式（API key 或腾讯云签名）/ 请求体字段 / 是否支持流式 —— 由后端在 T0 用 1 天确认，据此落地 provider。
- **推荐度**：★★★★★

**主理人结论**：不再提供 A/B 选项。原"测混元网关是否 OpenAI 兼容"本质是看混元 API 接口长相以选最小改动，但既然已拍板全部移植改造、只用混元，直接写 `hunyuan` provider 最干净，省去"兼容与否"的岔路。最坏：混元 API 细节有出入，仅 provider 内部小补，不影响 prompts/sanitize 复用与证件照工期。

---

## 决策项 3：R4 证件照 matting/换底（锚定：腾讯云人像抠图 API，不移植 CV 引擎）

> 约束修正：`craftisle-app/lib/idphoto/inference.ts` 的 `removeBackgroundML`（ISNet，浏览器/GPU 绑定 `document.createElement`/`ImageData`/`device:'gpu'`）**不再移植**——它由**腾讯云人像抠图 API** 云端替代。`ID_PHOTO_SIZES`(6 规格)/`BG_COLORS`(5 色)/`applyBackground`(换底)/`cropToSize`(裁尺寸) 是**纯几何/换色逻辑**，平台无关，直接复用；`passportPhoto`(Sharp 白底 flatten) 可作为轻量兜底或改由数据万象处理链替代。

### 统一方案（推荐）｜腾讯云数据万象 `AIPortraitMatting`（人像抠图）
- **描述**：从微信云开发云函数调用**数据万象 `AIPortraitMatting`**（腾讯云原生人像抠图，智能分割背景、生成人像主体透明图），返回透明图后由 `applyBackground` 换底（白/蓝/红/浅蓝/浅灰）、`cropToSize` 裁到 `ID_PHOTO_SIZES` 6 规格。
- **优**：**云端发丝级**、国内可达、合规、免运维、免移植 GPU 代码；上线快（2~3 人日）；质量对标合合照/完美证件照。
- **劣**：按量计费（资源包可降本）；依赖腾讯云 SLA（腾讯自有，断供风险极低）。
- **成本**：开发 2~3 人日 + 单张按量（资源包约几分~角级，量级远低于海外第三方）；运行在腾讯云生态内，与 R1 同栈。
- **风险**：计费随量上升（可用资源包对冲）；需 T1 实测抠图质量 + 与 `applyBackground`/`cropToSize` 流水线衔接。
- **推荐度**：★★★★★

### 备选｜人体分析 `SegmentPortraitPic`
- **描述**：腾讯云人体分析 `SegmentPortraitPic`（`bda.tencentcloudapi.com`），识别人体完整轮廓、返回灰度图+前景人像图，可应用于照片合成。
- **优**：同为腾讯云原生、国内合规；人像分割成熟。
- **劣**：返回格式（灰度+前景）需自行合成透明图，比数据万象 `AIPortraitMatting` 多一步后处理；与证件照流水线衔接略繁琐。
- **推荐度**：★★★☆☆

> **关于"基于混元大模型做抠图"的澄清（标为待确认）**：你提到"抠图直接基于混元大模型加对应算法"。当前**生产级发丝级人像抠图**由腾讯云 **数据万象 `AIPortraitMatting`（CV 服务）** 提供，并非 Hunyuan 大模型直出；若你指的是用 **Hunyuan 生成式/多模态模型** 做抠图（inpainting/生成式去背景），那是另一条技术路线，质量/成本/是否开放 API 待你确认。本决策默认采用**腾讯云数据万象 `AIPortraitMatting`**（即"腾讯云 + 对应算法"的工程实现），如确要用 Hunyuan 模型直出，请拍板，我据此改 R4。

**主理人结论**：R4 不再是比较"node @imgly / 海外第三方 / 端侧 Canvas / 纯 Sharp"——那些方案在"微信小程序 + 腾讯云"栈下全无必要。统一用**腾讯云人像抠图 API**，复用纯几何/换色逻辑即可。最坏：数据万象抠图质量或计费不及预期 → 切人体分析 `SegmentPortraitPic` 或加 `passportPhoto` 白底兜底，不影响整体架构。

---

## 决策项 4：R2 导出链路上云函数可行性（R1=云开发时 T1 验一次）

- **验证项**：@react-pdf/renderer 在微信云开发云函数的体积 / 冷启动 / 中文字体打包——开发 0.5 人日验证；`createResumePdfFile` 须改返回 `Buffer`（底层 `renderToBuffer` 已是 Buffer），中文字体包须随函数打包。
- **兜底**：若云函数受限，F7 导出改走独立腾讯云 SCF 容器（Node `renderToBuffer` 直出 Buffer），与 R1-B 一致，零阻塞风险。
- **结论**：R1 选 A（云开发）则本项仅 T1 验一次；选 B 则天然规避。

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
| 2 | R1 拍板：建议 **A 微信云开发（CloudBase）**；"直连海外 Hono 后端"已剔除 | 产品+技术 | T0 |
| 3 | R4 拍板：采用 **腾讯云数据万象 `AIPortraitMatting`**；确认是否要用 Hunyuan 生成式模型直出抠图（待你确认） | 产品+后端 | T0 |
| 4 | 移植 `schema/pdf/docx/ai/import` 进微信云开发云函数，跑通 `exportPdf` + `importParse` + 混元适配器串联（T1 验 R2 云函数可行性） | 后端+AI | T1–T2 |
| 5 | `ID_PHOTO_SIZES`/`BG_COLORS`/`applyBackground`/`cropToSize` 入库，接数据万象抠图结果做换底+裁规格（F4） | 后端 | T2 |
| 6 | 微信登录（openid）+ 分享卡片 + workflow 状态机持久化（云开发 NoSQL） | 前端+后端 | T3 |
| 7 | 灰度前验证内容安全拦截率 <2%、**混元成本监控**（按混元单价核算） | 后端 | T4 |

---

## ⚠️ 待确认 / 假设 / Non-goals

- **待拍板（P0）**：
  - **R1**：微信云开发（A，推荐） / 独立腾讯云 SCF（B）。
  - **R4**：腾讯云数据万象 `AIPortraitMatting`（推荐） / 人体分析 `SegmentPortraitPic`（备选）；以及——是否确实要用 **Hunyuan 大模型直出抠图**（生成式路线）？请拍板。
  - R3 已定为"写 `hunyuan` provider"（仅余混元 API 接入细节为工程任务）；R2 随 R1 消解（仅 T1 验一次）；R5 已锁定 A。
- **假设（已修正 v1 成本误区）**：混元 API 成本按**你们现行混元单价**核算 token 费用，**非"微信云开发免费额度"**；@react-pdf/renderer + 中文字体可在微信云开发云函数直出（R2，T1 验）；与 web 端 Craftisle 完全割裂（R5，代码共用但数据/账号隔离）；抠图由**腾讯云**提供，非移植海外 CV 代码。
- **Non-goals（本决策文档不覆盖）**：具体 PRD 需求池（见 `product-blueprint-miniapp-ai-detailed-2026-07-07.md`，其 R1/R3/R4 旧表述以本 v3 为准）；UI 设计细节；90 天增长目标拆解。

---

## 📚 数据来源 & 成员产出索引
- **路径（Roadmap Planner）**：本决策对比全文产出（v3 平台栈重锚定版）。
- **主理人（方向明）**：SOP 编排、共享上下文、代码复用事实供给、结论卡片汇编、v1/v2 错误前提纠错（海外后端 / OpenAI / 抠图 CV 引擎）。
- **代码事实来源**：codegraph + semble 扫描 `craftisle-resume`（`packages/pdf/src/server.tsx`、`packages/docx/src/index.ts`、`packages/api/src/features/ai/service.ts`、`packages/ai/src/prompts/*`、`packages/schema/src/resume/data.ts`、`packages/resume/src/patch.ts`）、`craftisle-app`（`lib/idphoto/inference.ts`、`lib/image-tools/process/passport-photo.ts`、`lib/tools.ts`、`registry.ts`）。
- **腾讯云能力核实（2026-07-07 WebSearch）**：数据万象 `AIPortraitMatting`（人像抠图，cloud.tencent.com/document/product/460/106751 等）、人体分析 `SegmentPortraitPic`（`bda.tencentcloudapi.com`）。
- **上游文档**：`refs/strategy-context.md`、`refs/reuse-map.md`、`refs/research-bundle.md`、`product-blueprint-miniapp-ai-detailed-2026-07-07.md`（蓝图，其 R1/R3/R4/免费额度旧表述以本 v3 勘误为准）。

---

> 本报告由产品战略团队 AI 协作生成（v3 平台栈重锚定版），已剔除"调用海外后端 / OpenAI 兼容 / 移植 CV 抠图引擎接海外第三方"三项错误前提，统一锚定「微信小程序 + 微信云开发(腾讯云) + 混元(文本) + 腾讯云人像抠图(视觉)」。重要决策请由产品负责人审定。
