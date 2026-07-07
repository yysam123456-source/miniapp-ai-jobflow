// cloudfunctions/photoExport/index.js
// 规格裁切 + 换底导出。返回 { fileID }。导出不计额度（抠图已计）。
const { init, ok, fail, getOpenid, cloud } = require('./_shared/response');
const { exportBuffer } = require('./_shared/image');

exports.main = async (event) => {
  init();
  getOpenid(event);
  if (!event.fileID) return fail(1001, '缺少 fileID');
  const size = event.size || '1inch';
  const bg = event.bg || 'white';
  try {
    const dl = await cloud.downloadFile({ fileID: event.fileID });
    const r = await exportBuffer(dl.fileContent, size, bg);
    const up = await cloud.uploadFile({
      cloudPath: `photo/export/${Date.now()}_${Math.random().toString(36).slice(2)}.png`,
      fileContent: r.buffer,
    });
    return ok({ fileID: up.fileID, dimensions: { width: r.width, height: r.height } });
  } catch (e) {
    return fail(5000, '导出失败', String((e && e.message) || e));
  }
};
