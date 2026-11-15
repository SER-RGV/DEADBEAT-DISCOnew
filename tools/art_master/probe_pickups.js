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
  // ---- RELIQUIAS (T06 turno 2): el motor las presenta como tarjetas DOM del cofre
  // (#shot-choice-overlay) y como lista de pasivos de la pausa (#rogue71-inventory .rogue71-items);
  // el build sustituye el glifo por la ilustración relic_<id> cuando existe en el registro.
  const relArg = process.argv.find(a => a.startsWith("--relics="));
  const relics = relArg ? relArg.slice(9).split(",") : ["needle", "lowpass", "magnet", "pact", "echo", "coil", "prism", "tempo"];
  // Prueba del fallback (T06 §1.7): con un doble de DD_ASSETS.get que niega los relic_* la tarjeta debe conservar el glifo.
  const fallbackRes = await page.evaluate(() => {
    const R = window.DMO && window.DMO.rogue; if (!R || !R.debug) return { error: "sin DMO.rogue.debug" };
    // DD_ASSETS está congelado (Object.freeze): se sustituye el objeto entero por un doble que niega relic_*.
    const real = window.DD_ASSETS;
    const out = { cards: [], restored: false, stubApplied: false };
    try {
      const stub = Object.assign({}, real, { get: function (id) { return /^relic_/.test(String(id)) ? null : real.get(id); } });
      window.DD_ASSETS = stub; out.stubApplied = window.DD_ASSETS === stub && window.DD_ASSETS.get("relic_pact") === null;
      R.debug({ action: "chest", kind: "clear" }); R.debug({ action: "open" });
      for (const b of document.querySelectorAll("#shot-choice-overlay .shot-card50")) {
        const ic = b.querySelector(".shot-icon");
        out.cards.push({ title: (b.querySelector("strong") || {}).textContent, art: !!(ic && ic.querySelector("img")), glyph: ic ? ic.textContent : null, hasClass: !!(ic && ic.classList.contains("has-relic-art")) });
      }
      R.debug({ action: "back" });
    } finally { window.DD_ASSETS = real; out.restored = window.DD_ASSETS === real && !!real.get("relic_pact"); }
    return out;
  });
  // Captura del cofre en modo reserva (glifo) para la evidencia: se repite la apertura con el doble activo.
  await page.evaluate(() => { const real = window.DD_ASSETS; window.__ddRealAssets = real; window.DD_ASSETS = Object.assign({}, real, { get: function (id) { return /^relic_/.test(String(id)) ? null : real.get(id); } }); const R = window.DMO.rogue; R.debug({ action: "chest", kind: "clear" }); R.debug({ action: "open" }); });
  await page.waitForTimeout(400);
  try { const ov = await page.$("#shot-choice-overlay"); if (ov) fs.writeFileSync(path.join(OUT, "t06_relic_chest_fallback_glyph.png"), await ov.screenshot({ type: "png", timeout: 90000 })); } catch (e) { console.log("captura fallback fallida:", String(e).slice(0, 100)); }
  await page.evaluate(() => { try { window.DMO.rogue.debug({ action: "back" }); } catch (e) {} window.DD_ASSETS = window.__ddRealAssets; delete window.__ddRealAssets; });
  const relicRes = await page.evaluate((relics) => {
    const R = window.DMO && window.DMO.rogue; const out = { granted: [], chest: null, cards: [], list: [], restored: [] };
    if (!R || !R.debug) return { error: "sin DMO.rogue.debug" };
    // el cofre se abre ANTES de conceder pasivos: con la colección llena el motor no ofrece tarjeta de objeto
    try { R.debug({ action: "chest", kind: "clear" }); R.debug({ action: "open" }); out.chest = true; } catch (e) { out.chest = String(e); }
    const ov = document.getElementById("shot-choice-overlay");
    out.overlayVisible = !!(ov && ov.classList.contains("visible"));
    for (const b of document.querySelectorAll("#shot-choice-overlay .shot-card50")) {
      const ic = b.querySelector(".shot-icon"); const img = ic && ic.querySelector("img.dd-relic-icon");
      out.cards.push({ id: b.id, title: (b.querySelector("strong") || {}).textContent, art: img ? img.src.slice(0, 48) : null, glyph: ic ? ic.textContent : null });
    }
    return out;
  }, relics);
  await page.waitForTimeout(500);
  const ovShot = await page.screenshot({ type: "png" });
  fs.writeFileSync(path.join(OUT, "t06_relic_chest_overlay_1080.png"), ovShot);
  const ovBox = await page.evaluate(() => { const o = document.getElementById("shot-choice-options") || document.getElementById("shot-choice-overlay"); if (!o) return null; const r = o.getBoundingClientRect(); return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: Math.min(1920, r.width + 20), height: Math.min(1080, r.height + 20) }; });
  if (ovBox && ovBox.width > 40 && ovBox.height > 40) fs.writeFileSync(path.join(OUT, "t06_relic_chest_cards.png"), await page.screenshot({ type: "png", clip: ovBox }));
  // lista de pasivos: la pausa real (Escape) y, si en headless no se muestra, la sección tal cual la pinta el motor
  const granted = await page.evaluate((relics) => {
    const R = window.DMO.rogue; const g = [];
    try { R.debug({ action: "back" }); } catch (e) {}
    for (const id of relics.slice(0, 6)) { try { R.debug({ action: "item", id: id }); g.push(id); } catch (e) { g.push(id + "!" + e); } }
    return g;
  }, relics);
  relicRes.granted = granted;
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);
  const listInfo = await page.evaluate(() => {
    const inv = document.getElementById("rogue71-inventory"); if (!inv) return { error: "sin rogue71-inventory" };
    const items = Array.from(inv.querySelectorAll(".rogue71-items p")).map(p => ({ text: (p.querySelector("b") || p).textContent.trim().slice(0, 40), art: !!p.querySelector("img.dd-relic-icon-sm") }));
    const r = inv.getBoundingClientRect(); const vis = r.width > 0 && r.height > 0 && getComputedStyle(inv).visibility !== "hidden";
    let shown = (vis && r.y < window.innerHeight && r.y + r.height > 0) ? "pause+clone" : "clone";
    {
      // la pausa real queda registrada en t06_relic_pause_full_1080.png; para la evidencia de la lista
      // se clona la sección en un panel limpio (en headless la real sale parcial, tapada o fuera de pantalla)
      const host = document.createElement("div"); host.id = "dd-qa-relic-host";
      host.style.cssText = "position:fixed;left:40px;top:40px;width:720px;max-height:1000px;overflow:auto;background:#07030dee;border:1px solid #67e8f9;padding:16px;z-index:99999;color:#e5e7eb;font:13px system-ui";
      host.appendChild(inv.cloneNode(true)); document.body.appendChild(host);
    }
    return { items: items, shown: shown, rect: { x: r.x, y: r.y, w: r.width, h: r.height } };
  });
  await page.waitForTimeout(300);
  const listBox = await page.evaluate(() => { const o = document.getElementById("dd-qa-relic-host") || document.getElementById("rogue71-inventory"); const r = o.getBoundingClientRect(); return { x: Math.max(0, r.x - 8), y: Math.max(0, r.y - 8), width: Math.min(1920, r.width + 16), height: Math.min(1080, r.height + 16) }; });
  await page.evaluate(() => { const h = document.getElementById("dd-qa-relic-host"); if (h) h.style.display = "none"; });
  await page.waitForTimeout(200);
  fs.writeFileSync(path.join(OUT, "t06_relic_pause_full_1080.png"), await page.screenshot({ type: "png" }));
  await page.evaluate(() => { const h = document.getElementById("dd-qa-relic-host"); if (h) h.style.display = ""; });
  await page.waitForTimeout(200);
  if (listBox.width > 40 && listBox.height > 40) fs.writeFileSync(path.join(OUT, "t06_relic_pause_list.png"), await page.screenshot({ type: "png", clip: listBox }));
  fs.writeFileSync(path.join(OUT, "t06_probe.json"), JSON.stringify({ res: res, fallbackGlyph: fallbackRes, relics: relicRes, pauseList: listInfo, errs: errs, at: new Date().toISOString() }, null, 1));
  console.log("fallbackGlyph:", JSON.stringify(fallbackRes));
  console.log(JSON.stringify(res), "errs", errs.length);
  console.log("relics:", JSON.stringify(relicRes));
  console.log("pauseList:", JSON.stringify(listInfo));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
