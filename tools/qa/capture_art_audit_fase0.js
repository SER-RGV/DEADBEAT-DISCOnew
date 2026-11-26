/* FASE 0 · Auditoría gráfica — capturas sistemáticas del build activo.
   Recorre menú, carga, camerino (atuendos), extras, hub, las diez plantas
   (9 círculos + núcleo), los diez jefes, la cinemática de intro, el cartel de
   círculo y las pantallas de resultado, en tres resoluciones:
     1280x900 · 1920x1080 · 390x844
   Uso:
     LD_LIBRARY_PATH=$HOME/.dd_fase01_qa/al/lib NODE_PATH=$HOME/.dd_fase01_qa/node_modules \
       node tools/qa/capture_art_audit_fase0.js <baseURL> <outDir>
   No modifica el juego: sólo navega, usa la API de depuración existente y
   vuelca JPEG + captures.json (fps por rAF, heap, errores).
   Nota: DMO.debug.invuln(true) sólo concede i-frames breves; la curación real
   entre capturas la hace DMO.debug.heal(). El estado del motor puede quedar
   "modificado" por las llamadas de depuración: es deliberado y se documenta. */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const BASE = process.argv[2] || 'http://127.0.0.1:8124';
const OUT = process.argv[3] || 'ART_EVIDENCE/art_quality/fase0';
const CHROME = process.env.DD_CHROMIUM || '/tmp/chromium';
const delay = ms => new Promise(r => setTimeout(r, ms));
const VIEWPORTS = [[1280, 900], [1920, 1080], [390, 844]];

