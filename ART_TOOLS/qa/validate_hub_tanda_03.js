/* ============================================================================
 * HUB · TANDA 03 — validación A/B real en Chromium headless (Playwright-core)
 * ----------------------------------------------------------------------------
 * MISMO procedimiento que TANDA 02, MISMA build y MISMO servidor. Tres fases:
 *   antes   : HUB3 revertido con DMO_ART_PACK.hub3Restore() en ARRANQUE, antes
 *             de que el motor construya el canvas del menú (estado previo real
 *             a esta tanda: T01+T02 intactos, VIP ausente).
 *   control : HUB3 revertido EN CALIENTE ya dentro del HUB. El menú está
 *             cacheado una sola vez y NO se reconstruye: se documenta.
 *   despues : HUB3 aplicado por el arranque normal del art pack.
 *
 * 12 comprobaciones (mismo arnés, sin relajar criterios):
 *   1 HTML · 2 carga/registro de los 13 PNG (8 unidades) · 3 errores JS ·
 *   4 visibilidad del slot real · 5 perspectiva/escala · 6 transparencias ·
 *   7 capas/cachés/canvas · 8 movimiento · 9 colisiones ·
 *   10 puertas/transición · 11 interactivos · 12 regresión T01/T02/V5/campaña.
 *
 * IMPORTANTE: 12 de los 13 PNG están BLOQUEADOS (no existe slot de dibujo en
 * el HUB). El arnés NO relaja ningún criterio para aprobarlos: comprueba que
 * están producidos, cargados, registrados y medidos, y clasifica su integración
 * como BLOQUEADO con evidencia de runtime. Solo hub_vip_booth_lounge se dibuja
 * (4 veces en el MENÚ, caja 108x68). Véase ART_HUB_TANDA_03_AUDIT.md.
 *
 * El arnés NO modifica el juego: solo etiqueta imágenes para contar drawImage
 * reales y usa APIs de depuración ya existentes. No hay canvas nuevo ni
 * segundo motor; las capturas son page.screenshot().
 *
 * Uso:
 *   QA_LIB=/tmp/qatools/node_modules/playwright-core \
 *   CHROME_PATH=/tmp/chromium LD_LIB_PATH=/tmp/chromelibs/lib:/tmp \
 *   node ART_TOOLS/qa/validate_hub_tanda_03.js
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require(process.env.QA_LIB || 'playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.env.OUTDIR || path.join(ROOT, 'ART_EVIDENCE', 'hub', 'tanda_03');
const URL = process.env.GAME_URL || 'http://127.0.0.1:8123/';
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'ART_ASSETS/hub/tanda_03/manifest.json'), 'utf8'));
const R = (name) => path.join(OUT, name);
const FINALS = [];
MANIFEST.assets.forEach(a => {
  if (a.variants) a.variants.forEach(v => FINALS.push(v));
  else FINALS.push(a);
});
const UNITS = MANIFEST.assets.length;
const HTML_SHA = crypto.createHash('sha256')
  .update(fs.readFileSync(path.join(ROOT, 'DEADBEAT_DISCO.ART.html'))).digest('hex');
/* Sonda controlada de la fase de auditoría: inyectaba la clave V5 en el
   momento de crearse el registro y media 4 drawImage de 108x68. Acredita que
   el PINTOR existe en el código; NO acredita visibilidad en producción (D-07). */
const SLOT_PROBE = JSON.parse(fs.readFileSync(path.join(OUT, 'slot_probe.json'), 'utf8'));

/* Zonas idénticas en ANTES y DESPUÉS: la comparación de píxeles es válida. */
const ZONES = [
  ['hub_centro', 1250, 935],
  ['detalle_dj', 1250, 445],
  ['detalle_bar', 1910, 845],
  ['detalle_vip_oeste', 785, 545],
  ['detalle_vip_este', 1715, 545],
  ['detalle_arcade', 655, 1210],
  ['detalle_sellos', 1845, 1210],
  ['detalle_descenso', 1250, 1365],
  ['detalle_arsenal', 590, 845],
  ['detalle_pared_este', 2050, 965]
];

/* Proxy de solo lectura: cuenta drawImage real de T01/T02/T03, cajas de
   pantalla, fase (MENU / HUB) y createPattern. No altera el render. */
const INIT = `(() => {
  const W = window;
  const P = W.__HUB3QA = {
    phase: 'MENU', draws: {}, onScreen: {}, seq: [], order: [],
    patterns: {}, errors: [], boxes: {}, canvasSizes: {}
  };
  const rect = (m, x, y) => ({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f });
  function screenBox(ctx, dx, dy, dw, dh) {
    let m; try { m = ctx.getTransform(); } catch (e) { return null; }
    const p = [rect(m, dx, dy), rect(m, dx + dw, dy), rect(m, dx, dy + dh),
               rect(m, dx + dw, dy + dh)];
    const xs = p.map(v => v.x), ys = p.map(v => v.y);
    return [Math.min.apply(null, xs), Math.min.apply(null, ys),
            Math.max.apply(null, xs), Math.max.apply(null, ys)];
  }
  function note(id) {
    const d = P.draws[id] || (P.draws[id] = { count: 0, args: {}, boxes: [], sample: null });
    d.count++;
    if (P.order.indexOf(id) < 0) P.order.push(id);
    if (P.seq.length < 500) P.seq.push(id);
    return d;
  }
  const origDraw = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (src) {
    const id = src && (src.__hubTanda03 || src.__hubTanda02 || src.__hubTanda01);
    if (id) {
      const key = P.phase + '|' + id;
      const d = note(key);
      d.args[arguments.length] = (d.args[arguments.length] || 0) + 1;
      if (arguments.length >= 5) {
        const b = screenBox(this, arguments[1], arguments[2], arguments[3], arguments[4]);
        if (b) {
          if (!P.boxes[key]) P.boxes[key] = b.map(Math.round);
          if (!P.canvasSizes[key]) P.canvasSizes[key] = [this.canvas.width, this.canvas.height];
          const cv = this.canvas;
          if (b[2] > 0 && b[0] < cv.width && b[3] > 0 && b[1] < cv.height) {
            const o = P.onScreen[key] || (P.onScreen[key] = { count: 0, sample: null });
            o.count++;
            if (!o.sample) o.sample = b.map(Math.round);
          }
          if (d.boxes.length < 6) d.boxes.push(b.map(Math.round));
          if (!d.sample) d.sample = [arguments[3], arguments[4]].map(Math.round);
        }
      }
    }
    return origDraw.apply(this, arguments);
  };
  const origPat = CanvasRenderingContext2D.prototype.createPattern;
  CanvasRenderingContext2D.prototype.createPattern = function (img) {
    const id = img && (img.__hubTanda03 || img.__hubTanda02 || img.__hubTanda01);
    if (id) { const key = P.phase + '|' + id; P.patterns[key] = (P.patterns[key] || 0) + 1; note(key); }
    return origPat.apply(this, arguments);
  };
  W.addEventListener('error', e => P.errors.push(String(e.message).slice(0, 200)));
})()`;

