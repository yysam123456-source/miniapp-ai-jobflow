// utils/cloud.js — 云函数统一调用层
// 封装 wx.cloud.callFunction，自动处理统一返回结构 ApiResponse<T>：
//   code: 0=成功, 1001=参数, 1002=额度, 2001=未登录, 3001=内容安全, 4001=AI不可用, 5000=内部错误
// 同时统一错误 toast、额度耗尽引导、登录失效兜底。

const TOAST_CODE = {
  1001: '参数有误，请重试',
  1002: '免费额度已用完，观看广告获取更多次数',
  2001: '登录已失效，正在重新登录…',
  3001: '内容未通过安全审核',
  4001: 'AI 服务暂不可用，请稍后再试',
  5000: '服务开小差了，请重试',
};

/**
 * 调用云函数，返回 data 字段（成功时）。
 * @param {string} name 云函数名
 * @param {object} data 入参
 * @param {object} [opt] { silent: 是否静默（不自动 toast） }
 * @returns {Promise<any>} resolve 为 res.data.data
 */
function call(name, data = {}, opt = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success: (res) => {
        const body = res.result || {};
        if (body.code === 0) {
          resolve(body.data);
          return;
        }
        // 额度耗尽：引导看广告（流量主反哺）
        if (body.code === 1002 && !opt.silent) {
          wx.showModal({
            title: '免费额度已用完',
            content: '今日免费次数已用完，明天 0 点自动刷新；也可在「我的」分享给好友获取额外次数。',
            showCancel: false,
            confirmText: '知道了',
          });
        } else if (!opt.silent) {
          wx.showToast({ title: TOAST_CODE[body.code] || '请求失败', icon: 'none' });
        }
        reject(body);
      },
      fail: (err) => {
        if (!opt.silent) wx.showToast({ title: '网络异常，请重试', icon: 'none' });
        reject({ code: -1, message: err.errMsg, detail: err });
      },
    });
  });
}

module.exports = { call };
