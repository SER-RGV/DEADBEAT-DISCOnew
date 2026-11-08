/* ==========================================================================
   Arnés de QA de FASE 01 — lanzador portable de Chromium headless.

   No requiere apt, ni `npx playwright install` (bloqueado en este entorno), ni
   GPU. Usa el Chromium que distribuye @sparticuz/chromium más las librerías NSS
   que el propio paquete trae empaquetadas, y lo controla por CDP con
   playwright-core.

   PORTABILIDAD
   ------------
   Ninguna ruta personal está escrita en el código. Todo sale de:
     1. Variables de entorno (prioridad máxima).
     2. Valores derivados del propio paquete instalado.
     3. Un directorio de trabajo por defecto bajo el usuario actual.

   Variables reconocidas:
     QA_MODULES   directorio con node_modules (@sparticuz/chromium, playwright-core)
     QA_WORK      directorio de trabajo del arnés (chromium extraído, libs, salida)
     QA_CHROME    ruta explícita al binario de Chromium
     QA_OUT       directorio de capturas y results.json
     QA_URL       base del servidor estático (por defecto http://127.0.0.1:8123)

   Uso:
     node tools/fase01_qa/suite.js            (con el repo servido en QA_URL)
     bash tools/fase01_qa/run.sh              (prepara todo y sirve el repo)
   ========================================================================== */
const fs = require('fs');
const os = require('os');
const path = require('path');

const WORK = process.env.QA_WORK || path.join(os.homedir(), '.dd_fase01_qa');
const MODULES = process.env.QA_MODULES || path.join(WORK, 'node_modules');
const OUT = process.env.QA_OUT || path.join(WORK, 'out');
const AL_LIB = path.join(WORK, 'al', 'lib');

function fail(msg) {
  console.error('\n[QA] ' + msg + '\n');
  process.exit(3);
}

/* require con un mensaje útil en lugar de un MODULE_NOT_FOUND críptico. */
function load(name) {
  try {
    return require(path.join(MODULES, name));
  } catch (e) {
    if (e && e.code === 'MODULE_NOT_FOUND') {
      fail(
        'No encuentro el módulo "' + name + '" en ' + MODULES + '.\n' +
        '      Ejecuta:  bash tools/fase01_qa/run.sh\n' +
        '      o define QA_MODULES apuntando a un node_modules que lo contenga.'
      );
    }
    throw e;
  }
}

const c = load('@sparticuz/chromium');
const { chromium: pw } = load('playwright-core');

/* El binario lo resuelve el PROPIO paquete; nunca una ruta fija. */
let chromePath = null;
async function resolveChrome() {
  if (process.env.QA_CHROME) {
    if (!fs.existsSync(process.env.QA_CHROME)) {
      fail('QA_CHROME apunta a un fichero que no existe: ' + process.env.QA_CHROME);
    }
    return process.env.QA_CHROME;
  }
  try {
    chromePath = await c.executablePath();
  } catch (e) {
    fail('No se pudo extraer el Chromium de @sparticuz/chromium: ' + e.message);
  }
  if (!chromePath || !fs.existsSync(chromePath)) {
    fail('Chromium no quedó disponible tras extraerlo: ' + chromePath);
  }
  return chromePath;
}

function ensureDirs() {
  [WORK, OUT, path.dirname(AL_LIB)].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

/* Las librerías NSS vienen empaquetadas en el propio @sparticuz/chromium. Si el
   directorio de trabajo aún no las tiene, se extraen aquí: así el arnés funciona
   desde un clon limpio sin depender de que run.sh las haya preparado antes. */
function ensureLibs() {
  if (process.platform === 'darwin') return;
  if (fs.existsSync(path.join(AL_LIB, 'libnss3.so'))) return;

  const tarBr = path.join(MODULES, '@sparticuz', 'chromium', 'bin', 'al2023.tar.br');
  if (!fs.existsSync(tarBr)) {
    console.warn('[QA] Aviso: el paquete no trae al2023.tar.br; se confía en las librerías del sistema.');
    return;
  }
  try {
    const zlib = require('zlib');
    const { execFileSync } = require('child_process');
    const tarPath = path.join(WORK, 'al2023.tar');
    fs.writeFileSync(tarPath, zlib.brotliDecompressSync(fs.readFileSync(tarBr)));
    fs.mkdirSync(path.dirname(AL_LIB), { recursive: true });
    execFileSync('tar', ['-xf', tarPath, '-C', path.dirname(AL_LIB)]);
    fs.unlinkSync(tarPath);
  } catch (e) {
    console.warn('[QA] Aviso: no se pudieron extraer las librerías NSS (' + e.message + ').');
  }
}

/* LD_LIBRARY_PATH: las libs del paquete primero, y el directorio del binario
   (swiftshader) después. En macOS no aplica. */
function libPathFor(chrome) {
  if (process.platform === 'darwin') return process.env.DYLD_LIBRARY_PATH || '';
  const parts = [];
  if (fs.existsSync(AL_LIB)) parts.push(AL_LIB);
  parts.push(path.dirname(chrome));
  return parts.join(':');
}

async function launch(w, h, opts) {
  ensureDirs();
  ensureLibs();
  const chrome = await resolveChrome();
  const env = Object.assign({}, process.env);
  const lp = libPathFor(chrome);
  if (process.platform === 'darwin') env.DYLD_LIBRARY_PATH = lp;
  else env.LD_LIBRARY_PATH = lp;

  let b;
  try {
    b = await pw.launch({
      executablePath: chrome,
      args: [...c.args, '--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
      env,
      headless: true
    });
  } catch (e) {
    fail(
      'Chromium no arrancó. Suele faltar alguna librería del sistema.\n' +
      '      Detalle: ' + String(e.message).split('\n')[0] + '\n' +
      '      Comprueba que existen las libs en ' + AL_LIB + '\n' +
      '      y que LD_LIBRARY_PATH las incluye (lo hace este arnés).'
    );
  }

  const p = await b.newPage(Object.assign({ viewport: { width: w, height: h } }, opts || {}));
  p.errs = [];
  p.on('pageerror', e => p.errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.errs.push('CONSOLE ' + m.text().slice(0, 180)); });
  p.on('requestfailed', r => p.errs.push('REQFAIL ' + r.url().slice(-60) + ' ' + (r.failure() && r.failure().errorText)));
  return { b, p };
}

/* Espera por ESTADO, nunca por tiempo: en este entorno el render va a ~2 fps y
   cualquier espera fija es una fuente de falsos negativos. */
async function waitState(p, want, ms) {
  const t0 = Date.now();
  const list = Array.isArray(want) ? want : [want];
  while (Date.now() - t0 < (ms || 180000)) {
    const s = await p.evaluate(() => (window.DD_BOOT ? window.DD_BOOT.getState().state : null)).catch(() => null);
    if (list.indexOf(s) >= 0) return Date.now() - t0;
    await p.waitForTimeout(120);
  }
  throw new Error('timeout esperando ' + list.join('|'));
}

const clean = arr => arr.filter(e => !/favicon/.test(e));

module.exports = { launch, waitState, clean, WORK, OUT, MODULES, AL_LIB, resolveChrome };
