#!/bin/bash
# ======================================================================
# 自动检测 cloudflared tunnel URL 变化并同步到 gh-pages 的 tunnel.json
# 由 launchd 在 cloudflared 启动后调用，或定时轮询执行
# ======================================================================

set -euo pipefail
IFS=$'\n\t'

LOG_FILE="/Users/liaozhansheng/Library/Logs/cloudflared-apng/tunnel-sync.log"
STDERR_LOG="/Users/liaozhansheng/Library/Logs/cloudflared-apng/stderr.log"
GH_PAGES_DIR="/tmp/taobao-gh-pages"
REPO_URL="https://github.com/1299016404-netizen/taobao-marketing-tool.git"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"; }

# 等待 cloudflared 输出新 URL（最多等 30 秒）
wait_for_url() {
  local url=""
  for i in $(seq 1 15); do
    url=$(grep -oE "https://[a-z-]+\.trycloudflare\.com" "$STDERR_LOG" 2>/dev/null | tail -1 || true)
    if [ -n "$url" ]; then
      echo "$url"
      return 0
    fi
    sleep 2
  done
  return 1
}

# 获取当前 tunnel URL
NEW_URL=""
NEW_URL=$(wait_for_url || true)
if [ -z "$NEW_URL" ]; then
  log "ERROR: 30s within no tunnel URL detected"
  exit 1
fi
log "detected tunnel URL: $NEW_URL"

# 读取当前 gh-pages 上的 tunnel.json（如果存在）
CURRENT_URL=""
if [ -f "$GH_PAGES_DIR/tunnel.json" ]; then
  CURRENT_URL=$(python3 -c "import json;print(json.load(open('$GH_PAGES_DIR/tunnel.json')).get('url',''))" 2>/dev/null || true)
fi

# 如果 URL 没变，跳过
if [ "$NEW_URL" = "$CURRENT_URL" ]; then
  log "URL unchanged, skip sync"
  exit 0
fi

log "URL change: [$CURRENT_URL] -> [$NEW_URL], start sync to gh-pages"

# 确保 gh-pages worktree 存在
if [ ! -d "$GH_PAGES_DIR/.git" ]; then
  log "init gh-pages dir"
  rm -rf "$GH_PAGES_DIR"
  git clone --single-branch --branch gh-pages "$REPO_URL" "$GH_PAGES_DIR" 2>> "$LOG_FILE" || {
    log "ERROR: clone gh-pages failed"; exit 1;
  }
fi

# 更新 tunnel.json（fetch + reset 避免崩脱并发推送冲突）
cd "$GH_PAGES_DIR"
git fetch origin gh-pages 2>> "$LOG_FILE" || true
git reset --hard origin/gh-pages 2>> "$LOG_FILE" || true
echo "{\"url\":\"$NEW_URL\"}" > tunnel.json
git add tunnel.json
git commit -m "auto: update tunnel URL -> $NEW_URL" 2>> "$LOG_FILE" || { log "no diff, skip"; exit 0; }
# push 失败时重试一次（fetch + rebase + push）
if ! git push origin gh-pages 2>> "$LOG_FILE"; then
  log "push failed, retry with rebase"
  git fetch origin gh-pages 2>> "$LOG_FILE" || true
  git rebase origin/gh-pages 2>> "$LOG_FILE" || git rebase --abort 2>> "$LOG_FILE" || true
  git push origin gh-pages 2>> "$LOG_FILE" || { log "ERROR: push retry failed"; exit 1; }
fi

log "OK sync done: tunnel.json -> $NEW_URL"
