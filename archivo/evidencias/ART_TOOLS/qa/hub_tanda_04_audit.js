/* ============================================================================
 * HUB · TANDA 04 — FASE 1 · AUDITORÍA DEL RENDERER (solo lectura)
 * ----------------------------------------------------------------------------
 * Inspecciona el HTML ACTIVO sin modificarlo: renderer del HUB, renderer del
 * menú, funciones de dibujo, slots, anclajes, registro V5, cachés e
 * invalidación. Determina por qué el pintor VIP existe en el menú pero no
 * tiene renderer activo en el HUB.
 *
 * NO crea canvas, NO crea motor, NO modifica el juego: únicamente instala un
 * proxy de solo lectura sobre CanvasRenderingContext2D.prototype.drawImage y
 * consulta APIs de depuración ya existentes.
 *
 * Uso:
 *   QA_LIB=/tmp/qatools/node_modules/playwright-core \
 *   CHROME_PATH=/tmp/chromium LD_LIB_PATH=/tmp/chromelibs/lib:/tmp \
 *   node ART_TOOLS/qa/hub_tanda_04_audit.js
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require(process.env.QA_LIB || 'playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.env.OUTDIR || path.join(ROOT, 'ART_EVIDENCE', 'hub', 'tanda_04');
const URL = process.env.GAME_URL || 'http://127.0.0.1:8123/';
const R = n => path.join(OUT, n);
fs.mkdirSync(OUT, { recursive: true });

const HTML_SHA = crypto.createHash('sha256')
  .update(fs.readFileSync(path.join(ROOT, 'DEADBEAT_DISCO.ART.html'))).digest('hex');

/* Proxy de solo lectura: cuenta TODOS los drawImage por canvas y conserva los
   que corresponden a imágenes etiquetadas por el art pack (T01/T02/T03). */
const INIT = `(() => {
  const W = window;
  const P = W.__HUB4AUDIT = {
    phase: 'BOOT', draws: {}, byCanvas: {}, t03: {}, order: [], seq: [],
    errors: [], patterns: {}, boxes: {}
  };
  const rect = (m, x, y) => ({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f });
  function screenBox(ctx, dx, dy, dw, dh) {
    let m; try { m = ctx.getTransform(); } catch (e) { return null; }
    const p = [rect(m, dx, dy), rect(m, dx + dw, dy), rect(m, dx, dy + dh),
               rect(m, dx + dw, dy + dh)];
    const xs = p.map(v => v.x), ys = p.map(v => v.y);
    return [Math.min.apply(null, xs), Math.min.apply(null, ys),
            Math.max.apply(null, xs), Math.max.apply(null, ys)].map(Math.round);
  }
  const origDraw = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (src) {
    try {
      const cv = this.canvas;
      const key = (cv.id || 'sin-id') + ':' + cv.width + 'x' + cv.height;
      const d = P.byCanvas[key] || (P.byCanvas[key] = { count: 0, phase: {}, sample: null });
      d.count++;
      d.phase[P.phase] = (d.phase[P.phase] || 0) + 1;
      const tag = src && (src.__hubTanda03 || src.__hubTanda02 || src.__hubTanda01);
      if (tag) {
        const k = P.phase + '|' + tag;
        const t = P.t03[k] || (P.t03[k] = { count: 0, canvas: key, boxes: [], sample: null });
        t.count++;
        if (arguments.length >= 5) {
          const b = screenBox(this, arguments[1], arguments[2], arguments[3], arguments[4]);
          if (b) { if (t.boxes.length < 6) t.boxes.push(b); P.boxes[k] = b; }
          if (!t.sample) t.sample = [arguments[1], arguments[2], arguments[3], arguments[4]].map(Math.round);
        }
        if (P.order.indexOf(k) < 0) P.order.push(k);
      }
      if (P.seq.length < 600 && tag) P.seq.push(k = P.phase + '|' + tag);
      if (!d.sample && arguments.length >= 5) d.sample = [arguments[1], arguments[2], arguments[3], arguments[4]].map(Math.round);
    } catch (e) {}
    return origDraw.apply(this, arguments);
  };
  const origPat = CanvasRenderingContext2D.prototype.createPattern;
  CanvasRenderingContext2D.prototype.createPattern = function (img) {
    try { const tag = img && (img.__hubTanda03 || img.__hubTanda02 || img.__hubTanda01);
      if (tag) P.patterns[P.phase + '|' + tag] = (P.patterns[P.phase + '|' + tag] || 0) + 1; } catch (e) {}
    return origPat.apply(this, arguments);
  };
  W.addEventListener('error', e => P.errors.push(String(e.message).slice(0, 200)));
})()`;

