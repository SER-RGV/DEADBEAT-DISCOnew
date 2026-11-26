/* Fase 1 · Tanda 02 — validación real en Chromium headless (Playwright + CDP).
 *
 * Compara la build ORIGINAL con la build ACTIVA (Tanda 01 + arquitectura
 * modular Tanda 02) en el mismo estado: HUB -> campaña r0 -> movimiento,
 * disparo, proyectil del jugador y comportamiento de puertas.
 *
 * ADEMÁS hace un A/B en la MISMA build, mismo frame y mismos parámetros, con
 * DMO_ART_PACK.restore() / .apply(): aísla exclusivamente el efecto de T02.
 *
 * Las capturas son del juego real (Page.captureScreenshot). No se simulan
 * pruebas manuales ni se generan capturas sintéticas.
 *
 * Uso: QA_LIB=/home/user/qa_tools/lib node ART_TOOLS/qa/validate_tanda_02.js
 * Requiere servidor HTTP en 127.0.0.1:8123 sirviendo la raíz del repo.
 */
const { launch, attach, newLog, shot } = require(process.env.QA_LIB || '/home/user/qa_tools/lib');
const fs = require('fs'), path = require('path');
const OUT = '/home/user/DEADBEAT_DISCO/ART_EVIDENCE/tanda_02';
const DIRS = ['before', 'after', 'modular_connections', 'doors', 'gameplay', 'logs'];
DIRS.forEach(d => fs.mkdirSync(path.join(OUT, d), { recursive: true }));

const BUILDS = [
  { name: 'before', url: 'http://127.0.0.1:8123/v9_t3_fase1b_cache_probe.html' },
  { name: 'after', url: 'http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html' }
];

