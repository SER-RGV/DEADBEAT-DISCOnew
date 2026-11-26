/* ==========================================================================
   Lanzador de Chromium del arnés de QA.

   Por qué existe: ni `npx playwright install` ni los paquetes `apt` funcionan
   en todos los entornos de ejecución (CDN y réplicas de Debian bloqueados), y
   `@playwright/*` exige un navegador descargado aparte. Este módulo usa el
   Chromium que distribuye `@sparticuz/chromium`, que trae además —empaquetadas
   en `bin/al2023.tar.br`— las librerías compartidas (NSS, NSPR…) que el binario
   necesita. Se extraen al directorio de trabajo y se exponen por LD_LIBRARY_PATH.

   Así el mismo arnés corre en local y en GitHub Actions, sin diferencias.

   Variables de entorno
     QA_WORK      directorio de trabajo (def. ~/.dd_qa)
     QA_MODULES   node_modules con playwright-core y @sparticuz/chromium
                  (def. node_modules del repo; si no, QA_WORK/node_modules)
     QA_CHROME    ruta explícita a un binario de Chromium ya instalado
     QA_HEADED    si vale 1, abre ventana (solo para depurar a mano)
   ========================================================================== */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const WORK = process.env.QA_WORK || path.join(os.homedir(), '.dd_qa');
const AL_LIB = path.join(WORK, 'al', 'lib');

function modulesDir() {
  if (process.env.QA_MODULES) return process.env.QA_MODULES;
  const repoModules = path.resolve(__dirname, '..', '..', '..', 'node_modules');
  if (fs.existsSync(path.join(repoModules, 'playwright-core'))) return repoModules;
  return path.join(WORK, 'node_modules');
}
const MODULES = modulesDir();

function dep(name) {
  const candidates = [path.join(MODULES, name), name];
  for (const c of candidates) {
    try { return require(c); } catch (e) {
      if (!e || e.code !== 'MODULE_NOT_FOUND') throw e;
    }
  }
  throw new Error(
    'Falta el módulo "' + name + '". Ejecuta `npm ci` en la raíz del repositorio\n' +
    'o `bash tools/qa/run.sh` (descarga el entorno en ' + MODULES + ').'
  );
}

const chromiumPkg = dep('@sparticuz/chromium');
const { chromium } = dep('playwright-core');

function ensureWorkDir() {
  for (const d of [WORK, AL_LIB, path.join(WORK, 'out')]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

/* Extrae las librerías una sola vez por directorio de trabajo. */
function ensureSystemLibs() {
  if (process.platform === 'darwin') return;
  if (fs.existsSync(path.join(AL_LIB, 'libnss3.so'))) return;
  const tarball = path.join(MODULES, '@sparticuz', 'chromium', 'bin', 'al2023.tar.br');
  if (!fs.existsSync(tarball)) return;
  const zlib = require('zlib');
  const tarPath = path.join(WORK, 'al2023.tar');
  fs.writeFileSync(tarPath, zlib.brotliDecompressSync(fs.readFileSync(tarball)));
  fs.mkdirSync(path.dirname(AL_LIB), { recursive: true });
  execFileSync('tar', ['-xf', tarPath, '-C', path.dirname(AL_LIB)]);
  fs.unlinkSync(tarPath);
}

async function resolveChrome() {
  if (process.env.QA_CHROME) {
    if (!fs.existsSync(process.env.QA_CHROME)) {
      throw new Error('QA_CHROME no existe: ' + process.env.QA_CHROME);
    }
    return process.env.QA_CHROME;
  }
  const exe = await chromiumPkg.executablePath();
  if (!exe || !fs.existsSync(exe)) throw new Error('No se pudo extraer el Chromium de @sparticuz/chromium');
  return exe;
}

function libraryPath(chrome) {
  const parts = [];
  if (fs.existsSync(AL_LIB)) parts.push(AL_LIB);
  parts.push(path.dirname(chrome));
  if (process.env.LD_LIBRARY_PATH) parts.push(process.env.LD_LIBRARY_PATH);
  return parts.join(':');
}

/* Ruido conocido que no es un defecto del juego: el aviso de canvas 2D del
   navegador aparece en cada contexto nuevo y no depende del proyecto. */
const IGNORED = [
  /willReadFrequently/,
  /favicon/i,
  /Failed to load resource: net::ERR_ABORTED.*favicon/i
];

function isIgnored(text) {
  return IGNORED.some((r) => r.test(String(text || '')));
}

/**
 * Arranca un navegador y devuelve una página con el registro de problemas.
 * @returns {Promise<{browser, page, errors, close}>}
 */
async function open(opts) {
  const o = opts || {};
  ensureWorkDir();
  ensureSystemLibs();
  const chrome = await resolveChrome();

  const browser = await chromium.launch({
    executablePath: chrome,
    headless: !process.env.QA_HEADED,
    args: [
      ...chromiumPkg.args,
      '--no-sandbox',
      '--autoplay-policy=no-user-gesture-required',
      '--force-device-scale-factor=1'
    ],
    env: { ...process.env, LD_LIBRARY_PATH: libraryPath(chrome) }
  });

  const context = await browser.newContext({
    viewport: { width: o.width || 1280, height: o.height || 900 },
    deviceScaleFactor: o.deviceScaleFactor || 1,
    hasTouch: !!o.hasTouch,
    isMobile: false,
    reducedMotion: o.reducedMotion || 'no-preference'
  });

  const page = await context.newPage();
  const errors = [];
  const push = (kind, text, url) => {
    if (isIgnored(text) || isIgnored(url)) return;
    errors.push({ kind, text: String(text || '').slice(0, 300), url: url ? String(url).slice(0, 200) : '' });
  };

  page.on('pageerror', (e) => push('pageerror', e.message));
  page.on('console', (m) => { if (m.type() === 'error') push('console', m.text()); });
  page.on('requestfailed', (r) => {
    const f = r.failure();
    push('requestfailed', (f && f.errorText) || 'failed', r.url());
  });
  page.on('response', (r) => {
    if (r.status() >= 400) push('http', 'HTTP ' + r.status(), r.url());
  });

  /* Los errores de red del favicon no cuentan como 404 del juego, pero sí se
     informan aparte para no ocultar nada. */
  const close = async () => { try { await browser.close(); } catch (e) {} };

  return { browser, context, page, errors, close };
}

module.exports = { open, WORK, MODULES, AL_LIB, resolveChrome, isIgnored };
