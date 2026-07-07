# 代码复用映射（深度扫描验证版）— 构建块

> 由主理人基于 codegraph + semble 对 `craftisle-resume`、`craftisle-app` 的实测扫描结果整理。
> 用途：作为最终战略文档"代码复用"章节的权威底稿。imgprompt 确认无本地代码。

## 一、复用总览（三级）

| 级别 | 覆盖 | 对应 Spec 功能 |
|---|---|---|
| ✅ 直接复用（逻辑内核，几乎零改） | schema / resume(patch) / pdf+fonts / docx / import | F6 / F6b(导入分支) / F6c(清洗) / F7 / F7b / 元素级编辑 |
| 🔧 改造复用（替换 LLM 调用层 / 移植 Sharp 逻辑） | ai 的 prompt+清洗+patch 契约；craftisle-app 的 passport-photo/id-photo/remove-bg | F6b / F6c（换混元）；F2/F3/F4 后处理 |
| ❌ 必须新建 | 微信登录 / 微信分享 / workflow 状态机 / 流量主 / 检测引擎兜底 / 平台绑定层 | F5 / F8 / F9 / workflow.* |

**核心结论**：
- 简历核心链路（F6/F6b/F6c/F7/F7b）≈ **80% 逻辑可由 craftisle-resume 直接/改造复用**（修正旧 MD 的"零复用"仅为证件照，简历侧本就高复用）。
- 证件照链路（F2/F3/F4）：**生成（Hy Image 3.0）新建，但后处理（裁剪到规格/换底/调色/导出/抠图）可由 craftisle-app 现有 Sharp 逻辑复用**——从"零复用"升级为"逻辑/预设复用"，显著降低工作量与风险。

---

## 二、craftisle-resume 复用明细（已验证签名/路径）

| Spec 端点 | 现有实现 | 文件 | 复用级 | 改造点 |
|---|---|---|---|---|
| F7 `resume.exportPdf` | `createResumePdfFile({data, filename, template?, resolveSectionTitle?})` → `renderToBuffer`(@react-pdf/renderer) → `File` | `packages/pdf/src/server.tsx` | 直接复用（最高价值） | 适配 5 套中文模板；证件照写 `picture.url` 由字体包保中文；验证云函数 Node 体积/冷启动 |
| F7b `resume.exportWord` | `buildDocx(data: ResumeData): Promise<Blob>` → `buildDocument`（镜像版式/字体/配色） | `packages/docx/src/index.ts`、`builder.ts` | 直接复用（高） | 输入同为 `ResumeData` |
| F6c `resume.optimize` | `analyzeResumeSystemPrompt` + `sanitizeAndParseResumeJson`（禁虚构/清洗）+ patch 工具契约 | `packages/ai/src/prompts.ts`、`resume/sanitize.ts`、`tools/patch-proposal.ts`（聚合于 `packages/api/src/features/ai/service.ts`） | 改造复用（高） | `getModel()` 已支持 `openai-compatible`（`createOpenAICompatible({name, apiKey, baseURL}).languageModel(model)`）→ 仅改 provider 配置即可复用全部 prompt/清洗 |
| F6b `resume.importParse` | `pdfParserSystemPrompt/User`、`docxParserSystemPrompt/User` + `sanitizeAndParseResumeJson` + importers（`JSONResumeImporter`/`ReactiveResumeJSONImporter`/`ReactiveResumeV4Importer`） | `packages/ai/...`、`packages/import/src/*` | 改造复用（高） | PDF/Word 走 Hy3；图片 OCR/文本同理；`import` 包保留结构化简历导入分支；统一输出 `ResumeData` |
| F6 `resume.applyToTemplate` | `resumeDataSchema`/`defaultResumeData`/`templateSchema` + `createResumePatches`/`applyResumePatches`（RFC 6902） | `packages/schema/src/resume/data.ts`、`packages/resume/src/patch.ts` | 直接复用（高） | schema 默认值实例化 + patch 填充；元素模型与 Spec `elements{id,type,tag,defaultStyle,pos}` 同构 |
| F6 元素级编辑 | `pictureSchema{url,size(32-512),rotation(0-360),aspectRatio(0.5-2.5),borderRadius,borderColor,borderWidth,shadowColor,shadowWidth}`；元素编辑=patch | `packages/schema/src/resume/data.ts`、`packages/pdf/src/templates/shared/picture.ts`(`hasTemplatePicture`) | 直接复用 | 所见即所得→patch；`picture.url` 直接进 PDF 渲染 |
| 数据模型 | `resumeDataSchema`/`pictureSchema`/`defaultResumeData` | `packages/schema/src/resume/*` | 直接复用 | 作小程序简历 JSON 结构；`users/assets/workflows` 按云 DB NoSQL 新写 |

