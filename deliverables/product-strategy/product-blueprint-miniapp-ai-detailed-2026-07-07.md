# 小程序 AI 工具串联产品 · 产品战略与落地蓝图（深度细化版 v2）

> ⚠️ **【v2.1 勘误声明】** 产品负责人于 2026-07-07 19:16 修正两项前提，本文部分旧表述已作废，**一切以《decision-brief-miniapp-ai-v2-2026-07-07.md》为准**：
> 1. **R1「直连现有 Hono 后端 / 调用已有后端接口」已剔除**——现有后端部署海外 Vercel，国内网络不通。"复用"= 把代码移植改造进**国内可运行后端**（微信云函数 / 国内云服务器）。
> 2. **R3「OpenAI 兼容仅改配置」已改为「改造成混元适配器」**——全栈只用混元，不碰 OpenAI。文中 `openai-compatible` 仅指 `getModel()` 的 provider 抽象类型，接入一律改造为调混元的"混元适配器"；prompts 与 `sanitizeAndParseResumeJson` 清洗逻辑完整复用。
> 3. **「微信云开发免费额度」成本假设作废**——混元 API 成本按你们现行混元单价核算。
> 下文保留的代码级签名 / Schema / 规格表（F1–F9 复用映射、ID_PHOTO_SIZES、BG_COLORS 等）仍有效，仅 R1/R3 的接入与运行方式表述需以上述勘误为准。
>
> ⚠️ **【v2.2 勘误声明 · 平台栈重锚定】** 产品负责人于 2026-07-07 19:35 再次纠正：**本产品是微信小程序**，云托管天然是**腾讯云（微信云开发 CloudBase）**；AI 全栈只用**混元**；抠图应基于**腾讯云能力（数据万象 `AIPortraitMatting`）**而非移植浏览器 CV 引擎或接海外第三方。本文 R1/R3/R4 旧表述（含"国内云服务器 B 推荐""@imgly 自托管 / 海外第三方抠图""`idphoto/inference.ts` 浏览器引擎需移植""纯 Sharp／端侧 Canvas"等）已作废，**一切以《decision-brief-miniapp-ai-v3-2026-07-07.md》为准**。代码级签名 / Schema / 规格表（F1–F9 复用映射、ID_PHOTO_SIZES、BG_COLORS、`applyBackground`、`cropToSize` 等纯几何/换色逻辑）仍有效；`removeBackgroundML`(ISNet) 浏览器代码明确**不再移植**，由腾讯云人像抠图 API 替代。
>
> ⚠️ **【v2.3 勘误声明 · 全免费前提锚定（终版，覆盖 v1–v2.2）】** 产品负责人于 2026-07-07 19:42 终极纠正：**本产品全部基于「微信云开发 CloudBase + 微信 AI 小程序成长计划」的免费额度**，做小程序正是因为"通通免费"——免服务器/域名/ICP，AI 与生图（**10 亿 token + 10 万张生图**，混元 Hy3 + Hy Image 3.0，申请成功起 6 个月有效，全行业开放；2026-07-07 腾讯官方公告核实）都在免费额度内。本蓝图 v1–v2.2 所有付费假设一律作废，明确点名：① v2.1 第 3 条"免费额度假设作废、按混元单价核算"——**错误，应以免费额度为前提**；② v2.2 推荐的"腾讯云数据万象 `AIPortraitMatting`"——**属付费腾讯云产品，与"全免费"前提冲突，作废**；抠图改走你指定的"混元 + 算法"免费路线（云函数自托管开源模型 / 或云开发 AI 图像能力），**不引入任何付费服务**。Spec 原文亦明确标注"混元 Hy3 + Hy Image 3.0，免费额度内""免费混元降本""免费出图：免费 Hy Image 3.0"。**一切以《decision-brief-miniapp-ai-v4-2026-07-07.md》为唯一正确前提**。代码级签名 / Schema / 规格表（F1–F9 复用映射、`ID_PHOTO_SIZES`、`BG_COLORS`、`applyBackground`、`cropToSize` 等纯几何/换色逻辑）仍有效；`removeBackgroundML`(ISNet) 浏览器代码明确不再移植。
>
> ⚠️ **【v2.4 勘误声明 · 证件照工具链扩展】** 产品负责人于 2026-07-07 19:59 明确：证件照功能需扩展为**抠图 + 去背景 + 去水印 + 修图**完整工具链。经核实，免费额度仅覆盖**生文（Hy3）+ 生图（Hy Image 3.0）**，不含图像编辑/inpainting → 所有新增编辑能力走「云函数自托管开源模型」免费路线。F2/F3/F4 从原 3 项拆为 9 项：F2a AI人像prompt / F2b AI职业照生成（Hy Image 3.0，10万张额度）· F3a抠图（rembg onnx）· F3b去背景（复用 `BG_COLORS`/`applyBackground`）· F3c去水印（开源 inpainting LaMa 轻量）· F3d修图（Sharp 基础 + 可选磨皮）· F3e合规检测（6 项逐项评分）· F4a规格裁切（复用 `ID_PHOTO_SIZES`/`cropToSize`）· F4b回执排版。以 `decision-brief-miniapp-ai-v4-2026-07-07.md` 证件照工具链章节为准。

**日期**：2026-07-07
**类型**：综合战略文档（产品规划 + 竞品分析 + 需求设计 PRD + 路线规划）
**版本**：v2（在 v1 战略稿基础上，补入 codegraph + semble 深度扫描后的真实代码级落地细节）
**参与成员**：瑞思（用户研究）、竞析（竞品分析）、数析（指标数据）、析客（PRD）、路径（路线图）；主理人方向明整合并补代码锚点

> 本版相对你提供的三份源文件（Spec v3.0 / 竞品分析 v2.0 / 旧代码复用 MD）**增量在"代码级落地"**：所有复用点均给出真实函数签名、文件路径、规格表、Zod Schema 字段、Prompt 模板原文片段、以及移植约束。源文件是产品文档，不含这些；本版用两个 MCP 实扫代码后补入。

---

## 📌 TL;DR（执行摘要）

