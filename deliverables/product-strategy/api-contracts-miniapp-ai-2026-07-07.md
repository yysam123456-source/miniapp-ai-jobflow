# 小程序 AI 求职一站式 · 云函数 API 契约 v1.0

**日期**：2026-07-07
**类型**：技术规格 / API 契约
**云函数运行时**：微信云开发 CloudBase（Node.js 18+，wx-server-sdk）

---

## 目录

1. [通用约定](#通用约定)
2. [简历工作流](#简历工作流)
3. [证件照工具链](#证件照工具链)
4. [用户与共享](#用户与共享)
5. [数据模型汇总](#数据模型汇总)

---

## 通用约定

### 调用方式

```js
// 小程序端
wx.cloud.callFunction({ name: 'functionName', data: { ... } })

// 云函数间互调
cloud.callFunction({ name: 'functionName', data: { ... } })
```

### 统一返回格式

```ts
type ApiResponse<T> = {
  code: 0 | 1001 | 1002 | 2001 | 3001 | 4001 | 5000  // 0=成功
  message: string
  data?: T
}
```

| code | 含义 |
|------|------|
| 0 | 成功 |
| 1001 | 参数校验失败 |
| 1002 | 额度耗尽 / 超限 |
| 2001 | 未登录 / token 过期 |
| 3001 | 内容安全拦截 |
| 4001 | AI 服务不可用 |
| 5000 | 内部错误 |

### 内容安全

所有接收用户上传图片/文本的端点，调用 `wx.cloud.extend.AI` 前先过 `security.msgSecCheck` / `security.imgSecCheck`，不通过返回 code 3001。

### 额度检查

每次 AI 调用前检查剩余额度（云开发控制台查询），不足时返回 code 1002 + 提示引导流量主观看。

---

## 简历工作流

### 1. resume.importParse

> F6b — 多格式文件导入 + AI 自动解析映射为 `ResumeData`

**云函数**: `resumeImport`

```ts
// Request
POST resumeImport
{
  openid: string                    // 当前用户
  fileId: string                    // 云存储 fileID（微信 uploadFile 返回）
  fileType: 'pdf' | 'docx' | 'image' | 'text'
}

// Response
{
  resumeData: ResumeData            // 解析后的结构化简历
  confidence: number                // AI 解析置信度 0-1
  warnings: string[]                // 如 ["工作经验第3段日期异常"]
  fields: {                         // 逐字段来源标注
    [key: string]: { value: any; source: 'ai' | 'direct' }
  }
}
```

**实现要点**：
- PDF/DOCX → 先文本提取 → 调 Hy3（`pdfParserSystemPrompt` / `docxParserSystemPrompt`）→ `sanitizeAndParseResumeJson` 清洗
- 图片 → OCR 文本提取 → Hy3
- 文本 → 直接 Hy3 → 解析
- 复用：`ai/prompts.ts` prompt 模板 + `ai/sanitize.ts` 清洗逻辑 **零改**

---

### 2. resume.applyToTemplate

> F6 — 将解析后的 `ResumeData` 应用到指定模板，输出带 element 实例的简历

**云函数**: `resumeApply`

```ts
// Request
POST resumeApply
{
  openid: string
  resumeData: ResumeData            // 来自 importParse 或历史
  templateId: string                // 模板 ID（5 套：simple/business/creative/academic/fresh）
}

// Response
{
  resume: {
    _id: string
    templateId: string
    elements: ResumeElement[]       // 含 content + styleOverride 的渲染单元
    photoAssetId?: string           // 关联的证件照
  }
  patches: JsonPatchOp[]            // RFC 6902 patches（用于元素级编辑回写）
}
```

**实现要点**：
- 复用 `schema` 默认值 + `resume.createResumePatches` / `applyResumePatches`
- 模板元素模型与 craftisle schema **同构**（均含 tag + style）

---

### 3. resume.optimize

> F6c — AI 简历润色：STAR 改写 + 量化 + JD 匹配

**云函数**: `resumeOptimize`

```ts
// Request
POST resumeOptimize
{
  openid: string
  resumeId: string
  target?: string                    // 目标岗位描述 / JD 文本
  scope: 'all' | 'work' | 'education' | 'skills'
}

// Response
{
  optimized: ResumeData             // 优化后的完整简历
  patches: JsonPatchOp[]            // 相对于原 resume 的 diff（可逐条预览）
  suggestions: {                    // 逐条优化说明
    [elementId: string]: { before: string; after: string; reason: string }
  }
}
```

**实现要点**：
- 调 Hy3（`analyzeResumeSystemPrompt`）→ STIR(禁止虚构) 由 `sanitizeAndParseResumeJson` 保证
- JD 匹配：提取 JD 关键词 → 注入 prompt → 重点优化对应工作经历
- patch 格式支持"预览+逐条采纳"UI

---

### 4. resume.exportPdf

> F7 — 简历 PDF 导出（A4 中文 + 嵌入证件照）

**云函数**: `resumeExportPdf`

```ts
// Request
POST resumeExportPdf
{
  openid: string
  resumeId: string
  photoAssetId?: string             // 证件照 fileID，嵌入简历头部
  locale: 'zh' | 'en'
}

// Response
{
  fileId: string                    // 云存储 fileID，可直接 wx.downloadFile
  size: number                      // 字节数
}
```

**实现要点**：
- 复用 `pdf.createResumePdfFile` → `@react-pdf/renderer`（Node `renderToBuffer`）
- 中文字体：`fonts` 包（思源黑体 CJK 回退），只加载 Regular 子集控制体积
- 证件照：取 `picture.url` 写入 PDF layout

---

### 5. resume.exportWord

> F7b — 简历 Word 导出（P1）

**云函数**: `resumeExportWord`

```ts
// Request
POST resumeExportWord
{
  openid: string
  resumeId: string
}

// Response
{
  fileId: string
  size: number
}
```

**实现要点**：复用 `docx.buildDocx` → `Packer.toBuffer()` 返回 Buffer

---

## 证件照工具链

### 6. photo.generatePortrait (F2a/F2b)

> AI 职业照生成：分析照片 → 生成 prompt → Hy Image 3.0 出图

**云函数**: `photoGenerate`

```ts
// Step 1: 生成 Prompt（F2a）
// Request
POST photoGenerate
{
  openid: string
  action: 'prompt'
  photoFileId: string               // 用户上传的生活照
  style?: 'formal' | 'casual' | 'creative'  // 默认 formal
}

// Response
{
  prompt: string                    // 优化后的 Hy Image 3.0 prompt
  previewUrl?: string               // 低分辨率预览图 fileID
}

// Step 2: 确认出高清（F2b）
POST photoGenerate
{
  openid: string
  action: 'generate'
  prompt: string
  confirm: true                     // 用户确认后才消耗生图额度
}

// Response
{
  generatedFileId: string           // 高清职业照 fileID
}
```

**实现要点**：
- 10 万张生图额度 → 预览不消耗，确认后才调 Hy Image 3.0
- Hy3 分析照片特征（性别/发型/服装/场景）→ 拼接专业 prompt

---

### 7. photo.matting (F3a)

> 抠图：人像主体提取 → 输出透明 PNG

**云函数**: `photoMatting`

```ts
// Request
POST photoMatting
{
  openid: string
  photoFileId: string               // 原始照片
  model?: 'standard' | 'enhanced'   // 默认 standard（isnet），enhanced 精度更高更慢
}

// Response
{
  mattedFileId: string              // 透明背景 PNG fileID
  metering: {                       // 处理耗时
    coldStart: boolean              // 是否首次调用（冷启动）
    duration: number                // 耗时 ms
  }
}
```

**实现要点**：
- `rembg` / onnx 系自托管云函数层
- 输入 ≤ 2048×2048，输出 RGBA PNG
- 冷启动 < 5s，后续 < 2s
- 预热：函数 keep-warm（每 5min 空 ping）

---

### 8. photo.background (F3b)

> 去背景：抠图结果 → 替换纯色/自定义背景

**云函数**: `photoBackground`

```ts
// Request
POST photoBackground
{
  openid: string
  mattedFileId: string              // 来自 photoMatting 的透明图
  bgColor?: 'white' | 'blue' | 'red' | 'lightblue' | 'lightgray'  // 默认 white
  bgImageFileId?: string            // 可选：自定义背景图（与 bgColor 二选一）
}

// Response
{
  resultFileId: string              // 换底后图片
}
```

**实现要点**：
- 复用 `craftisle-app` 的 `BG_COLORS`（5 色）+ `applyBackground` 纯几何换色
- Canvas compositing：透明图置顶 + 纯色/自定义背景垫底
- 支持上传自定义背景 → 自动 resize 匹配照片尺寸

---

### 9. photo.inpaint (F3c)

> 去水印：用户手涂 mask → AI 智能填充消除

**云函数**: `photoInpaint`

```ts
// Request
POST photoInpaint
{
  openid: string
  photoFileId: string               // 待去水印的照片
  maskFileId: string                // 用户涂抹的 mask 图片（黑白二值，白色=需消除区域）
}

// Response
{
  resultFileId: string              // 消除水印后图片
  metering: { duration: number }
}
```

**实现要点**：
- 开源 inpainting LaMa 轻量版自托管（~50MB onnx）
- 小程序端：Canvas 手指涂抹 → 导出 mask 黑白图
- 推理 < 10s（证件照 ~1MP）
- LaMa 模型文件打包进云函数层（Layer），避免每次冷启动下载

---

### 10. photo.retouch (F3d)

> 修图：亮度/对比度/饱和度/色温/锐化/磨皮/去瑕疵

**云函数**: `photoRetouch`

```ts
// Request
POST photoRetouch
{
  openid: string
  photoFileId: string
  adjustments: {
    brightness?: number             // -100 ~ +100, 默认 0
    contrast?: number               // -100 ~ +100
    saturation?: number             // -100 ~ +100
    temperature?: number            // 色温 -100(冷) ~ +100(暖)
    sharpness?: number              // 0 ~ 100
    skinSmooth?: number             // 磨皮强度 0 ~ 100, 0=不磨
  }
}

// Response
{
  resultFileId: string
  preview: {                        // 可选低清预览用于实时调节
    previewFileId: string
    quality: 'low'
  }
}
```

**实现要点**：
- **基础修图**：Sharp npm 零成本（`modulate` / `linear` / `sharpen`）
- **磨皮**：onnx 轻量人脸美化模型（~50MB），仅对 skin 区域高斯模糊
- 预览优化：调节时出 50% 低清预览，确认后出全高清
- 全部参数可分步调节，不累加 latency

---

### 11. photo.detect (F3e)

> 合规检测：6 项逐项评分 + 修正指引

**云函数**: `photoDetect`

```ts
// Request
POST photoDetect
{
  openid: string
  photoFileId: string
  targetSpec: '1inch' | '2inch' | 'passport' | 'us_visa' | 'uk_visa' | 'schengen'
}

// Response
{
  overallPass: boolean
  checks: {
    face:        { pass: boolean; score: number; suggestion?: string }  // 人脸
    pose:        { pass: boolean; score: number; suggestion?: string }  // 姿态
    lighting:    { pass: boolean; score: number; suggestion?: string }  // 光线
    occlusion:   { pass: boolean; score: number; suggestion?: string }  // 遮挡
    background:  { pass: boolean; score: number; suggestion?: string }  // 背景
    resolution:  { pass: boolean; score: number; suggestion?: string }  // 尺寸
  }
}
```

**实现要点**：
- 人脸 + 姿态：开源 face-api.js / MediaPipe（onnxruntime）
- 光线：直方图分析（纯 JS）
- 遮挡：分割模型 + 规则判断
- 背景复杂度：抠图结果边缘像素方差
- 尺寸：直接读宽高 vs 目标规格

---

### 12. photo.export (F4a/F4b)

> 规格裁切 + 回执排版

**云函数**: `photoExport`

```ts
// Request
POST photoExport
{
  openid: string
  photoFileId: string               // 处理完成的证件照
  spec: '1inch' | '2inch' | 'passport' | 'us_visa' | 'uk_visa' | 'schengen'
  withReceipt?: {                   // 回执排版（可选）
    city: string                    // 如 "深圳"
    quantity: number                // 打印数量，默认 4
  }
}

// Response
{
  files: {
    singleFileId: string            // 单张证件照
    receiptFileId?: string          // 回执排版图（4 联 / 6 联印刷用）
  }
  dimensions: { width: number; height: number }  // 实际输出像素
}
```

**实现要点**：
- 复用 `craftisle-app` 的 `ID_PHOTO_SIZES`（6 规格）+ `cropToSize`
- 回执：Sharp compose 拼版 + 回执文字
- 城市规则：维护一个 `receipt-rules.json`（城市 → 排版参数）

---

## 用户与共享

### 13. user.login

**云函数**: `userLogin`（由 `wx.login` 触发，框架层面自动处理）

```ts
// 微信云开发自带 openid 注入，无需单独云函数
// 在其它云函数中通过 cloud.getWXContext().OPENID 获取
```

### 14. workflow.get / workflow.update

> 工作流状态机持久化

**云函数**: `workflowState`

```ts
// GET
POST workflowState { openid: string, action: 'get' }
// → { current: WorkflowState | null, history: WorkflowState[] }

// SET
POST workflowState { openid: string, action: 'set', state: Partial<WorkflowState> }
// → { success: true }

// Workflow State
type WorkflowState = {
  _id: string
  type: 'resume_flow'
  step: 'select_photo' | 'edit_photo' | 'import_resume' | 'choose_template' | 'edit_resume' | 'optimize' | 'export' | 'share' | 'completed'
  photoAssetId?: string
  resumeId?: string
  templateId?: string
  createdAt: number
  updatedAt: number
}
```

### 15. share.buildCard

> 微信分享卡片

**小程序端**（非云函数）：
```js
onShareAppMessage() {
  return {
    title: '看看我的简历！',
    path: `/pages/resume/view?id=${resumeId}`,
    imageUrl: shareCardUrl       // 由云函数 photoExport 生成
  }
}
```

---

## 数据模型汇总

```ts
// --- 用户 ---
User {
  _id: string          // openid
  nickName: string
  avatarUrl: string
  createdAt: Date
}

// --- 素材 ---
Asset {
  _id: string
  owner: string         // openid
  type: 'photo' | 'export' | 'resume_pdf' | 'resume_docx'
  url: string           // 云存储 fileID
  meta: {
    spec?: string       // 证件照规格
    compliance?: { overallPass: boolean, checks: {...} }
    dimensions?: { w: number, h: number }
  }
  source: 'upload' | 'ai_gen' | 'edited'
  createdAt: Date
}

// --- 模板 ---
Template {
  _id: string
  name: string          // 'simple' | 'business' | 'creative' | 'academic' | 'fresh'
  category: string
  layout: 'single' | 'double'
  blocks: Block[]
  elements: {
    id: string
    type: 'text' | 'image' | 'section'
    tag: string         // 语义标签：'name' | 'title' | 'summary' | 'work' | 'education' | 'skill' | 'photo'
    defaultStyle: object
    pos: { x: number, y: number, w: number, h: number }
  }[]
  styleToken: {
    fontFamily: string
    primaryColor: string
    backgroundColor: string
  }
}

// --- 简历 ---
Resume {
  _id: string
  owner: string         // openid
  templateId: string
  elements: {
    id: string
    content: any        // 文本/图片URL/数组
    styleOverride?: object
    visible: boolean
  }[]
  photoAssetId?: string
  rawImport?: string    // 原始导入的文本
  jd?: string           // 目标 JD
  optimized?: boolean
  createdAt: Date
  updatedAt: Date
}

// --- 工具流状态 ---
WorkflowState {
  _id: string
  owner: string         // openid
  type: 'resume_flow'
  step: string
  status: 'in_progress' | 'completed' | 'abandoned'
  photoAssetId?: string
  resumeId?: string
  templateId?: string
  createdAt: Date
  updatedAt: Date
}
```

---

## 额度监控（所有 AI 端点共用）

每个 AI 调用端点内置中间件：

```ts
// 伪代码
async function checkQuota() {
  const { textToken, imageCount } = await getQuotaUsage()
  if (textToken > 0.9 * QUOTA_LIMIT) {
    // 达到 90% → 触发公众号消息提醒 + 前端提示
  }
  if (imageCount >= QUOTA_IMAGE_LIMIT) {
    // 生图耗尽 → 返回 code 1002 + 引导观看流量主广告
    return { code: 1002, message: '生图额度已用完，观看广告获取额外次数' }
  }
}

// 在 photoGenerate (F2b 确认步骤) 和 resumeOptimize (F6c) 前调用
```

---

> 本契约文档基于 PRD v1.0（`prd-miniapp-ai-2026-07-07.md`）生成，全部端点落在免费额度约束内。开发顺序：先简历（1-5）后证件照（6-12），reuse 的云函数优先（1/2/4/5），新建的依赖模型部署顺序（6→7→8/9/10→11→12）。
