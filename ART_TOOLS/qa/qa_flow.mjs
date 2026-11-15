/* TOTAL ART REBUILD — harness de QA headless (2026-11-15)
   Requiere: npm i playwright-core @sparticuz/chromium (registry.npmjs.org) y un
   servidor estático sirviendo la raíz del repo en :8123 (python3 -m http.server).
   En CI/ren local con Chromium de sistema, sustituir el bloque sparticuz por
   pw.launch({ executablePath }). Ver ART_EVIDENCE/TOTAL_REBUILD/README.md. */
import chromium, { inflate, setupLambdaEnvironment } from '@sparticuz/chromium';
import { chromium as pw } from 'playwright-core';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = '/home/user/DEADBEAT-DISCOnew/ART_EVIDENCE/TOTAL_REBUILD';
mkdirSync(OUT, { recursive: true });

const binDir = '/tmp/qa_browser/node_modules/@sparticuz/chromium/bin';
await inflate(join(binDir, 'al2023.tar.br'));
await inflate(join(binDir, 'fonts.tar.br'));
setupLambdaEnvironment(join(tmpdir(), 'al2023', 'lib'));
const executablePath = await chromium.executablePath();

const browser = await pw.launch({
  args: [...chromium.args, '--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  executablePath, headless: true, env: process.env,
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const consoleMsgs = [], pageErrors = [], failedReqs = [];
page.on('console', m => consoleMsgs.push({ type: m.type(), text: m.text().slice(0, 300) }));
page.on('pageerror', e => pageErrors.push(String(e).slice(0, 500)));
page.on('requestfailed', r => failedReqs.push({ url: r.url().slice(0, 200), err: String(r.failure()?.errorText || '') }));
page.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) failedReqs.push({ url: r.url().slice(0, 200), status: r.status() }); });

const log = [];
const state = () => page.evaluate(() => ({
  menuVisible: !!(document.querySelector('#dd-menu-nav .dd-menu-btn[data-action="new"]') && document.querySelector('#dd-menu-nav') && getComputedStyle(document.querySelector('#dd-menu-nav')).display !== 'none' && document.querySelector('#dd-menu-nav .dd-menu-btn[data-action="new"]').offsetParent !== null),
  hubActive: !!(window.DD_HUB && window.DD_HUB.isActive && window.DD_HUB.isActive()),
  hubState: window.DD_HUB && window.DD_HUB.getState ? window.DD_HUB.getState() : null,
})).catch(e => ({ error: String(e) }));

try {
  await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'load', timeout: 90000 });
  log.push('goto OK @ ' + Date.now());

  // Phase A: escape loading gate + intro -> menu (poll; pressing Space is idempotent)
  let reached = 'timeout';
  for (let i = 0; i < 90; i++) {
    const s = await state();
    if (s.menuVisible) { reached = 'menu'; break; }
    if (s.hubActive) { reached = 'hub'; break; }
    await page.keyboard.press('Space');
    await page.waitForTimeout(700);
  }
  log.push('phase A reached: ' + reached);
  await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + '/02_menu.png' });

  // Real asset load integrity
  const integrity = await page.evaluate(() => {
    try { const r = window.DD_ASSETS.integrity(); return { pass: r.pass, ok: r.ok, checked: r.checked, errors: r.errors, registered: r.totalRegistered }; }
    catch (e) { return { error: String(e) }; }
  });
  const stats = await page.evaluate(() => { try { return window.DD_ASSETS.stats(); } catch (e) { return { error: String(e) }; } });
  log.push('integrity: ' + JSON.stringify(integrity));
  log.push('stats: ' + JSON.stringify(stats));

  // Phase B: NUEVA PARTIDA -> descent skip -> Refugio (HUB)
  if (reached === 'menu') {
    await page.click('#dd-menu-nav .dd-menu-btn[data-action="new"]');
    log.push('clicked NUEVA PARTIDA');
    for (let i = 0; i < 60; i++) {
      const s = await state();
      if (s.hubActive) break;
      await page.keyboard.press('Space');
      await page.waitForTimeout(600);
    }
  }
  const sAfter = await state();
  log.push('hub state: ' + JSON.stringify(sAfter.hubState));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: OUT + '/03_refugio_hub.png' });

  // Walk right, then screenshot again (movement + room still coherent)
  await page.keyboard.down('KeyD'); await page.waitForTimeout(800); await page.keyboard.up('KeyD');
  await page.screenshot({ path: OUT + '/04_refugio_walk.png' });

  const summary = {
    log,
    pageErrors,
    failedAssets: failedReqs,
    consoleErrorCount: consoleMsgs.filter(m => m.type === 'error').length,
    consoleErrors: consoleMsgs.filter(m => m.type === 'error').slice(0, 15),
    consoleWarningCount: consoleMsgs.filter(m => m.type === 'warning').length,
  };
  writeFileSync(OUT + '/qa_run_report.json', JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} catch (e) {
  console.error('QA FATAL:', String(e && e.message || e));
  try { await page.screenshot({ path: OUT + '/99_fatal.png' }); } catch {}
  writeFileSync(OUT + '/qa_run_report.json', JSON.stringify({ log, pageErrors, failedReqs, fatal: String(e && e.message || e) }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
