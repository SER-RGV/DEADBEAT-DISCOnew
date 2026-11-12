/* QA del visor de la muestra IDLE del protagonista.
   Uso:  DD_CHROMIUM=/ruta/a/chromium node tools/qa/test_protagonist_anim_viewer.js [http://localhost:8080] [carpeta_capturas]
   Requiere playwright-core y un servidor estático en la raíz del repositorio.
   Las comprobaciones marcadas ANIM miden la reproducción en tiempo real; las ESTÁTICA miden archivos o un fotograma parado. */
const { chromium } = require("playwright-core");
const BASE = process.argv[2] || "http://localhost:8080";
const OUT = process.argv[3] || null;
const PAGE = BASE + "/assets/cinematics/preview/protagonist_anim_test.html";
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok, detail }); console.log((ok ? "PASS " : "FAIL ") + name + (detail ? "  · " + detail : "")); };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.DD_CHROMIUM || undefined, headless: true, args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"], env: { ...process.env } });
  const errors = [];
  const watch = (pg) => {
    pg.on("pageerror", (e) => errors.push("pageerror: " + e.message));
    pg.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
    pg.on("requestfailed", (r) => errors.push("requestfailed: " + r.url()));
    pg.on("response", (r) => { if (r.status() >= 400) errors.push(r.status() + " " + r.url()); });
  };
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const pg = await ctx.newPage(); watch(pg);
  const st = () => pg.evaluate(() => window.DD_ANIM_VISOR.estado());
  const shot = async (n) => { if (OUT) await pg.screenshot({ path: OUT + "/" + n, type: "jpeg", quality: 85 }); };
  /* Píxeles del lienzo: cuántos son opacos y dónde cae su centro (fracción del ancho). */
  const lienzo = () => pg.evaluate(() => {
    const c = document.getElementById("lienzo"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let n = 0, sx = 0, y0 = c.height, y1 = -1;
    for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) if (d[(y * c.width + x) * 4 + 3] > 200) { n++; sx += x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return { n, cx: n ? sx / n / c.width : 0, alto: y1 - y0, esquina: d[3], w: c.width, h: c.height };
  });

  const resp = await pg.goto(PAGE);
  await pg.waitForFunction(() => window.DD_ANIM_VISOR && window.DD_ANIM_VISOR.estado().lista, null, { timeout: 20000 });
  let s = await st();
  check("ESTÁTICA la página carga y la muestra queda lista", resp.status() === 200 && s.lista && s.total === 4, "HTTP " + resp.status() + ", " + s.total + " fotogramas");
  check("ESTÁTICA los cuatro fotogramas miden 288 × 512", s.tamanos.every((t) => t[0] === 288 && t[1] === 512), JSON.stringify(s.tamanos));
  check("ESTÁTICA tiempos del manifiesto: 4 × 560 ms = 2,24 s", s.ms.length === 4 && s.ms.every((m) => m === 560), s.ms.join(", "));
  const real = await pg.evaluate(() => ({ src: [...document.scripts].map((x) => x.src).filter(Boolean), fn: typeof window.DD_WORLD.drawProtagonist, frozen: Object.isFrozen(window.DD_WORLD), juego: !!(window.DD_BOOT || window.__DD_BRIDGE) }));
  check("ESTÁTICA usa el renderizador real del juego (src/dd_world_renderer.js), sin arrancar el juego", real.src.length === 1 && /\/src\/dd_world_renderer\.js$/.test(real.src[0]) && real.fn === "function" && !real.juego, real.src.join(", "));
  check("ESTÁTICA transparencia: las cuatro esquinas de cada PNG son transparentes", s.cajas.every((c) => c.esquinasTransparentes));
  check("ESTÁTICA la figura no toca los bordes del lienzo", s.cajas.every((c) => c.x0 > 0 && c.y0 > 0 && c.x1 < 287 && c.y1 < 511), s.cajas.map((c) => [c.x0, c.y0, c.x1, c.y1].join("-")).join(" | "));
  check("ESTÁTICA pies: misma línea de suelas en los cuatro (y=504 ± 1)", s.cajas.every((c) => Math.abs(c.y1 - 504) <= 1), s.cajas.map((c) => c.y1).join(", "));
  check("ESTÁTICA misma altura de figura en los cuatro (± 1 px)", Math.max(...s.cajas.map((c) => c.alto)) - Math.min(...s.cajas.map((c) => c.alto)) <= 1, s.cajas.map((c) => c.alto).join(", "));

  /* ---- ANIM: reproducción en tiempo real ---- */
  const muestras = await pg.evaluate(() => new Promise((ok) => {
    const log = []; let prev = -1; const t0 = performance.now();
    (function tick() { const e = window.DD_ANIM_VISOR.estado(), t = performance.now() - t0; if (e.cuadro !== prev) { log.push([e.cuadro, Math.round(t)]); prev = e.cuadro; } if (t < 3700) requestAnimationFrame(tick); else ok(log); })();
  }));
  const orden = muestras.map((m) => m[0]);
  const enOrden = orden.every((c, i) => i === 0 || c === (orden[i - 1] + 1) % 4);
  const dur = muestras.slice(1).map((m, i) => m[1] - muestras[i][1]).slice(1);   /* se descarta el primer tramo, que empieza a medias */
  check("ANIM los fotogramas avanzan en orden y en bucle", enOrden && orden.length >= 6, orden.join(" → "));
  check("ANIM cada fotograma dura 560 ms (± 40 ms)", dur.length >= 4 && dur.every((d) => Math.abs(d - 560) <= 40), dur.join(", ") + " ms");
  const ciclo = dur.slice(0, 4).reduce((a, b) => a + b, 0);
  check("ANIM ciclo completo de 2,24 s (± 60 ms)", Math.abs(ciclo - 2240) <= 60, ciclo + " ms");
  s = await st();
  check("ANIM el renderizador pinta cada cuadro sin fallos", s.ultimoOk && s.errores.length === 0 && s.pintados > 100, s.pintados + " cuadros pintados");
  check("ANIM rendimiento: tiempo medio de dibujo por cuadro < 4 ms", s.dibujoMs < 4, s.dibujoMs.toFixed(2) + " ms (Chromium sin GPU)");

  await pg.click("#play"); let a = await st(); await pg.waitForTimeout(900); let b = await st();
  check("ANIM pausa: el fotograma no cambia", !a.activo && a.cuadro === b.cuadro, "fotograma " + (b.cuadro + 1) + " durante 900 ms");
  await pg.click("#sig"); let c = await st(); check("fotograma siguiente", c.cuadro === (b.cuadro + 1) % 4 && !c.activo, (b.cuadro + 1) + " → " + (c.cuadro + 1));
  await pg.click("#ant"); await pg.click("#ant"); c = await st(); check("fotograma anterior (con vuelta)", c.cuadro === (b.cuadro + 3) % 4, "→ " + (c.cuadro + 1));
  await pg.keyboard.press("ArrowRight"); let d = await st(); check("teclado: flechas", d.cuadro === (c.cuadro + 1) % 4, "→ " + (d.cuadro + 1));
  await pg.keyboard.press("Space"); await pg.waitForTimeout(700); d = await st(); check("ANIM reanudar con Espacio", d.activo, "fotograma " + (d.cuadro + 1));
  await pg.click('[data-vel="2"]');
  const rapido = await pg.evaluate(() => new Promise((ok) => { const log = []; let prev = -1; const t0 = performance.now(); (function tick() { const e = window.DD_ANIM_VISOR.estado(), t = performance.now() - t0; if (e.cuadro !== prev) { log.push(t); prev = e.cuadro; } if (t < 1700) requestAnimationFrame(tick); else ok(log); })(); }));
  const dr = rapido.slice(1).map((t, i) => Math.round(t - rapido[i])).slice(1);
  check("ANIM velocidad 2×: 280 ms por fotograma (± 30 ms)", dr.length >= 3 && dr.every((x) => Math.abs(x - 280) <= 30), dr.join(", ") + " ms");
  await pg.click('[data-vel="0.25"]'); check("velocidad ¼× seleccionable", (await st()).vel === 0.25); await pg.click('[data-vel="1"]');

  /* ---- ESTÁTICA: tamaño, fondo y comprobaciones con la animación parada ---- */
  await pg.click("#play"); for (let i = 0; i < 4 && (await st()).cuadro !== 0; i++) await pg.click("#sig");
  s = await st(); const fit = s.z; let px = await lienzo();
  check("ajustar a pantalla: la figura cabe entera", s.ajustada && px.alto > 0.6 * px.h && px.alto < px.h, Math.round(s.z * 100) + " % · figura " + px.alto + " de " + px.h + " px");
  check("ESTÁTICA fondo transparente: el lienzo no pinta fondo", px.esquina === 0 && (await pg.evaluate(() => document.getElementById("visor").className)) === "f-trans");
  await shot("idle_ajustada_f1.jpg");
  await pg.click("#mas"); a = await st(); check("ampliar", Math.abs(a.z - fit * 1.25) < 1e-6 && !a.ajustada, Math.round(a.z * 100) + " %");
  await pg.click("#menos"); await pg.click("#menos"); a = await st(); check("reducir", Math.abs(a.z - fit / 1.25) < 1e-6, Math.round(a.z * 100) + " %");
  await pg.click("#juego"); await pg.waitForTimeout(80); a = await st(); px = await lienzo();
  check("tamaño de juego: zoom 1,16 y figura de ≈109 px", Math.abs(a.z - 1.16) < 1e-6 && Math.abs(px.alto - 109) <= 6, px.alto + " px de alto");
  await pg.click('[data-fondo="oscuro"]'); await shot("idle_tamano_de_juego.jpg");
  await pg.click("#ajustar"); a = await st(); check("volver a ajustar", a.ajustada && Math.abs(a.z - fit) < 1e-6);
  for (const f of ["claro", "magenta", "oscuro", "trans"]) { await pg.click('[data-fondo="' + f + '"]'); if (f === "claro") await shot("idle_fondo_claro.jpg"); }
  check("fondos de contraste seleccionables", (await st()).fondo === "trans");
  const derecha = await lienzo(); await pg.click("#reflejo"); await pg.waitForTimeout(80); const izquierda = await lienzo(); await shot("idle_reflejo.jpg");
  check("ESTÁTICA reflejo del motor: la figura queda espejada", Math.abs((derecha.cx - 0.5) + (izquierda.cx - 0.5)) < 0.004 && Math.abs(derecha.cx - izquierda.cx) > 0.002, "centro " + derecha.cx.toFixed(4) + " → " + izquierda.cx.toFixed(4));
  await pg.click("#reflejo");
  await pg.click("#cebolla"); await pg.click("#sig"); await pg.click("#sig"); await pg.waitForTimeout(80); await shot("idle_papel_cebolla_f2_f3.jpg"); check("papel cebolla activable", (await st()).cebolla); await pg.click("#cebolla");
  await pg.click("#guias"); await pg.click("#antiguo"); await pg.waitForTimeout(80); const dos = await lienzo(); await shot("idle_guias_y_sprite_antiguo.jpg");
  check("ESTÁTICA comparación con el sprite antiguo: se dibujan dos figuras", dos.n > derecha.n * 1.5, dos.n + " frente a " + derecha.n + " píxeles opacos");
  await pg.click("#guias"); await pg.click("#antiguo");
  await pg.click("#bob"); await pg.click("#play"); await pg.waitForTimeout(400); check("balanceo del motor activable con la animación en marcha", (await st()).bob && (await st()).activo); await pg.click("#bob"); await pg.click("#play");
  for (let i = 0; i < 4; i++) { while ((await st()).cuadro !== i) await pg.click("#sig"); await pg.waitForTimeout(60); await shot("idle_ajustada_f" + (i + 1) + ".jpg"); }
  for (const [w, h] of [[1280, 720], [1366, 768], [2560, 1440]]) {
    await pg.setViewportSize({ width: w, height: h }); await pg.waitForTimeout(150); await pg.click("#ajustar"); await pg.waitForTimeout(80); px = await lienzo();
    const sinBarra = await pg.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth);
    check("se adapta a " + w + "×" + h, sinBarra && px.alto > 0.5 * px.h && px.alto < px.h, "figura " + px.alto + " de " + px.h + " px");
  }
  check("sin errores de consola ni peticiones fallidas", errors.length === 0, errors.join(" | ") || "0 errores");

  /* Recurso ausente. */
  const pg2 = await ctx.newPage();
  await pg2.route("**/pm_idle_02.png", (r) => r.fulfill({ status: 404, body: "" }));
  await pg2.goto(PAGE); await pg2.waitForFunction(() => /error/.test(document.getElementById("i-estado").textContent), null, { timeout: 15000 });
  const msg = await pg2.evaluate(() => document.getElementById("aviso").textContent);
  check("mensaje claro si falta un fotograma", /NO SE PUDO CARGAR/.test(msg) && /pm_idle_02\.png/.test(msg), msg.slice(0, 80) + "…");
  await pg2.close();

  /* El juego original sigue arrancando. */
  const pg3 = await ctx.newPage(); const gErr = [];
  pg3.on("pageerror", (e) => gErr.push(e.message)); pg3.on("response", (r) => { if (r.status() >= 400) gErr.push(r.status() + " " + r.url()); });
  await pg3.setViewportSize({ width: 1280, height: 720 });
  await pg3.goto(BASE + "/index.html", { waitUntil: "domcontentloaded" });
  await pg3.waitForFunction(() => window.DD_BOOT && DD_BOOT.getState().state === "INTRO", null, { timeout: 60000 });
  await pg3.waitForTimeout(600); await pg3.keyboard.press("Space");
  await pg3.waitForFunction(() => DD_BOOT.getState().state === "PLAYING" && DD_HUB.isActive(), null, { timeout: 20000 });
  const reg = await pg3.evaluate(() => ({ nuevo: Object.keys(DD_ASSETS.manifest.entries).filter((k) => /^pm_/.test(k)).length, idle: DD_ASSETS.manifest.entries.player_idle_00.src }));
  check("el juego original arranca y sigue usando el sprite antiguo", gErr.length === 0 && reg.nuevo === 0 && reg.idle === "assets/characters/player_idle_00.png", (gErr.join(" | ") || "0 errores") + " · " + reg.idle);

  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log("\n" + (results.length - failed) + "/" + results.length + " superadas");
  if (OUT) require("fs").writeFileSync(OUT + "/qa_visor_idle.json", JSON.stringify({ url: PAGE, results }, null, 1));
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("ERROR", e.message); process.exit(2); });
