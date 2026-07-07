# AI 求职一站式 · 小程序架构设计文档

> 版本：v1（脚手架落地版） · 日期：2026-07-07
> 目标：微信小程序原生开发，全免费技术栈快速上线获客。
> 设计语言统一参见 `deliverables/ui-design/`；产品决策见 `deliverables/product-strategy/decision-brief-miniapp-ai-v4-2026-07-07.md`。

---

## 1. 技术栈与免费策略

| 层 | 选型 | 成本 | 说明 |
|----|------|------|------|
| 前端 | 微信小程序原生（WXML/WXSS/JS/JSON） | 免费 | 双线程架构，无 DOM，组件样式隔离 |
| 后端 | 微信云开发 CloudBase | 免费额度内 | `wx.cloud.callFunction` / `wx.cloud.uploadFile` / `wx.cloud.downloadFile` |
| AI | 混元（Hy3） | 免费额度内 | 简历解析 / 润色 / 证件照智能处理，决策拍板见 v4 |
| 存储 | 云存储 | 免费额度内 | 证件照、导入简历、导出 PDF/Word 的 fileID |
| 登录 | 云开发 OPENID | 免费 | `wx.login` → `userLogin` 云函数换 openid，无需自建 token |

**零自建**：无服务器、无域名、无 ICP 备案、无数据库实例（状态走云存储 fileID + 云函数内持久化）。

---

## 2. 目录结构

```
miniapp-ai-jobflow/
├── app.js / app.json / app.wxss      # 全局初始化、分包声明、令牌与组件类引入
├── project.config.json / sitemap.json
├── styles/
│   ├── tokens.wxss                   # Canonical 设计令牌（唯一真相源）
│   └── components.wxss               # 全局组件类（btn/input/chip/card/sheet/entry-card…）
├── utils/
│   ├── cloud.js                      # 云函数统一调用层（ApiResponse 解包 + 错误/额度兜底）
│   ├── auth.js                       # 静默登录（openid 缓存）
│   └── store.js                      # 轻量跨页草稿（app.globalData.draft）
├── pages/                            # 主包（tabBar 页 + 简历预览）
│   ├── index/                        # 首页：双入口 + 快捷操作 + 分享裂变
│   ├── mine/                         # 我的：资料 / 作品 / 草稿 / 分享
│   └── resume/view                   # 简历预览 + PDF/Word 导出
├── package-photo/                    # 分包：证件照工具链
│   └── pages/photo/{select,edit,detect,export}
└── package-resume/                   # 分包：简历工作流
    └── pages/resume/{import,template,editor,polish}
```

---

## 3. 分包与路由

`app.json` 采用主包（tabBar）+ 两个业务分包，主包仅放高频入口与预览，降低首屏体积。

- **主包**：`pages/index`、`pages/mine`（tabBar）、`pages/resume/view`（预览/导出，跨流程终点）
- **package-photo**：`select → edit → detect → export`
- **package-resume**：`import → template → editor → polish →（跳转主包 view）`
- **preloadRule**：首页预载 photo 分包；photo/select 预载 resume 分包，实现"双入口续接"无缝体验。

路径约定：分包内页面引用令牌用 `../../../styles/tokens.wxss`；主包用 `../../styles/...`。

---

## 4. 设计令牌体系（Design Tokens）

令牌定义在 `styles/tokens.wxss`，挂在 `page` 作用域，全小程序 `var(--xxx)` 复用。命名口径（**唯一真相源，禁止别名**）：

- 颜色：`--c-brand`(绿) / `--c-accent`(紫) / `--c-ink` / `--c-ink-2/3` / `--c-page` / `--c-card` / `--c-surface(-2)` / `--c-border` / `--c-divider` / 语义色 `--c-success/warning/danger/info` / 渐变 `--grad-*`
- 字号：`--fs-display/h1/h2/body/caption/data/mini`
- 间距：`--sp-1..16`（4px 基准）、`--page-px`、`--gap`、`--section-gap`
- 圆角：`--r-sm/md/lg/xl/pill`；阴影：`--sh-1/2/3/brand`
- 尺寸：`--btn-h`、`--input-h`、`--tabbar-h`、`--touch-min`(44px)
- 动效：`--dur-*`、`--ease-out/in-out`；层级：`--z-*`