function initScript() {
  window.__qaFrames = 0;
  window.__qaWa = null;
  window.__qaBullets = [];
  const loop = () => { window.__qaFrames++; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  /* Solo lectura: detecta el proyectil del JUGADOR (array `wa`), NO `Ia`
     (proyectiles enemigos). Firma weaponSerial + accuracyCohort creada en wd(). */
  const origPush = Array.prototype.push;
  Array.prototype.push = function () {
    for (let i = 0; i < arguments.length; i++) {
      const v = arguments[i];
      if (v && typeof v === 'object' && ('weaponSerial' in v) && ('accuracyCohort' in v)) {
        window.__qaWa = this;
        window.__qaBullets.push({ t: Date.now(), x: Math.round(v.x), y: Math.round(v.y),
                                 serial: v.weaponSerial, arrLen: this.length });
      }
    }
    return origPush.apply(this, arguments);
  };
}

const PROBE = `(()=>{
 const W=window, safe=f=>{try{return f()}catch(e){return 'ERR:'+e.message}};
 const ap=safe(()=>W.DMO_ART_PACK&&W.DMO_ART_PACK.state());
 const ig=safe(()=>W.DMO_ART_PACK&&W.DMO_ART_PACK.integrity());
 const ar=safe(()=>W.DMO_ART_PACK&&W.DMO_ART_PACK.architecture());
 const v5=safe(()=>{const s=W.DMO_REFERENCE_ROOM_ASSETS.state();
   return {ready:Object.keys(s.v5Ready).filter(k=>s.v5Ready[k]).length,
           total:Object.keys(s.v5Ready).length,errors:s.errors.slice()}});
 const ilt=safe(()=>W.DMO_ILT.audit());
 const t3=safe(()=>({enabled:W.__T3B.enabled,draws:W.__T3B.draws.slice(-8)}));
 const dungeon=safe(()=>W.DMO_DUNGEON.state());
 const st=safe(()=>W.DMO.debug.state());
 const ts=safe(()=>W.DMO.testStats());
 return {ts:Date.now(),artPack:ap,integrity:ig,architecture:ar,v5:v5,ilt:ilt,t3b:t3,
   hub:safe(()=>W.DMO_HUB.state()),
   dungeon:dungeon&&dungeon.current?{current:dungeon.current,role:dungeon.role,
     floor:dungeon.floor,secured:dungeon.secured,inHub:dungeon.inHub,
     nodes:dungeon.graph&&dungeon.graph.nodes?dungeon.graph.nodes.length:null}:dungeon,
   camera:safe(()=>W.DMO.camera()),
   player:(st&&st.px!=null)?{px:st.px,py:st.py,enemies:st.enemies,
     balas:st.balas,lives:st.lives}:null,
   shotsFired:ts&&ts.shotsFired!=null?ts.shotsFired:null,
   frames:W.__qaFrames||0, waLen:W.__qaWa?W.__qaWa.length:null,
   bulletsSeen:(W.__qaBullets||[]).length};
})()`;

async function bootToHub(page) {
  await page.mouse.click(640, 450);
  await page.waitForTimeout(600);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
  await page.keyboard.down('Escape');
  await page.waitForTimeout(2800);
  await page.keyboard.up('Escape');
  await page.waitForTimeout(600);
}

async function startCampaign(page) {
  const r = await page.evaluate(() => String(window.DMO_HUB.startCampaignFromHub(0)));
  let completed = false, polls = 0;
  const t0 = Date.now();
  for (let i = 0; i < 90; i++) {
    try { await page.evaluate(() => window.DMO.debug.tick(0.016, 30)); } catch (_) {}
    await page.waitForTimeout(300);
    polls++;
    const h = await page.evaluate(() => {
      try { return window.DMO_HUB.state(); } catch (e) { return null; }
    });
    if (h && h.location === 'CAMPAIGN_ROOM' && h.inHub === false &&
        h.transitionLock === false && h.transitionsCompleted >= 1) { completed = true; break; }
  }
  return { started: r, completed, polls, ms: Date.now() - t0 };
}

async function run(browser, cfg) {
  const log = newLog();
  log.build = cfg.name; log.url = cfg.url;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  attach(page, log);
  await page.addInitScript(initScript);
  const t0 = Date.now();
  await page.goto(cfg.url, { waitUntil: 'load', timeout: 180000 });
  log.loadMs = Date.now() - t0;
  await page.waitForTimeout(1600);
  await bootToHub(page);

  /* --- HUB ------------------------------------------------------------- */
  log.hubShotBytes = await shot(page, path.join(OUT, cfg.name, '01_hub.png'));
  log.probeHub = await page.evaluate(PROBE);

  /* --- sala real de campaña -------------------------------------------- */
  log.campaign = await startCampaign(page);
  log.roomShotBytes = await shot(page, path.join(OUT, cfg.name, '02_room.png'));
  log.probeRoom = await page.evaluate(PROBE);

  /* --- A/B en la MISMA build: unica diferencia = familia modular T02 ---
     (solo existe en la build activa; en la original se registra como NO
     APLICABLE, no se simula). */
  log.abSameBuild = { applicable: false };
  if (cfg.name === 'after') {
    const on = await page.evaluate(() => window.DMO_ART_PACK.architecture());
    const off = await page.evaluate(() => {
      const n = window.DMO_ART_PACK.restore();
      return { restored: n, arch: window.DMO_ART_PACK.architecture() };
    });
    await page.waitForTimeout(350);
    const offBytes = await shot(page, path.join(OUT, 'before', '03_room_modules_off.png'));
    const back = await page.evaluate(() => {
      const n = window.DMO_ART_PACK.apply();
      return { applied: n, arch: window.DMO_ART_PACK.architecture() };
    });
    await page.waitForTimeout(350);
    const onBytes = await shot(page, path.join(OUT, 'after', '03_room_modules_on.png'));
    log.abSameBuild = {
      applicable: true,
      onApplied: on.applied, offApplied: off.arch.applied,
      restoredSlots: off.restored, reappliedSlots: back.applied,
      onAgainApplied: back.arch.applied,
      offShotBytes: offBytes, onShotBytes: onBytes,
      offErrors: off.arch.errors, onErrors: back.arch.errors
    };
  }

  /* --- vista general de conexiones (captura real de la sala) ----------- */
  log.connectionsShotBytes = await shot(page,
    path.join(OUT, 'modular_connections', cfg.name + '_overview.png'));

  /* --- puerta CERRADA: sala sin despejar => Ot.openT = 0 --------------- */
  log.doorsClosedShotBytes = await shot(page,
    path.join(OUT, 'doors', cfg.name + '_closed.png'));
  log.doorStateClosed = await page.evaluate(() => {
    const s = window.DMO.debug.state();
    return { enemies: s.enemies, room: s.round, note: 'sala sin despejar: Bg usa t=0' };
  });

  /* --- puerta ABIERTA: se usa la API de depuración PROPIA del juego
     (DMO.debug.clearRound) y se deja que el motor actualice Ot.openT con
     sus ticks. NO se modifica la lógica de apertura. --------------------- */
  log.clearRound = await page.evaluate(() => {
    try { return String(window.DMO.debug.clearRound()); } catch (e) { return 'ERR:' + e.message; }
  });
  for (let i = 0; i < 12; i++) {
    try { await page.evaluate(() => window.DMO.debug.tick(0.016, 30)); } catch (_) {}
    await page.waitForTimeout(140);
  }
  log.doorsOpenShotBytes = await shot(page,
    path.join(OUT, 'doors', cfg.name + '_open.png'));
  log.doorStateOpen = await page.evaluate(() => {
    const s = window.DMO.debug.state();
    const d = window.DMO_DUNGEON.state();
    return { enemies: s.enemies, room: s.round,
             secured: Array.isArray(d.secured) ? d.secured.length : d.secured,
             note: 'tras clearRound + ticks del motor: Bg usa t=openT/.8' };
  });

  /* --- rendimiento: mismo método y mismos parámetros en ambas builds --- */
  log.performance = await page.evaluate(async () => {
    const f0 = window.__qaFrames || 0;
    const a = performance.now();
    try { window.DMO.debug.tick(0.016, 30); } catch (_) {}
    const tickMs = +(performance.now() - a).toFixed(1);
    await new Promise(r => setTimeout(r, 2000));
    return { tick30Ms: tickMs, framesIn2s: (window.__qaFrames || 0) - f0,
             fps: +(((window.__qaFrames || 0) - f0) / 2).toFixed(1) };
  });

  /* --- regresión funcional (mismos parámetros que Tanda 01) ------------ */
  const stats = () => page.evaluate(() => {
    const s = window.DMO.testStats(); const d = window.DMO.debug.state();
    return { shotsFired: s.shotsFired, kills: s.kills, score: s.score,
             bulletsCount: s.bulletsCount, px: d.px, py: d.py,
             enemies: d.enemies, lives: d.lives,
             waLen: window.__qaWa ? window.__qaWa.length : null,
             bulletsSeen: (window.__qaBullets || []).length };
  });
  const p0 = await stats();
  await page.keyboard.down('d');
  await page.waitForTimeout(900);
  try { await page.evaluate(() => window.DMO.debug.tick(0.016, 60)); } catch (_) {}
  await page.keyboard.up('d');
  await page.waitForTimeout(400);
  const p1 = await stats();
  await page.mouse.move(760, 420);
  await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up();
  await page.waitForTimeout(350);
  const p2 = await stats();
  log.regression = { p0, p1, p2,
    movementDelta: (p1.px != null && p0.px != null) ? +(p1.px - p0.px).toFixed(2) : null,
    shotDelta: (p2.shotsFired ?? 0) - (p1.shotsFired ?? 0),
    bulletsDelta: (p2.bulletsCount ?? 0) - (p1.bulletsCount ?? 0),
    waProjectilesDelta: (p2.bulletsSeen ?? 0) - (p1.bulletsSeen ?? 0) };
  log.gameplayShotBytes = await shot(page,
    path.join(OUT, 'gameplay', cfg.name + '_player.png'));
  log.probeFinal = await page.evaluate(PROBE);

  /* --- errores / recursos ---------------------------------------------- */
  log.consoleErrors = log.console.filter(c => c.type === 'error')
    .map(c => ({ text: c.text.slice(0, 160), url: c.location && c.location.url }));
  log.pageerrorCount = log.pageerrors.length;
  log.pageerrors = log.pageerrors.map(e => ({ message: e.message, stack: (e.stack || '').slice(0, 400) }));
  log.httpErrors = log.httpErrors.map(e => ({ status: e.status, url: e.url.slice(0, 130) }));
  log.requestfailed = log.requestfailed.map(e => ({ url: e.url.slice(0, 130), failure: e.failure }));
  log.artRequests = log.requests
    .filter(r => /ART_ASSETS\/tanda_02/.test(r.url))
    .map(r => ({ url: r.url.split('/').pop(), method: r.method }));
  log.artResponses = log.httpErrors.filter(e => /ART_ASSETS/.test(e.url));
  await ctx.close();
  return log;
}

(async () => {
  let browser;
  const all = { started: new Date().toISOString(), builds: [], viewport: [1280, 900],
                note: 'Chromium headless SwiftShader; sin GUI. Las capturas son del juego real.' };
  try {
    browser = await launch();
    for (const cfg of BUILDS) {
      console.log(`\n===== ${cfg.name.toUpperCase()} : ${cfg.url} =====`);
      const r = await run(browser, cfg);
      all.builds.push(r);
      console.log(' loadMs', r.loadMs, 'campaign', JSON.stringify(r.campaign),
        'pageerrors', r.pageerrorCount, 'consoleErrors', r.consoleErrors.length);
      console.log(' architecture', r.probeRoom.architecture && r.probeRoom.architecture.enabled,
        r.probeRoom.architecture ? r.probeRoom.architecture.applied + '/' + r.probeRoom.architecture.count : 'N/A');
      console.log(' A/B misma build', JSON.stringify(r.abSameBuild));
      console.log(' regression', JSON.stringify(r.regression));
      console.log(' performance', JSON.stringify(r.performance));
      console.log(' artRequests', r.artRequests.length, 'artHttpErrors', r.artResponses.length);
    }
    fs.writeFileSync(path.join(OUT, 'logs', 'validation.json'), JSON.stringify(all, null, 2));
    await browser.close();
    console.log('\nJSON:', path.join(OUT, 'logs', 'validation.json'));
  } catch (e) {
    console.log('FALLO:', e.message, (e.stack || '').split('\n').slice(0, 12).join('\n'));
    fs.writeFileSync(path.join(OUT, 'logs', 'validation_error.json'), JSON.stringify(all, null, 2));
    if (browser) await browser.close().catch(() => {});
    process.exit(1);
  }
})();
