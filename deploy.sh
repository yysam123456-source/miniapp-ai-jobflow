#!/usr/bin/env bash
# =============================================================================
# 一键部署脚本 · miniapp-ai-jobflow
# -----------------------------------------------------------------------------
# 作用：
#   1) 把 _shared 公共模块同步进每个云函数
#   2) 部署全部 15 个云函数到微信云开发（CloudBase）
#   3) 创建所需数据库集合（user/resume/asset/quota/workflow）
#   4) 给出小程序前端上传指引
#
# 前置：
#   - 已安装 Node.js（>=16）
#   - 已安装 CloudBase CLI：  npm i -g @cloudbase/cli   （脚本会自动探测 tcb / npx）
#   - 已填写 cloudfunctions/_shared/config.local.js（或云函数环境变量）
#   - 已把根目录 config.js 的 CLOUDBASE_ENV_ID 改为你的环境 ID
#
# 用法：
#   bash deploy.sh                # 环境 ID 自动读取 config.js
#   bash deploy.sh <ENV_ID>       # 显式传入环境 ID
# =============================================================================
set -euo pipefail

# 切到仓库根目录（deploy.sh 所在目录）
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# ---- 1. 解析环境 ID ----------------------------------------------------------
ENV_ID="${1:-}"
if [ -z "$ENV_ID" ]; then
  ENV_ID="$(node -e "try{console.log(require('./config').CLOUDBASE_ENV_ID)}catch(e){}" 2>/dev/null || true)"
fi
if [ -z "$ENV_ID" ] || [ "$ENV_ID" = "CLOUDBASE_ENV_ID_PLACEHOLDER" ]; then
  echo "❌ 未找到云开发环境 ID。请执行其一："
  echo "   1) 编辑根目录 config.js，把 CLOUDBASE_ENV_ID 改成你的环境 ID；或"
  echo "   2) 运行： bash deploy.sh <你的环境ID>"
  exit 1
fi
echo "✅ 目标环境： $ENV_ID"

# ---- 2. 选定 CloudBase CLI ----------------------------------------------------
TCB=""
if command -v tcb >/dev/null 2>&1; then
  TCB="tcb"
elif command -v npx >/dev/null 2>&1; then
  TCB="npx --yes @cloudbase/cli"
else
  echo "❌ 未找到 CloudBase CLI（tcb）。请先安装： npm i -g @cloudbase/cli"
  exit 1
fi
echo "✅ 使用 CLI： $TCB"

# ---- 2.5 可选的「环境 API 密钥」登录（推荐，无需腾讯云根账号密钥）--------------
# 在 CloudBase 控制台 → 环境 → 环境设置 → 访问凭证 生成「环境 API 密钥」，
# 然后： CLOUDBASE_API_KEY=<密钥> bash deploy.sh <ENV_ID>
if [ -n "${CLOUDBASE_API_KEY:-}" ]; then
  echo "▶ 使用环境 API 密钥登录 ..."
  $TCB login --cloudbase-api-key "$CLOUDBASE_API_KEY" -e "$ENV_ID" 2>&1 | tail -3 || echo "   ⚠️  API Key 登录失败，请检查密钥与 env 是否匹配"
fi

# ---- 3. 同步公共模块 ----------------------------------------------------------
echo "▶ 同步 _shared 到各云函数 ..."
bash cloudfunctions/sync-shared.sh

# ---- 4. 部署云函数（云端安装依赖，避免本地 mac/linux 二进制不匹配） -----------
FUNCS=(userLogin userWorks quotaGrant photoMatting photoComposite photoDetect \
       photoExport photoGenerate photoInpaint workflowState resumeImport \
       resumeApply resumeOptimize resumeExportPdf resumeExportWord)

echo "▶ 部署云函数（共 ${#FUNCS[@]} 个）..."
FAIL=()
for fn in "${FUNCS[@]}"; do
  if [ ! -f "cloudfunctions/$fn/package.json" ]; then
    echo "   ⚠️  跳过 $fn（无 package.json）"
    continue
  fi
  echo "   → $fn"
  if $TCB fn deploy "$fn" --dir "cloudfunctions/$fn" -e "$ENV_ID" --remote-npm-install --force --yes 2>&1 | tail -3; then
    echo "   ✅ $fn 部署完成"
  else
    echo "   ❌ $fn 部署失败（详见上方日志）"
    FAIL+=("$fn")
  fi
done

# ---- 5. 创建数据库集合 --------------------------------------------------------
COLS=(user resume asset quota workflow)
echo "▶ 创建数据库集合 ..."
for col in "${COLS[@]}"; do
  echo "   → $col"
  $TCB db create "$col" -e "$ENV_ID" --yes 2>&1 | tail -1 || echo "   （已存在则忽略）"
done

# ---- 6. 结果 & 前端上传指引 ---------------------------------------------------
echo ""
echo "============================================================"
if [ "${#FAIL[@]}" -eq 0 ]; then
  echo "🎉 云函数 + 数据库集合部署完成！"
else
  echo "⚠️  以下云函数部署失败，需手动重试： ${FAIL[*]}"
fi
echo "------------------------------------------------------------"
echo "📦 还需上传小程序前端（本脚本无法在无上传密钥时自动完成）："
echo "   方式 A（推荐）：微信开发者工具 → 右上角『上传』→ 填版本号/备注"
echo "   方式 B（CI）： 用 miniprogram-ci + 上传密钥："
echo "      npx miniprogram-ci upload \\"
echo "        --pp ./private.key \\"
echo "        --appid <你的AppID> \\"
echo "        --uv pkg \\"
echo "        --project ./"
echo "------------------------------------------------------------"
echo "🔧 别忘了："
echo "   1) 在云函数环境变量 / config.local.js 填 HUNYAN、MATTING、INPAINT 等真实值"
echo "   2) 在云函数权限面板开通 security.imgSecCheck / security.msgSecCheck（内容安全）"
echo "   3) 如需 PDF 中文，放 CJK 字体到 cloudfunctions/_shared/fonts/NotoSansSC.ttf"
echo "============================================================"
