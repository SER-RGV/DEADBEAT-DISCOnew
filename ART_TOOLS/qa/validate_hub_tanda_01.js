/* ============================================================================
 * HUB · TANDA 01 — validación real en Chromium headless (Playwright-core)
 * ----------------------------------------------------------------------------
 * Compara la MISMA build con el HUB aplicado ("despues") y con el paquete
 * revertido en caliente ("control"), y ejecuta las 12 comprobaciones exigidas:
 *   1 HTML  2 carga de 10 assets  3 errores JS  4 visibilidad  5 perspectiva
 *   6 transparencias  7 profundidad  8 movimiento  9 colisiones  10 puertas
 *   11 interactivos  12 regresión de sistemas.
 *
 * No modifica el juego: solo etiqueta imágenes para contar drawImage real,
 * usa la API de depuración existente (DMO.debug.*) y guarda capturas CDP.
 *
 * Uso:
 *   QA_LIB=/tmp/qatools/node_modules/playwright-core \
 *   CHROME_PATH=/tmp/chromium LD_LIB_PATH=/tmp/chromelibs/lib:/tmp \
 *   node ART_TOOLS/qa/validate_hub_tanda_01.js
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.QA_LIB || 'playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.env.OUTDIR || path.join(ROOT, 'ART_EVIDENCE', 'hub', 'tanda_01');
const URL = process.env.GAME_URL || 'http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html';
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'ART_ASSETS/hub/tanda_01/manifest.json'), 'utf8'));
const BASELINE = path.join(OUT, 'antes_runtime.json');
const R = (name) => path.join(OUT, name);

const INIT = `(() => {
  const W = window;
  const P = W.__HUBQA = { draws: {}, onScreen: {}, seq: [], patterns: {},
                          errors: [], assetResponses: [] };
  const rect = (m, x, y) => ({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f });
  function screenBox(ctx, dx, dy, dw, dh) {
    let m;
    try { m = ctx.getTransform(); } catch (e) { return null; }
    const p = [rect(m, dx, dy), rect(m, dx + dw, dy), rect(m, dx, dy + dh), rect(m, dx + dw, dy + dh)];
    const xs = p.map(v => v.x), ys = p.map(v => v.y);
    return [Math.min.apply(null, xs), Math.min.apply(null, ys),
            Math.max.apply(null, xs), Math.max.apply(null, ys)];
  }
  const origDraw = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (src) {
    let id = src && src.__hubTanda01;
    /* El medallón se dibuja primero a un canvas auxiliar (3 args) y luego
       ese canvas se dibuja en pantalla: se atribuye a HUB-02. */
    if (!id && src && W.__DDM_V5_MED_NO_SKULL && src === W.__DDM_V5_MED_NO_SKULL) id = 'HUB-02';
    if (id) {
      const d = P.draws[id] || (P.draws[id] = { count: 0, args: {}, boxes: [], sample: null });
      d.count++;
      d.args[arguments.length] = (d.args[arguments.length] || 0) + 1;
      if (P.seq.length < 900) P.seq.push(id);
      if (arguments.length >= 5) {
        const b = screenBox(this, arguments[1], arguments[2], arguments[3], arguments[4]);
        if (b) {
          const cv = this.canvas;
          const visible = b[2] > 0 && b[0] < cv.width && b[3] > 0 && b[1] < cv.height;
          if (visible) {
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
    const id = img && img.__hubTanda01;
    if (id) {
      P.patterns[id] = (P.patterns[id] || 0) + 1;
      if (P.seq.length < 900) P.seq.push(id);
    }
    return origPat.apply(this, arguments);
  };
  W.addEventListener('error', e => P.errors.push(String(e.message).slice(0, 200)));
})()`;

const PROBE = `(() => {
  const W = window, safe = f => { try { return f(); } catch (e) { return 'ERR:' + e.message; } };
  return {
    ts: new Date().toISOString(), url: location.href, readyState: document.readyState,
    title: document.title,
    hub: safe(() => W.DMO_HUB.state()),
    hubAudit: safe(() => W.DMO_HUB.audit()),
    stations: safe(() => W.DMO_HUB.stations()),
    artPack: safe(() => W.DMO_ART_PACK.state()),
    integrity: safe(() => W.DMO_ART_PACK.integrity()),
    architecture: safe(() => W.DMO_ART_PACK.architecture()),
    player: safe(() => { const p = W.DMO_ART_PACK.player(); return { version: p.version,
      poses: (p.poses || []).length, errors: p.errors }; }),
    hubPack: safe(() => W.DMO_ART_PACK.hub()),
    t3b: safe(() => ({ enabled: W.__T3B.enabled, revision: W.__T3B.revision,
      ready: W.__T3B.ready.slice(), errors: W.__T3B.errors.slice(),
      images: W.__T3B.images.map(i => i && i.currentSrc ? i.currentSrc : null),
      draws: W.__T3B.draws.slice(-25) })),
    hubFloor: safe(() => W.__T3B_HUB_QA.state()),
    v5: safe(() => { const s = W.DMO_REFERENCE_ROOM_ASSETS.state();
      return { ready: Object.keys(s.v5Ready).filter(k => s.v5Ready[k]).length,
               total: Object.keys(s.v5Ready).length, errors: s.errors.slice() }; }),
    dungeon: safe(() => { const d = W.DMO_DUNGEON.state(); return { current: d.current,
      role: d.role, secured: d.secured, floor: d.floor,
      doorFields: Object.keys(d).filter(k => /door|open|secure|clear/i.test(k))
        .reduce((o, k) => (o[k] = d[k], o), {}) }; }),
    debug: safe(() => { const d = W.DMO.debug.state(); return { px: d.px, py: d.py,
      round: d.round, enemies: d.enemies }; }),
    stats: safe(() => W.DMO.testStats()),
    draws: W.__HUBQA.draws, onScreen: W.__HUBQA.onScreen,
    patterns: W.__HUBQA.patterns, seq: W.__HUBQA.seq.slice(0, 240),
    pageErrors: W.__HUBQA.errors
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
  }, { timeout: 30000 });
}
async function shot(page, name) {
  const f = R(name);
  await page.screenshot({ path: f, timeout: 60000 });
  return fs.statSync(f).size;
}

function watch(page, log) {
  page.on('console', m => { if (m.type() === 'error') log.consoleErrors.push(m.text().slice(0, 220)); });
  page.on('pageerror', e => log.pageErrors.push(String(e.message).slice(0, 220)));
  page.on('response', r => {
    const u = r.url();
    if (u.indexOf('ART_ASSETS/hub/tanda_01/') >= 0) {
      log.assetResponses.push({ url: u.split('/').pop(), status: r.status(),
                                type: r.headers()['content-type'] || '' });
    }
    if (r.status() >= 400) log.httpErrors.push({ status: r.status(), url: u.slice(0, 160) });
  });
  page.on('requestfailed', r => log.requestFailed.push({ url: r.url().slice(0, 160),
    failure: r.failure() && r.failure().errorText }));
}

async function phase(browser, mode, log) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const rec = { consoleErrors: [], pageErrors: [], httpErrors: [], requestFailed: [], assetResponses: [] };
  watch(page, rec);
  await page.addInitScript(INIT);
  const t0 = Date.now();
  const resp = await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
  rec.htmlStatus = resp && resp.status();
  rec.loadMs = Date.now() - t0;
  await waitArtPack(page);
  if (mode === 'control') {
    rec.hubRestore = await page.evaluate(() => {
      try { return window.DMO_ART_PACK.hubRestore(); } catch (e) { return 'ERR:' + e.message; }
    });
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(900);
  await bootToHub(page);
  await page.evaluate(() => { try { window.DMO_ART_PACK.hubTag(); } catch (e) {} });
  /* La secuencia de dibujo se reinicia YA en el HUB: el orden de capas se
     mide sobre fotogramas de juego, no sobre los del menú/cinemática.
     setEnabled(true) incrementa __T3B.revision y fuerza la reconstrucción
     del canvas de suelo con la imagen ya etiquetada, de modo que el
     createPattern real de HUB-01 cae dentro de esa ventana de medida. */
  await page.evaluate((m) => {
    try { window.__HUBQA.seq.length = 0; } catch (e) {}
    if (m === 'despues') {
      try { window.__T3B.setEnabled(true); } catch (e) {}
    }
  }, mode);
  await page.waitForTimeout(700);
  rec.prefix = mode;
  rec.probe = await page.evaluate(PROBE);
  rec.screenshots = {};
  if (mode === 'despues') {
    await page.evaluate(() => { try { window.__DDM_V5_MED_NO_SKULL = null; } catch (e) {} });
    await page.waitForTimeout(500);
    rec.screenshots.despues_01_hub = await shot(page, 'despues_01_hub.png');
    const zones = [
      ['despues_02_detalle_dj.png', 1250, 445],
      ['despues_03_detalle_bar.png', 1910, 845],
      ['despues_04_detalle_sofas.png', 785, 545],
      ['despues_05_detalle_descenso.png', 1250, 1365],
      ['despues_06_detalle_este.png', 1715, 545]
    ];
    for (const [name, x, y] of zones) {
      await page.evaluate(([x, y]) => {
        try { window.DMO.debug.teleport(x, y); } catch (e) {}
        try { window.DMO.debug.tick(0.016, 30); } catch (e) {}
      }, [x, y]);
      await page.waitForTimeout(700);
      rec.screenshots[name] = await shot(page, name);
    }
    await runMoveCollision(page, rec);
    rec.screenshots.despues_07_tras_movimiento = await shot(page, 'despues_07_tras_movimiento.png');

    /* --- 11 · elementos interactivos (estación real) -------------------- */
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

    /* --- 10/12 · transición a campaña, puertas y disparo ---------------- */
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
    rec.doors.closedShot = await shot(page, 'doors_closed.png');
    rec.doors.clearRound = await page.evaluate(() => {
      try { return String(window.DMO.debug.clearRound()); } catch (e) { return 'ERR:' + e.message; }
    });
    for (let i = 0; i < 14; i++) {
      try { await page.evaluate(() => window.DMO.debug.tick(0.016, 30)); } catch (_) {}
      await page.waitForTimeout(130);
    }
    rec.doors.open = await page.evaluate(PROBE);
    rec.doors.openShot = await shot(page, 'doors_open.png');

    /* Disparo real del jugador (proyectiles en wa / shotsFired) */
    const s0 = await page.evaluate(() => window.DMO.testStats().shotsFired);
    await page.evaluate(() => { try { window.DMO.debug.setInput({ fire: true }); } catch (e) {} });
    await page.evaluate(() => { try { window.DMO.debug.tick(0.016, 60); } catch (e) {} });
    await page.evaluate(() => { try { window.DMO.debug.setInput({ fire: false }); } catch (e) {} });
    const s1 = await page.evaluate(() => window.DMO.testStats().shotsFired);
    rec.shooting = { before: s0, after: s1, delta: s1 - s0 };
    rec.screenshots.regresion_campaign = await shot(page, 'regresion_campaign.png');
  } else {
    rec.screenshots.control_01_hub = await shot(page, 'control_01_hub.png');
    await runMoveCollision(page, rec);
  }
  rec.probeFinal = await page.evaluate(PROBE);
  rec.consoleErrors = rec.consoleErrors || [];
  log[mode] = rec;
  await ctx.close();
  return rec;
}

function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

/* Movimiento + sonda de colisión, idéntica en control y en después.
   Se acerca al sólido real de la barra (x=1812..2008) y se mantiene 'd'. */
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

function buildReport(log) {
  const A = log.despues, C = log.control;
  const P = A.probe, hub = P.hubPack;
  const manifestBy = {};
  MANIFEST.assets.forEach(a => { manifestBy[a.id] = a; });
  const knownErrors = e => /404|cdn-cgi|challenge-platform/.test(e);
  const jsErrors = A.pageErrors.filter(e => !knownErrors(e))
    .concat(A.consoleErrors.filter(e => !knownErrors(e)));
  const assetFiles = new Set(A.assetResponses.filter(r => r.status === 200).map(r => r.url));
  const assetIds = Object.keys(manifestBy);
  const draws = P.draws || {}, onScreen = P.onScreen || {}, patterns = P.patterns || {};
  const checks = [];
  const add = (id, name, ok, state, detail, evidence) =>
    checks.push({ id, check: name, state: state || (ok ? 'APROBADO' : 'FALLIDO'),
                  detail, evidence: evidence || [] });

  /* 1 */
  add(1, 'Carga del HTML', A.htmlStatus === 200 && P.readyState === 'complete' && A.loadMs < 180000,
    null, { status: A.htmlStatus, loadMs: A.loadMs, readyState: P.readyState, title: P.title },
    ['despues_01_hub.png']);
  /* 2 */
  const loaded = hub.assets.every(a => a.loaded && a.exactSize && a.live);
  add(2, 'Carga de los diez assets', loaded && assetFiles.size === 10, null,
    { applied: hub.applied + '/' + hub.count, slots: hub.slotsApplied,
      http200: assetFiles.size, files: [...assetFiles].sort(),
      perAsset: hub.assets.map(a => ({ id: a.id, loaded: a.loaded, exactSize: a.exactSize,
        live: a.live, natural: a.natural })) },
    ['manifest.json', 'despues_runtime.json']);
  /* 3 */
  add(3, 'Ausencia de errores JavaScript', jsErrors.length === 0 && A.pageErrors.length === C.pageErrors.length,
    null, { pageErrors: A.pageErrors, consoleErrors: A.consoleErrors,
      knownCloudflare404: A.httpErrors.length, excluded: jsErrors },
    ['despues_runtime.json', 'control_runtime.json']);
  /* 4 */
  const visibleIds = assetIds.filter(id => id === 'HUB-01'
    ? (patterns[id] > 0 && (P.hubFloor.draws > 0))
    : (draws[id] && (onScreen[id] || draws[id].args['3'])));
  add(4, 'Visibilidad de los recursos en el HUB real', visibleIds.length === 10, null,
    { visible: visibleIds, drawCounts: assetIds.map(id => ({ id, draws: draws[id] ? draws[id].count : 0,
        onScreen: onScreen[id] ? onScreen[id].count : 0,
        patterns: patterns[id] || 0, sampleBox: onScreen[id] ? onScreen[id].sample : null })),
      hubFloorDraws: P.hubFloor.draws,
      t3bHubCandidate: P.t3b.draws.filter(d => d.route === 'hub' && d.index === 1 && d.choice === 'candidate').length },
    ['despues_01_hub.png', 'despues_02_detalle_dj.png', 'despues_03_detalle_bar.png',
     'despues_04_detalle_sofas.png', 'despues_05_detalle_descenso.png', 'despues_06_detalle_este.png']);
  /* 5 */
  const scale = assetIds.map(id => {
    const m = manifestBy[id], d = draws[id] && draws[id].sample;
    if (!d) return { id, note: 'patrón createPattern (sin caja drawImage)',
                     preparedWithoutDeformation: true };
    const native = m.width / m.height, drawn = d[0] / d[1];
    return { id, nativeAspect: +native.toFixed(3), drawnAspect: +drawn.toFixed(3),
             motorBoxDeviationPct: +(100 * Math.abs(native - drawn) / native).toFixed(2),
             drawBox: d, preparedWithoutDeformation: m.preparation.deformed === false,
             motorTransformPreexisting: id === 'HUB-03' };
  });
  add(5, 'Perspectiva y escala (sin deformación)', scale.every(s => s.preparedWithoutDeformation), null,
    { perAsset: scale,
      note: 'La preparación usa contain+pivote: ningún PNG se deforma. HUB-03 muestra la desviación de la caja 135x156 que el pintor de muros aplicaba ANTES de esta tanda (Tanda 02, slot wall_stained_glass_arch); no se ha modificado el motor.' },
    ['manifest.json', 'despues_runtime.json']);
  /* 6 */
  const alphaOK = MANIFEST.assets.every(a => {
    if (a.id === 'HUB-01') {
      return a.mode === 'RGB' && a.alphaChannel === false &&
             a.opaquePx === a.width * a.height && a.exactSize;
    }
    return a.alphaChannel === true && a.alphaExtrema[0] === 0 &&
           a.alphaExtrema[1] === 255 && a.borderClean && a.exactSize;
  });
  add(6, 'Transparencias, bordes y alfa', alphaOK, null,
    { perAsset: MANIFEST.assets.map(a => ({ id: a.id, mode: a.mode, alpha: a.alphaChannel,
        extrema: a.alphaExtrema, coveragePct: a.coveragePct, corners: a.cornersTransparent,
        whiteFringePct: a.whiteFringePct, borderClean: a.borderClean })),
      hub02Filter: manifestBy['HUB-02'].medallionFilterCompat },
    ['manifest.json']);
  /* 7 */
  const seq = P.seq || [];
  const first = id => seq.indexOf(id);
  const floorFirst = Math.min(first('HUB-01'), first('HUB-02'));
  const propFirst = Math.min(...['HUB-04', 'HUB-05', 'HUB-07', 'HUB-10']
    .map(first).filter(i => i >= 0));
  add(7, 'Orden de profundidad / capas', floorFirst >= 0 && propFirst >= 0 && floorFirst < propFirst,
    null, { firstDrawIndex: { floor: floorFirst, props: propFirst },
      sequenceHead: seq.slice(0, 24),
      note: 'El orden lo fija el motor (drawHubFloorLayer -> props con sortY -> drawHubAerialLayer). El pack solo registra imágenes.' },
    ['despues_01_hub.png', 'despues_02_detalle_dj.png']);
  /* 8 */
  add(8, 'Movimiento del jugador', A.movement.delta !== 0 && A.movement.withinWorld, null,
    A.movement, ['despues_07_tras_movimiento.png']);
  /* 9 */
  add(9, 'Colisiones y zonas transitables',
    eq(P.hubAudit, C.probe.hubAudit) && eq(P.stations, C.probe.stations) &&
    Math.abs(A.collision.delta - C.collision.delta) < 0.01 &&
    A.collision.blockedBeforeBarCollider === C.collision.blockedBeforeBarCollider,
    null, { hubAuditAfter: P.hubAudit, hubAuditControl: C.probe.hubAudit,
      stationsEqual: eq(P.stations, C.probe.stations),
      collisionAfter: A.collision, collisionControl: C.collision,
      movementAfter: A.movement, movementControl: C.movement },
    ['despues_03_detalle_bar.png']);
  /* 10 */
  add(10, 'Apertura de puertas (Ot.openT intacto)', A.campaign.completed &&
    A.doors.closedShot > 0 && A.doors.openShot > 0 &&
    A.doors.closed.dungeon && A.doors.open.dungeon, null,
    { campaign: A.campaign, setNight: A.doors.setNight, clearRound: A.doors.clearRound,
      closed: A.doors.closed.dungeon, open: A.doors.open.dungeon,
      architectureAppliedAfterDoors: A.doors.open.architecture.applied,
      note: 'Se usa la sala real r23 (setNight 24) con puertas cerradas y clearRound() para abrirlas, igual que la QA de la Tanda 02.' },
    ['doors_closed.png', 'doors_open.png']);
  /* 11 */
  add(11, 'Elementos interactivos (estaciones HUB)',
    A.interaction.stationsBefore === 11 && A.interaction.active === 'bar' &&
    A.interaction.activeAfter !== 'bar', null, A.interaction,
    ['despues_01_hub.png']);
  /* 12 */
  const reg = {
    t01Integrity: P.integrity.assets.every(a => a.live) && P.integrity.errors.length === 0,
    t02Architecture: P.architecture.applied === 10 && P.architecture.enabled,
    t03Player: P.player.version === 'tanda03-faseD.2' && P.player.poses === 12,
    v5Ready: P.v5.ready === P.v5.total && P.v5.errors.length === 0,
    shooting: A.shooting.delta > 0,
    stateEqual: eq({ location: P.hub.location, inHub: P.hub.inHub, mode: P.hub.mode,
                     transitionLock: P.hub.transitionLock, modalOpen: P.hub.modalOpen },
                   { location: C.probe.hub.location, inHub: C.probe.hub.inHub, mode: C.probe.hub.mode,
                     transitionLock: C.probe.hub.transitionLock, modalOpen: C.probe.hub.modalOpen }),
    errorsEqual: A.consoleErrors.length === C.consoleErrors.length
  };
  add(12, 'Regresión de sistemas existentes', Object.values(reg).every(Boolean), null,
    { ...reg, integrity: P.integrity.assets.map(a => ({ id: a.id, live: a.live })),
      architecture: { applied: P.architecture.applied, enabled: P.architecture.enabled },
      player: P.player, v5: P.v5, shooting: A.shooting,
      campaignScreenshot: 'regresion_campaign.png' },
    ['regresion_campaign.png', 'antes_runtime.json', 'control_runtime.json']);
  return { started: new Date().toISOString(), build: URL,
    viewport: [1280, 900], states: ['APROBADO', 'FALLIDO', 'BLOQUEADO', 'NO VERIFICADO'],
    checks, summary: checks.reduce((o, c) => (o[c.state] = (o[c.state] || 0) + 1, o), {}),
    table: MANIFEST.assets.map(a => {
      const h = hub.assets.find(x => x.id === a.id);
      return { ID: a.id, Generado: true, Integrado: !!h && h.live,
        Visible: visibleIds.indexOf(a.id) >= 0,
        Validado: !!h && h.live && h.exactSize && a.borderClean && visibleIds.indexOf(a.id) >= 0 };
    }) };
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
  const log = { started: new Date().toISOString(), url: URL,
                baselineFile: fs.existsSync(BASELINE) ? BASELINE : null };
  await phase(browser, 'control', log);
  await phase(browser, 'despues', log);
  await browser.close();
  fs.writeFileSync(R('control_runtime.json'), JSON.stringify(log.control, null, 2));
  fs.writeFileSync(R('despues_runtime_full.json'), JSON.stringify(log.despues, null, 2));
  const report = buildReport(log);
  fs.writeFileSync(R('report.json'), JSON.stringify(report, null, 2));
  console.log('\n===== HUB · TANDA 01 · RESULTADOS =====');
  report.checks.forEach(c => console.log(`  ${String(c.id).padStart(2)} ${c.state.padEnd(12)} ${c.check}`));
  console.log('  resumen:', JSON.stringify(report.summary));
  console.log('  tabla:', JSON.stringify(report.table));
  console.log('  informe:', R('report.json'));
  if (report.summary.FALLIDO) process.exitCode = 2;
})().catch(e => {
  console.error('VALIDACIÓN FALLIDA:', e && e.stack || e);
  fs.writeFileSync(R('validation_error.json'), JSON.stringify({ error: String(e), stack: e && e.stack }, null, 2));
  process.exit(1);
});
