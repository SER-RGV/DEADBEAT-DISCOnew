#!/usr/bin/env node
/* ==========================================================================
   DEADBEAT DISCO — PRUEBA DE AUTOCONTENCIÓN (CSS + JavaScript)
   ==========================================================================
   Sirve ÚNICAMENTE index.html: cualquier otra ruta (src/, ART_PACK/, assets/,
   fuentes, etc.) responde 404. Verifica que:

     - no se solicita ningún fichero de src/ ni ART_PACK/ (CSS y JS van inline)
     - no hay peticiones a hosts externos
     - la build arranca, el menú HD aparece y el HUB entra igualmente
     - 0 excepciones de página (las imágenes que 404 degradan al dibujo
       procedural del motor, no rompen el arranque)

   Uso: NODE_PATH=... LD_LIBRARY_PATH=... node tools/qa/selfcontained.js [--out dir]
   ========================================================================== */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const PORT = parseInt(process.env.DD_PORT || "8125", 10);
const outArg = process.argv.indexOf("--out");
const OUT_DIR = outArg > -1 ? path.resolve(process.argv[outArg + 1]) : path.join(ROOT, "ART_EVIDENCE", "final_review");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const HTML = fs.readFileSync(path.join(ROOT, "index.html"));
const srv = http.createServer((req, res) => {
  const url = req.url.split("?")[0];
  if (url === "/" || url === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(HTML);
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("404 (blocked on purpose)");
});

(async () => {
  const puppeteer = require("puppeteer-core");
  const chromium = (require("@sparticuz/chromium").default) || require("@sparticuz/chromium");
  await new Promise((r) => srv.listen(PORT, "0.0.0.0", r));

  const browser = await puppeteer.launch({
    args: [...chromium.args, "--no-sandbox", "--disable-gpu-sandbox"],
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();
  const requests = [];
  const errors = [];
  page.on("request", (r) => requests.push(r.url()));
  page.on("pageerror", (e) => errors.push(String(e.message || e)));

  await page.goto("http://127.0.0.1:" + PORT + "/index.html", { waitUntil: "load", timeout: 120000 });
  const booted = await page.waitForFunction(
    () => window.DD_UI && window.DD_HUB && window.DD_CINE && window.__DD_BRIDGE,
    { timeout: 120000 }
  ).then(() => true).catch(() => false);
  await sleep(1500);

  const state = await page.evaluate(() => {
    const menu = document.getElementById("dd-main-menu");
    return {
      menuDisplay: menu ? getComputedStyle(menu).display : "absent",
      menuButtons: document.querySelectorAll("#dd-menu-nav .dd-menu-btn").length,
      hd: document.body.classList.contains("dd-highres-edition"),
      assetsLoaded: window.DD_ASSETS ? window.DD_ASSETS.stats() : null,
      strayScripts: Array.from(document.scripts).filter((s) => s.src).map((s) => s.src),
      strayLinks: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((l) => l.href)
    };
  });

  const hubOk = await page.evaluate(() => {
    const b = document.querySelector('#dd-menu-nav .dd-menu-btn[data-action="hub"]');
    if (b) b.click();
    return !!b;
  });
  await sleep(600);
  await page.keyboard.press(" ");
  const hubActive = await page.waitForFunction(() => window.DD_HUB.isActive(), { timeout: 20000 })
    .then(() => true).catch(() => false);

  const srcRequests = requests.filter((u) => /\/src\/|ART_PACK|\.css$|dd_[a-z_]+\.js/.test(u));
  // data: URIs are embedded payloads, not network traffic
  const externalRequests = requests.filter((u) => /^https?:\/\//.test(u) && !u.startsWith("http://127.0.0.1:" + PORT));
  const dataUriRequests = requests.filter((u) => u.startsWith("data:"));
  const blocked404 = requests.filter((u) => /assets\//.test(u));

  const report = {
    when: new Date().toISOString(),
    mode: "single-file: solo index.html; src/, ART_PACK/ y assets/ responden 404",
    booted,
    state,
    hubOk,
    hubActive,
    counts: { requests: requests.length, srcOrCss: srcRequests.length, external: externalRequests.length, dataUri: dataUriRequests.length, asset404: blocked404.length },
    srcRequests: srcRequests.slice(0, 20),
    externalRequests: externalRequests.slice(0, 20),
    pageErrors: errors,
    verdict: booted && hubActive && errors.length === 0 && srcRequests.length === 0 && externalRequests.length === 0 ? "PASS" : "FAIL"
  };

  /* ---- segundo modo: file:// (doble clic, assets/ junto al HTML) -------- */
  const filePage = await browser.newPage();
  const fileErrors = [];
  filePage.on("pageerror", (e) => fileErrors.push(String(e.message || e)));
  const fileState = { booted: false, menuDisplay: "absent", assets: null };
  try {
    await filePage.goto("file://" + path.join(ROOT, "index.html"), { waitUntil: "load", timeout: 120000 });
    fileState.booted = await filePage.waitForFunction(
      () => window.DD_UI && window.DD_HUB && window.__DD_BRIDGE, { timeout: 120000 }
    ).then(() => true).catch(() => false);
    await sleep(1500);
    const st = await filePage.evaluate(() => ({
      menuDisplay: (() => { const m = document.getElementById("dd-main-menu"); return m ? getComputedStyle(m).display : "absent"; })(),
      assets: window.DD_ASSETS ? window.DD_ASSETS.stats() : null,
      hd: document.body.classList.contains("dd-highres-edition"),
      guard: !!window.__DD_KEY_GUARD__
    }));
    Object.assign(fileState, st);
  } catch (e) {
    fileErrors.push("file:// " + e.message);
  }
  report.fileMode = { url: "file://" + path.join(ROOT, "index.html"), state: fileState, pageErrors: fileErrors };
  report.verdict = report.verdict === "PASS" && fileState.booted && fileState.menuDisplay !== "none" &&
    fileErrors.length === 0 ? "PASS" : "FAIL";

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, "selfcontained.json");
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ verdict: report.verdict, counts: report.counts, pageErrors: errors.length, hubActive, menuButtons: state.menuButtons, fileMode: report.fileMode }, null, 2));
  console.log("evidence:", file);

  await browser.close();
  srv.close();
  process.exit(report.verdict === "PASS" ? 0 : 1);
})().catch((e) => { console.error("HARNESS ERROR:", e); process.exit(2); });
