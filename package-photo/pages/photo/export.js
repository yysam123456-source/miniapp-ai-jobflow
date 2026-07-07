// package-photo/pages/photo/export.js — 导出 / 保存到相册
const { call } = require('../../../utils/cloud');

Page({
  data: {
    src: '',
    preview: '',
    size: '1inch',
    bg: 'white',
    bgs: [
      { key: 'white', label: '白底' },
      { key: 'blue', label: '蓝底' },
      { key: 'red', label: '红底' },
    ],
    sizes: [
      { id: '1inch', label: '一寸 295×413' },
      { id: '2inch', label: '二寸 413×579' },
      { id: 'small', label: '小一寸 260×378' },
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
