// package-resume/pages/resume/editor.js — 元素级简历编辑
const { getDraft, setDraft } = require('../../../utils/store');

function emptyForm() {
  return {
    name: '', phone: '', email: '', title: '', summary: '',
    works: [{ company: '', role: '', period: '', desc: '' }],
    education: [{ school: '', major: '', period: '' }],
    skills: '',
  };
}

// 把导入的 ResumeData 规整成本地表单结构
function normalize(rd) {
  const f = emptyForm();
  if (!rd) return f;
  const basic = rd.basic || rd;
  f.name = basic.name || rd.name || '';
  f.phone = basic.phone || rd.phone || '';
  f.email = basic.email || rd.email || '';
  f.title = basic.title || rd.title || basic.headline || '';
  f.summary = basic.summary || rd.summary || '';
  const works = rd.work || rd.workExperiences || rd.experiences || [];
  if (works.length) {
    f.works = works.map((w) => ({
      company: w.company || w.org || '',
      role: w.role || w.position || w.title || '',
      period: w.period || w.date || '',
      desc: w.desc || w.description || (Array.isArray(w.highlights) ? w.highlights.join('\n') : ''),
    }));
  }
  const edu = rd.education || [];
  if (edu.length) {
    f.education = edu.map((e) => ({
      school: e.school || e.org || '',
      major: e.major || e.degree || '',
      period: e.period || e.date || '',
    }));
  }
  const sk = rd.skills;
  f.skills = Array.isArray(sk) ? sk.join('、') : (sk || '');
  return f;
}

Page({
  data: {
    form: emptyForm(),
    photoAssetId: '',
    templateId: '',
    hasPhoto: false,
  },

  onLoad() {
    const draft = getDraft() || {};
    const form = normalize(draft.resumeData);
    this.setData({
      form,
      photoAssetId: draft.photoAssetId || '',
      templateId: draft.templateId || '',
      hasPhoto: !!draft.photoAssetId,
    });
  },

  // 基本信息输入
  onField(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  // 数组字段输入（work / education）
  onItemField(e) {
    const { list, index, field } = e.currentTarget.dataset;
    this.setData({ [`form.${list}[${index}].${field}`]: e.detail.value });
  },

  addWork() {
    const works = this.data.form.works.concat([{ company: '', role: '', period: '', desc: '' }]);
    this.setData({ 'form.works': works });
  },
  removeWork(e) {
    const i = e.currentTarget.dataset.index;
    if (this.data.form.works.length <= 1) return;
    const works = this.data.form.works.slice();
    works.splice(i, 1);
    this.setData({ 'form.works': works });
  },

  addEdu() {
    const education = this.data.form.education.concat([{ school: '', major: '', period: '' }]);
    this.setData({ 'form.education': education });
  },
  removeEdu(e) {
    const i = e.currentTarget.dataset.index;
    if (this.data.form.education.length <= 1) return;
    const education = this.data.form.education.slice();
    education.splice(i, 1);
    this.setData({ 'form.education': education });
  },

  // 写回草稿（本地保存，不调云函数）
  persist() {
    const form = this.data.form;
    setDraft({
      resumeData: form,
      photoAssetId: this.data.photoAssetId,
      templateId: this.data.templateId,
    });
  },

  saveDraft() {
    this.persist();
    wx.showToast({ title: '已保存草稿', icon: 'success' });
  },

  goPolish() {
    if (!this.data.form.name) {
      wx.showToast({ title: '至少填写姓名', icon: 'none' });
      return;
    }
    this.persist();
    wx.navigateTo({ url: '/package-resume/pages/resume/polish' });
  },

  goPhoto() {
    wx.navigateTo({ url: '/package-photo/pages/photo/select?mode=resume' });
  },

  onShareAppMessage() {
    return { title: '在线编辑我的简历', path: '/pages/index/index' };
  },
});
