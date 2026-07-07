// cloudfunctions/resumeExportWord/index.js
// 简历导出 Word（docx）。CJK 由打开端 Word 字体回退渲染。
const { init, ok, fail, getOpenid, cloud } = require('./_shared/response');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

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

  const basic = rd.basic || {};
  const children = [];
  children.push(new Paragraph({ text: basic.name || '简历', heading: HeadingLevel.TITLE }));
  const contact = [basic.title, basic.phone, basic.email].filter(Boolean).join('   |   ');
  if (contact) children.push(new Paragraph({ children: [new TextRun(contact)] }));
  if (basic.summary) children.push(new Paragraph({ children: [new TextRun(basic.summary)] }));

  (rd.work || []).forEach((w) => {
    children.push(new Paragraph({ text: `${w.company || ''} · ${w.role || ''}`, heading: HeadingLevel.HEADING_2 }));
    if (w.period) children.push(new Paragraph({ children: [new TextRun(w.period)] }));
    if (w.desc) children.push(new Paragraph({ children: [new TextRun(w.desc)] }));
  });
  (rd.education || []).forEach((e) => {
    children.push(new Paragraph({ children: [new TextRun(`${e.school || ''} · ${e.major || ''} · ${e.period || ''}`)] }));
  });
  if (rd.skills && rd.skills.length) {
    children.push(new Paragraph({ children: [new TextRun('技能：' + rd.skills.join('、'))] }));
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  const up = await cloud.uploadFile({
    cloudPath: `resume/export/${Date.now()}_${Math.random().toString(36).slice(2)}.docx`,
    fileContent: buffer,
  });
  return ok({ fileID: up.fileID, size: buffer.length });
};
