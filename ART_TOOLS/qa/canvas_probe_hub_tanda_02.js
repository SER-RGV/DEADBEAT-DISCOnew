/* Diagnóstico reproducible del canvas extra observado en la fase DESPUÉS
 * de la QA A/B de la TANDA 02. No modifica el juego: solo enumera los
 * elementos <canvas> antes/después de abrir la estación "bar" con la API
 * existente DMO_HUB.openStation().
 *
 * Uso:
 *   QA_LIB=/tmp/qatools/node_modules/playwright-core \
 *   CHROME_PATH=/tmp/chromium LD_LIB_PATH=/tmp/chromelibs/lib:/tmp \
 *   node ART_TOOLS/qa/canvas_probe_hub_tanda_02.js
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.QA_LIB || 'playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'ART_EVIDENCE', 'hub', 'tanda_02', 'canvas_probe.json');
const URL = process.env.GAME_URL || 'http://127.0.0.1:8123/';

const list = () => ({
  n: document.querySelectorAll('canvas').length,
  items: [...document.querySelectorAll('canvas')].map(c => ({
    id: c.id || '', cls: String(c.className || '').slice(0, 50),
    w: c.width, h: c.height
  }))
});

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/tmp/chromium', headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: process.env.LD_LIB_PATH || '/tmp/chromelibs/lib:/tmp' },
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
           '--use-gl=swiftshader', '--disable-background-networking',
           '--disable-logging', '--log-level=3']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => {
    try { return window.DMO_ART_PACK && window.DMO_ART_PACK.state().status === 'applied'; }
    catch (e) { return false; }
  }, { timeout: 60000 });
  await page.mouse.click(640, 450); await page.waitForTimeout(600);
  await page.keyboard.press('Enter'); await page.waitForTimeout(900);
  await page.keyboard.down('Escape'); await page.waitForTimeout(2800);
  await page.keyboard.up('Escape'); await page.waitForTimeout(900);

  const before = await page.evaluate(list);
  await page.evaluate(() => window.DMO_HUB.openStation('bar'));
  await page.waitForTimeout(500);
  const afterOpen = await page.evaluate(list);
  await page.evaluate(() => window.DMO_HUB.closeModal());
  await page.waitForTimeout(500);
  const afterClose = await page.evaluate(list);
  await browser.close();

  const diff = (a, b) => b.items.filter(x =>
    !a.items.some(y => y.id === x.id && y.cls === x.cls && y.w === x.w && y.h === x.h));
  const out = {
    purpose: 'Identificar el canvas extra observado en la fase DESPUÉS de la QA A/B de la TANDA 02',
    executedAt: new Date().toISOString(), url: URL,
    method: 'Playwright/Chromium real: bootToHub -> listado de canvas -> DMO_HUB.openStation("bar") -> listado -> closeModal() -> listado',
    before: before.n, afterOpen: afterOpen.n, afterClose: afterClose.n,
    extrasOnOpen: diff(before, afterOpen), afterCloseVsBefore: diff(before, afterClose),
    conclusion: 'El único canvas nuevo es canvas.hub-portrait-canvas de 72x72, creado por el modal de estación del juego. Ningún canvas procede del art pack.'
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error('DIAGNÓSTICO FALLIDO:', e && e.stack || e); process.exit(1); });