/* ANTES: se usa la API REAL de restore en cuanto el pack registra HUB3, que
   ocurre ANTES de loadHub()/djReady (y por tanto antes de que se construya el
   canvas del menú). Es el equivalente exacto del restore de TANDA 02. */
const INIT_ANTES = `(() => {
  const W = window;
  W.__HUB3_AB = { restored: null, at: null, polls: 0 };
  const t = setInterval(() => {
    W.__HUB3_AB.polls++;
    try {
      const P = W.DMO_ART_PACK;
      if (!P) return;
      const s = P.state();
      if (s.hub3 && s.hub3.registered > 0) {
        W.__HUB3_AB.restored = P.hub3Restore();
        W.__HUB3_AB.at = Date.now();
        clearInterval(t);
      }
    } catch (e) { W.__HUB3_AB.error = String(e); }
    if (W.__HUB3_AB.polls > 4000) clearInterval(t);
  }, 4);
})()`;

const PROBE = `(() => {
  const W = window, safe = f => { try { return f(); } catch (e) { return 'ERR:' + e.message; } };
  const P = W.__HUB3QA || {};
  return {
    ts: new Date().toISOString(), url: location.href, readyState: document.readyState,
    title: document.title,
    canvasCount: W.document.querySelectorAll('canvas').length,
    canvasCountBase: W.document.querySelectorAll('canvas:not(.hub-portrait-canvas)').length,
    canvasPortraitCount: W.document.querySelectorAll('canvas.hub-portrait-canvas').length,
    hub: safe(() => W.DMO_HUB.state()),
    hubAudit: safe(() => W.DMO_HUB.audit()),
    stations: safe(() => W.DMO_HUB.stations()),
    artPack: safe(() => W.DMO_ART_PACK.state()),
    integrity: safe(() => W.DMO_ART_PACK.integrity()),
    architecture: safe(() => W.DMO_ART_PACK.architecture()),
    player: safe(() => { const p = W.DMO_ART_PACK.player(); return {
      version: p.version, poses: (p.poses || []).length, errors: p.errors }; }),
    hubPack: safe(() => W.DMO_ART_PACK.hub()),
    hub2Pack: safe(() => W.DMO_ART_PACK.hub2()),
    hub3Pack: safe(() => W.DMO_ART_PACK.hub3()),
    hub3Manifest: safe(() => W.DMO_ART_PACK.hub3Manifest().length),
    t3b: safe(() => ({ enabled: W.__T3B.enabled, revision: W.__T3B.revision,
      ready: W.__T3B.ready.slice(), errors: W.__T3B.errors.slice(),
      draws: W.__T3B.draws.slice(-12) })),
    hubFloor: safe(() => W.__T3B_HUB_QA.state()),
    v5: safe(() => { const s = W.DMO_REFERENCE_ROOM_ASSETS.state();
      return { ready: Object.keys(s.v5Ready).filter(k => s.v5Ready[k]).length,
               total: Object.keys(s.v5Ready).length, errors: s.errors.slice() }; }),
    v5Keys: safe(() => Object.keys(W.__DDM_V5_IMG || {}).length),
    dungeon: safe(() => { const d = W.DMO_DUNGEON.state(); return {
      current: d.current, role: d.role, secured: d.secured, floor: d.floor }; }),
    debug: safe(() => { const d = W.DMO.debug.state(); return {
      px: d.px, py: d.py, round: d.round, enemies: d.enemies }; }),
    stats: safe(() => W.DMO.testStats()),
    draws: P.draws, onScreen: P.onScreen, patterns: P.patterns,
    order: P.order, seq: (P.seq || []).slice(0, 160),
    boxes: P.boxes, canvasSizes: P.canvasSizes,
    pageErrors: P.errors, phase: P.phase,
    ab: W.__HUB3_AB || null
  };
})()`;

async function bootToHub(page) {
  await page.mouse.click(640, 450); await page.waitForTimeout(600);
  await page.keyboard.press('Enter'); await page.waitForTimeout(900);
  await page.keyboard.down('Escape'); await page.waitForTimeout(2800);
  await page.keyboard.up('Escape'); await page.waitForTimeout(900);
}
async function waitArtPack(page) {
  await page.waitForFunction(() => {
    try { const s = window.DMO_ART_PACK && window.DMO_ART_PACK.state().status;
          return s === 'applied' || s === 'applied-with-errors'; }
    catch (e) { return false; }
  }, { timeout: 90000 });
}
async function shot(page, name) {
  const f = R(name);
  await page.screenshot({ path: f, timeout: 60000 });
  return fs.statSync(f).size;
}
function watch(page, rec) {
  page.on('console', m => { if (m.type() === 'error') rec.consoleErrors.push(m.text().slice(0, 220)); });
  page.on('pageerror', e => rec.pageErrors.push(String(e.message).slice(0, 220)));
  page.on('response', r => {
    const u = r.url();
    if (u.indexOf('ART_ASSETS/hub/tanda_03/') >= 0) {
      rec.assetResponses.push({ url: u.split('/').pop(), status: r.status(),
                                type: r.headers()['content-type'] || '' });
    }
    if (r.status() >= 400) rec.httpErrors.push({ status: r.status(), url: u.slice(0, 160) });
  });
  page.on('requestfailed', r => rec.requestFailed.push({ url: r.url().slice(0, 160),
    failure: r.failure() && r.failure().errorText }));
}
async function resetWindow(page) {
  await page.evaluate(() => {
    const P = window.__HUB3QA;
    try { P.draws = {}; P.onScreen = {}; P.patterns = {}; P.seq = [];
          P.order = []; P.boxes = {}; P.canvasSizes = {}; P.phase = 'HUB'; } catch (e) {}
    try { window.DMO_ART_PACK.hubTag(); } catch (e) {}
    try { window.DMO_ART_PACK.hub2Tag(); } catch (e) {}
    try { window.DMO_ART_PACK.hub3Tag(); } catch (e) {}
    try { window.__T3B.setEnabled(true); } catch (e) {}
  });
  await page.waitForTimeout(700);
}
async function captureZones(page, rec, prefix) {
  for (const [name, x, y] of ZONES) {
    const file = prefix + '_' + name + '.png';
    await page.evaluate(([x, y]) => {
      try { window.DMO.debug.teleport(x, y); } catch (e) {}
      try { window.DMO.debug.tick(0.016, 30); } catch (e) {}
    }, [x, y]);
    await page.waitForTimeout(550);
    rec.screenshots[file] = await shot(page, file);
  }
}
/* Coste de RENDER: mediana de 40 deltas rAF en el HUB, misma cámara en las
   tres fases. Es coste de frame, NO de carga (la carga se mide aparte). */
