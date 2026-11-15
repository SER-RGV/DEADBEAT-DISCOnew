#!/usr/bin/env node
/* ==========================================================================
   DEADBEAT DISCO — FASE 08 · sonda de ESCALA y CÁMARA sobre la build real
   Uso:  node tools/world_scale/probe_scale.js <carpeta_salida> [--tag=before]
              [--res=1920x1080,1600x900,1280x720] [--levels=2,10]
              [--url=http://127.0.0.1:8080/index.html] [--profile=] [--dpr=1]

   Para cada resolución entra en una incursión (misma ruta que probe_rooms.js:
   DD_CINE.skip → DD_HUB.enter → exitToRun) y fotografía el lienzo completo en:
     room_normal   sala de combate vacía con el protagonista en el centro
     room_crowd    la misma sala con 14 enemigos (4 bailarines, 4 sprinters,
                   2 tanques, 2 tiradores, 2 élites) alrededor del jugador
     corridor      la sala visitada con mayor relación ancho/alto (pasillo)
     boss_arena    arena del residente (nivel 11 = ranura 10) con el jefe invocado
     transition    protagonista junto a una puerta abierta (sala vaciada)
     edge          protagonista en la esquina inferior derecha de la sala
   Además graba una TRAYECTORIA de cámara (jugador corriendo 90 cuadros a la
   derecha y 90 hacia arriba con __DD_BRIDGE.testStep) para medir suavidad
   (velocidad y aceleración de la cámara por cuadro) y telemetría numérica:
   DMO.camera(), DMO.observe().view, tamaños de figura (DD_WORLD/DD_SCALE),
   radios de colisión reales, fps y p95 (DMO.perf).

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
const OUT = path.resolve(args.find(a => !a.startsWith("--")) || "/tmp/ddqa/scale");
const opt = (k, d) => { const a = args.find(x => x.startsWith("--" + k + "=")); return a ? a.split("=").slice(1).join("=") : d; };
const TAG = opt("tag", "before");
const DPR = Number(opt("dpr", "1"));
const PROFILE = opt("profile", "");
const URL = opt("url", "http://127.0.0.1:8080/index.html") + (PROFILE ? ((opt("url", "").includes("?") ? "&" : "?") + "scale=" + PROFILE) : "");
const RES = opt("res", "1920x1080,1600x900,1280x720").split(",").filter(Boolean).map(s => { const [w, h] = s.split("x").map(Number); return { w, h }; });
const LEVELS = opt("levels", "2,11").split(",").map(Number);   // nivel 11 = ranura 10 del círculo = arena del residente
const T0 = Date.now();
fs.mkdirSync(OUT, { recursive: true });

function installProbe() {
  const P = {};
  P.canvas = function () {
    return Array.from(document.querySelectorAll("canvas"))
      .filter(c => c.getBoundingClientRect().width > 0)
      .sort((a, b) => b.width * b.height - a.width * a.height)[0];
  };
  P.full = function (q) {
    const cv = P.canvas();
    const oc = document.createElement("canvas");
    oc.width = window.innerWidth; oc.height = window.innerHeight;
    const c2 = oc.getContext("2d");
    c2.imageSmoothingQuality = "high";
    c2.drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, oc.width, oc.height);
    return oc.toDataURL("image/jpeg", q || 0.9);
  };
  P.tele = function () {
    const B = window.__DD_BRIDGE, D = window.DMO;
    const s = B.getSnapshot();
    const cam = D.camera();
    let obs = null; try { obs = D.observe(); } catch (e) {}
    const act = B.getActors();
    const W = window.DD_WORLD, S = window.DD_SCALE || null, C = window.DD_CAMERA || null;
    const z = cam.zoom || 1;
    const fig = {};
    try {
      if (W && W.__scaleDebug) fig.renderer = W.__scaleDebug();
    } catch (e) { fig.err = String(e); }
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
      camera: cam,
      cameraModule: C && C.debug ? C.debug() : null,
      scaleProfile: S && S.describe ? S.describe() : null,
      view: obs ? obs.view : null,
      room: { rect: s.roomRect, level: s.globalRoom, name: s.roomName, circle: s.circle },
      player: act.player,
      playerScreenH: fig.renderer ? +(fig.renderer.playerH * z).toFixed(1) : null,
      enemies: act.enemies.map(e => ({ type: e.type, family: e.family, r: e.r, elite: e.elite, mini: e.mini, x: Math.round(e.x), y: Math.round(e.y) })),
      boss: s.boss ? { slug: s.boss.slug, x: Math.round(s.boss.x), y: Math.round(s.boss.y) } : null,
      figures: fig.renderer || null,
      perf: { fps: +D.perf.fps().toFixed(1), p95: +D.perf.p95().toFixed(2), avg: +D.perf.avg().toFixed(2) }
    };
  };
  /* Trayectoria de cámara: el jugador corre con testStep; se anota la cámara en cada cuadro. */
  P.trajectory = function (plan) {
    const B = window.__DD_BRIDGE, D = window.DMO;
    const rows = [];
    for (const seg of plan) {
      for (let i = 0; i < seg.frames; i++) {
        const s = B.testStep(seg.input, 1);
        const c = D.camera();
        rows.push({ px: +s.player.x.toFixed(1), py: +s.player.y.toFixed(1), cx: c.x, cy: c.y, z: +c.zoom.toFixed(4) });
      }
    }
    // métricas: velocidad y aceleración de la cámara (px de mundo por cuadro)
    let maxV = 0, maxA = 0, sumA = 0, n = 0, signFlips = 0, prevV = null;
    for (let i = 1; i < rows.length; i++) {
      const vx = rows[i].cx - rows[i - 1].cx, vy = rows[i].cy - rows[i - 1].cy;
      const v = Math.hypot(vx, vy);
      maxV = Math.max(maxV, v);
      if (prevV) {
        const a = Math.hypot(vx - prevV[0], vy - prevV[1]);
        maxA = Math.max(maxA, a); sumA += a; n++;
        if ((vx * prevV[0] < -0.25)) signFlips++;
      }
      prevV = [vx, vy];
    }
    const last = rows[rows.length - 1];
    const offs = rows.map(r => Math.hypot(r.px - r.cx, r.py - r.cy));
    return { frames: rows.length, maxCamSpeed: +maxV.toFixed(2), maxCamAccel: +maxA.toFixed(2), meanCamAccel: n ? +(sumA / n).toFixed(3) : 0,
      directionFlips: signFlips, maxPlayerOffset: +Math.max.apply(null, offs).toFixed(1), finalOffset: +Math.hypot(last.px - last.cx, last.py - last.cy).toFixed(1),
      zoomMin: Math.min.apply(null, rows.map(r => r.z)), zoomMax: Math.max.apply(null, rows.map(r => r.z)), rows: rows };
  };
  window.__ddScaleProbe = P;
}

