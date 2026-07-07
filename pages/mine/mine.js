// pages/mine/mine.js — 我的 / 历史（tabBar 页）
const { getOpenid } = require('../../utils/auth');
const { getDraft, clearDraft } = require('../../utils/store');

Page({
  data: {
    openid: '',
    works: [
      { id: '1', type: 'photo', title: '一寸蓝底证件照', time: '今天 14:20' },
      { id: '2', type: 'resume', title: '产品经理简历 v2', time: '昨天 21:05' },
    ],
  },

  onShow() {
    this.setData({ openid: getOpenid() || '未登录' });
  },

  onClearDraft() {
    clearDraft();
    wx.showToast({ title: '已清空草稿', icon: 'none' });
  },

  goPhoto() {
    wx.navigateTo({ url: '/package-photo/pages/photo/select' });
  },

  goResume() {
    wx.navigateTo({ url: '/package-resume/pages/resume/import' });
  },

  // 微信分享（裂变）：好友 / 群
  onShareAppMessage() {
    return {
      title: '免费做证件照和简历，一站式求职神器',
      path: '/pages/index/index',
    };
  },

  // 朋友圈分享
  onShareTimeline() {
    return { title: 'AI 求职一站式 · 全免费证件照+简历', query: '' };
  },
});
