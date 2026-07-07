// cloudfunctions/quotaGrant/index.js
// 看广告后赠送额度（image / text 各 +1）
const { init, ok, fail, getOpenid } = require('./_shared/response');
const { grantBonus } = require('./_shared/quota');

exports.main = async (event) => {
  init();
  const openid = getOpenid(event) || event.openid || '';
  if (!openid) return fail(2001, '未登录');
  await grantBonus(openid);
  return ok({ granted: true });
};
