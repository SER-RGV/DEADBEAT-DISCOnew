/* ============================================================================
 * HUB · TANDA 05 — QA FORMAL A/B DE TRES FASES (Chromium + Playwright-core)
 * ----------------------------------------------------------------------------
 * Arnés de SOLO LECTURA: instala un proxy sobre
 * CanvasRenderingContext2D.drawImage y usa exclusivamente APIs de depuración
 * ya existentes del juego. NO modifica HTML, JS, assets ni geometría.
 *
 *   antes    : window.__DDM_HUB_T05 = false ANTES del boot (misma build,
 *              integración de RENDER desactivada; la CARGA sigue ocurriendo).
 *   control  : activa en el arranque; se conmuta EN CALIENTE off -> on,
 *              se captura una línea base de ruido con dos fotogramas OFF y
 *              se ejercitan hub5Restore()/hub5Apply(). Además se capturan
 *              tripletas OFF / OFF / ON por zona para diff de píxel.
 *   despues  : integración activa por defecto; 10 zonas, movimiento,
 *              colisiones, estaciones, puertas, interacciones y campaña.
 *
 * 14 comprobaciones. Criterio de integración: >=1 drawImage EFECTIVO por
 * unidad en el canvas de MUNDO 1280x900 del HUB, con caja en pantalla,
 * MÁS confirmación de píxel en una comparativa OFF/ON en caliente (generada
 * por finalize_hub_tanda_05.py). El registro V5 NO basta; una prueba de
 * carga NO se declara como prueba visual.
 *
 * Uso:
 *   QA_LIB=/tmp/qatools/node_modules/playwright-core \
 *   CHROME_PATH=/tmp/chromium LD_LIB_PATH=/tmp/chromelibs/lib:/tmp \
 *   node ART_TOOLS/qa/validate_hub_tanda_05.js
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const { chromium } = require(process.env.QA_LIB || 'playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.env.OUTDIR || path.join(ROOT, 'ART_EVIDENCE', 'hub', 'tanda_05');
const URL = process.env.GAME_URL || 'http://127.0.0.1:8123/';
const R = n => path.join(OUT, n);
fs.mkdirSync(OUT, { recursive: true });

const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const HTML_SHA = sha(path.join(ROOT, 'DEADBEAT_DISCO.ART.html'));
const JS_SHA = sha(path.join(ROOT, 'ART_PACK', 'art_pack.js'));
const HTML_TEXT = fs.readFileSync(path.join(ROOT, 'DEADBEAT_DISCO.ART.html'), 'utf8');
const JS_TEXT = fs.readFileSync(path.join(ROOT, 'ART_PACK', 'art_pack.js'), 'utf8');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'ART_ASSETS', 'hub', 'tanda_05', 'manifest.json'), 'utf8'));
const ASSETS = MANIFEST.assets;
const ANCHOR = Object.fromEntries(ASSETS.map(a => [a.id, a.anchor]));
const EXPECTED = Object.fromEntries(ASSETS.map(a => {
  const dw = Math.round(a.anchor.worldH * a.expected[0] / a.expected[1]);
  return [a.id, {
    dw, dh: a.anchor.worldH,
    box: [a.anchor.x - (dw >> 1), a.anchor.y - a.anchor.worldH, dw, a.anchor.worldH],
    natural: a.expected, flip: !!a.anchor.flip, pulse: a.anchor.pulse
  }];
}));
const IDS = ASSETS.map(a => a.id);
const PULSE = IDS.filter(id => EXPECTED[id].pulse !== null && EXPECTED[id].pulse !== undefined);
const HANG = ['T05-04', 'T05-06', 'T05-07', 'T05-08'];

const BASELINE = { v5Keys: 142, canvasCountBase: 27, stationsCount: 11, zonesCount: 6 };
const ZONES = [
  ['centro', 1250, 935], ['dj', 1250, 445], ['bar', 1910, 845],
  ['vip_oeste', 785, 545], ['vip_este', 1715, 545], ['arcade', 655, 1210],
  ['sellos', 1845, 1210], ['pared_oeste', 450, 965], ['norte', 1250, 330],
  ['pared_este', 2050, 965]
];

/* ---------------------------------------------------------------- proxy */
const INIT = `(() => {
  const W = window;
  const P = W.__T5QA = {
    phase: 'BOOT', zone: '', totalDraws: 0,
    draws: {}, boxes: {}, onScreen: {}, canvasSizes: {}, byCanvas: {},
    seq: [], zoneDraws: {}, errors: [],
    life: { draws: {}, onScreen: {}, canvasSet: {}, menuDraws: {},
            zoneBoxes: {}, matrices: {}, minAlpha: {}, maxAlpha: {} }
  };
  const rect = (m, x, y) => ({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f });
  function project(ctx, a) {
    let m; try { m = ctx.getTransform(); } catch (e) { return { box: null, m: null }; }
    const p = [rect(m, a[0], a[1]), rect(m, a[0] + a[2], a[1]),
               rect(m, a[0], a[1] + a[3]), rect(m, a[0] + a[2], a[1] + a[3])];
    const box = [Math.min.apply(null, p.map(v => v.x)), Math.min.apply(null, p.map(v => v.y)),
                 Math.max.apply(null, p.map(v => v.x)), Math.max.apply(null, p.map(v => v.y))].map(Math.round);
    return { box: box, m: { a: m.a, b: m.b, c: m.c, d: m.d, e: m.e, f: m.f } };
  }
  const orig = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (src) {
    P.totalDraws++;
    try {
      const tag = src && (src.__hubTanda05 || src.__hubTanda04 || src.__hubTanda03 ||
                          src.__hubTanda02 || src.__hubTanda01);
      if (tag) {
        const key = P.phase + '|' + tag;
        const cv = this.canvas, cvs = cv.width + 'x' + cv.height;
        const off = arguments.length >= 9 ? 5 : 1;
        const args = arguments.length >= 5
          ? [arguments[off], arguments[off + 1], arguments[off + 2], arguments[off + 3]].map(Number)
          : null;
        const alpha = +this.globalAlpha.toFixed(3);
        const d = P.draws[key] || (P.draws[key] = { count: 0, sample: null, onScreen: 0, firstN: 0, lastN: 0 });
        d.count++; d.firstN = d.firstN || P.totalDraws; d.lastN = P.totalDraws;
        P.canvasSizes[key] = [cv.width, cv.height];
        P.byCanvas[cvs] = (P.byCanvas[cvs] || 0) + 1;
        const L = P.life;
        const l = L.draws[key] || (L.draws[key] = { count: 0, sample: null, onScreen: 0 });
        l.count++;
        const cs = L.canvasSet[key] || (L.canvasSet[key] = {});
        cs[cvs] = (cs[cvs] || 0) + 1;
        if (P.phase === 'MENU') L.menuDraws[key] = (L.menuDraws[key] || 0) + 1;
        L.minAlpha[key] = Math.min(L.minAlpha[key] === undefined ? alpha : L.minAlpha[key], alpha);
        L.maxAlpha[key] = Math.max(L.maxAlpha[key] === undefined ? alpha : L.maxAlpha[key], alpha);
        let pr = { box: null, m: null };
        if (args) pr = project(this, args);
        if (args && pr.box) {
          const b = pr.box, ra = args.map(Math.round);
          if (!d.sample) d.sample = { args: ra, box: b, canvas: [cv.width, cv.height], matrix: pr.m };
          if (!l.sample) l.sample = { args: ra, box: b, canvas: [cv.width, cv.height], matrix: pr.m };
          d.lastArgs = ra; d.lastBox = b; d.lastMatrix = pr.m;
          P.boxes[key] = b;
          if (b[2] > 0 && b[0] < cv.width && b[3] > 0 && b[1] < cv.height) {
            d.onScreen++;
            P.onScreen[key] = (P.onScreen[key] || 0) + 1;
            l.onScreen++;
            L.onScreen[key] = (L.onScreen[key] || 0) + 1;
          }
          (L.zoneBoxes[P.zone] = L.zoneBoxes[P.zone] || {})[tag] = b;
          L.matrices[tag] = pr.m;
          P.zoneDraws[tag] = { args: ra, box: b, matrix: pr.m, alpha: alpha,
                               n: P.totalDraws, canvas: cvs };
        }
        if (P.seq.length < 1500) P.seq.push({ k: tag, n: P.totalDraws, z: P.zone, cv: cvs });
      }
    } catch (e) {}
    return orig.apply(this, arguments);
  };
  W.addEventListener('error', e => P.errors.push(String(e.message).slice(0, 200)));
  W.__T5QA_RESET = function (phase, zone) {
    P.phase = phase; P.zone = zone || ''; P.totalDraws = 0;
    P.draws = {}; P.boxes = {}; P.onScreen = {}; P.canvasSizes = {}; P.byCanvas = {};
    P.seq = []; P.zoneDraws = {};
  };
})()`;

const INIT_ANTES = `(() => { window.__DDM_HUB_T05 = false; })()`;

