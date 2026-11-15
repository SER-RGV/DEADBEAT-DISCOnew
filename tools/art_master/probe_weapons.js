#!/usr/bin/env node
/* ==========================================================================
   DEADBEAT DISCO — ART PRODUCTION MASTER · sonda de ARMAS en la mano (T05)
   Uso:  node tools/art_master/probe_weapons.js <carpeta_salida>
              --weapons=thompson,ak47,m60 [--dpr=2] [--box=170]
              [--poses=quieto,der,arriba,abajo,izq,camina] [--grip=1]
              [--url=http://127.0.0.1:8080/index.html]

   Abre el index.html real, entra en una incursión con la sala despejada, equipa
   cada arma pedida con __DD_BRIDGE.buyOrEquipWeapon(id, true) (gratis, sin
   tienda) y recorta en primer plano al protagonista con el arma dibujada por el
   propio motor (`it` del módulo v3.2 a través del puente), en varias posturas:
     quieto   · reposo, sin apuntar (arma «guardada» según su clase)
     der      · disparando a la derecha, horizontal
     arriba   · disparando a +60° (hacia arriba)
     abajo    · disparando a −60° (hacia abajo)
     izq      · disparando a la izquierda (sprite volteado por el motor)
     camina   · caminando a la derecha mientras dispara
   Con --grip=1 se activa ut.debugGrip del motor (rectángulo del sprite, eje del
   cañón y punto de empuñadura) en una segunda copia «_grip» de cada captura.

   Para cada captura se guarda la telemetría __DD_BRIDGE.getWeaponTelemetry()
   (ut._gdb: len/hgt en px, grip/gripY/axis/tip/sup, muzzleLocal, supLocal,
   cat11, cls, capa) en probe_report.json, que se reescribe tras CADA captura.

   Misma mecánica que probe_player.js: testStep + lectura del <canvas> en la
   misma llamada al navegador; una sola instancia de Chromium; sin modo dios.
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
const OUT = path.resolve(args.find(a => !a.startsWith("--")) || "/tmp/ddqa/weapons");
const opt = (k, d) => { const a = args.find(x => x.startsWith("--" + k + "=")); return a ? a.split("=").slice(1).join("=") : d; };
const DPR = Number(opt("dpr", "2"));
const URL = opt("url", "http://127.0.0.1:8080/index.html");
const WEAPONS = opt("weapons", "m1911").split(",").filter(Boolean);
const BOX = Number(opt("box", "170"));
const POSES = opt("poses", "quieto,der,arriba,abajo,izq,camina").split(",").filter(Boolean);
const GRIP = opt("grip", "0") === "1";
const T0 = Date.now();
fs.mkdirSync(OUT, { recursive: true });

function installProbe() {
  const P = {};
  P.locate = function () {
    const out = { x: 640, y: 360, how: "center" };
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
  P.grab = function (box, dy) {
    const loc = P.locate();
    const cx = Math.max(box / 2, Math.min(1280 - box / 2, loc.x));
    const cy = Math.max(box / 2, Math.min(720 - box / 2, loc.y + (dy || 0)));
    const cv = Array.from(document.querySelectorAll("canvas"))
      .filter(c => c.getBoundingClientRect().width > 0)
      .sort((a, b) => b.width * b.height - a.width * a.height)[0];
    const r = cv.getBoundingClientRect();
    const k = cv.width / r.width;
    const oc = document.createElement("canvas");
    oc.width = Math.round(box * k); oc.height = Math.round(box * k);
    oc.getContext("2d").drawImage(cv, (cx - box / 2 - r.left) * k, (cy - box / 2 - r.top) * k, box * k, box * k, 0, 0, oc.width, oc.height);
    let tele = null;
    try { tele = window.__DD_BRIDGE.getWeaponTelemetry(); } catch (e) { tele = String(e); }
    return { png: oc.toDataURL("image/png"), at: [Math.round(loc.x), Math.round(loc.y)], zoom: loc.zoom, tele };
  };
  P.stepGrab = function (inp, frames, box, dy, grip) {
    try { window.DMO.debug && window.DMO.debug.holdSpawns && window.DMO.debug.holdSpawns(true); } catch (e) {}
    window.__DD_BRIDGE.testStep(inp || {}, frames || 1);
    const g = P.grab(box, dy);
    if (grip) {
      try {
        window.__DD_BRIDGE.setDebugGrip(true); window.__DD_BRIDGE.testStep(inp || {}, 1);
        g.pngGrip = P.grab(box, dy).png;
        window.__DD_BRIDGE.setDebugGrip(false); window.__DD_BRIDGE.testStep(inp || {}, 1);
      } catch (e) {}
    }
    return g;
  };
  window.__ddProbe = P;
}

(async () => {
  const sparticuz = (await import("file:///tmp/browser/node_modules/@sparticuz/chromium/build/index.js")).default;
  const browser = await pw.launch({
    executablePath: "/tmp/chromium",
    args: [...sparticuz.args.filter(a => !a.startsWith("--headless") && !a.startsWith("--window-size")), "--no-sandbox"],
    headless: true
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: DPR });
  const page = await ctx.newPage();
  const report = { url: URL, dpr: DPR, box: BOX, pageErrors: [], httpErrors: [], shots: [] };
  page.on("pageerror", e => report.pageErrors.push(String(e.message).slice(0, 300)));
  page.on("response", r => { if (r.status() >= 400) report.httpErrors.push(r.status() + " " + r.url()); });

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => window.DD_ASSETS && (() => { const s = window.DD_ASSETS.stats(); return s.loaded + s.errors >= s.registered; })(), { timeout: 60000 });
  await page.waitForTimeout(600);
  report.assets = await page.evaluate(() => window.DD_ASSETS.stats());
  await page.evaluate(installProbe);
  await page.evaluate(() => window.DD_CINE && window.DD_CINE.skip());
  await page.waitForTimeout(2500);

  const save = (name, g, extra) => {
    fs.writeFileSync(path.join(OUT, name + ".png"), Buffer.from(g.png.split(",")[1], "base64"));
    if (g.pngGrip) fs.writeFileSync(path.join(OUT, name + "_grip.png"), Buffer.from(g.pngGrip.split(",")[1], "base64"));
    report.shots.push(Object.assign({ name, t: +((Date.now() - T0) / 1000).toFixed(1), at: g.at, zoom: g.zoom, tele: g.tele }, extra || {}));
    fs.writeFileSync(path.join(OUT, "probe_report.json"), JSON.stringify(report, null, 1));
    const gd = g.tele && g.tele.gdb;
    console.log("shot", name, g.tele && g.tele.pose, gd ? ("len=" + Math.round(gd.len) + " hgt=" + Math.round(gd.hgt) + " muzzle=" + JSON.stringify((gd.muzzleLocal || []).map(v => Math.round(v)))) : "(sin _gdb)");
  };
  const RUN_DY = -30;
  const stepGrab = (inp, frames) => page.evaluate(([i, f, b, dy, gr]) => window.__ddProbe.stepGrab(i, f, b, dy, gr), [inp || {}, frames || 1, BOX, RUN_DY, GRIP]);
  const step = (inp, frames) => page.evaluate(([i, f]) => { window.__DD_BRIDGE.testStep(i, f); return true; }, [inp || {}, frames || 10]);

  /* ---------------- INCURSIÓN con sala despejada ---------------- */
  await page.evaluate(() => window.DD_HUB && window.DD_HUB.isActive() && window.DD_HUB.exitToRun());
  await page.waitForTimeout(500);
  await page.evaluate(() => window.DD_CINE && window.DD_CINE.skip());
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    try { window.DMO.debug.exploreNoEnemies(true); } catch (e) {}
    try { window.DMO.debug.holdSpawns(true); } catch (e) {}
    try { window.DMO.debug.killAll(); } catch (e) {}
  });
  for (let k = 0; k < 6; k++) {
    const s = await page.evaluate(() => window.__DD_BRIDGE.getSnapshot());
    if (!s.roomRect || !s.player) break;
    const dx = (s.roomRect.x + s.roomRect.w / 2) - s.player.x, dy = (s.roomRect.y + s.roomRect.h / 2) - s.player.y;
    if (Math.abs(dx) < 40 && Math.abs(dy) < 40) break;
    await step({ right: dx > 30, left: dx < -30, down: dy > 30, up: dy < -30, aim: 0 }, 16);
  }
  await step({ aim: 0 }, 12);
  report.calibrations = {};

  const D = Math.PI / 180;
  for (const wid of WEAPONS) {
    const eq = await page.evaluate((w) => { try { return window.__DD_BRIDGE.buyOrEquipWeapon(w, true); } catch (e) { return String(e); } }, wid);
    const cal = await page.evaluate((w) => { try { return window.__DD_BRIDGE.getWeaponCalibration(w); } catch (e) { return String(e); } }, wid);
    report.calibrations[wid] = { equipped: eq, cal };
    if (!eq) { console.log("NO EQUIPADA", wid); continue; }
    const X = { weapon: wid };
    const tag = wid + "_";
    await step({ aim: 0 }, 45); /* que termine la animación de cambio de arma */
    if (POSES.includes("quieto")) save(tag + "0_quieto", await stepGrab({ aim: 0 }, 2), X);
    if (POSES.includes("der")) save(tag + "1_der", await stepGrab({ fire: true, aim: 0 }, 5), X);
    if (POSES.includes("arriba")) save(tag + "2_arriba", await stepGrab({ fire: true, aim: -60 * D }, 5), X);
    if (POSES.includes("abajo")) save(tag + "3_abajo", await stepGrab({ fire: true, aim: 60 * D }, 5), X);
    if (POSES.includes("izq")) save(tag + "4_izq", await stepGrab({ fire: true, aim: Math.PI }, 5), X);
    if (POSES.includes("camina")) { await stepGrab({ right: true, fire: true, aim: 0 }, 5); save(tag + "5_camina", await stepGrab({ right: true, fire: true, aim: 0 }, 5), X); }
    await step({ aim: 0 }, 6);
  }

  report.elapsedS = +((Date.now() - T0) / 1000).toFixed(1);
  fs.writeFileSync(path.join(OUT, "probe_report.json"), JSON.stringify(report, null, 1));
  console.log(JSON.stringify({ out: OUT, shots: report.shots.length, pageErrors: report.pageErrors, httpErrors: report.httpErrors.slice(0, 8), elapsedS: report.elapsedS }, null, 1));
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
