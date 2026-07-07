// package-photo/pages/photo/detect.js — 合规检测报告
const { call } = require('../../../utils/cloud');

Page({
  data: {
    src: '',
    loading: true,
    score: 0,
    items: [],
  },

  onLoad(query) {
    const src = query.src ? decodeURIComponent(query.src) : '';
    this.setData({ src });
    this.runDetect(src);
  },

  runDetect(src) {
    this.setData({ loading: true });
    call('photoDetect', { fileID: src }, { silent: true })
      .then((res) => {
        if (res) this.setData({ score: res.score || 0, items: res.items || [] });
      })
      .catch(() => {})
      .finally(() => this.setData({ loading: false }));
  },

  reEdit() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    return { title: '免费证件照合规检测', path: '/pages/index/index' };
  },
});
