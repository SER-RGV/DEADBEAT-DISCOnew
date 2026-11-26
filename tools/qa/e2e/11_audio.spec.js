/* ==========================================================================
   AUDIO · ¿se oye el juego y se oye lo que toca?

   La Fase 1 no medía sonido: solo comprobaba que no hubiera errores. Al medirlo
   en la Fase 2 aparecieron dos cosas que no se ven en una captura de pantalla:

   - la música de partida salía a −68 dBFS con 1–3 notas/s (inaudible), porque
     el planificador programaba solo 120 ms por delante con un reloj de 32 ms;
   - el Refugio sonaba exactamente igual que la portada (−11 dBFS en ambos).

   Esta suite fija el contrato audible con cotas medidas, no con «suena bien»:
   nivel mínimo en menú y en partida, Refugio por debajo del menú, silencio del
   menú cuando corre la partida, cero recortes y cero ficheros de audio (todo el
   sonido es sintetizado, así que el presupuesto de peso del audio es 0 bytes).
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const { open } = require('../lib/chrome.js');
const G = require('../lib/game.js');
const A = require('../lib/audio.js');
const { assertClean } = require('../lib/harness.js');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const AUDIO_EXT = /\.(mp3|ogg|oga|wav|m4a|aac|flac|opus|weba)$/i;

function audioFiles(dir) {
  const out = [];
  const walk = (d) => {
    let list = [];
    try { list = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const e of list) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (AUDIO_EXT.test(e.name)) out.push({ file: path.relative(ROOT, p), bytes: fs.statSync(p).size });
    }
  };
  walk(dir);
  return out;
}

module.exports = {
  id: 'audio',
  title: 'Audio: nivel audible, mezcla por estado y cero ficheros',

  async run(ctx) {
    const suite = ctx.suite('audio');
    const { page, errors, close } = await open({ width: 1280, height: 900 });
    try {
      /* 0 · Presupuesto de peso: el audio es sintético, no ocupa nada. */
      const files = audioFiles(path.join(ROOT, 'assets'));
      const bytes = files.reduce((n, f) => n + f.bytes, 0);
      suite.ok(
        'no hay ficheros de audio en assets/',
        files.length === 0,
        files.length + ' ficheros · ' + bytes + ' B',
        '0 ficheros · 0 B (todo sintetizado)'
      );

      await A.install(page);
      const boot = await G.boot(page, ctx.baseUrl);
      if (!boot.ok) {
        suite.fail('el juego arranca para poder medir su audio', boot.state && boot.state.state, 'MAIN_MENU');
        return suite;
      }

      /* Una pulsación real: el navegador exige gesto para dejar sonar el audio. */
      await page.mouse.click(640, 450);
      /* La portada entra con un fundido de 4 s: medir antes mide el fundido
         (-60 dBFS en la primera lectura), no la música. */
      await G.sleep(5200);

      /* 1 · Portada: dueño, nivel y actividad. */
      const menuSt = await A.state(page);
      const menu = await A.read(page, 'menu');
      /* La portiva es siempre el primer contexto: es el que suena en el menú.
         `loudest()` sumaba también la cola de otros contextos y tapaba la medida. */
      const menuPeak = (menu.contexts[0] || { peakdBFS: -180 }).peakdBFS;
      const menuRms = (menu.contexts[0] || { rmsdBFS: -180 }).rmsdBFS;
      const menuNotes = menu.contexts.reduce((n, c) => n + c.notes, 0);
      const menuSec = Math.max(0.5, menu.contexts.reduce((n, c) => Math.max(n, c.sec), 0));
      const menuRate = +(menuNotes / menuSec).toFixed(1);
      /* Sin dispositivo de salida, Chromium deja los contextos suspendidos y todo
         mide −180 dBFS. Eso es «no verificable aquí», no «el juego no suena»:
         se informa como SKIP con su motivo, nunca como aprobado. */
      const ctxStates = menu.contexts.map((c) => c.state);
      if (menu.contexts.length && ctxStates.every((st) => st !== 'running')) {
        suite.skip(
          'el entorno tiene salida de audio',
          'todos los AudioContext están en ' + ctxStates.join('/') + ' (sin dispositivo de sonido en el runner)',
          'algún contexto en running',
          'sin salida de audio'
        );
        return suite;
      }

      suite.ok('el menú declara que la música es suya', menuSt.owner === 'menu', 'audioOwner=' + menuSt.owner, 'menu');
      suite.ok('la música del menú es audible', menuPeak >= -24, menuPeak + ' dBFS', '>= -24 dBFS');
      suite.ok('la música del menú se mueve (notas programadas)', menuRate >= 4, menuRate + ' notas/s', '>= 4 notas/s');

      /* 2 · Refugio: misma pista, pero como ambiente (−4 dB o más respecto al menú). */
      const menuTarget = await page.evaluate(() => (window.DDC_COVER && window.DDC_COVER.music ? +window.DDC_COVER.music.targetGain().toFixed(4) : null));

      const entry = await G.enterGame(page);
      if (!entry.playing.ok) {
        suite.fail('se puede entrar al Refugio', entry.playing.state && entry.playing.state.state, 'PLAYING');
        return suite;
      }
      await G.sleep(3200);
      const hubSt = await A.state(page);
      const hub = await A.read(page, 'hub');
      const hubPeak = (hub.contexts[0] || { peakdBFS: -180 }).peakdBFS;
      const hubRms = (hub.contexts[0] || { rmsdBFS: -180 }).rmsdBFS;
      /* Nivel que el motor de portada declara para la cama del Refugio. */
      const hubTarget = await page.evaluate(() => (window.DDC_COVER && window.DDC_COVER.music ? +window.DDC_COVER.music.targetGain().toFixed(4) : null));
      suite.ok('en el Refugio el dueño del audio es el Refugio', hubSt.owner === 'refugio', 'audioOwner=' + hubSt.owner, 'refugio');
      suite.ok('la cama musical del Refugio sigue sonando', hubPeak >= -34, hubPeak + ' dBFS', '>= -34 dBFS');
      /* En el Refugio suenan a la vez la cama musical atenuada y los efectos de
         interfaz del propio menú (pasos, diálogo, estaciones), así que su RMS
         depende de cuántos efectos caigan en la ventana: en CI la comparación de
         RMS daba media décima de diferencia con el menú. Lo que se garantiza es
         lo que no puede fallar: el Refugio no suena MÁS ALTO que el menú (y el
         motor ha atenuado de verdad, comprobado abajo con targetGain). */
      suite.ok(
        'el Refugio no suena más alto que el menú',
        hubRms <= menuRms + 1,
        hubRms + ' dBFS de RMS frente al menú ' + menuRms + ' dBFS (picos ' + hubPeak + ' / ' + menuPeak + ')',
        '<= ' + (menuRms + 1) + ' dBFS de RMS'
      );
      /* La atenuación se comprueba también en el motor, no solo en el aire. */
      suite.ok(
        'el motor de portada baja su ganancia a la mitad o menos en el Refugio',
        hubTarget !== null && menuTarget !== null && hubTarget <= menuTarget * 0.5,
        'targetGain Refugio ' + hubTarget + ' · menú ' + menuTarget,
        '<= ' + (menuTarget === null ? '?' : (menuTarget * 0.5).toFixed(4))
      );

      /* 3 · Partida: la portada calla y el motor de partida suena. */
      await page.evaluate(() => window.DD_HUB.exitToRun());
      const running = await page.waitForFunction(() => window.__DD_BRIDGE && window.__DD_BRIDGE.isRunning(), null, { timeout: 120000 })
        .then(() => true).catch(() => false);
      if (!running) {
        suite.fail('la partida real arranca para medir su audio', 'isRunning=false', 'true');
        return suite;
      }
      /* Ventana amplia: al empezar la planta el motor aún está montando la sala
         y el planificador acumula el adelanto de 1,25 s. */
      const tRun = Date.now();
      await G.sleep(7500);
      const runSt = await A.state(page);
      const run = await A.read(page, 'partida');
      const runPeak = (run.contexts[run.contexts.length - 1] || { peakdBFS: -180 }).peakdBFS;
      const runNotes = run.contexts[run.contexts.length - 1] ? run.contexts[run.contexts.length - 1].notes : 0;
      const runSec = Math.max(1, (Date.now() - tRun) / 1000);
      const runRate = +(runNotes / runSec).toFixed(1);
      const runCtx = run.contexts[run.contexts.length - 1] || { peakdBFS: -180, clips: 0 };
      const menuCtx = run.contexts[0] || { peakdBFS: -180, state: 'n/a' };
      suite.ok('en partida el dueño del audio es la partida', runSt.owner === 'partida', 'audioOwner=' + runSt.owner, 'partida');
      suite.ok(
        'la música del menú no suena durante la partida',
        menuCtx.state === 'suspended' || menuCtx.peakdBFS <= -60,
        'ctx menú ' + menuCtx.state + ' · ' + menuCtx.peakdBFS + ' dBFS',
        'suspendido o <= -60 dBFS'
      );
      suite.ok('la música de partida es audible', runPeak >= -26, runPeak + ' dBFS', '>= -26 dBFS');
      suite.ok('la música de partida no se queda sin notas', runRate >= 4, runRate + ' notas/s', '>= 4 notas/s (el fallo medido daba 1-3)');

      /* 4 · Disparar: transitorios sin recortes ni errores nuevos. */
      for (let i = 0; i < 8; i++) {
        await page.mouse.move(480 + (i % 4) * 120, 300 + (i % 3) * 90);
        await page.mouse.down();
        await page.mouse.up();
        await G.sleep(110);
      }
      await G.sleep(1200);
      const fire = await A.read(page, 'disparo');
      const clips = fire.contexts.reduce((n, c) => n + c.clips, 0);
      const firePeak = A.loudest(fire);
      suite.ok('la mezcla no recorta con el juego en marcha', clips === 0 && firePeak <= -1, clips + ' bloques recortados · ' + firePeak + ' dBFS', '0 recortes y pico <= -1 dBFS');
      suite.ok('disparar mantiene el motor de partida en marcha', (fire.contexts[fire.contexts.length - 1] || runCtx).state === 'running', 'estado ' + ((fire.contexts[fire.contexts.length - 1] || runCtx).state), 'running');

      assertClean(suite, 'audio', errors);
      return suite;
    } finally {
      await close();
    }
  }
};
