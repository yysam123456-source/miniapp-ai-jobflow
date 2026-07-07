# 小程序 AI 工具串联产品 —— 战略协作共享上下文（CONTEXT）

> 本文件是产品战略团队（方向明/Fang 主理人）的共享知识库。各成员（瑞思/竞析/数析/析客/路径）**必须先读此文件**再产出，避免重复与口径不一致。
> 工作空间：`/Users/Lenovo/WorkBuddy/2026-07-07-18-13-51`
> 日期：2026-07-07

---

## 0. 任务目标

基于三份输入（竞品分析 PDF v2.0、Spec PDF v3.0、以及一份"深度解读与代码复用分析"MD），**重新做**：产品规划、竞品分析、需求设计、路线规划。要求**尽量细化**，并**深度结合现有代码复用**（用 codegraph + semble 两个 MCP 深度扫描了 craftisle-resume、craftisle-app；imgprompt 确认无本地代码）。

交付：一份综合战略文档（规划+竞品+需求+路线），落盘 `deliverables/product-strategy/`。

---

## 1. Spec v3.0 锁定决策（已确认，无需再拍板）

1. 前端 = 微信小程序原生。
2. 证件照检测 = 优先第三方开源引擎，无则自研（非混元免费额度，成本独立评估）。
3. 流量主 = 保体验优先（每工作流 ≤1 次插屏）。
4. 简历模板 = 首版 5 套通用模板（简约/商务/创意/学术/应届）。

其他锁定：AI = 微信云开发 AI（wx.cloud.extend.AI），混元 Hy3 + Hy Image 3.0，免费额度内；存储/DB = 云开发存储 + NoSQL；登录 = 微信 openid；基础库 ≥ 3.15.1。

---

## 2. MVP 功能清单（F1–F9）

| 编号 | 功能 | 优先级 | 性质 |
|---|---|---|---|
| F1 | 求职简历工作流（端到端向导） | P0 | 优势·一站式串联 |
| F2 | AI 职业照生成（Hy Image 3.0） | P0 | 达标 |
| F3 | 证件照合规检测（第三方开源优先，无则自研） | P0 | 达标·合规/回执 |
| F4 | 证件照换底/美化/导出/回执（发丝级抠图依赖引擎） | P0 | 达标·对标合合照 |
| F5 | 证件照双入口（独立 + 简历前置） | P0 | 优势 |
| F6 | 通用简历模板系统（首版 5 套）+ 元素级可编辑 | P0 | 优势·元素级编辑 |
| F6b | 文件导入 + AI 自动填充（PDF/Word/图/文本→模板映射） | P0 | 优势·自动映射 |
| F6c | AI 简历润色（STAR 改写 + 量化 + JD 匹配） | P0 | 达标·对标 AI简历姬 |
| F7 | 简历 PDF 导出 | P0 | 达标 |
| F7b | 简历 Word 导出 | P1 | 达标·对标免费 Word |
| F6d | AI 模拟面试 | P1 | 达标 |
| F6e | 行业模板扩充（金融/互联网/咨询/快销） | P2 | 达标·对标职徒 |
| F8 | 微信分享/预览 | P0 | 优势·原生 |
| F9 | 微信登录 + 历史 | P0 | 达标 |

**明确不做（首版）**：图文创作流（P2）、自由画布、web 同步、非混元模型、付费会员、多语言（英文 P2）、ParticleCraft/draw 编辑、UGC 模板市场。

---

## 3. 市场与竞品要点（来自竞品分析 PDF v2.0）

**市场数据**：国内 AI 小程序用户突破 3 亿（年增 25%）；小程序生态月活突破 10 亿；小程序广告市场预计 850 亿元；微信成长计划半年 4.5 万小程序（70%+ 个人开发者）；2026 高校毕业生预计 1270 万（就业竞争加剧）。

**竞品全景（三类）**：
- AI 简历类（直接竞品·简历节点）：AI简历姬、超级简历、100分简历（3000+ 模板全免费）、职徒简历（中英/行业适配）、知页简历、锤子简历、WonderCV、鹅来面 OfferGoose、52cv、Canva。
- 证件照类（直接竞品·证件照节点）：合合照（600+ 规格、发丝级抠图、看广告得高清）、吉吉照（全免费）、和和照（签证强）、nik拼（城市回执准）、完美证件照（一键合规）、Cutout（抠图强、web）。
- 同域工具箱（形态参考）：洛克孵蛋工具箱、作业答案来了（多工具聚合）。
- **一站式串联：市场空缺 → 我们的核心差异化。**

**14 维对标结论**：
- 必须达标项（⚠，细节不能弱于竞品）：①模板数量（首版5套+路线扩充）②AI 润色深度（STAR/量化/JD，模拟面试后置 P1）③Word 导出（P1）④行业适配（P2）⑤证件照规格覆盖（一寸/二寸/教资/国考/驾照/签证）⑥回执/合规 ⑦抠图精度（看引擎）。
- 我们的优势项（✅，主战场）：元素级可编辑、多格式导入 AI 自动映射、免费混元降本、串联工作流、双入口、微信原生分享。

