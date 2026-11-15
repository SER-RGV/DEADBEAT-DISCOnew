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
const pageErrors = [], failed = [];
page.on('pageerror', e => pageErrors.push(String(e).slice(0, 300)));
page.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) failed.push(r.url()); });
const log = [];
const state = () => page.evaluate(() => ({
  menuVisible: !!(document.querySelector('#dd-menu-nav .dd-menu-btn[data-action="new"]')?.offsetParent),
  hubActive: !!(window.DD_HUB?.isActive?.()),
  hubState: window.DD_HUB?.getState?.() ?? null,
})).catch(e => ({ error: String(e) }));

try {
  await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'load', timeout: 90000 });
  // reach menu
  for (let i = 0; i < 90; i++) { const s = await state(); if (s.menuVisible) break; await page.keyboard.press('Space'); await page.waitForTimeout(700); }
  await page.click('#dd-menu-nav .dd-menu-btn[data-action="new"]');
  // reach hub
  for (let i = 0; i < 60; i++) { const s = await state(); if (s.hubActive) break; await page.keyboard.press('Space'); await page.waitForTimeout(600); }
  log.push('hub reached: ' + JSON.stringify((await state()).hubState));
  // walk down to the descent pad (880, 785) from start (880, 615)
  await page.keyboard.down('KeyS'); await page.waitForTimeout(750); await page.keyboard.up('KeyS');
  await page.waitForTimeout(300);
  const near = await state();
  log.push('near pad: ' + JSON.stringify({ x: near.hubState?.x, y: near.hubState?.y, nearStation: near.hubState?.nearStation }));
  await page.screenshot({ path: OUT + '/05_descent_pad.png', timeout: 120000 });
  // activate descent
  await page.keyboard.press('KeyE');
  log.push('pressed E on descent pad');
  for (let i = 0; i < 40; i++) { const s = await state(); if (!s.hubActive) break; await page.keyboard.press('Space'); await page.waitForTimeout(500); }
  // skip descent cinematic into the first combat room
  for (let i = 0; i < 40; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(500);
    const inGame = await page.evaluate(() => { try { return !!(window.__DD_BRIDGE && window.DMO && !window.DD_HUB.isActive()); } catch { return false; } });
    if (inGame) break;
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: OUT + '/06_first_room.png', timeout: 120000 });
  const dmoKeys = await page.evaluate(() => { try { return window.DMO ? Object.keys(window.DMO) : null; } catch { return null; } });
  log.push('DMO keys: ' + JSON.stringify(dmoKeys));
  writeFileSync(OUT + '/qa_descent_report.json', JSON.stringify({ log, pageErrors, failed }, null, 2));
  console.log(JSON.stringify({ log, pageErrors, failed }, null, 2));
} catch (e) {
  console.error('QA FATAL:', String(e && e.message || e));
  try { await page.screenshot({ path: OUT + '/99_descent_fatal.png', timeout: 120000 }); } catch {}
  process.exitCode = 1;
} finally {
  await browser.close();
}
