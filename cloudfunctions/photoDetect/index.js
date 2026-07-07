// cloudfunctions/photoDetect/index.js
// 合规检测：6 项启发式评分。返回 { score, items }。无 AI 成本，不计额度。
const { init, ok, fail, getOpenid, cloud } = require('./_shared/response');
const { detect } = require('./_shared/image');

exports.main = async (event) => {
  init();
  getOpenid(event);
  if (!event.fileID) return fail(1001, '缺少 fileID');
  try {
    const dl = await cloud.downloadFile({ fileID: event.fileID });
    const r = await detect(dl.fileContent, event.spec || '1inch');
    return ok({ score: r.score, items: r.items });
  } catch (e) {
    return fail(5000, '检测失败', String((e && e.message) || e));
  }
};