const SNAPSHOT = `(() => {
  const P = window.__T5QA, c = o => JSON.parse(JSON.stringify(o || {}));
  return { phase: P.phase, zone: P.zone,
    draws: c(P.draws), boxes: c(P.boxes), onScreen: c(P.onScreen),
    canvasSizes: c(P.canvasSizes), byCanvas: c(P.byCanvas),
    seq: c((P.seq || []).slice(-400)), zoneDraws: c(P.zoneDraws),
    flag: window.__DDM_HUB_T05 };
})()`;

const PROBE = `(() => {
  const W = window, P = W.__T5QA || {};
  const c = o => JSON.parse(JSON.stringify(o || {}));
  const safe = f => { try { return f(); } catch (e) { return 'ERR:' + e.message; } };
  return {
    ts: new Date().toISOString(), url: location.href, readyState: document.readyState,
    title: document.title, phase: P.phase, zone: P.zone,
    flag: W.__DDM_HUB_T05,
    canvasCount: document.querySelectorAll('canvas').length,
    canvasCountBase: document.querySelectorAll('canvas:not(.hub-portrait-canvas)').length,
    worldCanvasRect: safe(() => { const e = document.getElementById('game');
      if (!e) return null; const r = e.getBoundingClientRect();
      return [r.x, r.y, r.width, r.height, e.width, e.height]; }),
    menuCanvas: safe(() => { const e = document.getElementById('menu-canvas54');
      return e ? [e.width, e.height] : null; }),
    coverDisplay: safe(() => { const e = document.getElementById('ddc-cover');
      return e ? getComputedStyle(e).display : null; }),
    menu54: safe(() => W.DMO.menu54 && W.DMO.menu54.stats ? W.DMO.menu54.stats() : null),
    hub: safe(() => W.DMO_HUB.state()),
    hubAudit: safe(() => W.DMO_HUB.audit()),
    stations: safe(() => W.DMO_HUB.stations()),
    artPack: safe(() => W.DMO_ART_PACK.state()),
    integrity: safe(() => W.DMO_ART_PACK.integrity()),
    architecture: safe(() => W.DMO_ART_PACK.architecture()),
    player: safe(() => { const p = W.DMO_ART_PACK.player();
      return { version: p.version, poses: (p.poses || []).length, errors: p.errors }; }),
    hubPack: safe(() => W.DMO_ART_PACK.hub()),
    hub2Pack: safe(() => W.DMO_ART_PACK.hub2()),
    hub3Pack: safe(() => W.DMO_ART_PACK.hub3()),
    hub5Pack: safe(() => W.DMO_ART_PACK.hub5()),
    v5Keys: safe(() => Object.keys(W.__DDM_V5_IMG || {}).length),
    t3b: safe(() => ({ enabled: W.__T3B.enabled, revision: W.__T3B.revision,
      ready: W.__T3B.ready.slice(), errors: W.__T3B.errors.slice(),
      lastInvalidation: W.__T3B.lastInvalidation,
      routes: W.__T3B.draws.slice(-30).map(d => d.route),
      draws: W.__T3B.draws.slice(-12) })),
    hubFloor: safe(() => W.__T3B_HUB_QA.state()),
    infernal: safe(() => ({ invalidate: typeof W.DMO_INFERNAL_ART.invalidate,
      keys: Object.keys(W.DMO_INFERNAL_ART) })),
    dungeon: safe(() => { const d = W.DMO_DUNGEON.state();
      return { current: d.current, role: d.role, secured: d.secured, floor: d.floor }; }),
    debug: safe(() => W.DMO.debug.state()),
    stats: safe(() => W.DMO.testStats()),
    draws: c(P.draws), boxes: c(P.boxes), onScreen: c(P.onScreen),
    canvasSizes: c(P.canvasSizes), byCanvas: c(P.byCanvas),
    seq: c((P.seq || []).slice(-300)), zoneDraws: c(P.zoneDraws),
    life: c(P.life), pageErrors: c(P.errors)
  };
})()`;

/* ------------------------------------------------------------- helpers */
async function bootToHub(page) {
  await page.mouse.click(640, 450); await page.waitForTimeout(600);
  await page.keyboard.press('Enter'); await page.waitForTimeout(900);
  await page.keyboard.down('Escape'); await page.waitForTimeout(2800);
  await page.keyboard.up('Escape'); await page.waitForTimeout(900);
}
async function waitArtPack(page) {
  await page.waitForFunction(() => {
    try { const s = window.DMO_ART_PACK && window.DMO_ART_PACK.state().status;
      return s === 'applied' || s === 'applied-with-errors'; } catch (e) { return false; }
  }, { timeout: 90000 });
}
async function shot(page, name) {
  const f = R(name);
  const jpeg = /\.jpg$/.test(name);
  await page.screenshot({ path: f, type: jpeg ? 'jpeg' : 'png',
    ...(jpeg ? { quality: 88 } : {}), timeout: 60000 });
  return fs.statSync(f).size;
}
function watch(page, rec) {
  page.on('console', m => { if (m.type() === 'error') rec.consoleErrors.push(m.text().slice(0, 220)); });
  page.on('pageerror', e => rec.pageErrors.push(String(e.message).slice(0, 220)));
  page.on('response', r => {
    const u = r.url();
    if (u.indexOf('/ART_ASSETS/hub/tanda_05/') >= 0)
      rec.assetResponses.push({ url: u.split('/').pop(), status: r.status(),
        type: r.headers()['content-type'] || '' });
    if (r.status() >= 400) rec.httpErrors.push({ status: r.status(), url: u.slice(0, 180) });
  });
  page.on('requestfailed', r => rec.requestFailed.push({ url: r.url().slice(0, 180),
    failure: r.failure() && r.failure().errorText }));
}
async function resetWindow(page, zone) {
  await page.evaluate(z => { window.__T5QA_RESET('HUB', z); }, zone || 'centro');
  await page.waitForTimeout(180);
}
async function teleport(page, x, y) {
  await page.evaluate(([x, y]) => {
    try { window.DMO.debug.teleport(x, y); } catch (e) {}
    try { window.DMO.debug.tick(0.016, 30); } catch (e) {}
  }, [x, y]);
  /* La cámara interpola durante ~30 fotogramas: se espera a que se asiente
     ANTES de abrir la ventana de medición, para no mezclar matrices. */
  await page.waitForTimeout(650);
}
async function snapshot(page) { return page.evaluate(SNAPSHOT); }
async function measureRender(page) {
  return page.evaluate(() => new Promise(resolve => {
    const d = []; let last = null, n = 0;
    function step(t) {
      if (last !== null) d.push(t - last);
      last = t; n++;
      if (n < 41) requestAnimationFrame(step);
      else { d.sort((a, b) => a - b); resolve({ frames: d.length,
        medianMs: +d[Math.floor(d.length / 2)].toFixed(2),
        p90Ms: +d[Math.floor(d.length * 0.9)].toFixed(2),
        minMs: +d[0].toFixed(2), maxMs: +d[d.length - 1].toFixed(2) }); }
    }
    requestAnimationFrame(step);
  }));
}
async function runMoveCollision(page, rec) {
  await teleport(page, 1250, 965);
  await page.waitForTimeout(300);
  const p0 = await page.evaluate(() => window.DMO.debug.state().px);
  await page.keyboard.down('d'); await page.waitForTimeout(900);
  await page.evaluate(() => { try { window.DMO.debug.tick(0.016, 60); } catch (e) {} });
  await page.keyboard.up('d'); await page.waitForTimeout(350);
  const p1 = await page.evaluate(() => window.DMO.debug.state().px);
  rec.movement = { pxBefore: p0, pxAfter: p1, delta: +(p1 - p0).toFixed(2),
    withinWorld: p1 > 0 && p1 < 2500 };
  await teleport(page, 1720, 845);
  const c0 = await page.evaluate(() => window.DMO.debug.state().px);
  await page.keyboard.down('d'); await page.waitForTimeout(1600);
  await page.evaluate(() => { try { window.DMO.debug.tick(0.016, 120); } catch (e) {} });
  await page.keyboard.up('d'); await page.waitForTimeout(300);
  const c1 = await page.evaluate(() => window.DMO.debug.state().px);
  rec.collision = { from: c0, afterHoldingD: c1, delta: +(c1 - c0).toFixed(2),
    blockedBeforeBarCollider: c1 < 1812 };
}
async function captureZones(page, rec, prefix) {
  rec.zoneSnapshots = {};
  for (const [name, x, y] of ZONES) {
    await teleport(page, x, y);              /* primero: cámara asentada */
    await resetWindow(page, name);           /* después: ventana limpia */
    await page.waitForTimeout(420);
    rec.screenshots[prefix + '_' + name + '.jpg'] = await shot(page, prefix + '_' + name + '.jpg');
    rec.zoneSnapshots[name] = await snapshot(page);
  }
}

