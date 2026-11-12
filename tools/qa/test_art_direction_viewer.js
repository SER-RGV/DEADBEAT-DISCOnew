/* QA del visor de la prueba de dirección artística.
   Uso:  DD_CHROMIUM=/ruta/a/chromium node tools/qa/test_art_direction_viewer.js [http://localhost:8080] [carpeta_capturas]
   Requiere playwright-core y un servidor estático en la raíz del repositorio. */
const { chromium } = require("playwright-core");
const BASE = process.argv[2] || "http://localhost:8080";
const OUT = process.argv[3] || null;
const PAGE = BASE + "/assets/cinematics/preview/art_direction_test.html";
const RES = [[1280, 720], [1366, 768], [1920, 1080], [2560, 1440], [3440, 1440]];
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok, detail }); console.log((ok ? "PASS " : "FAIL ") + name + (detail ? "  · " + detail : "")); };

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM || undefined, headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    env: { ...process.env }
  });
  const errors = [];
  const watch = (pg) => {
    pg.on("pageerror", (e) => errors.push("pageerror: " + e.message));
    pg.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
    pg.on("requestfailed", (r) => errors.push("requestfailed: " + r.url()));
    pg.on("response", (r) => { if (r.status() >= 400) errors.push(r.status() + " " + r.url()); });
  };
  const st = (pg) => pg.evaluate(() => {
    const r = document.getElementById("imagen").getBoundingClientRect(), v = document.getElementById("visor").getBoundingClientRect();
    return { ...window.DD_VISOR.estado(), r: { x: r.x, y: r.y, w: r.width, h: r.height }, v: { x: v.x, y: v.y, w: v.width, h: v.height },
      estado: document.getElementById("i-estado").textContent, res: document.getElementById("i-res").textContent,
      archivo: document.getElementById("i-archivo").textContent, ruta: document.getElementById("i-ruta").textContent,
      escala: document.getElementById("i-escala").textContent, juego: !!(window.DD_BOOT || window.__DD_BRIDGE) };
  });
  const loaded = (pg) => pg.waitForFunction(() => window.DD_VISOR && window.DD_VISOR.estado().cargada, null, { timeout: 20000 });

  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const pg = await ctx.newPage(); watch(pg);
  const resp = await pg.goto(PAGE); await loaded(pg);
  let s = await st(pg);
  check("1 la página carga", resp.status() === 200 && s.estado === "cargada", "HTTP " + resp.status() + ", estado «" + s.estado + "»");
  check("2 imagen completa dentro del lienzo", s.r.x >= s.v.x - 0.5 && s.r.y >= s.v.y - 0.5 && s.r.x + s.r.w <= s.v.x + s.v.w + 0.5 && s.r.y + s.r.h <= s.v.y + s.v.h + 0.5,
    Math.round(s.r.w) + "×" + Math.round(s.r.h) + " en lienzo " + s.v.w + "×" + s.v.h);
  check("datos del recurso", s.res === "1920 × 1080 px" && s.archivo === "art_direction_test.png" && s.ruta === "assets/cinematics/restart/art_direction_test.png", s.archivo + " · " + s.res + " · " + s.ruta);
  check("5 proporción conservada (ajustada)", Math.abs(s.r.w / s.r.h - s.w / s.h) < 0.002, (s.r.w / s.r.h).toFixed(4) + " frente a " + (s.w / s.h).toFixed(4));
  if (OUT) await pg.screenshot({ path: OUT + "/visor_1920x1080_ajustada.jpg", type: "jpeg", quality: 80 });

  const fit = s.s;
  await pg.click("#mas"); let a = await st(pg);
  check("6 zoom: botón +", Math.abs(a.s - fit * 1.25) < 1e-6 && !a.ajustada, a.escala);
  await pg.click("#menos"); a = await st(pg);
  check("6 zoom: botón −", Math.abs(a.s - fit) < 1e-6, a.escala);
  await pg.click("#real"); a = await st(pg);
  check("6 zoom: 100 %", a.s === 1 && Math.abs(a.r.w - 1920) < 0.5, a.escala);
  await pg.mouse.move(960, 500); await pg.mouse.wheel(0, -600); a = await st(pg);
  check("6 zoom: rueda del ratón", a.s > 1.5, a.escala);
  check("5 proporción conservada (ampliada)", Math.abs(a.r.w / a.r.h - 16 / 9) < 0.002, (a.r.w / a.r.h).toFixed(4));
  const before = a;
  await pg.mouse.move(960, 500); await pg.mouse.down(); await pg.mouse.move(760, 380, { steps: 5 }); await pg.mouse.up(); a = await st(pg);
  check("8 desplazamiento arrastrando", Math.abs(a.x - before.x + 200) < 1 && Math.abs(a.y - before.y + 120) < 1, "Δ " + Math.round(a.x - before.x) + ", " + Math.round(a.y - before.y));
  await pg.keyboard.press("ArrowRight"); const k = await st(pg);
  check("8 desplazamiento con flechas", Math.abs(k.x - a.x + 80) < 1, "Δx " + Math.round(k.x - a.x));
  await pg.mouse.move(960, 500); await pg.mouse.down(); await pg.mouse.move(-4000, -4000, { steps: 3 }); await pg.mouse.up(); a = await st(pg);
  check("8 el desplazamiento no saca la imagen del lienzo", Math.abs(a.r.x + a.r.w - (a.v.x + a.v.w)) < 1 && Math.abs(a.r.y + a.r.h - (a.v.y + a.v.h)) < 1, "borde inferior derecho anclado");
  if (OUT) await pg.screenshot({ path: OUT + "/visor_1920x1080_ampliada.jpg", type: "jpeg", quality: 80 });
  await pg.click("#ajustar"); a = await st(pg);
  check("7 ajustar a pantalla", a.ajustada && Math.abs(a.s - fit) < 1e-6, a.escala);

  await pg.click("#logo"); await pg.waitForFunction(() => document.getElementById("i-estado").textContent === "cargada" && document.getElementById("i-archivo").textContent === "art_direction_test_plate.png");
  a = await st(pg);
  check("alternar sin logotipo", !a.conLogo && a.w === 1920 && a.h === 1080, a.archivo);
  await pg.click("#logo"); await pg.waitForFunction(() => document.getElementById("i-archivo").textContent === "art_direction_test.png" && document.getElementById("i-estado").textContent === "cargada");
  await pg.click("#fondo");
  check("alternar solo fondo oscuro", await pg.evaluate(() => getComputedStyle(document.getElementById("imagen")).visibility === "hidden"));
  await pg.click("#fondo");
  check("volver a mostrar la imagen", await pg.evaluate(() => getComputedStyle(document.getElementById("imagen")).visibility === "visible"));
  const href = await pg.getAttribute("#abrir", "href");
  const orig = await ctx.request.get(new URL(href, PAGE).href);
  check("abrir original", orig.status() === 200 && /image\/png/.test(orig.headers()["content-type"] || ""), href + " → HTTP " + orig.status());
  check("10 el visor no carga el juego", !a.juego, "sin DD_BOOT ni __DD_BRIDGE");

  for (const [w, h] of RES) {
    await pg.setViewportSize({ width: w, height: h }); await pg.waitForTimeout(150);
    const r = await st(pg);
    const inside = r.r.x >= r.v.x - 0.5 && r.r.y >= r.v.y - 0.5 && r.r.x + r.r.w <= r.v.x + r.v.w + 0.5 && r.r.y + r.r.h <= r.v.y + r.v.h + 0.5;
    const noScroll = await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight);
    check("9 sin recorte a " + w + "×" + h, inside && noScroll && Math.abs(r.r.w / r.r.h - 16 / 9) < 0.002, Math.round(r.r.w) + "×" + Math.round(r.r.h) + " · " + r.escala);
    if (OUT && w === 1366) await pg.screenshot({ path: OUT + "/visor_1366x768_ajustada.jpg", type: "jpeg", quality: 80 });
  }
  check("3 sin errores de rutas · 4 sin errores JavaScript", errors.length === 0, errors.join(" | ") || "0 errores, 0 peticiones fallidas");

  /* Recurso ausente: debe verse un mensaje claro. */
  const pg2 = await ctx.newPage();
  await pg2.route("**/art_direction_test.png", (r) => r.fulfill({ status: 404, body: "" }));
  await pg2.goto(PAGE); await pg2.waitForFunction(() => /error/.test(document.getElementById("i-estado").textContent));
  const msg = await pg2.evaluate(() => ({ visible: !document.getElementById("aviso").hidden, text: document.getElementById("aviso").textContent }));
  check("mensaje claro si el recurso no carga", msg.visible && /NO SE PUDO CARGAR/.test(msg.text) && /art_direction_test\.png/.test(msg.text), msg.text.slice(0, 70) + "…");
  if (OUT) await pg2.screenshot({ path: OUT + "/visor_recurso_ausente.jpg", type: "jpeg", quality: 80 });
  await pg2.close();

  /* El juego original sigue arrancando. */
  const pg3 = await ctx.newPage(); const gErr = [];
  pg3.on("pageerror", (e) => gErr.push(e.message)); pg3.on("response", (r) => { if (r.status() >= 400) gErr.push(r.status() + " " + r.url()); });
  await pg3.setViewportSize({ width: 1280, height: 720 });
  await pg3.goto(BASE + "/index.html", { waitUntil: "domcontentloaded" });
  await pg3.waitForFunction(() => window.DD_BOOT && DD_BOOT.getState().state === "INTRO", null, { timeout: 60000 });
  await pg3.waitForTimeout(600); await pg3.keyboard.press("Space");
  await pg3.waitForFunction(() => DD_BOOT.getState().state === "PLAYING" && DD_HUB.isActive(), null, { timeout: 20000 });
  check("el juego original arranca: carga → intro → Refugio", gErr.length === 0, gErr.join(" | ") || "0 errores");

  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log("\n" + (results.length - failed) + "/" + results.length + " superadas");
  if (OUT) require("fs").writeFileSync(OUT + "/qa_visor.json", JSON.stringify({ url: PAGE, results }, null, 1));
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("ERROR", e.message); process.exit(2); });
