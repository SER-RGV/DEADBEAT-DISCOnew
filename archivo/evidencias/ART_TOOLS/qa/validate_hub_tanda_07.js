/* DEADBEAT DISCO · HUB · TANDA 07 — QA de integración (Fase 5)
 * Ejecuta contra el preview en http://127.0.0.1:8123/ (server :8123).
 * Requiere /tmp/qatools/node_modules/playwright-core y Chromium 131 en /tmp/chromium
 * (igual que los 6 arneses hub_tanda_07_audit_*.js de Fase 0).
 *
 * NO modifica el juego: sólo llama a APIs públicas de QA (teleport,
 * replayArrival, startCampaignFromHub) y al flag A/B __DDM_HUB_T07.
 * Salida: ART_EVIDENCE/hub/tanda_07/qa_tanda07.json + capturas t07_qa_*.jpg
 */
const { chromium } = require('/tmp/qatools/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');

const URL = 'http://127.0.0.1:8123/';
const OUT = path.resolve(__dirname, '../../ART_EVIDENCE/hub/tanda_07');
fs.mkdirSync(OUT, { recursive: true });

const checks = [];
const evidence = {};
function ck(id, name, ok, detail) {
  checks.push({ id, name, ok: !!ok, detail: detail === undefined ? null : detail });
  console.log((ok ? 'OK   ' : 'FAIL ') + id + ' · ' + name +
    (detail === undefined ? '' : ' · ' + JSON.stringify(detail).slice(0, 220)));
}

async function boot(browser, opts) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, opts || {}));
  const page = await ctx.newPage();
  const errs = [], warns = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => {
    if (m.type() === 'error' || m.type() === 'warning') warns.push(m.type() + ': ' + m.text().slice(0, 160));
  });
  await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => {
    try { return ['applied', 'applied-with-errors'].includes(window.DMO_ART_PACK.state().status); }
    catch (e) { return false; }
  }, { timeout: 90000 });
  return { ctx, page, errs, warns };
}

async function intoHub(page) {
  /* Secuencia validada en Fase 0: click + Enter + Escape sostenido. */
  await page.mouse.click(640, 450);
  await page.waitForTimeout(400);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  await page.keyboard.down('Escape');
  await page.waitForTimeout(1400);
  await page.keyboard.up('Escape');
  await page.waitForFunction(() => {
    try { return window.DMO_HUB.state().inHub; } catch (e) { return false; }
  }, { timeout: 30000 });
}

/* Muestra de luminancia media del canvas: demuestra que NUNCA hay
   pantalla negra durante la llegada ni el descenso. */
async function luminance(page) {
  return page.evaluate(() => {
    const cv = document.getElementById('game') || document.querySelector('canvas');
    if (!cv) return -1;
    const cx = cv.getContext('2d');
    const d = cx.getImageData(0, 0, cv.width, cv.height).data;
    let s = 0, n = 0;
    for (let i = 0; i < d.length; i += 4 * 97) { s += (d[i] + d[i + 1] + d[i + 2]) / 3; n++; }
    return +(s / n).toFixed(2);
  });
}

