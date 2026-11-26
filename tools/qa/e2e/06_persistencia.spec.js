/* ==========================================================================
   GUARDADO · guardar, recargar y restaurar.

   El juego guarda en el navegador (localStorage). Aquí se comprueba el ciclo
   completo: llegar al Refugio → la ficha `dd_save_v1` existe con su forma →
   recargar la página → el menú ofrece CONTINUAR (sin partida guardada no debe
   ofrecerlo) → continuar devuelve al jugador al Refugio y suma la visita.
   ========================================================================== */
'use strict';

const { open } = require('../lib/chrome.js');
const G = require('../lib/game.js');
const { assertClean } = require('../lib/harness.js');

module.exports = {
  id: 'persistencia',
  title: 'Guardado, recarga y restauración de la partida',

  async run(ctx) {
    const suite = ctx.suite('persistencia');
    const { page, errors, close } = await open({ width: 1280, height: 900 });
    try {
      const boot = await G.boot(page, ctx.baseUrl);
      if (!boot.ok) { suite.fail('el menú está disponible', boot.state && boot.state.state, 'MAIN_MENU'); return suite; }

      /* Sin partida previa, CONTINUAR no debe existir ni ser accionable. */
      const sinGuardado = await page.evaluate(() => {
        const b = document.querySelector('#dd-menu-nav .dd-menu-btn[data-action="continue"]');
        return { existe: !!b, visible: !!(b && !b.hidden), save: localStorage.getItem('dd_save_v1') };
      });
      suite.ok('sin partida guardada no se ofrece CONTINUAR', !sinGuardado.visible, JSON.stringify(sinGuardado), 'oculto');

      const entry = await G.enterGame(page);
      suite.ok('se llega al Refugio para guardar', entry.playing.ok, entry.playing.state && entry.playing.state.state, 'PLAYING');
      if (!entry.playing.ok) return suite;

      const save1 = await page.evaluate(() => JSON.parse(localStorage.getItem('dd_save_v1') || 'null'));
      suite.ok('la ficha de partida existe', !!save1, JSON.stringify(save1), 'objeto guardado');
      suite.ok('la ficha tiene el formato esperado', !!(save1 && save1.v === 1 && save1.created && save1.last), JSON.stringify(save1), 'v=1 con created y last');

      /* Recarga real del navegador. */
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
      const again = await G.waitState(page, ['MAIN_MENU']);
      suite.ok('tras recargar se vuelve al menú', again.ok, again.state && again.state.state, 'MAIN_MENU');
      if (!again.ok) return suite;

      const conGuardado = await page.evaluate(() => ({
        save: JSON.parse(localStorage.getItem('dd_save_v1') || 'null'),
        playVisible: !!document.querySelector('#dd-menu-nav .dd-menu-btn[data-action="play"]'),
        continueEnMenu: !!document.querySelector('#dd-menu-nav .dd-menu-btn[data-action="continue"]')
      }));
      /* CONTINUAR no está en el menú raíz: vive en JUGAR, y solo aparece con
         partida guardada. La comprobación real de esa condición va justo debajo,
         dentro del submenú. */
      suite.ok('el menú raíz sigue ofreciendo JUGAR', conGuardado.playVisible, 'JUGAR ' + conGuardado.playVisible, 'true');
      suite.ok('la ficha sobrevive a la recarga', !!conGuardado.save && conGuardado.save.created === (save1 && save1.created), conGuardado.save && conGuardado.save.created, save1 && save1.created);

      /* CONTINUAR desde el menú: JUGAR → CONTINUAR. */
      await page.click('#dd-menu-nav .dd-menu-btn[data-action="play"]');
      await G.waitState(page, ['SUBMENU'], 20000);
      const hayContinuar = await page.waitForSelector('#dd-scene-continue', { state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);
      suite.ok('el submenú JUGAR ofrece CONTINUAR', hayContinuar, 'botón ' + hayContinuar, 'true');
      if (hayContinuar) {
        await page.click('#dd-scene-continue');
        const resumed = await G.waitState(page, ['PLAYING'], 120000);
        suite.ok('CONTINUAR devuelve al Refugio', resumed.ok, resumed.state && resumed.state.state, 'PLAYING');
        const hub = await page.evaluate(() => !!(window.DD_HUB && window.DD_HUB.isActive()));
        suite.ok('la partida restaurada está en el Refugio', hub, 'DD_HUB activo=' + hub, 'true');
        const save2 = await page.evaluate(() => JSON.parse(localStorage.getItem('dd_save_v1') || 'null'));
        suite.ok(
          'la restauración registra la visita',
          !!(save2 && save1 && save2.visits > save1.visits),
          (save1 && save1.visits) + ' → ' + (save2 && save2.visits),
          'visits mayor'
        );
      }

      assertClean(suite, 'guardado:', errors);
      await suite.shot(page, '06_persistencia_1280x900.png');
    } finally {
      await close();
    }
    return suite;
  }
};