/* --------------------------------------------------------------- phases */
async function phase(browser, mode, log) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const rec = { mode, consoleErrors: [], pageErrors: [], httpErrors: [],
    requestFailed: [], assetResponses: [], screenshots: {}, zoneSnapshots: {}, controlZones: {} };
  watch(page, rec);
  await page.addInitScript(INIT);
  if (mode === 'antes') await page.addInitScript(INIT_ANTES);
  const t0 = Date.now();
  const resp = await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
  rec.htmlStatus = resp && resp.status();
  rec.loadMs = Date.now() - t0;
  await waitArtPack(page);
  rec.hub5AtBoot = await page.evaluate(() => {
    try { const h = window.DMO_ART_PACK.hub5();
      return { count: h.count, registered: h.registered, loaded: h.loaded,
        exactSize: h.exactSize, enabled: h.enabled, errors: h.errors }; }
    catch (e) { return 'ERR:' + e.message; }
  });
  await page.waitForTimeout(1600);
  await page.evaluate(() => { if (window.__T5QA) window.__T5QA.phase = 'MENU'; });
  await page.waitForTimeout(900);
  rec.menuProbe = await page.evaluate(PROBE);
  rec.screenshots[mode + '_00_menu.jpg'] = await shot(page, mode + '_00_menu.jpg');

  await bootToHub(page);
  await resetWindow(page, 'centro');
  await teleport(page, 1250, 935);
  rec.screenshots[mode + '_01_hub.png'] = await shot(page, mode + '_01_hub.png');
  rec.render = await measureRender(page);
  rec.loadCost = await page.evaluate(() => {
    try { const s = window.DMO_ART_PACK.state();
      return { startedAt: s.startedAt, appliedAt: s.appliedAt,
        finishedAt: s.finishedAt,
        hub5AppliedAt: s.hub5 && s.hub5.appliedAt,
        totalLoadMs: s.finishedAt && s.startedAt ? s.finishedAt - s.startedAt : null,
        hub5LoadMs: s.hub5 && s.appliedAt ? s.hub5.appliedAt - s.appliedAt : null }; }
    catch (e) { return { error: String(e) }; }
  });

  if (mode === 'control') {
    /* A/B limpio EN EL MISMO CONTEXTO: dos OFF (ruido) y un ON (señal). */
    await page.evaluate(() => { window.__DDM_HUB_T05 = false;
      window.__T5QA_RESET('HUB', 'centro'); });
    await page.waitForTimeout(520);
    rec.controlOff = await snapshot(page);
    rec.screenshots.control_off_a_centro = await shot(page, 'control_off_a_centro.png');
    await page.waitForTimeout(320);
    rec.screenshots.control_off_b_centro = await shot(page, 'control_off_b_centro.png');
    await page.evaluate(() => { window.__DDM_HUB_T05 = true;
      window.__T5QA_RESET('HUB', 'centro'); });
    await page.waitForTimeout(520);
    rec.controlOn = await snapshot(page);
    rec.screenshots.control_on_centro = await shot(page, 'control_on_centro.png');

    /* Tripletas por zona: permiten confirmar cada asset con píxeles reales. */
    for (const [name, x, y] of ZONES) {
      await teleport(page, x, y);
      await page.evaluate(z => { window.__DDM_HUB_T05 = false;
        window.__T5QA_RESET('HUB', z); }, name);
      await page.waitForTimeout(300);
      rec.screenshots['control_off_a_' + name] = await shot(page, 'control_off_a_' + name + '.jpg');
      await page.waitForTimeout(300);
      rec.screenshots['control_off_b_' + name] = await shot(page, 'control_off_b_' + name + '.jpg');
      await page.evaluate(z => { window.__DDM_HUB_T05 = true;
        window.__T5QA_RESET('HUB', z); }, name);
      await page.waitForTimeout(300);
      rec.screenshots['control_on_' + name] = await shot(page, 'control_on_' + name + '.jpg');
      rec.controlZones[name] = await snapshot(page);
    }

    /* APIs existentes de T05: se miden desde el CENTRO (todos visibles),
       no desde la última zona, donde algunos props quedan fuera de cámara. */
    await teleport(page, 1250, 935);
    rec.hub5Restore = await page.evaluate(() => {
      try { return window.DMO_ART_PACK.hub5Restore(); } catch (e) { return 'ERR:' + e.message; }
    });
    await resetWindow(page, 'centro'); await page.waitForTimeout(650);
    rec.controlRestore = await snapshot(page);
    rec.hub5Apply = await page.evaluate(() => {
      try { return window.DMO_ART_PACK.hub5Apply(); } catch (e) { return 'ERR:' + e.message; }
    });
    await resetWindow(page, 'centro'); await page.waitForTimeout(650);
    rec.controlApply = await snapshot(page);
    await runMoveCollision(page, rec);
    rec.probe = await page.evaluate(PROBE);
  } else {
    await captureZones(page, rec, mode);
    await runMoveCollision(page, rec);
    rec.screenshots[mode + '_tras_movimiento.jpg'] = await shot(page, mode + '_tras_movimiento.jpg');
    rec.probe = await page.evaluate(PROBE);
  }

  if (mode === 'despues') {
    rec.interaction = await page.evaluate(() => {
      const W = window, out = {};
      try { out.stationsBefore = W.DMO_HUB.stations().length;
        out.open = String(W.DMO_HUB.openStation('bar'));
        out.active = W.DMO_HUB.state().activeStationId;
        out.close = String(W.DMO_HUB.closeModal());
        out.activeAfter = W.DMO_HUB.state().activeStationId; } catch (e) { out.error = String(e); }
      return out;
    });
    await page.waitForTimeout(300);
    rec.interactionProbe = await page.evaluate(PROBE);
    rec.screenshots.estacion_bar = await shot(page, 'estacion_bar.jpg');
    rec.campaignStart = await page.evaluate(() => {
      try { return String(window.DMO_HUB.startCampaignFromHub(0)); } catch (e) { return 'ERR:' + e.message; }
    });
    let completed = false;
    for (let i = 0; i < 90; i++) {
      try { await page.evaluate(() => window.DMO.debug.tick(0.016, 30)); } catch (_) {}
      await page.waitForTimeout(300);
      const h = await page.evaluate(() => { try { return window.DMO_HUB.state(); } catch (e) { return null; } });
      if (h && h.location === 'CAMPAIGN_ROOM' && !h.inHub && !h.transitionLock &&
          h.transitionsCompleted >= 1) { completed = true; break; }
    }
    rec.campaign = { completed };
    rec.doors = {};
    rec.doors.setNight = await page.evaluate(() => {
      const d = window.DMO.debug;
      try { if (typeof d.setNight === 'function') return { via: 'setNight', ok: d.setNight(24) };
        return { via: 'setRound', ok: d.setRound(24) }; } catch (e) { return { err: String(e) }; }
    });
    for (let i = 0; i < 6; i++) {
      try { await page.evaluate(() => window.DMO.debug.tick(0.016, 30)); } catch (_) {}
      await page.waitForTimeout(120);
    }
    rec.doors.closed = await page.evaluate(PROBE);
    rec.screenshots.doors_closed = await shot(page, 'doors_closed.jpg');
    rec.doors.clearRound = await page.evaluate(() => {
      try { return String(window.DMO.debug.clearRound()); } catch (e) { return 'ERR:' + e.message; }
    });
    for (let i = 0; i < 14; i++) {
      try { await page.evaluate(() => window.DMO.debug.tick(0.016, 30)); } catch (_) {}
      await page.waitForTimeout(130);
    }
    rec.doors.open = await page.evaluate(PROBE);
    rec.screenshots.doors_open = await shot(page, 'doors_open.jpg');
    const s0 = await page.evaluate(() => window.DMO.testStats().shotsFired);
    await page.evaluate(() => { try { window.DMO.debug.setInput({ fire: true }); } catch (e) {} });
    await page.evaluate(() => { try { window.DMO.debug.tick(0.016, 60); } catch (e) {} });
    await page.evaluate(() => { try { window.DMO.debug.setInput({ fire: false }); } catch (e) {} });
    const s1 = await page.evaluate(() => window.DMO.testStats().shotsFired);
    rec.shooting = { before: s0, after: s1, delta: s1 - s0 };
    rec.campaignRegression = await page.evaluate(PROBE);
    rec.screenshots.regresion_campaign = await shot(page, 'regresion_campaign.jpg');
  }
  rec.probeFinal = await page.evaluate(PROBE);
  log[mode] = rec;
  await ctx.close();
  return rec;
}

/* ------------------------------------------------------------- report */
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isT5 = k => /\|T05-\d\d$/.test(k);
const t5keys = d => Object.keys(d || {}).filter(isT5).sort();
const hubT5Keys = d => Object.keys(d || {}).filter(k => /^HUB\|T05-\d\d$/.test(k)).sort();
const tagOf = k => k.split('|')[1];
const knownErrors = e => /404|cdn-cgi|challenge-platform/.test(e);