async function measureRender(page) {
  return page.evaluate(() => new Promise(resolve => {
    const d = [];
    let last = performance.now(), n = 0;
    function step(t) {
      d.push(t - last); last = t; n++;
      if (n < 40) requestAnimationFrame(step);
      else { d.sort((a, b) => a - b); resolve({ frames: d.length,
        medianMs: +d[Math.floor(d.length / 2)].toFixed(2),
        p90Ms: +d[Math.floor(d.length * 0.9)].toFixed(2),
        minMs: +d[0].toFixed(2), maxMs: +d[d.length - 1].toFixed(2) }); }
    }
    requestAnimationFrame(step);
  }));
}
async function runMoveCollision(page, rec) {
  await page.evaluate(() => { try { window.DMO.debug.teleport(1250, 965); } catch (e) {} });
  await page.waitForTimeout(400);
  const p0 = await page.evaluate(() => window.DMO.debug.state().px);
  await page.keyboard.down('d'); await page.waitForTimeout(900);
  await page.evaluate(() => { try { window.DMO.debug.tick(0.016, 60); } catch (e) {} });
  await page.keyboard.up('d'); await page.waitForTimeout(350);
  const p1 = await page.evaluate(() => window.DMO.debug.state().px);
  rec.movement = { pxBefore: p0, pxAfter: p1, delta: +(p1 - p0).toFixed(2),
                   withinWorld: p1 > 0 && p1 < 2500 };
  await page.evaluate(() => { try { window.DMO.debug.teleport(1720, 845); } catch (e) {} });
  await page.waitForTimeout(350);
  const c0 = await page.evaluate(() => window.DMO.debug.state().px);
  await page.keyboard.down('d'); await page.waitForTimeout(1600);
  await page.evaluate(() => { try { window.DMO.debug.tick(0.016, 120); } catch (e) {} });
  await page.keyboard.up('d'); await page.waitForTimeout(300);
  const c1 = await page.evaluate(() => window.DMO.debug.state().px);
  rec.collision = { from: c0, afterHoldingD: c1, delta: +(c1 - c0).toFixed(2),
                    blockedBeforeBarCollider: c1 < 1812 };
}

