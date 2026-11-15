#!/usr/bin/env node
/* ==========================================================================
   DEADBEAT DISCO — ART PRODUCTION MASTER · sonda de ESCENARIOS en el juego
   Uso:  node tools/art_master/probe_rooms.js <carpeta_salida>
              [--circles=1,2,…,9] [--rooms=2,5,10] [--box=280] [--dpr=2] [--unlock=0] [--hub=0]
              [--url=http://127.0.0.1:8080/index.html]

   Recorre el flujo real del jugador (NUEVA PARTIDA → descenso → Refugio) y
   después entra en una incursión y visita salas de cada círculo. En cada sala
   guarda el cuadro completo del lienzo del juego con las puertas cerradas y,
   tras vaciar la sala (DMO.debug.killAll), con las puertas abiertas; además
   recorta cada puerta (posición real que el puente entrega en getSnapshot().doors)
   y la franja del muro norte (roomRect). Del Refugio guarda la pantalla
   completa (DOM + lienzo), que es lo que ve el jugador.

   Sirve para auditar y validar TANDA 04 (muros, puertas, portales, plataforma
   de descenso, Refugio): lo que se ve es lo que dibuja DD_WORLD/DD_HUB con los
   assets registrados, no una maqueta.

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
const OUT = path.resolve(args.find(a => !a.startsWith("--")) || "/tmp/ddqa/rooms");
const opt = (k, d) => { const a = args.find(x => x.startsWith("--" + k + "=")); return a ? a.split("=")[1] : d; };
const DPR = Number(opt("dpr", "2"));
const URL = opt("url", "http://127.0.0.1:8080/index.html");
const CIRCLES = opt("circles", "1,2,3,4,5,6,7,8,9").split(",").filter(Boolean).map(Number);
const ROOMS = opt("rooms", "2,10").split(",").filter(Boolean).map(Number);
const BOX = Number(opt("box", "280"));
const UNLOCK = opt("unlock", "1") !== "0";
const DOM = opt("dom", "0") === "1";
const T0 = Date.now();
fs.mkdirSync(OUT, { recursive: true });

function installProbe() {
  const P = {};
  P.canvas = function () {
    return Array.from(document.querySelectorAll("canvas"))
      .filter(c => c.getBoundingClientRect().width > 0)
      .sort((a, b) => b.width * b.height - a.width * a.height)[0];
  };
  P.toScreen = function (wx, wy) {
    const cam = window.DMO.camera();
    const z = cam.applied || cam.zoom || 1;
    return { x: 640 + (wx - cam.x) * z, y: 360 + (wy - cam.y) * z, z: z };
  };
  P.crop = function (wx, wy, bw, bh) {
    const s = P.toScreen(wx, wy);
    const cv = P.canvas();
    const r = cv.getBoundingClientRect();
    const k = cv.width / r.width;
    const oc = document.createElement("canvas");
    oc.width = Math.round(bw * k); oc.height = Math.round(bh * k);
    const c2 = oc.getContext("2d");
    c2.fillStyle = "#000"; c2.fillRect(0, 0, oc.width, oc.height);
    c2.drawImage(cv, (s.x - bw / 2 - r.left) * k, (s.y - bh / 2 - r.top) * k, bw * k, bh * k, 0, 0, oc.width, oc.height);
    return oc.toDataURL("image/png");
  };
  P.full = function () {
    const cv = P.canvas();
    const oc = document.createElement("canvas");
    oc.width = 1280; oc.height = 720;
    const c2 = oc.getContext("2d");
    c2.imageSmoothingQuality = "high";
    c2.drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, 1280, 720);
    return oc.toDataURL("image/jpeg", 0.92);
  };
  /* Cuadro completo + recortes de puertas y del muro norte de la sala actual. */
  P.room = function (box) {
    const B = window.__DD_BRIDGE;
    const s = B.getSnapshot();
    const out = { circle: s.circle, level: s.globalRoom, room: s.room, roomName: s.roomName || s.roomBanner || null,
      roomRect: s.roomRect, doors: s.doors || [], player: s.player, full: P.full(), crops: [] };
    (s.doors || []).forEach((d, i) => {
      out.crops.push({ name: "door" + i + "_" + (d.kind || "room") + (d.open ? "_open" : "_closed"), png: P.crop(d.x, d.y - box * 0.18, box, box) });
    });
    if (s.roomRect) {
      const rr = s.roomRect;
      out.crops.push({ name: "wall_n", png: P.crop(rr.x + Math.min(rr.w, 640) / 2, rr.y - 20, Math.min(rr.w, 640), 240) });
    }
    return out;
  };
  window.__ddRoomProbe = P;
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
  const report = { url: URL, dpr: DPR, box: BOX, startedAt: new Date().toISOString(), pageErrors: [], httpErrors: [], consoleErrors: [], frames: [], crops: [], rooms: {} };
  page.on("pageerror", e => report.pageErrors.push(String(e.message).slice(0, 300)));
  page.on("console", m => { if (m.type() === "error") report.consoleErrors.push(m.text().slice(0, 300)); });
  page.on("response", r => { if (r.status() >= 400) report.httpErrors.push(r.status() + " " + r.url()); });
  page.on("requestfailed", r => report.httpErrors.push("FAILED " + r.url()));
  const flush = () => fs.writeFileSync(path.join(OUT, "probe_report.json"), JSON.stringify(report, null, 1));
  const saveUrl = (name, url, list) => {
    const ext = url.startsWith("data:image/png") ? ".png" : ".jpg";
    fs.writeFileSync(path.join(OUT, name + ext), Buffer.from(url.split(",")[1], "base64"));
    list.push(name + ext);
    flush();
  };
  /* Pantalla completa (DOM + lienzo). Durante el descenso y en el Refugio el
     bucle de dibujo puede retrasar la captura de página; si no llega en 8 s se
     guarda sólo el lienzo del juego y se anota. */
  const shotDom = async (name) => {
    const file = path.join(OUT, name + ".jpg");
    try {
      await page.screenshot({ path: file, type: "jpeg", quality: 90, timeout: 8000, animations: "disabled" });
      report.frames.push(path.basename(file));
    } catch (e) {
      report.domShotFailed = (report.domShotFailed || []).concat([name + ": " + String(e.message).split("\n")[0].slice(0, 120)]);
      try { saveUrl(name + "_lienzo", await page.evaluate(() => window.__ddRoomProbe.full()), report.frames); } catch (e2) {}
    }
    flush();
  };

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => window.DD_ASSETS && (() => { const s = window.DD_ASSETS.stats(); return s.loaded + s.errors >= s.registered; })(), { timeout: 60000 });
  await page.waitForTimeout(500);
  report.assets = await page.evaluate(() => window.DD_ASSETS.stats());
  await page.evaluate(installProbe);

  /* ---- Intro → Refugio (misma entrada que probe_bosses.js: DD_CINE.skip deja
     el Refugio activo). El Refugio se captura del lienzo del juego, que es lo que
     dibuja DD_HUB.render; los paneles DOM (diálogo, HUD) no son arte de escenario.
     Con --dom=1 se intenta además la captura de página completa (lenta con dpr 2). ---- */
  await page.evaluate(() => { try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} });
  await page.waitForTimeout(1500);
  /* --hub=0: no pasar por el Refugio (el Chromium de pruebas, en un solo proceso,
     se ha cerrado más de una vez al dibujarlo). Tras saltar la intro el motor ya
     está en una sala de incursión y exploreGoTo funciona igual. */
  const HUB = opt("hub", "1") !== "0";
  if (!HUB) report.hubEntered = "omitido (--hub=0)";
  /* Tras saltar la intro el motor puede quedar en una sala de incursión sin pasar
     por el Refugio; se entra por la misma puerta que usa NUEVA PARTIDA (DD_HUB.enter). */
  if (HUB) report.hubEntered = await page.evaluate(() => {
    try {
      if (window.DD_HUB && !(window.DD_HUB.isActive && window.DD_HUB.isActive())) { window.DD_HUB.enter(); return "DD_HUB.enter()"; }
      return "ya activo";
    } catch (e) { return "error: " + e; }
  });
  const hubShot = async (name) => {
    saveUrl(name, await page.evaluate(() => window.__ddRoomProbe.full()), report.frames);
    if (DOM) await shotDom(name + "_pantalla");
  };
  if (HUB) {
    await page.waitForTimeout(600);
    try {
      await page.waitForFunction(() => window.DD_HUB && window.DD_HUB.isActive && window.DD_HUB.isActive(), { timeout: 15000 });
    } catch (e) { report.hubWaitError = String(e.message).slice(0, 200); }
    report.hub = await page.evaluate(() => { try { return window.DD_HUB.getState(); } catch (e) { return String(e); } });
    await hubShot("01_refugio_llegada");
  }
  /* Paseo por el Refugio con --hubwalk=1 (en el Chromium de pruebas el navegador
     se ha cerrado alguna vez a los pocos segundos de estar en el Refugio; por
     defecto se guarda sólo la llegada y se sale a la incursión). */
  if (HUB && opt("hubwalk", "0") === "1") {
    await page.waitForTimeout(5600);
    await hubShot("02_refugio");
    await page.keyboard.down("KeyD"); await page.waitForTimeout(900); await page.keyboard.up("KeyD");
    await page.waitForTimeout(150);
    await hubShot("03_refugio_derecha");
    await page.keyboard.down("KeyA"); await page.waitForTimeout(1900); await page.keyboard.up("KeyA");
    await page.waitForTimeout(150);
    await hubShot("04_refugio_izquierda");
    await page.keyboard.down("KeyW"); await page.waitForTimeout(900); await page.keyboard.up("KeyW");
    await page.waitForTimeout(150);
    await hubShot("05_refugio_arriba");
  }

  /* ---- Incursión ---- */
  if (HUB) {
    await page.evaluate(() => window.DD_HUB.exitToRun());
    await page.waitForTimeout(500);
  }
  await page.evaluate(() => { try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} try { window.DD_OPENING && window.DD_OPENING.skip(); } catch (e) {} });
  await page.waitForTimeout(900);
  await page.evaluate(() => { try { window.DMO.debug.holdSpawns(true); } catch (e) {} try { window.DMO.debug.killAll(); } catch (e) {} });

  for (const c of CIRCLES) {
    for (const rm of ROOMS) {
      const level = (c - 1) * 11 + rm;
      const tag = "c" + String(c).padStart(2, "0") + "_r" + String(rm).padStart(2, "0");
      const went = await page.evaluate((lv) => { try { return window.DMO.debug.exploreGoTo(lv); } catch (e) { return String(e); } }, level);
      await page.waitForTimeout(400);
      await page.evaluate(() => { try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} });
      await page.waitForTimeout(300);
      const a = await page.evaluate((b) => { try { window.DMO.debug.heal(); } catch (e) {} window.__DD_BRIDGE.testStep({}, 24); return window.__ddRoomProbe.room(b); }, BOX);
      saveUrl(tag + "_a_cerrada", a.full, report.frames);
      a.crops.forEach(cr => saveUrl(tag + "_a_" + cr.name, cr.png, report.crops));
      /* Sala vaciada. Con --unlock=1 (por defecto) se abre además el modo «SALAS
         ABIERTAS» del motor para fotografiar las hojas abiertas, el retablo del
         Residente y el portal del descenso sin despejar el círculo entero. */
      const b = await page.evaluate((o) => { try { window.DMO.debug.killAll(); } catch (e) {}
        try { if (o.unlock && window.__DD_BRIDGE.setDoorsUnlocked) window.__DD_BRIDGE.setDoorsUnlocked(true); } catch (e) {}
        window.__DD_BRIDGE.testStep({}, 50); return window.__ddRoomProbe.room(o.box); }, { box: BOX, unlock: UNLOCK });
      saveUrl(tag + "_b_abierta", b.full, report.frames);
      b.crops.forEach(cr => saveUrl(tag + "_b_" + cr.name, cr.png, report.crops));
      /* Hacia el muro norte: el protagonista sube hasta que la sala lo frena y la
         franja de muro (y su puerta, si la hay) entra en cámara. */
      const n = await page.evaluate((b) => {
        try { window.DMO.debug.heal(); } catch (e) {}
        const B = window.__DD_BRIDGE;
        const s0 = B.getSnapshot(); const rr = s0.roomRect; const p0 = s0.player || { x: 0, y: 0 };
        /* Con las puertas abiertas, subir en línea recta puede meter al protagonista
           por la puerta norte y cambiar de sala: se busca antes una x del muro norte
           alejada de sus puertas. */
        let tx = p0.x;
        let cands = [tx];
        if (rr) {
          const tops = (s0.doors || []).filter(d => d.side === "top").map(d => d.x);
          cands = [rr.x + rr.w * 0.2, rr.x + rr.w * 0.5, rr.x + rr.w * 0.8, rr.x + rr.w * 0.35, rr.x + rr.w * 0.65];
          if (tops.length) {
            const dist = (x) => Math.min.apply(null, tops.map(t => Math.abs(t - x)));
            cands.sort((a, c) => dist(c) - dist(a));
          }
          tx = cands[0];
        }
        /* Primero por teletransporte (DMO.debug.teleport recorta a la zona pisable y
           lleva la cámara): en salas en L o en cruz la franja de muro sólo existe en el
           borde superior del rectángulo, así que se prueban varias x y se acepta la
           primera que quede de verdad arriba. Si no hay teletransporte, andando. */
        let tele = false;
        try {
          if (rr && window.DMO.debug.teleport) {
            let best = null;
            for (const cx of cands) {
              if (!window.DMO.debug.teleport(cx, rr.y + 70)) break;
              const q = B.getSnapshot().player;
              if (!best || q.y < best.y) best = { x: q.x, y: q.y, cx };
              if (q.y < rr.y + 140) break;
            }
            if (best) { window.DMO.debug.teleport(best.cx, rr.y + 70); tx = best.cx; tele = true; }
          }
        } catch (e) {}
        if (!tele) {
          for (let i = 0; i < 12; i++) {
            const q = B.getSnapshot().player; const dx = tx - q.x;
            if (Math.abs(dx) < 12) break;
            B.testStep(dx > 0 ? { right: true } : { left: true }, Math.min(40, Math.ceil(Math.abs(dx) / 3)));
          }
        }
        let lastY = Infinity;
        for (let i = 0; i < (tele ? 3 : 8); i++) {
          const q = B.getSnapshot().player;
          if (lastY - q.y < 2) break;
          lastY = q.y; B.testStep({ up: true }, 30);
        }
        B.testStep({}, 6);
        return window.__ddRoomProbe.room(b);
      }, BOX);
      saveUrl(tag + "_c_norte", n.full, report.frames);
      n.crops.filter(cr => cr.name === "wall_n" || /door/.test(cr.name)).forEach(cr => saveUrl(tag + "_c_" + cr.name, cr.png, report.crops));
      report.rooms[tag] = { level, went, circle: b.circle, globalRoom: b.level, room: b.room, roomName: b.roomName, roomRect: b.roomRect,
        doorsClosed: a.doors, doorsOpen: b.doors, playerNorth: n.player, t: +((Date.now() - T0) / 1000).toFixed(1) };
      console.log(tag, JSON.stringify({ level, circle: b.circle, room: b.roomName, doors: b.doors.map(d => d.kind + (d.open ? "+" : "-") + (d.side || "")[0]) }));
      flush();
    }
  }
  report.finishedAt = new Date().toISOString();
  report.seconds = +((Date.now() - T0) / 1000).toFixed(1);
  flush();
  console.log("frames", report.frames.length, "crops", report.crops.length, "pageErrors", report.pageErrors.length, "httpErrors", report.httpErrors.length, "s", report.seconds);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
