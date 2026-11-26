import { launch, instrument, collect } from './lib.mjs';
const url = process.argv[2] || 'http://localhost:8123/index.html';
const runs = Number(process.argv[3] || 3);
const browser = await launch();
try {
  for (let run = 1; run <= runs; run++) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    const events = await instrument(page);
    const httpErrors = [];
    page.on('response', response => { if (response.status() >= 400) httpErrors.push([response.status(), response.url()]); });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.DD_BOOT?.getState().state === 'MAIN_MENU', null, { timeout: 120000 });
    const atMenu = await collect(page);
    await page.waitForTimeout(2000);
    const settled = await collect(page);
    const navigationBytes = await page.evaluate(() => performance.getEntriesByType('navigation')[0].transferSize);
    console.log(JSON.stringify({ run, url, navigationBytes, atMenu, settled, errors: events.errors, requestFailures: events.reqfails, httpErrors }));
    if (events.errors.length || events.reqfails.length || httpErrors.length) process.exitCode = 1;
    await context.close();
  }
} finally { await browser.close(); }
