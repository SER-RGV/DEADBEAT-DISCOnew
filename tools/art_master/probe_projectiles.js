#!/usr/bin/env node
/* ==========================================================================
   DEADBEAT DISCO — ART PRODUCTION MASTER · sonda de PROYECTILES e IMPACTOS (T08)
   Uso:  node tools/art_master/probe_projectiles.js <carpeta_salida>
              [--types=slug,heavy,pellet,cryo,plasma,ricochet,lane,flame,rail,homing]
              [--dpr=2] [--box=520x200] [--bomb=1]
              [--url=http://127.0.0.1:8080/index.html]

   Abre el index.html real, entra en una incursión con la sala despejada y, para
   cada TIPO de proyectil del catálogo del motor (ja[arma].projectile), equipa
   un arma representativa con __DD_BRIDGE.buyOrEquipWeapon(id, true), dispara
   con el propio motor y fotografía las balas EN VUELO tal y como las pinta
   DD_WORLD.drawProjectiles (sprite proj_<tipo>, mezcla «lighter»):
     der     · ráfaga hacia la derecha (recorte ancho a la derecha del jugador)
     izq     · ráfaga hacia la izquierda (el sprite se gira por rotación)
     arriba  · ráfaga vertical hacia arriba (rotación −90°)
     impacto · las balas al llegar a la pared de la sala (chispas Sa del motor)
   Con --bomb=1 también detona una bomba (tp) y fotografía la explosión.

   Para cada captura se guarda la telemetría de __DD_BRIDGE.getActors(): balas
   vivas (tipo projectile50, arma), nº de partículas de impacto (Sa) y la
   posición del jugador, en probe_report.json (se reescribe tras CADA captura).
   Una sola instancia de Chromium; sin modo dios; no toca mecánicas.
   Requiere servidor en :8080 y el entorno de navegador de /tmp/browser.
   ========================================================================== */
const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");
const browserReq = createRequire("/tmp/browser/package.json");
const { chromium: pw } = browserReq("playwright-core");
process.env.LD_LIBRARY_PATH = "/tmp/al2023/lib:/tmp/al2023:" + (process.env.LD_LIBRARY_PATH || "");
process.env.FONTCONFIG_PATH = "/tmp/fonts";

const args = process.argv.slice(2);
const OUT = path.resolve(args.find(a => !a.startsWith("--")) || "/tmp/ddqa/projectiles");
const opt = (k, d) => { const a = args.find(x => x.startsWith("--" + k + "=")); return a ? a.split("=").slice(1).join("=") : d; };
const DPR = Number(opt("dpr", "1"));
const URL = opt("url", "http://127.0.0.1:8080/index.html");
const BOMB = opt("bomb", "1") === "1";
const [BW, BH] = opt("box", "520x200").split("x").map(Number);
/* Arma representativa de cada tipo de proyectil (catálogo ja del motor). */
const WEAPON_BY_TYPE = {
  slug: "m1911", heavy: "magnum", pellet: "spas12", cryo: "cryo", plasma: "plasma",
  ricochet: "ricochet", lane: "trident", flame: "flamer", rail: "railgun", homing: "raygun"
};
const TYPES = opt("types", Object.keys(WEAPON_BY_TYPE).join(",")).split(",").filter(Boolean);
const T0 = Date.now();
fs.mkdirSync(OUT, { recursive: true });