const PROBE = `(() => {
  const W = window, safe = f => { try { return f(); } catch (e) { return 'ERR:' + e.message; } };
  const P = W.__HUB4AUDIT || {};
  const canvases = Array.from(document.querySelectorAll('canvas')).map(c => ({
    id: c.id || null, cls: c.className || null, w: c.width, h: c.height,
    cssW: Math.round(c.getBoundingClientRect().width),
    cssH: Math.round(c.getBoundingClientRect().height),
    visible: !!(c.offsetWidth || c.offsetHeight || c.getClientRects().length)
  }));
  return {
    ts: new Date().toISOString(), url: location.href, title: document.title,
    htmlSha: null,
    canvasCount: canvases.length, canvases,
    menuCanvas54: canvases.find(c => c.id === 'menu-canvas54') || null,
    cover: safe(() => {
      const el = document.getElementById('ddc-cover');
      return el ? { present: true, display: getComputedStyle(el).display,
                    opacity: getComputedStyle(el).opacity,
                    zIndex: getComputedStyle(el).zIndex } : { present: false };
    }),
    menu54Api: safe(() => {
      const a = W.w && W.w.menu54;
      if (!a) return null;
      return { frame: typeof a.frame, stats: typeof a.stats === 'function' ? a.stats() : null,
               reset: typeof a.reset, get: typeof a.get };
    }),
    v5: safe(() => ({
      keys: Object.keys(W.__DDM_V5_IMG || {}).length,
      list: Object.keys(W.__DDM_V5_IMG || {}).sort(),
      getV5: typeof W.__DDM_GET_V5,
      vipResolved: !!(W.__DDM_GET_V5 && W.__DDM_GET_V5('hub_vip_booth_lounge')),
      vipAlias: !!(W.__DDM_V5_IMG && W.__DDM_V5_IMG.h03_vip_booth_lounge),
      vipNatural: (() => { const im = W.__DDM_V5_IMG && W.__DDM_V5_IMG.h03_vip_booth_lounge;
        return im ? [im.naturalWidth, im.naturalHeight, im.complete] : null; })()
    })),
    hub: safe(() => W.DMO_HUB.state()),
    hubAudit: safe(() => W.DMO_HUB.audit()),
    stations: safe(() => W.DMO_HUB.stations()),
    artPack: safe(() => W.DMO_ART_PACK.state()),
    hubPack: safe(() => W.DMO_ART_PACK.hub()),
    hub2Pack: safe(() => W.DMO_ART_PACK.hub2()),
    hub3Pack: safe(() => W.DMO_ART_PACK.hub3()),
    t3b: safe(() => ({ enabled: W.__T3B.enabled, revision: W.__T3B.revision,
      ready: W.__T3B.ready.slice(), errors: W.__T3B.errors.slice(),
      lastInvalidation: W.__T3B.lastInvalidation,
      draws: W.__T3B.draws.slice(-8) })),
    hubFloor: safe(() => W.__T3B_HUB_QA.state()),
    infernal: safe(() => ({ invalidate: typeof W.DMO_INFERNAL_ART.invalidate,
      keys: Object.keys(W.DMO_INFERNAL_ART).slice(0, 24) })),
    debug: safe(() => W.DMO.debug.state()),
    drawsByCanvas: P.byCanvas, t03Draws: P.t03, t03Boxes: P.boxes,
    patterns: P.patterns, pageErrors: P.errors, phase: P.phase
  };
})()`;

