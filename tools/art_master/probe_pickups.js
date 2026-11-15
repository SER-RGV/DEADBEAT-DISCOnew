process.env.LD_LIBRARY_PATH = "/tmp/al2023/lib:/tmp/al2023:" + (process.env.LD_LIBRARY_PATH || "");
process.env.FONTCONFIG_PATH = "/tmp/fonts";
const fs = require("fs"), path = require("path");
const pw = require("/tmp/browser/node_modules/playwright-core").chromium;
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const sparticuz = (await import("file:///tmp/browser/node_modules/@sparticuz/chromium/build/index.js")).default;
  const browser = await pw.launch({ executablePath: "/tmp/chromium", args: [...sparticuz.args.filter(a => !a.startsWith("--headless") && !a.startsWith("--window-size")), "--no-sandbox"], headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", e => errs.push(String(e).slice(0, 200)));
  await page.goto("http://127.0.0.1:8080/index.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => window.DD_ASSETS && (() => { const s = window.DD_ASSETS.stats(); return s.loaded + s.errors >= s.registered; })(), null, { timeout: 120000 });
  await page.waitForTimeout(400);
  await page.evaluate(() => { try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} });
  await page.waitForTimeout(300);
  await page.evaluate(() => { try { if (window.DD_HUB && !(window.DD_HUB.isActive && window.DD_HUB.isActive())) window.DD_HUB.enter(); } catch (e) {} });
  try { await page.waitForFunction(() => window.DD_HUB && window.DD_HUB.isActive && window.DD_HUB.isActive(), null, { timeout: 15000 }); } catch (e) {}
  await page.waitForTimeout(300);
  await page.evaluate(() => { try { window.DD_HUB.exitToRun(); } catch (e) {} });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} try { window.DD_OPENING && window.DD_OPENING.skip(); } catch (e) {} });
  await page.waitForFunction(() => window.DMO && window.DMO.observe().hud && window.DMO.observe().hud.running, null, { timeout: 60000 });
  await page.evaluate(() => { try { window.DMO.debug.holdSpawns(true); } catch (e) {} try { window.DMO.debug.killAll(); } catch (e) {} try { window.DMO.debug.exploreGoTo(2); } catch (e) {} });
  await page.waitForTimeout(800);
  await page.evaluate(() => { try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} try { window.DMO.debug.holdSpawns(true); } catch (e) {} try { window.DMO.debug.killAll(); } catch (e) {} });
  const res = await page.evaluate(() => {
    const B = window.__DD_BRIDGE; const s = B.getSnapshot(); const rr = s.roomRect;
    const cx = Math.round(rr.x + rr.w / 2), cy = Math.round(rr.y + rr.h / 2);
    try { window.DMO.debug.teleport(cx, cy + 150); } catch (e) {}
    const types = ["heart", "shield", "boost", "credits", "damageUp", "fireUp", "companion", "mutation", "bomb", "speedUp", "turret"];
    const ok = {}; let i = 0;
    for (const t of types) { const col = i % 6, row = Math.floor(i / 6); ok[t] = B.spawnPickupAt(t, cx - 250 + col * 100, cy - 90 + row * 110); i++; }
    B.testStep({ aim: -1.57 }, 40);
    return { ok: ok, cam: window.DMO.camera(), n: B.getActors ? null : null };
  });
  // lienzo del juego (sin superposiciones DOM), como la sonda de escala
  const canvasShot = async (name, region, q) => {
    const url = await page.evaluate(([r, q]) => {
      const cv = Array.from(document.querySelectorAll("canvas")).filter(c => c.getBoundingClientRect().width > 0).sort((a, b) => b.width * b.height - a.width * a.height)[0];
      const sx = cv.width / window.innerWidth, sy = cv.height / window.innerHeight;
      const oc = document.createElement("canvas");
      const rr = r || { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };
      oc.width = rr.w; oc.height = rr.h;
      const c2 = oc.getContext("2d"); c2.imageSmoothingQuality = "high";
      c2.drawImage(cv, rr.x * sx, rr.y * sy, rr.w * sx, rr.h * sy, 0, 0, rr.w, rr.h);
      return oc.toDataURL(q ? "image/jpeg" : "image/png", q || undefined);
    }, [region, q]);
    fs.writeFileSync(path.join(OUT, name), Buffer.from(url.split(",")[1], "base64"));
  };
  await page.evaluate(() => { try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} window.__DD_BRIDGE.testStep({ aim: -1.57 }, 10); });
  await canvasShot("t06_ingame_full_1080.jpg", null, 0.88);
  await canvasShot("t06_ingame_pickups_crop.png", { x: 560, y: 300, w: 800, h: 440 });
  // HUD (DOM): esperar a que desaparezca la superposición de descenso y capturar la pantalla real
  for (let i = 0; i < 12; i++) {
    const over = await page.evaluate(() => { const o = document.querySelector('[class*="descent"],[id*="descent"],[class*="cine"]'); return !!(o && getComputedStyle(o).opacity !== "0" && getComputedStyle(o).display !== "none"); });
    if (!over) break; await page.waitForTimeout(500);
  }
  await page.waitForTimeout(600);
  // en headless la secuencia de descenso (canvas de transición) no avanza: se ocultan las capas que
  // tapan el centro de la pantalla salvo el lienzo del juego y el HUD, sólo para la captura del HUD
  const hidden = await page.evaluate(() => {
    const main = Array.from(document.querySelectorAll("canvas")).filter(c => c.getBoundingClientRect().width > 0).sort((a, b) => b.width * b.height - a.width * a.height)[0];
    const out = [];
    for (const el of document.elementsFromPoint(window.innerWidth / 2, window.innerHeight / 2)) {
      if (el === main || el.contains(main) || el === document.body || el === document.documentElement) continue;
      if (el.closest && el.closest('[id*="hud"],[class*="hud"],.dd-hud,#ui')) continue;
      const r = el.getBoundingClientRect(); if (r.width < window.innerWidth * 0.6) continue;
      el.style.setProperty("display", "none", "important"); out.push((el.tagName + "#" + el.id + "." + el.className).slice(0, 60));
    }
    return out;
  });
  console.log("hidden overlays:", JSON.stringify(hidden));
  await page.waitForTimeout(300);
  const hud = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 760, height: 220 } });
  fs.writeFileSync(path.join(OUT, "t06_hud_topleft.png"), hud);
  const hud2 = await page.screenshot({ type: "png", clip: { x: 0, y: 860, width: 1920, height: 220 } });
  fs.writeFileSync(path.join(OUT, "t06_hud_bottom.png"), hud2);
  const dom = await page.screenshot({ type: "jpeg", quality: 80 });
  fs.writeFileSync(path.join(OUT, "t06_dom_full_1080.jpg"), dom);
  fs.writeFileSync(path.join(OUT, "t06_probe.json"), JSON.stringify({ res: res, errs: errs, at: new Date().toISOString() }, null, 1));
  console.log(JSON.stringify(res), "errs", errs.length);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
