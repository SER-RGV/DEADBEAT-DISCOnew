/* ============================================================================
 * HUB · TANDA 05 — FASE 2: AUDITORÍA DEL HUB REAL (solo lectura)
 * ----------------------------------------------------------------------------
 * Abre el preview 8123 con Chromium/Playwright, entra al HUB por el boot real,
 * recorre 10 zonas con la misma cámara y registra:
 *   · capturas reales de cada zona (page.screenshot)
 *   · qué assets de T01/T02/T03/T04 se dibujan EFECTIVAMENTE por zona
 *   · estaciones, zonas, colisiones, canvas, cachés, V5 y errores
 * No modifica el juego: solo un proxy de lectura sobre drawImage.
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require(process.env.QA_LIB || 'playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'ART_EVIDENCE', 'hub', 'tanda_05');
const URL = process.env.GAME_URL || 'http://127.0.0.1:8123/';
fs.mkdirSync(OUT, { recursive: true });

const ZONES = [
  ['centro', 1250, 935], ['dj', 1250, 445], ['bar', 1910, 845],
  ['vip_oeste', 785, 545], ['vip_este', 1715, 545], ['arcade', 655, 1210],
  ['sellos', 1845, 1210], ['descenso', 1250, 1365], ['arsenal', 590, 845],
  ['pared_este', 2050, 965], ['pared_oeste', 450, 965], ['norte', 1250, 330]
];

const INIT = `(() => {
  const P = window.__T5AUD = { draws: {}, byZone: {}, phase: 'BOOT', zone: '', canvasSizes: {}, errors: [] };
  const orig = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (src) {
    try {
      const id = src && (src.__hubTanda01 || src.__hubTanda02 || src.__hubTanda03 || src.__hubTanda05);
      if (id) {
        const k = id, cv = this.canvas;
        P.draws[k] = (P.draws[k] || 0) + 1;
        P.canvasSizes[k] = [cv.width, cv.height];
        const z = P.zone || 'boot';
        (P.byZone[z] || (P.byZone[z] = {}))[k] = ((P.byZone[z] || {})[k] || 0) + 1;
      }
    } catch (e) {}
    return orig.apply(this, arguments);
  };
  window.addEventListener('error', e => P.errors.push(String(e.message).slice(0, 180)));
})()`;

const PROBE = `(() => {
  const W = window, s = f => { try { return f(); } catch (e) { return 'ERR:' + e.message; } };
  return {
    ts: new Date().toISOString(), url: location.href, readyState: document.readyState,
    hub: s(() => W.DMO_HUB.state()), hubAudit: s(() => W.DMO_HUB.audit()),
    stations: s(() => W.DMO_HUB.stations()),
    artPack: s(() => W.DMO_ART_PACK.state()),
    hub1: s(() => W.DMO_ART_PACK.hub()), hub2: s(() => W.DMO_ART_PACK.hub2()),
    hub3: s(() => W.DMO_ART_PACK.hub3()),
    v5Keys: s(() => Object.keys(W.__DDM_V5_IMG || {}).length),
    v5KeysSample: s(() => Object.keys(W.__DDM_V5_IMG || {}).sort()),
    canvasCount: document.querySelectorAll('canvas').length,
    canvasCountBase: document.querySelectorAll('canvas:not(.hub-portrait-canvas)').length,
    t3b: s(() => ({ enabled: W.__T3B.enabled, revision: W.__T3B.revision,
      routes: W.__T3B.draws.slice(-30).map(d => d.route) })),
    hubFloor: s(() => W.__T3B_HUB_QA.state()),
    menu54: s(() => W.DMO.menu54 && W.DMO.menu54.stats ? W.DMO.menu54.stats() : null),
    debug: s(() => W.DMO.debug.state()),
    draws: (W.__T5AUD || {}).draws, byZone: (W.__T5AUD || {}).byZone,
    canvasSizes: (W.__T5AUD || {}).canvasSizes, pageErrors: (W.__T5AUD || {}).errors
  };
})()`;

async function bootToHub(page) {
  await page.mouse.click(640, 450); await page.waitForTimeout(600);
  await page.keyboard.press('Enter'); await page.waitForTimeout(900);
  await page.keyboard.down('Escape'); await page.waitForTimeout(2800);
  await page.keyboard.up('Escape'); await page.waitForTimeout(900);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/tmp/chromium', headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: process.env.LD_LIB_PATH || '/tmp/chromelibs/lib:/tmp' },
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
           '--use-gl=swiftshader', '--disable-background-networking',
           '--disable-logging', '--log-level=3']
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const rec = { pageErrors: [], consoleErrors: [], httpErrors: [], assetResponses: [], screenshots: {} };
  page.on('console', m => { if (m.type() === 'error') rec.consoleErrors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => rec.pageErrors.push(String(e.message).slice(0, 200)));
  page.on('response', r => { if (r.status() >= 400) rec.httpErrors.push({ status: r.status(), url: r.url().slice(0, 150) }); });
  await page.addInitScript(INIT);
  const t0 = Date.now();
  const resp = await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
  rec.htmlStatus = resp && resp.status();
  rec.loadMs = Date.now() - t0;
  await page.waitForFunction(() => {
    try { const s = window.DMO_ART_PACK && window.DMO_ART_PACK.state().status;
      return s === 'applied' || s === 'applied-with-errors'; } catch (e) { return false; }
  }, { timeout: 90000 });
  await bootToHub(page);
  rec.bootProbe = await page.evaluate(PROBE);

  rec.zones = {};
  for (const [name, x, y] of ZONES) {
    await page.evaluate(([n, x, y]) => {
      try { window.__T5AUD.zone = n; window.__T5AUD.byZone[n] = {}; } catch (e) {}
      try { window.DMO.debug.teleport(x, y); } catch (e) {}
      try { window.DMO.debug.tick(0.016, 30); } catch (e) {}
    }, [name, x, y]);
    await page.waitForTimeout(480);
    const f = 'audit_' + name + '.png';
    await page.screenshot({ path: path.join(OUT, f), timeout: 60000 });
    rec.screenshots[f] = fs.statSync(path.join(OUT, f)).size;
    rec.zones[name] = await page.evaluate(() => {
      const P = window.__T5AUD;
      return { draws: JSON.parse(JSON.stringify(P.byZone[P.zone] || {})),
               debug: (() => { try { return window.DMO.debug.state(); } catch (e) { return null; } })() };
    });
  }
  rec.finalProbe = await page.evaluate(PROBE);
  rec.htmlSha256 = crypto.createHash('sha256')
    .update(fs.readFileSync(path.join(ROOT, 'DEADBEAT_DISCO.ART.html'))).digest('hex');
  rec.artPackSha256 = crypto.createHash('sha256')
    .update(fs.readFileSync(path.join(ROOT, 'ART_PACK/art_pack.js'))).digest('hex');
  rec.environment = {
    chromium: process.env.CHROME_VERSION || '131.0.6778.0',
    playwrightCore: require('/tmp/qatools/node_modules/playwright-core/package.json').version,
    viewport: [1280, 900], deviceScaleFactor: 1,
    renderer: 'SwiftShader', url: URL,
    previewPid: '4783 (no reiniciado)', zones: ZONES.map(z => z[0])
  };
  fs.writeFileSync(path.join(OUT, 'audit_runtime.json'), JSON.stringify(rec, null, 2) + '\n');
  console.log(JSON.stringify({
    htmlStatus: rec.htmlStatus, loadMs: rec.loadMs,
    canvasCountBase: rec.bootProbe.canvasCountBase,
    v5Keys: rec.bootProbe.v5Keys,
    stations: rec.bootProbe.stations.length,
    hubAudit: rec.bootProbe.hubAudit,
    assetsDrawn: Object.keys(rec.finalProbe.draws || {}).length,
    zones: Object.keys(rec.zones).length,
    pageErrors: rec.pageErrors.length, consoleErrors: rec.consoleErrors.length,
    localHttpErrors: rec.httpErrors.filter(e => !/cdn-cgi/.test(e.url)).length
  }, null, 2));
  await ctx.close(); await browser.close();
})().catch(e => { console.error('AUDIT T05 FAIL', e); process.exit(1); });