function installProbe() {
  const P = {};
  P.locate = function () {
    const out = { x: 640, y: 360, how: "center", zoom: 1 };
    try {
      const cam = typeof window.DMO.camera === "function" ? window.DMO.camera() : null;
      const p = window.__DD_BRIDGE.getSnapshot().player;
      if (cam && p && typeof cam.x === "number") {
        const z = cam.applied || cam.zoom || 1;
        out.x = 640 + (p.x - cam.x) * z; out.y = 360 + (p.y - cam.y) * z; out.how = "DMO.camera"; out.zoom = z;
      }
    } catch (e) { out.err = String(e); }
    return out;
  };
  /* Recorta un rectángulo w×h del canvas principal centrado en (jugador + dx, dy). */
  P.grab = function (w, h, dx, dy) {
    const loc = P.locate();
    const cx = Math.max(w / 2, Math.min(1280 - w / 2, loc.x + (dx || 0)));
    const cy = Math.max(h / 2, Math.min(720 - h / 2, loc.y + (dy || 0)));
    const cv = Array.from(document.querySelectorAll("canvas"))
      .filter(c => c.getBoundingClientRect().width > 0)
      .sort((a, b) => b.width * b.height - a.width * a.height)[0];
    const r = cv.getBoundingClientRect();
    const k = cv.width / r.width;
    const oc = document.createElement("canvas");
    oc.width = Math.round(w * k); oc.height = Math.round(h * k);
    oc.getContext("2d").drawImage(cv, (cx - w / 2 - r.left) * k, (cy - h / 2 - r.top) * k, w * k, h * k, 0, 0, oc.width, oc.height);
    let tele = null;
    try {
      const a = window.__DD_BRIDGE.getActors();
      const types = {};
      for (const b of a.bullets) types[b.projectile || "?"] = (types[b.projectile || "?"] || 0) + 1;
      tele = { bullets: a.bullets.length, types, impacts: a.impacts, player: a.player && { x: Math.round(a.player.x), y: Math.round(a.player.y) } };
    } catch (e) { tele = String(e); }
    return { png: oc.toDataURL("image/png"), at: [Math.round(loc.x), Math.round(loc.y)], zoom: loc.zoom, tele };
  };
  P.stepGrab = function (inp, frames, w, h, dx, dy) {
    try { window.DMO.debug && window.DMO.debug.holdSpawns && window.DMO.debug.holdSpawns(true); } catch (e) {}
    window.__DD_BRIDGE.testStep(inp || {}, frames || 1);
    return P.grab(w, h, dx, dy);
  };
  /* Bomba: pulsación sintética de Q (el manejador del motor sólo mira e.code) y
     varias capturas dentro de UNA sola llamada, para que el bucle rAF de la página
     no consuma la animación entre capturas (en headless un ida y vuelta tarda
     ~0,6 s y la explosión dura 0,56 s de juego). */
  P.bombSequence = function (frames, w, h, dx, dy) {
    const out = { shots: [], ages: [], impacts: [] };
    const fire = (type) => {
      const ev = new KeyboardEvent(type, { code: "KeyQ", key: "q", bubbles: true, cancelable: true });
      window.dispatchEvent(ev);
      if (!ev.defaultPrevented) document.dispatchEvent(new KeyboardEvent(type, { code: "KeyQ", key: "q", bubbles: true, cancelable: true }));
    };
    const Z = () => { try { return window.__DD_BRIDGE.getActors().time; } catch (e) { return null; } };
    out.before = { impacts: window.__DD_BRIDGE.getActors().impacts, time: Z(), bombs: (document.getElementById("bombCount") || {}).textContent };
    fire("keydown"); fire("keyup");
    out.after = { impacts: window.__DD_BRIDGE.getActors().impacts, time: Z(), explosions: window.DD_WORLD.__explosions ? window.DD_WORLD.__explosions(Z()) : null };
    for (const n of frames) {
      window.__DD_BRIDGE.testStep({ aim: 0 }, n);
      const g = P.grab(w, h, dx, dy);
      out.shots.push(g.png);
      out.ages.push(window.DD_WORLD.__explosions ? window.DD_WORLD.__explosions(Z()) : null);
      out.impacts.push(g.tele && g.tele.impacts);
    }
    out.time = Z();
    return out;
  };
  window.__ddProbe = P;
}

