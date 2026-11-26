/* ==========================================================================
   REGRESIÓN VISUAL · capturas por pantalla clave en tres tamaños.

   Tamaños: 1280×900 (escritorio), 1920×1080 (pantalla grande) y 390×844 (móvil).
   Las referencias viven en el repositorio: tools/qa/visual/baselines/.

   Umbral: QA_VISUAL_THRESHOLD (porcentaje de píxeles distintos, por defecto 1,5 %)
   Tolerancia por canal: QA_VISUAL_TOLERANCE (por defecto 24/255)
   Regenerar referencias (a mano y con revisión visual): npm run visual:refs

   La comparación ocurre en el navegador, así que no hay dependencias de imagen.
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const { open } = require('../lib/chrome.js');
const G = require('../lib/game.js');
const { compare } = require('../visual/compare.js');

const BASELINES = path.resolve(__dirname, '..', 'visual', 'baselines');
const THRESHOLD = Number(process.env.QA_VISUAL_THRESHOLD || 1.5);
const TOLERANCE = Number(process.env.QA_VISUAL_TOLERANCE || 24);
const UPDATE = process.env.QA_VISUAL_UPDATE === '1';

const VIEWPORTS = [
  { id: '1280x900', width: 1280, height: 900 },
  { id: '1920x1080', width: 1920, height: 1080 },
  { id: '390x844', width: 390, height: 844, hasTouch: true }
];

/* Pantallas clave. `entrar` indica si hay que llegar al Refugio antes de la foto. */
const SCREENS = [
  { id: 'menu', entrar: false },
  { id: 'refugio', entrar: true }
];

module.exports = {
  id: 'visual',
  title: 'Regresión visual en 1280×900, 1920×1080 y 390×844',
  heavy: true,

  async run(ctx) {
    const suite = ctx.suite('visual');
    fs.mkdirSync(BASELINES, { recursive: true });

    for (const vp of VIEWPORTS) {
      const { page, errors, close } = await open({ width: vp.width, height: vp.height, hasTouch: !!vp.hasTouch });
      try {
        const boot = await G.boot(page, ctx.baseUrl);
        suite.ok(vp.id + ': el menú carga', boot.ok, boot.state && boot.state.state, 'MAIN_MENU');
        if (!boot.ok) continue;

        for (const screen of SCREENS) {
          if (screen.entrar) {
            const entry = await G.enterGame(page);
            if (!entry.playing.ok) {
              suite.fail(vp.id + '/' + screen.id + ': se llega al Refugio', entry.playing.state && entry.playing.state.state, 'PLAYING');
              continue;
            }
            await G.sleep(1200);
          }
          const file = screen.id + '__' + vp.id + '.png';
          const actualPath = path.join(ctx.repoRoot, 'node_modules', '.cache', 'qa-visual', file);
          fs.mkdirSync(path.dirname(actualPath), { recursive: true });
          /* En el menú conviene quitar el movimiento de fondo para que la foto
             sea comparable: el propio juego respeta prefers-reduced-motion. */
          await page.screenshot({ path: actualPath, timeout: 90000, animations: 'disabled' }).catch(() => {});
          if (!fs.existsSync(actualPath)) {
            suite.fail(vp.id + '/' + screen.id + ': captura realizada', 'no se pudo capturar', 'captura');
            continue;
          }
          const actual = fs.readFileSync(actualPath);
          const refPath = path.join(BASELINES, file);

          if (UPDATE || !fs.existsSync(refPath)) {
            fs.writeFileSync(refPath, actual);
            suite.ok(vp.id + '/' + screen.id + ': referencia ' + (UPDATE ? 'regenerada' : 'creada'), true, refPath, 'referencia en el repositorio');
            continue;
          }

          const reference = fs.readFileSync(refPath);
          const diff = await compare(page, actual, reference, TOLERANCE);
          if (diff.sizeMismatch) {
            suite.fail(vp.id + '/' + screen.id + ': misma resolución que la referencia', diff.actual.join('×') + ' vs ' + diff.reference.join('×'), 'misma resolución');
            continue;
          }
          suite.ok(
            vp.id + '/' + screen.id + ': la pantalla no cambia más del ' + THRESHOLD + ' %',
            diff.pct <= THRESHOLD,
            diff.pct.toFixed(3) + ' % (' + diff.diffPixels + '/' + diff.total + ' px)',
            '<= ' + THRESHOLD + ' %'
          );
          if (diff.pct > THRESHOLD) {
            fs.copyFileSync(actualPath, path.join(ctx.repoRoot, 'node_modules', '.cache', 'qa-visual', 'fallo_' + file));
          }
        }

        const clean = errors.filter((e) => !/willReadFrequently|favicon/i.test(e.text + ' ' + e.url));
        suite.ok(vp.id + ': sin errores durante las capturas', clean.length === 0, clean.length ? JSON.stringify(clean.slice(0, 3)) : '0 errores', '0 errores');
      } finally {
        await close();
      }
    }
    return suite;
  }
};
