// cloudfunctions/resumeExportPdf/index.js
// 简历导出 PDF（A4，嵌入证件照）。需配置中文字体（见 config.PDF_FONT_PATH）。
const fs = require('fs');
const { init, ok, fail, getOpenid, cloud } = require('./_shared/response');
const cfg = require('./_shared/config');

exports.main = async (event) => {
  init();
  const openid = getOpenid(event) || event.openid || '';
  const db = cloud.database();
  let rd = event.resumeData;
  if (!rd && event.resumeId) {
    const r = await db.collection('resume').doc(event.resumeId).get().catch(() => null);
    if (r && r.data) rd = JSON.parse(r.data.rawImport || '{}');
  }
  if (!rd) return fail(1001, '缺少简历数据');

  if (!fs.existsSync(cfg.PDF_FONT_PATH)) {
    return fail(4001, 'PDF 导出需配置中文字体：将 CJK ttf 放到 ' + cfg.PDF_FONT_PATH);
  }

  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on('end', resolve));

  try {
    doc.registerFont('cjk', cfg.PDF_FONT_PATH);
    doc.font('cjk');
  } catch (e) {
    doc.font('Helvetica');
  }

  const basic = rd.basic || {};
  doc.fontSize(22).text(basic.name || '简历', { align: 'left' });
  const contact = [basic.title, basic.phone, basic.email].filter(Boolean).join('   |   ');
  if (contact) doc.fontSize(12).text(contact);
  if (basic.summary) { doc.moveDown(); doc.fontSize(11).text(basic.summary); }

  if (event.photoAssetId) {
    try {
      const dl = await cloud.downloadFile({ fileID: event.photoAssetId });
      doc.image(dl.fileContent, { width: 90, height: 120 });
    } catch (e) {}
  }

  (rd.work || []).forEach((w) => {
    doc.moveDown();
    doc.fontSize(13).text(`${w.company || ''} · ${w.role || ''}`);
    if (w.period) doc.fontSize(10).text(w.period);
    if (w.desc) doc.fontSize(11).text(w.desc);
  });
  (rd.education || []).forEach((e) => {
    doc.moveDown();
    doc.fontSize(12).text(`${e.school || ''} · ${e.major || ''} · ${e.period || ''}`);
  });
  if (rd.skills && rd.skills.length) {
    doc.moveDown();
    doc.fontSize(12).text('技能：' + rd.skills.join('、'));
  }

  doc.end();
  await done;
  const buffer = Buffer.concat(chunks);
  const up = await cloud.uploadFile({
    cloudPath: `resume/export/${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`,
    fileContent: buffer,
  });
  return ok({ fileID: up.fileID, size: buffer.length });
};
