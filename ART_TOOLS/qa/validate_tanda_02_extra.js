/* Fase 1 · Tanda 02 — sonda complementaria (aislamiento de causa).
 *
 * 1) Repite la regresión de DISPARO con ticks FORZADOS e idénticos parámetros
 *    en tres condiciones dentro de la MISMA build: módulos T02 ON, OFF
 *    (restore) y ON otra vez. Así se distingue una regresión real de la
 *    inanición de requestAnimationFrame bajo SwiftShader.
 * 2) Recorre círculos reales con la API de depuración del propio motor
 *    (DMO.debug.setNight -> setRound -> vg(), Ge=11, Xe=floor((n-1)/11))
 *    para capturar los módulos de muro A01/A03/A04/A05 en salas reales y
 *    verificar entrada/salida de salas.
 *
 * Uso: QA_LIB=/home/user/qa_tools/lib node ART_TOOLS/qa/validate_tanda_02_extra.js
 */
const { launch, attach, newLog, shot } = require(process.env.QA_LIB || '/home/user/qa_tools/lib');
const fs = require('fs'), path = require('path');
const OUT = '/home/user/DEADBEAT_DISCO/ART_EVIDENCE/tanda_02';
const URL = 'http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html';

function initScript() {
  window.__qaWa = null; window.__qaBullets = [];
  const p = Array.prototype.push;
  Array.prototype.push = function () {
    for (let i = 0; i < arguments.length; i++) {
      const v = arguments[i];
      if (v && typeof v === 'object' && ('weaponSerial' in v) && ('accuracyCohort' in v)) {
        window.__qaWa = this;
        window.__qaBullets.push({ x: Math.round(v.x), y: Math.round(v.y), serial: v.weaponSerial });
      }
    }
    return p.apply(this, arguments);
  };
}

async function bootToHub(page) {
  await page.mouse.click(640, 450); await page.waitForTimeout(600);
  await page.keyboard.press('Enter'); await page.waitForTimeout(900);
  await page.keyboard.down('Escape'); await page.waitForTimeout(2800);
  await page.keyboard.up('Escape'); await page.waitForTimeout(600);
}
async function startCampaign(page) {
  await page.evaluate(() => String(window.DMO_HUB.startCampaignFromHub(0)));
  for (let i = 0; i < 90; i++) {
    try { await page.evaluate(() => window.DMO.debug.tick(0.016, 30)); } catch (_) {}
    await page.waitForTimeout(300);
    const h = await page.evaluate(() => { try { return window.DMO_HUB.state(); } catch (e) { return null; } });
    if (h && h.location === 'CAMPAIGN_ROOM' && !h.inHub && !h.transitionLock &&
        h.transitionsCompleted >= 1) return { completed: true, polls: i + 1 };
  }
  return { completed: false, polls: 90 };
}
const stats = page => page.evaluate(() => {
  const s = window.DMO.testStats(), d = window.DMO.debug.state();
  return { shotsFired: s.shotsFired, bulletsCount: s.bulletsCount,
           px: d.px, py: d.py, enemies: d.enemies,
           bulletsSeen: (window.__qaBullets || []).length,
           waLen: window.__qaWa ? window.__qaWa.length : null };
});

/* Disparo por las DOS vías reales, con el MISMO número de ticks forzados.
   `wa` = proyectiles del jugador; `Ia`/balas = proyectiles enemigos. */
async function fireProbe(page, tag) {
  const a = await stats(page);
  await page.mouse.move(760, 420);
  await page.mouse.down();
  await page.evaluate(() => window.DMO.debug.tick(0.016, 60));
  await page.mouse.up();
  await page.evaluate(() => window.DMO.debug.tick(0.016, 30));
  const b = await stats(page);
  await page.evaluate(() => window.DMO.debug.setInput({ fire: true }));
  await page.evaluate(() => window.DMO.debug.tick(0.016, 60));
  await page.evaluate(() => window.DMO.debug.setInput({ fire: false }));
  await page.evaluate(() => window.DMO.debug.tick(0.016, 30));
  const c = await stats(page);
  return { tag, before: a, afterMouse: b, afterInput: c,
           mouseShotDelta: (b.shotsFired ?? 0) - (a.shotsFired ?? 0),
           mouseWaDelta: (b.bulletsSeen ?? 0) - (a.bulletsSeen ?? 0),
           inputShotDelta: (c.shotsFired ?? 0) - (b.shotsFired ?? 0),
           inputWaDelta: (c.bulletsSeen ?? 0) - (b.bulletsSeen ?? 0) };
}

