#!/usr/bin/env node
'use strict';

/*
 * External, visible-Chrome hardware-GPU harness for the BOSS-T02 gate.
 * It changes only the in-memory response for ART_PACK/art_pack.js in config A:
 * exactly the 10 BOSS-T02 manifest records are removed. No game/source/assets,
 * artId, resolver, boss logic, animation, collision, controls, or attacks change.
 *
 * This script intentionally fails closed. It does not run a timed pass unless
 * WebGL AND Chrome GPU diagnostics prove a non-software hardware renderer.
 */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const crypto = require('node:crypto');
const { URL } = require('node:url');
const { execFileSync } = require('node:child_process');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '../../../../..');
const EVIDENCE_ROOT = path.resolve(__dirname);
const HTML_FILE = 'DEADBEAT_DISCO.ART.html';
const PACK_FILE = 'ART_PACK/art_pack.js';
const RUNBOOK_VERSION = 't02-external-gpu-v1';
const EXPECTED_GAME_VERSION = 'fase1-tanda01+tanda02+boss-t01+boss-t02';
const EXPECTED_BOSS_ID = 'boss_05_fusioncosmica';
const WIDTH = 1440;
const HEIGHT = 1000;
const WARMUP_MS = 15000;
const MEASURE_MS = 60000;
const PROFILE_MS = 15000;
const PAIR_COUNT = 5;
const SCHEDULE = ['T01', 'T02', 'T02', 'T01', 'T01', 'T02', 'T02', 'T01', 'T01', 'T02'];
const SOFTWARE_RE = /swiftshader|llvmpipe|softpipe|software rasterizer|software renderer|microsoft basic render|angle\s*\(.*?swiftshader/i;

function sha256(data) { return crypto.createHash('sha256').update(data).digest('hex'); }
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}
function median(xs) {
  const a = xs.filter(Number.isFinite).slice().sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}