- **市场空缺已二次验证**：三类竞品（AI简历 / 证件照 / 工具箱）全是单点，无"证件照↔简历"一站式串联。核心差异化 F1/F5/F8 成立。
- **复用底座已代码级确认**（非空话）：
  - 简历全链路 F6/F6b/F6c/F7/F7b 在 `craftisle-resume` 有**真实可导出的函数**，签名已核对。
  - 证件照 F4 后处理在 `craftisle-app` 有**真实引擎** `lib/idphoto/inference.ts`（ISNet 发丝级抠图 + 5 色换底 + 6 规格尺寸表），比旧 MD 结论"零复用"更准确。
- **最大降本杠杆（R3）代码已验证**：`packages/api/.../ai/service.ts` 的 `getModel()` 有 provider 抽象，可改造为「混元适配器」接入混元 Hy3 文本模型；prompts 与 `sanitizeAndParseResumeJson` 清洗逻辑零改（详见 decision-brief v2 勘误）。
- **两个必须写进文档的诚实约束**：
  1. `idphoto/inference.ts` 是**浏览器/GPU 绑定**，不能直接跑云函数 → F2/F3/F4 的 matting 必须移植 node 版 / 走第三方 API / 小程序端 Canvas（影响 R4 成本与架构）。
  2. `craftisle-resume` 的 `createResumePdfFile` 返回浏览器 `File`、`buildDocx` 返回 `Blob` → 云函数内需包成 `Buffer`（@react-pdf/renderer 底层已是 `renderToBuffer`）。
- **工期**：全自研 ≈ 26 人周 → 复用 ≈ 11 人周（↓58%），其中证件照引擎移植/选型占新增工期的绝大多数。

---

## 🎯 核心结论卡片

| 项目 | 内容 |
|------|------|
| 推荐方案 | 简历链路**移植 craftisle-resume 内核进国内后端**（改造为混元适配器接混元，全部跑在微信云开发 CloudBase 免费额度内）；证件照链路新建，matting 走**混元/算法免费路线**（云函数自托管开源模型 / 云开发 AI 图像能力），不引入任何付费服务 |
| 优先级 | P0：F1/F2/F3/F4/F5/F6/F6b/F6c/F7/F8/F9；P1：F7b/F6d；P2：F6e |
| 预期影响 | 复用使简历侧开发量↓60%+，首版 5 套模板+PDF/Word 导出+STAR 润色上线即有，非从零 |
| 资源需求 | P0 ≈ 35.5 人日（含复用红利），其中证件照引擎选型/移植约占 12–16 人日 |
| 风险等级 | 中（R1 架构、R3 混元协议、R4 证件照引擎成本为 P0 必拍板项；idphoto 代码浏览器绑定是新增已知约束） |

---

# 一、产品规划（战略层）

## 1.1 战略定位
面向国内微信用户的「AI 工具串联工作流」小程序，把**证件照生成 → 简历制作 → PDF/Word 导出 → 微信原生分享**在微信内串成向导式流水线。与 web 端 Craftisle **完全割裂**（Spec 锁定，R5 数据隔离）。

## 1.2 三层价值主张（须前置突出）
1. **一站式串联（唯一空白）**：向导式把证件照、简历、PDF、分享串成流水线，数据自动流转，不离开微信。对应 F1/F5/F8。
2. **混元全免费**：AI 出图+润色走混元 Hy3 / Hy Image 3.0（微信云开发 AI，**均在 10 亿 token + 10 万张生图免费额度内**，申请成功起 6 个月有效），靠流量主（保体验 ≤1 插屏/工作流）变现；成本优势来自**全免费** + 国内合规。
3. **元素级可编辑 + 多格式导入 AI 自动映射**：用户自由改版式（竞品无），PDF/Word/图/文本导入后自动填充（竞品弱）。对应 F6/F6b。

## 1.3 与 web 端 Craftisle 的边界（R5）
- **代码可共用**：`craftisle-resume` 业务内核（schema/pdf/docx/ai/import）直接复用。
- **数据/账号隔离**：小程序侧独立云数据库集合（`users/assets/workflows/templates/resumes`），不读 web 端 Postgres；openid 登录独立。
- **不做什么**：web 同步、UGC 模板市场、非混元模型、付费会员（首版）、多语言（英文 P2）。

---

# 二、竞品分析（竞析）

## 2.1 竞品全景（三类单点 + 一个空缺）
| 类型 | 代表竞品 | 形态 | 与本产品关系 |
|------|----------|------|--------------|
| AI 简历（web/小程序） | AI简历姬、100分简历、超级简历、WonderCV、职徒简历、知页、锤子、鹅来面 OfferGoose、52cv、Canva | 单点·简历 | 直接竞品（简历节点） |
| 证件照（小程序） | 合合照、吉吉照、和和照、nik拼、完美证件照、Cutout | 单点·证件照 | 直接竞品（证件照节点） |
| 同域工具箱 | 洛克孵蛋工具箱、作业答案来了 | 多工具聚合 | 形态参考 |
| **一站式串联** | **（市场空缺）** | — | **我们的核心差异化** |

**关键结论**：搜索"一站式 简历 证件照 小程序"无成熟产品。竞品均为单点，验证"跨场景串联工作流"是空白。

## 2.2 逐竞品深度表（含真实定价/能力数据）
**AI 简历类**
| 竞品 | 核心能力 | 定价/免费 | 优势 | 短板 |
|------|----------|-----------|------|------|
| AI简历姬 | STAR 改写、量化、JD 匹配、模拟面试、Agent 级语义、投递追踪 | 新注册送 3 次优化；基础模板/PDF/Word 免费；7 天试用深度优化；月会员亲民 | 全流程求职闭环、AI 最深 | 偏 web、非微信原生、无证件照 |
| 100分简历 | AI 生成/优化/解析、模板适配 | **3000+ 岗位模板全免费** | 模板量碾压、免费力度大 | 无证件照/社交 |
| 超级简历 | 设计感强、模板精美 | 会员制 | 视觉品质高 | 免费弱、无证件照 |
| WonderCV | 模板精美 | 会员制 | 视觉品质高 | 无证件照 |
| 职徒简历 | 中英模板、智能检测、金融/互联网/咨询/快销行业适配、职业辅导 | 免费+会员 | 中英、行业深 | 无证件照 |
| 知页简历 | 操作简便 | 免费+会员 | 易用 | 能力浅 |
| 锤子简历 | 设计感 | 会员 | 视觉 | 无 AI 深度 |
| 鹅来面 OfferGoose | AI 履历提炼、排雷、JD 深度靶向匹配 | — | 匹配精准 | 新、无证件照 |

