// cloudfunctions/resumeOptimize/index.js
// AI 润色：ResumeData → 优化版 + 逐条建议。消耗 text 额度。
const { init, ok, fail, getOpenid, cloud } = require('./_shared/response');
const { checkQuota, incQuota } = require('./_shared/quota');
const { OPTIMIZE_SYSTEM } = require('./_shared/prompts');
const { chat } = require('./_shared/hunyuan');
const { msgSecCheck } = require('./_shared/security');

function safeJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch (e) { return null; }
}

exports.main = async (event) => {
  init();
  const openid = getOpenid(event) || event.openid || '';

  const db = cloud.database();
  let rd = event.resumeData;
  if (!rd && event.resumeId) {
    const r = await db.collection('resume').doc(event.resumeId).get().catch(() => null);
    if (r && r.data) rd = JSON.parse(r.data.rawImport || '{}');
  }
  if (!rd) return fail(1001, '缺少简历数据（resumeData 或 resumeId）');

  const q = await checkQuota(openid, 'text');
  if (!q.ok) return fail(1002, '今日免费额度已用完', { used: q.used, limit: q.limit });

  // 内容安全（JD 送审）
  if (event.target) {
    const sec = await msgSecCheck(event.target.slice(0, 2000));
    if (!sec.pass) return fail(3001, 'JD 内容未通过安全审核');
  }

  const user = [
    `优化范围：${event.scope || 'all'}`,
    `目标岗位JD：${event.target || '无'}`,
    `简历JSON：${JSON.stringify(rd).slice(0, 6000)}`,
  ].join('\n');

  try {
    const json = await chat({ system: OPTIMIZE_SYSTEM, user, model: require('./_shared/config').HUNYUAN.MODEL_OPTIMIZE });
    const parsed = safeJson(json);
    if (!parsed || !parsed.optimized) return fail(4001, 'AI 返回异常，请重试');
    await incQuota(openid, 'text');
    return ok({ optimized: parsed.optimized, suggestions: parsed.suggestions || {}, patches: [] });
  } catch (e) {
    if (e.code === 'CONFIG') return fail(4001, 'AI 服务未配置（请在 config 填入混元 SecretId/Key）');
    return fail(4001, '润色失败：' + (e.message || ''), String(e));
  }
};
