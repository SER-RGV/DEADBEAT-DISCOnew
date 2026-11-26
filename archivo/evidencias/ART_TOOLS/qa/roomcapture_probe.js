/* Comprueba si __T3B.roomCapture() (usado por QA) explica el coste de transición. */
const { launch, attach, newLog } = require(process.env.QA_LIB || '/home/user/qa_tools/lib');
const fs = require('fs');
const OUT = '/home/user/DEADBEAT_DISCO/ART_EVIDENCE/tanda_01';
const URL = 'http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html';

(async () => {
  const browser = await launch();
  const res = { runs: [] };
  for (const useCapture of [false, true]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage(); const log = newLog(); attach(page, log);
    await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
    await page.waitForTimeout(1500);
    await page.mouse.click(640, 450); await page.waitForTimeout(600);
    await page.keyboard.press('Enter'); await page.waitForTimeout(900);
    await page.keyboard.down('Escape'); await page.waitForTimeout(2800);
    await page.keyboard.up('Escape'); await page.waitForTimeout(600);
    let captureMs = null, captureBytes = 0;
    if (useCapture) {
      const t = Date.now();
      captureBytes = await page.evaluate(() => window.__T3B.roomCapture().length);
      captureMs = Date.now() - t;
    }
    await page.evaluate(() => window.DMO_HUB.startCampaignFromHub(0));
    const t0 = Date.now(); let polls = 0, done = false, slow = [];
    for (let i = 0; i < 40; i++) {
      const a = Date.now();
      await page.evaluate(() => window.DMO.debug.tick(0.016, 30));
      const ems = Date.now() - a;
      await page.waitForTimeout(300); polls++;
      const h = await page.evaluate(() => window.DMO_HUB.state());
      slow.push(ems);
      if (h.location === 'CAMPAIGN_ROOM' && !h.transitionLock && h.transitionsCompleted >= 1) { done = true; break; }
    }
    const r = { useCapture, captureMs, captureBytes, campaignMs: Date.now() - t0,
                polls, done, maxEvaluateMs: Math.max(...slow),
                meanEvaluateMs: +(slow.reduce((x, y) => x + y, 0) / slow.length).toFixed(1),
                pageerrors: log.pageerrors.length };
    console.log(JSON.stringify(r));
    res.runs.push(r);
    await ctx.close();
  }
  fs.writeFileSync(OUT + '/roomcapture_probe.json', JSON.stringify(res, null, 2));
  await browser.close();
})().catch(e => { console.error('FALLO', e.message); process.exit(1); });
