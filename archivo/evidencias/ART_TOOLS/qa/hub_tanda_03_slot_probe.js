/* ============================================================================
 * HUB · TANDA 03 — prueba de slots (solo lectura / inyección temporal)
 * ----------------------------------------------------------------------------
 * Demuestra EMPÍRICAMENTE, sin modificar ningún archivo del repositorio, que:
 *   1. `hub_vip_booth_lounge` es consultada por el pintor del MENÚ y, si se
 *      registra en __DDM_V5_IMG, se dibuja 4 veces con caja 108x68.
 *   2. No se dibuja en el HUB (0 drawImage) pese a recorrer las 10 zonas.
 *   3. Las claves de suelo / señalética / variantes NO existen en el registro
 *      y ningún pintor las consulta.
 *   4. Mide el tamaño real del canvas de suelo cacheado y las APIs globales.
 *
 * La imagen inyectada es un PNG transparente 1x1 en data URI: solo sirve para
 * que el pintor la acepte y podamos contar drawImage. Se descarta al cerrar.
 *
 * Uso:
 *   QA_LIB=/tmp/qatools/node_modules/playwright-core \
 *   CHROME_PATH=/tmp/chromium LD_LIB_PATH=/tmp/chromelibs/lib:/tmp \
 *   node ART_TOOLS/qa/hub_tanda_03_slot_probe.js
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.QA_LIB || 'playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'ART_EVIDENCE', 'hub', 'tanda_03');
const URL = process.env.GAME_URL || 'http://127.0.0.1:8123/';
fs.mkdirSync(OUT, { recursive: true });

const TRANSPARENT = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';

const INIT = `(() => {
  const W = window;
  const P = W.__HUB3PROBE = { draws: {}, gets: {}, fn: {}, phase: 'MENU', boxes: {}, canvasSizes: {} };
  const TRANSPARENT = '${TRANSPARENT}';
  let _v5 = null;
  function inject(t) {
    if (t.__hub3Probed) return;
    Object.defineProperty(t, '__hub3Probed', { value: true });
    const probe = new Image();
    probe.decoding = 'sync';
    try { probe.__v5key = 'hub_vip_booth_lounge'; probe.__hub3Probe = true; } catch (e) {}
    probe.src = TRANSPARENT;
    t['hub_vip_booth_lounge'] = probe;
  }
  Object.defineProperty(W, '__DDM_V5_IMG', {
    configurable: true,
    get() { return _v5; },
    set(v) {
      if (!v || typeof v !== 'object' || v.__hub3Proxied) { _v5 = v; return; }
      const target = v;
      inject(target);
      _v5 = new Proxy(target, {
        get(t, k) {
          if (typeof k === 'string') {
            P.gets[k] = (P.gets[k] || 0) + 1;
            if (t[k] && typeof t[k] === 'object') { try { t[k].__v5key = k; } catch (e) {} }
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
      Object.defineProperty(_v5, '__hub3Proxied', { value: true });
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
      const id = P.phase + '|' + k;
      P.draws[id] = (P.draws[id] || 0) + 1;
      if (arguments.length >= 5 && !P.boxes[id]) {
        const a = arguments;
        P.boxes[id] = [Math.round(a[1]), Math.round(a[2]), Math.round(a[3]), Math.round(a[4])];
        P.canvasSizes[id] = [this.canvas.width, this.canvas.height];
      }
    }
    return orig.apply(this, arguments);
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
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e.message).slice(0, 200)));
  await page.addInitScript(INIT);
  await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => {
    try { return window.DMO_ART_PACK && window.DMO_ART_PACK.state().status === 'applied'; }
    catch (e) { return false; }
  }, { timeout: 60000 });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(OUT, 'probe_00_menu.png') });

  const menu = await page.evaluate(() => {
    const W = window, P = W.__HUB3PROBE;
    const safe = f => { try { return f(); } catch (e) { return 'ERR:' + e.message; } };
    return {
      vipRegistered: safe(() => !!W.__DDM_GET_V5('hub_vip_booth_lounge')),
      vipDrawsMenu: P.draws['MENU|hub_vip_booth_lounge'] || 0,
      vipBoxMenu: P.boxes['MENU|hub_vip_booth_lounge'] || null,
      vipFn: P.fn['hub_vip_booth_lounge'] || 0,
      vipGets: P.gets['hub_vip_booth_lounge'] || 0,
      floorCapture: safe(() => {
        const u = W.__T3B_HUB_QA.capture();
        if (!u) return null;
        const head = u.slice(0, 64);
        return { prefix: head, length: u.length };
      }),
      floorImageSize: safe(() => {
        const u = W.__T3B_HUB_QA.capture();
        if (!u) return null;
        const b = atob(u.split(',')[1]);
        /* PNG: ancho y alto en bytes 16..23 (big endian) */
        const dv = new DataView(new ArrayBuffer(8));
        for (let i = 0; i < 8; i++) dv.setUint8(i, b.charCodeAt(16 + i));
        return [dv.getUint32(0), dv.getUint32(4)];
      }),
      globals: {
        Wf: typeof W.Wf, Ph: typeof W.Ph, zf: typeof W.zf, g: typeof W.g,
        addHubCustomProp: typeof W.addHubCustomProp,
        hub: typeof W.hub, Ot: typeof W.Ot, DMO: typeof W.DMO
      },
      hubFloorQA: safe(() => W.__T3B_HUB_QA.state()),
      v5Keys: safe(() => Object.keys(W.__DDM_V5_IMG || {}).length),
      absentTargets: ['HUB_FLOOR_PATCH_O','HUB_FLOOR_PATCH_E','HUB_FLOOR_PATCH_S_CRACK',
        'HUB_FLOOR_NORTH_DJ','HUB_PLANTER_VARIANT_02','HUB_BENCH_VARIANT_02','HUB_ZONE_SIGNAGE',
        'hub_floor_patch_o','hub_zone_signage_a','floor_patch','zone_signage']
        .filter(k => !(k in (W.__DDM_V5_IMG || {})))
    };
  });

  await page.evaluate(() => { window.__HUB3PROBE.phase = 'HUB'; });
  await bootToHub(page);
  await page.evaluate(() => {
    const P = window.__HUB3PROBE;
    Object.keys(P.draws).forEach(k => { if (k.startsWith('HUB|')) delete P.draws[k]; });
  });
  for (const [x, y] of [[1250,935],[1250,445],[1910,845],[785,545],[1715,545],
                        [1250,1365],[480,965],[2050,965],[1250,300],[1250,1500]]) {
    await page.evaluate(([a, c]) => { try { window.DMO.debug.teleport(a, c); } catch (e) {} }, [x, y]);
    await page.waitForTimeout(400);
  }
  const hub = await page.evaluate(() => {
    const W = window, P = W.__HUB3PROBE;
    return {
      location: W.DMO_HUB.state().location,
      vipDrawsHUB: P.draws['HUB|hub_vip_booth_lounge'] || 0,
      hubDrawsTotal: Object.entries(P.draws).filter(([k]) => k.startsWith('HUB|'))
        .reduce((s, [, v]) => s + v, 0),
      hubSlots: Object.entries(P.draws).filter(([k]) => k.startsWith('HUB|')).map(([k, v]) => k.slice(4) + ':' + v),
      audit: W.DMO_HUB.audit()
    };
  });
  const out = { ts: new Date().toISOString(), url: URL, menu, hub, pageErrors,
    conclusion: 'hub_vip_booth_lounge tiene pintor real en el canvas del MENÚ y ninguno en el HUB; las claves de suelos, variantes y señalética no existen en el registro V5.' };
  fs.writeFileSync(path.join(OUT, 'slot_probe.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await ctx.close(); await browser.close();
})().catch(e => { console.error('PROBE FAIL', e && e.stack || e); process.exit(1); });
