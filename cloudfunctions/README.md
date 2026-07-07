# 云函数部署与配置说明

小程序后端为微信云开发（CloudBase）云函数，位于 `cloudfunctions/`。

## 函数清单（15 个）

| 函数 | 用途 | 依赖 |
|------|------|------|
| `userLogin` | 静默登录返回 openid | wx-server-sdk |
| `userWorks` | 「我的作品」列表 | wx-server-sdk |
| `quotaGrant` | 看广告赠送额度 | wx-server-sdk |
| `photoMatting` | 抠图（透明 PNG）+ 图片安全送审 | wx-server-sdk, sharp |
| `photoComposite` | 换底 / 美颜 | wx-server-sdk, sharp |
| `photoDetect` | 合规检测 6 项评分 | wx-server-sdk, sharp |
| `photoExport` | 规格裁切导出 | wx-server-sdk, sharp |
| `photoGenerate` | AI 职业照（混元生图：prompt→生成） | wx-server-sdk |
| `photoInpaint` | 去水印（AI 端点 / sharp 邻域模糊兜底） | wx-server-sdk, sharp |
| `workflowState` | 工作流状态机持久化（F1/F5 续接） | wx-server-sdk |
| `resumeImport` | 简历导入解析（text/pdf/docx）+ 文本安全送审 | wx-server-sdk, pdf-parse, mammoth |
| `resumeApply` | 套用模板 | wx-server-sdk |
| `resumeOptimize` | AI 润色（混元）+ 文本安全送审 | wx-server-sdk |
| `resumeExportPdf` | 导出 PDF | wx-server-sdk, pdfkit |
| `resumeExportWord` | 导出 Word | wx-server-sdk, docx |

## 部署步骤

1. **同步公共模块**（每个函数独立打包，需把 `_shared` 拷进去）：
   ```bash
   bash cloudfunctions/sync-shared.sh
   ```
2. **填配置**：复制 `cloudfunctions/_shared/config.local.example.js` 为 `config.local.js`，填入真实值（不会入库）。
   机密也可改在「云开发控制台 → 云函数 → 环境变量」中配置同名变量。
3. **安装依赖并部署**：在微信开发者工具中右键各云函数「上传并部署：云端安装依赖」；
   或用 CLI：`tcb fn deploy <函数名> --dir cloudfunctions/<函数名>`。
4. **建数据库集合**：`user`、`resume`、`asset`、`quota`、`workflow`（均默认权限或按 openid 读自己）。
   `workflow` 由 `workflowState` 使用，支撑「首页双入口 / 我的页继续制作」的状态续接。
5. **前端填环境 ID**：编辑根目录 `config.js`，把 `CLOUDBASE_ENV_ID` 换成你的云环境 ID。

## 配置项（config.local.js / 环境变量）

| 配置 | 说明 | 缺失后果 |
|------|------|----------|
| `CLOUDBASE_ENV_ID` | 云环境 ID | 所有函数不可用 |
| `HUNYUAN.SECRET_ID/KEY` | 混元密钥 | 解析走启发式；润色/图片OCR返回 4001 |
| `MATTING.ENDPOINT/API_KEY` | 抠图 AI（可选） | 抠图走内置纯色底兜底 |
| `INPAINT.ENDPOINT/API_KEY` | 去水印 AI（可选） | 留空则 sharp 邻域模糊兜底（轻量可用） |
| `QUOTA.DAILY_IMAGE/TEXT` | 每日免费次数 | 用默认值 20/10 |
| `AD.REWARD_UNIT_ID` | 激励视频广告位 | 1002 仅弹提示，不弹广告 |
| `PDF_FONT_PATH` | 中文字体路径 | PDF 导出返回 4001（Word 不受影响） |
| `ENABLE_SECURITY_CHECK` | 内容安全开关（默认 true） | 未开通 security 接口权限时自动降级为放行，不阻断业务 |

> 字体：将 CJK TTF 放到 `cloudfunctions/_shared/fonts/NotoSansSC.ttf`，`PDF_FONT_PATH` 留空即可自动识别。

## 内容安全（imgSecCheck / msgSecCheck）

为合规，上传的图片与用户文本会送审：

- **图片送审**：`photoMatting`、`photoGenerate`、`photoInpaint` 在拿到用户图后调用 `cloud.openapi.security.imgSecCheck`。
- **文本送审**：`resumeImport`（简历原文）、`resumeOptimize`（JD 文本）调用 `cloud.openapi.security.msgSecCheck`。

接入方式：
1. 在「云开发控制台 → 云函数 → 对应函数 → 配置 → 权限」中开通 `security.imgSecCheck` / `security.msgSecCheck`（各函数 `config.json` 的 `permissions.openapi` 已声明）。
2. 代码层（`_shared/security.js`）做了**降级保护**：未开通权限、接口异常或 `ENABLE_SECURITY_CHECK=false` 时一律返回 `pass:true`，**不会阻断正常业务**；仅真正命中违规时返回 `block`。

## 计费 / 免费额度

全部走云开发免费额度（云函数 + 云存储 + 云数据库）。混元按腾讯云计费，配置密钥后即用即扣；
不想接入 AI 时也能跑通 text/pdf/docx 导入与证件照图像处理（sharp 本地完成）。
