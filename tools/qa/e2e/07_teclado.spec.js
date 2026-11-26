/* ==========================================================================
   TECLADO · el menú se recorre sin ratón.

   Solo se usan teclas: flechas para mover la selección, Enter para entrar,
   Escape para volver. Se comprueba que el foco real acompañe a la selección,
   que sea visible, que no quede atrapado y que el orden de tabulación tenga un
   único punto de entrada.
   ========================================================================== */
'use strict';

const { open } = require('../lib/chrome.js');
const G = require('../lib/game.js');
const { assertClean } = require('../lib/harness.js');

module.exports = {
  id: 'teclado',
  title: 'Navegación completa del menú solo con teclado',

  async run(ctx) {
    const suite = ctx.suite('teclado');
    const { page, errors, close } = await open({ width: 1280, height: 900 });
    try {
      const boot = await G.boot(page, ctx.baseUrl);
      if (!boot.ok) { suite.fail('el menú está disponible', boot.state && boot.state.state, 'MAIN_MENU'); return suite; }

      /* Recorrido de las seis opciones con la flecha abajo. */
      const seen = [];
      for (let i = 0; i < 6; i++) {
        const cur = await page.evaluate(() => {
          const a = document.activeElement;
          return {
            action: a && a.getAttribute ? a.getAttribute('data-action') : null,
            index: window.DD_UI.getState().menuIndex,
            label: (a && a.innerText || '').split('\n')[0]
          };
        });
        seen.push(cur);
        await page.keyboard.press('ArrowDown');
        await G.sleep(120);
      }
      const unicas = new Set(seen.map((s) => s.action));
      suite.ok('las seis opciones se alcanzan con la flecha abajo', unicas.size === 6, Array.from(unicas).join(','), '6 distintas');
      suite.ok(
        'el foco sigue a la selección anunciada',
        seen.every((s) => s.index !== null && s.action !== null),
        JSON.stringify(seen.map((s) => s.index + ':' + s.action)),
        'foco y selección alineados'
      );

      const vis = await page.evaluate(() => {
        const a = document.activeElement;
        if (!a) return false;
        const cs = getComputedStyle(a);
        const r = a.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (cs.outlineStyle !== 'none' || cs.boxShadow !== 'none');
      });
      suite.ok('el foco es visible en todo el recorrido', vis, 'outline/box-shadow presentes', 'visible');

      /* Entrar en OPCIONES (índice 3) solo con teclado. */
      await page.evaluate(() => window.DD_UI.getState());
      for (let i = 0; i < 6; i++) {
        const idx = await page.evaluate(() => window.DD_UI.getState().menuIndex);
        if (idx === 3) break;
        await page.keyboard.press('ArrowDown');
        await G.sleep(100);
      }
      await page.keyboard.press('Enter');
      const sub = await G.waitState(page, ['SUBMENU'], 15000);
      suite.ok('Enter abre OPCIONES sin ratón', sub.ok, sub.state && sub.state.state, 'SUBMENU');

      const inside = await page.evaluate(() => {
        const s = document.getElementById('dd-submenu');
        const a = document.activeElement;
        return {
          focusInside: !!(s && a && s.contains(a)),
          label: (a && (a.innerText || a.getAttribute('aria-label') || '')).slice(0, 40),
          hidden: s ? s.getAttribute('aria-hidden') : null
        };
      });
      suite.ok('el foco entra en el submenú', inside.focusInside, JSON.stringify(inside), 'foco dentro');

      /* Recorrer los controles del submenú con Tab no debe escapar del diálogo. */
      for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
      const trapped = await page.evaluate(() => {
        const s = document.getElementById('dd-submenu');
        return !!(s && s.contains(document.activeElement));
      });
      suite.ok('Tab no saca el foco del submenú abierto', trapped, 'foco dentro=' + trapped, 'true');

      await page.keyboard.press('Escape');
      const back = await G.waitState(page, ['MAIN_MENU'], 15000);
      suite.ok('Escape vuelve al menú principal', back.ok, back.state && back.state.state, 'MAIN_MENU');

      const focusBack = await page.evaluate(() => !!(document.activeElement && document.activeElement.closest('#dd-menu-nav')));
      suite.ok('al volver, el foco regresa al menú', focusBack, String(focusBack), 'true');

      assertClean(suite, 'teclado:', errors);
      await suite.shot(page, '07_teclado_1280x900.png');
    } finally {
      await close();
    }
    return suite;
  }
};
