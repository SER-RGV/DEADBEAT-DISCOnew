/* ============================================================================
 * HUB · TANDA 02 — sonda de AUDITORÍA VISUAL (solo lectura)
 * ----------------------------------------------------------------------------
 * No modifica el juego: proxya el registro V5 ya existente, envuelve
 * __DDM_GET_V5 y drawImage, recorre el HUB con la cámara real del motor y
 * registra, por clave de slot:
 *   - número de drawImage con caja de 5/9 argumentos
 *   - dimensiones naturales del recurso que el motor sirve HOY
 *   - caja de dibujo de muestra
 *   - si ya fue sustituido por la Tanda 01 (etiqueta __hubTanda01)
 *   - si pertenece a la familia modular de Tanda 02 anterior (alias t02_)
 * También guarda capturas reales por zona para la auditoría visual.
 *
 * Uso:
 *   QA_LIB=/tmp/qatools/node_modules/playwright-core \
 *   node ART_TOOLS/qa/hub_tanda_02_audit.js [url] [dirname_salida]
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.QA_LIB || 'playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.env.OUTDIR || path.join(ROOT, 'ART_EVIDENCE', 'hub', 'tanda_02');
const URL = process.argv[2] || 'http://127.0.0.1:8123/';
const JSON_OUT = path.join(OUT, 'audit_runtime.json');
fs.mkdirSync(OUT, { recursive: true });

const INIT = `(() => {
  const W = window;
  const P = W.__HUB2AUDIT = { draws: {}, gets: {}, fn: {}, errors: [], tags: {} };
  let _v5 = null;
  Object.defineProperty(W, '__DDM_V5_IMG', {
    configurable: true,
    get() { return _v5; },
    set(v) {
      if (!v || typeof v !== 'object' || v.__hub2Proxied) { _v5 = v; return; }
      const target = v;
      _v5 = new Proxy(target, {
        get(t, k) {
          if (typeof k === 'string') {
            P.gets[k] = (P.gets[k] || 0) + 1;
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
      Object.defineProperty(_v5, '__hub2Proxied', { value: true });
    }
  });
  let _get = null;
  Object.defineProperty(W, '__DDM_GET_V5', {
    configurable: true,
    get() { return _get; },
    set(f) {
      _get = (typeof f === 'function') ? function (k) {
        if (typeof k === 'string') P.fn[k] = (P.fn[k] || 0) + 1;
        const im = f.apply(this, arguments);
        if (im && typeof k === 'string') { try { im.__v5key = k; } catch (e) {} }
        return im;
      } : f;
    }
  });
  const orig = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (src) {
    const k = src && src.__v5key;
    if (k) {
      const d = P.draws[k] || (P.draws[k] = { count: 0, boxes: [], natural: null,
                                               args: {}, tag: null, canvas: null });
      d.count++;
      d.args[arguments.length] = (d.args[arguments.length] || 0) + 1;
      d.natural = [src.naturalWidth || src.width || 0, src.naturalHeight || src.height || 0];
      d.tag = src.__hubTanda01 || null;
      d.canvas = (src instanceof HTMLCanvasElement) ? 'canvas' : 'image';
      if (arguments.length >= 5 && d.boxes.length < 4) {
        const a = arguments;
        d.boxes.push([Math.round(a[1]), Math.round(a[2]), Math.round(a[3]), Math.round(a[4])]);
      }
    }
    return orig.apply(this, arguments);
  };
  W.addEventListener('error', e => P.errors.push(String(e.message).slice(0, 200)));
})()`;

async function bootToHub(page) {
  await page.mouse.click(640, 450); await page.waitForTimeout(600);
  await page.keyboard.press('Enter'); await page.waitForTimeout(900);
  await page.keyboard.down('Escape'); await page.waitForTimeout(2800);
  await page.keyboard.up('Escape'); await page.waitForTimeout(900);
}

const ZONES = [
  ['centro', 1250, 935], ['dj', 1250, 445], ['barra', 1910, 845],
  ['vip_oeste', 785, 545], ['vip_este', 1715, 545],
  ['descenso', 1250, 1365], ['oeste', 480, 965], ['este', 2050, 965],
  ['norte', 1250, 300], ['sur', 1250, 1500]
];

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/tmp/chromium', headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: process.env.LD_LIB_PATH || '/tmp/chromelibs/lib:/tmp' },
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
           '--use-gl=swiftshader', '--disable-background-networking',
           '--disable-logging', '--log-level=3']
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const local404 = [], pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e.message).slice(0, 200)));
  page.on('response', r => {
    if (r.status() >= 400 && r.url().indexOf(':8123') >= 0)
      local404.push(r.status() + ' ' + r.url().split('/').pop().slice(0, 80));
  });
  await page.addInitScript(INIT);
  const t0 = Date.now();
  const resp = await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => window.DMO_ART_PACK &&
    window.DMO_ART_PACK.state().status === 'applied', { timeout: 60000 });
  await bootToHub(page);
  await page.evaluate(() => { try { window.DMO_ART_PACK.hubTag(); } catch (e) {} });
  await page.waitForTimeout(900);

  /* Se reinicia el conteo YA en el HUB: lo medido antes pertenecía al menú
     y a la cinemática de entrada. Así el inventario es estrictamente del HUB. */
  await page.evaluate(() => { window.__HUB2AUDIT.draws = {}; });
  const shots = {}, zoneFirst = {};
  for (const [name, x, y] of ZONES) {
    await page.evaluate(([px, py]) => {
      try { window.DMO.debug.teleport(px, py); } catch (e) {}
    }, [x, y]);
    await page.waitForTimeout(650);
    const f = 'audit_' + name + '.png';
    await page.screenshot({ path: path.join(OUT, f) });
    shots[name] = { file: f, at: [x, y] };
    const keys = await page.evaluate(() => Object.keys(window.__HUB2AUDIT.draws));
    keys.forEach(k => { if (!zoneFirst[k]) zoneFirst[k] = name; });
  }
  await page.evaluate((zf) => { window.__HUB2AUDIT.zoneFirst = zf; }, zoneFirst);

  const out = await page.evaluate(() => {
    const W = window, P = W.__HUB2AUDIT;
    const safe = f => { try { return f(); } catch (e) { return 'ERR:' + e.message; } };
    const rows = Object.keys(P.draws).map(k => ({
      slot: k, draws: P.draws[k].count, natural: P.draws[k].natural,
      boxes: P.draws[k].boxes, args: P.draws[k].args,
      tag: P.draws[k].tag, source: P.draws[k].canvas,
      zoneFirst: (P.zoneFirst || {})[k] || null,
      gets: P.gets[k] || 0, fn: P.fn[k] || 0
    })).sort((a, b) => b.draws - a.draws);
    return {
      ts: new Date().toISOString(), url: location.href,
      hub: safe(() => { const a = W.DMO_HUB.audit(); return { ok: a.ok,
        location: a.location, zones: a.zonesCount, stations: a.stationsCount }; }),
      state: safe(() => W.DMO_ART_PACK.state().status),
      version: safe(() => W.DMO_ART_PACK.state().version),
      hubPack: safe(() => { const h = W.DMO_ART_PACK.hub(); return { applied: h.applied,
        count: h.count, enabled: h.enabled, errors: h.errors }; }),
      v5Keys: Object.keys(W.__DDM_V5_IMG || {}).length,
      drawnSlots: rows.length,
      allGets: P.gets,
      allFn: P.fn,
      registrySizes: Object.keys(W.__DDM_V5_IMG || {}).reduce((o, k) => {
        const im = W.__DDM_V5_IMG[k];
        o[k] = im ? [im.naturalWidth || im.width || 0, im.naturalHeight || im.height || 0] : null;
        return o;
      }, {}),
      rows: rows,
      taggedT01: rows.filter(r => r.tag).map(r => r.slot),
      aliasT02: rows.filter(r => /^t02_/.test(r.slot)).map(r => r.slot),
      aliasH01: rows.filter(r => /^h01_/.test(r.slot)).map(r => r.slot),
      errors: P.errors
    };
  });
  out.httpStatus = resp && resp.status();
  out.loadMs = Date.now() - t0;
  out.shots = shots;
  out.pageErrors = pageErrors;
  out.local404 = local404;
  fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 2));
  console.log('AUDITORÍA:', out.drawnSlots, 'slots dibujados /', out.v5Keys, 'claves V5');
  console.log('T01 etiquetados:', out.taggedT01.length, '| aliases t02:', out.aliasT02.length);
  console.log('Top slots:');
  out.rows.slice(0, 60).forEach(r =>
    console.log('  %s draws=%s natural=%s tag=%s box=%s', r.slot.padEnd(34),
      String(r.draws).padStart(4), r.natural.join('x').padEnd(9),
      String(r.tag || '-').padEnd(7), JSON.stringify(r.boxes[0] || null)));
  console.log('JSON:', JSON_OUT);
  await ctx.close(); await browser.close();
})().catch(e => { console.error('AUDIT FAIL', e.message); process.exit(1); });
