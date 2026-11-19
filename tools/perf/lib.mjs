import { chromium as pw } from '/tmp/pwtest/node_modules/playwright-core/index.mjs';
import chromium from '/tmp/pwtest/node_modules/@sparticuz/chromium/build/index.js';

export async function launch(opts = {}) {
  const exe = await chromium.executablePath();
  const args = [
    ...chromium.args.filter(a => !a.startsWith('--single-process')),
    '--font-render-hinting=none',
    '--autoplay-policy=no-user-gesture-required',
  ];
  const browser = await pw.launch({
    executablePath: exe, args,
    env: { ...process.env, LD_LIBRARY_PATH: '/tmp/al2023/lib' },
    headless: true,
  });
  return browser;
}

/* Records resource timings + console + page errors from the very first byte. */
export async function instrument(page) {
  const logs = [], errors = [], reqfails = [];
  page.on('console', m => logs.push({ type: m.type(), text: m.text() }));
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  page.on('requestfailed', r => reqfails.push({ url: r.url(), err: r.failure() && r.failure().errorText }));
  await page.addInitScript(() => {
    window.__marks = {};
    window.__t0 = performance.now();
    const obs = (name) => { window.__marks[name] = performance.now(); };
    window.__pillObserver = new MutationObserver((list) => {
      // first menu button focusable => interactive
      const b = document.querySelector('#dd-menu-nav .dd-menu-btn');
      if (b) { window.__marks.menuButtonExists = window.__marks.menuButtonExists || performance.now(); }
      const m = document.querySelector('#dd-main-menu');
      if (m && !m.classList.contains('dd-hidden')) window.__marks.menuVisible = window.__marks.menuVisible || performance.now();
      const st = document.body.getAttribute('data-dd-state');
      if (st === 'main_menu') window.__marks.mainMenuState = window.__marks.mainMenuState || performance.now();
    });
    document.addEventListener('DOMContentLoaded', () => {
      try { window.__pillObserver.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class','data-dd-state'] }); } catch(e){}
      window.__marks.domContentLoaded = performance.now();
    });
    const fi = performance.getEntriesByType('first-contentful-paint');
  });
  return { logs, errors, reqfails };
}

export async function collect(page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const paints = {};
    performance.getEntriesByType('paint').forEach(p => paints[p.name] = Math.round(p.startTime));
    const res = performance.getEntriesByType('resource').map(r => ({
      name: r.name.replace(location.origin + '/', ''),
      type: r.initiatorType, start: Math.round(r.startTime), dur: Math.round(r.duration),
      size: r.transferSize || 0, dec: r.decodedBodySize || 0
    }));
    const total = res.reduce((a, r) => a + r.size, 0);
    return {
      marks: Object.fromEntries(Object.entries(window.__marks || {}).map(([k, v]) => [k, Math.round(v)])),
      paints,
      boot: (window.DD_BOOT && window.DD_BOOT.getEvidence) ? window.DD_BOOT.getEvidence() : null,
      state: (window.DD_BOOT && window.DD_BOOT.getState) ? window.DD_BOOT.getState() : null,
      trace: (window.DD_BOOT && window.DD_BOOT.getTrace) ? window.DD_BOOT.getTrace() : null,
      resources: res.sort((a,b)=>b.dur-a.dur).slice(0, 40),
      resourceCount: res.length,
      transferTotal: total,
      nav: { domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0), load: Math.round(nav.loadEventEnd || 0), ttfb: Math.round(nav.responseStart || 0) }
    };
  });
}