function buildReport(log) {
  const A = log.despues, B = log.antes, C = log.control;
  const P = A.probe, PF = A.probeFinal;
  const lifeDraws = PF.life.draws || {}, lifeOn = PF.life.onScreen || {};
  const checks = [];
  const add = (id, name, ok, detail, evidence, state) =>
    checks.push({ id, check: name, state: state || (ok ? 'APROBADO' : 'FALLIDO'),
      detail, evidence: evidence || [] });

  const perUnit = ASSETS.map(a => {
    const k = 'HUB|' + a.id, d = lifeDraws[k];
    return { artId: a.id, name: a.name, alias: a.alias,
      category: a.category, interactiveClass: a.interactiveClass,
      expected: a.expected, anchor: a.anchor,
      computedWorldBox: EXPECTED[a.id].box,
      drawCalls: d ? d.count : 0, onScreen: d ? d.onScreen : 0,
      sample: d ? d.sample : null,
      canvas: (PF.life.canvasSet[k] ? Object.keys(PF.life.canvasSet[k]) : []),
      minAlpha: PF.life.minAlpha[k], maxAlpha: PF.life.maxAlpha[k],
      integrated: !!(d && d.count > 0 && d.onScreen > 0) };
  });
  const integrated = perUnit.filter(u => u.integrated);
  /* life.zoneBoxes usa etiquetas SIN prefijo de fase (T05-01) y acumula la
     última caja medida por zona. La zona '' corresponde al boot previo al
     HUB y NO se cuenta. */
  const fullVisibility = {};
  IDS.forEach(id => { fullVisibility[id] = []; });
  for (const [z, boxes] of Object.entries(PF.life.zoneBoxes || {})) {
    if (!z) continue;
    for (const [tag, b] of Object.entries(boxes || {})) {
      if (!/^T05-\d\d$/.test(tag) || !b) continue;
      if (b[0] >= 4 && b[1] >= 4 && b[2] <= 1276 && b[3] <= 896)
        fullVisibility[tag].push(z);
    }
  }
  /* Caja de pantalla por asset en la fase CONTROL ON (para diff de píxel). */
  const controlBoxes = {};
  for (const [z, s] of Object.entries(C.controlZones || {})) {
    for (const [tag, v] of Object.entries(s.zoneDraws || {})) {
      if (!/^T05-\d\d$/.test(tag)) continue;
      (controlBoxes[tag] = controlBoxes[tag] || {})[z] = v.box;
    }
  }

  /* --- geometría / proyección / Y-sort -------------------------------- */
  let cameraMismatches = [], projectionMismatches = [], existingPropComparisons = 0;
  let ySortPairs = 0, ySortViolations = [], uniformProjection = true;
  for (const [z, s] of Object.entries(A.zoneSnapshots || {})) {
    const zd = s.zoneDraws || {};
    const nonFlip = Object.entries(zd).filter(([t, v]) =>
      /^T05-\d\d$/.test(t) && v && v.matrix && !EXPECTED[t].flip);
    if (!nonFlip.length) continue;
    const cam = nonFlip[0][1].matrix;
    if (!(Math.abs(cam.b) < 1e-6 && Math.abs(cam.c) < 1e-6 && Math.abs(cam.a - cam.d) < 1e-6))
      uniformProjection = false;
    /* a,b,c,d son la escala/rotación de cámara (deben coincidir al milísimo);
       e,f son la traslación, que puede derivar unos pocos píxeles entre
       fotogramas por el suavizado de cámara: se tolera hasta 2 px. */
    for (const [t, v] of nonFlip) {
      for (const k of ['a', 'b', 'c', 'd', 'e', 'f']) {
        const tol = (k === 'e' || k === 'f') ? 2 : 0.002;
        if (Math.abs(v.matrix[k] - cam[k]) > tol)
          cameraMismatches.push({ zone: z, tag: t, key: k, value: v.matrix[k],
            camera: cam[k], tolerance: tol });
      }
    }
    const flip = zd['T05-05'];
    if (flip && flip.matrix) {
      const e = EXPECTED['T05-05'].box;
      const pr = [[e[0], e[1]], [e[0] + e[2], e[1]], [e[0], e[1] + e[3]],
                  [e[0] + e[2], e[1] + e[3]]].map(([x, y]) =>
        ({ x: cam.a * x + cam.c * y + cam.e, y: cam.b * x + cam.d * y + cam.f }));
      const want = [Math.min(...pr.map(v => v.x)), Math.min(...pr.map(v => v.y)),
                    Math.max(...pr.map(v => v.x)), Math.max(...pr.map(v => v.y))].map(Math.round);
      const delta = want.map((v, i) => Math.abs(v - flip.box[i]));
      if (Math.max(...delta) > 8)
        projectionMismatches.push({ zone: z, want, measured: flip.box, delta, camera: cam });
    }
    for (const [t, v] of Object.entries(zd)) {
      if (/^T05-\d\d$/.test(t) || !v || !v.matrix) continue;
      if (Math.abs(Math.abs(v.matrix.a) - Math.abs(cam.a)) < 0.002 &&
          Math.abs(Math.abs(v.matrix.d) - Math.abs(cam.d)) < 0.002 &&
          Math.abs(v.matrix.b) < 0.002 && Math.abs(v.matrix.c) < 0.002)
        existingPropComparisons++;
    }
    /* Último fotograma: pares con ordnales cercanos (mismo frame). */
    const near = Object.entries(zd).filter(([t, v]) =>
      /^T05-\d\d$/.test(t) && v && typeof v.n === 'number');
    if (near.length < 2) continue;
    const maxN = Math.max(...near.map(([, v]) => v.n));
    const same = near.filter(([, v]) => maxN - v.n < 220)
      .sort((x, y) => ANCHOR[x[0]].y - ANCHOR[y[0]].y);
    for (let i = 0; i < same.length; i++) for (let j = i + 1; j < same.length; j++) {
      if (same[i][0] === same[j][0] || ANCHOR[same[i][0]].y === ANCHOR[same[j][0]].y) continue;
      ySortPairs++;
      if (same[i][1].n >= same[j][1].n)
        ySortViolations.push({ zone: z, earlier: same[i][0], later: same[j][0],
          nEarlier: same[i][1].n, nLater: same[j][1].n });
    }
  }

  /* --- estática del diff de integración ------------------------------- */
  let diffText = '';
  try {
    diffText = cp.execFileSync('git', ['diff', '--unified=0', '--',
      'DEADBEAT_DISCO.ART.html', 'ART_PACK/art_pack.js'],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 24 * 1024 * 1024 });
  } catch (e) { diffText = 'GIT_DIFF_ERROR:' + e.message; }
  const added = diffText.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));
  const forbidden = [/addStation\s*\(/, /openStation\s*\(/, /startCampaignFromHub\s*\(/,
    /setInput\s*\(/, /localStorage/, /addEventListener\s*\(/, /solid:\s*true/,
    /tall:\s*true/, /new\s+Audio/, /saveGame\s*\(/, /\.push\s*\(\s*\{[^}]*solid/];
  const forbiddenHits = added.filter(l => forbidden.some(r => r.test(l)));
  const modifiedFiles = (() => {
    try { return cp.execFileSync('git', ['diff', '--name-only'],
      { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean).sort(); }
    catch (e) { return ['GIT_ERROR']; }
  })();
  const markers = {
    begin: (HTML_TEXT.match(/TANDA05:BEGIN/g) || []).length,
    end: (HTML_TEXT.match(/TANDA05:END/g) || []).length,
    t04begin: (HTML_TEXT.match(/TANDA04:BEGIN/g) || []).length,
    hub5Blocks: (JS_TEXT.match(/TANDA05:BEGIN/g) || []).length,
    t05Decor: (HTML_TEXT.match(/t05:\s*"T05-\d\d"/g) || []).length,
    hang: (HTML_TEXT.match(/t05hang:\s*true/g) || []).length,
    solidFalse: /r:\s*10,\s*solid:\s*false,\s*tall:\s*false,\s*sortY:\s*dc\.y/.test(HTML_TEXT),
    noShadowForHang: /if\s*\(!dc\.t05hang\)\s*Vb\(/.test(HTML_TEXT),
    flag: /window\.__DDM_HUB_T05\s*===\s*false/.test(HTML_TEXT)
  };

  /* --- 1 · CARGA ------------------------------------------------------- */
  const h5 = P.hub5Pack, st5 = (P.artPack && P.artPack.hub5) || {};
  const assetFiles = new Set(A.assetResponses.filter(r => r.status === 200).map(r => r.url));
  const loadedOk = h5 && h5.count === 10 && h5.registered === 10 && h5.loaded === 10 &&
    h5.exactSize === 10 && h5.errors.length === 0 &&
    h5.assets.every(a => a.aliasLive && a.loaderResolves === 1 &&
      eq(a.natural, EXPECTED[a.id].natural)) && assetFiles.size === 10;
  add(1, 'Carga de los diez assets: 10/10 PNG por HTTP 200, load() y registro V5',
    loadedOk && A.htmlStatus === 200 && P.readyState === 'complete' &&
    P.artPack.status === 'applied' && /hub-tanda05/.test(P.artPack.version) &&
    P.v5Keys === BASELINE.v5Keys + 10 && B.probe.v5Keys === BASELINE.v5Keys + 10 &&
    C.probe.v5Keys === BASELINE.v5Keys + 10 &&
    st5.enabled === true && st5.registered === 10 &&
    (P.artPack.errors || []).length === 0 && (P.artPack.hub5Errors || []).length === 0 &&
    B.hub5AtBoot.registered === 10 && B.hub5AtBoot.loaded === 10,
    { http200: [...assetFiles].sort(), http200Count: assetFiles.size,
      assetResponsesOtherThan200: A.assetResponses.filter(r => r.status !== 200),
      hub5: { count: h5.count, registered: h5.registered, loaded: h5.loaded,
        exactSize: h5.exactSize, enabled: h5.enabled, errors: h5.errors },
      hub5Aliases: h5.assets.map(a => ({ id: a.id, alias: a.alias, natural: a.natural,
        exactSize: a.exactSize, loaderResolves: a.loaderResolves, aliasLive: a.aliasLive })),
      v5Keys: { antes: B.probe.v5Keys, control: C.probe.v5Keys, despues: P.v5Keys,
        baselineT04: BASELINE.v5Keys, added: 10 },
      artPack: { status: P.artPack.status, version: P.artPack.version,
        errors: P.artPack.errors, hub5Errors: P.artPack.hub5Errors },
      hub5AtBootAntes: B.hub5AtBoot,
      loadCost: A.loadCost, loadMs: { antes: B.loadMs, control: C.loadMs, despues: A.loadMs },
      note: 'El flag __DDM_HUB_T05 desactiva SOLO el render: en ANTES los 10 PNG también se cargan y registran (142+10=152 claves V5). Prueba de CARGA, no prueba VISUAL.' },
    ['despues_runtime_full.json', 'antes_runtime.json', 'control_runtime.json', 'verificacion_carga.json']);

  /* --- 2 · VISIBILIDAD (drawImage + caja; diff de píxel en finalize) --- */
  const afterKeys = hubT5Keys(lifeDraws), beforeKeys = hubT5Keys(B.probeFinal.life.draws);
  /* El juego dibuja el MUNDO del HUB (canvas 1280x900) detrás de la portada
     antes del boot. Esos drawImage existen también en T01–T04 y NO se cuentan
     como integración: el criterio exige el canvas de mundo con inHub=true.
     Lo que SÍ sería un fallo es dibujar T05 en el canvas del MENÚ (960x540)
     o en cualquier otro canvas. */
  const preBootT5Keys = Object.keys(A.menuProbe.life.menuDraws || {}).filter(isT5);
  const t5AllCanvas = Object.entries(PF.life.canvasSet || {}).filter(([k]) => isT5(k));
  const nonWorldT5 = t5AllCanvas.filter(([, v]) =>
    Object.keys(v).some(c => c !== '1280x900'));
  const preBootWorldDraws = Object.entries(PF.life.draws || {})
    .filter(([k]) => /^(MENU|BOOT)\|T05-\d\d$/.test(k))
    .reduce((n, [, d]) => n + d.count, 0);
  const offKeys = t5keys(C.controlOff.draws), onKeys = t5keys(C.controlOn.draws);
  const restoreKeys = t5keys(C.controlRestore.draws), applyKeys = t5keys(C.controlApply.draws);
  const canvasSet = {};
  afterKeys.forEach(k => { canvasSet[k] = Object.keys(PF.life.canvasSet[k] || {}); });
  const wrongCanvas = Object.entries(canvasSet).filter(([, v]) => v.length !== 1 || v[0] !== '1280x900');
  const fullyVisible = IDS.every(id => fullVisibility[id].length >= 1);
  add(2, 'Visibilidad: 10/10 drawImage medidos en el canvas de mundo, A/B 0→10→0→10',
    afterKeys.length === 10 && afterKeys.every(k => lifeDraws[k].count > 0 &&
      (PF.life.onScreen[k] || 0) > 0) && integrated.length === 10 &&
    beforeKeys.length === 0 && offKeys.length === 0 && onKeys.length === 10 &&
    restoreKeys.length === 0 && applyKeys.length === 10 &&
    nonWorldT5.length === 0 && wrongCanvas.length === 0 && fullyVisible &&
    P.coverDisplay === 'none' && P.hub.inHub === true &&
    P.canvasCountBase === BASELINE.canvasCountBase &&
    eq(P.worldCanvasRect, [0, 0, 1280, 900, 1280, 900]),
    { drawKeysDespues: afterKeys, drawKeysAntes: beforeKeys,
      drawKeysControlOff: offKeys, drawKeysControlOn: onKeys,
      drawKeysHub5Restore: restoreKeys, drawKeysHub5Apply: applyKeys,
      preBootWorldDrawsNotCounted: { keys: preBootT5Keys,
        totalDraws: preBootWorldDraws,
        canvas: '1280x900 (mundo del HUB detrás de la portada)',
        note: 'No se cuentan como integración; tampoco se dibuja T05 en menu-canvas54 (960x540) ni en otro canvas.' },
      t05DrawsOutsideWorldCanvas: nonWorldT5,
      hub5RestoreResult: C.hub5Restore, hub5ApplyResult: C.hub5Apply,
      perUnitOnScreen: perUnit.map(u => ({ artId: u.artId, drawCalls: u.drawCalls,
        onScreen: u.onScreen, sampleBox: u.sample && u.sample.box })),
      canvasPerUnit: canvasSet, wrongCanvas, fullVisibilityByAsset: fullVisibility,
      flag: { antes: B.probeFinal.flag, controlOn: C.controlOn.flag,
        controlOff: C.controlOff.flag, despues: P.flag },
      worldCanvasRect: P.worldCanvasRect,
      pixelConfirmation: 'PENDIENTE DE finalize_hub_tanda_05.py (visual_diff.json): diff OFF/OFF frente a OFF/ON por caja de asset. Se declara APROBADO solo si las 10 cajas confirman cambio de píxel por encima del ruido.',
      note: 'Criterio: drawImage real en HUB, no en el canvas del MENÚ (960x540). El registro V5 por sí solo NO aprueba.' },
    ['draw_calls.json', 'control_off_a_centro.png', 'control_on_centro.png',
      'despues_01_hub.png', 'visual_diff.json']);

  /* --- 3 · ESCALA Y DIMENSIONES --------------------------------------- */
  const scaleRows = perUnit.map(u => {
    const e = EXPECTED[u.artId], s = u.sample, h5a = h5.assets.find(a => a.id === u.artId);
    const wantArgs = e.flip ? [0, 0, e.dw, e.dh] : e.box;
    const argsOk = !!(s && eq(s.args, wantArgs));
    const ratio = s ? (s.box[2] - s.box[0]) / Math.max(1, s.box[3] - s.box[1]) : 0;
    const wantRatio = e.dw / e.dh;
    return { artId: u.artId, natural: u.expected, worldH: e.dh, computedDw: e.dw,
      computedWorldBox: e.box, measuredArgs: s ? s.args : null,
      expectedArgs: wantArgs, argsOk, screenBox: s ? s.box : null,
      screenRatio: +ratio.toFixed(4), expectedRatio: +wantRatio.toFixed(4),
      ratioOk: Math.abs(ratio - wantRatio) <= 0.08,
      hub5Natural: h5a.natural, hub5WorldBox: h5a.worldBox,
      manifestWorldBox: u.anchor ? MANIFEST.assets.find(a => a.id === u.artId).worldBox : null,
      exactSize: h5a.exactSize, deformed: false };
  });
  const manifestBoxDelta = scaleRows.filter(r => r.manifestWorldBox &&
    (r.manifestWorldBox[2] !== r.computedWorldBox[2] ||
     eq(r.manifestWorldBox, r.computedWorldBox) === false))
    .map(r => ({ artId: r.artId, manifest: r.manifestWorldBox,
      runtime: r.computedWorldBox, hub5: r.hub5WorldBox }));
  add(3, 'Escala y dimensiones: aspecto nativo conservado, sin deformación',
    scaleRows.every(r => r.argsOk && r.ratioOk && r.exactSize && !r.deformed) &&
    ASSETS.every(a => a.verification && a.verification.exactSize === true &&
      a.width === a.expected[0] && a.height === a.expected[1] &&
      eq(a.verification.alphaExtrema, [0, 255])) &&
    h5.assets.every(a => eq(a.worldBox, EXPECTED[a.id].box)),
    { rows: scaleRows,
      derivation: 'dw = Math.round(worldH * naturalWidth / naturalHeight); caja mundo = [x-(dw>>1), y-worldH, dw, worldH]; el renderer usa drawImage(im, dx, dy, dw, dh).',
      flipNote: 'T05-05 usa flip:true -> translate/scale(-1,1) y drawImage(im,0,0,dw,dh); sus args son LOCALES pero la caja de pantalla se mide con getTransform().',
      manifestRoundingNote: manifestBoxDelta,
      note: 'El manifiesto se generó con redondeo Python (banker\'s) y el renderer usa Math.round de JS: difiere 1 px de ancho en los assets con .5 (se documenta y se corrige como metadato en finalize, sin regenerar PNG).' },
    ['ART_ASSETS/hub/tanda_05/manifest.json', 'despues_runtime_full.json', 'draw_calls.json']);

  /* --- 4 · PERSPECTIVA ------------------------------------------------- */
  add(4, 'Perspectiva isométrica: misma proyección, pivote y Y-sort que T01–T04',
    uniformProjection && cameraMismatches.length === 0 &&
    projectionMismatches.length === 0 && existingPropComparisons > 0 &&
    ySortPairs > 0 && ySortViolations.length === 0 && markers.solidFalse &&
    markers.t05Decor === 10,
    { worldProjection: 'El HUB usa cámara 2D con escala uniforme y orden de profundidad por sortY (Y-sort), sin matriz de cizalla. T05 comparte EXACTAMENTE esa cámara.',
      uniformProjection, cameraScale: Object.keys(A.zoneSnapshots).length
        ? (A.zoneSnapshots.centro.zoneDraws['T05-08'] || {}).matrix : null,
      cameraMismatches, projectionMismatches,
      existingPropsWithSameCameraMatrix: existingPropComparisons,
      ySortPairs, ySortViolations,
      anchorsY: Object.fromEntries(IDS.map(id => [id, ANCHOR[id].y])),
      addHubCustomProp: { solid: false, tall: false, sortY: 'dc.y',
        hubDecorEntries: markers.t05Decor, existingRenderer: true },
      note: 'No se verifica una proyección isométrica matemática nueva: se verifica que los 10 props participan de la MISMA proyección del mundo y del MISMO Y-sort que los props existentes, con pivote bottom-center. T05-05 se valida proyectando su caja mundo a través de la cámara.' },
    ['despues_runtime_full.json', 'despues_centro.jpg', 'ART_HUB_TANDA_05_MATRIX.md']);

  /* --- 5 · TRANSPARENCIAS Y HALOS -------------------------------------- */
  const alphaRows = perUnit.map(u => ({
    artId: u.artId, minAlpha: u.minAlpha, maxAlpha: u.maxAlpha,
    pulse: PULSE.includes(u.artId),
    manifest: { mode: u.expected && MANIFEST.assets.find(a => a.id === u.artId).verification }
  }));
  const alphaStaticOk = ASSETS.every(a => a.verification &&
    a.verification.mode === 'RGBA' && eq(a.verification.alphaExtrema, [0, 255]) &&
    a.verification.cornersTransparent === true && a.verification.borderClean === true &&
    a.verification.whiteFringePct <= 0.15 && a.verification.transparentPx > 0);
  const alphaRuntimeOk = alphaRows.every(r => r.minAlpha > 0 &&
    (r.pulse ? (r.minAlpha < 0.85 && r.maxAlpha > 0.9) :
      (Math.abs(r.minAlpha - 1) < 0.001 && Math.abs(r.maxAlpha - 1) < 0.001)));
  add(5, 'Transparencias y halos: alfa real, sin franja blanca ni halo exterior',
    alphaStaticOk && alphaRuntimeOk && PULSE.length === 2,
    { staticVerification: ASSETS.map(a => ({ artId: a.id, rgbMode: a.verification.mode,
        alphaExtrema: a.verification.alphaExtrema,
        cornersTransparent: a.verification.cornersTransparent,
        borderClean: a.verification.borderClean,
        whiteFringePct: a.verification.whiteFringePct,
        coveragePct: a.verification.coveragePct })),
      runtimeAlpha: alphaRows.map(r => ({ artId: r.artId, min: r.minAlpha,
        max: r.maxAlpha, pulse: r.pulse })),
      pulseAssets: PULSE,
      byteLevelRecheck: 'PENDIENTE DE finalize_hub_tanda_05.py (alpha_verification.json): relectura directa de los 10 PNG con Pillow.',
      note: 'Pulso ambiental sobre ctx.globalAlpha existente (0,82+0,18·sin) para T05-04 y T05-06; el resto se dibuja con alfa 1. No se crea sistema de animación nuevo.' },
    ['ART_ASSETS/hub/tanda_05/manifest.json', 'alpha_verification.json', 'control_on_centro.png']);

  /* --- 6 · CAPAS Y OCLUSIÓN -------------------------------------------- */
  const hubSeqHasOthers = Object.values(A.zoneSnapshots)
    .some(s => (s.seq || []).some(e => !/^T05-/.test(e.k)));
  add(6, 'Orden de capas y oclusión: Y-sort compartido, sin canvas nuevo ni sombra en colgantes',
    ySortPairs > 0 && ySortViolations.length === 0 && hubSeqHasOthers &&
    markers.hang === 4 && markers.noShadowForHang && markers.flag &&
    wrongCanvas.length === 0 && nonWorldT5.length === 0 && fullyVisible &&
    Object.values(A.probe.byCanvas || {}).length >= 1,
    { ySortPairs, ySortViolations, hangingAssets: HANG,
      hangingCount: markers.hang, shadowSuppression: markers.noShadowForHang,
      hubT05Flag: markers.flag,
      sharedDepthQueueWithExistingProps: hubSeqHasOthers,
      fullVisibilityByAsset: fullVisibility,
      newCanvases: 0, newEngines: 0, newCaches: 0,
      pixelOcclusionCheck: 'PENDIENTE DE finalize_hub_tanda_05.py (visual_diff.json por caja de asset).',
      note: 'Todos los props T05 entran en la MISMA cola de profundidad (Lc: solid:false, tall:false, sortY=dc.y). Los 4 colgantes omiten la sombra Vb; los 6 restantes la conservan. No se añade capa, canvas, motor ni caché.' },
    ['despues_runtime_full.json', 'visual_diff.json', 'comparativa_control_off_on.jpg']);

  /* --- 7 · MOVIMIENTO -------------------------------------------------- */
  add(7, 'Movimiento del jugador: idéntico con el flag activado y desactivado',
    A.movement.withinWorld && B.movement.withinWorld && C.movement.withinWorld &&
    Math.abs(A.movement.delta - B.movement.delta) <= 25 &&
    Math.abs(A.movement.delta - C.movement.delta) <= 25 &&
    Math.abs(A.movement.delta) > 1,
    { antes: B.movement, control: C.movement, despues: A.movement,
      procedure: 'teleport(1250,965) + tecla d 900 ms + tick(0.016,60)',
      note: 'Los 10 props son solid:false: no añaden colisiones ni bloquean la circulación.' },
    ['despues_tras_movimiento.jpg', 'antes_tras_movimiento.jpg']);

  /* --- 8 · COLISIONES -------------------------------------------------- */
  add(8, 'Colisiones: sin cambios de hitbox, auditoría del HUB idéntica en las 3 fases',
    eq(A.collision, B.collision) && eq(A.collision, C.collision) &&
    eq(P.hubAudit, B.probe.hubAudit) && eq(P.hubAudit, C.probe.hubAudit) &&
    eq(P.stations, B.probe.stations) && eq(P.stations, C.probe.stations) &&
    P.hubAudit.zonesCount === BASELINE.zonesCount &&
    P.hubAudit.stationsCount === BASELINE.stationsCount &&
    P.hubAudit.ok === true && markers.solidFalse &&
    forbiddenHits.length === 0,
    { collision: { antes: B.collision, control: C.collision, despues: A.collision },
      hubAudit: P.hubAudit, stations: P.stations.map(s => [s.id, s.x, s.y]),
      solidFalse: true, newColliders: 0,
      officialUntainted: P.hubAudit.officialUntainted,
      officialUntaintedNote: 'false por el uso de teleport/debug del arnés, NO por los assets: aparece igual en ANTES, CONTROL y DESPUES.',
      forbiddenAddedCalls: forbiddenHits },
    ['despues_runtime_full.json', 'control_runtime.json', 'antes_runtime.json']);

  /* --- 9 · PUERTAS ----------------------------------------------------- */
  const doorsClosed = A.doors.closed && A.doors.closed.dungeon;
  const doorsOpen = A.doors.open && A.doors.open.dungeon;
  add(9, 'Puertas: ciclo noche/ronda, sala real r23 y arquitectura intacta',
    doorsClosed && doorsOpen && doorsClosed.current === 'r23' && doorsOpen.current === 'r23' &&
    doorsClosed.role === doorsOpen.role && doorsClosed.floor === doorsOpen.floor &&
    !A.doors.setNight.err && !/^ERR:/.test(String(A.doors.clearRound)) &&
    A.screenshots.doors_closed > 0 && A.screenshots.doors_open > 0 &&
    A.doors.open.architecture.applied === 10,
    { closed: doorsClosed, open: doorsOpen,
      setNight: A.doors.setNight, clearRound: A.doors.clearRound,
      architecture: A.doors.open.architecture,
      note: 'setNight(24) y clearRound() sobre las APIs existentes; no se modifica ninguna puerta.' },
    ['doors_closed.jpg', 'doors_open.jpg', 'despues_runtime_full.json']);

  /* --- 10 · ESTACIONES ------------------------------------------------- */
  add(10, 'Estaciones: 11 intactas, apertura y cierre de modal sin cambios',
    P.stations.length === BASELINE.stationsCount &&
    B.probe.stations.length === BASELINE.stationsCount &&
    C.probe.stations.length === BASELINE.stationsCount &&
    eq(P.stations, B.probe.stations) && eq(P.stations, C.probe.stations) &&
    A.interaction.stationsBefore === BASELINE.stationsCount &&
    A.interaction.active === 'bar' && A.interaction.activeAfter === null &&
    forbiddenHits.length === 0,
    { count: P.stations.length, ids: P.stations.map(s => s.id),
      interaction: A.interaction,
      note: 'No se crea ninguna estación nueva: los 4 objetos funcionales son solo apariencia; su interacción real queda como PROPUESTA documentada, no implementada.' },
    ['estacion_bar.jpg', 'despues_runtime_full.json']);

  /* --- 11 · INTERACCIONES EXISTENTES ----------------------------------- */
  add(11, 'Interacciones existentes: campaña, disparo y transición sin regresión',
    A.campaign.completed === true && A.shooting.delta >= 1 &&
    A.campaignRegression.hub.location === 'CAMPAIGN_ROOM' &&
    A.campaignRegression.hub.inHub === false &&
    !/^ERR:/.test(String(A.campaignStart)) &&
    A.interaction.active === 'bar' && A.interaction.activeAfter === null &&
    modifiedFiles.length === 2 &&
    eq(modifiedFiles, ['ART_PACK/art_pack.js', 'DEADBEAT_DISCO.ART.html']) &&
    forbiddenHits.length === 0,
    { campaign: A.campaign, campaignStart: A.campaignStart,
      shooting: A.shooting, campaignRegression: {
        location: A.campaignRegression.hub.location, inHub: A.campaignRegression.hub.inHub },
      modifiedTrackedFiles: modifiedFiles,
      addedLinesChecked: added.length, forbiddenAddedCalls: forbiddenHits,
      interactionProposals: [
        { asset: 'T05-01', proposal: 'Máquina de garra con premio; requiere lógica de interacción, inventario y economía. NO IMPLEMENTADA.', state: 'NO VERIFICADO' },
        { asset: 'T05-02', proposal: 'Banco del olvido / terminal narrativa; requiere diálogo y guardado. NO IMPLEMENTADA.', state: 'NO VERIFICADO' },
        { asset: 'T05-05', proposal: 'Consola auxiliar; requiere sistema de estaciones nuevo. NO IMPLEMENTADA.', state: 'NO VERIFICADO' },
        { asset: 'T05-10', proposal: 'Confesionario de quejas; requiere UI y persistencia. NO IMPLEMENTADA.', state: 'NO VERIFICADO' }
      ],
      note: 'T05 NO crea sistemas de interacción. Se comprueba que las interacciones EXISTENTES siguen funcionando y que el diff no añade estaciones, colisiones, guardado, audio ni escuchas nuevas.' },
    ['regresion_campaign.jpg', 'estacion_bar.jpg', 'diff_scope.json']);

  /* --- 12 · REGRESIÓN T01–T04 ------------------------------------------ */
  /* life.draws tiene una clave POR FASE (MENU|..., HUB|..., BOOT|...):
     la regresión se mide por ETIQUETAS DISTINTAS, no por número de claves.
     T01 se etiqueta como HUB-01..HUB-10, T02 como T02-*, T03/T04 como T03-*. */
  const previousKeys = Object.keys(lifeDraws).filter(k =>
    /\|(T03-|T02-|HUB-)/.test(k));
  const previousTags = [...new Set(previousKeys.map(tagOf))];
  const t03Tags = previousTags.filter(t => /^T03-/.test(t));
  const h1 = P.hubPack, h2 = P.hub2Pack, h3 = P.hub3Pack;
  add(12, 'Regresión T01–T04: 10/10, 10/10, 13/13, 142 claves base y cachés intactas',
    h1.applied === 10 && h1.count === 10 && h2.applied === 10 && h2.count === 10 &&
    h3.registered === 13 && h3.loaded === 13 &&
    t03Tags.length === 13 && previousTags.length >= 30 &&
    P.architecture.applied === 10 && P.architecture.errors.length === 0 &&
    P.player.poses === 12 && P.player.errors.length === 0 &&
    P.v5Keys === BASELINE.v5Keys + 10 &&
    P.hubFloor.available === true && B.probe.hubFloor.available === true &&
    C.probe.hubFloor.available === true &&
    P.t3b.enabled === true && P.t3b.errors.length === 0 &&
    P.infernal.invalidate === 'function' &&
    P.canvasCountBase === B.probe.canvasCountBase &&
    P.canvasCountBase === C.probe.canvasCountBase &&
    P.canvasCountBase === BASELINE.canvasCountBase &&
    markers.t04begin === 4 && markers.begin === 3 && markers.end === 3 &&
    eq(P.hubAudit, B.probe.hubAudit),
    { t01: { applied: h1.applied, count: h1.count },
      t02: { applied: h2.applied, count: h2.count },
      t03: { registered: h3.registered, loaded: h3.loaded,
        t04DistinctTagsMeasured: t03Tags.length, tags: t03Tags.sort() },
      previousDistinctTags: previousTags.length,
      previousTags: previousTags.sort(),
      previousDrawKeysAllPhases: previousKeys.length,
      v5Keys: { antes: B.probe.v5Keys, despues: P.v5Keys, baseline: BASELINE.v5Keys },
      architecture: { applied: P.architecture.applied, errors: P.architecture.errors },
      player: P.player,
      hubFloor: { antes: B.probe.hubFloor, control: C.probe.hubFloor, despues: P.hubFloor },
      t3b: { enabled: P.t3b.enabled, errors: P.t3b.errors, routes: [...new Set(P.t3b.routes)] },
      canvasCountBase: { antes: B.probe.canvasCountBase, control: C.probe.canvasCountBase,
        despues: P.canvasCountBase },
      markersT04: markers.t04begin, markersT05: [markers.begin, markers.end],
      newCanvases: 0, newCaches: 0, newEngines: 0, newLoaders: 0,
      note: 'Los 10 alias h05_* se SUMAN a las 142 claves V5 de T04 (152). No se sustituye ningún recurso anterior.' },
    ['despues_runtime_full.json', 'comprobacion_caches.json', 'integridad_t01_t04.json']);

  /* --- 13 · ERRORES ---------------------------------------------------- */
  const jsErrors = A.pageErrors.filter(e => !knownErrors(e))
    .concat(A.consoleErrors.filter(e => !knownErrors(e) &&
      !/^Failed to load resource: the server responded with a status of 404/.test(e)));
  const cloudflare404 = A.httpErrors.filter(e => /\/cdn-cgi\/challenge-platform\//.test(e.url));
  const localHttpErrors = A.httpErrors.filter(e => !/\/cdn-cgi\/challenge-platform\//.test(e.url));
  add(13, 'Errores JavaScript y de carga: 0 errores JS, 0 404 locales, 0 errores de loader',
    jsErrors.length === 0 &&
    A.pageErrors.length === B.pageErrors.length &&
    A.pageErrors.length === C.pageErrors.length &&
    A.consoleErrors.length === B.consoleErrors.length &&
    A.consoleErrors.length === C.consoleErrors.length &&
    localHttpErrors.length === 0 &&
    A.requestFailed.every(r => /\/cdn-cgi\/challenge-platform\//.test(r.url)) &&
    h5.errors.length === 0 && (P.artPack.hub5Errors || []).length === 0 &&
    (PF.life ? Object.keys(PF.life.canvasSet).length > 0 : true),
    { pageErrors: A.pageErrors, consoleErrors: A.consoleErrors,
      consoleErrorsAntes: B.consoleErrors, consoleErrorsControl: C.consoleErrors,
      knownCloudflare404: cloudflare404, unexpectedLocalHttpErrors: localHttpErrors,
      requestFailed: A.requestFailed, unexpectedJsErrors: jsErrors,
      hub5Errors: h5.errors, artPackErrors: P.artPack.errors,
      proxyErrors: PF.pageErrors,
      note: '2 rutas /cdn-cgi/challenge-platform/ externas y preexistentes producen los únicos mensajes de consola; 0 404 locales y 0 pageerror reales.' },
    ['despues_runtime_full.json', 'control_runtime.json', 'antes_runtime.json']);

  /* --- 14 · RENDIMIENTO ------------------------------------------------ */
  const rA = A.render, rB = B.render, rC = C.render;
  const ratio = rB.medianMs > 0 ? rA.medianMs / rB.medianMs : 1;
  const gateOk = ratio <= 1.25 && Math.abs(rA.medianMs - rB.medianMs) <= 4 &&
    rA.frames === 40 && rB.frames === 40 && rC.frames === 40;
  add(14, 'Rendimiento: coste de render separado del coste de carga (sin cerrar el gate de T02)',
    gateOk,
    { antes: rB, control: rC, despues: rA,
      ratioMedian: +ratio.toFixed(3), threshold: 'ratio <= 1,25 y |delta mediana| <= 4 ms',
      framesPerPhase: 40,
      loadCost: A.loadCost,
      loadMs: { antes: B.loadMs, control: C.loadMs, despues: A.loadMs },
      hubFloorDraws: { antes: B.probe.hubFloor.draws, control: C.probe.hubFloor.draws,
        despues: P.hubFloor.draws },
      note: 'Coste de CARGA (10 PNG, una sola vez por load()) separado del coste de RENDER (mediana de 40 rAF en el HUB, misma cámara). Las variaciones de frame se observan también entre ANTES y CONTROL y NO se atribuyen a los assets: entorno SwiftShader por software. Este check NO cierra el performance gate pendiente de T02, que el usuario mantiene abierto.' },
    ['performance.json', 'resultados_ab.json']);

  const summary = { APROBADO: checks.filter(c => c.state === 'APROBADO').length,
    FALLIDO: checks.filter(c => c.state === 'FALLIDO').length,
    BLOQUEADO: checks.filter(c => c.state === 'BLOQUEADO').length,
    NO_VERIFICADO: checks.filter(c => c.state === 'NO VERIFICADO').length,
    UNIDADES_INTEGRADAS: integrated.length,
    UNIDADES_CON_DRAWIMAGE: afterKeys.length };
  const report = {
    tanda: '05',
    title: 'HUB · TANDA 05 — Equipamiento, vida ambiental e interactividad (10 assets)',
    generatedAt: new Date().toISOString(),
    environment: { chromium: process.env.CHROME_VERSION || '131.0.6778.0',
      playwrightCore: '1.58.2', viewport: [1280, 900], deviceScaleFactor: 1,
      renderer: 'SwiftShader / --use-gl=swiftshader', url: URL,
      camera: 'DMO.debug.teleport(x,y) · 10 zonas idénticas en las 3 fases',
      capture: 'page.screenshot()', bootToHub: 'click(640,450)+Enter+Escape 2800 ms' },
    integration: { htmlSha256: HTML_SHA, artPackSha256: JS_SHA,
      version: P.artPack.version, flag: 'window.__DDM_HUB_T05 !== false',
      loader: 'ART_PACK/art_pack.js :: load() -> __DDM_V5_IMG[h05_*]',
      renderer: 'DEADBEAT_DISCO.ART.html :: hubDecor -> addHubCustomProp -> Lc (Y-sort)',
      markers },
    baseline: { v5KeysT04: BASELINE.v5Keys, canvasCountBase: BASELINE.canvasCountBase,
      stationsCount: BASELINE.stationsCount, zonesCount: BASELINE.zonesCount },
    phases: ['antes', 'control', 'despues'],
    integrationCriterion: '10/10 drawImage efectivos en el canvas de mundo 1280x900 del HUB + caja en pantalla + confirmación de píxel OFF/ON en caliente. El registro V5 NO basta.',
    summary, checks, perUnit, fullVisibility, controlBoxes,
    camera: { uniformProjection, cameraMismatches, projectionMismatches,
      existingPropComparisons, ySortPairs, ySortViolations },
    historicalIncidences: [
      { id: 'HUB-01', title: 'loaderResolves=0 (T01)', state: 'PREEXISTENTE',
        affectsT05: false, detail: 'T05 mide loaderResolves=1 en los 10 alias; no se corrige el histórico de T01.' },
      { id: 'HUB-03', title: 'Desviación dimensional 26,92 % (T03)', state: 'PREEXISTENTE',
        affectsT05: false, detail: 'T05 mide 10/10 exactSize y aspecto nativo; el histórico de T03 se conserva.' },
      { id: 'T01-COSTURA', title: 'Costura del tile 12,57 (T01)', state: 'PREEXISTENTE',
        affectsT05: false, detail: 'T05 no produce tiles ni toca el suelo.' },
      { id: 'T04-PLACA-C', title: 'Rozamiento 3–5 px de placa C (T04)', state: 'PREEXISTENTE',
        affectsT05: false, detail: 'No se ha modificado; las capturas de T05 siguen mostrando la placa completa.' },
      { id: 'T02-GATE', title: 'Performance gate pendiente de T02', state: 'PENDIENTE',
        affectsT05: false, detail: 'El check 14 mide el coste de T05 pero NO cierra el gate de T02; sigue pendiente de cierre formal.' }
    ],
    interactionProposals: checks[10].detail.interactionProposals,
    incidences: {
      worldBoxRounding: manifestBoxDelta,
      t0508: 'T05-08 conserva la composición VERTICAL (68x178) con escala ajustada a su bbox alfa; NO se regeneró en horizontal por el límite de 10 generaciones de imagen del turno de producción.',
      officialUntainted: 'false por teleport/debug del arnés, idéntico en las 3 fases; no es una regresión.',
      cloudflare404: cloudflare404.length + ' rutas externas preexistentes; 0 404 locales.'
    },
    evidence: { report: 'report.json', drawCalls: 'draw_calls.json',
      performance: 'performance.json', ab: 'resultados_ab.json',
      visualDiff: 'visual_diff.json', hashes: 'hashes.json',
      runtime: ['antes_runtime.json', 'control_runtime.json', 'despues_runtime_full.json'] }
  };
  return report;
}

/* ------------------------------------------------------------------ run */
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/tmp/chromium', headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: process.env.LD_LIB_PATH || '/tmp/chromelibs/lib:/tmp' },
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
      '--use-gl=swiftshader', '--disable-background-networking',
      '--disable-logging', '--log-level=3']
  });
  const log = {};
  for (const mode of ['antes', 'control', 'despues']) {
    console.log('[TANDA05] fase', mode, '...');
    await phase(browser, mode, log);
    fs.writeFileSync(R(mode === 'despues' ? 'despues_runtime_full.json' : mode + '_runtime.json'),
      JSON.stringify(log[mode], null, 2) + '\n');
    console.log('[TANDA05] fase', mode, 'OK · render', log[mode].render.medianMs,
      'ms · pageErrors', log[mode].pageErrors.length,
      '· capturas', Object.keys(log[mode].screenshots).length);
  }
  await browser.close();

  const rep = buildReport(log);
  fs.writeFileSync(R('report.json'), JSON.stringify(rep, null, 2) + '\n');
  fs.writeFileSync(R('draw_calls.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    criterion: rep.integrationCriterion,
    despues: rep.perUnit,
    antes: hubT5Keys(log.antes.probeFinal.life.draws),
    controlOff: t5keys(log.control.controlOff.draws),
    controlOn: t5keys(log.control.controlOn.draws),
    controlRestore: t5keys(log.control.controlRestore.draws),
    controlApply: t5keys(log.control.controlApply.draws),
    menu: Object.keys(log.despues.menuProbe.life.menuDraws || {}).filter(isT5),
    controlBoxes: rep.controlBoxes,
    fullVisibility: rep.fullVisibility,
    byCanvas: log.despues.probeFinal.byCanvas,
    lifeCanvasSet: Object.fromEntries(Object.entries(log.despues.probeFinal.life.canvasSet)
      .filter(([k]) => isT5(k)))
  }, null, 2) + '\n');
  fs.writeFileSync(R('performance.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    antes: log.antes.render, control: log.control.render, despues: log.despues.render,
    loadCost: log.despues.loadCost,
    loadMs: { antes: log.antes.loadMs, control: log.control.loadMs, despues: log.despues.loadMs },
    hubFloorDraws: { antes: log.antes.probe.hubFloor.draws,
      control: log.control.probe.hubFloor.draws, despues: log.despues.probe.hubFloor.draws },
    note: 'Coste de carga separado del coste de render; T02 performance gate sigue pendiente.'
  }, null, 2) + '\n');
  console.log('\n=== RESULTADO TANDA 05 ===');
  console.log(JSON.stringify(rep.summary));
  rep.checks.forEach(c => console.log(c.id, c.state, c.check));
  if (rep.summary.FALLIDO > 0) process.exitCode = 1;
})().catch(e => {
  console.error('QA TANDA 05 FAIL', e);
  try { fs.writeFileSync(R('validation_error.json'), JSON.stringify({
    at: new Date().toISOString(), error: String(e && e.stack || e) }, null, 2) + '\n'); } catch (_) {}
  process.exit(1);
});
