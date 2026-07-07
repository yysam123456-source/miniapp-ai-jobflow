// cloudfunctions/userLogin/index.js
// 静默登录：返回 openid（云开发自动注入），并 upsert 用户记录。
const { init, ok, fail, getOpenid } = require('./_shared/response');
const { db } = require('./_shared/db');

exports.main = async (event) => {
  init();
  const openid = getOpenid(event) || (event.code ? `code_${event.code}` : '');
  if (!openid) return fail(2001, '未获取到用户身份');

  try {
    const col = db().collection('user');
    const r = await col.doc(openid).get().catch(() => null);
    if (!r || !r.data) {
      await col.add({ data: { _id: openid, openid, createdAt: Date.now(), updatedAt: Date.now() } });
    }
  } catch (e) {
    // 非阻断
  }
  return ok({ openid });
};
