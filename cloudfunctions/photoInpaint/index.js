// cloudfunctions/photoInpaint/index.js — F3c 去水印
// 用户手涂 mask（白=需消除）→ AI 智能填充消除
// 配置了 INPAINT.ENDPOINT 走自托管 LaMa 类端点；否则用内置「邻域模糊填充」兜底（轻量、无需模型）。
const cloud = require('wx-server-sdk');
const cfg = require('./_shared/config');
const { ok, fail } = require('./_shared/response');
const { imgSecCheck } = require('./_shared/security');
const sharp = require('sharp');
const https = require('https');

cloud.init({ env: cfg.CLOUDBASE_ENV_ID });

async function dl(fileID) {
  const r = await cloud.downloadFile({ fileID });
  return r.fileContent;
}

// 自托管 inpaint 端点（约定：POST JSON { image: base64, mask: base64 } → 返回 PNG buffer）
async function inpaintAI(photoBuf, maskBuf) {
  const ep = cfg.INPAINT.ENDPOINT;
  const key = cfg.INPAINT.API_KEY;
  if (!ep) return null;
  const body = JSON.stringify({
    image: photoBuf.toString('base64'),
    mask: maskBuf.toString('base64'),
  });
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: ep.replace(/^https?:\/\//, '').split('/')[0],
        path: ep.includes('//') ? '/' + ep.split('/').slice(3).join('/') : '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: key ? `Bearer ${key}` : undefined,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// 兜底去水印：mask 区域用整图模糊结果填充（轻量近似）
async function inpaintFallback(photoBuf, maskBuf) {
  const pm = await sharp(photoBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const mm = await sharp(maskBuf).resize(pm.info.width, pm.info.height, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const blurred = await sharp(photoBuf).blur(10).png().toBuffer();
  const bm = await sharp(blurred).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = pm.info;
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const si = i * c;
    const mi = i * mm.info.channels;
    const maskA = mm.data[mi + 3] || 0;
    const oi = i * 4;
    if (maskA > 128) {
      out[oi] = bm.data[si];
      out[oi + 1] = bm.data[si + 1];
      out[oi + 2] = bm.data[si + 2];
      out[oi + 3] = 255;
    } else {
      out[oi] = pm.data[si];
      out[oi + 1] = pm.data[si + 1];
      out[oi + 2] = pm.data[si + 2];
      out[oi + 3] = pm.data[si + 3] !== undefined ? pm.data[si + 3] : 255;
    }
  }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

exports.main = async (event) => {
  const { photoFileId, maskFileId } = event;
  try {
    await imgSecCheck(photoFileId);
    const photo = await dl(photoFileId);
    const mask = await dl(maskFileId);
    let result = await inpaintAI(photo, mask);
    if (!result) result = await inpaintFallback(photo, mask);
    const up = await cloud.uploadFile({
      cloudPath: `photo/inpaint/${Date.now()}_${Math.random().toString(36).slice(2)}.png`,
      fileContent: result,
    });
    return ok({ resultFileId: up.fileID, fallback: !cfg.INPAINT.ENDPOINT });
  } catch (e) {
    return fail(5000, e.message || '去水印失败');
  }
};
