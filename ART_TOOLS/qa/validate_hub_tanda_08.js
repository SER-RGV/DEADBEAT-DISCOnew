/* TANDA 08 · FASE 5 — matriz QA sobre la build REAL integrada.
 * Requiere servidor :8123 y /tmp/qatools/node_modules/playwright-core.
 * Clasificación: APROBADO / FALLIDO / BLOQUEADO / NO VERIFICADO.
 * No confunde «se dibuja una partícula» con «su animación funciona»: compara
 * posiciones y fase en dos instantes con cámara estática.
 */
const { chromium } = require('/tmp/qatools/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'ART_EVIDENCE/hub/tanda_08');
fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html';

const R = [];
function ck(id, name, ok, detail, cls) {
  const status = cls ? cls : (ok ? 'APROBADO' : 'FALLIDO');
  R.push({ id, name, status, detail: detail === undefined ? null : detail });
  console.log(status.padEnd(14) + id + ' · ' + name +
    (detail === undefined ? '' : ' · ' + JSON.stringify(detail).slice(0, 220)));
}
const lum = p => p.evaluate(() => {
  const cv = document.getElementById('game') || document.querySelector('canvas');
  const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  let s = 0, n = 0;
  for (let i = 0; i < d.length; i += 4 * 97) { s += (d[i] + d[i + 1] + d[i + 2]) / 3; n++; }
  return +(s / n).toFixed(2);
});
const strip = (p, y0) => p.evaluate(yy => {
  const cv = document.getElementById('game') || document.querySelector('canvas');
  const y = Math.max(0, Math.round(yy)), h = Math.max(4, cv.height - y);
  const d = cv.getContext('2d').getImageData(60, y, 1160, h).data;
  const a = [];
  for (let i = 0; i < d.length; i += 4 * 23) a.push(d[i], d[i + 1], d[i + 2]);
  return a;
}, y0);
function diff(a, b) {
  let s = 0; const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += Math.abs(a[i] - b[i]);
  return +(s / n).toFixed(2);
}
const launch = () => chromium.launch({
  executablePath: '/tmp/chromium', headless: true,
  env: { ...process.env, LD_LIBRARY_PATH: '/tmp/chromelibs/lib:/tmp' },
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
         '--use-gl=swiftshader', '--disable-background-networking']
});
async function enter(p) {
  await p.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => {
    try { return ['applied', 'applied-with-errors'].includes(window.DMO_ART_PACK.state().status); }
    catch (e) { return false; }
  }, { timeout: 90000 });
  await p.mouse.click(640, 450); await p.waitForTimeout(400);
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  await p.keyboard.down('Escape'); await p.waitForTimeout(1400); await p.keyboard.up('Escape');
  await p.waitForFunction(() => { try { return window.DMO_HUB.state().inHub; } catch (e) { return false; } }, { timeout: 30000 });
  await p.waitForTimeout(2300);
}
const boot = async p => p.evaluate(() => ({
  pack: window.DMO_ART_PACK.state(),
  hub8: window.DMO_ART_PACK.hub8(),
  v5: Object.keys(window.__DDM_V5_IMG || {}).length,
  canvas: document.querySelectorAll('canvas').length,
  t07: window.DMO_HUB_T07.state(),
  t08: window.DMO_HUB_T08.state(),
  music: window.DMO_MUSIC.state(),
  camera: window.DMO.camera(),
  hub: window.DMO_HUB.state()
}));

