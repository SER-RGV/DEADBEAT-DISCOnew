/* DEADBEAT DISCO — sonda del HUD por la RUTA REAL de arranque (T07 HUD · QA).
 *
 *   LD_LIBRARY_PATH=/tmp/al2023/lib FONTCONFIG_PATH=/tmp/fonts node tools/art_master/probe_hud.js <salida> [--w=1920 --h=1080]
 *
 * No oculta ninguna capa ni salta el arranque: recorre carga → gesto → intro (se
 * salta con una tecla real, como un jugador) → menú → NUEVA PARTIDA → descenso →
 * Refugio → incursión, y captura el HUD en cada estado. Si el arranque falla
 * (#dd-boot-frame.is-failed) lo documenta con DD_BOOT.getErrorRegistry()/getTrace()
 * y termina SIN capturar el HUD: esa prueba no se da por superada.
 *
 * Salidas (en <salida>/): boot_trace.json, hud_probe.json, hud_*.png, menu_*.png,
 * victory_*.png. `checks` en hud_probe.json resume cada comprobación con su evidencia.
 */
process.env.LD_LIBRARY_PATH = "/tmp/al2023/lib:/tmp/al2023:" + (process.env.LD_LIBRARY_PATH || "");
process.env.FONTCONFIG_PATH = "/tmp/fonts";
const fs = require("fs"), path = require("path");
const pw = require("/tmp/browser/node_modules/playwright-core").chromium;
const OUT = process.argv[2] || "/tmp/ddqa/hud";
const arg = (k, d) => { const m = process.argv.find(a => a.startsWith("--" + k + "=")); return m ? m.slice(k.length + 3) : d; };
const W = Number(arg("w", 1920)), H = Number(arg("h", 1080));
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const now = () => new Date().toISOString();

