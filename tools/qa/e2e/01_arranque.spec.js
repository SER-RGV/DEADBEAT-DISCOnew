/* ==========================================================================
   ARRANQUE · el juego abre limpio y llega al menú.

   Qué se comprueba de verdad:
     · la página responde 200 y el motor pinta su lienzo;
     · 0 errores de consola, 0 excepciones y 0 respuestas HTTP >= 400;
     · la FSM de DD_BOOT recorre la carga y termina en MAIN_MENU;
     · la carga no se queda a medias (sin watchdog, sin errores fatales).

   Sobre la intro: desde el cambio de la apertura narrativa, INTRO pertenece a
   «Nueva partida» y no al arranque; el menú debe estar disponible sin exigir
   una pulsación previa. Aquí se verifica ESE contrato, no el antiguo.
   ========================================================================== */
'use strict';

const { open } = require('../lib/chrome.js');
const G = require('../lib/game.js');
const { assertClean } = require('../lib/harness.js');

module.exports = {
  id: 'arranque',
  title: 'Arranque limpio hasta el menú principal',

  async run(ctx) {
    const suite = ctx.suite('arranque');
    const { page, errors, close } = await open({ width: 1280, height: 900 });
    try {
      const nav = await G.goto(page, ctx.baseUrl);
      suite.ok('la página del juego responde 200', nav.status === 200, 'HTTP ' + nav.status, 'HTTP 200');

      const reached = await G.waitState(page, ['MAIN_MENU']);
      suite.ok('la carga termina en MAIN_MENU', reached.ok, reached.state && reached.state.state, 'MAIN_MENU');
      if (!reached.ok) return suite;

      const boot = await G.evidence(page);
      suite.ok(
        'la carga llega al 100 % con todos los pasos',
        boot && boot.finalPct === '100%' && boot.stepsDone >= 9,
        boot && boot.finalPct + ' · ' + boot.stepsDone + ' pasos',
        '100% y >= 9 pasos'
      );
      suite.ok('el watchdog no ha tenido que intervenir', boot && boot.watchdogFired === false, boot && String(boot.watchdogFired), 'false');
      suite.ok(
        'ningún error del arranque es fatal',
        boot && boot.errors.filter((e) => e.fatal).length === 0,
        boot && boot.errors.length + ' registrados, 0 fatales',
        '0 fatales'
      );

      const tr = await G.trace(page);
      const pcts = tr.map((s) => s.pct);
      suite.ok('la barra de carga no retrocede', pcts.every((p, i) => i === 0 || p >= pcts[i - 1]), JSON.stringify(pcts), 'progreso monótono');
      suite.ok(
        'la traza cubre de 0 % a 100 %',
        pcts.length > 0 && pcts[0] === 0 && pcts[pcts.length - 1] === 100,
        pcts[0] + ' → ' + pcts[pcts.length - 1],
        '0 → 100'
      );

      const s = await G.state(page);
      suite.ok('el menú queda disponible sin pulsación previa', s && s.state === 'MAIN_MENU' && s.waitingGesture === false, s && JSON.stringify({ estado: s.state, gesto: s.waitingGesture }), 'MAIN_MENU y sin gesto pendiente');
      suite.ok(
        'la introducción no se reproduce en el arranque (contrato actual)',
        s && s.introActive === false,
        s && 'introActive=' + s.introActive,
        'false'
      );

      const canvas = await page.evaluate(() => {
        const c = document.getElementById('game');
        return c ? { w: c.width, h: c.height } : null;
      });
      suite.ok('el lienzo del juego existe y tiene tamaño', canvas && canvas.w > 0 && canvas.h > 0, JSON.stringify(canvas), 'lienzo con dimensiones');

      assertClean(suite, 'arranque:', errors);

      await suite.shot(page, '01_arranque_menu_1280x900.png');
    } finally {
      await close();
    }
    return suite;
  }
};
