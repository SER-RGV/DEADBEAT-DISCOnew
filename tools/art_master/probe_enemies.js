#!/usr/bin/env node
/* ==========================================================================
   DEADBEAT DISCO — ART PRODUCTION MASTER · sonda de ENEMIGOS en el juego
   Uso:  node tools/art_master/probe_enemies.js <carpeta_salida>
              [--dpr=2] [--circles=1,2] [--box=190] [--colliders]
              [--url=http://127.0.0.1:8080/index.html]

   Abre el index.html real, entra en una incursión y, en cada círculo pedido,
   genera un enemigo de cada tipo del motor (dancer, sprinter, tank, speaker),
   uno élite, un minijefe y un guardián, y recorta a cada uno en primer plano
   en cada estado: caminar, aviso, ataque, impacto y muerte (tres instantes).
   El motor sortea qué enemigos nacen élite o guardián; la sonda fija esos
   papeles después de crearlos para que cada casilla enseñe siempre lo mismo.
   Además guarda, por círculo:
     <c>_frame_walk.jpg / _frame_attack.jpg   el fotograma completo (escala real
                                              contra el protagonista y la sala)
     <c>_depth.png                            tres enemigos alrededor de un prop
                                              alto: detrás, al lado y delante
                                              (orden de profundidad)

   Los estados se fijan con __DD_BRIDGE.debugPoseEnemies() y se repinta con
   __DD_BRIDGE.renderNow() dentro de la MISMA llamada al navegador: así la foto
   corresponde al estado pedido y no a lo que la IA decida un instante después.
   La familia y el estado que figuran en el informe son los que el puente
   entrega a DD_WORLD (getActors), no una suposición de la sonda.

   Círculos: el motor reparte 11 salas por círculo (nivel = (c-1)*11 + sala).
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
const OUT = path.resolve(args.find(a => !a.startsWith("--")) || "/tmp/ddqa/enemies");
const opt = (k, d) => { const a = args.find(x => x.startsWith("--" + k + "=")); return a ? a.split("=")[1] : d; };
const DPR = Number(opt("dpr", "2"));
const URL = opt("url", "http://127.0.0.1:8080/index.html");
const CIRCLES = opt("circles", "1,2").split(",").filter(Boolean).map(Number);
const BOX = Number(opt("box", "190"));
const COLLIDERS = args.includes("--colliders");
const T0 = Date.now();
fs.mkdirSync(OUT, { recursive: true });

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
  /* Recorta a cada enemigo vivo (o registro de muerte) centrado en su figura. */
  P.shootAll = function (box, what) {
    const A = window.__DD_BRIDGE.getActors();
    const list = what === "deaths" ? A.deaths : A.enemies;
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      let geo = null;
      try { geo = window.DD_WORLD.enemyGeometry({ x: e.x, y: e.y, r: e.r }, { family: e.family }); } catch (err) { geo = null; }
      const cy = geo ? (geo.footY - geo.figH * 0.5) : e.y - 20;
      out.push({ i: i, actor: e, geo: geo, png: P.crop(e.x, cy, box) });
    }
    return { time: A.time, circle: A.circle, player: A.player, shots: out };
  };
  /* Fotograma completo tal como lo ve el jugador. */
  P.full = function () {
    const cv = P.canvas();
    const oc = document.createElement("canvas");
    oc.width = 1280; oc.height = 720;
    const c2 = oc.getContext("2d");
    c2.imageSmoothingQuality = "high";
    c2.drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, 1280, 720);
    return oc.toDataURL("image/jpeg", 0.92);
  };
  window.__ddEnemyProbe = P;
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
  const report = { url: URL, dpr: DPR, box: BOX, startedAt: new Date().toISOString(), pageErrors: [], httpErrors: [], shots: [], circles: {} };
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
  await page.evaluate((col) => {
    try { window.DMO.debug.holdSpawns(true); } catch (e) {}
    try { window.DMO.debug.killAll(); } catch (e) {}
    try { if (col) window.DMO.debug.exploreColliders(true); } catch (e) {}
  }, COLLIDERS);

  const saveFull = (name, url) => {
    fs.writeFileSync(path.join(OUT, name + ".jpg"), Buffer.from(url.split(",")[1], "base64"));
    report.frames = report.frames || [];
    report.frames.push(name);
    flush();
    console.log("frame", name);
  };

  const save = (tag, state, res) => {
    for (const s of res.shots) {
      const a = s.actor;
      const kind = a.mini ? "mini" : a.elite ? "elite" : a.guardian ? "guardian" : (a.type || a.family);
      const name = [tag, state, String(s.i).padStart(2, "0"), kind, a.family].join("_");
      fs.writeFileSync(path.join(OUT, name + ".png"), Buffer.from(s.png.split(",")[1], "base64"));
      report.shots.push({ name, circle: res.circle, wanted: state, type: a.type || null, kind, family: a.family, state: a.state || null, flip: a.flip, st: a.st || null, r: a.r, figH: s.geo ? +s.geo.figH.toFixed(1) : null, t: +((Date.now() - T0) / 1000).toFixed(1) });
    }
    flush();
    console.log("shots", tag, state, res.shots.map(s => (s.actor.family + ":" + (s.actor.state || "-"))).join(" "));
  };

  for (const c of CIRCLES) {
    const level = (c - 1) * 11 + 2;
    const tag = "c" + String(c).padStart(2, "0");
    await page.evaluate((lv) => { try { return window.DMO.debug.exploreGoTo(lv); } catch (e) { return String(e); } }, level);
    await page.waitForTimeout(500);
    await page.evaluate(() => window.DD_CINE && window.DD_CINE.skip());
    await page.waitForTimeout(400);
    await page.evaluate(() => { try { window.DMO.debug.killAll(); } catch (e) {} window.__DD_BRIDGE.testStep({}, 20); });

    /* Un enemigo por tipo, repartidos a ambos lados del jugador (los de la derecha
       deben verse mirando a la izquierda). 4.º parámetro de spawnEnemyAt = élite. */
    const spawned = await page.evaluate(() => {
      try { window.DMO.debug.heal(); } catch (e) {}
      const p = window.__DD_BRIDGE.getSnapshot().player;
      const pack = [["dancer", -250, -110, false], ["sprinter", 250, -110, false], ["tank", -260, 60, false], ["speaker", 260, 60, false], ["dancer", -90, -200, true], ["tank", 100, 200, false], ["speaker", 150, -215, false]];
      const out = [];
      /* Cada sala sólo admite ciertas clases (DMO_FLOOR.filterEnemyType las remapea).
         Para fotografiar las cuatro en cualquier sala se levanta el filtro mientras
         dura el alta y se restaura después: sólo cambia QUÉ clase aparece aquí. */
      let cell = null, prevAllowed;
      try { cell = window.DMO_FLOOR.state().currentCell; } catch (e) { cell = null; }
      if (cell) { prevAllowed = cell.allowedEnemyTypes; cell.allowedEnemyTypes = null; }
      try {
        for (const [t, dx, dy, elite] of pack) { try { out.push([t, elite, !!window.DMO.debug.spawnEnemyAt(t, p.x + dx, p.y + dy, elite, false)]); } catch (e) { out.push([t, elite, String(e)]); } }
      } finally {
        if (cell) cell.allowedEnemyTypes = prevAllowed;
      }
      /* Papeles fijos (el motor sortea élites y guardianes): los no élite se dejan
         en su clase y radio base; el 6.º (tank) pasa a minijefe —para ver su escala
         y su marca— y el 7.º a guardián (tirador con aura protectora, que el motor
         viste de Seguridad).
         El minijefe NO usa `st`: su IA va por `mState` (roam → ringWind/chargeWind →
         charge). Se le deja en `roam` con 3 s por delante y en cada fase se le fija
         el `mState` equivalente (MINI). */
      const baseR = { dancer: 12, sprinter: 10, tank: 16, speaker: 12 };
      pack.forEach(([t, dx, dy, elite], i) => { if (!elite) window.__DD_BRIDGE.debugPoseEnemies(undefined, { index: i, assign: { elite: false, guardian: false, guardRadius: 0, r: baseR[t] } }); });
      window.__DD_BRIDGE.debugPoseEnemies(null, { index: 5, stT: 3, assign: { mini: true, r: 26, mState: "roam" } });
      window.__DD_BRIDGE.debugPoseEnemies(undefined, { index: 6, assign: { guardian: true, guardRadius: 180 } });
      return out;
    });
    report.circles[tag] = { level, spawned };

    // caminar (2 fotogramas de simulación: aún no han llegado al jugador)
    save(tag, "walk", await page.evaluate((b) => { window.__DD_BRIDGE.testStep({}, 2); return window.__ddEnemyProbe.shootAll(b); }, BOX));
    saveFull(tag + "_frame_walk", await page.evaluate(() => window.__ddEnemyProbe.full()));
    save(tag, "walk2", await page.evaluate((b) => { window.__DD_BRIDGE.testStep({}, 5); return window.__ddEnemyProbe.shootAll(b); }, BOX));
    // aviso, a medio llenar el aro de aviso del motor (stT = tiempo que queda)
    save(tag, "windup", await page.evaluate((b) => { window.__DD_BRIDGE.debugPoseEnemies("windup", { stT: 0.25 }); window.__DD_BRIDGE.debugPoseEnemies(null, { index: 5, stT: 0.4, assign: { mState: "chargeWind" } }); window.__DD_BRIDGE.renderNow(); return window.__ddEnemyProbe.shootAll(b); }, BOX));
    // ataque (carga / embestida; el tirador ataca en "recover")
    save(tag, "attack", await page.evaluate((b) => { window.__DD_BRIDGE.debugPoseEnemies("charge"); window.__DD_BRIDGE.debugPoseEnemies("recover", { type: "speaker" }); window.__DD_BRIDGE.debugPoseEnemies(null, { index: 5, stT: 0.3, assign: { mState: "charge" } }); window.__DD_BRIDGE.renderNow(); return window.__ddEnemyProbe.shootAll(b); }, BOX));
    saveFull(tag + "_frame_attack", await page.evaluate(() => window.__ddEnemyProbe.full()));
    // impacto
    save(tag, "hit", await page.evaluate((b) => { window.__DD_BRIDGE.debugPoseEnemies(null, { hit: true }); window.__DD_BRIDGE.debugPoseEnemies(null, { index: 5, stT: 3, hit: true, assign: { mState: "roam" } }); window.__DD_BRIDGE.renderNow(); return window.__ddEnemyProbe.shootAll(b); }, BOX));
    /* muerte: tres instantes del registro de abatidos (dura 0,6 s = 36 pasos).
       DMO.debug.killAll() sólo vacía la sala; killAllEnemies() abate por la vía
       real del motor, que es la que deja registro de muerte. Los tres instantes se
       toman en UNA llamada: entre llamadas el juego sigue corriendo en tiempo real
       y el registro caduca. */
    const deaths = await page.evaluate((b) => {
      const B = window.__DD_BRIDGE, P = window.__ddEnemyProbe;
      B.debugPoseEnemies(null, {});
      B.killAllEnemies();
      const out = {};
      B.testStep({}, 3); out.death_a = P.shootAll(b, "deaths");
      B.testStep({}, 13); out.death_b = P.shootAll(b, "deaths");
      B.testStep({}, 12); out.death_c = P.shootAll(b, "deaths");
      return out;
    }, BOX);
    for (const k of ["death_a", "death_b", "death_c"]) save(tag, k, deaths[k]);
    await page.evaluate(() => window.__DD_BRIDGE.testStep({}, 40));

    /* Orden de profundidad: tres enemigos alrededor del prop alto más cercano. */
    const depth = await page.evaluate(() => {
      const B = window.__DD_BRIDGE;
      try { window.DMO.debug.killAll(); } catch (e) {}
      try { window.DMO.debug.heal(); } catch (e) {}
      const p = B.getSnapshot().player;
      const props = B.getProps().filter(q => q.tall && q.solid && q.br > 10 && q.br < 60)
        .map(q => Object.assign({ d: Math.hypot(q.x - p.x, q.y - p.y) }, q))
        .filter(q => q.d > 110 && Math.abs(q.x - p.x) < 470 && Math.abs(q.y - p.y) < 230)   // dentro del encuadre
        .sort((a, b) => a.d - b.d);
      if (!props.length) return { skipped: "sin prop alto cerca", props: B.getProps().length };
      const q = props[0];
      const spots = [["detras", 6, -(q.br + 16)], ["al_lado", -(q.br + 18), q.br * 0.45], ["delante", -4, q.br + 20]];
      const placed = [];
      for (const [label, dx, dy] of spots) {
        let ok = false;
        try { ok = !!window.DMO.debug.spawnEnemyAt("dancer", q.x + dx, q.y + dy, false, false); } catch (e) { ok = String(e); }
        placed.push({ label, want: [Math.round(q.x + dx), Math.round(q.y + dy)], ok });
      }
      B.testStep({}, 1);
      const A = B.getActors();
      return {
        prop: q,
        placed,
        enemies: A.enemies.map(e => ({ x: Math.round(e.x), y: Math.round(e.y), r: e.r, feetY: Math.round(e.y + 0.65 * e.r), family: e.family })),
        png: window.__ddEnemyProbe.crop(q.x, q.y - 30, 300)
      };
    });
    if (depth && depth.png) {
      fs.writeFileSync(path.join(OUT, tag + "_depth.png"), Buffer.from(depth.png.split(",")[1], "base64"));
      delete depth.png;
    }
    report.circles[tag].depth = depth;
    flush();
    console.log("depth", tag, JSON.stringify(depth).slice(0, 400));
    await page.evaluate(() => { try { window.DMO.debug.killAll(); } catch (e) {} window.__DD_BRIDGE.testStep({}, 10); });
  }

  report.finishedAt = new Date().toISOString();
  report.elapsedS = +((Date.now() - T0) / 1000).toFixed(1);
  flush();
  console.log(JSON.stringify({ shots: report.shots.length, pageErrors: report.pageErrors, httpErrors: report.httpErrors.slice(0, 5), elapsedS: report.elapsedS }));
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