**证件照类**
| 竞品 | 核心能力 | 定价/免费 | 优势 | 短板 |
|------|----------|-----------|------|------|
| 合合照 | 600+ 规格（一寸/二寸/教资/国考/驾驶证/签证）、发丝级抠图、DPI 300–1000 | 看一条广告得高清（与付费同清晰度） | 规格最全、免费友好 | 无简历 |
| 吉吉照 | 换底色、基础生成 | 完全免费 | 零成本 | 能力浅 |
| 和和照 | 美签规格预设、一键选择、抠图精细 | 免费+广告 | 签证强 | 无简历 |
| nik拼 | 选类型+城市回执规则 | 免费+广告 | 回执准确 | 无简历 |
| 完美证件照 | 一键生成免费、40 秒出片、合规 | 免费 | 合规精准 | 无下游 |
| Cutout | 在线抠图换底、发丝/透明物体 | 免费版导出基础 | 抠图强 | web、无简历 |

## 2.3 15 维对标矩阵（竞品代表水平 vs 我们）
| # | 能力维度 | 竞品代表水平 | 我们（Spec v3.0 + 代码复用） | 判定 |
|---|----------|--------------|-------------------------------|------|
| 1 | 模板数量 | 100分 3000+ 全免费 | 首版 5 套通用 + P2 行业扩充 | ⚠ 达标（规划扩充） |
| 2 | 模板可编辑 | 多为固定模板 | 元素级可编辑（内容/位置/样式/显隐/增删），**真实模型见 `styleRuleSchema`/`styleIntentSchema`** | ✅ 优势 |
| 3 | AI 润色深度 | AI简历姬 STAR+量化+JD+模拟面试 | Hy3 STAR改写+量化+JD 匹配（P0）；模拟面试 P1 | ⚠ 持平/模拟面试后置 |
| 4 | 导入解析 | 100分支持解析 | 多格式（PDF/Word/图/文本）+ AI 自动映射填充，**复用 `parsePdf`/`parseDocx`+`sanitizeAndParseResumeJson`** | ✅ 优势 |
| 5 | 导出格式 | AI简历姬 PDF/Word 免费 | PDF(P0)+Word(P1)，**复用 `createResumePdfFile`/`buildDocx`** | ⚠ 需补 Word |
| 6 | 行业适配 | 职徒金融/互联网/咨询/快销 | 通用 P0 + 行业 P2 | ⚠ 规划 |
| 7 | 中英 | 职徒中英 | 中文 P0，英文 P2 | ⚠ 后置 |
| 8 | 证件照规格 | 合合照 600+ | 覆盖高频（一寸/二寸/教资/国考/驾照/签证）；**代码已验证 6 种规格表 `ID_PHOTO_SIZES`** | ⚠ 数量少但覆盖高频 |
| 9 | 抠图精度 | 发丝级 | 依赖引擎（第三方开源优先）；**`removeBackgroundML` 为 ISNet UAN 发丝级参考实现** | ✅ 持平（看引擎选型） |
| 10 | 免费模式 | 合合照看广告得高清；吉吉照全免费 | 免费混元 + 流量主保体验 | ✅ 成本优势 |
| 11 | 回执/城市规则 | nik拼城市回执 | 支持城市回执 | ✅ 持平 |
| 12 | 合规检测 | 完美证件照合规 | 合规检测（第三方开源/自研） | ✅ 持平 |
| 13 | 串联工作流 | 无 | 一站式（证件照→简历→PDF→分享） | ✅✅ 核心优势 |
| 14 | 微信原生分享 | 部分 | 转发/朋友圈/存相册原生 | ✅ 优势 |
| 15 | 双入口 | 无 | 证件照独立 + 简历前置 | ✅ 优势 |

## 2.4 SWOT（结合现有代码资产）
- **S**：免费混元降本；串联/双入口/微信分享差异化；`craftisle-resume` + `craftisle-app` 现成代码资产（已代码级验证）。
- **W**：首版模板仅 5 套；证件照 matting 引擎**浏览器绑定**，云函数需移植/选型（新增约束）；`@react-pdf/renderer` 云函数体积/冷启动待验证（R2）。
- **O**：3 亿 AI 小程序用户增量场；1270 万毕业生刚性需求；市场空缺无人占。
- **T**：合合照 600+ 规格/发丝级抠图、100分 3000+ 模板的体量压制；证件照引擎成本与合规风险。

## 2.5 差异化机会（含代码落地证据）
- 串联/元素级编辑/导入映射/双入口/微信分享 → 由 `craftisle-resume` 支撑：`createResumePdfFile`、`buildDocx`、`applyResumePatches`(RFC6902)、`styleRuleSchema`(语义样式)、`parsePdf`/`parseDocx`+`sanitizeAndParseResumeJson`、`analyzeResumeSystemPrompt`。**均"直接/改造复用"，签名已核对**。
- F4 证件照后处理 → 由 `craftisle-app` 支撑：`passportPhoto()`（Sharp 尺寸/白底）、`idphoto/inference.ts`（`ID_PHOTO_SIZES` 6 规格、`BG_COLORS` 5 色、`removeBackgroundML` 发丝级抠图、`applyBackground` 换底、`cropToSize` 裁剪）。**修正旧 MD"证件照零复用"结论**。
- **关键杠杆 R3**：`getModel()` 有 provider 抽象，改造为「混元适配器」即可接入混元 Hy3；F6b/F6c 的 prompts 与 `sanitizeAndParseResumeJson` 清洗逻辑零改（详见 decision-brief v2）。

---

# 三、需求设计 PRD v2.0（析客）

> 每个功能含：功能定义 / API 契约（输入·输出·错误码）/ **代码复用映射（真实签名+文件:行）/ 验收标准（Given-When-Then + 测试用例）/ 子任务拆解 + 人日**。

## 3.0 公共数据模型（源自 `resumeDataSchema`，packages/schema/src/resume/data.ts）

