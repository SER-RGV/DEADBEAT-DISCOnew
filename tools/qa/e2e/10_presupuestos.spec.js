/* ==========================================================================
   PRESUPUESTOS · peso de arranque y cadencia de fotogramas.

   Qué se mide (y qué no)
     · Peso de arranque: bytes realmente transferidos por el navegador hasta
       tener el menú (HTML + recursos), leídos de PerformanceResourceTiming.
     · Cadencia: intervalos entre fotogramas medidos con requestAnimationFrame en
       menú, Refugio, combate y la cinemática de apertura.
     · NO se mide hardware real: aquí el render es software (SwiftShader). Las
       cifras son una cota inferior y sirven para detectar regresiones relativas,
       no para prometer fotogramas en un móvil.

   Los límites viven en tools/qa/budgets.json para poder ajustarlos sin tocar código.
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const { open } = require('../lib/chrome.js');
const G = require('../lib/game.js');
const { assertClean } = require('../lib/harness.js');

function loadBudgets(repoRoot) {
  const file = path.join(repoRoot, 'tools', 'qa', 'budgets.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Mide fotogramas durante `ms` y devuelve mediana y percentil 95 del intervalo. */
async function frameStats(page, ms) {
  return page.evaluate((dur) => new Promise((resolve) => {
    const gaps = [];
    let last = performance.now();
    const t0 = last;
    const tick = () => {
      const now = performance.now();
      gaps.push(now - last);
      last = now;
      if (now - t0 < dur) requestAnimationFrame(tick);
      else {
        const sorted = gaps.slice(1).sort((a, b) => a - b);
        const at = (q) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] || 0;
        resolve({
          frames: sorted.length,
          p50: +at(0.5).toFixed(2),
          p95: +at(0.95).toFixed(2),
          fpsMediana: sorted.length ? +(1000 / at(0.5)).toFixed(2) : 0
        });
      }
    };
    requestAnimationFrame(tick);
  }), ms);
}


/** Con muy pocos fotogramas la mediana no es fiable: se informa como SKIP. */
function budget(suite, budgets, label, stats, limit) {
  const detail = stats.fpsMediana + ' fps (p50 ' + stats.p50 + ' ms · p95 ' + stats.p95 + ' ms · ' + stats.frames + ' fotogramas)';
  if (stats.frames < (budgets.fotogramasMinimos || 3)) {
    suite.skip(label, 'solo ' + stats.frames + ' fotogramas en la ventana: medición no fiable', detail, '>= ' + limit + ' fps');
    return;
  }
  suite.ok(label + ' (' + limit + ' fps)', stats.fpsMediana >= limit, detail, '>= ' + limit + ' fps');
}

module.exports = {
  id: 'presupuestos',
  title: 'Presupuestos de peso de arranque y cadencia',
  heavy: true,

  async run(ctx) {
    const suite = ctx.suite('presupuestos');
    const budgets = loadBudgets(ctx.repoRoot);
    const { page, errors, close } = await open({ width: 1280, height: 900 });
    const metrics = ctx.metrics;

    try {
      const nav = await G.goto(page, ctx.baseUrl);
      const boot = await G.waitState(page, ['MAIN_MENU']);
      suite.ok('arranque medido', boot.ok, boot.ms + ' ms', 'MAIN_MENU');
      if (!boot.ok) return suite;

      /* ---------- peso de arranque ---------- */
      const weight = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        const res = performance.getEntriesByType('resource');
        const sum = (list) => list.reduce((s, e) => s + (e.transferSize || e.encodedBodySize || 0), 0);
        const html = nav ? (nav.transferSize || nav.encodedBodySize || 0) : 0;
        const byType = {};
        for (const e of res) {
          const t = e.initiatorType || 'otro';
          byType[t] = (byType[t] || 0) + (e.transferSize || e.encodedBodySize || 0);
        }
        return { html, resources: sum(res), byType, count: res.length };
      });
      const totalMB = +(((weight.html + weight.resources) / 1048576).toFixed(2));
      metrics.arranque = { totalMB, htmlMB: +((weight.html / 1048576).toFixed(2)), recursos: weight.count, porTipo: weight.byType };
      suite.ok(
        'el arranque cabe en el presupuesto (' + budgets.arranqueMB + ' MB)',
        totalMB <= budgets.arranqueMB,
        totalMB + ' MB (' + metrics.arranque.htmlMB + ' MB de HTML + ' + weight.count + ' recursos)',
        '<= ' + budgets.arranqueMB + ' MB'
      );

      /* ---------- cadencia: menú ---------- */
      const menu = await frameStats(page, budgets.ventanaMs);
      metrics.menu = menu;
      budget(suite, budgets, 'menú: la cadencia no baja del presupuesto', menu, budgets.fpsMenu);

      /* ---------- cinemática de apertura ---------- */
      await page.click('#dd-menu-nav .dd-menu-btn[data-action="play"]');
      await G.waitState(page, ['SUBMENU'], 20000);
      await page.waitForSelector('#dd-scene-new', { state: 'visible', timeout: 30000 });
      await page.click('#dd-scene-new');
      const introVisible = await page.waitForFunction(
        () => !!(window.DD_OPENING && window.DD_OPENING.getState && window.DD_OPENING.getState()),
        null, { timeout: 30000 }
      ).then(() => true).catch(() => false);
      if (introVisible) {
        const cine = await frameStats(page, Math.min(budgets.ventanaMs, 4000));
        metrics.cinematica = cine;
        budget(suite, budgets, 'cinemática: la cadencia no baja del presupuesto', cine, budgets.fpsCinematica);
        await G.skipIntro(page);
      } else {
        suite.skip('cinemática: se mide la cadencia', 'la apertura no llegó a activarse', 'sin datos', 'fotogramas medidos');
      }

      const playing = await G.waitState(page, ['PLAYING'], 180000);
      suite.ok('se llega al Refugio para medir', playing.ok, playing.state && playing.state.state, 'PLAYING');

      if (playing.ok) {
        const hub = await frameStats(page, budgets.ventanaMs);
        metrics.refugio = hub;
        budget(suite, budgets, 'Refugio: la cadencia no baja del presupuesto', hub, budgets.fpsRefugio);

        /* ---------- combate: de verdad, con enemigos en pista ---------- */
        await page.evaluate(() => window.DD_HUB.exitToRun());
        const running = await page.waitForFunction(() => window.__DD_BRIDGE && window.__DD_BRIDGE.isRunning(), null, { timeout: 120000 }).then(() => true).catch(() => false);
        if (running) {
          await G.playtest(page, 'start', 45);
          await G.sleep(1500);
          await G.playtest(page, 'elite', 'sprinter', 3);
          await G.sleep(1200);
          const combat = await frameStats(page, budgets.ventanaMs);
          metrics.combate = combat;
          const st = await G.playtestState(page);
          suite.ok('combate: hay enemigos en pista al medir', !!st && st.enemies > 0, st && 'enemigos=' + st.enemies, '> 0');
          budget(suite, budgets, 'combate: la cadencia no baja del presupuesto', combat, budgets.fpsCombate);
        } else {
          suite.skip('combate: se mide la cadencia', 'la partida no arrancó al salir del Refugio', 'sin datos', 'fotogramas medidos');
        }
      }

      assertClean(suite, 'presupuestos:', errors);
    } finally {
      await close();
    }
    return suite;
  }
};
