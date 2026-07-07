// cloudfunctions/resumeApply/index.js
// 套用模板：ResumeData → 带 elements 的简历，落库并返回 _id。
const { init, ok, fail, getOpenid, cloud } = require('./_shared/response');

const TEMPLATE_STYLE = {
  simple: { fontFamily: 'PingFang SC', primaryColor: '#2C313A', backgroundColor: '#FFFFFF' },
  business: { fontFamily: 'PingFang SC', primaryColor: '#16A36E', backgroundColor: '#FFFFFF' },
  creative: { fontFamily: 'PingFang SC', primaryColor: '#574BC2', backgroundColor: '#FBFAFF' },
  academic: { fontFamily: 'PingFang SC', primaryColor: '#2D8CFF', backgroundColor: '#FFFFFF' },
  fresh: { fontFamily: 'PingFang SC', primaryColor: '#F5A623', backgroundColor: '#FFFCF5' },
};

function buildElements(rd, style) {
  const basic = rd.basic || {};
  const el = [];
  el.push({ id: 'name', type: 'text', tag: 'name', content: basic.name || '', styleOverride: { fontSize: 24, bold: true, color: style.primaryColor } });
  if (basic.title) el.push({ id: 'title', type: 'text', tag: 'title', content: basic.title, styleOverride: {} });
  if (basic.summary) el.push({ id: 'summary', type: 'section', tag: 'summary', content: basic.summary, styleOverride: {} });
  (rd.work || []).forEach((w, i) => {
    el.push({
      id: `work-${i}`,
      type: 'text',
      tag: 'work',
      content: `${w.company || ''} · ${w.role || ''}\n${w.period || ''}\n${w.desc || ''}`,
      styleOverride: {},
    });
  });
  (rd.education || []).forEach((e, i) => {
    el.push({ id: `edu-${i}`, type: 'text', tag: 'education', content: `${e.school || ''} · ${e.major || ''} · ${e.period || ''}`, styleOverride: {} });
  });
  if (rd.skills && rd.skills.length) {
    el.push({ id: 'skills', type: 'text', tag: 'skill', content: rd.skills.join('、'), styleOverride: {} });
  }
  return el;
}

exports.main = async (event) => {
  init();
  const openid = getOpenid(event) || event.openid || '';
  const rd = event.resumeData;
  const templateId = event.templateId || 'simple';
  if (!rd) return fail(1001, '缺少 resumeData');

  const style = TEMPLATE_STYLE[templateId] || TEMPLATE_STYLE.simple;
  const elements = buildElements(rd, style);

  const db = cloud.database();
  const added = await db.collection('resume').add({
    data: {
      owner: openid,
      templateId,
      styleToken: style,
      elements,
      photoAssetId: event.photoAssetId || '',
      rawImport: JSON.stringify(rd),
      jd: event.jd || '',
      optimized: false,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate(),
    },
  });

  return ok({
    resume: { _id: added._id, templateId, elements, photoAssetId: event.photoAssetId || '' },
    patches: [],
  });
};
