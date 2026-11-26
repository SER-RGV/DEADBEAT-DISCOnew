/* Fase 1 · Tanda 01 — validación real en Chromium headless.
 * Compara la build ORIGINAL con la build ACTIVA con arte, en el mismo estado:
 * HUB -> campaña r0 -> movimiento + disparo. Guarda capturas y JSON.
 *
 * Uso: QA_LIB=/home/user/qa_tools/lib node ART_TOOLS/qa/validate_tanda_01.js
 * Requiere servidor HTTP en 127.0.0.1:8123 sirviendo la raíz del repo.
 */
const { launch, attach, newLog, shot } = require(process.env.QA_LIB || '/home/user/qa_tools/lib');
const fs = require('fs'), path = require('path');
const OUT = '/home/user/DEADBEAT_DISCO/ART_EVIDENCE/tanda_01';
fs.mkdirSync(OUT, { recursive: true });

const BUILDS = [
  { name: 'antes',   url: 'http://127.0.0.1:8123/v9_t3_fase1b_cache_probe.html' },
  { name: 'despues', url: 'http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html' }
];
if (process.env.REVERSE === '1') BUILDS.reverse();
/* roomCapture() es una función de DIAGNÓSTICO del motor (toDataURL de un canvas
 * grande). Con texturas detalladas su coste en SwiftShader es patológico y no
 * representa coste de juego: queda desactivada por defecto en la validación. */
const ROOM_CAPTURE = process.env.ROOM_CAPTURE === '1';