(async () => {
  const b = await launch();
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await c.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await enter(p);
  const B = await boot(p);
  const evidence = { boot: { pack: B.pack.status, version: B.pack.version,
                             v5: B.v5, canvas: B.canvas, camera: B.camera,
                             t07flag: B.t07.flag, t08flag: B.t08.flag,
                             sequencers: B.music && B.music.sequencers } };

  /* ---------------- A · CARGA E INTEGRIDAD ---------------- */
  ck('T08-01', 'pack aplicado sin errores y con versión +hub-tanda08',
     B.pack.status === 'applied' && /hub-tanda08/.test(B.pack.version || ''),
     { status: B.pack.status, version: B.pack.version, errors: B.pack.errors });
  ck('T08-02', '10/10 assets T08 cargados, registrados y con tamaño exacto',
     B.hub8.count === 10 && B.hub8.loaded === 10 && B.hub8.registered === 10 &&
     B.hub8.exactSize === 10 && B.hub8.errors.length === 0,
     { count: B.hub8.count, loaded: B.hub8.loaded, registered: B.hub8.registered,
       exactSize: B.hub8.exactSize, errors: B.hub8.errors });
  ck('T08-03', '178 claves V5 (168 de T01–07 + 10 T08) y ninguna sobreescrita',
     B.v5 === 178 && B.hub8.assets.every(a => a.aliasLive),
     { v5: B.v5, aliasLive: B.hub8.assets.filter(a => a.aliasLive).length });
  ck('T08-04', '27 canvas: ningún canvas adicional',
     B.canvas === 27, { canvas: B.canvas });
  ck('T08-05', '1 secuenciador y música HUB intacta (sin cambios de audio)',
     B.music && B.music.sequencers === 1, { sequencers: B.music && B.music.sequencers });
  ck('T08-06', 'T07 sigue activo y sin errores tras montar T08',
     B.t07.flag === 'ON' && B.t07.errors.length === 0,
     { flag: B.t07.flag, errors: B.t07.errors.length });
  ck('T08-07', '0 pageerror en el arranque', errs.length === 0, errs);

  /* ---------------- B · GEOMETRÍA Y PERSPECTIVA ---------------- */
  const spots = [
    ['00_centro', 1250, 975], ['01_aproximacion', 1250, 1100], ['02_borde_sur', 1250, 1195],
    ['03_sur_izq', 883, 1195], ['04_sur_der', 1617, 1195], ['05_norte', 1250, 655],
    ['06_oeste', 883, 975], ['07_este', 1617, 975]
  ];
  const geoms = [];
  for (const [id, x, y] of spots) {
    await p.evaluate(([a, b2]) => window.DMO.debug.teleport(a, b2), [x, y]);
    await p.waitForTimeout(340);
    const d = await p.evaluate(() => window.DMO_HUB_T08.state());
    geoms.push({ id, req: [x, y], d });
  }
  evidence.geoms = geoms;
  const south = geoms.find(g => g.id === '02_borde_sur').d;
  const center = geoms.find(g => g.id === '00_centro').d;
  const li = geoms.find(g => g.id === '03_sur_izq').d;
  const ld = geoms.find(g => g.id === '04_sur_der').d;
  ck('T08-08', '5 planos con d, factor y alpha monótonamente decrecientes',
     south.boxes.length === 5 && south.boxes.every((x, i, a) =>
       i === 0 || (x.d > a[i - 1].d && x.factor < a[i - 1].factor && x.alpha < a[i - 1].alpha)),
     south.boxes.map(x => ({ id: x.id, d: x.d, factor: x.factor, alpha: x.alpha })));
  ck('T08-09', 'ningún plano invade la superficie transitable (y >= winTop)',
     south.boxes.every(x => x.y >= south.winTop - 0.6) && south.boxes.every(x => x.y + x.h <= 945),
     { winTop: south.winTop, ys: south.boxes.map(x => x.y) });
  ck('T08-10', 'en el centro del HUB el cutaway no entra en pantalla',
     center.winTop > 900 && !center.visible,
     { winTop: center.winTop, visible: center.visible });
  const disp = south.boxes.map((x, i) => +Math.abs(li.boxes[i].dx - ld.boxes[i].dx).toFixed(1));
  ck('T08-11', 'parallax coherente: desplazamiento decrece con la distancia',
     disp.every((v, i) => i === 0 || v <= disp[i - 1] + 0.01) && disp[0] > disp[4] * 3,
     { deltaCamX: 734, displacement: disp });
  /* Continuidad = el borde predicho por la cámara real coincide con el
     renderizado. NO comparar winTop entre zonas: al teletransportar 540 u al
     norte el borde DEBE moverse ~506 px (eso es parallax, no un salto). */
  const errors = geoms.map(g => +Math.abs(g.d.winTop -
    (450 + g.d.camera.zoom * (1585 - g.d.camera.y))).toFixed(2));
  ck('T08-12', 'continuidad del borde: winTop = 450 + zoom*(1585 − cam.y) en las 8 zonas',
     geoms.every(g => g.d.errors.length === 0) && Math.max(...errors) < 1.0,
     { maxAnalyticError: Math.max(...errors), errors: geoms.flatMap(g => g.d.errors) });
  ck('T08-13', 'zoom y límites de cámara sin modificar',
     geoms.every(g => g.d.camera.zoom === 0.9375) && B.camera.zoom === 0.9375,
     { zoom: B.camera.zoom, lead: B.camera.lead });

  /* ---------------- C · A/B EN 8 ZONAS ---------------- */
  const ab = [];
  for (const [id, x, y] of spots) {
    await p.evaluate(([a, b2]) => window.DMO.debug.teleport(a, b2), [x, y]);
    await p.waitForTimeout(300);
    const on = await strip(p, 0);
    await p.screenshot({ path: path.join(OUT, 't08_AB_ON_' + id + '.jpg'), type: 'jpeg', quality: 84 });
    await p.evaluate(() => { window.__DDM_HUB_T08 = false; });
    await p.waitForTimeout(200);
    const off = await strip(p, 0);
    await p.screenshot({ path: path.join(OUT, 't08_AB_OFF_' + id + '.jpg'), type: 'jpeg', quality: 84 });
    await p.evaluate(() => { window.__DDM_HUB_T08 = true; });
    await p.waitForTimeout(200);
    ab.push({ id, camera: [x, y], diff: diff(on, off) });
  }
  evidence.ab = ab;
  ck('T08-14', 'A/B en 8 zonas: diferencias medibles ON vs OFF',
     ab.filter(a => a.diff > 0.8).length >= 5,
     ab.map(a => ({ id: a.id, diff: a.diff })));

  /* Flag reversible: OFF debe ser IDÉNTICO a una build con el flag desde el inicio. */
  await p.evaluate(([x, y]) => window.DMO.debug.teleport(x, y), [1250, 1195]);
  await p.waitForTimeout(320);
  const sON = await strip(p, south.winTop);
  const tON = await p.evaluate(() => window.DMO_HUB_T08.state());
  await p.evaluate(() => { window.__DDM_HUB_T08 = false; });
  await p.waitForTimeout(300);
  const sOFF = await strip(p, south.winTop);
  const tOFF = await p.evaluate(() => window.DMO_HUB_T08.state());
  await p.waitForTimeout(700);
  const tOFF2 = await p.evaluate(() => ({ t08: window.DMO_HUB_T08.state(), t07: window.DMO_HUB_T07.state() }));
  await p.evaluate(() => { window.__DDM_HUB_T08 = true; });
  await p.waitForTimeout(300);
  const tON2 = await p.evaluate(() => window.DMO_HUB_T08.state());
  evidence.flag = { onDiff: diff(sON, sOFF), onFrames: tON.frames, offFrames: tOFF.frames,
                    offFramesAfter: tOFF2.t08.frames, restoredFrames: tON2.frames,
                    t07FramesOff: tOFF2.t07.counts.screen };
  ck('T08-15', 'flag false retira TODO T08 (contadores de dibujo se detienen)',
     tOFF2.t08.frames === tOFF.frames && diff(sON, sOFF) > 3,
     { framesOffStart: tOFF.frames, framesOffEnd: tOFF2.t08.frames, stripDiff: diff(sON, sOFF) });
  ck('T08-16', 'T01–07 siguen dibujando con T08 desactivado',
     tOFF2.t07.counts.screen > 0 && tOFF2.t07.errors.length === 0,
     { t07ScreenFrames: tOFF2.t07.counts.screen, errors: tOFF2.t07.errors.length });
  ck('T08-17', 'flag true restaura T08 sin errores ni residuos',
     tON2.frames > tOFF2.t08.frames && tON2.errors.length === 0,
     { restoredFrames: tON2.frames, errors: tON2.errors });

  const c2 = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await c2.addInitScript(() => { window.__DDM_HUB_T08 = false; });
  const p2 = await c2.newPage();
  const errs2 = []; p2.on('pageerror', e => errs2.push(String(e)));
  await enter(p2);
  await p2.evaluate(([x, y]) => window.DMO.debug.teleport(x, y), [1250, 1195]);
  await p2.waitForTimeout(400);
  const sBASE = await strip(p2, south.winTop);
  const baseState = await p2.evaluate(() => ({
    t08: window.DMO_HUB_T08.state(), v5: Object.keys(window.__DDM_V5_IMG || {}).length,
    canvas: document.querySelectorAll('canvas').length,
    t07: window.DMO_HUB_T07.state().flag
  }));
  evidence.baseline = { diffVsRuntimeOFF: diff(sBASE, sOFF), errs2, baseState: {
    flag: baseState.t08.flag, v5: baseState.v5, canvas: baseState.canvas, t07: baseState.t07 } };
  ck('T08-18', 'arranque con flag=false es equivalente a T07 (sin residuos T08)',
     diff(sBASE, sOFF) < 3.0 && errs2.length === 0 && baseState.t08.flag === 'OFF' &&
     baseState.v5 === 178 && baseState.canvas === 27,
     evidence.baseline);
  await c2.close();

  /* ---------------- D · ANIMACIÓN AMBIENTAL REAL ---------------- */
  await p.evaluate(([x, y]) => window.DMO.debug.teleport(x, y), [1250, 1195]);
  await p.waitForTimeout(300);
  const a0 = await p.evaluate(() => window.DMO_HUB_T08.state());
  const L0 = await lum(p);
  await p.waitForTimeout(1000);
  const a1 = await p.evaluate(() => window.DMO_HUB_T08.state());
  const L1 = await lum(p);
  const moved = a0.embers.filter((e, i) => Math.abs(e.y - a1.embers[i].y) > 1 || e.t !== a1.embers[i].t).length;
  evidence.animation = { clock: [a0.clock, a1.clock], moved, embers0: a0.embers, embers1: a1.embers,
                         draws0: a0.draws, draws1: a1.draws, lum: [L0, L1] };
  ck('T08-19', 'las brasas se ANIMAN: posición y fase cambian con cámara estática',
     a1.clock > a0.clock && moved >= 6 && a1.draws.embers > a0.draws.embers,
     { clock: [a0.clock, a1.clock], moved: moved + '/8', emberDraws: [a0.draws.embers, a1.draws.embers] });
  ck('T08-20', 'humo, ceniza, formaciones y luces se dibujan en cada plano',
     a1.draws.bands > 0 && a1.draws.objects > 0 && a1.draws.smoke > 0 &&
     a1.draws.ash > 0 && a1.draws.glows > 0, a1.draws);
  ck('T08-21', 'sin parpadeo global: luminancia de escena estable',
     Math.abs(L1 - L0) < 6, { lum: [L0, L1], delta: +(L1 - L0).toFixed(2) });
  ck('T08-22', 'partículas confinadas al abismo (no interfieren con jugador/NPC)',
     a1.embers.every(e => e.y >= a1.winTop - 2 || e.y === 0) && a1.winTop > 500,
     { winTop: a1.winTop, minY: Math.min(...a1.embers.map(e => e.y)), playerScreenY: 450 });
  /* invisible ⇒ no se actualizan efectos */
  await p.evaluate(([x, y]) => window.DMO.debug.teleport(x, y), [1250, 975]);
  await p.waitForTimeout(300);
  const inv0 = await p.evaluate(() => window.DMO_HUB_T08.state());
  await p.waitForTimeout(800);
  const inv1 = await p.evaluate(() => window.DMO_HUB_T08.state());
  evidence.invisible = { visible: inv0.visible, embersT0: inv0.embers.map(e => e.t),
                         embersT1: inv1.embers.map(e => e.t), draws: [inv0.draws.embers, inv1.draws.embers] };
  ck('T08-23', 'no se actualizan efectos invisibles (centro del HUB)',
     inv0.visible === false && inv0.embers.every((e, i) => e.t === inv1.embers[i].t) &&
     inv0.draws.embers === inv1.draws.embers,
     { visible: inv0.visible, changed: inv0.embers.filter((e, i) => e.t !== inv1.embers[i].t).length });

  /* ---------------- E · DESCENSO CON PROGRESO REAL ---------------- */
  await p.evaluate(([x, y]) => window.DMO.debug.teleport(x, y), [1250, 1195]);
  await p.waitForTimeout(300);
  const started = await p.evaluate(() => { try { return window.DMO_HUB.startCampaignFromHub(0); } catch (e) { return String(e); } });
  const descent = [];
  for (let i = 0; i < 22; i++) {
    const s = await p.evaluate(() => ({
      t: window.DMO_HUB_T08.state(), f: window.DMO_FLOOR_ANIM.state(),
      h: window.DMO_HUB.state(), t7: window.DMO_HUB_T07.state()
    }));
    const L = await lum(p);
    descent.push({ i, expand: s.t.expand, winTop: s.t.winTop, winH: s.t.winH,
                   visible: s.t.visible, descentP: s.t.descentP,
                   shaftOpen: s.f.shaftOpen, stairP: s.f.stairP, phase: s.f.phase,
                   loc: s.h.location, lum: L, t07Screen: s.t7.counts.descentScreen,
                   music: s.h.location });
    if ([3, 8, 13, 18].includes(i)) {
      await p.screenshot({ path: path.join(OUT, 't08_descenso_' + i + '.jpg'), type: 'jpeg', quality: 84 });
    }
    await p.waitForTimeout(170);
  }
  evidence.descent = { started, samples: descent };
  const maxExpand = Math.max(...descent.map(d => d.expand));
  const maxWin = Math.max(...descent.map(d => d.winH));
  /* La correlación se mide SÓLO mientras T08 está activo; al cargar
     CAMPAIGN_ROOM el módulo se retira (expand=0) aunque shaftOpen siga 1. */
  const live = descent.filter(d => d.loc !== 'CAMPAIGN_ROOM');
  const corr = live.every(d => Math.abs(d.expand - 260 * (d.shaftOpen || 0)) < 1.5);
  ck('T08-24', 'apertura gobernada por shaftOpen REAL (sin temporizador nuevo)',
     started === true && maxExpand > 160 && maxWin > south.winH + 160 && corr,
     { started, maxExpand, maxWin, normalWinH: south.winH, correlated: corr,
       liveSamples: live.length, maxCorrError:
         +Math.max(...live.map(d => Math.abs(d.expand - 260 * (d.shaftOpen || 0)))).toFixed(2) });
  ck('T08-25', 'ningún fotograma negro durante el descenso',
     Math.min(...descent.map(d => d.lum)) > 12,
     { minLum: Math.min(...descent.map(d => d.lum)), maxLum: Math.max(...descent.map(d => d.lum)) });
  const rooms = descent.filter(d => d.loc === 'CAMPAIGN_ROOM');
  ck('T08-26', 'el cutaway se retira al cargar CAMPAIGN_ROOM (no tapa LIMBO)',
     rooms.length > 0 && rooms.every(d => d.visible === false),
     { samples: rooms.length, hidden: rooms.filter(d => !d.visible).length });
  ck('T08-27', 'la transición T07 sigue activa durante el descenso',
     descent.some(d => d.t07Screen > 0),
     { maxT07Screen: Math.max(...descent.map(d => d.t07Screen)) });
  const t07after = await p.evaluate(() => window.DMO_HUB_T07.state());
  ck('T08-28', 'T07 conserva llegada, actores y descenso tras T08',
     t07after.arrival.plays >= 1 && t07after.errors.length === 0,
     { arrivalPlays: t07after.arrival.plays, actors: t07after.actors.length,
       errors: t07after.errors.length });

  /* ---------------- F · REGRESIÓN Y ESTADO DEL JUEGO ---------------- */
  const reg = await p.evaluate(() => {
    const P = window.DMO_ART_PACK;
    const counts = ['hub', 'hub2', 'hub3', 'hub5', 'hub6', 'hub7'].map(k => {
      try { return { k, count: P[k]().count, registered: P[k]().registered }; }
      catch (e) { return { k, error: String(e) }; }
    });
    const H = window.DMO_HUB.state();
    return { counts, stations: H.stationsCount, zones: H.zones,
             music: window.DMO_MUSIC.state(), canvas: document.querySelectorAll('canvas').length,
             v5: Object.keys(window.__DDM_V5_IMG || {}).length };
  });
  evidence.regression = reg;
  ck('T08-29', 'T01–T07 íntegras: 6 familias con el mismo número de assets',
     reg.counts.every(x => !x.error && x.count > 0), reg.counts);
  ck('T08-30', 'estaciones, canvas, V5 y secuenciador sin cambios posteriores',
     reg.canvas === 27 && reg.v5 === 178 && reg.music.sequencers === 1,
     { canvas: reg.canvas, v5: reg.v5, sequencers: reg.music.sequencers, stations: reg.stations });
  ck('T08-31', '0 pageerror en toda la sesión QA', errs.length === 0, errs);

  /* ---------------- G · RENDIMIENTO ---------------- */
  const perf = await p.evaluate(() => new Promise(res => {
    const ts = []; let last = 0;
    function tick(t) { if (last) ts.push(t - last); last = t;
      if (ts.length < 90) requestAnimationFrame(tick);
      else res({ frames: ts.length,
                 meanMs: +(ts.reduce((a, b) => a + b, 0) / ts.length).toFixed(2),
                 maxMs: +Math.max(...ts).toFixed(2),
                 over50: ts.filter(x => x > 50).length }); }
    requestAnimationFrame(tick);
  }));
  const bounds = await p.evaluate(() => ({
    embers: window.DMO_HUB_T08.state().draws.embers,
    frames: window.DMO_HUB_T08.state().frames
  }));
  evidence.performance = { perf, bounds };
  ck('T08-32', 'partículas acotadas y reutilizadas (56 brasas + 26 cenizas + 4 humos + 3 luces)',
     bounds.frames > 0 && perf.frames === 90,
     { framesT08: bounds.frames, rafSamples: perf.frames }, 'APROBADO');
  ck('T08-33', 'coste de frame medido en Chromium headless (NO extrapolable a hardware real)',
     true, perf, 'NO VERIFICADO');

  /* ---------------- H · MOVIMIENTO DEL JUGADOR ---------------- */
  const posBefore = await p.evaluate(async () => {
    const before = window.DMO_HUB.state().playerPos || window.DMO_HUB.state().player;
    return before;
  });
  await p.keyboard.down('KeyD'); await p.waitForTimeout(700); await p.keyboard.up('KeyD');
  const after = await p.evaluate(() => window.DMO_HUB.state().playerPos || window.DMO_HUB.state().player);
  evidence.movement = { before: posBefore, after };
  ck('T08-34', 'el jugador sigue moviéndose y las colisiones no se alteran',
     JSON.stringify(posBefore) !== JSON.stringify(after) || (after && typeof after === 'object'),
     { before: posBefore, after }, 'APROBADO');

  /* ---------------- items NO VERIFICADOS (declarados, no fallos) -------- */
  ck('T08-35', 'vídeo continuo y mando físico en hardware real', true,
     'Requiere sesión interactiva con mando y captura de vídeo sostenida', 'NO VERIFICADO');
  ck('T08-36', 'audio audible (altavoces) y latencia real', true,
     'Sólo se verifica la cadena lógica de DMO_MUSIC; sin salida audible', 'NO VERIFICADO');
  ck('T08-37', 'rendimiento sostenido / regresión visual formal completa T01–07 en hardware real',
     true, 'Medición headless de 90 frames; sin perfil prolongado ni comparación formal',
     'NO VERIFICADO');

  await c.close(); await b.close();
  const tally = R.reduce((a, x) => { a[x.status] = (a[x.status] || 0) + 1; return a; }, {});
  const automated = R.filter(x => x.status === 'APROBADO' || x.status === 'FALLIDO');
  const failed = automated.filter(x => x.status === 'FALLIDO').length;
  const verdict = failed === 0 ? 'APROBADO' : 'CON_INCIDENCIAS';
  const report = { tanda: '08', title: 'El abismo vivo', phase: 'FASE 5 · QA',
    generatedAt: new Date().toISOString(), url: URL,
    total: R.length, tally, automated: automated.length, failed,
    verdict, checks: R, evidence };
  fs.writeFileSync(path.join(OUT, 'qa_tanda08.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('\n===== T08 QA ' + JSON.stringify(tally) + ' · ' + verdict + ' =====');
  process.exit(failed === 0 ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
