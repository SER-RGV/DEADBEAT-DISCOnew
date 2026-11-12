#!/usr/bin/env node
/* ==========================================================================
   DEADBEAT DISCO — ART PRODUCTION MASTER · sonda de la CINEMÁTICA DE ENTRADA
   Uso:  node tools/art_master/probe_cinematic.js <carpeta_salida>
              [--times=1.5,5,8.5,11.5,15.5,19,22.5,26.5,30,33.5] [--dpr=1]
              [--url=http://127.0.0.1:8080/index.html]

   Abre el index.html real, deja correr la cinemática de entrada (DD_CINE, 35 s,
   10 planos) y guarda el <canvas> cuando el reloj de la secuencia alcanza cada
   tiempo pedido (por defecto, uno por plano). Sirve para comprobar en el juego
   los fotogramas hero_* del protagonista y los fondos por capas.

   Adelanta el reloj de la secuencia con DD_CINE.update() y lee el canvas
   directamente (toDataURL): a tiempo real, en este Chromium sin GPU, los 35 s
   de secuencia tardan muchos minutos y page.screenshot cuesta ~10 s por captura.
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
const OUT = path.resolve(args.find(a => !a.startsWith("--")) || "/tmp/ddqa/cine");
const opt = (k, d) => { const a = args.find(x => x.startsWith("--" + k + "=")); return a ? a.split("=")[1] : d; };
const DPR = Number(opt("dpr", "1"));
const URL = opt("url", "http://127.0.0.1:8080/index.html");
const TIMES = opt("times", "1.5,5,8.5,11.5,15.5,19,22.5,26.5,30,33.5").split(",").map(Number).filter(n => isFinite(n)).sort((a, b) => a - b);
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const T0 = Date.now();
  const report = { url: URL, out: OUT, times: TIMES, shots: [], pageErrors: [], httpErrors: [] };
  const sparticuz = (await import("file:///tmp/browser/node_modules/@sparticuz/chromium/build/index.js")).default;
  const browser = await pw.launch({
    executablePath: "/tmp/chromium",
    args: [...sparticuz.args.filter(a => !a.startsWith("--headless") && !a.startsWith("--window-size")), "--no-sandbox", "--disable-gpu-sandbox"],
    headless: true
  });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: DPR })).newPage();
  page.on("pageerror", e => report.pageErrors.push(String(e.message).slice(0, 300)));
  page.on("response", r => { if (r.status() >= 400) report.httpErrors.push(r.status() + " " + r.url()); });
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => window.DD_ASSETS && (() => { const s = window.DD_ASSETS.stats(); return s.loaded + s.errors >= s.registered; })(), { timeout: 90000 });

  /* Adelanta el reloj de la secuencia hasta `tgt` con el propio DD_CINE.update (que
     limita cada paso a 0,05 s), deja que el bucle real pinte dos fotogramas y lee el
     canvas. En Chromium sin GPU la secuencia a tiempo real tardaría muchos minutos. */
  const grabAt = (target) => page.evaluate(async (tgt) => {
    const get = () => (window.DD_CINE && window.DD_CINE.getState ? window.DD_CINE.getState() : null);
    let st = get();
    if (!st) return { st: null };
    let guard = 0;
    while (st && st.elapsed < tgt - 0.02 && guard++ < 2000) { window.DD_CINE.update(0.05); st = get(); }
    if (!st) return { st: null };
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    st = get() || st;
    const cv = Array.from(document.querySelectorAll("canvas")).filter(c => c.getBoundingClientRect().width > 0)
      .sort((a, b) => b.width * b.height - a.width * a.height)[0];
    return { st, w: cv.width, h: cv.height, data: cv.toDataURL("image/jpeg", 0.9) };
  }, target);

  await page.waitForFunction(() => window.DD_CINE && window.DD_CINE.getState && !!window.DD_CINE.getState(), { timeout: 30000 }).catch(() => {});
  for (let i = 0; i < TIMES.length; i++) {
    const r = await grabAt(TIMES[i]);
    if (!r.st || !r.data) { report.shots.push({ target: TIMES[i], error: "secuencia inactiva" }); console.log("sin secuencia en", TIMES[i]); break; }
    const name = "cine_" + String(i + 1).padStart(2, "0") + "_t" + String(TIMES[i]).replace(".", "_") + ".jpg";
    fs.writeFileSync(path.join(OUT, name), Buffer.from(r.data.split(",")[1], "base64"));
    report.shots.push({ name, target: TIMES[i], elapsed: r.st.elapsed, type: r.st.type, canvas: [r.w, r.h], t: +((Date.now() - T0) / 1000).toFixed(1) });
    console.log("shot", name, JSON.stringify(r.st));
  }
  report.final = await page.evaluate(() => ({ stats: window.DD_ASSETS.stats(), cine: window.DD_CINE.getState() }));
  report.elapsedS = +((Date.now() - T0) / 1000).toFixed(1);
  fs.writeFileSync(path.join(OUT, "cine_report.json"), JSON.stringify(report, null, 1));
  console.log(JSON.stringify({ shots: report.shots.length, of: TIMES.length, pageErrors: report.pageErrors, httpErrors: report.httpErrors, elapsedS: report.elapsedS }));
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
