# AI 求职一站式 · 功能实现缺口清单（GAP）

> 日期：2026-07-07 · 基于 commit `5ddb80e`（脚手架已提交 main）
> 结论先行：**前端页面 + 交互 + 云函数调用接线 ≈ 100% 完成，但后端云函数与 AI 接入 = 0%，当前是一个"可编译、可点击、但跑不通任何真实功能"的完整外壳。**

---

## 1. 实现度总览

| 模块 | 前端 UI / 本地交互 | 前端→后端调用接线 | 后端逻辑 | 状态 |
|------|:---:|:---:|:---:|------|
| 首页双入口 / 快捷操作 | ✅ | ✅ | — | 完成 |
| 我的（资料 / 草稿 / 分享） | ✅ | ⚠️ 仅本地 | ❌ 作品无持久化 | 外壳完成，数据空 |
| 证件照：select | ✅ | ✅ | — | 完成（选图走原生 API） |
| 证件照：edit（6 工具 Tab） | ✅ | ⚠️ 部分 | ❌ | 3/6 接通，3 个仅 UI |
| 证件照：detect（合规评分） | ✅ | ✅ | ❌ | 接线完成，后端缺失 |
| 证件照：export（保存相册） | ✅ | ✅ | ❌ | 接线完成，后端缺失 |
| 简历：import（解析） | ✅ | ✅ | ❌ | 接线完成，后端缺失 |
| 简历：template（套模板） | ✅ | ✅ | ❌ | 接线完成，后端缺失 |
| 简历：editor（元素编辑） | ✅ | ✅ | — | 完成（纯本地表单） |
| 简历：polish（AI 润色） | ✅ | ✅ | ❌ | 接线完成，后端缺失 |
| 简历：view（导出 PDF/Word） | ✅ | ✅ | ❌ | 接线完成，后端缺失 |

**统计**：11 路由 / 44 页面文件全部就位；前端 `call()` 引用 8 个云函数全部到位；**云函数 0/10 实现，AI 接入 0%**。

---

## 2. 未实现清单（按优先级）

### P0 — 必须做，否则端到端全挂
| # | 云函数 | 被谁调用 | 依赖 |
|---|--------|----------|------|
| 1 | `userLogin` | auth.js 静默登录 | 云环境 |
| 2 | `photoMatting`（抠图） | photo/edit | 图像模型/算法 |
| 3 | `photoComposite`（换底 op=bg / 美颜 op=beauty） | photo/edit | 图像模型/算法 |
| 4 | `photoDetect`（合规检测） | photo/detect | 规则/模型 |
| 5 | `photoExport`（合成导出） | photo/export | 图像合成 |
| 6 | `resumeImport`（解析） | resume/import | 混元 Hy3 + 文件解析 |
| 7 | `resumeApply`（套模板） | resume/template | 模板引擎 |
| 8 | `resumeOptimize`（润色） | resume/polish | 混元 Hy3 |
| 9 | `resumeExportPdf` | resume/view | @react-pdf/renderer + 中文字体 |
| 10 | `resumeExportWord` | resume/view | docx 库 |

> 上述 10 个云函数 + 各自 AI/算法依赖 = **当前 0% 实现**，是上线唯一硬阻塞。

### P1 — 前端已留位但逻辑未接通
- **photo/edit 的 3 个工具 Tab 仅 UI 无云调用**：`crop`（裁剪）、`watermark`（去水印）、`layout`（排版）。WXML 里是提示文案占位，edit.js 无对应 `call`。需新增云函数或前端 canvas 实现（裁剪/排版可纯前端 canvas，去水印需算法）。
- **mine 页「作品/历史」无后端**：当前列表为空，无云数据库集合存储生成记录。需建 `works` 集合 + 列表查询云函数（或读云存储前缀）。
- **额度体系 1002 仅弹窗占位**：`utils/cloud.js` 的 1002 分支是提示框，未接真实**流量主激励视频广告**（无广告位 ID、无"看广告加次数"回写逻辑），也无每日额度计数器（需 `quota` 集合 / 云函数计数）。

### P2 — 上线配置占位
- `app.js` 的 `globalData.env = 'CLOUDBASE_ENV_ID_PLACEHOLDER'` 未替换真实云环境 ID。
- `app.json` tabBar **缺 iconPath**（目前只有文字，不影响预览调试，但提审前必须补 81×81 图标）。
- 隐私协议：用到 `getUserProfile` 等需在公众平台配置隐私声明与权限说明。

---

## 3. 下一步建议（最短路径跑通真功能）

1. 取真实云环境 ID 填入 `app.js` → 开发者工具编译。
2. 按 P0 顺序落地云函数，**先证件照 4 个**（select→edit→detect→export 能闭环，最易验证），再简历 6 个。
3. 简历链路优先 `import→apply→view(导出)`，polish 润色可作为第二批。
4. P1 中 `crop/layout` 用前端 canvas 实现（不依赖云），`watermark` 与去水印算法排期。
5. 接流量主广告位 + 额度计数，把分享裂变闭环成增长钩子。

> 详细契约见 `deliverables/product-strategy/api-contracts-miniapp-ai-2026-07-07.md`；架构见 `deliverables/architecture/miniapp-architecture-2026-07-07.md`。
