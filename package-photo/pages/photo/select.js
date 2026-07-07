// package-photo/pages/photo/select.js — 选择来源 + 规格
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
  },

  onLoad(query) {
    if (query.mode) this.setData({ mode: query.mode });
  },

  chooseSource(e) {
    const key = e.currentTarget.dataset.key;
    const that = this;
    const cb = (res) => {
      const tempPath = res.tempFiles ? res.tempFiles[0].tempFilePath : res.tempFilePath;
      const url = `/package-photo/pages/photo/edit?src=${encodeURIComponent(tempPath)}&mode=${that.data.mode}&preset=${that.data.selectedPreset}`;
      wx.navigateTo({ url });
    };
    if (key === 'camera') {
      wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['camera'], success: cb });
    } else {
      wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album'], success: cb });
    }
  },

  selectPreset(e) {
    this.setData({ selectedPreset: e.currentTarget.dataset.id });
  },

  onShareAppMessage() {
    return { title: '免费证件照工具箱', path: '/pages/index/index' };
  },
});
