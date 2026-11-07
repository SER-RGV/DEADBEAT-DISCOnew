#!/usr/bin/env node
/* ==========================================================================
   DEADBEAT DISCO — REVISIÓN FINAL PRE-MERGE · arnés de regresión headless
   ==========================================================================
   Chromium headless REAL (no jsdom, no emulación de DOM) sobre la build
   oficial index.html servida junto a assets/ del repositorio.

   BLOQUE A · keyboard_guard (unitario, aislado)
     Extrae LITERALMENTE el KEYBOARD TAKEOVER GUARD de index.html y lo evalúa
     en una página sin el cover heredado, para medir su contrato sin
     interferencias:
       - capture=true (booleano)
       - capture mediante objeto {capture:true}
       - registro duplicado de la misma función
       - removeEventListener simétrico (booleano y objeto)
       - listeners en fase de burbuja intactos
       - instalación idempotente

   BLOQUE B · integración con el motor real
       - HD activo: el cover heredado NO secuestra el keydown
       - HD desactivado: el secuestro heredado (stopImmediatePropagation)
         vuelve a comportarse EXACTAMENTE como en la build original

   BLOQUE C · flujo completo
       menú -> cinemática -> HUB (teclado + mando EMULADO) -> descenso ->
       partida normal -> pausa liberada -> re-entrada al HUB -> segundo
       descenso -> pausa liberada otra vez.

   Uso:
     NODE_PATH=<node_modules con puppeteer-core + @sparticuz/chromium> \
     LD_LIBRARY_PATH=<libnspr4/libnss3> node tools/qa/final_review.js [--out dir]
   ========================================================================== */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const PORT = parseInt(process.env.DD_PORT || "8123", 10);
const outArg = process.argv.indexOf("--out");
const OUT_DIR = outArg > -1 ? path.resolve(process.argv[outArg + 1]) : path.join(ROOT, "ART_EVIDENCE", "final_review");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------ static server ---------------------------- */
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".css": "text/css",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json",
  ".svg": "image/svg+xml", ".ttf": "font/ttf", ".woff2": "font/woff2", ".mp3": "audio/mpeg"
};
function startServer() {
  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split("?")[0]);
      const file = path.join(ROOT, url === "/" ? "index.html" : url);
      if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
      fs.readFile(file, (err, buf) => {
        if (err) { res.writeHead(404).end("404"); return; }
        res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
        res.end(buf);
      });
    });
    srv.on("error", reject);
    srv.listen(PORT, "0.0.0.0", () => resolve(srv));
  });
}

/* --------------- extract the shipped guard snippet verbatim -------------- */
function extractGuard(html) {
  const begin = html.indexOf("DD_KEYBOARD_GUARD:BEGIN");
  if (begin >= 0) {
    const end = html.indexOf("DD_KEYBOARD_GUARD:END", begin);
    if (end < 0) throw new Error("guard END marker missing");
    const from = html.indexOf("\n", begin) + 1;
    const to = html.lastIndexOf("\n", end);
    return { code: html.slice(from, to), mode: "markers" };
  }
  // pre-fix layout: from the captured native reference to the bridge body
  const s = html.indexOf("const nativeWindowAddEventListener = window.addEventListener;");
  const t = html.indexOf("const origQc = qc;", s);
  if (s < 0 || t < 0) throw new Error("cannot locate keyboard guard in build");
  return { code: html.slice(s, t), mode: "legacy-span" };
}