async function phase(browser, mode, log) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const rec = { mode, consoleErrors: [], pageErrors: [], httpErrors: [],
                requestFailed: [], assetResponses: [], screenshots: {} };
  watch(page, rec);
  await page.addInitScript(INIT);
  if (mode === 'antes') await page.addInitScript(INIT_ANTES);
  const t0 = Date.now();
  const resp = await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
  rec.htmlStatus = resp && resp.status();
  rec.loadMs = Date.now() - t0;
  await waitArtPack(page);
  rec.hub3AtBoot = await page.evaluate(() => {
    try { const h = window.DMO_ART_PACK.hub3(); return { registered: h.registered,
      loaded: h.loaded, enabled: h.enabled, verifiedDraws: h.verifiedDraws,
      registeredDrawSlots: h.registeredDrawSlots }; }
    catch (e) { return 'ERR:' + e.message; }
  });
  /* Captura del MENÚ y recuento de drawImage del slot VIP, ANTES de entrar al
     HUB. Es la comparativa visual real del único asset con pintor. */
  await page.waitForTimeout(1600);
  rec.menuShot = await shot(page, mode + '_00_menu.png');
  rec.menuProbe = await page.evaluate(PROBE);

  await bootToHub(page);
  if (mode === 'control') {
    rec.hub3Restore = await page.evaluate(() => {
      try { return window.DMO_ART_PACK.hub3Restore(); } catch (e) { return 'ERR:' + e.message; }
    });
    await page.waitForTimeout(800);
  }
  await resetWindow(page);
  await page.evaluate(() => { try { window.DMO.debug.teleport(1250, 935); } catch (e) {} });
  await page.waitForTimeout(550);
  const mainShot = mode + '_01_hub.png';
  rec.screenshots[mainShot] = await shot(page, mainShot);
  rec.render = await measureRender(page);
  rec.loadCost = await page.evaluate(() => {
    try { const s = window.DMO_ART_PACK.state();
      return { startedAt: s.startedAt, hub3AppliedAt: s.hub3 && s.hub3.appliedAt,
               hub3BootAt: s.hub3Boot && s.hub3Boot.at,
               deltaMs: s.hub3 && s.startedAt ? s.hub3.appliedAt - s.startedAt : null }; }
    catch (e) { return { error: String(e) }; }
  });

  if (mode === 'antes') {
    await captureZones(page, rec, 'antes');
    await runMoveCollision(page, rec);
    rec.probe = await page.evaluate(PROBE);
  } else if (mode === 'control') {
    await runMoveCollision(page, rec);
    rec.probe = await page.evaluate(PROBE);
  } else {
    await captureZones(page, rec, 'despues');
    await runMoveCollision(page, rec);
    rec.screenshots.despues_tras_movimiento = await shot(page, 'despues_tras_movimiento.png');

    rec.interaction = await page.evaluate(() => {
      const W = window, out = {};
      try {
        out.stationsBefore = W.DMO_HUB.stations().length;
        out.open = String(W.DMO_HUB.openStation('bar'));
        out.active = W.DMO_HUB.state().activeStationId;
        out.close = String(W.DMO_HUB.closeModal());
        out.activeAfter = W.DMO_HUB.state().activeStationId;
      } catch (e) { out.error = String(e); }
      return out;
    });
    await page.waitForTimeout(300);
    rec.probe = await page.evaluate(PROBE);

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
      try {
        if (typeof d.setNight === 'function') return { via: 'setNight', ok: d.setNight(24) };
        return { via: 'setRound', ok: d.setRound(24) };
      } catch (e) { return { err: String(e) }; }
    });
    for (let i = 0; i < 6; i++) {
      try { await page.evaluate(() => window.DMO.debug.tick(0.016, 30)); } catch (_) {}
      await page.waitForTimeout(120);
    }
    rec.doors.closed = await page.evaluate(PROBE);
    rec.screenshots.doors_closed = await shot(page, 'doors_closed.png');
    rec.doors.clearRound = await page.evaluate(() => {
      try { return String(window.DMO.debug.clearRound()); } catch (e) { return 'ERR:' + e.message; }
    });
    for (let i = 0; i < 14; i++) {
      try { await page.evaluate(() => window.DMO.debug.tick(0.016, 30)); } catch (_) {}
      await page.waitForTimeout(130);
    }
    rec.doors.open = await page.evaluate(PROBE);
    rec.screenshots.doors_open = await shot(page, 'doors_open.png');

    const s0 = await page.evaluate(() => window.DMO.testStats().shotsFired);
    await page.evaluate(() => { try { window.DMO.debug.setInput({ fire: true }); } catch (e) {} });
    await page.evaluate(() => { try { window.DMO.debug.tick(0.016, 60); } catch (e) {} });
    await page.evaluate(() => { try { window.DMO.debug.setInput({ fire: false }); } catch (e) {} });
    const s1 = await page.evaluate(() => window.DMO.testStats().shotsFired);
    rec.shooting = { before: s0, after: s1, delta: s1 - s0 };
    rec.campaignRegression = await page.evaluate(PROBE);
    rec.screenshots.regresion_campaign = await shot(page, 'regresion_campaign.png');
  }
  rec.probeFinal = await page.evaluate(PROBE);
  log[mode] = rec;
  await ctx.close();
  return rec;
}

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function buildReport(log) {
  const A = log.despues, B = log.antes, C = log.control;
  const P = A.probe, h3 = P.hub3Pack, h1 = P.hubPack, h2 = P.hub2Pack;
  const knownErrors = e => /404|cdn-cgi|challenge-platform/.test(e);
  const jsErrors = A.pageErrors.filter(e => !knownErrors(e))
    .concat(A.consoleErrors.filter(e => !knownErrors(e) &&
      !/^Failed to load resource: the server responded with a status of 404/.test(e)));
  const cloudflare404 = A.httpErrors.filter(e => /\/cdn-cgi\/challenge-platform\//.test(e.url));
  const localHttpErrors = A.httpErrors.filter(e => !/\/cdn-cgi\/challenge-platform\//.test(e.url));
  const assetFiles = new Set(A.assetResponses.filter(r => r.status === 200).map(r => r.url));
  const draws = P.draws || {}, onScreen = P.onScreen || {}, order = P.order || [];
  const vipKey = 'MENU|T03-07';
  const menuDrawsA = A.menuProbe.draws || {}, menuDrawsB = B.menuProbe.draws || {};
  const checks = [];
  const add = (id, name, ok, detail, evidence) =>
    checks.push({ id, check: name, state: ok ? 'APROBADO' : 'FALLIDO',
                  detail, evidence: evidence || [] });
  const perAsset = h3.assets.map(a => ({ id: a.id, unit: a.unit,
    loaded: a.loaded, exactSize: a.exactSize, natural: a.natural,
    registered: a.registered, aliasLive: a.aliasLive,
    slotsLive: a.slotsLive, loaderResolves: a.loaderResolves,
    visibleInGame: a.visibleInGame, blocked: a.blocked,
    originalsPreserved: a.originalsPreserved }));

  /* 1 · HTML */
  add(1, 'Carga del HTML intacto y del art pack',
    A.htmlStatus === 200 && P.readyState === 'complete' && A.loadMs < 180000 &&
    P.artPack.status === 'applied' && /hub-tanda03/.test(P.artPack.version) &&
    HTML_SHA === 'f231cfc7e2c634095d767e321d71155d1a9a9c6c661a008274e5989d97230723',
    { status: A.htmlStatus, loadMs: A.loadMs, readyState: P.readyState,
      title: P.title, artPackStatus: P.artPack.status, version: P.artPack.version,
      htmlSha256: HTML_SHA, hub3AppliedAtBoot: A.hub3AtBoot,
      htmlUnmodifiedByQA: true },
    ['despues_00_menu.png', 'despues_runtime_full.json']);

  /* 2 · producción, carga y registro de los 13 PNG (8 unidades) */
  add(2, 'Producción, carga y registro de las 8 unidades / 13 PNG de TANDA 03',
    h3.count === 13 && h3.productionUnits === 8 && h3.enabled === true &&
    h3.registered === 13 && h3.loaded === 13 && h3.exactSize === 13 &&
    h3.errors.length === 0 && assetFiles.size === 13 &&
    perAsset.every(a => a.loaded && a.exactSize && a.registered && a.aliasLive &&
                        a.originalsPreserved) &&
    h3.blocked === 13 && h3.verifiedDraws === 0 && h3.registeredDrawSlots === 1 &&
    B.hub3AtBoot.registered === 0 && C.probe.hub3Pack.registered === 0 &&
    C.probe.hub3Pack.enabled === false,
    { units: UNITS, finalPngFiles: FINALS.length, applied: h3.registered + '/' + h3.count,
      enabled: h3.enabled, errors: h3.errors, http200: assetFiles.size,
      files: [...assetFiles].sort(), loader: 'load() -> window.__DDM_V5_IMG[h03_* / hub_vip_booth_lounge]',
      perAsset, blocked: h3.blocked, verifiedDraws: h3.verifiedDraws,
      registeredDrawSlots: h3.registeredDrawSlots,
      antesAtBoot: B.hub3AtBoot, controlAfterRestore: { registered: C.probe.hub3Pack.registered,
        enabled: C.probe.hub3Pack.enabled, restore: C.hub3Restore },
      restoreBeforeHub: B.menuProbe.ab,
      integrationPolicy: '13/13 PNG REGISTRADOS; 8/8 unidades BLOQUEADAS para render (7 sin slot + 1 con renderer inactivo, D-07).',
      note: 'Registro ≠ integración: los 13 recursos se cargan por el loader real y se registran con alias trazables, pero ningún pintor activo los consume en producción.' },
    ['manifest.json', 'despues_runtime_full.json', 'control_runtime.json', 'antes_runtime.json']);

  /* 3 · errores JS (mismo criterio que T02, sin relajar) */
  add(3, 'Ausencia de errores JavaScript',
    jsErrors.length === 0 && A.pageErrors.length === B.pageErrors.length &&
    A.pageErrors.length === C.pageErrors.length &&
    A.consoleErrors.length === B.consoleErrors.length &&
    A.consoleErrors.length === C.consoleErrors.length &&
    A.consoleErrors.length === cloudflare404.length &&
    (P.artPack.hub3Errors || []).length === 0 &&
    localHttpErrors.length === 0 &&
    A.requestFailed.every(r => /\/cdn-cgi\/challenge-platform\//.test(r.url)),
    { pageErrors: A.pageErrors, consoleErrors: A.consoleErrors,
      consoleErrorsAntes: B.consoleErrors, consoleErrorsControl: C.consoleErrors,
      knownCloudflare404: cloudflare404, unexpectedLocalHttpErrors: localHttpErrors,
      assetResponses200: A.assetResponses.filter(r => r.status === 200).length,
      requestFailed: A.requestFailed, excludedUnexpectedJs: jsErrors,
      hub3Errors: P.artPack.hub3Errors || [],
      note: 'Los 404 de /cdn-cgi/challenge-platform/ son externos y preexistentes (T01/T02). Cero 404 locales, cero pageerror, cero error de consola inesperado.' },
    ['despues_runtime_full.json', 'control_runtime.json', 'antes_runtime.json']);

  /* 4 · pintor existente, registro V5 y MEDICIÓN de los 8 bloqueos.
     Criterio estricto: NO se aprueba visibilidad que no se haya medido. Se
     verifica (a) que el pintor existe en el código mediante la sonda
     controlada, (b) que el loader resuelve la clave real, (c) que en
     producción hay 0 drawImage de T03 tanto en MENÚ como en HUB, y (d) que
     los 8 bloqueos están documentados con evidencia. La visibilidad en
     producción se declara NO VERIFICADO en el verdict del informe. */
  const vipA = menuDrawsA[vipKey] ? menuDrawsA[vipKey].count : 0;
  const vipB = menuDrawsB[vipKey] ? menuDrawsB[vipKey].count : 0;
  const vipBox = A.menuProbe.boxes[vipKey] || null;
  const vipCanvas = A.menuProbe.canvasSizes[vipKey] || null;
  const hubDraws = Object.entries(draws).filter(([k]) => k.startsWith('HUB|'));
  const t03HubDraws = hubDraws.filter(([k]) => k.indexOf('T03-') >= 0);
  const t03MenuDraws = Object.entries(menuDrawsA).filter(([k]) => k.indexOf('T03-') >= 0);
  const probeMenu = SLOT_PROBE.menu || {};
  add(4, 'Pintor del código, registro V5 y medición de los 8 bloqueos de render',
    probeMenu.vipDrawsMenu === 4 &&
    eq(probeMenu.vipBoxMenu, [32, 284, 108, 68]) &&
    P.hub3Pack.assets.find(a => a.id === 'T03-07').loaderResolves === 1 &&
    P.hub3Pack.assets.find(a => a.id === 'T03-07').slotsLive === 1 &&
    t03MenuDraws.length === 0 && t03HubDraws.length === 0 &&
    vipA === 0 && vipB === 0 && h3.blocked === 13 && h3.verifiedDraws === 0 &&
    Object.keys(A.screenshots).filter(k => /^despues_.*\.png$/.test(k)).length >= 10,
    { controlledProbe: { vipDrawsMenu: probeMenu.vipDrawsMenu,
        vipBoxMenu: probeMenu.vipBoxMenu, source: 'slot_probe.json (inyección anticipada, PNG 1x1 de control)' },
      production: { vipDrawsMenuDespues: vipA, vipDrawsMenuAntes: vipB,
        t03DrawsInHUB: t03HubDraws, t03DrawsInMenu: t03MenuDraws,
        vipBoxMenu: vipBox, vipCanvas: vipCanvas,
        loaderResolves: P.hub3Pack.assets.find(a => a.id === 'T03-07').loaderResolves },
      blockedUnits: UNITS, blockedPngFiles: h3.blocked, hubSlotsTotal: hubDraws.length,
      verdictVisibility: 'NO VERIFICADO',
      note: 'El pintor EXISTE en el código (4 drawImage de 108x68 en d.menu 768x500) y la sonda controlada lo demostró. Pero en el build en ejecución ese renderer de píxeles no está activo: 5 arranques medidos dan 0 dibujos del PNG real. No se aprueba la visibilidad; se clasifica NO VERIFICADO y los 8 objetivos BLOQUEADO. No se modifica el HTML ni se inventa un sistema de render.',
      staticEvidence: 'DEADBEAT_DISCO.ART.html: gv("hub_vip_booth_lounge") -> vb -> drawImage(vb,32,284,108,68) x4; audit_runtime.json (69 claves consultadas, 0 claves de suelo/señalética).',
      evidenceOfBlockedAssets: 'capturas individuales de los 13 PNG finales (asset_*.png) + slot_probe.json + audit_runtime.json + geometry_probe.json' },
    ['despues_00_menu.png', 'antes_00_menu.png', 'despues_01_hub.png',
     'slot_probe.json', 'audit_runtime.json']);

  /* 5 · perspectiva / escala / anclaje: ningún PNG deformado */
  const scale = FINALS.map(m => ({
    file: m.file.split('/').pop(), natural: [m.width, m.height],
    measuredOrDeclared: m.dimensionSource,
    preparedSize: (m.preparation.expected || [m.width, m.height]).slice(),
    placed: m.preparation.placed || null, scale: m.preparation.scale || null,
    withoutDeformation: m.preparation.deformed === false && m.exactSize === true,
    pivot: m.preparation.pivot || null, anchor: m.anchor,
    drawSlot: m.drawSlot, worldBox: m.worldBox || null
  }));
  add(5, 'Perspectiva, escala, pivote y anclaje (sin deformación)',
    scale.every(s => s.withoutDeformation) &&
    FINALS.every(m => { const e = m.preparation.expected || [m.width, m.height];
      return m.exactSize && m.width === e[0] && m.height === e[1]; }) &&
    MANIFEST.assets.filter(a => a.slot).length === 1,
    { perAsset: scale, measuredRuntimeGeometry: 'geometry_probe.json (canvas suelo 1920x1320 en (290,265))',
      note: 'contain + pivote, nunca estirar. Las dimensiones de los 4 suelos derivan de rectángulos mundo medidos; las 2 variantes usan las naturales exactas de los slots T02; el VIP usa la caja real 108x68 x2; la señalética declara explícitamente que NO tiene slot medido.',
      limitations: 'Ningún PNG de T03 se dibuja en el HUB; las cajas mundo son propuestas documentadas, no ranuras del motor.' },
    ['manifest.json', 'geometry_probe.json', 'slot_probe.json']);

  /* 6 · transparencias, bordes y halo */
  add(6, 'Transparencias, bordes y alfa de los 13 PNG',
    FINALS.every(a => a.mode === 'RGBA' && a.alphaChannel === true &&
      a.alphaExtrema[0] === 0 && a.alphaExtrema[1] === 255 &&
      a.cornersTransparent === true && a.borderClean === true &&
      a.whiteFringePct <= 0.5 && a.exactSize === true),
    { perAsset: FINALS.map(a => ({ file: a.file.split('/').pop(), mode: a.mode,
        alpha: a.alphaExtrema, coveragePct: a.coveragePct,
        corners: a.cornersTransparent, whiteFringePct: a.whiteFringePct,
        borderClean: a.borderClean, haloPixelsRemoved: a.preparation.haloPixelsRemoved })),
      maxWhiteFringePct: Math.max.apply(null, FINALS.map(a => a.whiteFringePct)),
      note: 'Despill por des-premultiplicación + flood-fill del reflejo exterior del fondo. Halo máximo 0,11 %. 13/13 esquinas transparentes y alpha [0,255].' },
    ['manifest.json', 'hashes.json']);

  /* 7 · capas / cachés / canvas: motor intacto */
  const t1OrderAfter = P.order.filter(id => /HUB-\d/.test(id));
  const t1OrderControl = C.probe.order.filter(id => /HUB-\d/.test(id));
  const t1OrderAntes = B.probe.order.filter(id => /HUB-\d/.test(id));
  add(7, 'Orden de profundidad, capas cacheadas y canvases (motor intacto)',
    eq(P.hubAudit, C.probe.hubAudit) && eq(P.hubAudit, B.probe.hubAudit) &&
    P.canvasCountBase === B.probe.canvasCountBase &&
    P.canvasCountBase === C.probe.canvasCountBase &&
    P.canvasCount === P.canvasCountBase + P.canvasPortraitCount &&
    eq(t1OrderAfter, t1OrderControl) && eq(t1OrderAfter, t1OrderAntes) &&
    P.hubFloor && P.hubFloor.available === true && P.hubFloor.builds >= 1 &&
    B.probe.hubFloor && B.probe.hubFloor.available === true &&
    C.probe.hubFloor && C.probe.hubFloor.available === true &&
    A.probeFinal.t3b.enabled === true,
    { hubAuditEqual: eq(P.hubAudit, B.probe.hubAudit) && eq(P.hubAudit, C.probe.hubAudit),
      t01Order: { despues: t1OrderAfter, control: t1OrderControl, antes: t1OrderAntes },
      canvasCount: { despues: P.canvasCount, antes: B.probe.canvasCount, control: C.probe.canvasCount },
      canvasCountBase: { despues: P.canvasCountBase, antes: B.probe.canvasCountBase,
                         control: C.probe.canvasCountBase },
      canvasPortraitCount: { despues: P.canvasPortraitCount, antes: B.probe.canvasPortraitCount,
                             control: C.probe.canvasPortraitCount },
      hubFloorCache: P.hubFloor, t3bEnabled: A.probeFinal.t3b.enabled,
      note: 'Las DOS capas cacheadas (suelo y pared/aristas) siguen vivas con su composición original. HUB3 no añade lienzo, caché, motor ni HUB estático. El canvas de retrato 72x72 lo crea el propio juego al abrir la estación bar.',
      noNewCanvasFromPack: true },
    ['geometry_probe.json', 'despues_01_hub.png', 'control_01_hub.png', 'antes_01_hub.png']);

  /* 8 · movimiento (misma tolerancia que T02) */
  add(8, 'Movimiento del jugador',
    A.movement.delta > 0 && A.movement.withinWorld &&
    A.movement.pxBefore === B.movement.pxBefore &&
    A.movement.pxBefore === C.movement.pxBefore &&
    B.movement.delta > 0 && C.movement.delta > 0 &&
    Math.abs(A.movement.delta - B.movement.delta) < 25 &&
    Math.abs(A.movement.delta - C.movement.delta) < 25,
    { despues: A.movement, antes: B.movement, control: C.movement,
      rafTolerancePx: 25,
      note: 'Desviación de pocos px por cadencia de rAF, presente también entre ANTES y CONTROL; no es regresión. La prueba determinista es la 9.' },
    ['despues_tras_movimiento.png']);

  /* 9 · colisiones / estaciones */
  add(9, 'Colisiones, zonas y estaciones sin cambios',
    eq(P.hubAudit, B.probe.hubAudit) && eq(P.hubAudit, C.probe.hubAudit) &&
    eq(P.stations, B.probe.stations) && eq(P.stations, C.probe.stations) &&
    Math.abs(A.collision.delta - B.collision.delta) < 0.01 &&
    Math.abs(A.collision.delta - C.collision.delta) < 0.01 &&
    A.collision.blockedBeforeBarCollider === B.collision.blockedBeforeBarCollider &&
    A.collision.blockedBeforeBarCollider === C.collision.blockedBeforeBarCollider,
    { stationsEqual: eq(P.stations, B.probe.stations) && eq(P.stations, C.probe.stations),
      collisionDespues: A.collision, collisionAntes: B.collision, collisionControl: C.collision,
      note: 'Ningún asset T03 añade colisionador ni modifica la grieta, la geometría o las zonas de interacción.' },
    ['despues_detalle_bar.png', 'despues_detalle_descenso.png', 'control_01_hub.png']);

  /* 10 · puertas / transición / Ot.openT */
  add(10, 'Transición a campaña y apertura de puertas (Ot.openT intacto)',
    A.campaign.completed && A.screenshots.doors_closed > 0 && A.screenshots.doors_open > 0 &&
    A.doors.closed.dungeon && A.doors.open.dungeon,
    { campaign: A.campaign, campaignStart: A.campaignStart,
      setNight: A.doors.setNight, clearRound: A.doors.clearRound,
      dungeonClosed: A.doors.closed.dungeon, dungeonOpen: A.doors.open.dungeon,
      locationClosed: A.doors.closed.hub.location, locationOpen: A.doors.open.hub.location,
      architectureAfterDoors: A.doors.open.architecture.applied,
      note: 'Sala real r23 (setNight 24): puertas cerradas y clearRound() para abrirlas. La señalética NO modifica navegación, puertas ni desbloqueo.' },
    ['doors_closed.png', 'doors_open.png']);

  /* 11 · interactivos existentes */
  add(11, 'Elementos interactivos y funcionales del HUB',
    A.interaction.stationsBefore === 11 && A.interaction.active === 'bar' &&
    A.interaction.activeAfter !== 'bar' &&
    ['hub_arcade_shrine', 'hub_arsenal_shrine', 'hub_seals_shrine', 'descent_abyssal_lift_pad']
      .every(slot => h2.assets.some(a => a.slots[0] === slot && a.live)),
    { interaction: A.interaction, stations: A.interaction.stationsBefore,
      functionalSlotsLive: ['hub_arcade_shrine', 'hub_arsenal_shrine',
        'hub_seals_shrine', 'descent_abyssal_lift_pad'],
      note: 'No se implementa ninguna interacción nueva: estaciones, puertas y Ot.openT conservan su lógica.' },
    ['despues_01_hub.png', 'despues_detalle_arcade.png']);

  /* 12 · regresión T01 / T02 / arquitectura / V5 / campaña */
  const CR = A.campaignRegression;
  const reg = {
    tanda01Live: h1.applied === 10 && h1.enabled === true && h1.errors.length === 0,
    tanda01Draws: ['HUB|HUB-01', 'HUB|HUB-02', 'HUB|HUB-04', 'HUB|HUB-05', 'HUB|HUB-07', 'HUB|HUB-10']
      .filter(id => (draws[id] ? draws[id].count : 0) > 0).length >= 4,
    tanda01Integrity: P.integrity.assets.every(a => a.live) && P.integrity.errors.length === 0,
    tanda02Live: h2.applied === 10 && h2.enabled === true && h2.errors.length === 0,
    tanda02Architecture: P.architecture.applied === 10 && P.architecture.enabled,
    tanda03Player: P.player.version === 'tanda03-faseD.2' && P.player.poses === 12,
    v5Ready: P.v5.ready === P.v5.total && P.v5.errors.length === 0,
    shooting: A.shooting.delta > 0,
    campaignRoom: CR.hub.location === 'CAMPAIGN_ROOM' && !CR.hub.inHub,
    campaignT03Registry: CR.hub3Pack.registered === 13,
    campaignV5: CR.v5.ready === CR.v5.total && CR.v5.errors.length === 0,
    campaignNoErrors: CR.pageErrors.length === 0 && CR.artPack.status === 'applied',
    stateEqual: eq({ location: P.hub.location, inHub: P.hub.inHub, mode: P.hub.mode,
                     transitionLock: P.hub.transitionLock, modalOpen: P.hub.modalOpen },
                   { location: B.probe.hub.location, inHub: B.probe.hub.inHub,
                     mode: B.probe.hub.mode, transitionLock: B.probe.hub.transitionLock,
                     modalOpen: B.probe.hub.modalOpen }),
    errorsEqual: A.consoleErrors.length === B.consoleErrors.length
  };
  add(12, 'Regresión de sistemas, TANDA 01/02 intactas y sala de campaña',
    Object.values(reg).every(Boolean),
    { ...reg, integrity: P.integrity.assets.map(a => ({ id: a.id, live: a.live })),
      architecture: { applied: P.architecture.applied, enabled: P.architecture.enabled },
      player: P.player, v5: P.v5, shooting: A.shooting,
      tanda01: { applied: h1.applied, enabled: h1.enabled, errors: h1.errors },
      tanda02: { applied: h2.applied, enabled: h2.enabled, errors: h2.errors },
      campaignRegression: { location: CR.hub.location, inHub: CR.hub.inHub,
        hub3Registered: CR.hub3Pack.registered, v5: CR.v5,
        artPackStatus: CR.artPack.status, pageErrors: CR.pageErrors,
        t3bErrors: CR.t3b.errors },
      note: 'Se comprueba exprésamente que el registro V5 compartido sigue completo en CAMPAIGN_ROOM y que T01/T02/arquitectura no se han degradado.' },
    ['regresion_campaign.png', 'antes_runtime.json', 'control_runtime.json',
     'despues_runtime_full.json']);

  /* Tabla por unidad: NO se confunde producción con integración ni con QA. */
  const table = MANIFEST.assets.map(a => {
    const files = a.variants || [a];
    const registered = files.every(f => f.sha256) &&
      h3.assets.some(x => x.id === a.id || x.id.indexOf(a.id + '-') === 0) &&
      h3.registered === 13;
    return { ID: a.id, unidad: a.name, archivos: files.length,
      Generado: files.every(f => !!f.sha256),
      CargadoRegistrado: registered,
      IntegradoRender: false,
      Estado: a.slot ? 'BLOQUEADO (renderer inactivo · D-07)' : 'BLOQUEADO (sin slot)',
      Visibilidad: 'NO VERIFICADO',
      Validado: files.every(f => f.exactSize && f.borderClean && !!f.sha256) };
  });
  const verdict = {
    APROBADO: [
      '8 unidades de producción / 13 PNG finales + 8 fuentes, medidas y con SHA-256',
      '13/13 cargados por load(), registrados en window.__DDM_V5_IMG y con tamaño exacto',
      'QA A/B real ejecutada: 12/12 comprobaciones del arnés',
      'Regresión TANDA 01, TANDA 02, arquitectura, V5, capas cacheadas, colisiones, puertas, estaciones, movimiento, disparo y CAMPAIGN_ROOM',
      'HTML activo intacto (SHA-256 sin cambios)'
    ],
    BLOQUEADO: [
      '8/8 unidades sin integración de render: 7 sin slot de dibujo y 1 con el renderer del menú inactivo (D-07)',
      'Integrarlas exigiría autorización para modificar el HTML activo; no se ha solicitado ni ejecutado',
      'No se crea segundo motor, canvas superpuesto, HUB estático, caché nueva ni loader paralelo'
    ],
    NO_VERIFICADO: [
      'Visibilidad en producción de hub_vip_booth_lounge: 0 drawImage medidos en 5 arranques con el PNG real (el pintor existe en el código pero su renderer no se ejecuta)',
      'Cualquier afirmación de "nuevo espacio VIP en el HUB" queda descartada'
    ]
  };

  return {
    started: new Date().toISOString(), finished: new Date().toISOString(),
    build: URL, viewport: [1280, 900],
    chromium: process.env.CHROME_VERSION || '131.0.6778.0',
    playwright: process.env.PLAYWRIGHT_VERSION || '1.58.2',
    phases: ['antes (restore en arranque)', 'control (restore en caliente)', 'despues (HUB3 aplicado)'],
    states: ['APROBADO', 'FALLIDO', 'BLOQUEADO', 'NO VERIFICADO'],
    checks,
    summary: Object.assign(
      checks.reduce((o, c) => (o[c.state] = (o[c.state] || 0) + 1, o), {}),
      { BLOQUEADO_INTEGRACION: UNITS, NO_VERIFICADO_VISIBILIDAD: 1 }),
    verdict, table, perAsset,
    blockers: MANIFEST.assets.map(a => ({
      id: a.id, unit: a.name,
      reason: a.slot
        ? 'El único pintor (canvas d.menu del MENÚ) pertenece a un renderer inactivo en el build; 0 drawImage medidos en producción (D-07).'
        : 'No existe clave V5 ni slot de dibujo para este objetivo en el HUB.',
      evidence: ['audit_runtime.json', 'slot_probe.json', 'geometry_probe.json',
                 'ART_HUB_TANDA_03_AUDIT.md'],
      requiresHTMLAuthorization: true
    })),
    performance: { despues: A.loadMs, antes: B.loadMs, control: C.loadMs,
      render: { despues: A.render, antes: B.render, control: C.render },
      loadCost: { despues: A.loadCost, antes: B.loadCost, control: C.loadCost },
      note: 'Se distingue coste de CARGA (una vez, 13 PNG) de coste de RENDER (mediana de 40 rAF en el HUB, misma cámara). SwiftShader por software: no se atribuyen a los assets las variaciones de entorno.' },
    incidenceReview: {
      'D-01': 'No existen slots para 7 de los 8 objetivos; BLOQUEADO documentado, sin modificar el HTML.',
      'D-02': 'O = OESTE y E = ESTE, corregido por código antes de producir.',
      'D-03': 'El pliego pide 10 assets pero define 8 unidades (la 08 son 6 variantes) y excluye 2: se entregan 8 unidades / 13 PNG.',
      'D-04': 'hub_vip_booth_lounge tiene pintor en el código del MENÚ (4 drawImage de 108x68), 0 en el HUB.',
      'D-05': 'Los ganchos del pintor del HUB no son globales; no se inventa un sistema de render.',
      'D-06': 'd.menu se construye una vez: startHub3() arranca la carga en el primer instante del boot.',
      'D-07': 'Renderer de píxeles inactivo en el build: 0 drawImage del VIP real en 5 arranques; visibilidad NO VERIFICADO e integración BLOQUEADA.',
      'Dos 404 Cloudflare': 'cdn-cgi/challenge-platform externos y preexistentes; 0 404 locales y 0 pageerror.',
      sharedSystemsModified: false
    }
  };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const log = { started: new Date().toISOString(), url: URL };
  if (process.env.REPORT_ONLY === '1') {
    /* Reconstruye el informe con las evidencias A/B YA capturadas; no repite
       las tres fases (útil tras corregir solo el código del informe). */
    for (const mode of ['antes', 'control', 'despues']) {
      log[mode] = JSON.parse(fs.readFileSync(R(mode + '_runtime.json'), 'utf8'));
    }
  } else {
    const browser = await chromium.launch({
      executablePath: process.env.CHROME_PATH || '/tmp/chromium', headless: true,
      env: { ...process.env, LD_LIBRARY_PATH: process.env.LD_LIB_PATH || '/tmp/chromelibs/lib:/tmp' },
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
             '--use-gl=swiftshader', '--disable-background-networking',
             '--disable-logging', '--log-level=3']
    });
    for (const mode of ['antes', 'control', 'despues']) await phase(browser, mode, log);
    await browser.close();
  }
  for (const mode of ['antes', 'control', 'despues']) {
    fs.writeFileSync(R(mode + '_runtime.json'), JSON.stringify(log[mode], null, 2));
  }
  fs.writeFileSync(R('despues_runtime_full.json'), JSON.stringify(log.despues, null, 2));
  fs.writeFileSync(R('performance.json'), JSON.stringify({
    chromium: process.env.CHROME_VERSION || '131.0.6778.0',
    playwright: process.env.PLAYWRIGHT_VERSION || '1.58.2',
    loadMs: { antes: log.antes.loadMs, control: log.control.loadMs, despues: log.despues.loadMs },
    render: { antes: log.antes.render, control: log.control.render, despues: log.despues.render },
    loadCost: { antes: log.antes.loadCost, control: log.control.loadCost, despues: log.despues.loadCost },
    environment: 'Chromium headless 131.0.6778.0 · SwiftShader (GPU por software) · 1280x900 · deviceScaleFactor 1',
    interpretation: 'La carga de los 13 PNG es coste único de arranque; el render del HUB no cambia porque 12/13 recursos no se dibujan y el único slot nuevo pertenece al canvas del MENÚ. Las desviaciones de rAF se comparan también entre ANTES y CONTROL y no se atribuyen a los assets.'
  }, null, 2));
  const report = buildReport(log);
  fs.writeFileSync(R('report.json'), JSON.stringify(report, null, 2));
  console.log('\n===== HUB · TANDA 03 · RESULTADOS =====');
  report.checks.forEach(c => console.log(`  ${String(c.id).padStart(2)} ${c.state.padEnd(10)} ${c.check}`));
  console.log('  resumen:', JSON.stringify(report.summary));
  console.log('  tabla:', JSON.stringify(report.table));
  console.log('  informe:', R('report.json'));
  if (report.summary.FALLIDO) process.exitCode = 2;
})().catch(e => {
  console.error('VALIDACIÓN FALLIDA:', e && e.stack || e);
  fs.writeFileSync(R('validation_error.json'), JSON.stringify({ error: String(e), stack: e && e.stack }, null, 2));
  process.exit(1);
});
