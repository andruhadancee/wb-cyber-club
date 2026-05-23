#!/bin/sh
# Runs after a successful certificate renewal. Reloads nginx in-place by
# sending HUP to the nginx container (graceful, no downtime).
set -eu

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [post-renew] $*"; }

cid=$(docker ps -q -f label=com.docker.compose.service=nginx | head -n1)
if [ -z "$cid" ]; then
  log "ERROR: nginx container not found"
  exit 1
fi

docker kill --signal=HUP "$cid" >/dev/null
log "nginx reloaded ($cid)"