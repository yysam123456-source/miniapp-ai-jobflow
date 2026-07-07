// cloudfunctions/photoGenerate/index.js — F2a/F2b AI 职业照生成
// action=prompt：基于风格生成专业职业照 prompt（调混元文本）
// action=generate：确认后调混元生图（提交作业→轮询）→ 落地云存储，返回 fileID
const cloud = require('wx-server-sdk');
const cfg = require('./_shared/config');
const { ok, fail } = require('./_shared/response');
const { chat, generateImage } = require('./_shared/hunyuan');
const { imgSecCheck } = require('./_shared/security');
const https = require('https');

cloud.init({ env: cfg.CLOUDBASE_ENV_ID });

function downloadHttp(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

const STYLE_MAP = {
  formal: '正式商务职业照：深色西装、干净背景、专业打光',
  casual: '自然休闲职业照：休闲衬衫、柔和背景、自然光线',
  creative: '创意职业形象照：时尚穿搭、有设计感的背景、电影感光线',
};

exports.main = async (event) => {
  const { action, photoFileId, style = 'formal', prompt, confirm } = event;
  const openid = cloud.getWXContext().OPENID;
  try {
    if (action === 'prompt') {
      // 送审用户上传的生活照（若有）
      if (photoFileId) {
        const sec = await imgSecCheck(photoFileId);
        if (!sec.pass) return fail(3001, '照片未通过内容安全审核');
      }
      const styleText = STYLE_MAP[style] || STYLE_MAP.formal;
      const sys =
        '你是专业证件照造型师。根据用户指定的职业照风格，输出一段用于 AI 文生图的职业照 prompt（中文，含服装/背景/光线/姿态/画质），控制在 80 字以内。只输出 prompt，不要解释或标点以外的多余文字。';
      const p = await chat({
        system: sys,
        user: `请为「${styleText}」生成职业照 prompt`,
        model: cfg.HUNYUAN.MODEL_PARSE,
      });
      return ok({ prompt: (p || '').trim() });
    }

    if (action === 'generate') {
      if (!prompt || !confirm) return fail(1001, '缺少 prompt 或确认标志');
      const url = await generateImage(prompt, { resolution: '1024:1024' });
      const buf = await downloadHttp(url);
      const up = await cloud.uploadFile({
        cloudPath: `photo/ai/${Date.now()}_${Math.random().toString(36).slice(2)}.png`,
        fileContent: buf,
      });
      return ok({ generatedFileId: up.fileID });
    }

    return fail(1001, '未知 action');
  } catch (e) {
    if (e.code === 'CONFIG') return fail(4001, 'AI 服务未配置（请在 config.local.js 填入混元 SecretId/Key）');
    if (e.code === 'API') return fail(4001, '混元调用失败：' + e.message);
    return fail(5000, e.message || '生成失败');
  }
};