const CIRCLES = [
  { id: 'limbo',     name: 'LIMBO' },
  { id: 'lujuria',   name: 'LUJURIA' },
  { id: 'gula',      name: 'GULA' },
  { id: 'avaricia',  name: 'AVARICIA' },
  { id: 'ira',       name: 'IRA' },
  { id: 'herejia',   name: 'HEREJÍA' },
  { id: 'violencia', name: 'VIOLENCIA' },
  { id: 'fraude',    name: 'FRAUDE' },
  { id: 'traicion',  name: 'TRAICIÓN' },
  { id: 'nucleo',    name: 'NÚCLEO FINAL' }
];
/* globalRoom de una sala normal por círculo; el núcleo sólo tiene su arena. */
const hudRoom = c => (c < 9 ? 11 * c + 2 : 100);
const bossRoom = c => (c < 9 ? 11 * c + 11 : 100);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  const captures = [];
  const errors = [];

  async function fpsHeap(page) {
    try {
      return await page.evaluate(() => new Promise(resolve => {
        let frames = 0;
        const t0 = performance.now();
        function tick() {
          frames += 1;
          const dt = performance.now() - t0;
          if (dt >= 1500) resolve({ fps: +(frames * 1000 / dt).toFixed(1), heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null });
          else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }));
    } catch (e) { return { fps: null, heapMB: null }; }
  }

  /* Curación previa a capturas de combate: el jugador sobrevive a la ventana
     de ~4 s entre curaciones. Devuelve el hp posterior. */
  async function topUp(page) {
    try {
      const hp = await page.evaluate(() => {
        try { DMO.debug.heal(); DMO.debug.heal(); DMO.debug.invuln && DMO.debug.invuln(true); } catch (e) {}
        const s = __DD_BRIDGE.getSnapshot();
        return { hp: s.hp, dead: s.dead };
      });
      return hp;
    } catch (e) { return { hp: null, dead: null }; }
  }

  async function shot(page, name, vw, vh, meta) {
    const file = `${name}-${vw}x${vh}.jpg`;
    await topUp(page);
    const perf = await fpsHeap(page);
    await page.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 80 });
    captures.push(Object.assign({ file, screen: name, viewport: `${vw}x${vh}` }, perf, meta || {}));
    console.log('shot', file, perf.fps ? `fps~${perf.fps}` : '');
  }

  for (const [vw, vh] of VIEWPORTS) {
    /* ---- carga: arranque congelado en LOADING (mismo truco que tools/qa/test_menu_visuals.js) ---- */
    const loadCtx = await browser.newContext({ viewport: { width: vw, height: vh } });
    await loadCtx.addInitScript(() => {
      const nativeTimeout = window.setTimeout.bind(window);
      window.__ddBootStart = null;
      window.setTimeout = function (fn, ms, ...args) {
        if (!window.__ddBootStart && typeof fn === 'function' && fn.name === 'start' && ms === 0) {
          window.__ddBootStart = () => nativeTimeout(fn, ms, ...args);
          return 0;
        }
        return nativeTimeout(fn, ms, ...args);
      };
    });
    const lp = await loadCtx.newPage();
    lp.on('pageerror', e => errors.push(`carga ${vw}x${vh}: ${e.message}`));
    await lp.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await lp.waitForFunction(() => typeof window.__ddBootStart === 'function', null, { timeout: 30000 });
    await lp.evaluate(async () => { try { const a = new Image(); a.src = 'assets/fase01/loading_keyart_2k.webp'; await a.decode().catch(() => {}); } catch (e) {} });
    const file = `00-carga-${vw}x${vh}.jpg`;
    await lp.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 80 });
    captures.push({ file, screen: '00-carga', viewport: `${vw}x${vh}`, fps: null, heapMB: null });
    console.log('shot', file);
    await loadCtx.close();

    /* ---- sesión principal ---- */
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`${vw}x${vh}: ${e.message}`));
    page.on('response', r => { if (r.status() >= 400) errors.push(`${vw}x${vh}: HTTP ${r.status()} ${r.url()}`); });
    await page.goto(BASE + '/index.html');
    await page.waitForFunction(() => window.DD_BOOT && window.DD_BOOT.getState().state === 'MAIN_MENU', null, { timeout: 60000 });
    await delay(600);
    await shot(page, '01-menu', vw, vh);

    /* atuendos (camerino) */
    await page.locator('#dd-menu-nav .dd-menu-btn[data-action="customize"]').click();
    await page.waitForSelector('.dd-submenu-wrap.is-open', { timeout: 10000 });
    await delay(900);
    await shot(page, '02-atuendos', vw, vh);
    await page.keyboard.press('Escape');
    await delay(400);

    /* extras */
    await page.locator('#dd-menu-nav .dd-menu-btn[data-action="extras"]').click();
    await page.waitForSelector('.dd-submenu-wrap.is-open', { timeout: 10000 });
    await delay(900);
    await shot(page, '03-extras', vw, vh);
    await page.keyboard.press('Escape');
    await delay(400);

    /* nueva partida -> intro -> descenso -> HUB */
    await page.evaluate(() => window.DD_UI.triggerMenuAction('play'));
    await delay(400);
    await page.locator('#dd-scene-new').click();
    await page.waitForFunction(() => window.DD_OPENING && DD_OPENING.getState()?.type === 'intro', null, { timeout: 20000 });
    await delay(2500);
    await shot(page, '04-cinematica-intro', vw, vh);
    await page.evaluate(() => window.DD_OPENING.debugSeek(31.9, false));
    await page.waitForFunction(() => window.DD_OPENING && DD_OPENING.getState()?.type === 'descent', null, { timeout: 10000 });
    await page.evaluate(() => window.DD_OPENING.debugSeek(4.55, false));
    await page.waitForFunction(() => window.DD_HUB && DD_HUB.isActive(), null, { timeout: 15000 });
    await delay(1600);
    await shot(page, '05-hub', vw, vh);

    /* cartel de círculo (transición) */
    await page.evaluate(() => { DMO.debug.exploreNoEnemies(true); DMO.debug.holdSpawns(true); });
    await page.evaluate(() => window.DD_HUB.exitToRun());
    await page.waitForFunction(() => window.DD_CINE && DD_CINE.getState()?.type === 'circle', null, { timeout: 15000 });
    await delay(700);
    await shot(page, '06-cartel-circulo', vw, vh);
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__DD_BRIDGE.isRunning(), null, { timeout: 15000 });
    await delay(400);
    await page.evaluate(() => { DMO.debug.exploreNoEnemies(false); DMO.debug.holdSpawns(false); });

    /* diez plantas: HUD en combate por círculo */
    for (let c = 0; c < 10; c++) {
      await page.evaluate(g => { DMO.debug.exploreNoEnemies(false); DMO.debug.holdSpawns(false); DMO.debug.exploreGoTo(g); }, hudRoom(c));
      await delay(2300);
      await shot(page, `07-hud-${String(c + 1).padStart(2, '0')}-${CIRCLES[c].id}`, vw, vh);
    }

    /* diez jefes */
    for (let c = 0; c < 10; c++) {
      await page.evaluate(g => { DMO.debug.exploreNoEnemies(true); DMO.debug.holdSpawns(true); DMO.debug.exploreGoTo(g); }, bossRoom(c));
      await delay(700);
      await page.evaluate(() => { try { DMO.debug.boss(); } catch (e) {} });
      await delay(1500);
      await shot(page, `08-jefe-${String(c + 1).padStart(2, '0')}-${CIRCLES[c].id}`, vw, vh);
    }

    /* estado tras jefes: ¿sigue vivo el corredor? */
    const alive = await page.evaluate(() => { const s = __DD_BRIDGE.getSnapshot(); return { hp: s.hp, dead: s.dead }; });
    captures.push({ file: null, screen: 'meta-post-bosses', viewport: `${vw}x${vh}`, fps: null, heapMB: null, meta: alive });

    /* resultados: derrota y victoria */
    await page.evaluate(() => { DMO.debug.exploreGoTo(2); });
    await delay(400);
    await page.evaluate(() => window.DD_UI.showResults({ won: false, round: 34, score: 128450, kills: 217, t: 1104.6 }, 'El descenso termina aquí. La torre recuerda tu nombre.'));
    await delay(700);
    await shot(page, '09-resultado-derrota', vw, vh);
    await page.evaluate(() => window.DD_UI.showResults({ won: true, round: 100, score: 987654, kills: 1330, t: 5420.2 }, 'La última canción es tuya. El club entero te ovaciona.'));
    await delay(700);
    await shot(page, '10-resultado-victoria', vw, vh);

    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'captures.json'), JSON.stringify({ generated: new Date().toISOString(), captures, errors }, null, 1));
  console.log(`\n${captures.filter(c => c.file).length} capturas · ${errors.length} errores`);
  if (errors.length) console.log('ERRORES:\n' + errors.join('\n'));
})().catch(e => { console.error('FAIL', e); process.exit(1); });
