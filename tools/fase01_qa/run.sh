#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Prepara el arnés de QA de FASE 01 y ejecuta la suite A–G.
#
# No usa `npx playwright install` (bloqueado en este entorno) ni apt. Usa el
# Chromium headless de @sparticuz/chromium y extrae las librerías NSS que el
# propio paquete distribuye.
#
#   bash tools/fase01_qa/run.sh            # prepara + ejecuta
#   bash tools/fase01_qa/run.sh --keep     # reutiliza el entorno ya preparado
# ---------------------------------------------------------------------------
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
QA="${QA_DIR:-/home/user/_qa}"
PORT="${QA_PORT:-8123}"

if [ "${1:-}" != "--keep" ] || [ ! -d "$QA/node_modules" ]; then
  mkdir -p "$QA/al" "$QA/out"
  echo "[qa] instalando chromium headless + playwright-core…"
  ( cd "$QA" && npm init -y >/dev/null 2>&1 || true
    npm i --silent @sparticuz/chromium@138.0.2 playwright-core@1.49.1 >/dev/null )
  echo "[qa] extrayendo librerías NSS…"
  node -e "const fs=require('fs'),z=require('zlib');
    fs.writeFileSync('/tmp/al2023.tar', z.brotliDecompressSync(fs.readFileSync('$QA/node_modules/@sparticuz/chromium/bin/al2023.tar.br')))"
  tar -xf /tmp/al2023.tar -C "$QA/al"
fi

node -e "require('$QA/node_modules/@sparticuz/chromium').executablePath().then(p=>console.log('[qa] chromium en',p))"

echo "[qa] sirviendo $ROOT en :$PORT"
( cd "$ROOT" && python3 -m http.server "$PORT" --bind 0.0.0.0 >/dev/null 2>&1 & echo $! > /tmp/dd_qa_httpd.pid )
trap 'kill "$(cat /tmp/dd_qa_httpd.pid)" 2>/dev/null || true' EXIT
sleep 2

export QA_MODULES="$QA/node_modules"
cd "$QA" && QA_ROOT="$ROOT" node "$ROOT/tools/fase01_qa/suite.js"
