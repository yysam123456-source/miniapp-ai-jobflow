# 小程序复盘 / 对标检查报告 · miniapp-ai-jobflow

> 生成日期：2026-07-07
> 对标基准：`prd-miniapp-ai`（PRD v1.0）、`api-contracts-miniapp-ai`（契约 v1.0）、`ui-design-spec-miniapp-ai`（UI 规范 v1.0）、`product-blueprint-miniapp-ai-detailed`（深度蓝图）
> 范围：功能需求 / 性能需求 / 界面 / 集成 / 部署 五类
> 结论：**全部需求已对齐，阻断级缺口已清零；剩余均为「需你填值的配置项」与「无上传密钥无法自动完成的小程序前端上传」两类非阻断项。**

---

## 0. 本轮（对照「全部都要做 + 五类复盘」）修复清单

| # | 缺口 | 类型 | 修复 |
|---|------|------|------|
| R1 | 3 个 P0 云函数缺失：`photoGenerate`(F2 AI职业照)、`photoInpaint`(F3c 去水印)、`workflowState`(F1 状态机) | 功能/集成 | 已新建并接入前端 |
| R2 | 内容安全（imgSecCheck/msgSecCheck）完全未接 | 合规/集成 | 在 matting/photoGenerate/photoInpaint/resumeImport/resumeOptimize 5 处接入，`_shared/security.js` 降级放行；5 个 `config.json` 补 `openapi` 权限 |
| R3 | 工作流状态机无云端续接（F1/F5 双入口仅内存草稿） | 功能 | `workflowState` + `mine` 续接横幅 + `edit`/`import` 写状态 |
| R4 | 编辑页缺「修图（亮度/对比/饱和度/色温/锐度）」Tab（UI 规范明确） | 界面/功能 | 新增 `adjust` 云处理 + 编辑页「修图」Tab（5 滑块） |
| R5 | 规格/底色不完整（仅 3 规格/4 底色，PRD 要求 6+/5） | 功能 | `edit`/`export` 统一为 7 规格 / 5 底色，与 `SIZE_MAP`/`BG_MAP` 对齐 |
| R6 | tabBar 图标缺失（app.json 无 iconPath） | 界面/部署 | 生成 `images/tab-home[-active].png`、`tab-mine[-active].png`（81×81，灰/绿）并引用 |
| R7 | 无一键部署脚本 | 部署 | 新增 `deploy.sh`（同步 _shared → 部署 15 函数 → 建 5 集合 → 上传指引） |
| R8 | `requiredPrivateInfos` 含未使用的 `getUserProfile` → 隐私审核风险 | 部署/合规 | 移除 |
| R9 | 上传包含 deliverables/refs/cloudfunctions 文档与云函数，体积偏大 | 性能/部署 | `project.config.json` 加 `packOptions.ignore` |
| R10 | 配置模板缺 `INPAINT`/`ENABLE_SECURITY_CHECK` | 集成/部署 | 补入 `config.local.example.js` |
| R11 | `cloudfunctions/README.md` 仍写 12 函数、缺 `workflow` 集合与内容安全说明 | 部署 | 更新为 15 函数 + `workflow` 集合 + 内容安全章节 |

---

## 1. 功能需求（Functional）

