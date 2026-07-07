// utils/store.js — 极轻量跨页面状态（工作流草稿）
// 小程序无 Vuex，这里用 app.globalData + 模块单例做一个最小可用的草稿仓库，
// 支撑「双入口续接」：证件照页生成的 assetId 可直接带给简历页。

const app = getApp();

function _g() {
  return (typeof getApp === 'function' && getApp()) || null;
}

/**
 * 写入当前工作流草稿（photoAssetId / resumeId / templateId ...）
 */
function setDraft(patch) {
  const g = _g();
  if (!g) return;
  g.globalData.draft = Object.assign({}, g.globalData.draft, patch);
}

function getDraft() {
  const g = _g();
  return (g && g.globalData.draft) || null;
}

function clearDraft() {
  const g = _g();
  if (g) g.globalData.draft = null;
}

module.exports = { setDraft, getDraft, clearDraft };
