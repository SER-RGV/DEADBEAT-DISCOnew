/* ==========================================================================
   HUB · entrada real al Refugio por el camino del jugador.

   Camino: menú → JUGAR → NUEVA PARTIDA → apertura (saltada) → descenso → Refugio.
   Se comprueba el estado del juego, que el Refugio sea zona segura (simulación
   en pausa), que el jugador se mueva con teclado y que la partida quede
   registrada en el navegador.

   Nota de entorno: en render software el reloj de la apertura avanza por
   fotogramas, así que este camino tarda decenas de segundos. No es un fallo del
   juego; se mide y se informa en el informe de la suite.
   ========================================================================== */
'use strict';

const { open } = require('../lib/chrome.js');
const G = require('../lib/game.js');
const { assertClean } = require('../lib/harness.js');

module.exports = {
  id: 'hub',
  title: 'Entrada al Refugio (HUB) y zona segura',

  async run(ctx) {
    const suite = ctx.suite('hub');
    const { page, errors, close } = await open({ width: 1280, height: 900 });
    try {
      const boot = await G.boot(page, ctx.baseUrl);
      if (!boot.ok) { suite.fail('el menú está disponible', boot.state && boot.state.state, 'MAIN_MENU'); return suite; }

      const entry = await G.enterGame(page);
      suite.ok('NUEVA PARTIDA entra al juego', entry.playing.ok, 'estado ' + (entry.playing.state && entry.playing.state.state), 'PLAYING');
      if (!entry.playing.ok) { await suite.shot(page, '03_hub_fallo.png'); return suite; }
      suite.ok('la apertura se puede saltar', entry.intro.skipped, JSON.stringify(entry.intro), 'saltada');
      suite.ok('el descenso no deja la música del menú sonando', !(entry.playing.state && entry.playing.state.menuMusic), entry.playing.state && String(entry.playing.state.menuMusic), 'false');

      const hub = await page.evaluate(() => ({
        active: !!(window.DD_HUB && window.DD_HUB.isActive()),
        hasApi: !!(window.DD_HUB && typeof window.DD_HUB.exitToRun === 'function')
      }));
      suite.ok('el Refugio está activo', hub.active, JSON.stringify(hub), 'true');

      const snap = await G.snapshot(page);
      suite.ok('el motor informa de la partida', !!snap, snap ? 'snapshot con ' + Object.keys(snap).length + ' campos' : 'sin snapshot', 'snapshot');
      suite.ok(
        'el Refugio es zona segura: la simulación está en pausa',
        snap && snap.running === false,
        snap && 'running=' + snap.running,
        'running=false'
      );

      /* Movimiento real en el Refugio con el teclado del jugador. El Refugio
         mueve su propio protagonista (DD_HUB), no el de la incursión: por eso se
         lee su estado, no el snapshot del motor. */
      const hubBefore = await page.evaluate(() => window.DD_HUB.getState());
      let hubDuring = hubBefore;
      let hubAfter = hubBefore;
      let moved = 0;
      let tries = 0;
      /* Hasta tres intentos: si el lienzo no tiene el foco la tecla no llega y el
         protagonista se queda quieto (medido en CI: 0 px con el mismo commit que
         en local da 29 px). Antes de repetir se pulsa el lienzo para darle foco. */
      for (; tries < 3 && moved <= 2; tries++) {
        if (tries > 0) {
          await page.mouse.click(640, 420);
          await G.sleep(300);
        }
        await page.keyboard.down('KeyD');
        await G.sleep(1400);
        hubDuring = await page.evaluate(() => window.DD_HUB.getState());
        await page.keyboard.up('KeyD');
        await G.sleep(300);
        hubAfter = await page.evaluate(() => window.DD_HUB.getState());
        moved = Math.hypot(hubAfter.x - hubBefore.x, hubAfter.y - hubBefore.y);
      }
      suite.ok('el protagonista se mueve con el teclado', moved > 2, Math.round(moved) + ' px (' + hubBefore.x + ',' + hubBefore.y + ' → ' + hubAfter.x + ',' + hubAfter.y + ') tras ' + tries + ' intento(s)', '> 2 px');
      suite.ok('la animación de caminar responde al movimiento', hubDuring.walking === true, 'walking=' + hubDuring.walking + ' frame=' + hubDuring.walkFrame, 'walking=true');
      /* Medido en este build: 9 zonas y 16 estaciones. La documentación antigua
         hablaba de 6 y 11; se fija el valor real para detectar regresiones. */
      suite.ok(
        'el Refugio conserva sus zonas y estaciones',
        Array.isArray(hubAfter.zones) && hubAfter.zones.length === 9 && hubAfter.stations.length === 16,
        hubAfter.zones.length + ' zonas · ' + hubAfter.stations.length + ' estaciones',
        '9 zonas y 16 estaciones'
      );

      const save = await page.evaluate(() => {
        const raw = localStorage.getItem('dd_save_v1');
        return raw ? { raw: raw.length, parsed: JSON.parse(raw) } : null;
      });
      suite.ok('la llegada al Refugio queda guardada', !!save, save ? JSON.stringify(save.parsed) : 'sin dd_save_v1', 'dd_save_v1 presente');

      assertClean(suite, 'HUB:', errors);
      await suite.shot(page, '03_hub_1280x900.png');
    } finally {
      await close();
    }
    return suite;
  }
};
