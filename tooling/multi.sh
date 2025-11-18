#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v concurrently >/dev/null 2>&1; then
  echo "Error: 'concurrently' is not installed. Run 'npm install' before retrying." >&2
  exit 1
fi

if ! command -v caddy >/dev/null 2>&1; then
  echo "Error: 'caddy' is not available in PATH. Install Caddy to run the multi-instance stack." >&2
  exit 1
fi

concurrently --kill-others --names "bff-a,bff-b,caddy" \
  "WS_URL=ws://localhost:5183/elephant/ws PORT=5183 VITE_HMR_PORT=4901 VITE_DEV_SERVER_PORT=5173 HOST=localhost PROTOCOL=http BASE_URL=/elephant AUTH_POST_LOGOUT_URI=http://localhost:5183/elephant npm run dev" \
  "WS_URL=ws://localhost:5283/elephant/ws PORT=5283 VITE_HMR_PORT=5901 VITE_DEV_SERVER_PORT=5273 HOST=localhost PROTOCOL=http BASE_URL=/elephant AUTH_POST_LOGOUT_URI=http://localhost:5283/elephant npm run dev" \
  "caddy run --config Caddyfile --adapter caddyfile"
