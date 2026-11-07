/* TANDA 08 · FASE 0 — Auditoría global del HUB T01-T07.
 * Requiere /tmp/qatools/node_modules/playwright-core y Chromium 131.
 * NO modifica el juego: sólo teletransporte de QA y capturas.
 * Salida: ART_EVIDENCE/hub/tanda_08/audit_global.json + audit_*.jpg
 */
const { chromium } = require('/tmp/qatools/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');
const OUT = path.resolve(__dirname, '../../ART_EVIDENCE/hub/tanda_08');
fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8123/';

(async () => {
  const b = await chromium.launch({
    executablePath: '/tmp/chromium', headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: '/tmp/chromelibs/lib:/tmp' },
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
           '--use-gl=swiftshader', '--disable-background-networking']
  });
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await c.newPage();
  const errs = [], warns = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') warns.push(m.type() + ':' + m.text().slice(0, 140)); });
  await p.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => {
    try { return ['applied', 'applied-with-errors'].includes(window.DMO_ART_PACK.state().status); }
    catch (e) { return false; }
  }, { timeout: 90000 });

  const boot = await p.evaluate(() => {
    const W = window, P = W.DMO_ART_PACK;
    const pick = o => ({ version: o && o.version, count: o && o.count,
      loaded: o && o.loaded, registered: o && o.registered, enabled: o && o.enabled,
      errors: o && (o.errors || []).length });
    return {
      pack: { status: P.state().status, version: P.state().version,
        t01: pick(P.hub()), t02: pick(P.hub2()), t03: pick(P.hub3()),
        t05: pick(P.hub5()), t06: pick(P.hub6()), t07: pick(P.hub7()) },
      v5Keys: Object.keys(W.__DDM_V5_IMG || {}).length,
      h07: Object.keys(W.__DDM_V5_IMG || {}).filter(k => k.startsWith('h07_')),
      canvases: document.querySelectorAll('canvas').length,
      canvasIds: [...document.querySelectorAll('canvas')].map(x => x.id || '(sin id)').slice(0, 32),
      globals: Object.keys(W).filter(k => /^DMO|^__DDM|^DMO_/.test(k)).length,
      atmos: W.DMO_ATMOS && W.DMO_ATMOS.audit ? W.DMO_ATMOS.audit() : null,
      music: W.DMO_MUSIC ? W.DMO_MUSIC.state() : null,
      hubAudit: W.DMO_HUB.audit(),
      floor: W.DMO_FLOOR_ANIM ? W.DMO_FLOOR_ANIM.state() : null,
      t07: W.DMO_HUB_T07.state()
    };
  });

  /* Secuencia de arranque validada en F0/T07 */
  await p.mouse.click(640, 450); await p.waitForTimeout(400);
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  await p.keyboard.down('Escape'); await p.waitForTimeout(1400); await p.keyboard.up('Escape');
  await p.waitForFunction(() => { try { return window.DMO_HUB.state().inHub; } catch (e) { return false; } }, { timeout: 30000 });
  await p.waitForTimeout(2400);

  /* Malla de posiciones de cámara: centro, aproximación, borde sur, laterales. */
  const spots = [
    { id: '00_centro', x: 1250, y: 975 },
    { id: '01_aproximacion', x: 1250, y: 1100 },
    { id: '02_borde_sur', x: 1250, y: 1195 },
    { id: '03_sur_izq', x: 883, y: 1195 },
    { id: '04_sur_der', x: 1617, y: 1195 },
    { id: '05_norte', x: 1250, y: 655 },
    { id: '06_zona_oeste', x: 883, y: 975 },
    { id: '07_zona_este', x: 1617, y: 975 }
  ];
  const cameras = [];
  for (const s of spots) {
    await p.evaluate(([x, y]) => window.DMO.debug.teleport(x, y), [s.x, s.y]);
    await p.waitForTimeout(420);
    const st = await p.evaluate(() => {
      const W = window;
      return { camera: W.DMO.camera(), observe: W.DMO.observe ? Object.keys(W.DMO.observe()) : null,
        view: W.DMO.observe ? W.DMO.observe().view : null,
        hub: W.DMO_HUB.state(), t07counts: W.DMO_HUB_T07.state().counts };
    });
    await p.screenshot({ path: path.join(OUT, 'audit_' + s.id + '.jpg'), type: 'jpeg', quality: 84 });
    cameras.push(Object.assign({ id: s.id, requested: [s.x, s.y] }, st));
  }

  /* Perfil de la transición de descenso T07 (sin assets T08 todavía). */
  await p.evaluate(([x, y]) => window.DMO.debug.teleport(x, y), [1250, 1195]);
  await p.waitForTimeout(300);
  const descentStart = await p.evaluate(() => { try { return window.DMO_HUB.startCampaignFromHub(0); } catch (e) { return 'ERR ' + e; } });
  const descent = [];
  for (let i = 0; i < 16; i++) {
    const s = await p.evaluate(() => {
      const W = window;
      return { cam: W.DMO.camera(), floor: W.DMO_FLOOR_ANIM.state(),
        hub: W.DMO_HUB.state(), t07: W.DMO_HUB_T07.state().counts,
        music: W.DMO_MUSIC.state().state };
    });
    descent.push({ i, cam: s.cam, phase: s.floor.phase, stage: s.floor.stage,
      stairP: s.floor.stairP, shaftOpen: s.floor.shaftOpen,
      loc: s.hub.location, lock: s.hub.transitionLock, t07screen: s.t07.descentScreen,
      music: s.music });
    if ([1, 5, 9, 13].includes(i)) await p.screenshot({ path: path.join(OUT, 'audit_descenso_' + i + '.jpg'), type: 'jpeg', quality: 84 });
    await p.waitForTimeout(190);
  }

  const out = { generatedAt: new Date().toISOString(), phase: 'F0 · auditoría global T01-T07',
    boot, cameras, descentStart, descent, pageerrors: errs, warns };
  fs.writeFileSync(path.join(OUT, 'audit_global.json'), JSON.stringify(out, null, 2) + '\n');
  console.log('pack', boot.pack.status, boot.pack.version);
  console.log('v5', boot.v5Keys, 'canvases', boot.canvases, 'atmos degraded', boot.atmos && boot.atmos.degraded);
  console.log('camaras', cameras.map(c => c.id + ':' + JSON.stringify(c.camera)).join(' | ').slice(0, 900));
  console.log('descenso', descent.map(d => d.phase + '/' + d.stairP).join(' '));
  console.log('pageerrors', errs.length, 'warns', warns.length);
  await c.close(); await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
