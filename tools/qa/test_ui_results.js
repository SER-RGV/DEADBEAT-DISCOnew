/* UI integration QA: requires playwright-core, Chromium and an HTTP server.
   DD_CHROMIUM=/path/to/chromium node tools/qa/test_ui_results.js [base URL] [screenshot directory]
   Uses DMO.playtest.hurt for death; this marks the run as modified. Xbox input is simulated. */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8080';
const OUT = process.argv[3];
const assert = require('assert');
const delay = ms => new Promise(r => setTimeout(r, ms));
const standardSizes = process.env.DD_QUICK ? [[1280,720]] : [[1920,1080],[1600,900],[1366,768],[1280,720]];
const resultsSizes = process.env.DD_QUICK ? [[1280,720]] : [[1920,1080],[1600,900],[1366,768],[1280,720],[1024,768],[2560,1080]];
(async () => {
  if (OUT) fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.DD_CHROMIUM || undefined, headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({viewport: {width: 1280, height: 720}});
  await context.addInitScript(() => {
    window.__pad = null;
    window.__pressPad = (idx, pressed) => {
      if (!window.__pad) window.__pad = {connected: true, id: 'Xbox QA', index: 0, mapping: 'standard', axes: [0,0,0,0], buttons: Array.from({length: 17}, () => ({pressed: false, value: 0}))};
      window.__pad.buttons[idx] = {pressed, value: pressed ? 1 : 0};
    };
    navigator.getGamepads = () => [window.__pad];
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', r => errors.push('request: ' + r.url()));
  page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  const pass = msg => console.log('PASS ' + msg);
  const pad = async idx => { await page.evaluate(i => window.__pressPad(i, true), idx); await delay(160); await page.evaluate(i => window.__pressPad(i, false), idx); await delay(350); };
  try {
    await page.goto(BASE + '/index.html', {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => window.DD_BOOT && window.DD_BOOT.getState().state === 'MAIN_MENU', null, {timeout: 30000});
    await page.locator('[data-action="play"]').click();
    await page.locator('#dd-scene-new').click();
    await page.waitForFunction(() => window.DD_OPENING.getState()?.type === 'intro');
    await page.evaluate(() => window.DD_OPENING.debugSeek(31.9, false));
    await page.waitForFunction(() => window.DD_OPENING.getState()?.type === 'descent');
    await page.evaluate(() => window.DD_OPENING.debugSeek(4.55, false));
    await page.waitForFunction(() => window.DD_HUB.isActive(), null, {timeout: 15000});
    await page.evaluate(() => window.DD_UI.openShop());
    assert.equal(await page.locator('.dd-weapon-card').count(), 120, 'catálogo inicial');
    const magnum = await page.evaluate(() => window.__DD_BRIDGE.getWeaponStats('magnum'));
    assert((await page.locator('[data-w=magnum]').innerText()).includes(String(magnum.cost)));
    assert.equal((await page.evaluate(() => window.__DD_BRIDGE.getWeaponStats('m1911'))).cost, 0);
    for (const [w,h] of standardSizes) {
      await page.setViewportSize({width:w,height:h}); await delay(100);
      for (const selector of ['#dd-shop-modal .dd-modal-window', '#dd-shop-close', '#dd-shop-equip']) {
        const box = await page.locator(selector).boundingBox();
        assert(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= w + 1 && box.y + box.height <= h + 1, selector + ' ' + w + 'x' + h);
      }
      if (OUT && w === 1280) await page.screenshot({path:path.join(OUT, 'armeria-1280x720.png')});
    }
    await page.keyboard.press('Tab');
    assert(await page.evaluate(() => document.activeElement.closest('#dd-shop-modal') !== null));
    await page.locator('[data-w=magnum]').click();
    assert((await page.locator('#dd-shop-equip').innerText()).includes('PROBAR'));
    assert((await page.locator('.dd-shop-note').innerText()).includes('reinicia'));
    await page.locator('#dd-shop-equip').click();
    assert.equal(await page.evaluate(() => window.__DD_BRIDGE.getSnapshot().weapon), 'magnum');
    assert.equal(await page.locator('#dd-shop-feedback').innerText(), 'Arma equipada.');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'dd-shop-equip');
    await page.locator('#dd-shop-close').focus();
    pass('catálogo, precios, datos reales y prueba de arma en Refugio');
    await pad(13);
    assert(await page.evaluate(() => document.activeElement.closest('#dd-shop-modal') !== null));
    await pad(13); await pad(0);
    assert(await page.evaluate(() => document.activeElement.closest('#dd-shop-modal') !== null));
    await pad(1);
    assert(!(await page.locator('#dd-shop-modal').isVisible()));
    await page.evaluate(() => window.DD_UI.openMap());
    assert((await page.locator('#dd-circles-list').innerText()).includes('UBICACIÓN ACTUAL · REFUGIO'));
    assert.equal(await page.locator('#dd-circles-list .current').count(), 0);
    assert((await page.locator('#dd-circles-list').innerText()).includes('[I]LIMBO'));
    for (const [w,h] of standardSizes) {
      await page.setViewportSize({width:w,height:h}); await delay(100);
      for (const selector of ['#dd-map-modal .dd-modal-window', '#dd-map-close', '#dd-circles-list']) {
        const box = await page.locator(selector).boundingBox();
        assert(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= w + 1 && box.y + box.height <= h + 1, selector + ' ' + w + 'x' + h);
      }
      if (OUT && w === 1280) await page.screenshot({path:path.join(OUT, 'torre-refugio-1280x720.png')});
    }
    pass('armería y mapa dentro de la ventana (' + standardSizes.length + ' resoluciones)');
    await pad(13);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'dd-circles-list');
    const scrollBefore = await page.locator('#dd-circles-list').evaluate(e => e.scrollTop);
    await pad(12);
    assert((await page.locator('#dd-circles-list').evaluate(e => e.scrollTop)) < scrollBefore, 'mando desplaza el mapa');
    await pad(1);
    assert(!(await page.locator('#dd-map-modal').isVisible()));
    pass('foco y cierre de armería/mapa con mando simulado');
    await page.evaluate(() => window.DD_HUB.exitToRun());
    await page.waitForFunction(() => window.__DD_BRIDGE.isRunning(), null, {timeout: 15000});
    await delay(1800);
    assert.equal(await page.evaluate(() => window.__DD_BRIDGE.getSnapshot().weapon), 'm1911', 'inicio reinicia la prueba de Refugio');
    assert(await page.locator('#dd-hud').isVisible());
    const hud = await page.evaluate(() => ({s: window.__DD_BRIDGE.getSnapshot(), hp: document.querySelector('#dd-hud-hp-fill').style.width, bombs: document.querySelector('#dd-skill-bomb-cnt').textContent}));
    assert.equal(Number.parseFloat(hud.hp), Math.round(hud.s.hp / hud.s.maxHp * 1000) / 10);
    assert.equal(Number(hud.bombs), hud.s.bombs); pass('inicio, HUD y datos de salud/bombas');
    for (const [w,h] of standardSizes) {
      await page.setViewportSize({width:w,height:h}); await delay(120);
      for (const selector of ['.dd-hud-top-left','.dd-hud-top-right','.dd-hud-skills']) {
        const box = await page.locator(selector).boundingBox();
        assert(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= w + 1 && box.y + box.height <= h + 1, selector + ' ' + w + 'x' + h);
      }
    }
    pass('HUD dentro de la ventana (' + standardSizes.length + ' resoluciones)');
    await page.evaluate(() => window.DD_UI.openShop());
    await page.locator('[data-cat=TODAS]').click();
    await page.locator('[data-w=magnum]').click();
    const beforePurchase = await page.evaluate(() => window.__DD_BRIDGE.getSnapshot());
    assert(beforePurchase.credits < magnum.cost && !beforePurchase.owned.includes('magnum'));
    assert(await page.locator('#dd-shop-equip').isDisabled());
    assert((await page.locator('.dd-shop-note').innerText()).includes('tiendas y recompensas'));
    const deniedNoFunds = await page.evaluate(() => window.__DD_BRIDGE.buyOrEquipWeapon('magnum', false));
    assert.equal(deniedNoFunds, false);
    let afterPurchase = await page.evaluate(() => window.__DD_BRIDGE.getSnapshot());
    assert.equal(afterPurchase.credits, beforePurchase.credits);
    assert.deepEqual(afterPurchase.owned, beforePurchase.owned);
    assert.equal(afterPurchase.weapon, beforePurchase.weapon);
    await page.keyboard.press('Escape');
    pass('catálogo remite a la compra del motor sin cobrar ni cambiar armas');
    await page.evaluate(() => { for (let i = 0; i < 4; i++) window.DMO.playtest.pickup('credits', 1); });
    await page.waitForFunction(cost => window.__DD_BRIDGE.getSnapshot().credits >= cost, magnum.cost, {timeout: 10000});
    const funded = await page.evaluate(() => window.__DD_BRIDGE.getSnapshot());
    const deniedFunded = await page.evaluate(() => window.__DD_BRIDGE.buyOrEquipWeapon('magnum', true));
    afterPurchase = await page.evaluate(() => window.__DD_BRIDGE.getSnapshot());
    assert.equal(deniedFunded, false);
    assert.equal(afterPurchase.credits, funded.credits);
    assert.deepEqual(afterPurchase.owned, funded.owned);
    assert.equal(afterPurchase.weapon, funded.weapon);
    pass('con saldo suficiente el puente no compra ni reemplaza fuera de una tienda');
    await page.evaluate(() => window.DD_UI.openMap());
    assert((await page.locator('#dd-circles-list .current').innerText()).includes('LIMBO'));
    assert((await page.locator('#dd-circles-list .current').innerText()).includes('[I]'));
    assert.equal(await page.locator('#dd-circles-list .current').count(), 1);
    await page.keyboard.press('Escape'); await delay(300);
    assert(!(await page.locator('#dd-map-modal').isVisible()));
    assert.equal(await page.evaluate(() => window.__DD_BRIDGE.isPaused()), false, 'Escape en mapa no debe pausar');
    pass('mapa identifica Limbo y Escape cierra sin pausar');
    await page.keyboard.press('KeyM'); await page.waitForSelector('#pause-overlay.visible');
    assert(!(await page.locator('#dd-map-modal').isVisible()));
    await page.keyboard.press('KeyM'); await page.waitForFunction(() => !window.__DD_BRIDGE.isPaused());
    pass('M respeta el inventario del motor sin abrir otra capa');
    await page.keyboard.press('Escape');
    await page.waitForSelector('#pause-overlay.visible');
    for (const [w,h] of standardSizes) {
      await page.setViewportSize({width:w,height:h}); await delay(100);
      for (const selector of ['#pause-title','#resume-btn','#quit-btn']) {
        const box = await page.locator(selector).boundingBox();
        assert(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= w + 1 && box.y + box.height <= h + 1, selector + ' ' + w + 'x' + h);
      }
      if (OUT && w === 1280) await page.screenshot({path:path.join(OUT, 'pausa-1280x720.png')});
    }
    const master = page.locator('#audio-panel input[type=range]').first();
    assert(await master.count());
    await master.evaluate(e => { e.value = '65'; e.dispatchEvent(new Event('input', {bubbles:true})); });
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('dmodisco_vol_v1')).master), 0.65);
    pass('pausa (' + standardSizes.length + ' resoluciones) y mezcla de audio persistente');
    await page.locator('#resume-btn').click();
    await page.waitForFunction(() => !window.__DD_BRIDGE.isPaused()); pass('pausa y reanudación');
    await pad(9);
    await page.waitForSelector('#pause-overlay.visible');
    await pad(0);
    await page.waitForFunction(() => !window.__DD_BRIDGE.isPaused(), null, {timeout: 5000});
    pass('pausa con Start y reanudar con A (mando simulado)');
    await pad(1);
    assert(!(await page.locator('#dd-map-modal').isVisible()));
    assert.equal(await page.locator('#dd-skill-dodge-key').textContent(), 'B');
    assert.equal(await page.locator('#dd-skill-bomb-key').textContent(), 'LB');
    await page.keyboard.press('KeyW');
    await delay(100);
    assert.equal(await page.locator('#dd-skill-bomb-key').textContent(), 'Q');
    pass('B no abre mapa en combate; ayudas de teclado y mando');
    await page.evaluate(() => window.DMO.playtest.hurt(1));
    await delay(350);
    const damaged = await page.evaluate(() => ({s: window.__DD_BRIDGE.getSnapshot(), hp: parseFloat(document.querySelector('#dd-hud-hp-fill').style.width)}));
    assert.equal(damaged.hp, Math.round(damaged.s.hp / damaged.s.maxHp * 1000) / 10);
    assert(damaged.s.hp < damaged.s.maxHp); pass('actualización del HUD tras daño');
    await page.evaluate(() => window.DMO.playtest.hurt(20));
    await page.waitForSelector('#dd-results:not(.dd-hidden)', {timeout: 15000});
    assert.equal(await page.locator('#dd-results-title').textContent(), 'FIN DEL DESCENSO');
    assert((await page.locator('#dd-results-summary').textContent()).includes('RONDA'));
    assert(!(await page.locator('#dd-hud').isVisible())); pass('muerte real mediante playtest y resumen del motor');
    await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.id), 'dd-results-menu');
    await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.tagName), 'SUMMARY');
    await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.id), 'dd-results-retry');
    await page.keyboard.press('Shift+Tab'); assert.equal(await page.evaluate(() => document.activeElement.tagName), 'SUMMARY');
    await page.keyboard.press('Tab');
    pass('foco de teclado contenido en resultados');
    for (const [w,h] of resultsSizes) {
      await page.setViewportSize({width:w,height:h}); await delay(100);
      for (const selector of ['#dd-results-title','#dd-results-stats','#dd-results-retry','#dd-results-menu']) {
        const box = await page.locator(selector).boundingBox();
        assert(box && box.x >= 0 && box.y >= 0 && box.x+box.width <= w+1 && box.y+box.height <= h+1, selector + ' ' + w + 'x' + h);
      }

    }
    pass('resultados visibles (' + resultsSizes.length + ' resoluciones)');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__DD_BRIDGE.isRunning());
    assert(!(await page.locator('#dd-results').isVisible())); pass('reintento con teclado');
    await page.keyboard.press('Escape'); await page.waitForSelector('#pause-overlay.visible');
    await page.locator('#quit-btn').click(); await page.waitForSelector('#dd-results:not(.dd-hidden)');
    await page.setViewportSize({width:1280,height:720}); await delay(150);
    if (OUT) await page.screenshot({path:path.join(OUT, 'resultados-1280x720.png')});
    await pad(13); // d-pad down
    assert.equal(await page.evaluate(() => document.activeElement.id), 'dd-results-menu');
    await pad(13); await pad(0);
    assert(await page.locator('#dd-results details').evaluate(e => e.open));
    await pad(12);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'dd-results-menu');
    await pad(0); // A
    await page.waitForFunction(() => window.DD_BOOT.getState().state === 'MAIN_MENU');
    assert(await page.locator('#dd-main-menu').isVisible());
    assert.equal(await page.evaluate(() => window.__DD_BRIDGE.isRunning()), false, 'A no debe iniciar la partida oculta del menú antiguo');
    pass('rendirse y volver al menú con mando simulado, sin reintento duplicado');
    await page.locator('[data-action="play"]').click(); await page.locator('#dd-scene-new').click();
    await page.waitForFunction(() => window.DD_OPENING.getState()?.type === 'intro');
    await page.evaluate(() => window.DD_OPENING.debugSeek(31.9, false));
    await page.waitForFunction(() => window.DD_OPENING.getState()?.type === 'descent');
    await page.evaluate(() => window.DD_OPENING.debugSeek(4.55, false));
    await page.waitForFunction(() => window.DD_HUB.isActive(), null, {timeout: 15000});
    assert(await page.locator('#overlay').evaluate(e => e.classList.contains('hidden') && e.getAttribute('aria-hidden') === 'true' && Number(getComputedStyle(e).opacity) === 0)); pass('nueva partida después de volver al menú');
    assert.deepEqual(errors, []); pass('sin errores de consola, excepciones o peticiones fallidas');
  } finally { await browser.close(); }
})().catch(e => { console.error('FAIL', e); process.exit(1); });