---

## 4. ⭐ 深度代码复用映射（codegraph + semble 已验证）

> 两个 MCP 扫描结论：**craftisle-resume 是复用主矿（简历全链路）**；**craftisle-app 此前被低估——它已自带证件照子系统（passport-photo / id-photo / remove-bg），可直接复用于 F2/F3/F4 的后处理**；imgprompt 无本地代码（仅 imgprompt.craftisle.com 外链）。

### 4.1 craftisle-resume（pnpm/Turborepo monorepo，路径 `/Users/Lenovo/Projects/craftisle-resume`）

| Spec 端点/功能 | 现有代码（已验证） | 文件 / 签名 | 复用级 | 改造点 |
|---|---|---|---|---|
| **F7 exportPdf** | `createResumePdfFile({data, filename, template?, resolveSectionTitle?})` → `renderToBuffer`(@react-pdf/renderer) → `File` | `packages/pdf/src/server.tsx` | **直接复用（最高价值）** | 适配首版 5 套中文模板版式；证件照写入 `picture.url` 后由字体包保证中文；验证云函数 Node 环境体积/冷启动 |
| **F7b exportWord** | `buildDocx(data: ResumeData): Promise<Blob>` → `buildDocument`（镜像版式/字体/配色） | `packages/docx/src/index.ts`、`builder.ts` | **直接复用（高）** | 输入同为 `ResumeData`，几乎零改 |
| **F6c optimize** | `analyzeResumeSystemPrompt` + `sanitizeAndParseResumeJson`（禁虚构/清洗）+ patch 工具契约 | `packages/ai/src/prompts.ts`、`resume/sanitize.ts`、`tools/patch-proposal.ts`；聚合于 `packages/api/src/features/ai/service.ts` | **改造复用（高）** | LLM 调用层换混元：`getModel()` 已支持 `openai-compatible`（`createOpenAICompatible({name, apiKey, baseURL}).languageModel(model)`），仅改 provider 配置即可复用全部 prompt 与清洗逻辑 |
| **F6b importParse** | `pdfParserSystemPrompt/User`、`docxParserSystemPrompt/User` + `sanitizeAndParseResumeJson` + import importers（`JSONResumeImporter`/`ReactiveResumeJSONImporter`/`ReactiveResumeV4Importer`） | `packages/ai/...`、`packages/import/src/*` | **改造复用（高）** | PDF/Word 走 Hy3；图片 OCR/文本同理；`import` 包保留为"结构化简历导入"分支；统一输出 `ResumeData` |
| **F6 applyToTemplate** | `resumeDataSchema`/`defaultResumeData`/`templateSchema` + `createResumePatches`/`applyResumePatches`（RFC 6902 JSON Patch） | `packages/schema/src/resume/data.ts`、`packages/resume/src/patch.ts` | **直接复用（高）** | schema 默认值实例化，patch 应用填充；元素模型与 Spec `elements{id,type,tag,defaultStyle,pos}` 同构 |
| **F6 元素级编辑** | `pictureSchema` 含 `url/size/rotation/aspectRatio/borderRadius/borderColor/borderWidth/shadowColor/shadowWidth`；元素编辑 = patch 操作 | `packages/schema/src/resume/data.ts`、`packages/pdf/src/templates/shared/picture.ts`(`hasTemplatePicture`) | **直接复用** | 所见即所得编辑映射到 patch；照片 `picture.url` 直接进 PDF 渲染 |
| **数据模型** | `resumeDataSchema` / `pictureSchema` / `defaultResumeData` | `packages/schema/src/resume/*` | **直接复用** | 作为小程序简历 JSON 结构；`users/assets/workflows` 需按云 DB NoSQL 新写 |

**关键验证点（最大复用杠杆）**：`packages/ai/src/types.ts` 的 `AI_PROVIDERS` 含 `"openai-compatible"`（baseURL 默认 `""`）；`service.ts` 的 `getModel()` 已用 `createOpenAICompatible` 实现。→ 若微信云开发 AI 的混元 Hy3 暴露 OpenAI 兼容协议（绝大多数国产网关兼容），则 `resume.optimize`/`importParse` 的 LLM 层**仅改 provider 配置即可复用全部 prompt/清洗**，成本最低、风险最小。

### 4.2 craftisle-app（Next.js，路径 `/Users/Lenovo/Projects/craftisle-app）—— 此前被低估，含证件照子系统

