// utils/auth.js — 静默登录（openid）
// 微信云开发下，云函数内可通过 cloud.getWXContext().OPENID 获取 openid，
// 前端只需 wx.login 拿 code 换取自定义登录态（此处直接用 openid 即可，无需自建 token）。

const OPENID_KEY = 'openid';

/**
 * 确保登录态：优先取本地缓存，否则 wx.login → 云函数 userLogin 换取 openid。
 * @returns {Promise<string>} openid
 */
function ensureLogin() {
  return new Promise((resolve, reject) => {
    const cached = wx.getStorageSync(OPENID_KEY);
    if (cached) {
      resolve(cached);
      return;
    }
    wx.login({
      success: ({ code }) => {
        wx.cloud.callFunction({
          name: 'userLogin',
          data: { code },
          success: (res) => {
            const openid = (res.result && res.result.data && res.result.data.openid) || null;
            if (openid) {
              wx.setStorageSync(OPENID_KEY, openid);
              resolve(openid);
            } else {
              // 云开发框架通常自动注入 OPENID，若 userLogin 未返回则走兜底
              resolve(openid || 'anonymous');
            }
          },
          fail: (err) => reject(err),
        });
      },
      fail: (err) => reject(err),
    });
  });
}

function getOpenid() {
  return wx.getStorageSync(OPENID_KEY) || null;
}

function logout() {
  wx.removeStorageSync(OPENID_KEY);
}

module.exports = { ensureLogin, getOpenid, logout };
