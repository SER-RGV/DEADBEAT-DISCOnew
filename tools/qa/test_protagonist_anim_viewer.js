/* QA del visor del IDLE del protagonista: fotograma único (vigente) y experimento 4F (archivado como fallido).
   Uso:  DD_CHROMIUM=/ruta/a/chromium node tools/qa/test_protagonist_anim_viewer.js [http://localhost:8080] [carpeta_capturas]
   Requiere playwright-core y un servidor estático en la raíz del repositorio.
   Las comprobaciones marcadas ANIM miden la reproducción en tiempo real; las ESTÁTICA miden archivos o un fotograma parado. */
const { chromium } = require("playwright-core");
const BASE = process.argv[2] || "http://localhost:8080";
const OUT = process.argv[3] || null;
const PAGE1 = BASE + "/assets/cinematics/preview/protagonist_anim_test.html";   /* IDLE de fotograma único */
const PAGE = PAGE1 + "?set=4f";                                                    /* experimento de cuatro fotogramas, archivado */
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
  const shot = async () => {};   /* el experimento 4F está archivado: sus capturas no se regeneran */
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
  check("[4F] ESTÁTICA la página carga y la muestra queda lista", resp.status() === 200 && s.lista && s.total === 4, "HTTP " + resp.status() + ", " + s.total + " fotogramas");
  check("[4F] 4F se presenta como experimento fallido, no como animación aprobada", s.es4f && /FAILED_TATTOO_CONTINUITY/.test(s.etiqueta) && await pg.evaluate(() => !document.getElementById("fallido").hidden && /Fallido/.test(document.getElementById("fallido").textContent)), s.etiqueta);
  check("[4F] ESTÁTICA los cuatro fotogramas miden 288 × 512", s.tamanos.every((t) => t[0] === 288 && t[1] === 512), JSON.stringify(s.tamanos));
  check("[4F] ESTÁTICA tiempos del manifiesto: 4 × 560 ms = 2,24 s", s.ms.length === 4 && s.ms.every((m) => m === 560), s.ms.join(", "));
  const real = await pg.evaluate(() => ({ src: [...document.scripts].map((x) => x.src).filter(Boolean), fn: typeof window.DD_WORLD.drawProtagonist, frozen: Object.isFrozen(window.DD_WORLD), juego: !!(window.DD_BOOT || window.__DD_BRIDGE) }));
  check("[4F] ESTÁTICA usa el renderizador real del juego (src/dd_world_renderer.js), sin arrancar el juego", real.src.length === 1 && /\/src\/dd_world_renderer\.js$/.test(real.src[0]) && real.fn === "function" && !real.juego, real.src.join(", "));
  check("[4F] ESTÁTICA transparencia: las cuatro esquinas de cada PNG son transparentes", s.cajas.every((c) => c.esquinasTransparentes));
  check("[4F] ESTÁTICA la figura no toca los bordes del lienzo", s.cajas.every((c) => c.x0 > 0 && c.y0 > 0 && c.x1 < 287 && c.y1 < 511), s.cajas.map((c) => [c.x0, c.y0, c.x1, c.y1].join("-")).join(" | "));
  check("[4F] ESTÁTICA pies: misma línea de suelas en los cuatro (y=504 ± 1)", s.cajas.every((c) => Math.abs(c.y1 - 504) <= 1), s.cajas.map((c) => c.y1).join(", "));
  check("[4F] ESTÁTICA misma altura de figura en los cuatro (± 1 px)", Math.max(...s.cajas.map((c) => c.alto)) - Math.min(...s.cajas.map((c) => c.alto)) <= 1, s.cajas.map((c) => c.alto).join(", "));

  /* ---- ANIM: reproducción en tiempo real ---- */
  const muestras = await pg.evaluate(() => new Promise((ok) => {
    const log = []; let prev = -1; const t0 = performance.now();
    (function tick() { const e = window.DD_ANIM_VISOR.estado(), t = performance.now() - t0; if (e.cuadro !== prev) { log.push([e.cuadro, Math.round(t)]); prev = e.cuadro; } if (t < 3700) requestAnimationFrame(tick); else ok(log); })();
  }));
  const orden = muestras.map((m) => m[0]);
  const enOrden = orden.every((c, i) => i === 0 || c === (orden[i - 1] + 1) % 4);
  const dur = muestras.slice(1).map((m, i) => m[1] - muestras[i][1]).slice(1);   /* se descarta el primer tramo, que empieza a medias */
  check("[4F] ANIM los fotogramas avanzan en orden y en bucle", enOrden && orden.length >= 6, orden.join(" → "));
  check("[4F] ANIM cada fotograma dura 560 ms (± 40 ms)", dur.length >= 4 && dur.every((d) => Math.abs(d - 560) <= 40), dur.join(", ") + " ms");
  const ciclo = dur.slice(0, 4).reduce((a, b) => a + b, 0);
  check("[4F] ANIM ciclo completo de 2,24 s (± 60 ms)", Math.abs(ciclo - 2240) <= 60, ciclo + " ms");
  s = await st();
  check("[4F] ANIM el renderizador pinta cada cuadro sin fallos", s.ultimoOk && s.errores.length === 0 && s.pintados > 100, s.pintados + " cuadros pintados");
  check("[4F] ANIM rendimiento: tiempo medio de dibujo por cuadro < 4 ms", s.dibujoMs < 4, s.dibujoMs.toFixed(2) + " ms (Chromium sin GPU)");

  await pg.click("#play"); let a = await st(); await pg.waitForTimeout(900); let b = await st();
  check("[4F] ANIM pausa: el fotograma no cambia", !a.activo && a.cuadro === b.cuadro, "fotograma " + (b.cuadro + 1) + " durante 900 ms");
  await pg.click("#sig"); let c = await st(); check("[4F] fotograma siguiente", c.cuadro === (b.cuadro + 1) % 4 && !c.activo, (b.cuadro + 1) + " → " + (c.cuadro + 1));
  await pg.click("#ant"); await pg.click("#ant"); c = await st(); check("[4F] fotograma anterior (con vuelta)", c.cuadro === (b.cuadro + 3) % 4, "→ " + (c.cuadro + 1));
  await pg.keyboard.press("ArrowRight"); let d = await st(); check("[4F] teclado: flechas", d.cuadro === (c.cuadro + 1) % 4, "→ " + (d.cuadro + 1));
  await pg.keyboard.press("Space"); await pg.waitForTimeout(700); d = await st(); check("[4F] ANIM reanudar con Espacio", d.activo, "fotograma " + (d.cuadro + 1));
  await pg.click('[data-vel="2"]');
  const rapido = await pg.evaluate(() => new Promise((ok) => { const log = []; let prev = -1; const t0 = performance.now(); (function tick() { const e = window.DD_ANIM_VISOR.estado(), t = performance.now() - t0; if (e.cuadro !== prev) { log.push(t); prev = e.cuadro; } if (t < 1700) requestAnimationFrame(tick); else ok(log); })(); }));
  const dr = rapido.slice(1).map((t, i) => Math.round(t - rapido[i])).slice(1);
  check("[4F] ANIM velocidad 2×: 280 ms por fotograma (± 30 ms)", dr.length >= 3 && dr.every((x) => Math.abs(x - 280) <= 30), dr.join(", ") + " ms");
  await pg.click('[data-vel="0.25"]'); check("[4F] velocidad ¼× seleccionable", (await st()).vel === 0.25); await pg.click('[data-vel="1"]');

  /* ---- ESTÁTICA: tamaño, fondo y comprobaciones con la animación parada ---- */
  await pg.click("#play"); for (let i = 0; i < 4 && (await st()).cuadro !== 0; i++) await pg.click("#sig");
  s = await st(); const fit = s.z; let px = await lienzo();
  check("[4F] ajustar a pantalla: la figura cabe entera", s.ajustada && px.alto > 0.6 * px.h && px.alto < px.h, Math.round(s.z * 100) + " % · figura " + px.alto + " de " + px.h + " px");
  check("[4F] ESTÁTICA fondo transparente: el lienzo no pinta fondo", px.esquina === 0 && (await pg.evaluate(() => document.getElementById("visor").className)) === "f-trans");
  await shot("idle_ajustada_f1.jpg");
  await pg.click("#mas"); a = await st(); check("[4F] ampliar", Math.abs(a.z - fit * 1.25) < 1e-6 && !a.ajustada, Math.round(a.z * 100) + " %");
  await pg.click("#menos"); await pg.click("#menos"); a = await st(); check("[4F] reducir", Math.abs(a.z - fit / 1.25) < 1e-6, Math.round(a.z * 100) + " %");
  await pg.click("#juego"); await pg.waitForTimeout(80); a = await st(); px = await lienzo();
  check("[4F] tamaño de juego: zoom 1,16 y figura de ≈109 px", Math.abs(a.z - 1.16) < 1e-6 && Math.abs(px.alto - 109) <= 6, px.alto + " px de alto");
  await pg.click('[data-fondo="oscuro"]'); await shot("idle_tamano_de_juego.jpg");
  await pg.click("#ajustar"); a = await st(); check("[4F] volver a ajustar", a.ajustada && Math.abs(a.z - fit) < 1e-6);
  for (const f of ["claro", "magenta", "oscuro", "trans"]) { await pg.click('[data-fondo="' + f + '"]'); if (f === "claro") await shot("idle_fondo_claro.jpg"); }
  check("[4F] fondos de contraste seleccionables", (await st()).fondo === "trans");
  const derecha = await lienzo(); await pg.click("#reflejo"); await pg.waitForTimeout(80); const izquierda = await lienzo(); await shot("idle_reflejo.jpg");
  check("[4F] ESTÁTICA reflejo del motor: la figura queda espejada", Math.abs((derecha.cx - 0.5) + (izquierda.cx - 0.5)) < 0.004 && Math.abs(derecha.cx - izquierda.cx) > 0.002, "centro " + derecha.cx.toFixed(4) + " → " + izquierda.cx.toFixed(4));
  await pg.click("#reflejo");
  await pg.click("#cebolla"); await pg.click("#sig"); await pg.click("#sig"); await pg.waitForTimeout(80); await shot("idle_papel_cebolla_f2_f3.jpg"); check("[4F] papel cebolla activable", (await st()).cebolla); await pg.click("#cebolla");
  await pg.click("#guias"); await pg.click("#antiguo"); await pg.waitForTimeout(80); const dos = await lienzo(); await shot("idle_guias_y_sprite_antiguo.jpg");
  check("[4F] ESTÁTICA comparación con el sprite antiguo: se dibujan dos figuras", dos.n > derecha.n * 1.5, dos.n + " frente a " + derecha.n + " píxeles opacos");
  await pg.click("#guias"); await pg.click("#antiguo");
  await pg.click('[data-bob="1.1"]'); await pg.click("#play"); await pg.waitForTimeout(400); check("[4F] balanceo del motor activable con la animación en marcha", (await st()).bob === 1.1 && (await st()).activo); await pg.click('[data-bob="0"]'); await pg.click("#play");
  for (let i = 0; i < 4; i++) { while ((await st()).cuadro !== i) await pg.click("#sig"); await pg.waitForTimeout(60); await shot("idle_ajustada_f" + (i + 1) + ".jpg"); }
  for (const [w, h] of [[1280, 720], [1366, 768], [2560, 1440]]) {
    await pg.setViewportSize({ width: w, height: h }); await pg.waitForTimeout(150); await pg.click("#ajustar"); await pg.waitForTimeout(80); px = await lienzo();
    const sinBarra = await pg.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth);
    check("[4F] se adapta a " + w + "×" + h, sinBarra && px.alto > 0.5 * px.h && px.alto < px.h, "figura " + px.alto + " de " + px.h + " px");
  }
  check("[4F] sin errores de consola ni peticiones fallidas", errors.length === 0, errors.join(" | ") || "0 errores");

  /* =================== IDLE DE FOTOGRAMA ÚNICO (recurso vigente) =================== */
  await pg.setViewportSize({ width: 1920, height: 1080 });
  const r1 = await pg.goto(PAGE1);
  await pg.waitForFunction(() => window.DD_ANIM_VISOR && window.DD_ANIM_VISOR.estado().lista, null, { timeout: 20000 });
  const shot1 = async (n) => { if (OUT) await pg.screenshot({ path: OUT + "/" + n, type: "jpeg", quality: 85 }); };
  const C = (n, ok, d) => check("[1F] " + n, ok, d);
  let u = await st();
  const ui = await pg.evaluate(() => ({ fallido: document.getElementById("fallido").hidden, pasos: document.getElementById("pasos").hidden, cebolla: document.getElementById("cebolla").hidden, src: [...document.scripts].map((x) => x.src).filter(Boolean), juego: !!(window.DD_BOOT || window.__DD_BRIDGE), ruta: document.getElementById("i-ruta").textContent }));
  C("ESTÁTICA abre por defecto el IDLE de fotograma único", r1.status() === 200 && u.total === 1 && !u.es4f && u.etiqueta === "IDLE_1F" && ui.fallido && ui.ruta === "assets/characters/protagonist_master/pm_idle_00.png", ui.ruta);
  C("ESTÁTICA sin controles que no aplican (anterior, siguiente, papel cebolla ocultos)", ui.pasos && ui.cebolla);
  C("ESTÁTICA usa el renderizador real del juego, sin arrancar el juego", ui.src.length === 1 && /\/src\/dd_world_renderer\.js$/.test(ui.src[0]) && !ui.juego, ui.src.join(", "));
  const cj = u.cajas[0];
  C("ESTÁTICA dimensiones: lienzo 288 × 512", u.tamanos[0][0] === 288 && u.tamanos[0][1] === 512);
  C("ESTÁTICA transparencia: esquinas transparentes y figura sin tocar bordes", cj.esquinasTransparentes && cj.x0 > 0 && cj.y0 > 0 && cj.x1 < 287 && cj.y1 < 511, [cj.x0, cj.y0, cj.x1, cj.y1].join("-"));
  C("ESTÁTICA línea de suelo: suelas en y=504 y figura de 462 px, como los sprites actuales", cj.y1 === 504 && Math.abs(cj.alto - 462) <= 1, "suelas y=" + cj.y1 + ", alto " + cj.alto);
  C("ESTÁTICA respiración del Refugio activa al abrir (±1,1 px)", u.bob === 1.1 && u.activo);

  /* Respiración procedural: se mide en marcha. */
  const curva = await pg.evaluate(() => new Promise((ok) => { const log = []; const t0 = performance.now(); (function tick() { const e = window.DD_ANIM_VISOR.estado(), t = performance.now() - t0; log.push([t, e.bobY, e.cuadro]); if (t < 5200) requestAnimationFrame(tick); else ok(log); })(); }));
  const ys = curva.map((c) => c[1]), sub = []; for (let i = 1; i < curva.length; i++) if (curva[i - 1][1] < 0 && curva[i][1] >= 0) sub.push(curva[i][0]);
  const periodo = sub.length >= 2 ? sub[1] - sub[0] : 0;
  C("ANIM respiración: oscila entre −1,1 y +1,1 px de mundo", Math.abs(Math.max(...ys) - 1.1) < 0.02 && Math.abs(Math.min(...ys) + 1.1) < 0.02, Math.min(...ys).toFixed(3) + " … " + Math.max(...ys).toFixed(3));
  C("ANIM respiración: ciclo de 2,24 s (± 60 ms), el del motor", Math.abs(periodo - 2244) <= 60, Math.round(periodo) + " ms");
  C("ANIM el fotograma no cambia durante el ciclo", curva.every((c) => c[2] === 0), curva.length + " muestras, siempre pm_idle_00");
  /* En pantalla: cuánto se mueven cabeza y suelas. */
  const borde = () => pg.evaluate(() => { const c = document.getElementById("lienzo"), w = c.width, h = c.height, d = c.getContext("2d").getImageData(Math.round(w / 2) - 60, 0, 120, h).data; let y0 = -1, y1 = -1; for (let y = 0; y < h; y++) { let n = 0; for (let x = 0; x < 120; x++) if (d[(y * 120 + x) * 4 + 3] > 250) n++; if (n > 3) { if (y0 < 0) y0 = y; y1 = y; } } return { y0, y1, bob: window.DD_ANIM_VISOR.estado().bobY, z: window.DD_ANIM_VISOR.estado().z }; });
  await pg.click("#juego"); await pg.click('[data-fondo="oscuro"]'); await pg.click('[data-vel="0.25"]');
  const mov = []; for (let i = 0; i < 60; i++) { mov.push(await borde()); await pg.waitForTimeout(150); }
  const cab = mov.map((m) => m.y0);
  C("ANIM a tamaño de juego la cabeza sube y baja ≈2,6 px (2 × 1,1 × 1,16)", Math.abs((Math.max(...cab) - Math.min(...cab)) - 2.55) <= 1.1, (Math.max(...cab) - Math.min(...cab)) + " px de recorrido");
  await pg.click('[data-vel="1"]');
  await pg.click("#play"); const p1 = await st(); await pg.waitForTimeout(700); const p2 = await st();
  C("ANIM pausa: la respiración se detiene", !p2.activo && p1.bobY === p2.bobY, "bobY " + p2.bobY.toFixed(3) + " durante 700 ms");
  await shot1("idle1f_tamano_de_juego.jpg");
  await pg.click("#play"); await pg.click('[data-vel="2"]');
  const c2 = await pg.evaluate(() => new Promise((ok) => { const log = []; const t0 = performance.now(); (function tick() { const e = window.DD_ANIM_VISOR.estado(), t = performance.now() - t0; log.push([t, e.bobY]); if (t < 2700) requestAnimationFrame(tick); else ok(log); })(); }));
  const s2 = []; for (let i = 1; i < c2.length; i++) if (c2[i - 1][1] < 0 && c2[i][1] >= 0) s2.push(c2[i][0]);
  C("ANIM velocidad 2×: ciclo de 1,12 s (± 40 ms)", s2.length >= 2 && Math.abs((s2[1] - s2[0]) - 1122) <= 40, s2.length >= 2 ? Math.round(s2[1] - s2[0]) + " ms" : "sin datos");
  await pg.click('[data-vel="1"]');
  await pg.click('[data-bob="0.55"]'); await pg.waitForTimeout(2400); C("respiración de combate seleccionable (±0,55 px)", (await st()).bob === 0.55 && Math.abs((await st()).bobY) <= 0.551);

  /* Los tatuajes no cambian: sin balanceo, el lienzo es idéntico píxel a píxel a lo largo del ciclo. */
  await pg.click('[data-bob="0"]'); await pg.click("#ajustar"); await pg.click('[data-fondo="trans"]'); await pg.waitForTimeout(120);
  const huella = () => pg.evaluate(() => { const c = document.getElementById("lienzo"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let h = 2166136261; for (let i = 0; i < d.length; i += 1) { h ^= d[i]; h = Math.imul(h, 16777619); } return h >>> 0; });
  const hs = []; for (let i = 0; i < 6; i++) { hs.push(await huella()); await pg.waitForTimeout(430); }
  C("ANIM tatuajes y figura sin cambios durante el ciclo: 6 lecturas del lienzo en 2,2 s, idénticas píxel a píxel", hs.every((h) => h === hs[0]), "huella " + hs[0]);
  let fig = await lienzo(); u = await st();
  C("ajustar a pantalla: la figura cabe entera", u.ajustada && fig.alto > 0.6 * fig.h && fig.alto < fig.h, Math.round(u.z * 100) + " %");
  C("ESTÁTICA fondo transparente: el lienzo no pinta fondo", fig.esquina === 0);
  await shot1("idle1f_ajustada.jpg");
  await pg.click("#juego"); await pg.waitForTimeout(100); const fj = await lienzo();
  C("ESTÁTICA escala real de juego: figura de ≈106 px con zoom 1,16", Math.abs((await st()).z - 1.16) < 1e-6 && Math.abs(fj.alto - 107) <= 6, fj.alto + " px");
  await pg.click("#mas"); await pg.click("#menos"); await pg.click("#ajustar"); await pg.waitForTimeout(100);
  await pg.click('[data-fondo="claro"]'); await shot1("idle1f_fondo_claro.jpg"); await pg.click('[data-fondo="trans"]');
  const de = await lienzo(); await pg.click("#reflejo"); await pg.waitForTimeout(100); const iz = await lienzo(); await shot1("idle1f_reflejo.jpg"); await pg.click("#reflejo");
  C("ESTÁTICA reflejo del motor: la figura queda espejada", Math.abs((de.cx - 0.5) + (iz.cx - 0.5)) < 0.004 && Math.abs(de.cx - iz.cx) > 0.002, de.cx.toFixed(4) + " → " + iz.cx.toFixed(4));
  await pg.click("#guias"); await pg.click("#antiguo"); await pg.waitForTimeout(100); const par = await lienzo(); await shot1("idle1f_guias_y_sprite_antiguo.jpg");
  C("ESTÁTICA comparación con el sprite antiguo y guías de anclaje", par.n > de.n * 1.5 && (await st()).guias);
  await pg.click("#guias"); await pg.click("#antiguo");
  await pg.keyboard.press("Space"); const k1 = await st(); await pg.keyboard.press("ArrowRight"); const k2 = await st(); await pg.keyboard.press("Space");
  C("teclado: Espacio pausa; las flechas no hacen nada con un solo fotograma", !k1.activo && k2.cuadro === 0 && !k2.activo && (await st()).activo);
  C("rendimiento: tiempo medio de dibujo por cuadro < 4 ms", (await st()).dibujoMs < 4, (await st()).dibujoMs.toFixed(2) + " ms");
  C("sin errores de consola ni peticiones fallidas", errors.length === 0, errors.join(" | ") || "0 errores");

  /* =================== CORRECCIÓN DE FIDELIDAD (pendiente de validación visual) =================== */
  const PAGEF = PAGE1 + "?set=fid";
  await pg.setViewportSize({ width: 1920, height: 1080 });
  const errAntes = errors.length;
  const rf = await pg.goto(PAGEF);
  await pg.waitForFunction(() => window.DD_ANIM_VISOR && window.DD_ANIM_VISOR.estado().lista, null, { timeout: 20000 });
  const F = (n, ok, d) => check("[FID] " + n, ok, d);
  let f = await st();
  const fui = await pg.evaluate(() => ({ banda: !document.getElementById("porvalidar").hidden && /PENDIENTE DE APROBACIÓN/.test(document.getElementById("porvalidar").textContent), fallido: document.getElementById("fallido").hidden, panel: !document.getElementById("panel").hidden, ruta: document.getElementById("i-ruta").textContent,
    det: (() => { const i = document.getElementById("z-detalles"); return i.complete && i.naturalWidth > 0 && /character_master\/protagonist_master_crop_tattoo_details\.png$/.test(i.src); })(),
    tinta: ["z-actual", "z-ant", "z-fid", "z-perfil"].map((id) => { const c = document.getElementById(id), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) n++; return n / (c.width * c.height); }),
    difBrazo: (() => { const a = document.getElementById("z-actual"), b = document.getElementById("z-fid"), da = a.getContext("2d").getImageData(0, 0, 450, 900).data, db = b.getContext("2d").getImageData(0, 0, 450, 900).data; let n = 0; for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 90) n++; return n / (450 * 900); })() }));
  F("ESTÁTICA abre el fotograma corregido, rotulado como PENDIENTE DE APROBACIÓN", rf.status() === 200 && f.esFid && f.total === 1 && f.etiqueta === "IDLE_1F_FIDELIDAD" && fui.banda && fui.fallido && fui.ruta === "assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png", fui.ruta);
  const fc = f.cajas[0];
  F("ESTÁTICA mismo contrato que el actual: 288 × 512, suelas y=504, 462 px, esquinas transparentes", f.tamanos[0][0] === 288 && f.tamanos[0][1] === 512 && fc.y1 === 504 && Math.abs(fc.alto - 462) <= 1 && fc.esquinasTransparentes, [fc.x0, fc.y0, fc.x1, fc.y1].join("-"));
  F("ESTÁTICA misma silueta que el actual (caja de la figura idéntica)", f.otro && f.otro.id === "pm_idle_00" && ["x0", "y0", "x1", "y1"].every((k) => f.otro.caja[k] === fc[k]), f.otro ? [f.otro.caja.x0, f.otro.caja.y0, f.otro.caja.x1, f.otro.caja.y1].join("-") : "sin la otra versión");
  F("ESTÁTICA comparación abierta: actual · corrección anterior · nueva corrección, en ese orden", f.comparar && f.fila.join(",") === "pm_idle_00,pm_idle_fid_00_v1,pm_idle_fid_00", f.fila.join(" · "));
  F("ESTÁTICA la corrección anterior se conserva y tiene la misma silueta (caja idéntica)", f.anterior && /versiones\/pm_idle_fid_00_v1\.png$/.test(f.anterior.src) && ["x0", "y0", "x1", "y1"].every((k) => f.anterior.caja[k] === fc[k]), f.anterior ? f.anterior.src : "falta");
  const dAnt = await pg.evaluate(() => { const a = document.getElementById("z-ant"), b = document.getElementById("z-fid"), da = a.getContext("2d").getImageData(0, 0, 450, 900).data, db = b.getContext("2d").getImageData(0, 0, 450, 900).data; let n = 0; for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 90) n++; return n / (450 * 900); });
  F("ESTÁTICA la nueva corrección difiere de la anterior en el brazo ampliado", dAnt > 0.03, Math.round(dAnt * 100) + " % de píxeles distintos");
  F("ESTÁTICA panel con la lámina (PERFIL D. y detalle de tatuajes) y los tres brazos ampliados", fui.panel && fui.det && fui.tinta.every((t) => t > 0.3), fui.tinta.map((t) => Math.round(t * 100) + " %").join(", "));
  F("ESTÁTICA los brazos ampliados de actual y corregido difieren (hay corrección que ver)", fui.difBrazo > 0.05, Math.round(fui.difBrazo * 100) + " % de píxeles distintos");
  const dosFig = await lienzo();
  F("ESTÁTICA ajustar a pantalla: las tres figuras caben", (await st()).ajustada && dosFig.alto > 0.3 * dosFig.h && dosFig.alto < dosFig.h, Math.round((await st()).z * 100) + " %");
  await pg.waitForTimeout(600); const fb1 = (await st()).bobY; await pg.waitForTimeout(500); const fb2 = (await st()).bobY;
  F("ANIM respiración del motor en marcha sobre las tres figuras", (await st()).activo && fb1 !== fb2 && Math.abs(fb1) <= 1.1001, fb1.toFixed(2) + " → " + fb2.toFixed(2));
  await shot1("fid_comparacion_visor.jpg");
  await pg.click("#antiguo"); await pg.waitForTimeout(150);
  F("ESTÁTICA con el sprite antiguo: antiguo · actual · corrección anterior · nueva", (await st()).fila.join(",") === "player_idle_00,pm_idle_00,pm_idle_fid_00_v1,pm_idle_fid_00", (await st()).fila.join(" · "));
  await shot1("fid_antiguo_actual_correcciones.jpg"); await pg.click("#antiguo");
  await pg.click("#lamina"); await pg.click("#comparar"); await pg.click('[data-bob="0"]'); await pg.click('[data-fondo="oscuro"]'); await pg.waitForTimeout(150);
  F("los botones de comparación y de lámina se apagan", !(await st()).comparar && !(await st()).lamina && await pg.evaluate(() => document.getElementById("panel").hidden) && (await st()).fila.length === 1);
  await shot1("fid_solo_ajustada.jpg");
  await pg.click("#juego"); await pg.waitForTimeout(120); const fjg = await lienzo(); await shot1("fid_tamano_de_juego.jpg");
  F("ESTÁTICA escala real de juego: figura de ≈106 px", Math.abs(fjg.alto - 107) <= 6, fjg.alto + " px");
  F("sin errores de consola ni peticiones fallidas", errors.length === errAntes, errors.slice(errAntes).join(" | ") || "0 errores");
  /* El visor del fotograma actual ofrece la misma comparación, apagada al abrir. */
  await pg.goto(PAGE1); await pg.waitForFunction(() => window.DD_ANIM_VISOR && window.DD_ANIM_VISOR.estado().lista, null, { timeout: 20000 });
  const a0 = await st(); await pg.click("#comparar"); await pg.waitForTimeout(120); const a1 = await st();
  F("desde el fotograma actual: comparación apagada al abrir y disponible", !a0.comparar && !a0.lamina && a1.comparar && a1.fila.join(",") === "pm_idle_00,pm_idle_fid_00_v1,pm_idle_fid_00", a1.fila.join(" · "));

  /* Recurso ausente. */
  const pg2 = await ctx.newPage();
  await pg2.route("**/pm_idle_02.png", (r) => r.fulfill({ status: 404, body: "" }));
  await pg2.goto(PAGE); await pg2.waitForFunction(() => /error/.test(document.getElementById("i-estado").textContent), null, { timeout: 15000 });
  const msg = await pg2.evaluate(() => document.getElementById("aviso").textContent);
  check("[4F] mensaje claro si falta un fotograma", /NO SE PUDO CARGAR/.test(msg) && /pm_idle_02\.png/.test(msg), msg.slice(0, 80) + "…");
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
  check("[4F] el juego original arranca y sigue usando el sprite antiguo", gErr.length === 0 && reg.nuevo === 0 && reg.idle === "assets/characters/player_idle_00.png", (gErr.join(" | ") || "0 errores") + " · " + reg.idle);

  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log("\n" + (results.length - failed) + "/" + results.length + " superadas");
  if (OUT) require("fs").writeFileSync(OUT + "/qa_visor_idle.json", JSON.stringify({ url: PAGE1, results }, null, 1));
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("ERROR", e.message); process.exit(2); });
