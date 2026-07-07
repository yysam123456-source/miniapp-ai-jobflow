// pages/mine/mine.js — 我的 / 历史（tabBar 页）
const { getOpenid } = require('../../utils/auth');
const { getDraft, clearDraft } = require('../../utils/store');
const { call } = require('../../utils/cloud');

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const p = (n) => (n < 10 ? '0' + n : '' + n);
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

Page({
  data: {
    openid: '',
    loading: false,
    works: [],
  },

  onShow() {
    this.setData({ openid: getOpenid() || '未登录' });
    this.loadWorks();
  },

  loadWorks() {
    const openid = getOpenid();
    if (!openid) return;
    this.setData({ loading: true });
    call('userWorks', { openid }, { silent: true })
      .then((res) => {
        const list = [];
        (res.resumes || []).forEach((r) => list.push({ id: r._id, type: 'resume', title: r.name || '简历', time: fmtTime(r.updatedAt) }));
        (res.photos || []).forEach((p) => list.push({ id: p._id, type: 'photo', title: '证件照', time: fmtTime(p.createdAt) }));
        this.setData({ works: list });
      })
      .catch(() => {})
      .finally(() => this.setData({ loading: false }));
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
