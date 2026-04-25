#!/usr/bin/env bash
# divcalc.xyz — single-button full deploy
# Usage:
#   bash scripts/full_deploy.sh           # interactive (prompts before destructive ops)
#   bash scripts/full_deploy.sh --yes     # unattended (CI / scripted)
#   bash scripts/full_deploy.sh --staging # deploy to staging.divcalc.xyz instead
#
# What it does, in order:
#   1. Pre-flight checks (branch, working tree clean, deps ok)
#   2. Build apps/astro (with LAST_MOD env for sitemap)
#   3. Build apps/web (SPA)
#   4. Backup current /var/www/divcalc on VPS to .bak.<timestamp>
#   5. rsync/scp dist folders → VPS
#   6. systemctl reload caddy
#   7. Run scripts/smoke.sh against prod URL
#   8. If smoke FAIL → auto-rollback to backup, alert Telegram
#   9. If smoke PASS → IndexNow ping + Telegram success notification
#
# Env vars used (optional):
#   TG_TOKEN, TG_CHAT_ID  — Telegram notifications (passed through to smoke.sh)
#   DEPLOY_HOST           — override default 89.223.65.56
#   DEPLOY_USER           — override default root
#   SSH_KEY               — path to SSH key (default: ~/.ssh/id_rsa or id_ed25519)

set -uo pipefail

# ── Config ────────────────────────────────────────────────────────────────
DEPLOY_HOST="${DEPLOY_HOST:-89.223.65.56}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_TARGET="prod"
DEPLOY_URL="https://divcalc.xyz"
ASTRO_REMOTE="/var/www/divcalc/astro"
SPA_REMOTE="/var/www/divcalc/spa"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10"
[ -n "${SSH_KEY:-}" ] && SSH_OPTS="$SSH_OPTS -i $SSH_KEY"

YES="0"
for arg in "$@"; do
  case "$arg" in
    --yes|-y) YES="1" ;;
    --staging) DEPLOY_TARGET="staging"; DEPLOY_URL="https://staging.divcalc.xyz";
               ASTRO_REMOTE="/var/www/staging-divcalc/astro"
               SPA_REMOTE="/var/www/staging-divcalc/spa" ;;
    *) echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# ── Helpers ───────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

log()    { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $*"; }
ok()     { echo -e "${GREEN}✓${NC} $*"; }
warn()   { echo -e "${YELLOW}⚠${NC} $*"; }
err()    { echo -e "${RED}✗${NC} $*" >&2; }

confirm() {
  if [ "$YES" = "1" ]; then return 0; fi
  read -p "  $1 [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]]
}

tg_alert() {
  local emoji="$1" msg="$2"
  if [ -n "${TG_TOKEN:-}" ] && [ -n "${TG_CHAT_ID:-}" ]; then
    curl -sS -o /dev/null -X POST \
      "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
      --data-urlencode "chat_id=${TG_CHAT_ID}" \
      --data-urlencode "text=${emoji} <b>divcalc deploy</b>%0A${msg}" \
      --data "parse_mode=HTML" || true
  fi
}

# ── 1. Pre-flight ─────────────────────────────────────────────────────────
log "Pre-flight checks..."

BRANCH=$(git rev-parse --abbrev-ref HEAD)
ok "Branch: $BRANCH"
if [ "$BRANCH" != "refactor/v2" ] && [ "$BRANCH" != "main" ]; then
  warn "Deploying from non-standard branch: $BRANCH"
  confirm "Continue anyway?" || { err "Aborted by user"; exit 1; }
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  warn "Working tree has uncommitted changes"
  git status --short
  confirm "Deploy with uncommitted changes?" || { err "Aborted"; exit 1; }
fi

if ! command -v pnpm &>/dev/null; then err "pnpm not found"; exit 3; fi
if ! command -v scp &>/dev/null; then err "scp not found"; exit 3; fi
if ! command -v ssh &>/dev/null; then err "ssh not found"; exit 3; fi

ok "Tooling ok"

# Test SSH connection
if ! ssh $SSH_OPTS "${DEPLOY_USER}@${DEPLOY_HOST}" "echo ssh-ok" &>/dev/null; then
  err "SSH to ${DEPLOY_USER}@${DEPLOY_HOST} failed"; exit 4
fi
ok "SSH connection works"

COMMIT=$(git rev-parse --short HEAD)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
log "Deploying commit ${COMMIT} → ${DEPLOY_TARGET} (${DEPLOY_URL})"

if ! confirm "Continue with build + deploy?"; then
  err "Aborted"; exit 1
fi

# ── 2-3. Build ────────────────────────────────────────────────────────────
log "Building apps/astro (with sitemap LAST_MOD)..."
LAST_MOD=$(date -u +%Y-%m-%dT%H:%M:%SZ)
export LAST_MOD
if ! pnpm -C apps/astro build; then
  err "Astro build failed"
  tg_alert "🔴" "Astro build failed for commit ${COMMIT}"
  exit 5
fi
ok "Astro build done ($(du -sh apps/astro/dist | awk '{print $1}'))"

log "Building apps/web (SPA)..."
if ! pnpm -C apps/web build; then
  err "SPA build failed"
  tg_alert "🔴" "SPA build failed for commit ${COMMIT}"
  exit 5
fi
ok "SPA build done ($(du -sh apps/web/dist | awk '{print $1}'))"

# ── 4. Backup VPS ─────────────────────────────────────────────────────────
log "Backing up current VPS state → .bak.${TIMESTAMP}..."
ssh $SSH_OPTS "${DEPLOY_USER}@${DEPLOY_HOST}" "
  mkdir -p /var/www/divcalc.bak.${TIMESTAMP} &&
  cp -al ${ASTRO_REMOTE} /var/www/divcalc.bak.${TIMESTAMP}/astro 2>/dev/null || true &&
  cp -al ${SPA_REMOTE} /var/www/divcalc.bak.${TIMESTAMP}/spa 2>/dev/null || true &&
  echo 'backup-ok'
" || {
  err "Backup failed"; exit 6
}
ok "Backup created at /var/www/divcalc.bak.${TIMESTAMP}"

