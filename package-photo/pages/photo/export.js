// package-photo/pages/photo/export.js — 导出 / 保存到相册
const { call } = require('../../../utils/cloud');

Page({
  data: {
    src: '',
    preview: '',
    size: '1inch',
    bg: 'white',
    // 5 色底色（对齐 PRD / 契约 BG_MAP：white/blue/red/lightblue/lightgray）
    bgs: [
      { key: 'white', label: '白底' },
      { key: 'blue', label: '蓝底' },
      { key: 'red', label: '红底' },
      { key: 'lightblue', label: '浅蓝' },
      { key: 'lightgray', label: '浅灰' },
    ],
    // 7 规格（对齐 PRD F4a / SIZE_MAP：一寸/二寸/小一寸/护照/美签/英签/申根）
    sizes: [
      { id: '1inch', label: '一寸 295×413' },
      { id: '2inch', label: '二寸 413×579' },
      { id: 'small', label: '小一寸 260×378' },
      { id: 'passport', label: '护照 354×472' },
      { id: 'us_visa', label: '美签 600×600' },
      { id: 'uk_visa', label: '英签 350×450' },
      { id: 'schengen', label: '申根 354×472' },
    ],
    exporting: false,
  },

  onLoad(query) {
    const src = query.src ? decodeURIComponent(query.src) : '';
    this.setData({ src, preview: src, size: query.size || '1inch' });
  },

  chooseBg(e) { this.setData({ bg: e.currentTarget.dataset.key }); },
  chooseSize(e) { this.setData({ size: e.currentTarget.dataset.id }); },

  save() {
    this.setData({ exporting: true });
    call('photoExport', { fileID: this.data.src, size: this.data.size, bg: this.data.bg }, { silent: true })
      .then((res) => this.saveToAlbum(res && res.fileID))
      .catch(() => {})
      .finally(() => this.setData({ exporting: false }));
  },

  // 云函数返回导出后的 fileID → 下载 → 写相册
  saveToAlbum(fileID) {
    if (!fileID) return;
    wx.cloud.downloadFile({ fileID })
      .then((d) => new Promise((resolve, reject) => {
        wx.saveImageToPhotosAlbum({
          filePath: d.tempFilePath,
          success: resolve,
          fail: reject,
        });
      }))
      .then(() => wx.showToast({ title: '已保存到相册', icon: 'success' }))
      .catch(() => wx.showToast({ title: '保存失败，请授权相册', icon: 'none' }));
  },

  onShareAppMessage() {
    return { title: '免费证件照导出', path: '/pages/index/index' };
  },
});
