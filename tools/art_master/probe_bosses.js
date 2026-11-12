#!/usr/bin/env node
/* ==========================================================================
   DEADBEAT DISCO — ART PRODUCTION MASTER · sonda de JEFES en el juego
   Uso:  node tools/art_master/probe_bosses.js <carpeta_salida>
              [--bosses=1,2,…,11] [--box=300] [--dpr=2] [--pass=full|intro]
              [--url=http://127.0.0.1:8080/index.html]

   Abre el index.html real, entra en una incursión y, por cada jefe pedido, va a
   su sala (el motor reparte 11 salas por círculo: el residente del círculo c
   espera en el nivel c·11; el Núcleo, en el 100), lo invoca por la vía del motor
   (DMO.debug.boss(); el Arquitecto, con DMO.secretBoss.startEncounter()) y lo
   recorta en primer plano en cada estado:

     entrance     a mitad de la aparición (el motor lo funde y lo escala)
     idle_r/_l    en reposo, a la izquierda y a la derecha del protagonista
                  (debe mirarlo siempre: el arte mira a la derecha y se refleja)
     walk         persiguiendo (balanceo)
     attack       aviso de un patrón iniciado por el motor (DMO.debug.pattern)
     recover      ventana expuesta tras disparar (aro cian del motor)
     hit          destello de impacto
     sweep_warn / sweep_fire   barrido: sector de aviso y rayo
     adds / frozen / berserk / lowhp   resto de señales de juego
     depth_behind / depth_front        orden de profundidad contra el protagonista
     death_a/b/c  tres instantes del registro de muerte (1 s)
   y guarda el fotograma completo en reposo, en ataque y con el patrón disparado.

   Los estados se fijan con __DD_BRIDGE.debugPoseBoss() y se repinta con
   renderNow() dentro de la MISMA llamada al navegador. El jefe, la vista de arte
   y el estado que figuran en el informe son los que el puente entrega a DD_WORLD
   (__DD_BRIDGE.getBoss()), no una suposición de la sonda.

   Con un HTML anterior a R03 (sin getBoss / debugPoseBoss) la sonda hace una
   pasada reducida — reposo, patrón y fotograma completo — que sirve de «antes».

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
const OUT = path.resolve(args.find(a => !a.startsWith("--")) || "/tmp/ddqa/bosses");
const opt = (k, d) => { const a = args.find(x => x.startsWith("--" + k + "=")); return a ? a.split("=")[1] : d; };
const DPR = Number(opt("dpr", "2"));
const URL = opt("url", "http://127.0.0.1:8080/index.html");
const BOSSES = opt("bosses", "1,2,3,4,5,6,7,8,9,10,11").split(",").filter(Boolean).map(Number);
const BOX = Number(opt("box", "300"));
const PASS = opt("pass", "full");          // full | intro (sólo presentación, aparición y reposo)
const T0 = Date.now();
fs.mkdirSync(OUT, { recursive: true });

const SLUGS = ["", "boss_00_anden", "boss_01_magneta", "boss_02_bufe", "boss_03_cajero", "boss_04_pogo", "boss_05_oficiante",
  "boss_06_matarife", "boss_07_imitador", "boss_08_traidor", "boss_09_nucleo", "boss_10_arquitecto"];

/* Se instala en la página. */
function installProbe() {
  const P = {};
  P.canvas = function () {
    return Array.from(document.querySelectorAll("canvas"))
      .filter(c => c.getBoundingClientRect().width > 0)
      .sort((a, b) => b.width * b.height - a.width * a.height)[0];
  };
  P.toScreen = function (wx, wy) {
    const cam = window.DMO.camera();
    const z = cam.applied || cam.zoom || 1;
    return { x: 640 + (wx - cam.x) * z, y: 360 + (wy - cam.y) * z, z: z };
  };
  P.crop = function (wx, wy, box) {
    const s = P.toScreen(wx, wy);
    const cv = P.canvas();
    const r = cv.getBoundingClientRect();
    const k = cv.width / r.width;
    const oc = document.createElement("canvas");
    oc.width = Math.round(box * k); oc.height = Math.round(box * k);
    const c2 = oc.getContext("2d");
    c2.fillStyle = "#000"; c2.fillRect(0, 0, oc.width, oc.height);
    c2.drawImage(cv, (s.x - box / 2 - r.left) * k, (s.y - box / 2 - r.top) * k, box * k, box * k, 0, 0, oc.width, oc.height);
    return oc.toDataURL("image/png");
  };
  P.full = function () {
    const cv = P.canvas();
    const oc = document.createElement("canvas");
    oc.width = 1280; oc.height = 720;
    const c2 = oc.getContext("2d");
    c2.imageSmoothingQuality = "high";
    c2.drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, 1280, 720);
    return oc.toDataURL("image/jpeg", 0.92);
  };
  /* Lo que hay que saber del jefe (o de su registro de muerte) y su recorte. */
  P.shoot = function (box, what) {
    const B = window.__DD_BRIDGE;
    const hasHook = typeof B.getBoss === "function";
    let info = null, cx = 0, cy = 0;
    if (hasHook) {
      info = B.getBoss();
      const src = what === "death" ? (info.deaths && info.deaths[info.deaths.length - 1]) : (info.active ? info : null);
      if (!src) return { info: info, png: null };
      const figH = src.figH || 190;
      const footY = src.footY != null ? src.footY : src.y + 0.8 * (src.r || 34);
      cx = src.x; cy = footY - figH * 0.5;
    } else {
      const s = B.getSnapshot();
      if (!s.boss) return { info: { active: false, legacy: true }, png: null };
      info = { active: true, legacy: true, x: s.boss.x, y: s.boss.y, name: s.boss.name, hp: s.boss.hp, maxHp: s.boss.maxHp };
      cx = s.boss.x; cy = s.boss.y + 27 - 95;
    }
    return { info: info, png: P.crop(cx, cy, box) };
  };
  window.__ddBossProbe = P;
}

