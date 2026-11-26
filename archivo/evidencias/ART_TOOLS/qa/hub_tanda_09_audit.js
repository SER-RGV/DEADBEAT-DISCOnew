/* TANDA 09 · FASE 0 — Auditoría de NPC, animaciones, zonas y actividades.
 * SÓLO LECTURA: no modifica el juego, no registra hooks, no crea props.
 * Requiere servidor :8123 y /tmp/qatools/node_modules/playwright-core.
 * Salida: ART_EVIDENCE/hub/tanda_09/audit_npc.json + capturas por zona.
 */
const { chromium } = require('/tmp/qatools/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');
const OUT = path.resolve(__dirname, '../../ART_EVIDENCE/hub/tanda_09');
fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html';

const launch = () => chromium.launch({
  executablePath: '/tmp/chromium', headless: true,
  env: { ...process.env, LD_LIBRARY_PATH: '/tmp/chromelibs/lib:/tmp' },
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
         '--use-gl=swiftshader', '--disable-background-networking']
});
async function enter(p, reduced) {
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
const snap = p => p.evaluate(() => {
  const S = window.__DDM_T07.S;
  return {
    clock: +S.clock.toFixed(3),
    actors: window.DMO_HUB_T07.actors().map(a => ({
      id: a.id, act: a.act, lastFrame: a.lastFrame, lastX: a.lastX,
      lastFlip: a.lastFlip, lastReact: a.lastReact
    }))
  };
});

(async () => {
  const b = await launch();
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await c.newPage();
  const pageerrors = [], warns = [];
  p.on('pageerror', e => pageerrors.push(String(e)));
  p.on('console', m => { if (m.type() === 'warning') warns.push(m.text().slice(0, 160)); });
  await enter(p, false);

  const R = { phase: 'F0 · auditoría (sólo lectura)', generatedAt: new Date().toISOString() };
  R.inventory = await p.evaluate(() => {
    const o = {};
    const props = window.DMO_LAYOUT.propObjects();
    o.propObjectsCount = props.length;
    o.npcProps = props.filter(x => x && /ambient_dancer|t07_|clubber|cliente|bartender|bouncer/i.test(x.id || ''))
      .map(x => ({ id: x.id, x: x.x, y: x.y, sortY: x.sortY, r: x.r, solid: x.solid,
                   tall: x.tall, hubCustom: !!x.hubCustom, hasHubDraw: typeof x.hubDraw === 'function' }));
    o.stations = window.DMO_HUB.stations();
    o.hubAudit = window.DMO_HUB.audit();
    o.hubState = window.DMO_HUB.state();
    o.v5Count = Object.keys(window.__DDM_V5_IMG || {}).length;
    const reg = window.__DDM_V5_IMG || {};
    o.npcSprites = {};
    ['hub_cliente000_npc','hub_clubber_dancer_a','hub_clubber_dancer_b',
     'hub_bartender_npc','hub_bouncer_npc'].forEach(k => {
      const im = reg[k];
      o.npcSprites[k] = im ? { w: im.naturalWidth, h: im.naturalHeight, complete: im.complete } : null;
    });
    o.t07 = window.DMO_HUB_T07.state();
    o.t07audit = window.DMO_HUB_T07.audit();
    o.t08 = window.DMO_HUB_T08.state();
    o.music = window.DMO_MUSIC.state();
    o.atmos = window.DMO_ATMOS.audit();
    o.camera = window.DMO.camera();
    o.canvasCount = document.querySelectorAll('canvas').length;
    o.globals = Object.keys(window).filter(k => /^DMO|^__DDM|^__ILT|^__T3B/i.test(k)).sort();
    return o;
  });

  /* --- Variación REAL durante 24 muestras (~6 s) con cámara estática --- */
  R.cycles = [];
  for (let i = 0; i < 24; i++) {
    R.cycles.push(await snap(p));
    await p.waitForTimeout(250);
  }
  const ids = R.inventory.t07.actors.map(a => a.id);
  R.cycleSummary = ids.map(id => {
    const frames = R.cycles.map(s => s.actors.find(a => a.id === id).lastFrame);
    const xs = R.cycles.map(s => s.actors.find(a => a.id === id).lastX);
    const flips = R.cycles.map(s => s.actors.find(a => a.id === id).lastFlip);
    const acts = [...new Set(R.cycles.map(s => s.actors.find(a => a.id === id).act))];
    return { id, distinctFrames: [...new Set(frames)].length, frameChanges:
      frames.filter((v, k) => k && v !== frames[k - 1]).length,
      distinctX: [...new Set(xs)].length, xSpan: Math.max(...xs) - Math.min(...xs),
      flipChanges: flips.filter((v, k) => k && v !== flips[k - 1]).length,
      activitiesObserved: acts };
  });

  /* --- Reacción al jugador: teleport cerca / lejos de dos actores --- */
  const react = [];
  for (const [label, x, y, target] of [
    ['lejos', 1250, 965, 't07_danza_01'],
    ['cerca_danza', 1120, 900, 't07_danza_01'],
    ['cerca_charla', 1690, 1010, 't07_charla_01'],
    ['cerca_descanso', 1910, 900, 't07_descanso']
  ]) {
    await p.evaluate(([a, b]) => window.DMO.debug.teleport(a, b), [x, y]);
    await p.waitForTimeout(320);
    const s = await snap(p);
    react.push({ label, camera: [x, y], target,
                 react: s.actors.find(a => a.id === target).lastReact,
                 all: s.actors.map(a => ({ id: a.id, react: a.lastReact })) });
  }
  R.reactions = react;

  /* --- Capturas por zona (cámara real, 8 posiciones) --- */
  const zones = [
    ['zona_A_centro', 1250, 965], ['zona_A_vip_nw', 883, 700],
    ['zona_B_cabina_dj', 1250, 665], ['zona_D_arsenal', 883, 900],
    ['zona_E_barra', 1617, 900], ['zona_F_arcade', 883, 1130],
    ['zona_F_espejo', 1617, 1130], ['zona_C_grieta_sur', 1250, 1195],
    ['borde_acantilado', 1250, 1195]
  ];
  R.zoneCaptures = [];
  for (const [id, x, y] of zones) {
    await p.evaluate(([a, b]) => window.DMO.debug.teleport(a, b), [x, y]);
    await p.waitForTimeout(330);
    const file = 'audit_' + id + '.jpg';
    await p.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 84 });
    const st = await p.evaluate(() => ({ cam: window.DMO.camera(), inHub: window.DMO_HUB.state().inHub }));
    R.zoneCaptures.push({ id, requested: [x, y], camera: st.cam, inHub: st.inHub, file });
  }

  /* --- Contexto con movimiento reducido --- */
  const cr = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const pr = await cr.newPage();
  const rerrs = []; pr.on('pageerror', e => rerrs.push(String(e)));
  await enter(pr, true);
  await pr.waitForTimeout(400);
  const r0 = await snap(pr); await pr.waitForTimeout(900); const r1 = await snap(pr);
  R.reducedMotion = {
    pageerrors: rerrs,
    frames0: r0.actors.map(a => ({ id: a.id, f: a.lastFrame, x: a.lastX })),
    frames1: r1.actors.map(a => ({ id: a.id, f: a.lastFrame, x: a.lastX })),
    static: r0.actors.every((a, i) => a.lastFrame === r1.actors[i].lastFrame && a.lastX === r1.actors[i].lastX)
  };
  await cr.close();

  R.pageerrors = pageerrors;
  R.warns = warns.slice(0, 12);
  fs.writeFileSync(path.join(OUT, 'audit_npc.json'), JSON.stringify(R, null, 2) + '\n');
  console.log('NPC props   :', R.inventory.npcProps.length);
  console.log('estaciones  :', R.inventory.stations.length, '| zonas oficiales:', R.inventory.hubAudit.zonesCount);
  console.log('V5          :', R.inventory.v5Count, '| canvas:', R.inventory.canvasCount);
  console.log('T07 actores :', R.inventory.t07.actors.length, R.inventory.t07audit.activities);
  console.log('ciclos      :', JSON.stringify(R.cycleSummary));
  console.log('reacciones  :', JSON.stringify(react.map(r => ({ l: r.label, v: r.react }))));
  console.log('reduced     :', R.reducedMotion.static, '| pageerrors:', pageerrors.length, '| warns:', R.warns.length);
  await c.close(); await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(2); });
