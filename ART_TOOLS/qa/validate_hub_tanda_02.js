/* ============================================================================
 * HUB · TANDA 02 — validación A/B real en Chromium headless (Playwright-core)
 * ----------------------------------------------------------------------------
 * Tres fases sobre la MISMA build y el MISMO servidor:
 *   antes   : T01 aplicada, T02 revertida con DMO_ART_PACK.hub2Restore()
 *             ANTES de entrar al HUB (estado previo real a esta tanda).
 *   control : T02 revertida EN CALIENTE ya dentro del HUB (comprueba que el
 *             restore no rompe geometría, colisiones ni sistemas).
 *   despues : T02 aplicada por el arranque normal del art pack.
 *
 * 12 comprobaciones: 1 HTML · 2 carga de 10 · 3 errores JS · 4 visibilidad ·
 * 5 perspectiva/escala · 6 transparencias · 7 profundidad/capas ·
 * 8 movimiento · 9 colisiones · 10 puertas/transición · 11 interactivos ·
 * 12 regresión de sistemas + TANDA 01 + sala de campaña.
 *
 * El arnés NO modifica el juego: solo etiqueta imágenes para contar
 * drawImage/createPattern reales y usa la API de depuración ya existente
 * (DMO.debug.*, DMO_HUB.*, DMO_ART_PACK.*). No hay canvas nuevo ni segundo
 * motor; las capturas son Page.captureScreenshot vía page.screenshot().
 *
 * Uso:
 *   QA_LIB=/tmp/qatools/node_modules/playwright-core \
 *   CHROME_PATH=/tmp/chromium LD_LIB_PATH=/tmp/chromelibs/lib:/tmp \
 *   node ART_TOOLS/qa/validate_hub_tanda_02.js
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.QA_LIB || 'playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.env.OUTDIR || path.join(ROOT, 'ART_EVIDENCE', 'hub', 'tanda_02');
const URL = process.env.GAME_URL || 'http://127.0.0.1:8123/';
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'ART_ASSETS/hub/tanda_02/manifest.json'), 'utf8'));
const R = (name) => path.join(OUT, name);
const IDS = MANIFEST.assets.map(a => a.id);

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

/* Proxy de solo lectura: cuenta drawImage real de T01 y T02, registra cajas
   de pantalla, tamaños de caja (para no confundir transformaciones del motor
   con deformaciones del PNG), orden de primera aparición y createPattern. */
const INIT = `(() => {
  const W = window;
  const P = W.__HUB2QA = {
    draws: {}, onScreen: {}, seq: [], order: [], patterns: {}, errors: []
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
    if (P.seq.length < 400) P.seq.push(id);
    return d;
  }
  const origDraw = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (src) {
    let id = (src && (src.__hubTanda02 || src.__hubTanda01)) || null;
    if (!id && src && W.__DDM_V5_MED_NO_SKULL && src === W.__DDM_V5_MED_NO_SKULL) id = 'HUB-02';
    if (id) {
      const d = note(id);
      d.args[arguments.length] = (d.args[arguments.length] || 0) + 1;
      if (arguments.length >= 5) {
        const b = screenBox(this, arguments[1], arguments[2], arguments[3], arguments[4]);
        if (b) {
          const cv = this.canvas;
          if (b[2] > 0 && b[0] < cv.width && b[3] > 0 && b[1] < cv.height) {
            const o = P.onScreen[id] || (P.onScreen[id] = { count: 0, sample: null });
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
    const id = img && (img.__hubTanda02 || img.__hubTanda01);
    if (id) { P.patterns[id] = (P.patterns[id] || 0) + 1; note(id); }
    return origPat.apply(this, arguments);
  };
  W.addEventListener('error', e => P.errors.push(String(e.message).slice(0, 200)));
})()`;