(async () => {
  const sparticuz = (await import("file:///tmp/browser/node_modules/@sparticuz/chromium/build/index.js")).default;
  const browser = await pw.launch({
    executablePath: "/tmp/chromium",
    args: [...sparticuz.args.filter(a => !a.startsWith("--headless") && !a.startsWith("--window-size")), "--no-sandbox"],
    headless: true
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: DPR });
  const page = await ctx.newPage();
  const report = { url: URL, dpr: DPR, box: BOX, startedAt: new Date().toISOString(), pageErrors: [], httpErrors: [], shots: [], frames: [], bosses: {} };
  page.on("pageerror", e => report.pageErrors.push(String(e.message).slice(0, 300)));
  page.on("response", r => { if (r.status() >= 400) report.httpErrors.push(r.status() + " " + r.url()); });
  const flush = () => fs.writeFileSync(path.join(OUT, "probe_report.json"), JSON.stringify(report, null, 1));

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => window.DD_ASSETS && (() => { const s = window.DD_ASSETS.stats(); return s.loaded + s.errors >= s.registered; })(), { timeout: 60000 });
  await page.waitForTimeout(500);
  report.assets = await page.evaluate(() => window.DD_ASSETS.stats());
  await page.evaluate(installProbe);
  await page.evaluate(() => window.DD_CINE && window.DD_CINE.skip());
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.DD_HUB.exitToRun());
  await page.waitForTimeout(500);
  await page.evaluate(() => window.DD_CINE && window.DD_CINE.skip());
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    try { window.DMO.debug.holdSpawns(true); } catch (e) {}
    try { window.DMO.debug.killAll(); } catch (e) {}
  });
  report.hooks = await page.evaluate(() => ({ getBoss: typeof window.__DD_BRIDGE.getBoss === "function", debugPoseBoss: typeof window.__DD_BRIDGE.debugPoseBoss === "function", killBoss: typeof window.__DD_BRIDGE.killBoss === "function" }));
  const FULL = report.hooks.getBoss && report.hooks.debugPoseBoss;
  console.log("hooks", JSON.stringify(report.hooks), !FULL ? "· pasada reducida (HTML anterior a R03)" : PASS === "intro" ? "· pasada intro (presentación, aparición y reposo)" : "· pasada completa");

  const saveFull = (name, url) => {
    fs.writeFileSync(path.join(OUT, name + ".jpg"), Buffer.from(url.split(",")[1], "base64"));
    report.frames.push(name);
    flush();
  };
  const save = (tag, state, res) => {
    const name = tag + "_" + state;
    const i = res.info || {};
    const v = i.view || {};
    const src = state.startsWith("death") ? ((i.deaths && i.deaths[i.deaths.length - 1]) || {}) : i;
    const rec = { name, wanted: state, ok: !!res.png, slug: v.slug || src.slug || null, state: v.state || null, flip: v.flip != null ? v.flip : (src.flip != null ? src.flip : null),
      frame: i.frame || src.frame || null, dedicated: i.dedicated != null ? i.dedicated : (src.dedicated != null ? src.dedicated : null),
      engineState: i.engineState || null, phase: i.phase || null, pattern: i.pattern || null, figH: src.figH != null ? +Number(src.figH).toFixed(1) : null,
      r: src.r || null, hp: i.hp != null ? Math.round(i.hp) : null, maxHp: i.maxHp != null ? Math.round(i.maxHp) : null, t: +((Date.now() - T0) / 1000).toFixed(1) };
    if (res.png) fs.writeFileSync(path.join(OUT, name + ".png"), Buffer.from(res.png.split(",")[1], "base64"));
    report.shots.push(rec);
    flush();
    return rec;
  };

  for (const n of BOSSES) {
    const tag = "b" + String(n).padStart(2, "0") + "_" + (SLUGS[n] || "boss").replace(/^boss_\d\d_/, "");
    const level = n <= 9 ? n * 11 : 100;
    await page.evaluate((lv) => { try { return window.DMO.debug.exploreGoTo(lv); } catch (e) { return String(e); } }, level);
    await page.waitForTimeout(500);
    await page.evaluate(() => window.DD_CINE && window.DD_CINE.skip());
    await page.waitForTimeout(400);
    const spawn = await page.evaluate((secret) => {
      const B = window.__DD_BRIDGE;
      try { window.DMO.debug.holdSpawns(true); } catch (e) {}
      try { window.DMO.debug.killAll(); } catch (e) {}
      try { window.DMO.debug.heal(); } catch (e) {}
      B.testStep({}, 12);
      let how = "ya estaba";
      if (secret) {
        try { window.DMO.secretBoss.unlockAllSeals(); } catch (e) {}
        try { window.DMO.secretBoss.startEncounter(); how = "DMO.secretBoss.startEncounter()"; } catch (e) { how = "error: " + e; }
      } else if (!B.getSnapshot().bossActive) {
        try { window.DMO.debug.boss(); how = "DMO.debug.boss()"; } catch (e) { how = "error: " + e; }
      }
      const s = B.getSnapshot();
      return { how: how, active: s.bossActive, boss: s.boss, circle: s.circle, level: s.globalRoom, room: s.roomBanner };
    }, n === 11);
    report.bosses[tag] = { n, level, spawn };
    console.log(tag, JSON.stringify(spawn));
    if (!spawn.active) { flush(); continue; }

    if (!FULL) {
      // Pasada reducida («antes»): sólo lo que permite el HTML anterior.
      const a = await page.evaluate((b) => { try { window.DMO.debug.heal(); } catch (e) {} window.__DD_BRIDGE.testStep({}, 95); return { s: window.__ddBossProbe.shoot(b), full: window.__ddBossProbe.full() }; }, BOX);
      save(tag, "idle", a.s); saveFull(tag + "_frame_idle", a.full);
      const c = await page.evaluate((b) => {
        let started = null;
        try { started = window.DMO.debug.pattern("fan"); } catch (e) { started = "error: " + e; }
        window.__DD_BRIDGE.testStep({}, 8);
        return { started: started, s: window.__ddBossProbe.shoot(b), full: window.__ddBossProbe.full() };
      }, BOX);
      report.bosses[tag].pattern = c.started;
      save(tag, "attack", c.s); saveFull(tag + "_frame_attack", c.full);
      await page.evaluate(() => { try { window.DMO.debug.heal(); } catch (e) {} });
      continue;
    }

    /* ---------- Pasada completa ----------
       Cada llamada al navegador cuesta segundos (el juego sigue pintando a DPR 2 sin
       GPU), así que los estados se agrupan: dentro de una llamada todo es síncrono
       (fijar estado → repintar → recortar) y la foto corresponde al estado pedido. */
    const still = { entrance: 0, pattern71: "", patternWarn71: 0, exposedT: 0, hitFlash: 0, freezeTimer: 0, addsAlive: 0, sweep: null, phase: "ranged", phaseTimer: 9, attackTimer: 9, _ddaAttackT: 0, berserk: false, addTimer: 99 };

    // 1) presentación de DD_CINE (retrato y rótulo), aparición y reposo a ambos lados
    const g1 = await page.evaluate(([b, st]) => {
      const B = window.__DD_BRIDGE, P = window.__ddBossProbe, C = window.DD_CINE;
      const out = {};
      B.renderNow();                                    // el primer fotograma con jefe dispara la presentación
      for (let i = 0; i < 20; i++) { try { C.update(0.05, B.getSnapshot()); } catch (e) {} }
      B.renderNow();
      out.intro = P.full();
      try { out.cine = C.getState(); } catch (e) { out.cine = null; }
      try { C.skip(); } catch (e) {}
      for (let i = 0; i < 40; i++) { try { C.update(0.05, B.getSnapshot()); } catch (e) {} }   // la cámara vuelve a su sitio
      B.debugPoseBoss({ entrance: 0.62 }); B.renderNow();
      out.entrance = P.shoot(b);
      const p = B.getSnapshot().player;
      B.debugPoseBoss(Object.assign({}, st, { x: p.x - 210, y: p.y - 12 })); B.renderNow();
      out.idle_r = P.shoot(b); out.frame_idle = P.full();
      B.debugPoseBoss(Object.assign({}, st, { x: p.x + 210, y: p.y - 12 })); B.renderNow();
      out.idle_l = P.shoot(b);
      return out;
    }, [BOX, still]);
    report.bosses[tag].cine = g1.cine;
    saveFull(tag + "_frame_intro", g1.intro);
    saveFull(tag + "_frame_idle", g1.frame_idle);
    for (const k of ["entrance", "idle_r", "idle_l"]) save(tag, k, g1[k]);
    if (PASS === "intro") {
      const sh0 = report.shots.filter(s => s.name.startsWith(tag + "_"));
      console.log("  shots", sh0.length, "(pasada intro)");
      continue;
    }

    // 2) persecución y ataque: el patrón lo inicia el motor (aviso), se dispara y deja al jefe expuesto
    const g2 = await page.evaluate(([b, st]) => {
      const B = window.__DD_BRIDGE, P = window.__ddBossProbe; const p = B.getSnapshot().player;
      const out = {};
      try { window.DMO.debug.heal(); } catch (e) {}
      B.debugPoseBoss(Object.assign({}, st, { x: p.x - 300, y: p.y - 12, phase: "chase" }));
      B.testStep({}, 9);
      out.walk = P.shoot(b);
      B.debugPoseBoss(Object.assign({}, st, { x: p.x - 230, y: p.y - 12 }));
      let started = null;
      try { started = window.DMO.debug.pattern("fan"); } catch (e) { started = "error: " + e; }
      if (!started) B.debugPoseBoss({ pattern71: "fan", patternWarn71: 0.6 });
      out.started = started;
      B.renderNow();
      out.attack = P.shoot(b); out.frame_attack = P.full();
      let steps = 0, info = B.getBoss();
      while (steps < 150 && info.active && info.pattern) { B.testStep({}, 3); steps += 3; info = B.getBoss(); }
      out.steps = steps;
      out.bullets = (B.getActors().enemyBullets || []).length;
      out.recover = P.shoot(b); out.frame_fired = P.full();
      try { window.DMO.debug.heal(); } catch (e) {}
      return out;
    }, [BOX, still]);
    report.bosses[tag].pattern = g2.started;
    report.bosses[tag].fired = { steps: g2.steps, bullets: g2.bullets };
    saveFull(tag + "_frame_attack", g2.frame_attack);
    saveFull(tag + "_frame_fired", g2.frame_fired);
    for (const k of ["walk", "attack", "recover"]) save(tag, k, g2[k]);

    // 3) resto de señales de juego y orden de profundidad contra el protagonista
    const poses = [
      ["hit", { hitFlash: 0.12 }],
      ["sweep_warn", { phase: "sweep", phaseTimer: 2.7, sweep: { a0: 0.5, dir: 1, arc: 2.4, t: 0.45, warn: 0.9, fire: 1.4, hitP: true } }],
      ["sweep_fire", { phase: "sweep", phaseTimer: 2.7, sweep: { a0: 0.5, dir: 1, arc: 2.4, t: 1.5, warn: 0.9, fire: 1.4, hitP: true } }],
      ["adds", { addsAlive: 2 }],
      ["frozen", { freezeTimer: 2 }],
      ["berserk", { berserk: true, phase: "berserk" }],
      ["lowhp", { hpPct: 0.3 }],
      ["depth_behind", { dx: 34, dy: -34 }],
      ["depth_front", { dx: 34, dy: 16 }]
    ];
    const g3 = await page.evaluate(([b, st, list]) => {
      const B = window.__DD_BRIDGE, P = window.__ddBossProbe; const p = B.getSnapshot().player;
      const out = {};
      for (const [nm, ps] of list) {
        const o = Object.assign({}, st, { x: p.x - 230, y: p.y - 12 }, ps);
        if (ps.dx != null) { o.x = p.x + ps.dx; o.y = p.y + ps.dy; delete o.dx; delete o.dy; }
        if (ps.hpPct != null) { const i = B.getBoss(); o.hp = i.maxHp * ps.hpPct; delete o.hpPct; }
        B.debugPoseBoss(o);
        B.renderNow();
        out[nm] = P.shoot(b);
        if (nm === "sweep_fire") out.frame_sweep = P.full();
      }
      return out;
    }, [BOX, still, poses]);
    saveFull(tag + "_frame_sweep", g3.frame_sweep);
    for (const [nm] of poses) save(tag, nm, g3[nm]);

    /* 4) muerte: por la vía real del motor (Ep → registro de muerte). Los tres
       instantes van en la misma llamada: el registro dura 1 s.
       El motor abre la elección de fin de ronda («VARÍA TU DISPARO») en el paso
       siguiente a la muerte del último enemigo y congela la simulación hasta que el
       jugador elige: `frozen` es lo que queda en pantalla detrás del panel; después
       la sonda elige como lo haría el jugador (pulsa una opción) y sigue. */
    const deaths = await page.evaluate(([b, st]) => {
      const B = window.__DD_BRIDGE, P = window.__ddBossProbe; const p = B.getSnapshot().player;
      const i = B.getBoss();
      B.debugPoseBoss(Object.assign({}, st, { x: p.x - 230, y: p.y - 12, hp: i.maxHp }));
      const killed = B.killBoss();
      const out = { killed: killed, choice: null };
      const age = () => { const d = B.getBoss().deaths; return d.length ? +Number(d[d.length - 1].age).toFixed(3) : null; };
      B.testStep({}, 2);
      const ov = document.getElementById("shot-choice-overlay");
      if (ov && ov.classList.contains("visible")) {
        out.death_frozen = P.shoot(b, "death"); out.frozenAge = age();
        const btns = Array.from(ov.querySelectorAll("button"));
        if (btns.length) { out.choice = (btns[btns.length - 1].textContent || "").replace(/\s+/g, " ").trim().slice(0, 60); btns[btns.length - 1].click(); }
      }
      B.testStep({}, 4); out.death_a = P.shoot(b, "death"); out.ageA = age();
      B.testStep({}, 22); out.death_b = P.shoot(b, "death"); out.ageB = age();
      B.testStep({}, 20); out.death_c = P.shoot(b, "death"); out.ageC = age();
      B.testStep({}, 40);
      out.left = B.getBoss().deaths.length;
      try { window.DMO.debug.heal(); } catch (e) {}
      B.testStep({}, 30);
      return out;
    }, [BOX, still]);
    report.bosses[tag].killed = deaths.killed;
    report.bosses[tag].death = { choice: deaths.choice, frozenAge: deaths.frozenAge != null ? deaths.frozenAge : null, ages: [deaths.ageA, deaths.ageB, deaths.ageC], recordsLeft: deaths.left };
    if (deaths.death_frozen) save(tag, "death_frozen", deaths.death_frozen);
    for (const k of ["death_a", "death_b", "death_c"]) save(tag, k, deaths[k]);
    const sh = report.shots.filter(s => s.name.startsWith(tag + "_"));
    console.log("  shots", sh.length, sh.map(s => s.wanted + ":" + (s.state || "-") + (s.frame ? "[" + String(s.frame).replace(/^boss_\d\d_[a-z]+_/, "") + "]" : "")).join(" "));
  }

  report.assetsEnd = await page.evaluate(() => window.DD_ASSETS.stats());
  report.finishedAt = new Date().toISOString();
  report.elapsedS = +((Date.now() - T0) / 1000).toFixed(1);
  flush();
  console.log(JSON.stringify({ shots: report.shots.length, frames: report.frames.length, pageErrors: report.pageErrors, httpErrors: report.httpErrors.slice(0, 5), elapsedS: report.elapsedS }));
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
