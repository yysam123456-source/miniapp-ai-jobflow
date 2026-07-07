// cloudfunctions/photoComposite/index.js
// 换底(op=bg) / 美颜(op=beauty)。fileID 进出。消耗 image 额度。
const { init, ok, fail, getOpenid, cloud } = require('./_shared/response');
const { checkQuota, incQuota } = require('./_shared/quota');
const { compositeBg, beauty } = require('./_shared/image');

exports.main = async (event) => {
  init();
  const openid = getOpenid(event);
  const op = event.op || 'bg';
  if (!event.fileID) return fail(1001, '缺少 fileID');

  const q = await checkQuota(openid, 'image');
  if (!q.ok) return fail(1002, '今日免费额度已用完', { used: q.used, limit: q.limit });

  try {
    const dl = await cloud.downloadFile({ fileID: event.fileID });
    let out;
    if (op === 'beauty') {
      const r = await beauty(dl.fileContent, { smooth: event.smooth, whiten: event.whiten });
      out = r.buffer;
    } else {
      out = await compositeBg(dl.fileContent, event.bg || 'white');
    }
    const up = await cloud.uploadFile({
      cloudPath: `photo/composite/${Date.now()}_${Math.random().toString(36).slice(2)}.png`,
      fileContent: out,
    });
    await incQuota(openid, 'image');
    return ok({ fileID: up.fileID });
  } catch (e) {
    return fail(5000, '处理失败', String((e && e.message) || e));
  }
};
