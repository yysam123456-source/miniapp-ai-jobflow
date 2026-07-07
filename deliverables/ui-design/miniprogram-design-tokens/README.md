# miniprogram-design-tokens · 集成指南

AI 求职一站式（微信小程序原生）设计令牌与基础组件类，由 UI 设计方案 v2.1 翻译而来。
配套可视化交付物：`../ui-design-proposal.html`（9 屏高保真 Mockup + 交互/动效规范）。

## 文件清单
| 文件 | 作用 |
|------|------|
| `variables.wxss` | 设计令牌（颜色/字号/间距/圆角/阴影/尺寸/动效/层级），以 CSS 自定义属性定义在 `page` 上 |
| `components.wxss` | 基础组件类（按钮/输入/Chip/分段/卡片/进度/开关/Sheet/TabBar/Toast/骨架/空态/评分环/工具Tab） |
| `README.md` | 本文件 |

## 三步接入
**1. 在 `app.wxss` 顶部引入**（顺序：令牌 → 组件）
```css
@import "styles/variables.wxss";
@import "styles/components.wxss";
```
（路径按你实际存放位置调整，建议放在 `miniprogram/styles/`）

**2. 在 `app.json` 关闭原生导航栏**（用自定义导航以套用设计系统的状态栏/导航栏）
```json
{
  "window": {
    "navigationStyle": "custom"
  }
}
```

**3. 页面 WXML 直接用变量与组件类**
```xml
<view class="btn btn-primary">确认换底</view>
<view class="card card-hover">...</view>
<view class="tool-tab on">去背景</view>
```
```css
/* 页内样式直接用令牌 */
.title { color: var(--c-ink); font-size: var(--fs-h1); }
.hero { background: var(--grad-hero); padding: var(--sp-5) var(--page-px); }
```

## 关键约定
- **尺寸单位**：令牌已按 `1px(CSS) ≈ 2rpx` 换算（750rpx = 375pt 逻辑宽度）。字号 12/14/16/18/20/26px → 24/28/32/36/40/52rpx；间距 4/8/12/16/20/24px → 8/16/24/32/40/48rpx。
- **颜色**：保持 hex 原值，未做 rpx 处理。
- **按钮去边框**：小程序 `<button>` 默认有边框，组件类已用 `::after { border: none }` 去除。
- **动效降级**：`components.wxss` 末尾已加 `prefers-reduced-motion` 媒体查询，关闭过渡/动画以适配无障碍。
- **暗色主题**：`variables.wxss` 末尾 `.page-dark` 块为 P2 预留，给根容器加该类即切换（默认注释未启用）。

## 令牌速查（节选）
```
--c-brand:#16A36E  --c-accent:#6C5CE7
--fs-h1:36rpx  --fs-body:28rpx  --fs-caption:24rpx
--sp-4:32rpx(页面padding)  --sp-3:24rpx(组件gap)
--r-md:24rpx(按钮/卡片)  --r-pill:999rpx(Chip)
--btn-h:96rpx  --touch-min:88rpx(≥44px 触控)
--dur-sheet:280ms  --ease-out:cubic-bezier(.22,.61,.36,1)
```

## 与 HTML 交付物的映射
HTML 中类名（`.btn-primary` / `.card` / `.tool-tab` / `.sheet` 等）与本 `components.wxss` 完全一致，
CSS 变量名一一对应（HTML 用 `--brand` 等短名，`variables.wxss` 统一加 `--c-` 前缀以便小程序命名空间）。
开发时对照 `ui-design-proposal.html` 的 9 屏 Mockup 逐页实现即可。