简历 JSON 结构（小程序 `resumes` 集合直接复用此 Shape）：
```
resumeData = {
  picture: { hidden, url, size(32–512pt), rotation(0–360°), aspectRatio(0.5–2.5),
             borderRadius, borderColor, borderWidth, shadowColor, shadowWidth },   // 证件照字段，F2 产出写入 url
  basics: { name, headline, email, phone, location, website{url,label}, customFields[] },
  summary: { title, icon, columns(1–6), hidden, content(HTML) },
  sections: { profiles, experience, education, projects, skills, languages,
              interests, awards, certifications, publications, volunteer, references }
            // 每 section = { title, icon, columns, hidden, items[] }
  customSections: [],
  metadata: { template, layout{sidebarWidth,pages[]}, page{format:'a4',marginX/Y,gapX/Y,locale},
              design{level,colors{primary,text,background}}, typography{body,heading},
              styleRules: StyleRule[] }   // 元素级样式编辑真实模型
}
```
- **`styleRuleSchema`**（data.ts L594）：`{id, label, enabled, target{scope:'global'|'sectionType'|'sectionId'}, slots{section,heading,item,text,...: StyleIntent}}` —— 这是 F6"元素级可编辑"的**真实数据模型**，比 Spec 的 `elements{id,type,tag,pos}` 更完整（含语义样式槽）。
- **`styleIntentSchema`**（data.ts L531）：约束可视化样式意图（color/padding/fontSize/fontWeight/textAlign/...），可安全翻译为 React PDF 样式 —— 编辑器的样式修改最终落为 StyleRule。

## 3.1 F1 求职简历端到端向导（P0）
- **定义**：单界面完成"选模板→填/导→润色→生成照→导出→分享"，步骤可断点续接。
- **API 契约**：`workflow.create/update {step, status, assetRefs} → {instance}`；错误 `E_PARAM`。
- **复用映射**：状态机持久化部分新建（云 DB `workflows` 集合）；数据载体复用 `resumeDataSchema`。
- **验收标准**：
  - AC-01（闭环）：Given 已登录，When 完成全流程，Then 未离小程序、产物存 `assets`。
  - AC-06（独立闭环）：Given 首页进证件照，When 生成→检测→换底→导出，Then 自成闭环。
- **子任务**：① 状态机 `resume_flow`（created→step_template→step1_photo→step2_resume→step3_pdf→step4_share）持久化；② 步骤条 UI；③ 草稿暂存/续接。→ **5 人日（新建）**。

## 3.2 F2 AI 职业照生成（P0）
- **定义**：场景词/参考图 → `ai.generatePortraitPrompt`（Hy3）→ `ai.generateImage`（Hy Image 3.0），出 2–4 张。
- **API 契约**：`ai.generatePortraitPrompt {scene, refImage?} → {prompt}`（Hy3，错 `E_QUOTA/E_TIM`）；`ai.generateImage {prompt, size, count} → {images}`（Hy Image 3.0，错 `E_QUOTA/E_TIM`）。
- **复用映射**：❌ **无**（`craftisle-resume` 仅文本 LLM，无图像生成；`imgprompt` 无本地代码）。`idphoto/inference.ts` 仅含后处理，不含生成。
- **验收标准**：AC-02（免费出图）：Given 额度未用尽，When 调 `ai.generateImage`，Then 免费 Hy Image 3.0 出图。生成成功率 ≥90%；生成中进度占位（R-UX1）。
- **子任务**：① portrait prompt 工程（参考 imgprompt.craftisle.com 方法论）；② Hy Image 3.0 调用封装；③ 出图队列+进度。→ **3 人日（新建）**。

## 3.3 F3 证件照合规检测（P0）
- **定义**：人脸/姿态/光线/遮挡/背景/尺寸合规；返回逐项结果+修正指引。第三方开源优先、无则自研，走**免费路线**（开源模型自托管云函数，零授权费零调用费；或云开发 AI 图像能力），不引入付费服务。
- **API 契约**：`photo.detectCompliance {image, certType, city} → {pass, items[]}`（开源/自研，错 `E_PARAM/E_ENG`）。
- **复用映射**：❌ 无现成合规检测；`idphoto/inference.ts` 的 `detectBackgroundColor`（边缘主色检测，inference.ts L177）可作自研兜底输入；`craftisle-app/lib/tools.ts` 人脸定位可作评估参考。
- **验收标准**：AC-04（检测）：Given 类型+城市+图，When 调 `detectCompliance`，Then 逐项结论+修正指引。支持一寸/二寸/教资/国考/驾照/签证。
- **子任务**：① 评估开源人脸/合规引擎清单（含 license/精度/成本）；② 接入选型；③ 自研规则兜底（姿态/背景/尺寸）。→ **4 人日（新建，第三方优先）**。

## 3.4 F4 换底/美化/导出/回执（P0）★ 代码复用锚点
- **定义**：发丝级抠图（依赖引擎）、底色切换、轻度美化、回执文本、导出。
- **API 契约**：`photo.swapBg {image, color} → {image}`（错 `E_PARAM`）。
- **复用映射（真实签名，已核对）**：
  - `passportPhoto(buffer, {preset}): Promise<ProcessResult>` —— `craftisle-app/lib/image-tools/process/passport-photo.ts` L16。Sharp `resize(cover,center)+flatten(白底)+jpeg q95`。PRESETS：`1inch(295×413)`/`2inch(413×579)`/`us-visa(600×600)`/`eu-passport(413×531)`+`custom`。**可直接移植云函数（Node Sharp）**。
  - `idphoto/inference.ts`：
    - `ID_PHOTO_SIZES`（L28）：`1 Inch(295×413)` / `2 Inch(413×579)` / `Passport(330×453)` / `US Visa(600×600)` / `UK Visa(350×450)` / `Schengen(350×450)` —— **真实规格表，直接扩充 Spec 的"一寸/二寸/教资/国考/驾照/签证"覆盖**。
    - `BG_COLORS`（L37）：`White(#ffffff)` / `Blue(#438edb)` / `Red(#d9001b)` / `Light Blue(#1a73e8)` / `Light Gray(#f0f0f0)` —— **F4 换底 5 色直接复用**。
    - `removeBackgroundML(imageData, {model:'standard'|'enhanced'}): ImageData`（L102）—— ISNet UAN via `@imgly/background-removal`，`device:'gpu'`，输出透明 PNG（发丝级抠图）。
    - `removeBackground(imageData, {tolerance, feather, forceBgColor})`（L217）—— Canvas 容差抠图兜底。
    - `applyBackground(sourceWithAlpha, hexColor): ImageData`（L364）—— **换底核心**。
    - `cropToSize(imageData, w, h): ImageData`（L389）—— 裁剪到规格。
  - `registry.ts`：`colorAdjust`/`border`/`compress`/`convert` 等 17 个图片原语，可作"轻度美化"复用。
