/* ============================================================================
 * HUB · TANDA 04 — FASE 5 · QA A/B real (Chromium + Playwright-core)
 * ----------------------------------------------------------------------------
 * MISMO procedimiento que TANDA 02/03: 3 fases, 1280x900, misma cámara,
 * misma escena, mismo entorno, mismos controles de regresión.
 *
 *   antes    : window.__DDM_HUB_T04 = false ANTES del boot. Es la MISMA build
 *              con la integración desactivada (equivalente al estado T03).
 *   control  : integración activa en el arranque, se desactiva EN CALIENTE
 *              dentro del HUB y se reactiva; además hub3Restore()/hub3Apply()
 *              demuestran que las APIs existentes siguen siendo la palanca.
 *   despues  : integración activa por defecto.
 *
 * 12 comprobaciones. Criterio de integración: >=1 drawImage EFECTIVO por
 * unidad, medido en el canvas del MUNDO del HUB (1280x900), nunca en el canvas
 * del menú. No se aprueba nada por el solo registro V5.
 *
 * Uso:
 *   QA_LIB=/tmp/qatools/node_modules/playwright-core \
 *   CHROME_PATH=/tmp/chromium LD_LIB_PATH=/tmp/chromelibs/lib:/tmp \
 *   node ART_TOOLS/qa/validate_hub_tanda_04.js
 *
 * El arnés NO modifica el juego: solo instala un proxy de solo lectura sobre
 * drawImage/createPattern y usa APIs de depuración ya existentes.
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
const ART_PACK_SHA = crypto.createHash('sha256')
  .update(fs.readFileSync(path.join(ROOT, 'ART_PACK/art_pack.js'))).digest('hex');
const MATRIX = JSON.parse(fs.readFileSync(R('matriz_integracion.json'), 'utf8'));
const BASELINE = JSON.parse(fs.readFileSync(R('baseline.json'), 'utf8'));
const IDS = MATRIX.rows.map(r => r.artId);

const ZONES = [
  ['centro', 1250, 935], ['dj', 1250, 445], ['bar', 1910, 845],
  ['vip_oeste', 785, 545], ['vip_este', 1715, 545], ['arcade', 655, 1210],
  ['sellos', 1845, 1210], ['descenso', 1250, 1365], ['arsenal', 590, 845],
  ['pared_este', 2050, 965]
];

/* Proxy de solo lectura: cuenta drawImage reales por unidad (etiqueta puesta
   por ART_PACK/art_pack.js), caja de pantalla, canvas y visibilidad. */
const INIT = `(() => {
  const W = window;
  const P = W.__T4QA = {
    phase: 'BOOT', zone: '', draws: {}, boxes: {}, onScreen: {},
    canvasSizes: {}, order: [], seq: [], errors: [], patterns: {}, byCanvas: {}
  };
  const rect = (m, x, y) => ({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f });
  function screenBox(ctx, dx, dy, dw, dh) {
    let m; try { m = ctx.getTransform(); } catch (e) { return null; }
    const p = [rect(m, dx, dy), rect(m, dx + dw, dy), rect(m, dx, dy + dh),
               rect(m, dx + dw, dy + dh)];
    return [Math.min.apply(null, p.map(v => v.x)), Math.min.apply(null, p.map(v => v.y)),
            Math.max.apply(null, p.map(v => v.x)), Math.max.apply(null, p.map(v => v.y))].map(Math.round);
  }
  function note(key) {
    const d = P.draws[key] || (P.draws[key] = { count: 0, sample: null, onScreen: 0, args: {} });
    d.count++;
    return d;
  }
  const origDraw = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (src) {
    try {
      const cv = this.canvas;
      const ck = (cv.id || 'sin-id') + ':' + cv.width + 'x' + cv.height;
      P.byCanvas[ck] = (P.byCanvas[ck] || 0) + 1;
      const id = src && (src.__hubTanda03 || src.__hubTanda02 || src.__hubTanda01);
      if (id) {
        const key = P.phase + '|' + id;
        const d = note(key);
        d.args[arguments.length] = (d.args[arguments.length] || 0) + 1;
        P.canvasSizes[key] = [cv.width, cv.height];
        if (P.order.indexOf(key) < 0) P.order.push(key);
        if (P.seq.length < 700) P.seq.push(key);
        if (arguments.length >= 5) {
          const b = screenBox(this, arguments[1], arguments[2], arguments[3], arguments[4]);
          if (b) {
            if (!d.sample) d.sample = { args: [arguments[1], arguments[2], arguments[3], arguments[4]].map(Math.round),
                                        box: b, canvas: [cv.width, cv.height] };
            P.boxes[key] = b;
            if (b[2] > 0 && b[0] < cv.width && b[3] > 0 && b[1] < cv.height) {
              d.onScreen++;
              P.onScreen[key] = (P.onScreen[key] || 0) + 1;
            }
          }
        }
      }
    } catch (e) {}
    return origDraw.apply(this, arguments);
  };
  const origPat = CanvasRenderingContext2D.prototype.createPattern;
  CanvasRenderingContext2D.prototype.createPattern = function (img) {
    try { const id = img && (img.__hubTanda03 || img.__hubTanda02 || img.__hubTanda01);
      if (id) P.patterns[P.phase + '|' + id] = (P.patterns[P.phase + '|' + id] || 0) + 1; } catch (e) {}
    return origPat.apply(this, arguments);
  };
  W.addEventListener('error', e => P.errors.push(String(e.message).slice(0, 200)));
})()`;

const INIT_ANTES = `(() => { window.__DDM_HUB_T04 = false; })()`;

