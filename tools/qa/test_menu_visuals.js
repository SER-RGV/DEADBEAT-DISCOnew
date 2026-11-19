/* Carga, atmósfera de submenús, mini-retratos y archivo Extras en el build activo. */
const { chromium } = require('playwright-core');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const base = process.argv[2] || 'http://localhost:8080';
const out = process.argv[3];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  if (out) fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM || undefined,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  try {
    // Congela el arranque antes del primer tick para inspeccionar la pantalla de carga real.
    for (const reduced of [false, true]) {
      const ctx = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        reducedMotion: reduced ? 'reduce' : 'no-preference'
      });
      await ctx.addInitScript(() => {
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
      const p = await ctx.newPage();
      const errors = [];
      p.on('pageerror', error => errors.push(error.message));
      p.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
      await p.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
      await p.waitForFunction(() => typeof window.__ddBootStart === 'function', null, { timeout: 15000 });
      const load = await p.evaluate(async () => {
        const bg = document.querySelector('#dd-boot-frame .dd-boot-bg');
        const beams = document.querySelector('#dd-boot-frame .dd-boot-beams');
        const art = new Image(); art.src = 'assets/fase01/loading_keyart_2k.webp';
        try { await art.decode(); } catch (e) {}
        return {
          frame: getComputedStyle(document.querySelector('#dd-boot-frame')).display,
          bg: getComputedStyle(bg).display,
          bgAnimation: getComputedStyle(bg).animationName,
          beams: getComputedStyle(beams).display,
          beamAnimation: getComputedStyle(beams.firstElementChild).animationName,
          scanAnimation: getComputedStyle(document.querySelector('#dd-boot-frame'), '::after').animationName,
          stage: getComputedStyle(document.querySelector('#dd-boot-stage')).visibility,
          percent: getComputedStyle(document.querySelector('#dd-boot-pct')).display,
          top: getComputedStyle(document.querySelector('#dd-boot-frame .dd-boot-top')).display,
          foot: getComputedStyle(document.querySelector('#dd-boot-frame .dd-boot-foot')).display,
          logo: document.querySelector('#dd-boot-logo').naturalWidth,
          artWidth: art.naturalWidth
        };
      });
      assert.equal(load.frame, 'grid');
      assert.equal(load.bg, 'block');
      assert.equal(load.beams, 'block');
      assert.equal(load.stage, 'visible');
      assert.notEqual(load.percent, 'none');
      assert.equal(load.top, 'flex');
      assert.equal(load.foot, 'flex');
      assert(load.logo > 0 && load.artWidth > 0, 'logo y key art cargados');
      if (reduced) {
        assert.equal(load.bgAnimation, 'none');
        assert.equal(load.beamAnimation, 'none');
        assert.equal(load.scanAnimation, 'none');
      } else {
        assert.equal(load.bgAnimation, 'dd-boot-drift');
        assert.equal(load.beamAnimation, 'dd-boot-sweep');
        assert.equal(load.scanAnimation, 'dd-load-scan');
      }
      if (out && !reduced) await p.screenshot({ path: path.join(out, '00-carga.png') });
      assert.deepEqual(errors, []);
      console.log('PASS carga ' + (reduced ? 'movimiento reducido' : 'arte, progreso y animación') + ': fondo=' + load.bgAnimation);
      await ctx.close();
    }

    // Las escenas se abren en el build real. Esperamos el travelling completo antes de capturar.
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', error => errors.push(error.message));
    p.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
    await p.goto(base + '/index.html');
    await p.waitForFunction(() => window.DD_BOOT?.getState().state === 'MAIN_MENU', null, { timeout: 30000 });
    for (const [action, file] of [['play', 'jugar'], ['customize', 'aspectos'], ['progression', 'progresion'], ['options', 'opciones'], ['extras', 'extras']]) {
      await p.locator('#dd-menu-nav [data-action="' + action + '"]').click();
      await p.waitForFunction(a => DD_UI.getState().submenu === a, action, { timeout: 8000 });
      const style = await p.evaluate(() => {
        const scene = document.querySelector('#dd-submenu');
        return {
          bgAnimation: getComputedStyle(scene, '::before').animationName,
          glowAnimation: getComputedStyle(scene, '::after').animationName,
          bg: getComputedStyle(scene, '::before').backgroundImage
        };
      });
      assert.equal(style.bgAnimation, 'dd-submenu-room-drift', action + ' movimiento de fondo');
      const expectedBackground = action === 'play' ? 'op_03_dancefloor.jpg' : '/scenes/' + action + '.jpg';
      assert(style.bg.includes(expectedBackground), action + ' mantiene el fondo de escena');
      if (action === 'customize') {
        assert.equal(await p.locator('#dd-submenu [data-look-portrait]').count(), 8);
        assert.equal(await p.locator('#dd-submenu [data-look-portrait]').evaluateAll(nodes => nodes.filter(n => n.style.backgroundImage.startsWith('url("data:image/png;base64,')).length), 8);
        assert.equal(style.glowAnimation, 'dd-scene-hero');
      } else assert.equal(style.glowAnimation, 'dd-submenu-light-leak', action + ' velos de luz');
      if (action === 'extras') {
        assert.equal(await p.locator('.dd-extra-still').count(), 3);
        assert.equal(await p.locator('.dd-extra-look').count(), 8);
      }
      await sleep(2200);
      if (out) await p.screenshot({ path: path.join(out, file + '.png') });
      await p.keyboard.press('Escape');
      await p.waitForFunction(() => DD_BOOT.getState().state === 'MAIN_MENU');
      await sleep(2100);
      console.log('PASS escena ' + action + ': fondo dinámico' + (action === 'customize' ? ' + 8 mini-retratos' : action === 'extras' ? ' + 3 fotogramas y 8 fichas' : ' + velo de luz'));
    }
    assert.deepEqual(errors, []);
    console.log('PASS escenas sin errores de navegador');
    await ctx.close();

    const reducedCtx = await browser.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
    const reducedPage = await reducedCtx.newPage();
    await reducedPage.goto(base + '/index.html');
    await reducedPage.waitForFunction(() => window.DD_BOOT?.getState().state === 'MAIN_MENU', null, { timeout: 30000 });
    for (const action of ['customize', 'options', 'extras']) {
      await reducedPage.locator('#dd-menu-nav [data-action="' + action + '"]').click();
      await reducedPage.waitForFunction(a => DD_UI.getState().submenu === a, action, { timeout: 8000 });
      const names = await reducedPage.locator('#dd-submenu').evaluate(e => [getComputedStyle(e, '::before').animationName, getComputedStyle(e, '::after').animationName]);
      assert.deepEqual(names, ['none', 'none'], action + ' respeta movimiento reducido');
      await reducedPage.keyboard.press('Escape');
      await reducedPage.waitForFunction(() => DD_BOOT.getState().state === 'MAIN_MENU');
    }
    console.log('PASS fondos de submenú sin animación con movimiento reducido');
    await reducedCtx.close();
  } finally {
    await browser.close();
  }
})().catch(error => { console.error('FAIL', error); process.exit(1); });
