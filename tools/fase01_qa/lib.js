/* Arnés de QA de FASE 01 — lanzador de Chromium sin dependencias del sistema.

   Chromium headless (@sparticuz/chromium) + las 12 librerías NSS que trae la
   propia distro empaquetada, extraídas a _qa/al/lib. Se controla por CDP con
   playwright-core. No requiere apt, ni `playwright install`, ni GPU.

   Uso:  node qa/suite.js   (con un servidor estático en 127.0.0.1:8123)
   ---------------------------------------------------------------------- */
const c = require(process.env.QA_MODULES ? process.env.QA_MODULES + '/@sparticuz/chromium' : '@sparticuz/chromium');
const { chromium: pw } = require(process.env.QA_MODULES ? process.env.QA_MODULES + '/playwright-core' : 'playwright-core');

const CHROME = '/tmp/chromium';
const AL_LIB = '/home/user/_qa/al/lib';

async function launch(w, h, opts) {
  const b = await pw.launch({
    executablePath: CHROME,
    args: [...c.args, '--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
    env: { ...process.env, LD_LIBRARY_PATH: AL_LIB + ':/tmp' },
    headless: true
  });
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

module.exports = { launch, waitState, clean };