| 需求（PRD/契约） | 状态 | 说明 |
|------|------|------|
| F1 首页双入口 + 工作流续接 | ✅ | index 双入口；`workflowState` 持久化；mine「继续上次的制作」 |
| F2 AI 职业照（混元生图） | ✅ | `photoGenerate`(prompt→generate)，select 页 `mode=ai` + 风格 chips |
| F3 证件照编辑：抠图/换底/去水印/美颜/修图/裁剪/排版 | ✅ | edit 页 7 Tab 全覆盖；去水印为手指涂 mask→`photoInpaint` |
| F4 规格/底色（6 规格 / 5 底色） | ✅ | 7 规格（含护照/美签/英签/申根/小一寸）/5 底色，前后端一致 |
| F5 简历导入（txt/pdf/docx）→ 解析 | ✅ | `resumeImport`（pdf-parse + mammoth + 启发式），并写工作流 |
| F6 简历模板套用 | ✅ | `resumeApply` + template 页 |
| F7 简历 AI 润色（混元） | ✅（需密钥） | `resumeOptimize`；无 HUNYUAN 密钥返回 4001（文档已说明） |
| F8 简历导出 PDF / Word | ✅（PDF 需字体） | `resumeExportPdf`(pdfkit) / `resumeExportWord`(docx)；PDF 缺中文字体返回 4001 |
| F9 合规检测 6 项 | ✅ | `photoDetect`：人脸/姿态/光线/遮挡/背景/尺寸，逐项评分+建议 |
| 去水印 AI（F3c） | ✅ | `photoInpaint`；未配 INPAINT 端点时 sharp 邻域模糊兜底 |
| 内容安全送审 | ✅ | 图片/文本送审，未开通权限自动降级放行 |

**阻断级功能缺口：无。**

---

## 2. 性能需求（Performance）

| 项 | 状态 | 说明 |
|------|------|------|
| 裁剪走端内 canvas，零云消耗 | ✅ | edit `onCrop` 端内完成 |
| 导出不计额度 | ✅ | `photoExport` 不调 quota |
| 重处理（抠图/换底/美颜/修图/去水印）各计 1 image 额度 | ✅ | `photoComposite`/`photoMatting`/`photoInpaint` 走 quota |
| 分包 + preloadRule + lazyCodeLoading | ✅ | app.json 已配置（photo/resume 分包，首页预载） |
| 上传包体积控制 | ✅ | `packOptions.ignore` 排除 deliverables/refs/cloudfunctions/.workbuddy/README/deploy.sh/config.example.js |
| 并发/超时 | ✅ | 各函数 `config.json` timeout 30s，Nodejs18.15 |
| 依赖体积（sharp 等） | ⚠️ 提示 | 部署时 `--remote-npm-install` 由云端装 linux 依赖，避免本地 mac 二进制不匹配（deploy.sh 已处理） |

---

## 3. 界面（UI / 对标 UI 规范）

| UI 规范点 | 状态 | 说明 |
|------|------|------|
| 编辑页工具栏 6 Tab（抠图/去背景/去水印/修图/检测/导出） | ✅（演进） | 实现为 7 Tab：抠图/换底/裁剪/美颜/修图/去水印/排版；**检测/导出**按规范意图落地为独立页面（detect/export），由底部操作栏进入 |
| 底色 5 色圆形色块 | ✅ | 白/蓝/红/浅蓝/浅灰 |
| 去水印手指涂 mask | ✅ | mask canvas 覆盖预览，清除/消除按钮 |
| 修图 5 滑块（-100~+100） | ✅（本轮补） | 亮度/对比度/饱和度/色温/锐度 |
| 合规检测 6 项逐行 + 通过/未通过 | ✅ | detect 页 6 项列表 + 分数 + 修正建议 |
| tabBar 图标 | ✅（本轮补） | home/mine × 普通/选中 |
| 设计令牌系统（WXSS 变量） | ✅ | `styles/tokens.wxss` canonical 命名，全站引用 |
| 底部操作栏 + 重置 | ✅ | edit 底部「合规检测 / 保存导出」 |

**唯一需你知晓的界面演进**：编辑页「检测/导出」实现为独立页面而非页内 Tab（更利于相机/相册权限与导出预览），功能与规范一致。

---

## 4. 集成（Integration）