(async () => {
  const sparticuz = (await import("file:///tmp/browser/node_modules/@sparticuz/chromium/build/index.js")).default;
  const browser = await pw.launch({ executablePath: "/tmp/chromium", args: [...sparticuz.args.filter(a => !a.startsWith("--headless") && !a.startsWith("--window-size")), "--no-sandbox", "--mute-audio"], headless: true });
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  const page = await ctx.newPage();
  const errs = [], logs = [];
  page.on("pageerror", e => errs.push({ at: now(), msg: String(e).slice(0, 300) }));
  page.on("console", m => { const t = m.text(); if (/DD_BOOT|DD_UI|DD_HUB|DD_OPENING|error|Error/.test(t)) logs.push({ at: now(), type: m.type(), text: t.slice(0, 300) }); });
  const SHOT_TIMEOUT = Number(arg("shotTimeout", 120000));
  const report = { viewport: { w: W, h: H }, startedAt: now(), checks: [], shots: [], boot: null, errs: errs, logs: logs };
  /* Una comprobación con evidencia sólo se da por superada si la captura existe de verdad. */
  const check = (id, ok, detail, evidence) => {
    if (evidence && !fs.existsSync(path.join(OUT, evidence))) { ok = false; detail += " (SIN CAPTURA: " + evidence + " no se pudo obtener)"; }
    report.checks.push({ id, ok, detail, evidence: evidence || null }); console.log((ok ? "[OK] " : "[--] ") + id + " · " + detail);
    /* El informe se vuelca tras cada comprobación: si la pestaña cae (visto a 1920×1080 al entrar en la incursión) queda lo verificado. */
    try { fs.writeFileSync(path.join(OUT, "hud_probe.json"), JSON.stringify(Object.assign({}, report, { partial: true }), null, 1)); } catch (e) {}
  };
  /* Captura real de la página (DOM + lienzo), sin ocultar capas. Si el compositor headless no
     entrega un fotograma a tiempo, se registra el fallo en lugar de abortar la sonda. */
  const shot = async (name, clip) => {
    const t = Date.now();
    try {
      const buf = await page.screenshot({ type: "png", clip: clip || undefined, timeout: SHOT_TIMEOUT, animations: "allow", caret: "initial" });
      fs.writeFileSync(path.join(OUT, name), buf);
      report.shots.push({ name, ok: true, ms: Date.now() - t }); console.log("   captura " + name + " · " + (Date.now() - t) + " ms");
      return name;
    } catch (e) {
      report.shots.push({ name, ok: false, ms: Date.now() - t, err: String(e).split("\n")[0].slice(0, 160) }); console.log("   captura FALLIDA " + name + " · " + String(e).split("\n")[0].slice(0, 120));
      return null;
    }
  };
  /* Capas que tapan de verdad un punto del HUD: elementos fijos/absolutos visibles con z-index
     mayor o igual al del HUD (el HUD lleva pointer-events:none, así que elementFromPoint no sirve). */
  const occluders = (x, y) => page.evaluate(([x, y]) => {
    const hud = document.getElementById("dd-hud"); const zh = Number(getComputedStyle(hud).zIndex) || 0; const out = [];
    for (const el of document.body.querySelectorAll("body > *, body > * > *")) {
      if (el === hud || hud.contains(el)) continue;
      const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) < 0.05) continue;
      if (cs.position !== "fixed" && cs.position !== "absolute") continue;
      const z = Number(cs.zIndex); if (!(z >= zh)) continue;
      const r = el.getBoundingClientRect(); if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
      out.push(el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (el.className ? "." + String(el.className).trim().split(/\s+/).join(".") : "") + "@z" + z);
    }
    return { hudZ: zh, over: out };
  }, [x, y]);

  const t0 = Date.now();
  await page.goto("http://127.0.0.1:8080/index.html", { waitUntil: "domcontentloaded", timeout: 60000 });

  /* ---------- A. arranque real, observado sin intervenir ---------- */
  const bootTrace = [];
  const bootSnap = () => page.evaluate(() => {
    const B = window.DD_BOOT; const root = document.getElementById("dd-boot-frame");
    const st = B && B.getState ? B.getState() : null;
    const ev = B && B.getEvidence ? B.getEvidence() : null;
    const s = window.DD_ASSETS && window.DD_ASSETS.stats ? window.DD_ASSETS.stats() : null;
    const err = document.getElementById("dd-boot-err");
    return { state: st && st.state, classes: root ? root.className : null, assets: s, loadFinished: ev && ev.loadFinished, watchdogFired: ev && ev.watchdogFired,
             errors: ev ? ev.errors.length : null, errHidden: err ? err.hidden : null, stage: (document.getElementById("dd-boot-stage") || {}).textContent || null };
  });
  let last = null;
  for (let i = 0; i < 240; i++) {
    const s = await bootSnap(); s.t = Date.now() - t0; bootTrace.push(s); last = s;
    if (/is-failed/.test(s.classes || "")) break;
    if (/is-waiting/.test(s.classes || "")) break;
    if (s.state === "INTRO" || s.state === "MAIN_MENU") break;
    await sleep(500);
  }
  fs.writeFileSync(path.join(OUT, "boot_trace.json"), JSON.stringify(bootTrace, null, 1));
  report.boot = { last: last, ms: Date.now() - t0 };
  report.boot.registry = await page.evaluate(() => (window.DD_BOOT && window.DD_BOOT.getErrorRegistry) ? window.DD_BOOT.getErrorRegistry() : null);
  report.boot.trace = await page.evaluate(() => (window.DD_BOOT && window.DD_BOOT.getTrace) ? window.DD_BOOT.getTrace().slice(-40) : null);

  if (/is-failed/.test(last.classes || "")) {
    await shot("boot_failed_" + H + ".png");
    check("boot.real", false, "el arranque real falló en headless: " + JSON.stringify(report.boot.registry), "boot_failed_" + H + ".png");
    fs.writeFileSync(path.join(OUT, "hud_probe.json"), JSON.stringify(report, null, 1));
    await browser.close(); process.exit(2);
  }
  check("boot.real", true, "arranque completado en " + report.boot.ms + " ms sin panel de error (" + (last.state || last.classes) + "); errores registrados: " + (report.boot.registry || []).length +
        (report.boot.registry && report.boot.registry.length ? " → " + report.boot.registry.map(e => e.id + ":" + e.severity).join(", ") : ""));

  /* ---------- B. gesto real → intro → (tecla para saltar) → menú ---------- */
  if (/is-waiting/.test(last.classes || "")) {
    await shot("boot_waiting_gesture_" + H + ".png");
    await page.keyboard.press("Space");           // gesto de usuario real (Playwright inyecta entrada confiable)
  }
  let st = null;
  for (let i = 0; i < 60; i++) { st = await page.evaluate(() => window.DD_BOOT.getState().state); if (st === "INTRO" || st === "MAIN_MENU") break; await sleep(500); }
  if (st === "INTRO") {
    await sleep(1200);
    await shot("intro_running_" + H + ".png");
    await page.keyboard.press("Space");           // el jugador salta la intro con una tecla (DD_OPENING.skip tras 0,4 s)
    for (let i = 0; i < 120; i++) { st = await page.evaluate(() => window.DD_BOOT.getState().state); if (st === "MAIN_MENU") break; await sleep(500); }
  }
  check("menu.reached", st === "MAIN_MENU", "estado DD_BOOT = " + st + " a los " + (Date.now() - t0) + " ms");
  if (st !== "MAIN_MENU") { fs.writeFileSync(path.join(OUT, "hud_probe.json"), JSON.stringify(report, null, 1)); await browser.close(); process.exit(3); }
  await sleep(800);
  await shot("menu_main_" + H + ".png");

  /* ---------- C. NUEVA PARTIDA (clic real) → descenso → Refugio ---------- */
  await page.click('#dd-main-menu .dd-menu-btn[data-action="new"]');
  let hub = false, descent = null;
  for (let i = 0; i < 180; i++) {
    const r = await page.evaluate(() => {
      const hud = document.getElementById("dd-hud");
      const op = window.DD_OPENING && window.DD_OPENING.getState ? window.DD_OPENING.getState() : null;
      return { hub: !!(window.DD_HUB && window.DD_HUB.isActive && window.DD_HUB.isActive()), hudVisible: !!(hud && !hud.classList.contains("dd-hidden")), op: op ? { elapsed: op.elapsed, frozen: op.frozen, kind: op.kind || op.type || null } : null, state: window.DD_BOOT.getState().state };
    });
    descent = r;
    if (r.hub && r.hudVisible) { hub = true; break; }
    if (i === 6) await shot("descent_running_" + H + ".png");
    await sleep(500);
  }
  check("hub.reached", hub, hub ? "Refugio activo y #dd-hud visible a los " + (Date.now() - t0) + " ms" : "no se llegó al Refugio: " + JSON.stringify(descent));
  if (!hub) { fs.writeFileSync(path.join(OUT, "hud_probe.json"), JSON.stringify(report, null, 1)); await browser.close(); process.exit(4); }
  await sleep(1500);

  /* ---------- D. inspección del HUD (DOM real) ---------- */
  const rafHz = await page.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; const dt = performance.now() - t0; if (dt < 3000) requestAnimationFrame(f); else r(Math.round(n / (dt / 1000) * 10) / 10); }; requestAnimationFrame(f); }));
  report.rafHz = rafHz; console.log("   rAF en el Refugio: " + rafHz + " Hz (headless, software)");
  const hudInfo = () => page.evaluate(() => {
    const q = id => document.getElementById(id);
    const imgInfo = el => el ? { src: (el.getAttribute("src") || "").replace(/\?.*$/, ""), ok: el.complete && el.naturalWidth > 0, nat: [el.naturalWidth, el.naturalHeight], css: [Math.round(el.getBoundingClientRect().width), Math.round(el.getBoundingClientRect().height)] } : null;
    const hearts = Array.from(document.querySelectorAll("#dd-hud-hearts img"));
    const hud = q("dd-hud"); const r = hud.getBoundingClientRect();
    const portrait = q("dd-hud-portrait").getBoundingClientRect();
    const skills = q("dd-skill-bomb").getBoundingClientRect();
    return {
      hudHidden: hud.classList.contains("dd-hidden"), hudRect: { x: r.x, y: r.y, w: r.width, h: r.height },
      hearts: hearts.map(imgInfo), heartsOn: hearts.filter(h => !/opacity/.test(h.getAttribute("style") || "")).length,
      coin: imgInfo(q("dd-hud-coin-img")), shield: imgInfo(q("dd-hud-shield-img")),
      bomb: imgInfo(q("dd-skill-bomb-img")), boost: imgInfo(q("dd-skill-boost-img")), dodge: imgInfo(q("dd-skill-dodge-img")),
      bombEmpty: q("dd-skill-bomb").classList.contains("dd-empty"), boostEmpty: q("dd-skill-boost").classList.contains("dd-empty"),
      bombCnt: q("dd-skill-bomb-cnt").textContent, boostCnt: q("dd-skill-boost-cnt").textContent,
      cr: q("dd-hud-cr").textContent, nv: q("dd-hud-nv").textContent, room: q("dd-hud-room").textContent,
      shFill: q("dd-hud-sh-fill").style.width, hpFill: q("dd-hud-hp-fill").style.width,
      bossHidden: q("dd-boss-hud").classList.contains("dd-hidden"), bossName: q("dd-boss-name").textContent,
      portraitRect: { x: portrait.x, y: portrait.y, w: portrait.width, h: portrait.height }, skillsRect: { x: skills.x, y: skills.y, w: skills.width, h: skills.height },
      dpr: window.devicePixelRatio
    };
  });
  const clipTL = (info) => ({ x: 0, y: 0, width: Math.min(W, Math.round(info.hudRect.x + 560)), height: Math.min(H, Math.round(info.portraitRect.y + 190)) });
  const clipSkills = (info) => ({ x: Math.max(0, Math.round(info.skillsRect.x - 40)), y: Math.max(0, Math.round(info.skillsRect.y - 30)), width: 360, height: Math.min(H - Math.max(0, Math.round(info.skillsRect.y - 30)), 130) });

  let info = await hudInfo();
  const assetsOk = ["coin", "shield", "bomb", "boost", "dodge"].every(k => info[k] && info[k].ok && /assets\/ui\/hud_/.test(info[k].src)) && info.hearts.length > 0 && info.hearts.every(h => h.ok && /assets\/ui\/hud_heart/.test(h.src));
  check("hud.icons.t07", assetsOk, "iconos del HUD cargados desde assets/ui/hud_* (sin reserva a pickups): " + JSON.stringify({ hearts: info.hearts.length, heart0: info.hearts[0] && info.hearts[0].src, coin: info.coin && info.coin.src, shield: info.shield && info.shield.src, bomb: info.bomb && info.bomb.src, boost: info.boost && info.boost.src, dodge: info.dodge && info.dodge.src }));
  check("hud.sizes", true, "tamaños CSS: corazón " + JSON.stringify(info.hearts[0] && info.hearts[0].css) + " · moneda " + JSON.stringify(info.coin.css) + " · escudo " + JSON.stringify(info.shield.css) + " · habilidad " + JSON.stringify(info.bomb.css) + " · dpr " + info.dpr);
  let occ = await occluders(info.portraitRect.x + 10, info.portraitRect.y + 10); let occ2 = await occluders(info.skillsRect.x + 10, info.skillsRect.y + 10);
  check("hud.on_top.hub", occ.over.length === 0 && occ2.over.length === 0, "capas sobre el HUD (z≥" + occ.hudZ + ") en retrato/habilidades: " + JSON.stringify(occ.over) + " / " + JSON.stringify(occ2.over));
  await shot("hud_hub_full_" + H + ".png");
  await shot("hud_hub_topleft_" + H + ".png", clipTL(info));
  await shot("hud_hub_skills_" + H + ".png", clipSkills(info));
  check("hud.state.hub", true, "Refugio: corazones " + info.heartsOn + "/" + info.hearts.length + " · CR " + info.cr + " · " + info.nv + " · " + info.room + " · bombas " + info.bombCnt + " · boosts " + info.boostCnt, "hud_hub_topleft_" + H + ".png");

  /* ---------- E. incursión (misma función que la puerta del Refugio) ---------- */
  await page.evaluate(() => { try { window.DD_HUB.exitToRun(); } catch (e) {} });
  await sleep(1500);
  await page.evaluate(() => { try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} try { window.DD_OPENING && window.DD_OPENING.skip(); } catch (e) {} });
  let running = false;
  for (let i = 0; i < 120; i++) { running = await page.evaluate(() => !!(window.DMO && window.DMO.observe().hud && window.DMO.observe().hud.running)); if (running) break; await sleep(500); }
  check("run.reached", running, "motor en incursión (hud.running) = " + running);
  if (running) {
    const step = async (n) => { await page.evaluate((n) => { try { window.__DD_BRIDGE.testStep({ aim: -1.57 }, n); } catch (e) {} }, n || 6); await sleep(250); };
    await page.evaluate(() => { try { window.DMO.debug.holdSpawns(true); } catch (e) {} try { window.DMO.debug.killAll(); } catch (e) {} });
    await step(10); await sleep(1200);
    await page.evaluate(() => { try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} });
    await step(4);
    info = await hudInfo();
    occ = await occluders(info.portraitRect.x + 10, info.portraitRect.y + 10); occ2 = await occluders(info.skillsRect.x + 10, info.skillsRect.y + 10);
    check("hud.on_top.run", occ.over.length === 0 && occ2.over.length === 0, "incursión · capas sobre el HUD en retrato/habilidades: " + JSON.stringify(occ.over) + " / " + JSON.stringify(occ2.over));
    await shot("hud_run_normal_full_" + H + ".png");
    await shot("hud_run_normal_topleft_" + H + ".png", clipTL(info));
    check("hud.state.run.normal", true, "incursión normal: corazones " + info.heartsOn + "/" + info.hearts.length + " · hp " + info.hpFill + " · escudo " + info.shFill + " · " + info.room, "hud_run_normal_topleft_" + H + ".png");

    // créditos + daño real (wp del motor) → corazones vacíos
    await page.evaluate(() => { try { window.DMO.rogue.debug({ action: "credits", n: 1234 }); } catch (e) {} });
    for (let i = 0; i < 2; i++) { await page.evaluate(() => { try { window.DMO.rogue.debug({ action: "damage" }); } catch (e) {} }); await step(8); await sleep(400); }
    await step(6);
    info = await hudInfo();
    const damaged = info.heartsOn < info.hearts.length;
    await shot("hud_run_damage_topleft_" + H + ".png", clipTL(info));
    check("hud.state.damage", damaged, "tras 2 impactos: corazones " + info.heartsOn + "/" + info.hearts.length + " (vacíos con hud_heart_empty) · hp " + info.hpFill + " · CR " + info.cr, "hud_run_damage_topleft_" + H + ".png");

    // escudo real: el botín `shield` del motor sobre el jugador
    const sh = await page.evaluate(() => { const s = window.__DD_BRIDGE.getSnapshot(); const p = s.player || s; return window.__DD_BRIDGE.spawnPickupAt("shield", p.x, p.y); });
    await step(12); await sleep(300); await step(6);
    info = await hudInfo();
    await shot("hud_run_shield_topleft_" + H + ".png", clipTL(info));
    const shCharges = await page.evaluate(() => { const s = window.__DD_BRIDGE.getSnapshot(); return s.shield; });
    check("hud.state.shield", parseFloat(info.shFill) > 0, "botín shield (" + sh + "): cargas de escudo del motor = " + shCharges + " · barra .dd-bar-shield = " + info.shFill + " (el HUD vuelca las cargas 0–3 como % de anchura: hallazgo heredado, no se toca)", "hud_run_shield_topleft_" + H + ".png");

    // habilidades: recoger bomba y boost (contadores) y gastar la bomba con la tecla real (ESP)
    await page.evaluate(() => { const s = window.__DD_BRIDGE.getSnapshot(); const p = s.player || s; window.__DD_BRIDGE.spawnPickupAt("bomb", p.x, p.y); window.__DD_BRIDGE.spawnPickupAt("boost", p.x, p.y); });
    await step(12); await sleep(300); await step(6);
    info = await hudInfo();
    await shot("hud_run_skills_loaded_" + H + ".png", clipSkills(info));
    check("hud.state.skills.loaded", !info.bombEmpty && !info.boostEmpty, "habilidades cargadas: bombas " + info.bombCnt + " · boosts " + info.boostCnt, "hud_run_skills_loaded_" + H + ".png");
    const bombsBefore = Number(info.bombCnt);
    await page.keyboard.press("Space"); await step(10); await sleep(300);
    const afterSpace = (await hudInfo()).bombCnt;
    for (let i = 0; i < bombsBefore + 1; i++) { await page.keyboard.press("KeyQ"); await step(12); await sleep(500); }
    await step(6);
    info = await hudInfo();
    await shot("hud_run_skills_spent_" + H + ".png", clipSkills(info));
    check("hud.state.skills.spent", info.bombEmpty, "bombas " + bombsBefore + " → tras Espacio " + afterSpace + " (Espacio = esquiva zt.key) → tras " + (bombsBefore + 1) + "× tecla Q (tp) " + info.bombCnt + " · tarjeta .dd-empty=" + info.bombEmpty, "hud_run_skills_spent_" + H + ".png");

    // jefe: barra superior del residente (DMO.debug.boss, vía real del motor)
    const bossOk = await page.evaluate(() => { try { return !!window.DMO.debug.boss(); } catch (e) { return false; } });
    await step(10); await sleep(1200);
    await shot("hud_run_boss_intro_" + H + ".png");                       // presentación del residente (letterbox de DD_CINE sobre el HUD)
    for (let i = 0; i < 6; i++) { await page.evaluate(() => { try { window.DD_CINE && window.DD_CINE.skip(); } catch (e) {} }); await step(10); await sleep(400); }
    info = await hudInfo();
    const cineActive = await page.evaluate(() => { try { return !!(window.DD_CINE.getState && window.DD_CINE.getState()); } catch (e) { return null; } });
    await shot("hud_run_boss_full_" + H + ".png");
    await shot("hud_run_boss_top_" + H + ".png", { x: 0, y: 0, width: W, height: Math.min(H, 220) });
    check("hud.state.boss", bossOk && !info.bossHidden, "jefe invocado=" + bossOk + " · barra #dd-boss-hud visible=" + !info.bossHidden + " (" + info.bossName + ") · cinemática activa=" + cineActive, "hud_run_boss_top_" + H + ".png");

    // emblema de victoria (secuencia real de DD_CINE sobre el juego)
    await page.evaluate(() => { try { window.DD_CINE.playVictory("RESIDENTE DERROTADO", false); } catch (e) {} });
    await sleep(900);
    await shot("victory_emblem_" + H + ".png");
    const vic = await page.evaluate(() => { const im = window.DD_ASSETS.get("ui_victory_emblem"); const a = window.DD_CINE && window.DD_CINE.getState ? window.DD_CINE.getState() : null; return { asset: im ? { ok: im.complete && im.naturalWidth > 0, src: (im.getAttribute("src") || "").replace(/\?.*$/, ""), nat: [im.naturalWidth, im.naturalHeight] } : null, cineActive: a }; });
    check("victory.emblem", !!(vic.asset && vic.asset.ok), "secuencia victory de DD_CINE (280×210 sobre velo) · asset " + JSON.stringify(vic.asset) + " · activa=" + vic.cineActive, "victory_emblem_" + H + ".png");
    await sleep(2200);
  }

  report.finishedAt = now(); report.totalMs = Date.now() - t0; report.partial = false;
  fs.writeFileSync(path.join(OUT, "hud_probe.json"), JSON.stringify(report, null, 1));
  console.log("errores de página:", errs.length, "· total", report.totalMs, "ms");
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