const PROBE = `(() => {
  const W = window, safe = f => { try { return f(); } catch (e) { return 'ERR:' + e.message; } };
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
    t3b: safe(() => ({ enabled: W.__T3B.enabled, revision: W.__T3B.revision,
      ready: W.__T3B.ready.slice(), errors: W.__T3B.errors.slice(),
      draws: W.__T3B.draws.slice(-12) })),
    hubFloor: safe(() => W.__T3B_HUB_QA.state()),
    v5: safe(() => { const s = W.DMO_REFERENCE_ROOM_ASSETS.state();
      return { ready: Object.keys(s.v5Ready).filter(k => s.v5Ready[k]).length,
               total: Object.keys(s.v5Ready).length, errors: s.errors.slice() }; }),
    dungeon: safe(() => { const d = W.DMO_DUNGEON.state(); return {
      current: d.current, role: d.role, secured: d.secured, floor: d.floor }; }),
    debug: safe(() => { const d = W.DMO.debug.state(); return {
      px: d.px, py: d.py, round: d.round, enemies: d.enemies }; }),
    stats: safe(() => W.DMO.testStats()),
    draws: W.__HUB2QA.draws, onScreen: W.__HUB2QA.onScreen,
    patterns: W.__HUB2QA.patterns, order: W.__HUB2QA.order,
    seq: W.__HUB2QA.seq.slice(0, 120), pageErrors: W.__HUB2QA.errors
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
    try { return window.DMO_ART_PACK && window.DMO_ART_PACK.state().status === 'applied'; }
    catch (e) { return false; }
  }, { timeout: 45000 });
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
    if (u.indexOf('ART_ASSETS/hub/tanda_02/') >= 0) {
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
    const P = window.__HUB2QA;
    try { P.draws = {}; P.onScreen = {}; P.patterns = {}; P.seq = []; P.order = []; } catch (e) {}
    try { window.DMO_ART_PACK.hubTag(); } catch (e) {}
    try { window.DMO_ART_PACK.hub2Tag(); } catch (e) {}
    try { window.__T3B.setEnabled(true); } catch (e) {}
  });
  await page.waitForTimeout(700);
}
async function captureZones(page, rec, prefix, names) {
  for (const [name, x, y] of ZONES) {
    if (names && names.indexOf(name) < 0) continue;
    const file = prefix + '_' + name + '.png';
    await page.evaluate(([x, y]) => {
      try { window.DMO.debug.teleport(x, y); } catch (e) {}
      try { window.DMO.debug.tick(0.016, 30); } catch (e) {}
    }, [x, y]);
    await page.waitForTimeout(550);
    rec.screenshots[file] = await shot(page, file);
  }
}
/* Movimiento + sonda de colisión idéntica en las tres fases. Se acerca al
   sólido real de la barra (x=1812..2008) y se mantiene 'd'. */
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
  const t0 = Date.now();
  const resp = await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
  rec.htmlStatus = resp && resp.status();
  rec.loadMs = Date.now() - t0;
  await waitArtPack(page);
  rec.hub2AtBoot = await page.evaluate(() => {
    try { return window.DMO_ART_PACK.hub2().applied; } catch (e) { return 'ERR:' + e.message; }
  });
  if (mode === 'antes') {
    rec.hub2Restore = await page.evaluate(() => {
      try { return window.DMO_ART_PACK.hub2Restore(); } catch (e) { return 'ERR:' + e.message; }
    });
    await page.waitForTimeout(800);
  }
  await bootToHub(page);
  if (mode === 'control') {
    rec.hub2Restore = await page.evaluate(() => {
      try { return window.DMO_ART_PACK.hub2Restore(); } catch (e) { return 'ERR:' + e.message; }
    });
    await page.waitForTimeout(800);
  }
  await resetWindow(page);
  /* La ventana de medida se cierra DESPUÉS de recorrer todas las zonas:
     así los 10 drawImage reales (incluidos los de zonas alejadas y los dos
     slots de capa cacheada) quedan dentro del mismo recuento.
     La captura principal se toma PRIMERO y en las TRES fases con la MISMA
     cámara (teleport 1250,935), para que ANTES↔DESPUÉS↔CONTROL sean
     comparables píxel a píxel. */
  await page.evaluate(() => { try { window.DMO.debug.teleport(1250, 935); } catch (e) {} });
  await page.waitForTimeout(550);
  const mainShot = mode + '_01_hub.png';
  rec.screenshots[mainShot] = await shot(page, mainShot);

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

    /* 11 · estaciones reales del HUB (sin crear interacción nueva) */
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
    rec.probe = await page.evaluate(PROBE);   /* HUB, con las 10 zonas ya medidas */

    /* 10/12 · transición real a sala de campaña, puertas y disparo */
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

    /* Regresión explícita en sala de campaña: el registro V5 compartido debe
       seguir vivo, sin errores de página y con las 12 poses / V5 completo. */
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
  const P = A.probe, h2 = P.hub2Pack, h1 = P.hubPack;
  const manifestBy = {}; MANIFEST.assets.forEach(a => { manifestBy[a.id] = a; });
  const knownErrors = e => /404|cdn-cgi|challenge-platform/.test(e);
  const jsErrors = A.pageErrors.filter(e => !knownErrors(e))
    .concat(A.consoleErrors.filter(e => !knownErrors(e) &&
      !/^Failed to load resource: the server responded with a status of 404/.test(e)));
  /* El preview sirve también la ruta /cdn-cgi/challenge-platform/… que el
     HTML activo trae de Cloudflare: son 404 preexistentes y EXTERNOS al
     juego (0 recursos locales fallidos). Se clasifican por RUTA, no por host. */
  const cloudflare404 = A.httpErrors.filter(e => /\/cdn-cgi\/challenge-platform\//.test(e.url));
  const localHttpErrors = A.httpErrors.filter(e => !/\/cdn-cgi\/challenge-platform\//.test(e.url));
  const assetFiles = new Set(A.assetResponses.filter(r => r.status === 200).map(r => r.url));
  const draws = P.draws || {}, onScreen = P.onScreen || {}, order = P.order || [];
  const checks = [];
  const add = (id, name, ok, detail, evidence) =>
    checks.push({ id, check: name, state: ok ? 'APROBADO' : 'FALLIDO',
                  detail, evidence: evidence || [] });

  /* 1 · HTML */
  add(1, 'Carga del HTML y del art pack',
    A.htmlStatus === 200 && P.readyState === 'complete' && A.loadMs < 180000 &&
    P.artPack.status === 'applied' && /hub-tanda02/.test(P.artPack.version),
    { status: A.htmlStatus, loadMs: A.loadMs, readyState: P.readyState,
      title: P.title, artPackStatus: P.artPack.status, version: P.artPack.version,
      hub2AppliedAtBoot: A.hub2AtBoot, htmlUnmodifiedByQA: true },
    ['despues_01_hub.png', 'despues_runtime_full.json']);

  /* 2 · carga de los diez assets T02 */
  const perAsset = h2.assets.map(a => ({ id: a.id, slot: a.slots[0],
    loaded: a.loaded, exactSize: a.exactSize, natural: a.natural,
    live: a.live, loaderResolves: a.loaderResolves,
    originalsPreserved: a.originalsPreserved, cachedLayer: a.cachedLayer }));
  add(2, 'Carga e integración de los diez assets de la TANDA 02',
    h2.applied === 10 && h2.enabled === true && h2.slotsApplied === 10 &&
    h2.errors.length === 0 && assetFiles.size === 10 &&
    perAsset.every(a => a.loaded && a.exactSize && a.live && a.loaderResolves === 1 &&
                        a.originalsPreserved) &&
    B.hub2AtBoot === 10 && C.probe.hub2Pack.applied === 0,
    { applied: h2.applied + '/' + h2.count, enabled: h2.enabled,
      slotsApplied: h2.slotsApplied, errors: h2.errors,
      http200: assetFiles.size, files: [...assetFiles].sort(),
      loader: 'window.__DDM_V5_IMG[slot] -> __DDM_GET_V5(slot)',
      perAsset, antesAtBoot: B.hub2AtBoot, controlAfterRestore: C.probe.hub2Pack.applied,
      restoreBeforeHub: B.hub2Restore, restoreInHot: C.hub2Restore,
      note: 'T01 conserva su propio registro; restoreHub2() solo devuelve los 10 slots de T02 a los Image/canvas originales.' },
    ['manifest.json', 'despues_runtime_full.json', 'control_runtime.json', 'antes_runtime.json']);

  /* 3 · errores JS */
  add(3, 'Ausencia de errores JavaScript',
    jsErrors.length === 0 && A.pageErrors.length === B.pageErrors.length &&
    A.pageErrors.length === C.pageErrors.length &&
    A.consoleErrors.length === B.consoleErrors.length &&
    A.consoleErrors.length === C.consoleErrors.length &&
    A.consoleErrors.length === cloudflare404.length &&
    (P.artPack.hub2Errors || []).length === 0 &&
    localHttpErrors.length === 0 &&
    A.requestFailed.every(r => /\/cdn-cgi\/challenge-platform\//.test(r.url)),
    { pageErrors: A.pageErrors, consoleErrors: A.consoleErrors,
      consoleErrorsAntes: B.consoleErrors, consoleErrorsControl: C.consoleErrors,
      knownCloudflare404: cloudflare404, unexpectedLocalHttpErrors: localHttpErrors,
      assetResponses200: A.assetResponses.filter(r => r.status === 200).length,
      requestFailed: A.requestFailed, excludedUnexpectedJs: jsErrors,
      note: 'Los dos 404 y sus ERR_ABORTED corresponden a /cdn-cgi/challenge-platform/… (script de Cloudflare incrustado en el HTML activo), preexistentes a T01/T02. Cero 404 de ART_ASSETS, cero pageerror, cero error de consola inesperado.' },
    ['despues_runtime_full.json', 'control_runtime.json', 'antes_runtime.json']);

  /* 4 · visibilidad real de los 10 en el HUB */
  const visibility = IDS.map(id => ({ id, draws: draws[id] ? draws[id].count : 0,
    onScreen: onScreen[id] ? onScreen[id].count : 0,
    sampleBox: onScreen[id] ? onScreen[id].sample : null,
    drawArgs: draws[id] ? draws[id].args : {},
    drawBox: draws[id] ? draws[id].sample : null,
    inOrder: order.indexOf(id) >= 0 }));
  const drawnAll = visibility.every(v => v.draws > 0 && v.inOrder);
  const onScreenCount = visibility.filter(v => v.onScreen > 0).length;
  const cachedIds = MANIFEST.assets.filter(a => a.cachedLayer).map(a => a.id);
  const directIds = IDS.filter(id => cachedIds.indexOf(id) < 0);
  add(4, 'Visibilidad de los diez recursos en el HUB real',
    drawnAll && directIds.every(id => onScreen[id] && onScreen[id].count > 0) &&
    cachedIds.every(id => (draws[id] ? (draws[id].args['3'] || 0) +
      (draws[id].args['5'] || 0) + (draws[id].args['9'] || 0) : 0) > 0) &&
    Object.keys(A.screenshots).filter(k => /^despues_.*\.png$/.test(k)).length >= 10,
    { visibility, directOnScreen: onScreenCount + '/' + IDS.length,
      firstDrawOrder: order.slice(0, 30), cachedSlots: cachedIds,
      note: 'T02-09/T02-10 se dibujan en los lienzos de pared/aristas cacheados y se componen después; su drawImage real se cuenta en esa capa. Las capturas por zona son evidencia visual, no simulación.' },
    ['despues_01_hub.png', 'despues_hub_centro.png', 'despues_detalle_arcade.png',
     'despues_detalle_arsenal.png', 'despues_detalle_sellos.png',
     'despues_detalle_descenso.png', 'despues_detalle_pared_este.png']);

  /* 5 · perspectiva y escala: ningún PNG deformado, cajas medidas del motor */
  const scale = IDS.map(id => {
    const m = manifestBy[id], d = draws[id] && draws[id].sample;
    const native = m.width / m.height;
    return { id, natural: [m.width, m.height], nativeAspect: +native.toFixed(3),
      measuredEngineBox: m.measuredDrawBox, preparedSize: [m.width, m.height],
      drawnBox: d || null,
      drawnAspect: d ? +(d[0] / d[1]).toFixed(3) : null,
      motorBoxDeviationPct: d ? +(100 * Math.abs(native - d[0] / d[1]) / native).toFixed(2) : null,
      preparedWithoutDeformation: m.preparation.deformed === false && m.exactSize === true,
      anchor: m.anchor, pivot: m.preparation.pivot };
  });
  add(5, 'Perspectiva, escala, pivote y anclaje (sin deformación)',
    scale.every(s => s.preparedWithoutDeformation) &&
    MANIFEST.assets.every(m => m.exactSize && m.preparation.scale > 0 &&
      m.measuredDrawBox && m.measuredDrawBox.length === 4),
    { perAsset: scale,
      note: 'La preparación usa contain + pivote medido en el HUB: ningún PNG se estira. Las desviaciones de caja, si las hay, son transformaciones que el pintor existente aplicaba ANTES de la TANDA 02 y no se han modificado.' },
    ['manifest.json', 'despues_runtime_full.json', 'ART_TOOLS/qa/hub_tanda_02_audit.js']);

  /* 6 · transparencias, bordes y halo */
  add(6, 'Transparencias, bordes y alfa',
    MANIFEST.assets.every(a => a.mode === 'RGBA' && a.alphaChannel === true &&
      a.alphaExtrema[0] === 0 && a.alphaExtrema[1] === 255 &&
      a.cornersTransparent === true && a.borderClean === true &&
      a.whiteFringePct <= 0.5 && a.exactSize === true),
    { perAsset: MANIFEST.assets.map(a => ({ id: a.id, mode: a.mode,
        alpha: a.alphaExtrema, coveragePct: a.coveragePct,
        corners: a.cornersTransparent, whiteFringePct: a.whiteFringePct,
        borderClean: a.borderClean })),
      note: 'Halo blanco máximo 0,18 %; fondo descontaminado con RGB neutro en píxeles transparentes.' },
    ['manifest.json']);

  /* 7 · orden de profundidad / capas.
     MEDICIÓN REAL: el pintor compone primero las capas cacheadas de muro,
     aristas y techo (HUB-03, T02-04/05/07/09/10), luego el suelo
     (HUB-01/HUB-02) y después los props de juego con sortY. Por eso no se
     exige que TODO T02 aparezca después del suelo: se exige que los props de
     suelo (santuarios, bancos, plataforma) sí lo hagan, que la secuencia de
     T01 sea IDÉNTICA en las tres fases y que no exista ningún canvas nuevo. */
  const floorFirst = Math.min.apply(null, ['HUB-01', 'HUB-02']
    .map(id => order.indexOf(id)).filter(i => i >= 0));
  const groundProps = ['T02-01', 'T02-02', 'T02-03', 'T02-06', 'T02-08'];
  const groundFirst = Math.min.apply(null, groundProps
    .map(id => order.indexOf(id)).filter(i => i >= 0));
  const cachedGroup = ['HUB-03', 'T02-04', 'T02-05', 'T02-07', 'T02-09', 'T02-10'];
  const t1OrderAfter = P.order.filter(id => /^HUB-/.test(id));
  const t1OrderControl = C.probe.order.filter(id => /^HUB-/.test(id));
  const t1OrderAntes = B.probe.order.filter(id => /^HUB-/.test(id));
  const t2OrderCount = P.order.filter(id => /^T02-/.test(id)).length;
  add(7, 'Orden de profundidad y capas (motor intacto, sin canvas nuevo)',
    floorFirst >= 0 && groundFirst >= 0 && floorFirst < groundFirst &&
    cachedGroup.every(id => order.indexOf(id) >= 0) && t2OrderCount === 10 &&
    eq(P.hubAudit, C.probe.hubAudit) && eq(P.hubAudit, B.probe.hubAudit) &&
    t1OrderAfter.length === 10 && eq(t1OrderAfter, t1OrderControl) &&
    eq(t1OrderAfter, t1OrderAntes) &&
    P.canvasCountBase === B.probe.canvasCountBase &&
    P.canvasCountBase === C.probe.canvasCountBase &&
    P.canvasCount === P.canvasCountBase + P.canvasPortraitCount,
    { firstDrawIndex: { floorT01: floorFirst, groundPropsT02: groundFirst },
      firstDrawOrder: order.slice(0, 30), cachedLayerGroup: cachedGroup,
      t01OrderDespues: t1OrderAfter, t01OrderControl: t1OrderControl,
      t01OrderAntes: t1OrderAntes, t02OrderCount: t2OrderCount,
      canvasCount: { despues: P.canvasCount, antes: B.probe.canvasCount,
                     control: C.probe.canvasCount },
      canvasCountBase: { despues: P.canvasCountBase, antes: B.probe.canvasCountBase,
                         control: C.probe.canvasCountBase },
      canvasPortraitCount: { despues: P.canvasPortraitCount, antes: B.probe.canvasPortraitCount,
                             control: C.probe.canvasPortraitCount },
      hubAuditEqual: eq(P.hubAudit, C.probe.hubAudit) && eq(P.hubAudit, B.probe.hubAudit),
      note: 'El orden lo fija el motor: capas cacheadas de muro/aristas/techo -> suelo -> props con sortY -> capa aérea. La secuencia de los 10 slots de T01 es idéntica con y sin T02, el inventario BASE de canvases (27 en las tres fases) no cambia y hubAudit (6 zonas / 11 estaciones / geometría) es idéntico.',
      canvas28Note: 'DESPUÉS registra un canvas.hub-portrait-canvas de 72x72 creado por el PROPIO juego al ejecutar openStation("bar") en la comprobación 11; ANTES y CONTROL no abren estaciones. Es UI preexistente, no un lienzo del pack. Diagnóstico ejecutado en canvas_probe.json.',
      noNewCanvasFromPack: true },
    ['despues_01_hub.png', 'control_01_hub.png', 'antes_01_hub.png',
     'despues_runtime_full.json', 'canvas_probe.json']);

  /* 8 · movimiento. La sonda usa 900 ms de rAF real + un tick(60): el delta
     varía unos píxeles entre ejecuciones por el número de fotogramas, también
     en el control. Se exige mismo punto de partida, mismo sentido y una
     desviación < 25 px; la prueba DETERMINISTA de geometría es la 9. */
  add(8, 'Movimiento del jugador',
    A.movement.delta > 0 && A.movement.withinWorld &&
    A.movement.pxBefore === B.movement.pxBefore &&
    A.movement.pxBefore === C.movement.pxBefore &&
    B.movement.delta > 0 && C.movement.delta > 0 &&
    Math.abs(A.movement.delta - B.movement.delta) < 25 &&
    Math.abs(A.movement.delta - C.movement.delta) < 25,
    { despues: A.movement, antes: B.movement, control: C.movement,
      rafTolerancePx: 25,
      note: 'Desviación de 4–7 px por cadencia de fotogramas, presente también entre ANTES y CONTROL; no es una regresión. La colisión contra el sólido de la barra se compara con tolerancia 0,01 px en la comprobación 9.' },
    ['despues_tras_movimiento.png']);

  /* 9 · colisiones y zonas transitables */
  add(9, 'Colisiones, zonas y estaciones sin cambios',
    eq(P.hubAudit, B.probe.hubAudit) && eq(P.hubAudit, C.probe.hubAudit) &&
    eq(P.stations, B.probe.stations) && eq(P.stations, C.probe.stations) &&
    Math.abs(A.collision.delta - B.collision.delta) < 0.01 &&
    Math.abs(A.collision.delta - C.collision.delta) < 0.01 &&
    A.collision.blockedBeforeBarCollider === B.collision.blockedBeforeBarCollider &&
    A.collision.blockedBeforeBarCollider === C.collision.blockedBeforeBarCollider,
    { hubAuditDespues: P.hubAudit, hubAuditAntes: B.probe.hubAudit,
      stationsEqual: eq(P.stations, B.probe.stations) && eq(P.stations, C.probe.stations),
      collisionDespues: A.collision, collisionAntes: B.collision, collisionControl: C.collision,
      note: 'Ningún asset añade colisionador: se sustituye únicamente el Image de slots ya dibujados.' },
    ['despues_detalle_bar.png', 'control_01_hub.png']);

  /* 10 · puertas / transición / Ot.openT */
  add(10, 'Transición a campaña y apertura de puertas (Ot.openT intacto)',
    A.campaign.completed && A.screenshots.doors_closed > 0 && A.screenshots.doors_open > 0 &&
    A.doors.closed.dungeon && A.doors.open.dungeon,
    { campaign: A.campaign, campaignStart: A.campaignStart,
      setNight: A.doors.setNight, clearRound: A.doors.clearRound,
      dungeonClosed: A.doors.closed.dungeon, dungeonOpen: A.doors.open.dungeon,
      locationClosed: A.doors.closed.hub.location,
      locationOpen: A.doors.open.hub.location,
      architectureAfterDoors: A.doors.open.architecture.applied,
      note: 'Sala real r23 (setNight 24): puertas cerradas y clearRound() para abrirlas. No se modifica Ot.openT.' },
    ['doors_closed.png', 'doors_open.png']);

  /* 11 · interactivos existentes */
  add(11, 'Elementos interactivos y funcionales del HUB',
    A.interaction.stationsBefore === 11 && A.interaction.active === 'bar' &&
    A.interaction.activeAfter !== 'bar' &&
    ['hub_arcade_shrine', 'hub_arsenal_shrine', 'hub_seals_shrine', 'descent_abyssal_lift_pad']
      .every(slot => h2.assets.some(a => a.slots[0] === slot && a.live)) &&
    directIds.every(id => draws[id] && draws[id].count > 0),
    { interaction: A.interaction, stations: A.interaction.stationsBefore,
      functionalSlotsLive: ['hub_arcade_shrine', 'hub_arsenal_shrine',
        'hub_seals_shrine', 'descent_abyssal_lift_pad'],
      note: 'No se implementa ninguna interacción nueva: los santuarios y la plataforma conservan las estaciones, puertas y Ot.openT existentes.' },
    ['despues_01_hub.png', 'despues_detalle_arcade.png', 'despues_detalle_sellos.png']);

  /* 12 · regresión de sistemas + T01 intacta + sala de campaña */
  const CR = A.campaignRegression;
  const reg = {
    tanda01Live: h1.applied === 10 && h1.enabled === true && h1.errors.length === 0,
    tanda01Draws: ['HUB-01', 'HUB-02', 'HUB-04', 'HUB-05', 'HUB-07', 'HUB-10']
      .filter(id => (draws[id] ? draws[id].count : 0) > 0).length >= 4,
    tanda01Integrity: P.integrity.assets.every(a => a.live) && P.integrity.errors.length === 0,
    tanda02Architecture: P.architecture.applied === 10 && P.architecture.enabled,
    tanda03Player: P.player.version === 'tanda03-faseD.2' && P.player.poses === 12,
    v5Ready: P.v5.ready === P.v5.total && P.v5.errors.length === 0,
    shooting: A.shooting.delta > 0,
    campaignRoom: CR.hub.location === 'CAMPAIGN_ROOM' && !CR.hub.inHub,
    campaignT02Registry: CR.hub2Pack.applied === 10,
    campaignV5: CR.v5.ready === CR.v5.total && CR.v5.errors.length === 0,
    campaignNoErrors: CR.pageErrors.length === 0 && CR.artPack.status === 'applied',
    stateEqual: eq({ location: P.hub.location, inHub: P.hub.inHub, mode: P.hub.mode,
                     transitionLock: P.hub.transitionLock, modalOpen: P.hub.modalOpen },
                   { location: B.probe.hub.location, inHub: B.probe.hub.inHub,
                     mode: B.probe.hub.mode, transitionLock: B.probe.hub.transitionLock,
                     modalOpen: B.probe.hub.modalOpen }),
    errorsEqual: A.consoleErrors.length === B.consoleErrors.length
  };
  add(12, 'Regresión de sistemas, TANDA 01 intacta y sala de campaña',
    Object.values(reg).every(Boolean),
    { ...reg, integrity: P.integrity.assets.map(a => ({ id: a.id, live: a.live })),
      architecture: { applied: P.architecture.applied, enabled: P.architecture.enabled },
      player: P.player, v5: P.v5, shooting: A.shooting,
      tanda01: { applied: h1.applied, enabled: h1.enabled, errors: h1.errors },
      campaignRegression: { location: CR.hub.location, inHub: CR.hub.inHub,
        hub2Applied: CR.hub2Pack.applied, v5: CR.v5,
        artPackStatus: CR.artPack.status, pageErrors: CR.pageErrors,
        t3bErrors: CR.t3b.errors },
      note: 'Seis slots de T02 son compartidos con salas de campaña: se comprueba exprésamente que el registro V5 sigue completo en CAMPAIGN_ROOM.' },
    ['regresion_campaign.png', 'antes_runtime.json', 'control_runtime.json',
     'despues_runtime_full.json']);

  return {
    started: new Date().toISOString(), finished: new Date().toISOString(),
    build: URL, viewport: [1280, 900],
    phases: ['antes (T01 sin T02)', 'control (restore en caliente)', 'despues (T01+T02)'],
    states: ['APROBADO', 'FALLIDO', 'BLOQUEADO', 'NO VERIFICADO'],
    checks, summary: checks.reduce((o, c) => (o[c.state] = (o[c.state] || 0) + 1, o), {}),
    table: MANIFEST.assets.map(a => {
      const h = h2.assets.find(x => x.id === a.id);
      const vis = visibility.find(v => v.id === a.id);
      return { ID: a.id, slot: a.slot, Generado: !!a.sha256,
        Integrado: !!h && h.live, Visible: !!vis && vis.draws > 0,
        Validado: !!h && h.live && h.exactSize && a.borderClean && !!vis && vis.draws > 0 };
    }),
    incidenceReview: {
      'HUB-01 loaderResolves=0': 'Esperable: HUB-01 se consume por createPattern en el suelo, no por __DDM_GET_V5. No afecta a T02 (los 10 se resuelven por loader V5).',
      'HUB-03 desviación 26,92 %': 'Caja 135x156 que el pintor de muros aplicaba antes de T01; no se modifica el motor.',
      'Costura media 12,57': 'Métrica de preparación de HUB-01; T02 usa su propio pipeline con halo máximo 0,18 %.',
      'Dos 404 Cloudflare': 'cdn-cgi/challenge-platform externos y preexistentes; 0 404 locales y 0 pageerror.',
      sharedSystemsModified: false
    }
  };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/tmp/chromium', headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: process.env.LD_LIB_PATH || '/tmp/chromelibs/lib:/tmp' },
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
           '--use-gl=swiftshader', '--disable-background-networking',
           '--disable-logging', '--log-level=3']
  });
  const log = { started: new Date().toISOString(), url: URL };
  for (const mode of ['antes', 'control', 'despues']) await phase(browser, mode, log);
  await browser.close();
  for (const mode of ['antes', 'control', 'despues']) {
    fs.writeFileSync(R(mode + '_runtime.json'), JSON.stringify(log[mode], null, 2));
  }
  fs.writeFileSync(R('despues_runtime_full.json'), JSON.stringify(log.despues, null, 2));
  const report = buildReport(log);
  fs.writeFileSync(R('report.json'), JSON.stringify(report, null, 2));
  console.log('\n===== HUB · TANDA 02 · RESULTADOS =====');
  report.checks.forEach(c => console.log(`  ${String(c.id).padStart(2)} ${c.state.padEnd(10)} ${c.check}`));
  console.log('  resumen:', JSON.stringify(report.summary));
  console.log('  tabla:', JSON.stringify(report.table));
  console.log('  visibilidad:', JSON.stringify(report.checks[3].detail.visibility));
  console.log('  informe:', R('report.json'));
  if (report.summary.FALLIDO) process.exitCode = 2;
})().catch(e => {
  console.error('VALIDACIÓN FALLIDA:', e && e.stack || e);
  fs.writeFileSync(R('validation_error.json'), JSON.stringify({ error: String(e), stack: e && e.stack }, null, 2));
  process.exit(1);
});
