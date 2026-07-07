// cloudfunctions/userWorks/index.js
// 「我的作品」列表：当前用户最近的简历 + 证件照。
const { init, ok, fail, getOpenid, cloud } = require('./_shared/response');

exports.main = async (event) => {
  init();
  const openid = getOpenid(event) || event.openid || '';
  if (!openid) return fail(2001, '未登录');
  const db = cloud.database();
  try {
    const rRes = await db
      .collection('resume')
      .where({ owner: openid })
      .orderBy('updatedAt', 'desc')
      .limit(20)
      .get();
    const rPhoto = await db
      .collection('asset')
      .where({ owner: openid, type: 'photo' })
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    const resumes = (rRes.data || []).map((r) => ({
      _id: r._id,
      templateId: r.templateId,
      name: (r.elements || []).find((e) => e.tag === 'name')?.content || '未命名简历',
      updatedAt: r.updatedAt,
    }));
    const photos = (rPhoto.data || []).map((p) => ({ _id: p._id, url: p.url, createdAt: p.createdAt }));
    return ok({ resumes, photos });
  } catch (e) {
    return fail(5000, '读取作品失败', String((e && e.message) || e));
  }
};
