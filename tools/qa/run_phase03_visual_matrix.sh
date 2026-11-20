#!/usr/bin/env bash
# Reproducible FASE 03.1 browser QA. Uses only the pinned npm packages and the
# bundled NSS libraries; does not install system packages or edit game sources.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
QA_WORK="${QA_WORK:-$HOME/.dd_fase01_qa}"
QA_PORT="${QA_PORT:-8124}"
QA_OUT="${QA_OUT:-$ROOT/docs/evidence/atuendos/fase03-capturas}"

if ! command -v curl >/dev/null 2>&1; then
  echo "[phase03-qa] ERROR: hace falta curl para comprobar el servidor local." >&2
  exit 2
fi
QA_WORK="$QA_WORK" bash "$ROOT/tools/fase01_qa/run.sh" --setup-only

python3 -m http.server "$QA_PORT" --bind 127.0.0.1 --directory "$ROOT" >/dev/null 2>&1 &
HTTP_PID=$!
cleanup() { kill "$HTTP_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
for _ in {1..40}; do
  if curl -fsS "http://127.0.0.1:$QA_PORT/index.html" -o /dev/null 2>/dev/null; then break; fi
  if ! kill -0 "$HTTP_PID" 2>/dev/null; then
    echo "[phase03-qa] ERROR: no se pudo iniciar el servidor en 127.0.0.1:$QA_PORT (puerto ocupado o bind denegado)." >&2
    exit 2
  fi
  sleep 0.25
done
if ! kill -0 "$HTTP_PID" 2>/dev/null || ! curl -fsS "http://127.0.0.1:$QA_PORT/index.html" -o /dev/null 2>/dev/null; then
  echo "[phase03-qa] ERROR: el servidor local no respondió en 127.0.0.1:$QA_PORT." >&2
  exit 2
fi

export QA_MODULES="$QA_WORK/node_modules"
export QA_WORK
export QA_OUT
export LD_LIBRARY_PATH="$QA_WORK/al/lib:/tmp:${LD_LIBRARY_PATH:-}"
export DD_CHROMIUM="$(node -e "require('$QA_WORK/node_modules/@sparticuz/chromium').executablePath().then(p=>process.stdout.write(p))")"
node "$ROOT/tools/qa/test_phase03_visual_matrix.js" "http://127.0.0.1:$QA_PORT" "$QA_OUT"
