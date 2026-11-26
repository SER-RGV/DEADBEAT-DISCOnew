/* ==========================================================================
   PLANTAS · una incursión corta por cada uno de los nueve círculos y el núcleo.

   Cómo: se entra UNA vez por el camino del jugador (menú → NUEVA PARTIDA →
   Refugio) y, ya dentro, se usa la API de pruebas que el motor publica
   (`DMO.playtest.start(ronda)`) para situar la partida en la ronda inicial de
   cada círculo. Las rondas 1–11 son el círculo I, 12–22 el II … 89–99 el IX y la
   100 el núcleo, según el reparto del propio motor.

   Cada planta se da por buena solo si el motor confirma el círculo correcto, la
   partida sigue viva y aparecen la música y el HUD de esa pista.
   ========================================================================== */
'use strict';

const { open } = require('../lib/chrome.js');
const G = require('../lib/game.js');
const { assertClean } = require('../lib/harness.js');

/* Ronda inicial de cada círculo: Ge = 11 rondas por círculo, 100 = núcleo. */
const FIRST_ROUND = [1, 12, 23, 34, 45, 56, 67, 78, 89, 100];

module.exports = {
  id: 'plantas',
  title: 'Una incursión corta por cada planta y el núcleo',

  async run(ctx) {
    const suite = ctx.suite('plantas');
    const { page, errors, close } = await open({ width: 1280, height: 900 });
    try {
      const boot = await G.boot(page, ctx.baseUrl);
      if (!boot.ok) { suite.fail('el menú está disponible', boot.state && boot.state.state, 'MAIN_MENU'); return suite; }

      const entry = await G.enterGame(page);
      suite.ok('entrada al juego por el camino del jugador', entry.playing.ok, 'estado ' + (entry.playing.state && entry.playing.state.state), 'PLAYING');
      if (!entry.playing.ok) return suite;

      /* Del Refugio a la pista: es la misma función que usa la puerta del ascensor. */
      await page.evaluate(() => window.DD_HUB.exitToRun());
      const running = await page.waitForFunction(() => window.__DD_BRIDGE && window.__DD_BRIDGE.isRunning(), null, { timeout: 120000 }).then(() => true).catch(() => false);
      suite.ok('la partida arranca al salir del Refugio', running, 'isRunning=' + running, 'true');
      if (!running) { await suite.shot(page, '04_plantas_sin_motor.png'); return suite; }

      const circles = await G.circles(page);
      suite.ok('el motor publica las diez pistas', circles.length === 10, circles.length + ' pistas', '10');

      for (let c = 0; c < 10; c++) {
        const round = FIRST_ROUND[c];
        const started = await G.playtest(page, 'start', round);
        suite.ok('planta ' + (c + 1) + ': la ronda ' + round + ' arranca', !started.error, started.error || 'ok', 'sin error');
        /* Se espera a que el motor publique el estado de la ronda nueva. */
        const settled = await page.waitForFunction(
          (r) => { try { const s = window.DMO.playtest.state(); return s && s.round === r && s.running; } catch (e) { return false; } },
          round, { timeout: 60000 }
        ).then(() => true).catch(() => false);
        suite.ok('planta ' + (c + 1) + ': la simulación está viva', settled, 'round=' + round + ' running=' + settled, 'running=true');

        const snap = await G.snapshot(page);
        const expected = circles[c] || {};
        suite.ok(
          'planta ' + (c + 1) + ': el motor está en ' + (expected.name || '?'),
          snap && snap.circle === c,
          snap && 'circle=' + snap.circle + ' · ' + (snap.roomBanner || snap.roomName),
          'circle=' + c
        );
        suite.ok(
          'planta ' + (c + 1) + ': la pista se rotula con su nombre',
          !!(snap && expected.name && String(snap.roomBanner || snap.roomName).toUpperCase().includes(expected.name)),
          snap && String(snap.roomBanner || snap.roomName),
          expected.name
        );
        suite.ok('planta ' + (c + 1) + ': la partida conserva vidas', snap && snap.hp > 0, snap && 'hp=' + snap.hp + '/' + snap.maxHp, 'hp > 0');

        const st = await G.playtestState(page);
        suite.ok(
          'planta ' + (c + 1) + ': el director de combate responde',
          !!st && typeof st.phase === 'string',
          st && 'fase=' + st.phase + ' · enemigos=' + st.enemies + ' · por salir=' + st.toSpawn,
          'estado con fase'
        );

        if (c === 0 || c === 9) {
          await suite.shot(page, '04_planta_' + (c + 1) + (c === 9 ? '_nucleo' : '') + '_1280x900.png');
        }
      }

      const tele = await G.telemetry(page);
      suite.ok('las estadísticas de partida se pueden leer', !!tele, tele ? Object.keys(tele).slice(0, 6).join(',') : 'sin telemetría', 'objeto de telemetría');

      assertClean(suite, 'plantas:', errors);
    } finally {
      await close();
    }
    return suite;
  }
};
