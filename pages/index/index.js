// pages/index/index.js — 首页（双入口 F5）
const { ensureLogin } = require('../../utils/auth');
const { setDraft } = require('../../utils/store');

Page({
  data: {
    // 顶部价值主张轮播
    banners: [
      { id: 'free', title: '全免费', desc: '证件照 + 简历，零成本一站式搞定' },
      { id: 'one', title: '一站式', desc: '拍张照就能出合规证件照 + 简历' },
    ],
    // 双入口卡片
    entries: [
      {
        key: 'photo',
        title: '证件照工具箱',
        desc: '抠图 · 换底色 · 去水印 · 修图 · 合规检测 · 规格导出',
        tag: '免费',
        color: 'brand',
      },
      {
        key: 'resume',
        title: 'AI 简历制作',
        desc: '导入旧简历 · 选模板 · AI 润色 · 导出 PDF',
        tag: '免费',
        color: 'ai',
      },
    ],
    // 快捷功能（已生成过证件照 → 直达简历前置，体现双入口续接）
    quickActions: [
      { key: 'ai_photo', label: 'AI 职业照', sub: '生活照变正装', color: 'ai' },
      { key: 'detect', label: '合规检测', sub: '6 项评分', color: 'brand' },
      { key: 'template', label: '简历模板', sub: '5 套精选', color: 'ai' },
      { key: 'polish', label: 'AI 润色', sub: 'STAR 改写', color: 'brand' },
    ],
  },

  onLoad() {
    // 静默登录（不弹窗），为后续云函数调用准备 openid
    ensureLogin().catch(() => {});
  },

  // 双入口：进入证件照独立流程
  onEntryPhoto() {
    wx.navigateTo({ url: '/package-photo/pages/photo/select' });
  },

  // 双入口：进入简历流程（也会经 import 页，可携带已生成的证件照）
  onEntryResume() {
    const draft = getApp().globalData.draft;
    const url = draft && draft.photoAssetId
      ? `/package-resume/pages/resume/import?photoAssetId=${draft.photoAssetId}`
      : '/package-resume/pages/resume/import';
    wx.navigateTo({ url });
  },

  // 快捷功能路由
  onQuick(e) {
    const key = e.currentTarget.dataset.key;
    const map = {
      ai_photo: '/package-photo/pages/photo/select?mode=ai',
      detect: '/package-photo/pages/photo/select?mode=detect',
      template: '/package-resume/pages/resume/template',
      polish: '/package-resume/pages/resume/polish',
    };
    if (map[key]) wx.navigateTo({ url: map[key] });
  },

  // 微信分享（裂变核心）：好友/群
  onShareAppMessage() {
    return {
      title: '免费做证件照和简历，一站式求职神器',
      path: '/pages/index/index',
      imageUrl: '', // 可接入云函数生成的分享卡片图
    };
  },

  // 朋友圈分享
  onShareTimeline() {
    return {
      title: 'AI 求职一站式 · 全免费证件照+简历',
      query: '',
    };
  },
});
