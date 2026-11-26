/* TANDA 08 · FASE 1 — Prueba de composición en el juego REAL.
 * Se ejecuta contra t08_composition.html (copia temporal del HTML activo con
 * el bloque TANDA08:COMPOSITION inyectado, SIN assets nuevos).
 * Valida geometría del cutaway, 5 planos, parallax, no solapamiento con la
 * superficie, A/B y expansión con el progreso real del descenso.
 */
const { chromium } = require('/tmp/qatools/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');
const OUT = path.resolve(__dirname, '../../ART_EVIDENCE/hub/tanda_08');
fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8123/t08_composition.html';

const checks = [];
const evidence = {};
function ck(id, name, ok, detail) {
  checks.push({ id, name, ok: !!ok, detail: detail === undefined ? null : detail });
  console.log((ok ? 'OK   ' : 'FAIL ') + id + ' · ' + name +
    (detail === undefined ? '' : ' · ' + JSON.stringify(detail).slice(0, 260)));
}
const lum = p => p.evaluate(() => {
  const cv = document.getElementById('game') || document.querySelector('canvas');
  const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  let s = 0, n = 0;
  for (let i = 0; i < d.length; i += 4 * 97) { s += (d[i] + d[i + 1] + d[i + 2]) / 3; n++; }
  return +(s / n).toFixed(2);
});
/* Muestra de píxeles de la franja del cutaway (y0..900, x 60..1220). */
const strip = p => p.evaluate(() => {
  const cv = document.getElementById('game') || document.querySelector('canvas');
  const cx = cv.getContext('2d');
  const y0 = Math.max(0, Math.round(window.__DDM_T08_COMPOSITION.debug().winTop));
  const h = Math.max(4, cv.height - y0);
  const d = cx.getImageData(60, y0, 1160, h).data;
  const a = [];
  for (let i = 0; i < d.length; i += 4 * 23) a.push(d[i], d[i + 1], d[i + 2]);
  return a;
});
function stripDiff(a, b) {
  let s = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) s += Math.abs(a[i] - b[i]);
  return +(s / Math.min(a.length, b.length)).toFixed(2);
}

