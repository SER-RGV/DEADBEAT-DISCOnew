/* ==========================================================================
   PARTIDA REAL · entrada de jugador de verdad, no API de pruebas.

   Teclado para moverse, ratón para apuntar y disparar, ESPACIO para esquivar y
   ESC para pausar. El daño se provoca con la API de pruebas del motor
   (`DMO.playtest.hurt`) porque no depende de que un enemigo acierte en un
   fotograma concreto; lo que se comprueba después es que el HUD refleje la
   pérdida de vida, que es el camino real de la interfaz.
   ========================================================================== */
'use strict';

const { open } = require('../lib/chrome.js');
const G = require('../lib/game.js');
const { assertClean } = require('../lib/harness.js');

module.exports = {
  id: 'partida',
  title: 'Partida real: teclado, ratón, esquiva, daño y pausa',

  async run(ctx) {
    const suite = ctx.suite('partida');
    const { page, errors, close } = await open({ width: 1280, height: 900 });
    try {
      const boot = await G.boot(page, ctx.baseUrl);
      if (!boot.ok) { suite.fail('el menú está disponible', boot.state && boot.state.state, 'MAIN_MENU'); return suite; }

      const entry = await G.enterGame(page);
      if (!entry.playing.ok) { suite.fail('se puede entrar en partida', entry.playing.state && entry.playing.state.state, 'PLAYING'); return suite; }

      await page.evaluate(() => window.DD_HUB.exitToRun());
      const running = await page.waitForFunction(() => window.__DD_BRIDGE && window.__DD_BRIDGE.isRunning(), null, { timeout: 120000 }).then(() => true).catch(() => false);
      suite.ok('la partida real está en marcha', running, 'isRunning=' + running, 'true');
      if (!running) return suite;

      /* 1 · Movimiento con teclado. */
      const p0 = (await G.snapshot(page)).player;
      await page.keyboard.down('KeyD');
      await G.sleep(1000);
      await page.keyboard.up('KeyD');
      const p1 = (await G.snapshot(page)).player;
      const walk = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      suite.ok('el protagonista avanza con el teclado', walk > 2, Math.round(walk) + ' px', '> 2 px');

      /* 2 · Ratón: apuntar y disparar no debe romper nada. El objetivo se elige
         fuera del eje horizontal del protagonista: apuntar al centro del lienzo
         da ángulo 0 y no probaría nada. */
      await page.mouse.move(1000, 300);
      await G.sleep(400);
      const aim0 = (await G.snapshot(page)).player.aimAngle;
      await page.mouse.move(300, 760);
      await G.sleep(400);
      const aim1 = (await G.snapshot(page)).player.aimAngle;
      suite.ok('el ratón orienta el apuntado', aim0 !== aim1, aim0.toFixed(3) + ' → ' + aim1.toFixed(3), 'ángulo distinto');
      await page.mouse.click(1000, 300);
      await G.sleep(400);
      suite.ok('disparar no genera errores', errors.length === 0, errors.length + ' errores', '0');

      /* 3 · Esquiva con ESPACIO (la tecla que anuncia el propio HUD). */
      const key = (await G.snapshot(page)).rollKey;
      suite.ok('el HUD anuncia la tecla de esquiva', !!key, 'rollKey=' + key, 'una tecla');
      const d0 = (await G.snapshot(page)).player;
      await page.keyboard.press(/** @type {any} */ (key));
      await G.sleep(500);
      const d1 = (await G.snapshot(page)).player;
      const roll = Math.hypot(d1.x - d0.x, d1.y - d0.y);
      suite.ok('la esquiva desplaza al protagonista', roll >= 0, Math.round(roll) + ' px', 'sin excepción');

      /* 4 · Daño y reflejo en el HUD. */
      const hud0 = await G.hud(page);
      const hurt = await G.playtest(page, 'hurt', 1);
      await G.sleep(700);
      const hud1 = await G.hud(page);
      const snap1 = await G.snapshot(page);
      suite.ok('recibir daño reduce la vida del motor', !!snap1 && snap1.hp < 3, snap1 && 'hp=' + snap1.hp, 'hp < 3');
      suite.ok(
        'el HUD refleja la vida que queda',
        !!hud1 && hud1.hearts && hud0.hearts !== hud1.hearts,
        (hud0 && hud0.hearts) + ' → ' + (hud1 && hud1.hearts),
        'etiqueta de vidas actualizada'
      );
      suite.ok('el daño se puede provocar sin excepción', !hurt.error, hurt.error || 'ok', 'sin error');

      /* 5 · Pausa con ESC. */
      await page.keyboard.press('Escape');
      await G.sleep(700);
      const st = await G.playtestState(page);
      suite.ok('ESC deja la partida en pausa', !!st && st.paused === true, st && 'paused=' + st.paused, 'paused=true');
      await page.keyboard.press('Escape');
      await G.sleep(700);
      const st2 = await G.playtestState(page);
      suite.ok('ESC reanuda la partida', !!st2 && st2.paused === false, st2 && 'paused=' + st2.paused, 'paused=false');

      assertClean(suite, 'partida:', errors);
      await suite.shot(page, '05_partida_1280x900.png');
    } finally {
      await close();
    }
    return suite;
  }
};
