#!/bin/bash
# ======================================================================
# Tunnel 健康自愈守护（watchdog）
#   - 每 60 秒由 launchd 调用一次
#   - 从 stderr.log 提取当前最新 trycloudflare URL
#   - curl 探测：连续 2 次失败 → 强制重启 cloudflared
#   - 重启后 cloudflared 输出新 URL → WatchPaths 触发 update-tunnel-url.sh
#     → 自动 push 新 tunnel.json 到 gh-pages
#   - 形成闭环：故障 → 自愈 → 前端拿新 URL
# ======================================================================

set -uo pipefail

LOG_FILE="/Users/liaozhansheng/Library/Logs/cloudflared-apng/healthcheck.log"
STDERR_LOG="/Users/liaozhansheng/Library/Logs/cloudflared-apng/stderr.log"
FAIL_FLAG="/tmp/.tunnel-healthcheck-fail"
CLOUDFLARED_LABEL="com.liaozhansheng.apng-cloudflared-tunnel"
SYNC_SCRIPT="/Users/liaozhansheng/Qoder/taobao-marketing-tool/scripts/update-tunnel-url.sh"
MAX_CONSECUTIVE_FAILS=2

mkdir -p "$(dirname "$LOG_FILE")"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"; }

# 1) 从 stderr.log 拿最后一个 URL
CURRENT_URL=$(grep -oE "https://[a-z-]+\.trycloudflare\.com" "$STDERR_LOG" 2>/dev/null | tail -1)
if [ -z "$CURRENT_URL" ]; then
  log "WARN: stderr.log 里没有任何 URL，尝试 kick cloudflared"
  launchctl kickstart -k "gui/$(id -u)/$CLOUDFLARED_LABEL" 2>>"$LOG_FILE" || true
  exit 0
fi

# 2) curl 健康探测（/api/health 是 backend 提供的）
HTTP_CODE=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 "$CURRENT_URL/api/health" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
  # 健康，清零失败计数
  rm -f "$FAIL_FLAG"
  exit 0
fi

# 3) 失败 → 累计计数
FAIL_COUNT=1
if [ -f "$FAIL_FLAG" ]; then
  FAIL_COUNT=$(($(cat "$FAIL_FLAG" 2>/dev/null || echo 0) + 1))
fi
echo "$FAIL_COUNT" > "$FAIL_FLAG"
log "健康检查失败 [$FAIL_COUNT/$MAX_CONSECUTIVE_FAILS]: $CURRENT_URL → HTTP $HTTP_CODE"

if [ "$FAIL_COUNT" -ge "$MAX_CONSECUTIVE_FAILS" ]; then
  log "连续 $FAIL_COUNT 次失败，强制重启 cloudflared"
  # kickstart -k：强制 kill + 重启
  launchctl kickstart -k "gui/$(id -u)/$CLOUDFLARED_LABEL" 2>>"$LOG_FILE" || {
    log "ERROR: kickstart 失败，尝试 bootout + bootstrap"
    launchctl bootout "gui/$(id -u)/$CLOUDFLARED_LABEL" 2>>"$LOG_FILE" || true
    sleep 1
    launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/$CLOUDFLARED_LABEL.plist" 2>>"$LOG_FILE" || true
  }
  # 等 cloudflared 重新连接 + 写 URL 到 stderr
  sleep 20
  # 主动触发 sync（避免 WatchPaths 被 ThrottleInterval 限频）
  bash "$SYNC_SCRIPT" 2>>"$LOG_FILE" &
  rm -f "$FAIL_FLAG"
  log "已触发重启 + sync"
fi
