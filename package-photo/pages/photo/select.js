// package-photo/pages/photo/select.js — 选择来源 + 规格 + AI 职业照生成入口
const { call } = require('../../../utils/cloud');

function uploadTemp(tempPath) {
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath: `photo/src/${Date.now()}_${Math.random().toString(36).slice(2)}.png`,
      filePath: tempPath,
      success: (up) => resolve(up.fileID),
      fail: (e) => reject(e),
    });
  });
}

Page({
  data: {
    mode: 'normal', // normal | ai | detect
    sources: [
      { key: 'camera', label: '拍照', sub: '现场拍摄' },
      { key: 'album', label: '从相册选择', sub: '已有照片' },
    ],
    presets: [
      { id: '1inch', label: '一寸', spec: '295×413' },
      { id: '2inch', label: '二寸', spec: '413×579' },
      { id: 'small', label: '小一寸', spec: '260×378' },
    ],
    selectedPreset: '1inch',
    styles: [
      { key: 'formal', label: '正式' },
      { key: 'casual', label: '休闲' },
      { key: 'creative', label: '创意' },
    ],
    style: 'formal',
    generating: false,
  },

  onLoad(query) {
    if (query.mode) this.setData({ mode: query.mode });
  },

  selectPreset(e) {
    this.setData({ selectedPreset: e.currentTarget.dataset.id });
  },
  selectMode(e) {
    this.setData({ mode: e.currentTarget.dataset.key });
  },
  selectStyle(e) {
    this.setData({ style: e.currentTarget.dataset.key });
  },

  chooseSource(e) {
    const key = e.currentTarget.dataset.key;
    const that = this;
    const cb = (res) => {
      const tempPath = res.tempFiles ? res.tempFiles[0].tempFilePath : res.tempFilePath;
      if (that.data.mode === 'ai') {
        that.runAiGenerate(tempPath);
      } else {
        const url = `/package-photo/pages/photo/edit?src=${encodeURIComponent(tempPath)}&mode=${that.data.mode}&preset=${that.data.selectedPreset}`;
        wx.navigateTo({ url });
      }
    };
    if (key === 'camera') {
      wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['camera'], success: cb });
    } else {
      wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album'], success: cb });
    }
  },

  // F2：AI 职业照生成（上传→生 prompt→生图→进编辑）
  async runAiGenerate(tempPath) {
    this.setData({ generating: true });
    wx.showLoading({ title: 'AI 生成中…', mask: true });
    try {
      const fileID = await uploadTemp(tempPath);
      const p = await call('photoGenerate', { action: 'prompt', photoFileId: fileID, style: this.data.style });
      const prompt = (p && p.prompt) || '专业职业照，干净背景，自然光线';
      const g = await call('photoGenerate', { action: 'generate', prompt, confirm: true }, { silent: true });
      if (g && g.generatedFileId) {
        wx.hideLoading();
        wx.navigateTo({
          url: `/package-photo/pages/photo/edit?src=${encodeURIComponent(g.generatedFileId)}&mode=normal&preset=${this.data.selectedPreset}`,
        });
        return;
      }
      throw new Error('no generated file');
    } catch (e) {
      wx.hideLoading();
      wx.showModal({
        title: '生成失败',
        content: 'AI 职业照生成未成功。请确认已在 config.local.js 配置混元 SecretId/Key，或改用「普通」模式上传照片。',
        showCancel: false,
        confirmText: '知道了',
      });
    }
    this.setData({ generating: false });
  },

  onShareAppMessage() {
    return { title: '免费证件照工具箱', path: '/pages/index/index' };
  },
});
