#!/bin/bash
# Auto-update script — monitors external data sources and refreshes translations.
# Run via cron on the Contabo VPS. See crontab install notes at the bottom.
set -e

REPO_DIR="/var/www/divcalc"
LOG_FILE="/var/log/divcalc-autoupdate.log"
STATE_FILE="/var/lib/divcalc-autoupdate.json"
TG_BOT_TOKEN="${TG_BOT_TOKEN:-}"   # optional, set in cron env
TG_CHAT_ID="${TG_CHAT_ID:-}"       # optional

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

notify_tg() {
  if [ -n "$TG_BOT_TOKEN" ] && [ -n "$TG_CHAT_ID" ]; then
    curl -s -X POST "https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage" \
      -d chat_id="$TG_CHAT_ID" \
      -d text="$1" > /dev/null || true
  fi
}

cd "$REPO_DIR"

# 1. Pull latest from our own repo first
log "git pull..."
git pull origin master >> "$LOG_FILE" 2>&1 || true

# 2. Check faildruid/division-2-db for new commits
log "Checking faildruid/division-2-db for updates..."
LATEST_SHA=$(curl -s "https://api.github.com/repos/faildruid/division-2-db/commits/develop" | grep -oP '"sha":\s*"\K[a-f0-9]+' | head -1)
LAST_KNOWN=$(cat "$STATE_FILE" 2>/dev/null | grep -oP '"faildruid_sha":\s*"\K[a-f0-9]+' || echo "")

if [ -z "$LATEST_SHA" ]; then
  log "Could not fetch faildruid SHA — network issue, skipping"
  exit 0
fi

if [ "$LATEST_SHA" = "$LAST_KNOWN" ]; then
  log "No updates (current SHA: ${LATEST_SHA:0:7})"
  exit 0
fi

log "New faildruid commit detected: ${LATEST_SHA:0:7} (was ${LAST_KNOWN:0:7})"

# 3. Run translator (which fetches authoritative talents from faildruid)
log "Running translate_items.js..."
if node scripts/translate_items.js >> "$LOG_FILE" 2>&1; then
  log "Translator finished OK"
else
  log "Translator failed — skipping commit"
  exit 1
fi

# 4. Check if translations_en.json actually changed
if git diff --quiet translations_en.json 2>/dev/null; then
  log "No translation changes — just updating state file"
else
  log "Translations changed — committing..."
  git add translations_en.json
  git -c user.name="divcalc-autobot" -c user.email="bot@divcalc.xyz" \
    commit -m "Auto: update translations from faildruid (${LATEST_SHA:0:7})" >> "$LOG_FILE" 2>&1 || true
  # Note: push requires SSH deploy key or PAT configured in git config
  git push origin master >> "$LOG_FILE" 2>&1 && log "Pushed to GitHub" || log "Push failed (check auth)"
  notify_tg "🤖 divcalc auto-update: подтянул свежие данные из faildruid (${LATEST_SHA:0:7})"
fi

# 5. Save state
mkdir -p "$(dirname "$STATE_FILE")"
echo "{\"faildruid_sha\":\"${LATEST_SHA}\",\"updated_at\":\"$(date -Iseconds)\"}" > "$STATE_FILE"

log "Done"

# ============================================================================
# INSTALL AS CRON:
#   chmod +x /var/www/divcalc/scripts/auto_update.sh
#   crontab -e, add line:
#   0 4 * * * TG_BOT_TOKEN=xxx TG_CHAT_ID=398299572 /var/www/divcalc/scripts/auto_update.sh
#
# This runs daily at 04:00 server time. Adjust if needed.
# ============================================================================
