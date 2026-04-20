#!/usr/bin/env bash
# CloudDeck — Worker startup script for AWS EC2
# Resolves instance metadata via IMDSv2, writes .env, then starts the agent.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── AWS IMDSv2 metadata helpers ───────────────────────────────────────────────
_imds_token() {
  curl -sf -X PUT "http://169.254.169.254/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 60" 2>/dev/null || echo ""
}

_imds_get() {
  local path="$1"
  local token
  token=$(_imds_token)
  if [[ -n "$token" ]]; then
    curl -sf -H "X-aws-ec2-metadata-token: ${token}" \
      "http://169.254.169.254/latest/meta-data/${path}" 2>/dev/null || echo ""
  else
    # Fallback: IMDSv1 (disabled on hardened instances — will be empty)
    curl -sf "http://169.254.169.254/latest/meta-data/${path}" 2>/dev/null || echo ""
  fi
}

# ── Resolve addresses ─────────────────────────────────────────────────────────
PRIVATE_IP=$(_imds_get "local-ipv4")
PUBLIC_IP=$(_imds_get "public-ipv4")
REGION=$(_imds_get "placement/region")
AZ=$(_imds_get "placement/availability-zone")
INSTANCE_ID=$(_imds_get "instance-id")

# Fallback to env vars if metadata is unavailable (non-EC2 / local dev)
PRIVATE_IP="${PRIVATE_IP:-${NODE_PRIVATE_IP:-127.0.0.1}}"
PUBLIC_IP="${PUBLIC_IP:-${NODE_PUBLIC_IP:-127.0.0.1}}"
REGION="${REGION:-${REGION:-us-east-1}}"
AZ="${AZ:-${AZ:-us-east-1a}}"
INSTANCE_ID="${INSTANCE_ID:-$(hostname)}"

# ── Backend URL ───────────────────────────────────────────────────────────────
# BACKEND_PRIVATE_IP must be set — either via env or instance user-data
if [[ -z "${BACKEND_PRIVATE_IP:-}" ]]; then
  echo "[worker] ERROR: BACKEND_PRIVATE_IP is not set."
  echo "         Set it in /etc/environment or pass via EC2 user-data."
  exit 1
fi

BACKEND_URL="http://${BACKEND_PRIVATE_IP}:${BACKEND_PORT:-3001}"
NODE_ID="worker-${INSTANCE_ID}"

# ── Write .env ────────────────────────────────────────────────────────────────
cat > "${SCRIPT_DIR}/.env" <<EOF
NODE_ENV=production

# Backend (private VPC address)
BACKEND_URL=${BACKEND_URL}
WORKER_SECRET=${WORKER_SECRET:-}

# Node identity
NODE_ID=${NODE_ID}
NODE_PRIVATE_IP=${PRIVATE_IP}
NODE_PUBLIC_IP=${PUBLIC_IP}
NODE_IP=${PRIVATE_IP}
REGION=${REGION}
AVAILABILITY_ZONE=${AZ}

# Capacity
MAX_CONCURRENT_JOBS=${MAX_CONCURRENT_JOBS:-2}
PORT_RANGE_START=${PORT_RANGE_START:-4000}
PORT_RANGE_END=${PORT_RANGE_END:-5000}

# GitHub token for private repo cloning (optional)
GITHUB_TOKEN=${GITHUB_TOKEN:-}
EOF

echo "[worker] Node: ${NODE_ID}"
echo "[worker] Private IP: ${PRIVATE_IP}  Public IP: ${PUBLIC_IP}  Region: ${REGION}"
echo "[worker] Backend: ${BACKEND_URL}"

exec node "${SCRIPT_DIR}/index.js"
