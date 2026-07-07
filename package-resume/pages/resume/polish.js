// package-resume/pages/resume/polish.js — AI 润色对比
const { call } = require('../../../utils/cloud');
const { getOpenid } = require('../../../utils/auth');
const { getDraft, setDraft } = require('../../../utils/store');

Page({
  data: {
    scope: 'all',             // all | work | education | skills
    target: '',               // 目标 JD（可选）
    running: false,
    hasResult: false,
    suggestions: [],          // [{ elementId, before, after, reason, open }]
    optimized: null,          // 优化后的完整 ResumeData
    scopes: [
      { id: 'all', label: '全部' },
      { id: 'work', label: '工作' },
      { id: 'education', label: '教育' },
      { id: 'skills', label: '技能' },
    ],
  },

  onLoad() {
    const draft = getDraft() || {};
    if (!draft.resumeId && !draft.resumeData) {
      wx.showToast({ title: '请先完成编辑', icon: 'none' });
    }
  },

  onScope(e) { this.setData({ scope: e.currentTarget.dataset.id }); },
  onTarget(e) { this.setData({ target: e.detail.value }); },

  toggleItem(e) {
    const i = e.currentTarget.dataset.index;
    const key = `suggestions[${i}].open`;
    this.setData({ [key]: !this.data.suggestions[i].open });
  },

  run() {
    const draft = getDraft() || {};
    if (!draft.resumeId && !draft.resumeData) {
      wx.showToast({ title: '请先完成编辑', icon: 'none' });
      return;
    }
    this.setData({ running: true });
    call('resumeOptimize', {
      openid: getOpenid(),
      resumeId: draft.resumeId || '',
      resumeData: draft.resumeData || undefined,
      target: this.data.target || undefined,
      scope: this.data.scope,
    }, { silent: true })
      .then((res) => {
        const raw = (res && res.suggestions) || {};
        const list = Object.keys(raw).map((k, i) => ({
          elementId: k,
          before: raw[k].before || '',
          after: raw[k].after || '',
          reason: raw[k].reason || '',
          open: i === 0, // 默认展开第一条
        }));
        setDraft({ resumeData: (res && res.optimized) || draft.resumeData });
        this.setData({ hasResult: true, suggestions: list, optimized: (res && res.optimized) || null });
      })
      .catch((err) => {
        const msg = err && err.code === 1002 ? '今日免费额度已用完' : '润色失败，请重试';
        wx.showModal({ title: '操作失败', content: msg, showCancel: false, confirmText: '知道了' });
      })
      .finally(() => this.setData({ running: false }));
  },

  export() {
    const draft = getDraft() || {};
    if (this.data.optimized) setDraft({ resumeData: this.data.optimized });
    const url = `/pages/resume/view?photoAssetId=${encodeURIComponent(draft.photoAssetId || '')}`;
    wx.navigateTo({ url });
  },

  onShareAppMessage() {
    return { title: 'AI 帮我把简历写得更专业', path: '/pages/index/index' };
  },
});
