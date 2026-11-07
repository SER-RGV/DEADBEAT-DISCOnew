#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Arnés de QA de FASE 01 — preparación y ejecución en un comando.
#
# Portable: no exige apt ni `npx playwright install` (bloqueado aquí). Instala
# el Chromium headless de @sparticuz/chromium + playwright-core en un directorio
# de trabajo propio, extrae las librerías NSS que ese paquete distribuye y sirve
# el repositorio para las pruebas.
#
#   bash tools/fase01_qa/run.sh              # prepara (si hace falta) y ejecuta
#   bash tools/fase01_qa/run.sh --keep       # no reinstala, solo ejecuta
#   bash tools/fase01_qa/run.sh --setup-only # solo prepara el entorno
#
# Variables:
#   QA_WORK    directorio de trabajo   (def. ~/.dd_fase01_qa)
#   QA_PORT    puerto del servidor     (def. 8123)
#   QA_OUT     directorio de capturas  (def. $QA_WORK/out)
#   QA_CHROME  binario de Chromium     (def. lo resuelve el paquete)
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
QA="${QA_WORK:-$HOME/.dd_fase01_qa}"
PORT="${QA_PORT:-8123}"
MODE="${1:-}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "[qa] ERROR: falta '$1' en el sistema."; exit 1; }; }
need node
need python3
need tar

mkdir -p "$QA/out" "$QA/al"

install_env() {
  echo "[qa] instalando chromium headless + playwright-core en $QA"
  if [ ! -f "$QA/package.json" ]; then
    ( cd "$QA" && npm init -y >/dev/null 2>&1 ) || true
  fi
  ( cd "$QA" && npm i --silent @sparticuz/chromium@138.0.2 playwright-core@1.49.1 ) \
    || { echo "[qa] ERROR: fallo la instalación de npm. Revisa la conexión al registro."; exit 1; }
}

extract_libs() {
  local tarball="$QA/node_modules/@sparticuz/chromium/bin/al2023.tar.br"
  if [ ! -f "$tarball" ]; then
    echo "[qa] AVISO: el paquete no trae al2023.tar.br; se usará el LD_LIBRARY_PATH del sistema."
    return 0
  fi
  echo "[qa] extrayendo librerías NSS compartidas"
  node -e "
    const fs=require('fs'), z=require('zlib');
    fs.writeFileSync('$QA/al.tar', z.brotliDecompressSync(fs.readFileSync('$tarball')));
  " || { echo "[qa] ERROR: no se pudo descomprimir el tar de librerías."; exit 1; }
  tar -xf "$QA/al.tar" -C "$QA/al"
  rm -f "$QA/al.tar"
}

if [ "$MODE" != "--keep" ] || [ ! -d "$QA/node_modules" ]; then
  install_env
fi
extract_libs

echo "[qa] resolviendo el binario de Chromium"
node -e "
  const c=require('$QA/node_modules/@sparticuz/chromium');
  c.executablePath().then(p=>console.log('[qa] chromium:', p))
   .catch(e=>{console.error('[qa] ERROR: no se pudo extraer Chromium:', e.message);process.exit(1);});
" || exit 1

if [ "$MODE" = "--setup-only" ]; then
  echo "[qa] entorno preparado en $QA"
  exit 0
fi

echo "[qa] sirviendo $ROOT en 127.0.0.1:$PORT"
( cd "$ROOT" && python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 & echo $! > "$QA/httpd.pid" )
cleanup() { [ -f "$QA/httpd.pid" ] && kill "$(cat "$QA/httpd.pid")" 2>/dev/null || true; rm -f "$QA/httpd.pid"; }
trap cleanup EXIT
sleep 2

if ! curl -sf -o /dev/null "http://127.0.0.1:$PORT/index.html"; then
  echo "[qa] ERROR: el servidor no responde en el puerto $PORT."
  exit 1
fi

export QA_MODULES="$QA/node_modules"
export QA_WORK="$QA"
export QA_OUT="${QA_OUT:-$QA/out}"
export QA_URL="${QA_URL:-http://127.0.0.1:$PORT}"

cd "$QA"
node "$ROOT/tools/fase01_qa/suite.js"