/* Diferencia de píxeles ON/OFF en la franja sur (y 730..880, x 60..1220) */
async function southStrip(page) {
  return page.evaluate(() => {
    const cv = document.getElementById('game') || document.querySelector('canvas');
    const cx = cv.getContext('2d');
    const d = cx.getImageData(60, 730, 1160, 150).data;
    const a = [];
    for (let i = 0; i < d.length; i += 4 * 31) a.push(d[i], d[i + 1], d[i + 2]);
    return a;
  });
}
function stripDiff(a, b) {
  let s = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) s += Math.abs(a[i] - b[i]);
  return +(s / Math.min(a.length, b.length)).toFixed(2);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: '/tmp/chromium', headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: '/tmp/chromelibs/lib:/tmp' },
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
           '--use-gl=swiftshader', '--disable-background-networking']
  });
  const { ctx, page, errs, warns } = await boot(browser);

  /* ---------- 1. BOOT / ASSETS ------------------------------------------ */
  const bootState = await page.evaluate(() => {
    const W = window, P = W.DMO_ART_PACK;
    return {
      status: P.state().status, version: P.state().version,
      hub7: P.hub7(), v5Keys: Object.keys(W.__DDM_V5_IMG || {}).length,
      aliases: Object.keys(W.__DDM_V5_IMG || {}).filter(k => k.startsWith('h07_')),
      resolve: ['h07_labio_acantilado', 'h07_estrato_rococo', 'h07_apertura_profundidad',
                'h07_exterior_infernal', 'h07_pozo_capas', 'h07_panorama_acantilado']
        .map(k => ({ slot: k, ok: typeof W.__DDM_GET_V5 === 'function' && !!W.__DDM_GET_V5(k) })),
      t01: P.hub(), t02: P.hub2(), t03: P.hub3(), t05: P.hub5(), t06: P.hub6(),
      t07api: !!W.DMO_HUB_T07, hooks: W.DMO_HUB_T07 ? W.DMO_HUB_T07.state().hooksInstalled : null,
      canvases: document.querySelectorAll('canvas').length
    };
  });
  evidence.boot = bootState;
  ck('T07-01', 'pack.status = applied', bootState.status === 'applied', bootState.status);
  ck('T07-02', 'versión incluye hub-tanda07',
     /hub-tanda07/.test(bootState.version), bootState.version.slice(-70));
  ck('T07-03', '6/6 assets T07: loaded + exactSize + registered',
     bootState.hub7.loaded === 6 && bootState.hub7.exactSize === 6 &&
     bootState.hub7.registered === 6 && bootState.hub7.errors.length === 0,
     { loaded: bootState.hub7.loaded, exactSize: bootState.hub7.exactSize,
       registered: bootState.hub7.registered, errors: bootState.hub7.errors });
  ck('T07-04', '6 alias h07_* resuelven por __DDM_GET_V5',
     bootState.resolve.every(r => r.ok) && bootState.aliases.length === 6,
     bootState.aliases);
  ck('T07-05', 'registro V5 base 162 + 6 T07 = 168 sin bajas',
     bootState.v5Keys === 168, bootState.v5Keys);
  ck('T07-06', 'API DMO_HUB_T07 expuesta en arranque',
     bootState.t07api === true, { api: bootState.t07api,
       hooksAtBoot: bootState.hooks, note: 'los enganches se montan al entrar al HUB (buildHubSpace)' });
  const noNewCanvas = bootState.canvases === 27;
  ck('T07-07', 'sin canvas nuevo (27 de Fase 0)', noNewCanvas, bootState.canvases);
  const legacy = ['t01', 't02', 't03', 't05', 't06'].map(k => ({
    k, loaded: bootState[k].loaded, errors: (bootState[k].errors || []).length
  }));
  ck('T07-08', 'TANDA 01/02/03/05/06 siguen cargadas y sin errores',
     legacy.every(x => x.errors === 0), legacy);

  /* ---------- 2. ARRANQUE + LLEGADA AUTOMÁTICA -------------------------- */
  await intoHub(page);
  const hooksNow = await page.evaluate(() => window.DMO_HUB_T07.state().hooksInstalled);
  ck('T07-06B', 'enganches Wf/Ph/zf/Tf instalados al arrancar el HUB',
     hooksNow === true, { hooksInstalled: hooksNow });
  const arrivalPoll = [];
  for (let i = 0; i < 26; i++) {
    arrivalPoll.push(await page.evaluate(() => {
      const t = window.DMO_HUB_T07.state(), h = window.DMO_HUB.state();
      return { i: -1, act: t.arrival.active, t: +t.arrival.t.toFixed(2),
               plays: t.arrival.plays, scr: t.counts.screen,
               lock: h.transitionLock, mode: h.mode, modal: h.modalOpen,
               loc: h.location, seq: window.DMO_MUSIC.state().sequencers };
    }));
    if (i === 2) await page.screenshot({ path: path.join(OUT, 't07_qa_01_llegada_auto.jpg'), type: 'jpeg', quality: 85 });
    await page.waitForTimeout(100);
  }
  const lumArrival = [];
  for (let i = 0; i < 3; i++) { lumArrival.push(await luminance(page)); await page.waitForTimeout(100); }
  const autoArr = await page.evaluate(() => ({
    a: window.DMO_HUB_T07.state().arrival, c: window.DMO_HUB_T07.state().counts,
    h: window.DMO_HUB.state(), mu: window.DMO_MUSIC.state(), cam: window.DMO.camera(),
    audit: window.DMO_HUB.audit()
  }));
  evidence.autoArrival = { poll: arrivalPoll, state: autoArr, lum: lumArrival };
  ck('T07-09', 'llegada automática al entrar al HUB (reason hub-entry)',
     autoArr.a.plays >= 1 && autoArr.a.reason === 'hub-entry' && autoArr.a.completes >= 1,
     { plays: autoArr.a.plays, completes: autoArr.a.completes, reason: autoArr.a.reason });
  ck('T07-10', 'llegada breve ≤ 2,4 s',
     autoArr.a.dur <= 2.4, autoArr.a.dur);
  ck('T07-11', 'control NO bloqueado durante la llegada',
     arrivalPoll.filter(x => x.act).every(x => x.lock === false && x.mode === 'EXPLORATION' && x.modal === false),
     { activeFrames: arrivalPoll.filter(x => x.act).length,
       anyLock: arrivalPoll.some(x => x.act && x.lock),
       modes: [...new Set(arrivalPoll.filter(x => x.act).map(x => x.mode))] });
  ck('T07-12', 'capa de pantalla dibujada y sin fotograma negro',
     arrivalPoll.some(x => x.scr > 0) && Math.min(...lumArrival) > 12,
     { screen: autoArr.c.screen, lum: lumArrival });
  ck('T07-13', 'audio intacto durante la llegada (1 secuenciador, HUB)',
     autoArr.mu.sequencers === 1 && autoArr.mu.state === 'HUB' &&
     autoArr.mu.key === 'hub_afterparty' && autoArr.mu.errors.length === 0,
     { seq: autoArr.mu.sequencers, state: autoArr.mu.state, key: autoArr.mu.key });
  ck('T07-14', 'cámara y topología sin cambios (zoom .9375, 6 zonas, 11 estaciones)',
     Math.abs(autoArr.cam.zoom - 0.9375) < 1e-6 && autoArr.audit.zonesCount === 6 &&
     autoArr.audit.stationsCount === 11,
     { zoom: autoArr.cam.zoom, zones: autoArr.audit.zonesCount, stations: autoArr.audit.stationsCount });

  /* ---------- 3. FASE 3 · NPC ------------------------------------------- */
  const npcSamples = [];
  for (let i = 0; i < 32; i++) {
    npcSamples.push(await page.evaluate(() => window.DMO_HUB_T07.actors()
      .map(a => ({ id: a.id, act: a.act, f: a.lastFrame, x: a.lastX, flip: a.lastFlip, r: a.lastReact }))));
    await page.waitForTimeout(110);
  }
  const byId = id => npcSamples.map(s => s.find(a => a.id === id)).filter(Boolean);
  const frames = id => [...new Set(byId(id).map(a => a.f))];
  const xs = id => [...new Set(byId(id).map(a => a.x))];
  const acts = await page.evaluate(() => window.DMO_HUB_T07.audit().activities);
  await page.evaluate(() => window.DMO.debug.teleport(1150, 950));
  await page.waitForTimeout(350);
  const react = await page.evaluate(() => window.DMO_HUB_T07.actors()
    .filter(a => a.lastReact > 0).map(a => ({ id: a.id, r: a.lastReact })));
  await page.screenshot({ path: path.join(OUT, 't07_qa_02_npc_centro.jpg'), type: 'jpeg', quality: 85 });
  evidence.npc = { samples: npcSamples, activities: acts, react,
                   danceFrames: frames('t07_danza_01'), walkFrames: frames('t07_recorrido'),
                   walkX: xs('t07_recorrido') };
  ck('T07-15', '6 actores con 5 actividades (danza×2, charla×2, descanso, recorrido)',
     acts.dance === 2 && acts.talk === 2 && acts.rest === 1 && acts.walk === 1, acts);
  ck('T07-16', 'frames NPC alternan (danza y recorrido ≥2 frames)',
     frames('t07_danza_01').length >= 2 && frames('t07_recorrido').length >= 2,
     { dance: frames('t07_danza_01'), walk: frames('t07_recorrido') });
  ck('T07-17', 'recorrido cambia de posición y de orientación',
     xs('t07_recorrido').length >= 4 &&
     new Set(byId('t07_recorrido').map(a => a.flip)).size >= 2 &&
     (Math.max(...xs('t07_recorrido')) - Math.min(...xs('t07_recorrido'))) >= 20,
     { distinctX: xs('t07_recorrido').length, span: Math.max(...xs('t07_recorrido')) - Math.min(...xs('t07_recorrido')) });
  ck('T07-18', 'reacción al jugador sin IA (react>0 cerca, 0 lejos)',
     react.some(r => r.id === 't07_danza_01') && !react.some(r => r.id === 't07_descanso'), react);
  /* solid:false → el jugador atraviesa la posición del actor; WASD intacto */
  const camPos = () => page.evaluate(() => ({ x: window.DMO.camera().x, y: window.DMO.camera().y }));
  const beforeMove = await camPos();
  await page.keyboard.down('d'); await page.waitForTimeout(900); await page.keyboard.up('d');
  await page.waitForTimeout(150);
  const afterMove = await camPos();
  const movedX = +(afterMove.x - beforeMove.x).toFixed(2);
  evidence.movement = { before: beforeMove, after: afterMove, movedX };
  ck('T07-19', 'props solid:false y WASD sin regresión (derecha mueve cámara)',
     movedX > 5, { movedX, before: beforeMove, after: afterMove });

  /* ---------- 4. A/B ---------------------------------------------------- */
  await page.evaluate(() => window.DMO.debug.teleport(1250, 1290));
  await page.waitForTimeout(500);
  await page.evaluate(() => { window.__DDM_HUB_T07 = true; });
  await page.waitForTimeout(350);
  const cOn0 = await page.evaluate(() => window.DMO_HUB_T07.state().counts.geography);
  const stripON = await southStrip(page);
  await page.screenshot({ path: path.join(OUT, 't07_qa_03_AB_ON_sur.jpg'), type: 'jpeg', quality: 85 });
  await page.waitForTimeout(400);
  const cOn1 = await page.evaluate(() => window.DMO_HUB_T07.state().counts.geography);
  await page.evaluate(() => { window.__DDM_HUB_T07 = false; });
  await page.waitForTimeout(350);
  const cOff0 = await page.evaluate(() => window.DMO_HUB_T07.state().counts.geography);
  const stripOFF = await southStrip(page);
  await page.screenshot({ path: path.join(OUT, 't07_qa_04_AB_OFF_sur.jpg'), type: 'jpeg', quality: 85 });
  await page.waitForTimeout(400);
  const cOff1 = await page.evaluate(() => window.DMO_HUB_T07.state().counts.geography);
  const diff = stripDiff(stripON, stripOFF);
  await page.evaluate(() => { window.__DDM_HUB_T07 = true; });
  evidence.ab = { onDelta: cOn1 - cOn0, offDelta: cOff1 - cOff0, stripDiff: diff };
  ck('T07-20', 'flag A/B: ON dibuja geografía, OFF no dibuja',
     (cOn1 - cOn0) > 5 && (cOff1 - cOff0) === 0, evidence.ab);
  ck('T07-21', 'A/B cambia la franja sur de forma medible y localizada',
     diff > 3, diff);
  const hubAfterAB = await page.evaluate(() => ({ a: window.DMO_HUB.audit(), m: window.DMO_MUSIC.state() }));
  ck('T07-22', 'A/B no rompe estaciones ni audio',
     hubAfterAB.a.stationsCount === 11 && hubAfterAB.m.sequencers === 1, hubAfterAB);

  /* ---------- 5. LLEGADA REPETIBLE -------------------------------------- */
  const p0 = await page.evaluate(() => window.DMO_HUB_T07.state().arrival.plays);
  for (let n = 0; n < 2; n++) {
    await page.evaluate(() => window.DMO_HUB_T07.replayArrival());
    if (n === 0) {
      await page.waitForTimeout(120);
      await page.screenshot({ path: path.join(OUT, 't07_qa_05_llegada_t0.jpg'), type: 'jpeg', quality: 85 });
      await page.waitForTimeout(780);
      await page.screenshot({ path: path.join(OUT, 't07_qa_06_llegada_mid.jpg'), type: 'jpeg', quality: 85 });
    }
    await page.waitForTimeout(2300);
  }
  const replay = await page.evaluate(() => ({ a: window.DMO_HUB_T07.state().arrival,
                                              h: window.DMO_HUB.state() }));
  ck('T07-23', 'llegada repetible ×2 y sin bloqueo residual',
     replay.a.plays === p0 + 2 && replay.a.completes === replay.a.plays &&
     replay.h.transitionLock === false && replay.h.mode === 'EXPLORATION',
     { plays: replay.a.plays, completes: replay.a.completes, lock: replay.h.transitionLock });

  /* ---------- 6. FASE 4 · DESCENSO -------------------------------------- */
  const started = await page.evaluate(() => {
    try { return window.DMO_HUB.startCampaignFromHub(0); } catch (e) { return 'ERR ' + e; }
  });
  const descent = [], lum = [];
  const shotAt = new Set([2, 6, 10, 14, 18]);
  for (let i = 0; i < 24; i++) {
    const s = await page.evaluate(() => {
      const W = window, T = W.DMO_HUB_T07.state();
      return {
        d: T.descent, scr: T.counts.descentScreen,
        f: W.DMO_FLOOR_ANIM.state(), h: W.DMO_HUB.state(),
        m: W.DMO_MUSIC.state(), cam: W.DMO.camera()
      };
    });
    const L = await luminance(page); lum.push(L);
    descent.push({ i, act: s.d.active, frames: s.d.frames, comp: s.d.completions,
                   scr: s.scr, phase: s.f.phase, stage: s.f.stage, stairP: s.f.stairP,
                   shaftOpen: s.f.shaftOpen, loc: s.h.location, lock: s.h.transitionLock,
                   mstate: s.m.state, seq: s.m.sequencers, zoom: s.cam.zoom, lum: L });
    if (shotAt.has(i)) await page.screenshot({ path: path.join(OUT, 't07_qa_07_descenso_' + i + '.jpg'), type: 'jpeg', quality: 84 });
    await page.waitForTimeout(160);
  }
  const end = await page.evaluate(() => ({
    t: window.DMO_HUB_T07.state(), h: window.DMO_HUB.state(),
    m: window.DMO_MUSIC.state(), ev: window.DMO_MUSIC.events().slice(-16),
    cam: window.DMO.camera(),
    dungeon: window.DMO_DUNGEON ? window.DMO_DUNGEON.audit() : null
  }));
  evidence.descent = { started, samples: descent, lum, end };
  const t7samples = end.t.descent.samples;
  ck('T07-24', 'startCampaignFromHub(0) verdadero y descenso monitorizado',
     started === true && end.t.descent.frames > 40 && end.t.descent.completions >= 1,
     { started, frames: end.t.descent.frames, completions: end.t.descent.completions });
  ck('T07-25', 'progresión real de escalera/pozo (stairP>0.1 y fase skyfall)',
     t7samples.some(s => s.stairP > 0.1) && t7samples.some(s => s.phase === 'skyfall'),
     { maxStairP: Math.max(...t7samples.map(s => s.stairP)),
       phases: [...new Set(t7samples.map(s => s.phase))],
       stages: [...new Set(t7samples.map(s => s.stage))] });
  ck('T07-26', 'continuidad visual del pozo dibujada en gran parte del descenso',
     end.t.counts.descentScreen > 20, end.t.counts.descentScreen);
  ck('T07-27', 'NINGÚN fotograma negro durante el descenso',
     Math.min(...lum) > 12, { min: Math.min(...lum), max: Math.max(...lum) });
  ck('T07-28', 'audio de descenso existente intacto (1 secuenciador, eventos)',
     end.m.sequencers === 1 && end.ev.some(e => e.kind === 'stairs') &&
     end.ev.some(e => e.detail && e.detail.includes('HUB → DESCENT')),
     { seq: end.m.sequencers, events: end.ev.map(e => e.kind + ':' + e.detail).slice(-8) });
  ck('T07-29', 'destino LIMBO, control recuperado y zoom restaurado',
     end.h.location === 'CAMPAIGN_ROOM' && end.h.mode === 'EXPLORATION' &&
     end.h.transitionLock === false && Math.abs(end.cam.zoom - 0.9375) < 1e-6 &&
     end.dungeon && end.dungeon.ok === true,
     { loc: end.h.location, mode: end.h.mode, lock: end.h.transitionLock,
       zoom: end.cam.zoom, dungeonOk: end.dungeon && end.dungeon.ok });

  /* ---------- 7. REGRESO AL HUB (repetibilidad de llegada) -------------- */
  let returnOk = null;
  try {
    returnOk = await page.evaluate(() => {
      const H = window.DMO_HUB;
      if (typeof H.debugSpawnBeacon === 'function') H.debugSpawnBeacon();
      return typeof H.returnToHubFromMilestone === 'function' ? H.returnToHubFromMilestone() : 'noapi';
    });
  } catch (e) { returnOk = 'ERR ' + e; }
  try {
    await page.waitForFunction(() => {
      try { return window.DMO_HUB.state().inHub === true; } catch (e) { return false; }
    }, { timeout: 12000 });
  } catch (e) { /* se registra el estado real más abajo */ }
  await page.waitForTimeout(2200);
  const back = await page.evaluate(() => ({ t: window.DMO_HUB_T07.state(),
                                            h: window.DMO_HUB.state() }));
  evidence.returnToHub = { result: returnOk, state: back };
  ck('T07-30', 'regreso al HUB dispara de nuevo la llegada (repetible)',
     returnOk === true && back.h.inHub === true && back.t.arrival.plays > replay.a.plays,
     { result: returnOk, inHub: back.h.inHub, plays: back.t.arrival.plays,
       reason: back.t.arrival.reason });

  /* ---------- 8. SIN ERRORES / REGRESIÓN FINAL -------------------------- */
  const finalPack = await page.evaluate(() => ({
    h7: window.DMO_ART_PACK.hub7(), st: window.DMO_ART_PACK.state(),
    v5: Object.keys(window.__DDM_V5_IMG || {}).length,
    t07: window.DMO_HUB_T07.audit()
  }));
  evidence.final = { pack: finalPack, errors: errs, warns };
  ck('T07-31', '0 pageerror y 0 errores T07 en toda la sesión',
     errs.length === 0 && finalPack.t07.errors.length === 0 &&
     finalPack.h7.errors.length === 0,
     { pageerrors: errs, t07: finalPack.t07.errors, hub7: finalPack.h7.errors });
  ck('T07-32', 'estado final: applied, 168 V5, 6/6 T07, 6 actores',
     finalPack.st.status === 'applied' && finalPack.v5 === 168 &&
     finalPack.h7.registered === 6 && finalPack.t07.actors === 6,
     { status: finalPack.st.status, v5: finalPack.v5,
       registered: finalPack.h7.registered, actors: finalPack.t07.actors });
  const external404 = warns.filter(w => /404/.test(w)).length;
  evidence.external404 = external404;
  ck('T07-33', 'sólo los 2 404 externos preexistentes de Fase 0',
     external404 <= 2, { warns: warns.slice(0, 6), count404: external404 });
  await ctx.close();

  /* ---------- 9. MOVIMIENTO REDUCIDO ------------------------------------ */
  const r = await boot(browser, { reducedMotion: 'reduce' });
  await intoHub(r.page);
  await r.page.waitForTimeout(2600);
  const reducedState = await r.page.evaluate(() => ({
    t: window.DMO_HUB_T07.state(), actors: window.DMO_HUB_T07.actors(),
    errs: window.DMO_HUB_T07.audit().errors
  }));
  const frozenA = reducedState.actors.map(a => ({ id: a.id, f: a.lastFrame, x: a.lastX, r: a.lastReact }));
  await r.page.waitForTimeout(700);
  const frozenB = await r.page.evaluate(() => window.DMO_HUB_T07.actors()
    .map(a => ({ id: a.id, f: a.lastFrame, x: a.lastX, r: a.lastReact })));
  evidence.reduced = { dur: reducedState.t.arrival.dur, a: frozenA, b: frozenB,
                       errors: reducedState.errs, pageerrors: r.errs };
  ck('T07-34', 'Yc.reduced: llegada corta (0,95 s) y NPC congelados',
     reducedState.t.arrival.dur === 0.95 &&
     frozenA.every((a, i) => a.f === 0 && a.x === frozenB[i].x && a.r === 0) &&
     r.errs.length === 0,
     { dur: reducedState.t.arrival.dur, allFrame0: frozenA.every(a => a.f === 0),
       staticX: frozenA.every((a, i) => a.x === frozenB[i].x),
       reacts: frozenA.every(a => a.r === 0) });
  await r.ctx.close();

  await browser.close();
  const ok = checks.filter(c => c.ok).length;
  const report = {
    generatedAt: new Date().toISOString(),
    suite: 'TANDA 07 · El umbral del infierno · QA Fase 5',
    total: checks.length, passed: ok, failed: checks.length - ok,
    verdict: ok === checks.length ? 'APROBADO' : 'REVISAR',
    checks, evidence, environment: {
      url: URL, viewport: '1280x900', chromium: '/tmp/chromium',
      note: 'Headless. Vídeo, mando físico y audio audible siguen BLOQUEADO / NO VERIFICADO (Fase 0).'
    }
  };
  fs.writeFileSync(path.join(OUT, 'qa_tanda07.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('\n===== ' + ok + '/' + checks.length + ' · ' + report.verdict + ' =====');
  process.exit(ok === checks.length ? 0 : 1);
})().catch(e => { console.error('QA FATAL', e); process.exit(2); });