(async () => {
  const sparticuz = (await import("file:///tmp/browser/node_modules/@sparticuz/chromium/build/index.js")).default;
  const browser = await pw.launch({
    executablePath: "/tmp/chromium",
    args: [...sparticuz.args.filter(a => !a.startsWith("--headless") && !a.startsWith("--window-size")), "--no-sandbox", "--mute-audio"],
    headless: true
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: DPR });
  const page = await ctx.newPage();
  const report = { url: URL, dpr: DPR, box: [BW, BH], pageErrors: [], httpErrors: [], shots: [] };
  page.on("pageerror", e => report.pageErrors.push(String(e.message).slice(0, 300)));
  page.on("response", r => { if (r.status() >= 400) report.httpErrors.push(r.status() + " " + r.url()); });

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- Ruta real de arranque (la misma que probe_hud.js): armazón → gesto
     (Espacio) → INTRO (Espacio la salta) → MAIN_MENU → clic «NUEVA PARTIDA» →
     descenso → Refugio → DD_HUB.exitToRun() → incursión. ---------- */
  const bootState = () => page.evaluate(() => {
    const B = window.DD_BOOT; const root = document.getElementById("dd-boot-frame");
    return { state: B && B.getState ? B.getState().state : null, classes: root ? root.className : "" };
  });
  let bs = null;
  for (let i = 0; i < 240; i++) {
    bs = await bootState();
    if (/is-failed|is-waiting/.test(bs.classes) || bs.state === "INTRO" || bs.state === "MAIN_MENU") break;
    await sleep(500);
  }
  console.log("boot", JSON.stringify(bs), (Date.now() - T0) + " ms");
  if (/is-failed/.test(bs.classes)) throw new Error("arranque fallido en headless");
  if (/is-waiting/.test(bs.classes)) await page.keyboard.press("Space");
  let st = null;
  for (let i = 0; i < 60; i++) { st = await page.evaluate(() => window.DD_BOOT.getState().state); if (st === "INTRO" || st === "MAIN_MENU") break; await sleep(500); }
  if (st === "INTRO") {
    /* Un jugador que quiere saltar la intro pulsa varias veces: una sola pulsación antes de
       que DD_OPENING acepte entrada se pierde y la intro se reproduce entera (~100 s). */
    await sleep(1200);
    for (let i = 0; i < 90; i++) {
      await page.keyboard.press("Space");
      await sleep(1200);
      st = await page.evaluate(() => window.DD_BOOT.getState().state);
      if (st === "MAIN_MENU") break;
    }
  }
  console.log("menu", st, (Date.now() - T0) + " ms");
  if (st !== "MAIN_MENU") throw new Error("no se alcanzó MAIN_MENU (estado " + st + ")");
  await sleep(800);
  await page.click('#dd-main-menu .dd-menu-btn[data-action="new"]');
  let hub = false;
  for (let i = 0; i < 180; i++) {
    hub = await page.evaluate(() => { const hud = document.getElementById("dd-hud"); return !!(window.DD_HUB && window.DD_HUB.isActive && window.DD_HUB.isActive() && hud && !hud.classList.contains("dd-hidden")); });
    if (hub) break;
    await page.evaluate(() => { try { window.DD_OPENING && window.DD_OPENING.skip && window.DD_OPENING.skip(); } catch (e) {} });
    await sleep(500);
  }
  console.log("hub", hub, (Date.now() - T0) + " ms");
  if (!hub) throw new Error("no se alcanzó el Refugio");
  report.assets = await page.evaluate(() => window.DD_ASSETS.stats());
  await page.evaluate(installProbe);
  report.bootMs = Date.now() - T0;

  const save = (name, g, extra) => {
    fs.writeFileSync(path.join(OUT, name + ".png"), Buffer.from(g.png.split(",")[1], "base64"));
    report.shots.push(Object.assign({ name, t: +((Date.now() - T0) / 1000).toFixed(1), at: g.at, zoom: g.zoom, tele: g.tele }, extra || {}));
    fs.writeFileSync(path.join(OUT, "probe_report.json"), JSON.stringify(report, null, 1));
    console.log("shot", name, JSON.stringify(g.tele));
  };
  const stepGrab = (inp, frames, dx, dy, w, h) => page.evaluate(([i, f, bw, bh, x, y]) => window.__ddProbe.stepGrab(i, f, bw, bh, x, y), [inp || {}, frames || 1, w || BW, h || BH, dx || 0, dy || 0]);
  const step = (inp, frames) => page.evaluate(([i, f]) => { window.__DD_BRIDGE.testStep(i, f); return true; }, [inp || {}, frames || 10]);
  const actors = () => page.evaluate(() => window.__DD_BRIDGE.getActors());

  /* ---------------- INCURSIÓN con sala despejada ---------------- */
  await page.evaluate(() => { try { window.DD_HUB.exitToRun(); } catch (e) {} });
  await sleep(1500);
  await page.evaluate(() => { try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} try { window.DD_OPENING && window.DD_OPENING.skip(); } catch (e) {} });
  let running = false;
  for (let i = 0; i < 120; i++) { running = await page.evaluate(() => !!(window.DMO && window.DMO.observe().hud && window.DMO.observe().hud.running)); if (running) break; await sleep(500); }
  console.log("run", running, (Date.now() - T0) + " ms");
  if (!running) throw new Error("el motor no entró en incursión");
  await page.evaluate(() => {
    try { window.DMO.debug.exploreNoEnemies(true); } catch (e) {}
    try { window.DMO.debug.holdSpawns(true); } catch (e) {}
    try { window.DMO.debug.killAll(); } catch (e) {}
  });
  await step({ aim: 0 }, 10); await sleep(1200);
  await page.evaluate(() => { try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} });
  await step({ aim: 0 }, 4);
  /* Colocar al jugador en el tercio izquierdo de la sala para que las balas tengan recorrido a la derecha. */
  const goTo = async (fx, fy) => {
    for (let k = 0; k < 10; k++) {
      const s = await page.evaluate(() => window.__DD_BRIDGE.getSnapshot());
      if (!s.roomRect || !s.player) break;
      const tx = s.roomRect.x + s.roomRect.w * fx, ty = s.roomRect.y + s.roomRect.h * fy;
      const dx = tx - s.player.x, dy = ty - s.player.y;
      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) break;
      await step({ right: dx > 24, left: dx < -24, down: dy > 24, up: dy < -24, aim: 0 }, 14);
    }
    await step({ aim: 0 }, 10);
  };
  await goTo(0.3, 0.55);
  report.room = await page.evaluate(() => { const s = window.__DD_BRIDGE.getSnapshot(); return { roomRect: s.roomRect, player: s.player }; });

  const D = Math.PI / 180;
  const drain = async () => { for (let k = 0; k < 12; k++) { const a = await actors(); if (!a.bullets.length) break; await step({ aim: 0 }, 10); } };
  const equip = async (type) => {
    const wid = WEAPON_BY_TYPE[type];
    const eq = await page.evaluate((w) => { try { return window.__DD_BRIDGE.buyOrEquipWeapon(w, true); } catch (e) { return String(e); } }, wid);
    if (!eq) { console.log("NO EQUIPADA", type, wid); report.shots.push({ name: type, error: "no equipada " + wid }); return null; }
    await step({ aim: 0 }, 45); /* que termine la animación de cambio de arma */
    return { type, weapon: wid };
  };
  /* ---- 1. balas en vuelo (jugador en el tercio izquierdo de la sala) ---- */
  for (const type of TYPES) {
    const X = await equip(type);
    if (!X) continue;
    /* der: dos capturas, una temprana (bala recién salida) y una con la ráfaga en vuelo */
    save(type + "_1_der_a", await stepGrab({ fire: true, aim: 0 }, 6, BW / 2 - 70, -22), X);
    save(type + "_1_der_b", await stepGrab({ fire: true, aim: 0 }, 10, BW / 2 - 70, -22), X);
    await drain();
    save(type + "_3_izq", await stepGrab({ fire: true, aim: Math.PI }, 10, -(BW / 2 - 70), -22), X);
    await drain();
    save(type + "_4_arriba", await stepGrab({ fire: true, aim: -90 * D }, 10, 0, -(BH / 2) - 10, 220, Math.max(BH, 300)), X);
    await drain();
    await step({ aim: 0 }, 6);
  }
  /* ---- 2. impactos sobre un enemigo (los choques con la pared no emiten partículas:
     vs() se llama al herir —hielo/plasma/fuego—, al matar, al romper atrezo y con la bomba) ---- */
  await goTo(0.5, 0.55);
  const spawnTarget = () => page.evaluate(() => {
    try { window.DMO.debug.heal(); } catch (e) {}
    try { window.DMO.debug.killAll(); } catch (e) {}
    const p = window.__DD_BRIDGE.getSnapshot().player;
    let cell = null, prev;
    try { cell = window.DMO_FLOOR.state().currentCell; } catch (e) { cell = null; }
    if (cell) { prev = cell.allowedEnemyTypes; cell.allowedEnemyTypes = null; }
    let ok = false;
    try { ok = !!window.DMO.debug.spawnEnemyAt("tank", p.x + 230, p.y, false, false); } catch (e) { ok = String(e); }
    finally { if (cell) cell.allowedEnemyTypes = prev; }
    /* que no se mueva ni ataque durante la foto: el tanque se queda quieto a 230 px */
    const a = window.__DD_BRIDGE.getActors();
    return { ok, enemies: a.enemies.length };
  });
  report.impactSetup = {};
  for (const type of TYPES) {
    const X = await equip(type);
    if (!X) continue;
    report.impactSetup[type] = await spawnTarget();
    await step({ fire: true, aim: 0 }, 14);
    save(type + "_2_impacto_a", await stepGrab({ fire: true, aim: 0 }, 4, 150, -30, 420, 240), X);
    save(type + "_2_impacto_b", await stepGrab({ fire: true, aim: 0 }, 6, 150, -30, 420, 240), X);
    await page.evaluate(() => { try { window.DMO.debug.killAll(); } catch (e) {} });
    await drain();
    await step({ aim: 0 }, 6);
  }

  if (BOMB) {
    /* Bomba (Q → tp): explosión en el jugador, 4 instantes de la animación (fotogramas 1, 6, 14 y 26 tras la detonación). */
    await goTo(0.5, 0.5);
    const seq = await page.evaluate(([w, h, dy]) => window.__ddProbe.bombSequence([1, 5, 8, 12], w, h, 0, dy), [420, 360, -22]);
    seq.shots.forEach((png, i) => {
      fs.writeFileSync(path.join(OUT, "bomb_" + i + ".png"), Buffer.from(png.split(",")[1], "base64"));
      report.shots.push({ name: "bomb_" + i, bomb: true, explosions: seq.ages[i], impacts: seq.impacts[i] });
    });
    report.bomb = { before: seq.before, after: seq.after, time: seq.time };
    console.log("bomb", JSON.stringify(report.bomb));
    fs.writeFileSync(path.join(OUT, "probe_report.json"), JSON.stringify(report, null, 1));
  }

  report.elapsedS = +((Date.now() - T0) / 1000).toFixed(1);
  fs.writeFileSync(path.join(OUT, "probe_report.json"), JSON.stringify(report, null, 1));
  console.log(JSON.stringify({ out: OUT, shots: report.shots.length, pageErrors: report.pageErrors, httpErrors: report.httpErrors.slice(0, 8), elapsedS: report.elapsedS }, null, 1));
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
