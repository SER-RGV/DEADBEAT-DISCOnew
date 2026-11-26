#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Un solo comando para ejecutar toda la QA del proyecto.
#
#   bash tools/qa/run.sh                 # suites rápidas
#   bash tools/qa/run.sh --all           # todas (visual y presupuestos incluidos)
#   bash tools/qa/run.sh --only=arranque # una suite concreta
#   bash tools/qa/run.sh --setup         # solo prepara el entorno
#
# Prepara node_modules con las versiones FIJADAS del navegador (las mismas que
# usa la CI) y delega en tools/qa/run.js. Requiere node >= 20 y tar.
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

need() { command -v "$1" >/dev/null 2>&1 || { echo "[qa] ERROR: falta '$1'."; exit 2; }; }
need node
need tar

if [ "${1:-}" = "--setup" ]; then
  npm ci --no-audit --no-fund
  node -e "require('./tools/qa/lib/chrome.js').resolveChrome().then(p=>console.log('[qa] Chromium:',p))"
  exit 0
fi

if [ ! -d node_modules/playwright-core ] || [ ! -d node_modules/@sparticuz/chromium ]; then
  echo "[qa] instalando dependencias fijadas (playwright-core + @sparticuz/chromium)…"
  npm ci --no-audit --no-fund
fi

exec node tools/qa/run.js "$@"