(async () => {
  let browser;
  const log = newLog();
  log.url = URL; log.started = new Date().toISOString();
  try {
    browser = await launch();
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    attach(page, log);
    await page.addInitScript(initScript);
    await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
    await page.waitForTimeout(1500);
    await bootToHub(page);
    log.campaign = await startCampaign(page);
    log.architectureAtBoot = await page.evaluate(() => window.DMO_ART_PACK.architecture());

    /* --- 1 · aislamiento del disparo ---------------------------------- */
    log.fireProbes = [];
    log.fireProbes.push(await fireProbe(page, 'T02_ON_1'));
    const off = await page.evaluate(() => window.DMO_ART_PACK.restore());
    log.restoreSlots = off;
    log.fireProbes.push(await fireProbe(page, 'T02_OFF'));
    const on = await page.evaluate(() => window.DMO_ART_PACK.apply());
    log.reapplySlots = on;
    log.fireProbes.push(await fireProbe(page, 'T02_ON_2'));

    /* --- 2 · salas reales de otros círculos --------------------------- */
    /* Ge = 11 salas/círculo; Xe(n) = floor((n-1)/11); n>=100 -> NÚCLEO */
    const CIRCLES = [
      { night: 24, circle: 2, label: 'circle_02_gula', assets: 'A01 wall_straight (repetido por panel)' },
      { night: 35, circle: 3, label: 'circle_03_avaricia', assets: 'A03 wall_corner_outer' },
      { night: 90, circle: 8, label: 'circle_08_traicion', assets: 'A04 wall_end_cap' },
      { night: 100, circle: 9, label: 'circle_09_nucleo', assets: 'A05 wall_pillar' }
    ];
    log.circles = [];
    for (const c of CIRCLES) {
      const before = await page.evaluate(() => {
        const s = window.DMO.debug.state(), d = window.DMO_DUNGEON.state(),
              h = window.DMO_HUB.state();
        return { round: s.round, current: d.current, floor: d.floor,
                 transitionsCompleted: h.transitionsCompleted };
      });
      const r = await page.evaluate(n => {
        try { return { ok: window.DMO.debug.setNight(n) }; }
        catch (e) { return { ok: false, err: String(e) }; }
      }, c.night);
      for (let i = 0; i < 8; i++) {
        try { await page.evaluate(() => window.DMO.debug.tick(0.016, 30)); } catch (_) {}
        await page.waitForTimeout(120);
      }
      const after = await page.evaluate(() => {
        const s = window.DMO.debug.state(), d = window.DMO_DUNGEON.state(),
              h = window.DMO_HUB.state();
        return { round: s.round, current: d.current, floor: d.floor,
                 transitionsCompleted: h.transitionsCompleted,
                 enemies: s.enemies, px: s.px, py: s.py };
      });
      const p = path.join(OUT, 'modular_connections', c.label + '.png');
      const bytes = await shot(page, p);
      log.circles.push({ ...c, setNight: r, before, after,
                         roomChanged: before.current !== after.current ||
                                      before.round !== after.round,
                         shotBytes: bytes, shot: path.relative('/home/user/DEADBEAT_DISCO', p) });
      console.log('circulo', c.circle, 'night', c.night, 'round', after.round,
        'current', after.current, 'changed', before.current !== after.current ||
        before.round !== after.round, 'bytes', bytes);
    }

    log.architectureAtEnd = await page.evaluate(() => window.DMO_ART_PACK.architecture());
    log.pageerrorCount = log.pageerrors.length;
    log.consoleErrors = log.console.filter(x => x.type === 'error').map(x => x.text.slice(0, 160));
    log.httpErrors = log.httpErrors.map(e => ({ status: e.status, url: e.url.slice(0, 130) }));
    await ctx.close();
    await browser.close();
    fs.writeFileSync(path.join(OUT, 'logs', 'extra.json'), JSON.stringify(log, null, 2));
    console.log('\nfireProbes', JSON.stringify(log.fireProbes.map(f => ({
      tag: f.tag, mouseShotDelta: f.mouseShotDelta, mouseWaDelta: f.mouseWaDelta,
      inputShotDelta: f.inputShotDelta, inputWaDelta: f.inputWaDelta }))));
    console.log('JSON:', path.join(OUT, 'logs', 'extra.json'));
  } catch (e) {
    console.log('FALLO:', e.message, (e.stack || '').split('\n').slice(0, 10).join('\n'));
    fs.writeFileSync(path.join(OUT, 'logs', 'extra_error.json'), JSON.stringify(log, null, 2));
    if (browser) await browser.close().catch(() => {});
    process.exit(1);
  }
})();
