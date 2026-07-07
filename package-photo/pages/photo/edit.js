// package-photo/pages/photo/edit.js — 证件照编辑流（旗舰页）
// 重图像处理（抠图/换底/美颜/排版/去水印）走云函数；裁剪/水印在端内 canvas 完成，零云消耗。
const { call } = require('../../../utils/cloud');
const { setDraft } = require('../../../utils/store');

const TABS = [
  { key: 'matting', label: '抠图' },
  { key: 'bg', label: '换底' },
  { key: 'crop', label: '裁剪' },
  { key: 'beauty', label: '美颜' },
  { key: 'watermark', label: '水印' },
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
const SIZE_PX = { '1inch': [295, 413], '2inch': [413, 579], small: [260, 378] };
const LAYOUTS = [
  { key: 'standard', label: '标准' },
  { key: 'bordered', label: '描边' },
  { key: 'full', label: '满版' },
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
    cropSize: '1inch',
    beauty: { smooth: 50, whiten: 50 },
    processing: false,
    watermarkText: '',
    layouts: LAYOUTS,
    layout: 'standard',
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

  // —— 端内 canvas 工具（裁剪 / 水印）——
  getCanvas() {
    return new Promise((resolve, reject) => {
      wx.createSelectorQuery()
        .select('#workCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0] || !res[0].node) return reject(new Error('canvas not found'));
          const canvas = res[0].node;
          resolve({ canvas, ctx: canvas.getContext('2d') });
        });
    });
  },

  async processCanvas(draw) {
    const { canvas, ctx } = await this.getCanvas();
    const img = canvas.createImage();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = this.data.preview;
    });
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    draw(canvas, ctx, img);
    return new Promise((resolve) => {
      wx.canvasToTempFilePath({
        canvas,
        success: (r) => {
          wx.cloud.uploadFile({
            cloudPath: `photo/edit/${Date.now()}_${Math.random().toString(36).slice(2)}.png`,
            filePath: r.tempFilePath,
            success: (up) => resolve(up.fileID),
            fail: () => resolve(null),
          });
        },
        fail: () => resolve(null),
      });
    });
  },

  async onCrop() {
    const [tw, th] = SIZE_PX[this.data.cropSize] || SIZE_PX['1inch'];
    this.setData({ processing: true });
    try {
      const fileID = await this.processCanvas((canvas, ctx, img) => {
        const targetRatio = tw / th;
        const cur = img.width / img.height;
        let sx, sy, sw, sh;
        if (cur > targetRatio) {
          sh = img.height; sw = sh * targetRatio; sx = (img.width - sw) / 2; sy = 0;
        } else {
          sw = img.width; sh = sw / targetRatio; sx = 0; sy = (img.height - sh) / 2;
        }
        canvas.width = Math.round(sw);
        canvas.height = Math.round(sh);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, Math.round(sw), Math.round(sh));
      });
      if (fileID) this.setData({ preview: fileID, size: this.data.cropSize });
    } catch (e) {}
    this.setData({ processing: false });
  },

  onWatermarkInput(e) {
    this.setData({ watermarkText: e.detail.value });
  },

  async onWatermark() {
    const text = (this.data.watermarkText || '').trim();
    if (!text) {
      wx.showToast({ title: '请输入水印文字', icon: 'none' });
      return;
    }
    this.setData({ processing: true });
    try {
      const fileID = await this.processCanvas((canvas, ctx) => {
        ctx.font = '28px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 2;
        ctx.textBaseline = 'bottom';
        const x = 20;
        const y = canvas.height - 20;
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
      });
      if (fileID) this.setData({ preview: fileID });
    } catch (e) {}
    this.setData({ processing: false });
  },

  chooseCropSize(e) { this.setData({ cropSize: e.currentTarget.dataset.id }); },
  chooseLayout(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ layout: key });
    setDraft({ layout: key });
  },

  chooseSize(e) {
    this.setData({ size: e.currentTarget.dataset.id });
  },

  goDetect() {
    setDraft({ photoAssetId: this.data.preview, layout: this.data.layout });
    wx.navigateTo({ url: `/package-photo/pages/photo/detect?src=${encodeURIComponent(this.data.preview)}` });
  },

  goExport() {
    setDraft({ photoAssetId: this.data.preview, size: this.data.size, layout: this.data.layout });
    wx.navigateTo({ url: `/package-photo/pages/photo/export?src=${encodeURIComponent(this.data.preview)}&size=${this.data.size}` });
  },

  onShareAppMessage() {
    return { title: '免费证件照工具箱', path: '/pages/index/index' };
  },
});
