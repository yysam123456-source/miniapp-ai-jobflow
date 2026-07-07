// cloudfunctions/workflowState/index.js — F1 工作流状态机持久化 / F5 双入口续接
// action=get  : 返回当前进行中的 workflow + 历史
// action=set  : 创建或更新当前 workflow（step / photoAssetId / resumeId / templateId）
// action=clear: 标记当前 workflow 为 abandoned（退出工作流）
const cloud = require('wx-server-sdk');
const cfg = require('./_shared/config');
const { ok, fail } = require('./_shared/response');

cloud.init({ env: cfg.CLOUDBASE_ENV_ID });

const COL = 'workflow';

exports.main = async (event) => {
  const { action = 'get', step, photoAssetId, resumeId, templateId } = event;
  const openid = cloud.getWXContext().OPENID;
  const db = cloud.database();
  const $ = db.command;
  try {
    if (action === 'get') {
      const cur = await db
        .collection(COL)
        .where({ owner: openid, type: 'resume_flow', status: $.neq('abandoned') })
        .orderBy('updatedAt', 'desc')
        .limit(1)
        .get();
      const history = await db
        .collection(COL)
        .where({ owner: openid })
        .orderBy('updatedAt', 'desc')
        .limit(20)
        .get();
      return ok({ current: cur.data[0] || null, history: history.data });
    }

    if (action === 'set') {
      const now = Date.now();
      const patch = { step, updatedAt: now };
      if (photoAssetId !== undefined) patch.photoAssetId = photoAssetId;
      if (resumeId !== undefined) patch.resumeId = resumeId;
      if (templateId !== undefined) patch.templateId = templateId;
      const existing = await db
        .collection(COL)
        .where({ owner: openid, type: 'resume_flow', status: $.neq('abandoned') })
        .limit(1)
        .get();
      if (existing.data.length) {
        await db.collection(COL).doc(existing.data[0]._id).update({ data: patch });
        return ok({ success: true, _id: existing.data[0]._id });
      }
      const r = await db.collection(COL).add({
        data: {
          owner: openid,
          type: 'resume_flow',
          status: 'in_progress',
          createdAt: now,
          ...patch,
        },
      });
      return ok({ success: true, _id: r._id });
    }

    if (action === 'clear') {
      const existing = await db
        .collection(COL)
        .where({ owner: openid, type: 'resume_flow' })
        .limit(1)
        .get();
      if (existing.data.length) {
        await db
          .collection(COL)
          .doc(existing.data[0]._id)
          .update({ data: { status: 'abandoned', updatedAt: Date.now() } });
      }
      return ok({ success: true });
    }

    return fail(1001, '未知 action');
  } catch (e) {
    return fail(5000, e.message || '状态保存失败');
  }
};
