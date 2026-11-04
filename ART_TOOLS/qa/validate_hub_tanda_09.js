/* TANDA 09 · FASE 5 — QA de rutinas, acontecimientos y regresión.
 * 16 comprobaciones medidas durante VARIOS CICLOS COMPLETOS (no un único
 * cambio de animación). Clasificación APROBADO/FALLIDO/BLOQUEADO/NO VERIFICADO.
 * Requiere :8123 y /tmp/qatools/node_modules/playwright-core.
 * Salida: ART_EVIDENCE/hub/tanda_09/qa_tanda09.json + capturas.
 */
const { chromium } = require('/tmp/qatools/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');
const OUT = path.resolve(__dirname, '../../ART_EVIDENCE/hub/tanda_09');
fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html';
const SAMPLES = 400, SAMPLE_MS = 250;   /* 100 s · varios ciclos + 3 acontecimientos */

const NPC_IDS = [
  'hub_ambient_dancer_nw','hub_ambient_dancer_ne','hub_ambient_dancer_sw',
  'hub_ambient_clubber_bar','t07_danza_01','t07_danza_02','t07_charla_01',
  't07_charla_02','t07_descanso','t07_recorrido','narr_cliente000'
];
const T07_IDS = NPC_IDS.slice(4, 10);
const AMB_IDS = NPC_IDS.slice(0, 4);

function launch() {
  return chromium.launch({ executablePath: '/tmp/chromium', headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: '/tmp/chromelibs/lib:/tmp' },
    args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
           '--use-gl=swiftshader','--disable-background-networking'] });
}
async function enter(p) {
  await p.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => {
    try { return ['applied','applied-with-errors'].includes(window.DMO_ART_PACK.state().status); }
    catch (e) { return false; }
  }, { timeout: 90000 });
  await p.mouse.click(640, 450); await p.waitForTimeout(400);
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  await p.keyboard.down('Escape'); await p.waitForTimeout(1400); await p.keyboard.up('Escape');
  await p.waitForFunction(() => { try { return window.DMO_HUB.state().inHub; } catch (e) { return false; } }, { timeout: 30000 });
  await p.waitForTimeout(1800);
}
const state = p => p.evaluate(() => window.DMO_HUB_T09.state());

