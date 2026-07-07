// package-resume/pages/resume/template.js — 选择简历模板
const { call } = require('../../../utils/cloud');
const { getOpenid } = require('../../../utils/auth');
const { getDraft, setDraft } = require('../../../utils/store');

Page({
  data: {
    loading: false,
    selected: '',
    templates: [
      { id: 'simple', name: '简约', desc: '黑白留白，干净专业', tag: '通用', swatch: 'linear-gradient(135deg,#2C313A,#5B6470)' },
      { id: 'business', name: '商务', desc: '深色分割线，稳重可靠', tag: '职场', swatch: 'linear-gradient(135deg,#0F7E53,#16A36E)' },
      { id: 'creative', name: '创意', desc: '色块点缀，个性鲜明', tag: '设计', swatch: 'linear-gradient(135deg,#574BC2,#8B7BF2)' },
      { id: 'academic', name: '学术', desc: '严谨分段，论文风格', tag: '科研', swatch: 'linear-gradient(135deg,#2D8CFF,#6FB0FF)' },
      { id: 'fresh', name: '应届', desc: '清新版式，突出校园', tag: '校招', swatch: 'linear-gradient(135deg,#F5A623,#FFC861)' },
    ],
  },

  onLoad() {
    const draft = getDraft() || {};
    if (draft.templateId) this.setData({ selected: draft.templateId });
  },

  selectTemplate(e) {
    this.setData({ selected: e.currentTarget.dataset.id });
  },

  apply() {
    const id = this.data.selected;
    if (!id) {
      wx.showToast({ title: '请先选择模板', icon: 'none' });
      return;
    }
    const draft = getDraft() || {};
    const resumeData = draft.resumeData;
    if (!resumeData) {
      wx.showToast({ title: '简历数据缺失', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    call('resumeApply', { openid: getOpenid(), resumeData, templateId: id }, { silent: true })
      .then((res) => {
        const resume = (res && res.resume) || {};
        setDraft({ templateId: id, resumeId: resume._id || '', photoAssetId: draft.photoAssetId, resumeData });
        wx.navigateTo({ url: '/package-resume/pages/resume/editor' });
      })
      .catch((err) => {
        const msg = err && err.code === 1002 ? '今日免费额度已用完' : '套用模板失败，请重试';
        wx.showModal({ title: '操作失败', content: msg, showCancel: false, confirmText: '知道了' });
      })
      .finally(() => this.setData({ loading: false }));
  },

  onShareAppMessage() {
    return { title: '挑一份好看的简历模板', path: '/pages/index/index' };
  },
});