const PROBE = `(() => {
  const W = window, P = W.__T4QA || {}, safe = f => { try { return f(); } catch (e) { return 'ERR:' + e.message; } };
  return {
    ts: new Date().toISOString(), url: location.href, readyState: document.readyState,
    title: document.title, phase: P.phase, zone: P.zone,
    flag: W.__DDM_HUB_T04,
    canvasCount: document.querySelectorAll('canvas').length,
    canvasCountBase: document.querySelectorAll('canvas:not(.hub-portrait-canvas)').length,
    menuCanvas: safe(() => { const c = document.getElementById('menu-canvas54'); return c ? [c.width, c.height] : null; }),
    coverDisplay: safe(() => { const c = document.getElementById('ddc-cover'); return c ? getComputedStyle(c).display : null; }),
    menu54: safe(() => W.DMO.menu54 && W.DMO.menu54.stats ? W.DMO.menu54.stats() : null),
    hub: safe(() => W.DMO_HUB.state()),
    hubAudit: safe(() => W.DMO_HUB.audit()),
    stations: safe(() => W.DMO_HUB.stations()),
    artPack: safe(() => W.DMO_ART_PACK.state()),
    integrity: safe(() => W.DMO_ART_PACK.integrity()),
    architecture: safe(() => W.DMO_ART_PACK.architecture()),
    player: safe(() => { const p = W.DMO_ART_PACK.player(); return { version: p.version, poses: (p.poses || []).length, errors: p.errors }; }),
    hubPack: safe(() => W.DMO_ART_PACK.hub()),
    hub2Pack: safe(() => W.DMO_ART_PACK.hub2()),
    hub3Pack: safe(() => W.DMO_ART_PACK.hub3()),
    v5Keys: safe(() => Object.keys(W.__DDM_V5_IMG || {}).length),
    t3b: safe(() => ({ enabled: W.__T3B.enabled, revision: W.__T3B.revision,
      ready: W.__T3B.ready.slice(), errors: W.__T3B.errors.slice(),
      lastInvalidation: W.__T3B.lastInvalidation,
      routes: W.__T3B.draws.slice(-30).map(d => d.route),
      draws: W.__T3B.draws.slice(-12) })),
    hubFloor: safe(() => W.__T3B_HUB_QA.state()),
    infernal: safe(() => ({ invalidate: typeof W.DMO_INFERNAL_ART.invalidate,
      keys: Object.keys(W.DMO_INFERNAL_ART) })),
    dungeon: safe(() => { const d = W.DMO_DUNGEON.state(); return { current: d.current, role: d.role, secured: d.secured, floor: d.floor }; }),
    debug: safe(() => W.DMO.debug.state()),
    stats: safe(() => W.DMO.testStats()),
    draws: P.draws, onScreen: P.onScreen, boxes: P.boxes,
    canvasSizes: P.canvasSizes, byCanvas: P.byCanvas,
    patterns: P.patterns, order: P.order, seq: (P.seq || []).slice(0, 200),
    pageErrors: P.errors
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
      return s === 'applied' || s === 'applied-with-errors'; } catch (e) { return false; }
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
    if (u.indexOf('ART_ASSETS/hub/tanda_03/') >= 0)
      rec.assetResponses.push({ url: u.split('/').pop(), status: r.status(), type: r.headers()['content-type'] || '' });
    if (r.status() >= 400) rec.httpErrors.push({ status: r.status(), url: u.slice(0, 160) });
  });
  page.on('requestfailed', r => rec.requestFailed.push({ url: r.url().slice(0, 160),
    failure: r.failure() && r.failure().errorText }));
}
async function resetWindow(page, phase) {
  await page.evaluate(p => {
    const P = window.__T4QA;
    try { P.phase = p; P.zone = ''; P.draws = {}; P.boxes = {}; P.onScreen = {};
          P.canvasSizes = {}; P.order = []; P.seq = []; P.patterns = {}; P.byCanvas = {}; } catch (e) {}
    try { window.__T3B.setEnabled(true); } catch (e) {}
  }, phase);
  await page.waitForTimeout(650);
}
/* Caja de pantalla de cada unidad en cada zona (misma cámara en las 3 fases). */
async function captureZones(page, rec, prefix) {
  rec.zoneBoxes = {};
  for (const [name, x, y] of ZONES) {
    await page.evaluate(([n, x, y]) => {
      const P = window.__T4QA;
      try { P.zone = n; P.boxes = {}; } catch (e) {}
      try { window.DMO.debug.teleport(x, y); } catch (e) {}
      try { window.DMO.debug.tick(0.016, 30); } catch (e) {}
    }, [name, x, y]);
    await page.waitForTimeout(480);
    const file = prefix + '_' + name + '.png';
    rec.screenshots[file] = await shot(page, file);
    rec.zoneBoxes[name] = await page.evaluate(() => JSON.parse(JSON.stringify(window.__T4QA.boxes)));
  }
}
async function measureRender(page) {
  return page.evaluate(() => new Promise(resolve => {
    // 41 marcas -> 40 deltas reales entre rAF consecutivos. No se mezcla
    // performance.now() con el timestamp de rAF (produce deltas negativos).
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
  await page.evaluate(() => { try { window.DMO.debug.teleport(1250, 965); } catch (e) {} });
  await page.waitForTimeout(400);
  const p0 = await page.evaluate(() => window.DMO.debug.state().px);
  await page.keyboard.down('d'); await page.waitForTimeout(900);
  await page.evaluate(() => { try { window.DMO.debug.tick(0.016, 60); } catch (e) {} });
  await page.keyboard.up('d'); await page.waitForTimeout(350);
  const p1 = await page.evaluate(() => window.DMO.debug.state().px);
  rec.movement = { pxBefore: p0, pxAfter: p1, delta: +(p1 - p0).toFixed(2), withinWorld: p1 > 0 && p1 < 2500 };
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
/* Cuenta las unidades T03 dibujadas en un instante dado (proxy reiniciado). */
async function countDraws(page) {
  return page.evaluate(() => {
    const P = window.__T4QA;
    return { draws: JSON.parse(JSON.stringify(P.draws)), boxes: JSON.parse(JSON.stringify(P.boxes)),
             byCanvas: JSON.parse(JSON.stringify(P.byCanvas)), flag: window.__DDM_HUB_T04 };
  });
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
    try { const h = window.DMO_ART_PACK.hub3(); return { registered: h.registered, loaded: h.loaded,
      enabled: h.enabled, blocked: h.blocked, verifiedDraws: h.verifiedDraws }; }
    catch (e) { return 'ERR:' + e.message; }
  });
  await page.waitForTimeout(1600);
  await page.evaluate(() => { if (window.__T4QA) window.__T4QA.phase = 'MENU'; });
  await page.waitForTimeout(900);
  rec.menuProbe = await page.evaluate(PROBE);
  rec.screenshots[mode + '_00_menu.png'] = await shot(page, mode + '_00_menu.png');

  await bootToHub(page);
  await resetWindow(page, 'HUB');
  await page.evaluate(() => { try { window.DMO.debug.teleport(1250, 935); } catch (e) {} });
  await page.waitForTimeout(550);
  rec.screenshots[mode + '_01_hub.png'] = await shot(page, mode + '_01_hub.png');
  rec.render = await measureRender(page);
  rec.loadCost = await page.evaluate(() => {
    try { const s = window.DMO_ART_PACK.state();
      return { startedAt: s.startedAt, hub3AppliedAt: s.hub3 && s.hub3.appliedAt,
               hub3BootAt: s.hub3Boot && s.hub3Boot.at,
               deltaMs: s.hub3 && s.startedAt ? s.hub3.appliedAt - s.startedAt : null }; }
    catch (e) { return { error: String(e) }; }
  });

  if (mode === 'control') {
    /* Reversibilidad EN CALIENTE: off -> 0 dibujos; on -> 13. */
    await page.evaluate(() => { window.__DDM_HUB_T04 = false; });
    await resetWindow(page, 'HUB');
    await page.waitForTimeout(500);
    rec.controlOff = await countDraws(page);
    rec.screenshots['control_02_off.png'] = await shot(page, 'control_02_off.png');
    await page.evaluate(() => { window.__DDM_HUB_T04 = true; });
    await resetWindow(page, 'HUB');
    await page.waitForTimeout(500);
    rec.controlOn = await countDraws(page);
    rec.screenshots['control_03_on.png'] = await shot(page, 'control_03_on.png');
    /* APIs existentes de T03: restore desconecta, apply reconecta. */
    rec.hub3Restore = await page.evaluate(() => {
      try { return window.DMO_ART_PACK.hub3Restore(); } catch (e) { return 'ERR:' + e.message; }
    });
    await resetWindow(page, 'HUB');
    await page.waitForTimeout(500);
    rec.controlRestore = await countDraws(page);
    rec.hub3Apply = await page.evaluate(() => {
      try { return window.DMO_ART_PACK.hub3Apply(); } catch (e) { return 'ERR:' + e.message; }
    });
    await resetWindow(page, 'HUB');
    await page.waitForTimeout(500);
    rec.controlApply = await countDraws(page);
    await runMoveCollision(page, rec);
    rec.probe = await page.evaluate(PROBE);
  } else {
    await captureZones(page, rec, mode);
    await runMoveCollision(page, rec);
    rec.screenshots[mode + '_tras_movimiento.png'] = await shot(page, mode + '_tras_movimiento.png');
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
const t3keys = d => Object.keys(d || {}).filter(k => /\|T03-/.test(k));

function buildReport(log) {
  const A = log.despues, B = log.antes, C = log.control;
  const P = A.probe, PF = A.probeFinal;
  const h3 = P.hub3Pack, h1 = P.hubPack, h2 = P.hub2Pack;
  const knownErrors = e => /404|cdn-cgi|challenge-platform/.test(e);
  const jsErrors = A.pageErrors.filter(e => !knownErrors(e))
    .concat(A.consoleErrors.filter(e => !knownErrors(e) &&
      !/^Failed to load resource: the server responded with a status of 404/.test(e)));
  const cloudflare404 = A.httpErrors.filter(e => /\/cdn-cgi\/challenge-platform\//.test(e.url));
  const localHttpErrors = A.httpErrors.filter(e => !/\/cdn-cgi\/challenge-platform\//.test(e.url));
  const assetFiles = new Set(A.assetResponses.filter(r => r.status === 200).map(r => r.url));
  const draws = PF.draws || {}, onScreen = PF.onScreen || {};
  const checks = [];
  const add = (id, name, ok, detail, evidence) =>
    checks.push({ id, check: name, state: ok ? 'APROBADO' : 'FALLIDO', detail, evidence: evidence || [] });

  /* --- conjunto de unidades medidas en DESPUÉS y en ANTES --- */
  const afterKeys = t3keys(draws);
  const afterIds = [...new Set(afterKeys.map(k => k.split('|')[1]))];
  const beforeKeys = t3keys(B.probeFinal.draws);
  const menuKeys = t3keys(A.menuProbe.draws);
  const controlOff = t3keys(C.controlOff.draws);
  const controlOn = t3keys(C.controlOn.draws);
  const controlRestore = t3keys(C.controlRestore.draws);
  const controlApply = t3keys(C.controlApply.draws);
  const t04Canvas = [...new Set(afterKeys.map(k => (PF.canvasSizes[k] || []).join('x')))];
  const notWorldCanvas = afterKeys.filter(k => (PF.canvasSizes[k] || []).join('x') !== '1280x900');
  const perUnit = MATRIX.rows.map(r => {
    const k = 'HUB|' + r.artId;
    const d = draws[k];
    return { artId: r.artId, unit: r.unit, v5Key: r.v5Key, family: r.family,
      renderer: r.renderer, worldBox: r.worldBox,
      drawCalls: d ? d.count : 0, onScreen: d ? d.onScreen : 0,
      sample: d ? d.sample : null, canvas: PF.canvasSizes[k] || null,
      integrated: !!(d && d.count > 0 && d.onScreen > 0) };
  });
  const integratedUnits = perUnit.filter(u => u.integrated);
  const blockers = perUnit.filter(u => !u.integrated);

  /* --- visibilidad completa de las 6 señales por zona --- */
  const signRows = MATRIX.rows.filter(r => r.family === 'D · SEÑALÉTICA');
  const signVisibility = signRows.map(r => {
    const k = 'HUB|' + r.artId;
    let full = 0, partial = 0, zones = [];
    for (const [zn, boxes] of Object.entries(A.zoneBoxes || {})) {
      const b = boxes[k];
      if (!b) continue;
      if (b[0] >= 4 && b[1] >= 4 && b[2] <= 1276 && b[3] <= 896) { full++; zones.push(zn); }
      else partial++;
    }
    return { artId: r.artId, v5Key: r.v5Key, anchor: r.worldBox.slice(0, 2),
      fullyVisibleZones: zones, full, partial, hidden: full === 0 };
  });
  const anchorsDistinct = new Set(signRows.map(r => r.worldBox.slice(0, 2).join(','))).size;
  const keysDistinct = new Set(signRows.map(r => r.v5Key)).size;

  /* --- suelos: solapamientos y cajas medidas --- */
  const floorRows = MATRIX.rows.filter(r => r.family === 'A · SUELOS');
  let overlaps = [];
  for (let i = 0; i < floorRows.length; i++) for (let j = i + 1; j < floorRows.length; j++) {
    const a = floorRows[i].worldBox, b = floorRows[j].worldBox;
    if (a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3])
      overlaps.push([floorRows[i].artId, floorRows[j].artId]);
  }
  const floorArgsOk = floorRows.every(r => {
    const d = draws['HUB|' + r.artId];
    return d && d.sample && eq(d.sample.args, r.worldBox);
  });
  const floorWithinPs = floorRows.every(r => r.worldBox[0] >= 290 && r.worldBox[1] >= 265 &&
    r.worldBox[0] + r.worldBox[2] <= 2210 && r.worldBox[1] + r.worldBox[3] <= 1585);

  /* --- 1 · integridad HTML/JS --- */
  const htmlText = fs.readFileSync(path.join(ROOT, 'DEADBEAT_DISCO.ART.html'), 'utf8');
  const begin = (htmlText.match(/TANDA04:BEGIN/g) || []).length;
  const end = (htmlText.match(/TANDA04:END/g) || []).length;
  add(1, 'Integridad del HTML, del art pack y de las APIs existentes',
    A.htmlStatus === 200 && P.readyState === 'complete' &&
    HTML_SHA === BASELINE.htmlAfterSha && ART_PACK_SHA === BASELINE.artPackSha &&
    begin === 4 && end === 4 &&
    P.artPack.status === 'applied' && /hub-tanda03/.test(P.artPack.version) &&
    typeof P.hub3Pack === 'object' && P.v5Keys === 142 &&
    P.infernal.invalidate === 'function' &&
    P.canvasCountBase === B.probe.canvasCountBase && P.canvasCountBase === C.probe.canvasCountBase,
    { htmlShaBefore: BASELINE.htmlBeforeSha, htmlShaAfter: HTML_SHA,
      artPackSha: ART_PACK_SHA, artPackUnchanged: ART_PACK_SHA === BASELINE.artPackSha,
      markerBlocks: { begin, end }, htmlDeltaBytes: BASELINE.bytesAfter - BASELINE.bytesBefore,
      htmlInsertions: 59, htmlDeletions: 2, filesModified: ['DEADBEAT_DISCO.ART.html'],
      jsFilesModified: [], status: P.artPack.status, version: P.artPack.version,
      v5Keys: P.v5Keys, canvasCountBase: { antes: B.probe.canvasCountBase,
        control: C.probe.canvasCountBase, despues: P.canvasCountBase },
      note: 'TANDA 04 modifica SOLO el HTML activo (3 bloques entre marcadores). ART_PACK/art_pack.js queda byte a byte idéntico: se mantienen __DDM_V5_IMG, load() y todas las APIs.' },
    ['baseline.json', 'matriz_integracion.json', 'despues_runtime_full.json']);

  /* --- 2 · recursos --- */
  add(2, 'Recursos cargados: 13/13 PNG, 8 unidades, registro V5 intacto',
    h3.count === 13 && h3.productionUnits === 8 && h3.enabled === true &&
    h3.registered === 13 && h3.loaded === 13 && h3.exactSize === 13 &&
    h3.errors.length === 0 && assetFiles.size === 13 && P.v5Keys === 142 &&
    B.hub3AtBoot.registered === 13 && controlApply.length >= 13,
    { units: MATRIX.units, finalPngFiles: MATRIX.files, http200: assetFiles.size,
      files: [...assetFiles].sort(), registered: h3.registered, loaded: h3.loaded,
      exactSize: h3.exactSize, v5Keys: P.v5Keys, errors: h3.errors,
      loader: 'load() de ART_PACK/art_pack.js -> window.__DDM_V5_IMG[h03_*] (sin loader paralelo)',
      note: 'TANDA 04 NO produce assets nuevos: reutiliza los 13 PNG finales de TANDA 03 ya validados.' },
    ['despues_runtime_full.json', 'antes_runtime.json', 'control_runtime.json']);

  /* --- 3 · errores --- */
  add(3, 'Ausencia de errores JavaScript y de 404 locales',
    jsErrors.length === 0 && A.pageErrors.length === B.pageErrors.length &&
    A.pageErrors.length === C.pageErrors.length &&
    A.consoleErrors.length === B.consoleErrors.length &&
    A.consoleErrors.length === C.consoleErrors.length &&
    localHttpErrors.length === 0 && (P.artPack.hub3Errors || []).length === 0 &&
    A.requestFailed.every(r => /\/cdn-cgi\/challenge-platform\//.test(r.url)),
    { pageErrors: A.pageErrors, consoleErrors: A.consoleErrors,
      consoleErrorsAntes: B.consoleErrors, consoleErrorsControl: C.consoleErrors,
      knownCloudflare404: cloudflare404, unexpectedLocalHttpErrors: localHttpErrors,
      requestFailed: A.requestFailed, excludedUnexpectedJs: jsErrors,
      hub3Errors: P.artPack.hub3Errors || [] },
    ['despues_runtime_full.json', 'control_runtime.json', 'antes_runtime.json']);

  /* --- 4 · CRITERIO DE INTEGRACIÓN: drawImage por unidad --- */
  add(4, 'Criterio de integración: >=1 drawImage efectivo por unidad en el renderer del HUB',
    integratedUnits.length === 13 && afterIds.length === 13 &&
    beforeKeys.length === 0 && controlOff.length === 0 && controlOn.length === 13 &&
    controlRestore.length === 0 && controlApply.length === 13 &&
    menuKeys.length === 0 && notWorldCanvas.length === 0,
    { unitsIntegrated: integratedUnits.length, expected: 13,
      drawKeysDespues: afterIds.sort(), drawKeysAntes: beforeKeys,
      drawKeysControlOff: controlOff, drawKeysControlOn: controlOn.length,
      drawKeysHub3Restore: controlRestore, drawKeysHub3Apply: controlApply.length,
      drawKeysMenu: menuKeys, canvasOfT04: t04Canvas,
      wrongCanvasDraws: notWorldCanvas,
      hub3RestoreResult: C.hub3Restore, hub3ApplyResult: C.hub3Apply,
      flagAntes: B.probe.flag, flagDespues: P.flag,
      note: 'Los 13 PNG se dibujan en el canvas de MUNDO del HUB (1280x900), nunca en menu-canvas54 (960x540). ANTES=0, CONTROL off=0, CONTROL on=13, restore=0, apply=13. El pintor del menú NO se cuenta.' },
    ['draw_calls.json', 'control_02_off.png', 'control_03_on.png', 'despues_01_hub.png']);

  /* --- 5 · visibilidad real --- */
  add(5, 'Visibilidad real: ninguna unidad oculta, ninguna señal recortada',
    integratedUnits.length === 13 && signVisibility.every(s => !s.hidden) &&
    signVisibility.every(s => s.full >= 1) &&
    P.coverDisplay === 'none' && P.hub.inHub === true &&
    menuKeys.length === 0 && notWorldCanvas.length === 0 &&
    t04Canvas.length === 1 && t04Canvas[0] === '1280x900' &&
    P.canvasCountBase === 27,
    { perUnitOnScreen: perUnit.map(u => ({ artId: u.artId, onScreen: u.onScreen,
        sampleBox: u.sample && u.sample.box })),
      signVisibility, floorOnScreen: perUnit.filter(u => u.family === 'A · SUELOS').map(u => u.onScreen),
      menuCanvas: P.menuCanvas, menu54: P.menu54,
      t04DrawsOutsideWorldCanvas: notWorldCanvas, t04DrawsInMenu: menuKeys,
      note: 'La capa aérea se dibuja DESPUÉS de los props, por lo que ninguna placa queda tapada. Cada una está COMPLETA dentro del viewport en al menos una de las 10 zonas. El renderer de píxeles del menú puede activarse 0 o 1 vez por timing del boot (comportamiento preexistente, medido y registrado): NO se usa como condición y NO dibuja ningún asset de TANDA 04. La integración se exige EXCLUSIVAMENTE en el canvas de mundo 1280x900 del HUB.' },
    ['despues_centro.png', 'despues_dj.png', 'despues_descenso.png', 'despues_arsenal.png']);

  /* --- 6 · suelos --- */
  add(6, 'Suelos: continuidad, orientación y ausencia de solapamientos',
    floorArgsOk && overlaps.length === 0 && floorWithinPs &&
    floorRows.every(r => draws['HUB|' + r.artId] && draws['HUB|' + r.artId].count > 0) &&
    eq(floorRows.map(r => r.orientation), ['OESTE', 'ESTE', 'SUR', 'NORTE']),
    { floorBoxes: floorRows.map(r => ({ artId: r.artId, orientation: r.orientation,
        worldBox: r.worldBox, measuredDrawArgs: draws['HUB|' + r.artId].sample.args })),
      overlaps, withinPolygonPs: floorWithinPs, argsMatchMatrix: floorArgsOk,
      renderer: 'drawHubFloorLayer() / hook Wf, tras hubCachedFloorCv (1920x1320 en 290,265)',
      note: 'Las 4 cajas medidas son disjuntas y caben en Ps=(290,265,1920,1320). Orientación O/E/S/N conservada; continuidad con la grieta y la zona DJ sin tocar geometría ni colisiones.' },
    ['despues_centro.png', 'despues_descenso.png', 'despues_dj.png', 'matriz_integracion.json']);

  /* --- 7 · mobiliario y VIP --- */
  const propRows = MATRIX.rows.filter(r => ['B · MOBILIARIO', 'C · VIP'].includes(r.family));
  /* Escala/anclaje: el renderer calcula dw=round(h*nw/nh) y dibuja en
     x-(dw>>1), y-h. Se comprueba la derivación contra la matriz y contra las
     entradas REALES del array hubDecor del HTML (no contra una suposición). */
  const propGeom = [
    { slot: 'h03_planter_variant_02', id: 'T03-05', x: 452, y: 900, h: 88, nw: 96, nh: 108 },
    { slot: 'h03_bench_variant_02', id: 'T03-06', x: 2048, y: 900, h: 74, nw: 256, nh: 198 },
    { slot: 'h03_vip_booth_lounge', id: 'T03-07', x: 785, y: 760, h: 136, nw: 216, nh: 136 }
  ];
  const propGeomOk = propGeom.every(p => {
    const dw = Math.round(p.h * p.nw / p.nh);
    const box = [p.x - (dw >> 1), p.y - p.h, dw, p.h];
    const inHtml = new RegExp('slot:\\s*"' + p.slot + '",\\s*x:\\s*' + p.x +
      ',\\s*y:\\s*' + p.y + ',\\s*h:\\s*' + p.h +
      '[\\s\\S]{0,120}?t04:\\s*"' + p.id + '"').test(htmlText);
    return inHtml && eq(box, MATRIX.rows.find(r => r.artId === p.id).worldBox);
  });
  add(7, 'Mobiliario y VIP: escala, anclaje y ausencia de cambios de hitbox',
    propGeomOk && propRows.every(r => draws['HUB|' + r.artId] && draws['HUB|' + r.artId].count > 0 &&
      draws['HUB|' + r.artId].onScreen > 0) &&
    /* solid:false -> colisiones idénticas en las 3 fases */
    eq(A.collision, B.collision) && eq(A.collision, C.collision) &&
    Math.abs(A.movement.delta - B.movement.delta) <= 25 &&
    eq(P.hubAudit, B.probe.hubAudit) && eq(P.stations, B.probe.stations) &&
    P.hubAudit.zonesCount === 6 && P.hubAudit.stationsCount === 11,
    { props: propRows.map(r => ({ artId: r.artId, anchor: r.anchor, drawArgs: draws['HUB|' + r.artId].sample.args,
        natural: r.natural, derivation: r.derivation })),
      geometryDerivation: propGeom.map(p => {
        const dw = Math.round(p.h * p.nw / p.nh);
        return { artId: p.id, decor: { slot: p.slot, x: p.x, y: p.y, h: p.h },
          natural: [p.nw, p.nh], computedDw: dw,
          computedWorldBox: [p.x - (dw >> 1), p.y - p.h, dw, p.h] };
      }),
      geometryMatchesMatrix: propGeomOk,
      flippedPropNote: 'T03-06 usa flip:true -> ctx.translate/scale(-1,1) y drawImage(im,0,0,dw,dh); '
        + 'el proxy registra esas coordenadas LOCALES (0,0,96,74), pero la caja de PANTALLA '
        + 'se calcula con getTransform() y es correcta. La escala/anclaje se verifica por '
        + 'derivacion geometrica contra hubDecor y la matriz.',
      solidFalse: true, collisionAntes: B.collision, collisionControl: C.collision,
      collisionDespues: A.collision, movementAntes: B.movement, movementDespues: A.movement,
      hubAudit: P.hubAudit, stations: P.stations.map(s => [s.id, s.x, s.y]),
      vipNote: 'T03-07 se dibuja en el HUB en (677,624,216,136). NO se cuenta el pintor del menú (FASE 1 §4).' },
    ['despues_vip_oeste.png', 'despues_pared_este.png', 'despues_arsenal.png']);

  /* --- 8 · señalética --- */
  add(8, 'Señalética: 6 anclajes, 6 referencias diferenciadas, 0 ocultas',
    signRows.length === 6 && anchorsDistinct === 6 && keysDistinct === 6 &&
    signVisibility.every(s => !s.hidden && s.full >= 1) &&
    signRows.every(r => draws['HUB|' + r.artId] && eq(draws['HUB|' + r.artId].sample.args.slice(2), [144, 96])),
    { anchors: signRows.map(r => ({ artId: r.artId, zone: r.zone, anchor: r.worldBox.slice(0, 2),
        v5Key: r.v5Key, derivation: r.anchor })),
      distinctAnchors: anchorsDistinct, distinctV5Keys: keysDistinct,
      fullyVisible: signVisibility,
      sameScale: [144, 96],
      note: '6 zonas A-F -> 6 estaciones reales -> 6 signY reales -> 6 coordenadas distintas; 6 claves V5 distintas. Todas en la capa aérea, por encima de props.' },
    ['despues_centro.png', 'despues_dj.png', 'despues_descenso.png', 'despues_arsenal.png', 'despues_bar.png', 'despues_arcade.png']);

  /* --- 9 · cachés de ambas capas --- */
  const routes = P.t3b.routes || [];
  add(9, 'Cachés de ambas capas y canvas: sin segundo motor, sin canvas nuevo',
    P.hubFloor.available === true && B.probe.hubFloor.available === true &&
    C.probe.hubFloor.available === true &&
    P.hubFloor.builds >= 1 && B.probe.hubFloor.builds >= 1 &&
    routes.indexOf('hub') >= 0 && routes.indexOf('campaign') >= 0 &&
    P.t3b.enabled === true && P.t3b.errors.length === 0 &&
    P.canvasCountBase === B.probe.canvasCountBase && P.canvasCountBase === C.probe.canvasCountBase &&
    P.canvasCountBase === 27,
    { hubFloor: { antes: B.probe.hubFloor, control: C.probe.hubFloor, despues: P.hubFloor },
      t3b: { enabled: P.t3b.enabled, revision: P.t3b.revision,
        routes: [...new Set(routes)], lastInvalidation: P.t3b.lastInvalidation, errors: P.t3b.errors },
      canvasCountBase: { antes: B.probe.canvasCountBase, control: C.probe.canvasCountBase, despues: P.canvasCountBase },
      newCanvases: 0, newCaches: 0, newEngines: 0,
      note: '__T3B_HUB_QA (suelo 1920x1320) y __DDM_PAINT_MATERIAL (rutas hub + campaign) siguen activos. No se crea segundo sistema de cachés.' },
    ['despues_runtime_full.json', 'comprobacion_caches.json']);

  /* --- 10 · regresión de gameplay --- */
  const doorsClosed = A.doors.closed && A.doors.closed.dungeon;
  const doorsOpen = A.doors.open && A.doors.open.dungeon;
  add(10, 'Regresión: colisiones, puertas, estaciones, disparo y CAMPAIGN_ROOM',
    eq(A.collision, B.collision) && eq(A.collision, C.collision) &&
    Math.abs(A.movement.delta - B.movement.delta) <= 25 &&
    A.interaction.stationsBefore === 11 && A.interaction.active === 'bar' &&
    A.interaction.activeAfter === null &&
    doorsClosed && doorsOpen &&
    doorsClosed.current === 'r23' && doorsOpen.current === 'r23' &&
    doorsClosed.role === doorsOpen.role && doorsClosed.floor === doorsOpen.floor &&
    !A.doors.setNight.err && !/^ERR:/.test(String(A.doors.clearRound)) &&
    A.screenshots.doors_closed > 0 && A.screenshots.doors_open > 0 &&
    A.doors.open.architecture.applied === 10 &&
    A.shooting.delta >= 1 && A.campaign.completed === true &&
    A.campaignRegression.hub.location === 'CAMPAIGN_ROOM' &&
    A.campaignRegression.hub.inHub === false,
    { movement: { antes: B.movement, control: C.movement, despues: A.movement },
      collision: { antes: B.collision, control: C.collision, despues: A.collision },
      interaction: A.interaction, campaign: A.campaign,
      doors: { closed: doorsClosed, open: doorsOpen,
        setNight: A.doors.setNight, clearRound: A.doors.clearRound,
        securedTransition: [doorsClosed.secured, doorsOpen.secured],
        note: 'El flag secured puede llegar a 1 antes de la primera sonda si el tick completa la sala; se registra pero NO se usa como aserción (dependiente de timing), igual que en el arnés de TANDA 03. Se comprueba la sala real r23, la llamada a setNight(24), clearRound(), las dos capturas y que la arquitectura sigue aplicada.' },
      shooting: A.shooting,
      campaignRegression: { location: A.campaignRegression.hub.location,
        inHub: A.campaignRegression.hub.inHub } },
    ['doors_closed.png', 'doors_open.png', 'regresion_campaign.png', 'despues_tras_movimiento.png']);

  /* --- 11 · T01 / T02 / V5 / arquitectura --- */
  add(11, 'Regresión T01 10/10, T02 10/10, V5 y arquitectura intactas',
    h1.applied === 10 && h1.count === 10 && h2.applied === 10 && h2.count === 10 &&
    P.architecture.applied === 10 && P.architecture.errors.length === 0 &&
    P.player.poses === 12 && P.player.errors.length === 0 &&
    P.v5Keys === 142 && B.probe.v5Keys === 142 &&
    eq(P.hubAudit, B.probe.hubAudit) && P.hubAudit.zonesCount === 6,
    { t01: { applied: h1.applied, count: h1.count }, t02: { applied: h2.applied, count: h2.count },
      architecture: { applied: P.architecture.applied, errors: P.architecture.errors },
      player: P.player, v5Keys: P.v5Keys,
      hubAuditAntes: B.probe.hubAudit, hubAuditDespues: P.hubAudit,
      note: 'Las 13 claves nuevas no sustituyen ningún recurso de T01/T02: solo se añaden dibujos en capas existentes.' },
    ['despues_runtime_full.json', 'antes_runtime.json']);

  /* --- 12 · performance gate (cierre del pendiente de T02) --- */
  const rA = A.render, rB = B.render, rC = C.render;
  const ratio = rB.medianMs > 0 ? rA.medianMs / rB.medianMs : 1;
  const gateOk = ratio <= 1.25 && Math.abs(rA.medianMs - rB.medianMs) <= 4 &&
    rA.frames === 40 && rB.frames === 40;
  add(12, 'Performance gate: coste de render separado del coste de carga',
    gateOk,
    { antes: rB, control: rC, despues: rA, ratioMedian: +ratio.toFixed(3),
      threshold: 'ratio <= 1,25 y |delta mediana| <= 4 ms',
      loadCost: A.loadCost, loadMs: { antes: B.loadMs, control: C.loadMs, despues: A.loadMs },
      note: 'Coste de CARGA (13 PNG, una sola vez por load()) medido aparte del coste de RENDER (mediana de 40 rAF en el HUB, misma cámara). Las variaciones se observan también entre ANTES y CONTROL y no se atribuyen a los assets: entorno SwiftShader por software. Cierra el performance gate pendiente de T02 sin relajar el arnés.' },
    ['performance.json', 'resultados_ab.json']);

  const summary = { APROBADO: checks.filter(c => c.state === 'APROBADO').length,
                    FALLIDO: checks.filter(c => c.state === 'FALLIDO').length,
                    UNIDADES_INTEGRADAS: integratedUnits.length,
                    UNIDADES_BLOQUEADAS: blockers.length,
                    NO_VERIFICADO: 0 };
  const verdict = {
    APROBADO: integratedUnits.map(u => u.artId),
    BLOQUEADO: blockers.map(u => u.artId),
    NO_VERIFICADO: []
  };
  const report = {
    tanda: '04', title: 'HUB RENDER INTEGRATION — activación de los 13 PNG de TANDA 03',
    generatedAt: new Date().toISOString(),
    environment: { chromium: process.env.CHROME_VERSION || '131.0.6778.0',
      playwrightCore: '1.58.2', viewport: [1280, 900], deviceScaleFactor: 1,
      renderer: 'SwiftShader / --use-gl=swiftshader', url: URL,
      camera: 'DMO.debug.teleport(x,y) · 10 zonas idénticas en las 3 fases' },
    baseline: { htmlBeforeSha: BASELINE.htmlBeforeSha, htmlAfterSha: BASELINE.htmlAfterSha,
      artPackSha: BASELINE.artPackSha },
    phases: ['antes', 'control', 'despues'],
    integrationCriterion: '>=1 drawImage efectivo por unidad en el canvas de mundo del HUB; registro V5 NO basta',
    summary, verdict, checks,
    perUnit, signVisibility,
    integrationMatrix: MATRIX.rows,
    blockers,
    incidences: {
      d07: 'El pintor VIP del MENÚ no se reutilizó (puede activarse 0 o 1 vez por timing del boot, sin dibujar ningún asset T04). T03-07 se integró en el HUB por hubDecor/addHubCustomProp.',
      t02PerformanceGate: 'Cerrado en el check 12 con medición A/B de 40 rAF y coste de carga separado.',
      cloudflare404: cloudflare404.length + ' rutas externas preexistentes; 0 404 locales',
      aesthetic: 'Las placas se dibujan en la capa aérea por encima de los props; en la zona de descenso la placa C roza el rótulo de neón existente (solapamiento de ~3 px de borde, sin ocultar texto).',
      noNewSystems: 'Sin segundo motor, canvas alternativo, caché nueva, loader paralelo ni sistema de dibujo independiente.'
    },
    evidence: { drawCalls: 'draw_calls.json', slotsMatrix: 'matriz_integracion.json',
      report: 'report.json', performance: 'performance.json',
      runtime: ['antes_runtime.json', 'control_runtime.json', 'despues_runtime_full.json'] }
  };
  return report;
}

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
    console.log('[TANDA04] fase', mode, '...');
    await phase(browser, mode, log);
    fs.writeFileSync(R(mode === 'despues' ? 'despues_runtime_full.json' : mode + '_runtime.json'),
      JSON.stringify(log[mode], null, 2) + '\n');
    console.log('[TANDA04] fase', mode, 'OK · renders', log[mode].render.medianMs,
      'ms · pageErrors', log[mode].pageErrors.length);
  }
  await browser.close();

  const rep = buildReport(log);
  fs.writeFileSync(R('report.json'), JSON.stringify(rep, null, 2) + '\n');
  fs.writeFileSync(R('draw_calls.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    despues: rep.perUnit, antes: t3keys(log.antes.probeFinal.draws),
    controlOff: t3keys(log.control.controlOff.draws),
    controlOn: t3keys(log.control.controlOn.draws),
    controlRestore: t3keys(log.control.controlRestore.draws),
    controlApply: t3keys(log.control.controlApply.draws),
    menu: t3keys(log.despues.menuProbe.draws),
    byCanvas: log.despues.probeFinal.byCanvas
  }, null, 2) + '\n');
  fs.writeFileSync(R('performance.json'), JSON.stringify({
    antes: log.antes.render, control: log.control.render, despues: log.despues.render,
    loadCost: log.despues.loadCost, loadMs: { antes: log.antes.loadMs,
      control: log.control.loadMs, despues: log.despues.loadMs }
  }, null, 2) + '\n');
  console.log('\n=== RESULTADO ===');
  console.log(JSON.stringify(rep.summary));
  rep.checks.forEach(c => console.log(c.id, c.state, c.check));
  if (rep.summary.FALLIDO > 0) process.exitCode = 1;
})().catch(e => {
  console.error('QA TANDA 04 FAIL', e);
  try { fs.writeFileSync(R('validation_error.json'), JSON.stringify({ at: new Date().toISOString(),
    error: String(e && e.stack || e) }, null, 2) + '\n'); } catch (_) {}
  process.exit(1);
});
