/* Sonda de rendimiento: aisla el coste de __T3B.setEnabled(true) en la build activa.
 * Solo lectura + toggle del flag VISUAL ya existente. No modifica archivos del juego.
 */
const { launch, attach, newLog } = require(process.env.QA_LIB || '/home/user/qa_tools/lib');
const fs = require('fs');
const OUT = '/home/user/DEADBEAT_DISCO/ART_EVIDENCE/tanda_01';
const URL = 'http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html';

(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const log = newLog(); attach(page, log);
  await page.addInitScript(() => {
    window.__qf = 0; const l = () => { window.__qf++; requestAnimationFrame(l); }; requestAnimationFrame(l);
  });
  await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await page.waitForTimeout(1500);
  await page.mouse.click(640, 450); await page.waitForTimeout(600);
  await page.keyboard.press('Enter'); await page.waitForTimeout(900);
  await page.keyboard.down('Escape'); await page.waitForTimeout(2800);
  await page.keyboard.up('Escape'); await page.waitForTimeout(600);

  async function measure(label, enabled) {
    await page.evaluate(v => window.__T3B.setEnabled(v), enabled);
    await page.waitForTimeout(400);
    const r = await page.evaluate(async () => {
      const f0 = window.__qf, t0 = performance.now();
      window.DMO.debug.tick(0.016, 30);
      const t1 = performance.now();
      await new Promise(r => setTimeout(r, 1000));
      return { tickMs: +(t1 - t0).toFixed(1), framesIn1s: window.__qf - f0,
               draws: window.__T3B.draws.slice(-6), enabled: window.__T3B.enabled,
               ready: window.__T3B.ready.slice(), errors: window.__T3B.errors.slice() };
    });
    console.log(label, JSON.stringify(r));
    return r;
  }
  const out = { url: URL, measures: [] };
  out.measures.push({ label: 'enabled=true (paquete aplicado)', ...await measure('TRUE ', true) });
  out.measures.push({ label: 'enabled=false (pintor original)', ...await measure('FALSE', false) });
  out.measures.push({ label: 'enabled=true (segunda vez)', ...await measure('TRUE2', true) });
  out.pageerrors = log.pageerrors.length;
  out.consoleErrors = log.console.filter(c => c.type === 'error').map(c => c.text.slice(0, 150));
  fs.writeFileSync(OUT + '/perf_probe.json', JSON.stringify(out, null, 2));
  await ctx.close(); await browser.close();
})().catch(e => { console.error('FALLO', e.message); process.exit(1); });