| Spec 端点/功能 | 现有代码（已验证） | 文件 / 签名 | 复用级 | 改造点 |
|---|---|---|---|---|
| **F4 换底/裁剪/导出** | `passportPhoto(buffer, {preset, width?, height?})`：Sharp `resize(cover,center)` + `.flatten({background:white})` + `jpeg(q95)`；预设含 1inch/custom，工具描述声明支持 **China/US/UK/EU 及 50+ 国家规格** | `lib/image-tools/process/passport-photo.ts`、`lib/tools.ts`(L3182 Passport Photo) | **改造复用（逻辑/预设）** | 生成用 Hy Image 3.0（新建）；后处理（裁剪到规格/换底白/调色/导出 jpg）直接复用 Sharp 逻辑，可跑在云函数 Node 运行时或独立图片服务 |
| **F4 发丝级抠图/换底** | `id-photo`(`components/tools/IDPhoto/IDPhotoTool`)、`remove-bg`(`BackgroundRemovalTool`) | `lib/tool-components.tsx` | **改造复用（逻辑/预设）** | 抠图/换底能力已存在，需评估是否可在小程序/云函数侧复用（Sharp/模型），或作为生成后处理 |
| **F3 合规检测线索** | Passport Photo 描述含"Auto-detects face position"，暗示存在人脸检测依赖 | `lib/tools.ts` | **待深挖** | F3 第三方开源优先；craftisle-app 的人脸定位实现可作评估输入 |
| 图片工具原语 | 17+ 工具：resize/crop/compress/convert/rotate/colorPalette/border/watermark/colorAdjust/stripMetadata/info/favicon… 服务端 Sharp | `lib/image-tools/registry.ts` | **参考复用** | F4 美化/调色可复用 colorAdjust 等原语逻辑 |

> 注意：craftisle-app 的图片工具均为 **Node/Sharp 服务端**，传输层是 Next.js Route Handler（`/api/tools/${toolId}`），**不能直接搬进微信云函数**，但其**业务逻辑、规格预设、抠图/换底算法可移植/改写**。这修正了旧 MD"craftisle-app 无业务可复用"的结论。

### 4.3 imgprompt
本地无代码仓库（`grep -rian "imgprompt" /Users/Lenovo/Projects` 仅命中字符串外链 `imgprompt.craftisle.com`）。F2 的"人像 prompt 生成"需自写，可参考线上产品的方法论；无源码可搬。

---

## 5. 关键架构张力与推荐

**张力**：Spec 后端 = 微信云开发（云函数）；现有 craftisle-resume 后端 = Vercel/Hono + Drizzle+Postgres + Better Auth + S3 + oRPC。**两运行时不兼容**。复用的是"平台无关业务内核"，平台绑定层（传输/DB/认证/存储）必须重写。

**方案 A（云函数移植）**：把纯逻辑包（schema/resume/pdf/fonts/docx/import/ai-prompts+utils）拷进云函数，AI 换混元，DB/存储/登录换云开发。贴合 Spec 决策；但需验证 @react-pdf/renderer + 中文字体在云函数体积/冷启动。

**方案 B（小程序=craftisle-resume 新客户端，★最大复用）**：小程序 `request` 直连已部署 Hono 后端，新增 `mini` 路由；AI provider 切混元；微信登录加 openid 适配。**简历全链路近乎零改造复用**，已有 Postgres/存储/模板直接可用。缺点：偏离"云开发"字面决策，需配 request 合法域名。

**推荐**：以 craftisle-resume 逻辑内核为底座，优先方案 B（简历链路复用最大化）；证件照与微信原生链路新建（但 F2/F3/F4 后处理复用 craftisle-app 的 Sharp 逻辑）；若强约束"必须云开发"，退化为方案 A（业务内核复用策略一致，仅部署载体不同）。无论 A/B，`openai-compatible` 适配混元均适用。

---

## 6. 待确认 / 风险（成员需在各自信交付中回应）

- **R1 架构决策漂移**：A 还是 B 需产品/技术负责人正式确认，否则开发两头摇摆。
- **R2 @react-pdf/renderer 云函数可行性**：若走 A，提前验证 Node 环境体积/冷启动。
- **R3 混元兼容协议**：P0 级——确认 Hy3/Hy Image 3.0 是否提供 OpenAI 兼容协议，决定 optimize/importParse 复用成本。
- **R4 证件照引擎成本**：F3/F4 明确"非免费额度"，需独立成本评估（含 craftisle-app 现有抠图/换底是否可低成本移植）。
- **R5 数据割裂**：Spec 要求与 web 端 Craftisle 完全割裂，即便走 B 也建议账号/数据隔离（代码可共用）。

---

## 7. 对各成员的交付要求（通用）

- 语言：简体中文；结构用标准模板（见各成员 brief）。
- 所有结论须有依据（引用 Spec/竞品 PDF 或上方代码文件路径/签名）。
- 量化优先：每条数据/功能/指标须完整，不简化。
- 仅返回 Markdown 文本（不要写文件）；主理人负责最终整合落盘。
- 必须明确呼应"代码复用"——这是本次任务的核心诉求。
