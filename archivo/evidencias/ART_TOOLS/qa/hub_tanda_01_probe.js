/* ============================================================================
 * HUB · TANDA 01 — sonda de runtime (solo lectura)
 * ----------------------------------------------------------------------------
 * Se ejecuta con Playwright/Chromium sobre la build activa. No modifica el
 * juego: solo envuelve registros ya existentes para observar qué claves V5
 * consume el HUB real, con qué transformaciones se dibujan y qué estado
 * tiene la integración de tandas anteriores.
 *
 * Uso:
 *   QA_LIB=/tmp/qatools/node_modules/playwright-core \
 *   node ART_TOOLS/qa/hub_tanda_01_probe.js <url> <prefijo_salida> [json_salida]
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.QA_LIB || 'playwright-core');

const URL = process.argv[2] || 'http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html';
const PREFIX = process.argv[3] || 'before';
const OUTDIR = process.env.OUTDIR || path.join(__dirname, '..', '..', 'ART_EVIDENCE', 'hub', 'tanda_01');
const JSON_OUT = process.argv[4] || path.join(OUTDIR, PREFIX + '_runtime.json');

const INIT = `(() => {
  const W = window;
  W.__HUBPROBE = { v5Gets: {}, v5Fn: {}, draws: {}, hubDraws: {}, errors: [], httpErrors: [] };
  const P = W.__HUBPROBE;

  /* Registro V5 vivo: se proxya para saber qué claves lee el pintor del HUB. */
  let _v5 = null;
  Object.defineProperty(W, '__DDM_V5_IMG', {
    configurable: true,
    get() { return _v5; },
    set(v) {
      if (!v || typeof v !== 'object' || v.__hubProxied) { _v5 = v; return; }
      const target = v;
      _v5 = new Proxy(target, {
        get(t, k) {
          if (typeof k === 'string') {
            P.v5Gets[k] = (P.v5Gets[k] || 0) + 1;
            const im = t[k];
            if (im && typeof im === 'object') { try { im.__v5key = k; } catch (e) {} }
          }
          return Reflect.get(t, k);
        },
        set(t, k, val) {
          if (typeof k === 'string' && val && typeof val === 'object') {
            try { val.__v5key = k; } catch (e) {}
          }
          return Reflect.set(t, k, val);
        }
      });
      Object.defineProperty(_v5, '__hubProxied', { value: true });
    }
  });

  /* __DDM_GET_V5: se envuelve la función asignada por el motor. */
  let _get = null;
  Object.defineProperty(W, '__DDM_GET_V5', {
    configurable: true,
    get() { return _get; },
    set(f) {
      _get = (typeof f === 'function') ? function (k) {
        if (typeof k === 'string') P.v5Fn[k] = (P.v5Fn[k] || 0) + 1;
        const im = f.apply(this, arguments);
        if (im && typeof k === 'string') { try { im.__v5key = k; } catch (e) {} }
        return im;
      } : f;
    }
  });

  /* drawImage: solo cuenta las imágenes V5 etiquetadas (sin tocar el dibujo). */
  const orig = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (src) {
    const t = src && src.__hubTanda01;
    if (t) {
      const q = P.hubDraws[t] || (P.hubDraws[t] = { count: 0, args: {} });
      q.count++;
      q.args[arguments.length] = (q.args[arguments.length] || 0) + 1;
    }
    const k = src && src.__v5key;
    if (k && arguments.length >= 5) {
      const a = arguments;
      const d = P.draws[k] || (P.draws[k] = { count: 0, natural: null, sample: null });
      d.count++;
      d.natural = [src.naturalWidth || src.width, src.naturalHeight || src.height];
      if (!d.sample) d.sample = { dx: Math.round(a[1]), dy: Math.round(a[2]),
                                  dw: Math.round(a[3]), dh: Math.round(a[4]) };
    }
    return orig.apply(this, arguments);
  };
  W.addEventListener('error', e => P.errors.push(String(e.message).slice(0, 200)));
})()`;

async function bootToHub(page) {
  await page.mouse.click(640, 450);
  await page.waitForTimeout(600);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
  await page.keyboard.down('Escape');
  await page.waitForTimeout(2800);
  await page.keyboard.up('Escape');
  await page.waitForTimeout(900);
}

const PROBE = `(() => {
  const W = window, safe = f => { try { return f(); } catch (e) { return 'ERR:' + e.message; } };
  return {
    ts: new Date().toISOString(),
    url: location.href,
    hub: safe(() => W.DMO_HUB.state()),
    artPack: safe(() => W.DMO_ART_PACK.state()),
    integrity: safe(() => W.DMO_ART_PACK.integrity()),
    architecture: safe(() => W.DMO_ART_PACK.architecture()),
    player: safe(() => { const p = W.DMO_ART_PACK.player(); return { version: p.version,
      poses: (p.poses || []).length, errors: p.errors }; }),
    t3b: safe(() => ({ enabled: W.__T3B.enabled, revision: W.__T3B.revision,
      ready: W.__T3B.ready.slice(), errors: W.__T3B.errors.slice(),
      images: W.__T3B.images.map(i => i && i.naturalWidth ? [i.naturalWidth, i.naturalHeight] : null),
      draws: W.__T3B.draws.slice(-8) })),
    v5: safe(() => { const s = W.DMO_REFERENCE_ROOM_ASSETS.state();
      return { ready: Object.keys(s.v5Ready).filter(k => s.v5Ready[k]).length,
               total: Object.keys(s.v5Ready).length, errors: s.errors.slice(),
               placements: s.placements }; }),
    ddmAssetPack: safe(() => W.DDM_ASSET_PACK.status()),
    hubPack: safe(() => W.DMO_ART_PACK.hub()),
    hubFloor: safe(() => W.__T3B_HUB_QA.state()),
    hubDraws: W.__HUBPROBE.hubDraws,
    v5Gets: W.__HUBPROBE.v5Gets,
    v5Fn: W.__HUBPROBE.v5Fn,
    draws: W.__HUBPROBE.draws,
    pageErrors: W.__HUBPROBE.errors
  };
})()`;

(async () => {
  fs.mkdirSync(OUTDIR, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/tmp/chromium',
    headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: process.env.LD_LIB_PATH || '/tmp/chromelibs/lib:/tmp' },
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
           '--use-gl=swiftshader', '--disable-background-networking',
           '--disable-logging', '--log-level=3']
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const consoleErrors = [], pageErrors = [], httpErrors = [], requestFailed = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 220)); });
  page.on('pageerror', e => pageErrors.push(String(e.message).slice(0, 220)));
  page.on('response', r => { if (r.status() >= 400) httpErrors.push({ status: r.status(), url: r.url().slice(0, 160) }); });
  page.on('requestfailed', r => requestFailed.push({ url: r.url().slice(0, 160), failure: r.failure() && r.failure().errorText }));
  await page.addInitScript(INIT);
  const t0 = Date.now();
  await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(1800);
  await bootToHub(page);
  /* Fuerza una reconstrucción de la única caché de imagen del HUB con las
     etiquetas ya puestas, para que el conteo de drawImage sea completo. */
  await page.evaluate(() => {
    try { window.DMO_ART_PACK.hubTag(); } catch (e) {}
    try { window.__DDM_V5_MED_NO_SKULL = null; } catch (e) {}
  });
  await page.waitForTimeout(900);
  const shotPath = path.join(OUTDIR, PREFIX + '_01_hub.png');
  await page.screenshot({ path: shotPath, timeout: 60000 });
  const data = await page.evaluate(PROBE);
  data.loadMs = loadMs;
  data.shot = path.basename(shotPath);
  data.consoleErrors = consoleErrors;
  data.pageErrorsThrown = pageErrors;
  data.httpErrors = httpErrors;
  data.requestFailed = requestFailed;
  fs.writeFileSync(JSON_OUT, JSON.stringify(data, null, 2));
  console.log('loadMs', loadMs, '| hub.location', data.hub && data.hub.location,
    '| artPack', data.artPack && data.artPack.status,
    '| player', JSON.stringify(data.player));
  console.log('V5 keys read in HUB:', Object.keys(data.v5Gets || {}).length,
    '| drawn:', Object.keys(data.draws || {}).length);
  if (data.hubPack) console.log('HUB pack applied:', data.hubPack.applied + '/' + data.hubPack.count,
    '| slots:', data.hubPack.slotsApplied, '| errors:', data.hubPack.errors.length);
  console.log('HUB-xx drawImage counts:', JSON.stringify(data.hubDraws));
  console.log('consoleErrors', consoleErrors.length, 'pageErrors', pageErrors.length,
    'httpErrors', httpErrors.length);
  console.log('JSON:', JSON_OUT, 'SHOT:', shotPath);
  await browser.close();
})().catch(e => { console.error('PROBE FAIL', e); process.exit(1); });
