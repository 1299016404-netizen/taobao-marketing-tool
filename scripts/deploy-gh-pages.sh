#!/bin/bash
# ======================================================================
# 安全部署 out/ 到 gh-pages，永远不覆盖 auto-sync 写入的 tunnel.json
# 保护要点：
#   1. rsync --exclude='tunnel.json' --exclude='.nojekyll' 跳过这两个关键文件
#   2. 部署前 fetch + reset --hard 拿到 auto-sync 的最新 commit
#   3. push 前再 fetch + rebase，避免与并发 auto-sync push 冲突
#   4. public/tunnel.json 已永久删除，build 不会输出 out/tunnel.json
# ======================================================================

set -euo pipefail

PROJECT_DIR="/Users/liaozhansheng/Qoder/taobao-marketing-tool"
GH_PAGES_DIR="/tmp/taobao-gh-pages"
REPO_URL="https://github.com/1299016404-netizen/taobao-marketing-tool.git"

cd "$PROJECT_DIR"

if [ ! -d "out" ]; then
  echo "❌ out/ 不存在，请先 npm run build"
  exit 1
fi

# 防御性：万一 out/tunnel.json 又被某种渠道带进来，立刻删
rm -f out/tunnel.json

# 确保 gh-pages 工作目录就绪
if [ ! -d "$GH_PAGES_DIR/.git" ]; then
  rm -rf "$GH_PAGES_DIR"
  git clone --single-branch --branch gh-pages "$REPO_URL" "$GH_PAGES_DIR"
fi

cd "$GH_PAGES_DIR"
git fetch origin gh-pages
git reset --hard origin/gh-pages

# 备份 tunnel.json（auto-sync 维护的最新值，绝不能丢）
TUNNEL_BACKUP=""
if [ -f tunnel.json ]; then
  TUNNEL_BACKUP=$(cat tunnel.json)
fi

# 同步 build 产物（关键文件 exclude）
rsync -a --delete \
  --exclude='.git' \
  --exclude='tunnel.json' \
  --exclude='.nojekyll' \
  "$PROJECT_DIR/out/" ./

# 还原保护文件（双重保险）
touch .nojekyll
if [ -n "$TUNNEL_BACKUP" ]; then
  echo "$TUNNEL_BACKUP" > tunnel.json
fi

git add -A
COMMIT_MSG="${1:-deploy: $(cd "$PROJECT_DIR" && git rev-parse --short HEAD)}"
if git diff --cached --quiet; then
  echo "✓ 无构建产物变化，跳过 commit"
else
  git commit -m "$COMMIT_MSG"
fi

# push 前再次 fetch + rebase，避免与并发 auto-sync 冲突
git fetch origin gh-pages
git rebase origin/gh-pages || {
  echo "⚠️ rebase 冲突（很可能是 tunnel.json），自动 keep theirs"
  git checkout --theirs tunnel.json 2>/dev/null || true
  git add tunnel.json 2>/dev/null || true
  git rebase --continue || git rebase --abort
}

git push origin gh-pages
echo "✅ 部署完成"
