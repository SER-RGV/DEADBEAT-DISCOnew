#!/usr/bin/env node
/* ==========================================================================
   DEADBEAT DISCO — ART PRODUCTION MASTER · sonda del PROTAGONISTA en el juego
   Uso:  node tools/art_master/probe_player.js <carpeta_salida>
              [--dpr=2] [--weapons=m1911,ak47,m60] [--box=230] [--runbox=150]
              [--skip-hub] [--skip-states] [--url=http://127.0.0.1:8080/index.html]

   Abre el index.html real, entra al Refugio y a una incursión, y recorta en
   primer plano al protagonista en cada estado de animación (reposo, caminar,
   barrido de elevación de +89° a −89° parado y caminando, mirando a ambos
   lados, daño, habilidad, voltereta, derribo) con el arma equipada dibujada
   por el propio motor.

   Cómo captura:
   - Refugio: teclado real + lectura directa del <canvas>.
   - Incursión: __DD_BRIDGE.testStep(entrada, fotogramas) y lectura del <canvas>
     DENTRO de la misma llamada al navegador. Si se separan, el bucle real del
     juego sigue corriendo sin entrada y el personaje vuelve a reposo antes de
     la captura (la foto no correspondería al estado pedido).
   - El informe (probe_report.json) se reescribe tras CADA captura: una
     ejecución interrumpida conserva lo ya medido.

   NO usar DMO.debug.invuln(): pone el temporizador de invulnerabilidad a 1e9 y
   el motor muestra entonces la pose de daño de forma permanente.

   Requiere servidor en :8080 y el entorno de navegador de /tmp/browser.
   Tarda varios minutos (Chromium sin GPU): lanzarlo en segundo plano.
   ========================================================================== */
const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");
const browserReq = createRequire("/tmp/browser/package.json");
const { chromium: pw } = browserReq("playwright-core");
process.env.LD_LIBRARY_PATH = "/tmp/al2023/lib:/tmp/al2023:" + (process.env.LD_LIBRARY_PATH || "");
process.env.FONTCONFIG_PATH = "/tmp/fonts";

const args = process.argv.slice(2);
const OUT = path.resolve(args.find(a => !a.startsWith("--")) || "/tmp/ddqa/player");
const opt = (k, d) => { const a = args.find(x => x.startsWith("--" + k + "=")); return a ? a.split("=")[1] : d; };
const DPR = Number(opt("dpr", "2"));
const URL = opt("url", "http://127.0.0.1:8080/index.html");
const WEAPONS = opt("weapons", "m1911,ak47,m60").split(",").filter(Boolean);
const HUB_BOX = Number(opt("box", "230"));
const RUN_BOX = Number(opt("runbox", "150"));
const SKIP_HUB = args.includes("--skip-hub");
const SKIP_STATES = args.includes("--skip-states");
const T0 = Date.now();
fs.mkdirSync(OUT, { recursive: true });

