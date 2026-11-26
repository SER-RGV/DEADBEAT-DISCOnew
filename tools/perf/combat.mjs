/* combat.mjs — mide el tramo que antes era inalcanzable: combate en marcha.
   Recorre menú -> descenso -> Refugio -> pad de descenso -> [E] -> partida y
   muestrea el compás de requestAnimationFrame en menú, Refugio y combate.

   No modifica el juego: sólo pulsa teclas y lee estado público (DD_HUB,
   DD_BOOT, DD_BRIDGE). El paseo hasta el pad usa realimentación (lee x/y y
   corrige) porque el HUB avanza con dt acotado y en CPU puede ir lento.

   uso: node tools/perf/combat.mjs [url]                                   */
import { launch, enterHub } from './lib.mjs';
const url = process.argv[2] || 'http://127.0.0.1:8123/index.html';
const browser = await launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();

/* Contabilidad de long-animation-frame: separa script de pintado. */
await page.addInitScript(() => {
  window.__loaf = [];
  try {
    new PerformanceObserver(l => l.getEntries().forEach(e => window.__loaf.push({
      d: Math.round(e.duration),
      script: Math.round(e.scripts ? e.scripts.reduce((a, s) => a + (s.duration || 0), 0) : 0),
      render: Math.round(e.renderStart && e.startTime ? e.startTime + e.duration - e.renderStart : 0)
    }))).observe({ entryTypes: ['long-animation-frame'] });
  } catch (e) {}
});

const sample = (n = 30) => page.evaluate(n => new Promise(r => {
  const ts = []; let l = performance.now();
  const f = t => { ts.push(t - l); l = t; ts.length < n ? requestAnimationFrame(f) : r(ts); };
  requestAnimationFrame(f);
}), n);
/* El compás aquí es bimodal: muchos fotogramas a 16,7 ms y luego un hueco de
   cientos de ms. La mediana sola engaña, así que se informa también la media,
   los fps equivalentes y el porcentaje de fotogramas perdidos (>100 ms). */
const stat = a => {
  const b = a.slice(1).sort((x, y) => x - y);
  const q = p => +b[Math.min(b.length - 1, Math.floor(b.length * p))].toFixed(1);
  const mean = b.reduce((x, y) => x + y, 0) / b.length;
  const over = b.filter(x => x > 100).length;
  return {
    n: b.length, med: q(0.5), p95: q(0.95), max: +b[b.length - 1].toFixed(1),
    mean: +mean.toFixed(1), fps: +(1000 / mean).toFixed(1),
    over100: over, over100pct: +(100 * over / b.length).toFixed(0)
  };
};
const sleep = ms => page.waitForTimeout(ms);

await page.goto(url, { waitUntil: 'commit' });
await page.waitForFunction(() => window.DD_BOOT && DD_BOOT.getEvidence().loadFinished, null, { timeout: 120000 });
for (let i = 0; i < 250; i++) {
  if (await page.evaluate(() => DD_BOOT.getState().state) === 'MAIN_MENU') break;
  await page.keyboard.press('Escape'); await sleep(100);
}
await sleep(1200);
const menuFrames = stat(await sample(30));

/* NUEVA PARTIDA -> descenso -> Refugio. El descenso puede tardar ~20 s aquí. */
await enterHub(page);
for (let i = 0; i < 300; i++) {
  if (await page.evaluate(() => !!(window.DD_HUB && DD_HUB.isActive()))) break;
  await sleep(200);
}
await sleep(2500);
const hubFrames = stat(await sample(30));

const { default: walkToStation } = await import('./walk_to_station.cjs');
const walked = await walkToStation(page);
const reachedPad = !!(walked && walked.nearStation === 'descent');

/* [E] en el pad -> cinemática de círculo -> partida en marcha. */
let combat = null, runStarted = false;
if (reachedPad) {
  await page.keyboard.press('e');
  /* La cinemática de círculo (2,9 s de reloj interno) precede a la partida y en
     CPU tarda bastante más; se espera a que el motor esté REALMENTE en marcha
     (isRunning) y no al estado del FSM, que cambia antes de que el bucle corra. */
  let running = false;
  const tRun = Date.now();
  while (Date.now() - tRun < 90000) {
    running = await page.evaluate(() => { const b = window.__DD_BRIDGE; return !!(b && b.isRunning()); });
    if (running) break;
    await sleep(250);
  }
  if (!running) throw new Error('la partida no arrancó tras [E] en el pad (isRunning=false)');
  await sleep(3000);
  const snap = () => page.evaluate(() => { const b = window.__DD_BRIDGE; return b.getSnapshot(); });
  const before = await snap();
  const frames = stat(await sample(40));
  /* Input real de motor durante la medida: mover y disparar. */
  await page.keyboard.down('d'); await sleep(400);
  await page.keyboard.press('Space'); await page.keyboard.press('Space');
  await page.keyboard.up('d');
  await page.keyboard.press('Space');
  await sleep(1200);
  const after = await snap();
  const loaf = await page.evaluate(() => window.__loaf.slice());
  runStarted = running;
  combat = {
    frames, longTasks: loaf.length,
    scriptMs: loaf.reduce((a, b) => a + b.script, 0),
    renderMs: loaf.reduce((a, b) => a + b.render, 0),
    stateBefore: { running: before.running, paused: before.paused, hp: before.hp, room: before.room, enemies: before.enemies.length },
    stateAfter: { running: after.running, paused: after.paused, hp: after.hp, room: after.room, enemies: after.enemies.length },
    playerMoved: Math.round(Math.hypot(after.player.x - before.player.x, after.player.y - before.player.y))
  };
}

const out = { url, reachedPad, walked, runStarted, menuFrames, hubFrames, combat };
const dest = process.argv[3];
if (dest) { const fs = await import('node:fs'); fs.writeFileSync(dest, JSON.stringify(out, null, 1)); }
console.log(JSON.stringify(out, null, 1));
if (!runStarted || !combat) process.exitCode = 1;
await browser.close();