# ── 5. Deploy ─────────────────────────────────────────────────────────────
log "Uploading apps/astro/dist → ${ASTRO_REMOTE}/..."
ssh $SSH_OPTS "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p ${ASTRO_REMOTE}"
if ! scp $SSH_OPTS -rq apps/astro/dist/* "${DEPLOY_USER}@${DEPLOY_HOST}:${ASTRO_REMOTE}/"; then
  err "Astro scp failed"
  tg_alert "🔴" "scp astro failed; backup at .bak.${TIMESTAMP}"
  exit 7
fi
ok "Astro uploaded"

log "Uploading apps/web/dist → ${SPA_REMOTE}/..."
ssh $SSH_OPTS "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p ${SPA_REMOTE}"
if ! scp $SSH_OPTS -rq apps/web/dist/* "${DEPLOY_USER}@${DEPLOY_HOST}:${SPA_REMOTE}/"; then
  err "SPA scp failed"
  tg_alert "🔴" "scp spa failed; backup at .bak.${TIMESTAMP}"
  exit 7
fi
ok "SPA uploaded"

# ── 6. Reload Caddy ───────────────────────────────────────────────────────
log "Reloading Caddy..."
if ! ssh $SSH_OPTS "${DEPLOY_USER}@${DEPLOY_HOST}" "systemctl reload caddy"; then
  err "Caddy reload failed"
  tg_alert "🔴" "Caddy reload failed; backup at .bak.${TIMESTAMP}"
  exit 8
fi
ok "Caddy reloaded"

# Give Caddy a moment to settle
sleep 2

# ── 7. Smoke test ─────────────────────────────────────────────────────────
log "Running smoke test against ${DEPLOY_URL}..."
SMOKE_NOTIFY_OK=0 bash scripts/smoke.sh "${DEPLOY_URL}"
SMOKE_RC=$?

if [ $SMOKE_RC -ne 0 ]; then
  err "Smoke test FAILED — initiating rollback"
  tg_alert "🔴" "Smoke test failed for ${COMMIT}, rolling back to .bak.${TIMESTAMP}"

  ssh $SSH_OPTS "${DEPLOY_USER}@${DEPLOY_HOST}" "
    rm -rf ${ASTRO_REMOTE} ${SPA_REMOTE} &&
    mv /var/www/divcalc.bak.${TIMESTAMP}/astro ${ASTRO_REMOTE} &&
    mv /var/www/divcalc.bak.${TIMESTAMP}/spa ${SPA_REMOTE} &&
    rmdir /var/www/divcalc.bak.${TIMESTAMP} &&
    systemctl reload caddy
  " && {
    warn "Rolled back to previous state"
    tg_alert "🟡" "Rollback completed — site restored to pre-deploy state"
  } || {
    err "ROLLBACK ALSO FAILED — manual intervention required!"
    tg_alert "🔴🔴" "ROLLBACK FAILED for ${COMMIT} — manual intervention!"
  }
  exit 9
fi
ok "Smoke test PASSED"

# ── 8. IndexNow ──────────────────────────────────────────────────────────
if [ "$DEPLOY_TARGET" = "prod" ]; then
  log "IndexNow ping (Bing/Yandex)..."
  bash scripts/indexnow_ping.sh --sitemap >/dev/null 2>&1 && ok "IndexNow pinged" || warn "IndexNow ping failed (non-critical)"
fi

# ── 9. Cleanup old backups (keep last 5) ─────────────────────────────────
log "Cleaning old backups (keep last 5)..."
ssh $SSH_OPTS "${DEPLOY_USER}@${DEPLOY_HOST}" "
  ls -1dt /var/www/divcalc.bak.* 2>/dev/null | tail -n +6 | xargs -r rm -rf
" && ok "Old backups cleaned" || warn "Backup cleanup failed (non-critical)"

# ── Done ──────────────────────────────────────────────────────────────────
echo ""
ok "Deploy complete!"
echo ""
echo "  Commit:       ${COMMIT}"
echo "  Target:       ${DEPLOY_TARGET}"
echo "  URL:          ${DEPLOY_URL}"
echo "  Backup at:    /var/www/divcalc.bak.${TIMESTAMP} (on VPS)"
echo ""
tg_alert "🟢" "Deploy ${COMMIT} → ${DEPLOY_TARGET} successful%0A${DEPLOY_URL}"