- **⚠ 移植约束（必须写进技术方案）**：`idphoto/inference.ts` 全程使用 `document.createElement`/`ImageData`/`device:'gpu'` —— **浏览器/DOM 绑定，不能直接跑微信云函数**。F4 落地三选一：
  1. 小程序端 Canvas 2D 跑 `removeBackground`（容差兜底，精度有限，无 GPU）；
  2. 云函数内自托管**免费开源抠图模型**（如 rembg 系，onnxruntime-node，需评估包体积/冷启动）；
  3. 或直接用**云开发 AI 图像能力**（若成长计划 / 云开发 AI 覆盖抠图能力），全在免费额度内。
  `passportPhoto`（Sharp）无此问题，可直接服务端跑。
- **验收标准**：AC-18（规格达标）：Given 选类型，When 生成/检测，Then 覆盖一寸/二寸/教资/国考/驾照/签证 + 回执 + 合规。换底 5 色可用，发丝级抠图达标。
- **子任务**：① 规格/换色表移植（直接用 `ID_PHOTO_SIZES`/`BG_COLORS`，0.5 人日）；② matting 引擎选型/移植（免费开源模型自托管云函数 / 云开发 AI 图像能力，6–8 人日）；③ Sharp 尺寸/白底封装（1 人日）；④ 回执文本+城市规则（2 人日）。→ **合计 11.5–15.5 人日（改造+新建，matting 占大头）**。

## 3.5 F5 证件照双入口（P0）
- **定义**：独立入口 + 简历前置入口，共享同一 workflow 实例，照片/进度可跨入口续接。
- **API 契约**：`workflow.update {step:'step1_photo', assetRefs:[photoAssetId]} → {instance}`。
- **复用映射**：❌ 新建；数据载体复用 `pictureSchema`（写 `resumeData.picture.url`）。
- **验收标准**：AC-05（双入口）：Given 证件照页，When 点"去做简历"，Then 带照片进求职流选模板，不重传。
- **子任务**：① 双入口路由；② "去做简历"资产传递；③ 续接状态机。→ **2 人日（新建）**。

## 3.6 F6 通用简历模板系统 + 元素级可编辑（P0）★ 代码复用锚点
- **定义**：首版 5 套国内版式（简约/商务/创意/学术/应届），元素带语义 tag；文本/标题/列表/图片/分隔线/留白可改内容/位置/样式/显隐/增删，所见即所得。
- **API 契约**：`resume.applyToTemplate {structured, templateId} → {elements}`（错 `E_PARAM`）。
- **复用映射（真实签名）**：
  - `resumeDataSchema` + `defaultResumeData` + `templateSchema`（packages/schema）—— 模板/数据同构，Spec 的 `elements{id,type,tag,defaultStyle,pos}` 与 craftisle 元素模型同构。
  - `applyResumePatches(data, operations)` + `createResumePatches(prev, next)`（packages/resume/src/patch.ts L107/L22）—— **RFC 6902 JSON Patch，元素编辑的落库方式**。`jsonPatchOperationSchema`（L11）为 `op` 判别联合（add/replace/remove/move/copy/test），请求边界即校验。
  - `styleRuleSchema` / `styleIntentSchema`（data.ts L594/L531）—— **元素级"样式"编辑的真实模型**，比单纯 pos 更完整。
- **验收标准**：AC-15（模板达标）：Given 进简历步，When 选模板，Then 首版 5 套可选，元素级可编辑。
- **子任务**：① 5 套模板数据（基于 `templateSchema`，2 人日）；② WYSIWYG 编辑器（元素点选/拖拽/显隐 + StyleRule 应用，复刻 `chat()` 的 `propose_resume_patches` 思路，2 人日）。→ **4 人日（复用内核）**。

## 3.7 F6b 文件导入 + AI 自动填充（P0）★ 代码复用锚点
- **定义**：PDF/Word/图/文本 → `resume.importParse`（Hy3）→ `resume.applyToTemplate` 按 tag 自动映射填充；缺失留空提示，多余进"其他"。
- **API 契约**：`resume.importParse {fileUrl, fileType} → {structured}`（Hy3，错 `E_QUOTA/E_TIM`）。
- **复用映射（真实签名，已核对）**：
  - `parsePdf(input)`（service.ts L165）/ `parseDocx(input)`（L186）：`getModel(input)` + `pdfParserSystemPrompt`/`docxParserSystemPrompt` + `sanitizeAndParseResumeJson` → `ResumeData`。**复用 = 把 `getModel()` 的 provider 改造为「混元适配器」（调混元接口），prompts/sanitize 零改**。
  - `pdfParserSystemPrompt`（pdf-parser-system.md）：严格提取引擎，"Never fabricate, infer, or normalize missing data"、"Keep original wording" —— 与 Spec "保留真实经历、禁虚构" 一致。
  - `sanitizeAndParseResumeJson(resultText)`（sanitize.ts L226）：`jsonrepair` → 合并 `defaultResumeData` → 类型 coerce → 按 `sectionRequiredFieldMap` 清洗丢弃空项 → `resumeDataSchema.parse`。**禁虚构 + 容错的核心**。
  - 结构化导入：`JSONResumeImporter`/`ReactiveResumeJSONImporter`（packages/import/src/json-resume.tsx、reactive-resume-json.tsx）—— 保留为"结构化简历导入"分支。
- **验收标准**：AC-17（导入映射达标）：Given 有 PDF/Word/图/文本，When 调 `importParse`，Then Hy3 解析并自动填充至模板对应元素，缺失留空。
- **子任务**：① 接入 `parsePdf`/`parseDocx` 并改 provider 为混元（1 人日）；② 图片/文本分支（OCR→同流程，2 人日）；③ 自动映射 UI + 缺失/多余处理（1 人日）。→ **4 人日（改造复用）**。