/* ---------------------- BLOQUE A · guard unit spec ----------------------- */
const GUARD_SPEC = function () {
  const HD = "dd-highres-edition";
  const out = [];
  const rec = (name, ok, detail) => out.push({ name, ok: !!ok, detail: detail === undefined ? "" : String(detail) });
  const setHd = (on) => document.body.classList.toggle(HD, on);
  const fire = (code) => {
    const ev = new KeyboardEvent("keydown", { key: code, code: code, bubbles: true, cancelable: true });
    window.dispatchEvent(ev);
    return ev;
  };
  try {
    rec("guard.patched", window.addEventListener !== EventTarget.prototype.addEventListener,
      "window.addEventListener !== EventTarget.prototype.addEventListener");
    rec("guard.exposes-state", !!window.__DD_KEY_GUARD__, "window.__DD_KEY_GUARD__=" + typeof window.__DD_KEY_GUARD__);

    // A · capture=true boolean
    let a = 0;
    const ha = () => { a++; };
    window.addEventListener("keydown", ha, true);
    setHd(true); fire("F13");
    rec("A.capture=true neutralized while HD", a === 0, "hits=" + a);
    setHd(false); fire("F13");
    rec("A2.capture=true fires when HD off", a === 1, "hits=" + a);
    window.removeEventListener("keydown", ha, true);
    fire("F13");
    rec("A3.removeEventListener(type,fn,true) detaches", a === 1, "hits=" + a);

    // B · capture via options object
    let b = 0;
    const hb = () => { b++; };
    window.addEventListener("keydown", hb, { capture: true });
    setHd(true); fire("F14");
    rec("B.capture:{capture:true} neutralized while HD", b === 0, "hits=" + b);
    setHd(false); fire("F14");
    rec("B2.capture:{capture:true} fires when HD off", b === 1, "hits=" + b);
    window.removeEventListener("keydown", hb, { capture: true });
    fire("F14");
    rec("B3.removeEventListener with {capture:true} detaches", b === 1, "hits=" + b);

    // C · duplicate registration is a DOM no-op
    let c = 0;
    const hc = () => { c++; };
    window.addEventListener("keydown", hc, true);
    window.addEventListener("keydown", hc, true);
    setHd(false); fire("F15");
    rec("C.duplicate registration delivers once", c === 1, "hits=" + c);
    window.removeEventListener("keydown", hc, true);
    fire("F15");
    rec("C2.after removal no delivery", c === 1, "hits=" + c);

    // D · bubble-phase listeners (engine input) untouched
    let d = 0;
    const hd2 = () => { d++; };
    window.addEventListener("keydown", hd2);
    setHd(true); fire("F16");
    rec("D.bubble listener unaffected by HD gate", d === 1, "hits=" + d);
    window.removeEventListener("keydown", hd2);
    fire("F16");
    rec("D2.bubble listener removable", d === 1, "hits=" + d);

    // E · legacy stopImmediatePropagation semantics still expressible
    const order = [];
    const killer = (ev) => { order.push("capture"); ev.stopImmediatePropagation(); };
    const victim = () => { order.push("bubble"); };
    window.addEventListener("keydown", killer, true);
    window.addEventListener("keydown", victim);
    setHd(false); fire("F17");
    rec("E.legacy swallow preserved when HD off", order.join(",") === "capture", "order=" + order.join(","));
    order.length = 0;
    setHd(true); fire("F17");
    rec("E2.legacy cover inert when HD on", order.join(",") === "bubble", "order=" + order.join(","));
    window.removeEventListener("keydown", killer, true);
    window.removeEventListener("keydown", victim);

    // F · idempotent installation (re-running the snippet must not double-wrap)
    const before = window.__DD_KEY_GUARD__ ? window.__DD_KEY_GUARD__.count() : -1;
    setHd(false);
    let f = 0;
    const hf = () => { f++; };
    window.addEventListener("keydown", hf, true);
    fire("F18");
    rec("F.single delivery for guarded listener", f === 1, "hits=" + f);
    window.removeEventListener("keydown", hf, true);
    rec("F2.guard registry returns to baseline", !window.__DD_KEY_GUARD__ || window.__DD_KEY_GUARD__.count() === before,
      "before=" + before + " after=" + (window.__DD_KEY_GUARD__ ? window.__DD_KEY_GUARD__.count() : "n/a"));
    setHd(false);
  } catch (e) {
    rec("guard.spec-crash", false, e && e.message);
  }
  return out;
};

