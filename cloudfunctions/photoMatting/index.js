// cloudfunctions/photoMatting/index.js
// 抠图：原图 → 透明 PNG（fileID 进出）。消耗 image 额度。
const { init, ok, fail, getOpenid, cloud } = require('./_shared/response');
const { checkQuota, incQuota } = require('./_shared/quota');
const { matting } = require('./_shared/image');
const { imgSecCheck } = require('./_shared/security');

exports.main = async (event) => {
  init();
  const openid = getOpenid(event);
  if (!event.fileID) return fail(1001, '缺少 fileID');

  const q = await checkQuota(openid, 'image');
  if (!q.ok) return fail(1002, '今日免费额度已用完，明天 0 点刷新或分享获次数', { used: q.used, limit: q.limit });

  try {
    const dl = await cloud.downloadFile({ fileID: event.fileID });
    // 内容安全（图片送审）
    const sec = await imgSecCheck(event.fileID);
    if (!sec.pass) return fail(3001, '照片未通过内容安全审核');
    const out = await matting(dl.fileContent);
    const up = await cloud.uploadFile({
      cloudPath: `photo/matted/${Date.now()}_${Math.random().toString(36).slice(2)}.png`,
      fileContent: out,
    });
    await incQuota(openid, 'image');
    try {
      await cloud.database().collection('asset').add({
        data: { owner: openid, type: 'photo', url: up.fileID, source: 'edited', createdAt: cloud.database().serverDate() },
      });
    } catch (e) {}
    return ok({ fileID: up.fileID });
  } catch (e) {
    return fail(5000, '抠图失败', String((e && e.message) || e));
  }
};
