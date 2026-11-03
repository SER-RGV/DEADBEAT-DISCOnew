/* Aísla el coste de la transición: mide cada poll con __T3B.enabled true/false.
 * Solo lectura + toggle del flag visual del motor. */
const { launch, attach, newLog } = require(process.env.QA_LIB || '/home/user/qa_tools/lib');
const fs = require('fs');
const OUT = '/home/user/DEADBEAT_DISCO/ART_EVIDENCE/tanda_01';
const URL = 'http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html';

(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const log = newLog(); attach(page, log);
  await page.addInitScript(() => { window.__qf = 0; const l = () => { window.__qf++; requestAnimationFrame(l); }; requestAnimationFrame(l); });
  await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await page.waitForTimeout(1500);
  await page.mouse.click(640, 450); await page.waitForTimeout(600);
  await page.keyboard.press('Enter'); await page.waitForTimeout(900);
  await page.keyboard.down('Escape'); await page.waitForTimeout(2800);
  await page.keyboard.up('Escape'); await page.waitForTimeout(600);

  const out = { url: URL, polls: [], pageerrors: 0 };
  await page.evaluate(() => window.DMO_HUB.startCampaignFromHub(0));
  for (let i = 0; i < 26; i++) {
    if (i === 13) await page.evaluate(() => window.__T3B.setEnabled(false));
    const t0 = Date.now();
    const tick = await page.evaluate(() => {
      const a = performance.now(); window.DMO.debug.tick(0.016, 30);
      return +(performance.now() - a).toFixed(1);
    });
    const stateMs = Date.now() - t0;
    await page.waitForTimeout(300);
    const s = await page.evaluate(() => ({
      hub: window.DMO_HUB.state(), frames: window.__qf, enabled: window.__T3B.enabled,
      floor: window.DMO_CINE.state()
    }));
    out.polls.push({ i, enabled: s.enabled, tickMs: tick, evaluateMs: stateMs,
                     frames: s.frames, loc: s.hub.location,
                     tc: s.hub.transitionsCompleted, lock: s.hub.transitionLock,
                     floorPhase: s.floor && s.floor.phase, floorStage: s.floor && s.floor.stage });
    console.log(i, 'en=' + s.enabled, 'tick', tick, 'evalMs', stateMs,
                'loc', s.hub.location, 'tc', s.hub.transitionsCompleted,
                'phase', s.floor && s.floor.phase, 'frames', s.frames);
    if (s.hub.location === 'CAMPAIGN_ROOM' && !s.hub.transitionLock && s.hub.transitionsCompleted >= 1) break;
  }
  out.pageerrors = log.pageerrors.length;
  fs.writeFileSync(OUT + '/transition_probe.json', JSON.stringify(out, null, 2));
  await ctx.close(); await browser.close();
})().catch(e => { console.error('FALLO', e.message); process.exit(1); });
