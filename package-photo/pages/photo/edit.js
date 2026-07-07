// package-photo/pages/photo/edit.js — 证件照编辑流（旗舰页）
// 重图像处理（抠图/换底/美颜/排版/去水印）全部在云函数完成，客户端只负责预览与参数下发。
const { call } = require('../../../utils/cloud');
const { setDraft } = require('../../../utils/store');

const TABS = [
  { key: 'matting', label: '抠图' },
  { key: 'bg', label: '换底' },
  { key: 'crop', label: '裁剪' },
  { key: 'beauty', label: '美颜' },
  { key: 'watermark', label: '去水印' },
  { key: 'layout', label: '排版' },
];
const BG_COLORS = [
  { key: 'white', label: '白底', value: '#FFFFFF' },
  { key: 'blue', label: '蓝底', value: '#438EDB' },
  { key: 'red', label: '红底', value: '#D9001B' },
  { key: 'grad', label: '渐变蓝', value: 'grad' },
];
const SIZES = [
  { id: '1inch', label: '一寸', spec: '295×413' },
  { id: '2inch', label: '二寸', spec: '413×579' },
  { id: 'small', label: '小一寸', spec: '260×378' },
];

Page({
  data: {
    src: '',
    preview: '',
    tabs: TABS,
    activeTab: 'matting',
    bgColors: BG_COLORS,
    bg: 'white',
    sizes: SIZES,
    size: '1inch',
    beauty: { smooth: 50, whiten: 50 },
    processing: false,
  },

  onLoad(query) {
    const src = query.src ? decodeURIComponent(query.src) : '';
    this.setData({ src, preview: src, size: query.preset || '1inch' });
    if (src) this.runMatting(src);
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.key });
  },

  // 抠图：云函数返回去背 PNG（fileID）
  runMatting(src) {
    this.setData({ processing: true });
    call('photoMatting', { fileID: src }, { silent: true })
      .then((res) => { if (res && res.fileID) this.setData({ preview: res.fileID }); })
      .catch(() => {})
      .finally(() => this.setData({ processing: false }));
  },

  // 换底：调用 photoComposite(op='bg')
  chooseBg(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ bg: key, processing: true });
    call('photoComposite', { op: 'bg', fileID: this.data.preview, bg: key }, { silent: true })
      .then((res) => { if (res && res.fileID) this.setData({ preview: res.fileID }); })
      .catch(() => {})
      .finally(() => this.setData({ processing: false }));
  },

  onBeautyChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`beauty.${field}`]: e.detail.value });
  },

  applyBeauty() {
    this.setData({ processing: true });
    call('photoComposite', { op: 'beauty', fileID: this.data.preview, ...this.data.beauty }, { silent: true })
      .then((res) => { if (res && res.fileID) this.setData({ preview: res.fileID }); })
      .catch(() => {})
      .finally(() => this.setData({ processing: false }));
  },

  chooseSize(e) {
    this.setData({ size: e.currentTarget.dataset.id });
  },

  goDetect() {
    setDraft({ photoAssetId: this.data.preview });
    wx.navigateTo({ url: `/package-photo/pages/photo/detect?src=${encodeURIComponent(this.data.preview)}` });
  },

  goExport() {
    setDraft({ photoAssetId: this.data.preview, size: this.data.size });
    wx.navigateTo({ url: `/package-photo/pages/photo/export?src=${encodeURIComponent(this.data.preview)}&size=${this.data.size}` });
  },

  onShareAppMessage() {
    return { title: '免费证件照工具箱', path: '/pages/index/index' };
  },
});