(async () => {
  const b = await launch();
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await c.newPage();
  const pageerrors = [], warns = [];
  p.on('pageerror', e => pageerrors.push(String(e)));
  p.on('console', m => { if (m.type() === 'warning') warns.push(m.text().slice(0, 180)); });
  await enter(p);

  /* ---------------- línea base ---------------- */
  const base = await p.evaluate((ids) => {
    const o = {};
    const props = window.DMO_LAYOUT.propObjects();
    o.propCount = props.length;
    o.npcProps = props.filter(q => ids.includes(q.id)).map(q => ({
      id: q.id, x: q.x, y: q.y, sortY: q.sortY, r: q.r,
      solid: q.solid, tall: q.tall, hubCustom: !!q.hubCustom,
      hasHubDraw: typeof q.hubDraw === 'function' }));
    o.stations = window.DMO_HUB.stations();
    o.hubAudit = window.DMO_HUB.audit();
    o.t07 = window.DMO_HUB_T07.audit();
    o.t08 = window.DMO_HUB_T08.state();
    o.pack = window.DMO_ART_PACK.state();
    o.v5 = Object.keys(window.__DDM_V5_IMG || {}).length;
    o.canvas = document.querySelectorAll('canvas').length;
    o.observeProps = (window.DMO.observe().props || []).length;
    o.t09audit = window.DMO_HUB_T09.audit();
    o.flagInitially = window.__DDM_HUB_T09;
    o.timers = { intervals: 0 };
    return o;
  }, NPC_IDS);

  /* ---------------- muestreo de ciclos ---------------- */
  const samples = [];
  for (let i = 0; i < SAMPLES; i++) {
    const s = await state(p);
    samples.push({
      clock: s.clock, updates: s.updates, draws: s.draws, delegated: s.delegated,
      worldLive: s.worldLive, event: s.event, eventGap: s.eventGap,
      eventsFired: s.eventsFired, eventsCompleted: s.eventsCompleted,
      counts: s.counts,
      r: s.records.map(r => ({ id: r.id, st: r.state, i: r.intensity, f: r.lastFrame,
                               x: r.lastX, fm: r.faceMix, dx: r.dx, dy: r.dy,
                               pose: r.pose, react: r.lastReact, cycles: r.cycles,
                               changes: r.changes, hold: r.holdOffset }))
    });
    await p.waitForTimeout(SAMPLE_MS);
  }

  const after = await p.evaluate(() => ({
    t09: window.DMO_HUB_T09.state(), audit: window.DMO_HUB_T09.audit(),
    t07: window.DMO_HUB_T07.audit(), hub: window.DMO_HUB.audit(),
    t08: window.DMO_HUB_T08.state(), canvas: document.querySelectorAll('canvas').length,
    v5: Object.keys(window.__DDM_V5_IMG || {}).length,
    props: window.DMO_LAYOUT.propObjects().length
  }));

  /* ---------------- A/B del flag ---------------- */
  await p.evaluate(() => { window.__DDM_HUB_T09 = false; });
  await p.waitForTimeout(900);
  const off = await state(p);
  await p.screenshot({ path: path.join(OUT, 'qa_flag_off_T08.jpg'), type: 'jpeg', quality: 86 });
  await p.evaluate(() => { window.__DDM_HUB_T09 = true; });
  await p.waitForTimeout(900);
  const on2 = await state(p);
  await p.screenshot({ path: path.join(OUT, 'qa_flag_on_T09.jpg'), type: 'jpeg', quality: 86 });

  /* ---------------- reacciones y compatibilidad de movimiento -------------- */
  const reactions = [];
  for (const [label, x, y] of [['spawn',1250,965],['junto_a_danza',1120,900],
                               ['junto_a_charla',1690,1010],['junto_a_descanso',1910,900],
                               ['zona_C',1250,1300],['zona_F',655,1135]]) {
    await p.evaluate(([a, b2]) => window.DMO.debug.teleport(a, b2), [x, y]);
    await p.waitForTimeout(320);
    const s = await state(p);
    reactions.push({ label, x, y, worldLive: s.worldLive,
      r: s.records.map(r => ({ id: r.id, react: r.lastReact })),
      hubMode: await p.evaluate(() => window.DMO_HUB.state().mode) });
  }
  /* teclas de movimiento: el control del jugador sigue respondiendo */
  await p.evaluate(() => window.DMO.debug.teleport(1250, 965));
  await p.waitForTimeout(280);
  const beforeMove = await p.evaluate(() => ({ camX: window.DMO.camera().x }));
  await p.keyboard.down('KeyD'); await p.waitForTimeout(650); await p.keyboard.up('KeyD');
  const playerMove = await p.evaluate(() => ({ camX: window.DMO.camera().x,
    hubMode: window.DMO_HUB.state().mode, worldLive: window.DMO_HUB_T09.state().worldLive }));

  /* ---------------- capturas por zona y posturas nuevas ------------------- */
  const zones = [['zona_A',1250,965],['zona_B_dj',1250,665],['zona_C_grieta',1250,1195],
                 ['zona_D_arsenal',883,900],['zona_E_barra',1617,900],['zona_F_arcade',883,1130]];
  const caps = [];
  for (const [id, x, y] of zones) {
    await p.evaluate(([a, b2]) => window.DMO.debug.teleport(a, b2), [x, y]);
    await p.waitForTimeout(280);
    const f = 'qa_' + id + '.jpg';
    await p.screenshot({ path: path.join(OUT, f), type: 'jpeg', quality: 86 });
    caps.push({ id, file: f, camera: [x, y] });
  }
  /* Prueba de render de las 4 posturas nuevas (poses forzadas SÓLO para QA) */
  const poses = [
    ['t09_rest_seated','t07_descanso',1910,900],
    ['t09_observe','hub_ambient_dancer_sw',1015,1085],
    ['t09_greeting','t07_charla_01',1690,1010],
    ['t09_wait','hub_ambient_clubber_bar',1965,918]
  ];
  const poseCaps = [];
  for (const [slot, id, x, y] of poses) {
    await p.evaluate(([s, rid, cx, cy]) => {
      const T = window.__DDM_T09.S;
      T.event = null; T.eventGap = 999;
      const rec = T.records.find(q => q.id === rid);
      if (rec) { rec.pose = s; rec.state = 'PAUSE'; rec.tIntensity = 0.2; rec.tLeft = 999; }
      /* cámara ligeramente desplazada: el NPC queda visible sin el prompt [E] */
      window.DMO.debug.teleport(cx + 90, cy + 65);
    }, [slot, id, x, y]);
    await p.waitForTimeout(420);
    const f = 'qa_sprite_' + slot + '.jpg';
    await p.screenshot({ path: path.join(OUT, f), type: 'jpeg', quality: 88 });
    const info = await p.evaluate(([s, rid]) => {
      const rec = window.__DDM_T09.S.records.find(q => q.id === rid);
      const im = window.__DDM_V5_IMG[s];
      return { slot: s, poseInRecord: rec ? rec.pose : null,
               size: im ? [im.naturalWidth, im.naturalHeight] : null };
    }, [slot, id]);
    poseCaps.push({ ...info, file: f });
  }
  await p.evaluate(() => {
    const T = window.__DDM_T09.S;
    T.records.forEach(r => { r.pose = null; r.state = 'ACTIVE'; r.tIntensity = 1; r.tLeft = 4; });
    T.eventGap = 25;
  });

  /* ---------------- movimiento reducido ---------------- */
  const cr = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const pr = await cr.newPage();
  const rerrs = []; pr.on('pageerror', e => rerrs.push(String(e)));
  await enter(pr);
  const r0 = await pr.evaluate(() => window.DMO_HUB_T09.state());
  await pr.waitForTimeout(1400);
  const r1 = await pr.evaluate(() => window.DMO_HUB_T09.state());
  await pr.screenshot({ path: path.join(OUT, 'qa_movimiento_reducido.jpg'), type: 'jpeg', quality: 86 });
  await cr.close();

  /* ---------------- métricas ---------------- */
  const ids = base.t09audit.npcs ? samples[0].r.map(r => r.id) : [];
  const perId = {};
  ids.forEach(id => {
    const seq = samples.map(s => s.r.find(r => r.id === id)).filter(Boolean);
    const states = [...new Set(seq.map(x => x.st))];
    const frames = seq.map(x => x.f);
    const xs = seq.map(x => x.x);
    const dF = [], dX = [];
    for (let j = 1; j < seq.length; j++) {
      const a = frames[j-1], bb = frames[j];
      let delta = Math.abs(bb - a);
      if (delta > 2) delta = 4 - delta;       /* envoltura 0..3 */
      dF.push(delta);
      dX.push(Math.abs(xs[j] - xs[j-1]));
    }
    const changes = seq[seq.length-1].changes - seq[0].changes;
    const cycles = seq[seq.length-1].cycles - seq[0].cycles;
    perId[id] = { states, changes, cycles,
      frameMaxDelta: dF.length ? Math.max(...dF) : 0,
      frameDeltaHist: dF.reduce((m,v)=>{m[v]=(m[v]||0)+1;return m;},{}),
      xMaxDelta: dX.length ? Math.max(...dX) : 0, xSpan: Math.max(...xs) - Math.min(...xs),
      xMin: Math.min(...xs), xMax: Math.max(...xs),
      intensities: [...new Set(seq.map(x => +x.i.toFixed(2)))].length,
      faceMidPct: +(100 * seq.filter(x => x.fm > 0.15 && x.fm < 0.85).length / seq.length).toFixed(1),
      poses: [...new Set(seq.map(x => x.pose).filter(Boolean))],
      frozenFrames: seq.filter((x,j) => j>0 && x.f === seq[j-1].f).length,
      offsetsMax: +Math.max(...seq.map(x => Math.abs(x.dx))).toFixed(2),
      reactMax: +Math.max(...seq.map(x => x.react)).toFixed(3) };
  });
  let maxSimultaneousChanges = 0;
  for (let j = 1; j < samples.length; j++) {
    let n = 0;
    for (let k = 0; k < samples[j].r.length; k++) {
      if (samples[j].r[k].changes > samples[j-1].r[k].changes) n++;
    }
    if (n > maxSimultaneousChanges) maxSimultaneousChanges = n;
  }
  const distinctStateCombos = new Set(samples.map(s => s.r.map(r => r.st[0]).join(''))).size;
  const activeEvents = [...new Set(samples.map(s => s.event && s.event.id).filter(Boolean))];

  const payload = {
    generatedAt: new Date().toISOString(),
    config: { samples: SAMPLES, sampleMs: SAMPLE_MS, durationSec: +(SAMPLES*SAMPLE_MS/1000).toFixed(1) },
    base, after, perId,
    derived: {
      distinctStateCombos, maxSimultaneousChanges, activeEvents,
      eventsFired: after.t09.eventsFired, eventsCompleted: after.t09.eventsCompleted,
      counts: after.t09.counts, clock: after.t09.clock,
      updates: after.t09.updates, draws: after.t09.draws, delegated: after.t09.delegated,
      drawsPerUpdate: +(after.t09.draws / Math.max(1, after.t09.updates)).toFixed(2),
      pageerrors, warns
    },
    flag: { off: { flag: off.flag, draws: off.draws, delegated: off.delegated,
                    recordsActive: off.records.filter(r => r.state === 'ACTIVE').length },
            on2: { flag: on2.flag, draws: on2.draws, delegated: on2.delegated } },
    reactions, playerMove, beforeMove, caps, poseCaps,
    reduced: { pageerrors: rerrs,
      static: r0.records.every((r,i) => r.lastFrame === r1.records[i].lastFrame),
      draws: r1.draws, delegated: r1.delegated, flag: r1.flag }
  };
  fs.writeFileSync(path.join(OUT, 'qa_tanda09.json'), JSON.stringify(payload, null, 2) + '\n');
  console.log('muestras', SAMPLES, '| duración', payload.config.durationSec, 's');
  console.log('eventos', activeEvents.join(','), 'fired', after.t09.eventsFired, 'completed', after.t09.eventsCompleted);
  console.log('combos de estado', distinctStateCombos, '| cambios simultáneos máx', maxSimultaneousChanges);
  console.log('draws/updates', payload.derived.drawsPerUpdate, '| pageerrors', pageerrors.length, '| warns', warns.length);
  console.log('flag OFF delegated', payload.flag.off.delegated, '| ON2 draws', payload.flag.on2.draws);
  console.log('reduced static', payload.reduced.static, '| delegated', payload.reduced.delegated);
  console.log('perId', JSON.stringify(Object.fromEntries(Object.entries(perId).map(([k,v])=>[k,{states:v.states,cycles:v.cycles,frameMax:v.frameMaxDelta,xMax:v.xMaxDelta,faceMid:v.faceMidPct,poses:v.poses}]))));
  await c.close(); await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(2); });
