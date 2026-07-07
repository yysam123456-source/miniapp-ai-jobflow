// package-photo/pages/photo/edit.js — 证件照编辑流（旗舰页）
// 重图像处理（抠图/换底/美颜/去水印/导出）走云函数；裁剪在端内 canvas 完成，零云消耗。
const { call } = require('../../../utils/cloud');
const { setDraft } = require('../../../utils/store');

const TABS = [
  { key: 'matting', label: '抠图' },
  { key: 'bg', label: '换底' },
  { key: 'crop', label: '裁剪' },
  { key: 'beauty', label: '美颜' },
  { key: 'adjust', label: '修图' },
  { key: 'inpaint', label: '去水印' },
  { key: 'layout', label: '排版' },
];
// 5 色底色（对齐 PRD/契约：white/blue/red/lightblue/lightgray）
const BG_COLORS = [
  { key: 'white', label: '白底', value: '#FFFFFF' },
  { key: 'blue', label: '蓝底', value: '#438EDB' },
  { key: 'red', label: '红底', value: '#D9001B' },
  { key: 'lightblue', label: '浅蓝', value: '#C7E2FF' },
  { key: 'lightgray', label: '浅灰', value: '#EDEDED' },
];
// 6 规格（对齐 PRD F4a：一寸/二寸/护照/美签/英签/申根 + 小一寸）
const SIZES = [
  { id: '1inch', label: '一寸', spec: '295×413' },
  { id: '2inch', label: '二寸', spec: '413×579' },
  { id: 'small', label: '小一寸', spec: '260×378' },
  { id: 'passport', label: '护照', spec: '354×472' },
  { id: 'us_visa', label: '美签', spec: '600×600' },
  { id: 'uk_visa', label: '英签', spec: '350×450' },
  { id: 'schengen', label: '申根', spec: '354×472' },
];
const SIZE_PX = {
  '1inch': [295, 413], '2inch': [413, 579], small: [260, 378],
  passport: [354, 472], us_visa: [600, 600], uk_visa: [350, 450], schengen: [354, 472],
};
const LAYOUTS = [
  { key: 'standard', label: '标准' },
  { key: 'bordered', label: '描边' },
  { key: 'full', label: '满版' },
];