(async () => {
  const sparticuz = (await import("file:///tmp/browser/node_modules/@sparticuz/chromium/build/index.js")).default;
  const launch = () => pw.launch({
    executablePath: "/tmp/chromium",
    args: [...sparticuz.args.filter(a => !a.startsWith("--headless") && !a.startsWith("--window-size")), "--no-sandbox"],
    headless: true
  });
  const report = { tag: TAG, url: URL, dpr: DPR, startedAt: new Date().toISOString(), pageErrors: [], httpErrors: [], consoleErrors: [], runs: [] };
  const flush = () => fs.writeFileSync(path.join(OUT, "probe_report.json"), JSON.stringify(report, null, 1));
  const save = (name, url) => { fs.writeFileSync(path.join(OUT, name + ".jpg"), Buffer.from(url.split(",")[1], "base64")); return name + ".jpg"; };

  for (const res of RES) {
    // Un navegador por resolución: con --single-process cerrar un contexto tumba el navegador.
    const browser = await launch();
    const ctx = await browser.newContext({ viewport: { width: res.w, height: res.h }, deviceScaleFactor: DPR });
    const page = await ctx.newPage();
    page.on("pageerror", e => report.pageErrors.push(res.w + "x" + res.h + ": " + String(e.message).slice(0, 300)));
    page.on("console", m => { if (m.type() === "error") report.consoleErrors.push(m.text().slice(0, 300)); });
    page.on("response", r => { if (r.status() >= 400) report.httpErrors.push(r.status() + " " + r.url()); });
    page.on("requestfailed", r => report.httpErrors.push("FAILED " + r.url()));
    const run = { res: res.w + "x" + res.h, shots: {}, tele: {}, trajectory: null, visited: [] };
    report.runs.push(run);
    const tag = (n) => TAG + "_" + res.w + "x" + res.h + "_" + n;

    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => window.DD_ASSETS && (() => { const s = window.DD_ASSETS.stats(); return s.loaded + s.errors >= s.registered; })(), null, { timeout: 120000 });
    await page.waitForTimeout(400);
    await page.evaluate(installProbe);
    // Intro → Refugio → incursión (misma entrada que las sondas de arte)
    await page.evaluate(() => { try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} });
    await page.waitForTimeout(300);
    await page.evaluate(() => { try { if (window.DD_HUB && !(window.DD_HUB.isActive && window.DD_HUB.isActive())) window.DD_HUB.enter(); } catch (e) {} });
    try { await page.waitForFunction(() => window.DD_HUB && window.DD_HUB.isActive && window.DD_HUB.isActive(), null, { timeout: 15000 }); } catch (e) { run.hubWait = String(e.message).slice(0, 100); }
    await page.waitForTimeout(300);
    try { run.shots.hub = save(tag("hub"), await page.evaluate(() => window.__ddScaleProbe.full())); } catch (e) { run.hubShotErr = String(e).slice(0, 120); }
    await page.evaluate(() => window.DD_HUB.exitToRun());
    await page.waitForTimeout(900);
    await page.evaluate(() => { try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} try { window.DD_OPENING && window.DD_OPENING.skip(); } catch (e) {} });
    await page.waitForFunction(() => window.DMO && window.DMO.observe && window.DMO.observe().hud && window.DMO.observe().hud.running, null, { timeout: 20000 });
    await page.evaluate(() => { try { window.DMO.debug.holdSpawns(true); } catch (e) {} try { window.DMO.debug.killAll(); } catch (e) {} });

    const gotoLevel = async (lv) => {
      await page.evaluate((l) => { try { window.DMO.debug.exploreGoTo(l); } catch (e) {} }, lv);
      await page.waitForTimeout(700);
      await page.evaluate(() => { try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} try { window.DMO.debug.holdSpawns(true); } catch (e) {} try { window.DMO.debug.killAll(); } catch (e) {} try { window.DMO.debug.heal(); } catch (e) {} });
      await page.waitForTimeout(400);
      await page.evaluate(() => { try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} window.__DD_BRIDGE.testStep({}, 30); });
    };
    const centerPlayer = async () => {
      await page.evaluate(() => {
        const s = window.__DD_BRIDGE.getSnapshot(); const rr = s.roomRect;
        try { window.DMO.debug.teleport(rr.x + rr.w / 2, rr.y + rr.h / 2); } catch (e) {}
        window.__DD_BRIDGE.testStep({ aim: 0 }, 120); // deja asentar la cámara
      });
    };
    const shotTele = async (name, extra) => {
      const r = await page.evaluate((x) => { window.__DD_BRIDGE.testStep(x || {}, 2); return { img: window.__ddScaleProbe.full(), tele: window.__ddScaleProbe.tele() }; }, extra || {});
      run.shots[name] = save(tag(name), r.img);
      run.tele[name] = r.tele;
      flush();
    };

    // 1) sala normal (y búsqueda de pasillo entre los primeros niveles)
    let corridorLv = null, bestAspect = 0;
    for (const lv of [1, 2, 3, 4, 5, 6]) {
      await gotoLevel(lv);
      const info = await page.evaluate(() => { const s = window.__DD_BRIDGE.getSnapshot(); const rr = s.roomRect; let geo = null; try { geo = window.DMO.explore77.roomReport().geometry; } catch (e) {} return { level: s.globalRoom, name: s.roomName, rect: rr, geo: geo }; });
      run.visited.push(info);
      const asp = info.rect ? info.rect.w / info.rect.h : 0;
      if (asp > bestAspect) { bestAspect = asp; corridorLv = info.level; }
    }
    await gotoLevel(LEVELS[0]);
    await centerPlayer();
    await shotTele("room_normal");
    // trayectoria de cámara (suavidad): correr a la derecha, luego arriba, luego parar
    run.trajectory = await page.evaluate(() => {
      const t = window.__ddScaleProbe.trajectory([{ input: { right: true, aim: 0 }, frames: 90 }, { input: { up: true, aim: -1.57 }, frames: 90 }, { input: { aim: -1.57 }, frames: 60 }]);
      const rows = t.rows; delete t.rows; t.sample = rows.filter((_, i) => i % 15 === 0);
      return t;
    });
    flush();
    // 2) multitud
    await centerPlayer();
    await page.evaluate(() => {
      const s = window.__DD_BRIDGE.getSnapshot(); const p = s.player;
      const plan = [["dancer", 0], ["dancer", 1], ["dancer", 2], ["dancer", 3], ["sprinter", 4], ["sprinter", 5], ["sprinter", 6], ["sprinter", 7], ["tank", 8], ["tank", 9], ["speaker", 10], ["speaker", 11], ["dancer", 12, true], ["sprinter", 13, true]];
      plan.forEach(([type, i, elite]) => {
        const a = i / 14 * Math.PI * 2, rad = 170 + (i % 3) * 70;
        try { window.DMO.debug.spawnEnemyAt(type, p.x + Math.cos(a) * rad, p.y + Math.sin(a) * rad * 0.7, !!elite, false); } catch (e) {}
      });
      window.__DD_BRIDGE.testStep({ aim: 0 }, 6);
    });
    await shotTele("room_crowd");
    await page.evaluate(() => { try { window.DMO.debug.killAll(); } catch (e) {} });
    // 3) transición: junto a una puerta abierta
    await page.evaluate(() => {
      try { window.__DD_BRIDGE.setDoorsUnlocked && window.__DD_BRIDGE.setDoorsUnlocked(true); } catch (e) {}
      window.__DD_BRIDGE.testStep({}, 20);
      const s = window.__DD_BRIDGE.getSnapshot(); const d = (s.doors || [])[0]; const rr = s.roomRect;
      if (d) { const off = d.side === "left" ? [90, 0] : d.side === "right" ? [-90, 0] : d.side === "top" ? [0, 90] : [0, -90]; try { window.DMO.debug.teleport(d.x + off[0], d.y + off[1]); } catch (e) {} }
      window.__DD_BRIDGE.testStep({ aim: d && d.side === "left" ? Math.PI : 0 }, 120);
    });
    await shotTele("transition");
    // 4) borde: esquina inferior derecha
    await page.evaluate(() => {
      const s = window.__DD_BRIDGE.getSnapshot(); const rr = s.roomRect;
      try { window.DMO.debug.teleport(rr.x + rr.w - 60, rr.y + rr.h - 60); } catch (e) {}
      window.__DD_BRIDGE.testStep({ aim: 0.6 }, 120);
    });
    await shotTele("edge");
    // 5) pasillo
    if (corridorLv) { await gotoLevel(corridorLv); await centerPlayer(); await shotTele("corridor"); }
    // 6) arena de jefe
    await gotoLevel(LEVELS[1]);
    await centerPlayer();
    await page.evaluate(() => { try { window.DMO.debug.boss(); } catch (e) {} try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} window.__DD_BRIDGE.testStep({ aim: 0 }, 150); try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} window.__DD_BRIDGE.testStep({ aim: 0 }, 30); });
    // el protagonista se aparta del centro (donde aparece el jefe) para que los dos se vean a la vez
    await page.evaluate(() => {
      const s = window.__DD_BRIDGE.getSnapshot(); const rr = s.roomRect;
      try { window.DMO.debug.teleport(rr.x + rr.w * 0.30, rr.y + rr.h * 0.66); } catch (e) {}
      window.__DD_BRIDGE.testStep({ aim: -0.4 }, 120);
    });
    await shotTele("boss_arena");
    // Coste por cuadro (ms) en esta máquina: sólo dibujo (renderNow) y simulación+dibujo (testStep),
    // con el jefe en escena. Software (swiftshader): sirve para comparar antes/después, no como fps reales.
    run.perfEnd = await page.evaluate(() => {
      const B = window.__DD_BRIDGE; const t = (fn, n) => { const t0 = performance.now(); for (let i = 0; i < n; i++) fn(); return +((performance.now() - t0) / n).toFixed(2); };
      const render = t(() => B.renderNow(), 30);
      const step = t(() => B.testStep({ aim: 0 }, 1), 30);
      return { renderMs: render, stepMs: step, fps: +window.DMO.perf.fps().toFixed(1), p95: +window.DMO.perf.p95().toFixed(2), mem: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null };
    });
    flush();
    await browser.close();
  }
  report.elapsedS = Math.round((Date.now() - T0) / 1000);
  flush();
  console.log("OK", OUT, report.elapsedS + "s", "pageErrors", report.pageErrors.length, "httpErrors", report.httpErrors.length);
})().catch(e => { console.error(e); process.exit(1); });