async function bootToHub(page) {
  await page.mouse.click(640, 450); await page.waitForTimeout(600);
  await page.keyboard.press('Enter'); await page.waitForTimeout(900);
  await page.keyboard.down('Escape'); await page.waitForTimeout(2800);
  await page.keyboard.up('Escape'); await page.waitForTimeout(900);
}

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
  const rec = { htmlSha: HTML_SHA, url: URL, consoleErrors: [], pageErrors: [], httpErrors: [] };
  page.on('console', m => { if (m.type() === 'error') rec.consoleErrors.push(m.text().slice(0, 220)); });
  page.on('pageerror', e => rec.pageErrors.push(String(e.message).slice(0, 220)));
  page.on('response', r => { if (r.status() >= 400) rec.httpErrors.push({ status: r.status(), url: r.url().slice(0, 160) }); });
  await page.addInitScript(INIT);
  const t0 = Date.now();
  const resp = await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
  rec.htmlStatus = resp && resp.status();
  rec.loadMs = Date.now() - t0;
  await page.waitForFunction(() => {
    try { const s = window.DMO_ART_PACK && window.DMO_ART_PACK.state().status;
      return s === 'applied' || s === 'applied-with-errors'; } catch (e) { return false; }
  }, { timeout: 90000 });
  await page.waitForTimeout(2200);

  /* --- MENÚ: medición del renderer de píxeles y del canvas de portada --- */
  await page.evaluate(() => { if (window.__HUB4AUDIT) window.__HUB4AUDIT.phase = 'MENU'; });
  await page.waitForTimeout(1400);
  rec.menu = await page.evaluate(PROBE);
  await page.screenshot({ path: R('audit_00_menu.png'), timeout: 60000 });

  /* --- HUB --- */
  await bootToHub(page);
  await page.evaluate(() => { if (window.__HUB4AUDIT) window.__HUB4AUDIT.phase = 'HUB'; });
  await page.waitForTimeout(1200);
  rec.hubProbe = await page.evaluate(PROBE);
  await page.screenshot({ path: R('audit_01_hub.png'), timeout: 60000 });

  /* --- 10 zonas con cámara idéntica a T02/T03 --- */
  const ZONES = [
    ['centro', 1250, 935], ['dj', 1250, 445], ['bar', 1910, 845],
    ['vip_oeste', 785, 545], ['vip_este', 1715, 545], ['arcade', 655, 1210],
    ['sellos', 1845, 1210], ['descenso', 1250, 1365], ['arsenal', 590, 845],
    ['pared_este', 2050, 965]
  ];
  rec.zones = [];
  for (const [name, x, y] of ZONES) {
    await page.evaluate(([x, y]) => {
      try { window.DMO.debug.teleport(x, y); } catch (e) {}
      try { window.DMO.debug.tick(0.016, 30); } catch (e) {}
    }, [x, y]);
    await page.waitForTimeout(420);
    const f = 'audit_' + name + '.png';
    await page.screenshot({ path: R(f), timeout: 60000 });
    rec.zones.push({ name, x, y, file: f, bytes: fs.statSync(R(f)).size });
  }
  rec.probeFinal = await page.evaluate(PROBE);
  fs.writeFileSync(R('audit_runtime.json'), JSON.stringify(rec, null, 2) + '\n');

  const menu = rec.menu, hub = rec.hubProbe, fin = rec.probeFinal;
  console.log('HTML SHA         :', HTML_SHA);
  console.log('HTTP / loadMs    :', rec.htmlStatus, rec.loadMs);
  console.log('canvas MENU      :', menu.canvasCount, JSON.stringify(menu.canvases.map(c => [c.id, c.w, c.h])));
  console.log('menu-canvas54    :', JSON.stringify(menu.menuCanvas54));
  console.log('w.menu54         :', JSON.stringify(menu.menu54Api));
  console.log('V5 keys          :', menu.v5.keys, '| vipResolved', menu.v5.vipResolved, '| alias', menu.v5.vipAlias, menu.v5.vipNatural);
  console.log('canvas HUB       :', hub.canvasCount, JSON.stringify(hub.canvases.map(c => [c.id, c.w, c.h])));
  console.log('hubFloor         :', JSON.stringify(hub.hubFloor));
  console.log('stations         :', JSON.stringify((hub.stations || []).map(s => [s.id, s.x, s.y])));
  console.log('byCanvas MENU    :', JSON.stringify(menu.drawsByCanvas));
  console.log('byCanvas HUB     :', JSON.stringify(fin.drawsByCanvas));
  console.log('T03 draws        :', JSON.stringify(fin.t03Draws));
  console.log('pageErrors       :', rec.pageErrors.length, '| 404', rec.httpErrors.length);
  await ctx.close(); await browser.close();
})().catch(e => { console.error('AUDIT FAIL', e); process.exit(1); });