**最大杠杆（P0-1）**：`packages/ai/src/types.ts` 的 `AI_PROVIDERS` 含 `"openai-compatible"`（baseURL 默认 `""`）；`service.ts` 的 `getModel()` 已实现 `createOpenAICompatible`。→ 若混元 Hy3 暴露 OpenAI 兼容协议，则 `resume.optimize`/`importParse` 的 LLM 层**仅改 provider 配置即可复用全部 prompt 与清洗逻辑**，成本最低、风险最小。

---

## 三、craftisle-app 复用明细（已验证签名/路径，修正旧结论）

| Spec 端点 | 现有实现 | 文件 | 复用级 | 改造点 |
|---|---|---|---|---|
| F4 换底/裁剪/导出 | `passportPhoto(buffer, {preset, width?, height?})`：Sharp `resize(cover, center)` + `.flatten({background:white})` + `jpeg(q95)`；工具描述声明支持 **China/US/UK/EU 及 50+ 国家规格** | `lib/image-tools/process/passport-photo.ts`、`lib/tools.ts`(L3182 Passport Photo) | 改造复用（逻辑/预设） | 生成用 Hy Image 3.0（新建）；后处理（裁剪到规格/换底白/调色/导出 jpg）复用 Sharp 逻辑，可跑云函数 Node 或独立图片服务 |
| F4 发丝级抠图/换底 | `id-photo`(`components/tools/IDPhoto/IDPhotoTool`)、`remove-bg`(`BackgroundRemovalTool`) | `lib/tool-components.tsx` | 改造复用（逻辑/预设） | 抠图/换底能力已存在，评估云函数/小程序侧复用（Sharp/模型） |
| F3 合规检测线索 | Passport Photo "Auto-detects face position" → 暗示人脸检测依赖 | `lib/tools.ts` | 待深挖 | 第三方开源优先；craftisle-app 人脸定位实现可作评估输入 |
| 图片原语 | 17+ 工具：resize/crop/compress/convert/rotate/colorPalette/border/watermark/colorAdjust/stripMetadata/info/favicon…（服务端 Sharp） | `lib/image-tools/registry.ts` | 参考复用 | F4 美化/调色复用 colorAdjust 等 |

> 传输层（Next.js Route Handler `/api/tools/${toolId}`）不可直接搬进微信云函数，但**业务逻辑、规格预设、抠图/换底算法可移植/改写**。修正旧 MD"craftisle-app 无业务可复用"。

---

## 四、imgprompt
本地无代码仓库（仅 `imgprompt.craftisle.com` 外链）。F2 人像 prompt 生成需自写，可参考线上方法论。

---

## 五、架构方案 A/B（复用策略一致，仅载体不同）

- **方案 A（云函数移植）**：纯逻辑包拷进云函数，AI 换混元，DB/存储/登录换云开发。需验证 @react-pdf/renderer + 中文字体在云函数体积/冷启动。
- **方案 B（小程序=craftisle-resume 新客户端，★最大复用）**：`request` 直连已部署 Hono 后端 + 新增 `mini` 路由；AI provider 切混元；微信登录加 openid 适配。简历全链路近乎零改造。
- **推荐**：优先 B；证件照/微信原生新建（但 F4 后处理复用 craftisle-app）；若强约束云开发则退 A。无论 A/B，`openai-compatible` 适配混元均适用。

---

## 六、风险寄存器（待成员回应）

| ID | 风险 | 级别 | 缓解 |
|---|---|---|---|
| R1 | 架构决策漂移（A/B 未定） | 高 | 产品/技术负责人正式确认 |
| R2 | @react-pdf/renderer 云函数可行性 | 中 | 走 A 前先验证 Node 体积/冷启动 |
| R3 | 混元兼容协议未确认 | 高 | P0-1：确认 Hy3/Hy Image 3.0 OpenAI 兼容 |
| R4 | 证件照引擎成本（非免费额度） | 中 | 独立成本评估 + craftisle-app 抠图移植可行性 |
| R5 | 数据割裂（与 web 端） | 低 | 账号/数据隔离，代码可共用 |
