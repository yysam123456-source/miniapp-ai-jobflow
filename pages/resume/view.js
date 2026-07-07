// pages/resume/view.js — 简历预览 + 导出
const { call } = require('../../utils/cloud');
const { getOpenid } = require('../../utils/auth');
const { getDraft } = require('../../utils/store');

Page({
  data: {
    name: '',
    title: '',
    phone: '',
    email: '',
    locale: 'zh',                 // zh | en
    includePhoto: true,
    hasPhoto: false,
    exporting: false,
    summary: '',
    workCount: 0,
  },

  onLoad(query) {
    const draft = getDraft() || {};
    const rd = draft.resumeData || {};
    const basic = rd.basic || rd;
    const photoAssetId = query.photoAssetId || draft.photoAssetId || '';
    const works = rd.work || rd.workExperiences || rd.experiences || [];
    const name = basic.name || rd.name || '未命名简历';
    this.setData({
      name,
      avatar: (name || '未')[0],
      title: basic.title || rd.title || basic.headline || '',
      phone: basic.phone || rd.phone || '',
      email: basic.email || rd.email || '',
      summary: (basic.summary || rd.summary || '').slice(0, 60),
      hasPhoto: !!photoAssetId,
      includePhoto: !!photoAssetId,
      workCount: works.length,
    });
    this._draft = draft;
  },

  onLocale(e) { this.setData({ locale: e.currentTarget.dataset.id }); },

  togglePhoto() {
    if (!this.data.hasPhoto) {
      wx.navigateTo({ url: '/package-photo/pages/photo/select?mode=resume' });
      return;
    }
    this.setData({ includePhoto: !this.data.includePhoto });
  },

  _export(kind) {
    const draft = this._draft || {};
    if (!draft.resumeId && !draft.resumeData) {
      wx.showToast({ title: '没有可导出的简历', icon: 'none' });
      return;
    }
    this.setData({ exporting: true });
    const name = kind === 'word' ? 'resumeExportWord' : 'resumeExportPdf';
    const payload = { openid: getOpenid(), resumeId: draft.resumeId || '', resumeData: draft.resumeData || undefined };
    if (kind === 'pdf') {
      payload.locale = this.data.locale;
      payload.photoAssetId = this.data.includePhoto ? (draft.photoAssetId || '') : '';
    }
    call(name, payload, { silent: true })
      .then((res) => this.openFile(res && res.fileID))
      .catch((err) => {
        const msg = err && err.code === 1002 ? '今日免费额度已用完' : '导出失败，请重试';
        wx.showModal({ title: '导出失败', content: msg, showCancel: false, confirmText: '知道了' });
      })
      .finally(() => this.setData({ exporting: false }));
  },

  openFile(fileID) {
    if (!fileID) return;
    wx.cloud.downloadFile({ fileID })
      .then((d) => new Promise((resolve, reject) => {
        wx.openDocument({
          filePath: d.tempFilePath,
          showMenu: true,
          success: resolve,
          fail: reject,
        });
      }))
      .then(() => wx.showToast({ title: '已打开，可保存', icon: 'success' }))
      .catch(() => wx.showToast({ title: '打开失败，请重试', icon: 'none' }));
  },

  exportPdf() { this._export('pdf'); },
  exportWord() { this._export('word'); },

  onShareAppMessage() {
    return { title: '看看我的简历！', path: '/pages/index/index' };
  },
});