// 确保传入路径是云存储 fileID（temp 路径先上传）
function ensureCloudFile(path) {
  if (!path) return Promise.resolve(null);
  if (path.indexOf('cloud://') === 0) return Promise.resolve(path);
  return new Promise((resolve) => {
    wx.cloud.uploadFile({
      cloudPath: `photo/edit/${Date.now()}_${Math.random().toString(36).slice(2)}.png`,
      filePath: path,
      success: (up) => resolve(up.fileID),
      fail: () => resolve(null),
    });
  });
}

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
    adjust: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, sharpen: 0 },
    processing: false,
    masking: false,
    layouts: LAYOUTS,
    layout: 'standard',
  },

  onLoad(query) {
    const src = query.src ? decodeURIComponent(query.src) : '';
    this.setData({ src, preview: src, size: query.preset || '1inch' });
    if (src) this.runMatting(src);
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ activeTab: key, masking: key === 'inpaint' });
  },

  // 抠图：云函数返回去背 PNG（fileID）
  runMatting(src) {
    this.setData({ processing: true });
    call('photoMatting', { fileID: src }, { silent: true })
      .then((res) => { if (res && res.fileID) this.setData({ preview: res.fileID }); this.saveWorkflow('edit_photo'); })
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

  onAdjustChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`adjust.${field}`]: e.detail.value });
  },

  applyAdjust() {
    this.setData({ processing: true });
    call('photoComposite', { op: 'adjust', fileID: this.data.preview, ...this.data.adjust }, { silent: true })
      .then((res) => { if (res && res.fileID) this.setData({ preview: res.fileID }); })
      .catch(() => {})
      .finally(() => this.setData({ processing: false }));
  },

  // —— 端内 canvas 工具（裁剪）——
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

  chooseCropSize(e) { this.setData({ cropSize: e.currentTarget.dataset.id }); },
  chooseLayout(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ layout: key });
    setDraft({ layout: key });
  },
  chooseSize(e) { this.setData({ size: e.currentTarget.dataset.id }); },

  // —— 去水印：手指在预览上涂 mask → 调 photoInpaint ——
  getMaskCanvas() {
    return new Promise((resolve, reject) => {
      wx.createSelectorQuery()
        .select('#maskCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0] || !res[0].node) return reject(new Error('mask canvas not found'));
          const canvas = res[0].node;
          resolve({ canvas, ctx: canvas.getContext('2d') });
        });
    });
  },

  onMaskTouch(e) {
    if (this.data.activeTab !== 'inpaint') return;
    const t = e.touches[0];
    if (!t) return;
    const q = wx.createSelectorQuery().select('#maskCanvas');
    q.boundingClientRect((rect) => {
      if (!rect) return;
      const x = (t.clientX - rect.left) * (this._maskW / rect.width);
      const y = (t.clientY - rect.top) * (this._maskH / rect.height);
      this._drawMaskDot(x, y);
    }).exec();
  },

  async _drawMaskDot(x, y) {
    if (!this._maskCtx) {
      const { canvas, ctx } = await this.getMaskCanvas();
      this._maskCanvas = canvas; this._maskCtx = ctx;
      this._maskW = canvas.width; this._maskH = canvas.height;
    }
    const ctx = this._maskCtx;
    ctx.fillStyle = 'rgba(255,0,0,0.55)';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
  },

  clearMask() {
    if (this._maskCtx) {
      this._maskCtx.clearRect(0, 0, this._maskW, this._maskH);
    }
  },

  async onInpaint() {
    if (!this._maskCtx) {
      wx.showToast({ title: '请先在照片上涂抹水印区域', icon: 'none' });
      return;
    }
    this.setData({ processing: true });
    try {
      const photoFileId = await ensureCloudFile(this.data.preview);
      if (!photoFileId) throw new Error('preview not cloud file');
      const maskFileId = await new Promise((resolve) => {
        wx.canvasToTempFilePath({
          canvas: this._maskCanvas,
          success: (r) => {
            wx.cloud.uploadFile({
              cloudPath: `photo/mask/${Date.now()}_${Math.random().toString(36).slice(2)}.png`,
              filePath: r.tempFilePath,
              success: (up) => resolve(up.fileID),
              fail: () => resolve(null),
            });
          },
          fail: () => resolve(null),
        });
      });
      if (!maskFileId) throw new Error('mask upload failed');
      const res = await call('photoInpaint', { photoFileId, maskFileId }, { silent: true });
      if (res && res.resultFileId) {
        this.setData({ preview: res.resultFileId });
        this.clearMask();
        wx.showToast({ title: res.fallback ? '已用轻量算法去水印' : '去水印完成', icon: 'none' });
      }
    } catch (e) {
      wx.showToast({ title: '去水印失败，请重试', icon: 'none' });
    }
    this.setData({ processing: false });
  },

  goDetect() {
    setDraft({ photoAssetId: this.data.preview, layout: this.data.layout });
    this.saveWorkflow('detect_photo');
    wx.navigateTo({ url: `/package-photo/pages/photo/detect?src=${encodeURIComponent(this.data.preview)}` });
  },

  goExport() {
    setDraft({ photoAssetId: this.data.preview, size: this.data.size, layout: this.data.layout });
    this.saveWorkflow('export_photo');
    wx.navigateTo({ url: `/package-photo/pages/photo/export?src=${encodeURIComponent(this.data.preview)}&size=${this.data.size}` });
  },

  // 工作流状态机持久化（支持 F5 双入口续接）
  saveWorkflow(step) {
    const draft = (typeof getApp === 'function' && getApp() && getApp().globalData.draft) || {};
    call('workflowState', {
      action: 'set',
      step,
      photoAssetId: draft.photoAssetId || this.data.preview,
    }, { silent: true }).catch(() => {});
  },

  onShareAppMessage() {
    return { title: '免费证件照工具箱', path: '/pages/index/index' };
  },
});
