/* ==========================================================================
   Utilidades de juego para las pruebas: arranque, estados de la FSM del menú,
   partida nueva y sondas del motor.

   Todo se apoya en APIs que el propio juego publica (`window.DD_BOOT`,
   `window.__DD_BRIDGE`, `window.DMO.playtest`). Ninguna prueba toca variables
   internas minificadas ni añade hooks al juego distribuido.
   ========================================================================== */
'use strict';

const INTRO_MIN = 40;   /* la intro solo se puede saltar pasados 0,4 s */
const STATE_TIMEOUT = Number(process.env.QA_STATE_TIMEOUT || 180000);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function state(page) {
  return page.evaluate(() => (window.DD_BOOT ? window.DD_BOOT.getState() : null)).catch(() => null);
}

/** Espera por ESTADO, nunca por tiempo fijo: en headless el render es lento. */
async function waitState(page, want, ms) {
  const list = Array.isArray(want) ? want : [want];
  const limit = ms || STATE_TIMEOUT;
  const t0 = Date.now();
  let last = null;
  while (Date.now() - t0 < limit) {
    last = await state(page);
    if (last && list.includes(last.state)) return { ok: true, ms: Date.now() - t0, state: last };
    await sleep(100);
  }
  return { ok: false, ms: Date.now() - t0, state: last, want: list };
}

async function goto(page, baseUrl, query) {
  const url = baseUrl.replace(/\/$/, '') + '/index.html' + (query || '');
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  return { url, status: res ? res.status() : null };
}

/** Arranque completo hasta el menú principal. */
async function boot(page, baseUrl) {
  const nav = await goto(page, baseUrl);
  const reached = await waitState(page, ['MAIN_MENU']);
  return { nav, ...reached };
}

/** Traza real de estados de la FSM (DD_BOOT.getTrace()). */
async function trace(page) {
  return page.evaluate(() => (window.DD_BOOT && window.DD_BOOT.getTrace ? window.DD_BOOT.getTrace() : [])).catch(() => []);
}

async function evidence(page) {
  return page.evaluate(() => (window.DD_BOOT && window.DD_BOOT.getEvidence ? window.DD_BOOT.getEvidence() : null)).catch(() => null);
}

/** Parte una incursión desde el menú con clics reales. */
async function newGame(page) {
  await page.click('#dd-menu-nav .dd-menu-btn[data-action="play"]');
  await waitState(page, ['SUBMENU'], 20000);
  await page.waitForSelector('#dd-scene-new', { state: 'visible', timeout: 30000 });
  await page.click('#dd-scene-new');
  return waitState(page, ['INTRO', 'PLAYING', 'MAIN_MENU'], 60000);
}

/** Salta la apertura como lo haría el jugador, con su propia API pública.
 *  En render software el reloj de la intro avanza por fotogramas (~0,17×), así
 *  que primero se espera a que pase del mínimo exigido (0,4 s internos). */
async function skipIntro(page, budgetMs) {
  const limit = budgetMs || 60000;
  const t0 = Date.now();
  while (Date.now() - t0 < limit) {
    const o = await page.evaluate(() => (window.DD_OPENING && window.DD_OPENING.getState ? window.DD_OPENING.getState() : null)).catch(() => null);
    if (!o) return { skipped: false, ms: Date.now() - t0, reason: 'la apertura ya no está activa' };
    if (o.elapsed > 0.45) {
      await page.evaluate(() => window.DD_OPENING.skip()).catch(() => {});
      return { skipped: true, ms: Date.now() - t0, elapsed: o.elapsed };
    }
    await sleep(80);
  }
  return { skipped: false, ms: Date.now() - t0, reason: 'la apertura no llegó al mínimo para saltarse' };
}

/** Flujo real de jugador: menú → JUGAR → NUEVA PARTIDA → (intro saltada) → Refugio. */
async function enterGame(page) {
  await page.click('#dd-menu-nav .dd-menu-btn[data-action="play"]');
  await waitState(page, ['SUBMENU'], 20000);
  await page.waitForSelector('#dd-scene-new', { state: 'visible', timeout: 30000 });
  const t0 = Date.now();
  await page.click('#dd-scene-new');
  const intro = await skipIntro(page);
  const playing = await waitState(page, ['PLAYING'], 180000);
  return { intro, playing, ms: Date.now() - t0 };
}

async function waitPlaying(page, ms) {
  return waitState(page, ['PLAYING'], ms || 240000);
}

async function snapshot(page) {
  return page.evaluate(() => {
    try { return window.__DD_BRIDGE ? window.__DD_BRIDGE.getSnapshot() : null; } catch (e) { return null; }
  }).catch(() => null);
}

async function circles(page) {
  return page.evaluate(() => {
    try { return window.__DD_BRIDGE ? window.__DD_BRIDGE.getCircles() : []; } catch (e) { return []; }
  }).catch(() => []);
}

async function isRunning(page) {
  return page.evaluate(() => {
    try { return !!(window.__DD_BRIDGE && window.__DD_BRIDGE.isRunning()); } catch (e) { return false; }
  }).catch(() => false);
}

/** Llama a un método de DMO.playtest y devuelve su resultado. */
async function playtest(page, method, ...args) {
  return page.evaluate(({ m, a }) => {
    try {
      if (!window.DMO || !window.DMO.playtest || typeof window.DMO.playtest[m] !== 'function') return { error: 'sin DMO.playtest.' + m };
      return { value: window.DMO.playtest[m](...a) };
    } catch (e) { return { error: String(e && e.message || e) }; }
  }, { m: method, a: args });
}

async function playtestState(page) {
  const r = await playtest(page, 'state');
  return r && r.value ? r.value : null;
}

async function telemetry(page) {
  const r = await playtest(page, 'telemetry');
  return r && r.value ? r.value : null;
}

/** Texto del HUD visible: vidas, escudos y dado, si están en pantalla. */
async function hud(page) {
  return page.evaluate(() => {
    const q = (sel) => document.querySelector(sel);
    /* El HUD es position:fixed: offsetParent siempre es null. Se mide la caja. */
    const vis = (n) => {
      if (!n) return false;
      const r = n.getBoundingClientRect();
      const cs = getComputedStyle(n);
      return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0;
    };
    const hearts = q('#dd-hud-hearts');
    const shield = q('#dd-hud-shield');
    return {
      hudVisible: vis(q('#dd-hud')),
      hearts: hearts ? hearts.getAttribute('aria-label') : null,
      shield: shield ? shield.getAttribute('aria-label') : null,
      hudHiddenClass: !!(q('#dd-hud') && q('#dd-hud').classList.contains('dd-hidden'))
    };
  }).catch(() => null);
}

module.exports = {
  sleep, state, waitState, goto, boot, trace, evidence, newGame, skipIntro, enterGame,
  waitPlaying, snapshot, circles, isRunning, playtest, playtestState, telemetry,
  hud, STATE_TIMEOUT, INTRO_MIN
};
