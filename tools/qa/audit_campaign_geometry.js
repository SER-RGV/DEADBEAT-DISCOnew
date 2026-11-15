#!/usr/bin/env node
/* ============================================================================
 * DEADBEAT DISCO — CAMPAIGN GEOMETRY RUNTIME AUDIT (READ ONLY)
 * ----------------------------------------------------------------------------
 * Introspects the existing campaign globals after entering r0. It does not
 * patch game functions, teleport actors, alter assets, or write game state
 * outside the isolated Playwright browser context.
 *
 * Usage:
 *   QA_LIB=playwright-core node tools/qa/audit_campaign_geometry.js [url] [outdir]
 *
 * Defaults:
 *   URL    http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html
 *   OUTDIR ART_EVIDENCE/campaign_geometry
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.QA_LIB || 'playwright-core');

const URL = process.argv[2] || 'http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html';
const OUTDIR = path.resolve(process.argv[3] || path.join(process.cwd(), 'ART_EVIDENCE', 'campaign_geometry'));
const LIMITS = { depth: 5, array: 400, keys: 180, functionSource: 7000, string: 1200 };

function safeCall(fn) {
  try { return { ok: true, value: fn() }; }
  catch (e) { return { ok: false, error: String(e && e.stack || e).slice(0, 1200) }; }
}

function describeValue(value, depth, seen) {
  if (value === null || value === undefined) return value;
  const type = typeof value;
  if (type === 'string') return value.length > LIMITS.string ? value.slice(0, LIMITS.string) + '…[truncated]' : value;
  if (type === 'number' || type === 'boolean') return Number.isFinite(value) || type !== 'number' ? value : String(value);
  if (type === 'bigint') return String(value);
  if (type === 'symbol') return String(value);
  if (type === 'function') {
    let source = '';
    try { source = Function.prototype.toString.call(value).slice(0, LIMITS.functionSource); } catch (_) {}
    return { __type: 'function', name: value.name || '(anonymous)', source };
  }
  if (depth >= LIMITS.depth) return { __type: 'object', constructor: value.constructor && value.constructor.name || 'Object', truncated: 'depth-limit' };
  if (seen.has(value)) return { __type: 'circular-reference' };
  seen.add(value);
  if (Array.isArray(value)) {
    const result = value.slice(0, LIMITS.array).map(v => describeValue(v, depth + 1, seen));
    if (value.length > LIMITS.array) result.push({ __truncatedItems: value.length - LIMITS.array });
    seen.delete(value);
    return result;
  }
  const ctor = value.constructor && value.constructor.name || 'Object';
  if (/^(HTML|Canvas|Image|Audio|Video|WebGL|Window|Document)/.test(ctor)) {
    seen.delete(value);
    return { __type: 'browser-object', constructor: ctor };
  }
  const out = { __type: 'object', constructor: ctor, properties: {} };
  let keys = [];
  try { keys = Object.keys(value).slice(0, LIMITS.keys); } catch (e) { out.keyError = String(e); }
  for (const key of keys) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); } catch (_) { continue; }
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
      out.properties[key] = { __type: 'accessor-not-invoked' };
      continue;
    }
    out.properties[key] = describeValue(descriptor.value, depth + 1, seen);
  }
  if (Object.keys(value).length > LIMITS.keys) out.truncatedKeys = Object.keys(value).length - LIMITS.keys;
  seen.delete(value);
  return out;
}

function inspectGlobal(name, value) {
  if (value == null) return { present: false };
  const out = { present: true, type: typeof value, constructor: value.constructor && value.constructor.name || null, members: {} };
  let names = [];
  try { names = Object.getOwnPropertyNames(value); } catch (e) { out.error = String(e); }
  out.memberCount = names.length;
  for (const key of names.slice(0, LIMITS.keys)) {
    let d;
    try { d = Object.getOwnPropertyDescriptor(value, key); } catch (_) { continue; }
    if (!d) continue;
    if (!Object.prototype.hasOwnProperty.call(d, 'value')) {
      out.members[key] = { type: 'accessor', getter: !!d.get, setter: !!d.set };
    } else {
      const v = d.value;
      out.members[key] = typeof v === 'function'
        ? describeValue(v, 0, new WeakSet())
        : { type: typeof v, preview: describeValue(v, 0, new WeakSet()) };
    }
  }
  return out;
}

const SNAPSHOT = `() => {
  const W = window;
  const call = (label, fn) => {
    try { return { ok: true, value: fn() }; }
    catch (e) { return { ok: false, error: String(e && e.stack || e).slice(0, 1200) }; }
  };
  const names = ['DMO_DUNGEON', 'DMO_LAYOUT', 'DMO_FLOOR', 'DMO_FLOOR_ANIM', 'DMO_HUB', 'DMO'];
  const globals = {};
  for (const name of names) {
    let value;
    try { value = W[name]; } catch (e) { globals[name] = { present: false, error: String(e) }; continue; }
    if (value == null) { globals[name] = { present: false }; continue; }
    const members = {};
    let keys = [];
    try { keys = Object.getOwnPropertyNames(value).slice(0, 180); } catch (e) {}
    for (const key of keys) {
      let d;
      try { d = Object.getOwnPropertyDescriptor(value, key); } catch (_) { continue; }
      if (!d) continue;
      if (!Object.prototype.hasOwnProperty.call(d, 'value')) {
        members[key] = { type: 'accessor', getter: !!d.get, setter: !!d.set };
      } else {
        const v = d.value;
        members[key] = typeof v === 'function'
          ? { type: 'function', name: v.name || '(anonymous)', source: String(v).slice(0, 7000) }
          : { type: typeof v, constructor: v && v.constructor ? v.constructor.name : null };
      }
    }
    globals[name] = { present: true, type: typeof value, constructor: value.constructor && value.constructor.name || null, memberCount: keys.length, members };
  }
  const dungeon = call('DMO_DUNGEON.state', () => W.DMO_DUNGEON.state());
  const hub = call('DMO_HUB.state', () => W.DMO_HUB.state());
  const debug = call('DMO.debug.state', () => W.DMO.debug.state());
  const camera = call('DMO.camera', () => W.DMO.camera());
  const observe = call('DMO.observe', () => W.DMO.observe());
  const stats = call('DMO.testStats', () => W.DMO.testStats());
  const props = call('DMO_LAYOUT.propObjects', () => W.DMO_LAYOUT.propObjects());
  const propSample = props.ok && Array.isArray(props.value) ? props.value.slice(0, 400).map(p => {
    if (!p || typeof p !== 'object') return p;
    const o = {};
    for (const k of Object.keys(p).slice(0, 80)) {
      const d = Object.getOwnPropertyDescriptor(p, k);
      if (d && Object.prototype.hasOwnProperty.call(d, 'value')) {
        const v = d.value;
        o[k] = (typeof v === 'function') ? '[function]' :
          (v && typeof v === 'object') ? { type: v.constructor && v.constructor.name || 'Object' } : v;
      } else o[k] = '[accessor]';
    }
    return o;
  }) : null;
  return {
    capturedAt: new Date().toISOString(),
    location: W.location.href,
    hub, dungeon, debug, camera, observe, stats,
    layoutProps: props.ok ? { ok: true, count: Array.isArray(props.value) ? props.value.length : null, sample: propSample } : props,
    globals
  };
}`;

(async () => {
  fs.mkdirSync(OUTDIR, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/tmp/chromium',
    headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: process.env.LD_LIB_PATH || '/tmp/chromelibs/lib:/tmp' },
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--use-gl=swiftshader', '--disable-background-networking']
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = { console: [], page: [], http: [], failed: [] };
  page.on('console', m => { if (m.type() === 'error') errors.console.push(m.text().slice(0, 240)); });
  page.on('pageerror', e => errors.page.push(String(e && e.stack || e).slice(0, 500)));
  page.on('response', r => { if (r.status() >= 400) errors.http.push({ status: r.status(), url: r.url().slice(0, 200) }); });
  page.on('requestfailed', r => errors.failed.push({ url: r.url().slice(0, 200), reason: r.failure() && r.failure().errorText }));

  const started = Date.now();
  await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!(window.DMO && window.DMO_HUB && window.DMO_DUNGEON && window.DMO_LAYOUT), { timeout: 120000 });
  const loadMs = Date.now() - started;

  // Follow the same existing menu → HUB route used by repository QA scripts.
  await page.mouse.click(640, 450);
  await page.waitForTimeout(600);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
  await page.keyboard.down('Escape');
  await page.waitForTimeout(2800);
  await page.keyboard.up('Escape');
  await page.waitForFunction(() => {
    try { return window.DMO_HUB.state().inHub === true; } catch (_) { return false; }
  }, { timeout: 30000 });

  const startResult = await page.evaluate(() => {
    try { return { ok: true, value: window.DMO_HUB.startCampaignFromHub(0) }; }
    catch (e) { return { ok: false, error: String(e && e.stack || e) }; }
  });
  await page.waitForFunction(() => {
    try {
      const h = window.DMO_HUB.state();
      return h.location === 'CAMPAIGN_ROOM' && h.inHub === false && h.transitionLock === false && h.transitionsCompleted >= 1;
    } catch (_) { return false; }
  }, { timeout: 60000 });
  await page.waitForTimeout(1400);

  const snapshot = await page.evaluate(SNAPSHOT);
  snapshot.loadMs = loadMs;
  snapshot.startCampaign = startResult;
  snapshot.errors = errors;
  const screenshot = path.join(OUTDIR, 'campaign_r0_1280x900.png');
  await page.screenshot({ path: screenshot, fullPage: false });
  snapshot.screenshot = path.basename(screenshot);

  const jsonPath = path.join(OUTDIR, 'campaign_geometry_probe.json');
  fs.writeFileSync(jsonPath, JSON.stringify(snapshot, null, 2));
  console.log(JSON.stringify({
    loadMs,
    campaign: snapshot.hub && snapshot.hub.value && snapshot.hub.value.location,
    seed: snapshot.dungeon && snapshot.dungeon.value && snapshot.dungeon.value.seed,
    graphNodes: snapshot.dungeon && snapshot.dungeon.value && snapshot.dungeon.value.graph && snapshot.dungeon.value.graph.nodes && snapshot.dungeon.value.graph.nodes.length,
    propCount: snapshot.layoutProps && snapshot.layoutProps.count,
    pageErrors: errors.page.length,
    consoleErrors: errors.console.length,
    screenshot,
    jsonPath
  }, null, 2));
  await browser.close();
})().catch(e => {
  console.error('CAMPAIGN GEOMETRY AUDIT FAILED:', e && e.stack || e);
  process.exit(1);
});