function quantile(xs, q) {
  const a = xs.filter(Number.isFinite).slice().sort((x, y) => x - y);
  if (!a.length) return null;
  return a[Math.min(a.length - 1, Math.max(0, Math.ceil(q * a.length) - 1))];
}
function frameStats(xs) {
  return {
    frames: xs.length,
    meanMs: xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null,
    medianMs: median(xs), p95Ms: quantile(xs, 0.95), p99Ms: quantile(xs, 0.99),
    maxMs: xs.length ? Math.max(...xs) : null,
    fpsFromMeanFrameMs: xs.length ? 1000 / (xs.reduce((a, b) => a + b, 0) / xs.length) : null
  };
}
function argsOf(argv) {
  const o = { out: null, preflightOnly: false, validateSceneOnly: false, help: false, chromePath: process.env.CHROME_BIN || null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--out') o.out = argv[++i];
    else if (argv[i] === '--preflight-only') o.preflightOnly = true;
    else if (argv[i] === '--validate-scene-only') o.validateSceneOnly = true;
    else if (argv[i] === '--chrome-path') o.chromePath = argv[++i];
    else if (argv[i] === '--help' || argv[i] === '-h') o.help = true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return o;
}
function usage() {
  return [
    'Usage:',
    '  node benchmark_external_gpu.js --preflight-only --out <new-run-directory>',
    '  node benchmark_external_gpu.js --validate-scene-only --out <new-validation-directory> [--chrome-path <chrome.exe>]',
    '  node benchmark_external_gpu.js --out <new-run-directory> [--chrome-path <chrome.exe>]',
    '',
    'Full run: 5 paired repetitions per configuration, alternating T01/T02 order.',
    'Requires a visible Chrome installation, playwright-core, and a verified hardware GPU.'
  ].join('\n');
}
function assertFreshOutput(out) {
  const rel = path.relative(EVIDENCE_ROOT, out);
  if (rel.startsWith('..') || path.isAbsolute(rel) || rel === '') {
    throw new Error(`--out must be a new child directory of ${EVIDENCE_ROOT}`);
  }
  if (fs.existsSync(out) && fs.readdirSync(out).length) throw new Error(`Output directory is not empty: ${out}`);
  fs.mkdirSync(out, { recursive: true });
}
function runtimeImageFiles(source) {
  const groups = [
    { name: 'MANIFEST', end: 'var ARCHITECTURE = [', defaultBase: 'ART_ASSETS/tanda_01/' },
    { name: 'ARCHITECTURE', end: 'var ORIGINALS = {};', defaultBase: 'ART_ASSETS/tanda_02/' },
    { name: 'P3_ASSETS', end: 'var STATE_SEQUENCE =', defaultBase: 'ART_ASSETS/tanda_03/fase_c/' }
  ];
  const bases = { BASE: 'ART_ASSETS/tanda_01/', BASE2: 'ART_ASSETS/tanda_02/', BASE3: 'ART_ASSETS/tanda_03/fase_c/', BOSS_BASE: 'ART_ASSETS/bosses/tanda_01/', BOSS_BASE2: 'ART_ASSETS/bosses/tanda_02/' };
  const files = [];
  for (const group of groups) {
    const start = source.indexOf(`var ${group.name} = [`);
    const end = source.indexOf(group.end, start);
    if (start < 0 || end < 0) throw new Error(`Cannot locate frozen ART_PACK ${group.name} image table.`);
    for (const line of source.slice(start, end).split(/\n/)) {
      const fm = line.match(/\bfile:\s*'([^']+)'/);
      if (!fm) continue;
      const bm = line.match(/\bbase:\s*(BOSS_BASE2?|BASE3|BASE2|BASE)\b/);
      files.push((bm ? bases[bm[1]] : group.defaultBase) + fm[1]);
    }
  }
  if (files.length !== 46 || new Set(files).size !== files.length) throw new Error(`Frozen ART_PACK runtime-image table changed: expected 46 unique file references, found ${files.length}/${new Set(files).size}.`);
  return files;
}
function loadContract() {
  const file = path.join(EVIDENCE_ROOT, 'source_hashes.json');
  const contract = JSON.parse(fs.readFileSync(file, 'utf8'));
  const packSource = fs.readFileSync(path.join(ROOT, PACK_FILE), 'utf8');
  const requiredRuntimeImages = runtimeImageFiles(packSource);
  const actual = {};
  for (const [relative, expected] of Object.entries(contract.sha256 || {})) {
    const full = path.join(ROOT, relative);
    if (!fs.existsSync(full)) throw new Error(`Source file missing: ${relative}`);
    const got = sha256(fs.readFileSync(full));
    actual[relative] = got;
    if (got !== expected) throw new Error(`Source hash mismatch; refresh the reviewed source contract before running: ${relative}`);
  }
  if (Object.keys(actual).length !== 52) throw new Error(`Expected 52 frozen source/runtime-image/runbook hashes, found ${Object.keys(actual).length}`);
  for (const relative of requiredRuntimeImages) if (!actual[relative]) throw new Error(`Source-hash contract omits ART_PACK runtime image: ${relative}`);
  if (contract.asset_counts?.ART_PACK_RUNTIME_IMAGE_FILES !== requiredRuntimeImages.length) throw new Error('Source-hash contract runtime image count does not match frozen ART_PACK.');
  const t01 = JSON.parse(fs.readFileSync(path.join(ROOT, 'ART_ASSETS/bosses/tanda_01/manifest.json'), 'utf8'));
  const t02 = JSON.parse(fs.readFileSync(path.join(ROOT, 'ART_ASSETS/bosses/tanda_02/manifest.json'), 'utf8'));
  if (t01.assets.length !== 10 || t02.assets.length !== 10) throw new Error('Expected exactly 10 T01 and 10 T02 boss assets in their frozen manifests.');
  return { contract, actual, packSource, t01, t02 };
}
function transformBaselinePack(source) {
  if (source.includes('\r')) throw new Error('A/B guard failed: unexpected CR line endings; refusing to normalize the baseline response.');
  const lines = source.split('\n');
  const removedLines = lines.filter(line => /^\s*\{[^\n]*batch:\s*'BOSS-T02'[^\n]*\},?\s*$/.test(line));
  const kept = lines.filter(line => !/^\s*\{[^\n]*batch:\s*'BOSS-T02'[^\n]*\},?\s*$/.test(line));
  const removed = removedLines.length;
  const removedRecordIds = removedLines.map(line => (line.match(/\bid:\s*'([^']+)'/) || [])[1]).filter(Boolean);
  if (removed !== 10 || removedRecordIds.length !== 10 || new Set(removedRecordIds).size !== 10) throw new Error(`A/B guard failed: expected exactly 10 uniquely identified BOSS-T02 lines, found ${removed} lines/${removedRecordIds.length} IDs.`);
  const result = kept.join('\n');
  if (/batch:\s*'BOSS-T02'/.test(result)) throw new Error('A/B guard failed: BOSS-T02 manifest entries remain in baseline response.');
  if (!/version:\s*'fase1-tanda01\+tanda02\+boss-t01\+boss-t02'/.test(result)) throw new Error('A/B guard failed: frozen runtime version string changed/missing.');
  new vm.Script(result, { filename: 'ART_PACK/art_pack.js [A: T01-only response filter]' });
  return { body: result, removedRecords: removed, removedRecordIds, retainedSha256: sha256(result), nonT02SourceLinesPreservedExactly: true };
}
function simplifyGpuInfo(info) {
  const gpu = info && info.gpu || {};
  const aux = gpu.auxAttributes || {};
  return {
    devices: (gpu.devices || []).map(d => ({
      vendorId: d.vendorId, deviceId: d.deviceId, deviceString: d.deviceString,
      driverVendor: d.driverVendor, driverVersion: d.driverVersion, revision: d.revision
    })),
    featureStatus: gpu.featureStatus || {},
    auxAttributes: {
      glVendor: aux.glVendor, glRenderer: aux.glRenderer, glVersion: aux.glVersion,
      angleBackend: aux.angleBackend, glImplementationParts: aux.glImplementationParts,
      pixelShaderVersion: aux.pixelShaderVersion
    }
  };
}
function classifyGpu(webgl, cdpGpu, chromeGpuText) {
  const deviceText = JSON.stringify(cdpGpu || {});
  const renderer = [webgl && webgl.vendor, webgl && webgl.renderer,
    cdpGpu && cdpGpu.auxAttributes && cdpGpu.auxAttributes.glVendor,
    cdpGpu && cdpGpu.auxAttributes && cdpGpu.auxAttributes.glRenderer, deviceText].filter(Boolean).join(' ');
  if (SOFTWARE_RE.test(renderer)) return { verified: false, status: 'BLOCKED_SOFTWARE_RENDERER', reason: 'WebGL or Chrome GPU diagnostics identify a software renderer.' };
  const physicalDevice = !!(cdpGpu && Array.isArray(cdpGpu.devices) && cdpGpu.devices.some(d =>
    d && d.deviceString && !SOFTWARE_RE.test(JSON.stringify(d))));
  const rendererPresent = !!(webgl && webgl.renderer && !/^(?:Google Inc\. \(Google\)|WebKit)$/i.test(webgl.renderer.trim()));
  const features = cdpGpu && cdpGpu.featureStatus || {};
  const featureText = JSON.stringify(features).toLowerCase() + '\n' + (chromeGpuText || '').toLowerCase();
  const acceleratedFeature = /gpu_compositing[^\n]{0,100}(enabled|hardware accelerated)|webgl[^\n]{0,100}(enabled|hardware accelerated)|compositing:\s*hardware accelerated|webgl:\s*hardware accelerated/.test(featureText);
  if (!physicalDevice || !rendererPresent || !acceleratedFeature) {
    return { verified: false, status: 'BLOCKED_GPU_NOT_PROVEN', reason: 'Could not prove a physical non-software adapter and an enabled accelerated feature using both diagnostics.' };
  }
  return { verified: true, status: 'HARDWARE_GPU_VERIFIED', reason: 'Non-software WebGL renderer, physical adapter, and accelerated browser feature corroborate.' };
}
async function diagnostics(browser) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  let webgl = null;
  try {
    webgl = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return { available: false, reason: 'WebGL context unavailable' };
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        available: true,
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
      };
    });
  } catch (e) { webgl = { available: false, error: String(e) }; }
  let systemInfo = null, cdpError = null;
  try {
    const cdp = await browser.newBrowserCDPSession();
    systemInfo = await cdp.send('SystemInfo.getInfo');
    await cdp.detach();
  } catch (e) { cdpError = String(e); }
  let chromeGpuText = '', chromeGpuError = null;
  try {
    await page.goto('chrome://gpu', { waitUntil: 'domcontentloaded', timeout: 15000 });
    chromeGpuText = await page.locator('body').innerText({ timeout: 10000 });
  } catch (e) { chromeGpuError = String(e); }
  const gpu = simplifyGpuInfo(systemInfo);
  const result = classifyGpu(webgl, gpu, chromeGpuText);
  await page.close().catch(() => {});
  return {
    capturedAt: new Date().toISOString(), status: result.status, hardwareGpuVerified: result.verified, reason: result.reason,
    webgl, chromeGpu: { captured: !!chromeGpuText, error: chromeGpuError, selectedLines: chromeGpuText.split(/\r?\n/).map(s => s.trim()).filter(s => /Graphics Feature Status|Canvas:|Compositing:|Rasterization:|OpenGL:|WebGL|GL_VENDOR|GL_RENDERER|GL_VERSION|Problems Detected|Driver Information|GPU\s*\d/i.test(s)).slice(0, 120) },
    chromeSystemInfo: gpu, cdpError
  };
}
function environmentRecord(browser, gpuDiagnostics, contract, headless = false) {
  return {
    capturedAt: new Date().toISOString(), harnessVersion: RUNBOOK_VERSION,
    os: { platform: os.platform(), release: os.release(), arch: os.arch(), cpuModels: [...new Set(os.cpus().map(c => c.model))], logicalCores: os.cpus().length, totalMemoryBytes: os.totalmem() },
    browser: { name: 'Chrome', version: browser.version(), playwrightCoreVersion: (() => { try { return require('playwright-core/package.json').version; } catch (_) { return 'record manually if package export blocks discovery'; } })(), headless },
    viewport: { cssWidth: WIDTH, cssHeight: HEIGHT, deviceScaleFactor: 1 },
    gpu: { verified: gpuDiagnostics.hardwareGpuVerified, status: gpuDiagnostics.status, webgl: gpuDiagnostics.webgl, chromeSystemInfo: gpuDiagnostics.chromeSystemInfo },
    gameVersion: EXPECTED_GAME_VERSION, sourceHead: contract.head_commit, sourceHashesSha256: contract.sha256,
    measurementPlan: { repetitionsPerConfiguration: PAIR_COUNT, warmupMs: WARMUP_MS, measureMs: MEASURE_MS, alternatingSchedule: SCHEDULE }
  };
}
function createStaticServer() {
  const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml' };
  const server = http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); } catch (_) { res.writeHead(400).end(); return; }
    const target = path.resolve(ROOT, '.' + pathname);
    const rel = path.relative(ROOT, target);
    if (rel.startsWith('..') || path.isAbsolute(rel)) { res.writeHead(403).end(); return; }
    fs.readFile(target, (err, data) => {
      if (err) { res.writeHead(err.code === 'ENOENT' ? 404 : 500, { 'Cache-Control': 'no-store' }).end(); return; }
      res.writeHead(200, { 'Content-Type': mime[path.extname(target).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` }));
  });
}
function localError(url, origin) { return String(url || '').startsWith(origin); }
function writeBlockedFiles(out, gpu, environment, reason) {
  writeJson(path.join(out, 'gpu_diagnostics.json'), gpu);
  writeJson(path.join(out, 'environment.json'), environment);
  writeJson(path.join(out, 'gate_status.json'), { status: gpu.status === 'BLOCKED_SOFTWARE_RENDERER' ? 'BLOCKED_NO_REAL_GPU' : 'BLOCKED_GPU_NOT_PROVEN', reason, noBenchmarkRunsStarted: true, noGpuMetricsCollected: true });
  writeJson(path.join(out, 'runs_T01.json'), { configuration: 'T01', status: 'NOT_RUN', runs: [] });
  writeJson(path.join(out, 'runs_T02.json'), { configuration: 'T01+BOSS-T02', status: 'NOT_RUN', runs: [] });
  writeJson(path.join(out, 'raw_metrics.json'), { status: 'NOT_RUN', source: 'No benchmark passes; no metrics fabricated.', runs: [] });
  writeJson(path.join(out, 'comparison.json'), { status: 'BLOCKED', validHardwarePasses: { T01: 0, T02: 0 }, reason, comparisonMade: false, verdict: 'NONE' });
  fs.mkdirSync(path.join(out, 'screenshots'), { recursive: true });
  fs.mkdirSync(path.join(out, 'traces'), { recursive: true });
  fs.mkdirSync(path.join(out, 'performance_charts'), { recursive: true });
  fs.writeFileSync(path.join(out, 'screenshots/README.md'), '# Screenshots\n\nNo external hardware-GPU benchmark screenshots were captured.\n');
  fs.writeFileSync(path.join(out, 'traces/README.md'), '# Chrome traces\n\nNo trace was captured because the real-GPU preflight did not pass.\n');
  fs.writeFileSync(path.join(out, 'performance_charts/README.md'), '# Performance charts\n\nNo chart is generated without valid paired hardware-GPU passes.\n');
}
async function beginScene(page, config, packInfo, manifests) {
  await page.goto(`${page.__origin}/${HTML_FILE}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.DMO_ART_PACK && typeof window.DMO_ART_PACK.state === 'function' && window.DMO_ART_PACK.state().status === 'applied', null, { timeout: 90000 });
  const packAudit = await page.evaluate(() => {
    const state = window.DMO_ART_PACK.state();
    const manifest = window.DMO_ART_PACK.manifest();
    const integrity = window.DMO_ART_PACK.integrity();
    return { state, manifest, integrity };
  });
  const t01 = packAudit.manifest.filter(x => x.batch === 'BOSS-T01');
  const t02 = packAudit.manifest.filter(x => x.batch === 'BOSS-T02');
  if (t01.length !== 10 || t02.length !== (config === 'T02' ? 10 : 0)) throw new Error(`Unsafe A/B pack delta: T01=${t01.length}, T02=${t02.length}, configuration=${config}.`);
  if (packAudit.state.version !== EXPECTED_GAME_VERSION) throw new Error(`Unexpected runtime pack version: ${packAudit.state.version}`);
  const integrityOk = packAudit.integrity && packAudit.integrity.status === 'applied' &&
    Array.isArray(packAudit.integrity.assets) && packAudit.integrity.assets.length > 0 &&
    packAudit.integrity.assets.every(a => a.live === true) &&
    Array.isArray(packAudit.integrity.errors) && packAudit.integrity.errors.length === 0;
  if (!integrityOk) throw new Error(`Pack integrity audit did not pass: ${JSON.stringify(packAudit.integrity)}`);

  const keys = await page.evaluate(() => ({ hasSecretBoss: !!(window.DMO && window.DMO.secretBoss && typeof window.DMO.secretBoss.startEncounter === 'function'), hasCombatArt: !!(window.DMO && window.DMO.combatArt && typeof window.DMO.combatArt.info === 'function') }));
  if (!keys.hasSecretBoss || !keys.hasCombatArt) throw new Error('Native secret-boss/combat-art APIs are unavailable; refusing test hooks or artId overrides.');
  await page.bringToFront();
  // Enter through the real audio gate and the existing cover start API; this
  // drives the ordinary JUGAR button and removes the splash without test hooks.
  await page.waitForSelector('#ddc-gate', { timeout: 30000 });
  await page.locator('#ddc-gate').click();
  await page.waitForFunction(() => window.DDC_COVER && typeof window.DDC_COVER.start === 'function', null, { timeout: 10000 });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.DDC_COVER.start());
  // Use a wall-clock wait instead of rAF polling here: the software-only smoke
  // browser may throttle RAF, while the real external run is visible Chrome.
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.DMO.secretBoss.startEncounter());
  await page.waitForFunction(() => {
    try {
      const s = window.DMO.secretBoss.state();
      const i = window.DMO.combatArt.info();
      return s.inSecretArena === true && s.secretBossActive === true && i.bossId === 'boss_05_fusioncosmica';
    } catch (_) { return false; }
  }, null, { timeout: 30000 });
  const scene = await page.evaluate(() => {
    const secret = window.DMO.secretBoss.state();
    const art = window.DMO.combatArt.info();
    const canvas = [...document.querySelectorAll('canvas')].map(c => ({ width: c.width, height: c.height, cssWidth: c.clientWidth, cssHeight: c.clientHeight }));
    const cover = document.getElementById('ddc-cover');
    return { secret, combatArt: art, stableBossId: art.bossId, pageVisibility: document.visibilityState, coverClass: cover && cover.className, canvas };
  });
  if (scene.stableBossId !== EXPECTED_BOSS_ID || scene.secret.secretBossActive !== true) throw new Error('Native scene did not resolve to the real stable Boss05 ID.');
  if (!/ddc-off|ddc-gone/.test(scene.coverClass || '')) throw new Error(`Native start screen did not clear from the game view: cover class=${scene.coverClass}`);
  await page.waitForFunction(() => document.visibilityState === 'visible', null, { timeout: 5000 });
  const decode = await page.evaluate(async () => {
    const manifest = window.DMO_ART_PACK.manifest();
    const relevant = manifest.filter(a => a.batch === 'BOSS-T01' || a.batch === 'BOSS-T02');
    const started = performance.now();
    const records = await Promise.all(relevant.map(async a => {
      const img = a.loader === 'ILT' ? window.DMO_ILT && window.DMO_ILT.images && window.DMO_ILT.images[a.id]
        : a.loader === 'HD' ? window.__HD_EXTRA && window.__HD_EXTRA[a.id] : null;
      if (!img) return { id: a.id, loaded: false, reason: 'image-cache-entry-missing' };
      try { if (typeof img.decode === 'function') await img.decode(); }
      catch (e) { return { id: a.id, loaded: false, reason: String(e) }; }
      return { id: a.id, loaded: !!img.complete && img.naturalWidth > 0, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight };
    }));
    return { postLoadDecodeWallMs: performance.now() - started, records };
  });
  const expectedCount = config === 'T02' ? 20 : 10;
  if (decode.records.length !== expectedCount || decode.records.some(x => !x.loaded)) throw new Error(`Asset cache/decode verification failed: expected ${expectedCount} T01/T02 art records, got ${decode.records.length} (${decode.records.filter(x => !x.loaded).length} not ready).`);
  const t02NetworkRequests = await page.evaluate(() => performance.getEntriesByType('resource').filter(e => /ART_ASSETS\/bosses\/tanda_02\//.test(e.name)).map(e => e.name));
  if (config === 'T01' && t02NetworkRequests.length) throw new Error('A/B guard failed: T02 image requests occurred in T01-only configuration.');
  return { packAudit: { version: packAudit.state.version, t01Count: t01.length, t02Count: t02.length, integrity: packAudit.integrity, originalPackSha256: packInfo.originalSha256, servedPackSha256: config === 'T02' ? packInfo.originalSha256 : packInfo.baselineSha256, removedT02RecordsInA: config === 'T01' ? 10 : 0 }, scene, decode, pageStartTimeOrigin: await page.evaluate(() => performance.timeOrigin), startedAt: new Date().toISOString() };
}
async function scriptedControls(page, durationMs) {
  // Same ordinary arrow-key movement in each fresh context; no test hooks, cheats, or state edits.
  const pattern = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
  const started = Date.now();
  let index = 0;
  try {
    while (Date.now() - started < durationMs) {
      const key = pattern[index++ % pattern.length];
      await page.keyboard.down(key);
      await page.waitForTimeout(Math.min(1150, Math.max(0, durationMs - (Date.now() - started))));
      await page.keyboard.up(key).catch(() => {});
      if (Date.now() - started < durationMs) await page.waitForTimeout(Math.min(100, durationMs - (Date.now() - started)));
    }
  } finally {
    for (const key of pattern) await page.keyboard.up(key).catch(() => {});
  }
}
async function runOne(browser, origin, out, config, pair, scheduleIndex, packInfo, manifests, options = {}) {
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1, acceptDownloads: false });
  const page = await context.newPage();
  page.__origin = origin;
  const errors = { page: [], console: [], failedRequests: [], badResponses: [] };
  page.on('pageerror', e => errors.page.push({ at: new Date().toISOString(), message: String(e) }));
  page.on('console', m => { if (m.type() === 'error') errors.console.push({ at: new Date().toISOString(), text: m.text(), location: m.location() }); });
  page.on('requestfailed', r => errors.failedRequests.push({ url: r.url(), error: r.failure() && r.failure().errorText }));
  page.on('response', r => { if (r.status() >= 400) errors.badResponses.push({ url: r.url(), status: r.status() }); });
  await page.addInitScript(() => {
    const gate = { imageLoadEvents: [], resourceEntries: [] };
    Object.defineProperty(window, '__externalGpuGate', { value: gate, configurable: false });
    try {
      new PerformanceObserver(list => {
        for (const e of list.getEntries()) if (/ART_ASSETS\/bosses\/tanda_0[12]\//.test(e.name)) gate.resourceEntries.push({ name: e.name, startTime: e.startTime, duration: e.duration, responseEnd: e.responseEnd, transferSize: e.transferSize, encodedBodySize: e.encodedBodySize, decodedBodySize: e.decodedBodySize });
      }).observe({ type: 'resource', buffered: true });
    } catch (_) {}
    document.addEventListener('load', e => {
      const t = e.target;
      if (t && t.tagName === 'IMG' && /ART_ASSETS\/bosses\/tanda_0[12]\//.test(t.currentSrc || t.src || '')) gate.imageLoadEvents.push({ src: t.currentSrc || t.src, at: performance.now(), complete: t.complete, naturalWidth: t.naturalWidth, naturalHeight: t.naturalHeight });
    }, true);
  });
  await page.route('**/ART_PACK/art_pack.js', async route => {
    await route.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8', headers: { 'cache-control': 'no-store' }, body: config === 'T02' ? packInfo.originalSource : packInfo.baselineBody });
  });
  let sceneInfo;
  try {
    sceneInfo = await beginScene(page, config, packInfo, manifests);
    await Promise.all([page.waitForTimeout(WARMUP_MS), scriptedControls(page, WARMUP_MS)]);
    if (options.screenshot) await page.screenshot({ path: path.join(out, `screenshots/${config}_pair${String(pair).padStart(2, '0')}.png`), fullPage: false });
    if (options.trace) {
      const cdp = await context.newCDPSession(page);
      const events = [];
      let tracingDone;
      const done = new Promise(resolve => { tracingDone = resolve; });
      cdp.on('Tracing.dataCollected', e => events.push(...e.value));
      cdp.on('Tracing.tracingComplete', () => tracingDone());
      await cdp.send('Tracing.start', { transferMode: 'ReportEvents', categories: 'devtools.timeline,blink.user_timing,toplevel,cc,gpu,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,disabled-by-default-cc.debug' });
      await Promise.all([page.waitForTimeout(PROFILE_MS), scriptedControls(page, PROFILE_MS)]);
      await cdp.send('Tracing.end');
      let traceTimer;
      try {
        await Promise.race([done, new Promise((_, reject) => { traceTimer = setTimeout(() => reject(new Error('Chrome trace did not finish within 45 seconds')), 45000); })]);
      } finally { clearTimeout(traceTimer); }
      const traceFile = path.join(out, `traces/profile_${config}.json`);
      writeJson(traceFile, { metadata: { configuration: config, pair: pair, scene: EXPECTED_BOSS_ID, durationMs: PROFILE_MS, diagnosticOnly: true }, traceEvents: events });
      sceneInfo.traceSummary = traceSummary(events);
      await cdp.detach().catch(() => {});
      return { traceSummary: sceneInfo.traceSummary, traceFile: `traces/profile_${config}.json` };
    }
    const pre = await page.evaluate(() => ({ time: performance.now(), jsHeapUsedBytes: performance.memory ? performance.memory.usedJSHeapSize : null, visibility: document.visibilityState }));
    if (pre.visibility !== 'visible') throw new Error('Browser tab became backgrounded; rAF measurements would be invalid.');
    const measured = await Promise.all([
      page.evaluate(duration => new Promise(resolve => {
        const out = [], start = performance.now(); let previous = start;
        function step(now) {
          if (now - start >= duration) { resolve(out); return; }
          const delta = now - previous;
          if (delta > 0 && delta < 10000) out.push(delta);
          previous = now;
          requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }), MEASURE_MS),
      scriptedControls(page, MEASURE_MS)
    ]);
    const frames = measured[0];
    const post = await page.evaluate(() => ({ time: performance.now(), jsHeapUsedBytes: performance.memory ? performance.memory.usedJSHeapSize : null, visibility: document.visibilityState, secret: window.DMO.secretBoss.state(), bossId: window.DMO.combatArt.info().bossId }));
    const instrumentation = await page.evaluate(() => ({ imageLoadEvents: window.__externalGpuGate.imageLoadEvents, resourceEntries: window.__externalGpuGate.resourceEntries, resourceTiming: performance.getEntriesByType('resource').filter(e => /ART_ASSETS\/bosses\/tanda_0[12]\//.test(e.name)).map(e => ({ name: e.name, startTime: e.startTime, duration: e.duration, responseEnd: e.responseEnd, transferSize: e.transferSize, encodedBodySize: e.encodedBodySize, decodedBodySize: e.decodedBodySize })) }));
    const localFailures = errors.failedRequests.filter(e => localError(e.url, origin));
    const localBad = errors.badResponses.filter(e => localError(e.url, origin));
    // This frozen HTML documents a hosting-injected Cloudflare challenge script that is intentionally absent.
    // Ignore only its exact known 404 path, and only the same number of generic 404 console messages.
    const knownChallenge404s = errors.badResponses.filter(e => e.status === 404 && /\/cdn-cgi\/challenge-platform\/scripts\/jsd\/main\.js(?:\?|$)/.test(e.url));
    const blockingLocalBad = localBad.filter(e => !knownChallenge404s.includes(e));
    let challengeConsoleAllowance = knownChallenge404s.length;
    const hardConsole = errors.console.filter(e => {
      if (/\/cdn-cgi\/challenge-platform\//.test(JSON.stringify(e))) return false;
      if (challengeConsoleAllowance > 0 && /Failed to load resource:.*404/i.test(e.text)) { challengeConsoleAllowance--; return false; }
      return true;
    });
    const sameScene = post.secret && post.secret.secretBossActive === true && post.bossId === EXPECTED_BOSS_ID;
    const valid = frames.length >= 300 && errors.page.length === 0 && localFailures.length === 0 && blockingLocalBad.length === 0 && hardConsole.length === 0 && post.visibility === 'visible' && sameScene;
    const stats = frameStats(frames);
    const result = {
      runId: `${config}-pair${pair}-order${scheduleIndex + 1}`, configuration: config, pair, scheduleIndex: scheduleIndex + 1,
      startedAt: sceneInfo.startedAt, finishedAt: new Date().toISOString(), status: valid ? 'VALID_HARDWARE_PASS' : 'INVALID_REVIEW_REQUIRED', valid,
      scene: sceneInfo.scene, sceneStillActiveAtEnd: sameScene, packAudit: sceneInfo.packAudit, postLoadDecode: sceneInfo.decode,
      controls: { keys: ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'], pattern: 'hold each key for up to 1150 ms with 100 ms neutral gap; repeat throughout warmup and measurement; no firing or gameplay-state overrides' },
      warmupMs: WARMUP_MS, measuredMs: post.time - pre.time, frameStats: stats, rawFrameTimesMs: frames,
      memory: { beforeJsHeapUsedBytes: pre.jsHeapUsedBytes, afterJsHeapUsedBytes: post.jsHeapUsedBytes, deltaJsHeapUsedBytes: pre.jsHeapUsedBytes !== null && post.jsHeapUsedBytes !== null ? post.jsHeapUsedBytes - pre.jsHeapUsedBytes : null, gpuMemory: 'not exposed by this harness/browser; not inferred from JS heap' },
      assetRequests: instrumentation.resourceTiming, imageLoadEvents: instrumentation.imageLoadEvents,
      errors: { page: errors.page, console: errors.console, failedRequests: errors.failedRequests, badResponses: errors.badResponses, knownChallenge404s: knownChallenge404s, blockingPageErrors: errors.page.length, blockingLocalFailures: localFailures, blockingLocalBadResponses: blockingLocalBad, blockingConsoleErrors: hardConsole },
      screenshot: options.screenshot ? `screenshots/${config}_pair${String(pair).padStart(2, '0')}.png` : null
    };
    return result;
  } finally { await context.close().catch(() => {}); }
}
function traceSummary(events) {
  const dur = (e) => Number(e.dur || 0) / 1000;
  const mainJs = events.filter(e => ['RunTask', 'FunctionCall', 'EvaluateScript', 'RunMicrotasks'].includes(e.name) && /devtools\.timeline|toplevel/.test(e.cat || ''));
  const render = events.filter(e => /^(Paint|RasterTask|CompositeLayers|DrawFrame|UpdateLayerTree|Commit)$/.test(e.name || '') || /gpu/.test(e.cat || ''));
  return {
    eventCount: events.length,
    mainThreadJsTaskEventCount: mainJs.length, mainThreadJsEventDurationSumMs: mainJs.reduce((s, e) => s + dur(e), 0),
    renderCompositorGpuEventCount: render.length, renderCompositorGpuEventDurationSumMs: render.reduce((s, e) => s + dur(e), 0),
    interpretation: 'Diagnostic trace categories may overlap. Main-thread JS includes both game logic and Canvas draw-command submission; compositor/raster/GPU durations are not additive and do not isolate all rendering cost.'
  };
}
function summarizeRuns(runs) {
  const valid = runs.filter(r => r.valid);
  const metrics = ['meanMs', 'medianMs', 'p95Ms', 'p99Ms', 'maxMs', 'fpsFromMeanFrameMs'];
  const perRun = valid.map(r => ({ runId: r.runId, pair: r.pair, frameStats: r.frameStats, assetRequestCount: r.assetRequests.length, postLoadDecodeWallMs: r.postLoadDecode.postLoadDecodeWallMs, jsHeapDeltaBytes: r.memory.deltaJsHeapUsedBytes }));
  const aggregate = {};
  for (const metric of metrics) {
    const field = metric === 'fpsFromMeanFrameMs' ? 'fpsFromMeanFrameMs' : metric;
    const values = valid.map(r => r.frameStats[field]).filter(Number.isFinite);
    aggregate[field] = { medianAcrossRuns: median(values), minAcrossRuns: values.length ? Math.min(...values) : null, maxAcrossRuns: values.length ? Math.max(...values) : null, q1: quantile(values, 0.25), q3: quantile(values, 0.75), validRunCount: values.length };
  }
  const means = valid.map(r => r.frameStats.meanMs).filter(Number.isFinite);
  const q1 = quantile(means, 0.25), q3 = quantile(means, 0.75), iqr = q1 === null ? null : q3 - q1;
  const outliers = iqr === null ? [] : valid.filter(r => r.frameStats.meanMs < q1 - 1.5 * iqr || r.frameStats.meanMs > q3 + 1.5 * iqr).map(r => ({ runId: r.runId, meanMs: r.frameStats.meanMs, retained: true }));
  return { validRunCount: valid.length, invalidRunCount: runs.length - valid.length, aggregate, perRun, outliersRetained: outliers };
}
function comparisonRecord(t01, t02, gpuDiagnostics, contract) {
  const valid01 = t01.filter(r => r.valid), valid02 = t02.filter(r => r.valid);
  const pairs = [];
  for (let i = 1; i <= PAIR_COUNT; i++) {
    const a = valid01.find(r => r.pair === i), b = valid02.find(r => r.pair === i);
    if (!a || !b) continue;
    pairs.push({ pair: i, T01MeanFrameMs: a.frameStats.meanMs, T02MeanFrameMs: b.frameStats.meanMs, meanFrameMsDelta: b.frameStats.meanMs - a.frameStats.meanMs, meanFramePercentChange: a.frameStats.meanMs ? 100 * (b.frameStats.meanMs - a.frameStats.meanMs) / a.frameStats.meanMs : null, T01P95FrameMs: a.frameStats.p95Ms, T02P95FrameMs: b.frameStats.p95Ms, p95FrameMsDelta: b.frameStats.p95Ms - a.frameStats.p95Ms, p95FramePercentChange: a.frameStats.p95Ms ? 100 * (b.frameStats.p95Ms - a.frameStats.p95Ms) / a.frameStats.p95Ms : null });
  }
  const sufficient = valid01.length === PAIR_COUNT && valid02.length === PAIR_COUNT && pairs.length === PAIR_COUNT && gpuDiagnostics.hardwareGpuVerified;
  return {
    status: sufficient ? 'PAIRED_DATA_READY_FOR_HUMAN_REVIEW' : 'INSUFFICIENT_VALID_PAIRS',
    gateDecision: 'NOT_AUTOMATICALLY_DETERMINED', validHardwarePasses: { T01: valid01.length, T02: valid02.length }, pairedPasses: pairs.length,
    T01: summarizeRuns(t01), T02: summarizeRuns(t02), pairedDeltas: pairs,
    pairedMedianMeanFramePercentChange: median(pairs.map(p => p.meanFramePercentChange)),
    pairedMedianP95FramePercentChange: median(pairs.map(p => p.p95FramePercentChange)),
    scope: 'T02 config loads all 10 BOSS-T02 records; the live gameplay fixture is the native secret encounter stable ID boss_05_fusioncosmica. This does not benchmark Boss06/Boss07-specific hot draw paths.',
    attribution: 'Network/resource load and post-load decode confirmation are recorded separately. Chrome traces are diagnostic only; JS includes game logic plus Canvas draw submission, and GPU/compositor events may overlap.',
    sourceHead: contract.head_commit, gpuStatus: gpuDiagnostics.status,
    caveats: ['Five pairs are a minimum, not a statistical guarantee.', 'Outliers are retained and flagged; no pass is deleted.', 'No regression/no-regression verdict is inferred from isolated metrics or insufficient pairs.']
  };
}
function writeCharts(out, runs) {
  const colors = { T01: '#335cbb', T02: '#d9488b' };
  const w = 1200, h = 640, left = 70, top = 40, bottom = 550, right = 1160;
  const allP99 = runs.filter(r => r.valid).map(r => r.frameStats.p99Ms).filter(Number.isFinite);
  const ymax = Math.max(34, Math.min(250, Math.ceil((Math.max(...allP99, 34)) / 10) * 10));
  let paths = '';
  for (const run of runs.filter(r => r.valid)) {
    const values = run.rawFrameTimesMs;
    const stride = Math.max(1, Math.ceil(values.length / 1000));
    const pts = [];
    for (let i = 0; i < values.length; i += stride) {
      const x = left + (i / Math.max(1, values.length - 1)) * (right - left);
      const y = bottom - Math.min(ymax, values[i]) / ymax * (bottom - top);
      pts.push(`${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    paths += `<path d="${pts.join(' ')}" fill="none" stroke="${colors[run.configuration]}" stroke-opacity="${run.configuration === 'T01' ? '0.44' : '0.48'}" stroke-width="1"/>`;
  }
  const grid = [0, 8, 16, 24, 34, 50, 100, 150, 200, ymax].filter((v, i, a) => v <= ymax && a.indexOf(v) === i).map(v => {
    const y = bottom - v / ymax * (bottom - top);
    return `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#d8dee9"/><text x="${left - 10}" y="${y + 4}" text-anchor="end" font-size="12">${v}</text>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white"/><text x="${w / 2}" y="24" text-anchor="middle" font-family="sans-serif" font-size="18">Frame-time samples by run (downsampled for display; raw arrays retained)</text>${grid}<line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="#333"/><text x="${w / 2}" y="605" text-anchor="middle" font-family="sans-serif" font-size="13">Measurement window · sample index</text><text x="18" y="300" transform="rotate(-90 18 300)" text-anchor="middle" font-family="sans-serif" font-size="13">Frame time (ms), display capped at ${ymax}</text>${paths}<rect x="860" y="48" width="280" height="55" fill="white" stroke="#ddd"/><line x1="875" y1="66" x2="915" y2="66" stroke="${colors.T01}" stroke-width="3"/><text x="925" y="70" font-family="sans-serif" font-size="13">T01 (blue)</text><line x1="875" y1="86" x2="915" y2="86" stroke="${colors.T02}" stroke-width="3"/><text x="925" y="90" font-family="sans-serif" font-size="13">T01 + BOSS-T02 (magenta)</text></svg>`;
  fs.writeFileSync(path.join(out, 'performance_charts/frame_time_series.svg'), svg);
  const pairs = [];
  for (let i = 1; i <= PAIR_COUNT; i++) {
    const a = runs.find(r => r.valid && r.configuration === 'T01' && r.pair === i);
    const b = runs.find(r => r.valid && r.configuration === 'T02' && r.pair === i);
    if (a && b) pairs.push({ i, a: a.frameStats.meanMs, b: b.frameStats.meanMs });
  }
  const max = Math.max(1, ...pairs.flatMap(p => [p.a, p.b])) * 1.15;
  const y0 = 520, y1 = 70, x0 = 100, x1 = 1120;
  const marks = pairs.map((p, j) => {
    const x = x0 + (j + 0.5) * (x1 - x0) / Math.max(1, PAIR_COUNT);
    const ya = y0 - p.a / max * (y0 - y1), yb = y0 - p.b / max * (y0 - y1);
    return `<line x1="${x}" y1="${ya}" x2="${x}" y2="${yb}" stroke="#777"/><circle cx="${x}" cy="${ya}" r="7" fill="${colors.T01}"/><circle cx="${x}" cy="${yb}" r="7" fill="${colors.T02}"/><text x="${x}" y="545" text-anchor="middle" font-size="12">pair ${p.i}</text><text x="${x}" y="${Math.min(ya,yb)-12}" text-anchor="middle" font-size="11">${p.a.toFixed(2)} / ${p.b.toFixed(2)} ms</text>`;
  }).join('');
  const pairedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="620"><rect width="100%" height="100%" fill="white"/><text x="600" y="28" text-anchor="middle" font-family="sans-serif" font-size="18">Paired per-run mean frame time (T01 vs T01+BOSS-T02)</text><line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="#333"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="#333"/><text x="22" y="300" transform="rotate(-90 22 300)" text-anchor="middle" font-family="sans-serif" font-size="13">Mean frame time (ms)</text>${marks}<text x="830" y="80" fill="${colors.T01}" font-family="sans-serif">● T01</text><text x="900" y="80" fill="${colors.T02}" font-family="sans-serif">● T01+BOSS-T02</text></svg>`;
  fs.writeFileSync(path.join(out, 'performance_charts/paired_mean_frame_time.svg'), pairedSvg);
}
async function validateSceneOnly(browser, origin, packInfo, manifests) {
  const checks = [];
  for (const config of ['T01', 'T02']) {
    const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.__origin = origin;
    await page.route('**/ART_PACK/art_pack.js', async route => {
      await route.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8', headers: { 'cache-control': 'no-store' }, body: config === 'T02' ? packInfo.originalSource : packInfo.baselineBody });
    });
    try {
      const scene = await beginScene(page, config, packInfo, manifests);
      checks.push({ configuration: config, passed: true, stableBossId: scene.scene.stableBossId, packAudit: scene.packAudit, imageReadiness: { records: scene.decode.records.length, allLoaded: scene.decode.records.every(x => x.loaded), ids: scene.decode.records.map(x => x.id) }, check: 'native secret encounter + exact pack delta; no timed samples collected' });
    } finally { await context.close().catch(() => {}); }
  }
  return { status: checks.length === 2 && checks.every(c => c.passed) ? 'PASS_PRECONDITIONS_ONLY' : 'FAIL', purpose: 'Software-rendered precondition smoke only; not a GPU benchmark and not performance evidence.', browserVersion: browser.version(), gpuStatus: 'diagnostics recorded separately; ignored for this precondition-only check', metricsCollected: false, sourceHashPreflightPassed: true, removedBOSS_T02RecordsInT01: packInfo.removedRecords, configurations: checks, validatedAt: new Date().toISOString() };
}
async function main() {
  const options = argsOf(process.argv);
  if (options.help) { console.log(usage()); return; }
  if (!options.out) throw new Error('--out is required; every run must write to a fresh directory.');
  const out = path.resolve(process.cwd(), options.out);
  assertFreshOutput(out);
  const loaded = loadContract();
  const baseline = transformBaselinePack(loaded.packSource);
  const packInfo = { originalSource: loaded.packSource, baselineBody: baseline.body, originalSha256: sha256(loaded.packSource), baselineSha256: baseline.retainedSha256, removedRecords: baseline.removedRecords };
  writeJson(path.join(out, 'source_hashes_used.json'), { contract: loaded.contract, actualAtRun: loaded.actual, packFilter: { removedRecords: baseline.removedRecords, removedRecordIds: baseline.removedRecordIds, baselinePackSha256: baseline.retainedSha256, T02PackSha256: packInfo.originalSha256, nonT02SourceLinesPreservedExactly: baseline.nonT02SourceLinesPreservedExactly, exactAOnlyDeltaValidated: true } });
  let chromium;
  try { chromium = require('playwright-core').chromium; }
  catch (e) { throw new Error(`playwright-core is required on the external test machine: ${e.message}`); }
  const launch = { headless: options.validateSceneOnly, args: ['--window-size=1440,1000', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] };
  if (options.chromePath) launch.executablePath = options.chromePath;
  else launch.channel = 'chrome';
  const browser = await chromium.launch(launch);
  try {
    const gpu = await diagnostics(browser);
    const environment = environmentRecord(browser, gpu, loaded.contract, options.validateSceneOnly);
    writeJson(path.join(out, 'gpu_diagnostics.json'), gpu);
    writeJson(path.join(out, 'environment.json'), environment);
    if (options.validateSceneOnly) {
      const { server, origin } = await createStaticServer();
      try {
        const validation = await validateSceneOnly(browser, origin, packInfo, { t01: loaded.t01, t02: loaded.t02 });
        writeJson(path.join(out, 'sandbox_precondition_check.json'), validation);
        console.log(`${validation.status}: ${validation.configurations.length} asset-only A/B scene preconditions checked; no performance sampling.`);
        if (validation.status !== 'PASS_PRECONDITIONS_ONLY') process.exitCode = 3;
      } finally { await new Promise(resolve => server.close(resolve)); }
      return;
    }
    if (!gpu.hardwareGpuVerified) {
      const reason = `${gpu.status}: ${gpu.reason}`;
      writeBlockedFiles(out, gpu, environment, reason);
      console.error(`BLOCKED — ${reason}. No benchmark scene or timed pass was started.`);
      process.exitCode = 2;
      return;
    }
    writeJson(path.join(out, 'gate_status.json'), { status: 'HARDWARE_GPU_VERIFIED', preflightAt: new Date().toISOString(), benchmarkStarted: !options.preflightOnly, noBenchmarkRunsStarted: !!options.preflightOnly, noGpuMetricsCollected: true });
    if (options.preflightOnly) { console.log('Hardware-GPU preflight passed. No scene or benchmark was started.'); return; }
    for (const folder of ['screenshots', 'traces', 'performance_charts']) fs.mkdirSync(path.join(out, folder), { recursive: true });
    const { server, origin } = await createStaticServer();
    const runs = [];
    const t01 = [], t02 = [];
    try {
      for (let i = 0; i < SCHEDULE.length; i++) {
        const config = SCHEDULE[i], pair = Math.floor(i / 2) + 1;
        console.log(`Starting ${config} pair ${pair}/5 (order ${i + 1}/10)`);
        const result = await runOne(browser, origin, out, config, pair, i, packInfo, { t01: loaded.t01, t02: loaded.t02 }, { screenshot: pair === 1 });
        runs.push(result); (config === 'T01' ? t01 : t02).push(result);
        writeJson(path.join(out, `runs_${config}.json`), { configuration: config === 'T01' ? 'T01 only' : 'T01+BOSS-T02', status: 'IN_PROGRESS', runs: config === 'T01' ? t01 : t02 });
        writeJson(path.join(out, 'raw_metrics.json'), { status: 'IN_PROGRESS', frameTimesUnit: 'ms', runs: runs.map(r => ({ runId: r.runId, configuration: r.configuration, pair: r.pair, frameTimesMs: r.rawFrameTimesMs })) });
      }
      for (const config of ['T01', 'T02']) {
        const pair = 99;
        console.log(`Collecting diagnostic Chrome trace for ${config} (excluded from timed matrix)`);
        await runOne(browser, origin, out, config, pair, SCHEDULE.length, packInfo, { t01: loaded.t01, t02: loaded.t02 }, { trace: true });
      }
    } finally { await new Promise(resolve => server.close(resolve)); }
    writeJson(path.join(out, 'runs_T01.json'), { configuration: 'T01 only', status: 'COMPLETE', runs: t01 });
    writeJson(path.join(out, 'runs_T02.json'), { configuration: 'T01+BOSS-T02', status: 'COMPLETE', runs: t02 });
    writeJson(path.join(out, 'raw_metrics.json'), { status: 'COMPLETE', frameTimesUnit: 'ms', runs: runs.map(r => ({ runId: r.runId, configuration: r.configuration, pair: r.pair, frameTimesMs: r.rawFrameTimesMs })) });
    const comparison = comparisonRecord(t01, t02, gpu, loaded.contract);
    writeJson(path.join(out, 'comparison.json'), comparison);
    if (comparison.status === 'PAIRED_DATA_READY_FOR_HUMAN_REVIEW') writeCharts(out, runs);
    else fs.writeFileSync(path.join(out, 'performance_charts/README.md'), '# Performance charts\n\nNot generated: at least five valid hardware-GPU passes per configuration and five complete pairs are required. See `comparison.json`; no verdict was inferred.\n');
    writeJson(path.join(out, 'gate_status.json'), { status: comparison.status, gpu: gpu.status, validHardwarePasses: comparison.validHardwarePasses, pairedPasses: comparison.pairedPasses, gateDecision: comparison.gateDecision, completedAt: new Date().toISOString() });
    console.log(`Benchmark matrix complete. Valid passes: T01 ${comparison.validHardwarePasses.T01}/5; T02 ${comparison.validHardwarePasses.T02}/5; paired ${comparison.pairedPasses}/5. No automatic close/regression verdict was made.`);
  } finally { await browser.close().catch(() => {}); }
}

module.exports = { transformBaselinePack, classifyGpu, frameStats, median, quantile, traceSummary, SCHEDULE, beginScene, createStaticServer, runtimeImageFiles, loadContract };
if (require.main === module) main().catch(e => { console.error(`ERROR: ${e.stack || e}`); process.exitCode = 1; });