/* Se instala en la página: localizar al protagonista y recortar el canvas. */
function installProbe() {
  const P = {};
  P.locate = function () {
    const out = { x: 640, y: 360, how: "center" };
    try {
      if (window.DD_HUB && window.DD_HUB.isActive()) {
        const s = window.DD_HUB.getState();
        if (s && s.screen) { out.x = s.screen.x; out.y = s.screen.y; out.how = "hub.screen"; }
        else if (s && typeof s.camX === "number") { out.x = 640 + (s.px - s.camX) * (s.zoom || 1); out.y = 360 + (s.py - s.camY) * (s.zoom || 1); out.how = "hub.cam"; }
        return out;
      }
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
    let anim = null, mount = null;
    try {
      const pA = window.DMO.playerAnim;
      const s = pA.getStateSnapshot();
      anim = { state: s.state, upper: s.upperPose, lower: s.lowerPose, split: s.waistSplitActive, walkFrame: s.walkFrame, speed: s.speed };
      const aim = (pA.forcedAimAngle != null) ? pA.forcedAimAngle : ((window.__DD_BRIDGE.getSnapshot().player || {}).aimAngle || 0);
      mount = { longGun: !!pA.ddLongGun, hand: window.DD_WORLD.getPlayerWeaponMount ? window.DD_WORLD.getPlayerWeaponMount(pA, aim, 1) : null };
    } catch (e) { anim = String(e); }
    return { png: oc.toDataURL("image/png"), at: [Math.round(loc.x), Math.round(loc.y)], how: loc.how, zoom: loc.zoom, anim: anim, mount: mount };
  };
  P.stepGrab = function (inp, frames, box, dy, forced) {
    if (forced !== undefined) { try { window.DMO.playerAnim.forceState(forced); } catch (e) {} }
    window.__DD_BRIDGE.testStep(inp || {}, frames || 1);
    const g = P.grab(box, dy);
    if (forced) { try { window.DMO.playerAnim.forceState(null); } catch (e) {} }
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
  const report = { url: URL, dpr: DPR, pageErrors: [], httpErrors: [], shots: [] };
  page.on("pageerror", e => report.pageErrors.push(String(e.message).slice(0, 300)));
  page.on("response", r => { if (r.status() >= 400) report.httpErrors.push(r.status() + " " + r.url()); });

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => window.DD_ASSETS && (() => { const s = window.DD_ASSETS.stats(); return s.loaded + s.errors >= s.registered; })(), { timeout: 60000 });
  await page.waitForTimeout(600);
  report.assets = await page.evaluate(() => window.DD_ASSETS.stats());
  report.integrity = await page.evaluate(() => { try { const r = window.DD_ASSETS.integrity(); return { pass: r.pass, checked: r.checked, ok: r.ok, errors: (r.errors || []).slice(0, 12) }; } catch (e) { return String(e); } });
  await page.evaluate(installProbe);
  await page.evaluate(() => window.DD_CINE && window.DD_CINE.skip());
  await page.waitForTimeout(3000);

  const save = (name, g, extra) => {
    fs.writeFileSync(path.join(OUT, name + ".png"), Buffer.from(g.png.split(",")[1], "base64"));
    report.shots.push(Object.assign({ name, t: +((Date.now() - T0) / 1000).toFixed(1), how: g.how, at: g.at, zoom: g.zoom, anim: g.anim, weaponMount: g.mount }, extra || {}));
    fs.writeFileSync(path.join(OUT, "probe_report.json"), JSON.stringify(report, null, 1));
    console.log("shot", name, JSON.stringify(g.anim), JSON.stringify(g.mount && g.mount.hand));
  };
  const grabNow = (box, dy) => page.evaluate(([b, d]) => window.__ddProbe.grab(b, d), [box, dy || 0]);
  /* Recorte de sala centrado en la figura: desde R02 las suelas caen en y+14 px de
     mundo y la coronilla en y-88 (zoom 0,8 → centro a unos -30 px de pantalla). */
  const RUN_DY = -30;
  const stepGrab = (inp, frames, forced) => page.evaluate(([i, f, b, st, dy]) => window.__ddProbe.stepGrab(i, f, b, dy, st === null ? undefined : st), [inp || {}, frames || 1, RUN_BOX, forced === undefined ? null : forced, RUN_DY]);
  const step = (inp, frames) => page.evaluate(([i, f]) => { window.__DD_BRIDGE.testStep(i, f); return true; }, [inp || {}, frames || 10]);

  /* ---------------- REFUGIO ---------------- */
  report.hubState = await page.evaluate(() => { try { return window.DD_HUB.getState(); } catch (e) { return String(e); } });
  if (!SKIP_HUB) {
    save("hub_00_idle", await grabNow(HUB_BOX, -18));
    await page.keyboard.down("KeyD");
    for (let i = 0; i < 4; i++) { await page.waitForTimeout(95); save("hub_01_caminar_der_" + i, await grabNow(HUB_BOX, -18)); }
    await page.keyboard.up("KeyD");
    await page.keyboard.down("KeyA");
    await page.waitForTimeout(260); save("hub_02_caminar_izq", await grabNow(HUB_BOX, -18));
    await page.keyboard.up("KeyA");
  }

  /* ---------------- INCURSIÓN ---------------- */
  await page.evaluate(() => window.DD_HUB.exitToRun());
  await page.waitForTimeout(500);
  await page.evaluate(() => window.DD_CINE && window.DD_CINE.skip());
  await page.waitForTimeout(900);
  /* sala despejada SIN modo dios (ver nota de cabecera) */
  await page.evaluate(() => {
    try { window.DMO.debug.exploreNoEnemies(true); } catch (e) {}
    try { window.DMO.debug.holdSpawns(true); } catch (e) {}
    try { window.DMO.debug.killAll(); } catch (e) {}
  });
  /* al centro de la sala para que la cámara no esté pegada a un muro */
  for (let k = 0; k < 6; k++) {
    const s = await page.evaluate(() => window.__DD_BRIDGE.getSnapshot());
    if (!s.roomRect || !s.player) break;
    const dx = (s.roomRect.x + s.roomRect.w / 2) - s.player.x, dy = (s.roomRect.y + s.roomRect.h / 2) - s.player.y;
    if (Math.abs(dx) < 40 && Math.abs(dy) < 40) break;
    await step({ right: dx > 30, left: dx < -30, down: dy > 30, up: dy < -30, aim: 0 }, 16);
  }
  await step({ aim: 0 }, 12);

  for (const wid of WEAPONS) {
    const eq = await page.evaluate((w) => { try { return window.__DD_BRIDGE.buyOrEquipWeapon(w, true); } catch (e) { return String(e); } }, wid);
    report["equip_" + wid] = eq;
    const tag = "run_" + wid + "_";
    const X = { weapon: wid };
    await step({ aim: 0 }, 40);
    const D = Math.PI / 180;
    save(tag + "00_quieto", await stepGrab({ aim: 0 }, 2), X);
    /* Barrido de elevación parado, mirando a la derecha (aim del motor: y hacia abajo). */
    for (const el of [89, 60, 30, 0, -30, -60, -89]) {
      save(tag + "01_parado_el" + (el >= 0 ? "+" : "-") + String(Math.abs(el)).padStart(2, "0"), await stepGrab({ fire: true, aim: -el * D }, 5), Object.assign({ el }, X));
    }
    /* Mirando a la izquierda: horizontal, arriba-izquierda y abajo-izquierda. */
    save(tag + "02_izq_el+00", await stepGrab({ fire: true, aim: Math.PI }, 5), X);
    save(tag + "02_izq_el+60", await stepGrab({ fire: true, aim: -120 * D }, 5), X);
    save(tag + "02_izq_el-60", await stepGrab({ fire: true, aim: 120 * D }, 5), X);
    /* Caminando: ciclo completo en horizontal y dos fotogramas por elevación. */
    for (let i = 0; i < 4; i++) save(tag + "07_camina_el+00_" + i, await stepGrab({ right: true, fire: true, aim: 0 }, 5), X);
    for (const el of [89, 45, -45, -89]) {
      for (let i = 0; i < 2; i++) {
        save(tag + "07_camina_el" + (el >= 0 ? "+" : "-") + String(Math.abs(el)).padStart(2, "0") + "_" + i, await stepGrab({ right: true, fire: true, aim: -el * D }, 5), Object.assign({ el }, X));
      }
    }
    for (let i = 0; i < 2; i++) save(tag + "08_camina_izq_" + i, await stepGrab({ left: true, aim: Math.PI }, 7), X);
    save(tag + "09_retrocede_disparando", await stepGrab({ left: true, fire: true, aim: 0 }, 6), X);
  }

  /* estados forzados */
  if (!SKIP_STATES) {
    await step({ aim: 0 }, 30);
    save("run_estado_danio", await stepGrab({ aim: 0 }, 2, "hurt"), { forced: "hurt" });
    save("run_estado_danio_caminando", await stepGrab({ right: true, aim: 0 }, 6, "hurt"), { forced: "hurt" });
    save("run_estado_habilidad", await stepGrab({ aim: 0 }, 2, "ability"), { forced: "ability" });
    save("run_estado_voltereta_forzada", await stepGrab({ aim: 0 }, 2, "dodge"), { forced: "dodge" });
    /* voltereta real del motor: Espacio mientras se camina a la derecha */
    await page.keyboard.down("KeyD");
    await page.keyboard.down("Space");
    for (let i = 0; i < 3; i++) save("run_estado_voltereta_real_" + i, await stepGrab({ right: true, aim: 0 }, 3), { input: "KeyD+Space" });
    await page.keyboard.up("Space");
    await page.keyboard.up("KeyD");
    await step({ aim: 0 }, 30);
    save("run_estado_derribo", await stepGrab({ aim: 0 }, 10, "death"), { forced: "death" });
    save("run_estado_derribo_izq", await stepGrab({ aim: Math.PI }, 4, "death"), { forced: "death" });
  }

  report.finalAssets = await page.evaluate(() => window.DD_ASSETS.stats());
  report.elapsedS = +((Date.now() - T0) / 1000).toFixed(1);
  fs.writeFileSync(path.join(OUT, "probe_report.json"), JSON.stringify(report, null, 1));
  console.log(JSON.stringify({ out: OUT, shots: report.shots.length, pageErrors: report.pageErrors, httpErrors: report.httpErrors.slice(0, 8), assets: report.finalAssets, integrity: report.integrity, elapsedS: report.elapsedS }, null, 1));
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