组件类在 `styles/components.wxss`，与 HTML 交付物 1:1 对应（`btn/input/chip/seg/card/progress/toggle/mask/sheet/tabbar/nav-bar/toast/skeleton/empty/ring/tool-tab/entry-card`）。无障碍：`prefers-reduced-motion` 降级、44px 触控目标、WCAG AA 对比度。

---

## 5. 云函数契约映射

前端调用统一走 `utils/cloud.js` 的 `call(name, data)`，自动解包 `ApiResponse{code,data}` 并兜底（额度 1002 → 弹窗引导；其他 → toast；网络失败 → 提示）。

### 简历工作流
| 能力 | 云函数 | 关键入参 | 返回 | 前端页面 |
|------|--------|----------|------|----------|
| 导入解析 | `resumeImport` | openid, fileId, fileType(pdf/docx/image/text) | resumeData, confidence, warnings | `import` |
| 套用模板 | `resumeApply` | openid, resumeData, templateId | resume{_id,templateId,elements}, patches | `template` |
| AI 润色 | `resumeOptimize` | openid, resumeId, target?, scope | optimized, patches, suggestions | `polish` |
| 导出 PDF | `resumeExportPdf` | openid, resumeId, photoAssetId?, locale | fileID | `view` |
| 导出 Word | `resumeExportWord` | openid, resumeId | fileID | `view` |

模板 ID 5 套：`simple / business / creative / academic / fresh`。

### 证件照工具链（同仓库，`package-photo`）
`photoMatting`(抠图) / `photoComposite`(换底·美颜) / `photoDetect`(合规检测) / `photoExport`(导出) — 入参见 `deliverables/product-strategy/api-contracts-miniapp-ai-2026-07-07.md`。

---

## 6. 工作流状态机（双入口续接）

无 Vuex，采用 `utils/store.js` 操作 `app.globalData.draft`：

```
首页入口A(证件照) ──photoAssetId──┐
                                  ├─→ draft{photoAssetId} ──→ import 页自动带证件照
首页入口B(简历)   ────────────────┘
import → template → editor → polish → view（resumeId / resumeData 全程在 draft 传递）
```

- 大对象（resumeData、elements）走 `draft` 内存传递，避免 URL query 体积受限。
- `photoAssetId` 在证件照 export 时 `setDraft`，简历流程任意页可读取并嵌入 PDF。
- 用户可在「我的」`clearDraft()` 重置工作流。

---

## 7. 获客机制（快速起量）

1. **分享裂变**：各页 `onShareAppMessage` + `onShareTimeline`，分享卡片带首页 path，回流新用户。
2. **双入口续接**：证件照↔简历相互导流，单用户贡献两次使用，提高留存与分享基数。
3. **额度激励**：免费额度耗尽（code 1002）引导"分享给好友获取额外次数"，把分享做成增长钩子（流量主反哺成本）。
4. **低门槛首屏**：首页即双卡片入口，无需注册即可使用核心功能。

---

## 8. 上线前置清单（必做）

| 项 | 位置 | 说明 |
|----|------|------|
| 云环境 ID | `app.js` → `globalData.env` | 替换 `CLOUDBASE_ENV_ID_PLACEHOLDER` |
| 云函数部署 | 后端 | 部署 `userLogin/resumeImport/resumeApply/resumeOptimize/resumeExportPdf/resumeExportWord/photo*` 并配 Hy3 Key |
| 流量主广告 | `utils/cloud.js` 1002 分支 | 接 `wx.createRewardedVideoAd` 真实广告位（当前为弹窗占位） |
| 隐私协议 | 公众平台 | `getUserProfile` 等需配置隐私声明 |
| tabBar 图标 | `app.json` | 当前无 iconPath，发布前补 81×81 图标（不影响真机预览调试） |

---

## 9. 已知边界与后续 TODO

- 简历编辑器为"元素级表单"简化实现，未接 `resumeApply` 返回的 `elements` 可视化拖拽（P2）。
- `resumeExportPdf/Word` 依赖 Node 端 `@react-pdf/renderer` / `docx`，需在云函数侧实现（前端仅发请求 + 下载）。
- 英文模板（`locale=en`）需补充中英双语字段映射。
- 暗色主题令牌已预留（`.page-dark`），按 P2 排期接入。
- 真机预览需微信开发者工具导入本目录，填入真实云环境 ID 后 `compile`。
