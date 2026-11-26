/* ==========================================================================
   MENÚ · estructura, etiquetas accesibles y anuncio semántico.

   Cubre H-E1…H-E5 del arnés anterior y cierra H-E4: la navegación se tiene que
   anunciar como menú, no solo comportarse como tal. También comprueba que el
   foco sea visible y que las flechas muevan la selección real del juego
   (`DD_UI.getState().menuIndex`), no solo una clase CSS.
   ========================================================================== */
'use strict';

const { open } = require('../lib/chrome.js');
const G = require('../lib/game.js');
const { assertClean } = require('../lib/harness.js');

const ACTIONS = ['play', 'customize', 'progression', 'options', 'extras', 'exit'];

module.exports = {
  id: 'menu',
  title: 'Menú principal semántico y navegable',

  async run(ctx) {
    const suite = ctx.suite('menu');
    const { page, errors, close } = await open({ width: 1280, height: 900 });
    try {
      const boot = await G.boot(page, ctx.baseUrl);
      if (!boot.ok) {
        suite.fail('el menú principal está disponible', boot.state && boot.state.state, 'MAIN_MENU');
        return suite;
      }

      const menu = await page.evaluate(() => {
        const root = document.getElementById('dd-main-menu');
        const nav = document.getElementById('dd-menu-nav');
        const btns = Array.from(document.querySelectorAll('#dd-menu-nav .dd-menu-btn'));
        /* offsetParent es null para position:fixed, y el menú lo es: se mide la
           caja real y el estilo calculado. */
        const box = root ? root.getBoundingClientRect() : null;
        const cs = root ? getComputedStyle(root) : null;
        return {
          rootVisible: !!root && box.width > 0 && box.height > 0 &&
            cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0,
          navTag: nav ? nav.tagName : null,
          navRole: nav ? nav.getAttribute('role') : null,
          navLabel: nav ? nav.getAttribute('aria-label') : null,
          items: btns.map((b) => ({
            action: b.getAttribute('data-action'),
            name: (b.innerText || '').trim().split('\n')[0],
            role: b.getAttribute('role'),
            tabindex: b.getAttribute('tabindex'),
            hidden: b.hidden
          }))
        };
      });

      suite.ok('el menú está en pantalla', menu.rootVisible, 'visible=' + menu.rootVisible, 'visible');
      const visible = menu.items.filter((i) => !i.hidden);
      suite.ok('el menú ofrece las seis acciones', visible.length === 6, visible.map((i) => i.action).join(','), ACTIONS.join(','));
      suite.ok(
        'cada acción tiene nombre accesible',
        visible.every((i) => i.name && i.name.length > 0),
        visible.map((i) => i.name).join(' | '),
        'seis nombres'
      );
      suite.ok('la navegación se anuncia como menú', menu.navRole === 'menu', 'role=' + menu.navRole + ' tag=' + menu.navTag, 'role="menu"');
      suite.ok(
        'cada opción se anuncia como elemento de menú',
        visible.every((i) => i.role === 'menuitem'),
        visible.map((i) => i.role).join(','),
        'role="menuitem"'
      );
      suite.ok(
        'solo una opción está en el orden de tabulación',
        visible.filter((i) => i.tabindex === '0').length === 1,
        visible.map((i) => i.action + ':' + i.tabindex).join(' '),
        'exactamente un tabindex=0'
      );

      const focus = await page.evaluate(() => {
        const a = document.activeElement;
        const st = getComputedStyle(a);
        return {
          insideMenu: !!(a && a.closest && a.closest('#dd-menu-nav')),
          visibleFocus: st.outlineStyle !== 'none' || st.boxShadow !== 'none',
          action: a && a.getAttribute ? a.getAttribute('data-action') : null
        };
      });
      suite.ok('el foco arranca dentro del menú', focus.insideMenu, JSON.stringify(focus), 'foco en el menú');
      suite.ok('el foco es visible', focus.visibleFocus, String(focus.visibleFocus), 'true');

      const before = await page.evaluate(() => window.DD_UI.getState().menuIndex);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(150);
      const after = await page.evaluate(() => window.DD_UI.getState().menuIndex);
      suite.ok('la flecha abajo mueve la selección del juego', after !== before, before + ' → ' + after, 'índice distinto');

      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);
      const sub = await G.waitState(page, ['SUBMENU'], 8000);
      suite.ok('Enter abre el submenú de la opción elegida', sub.ok, sub.state && sub.state.state, 'SUBMENU');

      await page.keyboard.press('Escape');
      const back = await G.waitState(page, ['MAIN_MENU'], 8000);
      suite.ok('Escape vuelve al menú principal', back.ok, back.state && back.state.state, 'MAIN_MENU');

      assertClean(suite, 'menú:', errors);
      await suite.shot(page, '01_menu_1280x900.png');
    } finally {
      await close();
    }
    return suite;
  }
};
