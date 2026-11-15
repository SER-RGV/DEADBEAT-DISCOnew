/* DEADBEAT DISCO — diagnóstico de `#dd-boot-frame.is-failed` en headless (T07 QA · bloque 3).
 *
 *   LD_LIBRARY_PATH=/tmp/al2023/lib FONTCONFIG_PATH=/tmp/fonts node tools/art_master/probe_boot_failure.js <salida> [--w=1280 --h=720]
 *
 * Reproduce la entrada "por atajo" de las sondas anteriores (esperar DD_ASSETS y llamar a
 * DD_HUB.enter()/exitToRun() mientras DD_BOOT sigue ejecutando sus pasos) y registra qué
 * paso falla, con qué mensaje y en qué instante, a partir de DD_BOOT.getErrorRegistry(),
 * getEvidence() y getTrace(). No oculta ni altera el panel de error: sólo lo documenta.
 */
process.env.LD_LIBRARY_PATH = "/tmp/al2023/lib:/tmp/al2023:" + (process.env.LD_LIBRARY_PATH || "");
process.env.FONTCONFIG_PATH = "/tmp/fonts";
const fs = require("fs"), path = require("path");
const pw = require("/tmp/browser/node_modules/playwright-core").chromium;
const OUT = process.argv[2] || "/tmp/ddqa/bootfail";
const arg = (k, d) => { const m = process.argv.find(a => a.startsWith("--" + k + "=")); return m ? m.slice(k.length + 3) : d; };
const W = Number(arg("w", 1280)), H = Number(arg("h", 720));
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const sparticuz = (await import("file:///tmp/browser/node_modules/@sparticuz/chromium/build/index.js")).default;
  const browser = await pw.launch({ executablePath: "/tmp/chromium", args: [...sparticuz.args.filter(a => !a.startsWith("--headless") && !a.startsWith("--window-size")), "--no-sandbox"], headless: true });
  const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
  const errs = []; page.on("pageerror", e => errs.push(String(e).slice(0, 300)));
  const t0 = Date.now();
  const snap = () => page.evaluate(() => {
    const B = window.DD_BOOT, root = document.getElementById("dd-boot-frame");
    const ev = B && B.getEvidence ? B.getEvidence() : null;
    return { state: B && B.getState ? B.getState().state : null, classes: root ? root.className : null, stage: (document.getElementById("dd-boot-stage") || {}).textContent || null,
             loadFinished: ev && ev.loadFinished, watchdogFired: ev && ev.watchdogFired, errors: B && B.getErrorRegistry ? B.getErrorRegistry() : null,
             errPanel: (document.getElementById("dd-boot-err") || {}).hidden, errText: ((document.getElementById("dd-boot-err") || {}).textContent || "").replace(/\s+/g, " ").slice(0, 300),
             hub: !!(window.DD_HUB && window.DD_HUB.isActive && window.DD_HUB.isActive()), assets: window.DD_ASSETS && window.DD_ASSETS.stats ? window.DD_ASSETS.stats() : null };
  });
  const timeline = [];
  const log = async (tag) => { const s = await snap(); s.t = Date.now() - t0; s.tag = tag; timeline.push(s); console.log(String(s.t).padStart(6), tag, s.state, "|", s.classes, "|", s.stage, "| errores:", (s.errors || []).length); return s; };

  // --- ruta "por atajo" de probe_pickups/probe_enemies: idéntica a la que producía is-failed ---
  await page.goto("http://127.0.0.1:8080/index.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  await log("domcontentloaded");
  await page.waitForFunction(() => window.DD_ASSETS && (() => { const s = window.DD_ASSETS.stats(); return s.loaded + s.errors >= s.registered; })(), null, { timeout: 120000 });
  await log("DD_ASSETS completo");
  await page.waitForTimeout(400);
  await page.evaluate(() => { try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} });
  await page.evaluate(() => { try { if (window.DD_HUB && !(window.DD_HUB.isActive && window.DD_HUB.isActive())) window.DD_HUB.enter(); } catch (e) {} });
  await log("DD_HUB.enter() forzado");
  try { await page.waitForFunction(() => window.DD_HUB && window.DD_HUB.isActive && window.DD_HUB.isActive(), null, { timeout: 15000 }); } catch (e) {}
  await page.evaluate(() => { try { window.DD_HUB.exitToRun(); } catch (e) {} });
  await log("DD_HUB.exitToRun() forzado");
  let last = null;
  for (let i = 0; i < 90; i++) { await sleep(1000); last = await log("t+" + (i + 1) + "s"); if (/is-failed/.test(last.classes || "") || last.state === "MAIN_MENU") break; }
  await sleep(1500); last = await log("final");
  fs.writeFileSync(path.join(OUT, "boot_failure_shot_" + H + ".png"), await page.screenshot({ type: "png", timeout: 90000 }).catch(() => Buffer.alloc(0)));
  const trace = await page.evaluate(() => (window.DD_BOOT && window.DD_BOOT.getTrace) ? window.DD_BOOT.getTrace() : null);
  const steps = await page.evaluate(() => Array.from(document.querySelectorAll("#dd-boot-steps li, .dd-boot-step")).map(li => ({ id: li.getAttribute("data-step") || li.id, cls: li.className, txt: li.textContent.replace(/\s+/g, " ").trim().slice(0, 120) })));
  const result = { viewport: { w: W, h: H }, failed: /is-failed/.test(last.classes || ""), last: last, timeline: timeline, trace: trace, steps: steps, pageErrors: errs };
  fs.writeFileSync(path.join(OUT, "boot_failure_" + H + ".json"), JSON.stringify(result, null, 1));
  console.log("RESULTADO:", result.failed ? "is-failed REPRODUCIDO" : "sin is-failed", "· errores:", JSON.stringify(last.errors));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
