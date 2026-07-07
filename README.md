# miniapp-ai-jobflow

> 微信小程序「AI 求职一站式」——证件照编辑 + 简历制作 + AI 润色，全免费架构。

## 产品概述

面向国内微信用户的一站式 AI 求职工具小程序。把 AI 职业照生成、证件照编辑（抠图/去背景/去水印/修图/合规检测/规格导出）、简历制作与 AI 润色、PDF/Word 导出串联成一条向导式流水线。

## 核心差异化

- **全免费**：基于微信云开发 CloudBase + 微信 AI 小程序成长计划（10 亿混元 token + 10 万张生图，6 个月免费），零服务器成本
- **一站式串联**：市场上唯一将证件照与简历串联为端到端工作流的产品
- **证件照全工具链**：抠图/去背景/去水印/修图/磨皮/合规检测/6 规格裁切/回执排版，全部基于免费开源模型
- **代码复用**：简历核心 80% 逻辑复用现有 craftisle-resume，AI prompts/sanitize 零改

## 技术栈

| 层 | 选型 |
|----|------|
| 前端 | 微信小程序原生 |
| 后端 | 微信云开发 CloudBase（个人版资源点套餐） |
| 文本 AI | 云开发 AI `wx.cloud.extend.AI` + 混元 Hy3（10 亿 token 免费） |
| 生图 AI | 云开发 AI + 混元 Hy Image 3.0（10 万张生图免费） |
| 图像编辑 | 开源模型云函数自托管（rembg/LaMa/face-api + Sharp） |
| 存储/DB | 云开发存储 + NoSQL |
| 变现 | 微信流量主 |

## 文档

| 文件 | 说明 |
|------|------|
| [`prd-miniapp-ai-2026-07-07.md`](deliverables/product-strategy/prd-miniapp-ai-2026-07-07.md) | 开发规格书 PRD v1.0（24 项需求、4 周里程碑） |
| [`decision-brief-miniapp-ai-v4-2026-07-07.md`](deliverables/product-strategy/decision-brief-miniapp-ai-v4-2026-07-07.md) | 决策拍板 v4（全免费锚定版，全部锁定） |
| [`product-blueprint-miniapp-ai-detailed-2026-07-07.md`](deliverables/product-strategy/product-blueprint-miniapp-ai-detailed-2026-07-07.md) | 深度蓝图（代码级落地） |

## 快速开始

1. 申请免费额度：微信公众平台 → 行业能力 → 小程序成长计划
2. 阅读 PRD：`deliverables/product-strategy/prd-miniapp-ai-2026-07-07.md`
3. 建微信云开发环境（个人版资源点套餐）
4. 跑通 `wx.cloud.extend.AI` 调混元 Hy3 与 Hy Image 3.0
5. 移植 craftisle-resume 逻辑内核进云函数

## 产品负责人

- 方向明（Fang）· 产品舵手
- 腾讯产品经理 · 出海工具站与 AI 游戏方向
