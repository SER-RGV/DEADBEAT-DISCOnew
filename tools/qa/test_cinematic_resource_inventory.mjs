// Verifica en Chromium rutas explícitas del manifiesto y disponibilidad del registro real.
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const requireQA = createRequire(path.join(process.env.DD_QA_MODULES || process.cwd(), 'package.json'));
const puppeteer = (await import(pathToFileURL(requireQA.resolve('puppeteer-core')).href)).default;
const chromium = (await import(pathToFileURL(requireQA.resolve('@sparticuz/chromium')).href)).default;
const manifest = JSON.parse(fs.readFileSync('assets/cinematics/manifest.json', 'utf8'));
const paths = [...new Set(Object.values(manifest.assets).flatMap(a => [a.file, a.fallback, a.thumbnail].filter(Boolean)))];
const base = process.env.DD_QA_URL || 'http://127.0.0.1:8012';
const browser = await puppeteer.launch({executablePath: await chromium.executablePath(), headless: true, args: [...chromium.args, '--no-sandbox']});
try {
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto(base + '/assets/cinematics/preview/player.html', {waitUntil: 'load', timeout: 120000});
  await page.waitForFunction(ids => ids.every(id => !!window.DD_ASSETS?.get(id)), {timeout: 60000}, Object.keys(manifest.assets));
  const result = await page.evaluate(async paths => {
    const entries = await Promise.all(paths.map(async p => {
      try {
        const url = new URL('/' + p, location.origin).href;
        const response = await fetch(url);
        if (!response.ok) return {path:p, error:'HTTP ' + response.status};
        const image = await createImageBitmap(await response.blob());
        const dimensions = [image.width, image.height]; image.close();
        return {path:p, dimensions};
      } catch (e) { return {path:p, error:String(e)}; }
    }));
    return entries;
  }, paths);
  const broken = result.filter(x => x.error);
  console.log(JSON.stringify({paths:paths.length, registryIds:Object.keys(manifest.assets).length, failed:broken, pageErrors:errors}, null, 2));
  if (broken.length || errors.length) process.exitCode = 1;
} finally { await browser.close(); }