## 3.8 F6c AI 简历润色（P0）★ 代码复用锚点
- **定义**：粘贴 JD → `resume.optimize`（Hy3）做 STAR 改写 + 量化补充 + JD 匹配；保留真实经历、禁虚构、输出亮点+匹配度。
- **API 契约**：`resume.optimize {resumeInstanceId, jd} → {optimized, highlights, matchScore}`（Hy3，错 `E_QUOTA/E_TIM`）。
- **复用映射（真实签名）**：
  - `analyzeResume(input)`（service.ts L251）+ `analyzeResumeSystemPrompt`（analyze-resume-system.md）："Never invent candidate achievements or facts"、"Suggestions must be prioritized by impact" —— **直接复用作润色/优化底座**；输出 `resumeAnalysisSchema`（scorecard/strengths/suggestions）。
  - `chat()`（service.ts L212）的 `propose_resume_patches` 工具 → 调用 `applyResumePatches` 落改 —— **AI 编辑的真实实现范式**，F6c 可复用其 patch 提案机制。
  - 全部走 `getModel()` → 改造为「混元适配器」接入混元（R3，详见 decision-brief v2），prompts + 清洗逻辑零改。
- **验收标准**：AC-16（润色深度达标）：Given 填经历+JD，When 调 `optimize`，Then 输出含 STAR 改写 + 量化 + JD 匹配。
- **子任务**：① 接入 `analyzeResume`+改 provider（1 人日）；② 包装为"润色+匹配度"输出（1 人日）；③ 预览一键采纳（patch 应用，1 人日）。→ **3 人日（改造复用）**。

## 3.9 F7 简历 PDF 导出（P0）★ 代码复用锚点
- **定义**：基于模板实例，A4 中文排版，嵌入证件照。
- **API 契约**：`resume.exportPdf {resumeInstanceId, photoAssetId} → {pdfUrl}`（错 `E_PARAM`）。
- **复用映射（真实签名）**：
  - `createResumePdfFile({data: ResumeData, filename: string, template?: Template, resolveSectionTitle?: SectionTitleResolver}): Promise<File>`（packages/pdf/src/server.tsx L15）。底层 `renderToBuffer(document)`（@react-pdf/renderer）。
  - **移植改造**：函数返回浏览器 `File`，云函数需改为返回 `Buffer`（底层 `renderToBuffer` 已是 Buffer，仅包一层）；`fonts` 包 `getPdfCjkFallbackFontFamily`/`buildResumeFontFamily` 保证中文（思源黑体/宋体 Noto SC）。
- **验收标准**：AC-07（PDF 导出）：Given 实例完成，When `exportPdf`，Then 中文排版正确，可保存/转发。体积 <5MB，成功率 ≥99%。
- **子任务**：① 移植 `pdf`+`fonts` 包到云函数，改返回 Buffer（1 人日）；② 验证 @react-pdf/renderer + 中文字体体积/冷启动（R2，0.5 人日）；③ 证件照嵌入 `picture.url`（0.5 人日）。→ **2 人日（直接复用）**。

## 3.10 F7b 简历 Word 导出（P1）
- **复用映射**：`buildDocx(data: ResumeData): Promise<Blob>`（packages/docx/src/index.ts L6，`Packer.toBlob`）→ 云函数改 `Packer.toBuffer`。输入同为 `ResumeData`，几乎零改。
- **验收标准**：AC-导出 Word：导出 .docx 版式/字体镜像 PDF，可打开无错。
- **子任务**：① 移植 `docx` 包，改 `toBuffer`（1 人日）；② 版式对齐（0.5 人日）。→ **1.5 人日（直接复用）**。

## 3.11 F6d AI 模拟面试（P1）
- **定义**：基于简历生成 ≥5 题 + 评分反馈；延迟 <3s/题。
- **复用映射**：❌ 新建（prompt 可参考 `analyzeResumeSystemPrompt` 风格）。
- **验收标准**：生成题量 ≥5，评分反馈可用。
- **子任务**：① 面试题生成 prompt；② 评分逻辑；③ 对话 UI。→ **6 人日（新建）**。

## 3.12 F6e 行业模板扩充（P2）
- **复用映射**：🔧 基于 F6 `templateSchema` 新增金融/互联网/咨询/快销 4 套数据，无新内核。
- **子任务**：① 4 套行业模板数据与样例；② 模板市场/选择优化。→ **5 人日（改造复用）**。

## 3.13 F8 微信分享/预览（P0）
- **定义**：完稿后可原生转发 HR/群、朋友圈卡片、存相册。
- **复用映射**：❌ 新建；埋点对齐 `createResumePdfFile` 调用点。
- **验收标准**：AC-08（微信分享）：Given 产物生成，When 点分享，Then 转发好友/朋友圈/存相册。分享率 ≥30%。
- **子任务**：① `onShareAppMessage`/朋友圈卡片；② 分享钩子+预览。→ **2 人日（新建）**。

## 3.14 F9 微信登录 + 历史（P0）
- **定义**：openid 静默登录；历史简历/照片可查可改；登录态过期本地缓存兜底。
- **复用映射**：❌ 新建（云 DB NoSQL）；`users/assets/workflows` 新写，结构复用 `resumeDataSchema`。
- **验收标准**：AC-09（历史复用）：Given 曾完成，When 进"我的"，Then 可续接。AC-登录失效：静默重登+本地缓存（R-UX3）。
- **子任务**：① `wx.login`→code2Session→openid；② `users/assets/workflows` 集合；③ 历史列表+续接；④ 登录失效兜底。→ **3 人日（新建）**。