/* -------------------------------- driver -------------------------------- */
(async () => {
  const puppeteer = require("puppeteer-core");
  const chromium = (require("@sparticuz/chromium").default) || require("@sparticuz/chromium");

  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const guard = extractGuard(html);

  const srv = await startServer();
  const browser = await puppeteer.launch({
    args: [...chromium.args, "--no-sandbox", "--disable-gpu-sandbox", "--autoplay-policy=no-user-gesture-required"],
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    defaultViewport: { width: 1440, height: 900 }
  });

  const report = {
    when: new Date().toISOString(),
    build: {
      file: "index.html",
      bytes: Buffer.byteLength(html, "utf8"),
      sha256: require("crypto").createHash("sha256").update(fs.readFileSync(path.join(ROOT, "index.html"))).digest("hex"),
      guardSnippet: guard.mode,
      guardLines: guard.code.split("\n").length
    },
    env: { chromium: await browser.version(), ua: await (await browser.newPage()).evaluate(() => navigator.userAgent) },
    guard: [], integration: [], flow: [], pageErrors: [], httpIssues: [], notes: []
  };
  report.notes.push("Mando EMULADO sustituyendo navigator.getGamepads; NO se ha probado un mando físico.");

  /* ---------------- BLOQUE A · isolated guard unit spec ------------------ */
  const unit = await browser.newPage();
  unit.on("pageerror", (e) => report.pageErrors.push("unit: " + e.message));
  await unit.setContent(
    "<!doctype html><html><head><meta charset='utf-8'></head><body><div id='probe'></div>" +
    "<script>\n" + guard.code + "\n</script></body></html>",
    { waitUntil: "load" }
  );
  report.guard = await unit.evaluate(GUARD_SPEC);

  // second install of the same snippet must be inert (idempotency)
  const idem = await unit.evaluate((code) => {
    try { (0, eval)(code); return { ok: true, guard: !!window.__DD_KEY_GUARD__ }; }
    catch (e) { return { ok: false, err: e.message }; }
  }, guard.code);
  report.guard.push({
    name: "G.re-installing snippet is inert",
    ok: idem.ok === true,
    detail: JSON.stringify(idem)
  });
  await unit.close();

  /* ------------------ BLOQUE B+C · real engine integration --------------- */
  const page = await browser.newPage();
  page.on("pageerror", (e) => report.pageErrors.push(String(e.message || e)));
  page.on("response", (r) => { if (r.status() >= 400) report.httpIssues.push({ http: r.status(), url: r.url() }); });
  page.on("requestfailed", (r) => report.httpIssues.push({ failed: r.url(), err: r.failure() && r.failure().errorText }));

  await page.evaluateOnNewDocument(() => {
    window.__TEST_PAD = { connected: false, axes: [0, 0, 0, 0], buttons: [{ pressed: false, value: 0 }] };
    const real = navigator.getGamepads ? navigator.getGamepads.bind(navigator) : null;
    navigator.getGamepads = function () {
      const pads = real ? Array.from(real.call(navigator) || []) : [];
      pads[0] = window.__TEST_PAD.connected ? window.__TEST_PAD : null;
      return pads;
    };
    window.__TEST_PAD_SET = function (mx, my, interact) {
      window.__TEST_PAD.connected = true;
      window.__TEST_PAD.axes = [mx, my, 0, 0];
      window.__TEST_PAD.buttons = [{ pressed: !!interact, value: interact ? 1 : 0 }];
    };
    window.__TEST_PAD_OFF = function () { window.__TEST_PAD.connected = false; };
  });

  await page.goto("http://127.0.0.1:" + PORT + "/index.html", { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction(() => window.DD_UI && window.DD_HUB && window.DD_CINE && window.__DD_BRIDGE && window.DD_WORLD, { timeout: 120000 });
  await sleep(1500);

  const it = async (name, fn) => {
    try { report.integration.push({ check: name, ok: true, detail: await fn() }); }
    catch (e) { report.integration.push({ check: name, ok: false, detail: String(e.message || e) }); }
  };

  await it("B1.HD-on: cover no longer swallows keydown", async () => {
    const r = await page.evaluate(() => {
      const marks = [];
      window.addEventListener("keydown", () => marks.push("bubble"));
      document.body.classList.add("dd-highres-edition");
      const ev = new KeyboardEvent("keydown", { key: "F13", code: "F13", bubbles: true, cancelable: true });
      window.dispatchEvent(ev);
      return { marks, defaultPrevented: ev.defaultPrevented, hd: document.body.classList.contains("dd-highres-edition") };
    });
    if (r.marks.length !== 1 || r.defaultPrevented) throw new Error(JSON.stringify(r));
    return JSON.stringify(r);
  });

  await it("B2.HD-off: legacy swallow restored byte-for-byte", async () => {
    const r = await page.evaluate(() => {
      const marks = [];
      const h = (ev) => { marks.push("bubble"); };
      window.addEventListener("keydown", h);
      document.body.classList.remove("dd-highres-edition");
      const ev = new KeyboardEvent("keydown", { key: "F13", code: "F13", bubbles: true, cancelable: true });
      window.dispatchEvent(ev);
      const res = { marks: marks.slice(), defaultPrevented: ev.defaultPrevented, hd: document.body.classList.contains("dd-highres-edition") };
      document.body.classList.add("dd-highres-edition");
      return res;
    });
    if (r.marks.length !== 0 || r.defaultPrevented !== true) throw new Error(JSON.stringify(r));
    return JSON.stringify(r) + " -> secuestro heredado intacto";
  });

  await it("B4.guard registry holds only the legacy cover listeners", async () => {
    const r = await page.evaluate(() => {
      const g = window.__DD_KEY_GUARD__;
      return { installed: !!g, count: g ? g.count() : -1, neutralized: g ? g.capturesLegacyKeyboard() : null };
    });
    if (!r.installed || r.count !== 2) throw new Error("unexpected guard registry: " + JSON.stringify(r));
    return JSON.stringify(r);
  });

  await it("B3.HD restored before flow", async () => {
    const hd = await page.evaluate(() => {
      document.body.classList.add("dd-highres-edition");
      return document.body.classList.contains("dd-highres-edition");
    });
    if (!hd) throw new Error("HD class lost");
    return "body.dd-highres-edition=true";
  });

  /* ------------------------------ flow helpers --------------------------- */
  const KEYMAP = { Space: " ", KeyE: "e", KeyW: "w", KeyA: "a", KeyS: "s", KeyD: "d" };
  const key = async (code, ms) => {
    const k = KEYMAP[code] || code;
    await page.keyboard.down(k);
    await sleep(ms || 120);
    await page.keyboard.up(k);
  };
  const snap = () => page.evaluate(() => {
    const b = window.__DD_BRIDGE;
    return { snapshot: b.getSnapshot(), paused: b.isPaused(), running: b.isRunning(), hub: window.DD_HUB.getState(), cine: window.DD_CINE.getState() };
  });
  const holdUntil = async (k, condFn, maxMs) => {
    await page.keyboard.down(k);
    const t0 = Date.now();
    let ok = false;
    while (Date.now() - t0 < (maxMs || 8000)) {
      await sleep(150);
      ok = await page.evaluate(condFn);
      if (ok) break;
    }
    await page.keyboard.up(k);
    return ok;
  };
  const flow = async (name, fn) => {
    try { report.flow.push({ step: name, ok: true, detail: await fn() }); }
    catch (e) { report.flow.push({ step: name, ok: false, detail: String(e.message || e) }); }
  };

  /* -------------------------------- C · flow ----------------------------- */
  await flow("menu.visible", async () => {
    const v = await page.evaluate(() => {
      const m = document.getElementById("dd-main-menu");
      return {
        display: getComputedStyle(m).display,
        btns: document.querySelectorAll("#dd-menu-nav .dd-menu-btn").length,
        hd: document.body.classList.contains("dd-highres-edition"),
        cover: (() => { const c = document.getElementById("ddc-cover"); return c ? getComputedStyle(c).display : "absent"; })()
      };
    });
    if (v.btns !== 5 || v.display === "none" || !v.hd) throw new Error(JSON.stringify(v));
    if (v.cover !== "none" && v.cover !== "absent") throw new Error("legacy cover visible: " + v.cover);
    return JSON.stringify(v);
  });

  await page.screenshot({ path: path.join(OUT_DIR, "step_1_menu.png") }).catch(() => {});

  await flow("menu.keyboard-nav", async () => {
    const before = await page.evaluate(() => document.querySelector("#dd-menu-nav .dd-selected").getAttribute("data-action"));
    await key("ArrowDown", 250);
    await sleep(250);
    const after = await page.evaluate(() => document.querySelector("#dd-menu-nav .dd-selected").getAttribute("data-action"));
    if (before === after) throw new Error("selection did not move from " + before);
    return before + " -> " + after;
  });

  await flow("menu.enter-hub + cinematic", async () => {
    const ok = await page.evaluate(() => {
      const b = document.querySelector('#dd-menu-nav .dd-menu-btn[data-action="hub"]');
      if (!b) return false; b.click(); return true;
    });
    if (!ok) throw new Error("hub button missing");
    await sleep(500);
    const s = await snap();
    if (!s.cine) throw new Error("intro cinematic did not start");
    return JSON.stringify(s.cine);
  });

  await flow("cinematic.skip -> HUB", async () => {
    await key("Space", 180);
    await page.waitForFunction(() => window.DD_HUB.isActive(), { timeout: 20000 });
    const s = await snap();
    if (!s.hub.active) throw new Error("HUB not active");
    return "hubActive=true cine=" + JSON.stringify(s.cine);
  });

  await page.screenshot({ path: path.join(OUT_DIR, "step_2_hub.png") }).catch(() => {});

  await flow("hub.no-run => engine not paused", async () => {
    const s = await snap();
    if (s.paused !== false) throw new Error("paused with no live run: " + s.paused);
    return "paused=" + s.paused + " running=" + s.running;
  });

  await flow("hub.keyboard-move (WASD reaches HUB)", async () => {
    const x0 = (await snap()).hub.x;
    const ok = await holdUntil("d", () => window.DD_HUB.getState().x > 940, 6000);
    const x1 = (await snap()).hub.x;
    if (!ok || x1 - x0 < 20) throw new Error("no WASD movement in HUB: " + x0 + " -> " + x1);
    return x0 + " -> " + x1;
  });

  await flow("hub.emulated-gamepad-move", async () => {
    const x0 = (await snap()).hub.x;
    await page.evaluate(() => window.__TEST_PAD_SET(1, 0, false));
    await sleep(900);
    await page.evaluate(() => window.__TEST_PAD_OFF());
    const x1 = (await snap()).hub.x;
    if (x1 - x0 < 10) throw new Error("no emulated gamepad movement: " + x0 + " -> " + x1);
    return x0 + " -> " + x1 + " (mando emulado)";
  });

  await flow("hub.walk-to-descent-pad", async () => {
    // align X to the cyan pad, then walk south until the station is in range
    await holdUntil("d", () => window.DD_HUB.getState().x >= 875, 8000);
    await holdUntil("a", () => window.DD_HUB.getState().x <= 885, 8000);
    const ok = await holdUntil("s", () => window.DD_HUB.getState().nearStation === "descent", 10000);
    const st = (await snap()).hub;
    if (!ok) throw new Error("descent pad not reached: " + JSON.stringify(st));
    return JSON.stringify(st);
  });

  await flow("hub.descent-interact [E]", async () => {
    await key("KeyE", 200);
    await sleep(500);
    const s = await snap();
    if (s.hub.active) throw new Error("HUB still active after [E]");
    return "hubActive=false cine=" + JSON.stringify(s.cine);
  });

  await flow("descent.cinematic -> run starts", async () => {
    await key("Space", 200);
    await page.waitForFunction(() => window.__DD_BRIDGE.getSnapshot().running === true, { timeout: 25000 });
    await sleep(600);
    const s = await snap();
    return "running=" + s.running + " room=" + s.snapshot.room + " cine=" + JSON.stringify(s.cine);
  });

  await flow("run.pause released after descent", async () => {
    const s = await snap();
    if (s.paused !== false || s.snapshot.paused !== false) throw new Error("engine paused after descent: " + JSON.stringify({ paused: s.paused, snap: s.snapshot.paused }));
    if (!s.snapshot.running) throw new Error("run not running");
    return JSON.stringify({ paused: s.paused, running: s.snapshot.running, hp: s.snapshot.hp, room: s.snapshot.room, circle: s.snapshot.circle });
  });

  await page.screenshot({ path: path.join(OUT_DIR, "step_3_run.png") }).catch(() => {});

  await flow("run.keyboard-move (engine input intact)", async () => {
    const p0 = (await snap()).snapshot.player;
    await page.evaluate((x) => { window.__P0X = x; }, p0.x);
    await page.keyboard.down("d");
    let ok = false;
    const t0 = Date.now();
    while (Date.now() - t0 < 7000) {
      await sleep(150);
      ok = await page.evaluate(() => {
        const p = window.__DD_BRIDGE.getSnapshot().player;
        return !!p && Math.abs(p.x - window.__P0X) > 5;
      });
      if (ok) break;
    }
    await page.keyboard.up("d");
    const p1 = (await snap()).snapshot.player;
    const dx = Math.abs(p1.x - p0.x) + Math.abs(p1.y - p0.y);
    if (!ok || dx <= 5) throw new Error("player did not move: dx=" + dx.toFixed(1));
    return "delta=" + dx.toFixed(1);
  });

  await flow("run.simulated frames + fire", async () => {
    const r = await page.evaluate(() => {
      const b = window.__DD_BRIDGE;
      const before = b.getSnapshot();
      const after = b.testStep({ right: true, fire: true, aim: 0 }, 40);
      return { beforeHp: before.hp, afterHp: after.hp, room: after.room, dead: after.dead, enemies: after.enemies.length };
    });
    if (r.dead) throw new Error("died during 40 simulated frames");
    return JSON.stringify(r);
  });

  await flow("run.re-enter HUB freezes live run", async () => {
    const ok = await page.evaluate(() => { const b = document.getElementById("dd-btn-enter-hub"); if (!b) return false; b.click(); return true; });
    if (!ok) throw new Error("HUD enter-hub button missing");
    await page.waitForFunction(() => window.DD_HUB.isActive(), { timeout: 15000 });
    await sleep(400);
    const s = await snap();
    if (s.paused !== true) throw new Error("live run NOT frozen in HUB: paused=" + s.paused);
    return "paused=" + s.paused + " running=" + s.snapshot.running;
  });

  await flow("second descent releases pause again", async () => {
    await holdUntil("d", () => window.DD_HUB.getState().x >= 875, 8000);
    await holdUntil("a", () => window.DD_HUB.getState().x <= 885, 8000);
    const near = await holdUntil("s", () => window.DD_HUB.getState().nearStation === "descent", 10000);
    if (!near) throw new Error("pad not reached: " + JSON.stringify((await snap()).hub));
    await key("KeyE", 200);
    await sleep(400);
    await key("Space", 200);
    await page.waitForFunction(() => window.__DD_BRIDGE.getSnapshot().running === true && !window.DD_HUB.isActive(), { timeout: 25000 });
    await sleep(600);
    const s = await snap();
    if (s.paused !== false) throw new Error("pause NOT released after 2nd descent: " + s.paused);
    return "pausedAfter=" + s.paused + " running=" + s.snapshot.running + " room=" + s.snapshot.room;
  });

  await flow("run.stable after descent (no leak / no death)", async () => {
    const a = await snap();
    await sleep(2000);
    const b = await snap();
    if (b.paused !== false) throw new Error("engine re-paused on its own");
    if (b.snapshot.dead) throw new Error("player dead");
    const guard = await page.evaluate(() => {
      const g = window.__DD_KEY_GUARD__;
      return { count: g ? g.count() : -1, neutralized: g ? g.capturesLegacyKeyboard() : null };
    });
    if (guard.count !== 2) throw new Error("guard registry leaked after full flow: " + JSON.stringify(guard));
    return JSON.stringify({ hp: b.snapshot.hp, room: b.snapshot.room, paused: b.paused, running: b.snapshot.running, guardRegistry: guard.count });
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(OUT_DIR, process.env.DD_SHOT_NAME || "run_state.png") }).catch(() => {});

  const sum = (arr, k) => ({ total: arr.length, passed: arr.filter((x) => x[k]).length });
  report.summary = {
    guard: sum(report.guard, "ok"),
    integration: sum(report.integration, "ok"),
    flow: sum(report.flow, "ok"),
    pageErrors: report.pageErrors.length,
    httpIssues: report.httpIssues.length
  };
  report.verdict =
    report.summary.guard.passed === report.summary.guard.total &&
    report.summary.integration.passed === report.summary.integration.total &&
    report.summary.flow.passed === report.summary.flow.total &&
    report.pageErrors.length === 0 ? "PASS" : "FAIL";

  const file = path.join(OUT_DIR, process.env.DD_EVIDENCE_NAME || "regression.json");
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
  for (const g of report.guard) if (!g.ok) console.log("GUARD FAIL:", g.name, "|", g.detail);
  for (const g of report.integration) if (!g.ok) console.log("INTEGRATION FAIL:", g.check, "|", g.detail);
  for (const g of report.flow) if (!g.ok) console.log("FLOW FAIL:", g.step, "|", g.detail);
  console.log("verdict:", report.verdict, "->", file);

  await browser.close();
  srv.close();
  process.exit(report.verdict === "PASS" ? 0 : 1);
})().catch((e) => { console.error("HARNESS ERROR:", e); process.exit(2); });
