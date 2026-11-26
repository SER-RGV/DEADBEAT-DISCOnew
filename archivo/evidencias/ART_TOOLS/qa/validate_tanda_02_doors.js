/* Fase 1 · Tanda 02 — puerta CERRADA / ABIERTA en una sala real de combate.
 *
 * La sala inicial r0 es `start` (sin encuentro): el motor la entrega con
 * Ot.openT = .8, por lo que allí las puertas ya están abiertas y no sirve
 * para verificar el estado cerrado. Se usa una sala REAL de combate
 * (DMO.debug.setNight(24) -> r23, círculo 3 GULA, con enemigos), donde
 * vg() fija Ot.openT = 0. Después se despeja con la API de depuración del
 * propio juego (DMO.debug.clearRound) y se deja que el motor actualice
 * Ot.openT con sus ticks. No se toca la lógica de apertura.
 *
 * Uso: QA_LIB=/home/user/qa_tools/lib node ART_TOOLS/qa/validate_tanda_02_doors.js
 */
const { launch, attach, newLog, shot } = require(process.env.QA_LIB || '/home/user/qa_tools/lib');
const fs = require('fs'), path = require('path');
const OUT = '/home/user/DEADBEAT_DISCO/ART_EVIDENCE/tanda_02';
const URL = 'http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html';

async function bootToHub(page) {
  await page.mouse.click(640, 450); await page.waitForTimeout(600);
  await page.keyboard.press('Enter'); await page.waitForTimeout(900);
  await page.keyboard.down('Escape'); await page.waitForTimeout(2800);
  await page.keyboard.up('Escape'); await page.waitForTimeout(600);
}
async function startCampaign(page) {
  await page.evaluate(() => String(window.DMO_HUB.startCampaignFromHub(0)));
  for (let i = 0; i < 90; i++) {
    try { await page.evaluate(() => window.DMO.debug.tick(0.016, 30)); } catch (_) {}
    await page.waitForTimeout(300);
    const h = await page.evaluate(() => { try { return window.DMO_HUB.state(); } catch (e) { return null; } });
    if (h && h.location === 'CAMPAIGN_ROOM' && !h.inHub && !h.transitionLock &&
        h.transitionsCompleted >= 1) return true;
  }
  return false;
}
const state = page => page.evaluate(() => {
  const s = window.DMO.debug.state(), d = window.DMO_DUNGEON.state(),
        h = window.DMO_HUB.state(), a = window.DMO_ART_PACK.architecture();
  return { round: s.round, enemies: s.enemies, px: s.px, py: s.py,
           current: d.current, secured: Array.isArray(d.secured) ? d.secured.length : d.secured,
           transitionsCompleted: h.transitionsCompleted,
           architectureApplied: a.applied, architectureEnabled: a.enabled };
});

(async () => {
  let browser; const log = newLog();
  log.url = URL; log.started = new Date().toISOString();
  try {
    browser = await launch();
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    attach(page, log);
    await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
    await page.waitForTimeout(1500);
    await bootToHub(page);
    log.campaign = await startCampaign(page);

    log.setNight = await page.evaluate(() => {
      try { return { ok: window.DMO.debug.setNight(24) }; } catch (e) { return { ok: false, err: String(e) }; }
    });
    for (let i = 0; i < 6; i++) {
      try { await page.evaluate(() => window.DMO.debug.tick(0.016, 30)); } catch (_) {}
      await page.waitForTimeout(120);
    }
    log.closedState = await state(page);
    log.closedShotBytes = await shot(page, path.join(OUT, 'doors', 'closed_real.png'));
    log.wallsShotBytes = await shot(page, path.join(OUT, 'modular_connections', 'walls_upper.png'));

    log.clearRound = await page.evaluate(() => {
      try { return String(window.DMO.debug.clearRound()); } catch (e) { return 'ERR:' + e.message; }
    });
    for (let i = 0; i < 14; i++) {
      try { await page.evaluate(() => window.DMO.debug.tick(0.016, 30)); } catch (_) {}
      await page.waitForTimeout(130);
    }
    log.openState = await state(page);
    log.openShotBytes = await shot(page, path.join(OUT, 'doors', 'open_real.png'));

    /* Regresión mínima de cruce: el jugador sigue pudiendo moverse y disparar
       en la sala de combate con la arquitectura modular aplicada. */
    const a = await page.evaluate(() => window.DMO.testStats());
    await page.keyboard.down('d'); await page.waitForTimeout(700);
    await page.evaluate(() => window.DMO.debug.tick(0.016, 60));
    await page.keyboard.up('d');
    await page.evaluate(() => window.DMO.debug.setInput({ fire: true }));
    await page.evaluate(() => window.DMO.debug.tick(0.016, 60));
    await page.evaluate(() => window.DMO.debug.setInput({ fire: false }));
    const b = await page.evaluate(() => window.DMO.testStats());
    const p = await page.evaluate(() => window.DMO.debug.state());
    log.afterCombat = { shotsBefore: a.shotsFired, shotsAfter: b.shotsFired,
                        px: p.px, py: p.py, enemies: p.enemies };
    log.gameplayShotBytes = await shot(page, path.join(OUT, 'gameplay', 'combat_player.png'));

    log.pageerrorCount = log.pageerrors.length;
    log.consoleErrors = log.console.filter(x => x.type === 'error').map(x => x.text.slice(0, 160));
    log.httpErrors = log.httpErrors.map(e => ({ status: e.status, url: e.url.slice(0, 130) }));
    await ctx.close(); await browser.close();
    fs.writeFileSync(path.join(OUT, 'logs', 'doors.json'), JSON.stringify(log, null, 2));
    console.log('closed', JSON.stringify(log.closedState));
    console.log('open  ', JSON.stringify(log.openState));
    console.log('afterCombat', JSON.stringify(log.afterCombat));
    console.log('JSON:', path.join(OUT, 'logs', 'doors.json'));
  } catch (e) {
    console.log('FALLO:', e.message, (e.stack || '').split('\n').slice(0, 10).join('\n'));
    fs.writeFileSync(path.join(OUT, 'logs', 'doors_error.json'), JSON.stringify(log, null, 2));
    if (browser) await browser.close().catch(() => {});
    process.exit(1);
  }
})();