## 3.15 需求池汇总（含复用级 + 人日）
| 编号 | 需求 | 优先级 | 复用级 | 估算（人日） |
|------|------|--------|--------|--------------|
| F1 | 简历工作流向导 | P0 | 新建状态机 | 5 |
| F2 | AI 职业照生成 | P0 | 新建 | 3 |
| F3 | 合规检测 | P0 | 新建（第三方优先） | 4 |
| F4 | 换底/裁剪/导出/回执 | P0 | 改造复用（Sharp+idphoto 规格/换色表；matting 选型） | 11.5–15.5 |
| F5 | 双入口 | P0 | 新建 | 2 |
| F6 | 模板+元素编辑 | P0 | 直接复用（schema+patch+styleRule） | 4 |
| F6b | 导入 AI 填充 | P0 | 改造复用（parsePdf/Docx+sanitize+importers） | 4 |
| F6c | AI 润色 | P0 | 改造复用（analyzeResume+chat patch） | 3 |
| F7 | PDF 导出 | P0 | 直接复用（createResumePdfFile，改 Buffer） | 2 |
| F7b | Word 导出 | P1 | 直接复用（buildDocx，改 Buffer） | 1.5 |
| F6d | 模拟面试 | P1 | 新建 | 6 |
| F6e | 行业模板 | P2 | 改造复用（templateSchema 数据） | 5 |
| F8 | 微信分享 | P0 | 新建 | 2 |
| F9 | 登录+历史 | P0 | 新建（NoSQL） | 3 |
| **P0 合计** | | | 复用红利已计入 | **≈ 35.5** |

---

# 四、代码复用详录（附录·codegraph+semble 验证）

## 4.1 craftisle-resume（可移植逻辑内核）
| 包 | 文件:行 | 关键导出 | 复用级 | 小程序改造点 |
|----|---------|----------|--------|--------------|
| pdf | `packages/pdf/src/server.tsx:15` | `createResumePdfFile({data,filename,template?,resolveSectionTitle?}):Promise<File>` | 直接 | 返回 `File`→改 `Buffer`；`@react-pdf/renderer` 云函数体积/冷启动验证（R2） |
| docx | `packages/docx/src/index.ts:6` | `buildDocx(data:ResumeData):Promise<Blob>` | 直接 | `Packer.toBlob`→`toBuffer` |
| schema | `packages/schema/src/resume/data.ts:33/633` | `pictureSchema`、`resumeDataSchema`、`styleRuleSchema`、`styleIntentSchema`、`templateSchema` | 直接 | 纯 Zod，零平台依赖；`resumes` 集合直接用 |
| resume | `packages/resume/src/patch.ts:22/107` | `createResumePatches`、`applyResumePatches`（RFC6902） | 直接 | 纯函数 |
| ai | `packages/ai/src/prompts.ts` + `prompts/*.md` | `analyzeResumeSystemPrompt`、`pdfParserSystemPrompt/User`、`docxParserSystemPrompt/User` | 改造 | prompt/md 文件直读复用；`getModel()` 改造为「混元适配器」 |
| ai | `packages/ai/src/resume/sanitize.ts:226` | `sanitizeAndParseResumeJson` | 改造 | 禁虚构+容错，零改业务，仅 LLM 调用层换 |
| ai | `packages/api/src/features/ai/service.ts:76` | `getModel({provider,model,apiKey,baseURL})` | 改造 | `provider` 抽象改造为「混元适配器」（调混元接口），非 OpenAI（R3，详见 decision-brief v2） |
| import | `packages/import/src/json-resume.tsx` 等 | `JSONResumeImporter`/`ReactiveResumeJSONImporter` | 直接 | 结构化简历导入分支 |
| db/auth/api | — | Drizzle/Postgres、Better Auth、oRPC | ❌ 不适用 | 换云数据库/openid/云函数 |

## 4.2 craftisle-app（证件照引擎，修正旧"零复用"结论）
| 文件:行 | 关键导出 | 用途 | 移植约束 |
|---------|----------|------|----------|
| `lib/image-tools/process/passport-photo.ts:16` | `passportPhoto(buffer,{preset})` | Sharp 尺寸/centerCrop/白底/jpeg q95；PRESETS 1inch/2inch/us-visa/eu-passport+custom | Node Sharp 可直接云函数跑 |
| `lib/idphoto/inference.ts:28` | `ID_PHOTO_SIZES`（6 规格） | 一寸/二寸/护照/美签/英签/申根真实像素表 | 仅数据，直接复用 |
| `lib/idphoto/inference.ts:37` | `BG_COLORS`（5 色） | 白/蓝/红/浅蓝/浅灰换底色值 | 仅数据，直接复用 |
| `lib/idphoto/inference.ts:102` | `removeBackgroundML`（ISNet UAN） | 发丝级抠图，GPU，透明 PNG | ⚠ 浏览器/DOM 绑定，云函数需 node 版或第三方 |
| `lib/idphoto/inference.ts:217` | `removeBackground`（Canvas 容差） | 抠图兜底 | 可小程序端 Canvas 跑（精度有限） |
| `lib/idphoto/inference.ts:364/389` | `applyBackground` / `cropToSize` | 换底 / 裁剪 | 算法可移植 |
| `lib/image-tools/registry.ts` | `colorAdjust`/`border`/`compress` 等 17 原语 | "轻度美化"复用 | Node 侧需对应实现 |

---

# 五、路线规划（路径）

## 5.1 指标表现（数析）
- 市场：AI 小程序用户 3 亿（年增25%）、月活 10 亿、广告 850 亿、成长计划 4.5 万小程序（70%+ 个人开发者）、2026 毕业生 1270 万。
- 北极星：WCLU（周完成"证件照→简历→导出→分享"闭环用户数）。
- 漏斗基准 8%（区间 3.5–16.8%）：首页→工作流 35–50% / →生成照 60–75% / →导入填 55–70% / →导出 65–80% / →分享 25–40%。
- 90 天目标：DAU≥3 万、月 WCLU≥8 万、分享率 30% 下裂变 K≈0.3 月新增≥2.4 万、7 日留存≥25%、单用户 AI 成本≤0.05 元（依赖 R3/R4）。

## 5.2 用户反馈摘要（瑞思）
JB1–JB6（一站式/零成本合规照/信息不重录/微信分享/双入口续接/资产沉淀）；Kano/MoSCoW：F1–F7/F5/F6b/F6c/F9=Must，F7b/F6d=Should，F6e=Could；5 条差异化洞察；R-UX1~5。

## 5.3 竞品动态（竞析）
三类单点、空缺判断、SWOT、差异化含代码证据（见第二节）。