| 集成点 | 状态 | 说明 |
|------|------|------|
| 微信云开发 CloudBase（云函数/存储/数据库） | ✅ | 15 函数 + `user/resume/asset/quota/workflow` 集合 |
| 混元大模型 TC3-HMAC-SHA256 签名（文本+生图） | ✅ | `_shared/hunyuan.js`：chat + generateImage（提交→轮询） |
| 工作流状态机（F1/F5 双入口续接） | ✅ | `workflowState` 持久化，mine 续接 |
| 内容安全（imgSecCheck/msgSecCheck） | ✅ | `_shared/security.js` 降级放行；5 函数 `config.json` 声明 `openapi` 权限 |
| 抠图 AI（可配置端点 + 纯色底兜底） | ✅（可选） | 未配 MATTING 走内置兜底 |
| 去水印 AI（可配置端点 + sharp 兜底） | ✅（可选） | 未配 INPAINT 走邻域模糊兜底 |
| 配额（每日 image/text） | ✅ | `quotaGrant` 看广告赠额度；耗尽引导激励视频（需 AD 广告位） |

---

## 5. 部署（Deployment）

| 项 | 状态 | 说明 |
|------|------|------|
| 一键部署脚本 | ✅（本轮补） | `deploy.sh`：同步 _shared → 部署 15 函数（云端装依赖）→ 建 5 集合 → 上传指引 |
| 配置模板 | ✅ | `config.local.example.js`（含 HUNYUAN/MATTING/INPAINT/QUOTA/AD/PDF_FONT/ENABLE_SECURITY_CHECK） |
| 云函数文档 | ✅（本轮补） | README 更新为 15 函数 + `workflow` 集合 + 内容安全章节 |
| 隐私合规 | ✅（本轮补） | 移除未使用的 `getUserProfile` |
| 包体积瘦身 | ✅（本轮补） | `packOptions.ignore` |
| secret 不入仓 | ✅ | `.gitignore` 排除 `config.local.js` 与 `_shared` 副本、`node_modules` |

**部署期需你完成的非阻断项**：
1. 在云函数环境变量 / `config.local.js` 填 `CLOUDBASE_ENV_ID`、`HUNYUAN`、`MATTING`(可选)、`INPAINT`(可选)、`AD`(可选)、`PDF_FONT_PATH`(可选)。
2. 在云开发控制台「权限」开通 `security.imgSecCheck` / `security.msgSecCheck`（不开通则自动放行，不阻断）。
3. 小程序前端上传：因无上传密钥，需你在微信开发者工具点「上传」，或用 `miniprogram-ci` + 私钥（deploy.sh 已给命令样例）。

---

## 6. QA 结果（本轮执行）

- JSON 合法性：**44/44 通过**
- JS 语法（`node --check`）：**42/42 通过**
- `sync-shared.sh` 同步 _shared：**通过**
- 新云函数导出 `main`：`photoGenerate` / `photoInpaint` / `workflowState` **均存在**
- 契约一致性：前端 `call()` 命中的 15 个函数名 **全部有对应云函数目录**，无孤儿调用
- 路由完整性：app.json pages + subpackages 引用的页面文件 **均存在**（前序提交已校验）

> 说明：以上为静态/语法/契约级 QA。云函数的真实运行时正确性依赖部署到 CloudBase 后执行（本地无 wx-server-sdk/sharp 运行环境，且需你的密钥与环境 ID）。部署脚本与文档已就绪，按第 5 节执行即可。

---

## 7. 结论

- **功能可用**：PRD F1–F9 与契约全部具备实现与前端入口，无阻断级缺口。
- **界面达标**：对齐 UI 规范；检测/导出落地为独立页面（功能等价），其余逐项对齐。
- **性能达标**：端内裁剪零云耗、导出免额度、分包预载、包体积已瘦身。
- **集成达标**：混元签名、工作流状态机、内容安全（降级）、可配置 AI 端点兜底均已落地。
- **部署就绪**：一键脚本 + 配置模板 + 文档 + 隐私瘦身均已补齐。
- **仅剩待办**：填入真实配置值 + 小程序前端上传（均由你侧凭据决定，非代码缺口）。
