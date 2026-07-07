// cloudfunctions/resumeImport/index.js
// 导入解析：fileId(云存储) → ResumeData。text/pdf/docx 离线可解析；image 需配置混元视觉。
const { init, ok, fail, getOpenid, cloud } = require('./_shared/response');
const { checkQuota, incQuota } = require('./_shared/quota');
const { parse } = require('./_shared/parseResume');
const { PARSE_SYSTEM } = require('./_shared/prompts');
const { chat } = require('./_shared/hunyuan');

async function extractText(fileType, buffer) {
  if (fileType === 'text') return buffer.toString('utf8');
  if (fileType === 'pdf') {
    const pdf = require('pdf-parse');
    const r = await pdf(buffer);
    return r.text || '';
  }
  if (fileType === 'docx') {
    const mammoth = require('mammoth');
    const r = await mammoth.extractRawText({ buffer });
    return r.value || '';
  }
  if (fileType === 'image') {
    // 图片 OCR 需要混元视觉；未配置则返回 4001
    throw Object.assign(new Error('图片简历需配置混元视觉 OCR'), { code: 4001, hint: 'image_ocr_not_configured' });
  }
  return buffer.toString('utf8');
}

function safeJson(text) {
  // 去除可能的 ```json 包裹
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch (e) { return null; }
}

exports.main = async (event) => {
  init();
  const openid = getOpenid(event) || event.openid || '';
  if (!event.fileId) return fail(1001, '缺少 fileId');
  const fileType = event.fileType || 'text';

  // 文本类解析不消耗 AI 额度；仅混元参与时计 text 额度
  let useAI = false;
  try {
    const cfg = require('./_shared/config');
    useAI = !!(cfg.HUNYUAN.SECRET_ID && cfg.HUNYUAN.SECRET_KEY);
  } catch (e) {}

  try {
    const dl = await cloud.downloadFile({ fileID: event.fileId });
    const rawText = await extractText(fileType, dl.fileContent);

    let resumeData, confidence = 0.6, warnings = [];
    if (useAI) {
      const q = await checkQuota(openid, 'text');
      if (!q.ok) return fail(1002, '今日免费额度已用完', { used: q.used, limit: q.limit });
      try {
        const json = await chat({ system: PARSE_SYSTEM, user: rawText.slice(0, 6000), model: require('./_shared/config').HUNYUAN.MODEL_PARSE });
        const parsed = safeJson(json);
        if (parsed && parsed.basic) {
          resumeData = parsed;
          confidence = 0.92;
          await incQuota(openid, 'text');
        } else {
          resumeData = parse(rawText);
        }
      } catch (e) {
        // AI 失败回退启发式
        resumeData = parse(rawText);
      }
    } else {
      resumeData = parse(rawText);
    }

    if (!resumeData.basic.name && !resumeData.basic.phone) warnings.push('未能识别姓名/电话，建议手动补全');
    if (!resumeData.work.length && !resumeData.education.length) warnings.push('未解析到工作或教育经历');

    return ok({ resumeData, confidence, warnings, fields: {} });
  } catch (e) {
    if (e.code === 4001) return fail(4001, e.message);
    return fail(5000, '解析失败', String((e && e.message) || e));
  }
};