function initScript() {
  window.__qaFrames = 0;
  window.__qaWa = null;
  window.__qaBullets = [];
  const loop = () => { window.__qaFrames++; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  /* Instrumentación de SOLO LECTURA: detecta el proyectil del JUGADOR al entrar
     en el array del mundo `wa` (firma weaponSerial + accuracyCohort, creada en wd()). */
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
 const t3=safe(()=>({enabled:W.__T3B.enabled,ready:W.__T3B.ready.slice(),
   errors:W.__T3B.errors.slice(),draws:W.__T3B.draws.slice(-12),
   imgs:W.__T3B.images.map(i=>i&&i.naturalWidth?[i.naturalWidth,i.naturalHeight]:null)}));
 const v5=safe(()=>{const s=W.DMO_REFERENCE_ROOM_ASSETS.state();
   return {ready:Object.keys(s.v5Ready).filter(k=>s.v5Ready[k]).length,
           total:Object.keys(s.v5Ready).length,errors:s.errors.slice()}});
 const ilt=safe(()=>W.DMO_ILT.audit());
 const hd=safe(()=>({total:Object.keys(W.__HD_DATA).length,
   m1911:(W.__HD_DATA['weapons/weapon_m1911.png']||'').slice(0,90)}));
 return {ts:Date.now(),artPack:ap,integrity:ig,t3b:t3,v5:v5,ilt:ilt,hd:hd,
   hub:safe(()=>W.DMO_HUB.state()),dungeon:safe(()=>W.DMO_DUNGEON.state()),
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

async function saveDataUrl(page, file) {
  const d = await page.evaluate(() => {
    try {
      const api = window.__T3B || window.DMO_INFERNAL_ART;
      return api && typeof api.roomCapture === 'function' ? api.roomCapture() : null;
    } catch (e) { return null; }
  });
  if (!d || !d.startsWith('data:image/png;base64,')) return null;
  const buf = Buffer.from(d.split(',')[1], 'base64');
  fs.writeFileSync(file, buf);
  return buf.length;
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
  log.hubShotBytes = await shot(page, path.join(OUT, `${cfg.name}_01_hub.png`));

  log.probeHub = await page.evaluate(PROBE);
  log.roomCaptureEnabled = ROOM_CAPTURE;
  log.roomCaptureHub = ROOM_CAPTURE
    ? await saveDataUrl(page, path.join(OUT, `${cfg.name}_02_room_capture_hub.png`)) : null;

  log.startCampaign = await page.evaluate(() => String(window.DMO_HUB.startCampaignFromHub(0)));
  let completed = false, polls = 0;
  const tc0 = Date.now();
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
  log.campaign = { completed, polls, ms: Date.now() - tc0 };
  log.campaignShotBytes = await shot(page, path.join(OUT, `${cfg.name}_03_campaign.png`));
  log.roomCaptureCampaign = ROOM_CAPTURE
    ? await saveDataUrl(page, path.join(OUT, `${cfg.name}_04_room_capture_campaign.png`)) : null;
  log.probeCampaign = await page.evaluate(PROBE);

  /* Rendimiento en juego (sin funciones de diagnóstico): fotogramas rAF / 2 s
     y coste de 30 ticks de simulación. */
  log.performance = await page.evaluate(async () => {
    const f0 = window.__qaFrames || 0;
    const a = performance.now();
    try { window.DMO.debug.tick(0.016, 30); } catch (_) {}
    const tickMs = +(performance.now() - a).toFixed(1);
    await new Promise(r => setTimeout(r, 2000));
    return { tick30Ms: tickMs, framesIn2s: (window.__qaFrames || 0) - f0,
             fps: +(((window.__qaFrames || 0) - f0) / 2).toFixed(1),
             t3bEnabled: !!(window.__T3B && window.__T3B.enabled) };
  });

  /* Regresión funcional mínima: movimiento + disparo real (proyectil en wa) */
  const stats = () => page.evaluate(() => {
    const s = window.DMO.testStats(); const d = window.DMO.debug.state();
    return { shotsFired: s.shotsFired, kills: s.kills, score: s.score,
             bulletsCount: s.bulletsCount, px: d.px, py: d.py,
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
  log.afterActionsShotBytes = await shot(page, path.join(OUT, `${cfg.name}_05_after_actions.png`));

  log.consoleErrors = log.console.filter(c => c.type === 'error')
    .map(c => ({ text: c.text.slice(0, 160), url: c.location && c.location.url }));
  log.pageerrorCount = log.pageerrors.length;
  log.httpErrors = log.httpErrors.map(e => ({ status: e.status, url: e.url.slice(0, 130) }));
  log.requestfailed = log.requestfailed.map(e => ({ url: e.url.slice(0, 130), failure: e.failure }));
  await ctx.close();
  return log;
}

(async () => {
  let browser;
  const all = { started: new Date().toISOString(), builds: [], viewport: [1280, 900] };
  try {
    browser = await launch();
    for (const cfg of BUILDS) {
      console.log(`\n===== ${cfg.name.toUpperCase()} : ${cfg.url} =====`);
      const r = await run(browser, cfg);
      all.builds.push(r);
      console.log(' loadMs', r.loadMs, 'campaign', JSON.stringify(r.campaign),
        'pageerrors', r.pageerrorCount, 'consoleErrors', r.consoleErrors.length);
      console.log(' artPack', r.probeHub.artPack ? r.probeHub.artPack.status : 'NO (build original)');
      if (r.probeHub.integrity) console.log(' integrity', JSON.stringify(r.probeHub.integrity.assets.map(a =>
        ({ id: a.id, applied: a.applied, live: a.live, exact: a.exactSize }))));
      console.log(' regression', JSON.stringify(r.regression));
      console.log(' performance', JSON.stringify(r.performance));
    }
    fs.writeFileSync(path.join(OUT, process.env.REVERSE === '1' ? 'validation_reverse.json' : 'validation.json'),
                     JSON.stringify(all, null, 2));
    await browser.close();
    console.log('\nJSON:', path.join(OUT, 'validation.json'));
  } catch (e) {
    console.log('FALLO:', e.message, (e.stack || '').split('\n').slice(0, 12).join('\n'));
    fs.writeFileSync(path.join(OUT, 'validation_error.json'), JSON.stringify(all, null, 2));
    if (browser) await browser.close().catch(() => {});
    process.exit(1);
  }
})();
