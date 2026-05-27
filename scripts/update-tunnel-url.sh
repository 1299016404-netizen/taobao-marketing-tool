#!/bin/bash
# ======================================================================
# 自动检测 cloudflared tunnel URL 变化并同步到 gh-pages 的 tunnel.json
# 由 launchd 在 cloudflared 启动后调用，或定时轮询执行
# ======================================================================

set -euo pipefail

LOG_FILE="/Users/liaozhansheng/Library/Logs/cloudflared-apng/tunnel-sync.log"
STDERR_LOG="/Users/liaozhansheng/Library/Logs/cloudflared-apng/stderr.log"
GH_PAGES_DIR="/tmp/taobao-gh-pages"
REPO_URL="https://github.com/1299016404-netizen/taobao-marketing-tool.git"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"; }

# 等待 cloudflared 输出新 URL（最多等 30 秒）
wait_for_url() {
  for i in $(seq 1 15); do
    URL=$(grep -oE "https://[a-z-]+\.trycloudflare\.com" "$STDERR_LOG" 2>/dev/null | tail -1)
    if [ -n "$URL" ]; then
      echo "$URL"
      return 0
    fi
    sleep 2
  done
  return 1
}

# 获取当前 tunnel URL
NEW_URL=$(wait_for_url) || { log "ERROR: 30s 内未检测到 tunnel URL"; exit 1; }
log "检测到 tunnel URL: $NEW_URL"

# 读取当前 gh-pages 上的 tunnel.json（如果存在）
CURRENT_URL=""
if [ -f "$GH_PAGES_DIR/tunnel.json" ]; then
  CURRENT_URL=$(python3 -c "import json;print(json.load(open('$GH_PAGES_DIR/tunnel.json')).get('url',''))" 2>/dev/null || true)
fi

# 如果 URL 没变，跳过
if [ "$NEW_URL" = "$CURRENT_URL" ]; then
  log "URL 未变化，跳过同步"
  exit 0
fi

log "URL 变化: $CURRENT_URL → $NEW_URL，开始同步到 gh-pages"

# 确保 gh-pages worktree 存在
if [ ! -d "$GH_PAGES_DIR/.git" ]; then
  log "初始化 gh-pages 目录"
  rm -rf "$GH_PAGES_DIR"
  git clone --single-branch --branch gh-pages "$REPO_URL" "$GH_PAGES_DIR" 2>> "$LOG_FILE" || {
    log "ERROR: clone gh-pages 失败"; exit 1;
  }
fi

# 更新 tunnel.json
cd "$GH_PAGES_DIR"
git pull origin gh-pages --ff-only 2>> "$LOG_FILE" || true
echo "{\"url\":\"$NEW_URL\"}" > tunnel.json
git add tunnel.json
git commit -m "auto: update tunnel URL → $NEW_URL" 2>> "$LOG_FILE" || { log "无变化，跳过"; exit 0; }
git push origin gh-pages 2>> "$LOG_FILE" || { log "ERROR: push 失败"; exit 1; }

log "✅ 同步完成: tunnel.json → $NEW_URL"
