#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-8787}"
WORKER_URL="http://127.0.0.1:${PORT}"
SCREENSHOT_PATH="${ROOT_DIR}/.screenshots/edit-page.png"

cd "${ROOT_DIR}"

cleanup() {
  if [[ -n "${WORKER_PID:-}" ]]; then
    kill "${WORKER_PID}" >/dev/null 2>&1 || true
    wait "${WORKER_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

mkdir -p "${ROOT_DIR}/.screenshots"

wrangler dev --port "${PORT}" --ip 127.0.0.1 > "${ROOT_DIR}/.screenshots/guard-worker.log" 2>&1 &
WORKER_PID=$!

for attempt in $(seq 1 40); do
  if curl -sf "${WORKER_URL}/edit" >/dev/null 2>&1; then
    READY=true
    break
  fi
  sleep 0.5
done
if [[ "${READY:-false}" != "true" ]]; then
  echo "guard: worker did not become ready"
  exit 1
fi

playwright screenshot "${WORKER_URL}/edit" "${SCREENSHOT_PATH}"

SAVE_RESPONSE=$(curl -sS -H "content-type: application/json" \
  -d '{"title":"Playwright guard content","content":"<h2>Guard entry</h2><p>This is saved by Playwright guard.</p>"}' \
  -X POST "${WORKER_URL}/save")

echo "${SAVE_RESPONSE}" | grep -q '"ok":true'
POST_ID=$(echo "${SAVE_RESPONSE}" | node -e "const fs = require('node:fs'); const payload = JSON.parse(fs.readFileSync(0, 'utf8')); if (!payload.ok) process.exit(1); process.stdout.write(String(payload.id || ''));")
if [[ -z "${POST_ID}" ]]; then
  echo "guard: save response did not return id: ${SAVE_RESPONSE}"
  exit 1
fi

CONFIRM_RESPONSE=$(curl -sS "${WORKER_URL}/confirm?id=${POST_ID}")
echo "${CONFIRM_RESPONSE}" | grep -q '"ok":true'

echo "guard: save/confirm completed, screenshot at ${SCREENSHOT_PATH}"
