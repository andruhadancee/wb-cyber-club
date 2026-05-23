#!/bin/sh
# Periodically renew Let's Encrypt certificates. Nginx reload happens via
# --deploy-hook (post-renew.sh), which only fires when a cert is actually renewed.
set -eu

command -v docker >/dev/null 2>&1 || apk add --no-cache docker-cli >/dev/null 2>&1

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [certbot] $*"; }

trap exit TERM INT

while :; do
  log "renew check"
  if certbot renew \
       --webroot -w /var/www/certbot \
       --non-interactive \
       --deploy-hook /scripts/post-renew.sh; then
    log "renew ok"
  else
    log "ERROR: certbot renew failed (exit $?)"
  fi
  sleep 12h &
  wait $!
done