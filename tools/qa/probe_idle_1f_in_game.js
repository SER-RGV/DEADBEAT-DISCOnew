/* Sonda del IDLE de fotograma único DENTRO de una partida real (index.html).
   Uso:  DD_CHROMIUM=/ruta/a/chromium node tools/qa/probe_idle_1f_in_game.js [http://localhost:8080] [carpeta_salida]

   QUÉ ES Y QUÉ NO ES
   - El recurso nuevo NO está registrado ni sustituye al activo. Esta sonda no toca ningún archivo del juego:
     solo en el navegador de prueba, responde a la petición de assets/characters/player_idle_00.png con los
     bytes de assets/characters/protagonist_master/pm_idle_00.png. Todo lo demás (motor, registro, manifiesto,
     cámara, Refugio, sala) es el juego tal cual.
   - Las anclas que usa el motor en esta prueba son las del sprite antiguo (las del manifiesto activo), no las
     del manifiesto del fotograma nuevo.
   - Hace una pasada de control sin sustitución para comparar.
   - Solo cubre el Refugio en reposo. No entra en una incursión. */
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright-core");
const BASE = process.argv[2] || "http://localhost:8080";
const OUT = process.argv[3] || null;
const NUEVO = path.resolve(__dirname, "../../assets/characters/protagonist_master/pm_idle_00.png");
const BOX = 200;

function recorte(box, dy) {   /* se ejecuta en la página, con el Refugio activo */
  const cv = Array.from(document.querySelectorAll("canvas")).filter((c) => c.getBoundingClientRect().width > 0).sort((a, b) => b.width * b.height - a.width * a.height)[0];
  const r = cv.getBoundingClientRect(), k = cv.width / r.width, s = window.DD_HUB.getState(), B = s.bounds, vw = r.width, vh = r.height;
  /* Misma cámara que dd_hub_system.js (zoom y encuadre del Refugio). */
  const zoom = Math.min(1.6, Math.max(1.02, Math.min(vw / 1150, vh / 780)));
  let cx = s.x * 0.55 + (B.x + B.w * 0.5) * 0.45, cy = s.y * 0.48 + (B.y + B.h * 0.42) * 0.52;
  const hw = vw * 0.5 / zoom, hh = vh * 0.5 / zoom, x0 = B.x - 56, x1 = B.x + B.w + 56, y0 = B.y - 150, y1 = B.y + B.h + 56;
  cx = (hw * 2 >= x1 - x0) ? (x0 + x1) * 0.5 : Math.max(x0 + hw, Math.min(x1 - hw, cx));
  cy = (hh * 2 >= y1 - y0) ? (y0 + y1) * 0.5 : Math.max(y0 + hh, Math.min(y1 - hh, cy));
  const x = vw / 2 + (s.x - cx) * zoom, y = vh / 2 + (s.y - cy) * zoom;
  const oc = document.createElement("canvas"); oc.width = oc.height = Math.round(box * k);
  oc.getContext("2d").drawImage(cv, (x - box / 2) * k, (y + dy - box / 2) * k, box * k, box * k, 0, 0, oc.width, oc.height);
  let anim = null; try { const pa = window.DMO.playerAnim; anim = { upper: pa.upperPose, lower: pa.lowerPose, bobY: pa.bobY }; } catch (e) { anim = String(e); }
  return { png: oc.toDataURL("image/png"), en: [Math.round(x), Math.round(y)], zoom, k, anim };
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.DD_CHROMIUM || undefined, headless: true, args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] });
  const informe = { url: BASE + "/index.html", metodo: "interceptación de la petición de player_idle_00.png en el navegador de prueba; ningún archivo del juego modificado", pasadas: [] };
  for (const sustituir of [false, true]) {
    const nombre = sustituir ? "nuevo" : "control";
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
    const pg = await ctx.newPage();
    const p = { pasada: nombre, sustituido: 0, erroresPagina: [], http: [], capturas: [] };
    pg.on("pageerror", (e) => p.erroresPagina.push(String(e.message).slice(0, 200)));
    pg.on("response", (r) => { if (r.status() >= 400) p.http.push(r.status() + " " + r.url()); });
    if (sustituir) await pg.route("**/assets/characters/player_idle_00.png*", (route) => { p.sustituido++; route.fulfill({ status: 200, contentType: "image/png", body: fs.readFileSync(NUEVO) }); });
    await pg.goto(informe.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await pg.waitForFunction(() => window.DD_ASSETS && (() => { const s = window.DD_ASSETS.stats(); return s.loaded + s.errors >= s.registered; })(), null, { timeout: 90000 });
    await pg.waitForTimeout(600);
    p.recursos = await pg.evaluate(() => window.DD_ASSETS.stats());
    p.imagenIdle = await pg.evaluate(() => { const i = window.DD_ASSETS.get("player_idle_00"); return i ? [i.naturalWidth || i.width, i.naturalHeight || i.height] : null; });
    p.anclasEnUso = await pg.evaluate(() => { try { return window.DD_ASSETS.manifest.entries.player_idle_00.anchors; } catch (e) { return String(e); } });
    await pg.evaluate(() => window.DD_CINE && window.DD_CINE.skip());
    await pg.waitForFunction(() => window.DD_HUB && window.DD_HUB.isActive(), null, { timeout: 90000 });
    await pg.waitForTimeout(2500);
    p.refugioActivo = true;
    const tomar = () => pg.evaluate("(" + recorte.toString() + ")(" + BOX + ", -45)");
    const guardar = (n, g) => { if (OUT) fs.writeFileSync(path.join(OUT, "partida_" + nombre + "_" + n + ".png"), Buffer.from(g.png.split(",")[1], "base64")); p.capturas.push({ n, en: g.en, zoom: g.zoom, anim: g.anim }); };
    /* REFUGIO en reposo: 12 capturas a lo largo de ~2,4 s (un ciclo de respiración). */
    for (let i = 0; i < 12; i++) { guardar("refugio_" + String(i).padStart(2, "0"), await tomar()); await pg.waitForTimeout(190); }
    /* Mirando a la izquierda: un toque de A y volver a reposo. */
    await pg.keyboard.down("KeyA"); await pg.waitForTimeout(220); await pg.keyboard.up("KeyA"); await pg.waitForTimeout(800);
    guardar("refugio_izquierda", await tomar());
    p.incursion = "no ejecutada";
    informe.pasadas.push(p);
    console.log(nombre, "· sustituciones:", p.sustituido, "· imagen idle:", JSON.stringify(p.imagenIdle), "· refugio:", p.refugioActivo, "· capturas:", p.capturas.length, "· errores:", p.erroresPagina.length, "· http>=400:", p.http.length);
    console.log("  ", JSON.stringify(p.capturas.filter((c, i) => i % 4 === 0).map((c) => [c.n, c.en, c.zoom, c.anim])));
    await ctx.close();
  }
  await browser.close();
  if (OUT) fs.writeFileSync(path.join(OUT, "partida_sonda.json"), JSON.stringify(informe, null, 1));
})().catch((e) => { console.error("ERROR", e); process.exit(1); });