## 5.4 路线图（复用优先压缩工期）
| 季度 | 主题 | 关键交付（标注复用来源） | 负责人 | 风险 |
|------|------|--------------------------|--------|------|
| **2026 Q3（P0 MVP）** | 串联闭环上线 | F1/F2/F3/F4/F5/F6/F6b/F6c/F7/F8/F9；F7 复用 `createResumePdfFile`、F6c/F6b 改造为「混元适配器」接混元、F4 复用 `passportPhoto`+`ID_PHOTO_SIZES`/`BG_COLORS`+matting 选型 | 前端+后端+AI | R1/R2/R3/R4 |
| **2026 Q4（P1）** | 增强 | F7b Word 导出（复用 `buildDocx`）、F6d 模拟面试、F3 回执合规深化（第三方引擎接入） | 后端+AI | R4 成本 |
| **2027 Q1（P2）** | 扩充 | F6e 行业模板 4 套、模板数量追平、多证件照规格 | 设计+前端 | — |

**里程碑（P0）**：
- **T0**：确认混元接入方式（R3）→ 实测混元网关兼容性，定「混元适配器」接法（网关兼容格式 / 原生 API）。
- **T1**：简历内核移植（schema/pdf/docx/ai/import）→ 跑通 `exportPdf` 样例（验 R2）。
- **T2**：证件照后处理移植/选型（Sharp 尺寸+白底 直接上；matting 走免费开源模型自托管 / 云开发 AI 图像能力）+ 规格/换色表入库。
- **T3**：微信工作流串联（双入口/workflow 状态机/F8 分享/F9 登录）。
- **T4**：灰度（毕业季 6–8 月前上线，吃 1270 万毕业生红利）。

**工期对比**：全自研 ≈ 26 人周 → 复用 ≈ 11 人周（↓58%），差值主要在证件照 matting 引擎（F4 占新增工期大头）。

## 5.5 利益相关者沟通要点
- **高管视图**：市场空缺 + 免费混元降本 + 复用现有代码降风险（↓58% 工期）+ 90 天目标（DAU≥3万/WCLU≥8万）。
- **工程视图**：架构=**微信云开发 CloudBase**（免费额度内，免服务器/域名/ICP）；`@react-pdf/renderer` 云函数可行性验证（R2）；混元接入「`wx.cloud.extend.AI` 混元 Hy3」（R3 已锁定）；证件照 matting 走**免费路线**（自托管开源 / 云开发 AI）（R4）；复用清单见第四节。
- **设计视图**：双入口续接体验、生成等待占位（R-UX1）、合规失败引导（R-UX2）、微信原生分享裂变钩子、元素级编辑器（基于 `styleRuleSchema`）。

---

# 六、✅ 行动清单

| # | 行动 | 负责方 | 时间窗 |
|---|------|--------|--------|
| 1 | T0：确认混元 API 接入方式（endpoint/鉴权/流式）→ 落地 `wx.cloud.extend.AI` 混元 Hy3 provider（R3 已锁定，非拍板项） | 技术负责人 | T0 |
| 2 | 申请「微信 AI 小程序成长计划」免费额度 + 建微信云开发 CloudBase 环境（R1 已锁定） | 产品 | 当天 |
| 3 | 评估证件照 matting 免费引擎：开源模型自托管 / 云开发 AI 图像能力（R4 已锁定免费路线） | 后端+AI | T2 前 |
| 4 | 移植 `schema/pdf/docx/ai/import` 到小程序后端，跑通 `exportPdf`（验 R2 云函数体积） | 后端 | T1 |
| 5 | 把 `ID_PHOTO_SIZES`/`BG_COLORS`/Sharp 白底封装入库（F4 规格/换色/尺寸，0.5–1.5 人日） | 后端 | T2 |
| 6 | 用 `parsePdf`/`parseDocx` + 混元适配器 跑通 `importParse`+`optimize` 串联 | AI+后端 | T1–T2 |
| 7 | 新建微信登录（openid）+ 分享卡片 + workflow 状态机持久化 | 前端+后端 | T3 |
| 8 | 灰度前验证内容安全拦截率 <2%、额度监控告警（超 80% 降级非核心 AI） | 后端 | T4 |

---

# 七、⚠️ 待确认 / 假设 / Non-goals

**待拍板（P0）**：
- **R1** 架构=微信云开发 CloudBase（已锁定，免费额度内）；"直连海外 Hono""国内云服务器/SCF"等付费/非小程序方案已剔除。
- **R3** 混元接入方式：混元网关兼容格式（改造成混元适配器，~1人日）or 混元原生 API（写 SDK adapter，~2–3人日）；prompts/sanitize 均零改。
- **R4** 证件照 matting 引擎选型与成本（idphoto 代码浏览器绑定，不能直接用；须国内运行）。

**假设**：
- 混元 API 全在**微信云开发免费额度内**（10 亿 token + 10 万张生图，申请成功起 6 个月有效）；流量主收入反哺长期。非"按单价核算"的付费假设。
- @react-pdf/renderer + 中文字体可在云函数跑通（R2，T1 验证）。
- 与 web 端 Craftisle 完全割裂（R5，代码共用但数据/账号隔离）。

**Non-goals（首版明确不做什么）**：付费会员、web 同步、非混元模型、多语言（英文 P2）、图文创作流（P2）、自由画布、ParticleCraft/draw 编辑、UGC 模板市场、行业模板扩充（P2）。

---

# 八、📚 数据来源 & 成员产出索引
- 输入源：Spec v3.0（7 页）、竞品分析 v2.0（7 页）、旧《深度解读与代码复用分析》MD。
- 代码扫描：codegraph + semble 深度扫描 `craftisle-resume`、`craftisle-app`；`imgprompt` 确认无本地代码。
- 真实代码锚点：`craftisle-resume/packages/{pdf,docx,schema,resume,ai,import,api}`；`craftisle-app/lib/image-tools/process/passport-photo.ts`、`lib/idphoto/inference.ts`、`lib/image-tools/registry.ts`。
- 成员产出（已保存）：瑞思（用户研究）、竞析（竞品分析）、数析（指标数据）、析客（PRD v1）、路径（路线图 v1）；本版由主理人整合并补代码级细节。
- 支撑文件：`refs/strategy-context.md`、`refs/reuse-map.md`（v1）、`refs/research-bundle.md`。

---

> 本报告由产品战略团队 AI 协作生成（v2 深度细化版），代码级复用映射经 codegraph+semble 实测核对。重要决策请由产品负责人审定。
