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

# Versiones FIJADAS del entorno de QA. Son las que se han ejecutado de verdad y
# se documentan en FASE_01_INFORME_FINAL.md. No usar rangos (^, ~, latest): una
# versión flotante haría que la misma suite midiera navegadores distintos.
QA_CHROMIUM_VERSION="@sparticuz/chromium@138.0.2"
QA_PLAYWRIGHT_VERSION="playwright-core@1.49.1"

# Instala SÓLO si hace falta. Antes se lanzaba `npm i` en cada ejecución, lo que
# reinstalaba el árbol entero aunque las versiones ya fueran las correctas
# (lento y no determinista si el registro cambiaba). Ahora se comprueba primero
# qué versión hay instalada y se informa de lo que se va a hacer.
install_env() {
  local c_inst p_inst
  c_inst=$(node -e "try{console.log(require('$QA/node_modules/@sparticuz/chromium/package.json').version)}catch(e){console.log('')}" 2>/dev/null)
  p_inst=$(node -e "try{console.log(require('$QA/node_modules/playwright-core/package.json').version)}catch(e){console.log('')}" 2>/dev/null)

  if [ "$c_inst" = "138.0.2" ] && [ "$p_inst" = "1.49.1" ]; then
    echo "[qa] entorno ya presente y con las versiones fijadas (chromium $c_inst · playwright-core $p_inst)"
    return 0
  fi

  echo "[qa] instalando entorno fijado en $QA (chromium=$QA_CHROMIUM_VERSION · playwright=$QA_PLAYWRIGHT_VERSION)"
  if [ -n "$c_inst" ] || [ -n "$p_inst" ]; then
    echo "[qa] versiones encontradas: chromium='${c_inst:-ninguna}' playwright='${p_inst:-ninguna}' -> se reemplazan por las fijadas"
  fi
  if [ ! -f "$QA/package.json" ]; then
    ( cd "$QA" && npm init -y >/dev/null 2>&1 ) || true
  fi
  ( cd "$QA" && npm i --silent "$QA_CHROMIUM_VERSION" "$QA_PLAYWRIGHT_VERSION" ) \
    || { echo "[qa] ERROR: fallo la instalación de npm. Revisa la conexión al registro."; exit 1; }

  # Verificación explícita: si tras instalar las versiones no coinciden, se para
  # con un mensaje claro en vez de ejecutar la suite con un entorno ambiguo.
  c_inst=$(node -e "console.log(require('$QA/node_modules/@sparticuz/chromium/package.json').version)" 2>/dev/null)
  p_inst=$(node -e "console.log(require('$QA/node_modules/playwright-core/package.json').version)" 2>/dev/null)
  if [ "$c_inst" != "138.0.2" ] || [ "$p_inst" != "1.49.1" ]; then
    echo "[qa] ERROR: el entorno instalado no coincide con las versiones fijadas."
    echo "[qa]        esperado chromium=138.0.2 playwright-core=1.49.1"
    echo "[qa]        obtenido chromium='$c_inst' playwright-core='$p_inst'"
    exit 1
  fi
  echo "[qa] entorno verificado: chromium $c_inst · playwright-core $p_inst"
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
