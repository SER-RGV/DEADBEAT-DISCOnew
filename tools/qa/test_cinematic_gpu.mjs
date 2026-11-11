// Reproducción observada, sin controlar el reloj ni invocar DD_CINE.update.
// Usar Chromium/Chrome instalado en una máquina con pantalla y GPU habilitada.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

if (process.argv.includes('--help')) {
  console.log('DD_CHROME_PATH=/ruta/a/chrome DD_QA_MODULES=/ruta/con/node_modules DD_QA_OUTPUT=/ruta/resultado.json node tools/qa/test_cinematic_gpu.mjs');
  console.log('Opcional: DD_QA_URL, DD_QA_WIDTH, DD_QA_HEIGHT. El navegador se abre visible; no saltar la intro.');
  process.exit(0);
}
if (!process.env.DD_CHROME_PATH) throw new Error('Indica DD_CHROME_PATH con la ruta al navegador instalado.');
const qaRoot = path.resolve(process.env.DD_QA_MODULES || process.cwd());
const requireQA = createRequire(path.join(qaRoot, 'package.json'));
const module = await import(pathToFileURL(requireQA.resolve('puppeteer-core')).href);
const puppeteer = module.default || module;
const width = Number(process.env.DD_QA_WIDTH || 1280);
const height = Number(process.env.DD_QA_HEIGHT || 720);
if (!Number.isInteger(width) || !Number.isInteger(height) || width < 320 || height < 240) {
  throw new Error('DD_QA_WIDTH y DD_QA_HEIGHT deben ser enteros válidos.');
}
const url = process.env.DD_QA_URL || 'http://127.0.0.1:8000/index.html';
const output = path.resolve(process.env.DD_QA_OUTPUT || 'cinematic-gpu-result.json');
// No flags de software, ni desactivación de GPU. El resultado no certifica por sí solo la GPU.
const browser = await puppeteer.launch({ executablePath: process.env.DD_CHROME_PATH, headless: false });
let failed = false;
const result = { method: 'reproducción real, sin manipulación temporal', viewport: { width, height, deviceScaleFactor: 1 }, url, errors: [] };
try {
  result.browser = await browser.version();
  try {
    const session = await browser.target().createCDPSession();
    result.systemInfo = (await session.send('SystemInfo.getInfo')).gpu;
    await session.detach();
  } catch (error) { result.systemInfoError = String(error); }
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  page.on('pageerror', error => result.errors.push({ type: 'pageerror', message: String(error) }));
  page.on('requestfailed', request => result.errors.push({ type: 'request', url: request.url(), error: request.failure()?.errorText }));
  page.on('response', response => { if (response.status() >= 400) result.errors.push({ type: 'http', url: response.url(), status: response.status() }); });
  await page.evaluateOnNewDocument(() => {
    const data = window.__cineGpuQA = { start: null, end: null, frames: [], shots: [], assetsAtStart: null, renderer: null };
    let previous = null, priorShot = 0;
    function sample(now) {
      const cine = window.DD_CINE?.getState();
      if (cine?.type === 'intro') {
        if (data.start === null) {
          data.start = now;
          data.assetsAtStart = window.DD_ASSETS?.stats() || null;
          const gl = document.createElement('canvas').getContext('webgl');
          const ext = gl?.getExtension('WEBGL_debug_renderer_info');
          data.renderer = ext ? { vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL), renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) } : null;
        }
        if (previous !== null) data.frames.push(now - previous);
        previous = now;
        const t = cine.elapsed;
        const shot = t < 3.5 ? 1 : t < 7 ? 2 : t < 10 ? 3 : t < 13.5 ? 4 : t < 17.5 ? 5 : t < 21 ? 6 : t < 24.5 ? 7 : t < 28.5 ? 8 : t < 32 ? 9 : 10;
        if (shot !== priorShot) { data.shots.push({ shot, wallMs: now - data.start, elapsed: t }); priorShot = shot; }
      } else if (data.start !== null && data.end === null) data.end = now;
      if (data.end === null) requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
  console.log('Observa la ventana: no interactúes, no saltes la intro y mantén la pestaña en primer plano.');
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.bringToFront();
  await page.waitForFunction(() => window.__cineGpuQA && window.__cineGpuQA.end !== null, { timeout: 300000, polling: 250 });
  result.observation = await page.evaluate(() => ({ metrics: window.__cineGpuQA, boot: window.DD_BOOT?.getState(), hub: window.DD_HUB?.getState() }));
  const m = result.observation.metrics;
  const values = m.frames.slice().sort((a, b) => a - b);
  const percentile = p => values.length ? values[Math.floor((values.length - 1) * p)] : null;
  const wallMs = m.end - m.start;
  result.summary = { wallMs, fpsCallbacks: values.length ? values.length * 1000 / wallMs : null, frameCount: values.length,
    medianMs: percentile(.5), p95Ms: percentile(.95), p99Ms: percentile(.99), maxMs: percentile(1),
    over50ms: values.filter(n => n > 50).length, over500ms: values.filter(n => n > 500).length,
    shotOrder: m.shots.map(s => s.shot), hubActive: !!result.observation.hub?.active,
    introEndedBy: result.observation.boot?.introEndedBy || null };
  const renderer = m.renderer?.renderer || '';
  result.accelerationNote = /swiftshader|llvmpipe|softpipe|software/i.test(renderer)
    ? 'Renderizador de software detectado: no válido como prueba GPU.'
    : 'Verificar manualmente chrome://gpu y el renderizador; un nombre no certifica aceleración.';
  failed = result.summary.shotOrder.join(',') !== '1,2,3,4,5,6,7,8,9,10' || !result.summary.hubActive || result.summary.introEndedBy !== 'complete' || result.errors.length > 0;
  console.log(JSON.stringify({ summary: result.summary, renderer: m.renderer, accelerationNote: result.accelerationNote, errors: result.errors }, null, 2));
} catch (error) {
  failed = true;
  result.testError = String(error);
  console.error('La prueba no terminó:', error);
} finally {
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
  console.log('Resultado:', output);
  await browser.close();
}
if (failed) process.exitCode = 1;
