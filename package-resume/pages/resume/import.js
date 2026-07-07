// package-resume/pages/resume/import.js — 导入旧简历（PDF / Word / 图片 / 文本）
const { call } = require('../../../utils/cloud');
const { ensureLogin, getOpenid } = require('../../../utils/auth');
const { getDraft, setDraft } = require('../../../utils/store');

Page({
  data: {
    photoAssetId: '',          // 从证件照流程带入的证件照
    mode: 'file',              // file | text
    text: '',                  // 粘贴文本
    parsing: false,            // 解析中
    progress: 0,               // 0-100 假进度
    supported: '支持 PDF / Word(.docx) / 图片(PNG·JPG) / 纯文本',
    fileTypes: [
      { ext: 'PDF', label: 'PDF 简历' },
      { ext: 'DOCX', label: 'Word 简历' },
      { ext: 'IMG', label: '图片简历' },
      { ext: 'TXT', label: '纯文本' },
    ],
  },

  onLoad(query) {
    const draft = getDraft() || {};
    const photoAssetId = query.photoAssetId || draft.photoAssetId || '';
    if (photoAssetId) setDraft({ photoAssetId });
    this.setData({ photoAssetId });
    ensureLogin().catch(() => {});
  },

  switchMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode });
  },

  onTextInput(e) {
    this.setData({ text: e.detail.value });
  },

  // 从微信聊天会话选择文件导入
  chooseFile() {
    const that = this;
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg', 'txt'],
      success: (res) => {
        const f = res.tempFiles[0];
        const fileType = that.guessType(f.path, f.name);
        that.uploadAndParse(f.path, fileType);
      },
      fail: () => {},
    });
  },

  // 粘贴文本：写入临时文件后上传（契约统一走 fileId）
  parseText() {
    const text = (this.data.text || '').trim();
    if (text.length < 10) {
      wx.showToast({ title: '请至少输入 10 个字', icon: 'none' });
      return;
    }
    const fs = wx.getFileSystemManager();
    const path = `${wx.env.USER_DATA_PATH}/resume_${Date.now()}.txt`;
    fs.writeFile({
      filePath: path,
      data: text,
      encoding: 'utf8',
      success: () => this.uploadAndParse(path, 'text'),
      fail: () => wx.showToast({ title: '文本写入失败', icon: 'none' }),
    });
  },

  guessType(path, name = '') {
    const lower = (name || path).toLowerCase();
    if (lower.endsWith('.pdf')) return 'pdf';
    if (lower.endsWith('.docx') || lower.endsWith('.doc')) return 'docx';
    if (lower.endsWith('.txt')) return 'text';
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image';
    return 'text';
  },

  uploadAndParse(path, fileType) {
    const that = this;
    that.setData({ parsing: true, progress: 8 });
    const timer = setInterval(() => {
      const p = that.data.progress;
      if (p < 92) that.setData({ progress: p + 12 });
    }, 240);

    wx.cloud.uploadFile({ cloudPath: `resume/import/${Date.now()}_${Math.random().toString(36).slice(2)}`, filePath: path })
      .then((up) => call('resumeImport', { openid: getOpenid(), fileId: up.fileID, fileType }, { silent: true }))
      .then((res) => {
        clearInterval(timer);
        that.setData({ parsing: false, progress: 100 });
        const resumeData = res && res.resumeData;
        if (!resumeData) throw new Error('empty');
        setDraft({ resumeData, photoAssetId: that.data.photoAssetId });
        wx.showToast({ title: '解析成功', icon: 'success' });
        setTimeout(() => wx.navigateTo({ url: '/package-resume/pages/resume/template' }), 600);
      })
      .catch((err) => {
        clearInterval(timer);
        that.setData({ parsing: false, progress: 0 });
        const msg = err && err.code === 1002 ? '今日免费额度已用完' : '解析失败，请重试或更换文件';
        wx.showModal({ title: '导入失败', content: msg, showCancel: false, confirmText: '知道了' });
      });
  },

  goPhoto() {
    wx.navigateTo({ url: '/package-photo/pages/photo/select?mode=resume' });
  },

  onShareAppMessage() {
    return { title: 'AI 一键解析旧简历', path: '/pages/index/index' };
  },
});
