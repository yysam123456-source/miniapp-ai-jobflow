// app.js — 全局初始化：云环境、静默登录、工作流状态机入口
const { ensureLogin } = require('./utils/auth');
const cfg = require('./config');

App({
  globalData: {
    // 微信云开发环境 ID（在 config.js 填写，或公众平台「云开发」控制台获取）
    env: cfg.CLOUDBASE_ENV_ID,
    openid: null,
    // 跨页面传递的临时工作流上下文（照片 assetId / resumeId / templateId）
    draft: null,
    // 系统信息（用于安全区适配）
    safeArea: null,
  },

  onLaunch() {
    // 1) 初始化云开发（免服务器/域名/ICP，落在免费额度内）
    if (!wx.cloud) {
      console.error('[miniapp] 当前基础库不支持 wx.cloud，请升级微信客户端');
      return;
    }
    wx.cloud.init({
      env: this.globalData.env,
      traceUser: true, // 在云开发后台按用户追溯，便于额度监控
    });

    // 2) 读取系统信息用于安全区适配（刘海屏/底部小白条）
    try {
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      this.globalData.safeArea = windowInfo.safeArea || null;
    } catch (e) { /* 非阻断 */ }

    // 3) 静默登录（openid 注入，不弹授权，符合隐私最小化）
    ensureLogin().then((openid) => {
      this.globalData.openid = openid;
    }).catch(() => { /* 失败不阻断，调用云函数时框架仍会注入 OPENID */ });
  },
});