(async () => {
  const b = await chromium.launch({
    executablePath: '/tmp/chromium', headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: '/tmp/chromelibs/lib:/tmp' },
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
           '--use-gl=swiftshader', '--disable-background-networking']
  });
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await c.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => {
    try { return ['applied', 'applied-with-errors'].includes(window.DMO_ART_PACK.state().status) && !!window.__DDM_T08_COMPOSITION; }
    catch (e) { return false; }
  }, { timeout: 90000 });
  await p.mouse.click(640, 450); await p.waitForTimeout(400);
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  await p.keyboard.down('Escape'); await p.waitForTimeout(1400); await p.keyboard.up('Escape');
  await p.waitForFunction(() => { try { return window.DMO_HUB.state().inHub; } catch (e) { return false; } }, { timeout: 30000 });
  await p.waitForTimeout(2400);

  const dbg = () => p.evaluate(() => window.__DDM_T08_COMPOSITION.debug());
  const boot = await p.evaluate(() => ({
    status: window.DMO_ART_PACK.state().status,
    v5: Object.keys(window.__DDM_V5_IMG || {}).length,
    canvases: document.querySelectorAll('canvas').length,
    planes: window.__DDM_T08_COMPOSITION.planes.map(x => ({ id: x.id, d: x.d, factor: x.factor, alpha: x.alpha }))
  }));
  evidence.boot = boot;
  ck('C-01', 'el prototipo no toca el registro V5 ni añade canvas',
     boot.status === 'applied' && boot.v5 === 168 && boot.canvases === 27, boot);
  ck('C-02', '5 planos de profundidad definidos con factores decrecientes',
     boot.planes.length === 5 && boot.planes.every((x, i, a) => i === 0 || x.factor < a[i - 1].factor),
     boot.planes);

  /* ---- geometría en 8 posiciones de cámara ---- */
  const spots = [
    ['00_centro', 1250, 975], ['01_aproximacion', 1250, 1100], ['02_borde_sur', 1250, 1195],
    ['03_sur_izq', 883, 1195], ['04_sur_der', 1617, 1195], ['05_norte', 1250, 655],
    ['06_oeste', 883, 975], ['07_este', 1617, 975]
  ];
  const geoms = [];
  for (const [id, x, y] of spots) {
    await p.evaluate(([a, b]) => window.DMO.debug.teleport(a, b), [x, y]);
    await p.waitForTimeout(360);
    const d = await dbg();
    geoms.push({ id, req: [x, y], d });
    if (['02_borde_sur', '03_sur_izq', '04_sur_der', '00_centro'].includes(id)) {
      await p.screenshot({ path: path.join(OUT, 'composition_ON_' + id + '.png') });
      await p.evaluate(() => { window.__DDM_HUB_T08 = false; });
      await p.waitForTimeout(220);
      await p.screenshot({ path: path.join(OUT, 'composition_OFF_' + id + '.png') });
      await p.evaluate(() => { window.__DDM_HUB_T08 = true; });
      await p.waitForTimeout(220);
    }
  }
  evidence.geoms = geoms;
  const south = geoms.find(g => g.id === '02_borde_sur').d;
  ck('C-03', 'en el borde sur el cutaway es visible y tiene altura útil',
     south.visible === true && south.winH >= 70,
     { visible: south.visible, winTop: south.winTop, winH: south.winH });
  ck('C-04', 'los 5 planos quedan DEBAJO del borde (no tapan superficie transitable)',
     south.boxes.every(x => x.y >= south.winTop - 0.6),
     south.boxes.map(x => ({ id: x.id, y: x.y, h: x.h })));
  ck('C-05', 'planos ordenados en profundidad, altura y contraste decrecientes',
     south.boxes.every((x, i, a) => i === 0 || (x.y > a[i - 1].y && x.h <= a[i - 1].h + 0.6 && x.alpha < a[i - 1].alpha)),
     south.boxes.map(x => ({ id: x.id, y: x.y, h: +x.h.toFixed(1), alpha: x.alpha })));
  ck('C-06', 'ningún plano flota: todos terminan dentro del trapezoide',
     south.boxes.every(x => x.y + x.h <= 900 + 45),
     south.boxes.map(x => +((x.y + x.h)).toFixed(1)));
  const li = geoms.find(g => g.id === '03_sur_izq').d;
  const ld = geoms.find(g => g.id === '04_sur_der').d;
  const disp = south.boxes.map((x, i) => +(Math.abs(li.boxes[i].dx - ld.boxes[i].dx)).toFixed(1));
  ck('C-07', 'parallax coherente: el desplazamiento disminuye con la distancia',
     disp.every((v, i) => i === 0 || v <= disp[i - 1] + 0.01) && disp[0] > disp[4] * 3,
     { deltaCamX: 734, displacement: disp });
  const center = geoms.find(g => g.id === '00_centro').d;
  ck('C-08', 'en el centro del HUB el cutaway queda fuera de pantalla (sin intrusión)',
     center.winTop > 900 && !center.visible,
     { winTop: center.winTop, visible: center.visible });
  ck('C-09', '0 errores del prototipo en las 8 posiciones',
     geoms.every(g => (g.d.error || []).length === 0) && errs.length === 0,
     { proto: geoms.flatMap(g => g.d.error || []), page: errs });

  /* ---- A/B LOCALIZADO en la franja del cutaway ---- */
  await p.evaluate(([x, y]) => window.DMO.debug.teleport(x, y), [1250, 1195]);
  await p.waitForTimeout(350);
  const lumON = await lum(p);
  const stripON = await strip(p);
  await p.evaluate(() => { window.__DDM_HUB_T08 = false; });
  await p.waitForTimeout(220);
  const lumOFF = await lum(p);
  const stripOFF = await strip(p);
  await p.evaluate(() => { window.__DDM_HUB_T08 = true; });
  const sd = stripDiff(stripON, stripOFF);
  evidence.luminance = { on: lumON, off: lumOFF, stripDiff: sd };
  ck('C-10', 'A/B cambia la franja del abismo de forma medible y sin pantalla negra',
     sd > 3 && Math.min(lumON, lumOFF) > 12, evidence.luminance);

  /* ---- Animación REAL de las brasas (no basta con que se dibujen) ---- */
  await p.waitForTimeout(200);
  const e0 = await dbg();
  await p.waitForTimeout(900);
  const e1 = await dbg();
  const moved = e0.embers.filter((e, i) => Math.abs(e.y - e1.embers[i].y) > 1 || e.t !== e1.embers[i].t).length;
  const confined = e1.embers.every(e => e.y >= e1.winTop - 2 || e.y === 0);
  evidence.embers = { t0: e0.clock, t1: e1.clock, moved, confined, sample0: e0.embers, sample1: e1.embers };
  ck('C-16', 'las brasas se ANIMAN (posición/t cambian) y quedan confinadas al abismo',
     e1.clock > e0.clock && moved >= 6 && confined,
     { clock: [e0.clock, e1.clock], moved, confined });

  /* ---- descenso: expansión gobernada por shaftOpen real ---- */
  const started = await p.evaluate(() => { try { return window.DMO_HUB.startCampaignFromHub(0); } catch (e) { return 'ERR'; } });
  const descent = [];
  for (let i = 0; i < 16; i++) {
    const s = await p.evaluate(() => ({
      d: window.__DDM_T08_COMPOSITION.debug(),
      f: window.DMO_FLOOR_ANIM.state(), hub: window.DMO_HUB.state()
    }));
    const L = await lum(p);
    descent.push({ i, expand: s.d.expand, winTop: s.d.winTop, winH: s.d.winH,
      visible: s.d.visible, stairP: s.f.stairP, shaftOpen: s.f.shaftOpen,
      phase: s.f.phase, loc: s.hub.location, lum: L });
    if ([2, 6, 10, 14].includes(i)) await p.screenshot({ path: path.join(OUT, 'composition_descenso_' + i + '.jpg'), type: 'jpeg', quality: 84 });
    await p.waitForTimeout(190);
  }
  evidence.descent = { started, samples: descent };
  const maxExpand = Math.max(...descent.map(d => d.expand));
  const maxWin = Math.max(...descent.map(d => d.winH));
  ck('C-11', 'el descenso abre el abismo con shaftOpen real (sin temporizador nuevo)',
     started === true && maxExpand > 160 && maxWin > south.winH + 160,
     { started, maxExpand, maxWin, normalWinH: south.winH });
  ck('C-12', 'ningún fotograma negro durante la expansión',
     Math.min(...descent.map(d => d.lum)) > 12,
     { min: Math.min(...descent.map(d => d.lum)) });
  ck('C-13', 'el cutaway se retira al cargar CAMPAIGN_ROOM (no tapa LIMBO)',
     descent.filter(d => d.loc === 'CAMPAIGN_ROOM').every(d => d.visible === false),
     descent.filter(d => d.loc === 'CAMPAIGN_ROOM').map(d => ({ i: d.i, visible: d.visible })));
  ck('C-14', '0 pageerror en toda la prueba de composición', errs.length === 0, errs);

  /* ---- movimiento reducido ---- */
  const rctx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const rp = await rctx.newPage();
  const rerrs = []; rp.on('pageerror', e => rerrs.push(String(e)));
  await rp.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await rp.waitForFunction(() => { try { return window.DMO_ART_PACK.state().status === 'applied' && !!window.__DDM_T08_COMPOSITION; } catch (e) { return false; } }, { timeout: 90000 });
  await rp.mouse.click(640, 450); await rp.waitForTimeout(400);
  await rp.keyboard.press('Enter'); await rp.waitForTimeout(400);
  await rp.keyboard.down('Escape'); await rp.waitForTimeout(1400); await rp.keyboard.up('Escape');
  await rp.waitForFunction(() => { try { return window.DMO_HUB.state().inHub; } catch (e) { return false; } }, { timeout: 30000 });
  await rp.waitForTimeout(2200);
  await rp.evaluate(() => window.DMO.debug.teleport(1250, 1195));
  await rp.waitForTimeout(350);
  const rd = await rp.evaluate(() => window.__DDM_T08_COMPOSITION.debug());
  evidence.reduced = rd;
  ck('C-15', 'Yc.reduced detectado y geometría estable', rd.reduced === true && rd.visible === true && rerrs.length === 0,
     { reduced: rd.reduced, visible: rd.visible, errs: rerrs });
  await rctx.close();

  await c.close(); await b.close();
  const ok = checks.filter(x => x.ok).length;
  const report = { generatedAt: new Date().toISOString(),
    phase: 'F1 · prueba de composición (SIN assets)', url: URL,
    total: checks.length, passed: ok, failed: checks.length - ok,
    verdict: ok === checks.length ? 'APROBADA' : 'REVISAR',
    checks, evidence };
  fs.writeFileSync(path.join(OUT, 'composition_proof.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('\n===== COMPOSICIÓN ' + ok + '/' + checks.length + ' · ' + report.verdict + ' =====');
  process.exit(ok === checks.length ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
