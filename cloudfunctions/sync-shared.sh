#!/usr/bin/env bash
# 把 _shared 公共模块同步进每个云函数目录（CloudBase 各函数独立打包，不会自动共享代码）。
# 部署前执行：bash cloudfunctions/sync-shared.sh
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
SHARED="$ROOT/_shared"
for d in "$ROOT"/*/; do
  name="$(basename "$d")"
  [ "$name" = "_shared" ] && continue
  [ ! -f "$d/package.json" ] && continue
  mkdir -p "$d/_shared"
  cp -r "$SHARED/." "$d/_shared/"
done
echo "[sync-shared] 已将 _shared 同步到所有云函数"
